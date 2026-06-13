// Multi-system registry — type definitions
//
// Chaque système de jeu (Aetheria, D&D 5e, Pathfinder 2e, etc.) expose une
// SystemDefinition décrivant TOUT ce qui est spécifique au système :
// stats, compétences, ressources, calculs, capacités UI, schéma de fiche.
//
// L'UI (fiche, formulaire, combat, codex) lit ces définitions pour s'adapter
// dynamiquement. Ajouter un système = créer un fichier dans systems/,
// l'enregistrer dans index.ts. Aucune logique métier ne doit faire
// `if (system === 'dnd5e')` dans les composants.

export type RollMode = "modifier" | "score" | "percentage";

export interface StatDef {
  /** Clé interne (ex: "FOR", "STR", "POW") */
  key: string;
  /** Libellé court affiché à l'écran */
  label: string;
  /** Libellé long (tooltip) */
  longLabel?: string;
  /** Mode d'usage : modificateur direct, score (D&D), pourcentage (CoC) */
  mode: RollMode;
  /** Valeur par défaut à la création */
  default: number;
  min: number;
  max: number;
}

export interface DefenseDef {
  key: string;
  label: string;
  /** Description courte (ex: "Classe d'armure", "Esquive") */
  hint?: string;
  default: number;
}

/** Compétence liée à une stat principale (ex: "Athlétisme" lié à FOR). */
export interface SkillDef {
  key: string;
  label: string;
  /** Clé de la stat liée (doit exister dans `stats[]`) */
  stat: string;
  /** Compétence rare ou homebrew ne s'affichant qu'au besoin */
  optional?: boolean;
}

/** Ressource consommable/regenérable (HP, Mana, PE, Sanity, slots, etc.). */
export interface ResourceDef {
  key: string;
  label: string;
  /** Description / formule humaine (ex: "1d10 + CON par niveau") */
  hint?: string;
  /** Valeur min absolue */
  min?: number;
  /** Si true : la valeur courante peut dépasser le max (ex: PV temporaires) */
  overflow?: boolean;
  /** Type d'affichage UI */
  display?: "bar" | "counter" | "slots";
}

/**
 * Contexte passé aux calculs purs. Toutes les valeurs sont optionnelles : un
 * système consomme ce qui l'intéresse.
 */
export interface CalcContext {
  level: number;
  stats: Record<string, number>;
  /** Tenue / archétype / sous-classe choisi */
  subclass?: string;
  /** Données système-spécifiques stockées dans characters.system_data */
  systemData?: Record<string, unknown>;
}

/** API de calculs purs propre à chaque système. Aucune ne doit toucher au DOM. */
export interface CalculationsAPI {
  /** Modificateur dérivé d'une stat (mod direct, (score-10)/2, etc.) */
  statModifier: (stat: StatDef, value: number) => number;
  /** PV max recommandés à la création */
  maxHp: (ctx: CalcContext) => number;
  /** Initiative par défaut */
  initiative: (ctx: CalcContext) => number;
  /** Bonus d'attaque (corps à corps par défaut) */
  attackBonus?: (ctx: CalcContext) => number;
  /** DD de sauvegarde d'un sort */
  spellSaveDC?: (ctx: CalcContext) => number;
  /** Bonus de maîtrise (D&D / PF2) */
  proficiencyBonus?: (ctx: CalcContext) => number;
}

/** Identifiant du composant React à utiliser pour la fiche. */
export type SheetComponentKey =
  | "aetheria"
  | "worlds-awakening"
  | "dnd5e"
  | "pathfinder2e"
  | "cthulhu7e"
  | "homebrew";

export interface SystemDefinition {
  id: string;
  label: string;
  shortLabel: string;
  /** Phrase d'accroche (1-2 lignes) */
  description: string;
  /** Icône lucide (string name) ou emoji */
  emoji: string;
  /** Système phare mis en avant */
  featured?: boolean;
  /** Partenaire officiel */
  partner?: boolean;
  /** Marque "homebrew / personnalisé" */
  custom?: boolean;

  /** Caractéristiques principales */
  stats: StatDef[];
  /** Défenses (CA, Def PHY, Esquive, etc.) */
  defenses: DefenseDef[];
  /** Compétences (optionnel — vide = pas de système de compétences dédié) */
  skills?: SkillDef[];
  /** Ressources consommables (HP toujours implicite, mana/PE/sanity en plus) */
  resources?: ResourceDef[];

  /** Race / Ascendance / Espèce */
  raceLabel: string;
  races: string[];
  /** Classe / Profession */
  classLabel: string;
  classes: string[];
  /** Sous-classe / Tenue / Spécialisation (optionnel) */
  subclassLabel?: string;
  subclassesByClass?: Record<string, string[]>;

  /** Monnaie */
  currency: string;
  /** Unité de vitesse */
  speedUnit: string;

  /** Formule de dés de jet par défaut pour une stat (pour affichage) */
  defaultRollHint: string;

  /** Capacités UI */
  hasSpellcasting: boolean;
  hasTenues: boolean;
  hasSanity: boolean;
  hasAlignments: boolean;

  /** Calculs purs (optionnel — fallback générique appliqué sinon) */
  calculations?: CalculationsAPI;

  /** Clé du composant React de fiche (par défaut "homebrew") */
  sheetComponent?: SheetComponentKey;
}

// ── Helpers génériques ─────────────────────────────────────────────────────

/** Modificateur générique : "modifier" → valeur, "score" → floor((v-10)/2), "percentage" → floor(v/5). */
export function genericStatModifier(stat: StatDef, value: number): number {
  switch (stat.mode) {
    case "modifier":   return value;
    case "score":      return Math.floor((value - 10) / 2);
    case "percentage": return Math.floor(value / 5);
    default:           return 0;
  }
}

/** Calculs par défaut appliqués quand un système n'en fournit pas. */
export const DEFAULT_CALCULATIONS: CalculationsAPI = {
  statModifier: genericStatModifier,
  maxHp: ({ level, stats }) => 10 + (stats.CON ?? stats.CON_MOD ?? 0) * level,
  initiative: ({ stats }) => stats.DEX ?? 0,
};
