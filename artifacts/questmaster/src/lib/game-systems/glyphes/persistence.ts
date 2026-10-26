// Persistance serveur de l'état de combat Glyphes (jetons + confrontation).
// Le temps réel reste porté par le canal de la campagne ; cette couche sert de
// mémoire durable : rechargement, changement d'appareil, reprise de session.
//
// Token states are merged per token on the server: a client only writes the
// tokens it changed itself, so it can never overwrite another player's token
// with an older copy. Failed writes are retried with backoff.

import { supabase } from "@/integrations/supabase/client";

const TABLE = "glyphes_combat_state";

export interface GlyphesPersistedState {
  tokens: Record<string, unknown>;
  confrontation: unknown | null;
}

/** Lit l'état enregistré pour une campagne (null si aucun ou si l'accès échoue). */
export async function loadGlyphesState(campaignId: string): Promise<GlyphesPersistedState | null> {
  try {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select("tokens, confrontation")
      .eq("campaign_id", campaignId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      tokens: (data.tokens as Record<string, unknown>) ?? {},
      confrontation: data.confrontation ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Enregistre une partie de l'état. `tokens` est fusionné jeton par jeton ;
 * `confrontation` remplace la confrontation. Lève une erreur si le serveur
 * n'a pas confirmé l'enregistrement.
 */
export async function saveGlyphesState(
  campaignId: string,
  patch: Partial<GlyphesPersistedState>,
): Promise<void> {
  if (patch.tokens && Object.keys(patch.tokens).length > 0) {
    const { error } = await (supabase.rpc as any)("merge_glyphes_tokens", {
      _campaign_id: campaignId,
      _tokens: patch.tokens,
    });
    if (error) throw error;
  }
  if ("confrontation" in patch) {
    const { data: auth } = await supabase.auth.getSession();
    const { error } = await (supabase as any)
      .from(TABLE)
      .upsert(
        {
          campaign_id: campaignId,
          confrontation: patch.confrontation ?? null,
          updated_by: auth.session?.user?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "campaign_id" },
      );
    if (error) throw error;
  }
}

/** Fabrique un enregistreur différé (évite d'écrire à chaque clic), avec nouvel essai. */
export function createDebouncedSaver(delayMs = 800) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let failures = 0;
  const pending = new Map<string, Partial<GlyphesPersistedState>>();

  const merge = (campaignId: string, patch: Partial<GlyphesPersistedState>) => {
    const current = pending.get(campaignId) ?? {};
    const next: Partial<GlyphesPersistedState> = { ...current };
    if (patch.tokens) next.tokens = { ...(current.tokens ?? {}), ...patch.tokens };
    if ("confrontation" in patch) next.confrontation = patch.confrontation;
    pending.set(campaignId, next);
  };

  const run = async () => {
    timer = null;
    const batch = [...pending.entries()];
    pending.clear();
    for (const [campaignId, payload] of batch) {
      try {
        await saveGlyphesState(campaignId, payload);
        failures = 0;
      } catch (error) {
        // Keep the unsaved data; newer local changes queued meanwhile win.
        const newer = pending.get(campaignId);
        pending.set(campaignId, payload);
        if (newer) merge(campaignId, newer);
        failures = Math.min(failures + 1, 5);
        console.warn("[Glyphes] Enregistrement différé (nouvel essai):", error);
      }
    }
    if (pending.size > 0 && !timer) timer = setTimeout(run, Math.min(1000 * 2 ** failures, 30_000));
  };

  return (campaignId: string, patch: Partial<GlyphesPersistedState>) => {
    merge(campaignId, patch);
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, delayMs);
  };
}
