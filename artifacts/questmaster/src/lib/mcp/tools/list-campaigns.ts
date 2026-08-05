import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_campaigns",
  title: "List campaigns",
  description:
    "List the Aetheria VTT campaigns the signed-in user can access (owned as GM or joined as player).",
  inputSchema: {
    limit: z.number().int().optional().describe("Maximum number of campaigns to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const max = Math.min(Math.max(limit ?? 25, 1), 100);
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, title, system, description, summary, is_active, level_min, level_max, max_players, schedule, created_at, user_id")
      .order("updated_at", { ascending: false })
      .limit(max);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const userId = ctx.getUserId();
    const rows = (data ?? []).map((c) => ({ ...c, is_gm: c.user_id === userId }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { campaigns: rows },
    };
  },
});
