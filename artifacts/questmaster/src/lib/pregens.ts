/**
 * Pregenerated characters (pré-tirés) — thin client over secured RPCs.
 * All permission checks happen server-side (RLS + SECURITY DEFINER functions).
 */
import { supabase } from "@/integrations/supabase/client";
import { toFriendlyMessage } from "@/lib/friendly-errors";

const db = supabase as any;

export interface PregenAssignment {
  user_id: string;
  display_name: string | null;
  is_me: boolean;
}

export interface PregenEntry {
  character: Record<string, any>;
  assigned: PregenAssignment[];
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(toFriendlyMessage(error) || error.message);
  return data as T;
}

export const pregensApi = {
  list: (campaignId: string) =>
    rpc<PregenEntry[]>("list_campaign_pregens", { _campaign_id: campaignId }).then((d) => d ?? []),
  claim: (pregenId: string) => rpc<string>("claim_pregen_character", { _pregen_id: pregenId }),
  assign: (pregenId: string, userId: string) =>
    rpc<string>("gm_assign_pregen", { _pregen_id: pregenId, _user_id: userId }),
  unassign: (pregenId: string, userId: string) =>
    rpc<void>("gm_unassign_pregen", { _pregen_id: pregenId, _user_id: userId }),
  duplicate: (pregenId: string) => rpc<string>("duplicate_pregen", { _pregen_id: pregenId }),
  publish: (pregenId: string, title: string, description: string, tags: string[] = []) =>
    rpc<string>("publish_pregen_to_shop", { _pregen_id: pregenId, _title: title, _description: description, _tags: tags }),
  addFromLibrary: (homebrewId: string, campaignId: string) =>
    rpc<string>("add_library_pregen_to_campaign", { _homebrew_id: homebrewId, _campaign_id: campaignId }),
  update: async (pregenId: string, patch: Record<string, unknown>) => {
    const { error } = await db.from("characters").update(patch).eq("id", pregenId);
    if (error) throw new Error(toFriendlyMessage(error) || error.message);
  },
  remove: async (pregenId: string) => {
    const { error } = await db.from("characters").delete().eq("id", pregenId);
    if (error) throw new Error(toFriendlyMessage(error) || error.message);
  },
};

export const PREGEN_KIND = "pregen_character";
