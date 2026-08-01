// Macros par défaut proposées selon le système du personnage.
// Appliquées à la création d'un personnage : le joueur peut ensuite les
// modifier, dupliquer ou supprimer librement.

import type { MacroAction } from "./types";

export interface DefaultMacro {
  name: string;
  category: string;
  icon?: string;
  color?: string;
  actions: MacroAction[];
}

const COMMON: DefaultMacro[] = [
  {
    name: "Jet libre d20",
    category: "Général",
    color: "slate",
    actions: [{ type: "roll", label: "Jet", formula: "1d20" }],
  },
];

const AETHERIA: DefaultMacro[] = [
  {
    name: "Attaque au contact",
    category: "Attaques",
    color: "red",
    actions: [
      { type: "roll", label: "Attaque", formula: "1d20+{FOR}" },
      { type: "roll", label: "Dégâts", formula: "1d8+{FOR}" },
    ],
  },
  {
    name: "Attaque à distance",
    category: "Attaques",
    color: "amber",
    actions: [
      { type: "roll", label: "Attaque", formula: "1d20+{DEX}" },
      { type: "roll", label: "Dégâts", formula: "1d6+{DEX}" },
    ],
  },
  {
    name: "Initiative",
    category: "Général",
    color: "blue",
    actions: [{ type: "roll", label: "Initiative", formula: "1d20+{DEX}" }],
  },
  {
    name: "Sauvegarde CON",
    category: "Défense",
    color: "green",
    actions: [{ type: "roll", label: "Sauvegarde", formula: "1d20+{CON}" }],
  },
];

const GLYPHES: DefaultMacro[] = [
  {
    name: "Épreuve de Souplesse",
    category: "Général",
    color: "blue",
    actions: [{ type: "roll", label: "Épreuve", formula: "{DE:SOU}" }],
  },
  {
    name: "Attaque en Puissance",
    category: "Attaques",
    color: "red",
    actions: [
      { type: "roll", label: "Attaque", formula: "{DE:PUI}" },
      { type: "roll", label: "Dégâts", formula: "1d6" },
    ],
  },
  {
    name: "Évocation de glyphe",
    category: "Sorts",
    color: "violet",
    actions: [
      { type: "text", content: "Trace un glyphe, la Brume répond…" },
      { type: "roll", label: "Évocation", formula: "{DE:ESP}" },
    ],
  },
  {
    name: "Résistance (Constitution)",
    category: "Défense",
    color: "green",
    actions: [{ type: "roll", label: "Résistance", formula: "{DE:CON}" }],
  },
];

const DND: DefaultMacro[] = [
  {
    name: "Attaque à l'arme",
    category: "Attaques",
    color: "red",
    actions: [
      { type: "roll", label: "Attaque", formula: "1d20+{STR}+{MAIT}" },
      { type: "roll", label: "Dégâts", formula: "1d8+{STR}" },
    ],
  },
  {
    name: "Jet de sauvegarde DEX",
    category: "Défense",
    color: "green",
    actions: [{ type: "roll", label: "Sauvegarde DEX", formula: "1d20+{DEX}" }],
  },
  {
    name: "Initiative",
    category: "Général",
    color: "blue",
    actions: [{ type: "roll", label: "Initiative", formula: "1d20+{DEX}" }],
  },
];

const CTHULHU: DefaultMacro[] = [
  {
    name: "Test de caractéristique",
    category: "Général",
    color: "slate",
    actions: [{ type: "roll", label: "Test (sous la valeur)", formula: "1d100" }],
  },
  {
    name: "Jet de Santé Mentale",
    category: "Défense",
    color: "violet",
    actions: [{ type: "roll", label: "SAN", formula: "1d100" }],
  },
];

const BY_SYSTEM: Record<string, DefaultMacro[]> = {
  Aetheria: AETHERIA,
  "Worlds Awakening": AETHERIA,
  Glyphes: GLYPHES,
  "D&D 5e": DND,
  Dnd5e: DND,
  "Pathfinder 2e": DND,
  "Cthulhu 7e": CTHULHU,
};

/** Macros par défaut d'un système (toujours au moins les communes). */
export function getDefaultMacros(systemId?: string | null): DefaultMacro[] {
  const specific = (systemId && BY_SYSTEM[systemId]) || AETHERIA;
  return [...specific, ...COMMON];
}
