// Macros — types partagés (système multi-univers).

export type MacroActionType = "roll" | "text";

export interface MacroRollAction {
  type: "roll";
  /** Libellé de l'étape (ex: "Attaque", "Dégâts") */
  label?: string;
  /** Formule brute, ex: "1d20+{FOR}" */
  formula: string;
}

export interface MacroTextAction {
  type: "text";
  /** Texte affiché dans le chat (ex: description du sort) */
  content: string;
}

export type MacroAction = MacroRollAction | MacroTextAction;

export interface Macro {
  id: string;
  owner_user_id: string;
  campaign_id: string | null;
  character_id: string | null;
  system: string;
  name: string;
  category: string;
  icon: string | null;
  color: string | null;
  actions: MacroAction[];
  is_shared: boolean;
  is_private_roll: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type MacroDraft = Omit<
  Macro,
  "id" | "owner_user_id" | "created_at" | "updated_at"
>;

export const MACRO_CATEGORIES = [
  "Attaques",
  "Sorts",
  "Compétences",
  "Défense",
  "Général",
] as const;

export const MACRO_COLORS = [
  { key: "amber", label: "Or", class: "border-amber-500/50 bg-amber-500/15 text-amber-300" },
  { key: "red", label: "Sang", class: "border-red-500/50 bg-red-500/15 text-red-300" },
  { key: "blue", label: "Azur", class: "border-sky-500/50 bg-sky-500/15 text-sky-300" },
  { key: "green", label: "Sylve", class: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" },
  { key: "violet", label: "Arcane", class: "border-violet-500/50 bg-violet-500/15 text-violet-300" },
  { key: "slate", label: "Acier", class: "border-slate-400/50 bg-slate-400/15 text-slate-200" },
] as const;

export function macroColorClass(color?: string | null): string {
  return (
    MACRO_COLORS.find((c) => c.key === color)?.class ??
    "border-amber-500/30 bg-card/70 text-foreground"
  );
}
