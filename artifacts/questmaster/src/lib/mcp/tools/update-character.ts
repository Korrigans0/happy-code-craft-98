import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { computeCanEdit, errorResult } from "../characterAccess";
import { mergeSystemData, pickEditableFields, sameVersion, type JsonValue } from "../characterPatch";

const json = z.custom<JsonValue>(() => true);
const int = z.number().int();
const strList = z.array(z.string());

export default defineTool({
  name: "update_character",
  title: "Update character sheet",
  description:
    "Partially update a character the signed-in user may edit. Only provided fields change; system_data_patch is deep-merged. Requires expected_version (the character's last known updated_at) and fails with CONFLICT if the sheet changed meanwhile.",
  inputSchema: {
    character_id: z.string().uuid().describe("UUID of the character."),
    expected_version: z.string().describe("updated_at value read from get_character/list_characters."),
    fields: z.object({
      name: z.string().min(1).max(120).optional(), race: z.string().max(120).optional(), class: z.string().max(120).optional(),
      subclass: z.string().max(120).nullable().optional(), level: int.min(0).max(100).optional(),
      background: z.string().nullable().optional(), alignment: z.string().nullable().optional(),
      backstory: z.string().nullable().optional(), personality_traits: z.string().nullable().optional(),
      ideals: z.string().nullable().optional(), bonds: z.string().nullable().optional(),
      flaws: z.string().nullable().optional(), appearance: z.string().nullable().optional(),
      strength: int.optional(), dexterity: int.optional(), constitution: int.optional(),
      intelligence: int.optional(), wisdom: int.optional(), charisma: int.optional(),
      hp: int.optional(), max_hp: int.optional(), temp_hp: int.nullable().optional(), armor_class: int.optional(),
      initiative: int.nullable().optional(), speed: int.nullable().optional(), hit_dice: z.string().nullable().optional(),
      proficiency_bonus: int.nullable().optional(), saving_throws: strList.nullable().optional(),
      skills: strList.nullable().optional(), languages: strList.nullable().optional(),
      equipped_weapon_id: z.string().uuid().nullable().optional(), equipped_armor_id: z.string().uuid().nullable().optional(),
      equipped_items: strList.nullable().optional(), inventory: z.string().nullable().optional(), gold: int.nullable().optional(),
      spellcasting_ability: z.string().nullable().optional(), spell_save_dc: int.nullable().optional(),
      spell_attack_bonus: int.nullable().optional(), known_spells: strList.nullable().optional(),
      prepared_spells: strList.nullable().optional(), spell_slots: json.optional(),
      experience_points: int.nullable().optional(), avatar_url: z.string().url().nullable().optional(),
    }).strict().optional().describe("Top-level columns to change. Omitted fields are kept."),
    system_data_patch: z.record(json).optional().describe("Partial system_data (mana, wounds, heroism, aptitudes…); deep-merged, untouched keys preserved."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ character_id, expected_version, fields, system_data_patch }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("UNAUTHENTICATED", "Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { update, rejected } = pickEditableFields(fields ?? {});
    if (rejected.length) return errorResult("FIELD_NOT_EDITABLE", "Some fields cannot be modified", { fields: rejected });
    if (!Object.keys(update).length && !system_data_patch) return errorResult("EMPTY_UPDATE", "Nothing to update");

    const { data: current, error: readError } = await supabase.from("characters").select("*").eq("id", character_id).maybeSingle();
    if (readError) return errorResult("DATABASE_ERROR", readError.message);
    if (!current) return errorResult("NOT_FOUND", "Character not found or not accessible");
    if (!(await computeCanEdit(supabase, ctx, current))) return errorResult("FORBIDDEN", "You are not allowed to modify this character");
    if (!sameVersion(current.updated_at, expected_version)) {
      return errorResult("CONFLICT", "The character was modified since expected_version", { current_version: current.updated_at, character: current });
    }
    if (system_data_patch) update.system_data = mergeSystemData(current.system_data, system_data_patch);

    // Compare-and-set: the row is only written if updated_at is still the one we read.
    const { data: saved, error } = await supabase
      .from("characters").update(update).eq("id", character_id).eq("updated_at", current.updated_at).select("*").maybeSingle();
    if (error) return errorResult("DATABASE_ERROR", error.message);
    if (!saved) {
      const { data: latest } = await supabase.from("characters").select("*").eq("id", character_id).maybeSingle();
      return latest && !sameVersion(latest.updated_at, current.updated_at)
        ? errorResult("CONFLICT", "The character was modified concurrently", { current_version: latest.updated_at, character: latest })
        : errorResult("FORBIDDEN", "You are not allowed to modify this character");
    }
    const payload = { character: saved, version: saved.updated_at as string };
    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
  },
});
