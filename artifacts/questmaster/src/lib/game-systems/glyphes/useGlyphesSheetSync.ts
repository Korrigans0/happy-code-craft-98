// Writes tabletop Glyphes combat state into linked character sheets (debounced).
// Only clients allowed to act on the token write; RLS still guards the update.

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { diffSystemData, type CombatSnapshot } from "./sheetSync";

interface LinkedToken { id: string; creatureType?: string; creatureId?: string }

const DEBOUNCE_MS = 600;

export function useGlyphesSheetSync(
  enabled: boolean,
  tokens: LinkedToken[],
  states: Record<string, CombatSnapshot>,
  canWrite: (token: LinkedToken) => boolean,
) {
  const lastSent = useRef<Record<string, string>>({});
  const canWriteRef = useRef(canWrite);
  canWriteRef.current = canWrite;

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      for (const token of tokens) {
        if (token.creatureType !== "character" || !token.creatureId) continue;
        const state = states[token.id];
        if (!state || !canWriteRef.current(token)) continue;
        const signature = JSON.stringify(state);
        if (lastSent.current[token.creatureId] === signature) continue;
        lastSent.current[token.creatureId] = signature;
        const characterId = token.creatureId;
        void (async () => {
          const { data } = await supabase.from("characters").select("system_data").eq("id", characterId).maybeSingle();
          if (!data) return;
          const patch = diffSystemData(data.system_data as Record<string, any>, state);
          if (patch) await supabase.from("characters").update({ system_data: patch as any }).eq("id", characterId);
        })();
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, tokens, states]);
}
