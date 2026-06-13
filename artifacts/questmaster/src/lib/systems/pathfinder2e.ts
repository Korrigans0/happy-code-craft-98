import type { SystemDefinition, CalculationsAPI } from "./types";
import { genericStatModifier } from "./types";

// Pathfinder 2e — modificateurs directs + niveau + bonus de maîtrise.
// Niveaux de maîtrise : Non-formé (0), Formé (+2), Expert (+4), Maître (+6), Légendaire (+8) — tous + niveau.
const calculations: CalculationsAPI = {
  statModifier: genericStatModifier,
  maxHp: ({ level, stats, systemData }) => {
    const ancestryHp = Number((systemData?.ancestryHp as number) ?? 8);
    const classHp = Number((systemData?.classHp as number) ?? 8);
    const conMod = stats.CON ?? 0;
    return ancestryHp + (classHp + conMod) * Math.max(1, level);
  },
  initiative: ({ stats, level }) => (stats.WIS ?? 0) + level,
  proficiencyBonus: ({ level }) => level + 2,
  attackBonus: ({ stats, level }) => (stats.STR ?? 0) + level + 2,
  spellSaveDC: ({ stats, level, systemData }) => {
    const ability = (systemData?.spellcastingAbility as string) ?? "WIS";
    return 10 + ((stats[ability] as number) ?? 0) + level + 2;
  },
};

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
  resources: [
    { key: "hp",         label: "PV",        display: "bar",     min: 0 },
    { key: "hero_points",label: "Pts héros", display: "counter", min: 0 },
    { key: "focus",      label: "Pts focus", display: "counter", min: 0 },
  ],
  skills: [
    { key: "acrobatics",  label: "Acrobaties",   stat: "DEX" },
    { key: "arcana",      label: "Arcane",        stat: "INT" },
    { key: "athletics",   label: "Athlétisme",   stat: "STR" },
    { key: "crafting",    label: "Artisanat",     stat: "INT" },
    { key: "deception",   label: "Tromperie",    stat: "CHA" },
    { key: "diplomacy",   label: "Diplomatie",   stat: "CHA" },
    { key: "intimidation",label: "Intimidation", stat: "CHA" },
    { key: "medicine",    label: "Médecine",     stat: "WIS" },
    { key: "nature",      label: "Nature",       stat: "WIS" },
    { key: "occultism",   label: "Occultisme",   stat: "INT" },
    { key: "performance", label: "Représentation",stat: "CHA" },
    { key: "religion",    label: "Religion",     stat: "WIS" },
    { key: "society",     label: "Société",     stat: "INT" },
    { key: "stealth",     label: "Discrétion",  stat: "DEX" },
    { key: "survival",    label: "Survie",       stat: "WIS" },
    { key: "thievery",    label: "Vol",          stat: "DEX" },
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
  calculations,
  sheetComponent: "pathfinder2e",
};
