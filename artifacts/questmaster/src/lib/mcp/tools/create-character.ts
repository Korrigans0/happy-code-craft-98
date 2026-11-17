import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { errorResult } from "../characterAccess";
import { pickEditableFields, type JsonValue } from "../characterPatch";
import { isKnownSystem } from "@/lib/systems";

const json = z.custom<JsonValue>(() => true);

export default defineTool({
  name: "create_character",
  title: "Create character",
  description:
    "Create a character owned by the signed-in user in one game system. Plan quotas apply server-side. Optional fields accept the same columns as update_character.",
  inputSchema: {
    name: z.string().min(1).max(120).describe("Character name."),
    system: z.string().describe("Game system id, e.g. 'Glyphes', 'Aetheria', 'Worlds Awakening'."),
    race: z.string().max(120).optional(),
    class: z.string().max(120).optional(),
    level: z.number().int().min(0).max(100).optional(),
    fields: z.record(json).optional().describe("Other editable columns (hp, max_hp, strength, inventory, gold…)."),
    system_data: z.record(json).optional().describe("Initial system-specific data."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ name, system, race, class: klass, level, fields, system_data }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("UNAUTHENTICATED", "Not authenticated");
    if (!isKnownSystem(system)) return errorResult("UNKNOWN_SYSTEM", `Unknown game system: ${system}`);
    const { update, rejected } = pickEditableFields(fields ?? {});
    if (rejected.length) return errorResult("FIELD_NOT_EDITABLE", "Some fields cannot be set", { fields: rejected });
    const supabase = supabaseForUser(ctx);
    const row = {
      ...update,
      name, system, race: race ?? "", class: klass ?? "", level: level ?? 1,
      system_data: system_data ?? {},
      user_id: ctx.getUserId(), // identity always from the verified token
      kind: "standard",
    };
    const { data, error } = await supabase.from("characters").insert(row as never).select("*").single();
    if (error) {
      const quota = /quota|limit|limite/i.test(error.message);
      return errorResult(quota ? "QUOTA_EXCEEDED" : "DATABASE_ERROR", error.message);
    }
    const payload = { character: data, version: data.updated_at as string };
    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
  },
});
