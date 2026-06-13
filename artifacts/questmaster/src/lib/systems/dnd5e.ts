import type { SystemDefinition } from "./types";

// Donjons & Dragons 5e — scores 1-20, modificateur dérivé, CA, bonus de maîtrise.
export const DND5E_SYSTEM: SystemDefinition = {
  id: "D&D 5e",
  label: "Donjons & Dragons 5e",
  shortLabel: "5E",
  description: "Le grand classique. Scores d'aptitude, classe d'armure, sorts et bonus de maîtrise.",
  emoji: "🐉",
  stats: [
    { key: "STR", label: "FOR", longLabel: "Force",        mode: "score", default: 10, min: 1, max: 30 },
    { key: "DEX", label: "DEX", longLabel: "Dextérité",    mode: "score", default: 10, min: 1, max: 30 },
    { key: "CON", label: "CON", longLabel: "Constitution", mode: "score", default: 10, min: 1, max: 30 },
    { key: "INT", label: "INT", longLabel: "Intelligence", mode: "score", default: 10, min: 1, max: 30 },
    { key: "WIS", label: "SAG", longLabel: "Sagesse",      mode: "score", default: 10, min: 1, max: 30 },
    { key: "CHA", label: "CHA", longLabel: "Charisme",     mode: "score", default: 10, min: 1, max: 30 },
  ],
  defenses: [
    { key: "ac", label: "CA", hint: "Classe d'armure", default: 10 },
  ],
  raceLabel: "Race",
  races: [
    "Humain", "Elfe", "Nain", "Halfelin", "Demi-Elfe", "Demi-Orc",
    "Drakéide", "Gnome", "Tieffelin",
  ],
  classLabel: "Classe",
  classes: [
    "Barbare", "Barde", "Clerc", "Druide", "Ensorceleur", "Guerrier",
    "Magicien", "Moine", "Paladin", "Rôdeur", "Roublard", "Occultiste",
  ],
  subclassLabel: "Archétype",
  currency: "po",
  speedUnit: "ft",
  defaultRollHint: "1d20 + mod + maîtrise",
  hasSpellcasting: true,
  hasTenues: false,
  hasSanity: false,
  hasAlignments: true,
};
