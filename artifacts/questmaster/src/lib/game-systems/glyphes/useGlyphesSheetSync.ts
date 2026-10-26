// Sheet counters are hydrated before editing; only session-local edits are saved.
import { useEffect, useLayoutEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applySheetEdits } from "./sheetSync";
import type { useGlyphesCombat } from "./useGlyphesCombat";

interface LinkedToken { id: string; creatureType?: string; creatureId?: string }
type CombatController = ReturnType<typeof useGlyphesCombat>;
const DEBOUNCE_MS = 600;

export function useGlyphesSheetSync(
  enabled: boolean,
  tokens: LinkedToken[],
  combat: CombatController,
  canWrite: (token: LinkedToken) => boolean,
) {
  const current = useRef({ tokens, combat, canWrite });
  current.current = { tokens, combat, canWrite };
  const scope = useRef(0);
  const linkedKey = tokens.filter(t => t.creatureType === "character" && t.creatureId).map(t => `${t.id}:${t.creatureId}`).sort().join(",");

  useLayoutEffect(() => {
    combat.configureLinked(enabled ? tokens.filter(t => t.creatureType === "character" && t.creatureId).map(t => t.id) : []);
  }, [enabled, linkedKey, combat.configureLinked]);

  useEffect(() => {
    if (!enabled) return;
    const generation = ++scope.current;
    let cancelled = false;
    let running = false;
    const refresh = async () => {
      if (running || cancelled) return;
      running = true;
      try {
        const groups = new Map<string, LinkedToken[]>();
        for (const token of current.current.tokens) {
          if (token.creatureType !== "character" || !token.creatureId) continue;
          groups.set(token.creatureId, [...(groups.get(token.creatureId) ?? []), token]);
        }
        if (groups.size === 0) return;
        // One request for every linked sheet instead of one per character.
        const { data: rows, error: readError } = await supabase.from("characters").select("id, system, system_data, updated_at").in("id", [...groups.keys()]);
        if (readError || cancelled || generation !== scope.current) return;
        const byId = new Map((rows ?? []).map(row => [row.id, row]));
        for (const [characterId, linked] of groups) {
          if (cancelled || generation !== scope.current) return;
          const data = byId.get(characterId);
          if (!data || data.system !== "Glyphes") continue;
          let sheet = data.system_data as Record<string, any> | null;
          let version = data.updated_at;
          for (const token of linked) {
            const live = current.current;
            if (!live.tokens.some(t => t.id === token.id && t.creatureId === characterId)) continue;
            live.combat.acceptSheet(token.id, sheet);
            if (!live.canWrite(token)) continue;
            const edits = live.combat.getPending(token.id);
            if (Object.keys(edits).length === 0) continue;
            const patch = applySheetEdits(sheet, edits);
            if (!patch) { live.combat.acknowledge(token.id, edits); continue; }
            // Compare-and-set: concurrent sheet edits require a fresh read, never an overwrite.
            let query = supabase.from("characters").update({ system_data: patch as any }).eq("id", characterId).eq("updated_at", version);
            query = sheet === null ? query.is("system_data", null) : query.eq("system_data", JSON.stringify(sheet));
            const result = await query.select("system_data, updated_at").maybeSingle();
            if (cancelled || generation !== scope.current) return;
            if (result.error || !result.data) break; // Pending revisions remain for retry.
            sheet = result.data.system_data as Record<string, any>;
            version = result.data.updated_at;
            live.combat.acknowledge(token.id, edits);
            // Re-read after a CAS race or a newer local revision on the next pass.
          }
          for (const token of linked) current.current.combat.acceptSheet(token.id, sheet);
        }
      } catch {
        // Keep pending revisions intact; a later refresh retries network failures.
      } finally { running = false; }
    };
    // State changes only need a sheet round-trip when this tab holds unsaved
    // sheet edits; reading other players' changes is the poll's job.
    const onEdits = () => {
      const live = current.current;
      if (live.tokens.some(t => Object.keys(live.combat.getPending(t.id)).length > 0)) void refresh();
    };
    window.addEventListener("glyphes-sheet-edits", onEdits);
    const timer = window.setTimeout(() => { void refresh(); }, DEBOUNCE_MS);
    // Also imports edits from other sheets/devices and retries failed writes.
    const poll = window.setInterval(() => { if (!document.hidden) void refresh(); }, 5000);
    return () => { cancelled = true; ++scope.current; window.clearTimeout(timer); window.clearInterval(poll); window.removeEventListener("glyphes-sheet-edits", onEdits); };
  }, [enabled, linkedKey, combat.configureLinked]);

  // Schedule changed local revisions without cancelling an in-flight save.
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      // The periodic worker will retry; trigger it promptly via a session-local event.
      window.dispatchEvent(new Event("glyphes-sheet-edits"));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, combat.states]);
}
