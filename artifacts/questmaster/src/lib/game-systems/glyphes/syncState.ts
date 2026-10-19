// Session-only provenance: restored snapshots are never sheet edits.
import type { CombatSnapshot } from "./sheetSync";

export const COUNTER_FIELDS = ["wounds", "heroism", "resilience"] as const;
export const COMBAT_FIELDS = ["actionPoints", "maxActionPoints", "movedFt", "approach"] as const;
export type SyncField = typeof COUNTER_FIELDS[number] | typeof COMBAT_FIELDS[number];
export type PendingEdits = Partial<Record<SyncField, { value: number | string | null; revision: number }>>;

export function recordEdits(previous: CombatSnapshot, next: CombatSnapshot, patch: Partial<CombatSnapshot>, pending: PendingEdits, revision: number): PendingEdits {
  const result = { ...pending };
  for (const field of [...COUNTER_FIELDS, ...COMBAT_FIELDS]) {
    if (field in patch && previous[field] !== next[field]) result[field] = { value: next[field], revision };
  }
  return result;
}

export function acknowledgeEdits(pending: PendingEdits, sent: PendingEdits): PendingEdits {
  const result = { ...pending };
  for (const field of [...COUNTER_FIELDS, ...COMBAT_FIELDS]) {
    if (sent[field] && result[field]?.revision === sent[field]?.revision) delete result[field];
  }
  return result;
}

export function reconcileCounters<T extends CombatSnapshot>(state: T, sheet: Partial<CombatSnapshot>, pending: PendingEdits): T {
  const next = { ...state };
  for (const field of COUNTER_FIELDS) {
    const value = sheet[field];
    if (!pending[field] && typeof value === "number") next[field] = value;
  }
  return next;
}