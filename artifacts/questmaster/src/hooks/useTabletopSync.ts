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
  lights?: unknown[];
  night_mode?: boolean;
  initiative?: unknown[];
  initiative_round?: number;
  initiative_active_idx?: number;
  scenes?: unknown[];
  active_scene_id?: string | null;
  layers?: Record<string, unknown>;
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
    lights: ((data as { lights?: unknown[] }).lights) || [],
    night_mode: !!(data as { night_mode?: boolean }).night_mode,
    initiative: ((data as { initiative?: unknown[] }).initiative) || [],
    initiative_round: typeof (data as { initiative_round?: number }).initiative_round === "number"
      ? (data as { initiative_round?: number }).initiative_round
      : 1,
    initiative_active_idx: typeof (data as { initiative_active_idx?: number }).initiative_active_idx === "number"
      ? (data as { initiative_active_idx?: number }).initiative_active_idx
      : -1,
    scenes: ((data as { scenes?: unknown[] }).scenes) || [],
    active_scene_id: (data as { active_scene_id?: string | null }).active_scene_id ?? null,
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
  const consecutiveErrorsRef = useRef(0);
  const saveErrorsRef = useRef(0);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "reconnecting">(
    typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "online"
  );

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
      saveErrorsRef.current = 0;
      setConnectionStatus((s) => (s === "offline" ? s : "online"));
      setLastSavedAt(new Date());
    } catch (e) {
      console.error("[Tabletop] Erreur sauvegarde:", e);
      saveErrorsRef.current = Math.min(saveErrorsRef.current + 1, 6);
      // Re-merge failed payload so next save retries it
      pendingStateRef.current = { ...payload, ...pendingStateRef.current };
      // Schedule a backoff retry if no new edit comes in soon (1s, 2s, 4s, …, max 30s)
      const backoff = Math.min(1000 * 2 ** (saveErrorsRef.current - 1), 30_000);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        void flush();
      }, backoff);
      setConnectionStatus((s) => (s === "offline" ? s : "reconnecting"));
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
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    lastUpdatedAtRef.current = null;
    consecutiveErrorsRef.current = 0;

    const scheduleNext = () => {
      if (cancelled) return;
      // Exponential backoff on consecutive errors: 3s → 6s → 12s → 24s → 30s max
      const errs = consecutiveErrorsRef.current;
      const delay = errs === 0 ? pollMs : Math.min(pollMs * 2 ** errs, 30_000);
      pollTimer = setTimeout(() => void pull(false), delay);
    };

    const pull = async (initial = false) => {
      if (cancelled || inFlightRef.current) {
        if (!initial) scheduleNext();
        return;
      }
      // Skip polling when tab is hidden or browser reports offline
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      if (!initial && ((typeof document !== "undefined" && document.hidden) || offline)) {
        scheduleNext();
        return;
      }
      // Don't overwrite local pending changes with remote echo
      if (!initial && dirtyRef.current) {
        scheduleNext();
        return;
      }
      inFlightRef.current = true;
      try {
        const data = await campaignsApi.getTabletop(campaignId);
        if (cancelled) return;
        if (!data) {
          consecutiveErrorsRef.current = 0;
          setConnectionStatus((s) => (s === "offline" ? s : "online"));
          return;
        }

        const updatedAt = (data as { updated_at?: string }).updated_at ?? null;
        const isOwnEcho = !initial && data.updated_by === userId;
        const unchanged = updatedAt && updatedAt === lastUpdatedAtRef.current;

        if (initial || (!isOwnEcho && !unchanged)) {
          lastUpdatedAtRef.current = updatedAt;
          const normalized = normalize(data);
          lastSavedRef.current = normalized;
          onStateReceivedRef.current(normalized);
        }
        consecutiveErrorsRef.current = 0;
        setConnectionStatus((s) => (s === "offline" ? s : "online"));
      } catch (e) {
        consecutiveErrorsRef.current = Math.min(consecutiveErrorsRef.current + 1, 6);
        if (initial) console.error("[Tabletop] Erreur chargement:", e);
        else console.warn("[Tabletop] Pull échoué (retry avec backoff):", e);
        setConnectionStatus((s) => (s === "offline" ? s : "reconnecting"));
      } finally {
        inFlightRef.current = false;
        if (initial) initializedRef.current = true;
        if (!cancelled) scheduleNext();
      }
    };

    pull(true);

    // Flush pending state when tab becomes hidden; resume polling immediately when visible.
    const onVisibility = () => {
      if (document.hidden) {
        if (dirtyRef.current) void flush();
      } else {
        if (pollTimer) clearTimeout(pollTimer);
        void pull(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Network online/offline: instant reaction
    const onOnline = () => {
      consecutiveErrorsRef.current = 0;
      setConnectionStatus("reconnecting");
      if (pollTimer) clearTimeout(pollTimer);
      void pull(false);
      // Retry any pending save right away
      if (dirtyRef.current) void flush();
    };
    const onOffline = () => setConnectionStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

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
      if (pollTimer) clearTimeout(pollTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      void flush();
    };
  }, [campaignId, userId, pollMs, flush, warnOnUnload]);

  return { saveState, flushNow, isDirty, isSaving, lastSavedAt, connectionStatus };
}
