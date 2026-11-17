import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { errorResult } from "../characterAccess";

export default defineTool({
  name: "list_characters",
  title: "List characters",
  description:
    "List characters of the signed-in user (scope 'owned') or every character they may read (scope 'accessible'). Use updated_since to fetch only sheets changed since the last sync.",
  inputSchema: {
    limit: z.number().int().optional().describe("Maximum number of characters to return (default 25, max 100)."),
    scope: z.enum(["owned", "accessible"]).optional().describe("'owned' (default) or 'accessible' (owned + campaign-linked + available pregens)."),
    updated_since: z.string().datetime({ offset: true }).optional().describe("ISO timestamp; only characters modified strictly after it are returned."),
    system: z.string().optional().describe("Filter by game system, e.g. 'Glyphes' or 'Aetheria'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, scope, updated_since, system }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("UNAUTHENTICATED", "Not authenticated");
    const supabase = supabaseForUser(ctx);
    const max = Math.min(Math.max(limit ?? 25, 1), 100);
    const userId = ctx.getUserId() ?? "";
    let query = supabase
      .from("characters")
      .select("id, user_id, name, race, class, subclass, level, hp, max_hp, armor_class, system, kind, avatar_url, updated_at")
      .order("updated_at", { ascending: false })
      .limit(max);
    if ((scope ?? "owned") === "owned") query = query.eq("user_id", userId);
    if (updated_since) query = query.gt("updated_at", updated_since);
    if (system) query = query.eq("system", system);
    const { data, error } = await query;
    if (error) return errorResult("DATABASE_ERROR", error.message);
    const characters = (data ?? []).map((c) => ({ ...c, version: c.updated_at, is_owner: c.user_id === userId }));
    const payload = { characters, server_time: new Date().toISOString() };
    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
  },
});
