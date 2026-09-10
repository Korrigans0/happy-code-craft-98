// Glyphes V0.2 — Héroïsme et actions héroïques.
// Sources : Module Coeur ch. "Actions Héroïques" (générales, sociales,
// tactiques, de survie) et Module Nouvel Empire ch. "S'armer et se protéger"
// (offensives martiales et défensives).

export const MAX_HEROISM = 5;

/** Récompense d'héroïsme lors d'une victoire en confrontation. */
export const VICTORY_HEROISM = 5;

export type HeroicCategory = "sociale" | "tactique" | "survie" | "offensive" | "defensive";

/** Annotations de compatibilité : Le/Lo/Di/Me (armes), Le/In/Lo/Bou (protections). */
export type HeroicTag =
  | "arme-legere"
  | "arme-lourde"
  | "distance"
  | "melee"
  | "armure-legere"
  | "armure-intermediaire"
  | "armure-lourde"
  | "bouclier";

export interface HeroicAction {
  id: string;
  name: string;
  category: HeroicCategory;
  /** Coût en points d'héroïsme (minimum si l'action est cumulable). */
  cost: number;
  /** Le coût est un minimum, l'action peut être renforcée. */
  costIsMinimum?: boolean;
  /** Coût variable "moitié du TD" (actions sociales). */
  costFormula?: "moitie-td";
  tags: HeroicTag[];
  description: string;
  source: "Module Coeur" | "Nouvel Empire";
}

export const HEROIC_ACTIONS: HeroicAction[] = [
  // ── Sociales ────────────────────────────────────────────────────────────
  {
    id: "charme-divin",
    name: "Charme divin",
    category: "sociale",
    cost: 2,
    costIsMinimum: true,
    costFormula: "moitie-td",
    tags: [],
    description:
      "Lors d'une épreuve pour charmer ou séduire, dépenser la moitié du TD en héroïsme garantit une réussite.",
    source: "Module Coeur",
  },
  {
    id: "persuasion-surnaturelle",
    name: "Persuasion surnaturelle",
    category: "sociale",
    cost: 2,
    costIsMinimum: true,
    costFormula: "moitie-td",
    tags: [],
    description: "Épreuve de persuasion : la moitié du TD en héroïsme garantit une réussite.",
    source: "Module Coeur",
  },
  {
    id: "presence-menacante",
    name: "Présence menaçante",
    category: "sociale",
    cost: 2,
    costIsMinimum: true,
    costFormula: "moitie-td",
    tags: [],
    description: "Épreuve d'intimidation : la moitié du TD en héroïsme garantit une réussite.",
    source: "Module Coeur",
  },
  {
    id: "langue-de-velours",
    name: "Langue de velours",
    category: "sociale",
    cost: 2,
    costIsMinimum: true,
    costFormula: "moitie-td",
    tags: [],
    description: "Épreuve pour duper ou escroquer : la moitié du TD en héroïsme garantit une réussite.",
    source: "Module Coeur",
  },
  {
    id: "compromis-accablant",
    name: "Compromis accablant",
    category: "sociale",
    cost: 2,
    costIsMinimum: true,
    costFormula: "moitie-td",
    tags: [],
    description: "Épreuve de marchandage ou de négociation : la moitié du TD garantit une réussite.",
    source: "Module Coeur",
  },

  // ── Tactiques ───────────────────────────────────────────────────────────
  {
    id: "vitesse-monstrueuse",
    name: "Vitesse monstrueuse",
    category: "tactique",
    cost: 2,
    tags: [],
    description:
      "+10 ft de vitesse pendant le tour et réussite automatique des épreuves de désengagement.",
    source: "Module Coeur",
  },
  {
    id: "a-couvert",
    name: "À couvert !",
    category: "tactique",
    cost: 1,
    costIsMinimum: true,
    tags: [],
    description:
      "Face à une attaque à distance : 1 point par allié prévenu ; chaque allié peut dépenser 2 points pour augmenter sa couverture jusqu'à la fin du tour.",
    source: "Module Coeur",
  },
  {
    id: "cri-de-ralliement",
    name: "Cri de ralliement",
    category: "tactique",
    cost: 4,
    tags: [],
    description:
      "Les alliés à 50 ft peuvent relancer leur épreuve d'ordre de jeu avec une supériorité.",
    source: "Module Coeur",
  },
  {
    id: "chargez",
    name: "Chargez !",
    category: "tactique",
    cost: 1,
    costIsMinimum: true,
    tags: [],
    description:
      "1 point par allié emmené ; chaque point dépensé par un allié lui fait parcourir 15 ft puis autorise une action de guerroyer (coût en points d'action normal).",
    source: "Module Coeur",
  },
  {
    id: "charge-heroique",
    name: "Charge héroïque",
    category: "tactique",
    cost: 3,
    tags: [],
    description: "Tous les bonus d'une charge, et les 15 premiers ft ne coûtent aucun point d'action.",
    source: "Module Coeur",
  },

  // ── Survie ──────────────────────────────────────────────────────────────
  {
    id: "serrer-les-dents",
    name: "Serrer les dents",
    category: "survie",
    cost: 2,
    costIsMinimum: true,
    tags: [],
    description:
      "Hors surprise : annule une réussite de l'épreuve qui vise le personnage par tranche de 2 points dépensés.",
    source: "Module Coeur",
  },
  {
    id: "plein-de-ressources",
    name: "Plein de ressources",
    category: "survie",
    cost: 2,
    costIsMinimum: true,
    costFormula: "moitie-td",
    tags: [],
    description:
      "Épreuves de Scout, traque, récolte ou survie : la moitié du TD garantit une réussite à la créature choisie.",
    source: "Module Coeur",
  },

  // ── Offensives martiales (Nouvel Empire) ────────────────────────────────
  {
    id: "frappe-devastatrice",
    name: "Frappe dévastatrice",
    category: "offensive",
    cost: 2,
    costIsMinimum: true,
    tags: ["arme-lourde", "melee"],
    description: "Ajoute 1D supplémentaire à l'attaque par tranche de 2 points dépensés.",
    source: "Nouvel Empire",
  },
  {
    id: "tir-traversant",
    name: "Tir traversant",
    category: "offensive",
    cost: 2,
    tags: ["arme-lourde", "distance"],
    description:
      "Ajoute 1D à l'attaque ; en cas de succès, le projectile traverse et attaque la créature suivante avec un dé de moins.",
    source: "Nouvel Empire",
  },
  {
    id: "sentinelle",
    name: "Sentinelle",
    category: "offensive",
    cost: 2,
    tags: ["arme-legere", "arme-lourde", "distance"],
    description:
      "Si le personnage n'a pas utilisé son déplacement, il tire sur une créature en mouvement pour un seul point d'action.",
    source: "Nouvel Empire",
  },
  {
    id: "estourbir",
    name: "Estourbir",
    category: "offensive",
    cost: 2,
    costIsMinimum: true,
    tags: ["arme-legere", "arme-lourde", "melee"],
    description: "La prochaine action de la cible perd 1D par tranche de 2 points dépensés.",
    source: "Nouvel Empire",
  },
  {
    id: "riposte-insaisissable",
    name: "Riposte insaisissable",
    category: "offensive",
    cost: 3,
    tags: ["arme-legere", "distance", "melee"],
    description: "Après une esquive réussie, le personnage inflige une riposte à son adversaire.",
    source: "Nouvel Empire",
  },

  // ── Défensives (Nouvel Empire) ──────────────────────────────────────────
  {
    id: "levee-de-bouclier",
    name: "Levée de bouclier",
    category: "defensive",
    cost: 2,
    costIsMinimum: true,
    tags: ["bouclier"],
    description:
      "2 points annulent une réussite obtenue contre le porteur ; plusieurs réussites d'une même source peuvent être annulées.",
    source: "Nouvel Empire",
  },
  {
    id: "esquive",
    name: "Esquive",
    category: "defensive",
    cost: 2,
    costIsMinimum: true,
    tags: ["armure-legere", "armure-intermediaire", "armure-lourde"],
    description:
      "Lance les dés d'esquive ; chaque dé annule un dé adverse de valeur égale ou inférieure. +1D par 2 points supplémentaires.",
    source: "Nouvel Empire",
  },
];

export interface LoadoutContext {
  weaponWeight?: "legere" | "lourde" | null;
  weaponRange?: "melee" | "distance" | "jet" | null;
  armor?: "aucune" | "legere" | "intermediaire" | "lourde";
  hasShield?: boolean;
}

/** Une action héroïque est-elle compatible avec l'équipement porté ? */
export function isHeroicActionAvailable(action: HeroicAction, ctx: LoadoutContext): boolean {
  if (action.tags.length === 0) return true;

  const weaponTags = action.tags.filter((t) => t.startsWith("arme-"));
  const rangeTags = action.tags.filter((t) => t === "melee" || t === "distance");
  const armorTags = action.tags.filter((t) => t.startsWith("armure-"));
  const needsShield = action.tags.includes("bouclier");

  if (needsShield && !ctx.hasShield) return false;

  if (weaponTags.length > 0) {
    const w = ctx.weaponWeight ? `arme-${ctx.weaponWeight}` : null;
    if (!w || !weaponTags.includes(w as HeroicTag)) return false;
  }
  if (rangeTags.length > 0) {
    const r: HeroicTag | null =
      ctx.weaponRange === "jet" || ctx.weaponRange === "distance"
        ? "distance"
        : ctx.weaponRange === "melee"
          ? "melee"
          : null;
    if (!r || !rangeTags.includes(r)) return false;
  }
  if (armorTags.length > 0) {
    const a = ctx.armor && ctx.armor !== "aucune" ? `armure-${ctx.armor}` : null;
    // Sans armure, l'esquive reste possible (2D d'esquive supplémentaires).
    if (!a) return action.id === "esquive";
    if (!armorTags.includes(a as HeroicTag)) return false;
  }
  return true;
}

export function availableHeroicActions(ctx: LoadoutContext, heroism: number): HeroicAction[] {
  return HEROIC_ACTIONS.filter(
    (a) => isHeroicActionAvailable(a, ctx) && a.cost <= Math.max(0, heroism),
  );
}

/** Coût d'une réussite garantie : moitié du TD (arrondi au supérieur). */
export function guaranteedSuccessCost(tdMinScore: number): number {
  return Math.max(2, Math.ceil(tdMinScore / 2));
}

export function canSpendHeroism(current: number, cost: number): boolean {
  return cost > 0 && cost <= current;
}

export function gainHeroism(current: number, amount: number, spentThisTurn: boolean): number {
  if (spentThisTurn) return current; // impossible de gagner un point le tour d'une dépense
  return Math.min(MAX_HEROISM, current + Math.max(0, amount));
}
