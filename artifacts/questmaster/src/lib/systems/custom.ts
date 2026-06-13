import type { SystemDefinition } from "./types";

// Personnalisé — le MJ définit librement ses propres règles via les champs texte.
export const CUSTOM_SYSTEM: SystemDefinition = {
  id: "Personnalisé",
  label: "Personnalisé / Homebrew",
  shortLabel: "✦",
  description: "Système libre. Mélangez Aetheria, WA et vos propres règles maison.",
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
};
