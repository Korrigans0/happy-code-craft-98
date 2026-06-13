import type { SystemDefinition } from "./types";
import { WA_ASCENDANCES, WA_CLASSES, WA_TENUES } from "../game-systems";

// Aetheria — système phare maison. Stats en modificateur, défense PHY/MAG, monnaie NX.
export const AETHERIA_SYSTEM: SystemDefinition = {
  id: "Aetheria",
  label: "Aetheria",
  shortLabel: "AE",
  description: "Le système natif d'Aetheria VTT. Modificateurs, ascendances et tenues, défense PHY/MAG.",
  emoji: "⚔️",
  featured: true,
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
