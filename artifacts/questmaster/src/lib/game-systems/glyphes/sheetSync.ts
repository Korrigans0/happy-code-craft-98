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

/** Checkbox names of the official editable PDF sheet, left to right. */
export const PDF_BOXES = {
  wounds: ["36", "37", "Case à cocher71"],
  heroism: ["35", "26", "27", "28", "29", "31", "30", "33", "32", "34"],
} as const;

const fillBoxes = (names: readonly string[], count: number) =>
  Object.fromEntries(names.map((n, i) => [n, i < count]));
const countBoxes = (form: Record<string, any>, names: readonly string[]) =>
  names.filter((n) => !!form[n]).length;

/** Fields written into system_data from the tabletop state. */
export function combatToSystemData(state: CombatSnapshot, currentForm: Record<string, any> = {}): Record<string, unknown> {
  const wounds = Math.max(0, Math.min(SHEET_MAX_WOUNDS, state.wounds));
  return {
    pdf_form: {
      ...currentForm,
      ...fillBoxes(PDF_BOXES.wounds, wounds),
      ...fillBoxes(PDF_BOXES.heroism, Math.max(0, state.heroism)),
    },
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
  const cur = current ?? {};
  const next = combatToSystemData(state, cur.pdf_form ?? {});
  const changed = Object.entries(next).some(([k, v]) => JSON.stringify(cur[k] ?? null) !== JSON.stringify(v));
  return changed ? { ...cur, ...next } : null;
}

/** Token state patch derived from a sheet edit (sheet → token). */
export function systemDataToCombat(systemData: Record<string, any> | null | undefined) {
  const patch: Partial<Pick<CombatSnapshot, "wounds" | "heroism" | "resilience">> = {};
  if (!systemData) return patch;
  const form = systemData.pdf_form;
  if (form && typeof form === "object") {
    patch.wounds = countBoxes(form, PDF_BOXES.wounds);
    patch.heroism = Math.min(MAX_HEROISM, countBoxes(form, PDF_BOXES.heroism));
    return patch;
  }
  if (typeof systemData.def_blessure === "number")
    patch.wounds = Math.max(0, Math.min(SHEET_MAX_WOUNDS, systemData.def_blessure));
  if (typeof systemData.heroisme === "number")
    patch.heroism = Math.max(0, Math.min(MAX_HEROISM, systemData.heroisme));
  if (typeof systemData.def_resilience === "number") patch.resilience = Math.max(0, systemData.def_resilience);
  return patch;
}
