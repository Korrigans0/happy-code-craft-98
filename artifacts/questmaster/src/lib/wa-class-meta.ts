// Worlds Awakening class hit dice & magic stat.
// Leaf module (no imports) so the systems registry can use it without an import cycle
// through lib/game-systems, which itself depends on the registry.
export const WA_CLASS_META: Record<string, { hitDie: string; magicStat?: string }> = {
  "Combattant": { hitDie: "2d6" },
  "Croyant": { hitDie: "2d4", magicStat: "SAG" },
  "Mystique": { hitDie: "1d6", magicStat: "INT" },
  "Ombre": { hitDie: "1d8" },
};
