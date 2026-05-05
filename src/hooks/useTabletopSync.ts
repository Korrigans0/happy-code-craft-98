// ============================================================
// HOOK DE SYNCHRONISATION TEMPS RÉEL — AETHERIA VTT
// Fichier : src/hooks/useTabletopSync.ts
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
  id: string; // ✅ FIX : champ id ajouté — nécessaire pour la déduplication
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

// ✅ FIX : garantit qu'un dessin a toujours un id stable
// (pour les données anciennes en base qui n'en auraient pas)
const ensureId = (d: Partial<DrawAction>): DrawAction => ({
  ...d,
  id: d.id || `legacy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
} as DrawAction);

export function useTabletopSync({
  campaignId,
  userId,
  onStateReceived,
  debounceMs = 300,
}: UseTabletopSyncOptions) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const initializedRef = useRef(false);

  const onStateReceivedRef = useRef(onStateReceived);
  useEffect(() => {
    onStateReceivedRef.current = onStateReceived;
  }, [onStateReceived]);

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
        // ✅ FIX : ensureId sur chaque dessin avant de passer au parent
        const rawDrawings = (data.drawings as unknown as Partial<DrawAction>[]) || [];
        onStateReceivedRef.current({
          tokens: (data.tokens as unknown as TokenItem[]) || [],
          drawings: rawDrawings.map(ensureId),
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
          const newData = payload.new as Record<string, unknown>;
          if (newData?.updated_by === userId) return;

          isRemoteUpdateRef.current = true;
          // ✅ FIX : ensureId sur chaque dessin reçu via realtime
          const rawDrawings = (newData?.drawings as unknown as Partial<DrawAction>[]) || [];
          onStateReceivedRef.current({
            tokens: (newData?.tokens as unknown as TokenItem[]) || [],
            drawings: rawDrawings.map(ensureId),
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
