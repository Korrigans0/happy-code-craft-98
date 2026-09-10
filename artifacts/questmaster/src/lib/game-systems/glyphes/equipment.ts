// Glyphes V0.2 — Armes, armures, boucliers et objets de qualité.
// Source : Module Nouvel Empire, ch. "S'armer et se protéger" / "Objets de qualité".

export type WeaponWeight = "legere" | "lourde";
export type WeaponRange = "melee" | "distance" | "jet";

export interface WeaponProfile {
  id: string;
  name: string;
  weight: WeaponWeight;
  range: WeaponRange;
  /** Caractéristiques utilisables pour la taille du dé. */
  stats: string[];
  /** Portée en pieds (armes à distance / de jet). */
  rangeFt?: number;
  hint: string;
}

/** Portées officielles : armes légères 50 ft, armes lourdes 100 ft. */
export const RANGE_LIGHT_FT = 50;
export const RANGE_HEAVY_FT = 100;

export const WEAPON_CATEGORIES: WeaponProfile[] = [
  {
    id: "melee-legere",
    name: "Arme légère de mêlée",
    weight: "legere",
    range: "melee",
    stats: ["PUI", "SOU"],
    hint: "Tenue à une main, rapide et précise. Épée courte, dague, rapière, masse à une main.",
  },
  {
    id: "melee-lourde",
    name: "Arme lourde de mêlée",
    weight: "lourde",
    range: "melee",
    stats: ["PUI"],
    hint: "Deux mains, destructrice. Épée à deux mains, hallebarde, hache lourde, marteau de guerre.",
  },
  {
    id: "distance-legere",
    name: "Arme légère à distance",
    weight: "legere",
    range: "distance",
    stats: ["SOU"],
    rangeFt: RANGE_LIGHT_FT,
    hint: "Portée 50 ft.",
  },
  {
    id: "distance-lourde",
    name: "Arme lourde à distance",
    weight: "lourde",
    range: "distance",
    stats: ["SOU"],
    rangeFt: RANGE_HEAVY_FT,
    hint: "Portée 100 ft.",
  },
  {
    id: "jet",
    name: "Arme de jet",
    weight: "legere",
    range: "jet",
    stats: ["PUI", "SOU"],
    rangeFt: RANGE_LIGHT_FT,
    hint: "Doit être légère et reste inefficace à la mêlée.",
  },
  {
    id: "pugilat",
    name: "Mains nues (pugilat)",
    weight: "legere",
    range: "melee",
    stats: ["PUI", "SOU"],
    hint: "Combat à mains nues.",
  },
];

export function getWeaponCategory(id: string | undefined): WeaponProfile {
  return WEAPON_CATEGORIES.find((w) => w.id === id) ?? WEAPON_CATEGORIES[0];
}

// ── Armures ───────────────────────────────────────────────────────────────

export type ArmorCategory = "aucune" | "legere" | "intermediaire" | "lourde";

export interface ArmorProfile {
  key: ArmorCategory;
  label: string;
  /** Taux de protection = réussites nécessaires pour infliger une blessure. */
  protection: number;
  /** Modificateur au pool d'esquive (en dés). */
  dodgeDice: number;
  /** Emplacements d'encombrement occupés. */
  encumbrance: number;
  hint: string;
}

export const ARMORS: ArmorProfile[] = [
  {
    key: "aucune",
    label: "Sans armure",
    protection: 0,
    dodgeDice: 2,
    encumbrance: 0,
    hint: "Autant de blessures que de réussites obtenues, mais +2D d'esquive.",
  },
  {
    key: "legere",
    label: "Armure légère",
    protection: 1,
    dodgeDice: 1,
    encumbrance: 1,
    hint: "Aucune réelle protection, mais une seule blessure à la fois. +1D d'esquive.",
  },
  {
    key: "intermediaire",
    label: "Armure intermédiaire",
    protection: 2,
    dodgeDice: 0,
    encumbrance: 1,
    hint: "Équilibre entre protection et mouvement.",
  },
  {
    key: "lourde",
    label: "Armure lourde",
    protection: 3,
    dodgeDice: -2,
    encumbrance: 2,
    hint: "Absorbe les chocs les plus violents, mais réduit l'esquive de 2D.",
  },
];

export function getArmor(key: ArmorCategory | string | undefined): ArmorProfile {
  return ARMORS.find((a) => a.key === key) ?? ARMORS[0];
}

/**
 * Armure en fer-argent (objet légendaire) : protection 3 mais considérée
 * comme une armure intermédiaire pour les malus.
 */
export const FER_ARGENT: ArmorProfile = {
  key: "intermediaire",
  label: "Armure en fer-argent",
  protection: 3,
  dodgeDice: 0,
  encumbrance: 1,
  hint: "Protection d'une armure lourde sans en subir les malus (800 Argent).",
};

// ── Boucliers ─────────────────────────────────────────────────────────────

/** Le bouclier ne protège que de manière active (action héroïque Levée de bouclier). */
export const SHIELD_HEROIC_COST = 2;

// ── Esquive ───────────────────────────────────────────────────────────────

/**
 * ⚠️ RÈGLE NON DÉFINIE DANS LES DOCUMENTS
 * Les modules précisent les dés d'esquive *supplémentaires* accordés par
 * l'armure (+2D sans armure, +1D légère, 0 intermédiaire, −2D lourde) et le
 * dé additionnel achetable pour 2 points d'héroïsme, mais jamais le pool
 * d'esquive de base. Valeur paramétrable en attendant une règle officielle.
 */
export const BASE_DODGE_DICE = 0;
export const DODGE_RULE_UNDEFINED =
  "⚠️ Règle non définie dans les documents Glyphes V0.2 : le pool d'esquive de base n'est pas précisé. Valeur paramétrable par le MJ.";

/** Dés d'esquive disponibles : base + bonus d'armure + encombrement + héroïsme. */
export function dodgeDicePool(opts: {
  armor?: ArmorCategory | string;
  baseDice?: number;
  /** Objets encombrants portés : −1D d'esquive par objet. */
  bulkyItems?: number;
  /** Dés achetés à 2 points d'héroïsme chacun. */
  heroismDice?: number;
  /** Bonus d'aptitude ou d'objet de qualité. */
  bonusDice?: number;
}): number {
  const armor = getArmor(opts.armor);
  const base = opts.baseDice ?? BASE_DODGE_DICE;
  return (
    base +
    armor.dodgeDice -
    Math.max(0, opts.bulkyItems ?? 0) +
    Math.max(0, opts.heroismDice ?? 0) +
    (opts.bonusDice ?? 0)
  );
}

// ── Objets de qualité ─────────────────────────────────────────────────────

/** Un objet de qualité octroie des dés supplémentaires aux épreuves concernées. */
export interface QualityItem {
  id: string;
  name: string;
  bonusDice: number;
  scope: string;
  price?: string;
}

export const QUALITY_ITEMS: QualityItem[] = [
  { id: "arme-artisan", name: "Arme d'artisan renommé", bonusDice: 1, scope: "Épreuves d'attaque avec cette arme", price: "60 Argent" },
  { id: "armure-fer-argent", name: "Armure en fer-argent", bonusDice: 0, scope: "Protection 3, malus d'armure intermédiaire", price: "800 Argent" },
];
