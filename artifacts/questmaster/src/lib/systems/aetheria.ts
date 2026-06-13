import type { SystemDefinition, CalculationsAPI } from "./types";
import { genericStatModifier } from "./types";
import { WA_ASCENDANCES, WA_CLASSES, WA_TENUES } from "../wa-data";

// Aetheria — système phare maison. Stats en modificateur, défense PHY/MAG, monnaie NX.
// Calculs : mod direct ; PV = 10 + CON * niveau + bonus tenue (déjà géré en BDD).
const calculations: CalculationsAPI = {
  statModifier: genericStatModifier,
  maxHp: ({ level, stats }) => 10 + (stats.CON ?? 0) * Math.max(1, level),
  initiative: ({ stats }) => stats.DEX ?? 0,
  attackBonus: ({ stats }) => stats.FOR ?? 0,
  spellSaveDC: ({ stats }) => 10 + Math.max(stats.INT ?? 0, stats.SAG ?? 0),
};

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
  resources: [
    { key: "hp", label: "PV", display: "bar", min: 0 },
    { key: "pe", label: "PE", hint: "Points d'énergie", display: "bar", min: 0 },
  ],
  skills: [
    { key: "athletisme",   label: "Athlétisme",      stat: "FOR" },
    { key: "acrobaties",   label: "Acrobaties",      stat: "DEX" },
    { key: "discretion",   label: "Discrétion",      stat: "DEX" },
    { key: "perception",   label: "Perception",      stat: "SAG" },
    { key: "intimidation", label: "Intimidation",    stat: "CHA" },
    { key: "persuasion",   label: "Persuasion",      stat: "CHA" },
    { key: "arcanes",      label: "Arcanes",         stat: "INT" },
    { key: "histoire",     label: "Histoire",        stat: "INT" },
    { key: "medecine",     label: "Médecine",        stat: "SAG" },
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
  sheetComponent: "aetheria",
};
