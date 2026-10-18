// Pure mapping between the Glyphes tabletop combat state (per token) and the
// character sheet's system_data, so the sheet fills itself from table actions
// (wounds, heroism, resilience, action points, movement) and vice versa.

import { MAX_HEROISM } from "./heroic-actions";

export const SHEET_MAX_WOUNDS = 3;

export interface CombatSnapshot {
  actionPoints: number;
  maxActionPoints: number;
  heroism: number;
  wounds: number;
  resilience: number;
  movedFt: number;
  approach: string | null;
}

/** Fields written into system_data from the tabletop state. */
export function combatToSystemData(state: CombatSnapshot): Record<string, unknown> {
  return {
    def_blessure: Math.max(0, Math.min(SHEET_MAX_WOUNDS, state.wounds)),
    heroisme: Math.max(0, state.heroism),
    def_resilience: Math.max(0, state.resilience),
    combat: {
      actionPoints: state.actionPoints,
      maxActionPoints: state.maxActionPoints,
      movedFt: state.movedFt,
      approach: state.approach,
    },
  };
}

/** Returns the patch to apply to system_data, or null when nothing changed. */
export function diffSystemData(
  current: Record<string, any> | null | undefined,
  state: CombatSnapshot,
): Record<string, unknown> | null {
  const next = combatToSystemData(state);
  const cur = current ?? {};
  const changed = Object.entries(next).some(([k, v]) => JSON.stringify(cur[k] ?? null) !== JSON.stringify(v));
  return changed ? { ...cur, ...next } : null;
}

/** Token state patch derived from a sheet edit (sheet → token). */
export function systemDataToCombat(systemData: Record<string, any> | null | undefined) {
  const patch: Partial<CombatSnapshot> = {};
  if (!systemData) return patch;
  if (typeof systemData.def_blessure === "number")
    patch.wounds = Math.max(0, Math.min(SHEET_MAX_WOUNDS, systemData.def_blessure));
  if (typeof systemData.heroisme === "number")
    patch.heroism = Math.max(0, Math.min(MAX_HEROISM, systemData.heroisme));
  if (typeof systemData.def_resilience === "number") patch.resilience = Math.max(0, systemData.def_resilience);
  return patch;
}
