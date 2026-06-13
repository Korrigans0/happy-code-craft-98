import type { SystemDefinition, CalculationsAPI } from "./types";
import { genericStatModifier } from "./types";

// Homebrew / Personnalisé — squelette générique.
// Le MJ peut redéfinir stats, ressources, compétences via characters.system_data.
// Sert également de base aux futurs systèmes créés par la communauté.
const calculations: CalculationsAPI = {
  statModifier: genericStatModifier,
  maxHp: ({ level, stats }) => 10 + (stats.CON ?? 0) * Math.max(1, level),
  initiative: ({ stats }) => stats.DEX ?? 0,
};

export const CUSTOM_SYSTEM: SystemDefinition = {
  id: "Personnalisé",
  label: "Personnalisé / Homebrew",
  shortLabel: "✦",
  description: "Système libre. Définissez vos propres stats, ressources, compétences et règles maison.",
  emoji: "✨",
  custom: true,
  stats: [
    { key: "FOR", label: "FOR", mode: "modifier", default: 0, min: -10, max: 20 },
    { key: "DEX", label: "DEX", mode: "modifier", default: 0, min: -10, max: 20 },
    { key: "CON", label: "CON", mode: "modifier", default: 0, min: -10, max: 20 },
    { key: "INT", label: "INT", mode: "modifier", default: 0, min: -10, max: 20 },
    { key: "SAG", label: "SAG", mode: "modifier", default: 0, min: -10, max: 20 },
    { key: "CHA", label: "CHA", mode: "modifier", default: 0, min: -10, max: 20 },
  ],
  defenses: [
    { key: "defense", label: "Défense", default: 10 },
  ],
  resources: [
    { key: "hp", label: "PV", display: "bar", min: 0 },
  ],
  skills: [],
  raceLabel: "Race",
  races: [],
  classLabel: "Classe",
  classes: [],
  currency: "or",
  speedUnit: "m",
  defaultRollHint: "Libre",
  hasSpellcasting: true,
  hasTenues: false,
  hasSanity: false,
  hasAlignments: false,
  calculations,
  sheetComponent: "homebrew",
};
