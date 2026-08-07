import type { SystemDefinition, CalculationsAPI } from "./types";
import { genericStatModifier } from "./types";

// Chroniques Oubliées Fantasy (COF) — d20 simplifié.
// Modificateur = (score − 10) / 2 arrondi à l'inférieur.
// Défense = 10 + mod. DEX + protection de l'armure/bouclier.
// PV = dé de vie du profil + mod. CON par niveau.

function mod(score: number): number {
  return Math.floor((score - 10) / 2);
}

const calculations: CalculationsAPI = {
  statModifier: genericStatModifier,
  maxHp: ({ level, stats, systemData }) => {
    const hitDie = Number((systemData?.hitDie as number) ?? 8);
    const conMod = mod(stats.CON ?? 10);
    const lvl = Math.max(1, level);
    // Niveau 1 : dé de vie maximal. Ensuite : moyenne du dé, +CON à chaque niveau.
    return hitDie + conMod + (lvl - 1) * (Math.floor(hitDie / 2) + 1 + conMod);
  },
  initiative: ({ stats }) => (stats.DEX ?? 10) + mod(stats.SAG ?? 10),
  attackBonus: ({ level, stats }) => mod(stats.FOR ?? 10) + Math.max(1, Math.floor(level / 2)),
  spellSaveDC: ({ level, stats, systemData }) => {
    const ability = (systemData?.spellcastingAbility as string) ?? "INT";
    return 10 + level + mod((stats[ability] as number) ?? 10);
  },
};

// Compétences COF : le jeu privilégie les tests de caractéristique.
// Ces entrées servent de raccourcis de jet sur la fiche.
const SKILLS = [
  { key: "acrobaties",    label: "Acrobaties",       stat: "DEX" },
  { key: "artisanat",     label: "Artisanat",        stat: "INT" },
  { key: "athletisme",    label: "Athlétisme",       stat: "FOR" },
  { key: "connaissances", label: "Connaissances",    stat: "INT" },
  { key: "discretion",    label: "Discrétion",       stat: "DEX" },
  { key: "escamotage",    label: "Escamotage",       stat: "DEX" },
  { key: "intimidation",  label: "Intimidation",     stat: "CHA" },
  { key: "intuition",     label: "Intuition",        stat: "SAG" },
  { key: "medecine",      label: "Médecine",         stat: "SAG" },
  { key: "nature",        label: "Nature",           stat: "SAG" },
  { key: "perception",    label: "Perception",       stat: "SAG" },
  { key: "persuasion",    label: "Persuasion",       stat: "CHA" },
  { key: "religion",      label: "Religion",         stat: "INT" },
  { key: "representation",label: "Représentation",   stat: "CHA" },
  { key: "survie",        label: "Survie",           stat: "SAG" },
];

export const COF_SYSTEM: SystemDefinition = {
  id: "COF",
  label: "Chroniques Oubliées Fantasy",
  shortLabel: "COF",
  description: "Le d20 français, simple et rapide : six caractéristiques, des voies de capacités et une Défense unique.",
  emoji: "⚔️",
  stats: [
    { key: "FOR", label: "FOR", longLabel: "Force",        mode: "score", default: 10, min: 1, max: 25 },
    { key: "DEX", label: "DEX", longLabel: "Dextérité",    mode: "score", default: 10, min: 1, max: 25 },
    { key: "CON", label: "CON", longLabel: "Constitution", mode: "score", default: 10, min: 1, max: 25 },
    { key: "INT", label: "INT", longLabel: "Intelligence", mode: "score", default: 10, min: 1, max: 25 },
    { key: "SAG", label: "SAG", longLabel: "Sagesse",      mode: "score", default: 10, min: 1, max: 25 },
    { key: "CHA", label: "CHA", longLabel: "Charisme",     mode: "score", default: 10, min: 1, max: 25 },
  ],
  defenses: [
    { key: "def", label: "DEF", hint: "Défense = 10 + mod. DEX + protection", default: 10 },
  ],
  resources: [
    { key: "hp",       label: "PV",             display: "bar",     min: 0 },
    { key: "recovery", label: "Récupération",   display: "counter", min: 0 },
    { key: "mana",     label: "Points de magie", display: "counter", min: 0 },
    { key: "chance",   label: "Points de chance", display: "counter", min: 0 },
  ],
  skills: SKILLS,
  raceLabel: "Peuple",
  races: [
    "Humain", "Elfe", "Elfe sylvestre", "Demi-elfe", "Nain", "Halfelin",
    "Gnome", "Orc", "Demi-orc", "Ogrelin",
  ],
  classLabel: "Profil",
  classes: [
    "Arquebusier", "Barbare", "Barde", "Chevalier", "Druide", "Ensorceleur",
    "Forgesort", "Guerrier", "Prêtre", "Moine", "Nécromancien", "Rôdeur",
    "Voleur", "Magicien",
  ],
  subclassLabel: "Voie principale",
  currency: "po",
  speedUnit: "m",
  defaultRollHint: "1d20 + mod. + niveau (voie)",
  hasSpellcasting: true,
  hasTenues: false,
  hasSanity: false,
  hasAlignments: false,
  calculations,
};
