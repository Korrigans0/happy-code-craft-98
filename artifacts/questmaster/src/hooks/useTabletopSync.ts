// ============================================================
// HOOK DE SYNCHRONISATION VTT — version REST API
// Fichier : src/hooks/useTabletopSync.ts
// ============================================================

import { useEffect, useRef, useCallback } from "react";
import { campaignsApi } from "@/lib/api";

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
  id: string;
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
  walls?: unknown[];
}

interface UseTabletopSyncOptions {
  campaignId: string;
  userId: string;
  onStateReceived: (state: TabletopState) => void;
  debounceMs?: number;
}

const ensureId = (d: Partial<DrawAction>): DrawAction => ({
  ...d,
  id: d.id || `legacy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
} as DrawAction);

export function useTabletopSync({
  campaignId,
  userId,
  onStateReceived,
  debounceMs = 600,
}: UseTabletopSyncOptions) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<Partial<TabletopState>>({});
  const writeQueueRef = useRef(Promise.resolve());
  const initializedRef = useRef(false);
  const onStateReceivedRef = useRef(onStateReceived);

  useEffect(() => {
    onStateReceivedRef.current = onStateReceived;
  }, [onStateReceived]);

  const saveState = useCallback(
    (state: Partial<TabletopState>, options?: { immediate?: boolean }) => {
      if (!initializedRef.current) return;
      pendingStateRef.current = { ...pendingStateRef.current, ...state };
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      const persist = async () => {
        const payload = pendingStateRef.current;
        pendingStateRef.current = {};
        writeQueueRef.current = writeQueueRef.current
          .catch(() => undefined)
          .then(() => campaignsApi.saveTabletop(campaignId, payload).then(() => undefined));
        await writeQueueRef.current.catch((e) => {
          console.error("[Tabletop] Erreur sauvegarde:", e);
        });
      };

      if (options?.immediate) {
        void persist();
        return;
      }

      saveTimeoutRef.current = setTimeout(() => {
        void persist();
      }, debounceMs);
    },
    [campaignId, userId, debounceMs]
  );

  useEffect(() => {
    let cancelled = false;

    const loadInitialState = async () => {
      try {
        const data = await campaignsApi.getTabletop(campaignId);
        if (cancelled) return;
        if (data) {
          const rawDrawings = (data.drawings as unknown as Partial<DrawAction>[]) || [];
          onStateReceivedRef.current({
            tokens: (data.tokens as unknown as TokenItem[]) || [],
            drawings: rawDrawings.map(ensureId),
            map_image_url: data.map_image_url || null,
            fog_visible: data.fog_visible || false,
            walls: ((data as { walls?: unknown[] }).walls) || [],
          });
        }
      } catch (e) {
        console.error("[Tabletop] Erreur chargement:", e);
      }
      initializedRef.current = true;
    };

    loadInitialState();

    // Poll for remote updates every 3 seconds
    const pollInterval = setInterval(async () => {
      if (cancelled) return;
      try {
        const data = await campaignsApi.getTabletop(campaignId);
        if (data && data.updated_by && data.updated_by !== userId) {
          const rawDrawings = (data.drawings as unknown as Partial<DrawAction>[]) || [];
          onStateReceivedRef.current({
            tokens: (data.tokens as unknown as TokenItem[]) || [],
            drawings: rawDrawings.map(ensureId),
            map_image_url: data.map_image_url || null,
            fog_visible: data.fog_visible || false,
            walls: ((data as { walls?: unknown[] }).walls) || [],
          });
        }
      } catch {}
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [campaignId, userId]);

  return { saveState };
}
