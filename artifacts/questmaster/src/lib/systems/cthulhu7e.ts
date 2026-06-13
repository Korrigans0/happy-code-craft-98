import type { SystemDefinition, CalculationsAPI } from "./types";
import { genericStatModifier } from "./types";

// L'Appel de Cthulhu 7e — caractéristiques en pourcentage, jet 1d100 ≤ valeur.
const calculations: CalculationsAPI = {
  statModifier: genericStatModifier,
  maxHp: ({ stats }) => Math.floor(((stats.CON ?? 50) + (stats.TAI ?? 50)) / 10),
  initiative: ({ stats }) => Math.floor((stats.DEX ?? 50) / 5),
};

export const COC_SYSTEM: SystemDefinition = {
  id: "Call of Cthulhu",
  label: "L'Appel de Cthulhu 7e",
  shortLabel: "CoC",
  description: "Horreur lovecraftienne. Caractéristiques en pourcentage, santé mentale, jet sous la valeur au d100.",
  emoji: "🦑",
  stats: [
    { key: "FOR", label: "FOR", longLabel: "Force",       mode: "percentage", default: 50, min: 0, max: 99 },
    { key: "CON", label: "CON", longLabel: "Constitution",mode: "percentage", default: 50, min: 0, max: 99 },
    { key: "TAI", label: "TAI", longLabel: "Taille",      mode: "percentage", default: 50, min: 0, max: 99 },
    { key: "DEX", label: "DEX", longLabel: "Dextérité",   mode: "percentage", default: 50, min: 0, max: 99 },
    { key: "APP", label: "APP", longLabel: "Apparence",   mode: "percentage", default: 50, min: 0, max: 99 },
    { key: "INT", label: "INT", longLabel: "Intelligence",mode: "percentage", default: 50, min: 0, max: 99 },
    { key: "POU", label: "POU", longLabel: "Pouvoir",     mode: "percentage", default: 50, min: 0, max: 99 },
    { key: "EDU", label: "ÉDU", longLabel: "Éducation",   mode: "percentage", default: 50, min: 0, max: 99 },
  ],
  defenses: [
    { key: "esquive", label: "Esquive", hint: "DEX/2 par défaut", default: 25 },
  ],
  resources: [
    { key: "hp",     label: "PV",          display: "bar",     min: 0 },
    { key: "san",    label: "Santé ment.", display: "bar",     min: 0 },
    { key: "luck",   label: "Chance",      display: "bar",     min: 0 },
    { key: "mp",     label: "Pts magie",   display: "counter", min: 0 },
  ],
  skills: [
    { key: "spot_hidden",  label: "Trouver objet caché", stat: "INT" },
    { key: "listen",       label: "Écouter",             stat: "INT" },
    { key: "library_use",  label: "Bibliothèque",        stat: "EDU" },
    { key: "psychology",   label: "Psychologie",         stat: "INT" },
    { key: "stealth",      label: "Discrétion",          stat: "DEX" },
    { key: "occult",       label: "Occultisme",          stat: "EDU" },
    { key: "first_aid",    label: "Premiers soins",      stat: "DEX" },
  ],
  raceLabel: "Nationalité",
  races: ["Américaine", "Britannique", "Française", "Allemande", "Italienne", "Autre"],
  classLabel: "Profession",
  classes: [
    "Antiquaire", "Détective privé", "Journaliste", "Médecin", "Professeur",
    "Prêtre", "Policier", "Soldat", "Occultiste", "Artiste", "Criminel",
  ],
  currency: "$",
  speedUnit: "m",
  defaultRollHint: "1d100 sous valeur",
  hasSpellcasting: false,
  hasTenues: false,
  hasSanity: true,
  hasAlignments: false,
  calculations,
  sheetComponent: "cthulhu7e",
};
