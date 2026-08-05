import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_characters",
  title: "List characters",
  description: "List the characters owned by the signed-in user, across all game systems.",
  inputSchema: {
    limit: z.number().int().optional().describe("Maximum number of characters to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const max = Math.min(Math.max(limit ?? 25, 1), 100);
    const { data, error } = await supabase
      .from("characters")
      .select("id, name, race, class, subclass, level, hp, max_hp, armor_class, system")
      .eq("user_id", ctx.getUserId() ?? "")
      .order("updated_at", { ascending: false })
      .limit(max);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { characters: data ?? [] },
    };
  },
});
