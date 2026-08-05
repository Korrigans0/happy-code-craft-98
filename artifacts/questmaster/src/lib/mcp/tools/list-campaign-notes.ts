import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_campaign_notes",
  title: "List campaign notes",
  description:
    "List the notes of a campaign that the signed-in user is allowed to read (GM-only notes require the GM role).",
  inputSchema: {
    campaign_id: z.string().describe("UUID of the campaign."),
    limit: z.number().int().optional().describe("Maximum number of notes to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ campaign_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const max = Math.min(Math.max(limit ?? 50, 1), 200);
    const { data, error } = await supabase
      .from("campaign_notes")
      .select("id, title, content, is_gm_only, created_at, updated_at")
      .eq("campaign_id", campaign_id)
      .order("updated_at", { ascending: false })
      .limit(max);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { notes: data ?? [] },
    };
  },
});
