// Campaign Codex — shared entity model.
// A single entity powers every representation (token, compact card, full sheet,
// codex entry, quest preview), so data is never duplicated.

export type EntityKind =
  | "npc"
  | "faction"
  | "location"
  | "quest"
  | "item"
  | "monster"
  | "event"
  | "note"
  | "handout";

export type EntityVisibility = "gm_only" | "selected_players" | "campaign" | "public";

export type PermissionLevel = "none" | "read" | "use" | "edit" | "duplicate" | "admin";

export interface CampaignEntity {
  id: string;
  campaign_id: string;
  system: string;
  kind: EntityKind;
  name: string;
  summary: string | null;
  content: Record<string, unknown>;
  tags: string[];
  image_url: string | null;
  visibility: EntityVisibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EntityLink {
  id: string;
  campaign_id: string;
  source_id: string;
  target_id: string;
  relation: string;
}

export interface EntityRevision {
  id: string;
  entity_id: string;
  snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export const ENTITY_KINDS: { id: EntityKind; label: string; plural: string; emoji: string }[] = [
  { id: "npc", label: "PNJ", plural: "PNJ", emoji: "🧝" },
  { id: "faction", label: "Faction", plural: "Factions", emoji: "🛡️" },
  { id: "location", label: "Lieu", plural: "Lieux", emoji: "🗺️" },
  { id: "quest", label: "Quête", plural: "Quêtes", emoji: "📜" },
  { id: "item", label: "Objet", plural: "Objets", emoji: "💎" },
  { id: "monster", label: "Créature", plural: "Créatures", emoji: "🐉" },
  { id: "event", label: "Événement", plural: "Événements", emoji: "⚡" },
  { id: "note", label: "Note", plural: "Notes", emoji: "📝" },
  { id: "handout", label: "Aide de jeu", plural: "Aides de jeu", emoji: "📖" },
];

export const VISIBILITY_OPTIONS: { id: EntityVisibility; label: string; hint: string }[] = [
  { id: "gm_only", label: "Privé MJ", hint: "Visible uniquement par le MJ" },
  { id: "selected_players", label: "Joueurs choisis", hint: "Visible par les joueurs autorisés" },
  { id: "campaign", label: "Toute la campagne", hint: "Visible par tous les membres" },
  { id: "public", label: "Public", hint: "Visible par tout le monde" },
];

export const PERMISSION_LEVELS: { id: PermissionLevel; label: string }[] = [
  { id: "none", label: "Aucun accès" },
  { id: "read", label: "Lecture" },
  { id: "use", label: "Utilisation" },
  { id: "edit", label: "Modification" },
  { id: "duplicate", label: "Duplication" },
  { id: "admin", label: "Administration" },
];

export const RELATION_TYPES = [
  "related",
  "member_of",
  "located_in",
  "owns",
  "gives_quest",
  "guards",
  "ally_of",
  "enemy_of",
] as const;

export const RELATION_LABELS: Record<string, string> = {
  related: "Lié à",
  member_of: "Membre de",
  located_in: "Situé à",
  owns: "Possède",
  gives_quest: "Donne la quête",
  guards: "Garde",
  ally_of: "Allié de",
  enemy_of: "Ennemi de",
};

export function kindMeta(kind: EntityKind) {
  return ENTITY_KINDS.find((k) => k.id === kind) ?? ENTITY_KINDS[0];
}
