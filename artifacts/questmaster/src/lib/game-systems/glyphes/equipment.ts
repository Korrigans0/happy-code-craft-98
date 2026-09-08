// Glyphes V0.2 — Armes, armures et protection (Module Nouvel Empire,
// ch. "S'armer et se protéger").

export type WeaponWeight = "legere" | "lourde";
export type WeaponRange = "melee" | "distance" | "jet";

export interface GlyphesWeapon {
  id: string;
  name: string;
  weight: WeaponWeight;
  range: WeaponRange;
  /** Caractéristiques utilisables (lourde mêlée = PUI, légère = PUI ou SOU…). */
  stats: string[];
  /** Portée en ft (légère 50 ft, lourde 100 ft à distance). */
  rangeFt?: number;
  /** Aptitude martiale associée (clé dans APTITUDES). */
  aptitude: string;
}

/** Catégories d'armes décrites par le module (pas de liste de prix officielle). */
export const WEAPON_CATEGORIES: GlyphesWeapon[] = [
  { id: "melee-legere", name: "Arme légère de mêlée", weight: "legere", range: "melee", stats: ["SOU", "PUI"], aptitude: "armes-legeres-melee" },
  { id: "melee-lourde", name: "Arme lourde de mêlée", weight: "lourde", range: "melee", stats: ["PUI"], aptitude: "armes-lourdes-melee" },
  { id: "distance-legere", name: "Arme légère à distance", weight: "legere", range: "distance", stats: ["SOU"], rangeFt: 50, aptitude: "armes-legeres-distance" },
  { id: "distance-lourde", name: "Arme lourde à distance", weight: "lourde", range: "distance", stats: ["SOU"], rangeFt: 100, aptitude: "armes-lourdes-distance" },
  { id: "jet", name: "Arme de jet", weight: "legere", range: "jet", stats: ["SOU", "PUI"], rangeFt: 50, aptitude: "armes-de-jet" },
  { id: "pugilat", name: "Pugilat (mains nues)", weight: "legere", range: "melee", stats: ["SOU", "PUI"], aptitude: "pugilat" },
];

export type ArmorCategory = "aucune" | "legere" | "intermediaire" | "lourde";

export interface ArmorProfile {
  key: ArmorCategory;
  label: string;
  /** Taux de protection = réussites nécessaires pour blesser le porteur. */
  protection: number;
  /** Dés d'esquive apportés (ou retirés) par l'armure. */
  dodgeDice: number;
  /** Emplacements d'encombrement occupés (module Nouvel Empire). */
  bulk: number;
  hint: string;
}

export const ARMORS: ArmorProfile[] = [
  {
    key: "aucune",
    label: "Sans armure",
    protection: 0,
    dodgeDice: 2,
    bulk: 0,
    hint: "Reçoit autant de blessures que de réussites obtenues. +2D d'esquive.",
  },
  {
    key: "legere",
    label: "Armure légère",
    protection: 1,
    dodgeDice: 1,
    bulk: 0,
    hint: "Une seule blessure à la fois. +1D d'esquive.",
  },
  {
    key: "intermediaire",
    label: "Armure intermédiaire",
    protection: 2,
    dodgeDice: 0,
    bulk: 1,
    hint: "Équilibre protection / mobilité.",
  },
  {
    key: "lourde",
    label: "Armure lourde",
    protection: 3,
    dodgeDice: -2,
    bulk: 2,
    hint: "Absorbe les chocs les plus violents. −2D d'esquive.",
  },
];

export function getArmor(key: ArmorCategory | string | undefined): ArmorProfile {
  return ARMORS.find((a) => a.key === key) ?? ARMORS[0];
}

/** Couverture face aux attaques à distance (bonus de protection). */
export type CoverKey = "aucun" | "leger" | "intermediaire" | "complet";

export const COVERS: { key: CoverKey; label: string; protectionBonus: number; blocks?: boolean }[] = [
  { key: "aucun", label: "À découvert", protectionBonus: 0 },
  { key: "leger", label: "Couvert léger", protectionBonus: 1 },
  { key: "intermediaire", label: "Couvert intermédiaire", protectionBonus: 2 },
  { key: "complet", label: "Couvert complet", protectionBonus: 0, blocks: true },
];

export function getCover(key: CoverKey | string | undefined) {
  return COVERS.find((c) => c.key === key) ?? COVERS[0];
}

/**
 * Taux de protection effectif d'une cible : armure + couvert (+ bonus divers).
 * C'est le RANG de difficulté de l'épreuve d'attaque.
 */
export function effectiveProtection(opts: {
  armor: ArmorCategory | string | undefined;
  cover?: CoverKey | string;
  bonus?: number;
}): number {
  return (
    getArmor(opts.armor).protection + getCover(opts.cover).protectionBonus + (opts.bonus ?? 0)
  );
}

/**
 * Dés d'esquive d'une créature.
 * ⚠️ RÈGLE NON DÉFINIE DANS LES DOCUMENTS : les PDF ne précisent pas de pool
 * d'esquive de base hors modificateurs d'armure. Le VTT utilise donc un socle
 * paramétrable (par défaut le niveau d'aptitude choisi par le MJ, 1 minimum)
 * auquel s'ajoutent les dés d'armure. À ajuster dès que la règle est publiée.
 */
export const DODGE_BASE_UNDEFINED = true;

export function dodgeDicePool(opts: {
  armor: ArmorCategory | string | undefined;
  /** Socle défini par le MJ / la fiche (aptitude ou valeur maison). */
  base?: number;
  /** Dés supplémentaires payés 2 points d'héroïsme pièce. */
  heroismDice?: number;
  /** Malus d'encombrement, états… */
  penalty?: number;
}): number {
  const base = opts.base ?? 1;
  return base + getArmor(opts.armor).dodgeDice + (opts.heroismDice ?? 0) - (opts.penalty ?? 0);
}
