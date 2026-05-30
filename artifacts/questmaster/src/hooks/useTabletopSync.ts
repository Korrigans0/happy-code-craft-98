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
  pollMs?: number;
}

const ensureId = (d: Partial<DrawAction>): DrawAction => ({
  ...d,
  id: d.id || `legacy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
} as DrawAction);

const normalize = (data: any): TabletopState => {
  const rawDrawings = (data.drawings as unknown as Partial<DrawAction>[]) || [];
  return {
    tokens: (data.tokens as unknown as TokenItem[]) || [],
    drawings: rawDrawings.map(ensureId),
    map_image_url: data.map_image_url || null,
    fog_visible: data.fog_visible || false,
    walls: ((data as { walls?: unknown[] }).walls) || [],
  };
};

export function useTabletopSync({
  campaignId,
  userId,
  onStateReceived,
  debounceMs = 600,
  pollMs = 3000,
}: UseTabletopSyncOptions) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<Partial<TabletopState>>({});
  const writeQueueRef = useRef(Promise.resolve());
  const initializedRef = useRef(false);
  const onStateReceivedRef = useRef(onStateReceived);
  const lastUpdatedAtRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    onStateReceivedRef.current = onStateReceived;
  }, [onStateReceived]);

  const flush = useCallback(async () => {
    if (Object.keys(pendingStateRef.current).length === 0) return;
    const payload = pendingStateRef.current;
    pendingStateRef.current = {};
    writeQueueRef.current = writeQueueRef.current
      .catch(() => undefined)
      .then(() => campaignsApi.saveTabletop(campaignId, payload).then(() => undefined));
    await writeQueueRef.current.catch((e) => {
      console.error("[Tabletop] Erreur sauvegarde:", e);
    });
  }, [campaignId]);

  const saveState = useCallback(
    (state: Partial<TabletopState>, options?: { immediate?: boolean }) => {
      if (!initializedRef.current) return;
      pendingStateRef.current = { ...pendingStateRef.current, ...state };
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      if (options?.immediate) {
        void flush();
        return;
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        void flush();
      }, debounceMs);
    },
    [debounceMs, flush]
  );

  useEffect(() => {
    let cancelled = false;
    lastUpdatedAtRef.current = null;

    const pull = async (initial = false) => {
      if (cancelled || inFlightRef.current) return;
      // Skip polling when tab is hidden — saves CPU & bandwidth
      if (!initial && typeof document !== "undefined" && document.hidden) return;
      inFlightRef.current = true;
      try {
        const data = await campaignsApi.getTabletop(campaignId);
        if (cancelled || !data) return;

        const updatedAt = (data as { updated_at?: string }).updated_at ?? null;
        const isOwnEcho = !initial && data.updated_by === userId;
        const unchanged = updatedAt && updatedAt === lastUpdatedAtRef.current;

        if (initial || (!isOwnEcho && !unchanged)) {
          lastUpdatedAtRef.current = updatedAt;
          onStateReceivedRef.current(normalize(data));
        }
      } catch (e) {
        if (initial) console.error("[Tabletop] Erreur chargement:", e);
      } finally {
        inFlightRef.current = false;
        if (initial) initializedRef.current = true;
      }
    };

    pull(true);
    const pollInterval = setInterval(() => void pull(false), pollMs);

    // Flush pending state when leaving the page
    const onVisibility = () => {
      if (document.hidden) void flush();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", onVisibility);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      void flush();
    };
  }, [campaignId, userId, pollMs, flush]);

  return { saveState };
}
