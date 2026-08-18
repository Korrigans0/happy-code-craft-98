// useCosmetics — lecture/écriture des préférences visuelles de l'utilisateur.
//
// Application immédiate côté client (localStorage) puis persistance en base
// pour retrouver son style sur toutes les machines.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  applyCosmetics, COSMETICS_STORAGE_KEY, Cosmetics, DEFAULT_COSMETICS, readLocalCosmetics,
} from "@/lib/cosmetics";

export function useCosmetics() {
  const { user } = useAuth();
  const [cosmetics, setCosmetics] = useState<Cosmetics>(() => readLocalCosmetics());
  const [loading, setLoading] = useState(false);

  // Application immédiate à chaque changement
  useEffect(() => {
    applyCosmetics(cosmetics);
    try { localStorage.setItem(COSMETICS_STORAGE_KEY, JSON.stringify(cosmetics)); } catch { /* stockage indisponible */ }
  }, [cosmetics]);

  // Hydratation depuis la base
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await (supabase as any)
        .from("user_cosmetics")
        .select("dice_skin, token_frame, ui_theme, sfx_pack")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data) setCosmetics({ ...DEFAULT_COSMETICS, ...data });
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const update = useCallback(async (patch: Partial<Cosmetics>) => {
    setCosmetics((prev) => ({ ...prev, ...patch }));
    if (!user) return;
    const next = { ...readLocalCosmetics(), ...patch, user_id: user.id };
    await (supabase as any).from("user_cosmetics").upsert(next, { onConflict: "user_id" });
  }, [user]);

  return { cosmetics, update, loading };
}

/** Monté une fois dans l'app : applique le style sauvegardé au chargement. */
export function useApplyCosmetics() {
  useCosmetics();
}
