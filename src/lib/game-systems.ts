// Game system definitions for multi-system support

export const GAME_SYSTEMS = [
  { value: "D&D 5e", label: "Donjons & Dragons 5e" },
  { value: "Call of Cthulhu", label: "L'Appel de Cthulhu" },
  { value: "Worlds Awakening", label: "Worlds Awakening" },
] as const;

export type GameSystem = typeof GAME_SYSTEMS[number]["value"];

// D&D 5e data
export const DND_RACES = [
  "Humain", "Elfe", "Nain", "Halfelin", "Gnome", "Demi-Elfe", "Demi-Orc",
  "Tieffelin", "Dragonborn", "Aarakocra", "Genasi", "Goliath", "Tabaxi", "Kenku"
];

export const DND_CLASSES = [
  "Barbare", "Barde", "Clerc", "Druide", "Guerrier", "Moine",
  "Paladin", "Rôdeur", "Roublard", "Ensorceleur", "Sorcier", "Magicien"
];

export const DND_BACKGROUNDS = [
  "Acolyte", "Artisan", "Charlatan", "Criminel", "Artiste", "Gladiateur",
  "Héros du Peuple", "Ermite", "Noble", "Érudit", "Marin", "Soldat", "Vagabond"
];

// Worlds Awakening data (from official Codex)
export const WA_ASCENDANCES = [
  "Humain", "Elfe", "Nain", "Demi-Orc", "Halfelin"
];

export const WA_CLASSES = [
  "Combattant", "Croyant", "Mystique", "Ombre"
];

// Tenues mapped by class (from official Codex)
export const WA_TENUES: Record<string, string[]> = {
  "Combattant": ["Berserk", "Épéiste", "Protecteur"],
  "Mystique": ["Arcane", "Élémentaliste", "Enchanteur"],
  "Ombre": ["Assassin", "Embusqué", "Manipulateur"],
  "Croyant": ["Exorciste", "Guérisseur", "Prophète"],
};

// All tenues flat list
export const WA_ALL_TENUES = Object.values(WA_TENUES).flat();

// Call of Cthulhu data
export const COC_OCCUPATIONS = [
  "Antiquaire", "Artiste", "Athlète", "Détective privé", "Dilettante",
  "Docteur", "Écrivain", "Ingénieur", "Journaliste", "Militaire",
  "Officier de police", "Parapsychologue", "Professeur", "Prêtre"
];

export const COC_ERAS = [
  "Années 1920", "Époque Moderne", "Époque Victorienne", "Antiquité"
];

export const ALIGNMENTS = [
  "Loyal Bon", "Neutre Bon", "Chaotique Bon",
  "Loyal Neutre", "Neutre", "Chaotique Neutre",
  "Loyal Mauvais", "Neutre Mauvais", "Chaotique Mauvais"
];

export const SKILLS = [
  "Acrobaties", "Arcanes", "Athlétisme", "Discrétion", "Dressage", "Escamotage",
  "Histoire", "Intimidation", "Investigation", "Médecine", "Nature", "Perception",
  "Perspicacité", "Persuasion", "Religion", "Représentation", "Survie", "Tromperie"
];

export const LANGUAGES = [
  "Commun", "Elfique", "Nain", "Géant", "Gnome", "Gobelin", "Halfelin",
  "Orc", "Abyssal", "Céleste", "Draconique", "Infernal", "Primordial", "Sylvain"
];

// Get system-specific config
export function getSystemConfig(system: string) {
  switch (system) {
    case "Worlds Awakening":
      return {
        raceLabel: "Ascendance",
        classLabel: "Classe",
        subclassLabel: "Tenue",
        races: WA_ASCENDANCES,
        classes: WA_CLASSES,
        backgrounds: [] as string[],
        hasAlignments: false,
        hasSpellcasting: false,
        hasTenues: true,
        statMode: "modifier" as const,
        speedUnit: "m",
      };
    case "Call of Cthulhu":
      return {
        raceLabel: "Nationalité",
        classLabel: "Occupation",
        subclassLabel: "Spécialisation",
        races: ["Américain", "Britannique", "Français", "Allemand", "Japonais", "Autre"],
        classes: COC_OCCUPATIONS,
        backgrounds: COC_ERAS,
        hasAlignments: false,
        hasSpellcasting: false,
        hasTenues: false,
        statMode: "percentile" as const,
        speedUnit: "m",
      };
    default:
      return {
        raceLabel: "Race",
        classLabel: "Classe",
        subclassLabel: "Sous-classe",
        races: DND_RACES,
        classes: DND_CLASSES,
        backgrounds: DND_BACKGROUNDS,
        hasAlignments: true,
        hasSpellcasting: true,
        hasTenues: false,
        statMode: "score" as const,
        speedUnit: "ft",
      };
  }
}
