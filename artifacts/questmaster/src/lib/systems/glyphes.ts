// Système Glyphes — Module Nouvel Empire (médiéval fantastique).
// Système indépendant : ne partage jamais son contenu avec un autre univers.
// Stats : PUI / SOU / CON / FOI / ESP / SOC (mode "score" — 1 dé par niveau d'aptitude).

import type { SystemDefinition, CalculationsAPI } from "./types";
import { genericStatModifier } from "./types";

const calculations: CalculationsAPI = {
  statModifier: genericStatModifier,
  // PV : dépend de Corps (5 max) + bonus CON (mode score → modificateur).
  maxHp: ({ stats }) => 5 + (stats.CON ?? 0),
  initiative: ({ stats }) => stats.SOU ?? 0,
};

export const GLYPHES_SYSTEM: SystemDefinition = {
  id: "Glyphes",
  label: "Glyphes — Nouvel Empire",
  shortLabel: "✨",
  description:
    "Dark fantasy modulaire. Module Nouvel Empire : médiéval fantastique, magie des glyphes, Brume, factions des Territoires Libres.",
  emoji: "✨",
  featured: false,
  partner: false,
  custom: false,
  stats: [
    { key: "PUI", label: "PUI", longLabel: "Puissance — physique, combat en force.", mode: "modifier", default: 0, min: 0, max: 5 },
    { key: "SOU", label: "SOU", longLabel: "Souplesse — dextérité, agilité, finesse.", mode: "modifier", default: 0, min: 0, max: 5 },
    { key: "CON", label: "CON", longLabel: "Constitution — encaisse blessures et poisons.", mode: "modifier", default: 0, min: 0, max: 5 },
    { key: "FOI", label: "FOI", longLabel: "Foi — engagement et confiance en soi.", mode: "modifier", default: 0, min: 0, max: 5 },
    { key: "ESP", label: "ESP", longLabel: "Esprit — intellect, robustesse de l'âme, évocation.", mode: "modifier", default: 0, min: 0, max: 5 },
    { key: "SOC", label: "SOC", longLabel: "Social — tromperie, charme, persuasion.", mode: "modifier", default: 0, min: 0, max: 5 },
  ],
  defenses: [
    { key: "blessure", label: "Blessure", hint: "Seuil avant dégâts graves", default: 0 },
    { key: "resilience", label: "Résilience", hint: "Encaisse les dégâts", default: 0 },
    { key: "esquive", label: "Esquive", hint: "Évitement actif", default: 0 },
  ],
  resources: [
    { key: "hp", label: "Corps", display: "bar", min: 0 },
    { key: "ame", label: "Âme", hint: "Réserve spirituelle (max 5)", display: "counter", min: 0 },
    { key: "heroisme", label: "Héroïsme", hint: "Pool d'actions héroïques (max 5)", display: "counter", min: 0 },
    { key: "tempete", label: "Tempête spirituelle", hint: "Jauge d'immersion (max 10)", display: "bar", min: 0 },
  ],
  raceLabel: "Race",
  races: [
    "Humain",
    "Gourmet",
    "Arboreïde (Médéinite)",
    "Fée (Médéinite)",
    "Ombre",
    "Hybride — Cervidé",
    "Hybride — Lycan",
    "Hybride — Ursidé",
  ],
  classLabel: "Origine",
  classes: [
    "Combattant",
    "Évocateur officiel",
    "Évocateur sauvage",
    "Marqué",
    "Artisan",
    "Rôdeur",
    "Diplomate",
    "Érudit",
  ],
  currency: "Argent",
  speedUnit: "ft",
  defaultRollHint: "Lancer N dés (N = niveau d'aptitude). Taille = niveau de la caractéristique liée.",
  hasSpellcasting: true,
  hasTenues: false,
  hasSanity: false,
  hasAlignments: false,
  calculations,
  sheetComponent: "glyphes",
};
