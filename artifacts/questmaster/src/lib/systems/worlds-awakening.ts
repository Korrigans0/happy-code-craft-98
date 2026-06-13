import type { SystemDefinition } from "./types";
import { WA_ASCENDANCES, WA_CLASSES, WA_TENUES } from "../wa-data";

// Worlds Awakening — système partenaire (mécaniques identiques à Aetheria en v1).
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
};
