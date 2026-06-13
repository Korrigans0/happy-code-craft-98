// Game system definitions — Aetheria VTT
//
// Source de données centrale : src/lib/aetheria-data.ts
// Ce fichier ré-exporte les données Aetheria et conserve les constantes
// "Worlds Awakening" historiques (mécaniques de fiches) pour compatibilité.

export * from "./aetheria-data";

// Liste des systèmes proposés dans l'UI. Source de vérité : src/lib/systems/.
// On reconstruit ce tableau à partir du registre pour rester synchronisé.
import { SYSTEM_LIST } from "./systems";

export const GAME_SYSTEMS = SYSTEM_LIST.map((s) => ({
  value: s.id,
  label: `${s.emoji} ${s.label}`,
}));

export type GameSystem = string;

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

// Get system-specific config (WA only)
export function getSystemConfig(_system?: string) {
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
}
