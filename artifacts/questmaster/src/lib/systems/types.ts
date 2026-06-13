// Multi-system registry — type definitions
//
// Chaque système de jeu (Aetheria, D&D 5e, Pathfinder 2e, etc.) expose une
// SystemDefinition décrivant ses stats, races, classes et règles de jet.
// L'UI (fiche, formulaire, combat) lit ces définitions pour s'adapter
// dynamiquement au système actif d'un personnage ou d'une campagne.

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
}
