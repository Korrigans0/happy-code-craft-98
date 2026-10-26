// Pure helpers for saving the shared tabletop row safely when several people
// edit it at once. Tokens and drawings are written as per-id changes (merged
// atomically by the server) so one player's save can never roll back another
// player's move; every other column is GM-only and written as a whole.

/** Columns that really exist on `tabletop_state` and may be written by the app. */
export const TABLETOP_COLUMNS = [
  "tokens",
  "drawings",
  "map_image_url",
  "fog_visible",
  "walls",
  "lights",
  "night_mode",
  "initiative",
  "initiative_round",
  "initiative_active_idx",
  "scenes",
  "active_scene_id",
  "layers",
  "shared_documents",
] as const;
export type TabletopColumn = typeof TABLETOP_COLUMNS[number];

/** Multi-writer arrays (players move tokens and draw) merged item by item. */
export const MERGEABLE_COLUMNS = ["tokens", "drawings"] as const;
export type MergeableColumn = typeof MERGEABLE_COLUMNS[number];

export const isMergeableColumn = (key: string): key is MergeableColumn =>
  (MERGEABLE_COLUMNS as readonly string[]).includes(key);

const COLUMN_SET = new Set<string>(TABLETOP_COLUMNS);

/**
 * Keeps only real table columns. Unknown keys (e.g. a scene `grid` that lives
 * inside `scenes`) used to make every later save fail with an unknown-column
 * error, silently blocking all synchronisation until a reload.
 */
export function pickTabletopColumns(state: Record<string, unknown>): {
  payload: Partial<Record<TabletopColumn, unknown>>;
  dropped: string[];
} {
  const payload: Partial<Record<TabletopColumn, unknown>> = {};
  const dropped: string[] = [];
  for (const [key, value] of Object.entries(state)) {
    if (value === undefined) continue;
    if (COLUMN_SET.has(key)) payload[key as TabletopColumn] = value;
    else dropped.push(key);
  }
  return { payload, dropped };
}

type Item = { id?: unknown } & Record<string, unknown>;
const itemId = (item: unknown): string | null => {
  const id = (item as Item | null)?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
};
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

export interface ItemDiff {
  upserts: unknown[];
  removed: string[];
}

/**
 * Per-id difference between the last confirmed server array and the local one.
 * Returns null when the change cannot be expressed per id (missing ids,
 * duplicates, reordering, or new items inserted before existing ones): the
 * caller then writes the whole array, as before.
 */
export function diffById(base: unknown[] | undefined, next: unknown[]): ItemDiff | null {
  const baseList = Array.isArray(base) ? base : [];
  const baseById = new Map<string, unknown>();
  for (const item of baseList) {
    const id = itemId(item);
    if (!id || baseById.has(id)) return null;
    baseById.set(id, item);
  }
  const seen = new Set<string>();
  const upserts: unknown[] = [];
  const commonOrder: string[] = [];
  let sawNew = false;
  for (const item of next) {
    const id = itemId(item);
    if (!id || seen.has(id)) return null;
    seen.add(id);
    const previous = baseById.get(id);
    if (previous === undefined) {
      sawNew = true;
      upserts.push(item);
      continue;
    }
    // A new item placed before an existing one changes the stacking order.
    if (sawNew) return null;
    commonOrder.push(id);
    if (!same(previous, item)) upserts.push(item);
  }
  const baseOrder = baseList.map(itemId).filter((id): id is string => !!id && seen.has(id));
  if (baseOrder.length !== commonOrder.length || baseOrder.some((id, i) => id !== commonOrder[i])) return null;
  const removed = [...baseById.keys()].filter((id) => !seen.has(id));
  return { upserts, removed };
}

/** Same semantics as the server merge: replace in place, drop removed, append new. */
export function applyDiff(target: unknown[], diff: ItemDiff): unknown[] {
  const removed = new Set(diff.removed);
  const upserts = new Map<string, unknown>();
  for (const item of diff.upserts) {
    const id = itemId(item);
    if (id) upserts.set(id, item);
  }
  const result: unknown[] = [];
  const present = new Set<string>();
  for (const item of target) {
    const id = itemId(item);
    if (id && removed.has(id)) continue;
    if (id) present.add(id);
    result.push(id && upserts.has(id) ? upserts.get(id) : item);
  }
  for (const [id, item] of upserts) {
    if (!present.has(id) && !removed.has(id)) result.push(item);
  }
  return result;
}

/**
 * Replays the local, not yet saved changes (base → local) on top of a newer
 * remote array, so remote moves are shown without discarding local edits.
 */
export function rebaseById(remote: unknown[], base: unknown[] | undefined, local: unknown[]): unknown[] {
  const diff = diffById(base, local);
  if (!diff) return local;
  return applyDiff(remote, diff);
}

const RETRYABLE_CODES = new Set([
  "57014", // statement timeout
  "40001", // serialization failure
  "40P01", // deadlock
  "53300", // too many connections
  "55P03", // lock not available
  "08000", "08003", "08006", "08001",
  "PGRST000", "PGRST001", "PGRST002", "PGRST003",
]);

/**
 * True for temporary failures (network, timeouts, overload) that are worth
 * retrying; false for permanent refusals (permissions, invalid data).
 */
export function isRetryableError(error: { code?: string | null; message?: string | null } | null | undefined, status?: number | null): boolean {
  if (status === 408 || status === 425 || status === 429) return true;
  if (typeof status === "number" && status >= 500) return true;
  const code = error?.code ?? "";
  if (code && RETRYABLE_CODES.has(code)) return true;
  const message = (error?.message ?? "").toLowerCase();
  if (/failed to fetch|networkerror|network request failed|load failed|timeout|timed out|fetch/.test(message)) return true;
  // No HTTP status and no database code: the request never reached the server.
  return !code && (status === 0 || status === undefined || status === null);
}
