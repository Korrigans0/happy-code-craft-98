import type { SystemDefinition } from "./types";

// Pathfinder 2e — modificateurs directs (-1 à +7), CA, niveaux de maîtrise.
export const PF2E_SYSTEM: SystemDefinition = {
  id: "Pathfinder 2e",
  label: "Pathfinder 2e",
  shortLabel: "PF2",
  description: "Tactique, granulaire et héroïque. Modificateurs d'aptitude et niveaux de maîtrise.",
  emoji: "🗺️",
  stats: [
    { key: "STR", label: "FOR", longLabel: "Force",        mode: "modifier", default: 0, min: -2, max: 8 },
    { key: "DEX", label: "DEX", longLabel: "Dextérité",    mode: "modifier", default: 0, min: -2, max: 8 },
    { key: "CON", label: "CON", longLabel: "Constitution", mode: "modifier", default: 0, min: -2, max: 8 },
    { key: "INT", label: "INT", longLabel: "Intelligence", mode: "modifier", default: 0, min: -2, max: 8 },
    { key: "WIS", label: "SAG", longLabel: "Sagesse",      mode: "modifier", default: 0, min: -2, max: 8 },
    { key: "CHA", label: "CHA", longLabel: "Charisme",     mode: "modifier", default: 0, min: -2, max: 8 },
  ],
  defenses: [
    { key: "ac", label: "CA", hint: "Classe d'armure", default: 10 },
  ],
  raceLabel: "Ascendance",
  races: [
    "Humain", "Elfe", "Nain", "Gnome", "Goblin", "Halfelin",
    "Demi-Elfe", "Demi-Orc", "Léshie", "Catfolk",
  ],
  classLabel: "Classe",
  classes: [
    "Alchimiste", "Barbare", "Barde", "Champion", "Clerc", "Druide",
    "Ensorceleur", "Guerrier", "Investigateur", "Magicien", "Moine",
    "Occultiste", "Rôdeur", "Roublard",
  ],
  currency: "po",
  speedUnit: "ft",
  defaultRollHint: "1d20 + mod + maîtrise + niveau",
  hasSpellcasting: true,
  hasTenues: false,
  hasSanity: false,
  hasAlignments: true,
};
