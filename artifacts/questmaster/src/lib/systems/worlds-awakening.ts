import type { SystemDefinition, CalculationsAPI } from "./types";
import { genericStatModifier } from "./types";
import { WA_ASCENDANCES, WA_CLASSES, WA_TENUES } from "../wa-data";

// Worlds Awakening — système partenaire. Mécaniques identiques à Aetheria en v1
// mais fiche dédiée (codex/univers distincts).
const calculations: CalculationsAPI = {
  statModifier: genericStatModifier,
  maxHp: ({ level, stats }) => 10 + (stats.CON ?? 0) * Math.max(1, level),
  initiative: ({ stats }) => stats.DEX ?? 0,
  attackBonus: ({ stats }) => stats.FOR ?? 0,
};

export const WA_SYSTEM: SystemDefinition = {
  id: "Worlds Awakening",
  label: "Worlds Awakening",
  shortLabel: "WA",
  description: "Système partenaire. Ascendances, tenues et bestiaire issus de l'univers Worlds Awakening.",
  emoji: "🌍",
  partner: true,
  stats: [
    { key: "FOR", label: "FOR", longLabel: "Force",        mode: "modifier", default: 0, min: -5, max: 10 },
    { key: "DEX", label: "DEX", longLabel: "Dextérité",    mode: "modifier", default: 0, min: -5, max: 10 },
    { key: "CON", label: "CON", longLabel: "Constitution", mode: "modifier", default: 0, min: -5, max: 10 },
    { key: "INT", label: "INT", longLabel: "Intelligence", mode: "modifier", default: 0, min: -5, max: 10 },
    { key: "SAG", label: "SAG", longLabel: "Sagesse",      mode: "modifier", default: 0, min: -5, max: 10 },
    { key: "CHA", label: "CHA", longLabel: "Charisme",     mode: "modifier", default: 0, min: -5, max: 10 },
  ],
  defenses: [
    { key: "phy_def", label: "Déf. PHY", hint: "Défense physique", default: 10 },
    { key: "mag_def", label: "Déf. MAG", hint: "Défense magique", default: 10 },
  ],
  resources: [
    { key: "hp", label: "PV", display: "bar", min: 0 },
    { key: "pe", label: "PE", hint: "Points d'énergie", display: "bar", min: 0 },
  ],
  skills: [
    { key: "athletisme", label: "Athlétisme",   stat: "FOR" },
    { key: "discretion", label: "Discrétion",   stat: "DEX" },
    { key: "perception", label: "Perception",   stat: "SAG" },
    { key: "persuasion", label: "Persuasion",   stat: "CHA" },
  ],
  raceLabel: "Ascendance",
  races: WA_ASCENDANCES,
  classLabel: "Classe",
  classes: WA_CLASSES,
  subclassLabel: "Tenue",
  subclassesByClass: WA_TENUES,
  currency: "NX",
  speedUnit: "m",
  defaultRollHint: "1d20 + mod",
  hasSpellcasting: false,
  hasTenues: true,
  hasSanity: false,
  hasAlignments: false,
  calculations,
  sheetComponent: "worlds-awakening",
};
