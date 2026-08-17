// Codex API — server-backed. Every read/write goes through RLS: the client never
// decides who may see what, it only renders what the database returns.

import { supabase } from "@/integrations/supabase/client";
import { toFriendlyMessage } from "@/lib/friendly-errors";
import type {
  CampaignEntity,
  EntityKind,
  EntityLink,
  EntityRevision,
  PermissionLevel,
} from "./types";

// The generated client is untyped for these new tables; keep the casts local.
const db = supabase as any;

function fail(err: unknown): never {
  throw new Error(toFriendlyMessage(err));
}

function unwrap<T>(res: { data: T | null; error: unknown | null }): T {
  if (res.error) fail(res.error);
  return res.data as T;
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Vous devez être connecté pour effectuer cette action.");
  return data.user.id;
}

export interface EntityInput {
  kind: EntityKind;
  name: string;
  summary?: string | null;
  content?: Record<string, unknown>;
  tags?: string[];
  image_url?: string | null;
  visibility?: string;
  system?: string;
}

export const codexApi = {
  list: async (campaignId: string): Promise<CampaignEntity[]> => {
    const r = await db
      .from("campaign_entities")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true });
    return unwrap<CampaignEntity[]>(r) ?? [];
  },

  get: async (entityId: string): Promise<CampaignEntity | null> => {
    const r = await db.from("campaign_entities").select("*").eq("id", entityId).maybeSingle();
    if (r.error) fail(r.error);
    return (r.data as CampaignEntity) ?? null;
  },

  create: async (campaignId: string, system: string, input: EntityInput) => {
    const userId = await uid();
    const r = await db
      .from("campaign_entities")
      .insert({
        campaign_id: campaignId,
        // System isolation: an entity always belongs to the campaign's system.
        system: input.system ?? system,
        kind: input.kind,
        name: input.name,
        summary: input.summary ?? null,
        content: input.content ?? {},
        tags: input.tags ?? [],
        image_url: input.image_url ?? null,
        visibility: input.visibility ?? "gm_only",
        created_by: userId,
      })
      .select()
      .single();
    return unwrap<CampaignEntity>(r);
  },

  update: async (entityId: string, patch: Partial<EntityInput>) => {
    const r = await db.from("campaign_entities").update(patch).eq("id", entityId).select().single();
    return unwrap<CampaignEntity>(r);
  },

  remove: async (entityId: string) => {
    const r = await db.from("campaign_entities").delete().eq("id", entityId);
    if (r.error) fail(r.error);
    return { ok: true };
  },

  duplicate: async (entity: CampaignEntity) => {
    const userId = await uid();
    const r = await db
      .from("campaign_entities")
      .insert({
        campaign_id: entity.campaign_id,
        system: entity.system,
        kind: entity.kind,
        name: `${entity.name} (copie)`,
        summary: entity.summary,
        content: entity.content,
        tags: entity.tags,
        image_url: entity.image_url,
        visibility: entity.visibility,
        created_by: userId,
      })
      .select()
      .single();
    return unwrap<CampaignEntity>(r);
  },

  // ── GM private notes (separate table, GM-only RLS) ────────────────────────
  getGmNotes: async (entityId: string): Promise<string> => {
    const r = await db.from("entity_gm_notes").select("notes").eq("entity_id", entityId).maybeSingle();
    if (r.error) return "";
    return (r.data?.notes as string) ?? "";
  },

  saveGmNotes: async (entityId: string, campaignId: string, notes: string) => {
    const r = await db
      .from("entity_gm_notes")
      .upsert({ entity_id: entityId, campaign_id: campaignId, notes, updated_at: new Date().toISOString() },
        { onConflict: "entity_id" });
    if (r.error) fail(r.error);
    return { ok: true };
  },

  // ── Relations ─────────────────────────────────────────────────────────────
  getLinks: async (campaignId: string): Promise<EntityLink[]> => {
    const r = await db.from("entity_links").select("*").eq("campaign_id", campaignId);
    return unwrap<EntityLink[]>(r) ?? [];
  },

  addLink: async (campaignId: string, sourceId: string, targetId: string, relation: string) => {
    const r = await db
      .from("entity_links")
      .insert({ campaign_id: campaignId, source_id: sourceId, target_id: targetId, relation })
      .select()
      .single();
    return unwrap<EntityLink>(r);
  },

  removeLink: async (linkId: string) => {
    const r = await db.from("entity_links").delete().eq("id", linkId);
    if (r.error) fail(r.error);
    return { ok: true };
  },

  // ── Permissions ───────────────────────────────────────────────────────────
  getPermissions: async (entityId: string) => {
    const r = await db.from("entity_permissions").select("*").eq("entity_id", entityId);
    return unwrap<{ id: string; user_id: string; level: PermissionLevel }[]>(r) ?? [];
  },

  setPermission: async (
    entityId: string,
    campaignId: string,
    userId: string,
    level: PermissionLevel,
  ) => {
    if (level === "none") {
      const del = await db
        .from("entity_permissions")
        .delete()
        .eq("entity_id", entityId)
        .eq("user_id", userId);
      if (del.error) fail(del.error);
      return { ok: true };
    }
    const r = await db
      .from("entity_permissions")
      .upsert({ entity_id: entityId, campaign_id: campaignId, user_id: userId, level },
        { onConflict: "entity_id,user_id" });
    if (r.error) fail(r.error);
    return { ok: true };
  },

  // ── Revisions ─────────────────────────────────────────────────────────────
  getRevisions: async (entityId: string): Promise<EntityRevision[]> => {
    const r = await db
      .from("entity_revisions")
      .select("*")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(20);
    return unwrap<EntityRevision[]>(r) ?? [];
  },

  restoreRevision: async (entityId: string, snapshot: Record<string, any>) => {
    const r = await db
      .from("campaign_entities")
      .update({
        name: snapshot.name,
        summary: snapshot.summary,
        content: snapshot.content,
        tags: snapshot.tags,
        image_url: snapshot.image_url,
        visibility: snapshot.visibility,
      })
      .eq("id", entityId)
      .select()
      .single();
    return unwrap<CampaignEntity>(r);
  },
};
