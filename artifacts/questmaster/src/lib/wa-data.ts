// Worlds Awakening data constants
// Extracted from game-systems.ts to break circular dependency with src/lib/systems/

export const WA_ASCENDANCES = [
  "Humain", "Elfe", "Nain", "Demi-Orc", "Halfelin"
];

export const WA_CLASSES = [
  "Combattant", "Croyant", "Mystique", "Ombre"
];

export const WA_TENUES: Record<string, string[]> = {
  "Combattant": ["Berserk", "Épéiste", "Protecteur"],
  "Mystique": ["Arcane", "Élémentaliste", "Enchanteur"],
  "Ombre": ["Assassin", "Embusqué", "Manipulateur"],
  "Croyant": ["Exorciste", "Guérisseur", "Prophète"],
};
