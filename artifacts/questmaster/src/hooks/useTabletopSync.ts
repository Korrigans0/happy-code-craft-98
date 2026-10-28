// ============================================================
// HOOK DE SYNCHRONISATION VTT
// Fichier : src/hooks/useTabletopSync.ts
// ============================================================
//
// Source of truth: the `tabletop_state` row of the campaign.
// - Initial load is retried until it succeeds; nothing is written before the
//   saved board is known, so a failed load can never overwrite it.
// - Tokens and drawings are saved as per-id changes merged by the server, so
//   concurrent players cannot roll back each other's moves.
// - Other columns (GM-only) are saved separately: a refused GM-only change
//   never blocks token moves.
// - Temporary errors are retried with backoff; permanent refusals are reported
//   and the board is re-read so what is shown matches what is saved.
// - Live updates (and the fallback polling) reconcile remote changes with
//   local unsaved edits instead of ignoring them.

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { completeRealtimeRow } from "@/lib/tabletopRealtimeRow";
import {
  MERGEABLE_COLUMNS,
  TABLETOP_COLUMNS,
  diffById,
  isMergeableColumn,
  isRetryableError,
  isSceneChangedError,
  changesActiveScene,
  pendingBelongsToOldScene,
  pickTabletopColumns,
  rebaseById,
  type MergeableColumn,
} from "@/lib/vtt/tabletopMerge";

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
  shared_documents?: unknown[];
}

/** Clés de l'état du plateau réellement modifiées par l'évènement reçu. */
export type TabletopStateKey = keyof TabletopState;

export type TabletopLoadState = "loading" | "ready" | "error";

interface UseTabletopSyncOptions {
  campaignId: string;
  userId: string;
  /**
   * `changedKeys` est fourni pour les mises à jour distantes : le consommateur
   * n'applique que les sections concernées. `undefined` = état complet.
   */
  onStateReceived: (state: TabletopState, changedKeys?: Set<TabletopStateKey>) => void;
  /** Appelé quand une modification a été définitivement refusée par le serveur. */
  onSaveRejected?: (message: string) => void;
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
    walls: data.walls || [],
    lights: data.lights || [],
    night_mode: !!data.night_mode,
    initiative: data.initiative || [],
    initiative_round: typeof data.initiative_round === "number" ? data.initiative_round : 1,
    initiative_active_idx: typeof data.initiative_active_idx === "number" ? data.initiative_active_idx : -1,
    scenes: data.scenes || [],
    active_scene_id: data.active_scene_id ?? null,
    layers: data.layers ?? undefined,
    shared_documents: data.shared_documents || [],
  };
};

const isEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

const ROW_COLUMNS = `${TABLETOP_COLUMNS.join(", ")}, updated_at, updated_by`;

class SyncError extends Error {
  constructor(message: string, readonly retryable: boolean, readonly code?: string) {
    super(message);
  }
}

const toSyncError = (error: { code?: string; message?: string } | null, status?: number) =>
  new SyncError(error?.message || "Erreur de synchronisation", isRetryableError(error, status), error?.code);

const newer = (a: string | null | undefined, b: string | null | undefined) =>
  !b || (!!a && Date.parse(a) >= Date.parse(b));

const REJECTED_MESSAGE = "Une modification du plateau a été refusée par le serveur et n'a pas été enregistrée. Le plateau a été rechargé.";

export function useTabletopSync({
  campaignId,
  userId,
  onStateReceived,
  onSaveRejected,
  debounceMs = 600,
  pollMs = 3000,
  warnOnUnload = true,
}: UseTabletopSyncOptions) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Local changes not yet sent (latest local value per column). */
  const pendingStateRef = useRef<Partial<TabletopState>>({});
  /** Last state confirmed by the server (merge base). */
  const lastSavedRef = useRef<Partial<TabletopState>>({});
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const writingRef = useRef(false);
  const resyncRequestedRef = useRef(false);
  const initializedRef = useRef(false);
  const onStateReceivedRef = useRef(onStateReceived);
  const onSaveRejectedRef = useRef(onSaveRejected);
  const lastUpdatedAtRef = useRef<string | null>(null);
  const pullInFlightRef = useRef(false);
  const dirtyRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const saveErrorsRef = useRef(0);
  const realtimeOkRef = useRef(false);
  const pullRef = useRef<(full?: boolean) => Promise<void>>(async () => undefined);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [loadState, setLoadState] = useState<TabletopLoadState>("loading");
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "reconnecting">(
    typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "online"
  );

  useEffect(() => { onStateReceivedRef.current = onStateReceived; }, [onStateReceived]);
  useEffect(() => { onSaveRejectedRef.current = onSaveRejected; }, [onSaveRejected]);

  const markDirty = useCallback((value: boolean) => {
    if (dirtyRef.current === value) return;
    dirtyRef.current = value;
    setIsDirty(value);
  }, []);

  /**
   * Applies a full server row: only differing sections are delivered, and
   * local unsaved edits are replayed on top of remote tokens/drawings.
   */
  const applyRemoteRow = useCallback((row: Record<string, unknown>, complete: boolean) => {
    const updatedAt = (row.updated_at as string | undefined) ?? null;
    if (updatedAt && lastUpdatedAtRef.current && !newer(updatedAt, lastUpdatedAtRef.current)) {
      // An older event from someone else arrived after our own newer write:
      // re-read the row instead of dropping their change.
      if (!complete && row.updated_by !== userIdRef.current) {
        if (writingRef.current) resyncRequestedRef.current = true;
        else void pullRef.current(true);
      }
      return;
    }
    // A write is in flight: its confirmation would race this row; re-read afterwards.
    if (writingRef.current) { resyncRequestedRef.current = true; return; }
    const normalized = normalize(complete ? row : completeRealtimeRow(row, lastSavedRef.current as Record<string, unknown>));
    const base = lastSavedRef.current;
    if (updatedAt) lastUpdatedAtRef.current = updatedAt;
    lastSavedRef.current = normalized;
    const delivered = new Set<TabletopStateKey>();
    // The GM switched scene: unsaved token/drawing edits belong to the old one
    // and are dropped (replaying them would copy old tokens into the new scene).
    if (pendingBelongsToOldScene(base, normalized)) {
      for (const column of MERGEABLE_COLUMNS) {
        if (pendingStateRef.current[column] === undefined) continue;
        delete (pendingStateRef.current as Record<string, unknown>)[column];
        delivered.add(column);
      }
    }

    const view: TabletopState = { ...normalized };
    for (const key of Object.keys(normalized) as TabletopStateKey[]) {
      if (isEqual(normalized[key], base[key])) continue;
      const pending = pendingStateRef.current[key];
      if (pending === undefined) { delivered.add(key); continue; }
      if (isMergeableColumn(key)) {
        const rebased = rebaseById(normalized[key] as unknown[], base[key] as unknown[] | undefined, pending as unknown[]);
        (pendingStateRef.current as Record<string, unknown>)[key] = rebased;
        (view as unknown as Record<string, unknown>)[key] = rebased;
        delivered.add(key);
      }
      // Other pending GM-only columns: the local edit wins and is saved next.
    }
    if (delivered.size > 0) onStateReceivedRef.current(view, delivered);
  }, []);

  /** Sends pending changes. Runs serially; reads pending/base at execution time. */
  const runWrite = useCallback(async () => {
    const { payload, dropped } = pickTabletopColumns(pendingStateRef.current as Record<string, unknown>);
    pendingStateRef.current = {};
    if (dropped.length) console.warn("[Tabletop] Champs ignorés (hors table):", dropped);
    if (Object.keys(payload).length === 0) return;

    writingRef.current = true;
    setIsSaving(true);
    const remaining: Record<string, unknown> = { ...payload };
    const corrections = new Set<MergeableColumn>();
    let latest: string | null = null;
    // A scene change writes tokens/drawings together with the new scene id.
    const sceneChange = changesActiveScene(payload);
    try {
      // 1) Multi-writer arrays: per-id merge on the server, refused if the
      //    active scene changed since this tab last saw it.
      for (const column of MERGEABLE_COLUMNS) {
        if (sceneChange || !(column in remaining)) continue;
        const next = remaining[column] as unknown[];
        const diff = diffById(lastSavedRef.current[column] as unknown[] | undefined, next);
        if (!diff) continue; // full write below
        if (diff.upserts.length || diff.removed.length) {
          const { data, error, status } = await (supabase.rpc as any)("merge_tabletop_items", {
            _campaign_id: campaignId,
            _column: column,
            _upserts: diff.upserts,
            _removed: diff.removed,
            _expected_scene_id: lastSavedRef.current.active_scene_id ?? null,
            _check_scene: true,
          });
          if (error) throw toSyncError(error, status);
          const merged = (data?.items ?? next) as unknown[];
          (lastSavedRef.current as Record<string, unknown>)[column] = merged;
          if (!isEqual(merged, next)) corrections.add(column);
          if (data?.updated_at && newer(data.updated_at, latest)) latest = data.updated_at;
        }
        delete remaining[column];
      }
      // 2) Everything else (GM-only columns, reordered arrays) in one write.
      if (Object.keys(remaining).length > 0) {
        const { data, error, status } = await supabase
          .from("tabletop_state")
          .upsert({ ...remaining, campaign_id: campaignId, updated_by: userId } as any, { onConflict: "campaign_id" })
          .select("updated_at")
          .maybeSingle();
        if (error) throw toSyncError(error, status);
        lastSavedRef.current = { ...lastSavedRef.current, ...remaining };
        const at = (data as { updated_at?: string } | null)?.updated_at;
        if (at && newer(at, latest)) latest = at;
        for (const key of Object.keys(remaining)) delete remaining[key];
      }

      if (latest && newer(latest, lastUpdatedAtRef.current)) lastUpdatedAtRef.current = latest;
      saveErrorsRef.current = 0;
      setConnectionStatus((s) => (s === "offline" ? s : "online"));
      setLastSavedAt(new Date());

      // The server merged someone else's concurrent change: show it.
      if (corrections.size > 0) {
        const view = { ...(lastSavedRef.current as TabletopState) };
        for (const column of corrections) {
          const pending = pendingStateRef.current[column];
          if (pending !== undefined) {
            const rebased = rebaseById(lastSavedRef.current[column] as unknown[], payload[column] as unknown[], pending as unknown[]);
            (pendingStateRef.current as Record<string, unknown>)[column] = rebased;
            (view as unknown as Record<string, unknown>)[column] = rebased;
          }
        }
        onStateReceivedRef.current(view, new Set(corrections));
      }
    } catch (e) {
      const err = e instanceof SyncError ? e : new SyncError(String((e as Error)?.message ?? e), true);
      if (isSceneChangedError(err)) {
        // Edits made on the previous scene: drop them and show the new scene.
        console.info("[Tabletop] Scène changée par le MJ : modifications de l'ancienne scène ignorées.");
        for (const column of MERGEABLE_COLUMNS) delete (pendingStateRef.current as Record<string, unknown>)[column];
        const rest = Object.fromEntries(Object.entries(remaining).filter(([k]) => !isMergeableColumn(k)));
        pendingStateRef.current = { ...(rest as Partial<TabletopState>), ...pendingStateRef.current };
        resyncRequestedRef.current = true;
        if (Object.keys(rest).length > 0 && !saveTimeoutRef.current) {
          saveTimeoutRef.current = setTimeout(() => {
            saveTimeoutRef.current = null;
            void flushRef.current();
          }, debounceMs);
        }
      } else if (err.retryable) {
        console.warn("[Tabletop] Sauvegarde différée (nouvel essai):", err.message);
        // Unsent parts go back in the queue; newer local edits take precedence.
        pendingStateRef.current = { ...(remaining as Partial<TabletopState>), ...pendingStateRef.current };
        saveErrorsRef.current = Math.min(saveErrorsRef.current + 1, 6);
        const backoff = Math.min(1000 * 2 ** (saveErrorsRef.current - 1), 30_000);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveTimeoutRef.current = null;
          void flushRef.current();
        }, backoff);
        setConnectionStatus((s) => (s === "offline" ? s : "reconnecting"));
      } else {
        // Permanent refusal: never pretend it was saved, show the saved board again.
        console.error("[Tabletop] Modification refusée:", err.message);
        onSaveRejectedRef.current?.(REJECTED_MESSAGE);
        resyncRequestedRef.current = true;
      }
    } finally {
      writingRef.current = false;
      setIsSaving(false);
      if (Object.keys(pendingStateRef.current).length === 0) markDirty(false);
      if (resyncRequestedRef.current) {
        resyncRequestedRef.current = false;
        void pullRef.current(true);
      }
    }
  }, [campaignId, userId, markDirty, debounceMs]);

  const flush = useCallback(async () => {
    if (!initializedRef.current) return; // never write before the saved board is known
    if (Object.keys(pendingStateRef.current).length === 0) {
      if (!writingRef.current) markDirty(false);
      return;
    }
    writeQueueRef.current = writeQueueRef.current.catch(() => undefined).then(runWrite);
    await writeQueueRef.current;
  }, [runWrite, markDirty]);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const saveState = useCallback(
    (state: Partial<TabletopState>, options?: { immediate?: boolean }) => {
      if (!initializedRef.current) return;
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
      if (Object.keys(pendingStateRef.current).length > 0) markDirty(true);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      if (options?.immediate) { void flush(); return; }
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
    lastSavedRef.current = {};
    pendingStateRef.current = {};
    initializedRef.current = false;
    consecutiveErrorsRef.current = 0;
    setLoadState("loading");

    const scheduleNext = () => {
      if (cancelled) return;
      if (pollTimer) clearTimeout(pollTimer);
      const errs = consecutiveErrorsRef.current;
      // Before the first successful load, retry quickly; afterwards, polling is
      // only a safety net while live updates are connected.
      const base = !initializedRef.current
        ? 1500
        : realtimeOkRef.current ? Math.max(pollMs, 30_000) : pollMs;
      const delay = errs === 0 ? base : Math.min(base * 2 ** errs, 60_000);
      pollTimer = setTimeout(() => void pull(false), delay);
    };

    const loadFull = async () => {
      const { data, error, status } = await supabase
        .from("tabletop_state")
        .select(ROW_COLUMNS as "*")
        .eq("campaign_id", campaignId)
        .maybeSingle();
      if (error) throw toSyncError(error, status);
      return data as Record<string, unknown> | null;
    };

    const pull = async (force = false) => {
      if (cancelled) return;
      if (pullInFlightRef.current) { scheduleNext(); return; }
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      if (initializedRef.current && !force && ((typeof document !== "undefined" && document.hidden) || offline)) {
        scheduleNext();
        return;
      }
      pullInFlightRef.current = true;
      try {
        if (!initializedRef.current) {
          const row = await loadFull();
          if (cancelled) return;
          const normalized = normalize(row ?? {});
          lastSavedRef.current = normalized;
          lastUpdatedAtRef.current = (row?.updated_at as string | undefined) ?? null;
          initializedRef.current = true;
          setLoadState("ready");
          onStateReceivedRef.current(normalized);
        } else {
          // Cheap version check first; the full row is read only when it changed.
          const { data, error, status } = await supabase
            .from("tabletop_state")
            .select("updated_at")
            .eq("campaign_id", campaignId)
            .maybeSingle();
          if (error) throw toSyncError(error, status);
          const updatedAt = (data as { updated_at?: string } | null)?.updated_at ?? null;
          if (force || (updatedAt && updatedAt !== lastUpdatedAtRef.current)) {
            const row = await loadFull();
            if (cancelled) return;
            if (row) {
              if (force) lastUpdatedAtRef.current = null;
              applyRemoteRow(row, true);
            }
          }
        }
        consecutiveErrorsRef.current = 0;
        setConnectionStatus((s) => (s === "offline" ? s : "online"));
      } catch (e) {
        consecutiveErrorsRef.current = Math.min(consecutiveErrorsRef.current + 1, 6);
        if (!initializedRef.current) {
          console.error("[Tabletop] Erreur chargement (nouvel essai):", e);
          setLoadState("error");
        } else {
          console.warn("[Tabletop] Lecture échouée (nouvel essai):", e);
        }
        setConnectionStatus((s) => (s === "offline" ? s : "reconnecting"));
      } finally {
        pullInFlightRef.current = false;
        if (!cancelled) scheduleNext();
      }
    };
    pullRef.current = pull;

    void pull(false);

    const onVisibility = () => {
      if (document.hidden) {
        if (dirtyRef.current) void flushRef.current();
      } else {
        void pull(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onOnline = () => {
      consecutiveErrorsRef.current = 0;
      setConnectionStatus("reconnecting");
      void pull(false);
      if (dirtyRef.current) void flushRef.current();
    };
    const onOffline = () => setConnectionStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!warnOnUnload || !dirtyRef.current) return;
      void flushRef.current();
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
      void flushRef.current();
    };
  }, [campaignId, pollMs, warnOnUnload, applyRemoteRow]);

  // ── TEMPS RÉEL (websocket) ────────────────────────────────
  // Les colonnes volumineuses inchangées peuvent être absentes du payload ;
  // elles sont complétées depuis le dernier état connu (jamais vidées).
  const subscriptions = useMemo(
    () => [
      {
        table: "tabletop_state",
        event: "*" as const,
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload: { new?: Record<string, unknown> | null }) => {
          const row = payload.new;
          if (!row || !initializedRef.current) return;
          // Own echo while the write is in flight: its response confirms it.
          if (row.updated_by === userId && writingRef.current) return;
          applyRemoteRow(row, false);
        },
      },
    ],
    [campaignId, userId, applyRemoteRow]
  );

  const realtimeStatus = useRealtimeChannel({
    channelName: `campaign:${campaignId}:tabletop`,
    subscriptions,
    enabled: !!campaignId,
  });

  useEffect(() => {
    const wasConnected = realtimeOkRef.current;
    realtimeOkRef.current = realtimeStatus === "connected";
    // Events may have been missed while disconnected: catch up once.
    if (!wasConnected && realtimeStatus === "connected" && initializedRef.current) void pullRef.current(false);
  }, [realtimeStatus]);

  return { saveState, flushNow, isDirty, isSaving, lastSavedAt, connectionStatus, realtimeStatus, loadState };
}
