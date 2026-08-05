import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_campaign",
  title: "Get campaign details",
  description:
    "Get one Aetheria VTT campaign with its members (display name, role and linked character), if the signed-in user has access to it.",
  inputSchema: { campaign_id: z.string().describe("UUID of the campaign.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ campaign_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!campaign) {
      return { content: [{ type: "text", text: "Campaign not found or not accessible" }], isError: true };
    }

    const { data: members } = await supabase
      .from("campaign_members")
      .select("user_id, role, character_id, joined_at")
      .eq("campaign_id", campaign_id);

    const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id).filter(Boolean)));
    const charIds = Array.from(
      new Set((members ?? []).map((m) => m.character_id).filter(Boolean)),
    ) as string[];

    const [profilesRes, charsRes] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
        : Promise.resolve({ data: [] as { user_id: string; display_name: string | null }[] }),
      charIds.length
        ? supabase.from("characters").select("id, name, class, level").in("id", charIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p]));
    const charMap = new Map((charsRes.data ?? []).map((c: any) => [c.id, c]));

    const enriched = (members ?? []).map((m) => ({
      user_id: m.user_id,
      role: m.role,
      display_name: (profileMap.get(m.user_id) as any)?.display_name ?? null,
      character: m.character_id ? (charMap.get(m.character_id) ?? null) : null,
      joined_at: m.joined_at,
    }));

    const payload = { campaign, members: enriched };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
