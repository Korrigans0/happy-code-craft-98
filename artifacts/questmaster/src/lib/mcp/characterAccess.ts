import type { ToolContext } from "@lovable.dev/mcp-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { canEditCharacter } from "./characterPatch";

export const errorResult = (code: string, message: string, extra: Record<string, unknown> = {}) => ({
  content: [{ type: "text" as const, text: JSON.stringify({ error: { code, message, ...extra } }) }],
  isError: true,
});

/** Computes can_edit server-side, mirroring the row-level rules (RLS still decides on write). */
export async function computeCanEdit(
  supabase: SupabaseClient,
  ctx: ToolContext,
  row: { id?: string; user_id: string | null; kind: string | null; pregen_campaign_id: string | null },
): Promise<boolean> {
  const userId = ctx.getUserId() ?? null;
  let isGm = false;
  if (row.kind === "pregen" && row.pregen_campaign_id && userId) {
    const { data } = await supabase.rpc("is_campaign_gm", { _user_id: userId, _campaign_id: row.pregen_campaign_id });
    isGm = data === true;
  }
  let isMemberGm = false;
  if (row.kind !== "pregen" && userId && row.user_id !== userId && row.id) {
    const { data } = await supabase.rpc("is_gm_of_character_member" as never, { _uid: userId, _character_id: row.id } as never);
    isMemberGm = data === true;
  }
  return canEditCharacter(row, userId, isGm, isMemberGm);
}
