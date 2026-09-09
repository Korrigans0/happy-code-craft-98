// Glyphes V0.2 — Caractéristiques, sens, aptitudes et valeurs dérivées.
// Source : Module Coeur, ch. "Création d'un personnage" et "Aptitudes".

import { DieSize, dieSizeFromLevel } from "./dice";

export const STATS = [
  { key: "PUI", label: "Puissance", hint: "Capacités physiques, force brute, mêlée lourde." },
  { key: "SOU", label: "Souplesse", hint: "Dextérité, agilité, finesse, armes légères et distance." },
  { key: "CON", label: "Constitution", hint: "Endurance, poisons, maladies, aléas physiques." },
  { key: "FOI", label: "Foi", hint: "Engagement, confiance en soi, courage, moral." },
  { key: "ESP", label: "Esprit", hint: "Intellect, robustesse de l'âme, évocation." },
  { key: "SOC", label: "Social", hint: "Tromperie, charme, persuasion, marchandage." },
] as const;

export type StatKey = (typeof STATS)[number]["key"];

export const SENSES = ["Vue", "Ouïe", "Instinct", "Flux"] as const;
export type SenseKey = (typeof SENSES)[number];

/** Résilience de départ d'un personnage créé (Module Coeur). */
export const BASE_RESILIENCE = 4;

/** Points de corps / d'âme et héroïsme sont plafonnés à 5. */
export const MAX_BODY = 5;
export const MAX_SOUL = 5;

/** Niveaux d'aptitude : 1 partout à la création, 5 niveaux à répartir, max 3
 *  à la création puis 5 en progression. */
export const APTITUDE_START_LEVEL = 1;
export const APTITUDE_POINTS_AT_CREATION = 5;
export const APTITUDE_MAX_AT_CREATION = 3;
export const APTITUDE_MAX = 5;

export interface AptitudeDef {
  key: string;
  label: string;
  group: string;
  /** Caractéristiques ou sens utilisables pour la taille du dé. */
  stats: string[];
}

export const APTITUDES: AptitudeDef[] = [
  // Martiales
  { key: "armes-legeres-melee", label: "Armes légères de mêlée", group: "Martiales", stats: ["SOU", "PUI"] },
  { key: "armes-lourdes-melee", label: "Armes lourdes de mêlée", group: "Martiales", stats: ["PUI"] },
  { key: "armes-legeres-distance", label: "Armes légères à distance", group: "Martiales", stats: ["SOU"] },
  { key: "armes-lourdes-distance", label: "Armes lourdes à distance", group: "Martiales", stats: ["SOU"] },
  { key: "pugilat", label: "Pugilat", group: "Martiales", stats: ["SOU", "PUI"] },
  { key: "armes-de-jet", label: "Armes de jet", group: "Martiales", stats: ["SOU", "PUI"] },
  // Furtivité et infiltration
  { key: "camouflage", label: "Camouflage", group: "Furtivité et infiltration", stats: ["SOU"] },
  { key: "main-legere", label: "Main légère", group: "Furtivité et infiltration", stats: ["SOU"] },
  // Foi
  { key: "courageux", label: "Courageux", group: "Foi", stats: ["FOI"] },
  // Évocation
  { key: "forge-glyphe", label: "Forge-glyphe", group: "Évocation", stats: ["Flux"] },
  // Physique
  { key: "athletique", label: "Athlétique", group: "Physique", stats: ["PUI"] },
  { key: "pied-leger", label: "Pied léger", group: "Physique", stats: ["SOU"] },
  { key: "sang-pourri", label: "Sang pourri", group: "Physique", stats: ["CON"] },
  // Survie et récupération
  { key: "medecin", label: "Médecin", group: "Survie et récupération", stats: ["ESP", "SOU"] },
  { key: "scout", label: "Scout", group: "Survie et récupération", stats: ["Instinct"] },
  { key: "vigilant", label: "Vigilant", group: "Survie et récupération", stats: ["Vue", "Ouïe", "Instinct", "Flux"] },
  // Création
  { key: "alchimiste", label: "Alchimiste", group: "Création", stats: ["ESP", "SOU"] },
  { key: "ingenieur", label: "Ingénieur", group: "Création", stats: ["ESP", "SOU"] },
  // Connaissances
  { key: "botanique", label: "Botanique", group: "Connaissances", stats: ["ESP"] },
  { key: "deduction", label: "Déduction", group: "Connaissances", stats: ["ESP"] },
  { key: "erudition", label: "Érudition", group: "Connaissances", stats: ["FOI", "ESP"] },
  { key: "traqueur", label: "Traqueur", group: "Connaissances", stats: ["ESP"] },
  // Social
  { key: "charme", label: "Charme", group: "Social", stats: ["SOC", "SOU"] },
  { key: "intimidation", label: "Intimidation", group: "Social", stats: ["SOC", "PUI"] },
  { key: "negociateur", label: "Négociateur", group: "Social", stats: ["SOC", "ESP"] },
  { key: "persuasion", label: "Persuasion", group: "Social", stats: ["SOC", "ESP", "FOI"] },
  { key: "tromperie", label: "Tromperie", group: "Social", stats: ["SOC", "ESP"] },
];

export const APTITUDE_GROUPS = Array.from(new Set(APTITUDES.map((a) => a.group)));

export function getAptitude(key: string): AptitudeDef | undefined {
  return APTITUDES.find((a) => a.key === key);
}

/** Aptitudes sociales utilisables lors d'un parlementer. */
export const PARLEY_APTITUDES = ["charme", "intimidation", "negociateur", "persuasion", "tromperie"];
/** Aptitudes martiales utilisables lors d'un guerroyer. */
export const WAR_APTITUDES = [
  "armes-legeres-melee",
  "armes-lourdes-melee",
  "armes-legeres-distance",
  "armes-lourdes-distance",
  "pugilat",
  "armes-de-jet",
];

/** Niveaux de dé (1 = D4 … 5 = D12) indexés par caractéristique. */
export type StatLevels = Record<string, number>;

/** Sens dérivés des caractéristiques (Module Coeur). */
export function deriveSenses(stats: StatLevels): Record<SenseKey, number> {
  const esp = stats.ESP ?? 1;
  const con = stats.CON ?? 1;
  const foi = stats.FOI ?? 1;
  return {
    Vue: Math.min(esp, con),
    Ouïe: Math.min(esp, con),
    Instinct: Math.min(esp, foi),
    Flux: Math.max(1, esp - 1),
  };
}

/** Tempête spirituelle : autant de stades que le score max du dé d'Esprit. */
export function spiritualStormMax(stats: StatLevels): number {
  return dieSizeFromLevel(stats.ESP ?? 1);
}

/** Emplacements d'encombrement transportables : score max du dé de PUI. */
export function carryCapacity(stats: StatLevels): number {
  return dieSizeFromLevel(stats.PUI ?? 1);
}

/** Taille de dé utilisée par une aptitude donnée, selon la caractéristique choisie. */
export function aptitudeDieSize(stats: StatLevels, statKey: string): DieSize {
  const senses = deriveSenses(stats);
  const level =
    (stats as Record<string, number>)[statKey] ??
    (senses as Record<string, number>)[statKey] ??
    1;
  return dieSizeFromLevel(level);
}

export interface GlyphesDerived {
  senses: Record<SenseKey, number>;
  resilience: number;
  tempeteMax: number;
  carry: number;
}

export function deriveGlyphesCharacter(opts: {
  stats: StatLevels;
  resilience?: number;
}): GlyphesDerived {
  return {
    senses: deriveSenses(opts.stats),
    resilience: opts.resilience ?? BASE_RESILIENCE,
    tempeteMax: spiritualStormMax(opts.stats),
    carry: carryCapacity(opts.stats),
  };
}
