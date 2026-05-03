// ============================================================
// HOOK DE SYNCHRONISATION TEMPS RÉEL — AETHERIA VTT
// Fichier : src/hooks/useTabletopSync.ts
// ============================================================
// Ce hook gère toute la synchronisation Supabase Realtime
// du plateau. À importer dans CampaignTabletop.tsx
// ============================================================

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TokenItem {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  sizeUnits: number;
  rotation: number;
  color: string;
  label: string;
  layer: string;
  visible: boolean;
  creatureId?: string;
  creatureType?: "wa_creature" | "monster" | "character" | "aetheria_creature";
  hp?: number;
  maxHp?: number;
  ac?: number;
  imageUrl?: string;
}

interface DrawAction {
  type: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  text?: string;
  layer: string;
}

interface TabletopState {
  tokens: TokenItem[];
  drawings: DrawAction[];
  map_image_url: string | null;
  fog_visible: boolean;
}

interface UseTabletopSyncOptions {
  campaignId: string;
  userId: string;
  onStateReceived: (state: TabletopState) => void;
  debounceMs?: number;
}

export function useTabletopSync({
  campaignId,
  userId,
  onStateReceived,
  debounceMs = 300,
}: UseTabletopSyncOptions) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const initializedRef = useRef(false);

  // Stabilise le callback (le parent peut passer une nouvelle fn à chaque render)
  const onStateReceivedRef = useRef(onStateReceived);
  useEffect(() => {
    onStateReceivedRef.current = onStateReceived;
  }, [onStateReceived]);

  // ── Sauvegarder l'état dans Supabase (avec debounce) ─────
  const saveState = useCallback(
    (state: Partial<TabletopState>) => {
      if (isRemoteUpdateRef.current) return;
      if (!initializedRef.current) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        const payload: Record<string, unknown> = {
          campaign_id: campaignId,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        };

        if (state.tokens !== undefined) payload.tokens = state.tokens as unknown;
        if (state.drawings !== undefined) payload.drawings = state.drawings as unknown;
        if (state.map_image_url !== undefined) payload.map_image_url = state.map_image_url;
        if (state.fog_visible !== undefined) payload.fog_visible = state.fog_visible;

        const { error } = await supabase
          .from("tabletop_state")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert(payload as any, { onConflict: "campaign_id" });

        if (error) {
          console.error("[Tabletop] Erreur sauvegarde:", error);
        }
      }, debounceMs);
    },
    [campaignId, userId, debounceMs]
  );

  // ── Écouter les changements en temps réel ────────────────
  useEffect(() => {
    let cancelled = false;

    const loadInitialState = async () => {
      const { data, error } = await supabase
        .from("tabletop_state")
        .select("*")
        .eq("campaign_id", campaignId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("[Tabletop] Erreur chargement état:", error);
        initializedRef.current = true;
        return;
      }

      if (data) {
        isRemoteUpdateRef.current = true;
        onStateReceivedRef.current({
          tokens: (data.tokens as unknown as TokenItem[]) || [],
          drawings: (data.drawings as unknown as DrawAction[]) || [],
          map_image_url: data.map_image_url || null,
          fog_visible: data.fog_visible || false,
        });
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
      }

      initializedRef.current = true;
    };

    loadInitialState();

    const channel = supabase
      .channel(`tabletop:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tabletop_state",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          // Ignorer nos propres mises à jour
          const newData = payload.new as Record<string, unknown>;
          if (newData?.updated_by === userId) return;

          isRemoteUpdateRef.current = true;
          onStateReceivedRef.current({
            tokens: (newData?.tokens as unknown as TokenItem[]) || [],
            drawings: (newData?.drawings as unknown as DrawAction[]) || [],
            map_image_url: (newData?.map_image_url as string) || null,
            fog_visible: (newData?.fog_visible as boolean) || false,
          });

          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 100);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [campaignId, userId]);

  return { saveState };
}
