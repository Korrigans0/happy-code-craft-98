import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { computeCanEdit, errorResult } from "../characterAccess";

export default defineTool({
  name: "get_character",
  title: "Get character sheet",
  description:
    "Get the full character sheet (columns, system_data, version and can_edit) of a character the signed-in user can access.",
  inputSchema: { character_id: z.string().uuid().describe("UUID of the character.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ character_id }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("UNAUTHENTICATED", "Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("characters").select("*").eq("id", character_id).maybeSingle();
    if (error) return errorResult("DATABASE_ERROR", error.message);
    if (!data) return errorResult("NOT_FOUND", "Character not found or not accessible");
    const canEdit = await computeCanEdit(supabase, ctx, data);
    const payload = { character: data, version: data.updated_at as string, can_edit: canEdit };
    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
  },
});
