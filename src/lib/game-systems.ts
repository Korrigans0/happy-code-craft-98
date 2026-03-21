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

// WA characteristics: FOR, DEX, CON, INT, SAG, CHA (modifier-based, not scores)
export const WA_STATS = ["FOR", "DEX", "CON", "INT", "SAG", "CHA"] as const;

// Ascendance stat bonuses
export const WA_ASCENDANCE_BONUSES: Record<string, Record<string, number>> = {
  "Demi-Orc": { FOR: 2, CON: 1, INT: -1, CHA: -1 },
  "Elfe": { FOR: -1, DEX: 2, CON: -1, INT: 2 },
  "Halfelin": { FOR: -2, DEX: 2, SAG: 1, CHA: 1 },
  "Humain": { FOR: 1, CHA: 1 },
  "Nain": { DEX: -1, CON: 2, SAG: 1, CHA: -1 },
};

// Ascendance free points & adaptability
export const WA_ASCENDANCE_META: Record<string, { freePoints: number; adaptability: number }> = {
  "Demi-Orc": { freePoints: 2, adaptability: 1 },
  "Elfe": { freePoints: 1, adaptability: 2 },
  "Halfelin": { freePoints: 1, adaptability: 2 },
  "Humain": { freePoints: 1, adaptability: 3 },
  "Nain": { freePoints: 2, adaptability: 1 },
};

// Class stat bonuses
export const WA_CLASS_BONUSES: Record<string, Record<string, number>> = {
  "Combattant": { FOR: 2, DEX: 1, CON: 1, INT: -2 },
  "Croyant": { CON: -1, INT: 1, SAG: 1, CHA: 1 },
  "Mystique": { FOR: -1, CON: -2, INT: 2, SAG: 2, CHA: 1 },
  "Ombre": { DEX: 2, INT: -1, SAG: -1, CHA: 2 },
};

// Class hit dice & magic stat
export const WA_CLASS_META: Record<string, { hitDie: string; magicStat?: string }> = {
  "Combattant": { hitDie: "2d6" },
  "Croyant": { hitDie: "2d4", magicStat: "SAG" },
  "Mystique": { hitDie: "1d6", magicStat: "INT" },
  "Ombre": { hitDie: "1d8" },
};

// WA currency
export const WA_CURRENCY = "NX";

// WA Weapons (from official Codex)
export const WA_WEAPONS_CONTACT = [
  { name: "Dague", use: "Mixte", type: "Tranchant", req: "-", test: "DEX+0", damage: "1d4", price: "40 NX" },
  { name: "Gourdin", use: "Mixte", type: "Contondant", req: "-", test: "FOR+0", damage: "1d4", price: "40 NX" },
  { name: "Matraque Souple", use: "Mixte", type: "Contondant", req: "-", test: "DEX+0", damage: "1d4", price: "40 NX" },
  { name: "Epée Courte", use: "Main Principale", type: "Tranchant", req: "-", test: "FOR+0", damage: "1d6", price: "60 NX" },
  { name: "Masse", use: "Main Principale", type: "Contondant", req: "-", test: "FOR+0", damage: "1d6", price: "60 NX" },
  { name: "Bâton", use: "Deux Mains", type: "Contondant", req: "-", test: "FOR+0", damage: "1d8", price: "80 NX" },
  { name: "Epée Longue", use: "Main Principale", type: "Tranchant", req: "FOR +2", test: "FOR+0", damage: "1d8", price: "80 NX" },
  { name: "Epée à Deux Mains", use: "Deux Mains", type: "Tranchant", req: "FOR +4", test: "FOR+0", damage: "1d10", price: "100 NX" },
  { name: "Marteau de Guerre", use: "Deux Mains", type: "Contondant", req: "FOR +4", test: "FOR+0", damage: "1d10", price: "100 NX" },
];

export const WA_WEAPONS_RANGED = [
  { name: "Couteaux de lancer", use: "Mixte", type: "Tranchant", range: "10m", req: "-", test: "DEX+0", damage: "1d4", price: "40 NX" },
  { name: "Fronde", use: "Mixte", type: "Contondant", range: "15m", req: "-", test: "DEX+0", damage: "1d4", price: "40 NX" },
  { name: "Arc Court", use: "Deux Mains", type: "Perforant", range: "20m", req: "-", test: "DEX+0", damage: "1d6", price: "60 NX" },
  { name: "Arc Long", use: "Deux Mains", type: "Perforant", range: "50m", req: "FOR +1", test: "DEX+0", damage: "1d8", price: "80 NX" },
  { name: "Arc de Guerre", use: "Deux Mains", type: "Perforant", range: "50m", req: "FOR +2", test: "DEX+0", damage: "1d10", price: "100 NX" },
];

export const WA_WEAPONS_MAGIC = [
  { name: "Sceptre Arcanique", use: "Main Principale", type: "Non-élémentaire", range: "15m", req: "INT +2", test: "INT+0", damage: "1d4+1", price: "60 NX" },
  { name: "Sceptre de Feu", use: "Main Principale", type: "Feu", range: "15m", req: "INT +2", test: "INT+0", damage: "1d4+1", price: "60 NX" },
  { name: "Sceptre de Foudre", use: "Main Principale", type: "Foudre", range: "15m", req: "INT +2", test: "INT+0", damage: "1d4+1", price: "60 NX" },
  { name: "Sceptre de Glace", use: "Main Principale", type: "Glace", range: "15m", req: "INT +2", test: "INT+0", damage: "1d4+1", price: "60 NX" },
  { name: "Sceptre Divin", use: "Deux Mains", type: "Sacré", range: "10m", req: "SAG +2", test: "SAG+1", damage: "1d6", price: "60 NX" },
  { name: "Sceptre Tellurique", use: "Main Principale", type: "Terre", range: "15m", req: "INT +2", test: "INT+0", damage: "1d4+1", price: "60 NX" },
  { name: "Sceptre Tempête", use: "Main Principale", type: "Vent", range: "15m", req: "INT +2", test: "INT+0", damage: "1d4+1", price: "60 NX" },
];

export const WA_EQUIPMENTS = [
  { name: "Bouclier", bonus: "+1 Def PHY", use: "Main Secondaire", price: "20 NX" },
  { name: "Carquois", bonus: "+1 Atq Distance", use: "Main Secondaire", price: "20 NX" },
  { name: "Encensoir sacré (G)", bonus: "+1 Régénération PM", use: "Main Principale", price: "60 NX" },
  { name: "Garde-Bras", bonus: "+1 Atq Contact", use: "Main Secondaire", price: "20 NX" },
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
