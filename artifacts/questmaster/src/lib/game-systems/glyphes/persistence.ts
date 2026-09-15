// Persistance serveur de l'état de combat Glyphes (jetons + confrontation).
// Le temps réel reste porté par le canal de la campagne ; cette couche sert de
// mémoire durable : rechargement, changement d'appareil, reprise de session.

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

/** Enregistre une partie de l'état (upsert sur la campagne). */
export async function saveGlyphesState(
  campaignId: string,
  patch: Partial<GlyphesPersistedState>,
): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();
    await (supabase as any)
      .from(TABLE)
      .upsert(
        {
          campaign_id: campaignId,
          ...patch,
          updated_by: user?.user?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "campaign_id" },
      );
  } catch {
    /* non bloquant : le temps réel continue de fonctionner */
  }
}

/** Fabrique un enregistreur différé (évite d'écrire à chaque clic). */
export function createDebouncedSaver(delayMs = 800) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: Partial<GlyphesPersistedState> = {};
  return (campaignId: string, patch: Partial<GlyphesPersistedState>) => {
    pending = { ...pending, ...patch };
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const payload = pending;
      pending = {};
      timer = null;
      void saveGlyphesState(campaignId, payload);
    }, delayMs);
  };
}
