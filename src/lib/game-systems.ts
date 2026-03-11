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

// Worlds Awakening data
export const WA_ASCENDANCES = [
  "Humain", "Elfe", "Nain", "Orc", "Fée", "Démon", "Ange",
  "Draconien", "Bestial", "Élémentaire", "Mort-vivant"
];

export const WA_CLASSES = [
  "Combattant", "Protecteur", "Éclaireur", "Mystique",
  "Guérisseur", "Stratège", "Artisan", "Vagabond"
];

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
        races: WA_ASCENDANCES,
        classes: WA_CLASSES,
        backgrounds: [] as string[],
        hasAlignments: false,
        hasSpellcasting: false,
        statMode: "modifier" as const, // WA uses modifiers directly
        speedUnit: "m",
      };
    case "Call of Cthulhu":
      return {
        raceLabel: "Nationalité",
        classLabel: "Occupation",
        races: ["Américain", "Britannique", "Français", "Allemand", "Japonais", "Autre"],
        classes: COC_OCCUPATIONS,
        backgrounds: COC_ERAS,
        hasAlignments: false,
        hasSpellcasting: false,
        statMode: "percentile" as const,
        speedUnit: "m",
      };
    default:
      return {
        raceLabel: "Race",
        classLabel: "Classe",
        races: DND_RACES,
        classes: DND_CLASSES,
        backgrounds: DND_BACKGROUNDS,
        hasAlignments: true,
        hasSpellcasting: true,
        statMode: "score" as const,
        speedUnit: "ft",
      };
  }
}
