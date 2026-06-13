import type { SystemDefinition, CalculationsAPI } from "./types";
import { genericStatModifier } from "./types";

// D&D 5e — scores 1-20 → mod = floor((score-10)/2).
// Bonus de maîtrise par niveau : 2 (1-4), 3 (5-8), 4 (9-12), 5 (13-16), 6 (17-20).
function proficiencyBonus(level: number): number {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9)  return 4;
  if (level >= 5)  return 3;
  return 2;
}

function mod(score: number): number {
  return Math.floor((score - 10) / 2);
}

const calculations: CalculationsAPI = {
  statModifier: genericStatModifier,
  maxHp: ({ level, stats, systemData }) => {
    const hitDie = Number((systemData?.hitDie as number) ?? 8);
    const conMod = mod(stats.CON ?? 10);
    // 1er niveau : max du dé. Suivants : moyenne (hitDie/2 + 1).
    const lvl = Math.max(1, level);
    return hitDie + conMod + (lvl - 1) * (Math.floor(hitDie / 2) + 1 + conMod);
  },
  initiative: ({ stats }) => mod(stats.DEX ?? 10),
  proficiencyBonus: ({ level }) => proficiencyBonus(level),
  attackBonus: ({ level, stats }) => mod(stats.STR ?? 10) + proficiencyBonus(level),
  spellSaveDC: ({ level, stats, systemData }) => {
    const ability = (systemData?.spellcastingAbility as string) ?? "WIS";
    return 8 + proficiencyBonus(level) + mod((stats[ability] as number) ?? 10);
  },
};

// 18 compétences du SRD 5.1 (CC-BY-4.0 — noms communs, pas de prose protégée).
const SKILLS = [
  { key: "acrobatics",      label: "Acrobaties",        stat: "DEX" },
  { key: "animal_handling", label: "Dressage",          stat: "WIS" },
  { key: "arcana",          label: "Arcanes",           stat: "INT" },
  { key: "athletics",       label: "Athlétisme",        stat: "STR" },
  { key: "deception",       label: "Tromperie",         stat: "CHA" },
  { key: "history",         label: "Histoire",          stat: "INT" },
  { key: "insight",         label: "Perspicacité",      stat: "WIS" },
  { key: "intimidation",    label: "Intimidation",      stat: "CHA" },
  { key: "investigation",   label: "Investigation",     stat: "INT" },
  { key: "medicine",        label: "Médecine",          stat: "WIS" },
  { key: "nature",          label: "Nature",            stat: "INT" },
  { key: "perception",      label: "Perception",        stat: "WIS" },
  { key: "performance",     label: "Représentation",    stat: "CHA" },
  { key: "persuasion",      label: "Persuasion",        stat: "CHA" },
  { key: "religion",        label: "Religion",          stat: "INT" },
  { key: "sleight_of_hand", label: "Escamotage",        stat: "DEX" },
  { key: "stealth",         label: "Discrétion",        stat: "DEX" },
  { key: "survival",        label: "Survie",            stat: "WIS" },
];

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
  resources: [
    { key: "hp",        label: "PV",            display: "bar",     min: 0 },
    { key: "temp_hp",   label: "PV temp.",      display: "counter", min: 0, overflow: true },
    { key: "hit_dice",  label: "Dés de vie",    display: "counter", min: 0 },
    { key: "slots_1",   label: "Slots niv. 1",  display: "slots",   min: 0 },
    { key: "slots_2",   label: "Slots niv. 2",  display: "slots",   min: 0 },
    { key: "slots_3",   label: "Slots niv. 3",  display: "slots",   min: 0 },
    { key: "slots_4",   label: "Slots niv. 4",  display: "slots",   min: 0 },
    { key: "slots_5",   label: "Slots niv. 5",  display: "slots",   min: 0 },
  ],
  skills: SKILLS,
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
  calculations,
  sheetComponent: "dnd5e",
};
