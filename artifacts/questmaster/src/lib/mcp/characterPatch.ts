// Pure helpers shared by the character MCP tools (no Supabase import, testable).

/** Top-level columns an external client may change. Ownership, system and pregen columns are never writable. */
export const EDITABLE_CHARACTER_FIELDS = [
  "name", "race", "class", "subclass", "level", "background", "alignment", "backstory",
  "personality_traits", "ideals", "bonds", "flaws", "appearance",
  "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
  "hp", "max_hp", "temp_hp", "armor_class", "initiative", "speed", "hit_dice", "proficiency_bonus",
  "saving_throws", "skills", "languages",
  "equipped_weapon_id", "equipped_armor_id", "equipped_items", "inventory", "gold",
  "spellcasting_ability", "spell_save_dc", "spell_attack_bonus", "known_spells", "prepared_spells", "spell_slots",
  "experience_points", "avatar_url",
] as const;

export type EditableField = (typeof EDITABLE_CHARACTER_FIELDS)[number];
export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
type JsonObject = { [k: string]: JsonValue };

const isPlainObject = (v: unknown): v is JsonObject =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Deep-merges a partial patch into system_data. Objects merge key by key, arrays and scalars replace,
 * keys absent from the patch are kept untouched. Nothing is ever deleted implicitly.
 */
export function mergeSystemData(current: unknown, patch: JsonObject): JsonObject {
  const base: JsonObject = isPlainObject(current) ? { ...current } : {};
  for (const [key, value] of Object.entries(patch)) {
    base[key] = isPlainObject(value) && isPlainObject(base[key])
      ? mergeSystemData(base[key], value)
      : value;
  }
  return base;
}

/** Keeps only whitelisted columns; returns the rejected keys so callers can report them. */
export function pickEditableFields(input: Record<string, unknown>) {
  const allowed = new Set<string>(EDITABLE_CHARACTER_FIELDS);
  const update: Record<string, unknown> = {};
  const rejected: string[] = [];
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (allowed.has(key)) update[key] = value;
    else rejected.push(key);
  }
  return { update, rejected };
}

/** Same instant check for two timestamps regardless of formatting. */
export function sameVersion(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  return Number.isFinite(ta) && ta === tb;
}

/** Owner can edit; the campaign GM can edit pregens (mirrors the database rules). */
export function canEditCharacter(
  row: { user_id: string | null; kind: string | null },
  userId: string | null,
  isPregenGm: boolean,
): boolean {
  if (!userId) return false;
  if (row.user_id === userId) return true;
  return row.kind === "pregen" && isPregenGm;
}
