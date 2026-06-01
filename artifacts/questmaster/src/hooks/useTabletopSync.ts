// ============================================================
// HOOK DE SYNCHRONISATION VTT — version REST API
// Fichier : src/hooks/useTabletopSync.ts
// ============================================================

import { useEffect, useRef, useCallback, useState } from "react";
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
  /** Show browser confirmation when navigating away with unsaved changes */
  warnOnUnload?: boolean;
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

// Shallow-stable JSON comparison — avoids enqueuing saves when value didn't actually change.
const isEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

export function useTabletopSync({
  campaignId,
  userId,
  onStateReceived,
  debounceMs = 600,
  pollMs = 3000,
  warnOnUnload = true,
}: UseTabletopSyncOptions) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<Partial<TabletopState>>({});
  const lastSavedRef = useRef<Partial<TabletopState>>({});
  const writeQueueRef = useRef(Promise.resolve());
  const initializedRef = useRef(false);
  const onStateReceivedRef = useRef(onStateReceived);
  const lastUpdatedAtRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const dirtyRef = useRef(false);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const markDirty = useCallback((value: boolean) => {
    if (dirtyRef.current === value) return;
    dirtyRef.current = value;
    setIsDirty(value);
  }, []);

  useEffect(() => {
    onStateReceivedRef.current = onStateReceived;
  }, [onStateReceived]);

  const flush = useCallback(async () => {
    if (Object.keys(pendingStateRef.current).length === 0) {
      markDirty(false);
      return;
    }
    const payload = pendingStateRef.current;
    pendingStateRef.current = {};
    setIsSaving(true);
    writeQueueRef.current = writeQueueRef.current
      .catch(() => undefined)
      .then(() => campaignsApi.saveTabletop(campaignId, payload).then(() => {
        lastSavedRef.current = { ...lastSavedRef.current, ...payload };
      }));
    try {
      await writeQueueRef.current;
      setLastSavedAt(new Date());
    } catch (e) {
      console.error("[Tabletop] Erreur sauvegarde:", e);
      // Re-merge failed payload so next save retries it
      pendingStateRef.current = { ...payload, ...pendingStateRef.current };
    } finally {
      setIsSaving(false);
      if (Object.keys(pendingStateRef.current).length === 0) markDirty(false);
    }
  }, [campaignId, markDirty]);

  const saveState = useCallback(
    (state: Partial<TabletopState>, options?: { immediate?: boolean }) => {
      if (!initializedRef.current) return;

      // Filter to only fields that actually changed vs last-known saved state
      const changed: Partial<TabletopState> = {};
      let hasChange = false;
      for (const key of Object.keys(state) as (keyof TabletopState)[]) {
        const next = state[key];
        const prev = pendingStateRef.current[key] ?? lastSavedRef.current[key];
        if (!isEqual(next, prev)) {
          (changed as any)[key] = next;
          hasChange = true;
        }
      }
      if (!hasChange && !options?.immediate) return;

      pendingStateRef.current = { ...pendingStateRef.current, ...changed };
      markDirty(true);

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
    [debounceMs, flush, markDirty]
  );

  const flushNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await flush();
  }, [flush]);

  useEffect(() => {
    let cancelled = false;
    lastUpdatedAtRef.current = null;

    const pull = async (initial = false) => {
      if (cancelled || inFlightRef.current) return;
      // Skip polling when tab is hidden — saves CPU & bandwidth
      if (!initial && typeof document !== "undefined" && document.hidden) return;
      // Don't overwrite local pending changes with remote echo
      if (!initial && dirtyRef.current) return;
      inFlightRef.current = true;
      try {
        const data = await campaignsApi.getTabletop(campaignId);
        if (cancelled || !data) return;

        const updatedAt = (data as { updated_at?: string }).updated_at ?? null;
        const isOwnEcho = !initial && data.updated_by === userId;
        const unchanged = updatedAt && updatedAt === lastUpdatedAtRef.current;

        if (initial || (!isOwnEcho && !unchanged)) {
          lastUpdatedAtRef.current = updatedAt;
          const normalized = normalize(data);
          lastSavedRef.current = normalized;
          onStateReceivedRef.current(normalized);
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

    // Flush pending state when tab becomes hidden
    const onVisibility = () => {
      if (document.hidden && dirtyRef.current) void flush();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Warn on unload if there are unsaved changes
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!warnOnUnload || !dirtyRef.current) return;
      void flush();
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      void flush();
    };
  }, [campaignId, userId, pollMs, flush, warnOnUnload]);

  return { saveState, flushNow, isDirty, isSaving, lastSavedAt };
}
