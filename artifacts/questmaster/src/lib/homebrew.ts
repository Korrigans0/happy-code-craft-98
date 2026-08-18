// Homebrew — Atelier de contenu maison.
//
// Décrit les types de créations (race, classe, sort, objet, créature, capacité,
// règle) et le schéma de champs de chaque type. L'éditeur générique lit ces
// définitions : ajouter un type = ajouter une entrée ici, aucun composant à
// modifier.

export type HomebrewKind =
  | "race"
  | "class"
  | "spell"
  | "item"
  | "creature"
  | "ability"
  | "rule";

export type FieldType = "text" | "textarea" | "number" | "tags";

export interface HomebrewField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** Champ affiché sur toute la largeur du formulaire */
  wide?: boolean;
}

export interface HomebrewKindDef {
  kind: HomebrewKind;
  label: string;
  plural: string;
  emoji: string;
  /** Aide affichée dans l'éditeur */
  hint: string;
  fields: HomebrewField[];
}

const COMMON_LORE: HomebrewField[] = [
  { key: "lore", label: "Description / Lore", type: "textarea", wide: true, placeholder: "Histoire, ambiance, apparence…" },
];

export const HOMEBREW_KINDS: HomebrewKindDef[] = [
  {
    kind: "race",
    label: "Race / Ascendance",
    plural: "Races",
    emoji: "🧬",
    hint: "Peuples jouables : bonus de caractéristiques, traits raciaux, langues.",
    fields: [
      { key: "size", label: "Taille", type: "text", placeholder: "Moyenne, Petite…" },
      { key: "speed", label: "Vitesse", type: "text", placeholder: "9 m / 30 ft" },
      { key: "stat_bonus", label: "Bonus de caractéristiques", type: "text", placeholder: "+2 FOR, +1 CON" },
      { key: "languages", label: "Langues", type: "tags", placeholder: "Commun, Elfique…" },
      { key: "traits", label: "Traits raciaux", type: "textarea", wide: true, placeholder: "Un trait par ligne" },
      ...COMMON_LORE,
    ],
  },
  {
    kind: "class",
    label: "Classe / Profession",
    plural: "Classes",
    emoji: "⚔️",
    hint: "Archétypes jouables : dé de vie, ressources, progression.",
    fields: [
      { key: "hit_die", label: "Dé de vie", type: "text", placeholder: "d10" },
      { key: "primary_stat", label: "Caractéristique clé", type: "text", placeholder: "FOR, DEX…" },
      { key: "resource", label: "Ressource", type: "text", placeholder: "Points d'Énergie, Mana…" },
      { key: "proficiencies", label: "Maîtrises", type: "tags", placeholder: "Armes lourdes, Perception…" },
      { key: "features", label: "Aptitudes par niveau", type: "textarea", wide: true, placeholder: "Niv. 1 — …" },
      ...COMMON_LORE,
    ],
  },
  {
    kind: "spell",
    label: "Sort / Pouvoir",
    plural: "Sorts",
    emoji: "✨",
    hint: "Magie, prières, pouvoirs psychiques ou glyphes.",
    fields: [
      { key: "level", label: "Niveau / Rang", type: "number" },
      { key: "school", label: "École / Domaine", type: "text", placeholder: "Évocation, Ombre…" },
      { key: "casting_time", label: "Temps d'incantation", type: "text", placeholder: "1 action" },
      { key: "range", label: "Portée", type: "text", placeholder: "18 m" },
      { key: "duration", label: "Durée", type: "text", placeholder: "Concentration, 1 min" },
      { key: "components", label: "Composantes", type: "text", placeholder: "V, S, M" },
      { key: "effect", label: "Effet", type: "textarea", wide: true },
      ...COMMON_LORE,
    ],
  },
  {
    kind: "item",
    label: "Objet / Équipement",
    plural: "Objets",
    emoji: "💎",
    hint: "Armes, armures, reliques, consommables.",
    fields: [
      { key: "type", label: "Type", type: "text", placeholder: "Arme, Armure, Relique…" },
      { key: "rarity", label: "Rareté", type: "text", placeholder: "Commune, Légendaire…" },
      { key: "value", label: "Valeur", type: "text", placeholder: "150 po" },
      { key: "attunement", label: "Harmonisation", type: "text", placeholder: "Oui / Non" },
      { key: "properties", label: "Propriétés", type: "textarea", wide: true },
      ...COMMON_LORE,
    ],
  },
  {
    kind: "creature",
    label: "Créature / PNJ",
    plural: "Créatures",
    emoji: "🐉",
    hint: "Monstres et PNJ prêts à poser sur la table.",
    fields: [
      { key: "size", label: "Taille", type: "text", placeholder: "Grande" },
      { key: "type", label: "Type", type: "text", placeholder: "Aberration, Humanoïde…" },
      { key: "hp", label: "Points de vie", type: "number" },
      { key: "defense", label: "Défense / CA", type: "number" },
      { key: "speed", label: "Vitesse", type: "text" },
      { key: "challenge", label: "Puissance / FP", type: "text", placeholder: "5" },
      { key: "attacks", label: "Attaques", type: "textarea", wide: true, placeholder: "Griffes +7, 2d6+4 tranchant" },
      { key: "abilities", label: "Capacités spéciales", type: "textarea", wide: true },
      ...COMMON_LORE,
    ],
  },
  {
    kind: "ability",
    label: "Capacité / Don",
    plural: "Capacités",
    emoji: "🌀",
    hint: "Dons, talents, manœuvres, réactions.",
    fields: [
      { key: "cost", label: "Coût", type: "text", placeholder: "1 PE, réaction…" },
      { key: "requirement", label: "Prérequis", type: "text" },
      { key: "effect", label: "Effet", type: "textarea", wide: true },
      ...COMMON_LORE,
    ],
  },
  {
    kind: "rule",
    label: "Règle maison",
    plural: "Règles",
    emoji: "📜",
    hint: "Variantes, tables aléatoires, conditions personnalisées.",
    fields: [
      { key: "scope", label: "S'applique à", type: "text", placeholder: "Combat, exploration…" },
      { key: "text", label: "Texte de la règle", type: "textarea", wide: true },
    ],
  },
];

export const KIND_BY_ID: Record<string, HomebrewKindDef> = Object.fromEntries(
  HOMEBREW_KINDS.map((k) => [k.kind, k]),
);

export interface HomebrewRow {
  id: string;
  owner_id: string;
  system: string;
  kind: HomebrewKind | string;
  name: string;
  summary: string | null;
  data: Record<string, unknown>;
  image_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function emptyData(kind: HomebrewKind): Record<string, unknown> {
  const def = KIND_BY_ID[kind];
  if (!def) return {};
  return Object.fromEntries(def.fields.map((f) => [f.key, f.type === "tags" ? [] : f.type === "number" ? 0 : ""]));
}
