import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_campaign_note",
  title: "Create campaign note",
  description:
    "Create a note in a campaign on behalf of the signed-in user (session prep, lore, recap). Can be marked GM-only.",
  inputSchema: {
    campaign_id: z.string().describe("UUID of the campaign."),
    title: z.string().describe("Title of the note."),
    content: z.string().describe("Body of the note (plain text or markdown)."),
    is_gm_only: z.boolean().optional().describe("Restrict the note to the GM (default false)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ campaign_id, title, content, is_gm_only }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("campaign_notes")
      .insert({
        campaign_id,
        user_id: ctx.getUserId(),
        title: title.trim(),
        content,
        is_gm_only: is_gm_only ?? false,
      })
      .select("id, title, is_gm_only, created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { note: data },
    };
  },
});
