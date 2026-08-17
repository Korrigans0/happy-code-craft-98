// Preparation API — every read/write goes through RLS (GM of the campaign only).

import { supabase } from "@/integrations/supabase/client";
import { toFriendlyMessage } from "@/lib/friendly-errors";
import type { CampaignChapter, PrepScene, PrepSceneStatus } from "./types";

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

export interface ChapterInput {
  title: string;
  summary?: string | null;
  is_published?: boolean;
}

export interface SceneInput {
  chapter_id?: string | null;
  title: string;
  summary?: string | null;
  gm_notes?: string;
  status?: PrepSceneStatus;
  entity_ids?: string[];
  vtt_scene_id?: string | null;
  session_id?: string | null;
}

export const prepApi = {
  listChapters: async (campaignId: string): Promise<CampaignChapter[]> => {
    const r = await db
      .from("campaign_chapters")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("sort_order", { ascending: true });
    return unwrap<CampaignChapter[]>(r) ?? [];
  },

  listScenes: async (campaignId: string): Promise<PrepScene[]> => {
    const r = await db
      .from("campaign_prep_scenes")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("sort_order", { ascending: true });
    return unwrap<PrepScene[]>(r) ?? [];
  },

  createChapter: async (campaignId: string, input: ChapterInput, sortOrder: number) => {
    const userId = await uid();
    const r = await db
      .from("campaign_chapters")
      .insert({
        campaign_id: campaignId,
        title: input.title,
        summary: input.summary ?? null,
        is_published: input.is_published ?? false,
        sort_order: sortOrder,
        created_by: userId,
      })
      .select()
      .single();
    return unwrap<CampaignChapter>(r);
  },

  updateChapter: async (chapterId: string, patch: Partial<ChapterInput> & { sort_order?: number }) => {
    const r = await db.from("campaign_chapters").update(patch).eq("id", chapterId).select().single();
    return unwrap<CampaignChapter>(r);
  },

  removeChapter: async (chapterId: string) => {
    const r = await db.from("campaign_chapters").delete().eq("id", chapterId);
    if (r.error) fail(r.error);
    return { ok: true };
  },

  createScene: async (campaignId: string, input: SceneInput, sortOrder: number) => {
    const userId = await uid();
    const r = await db
      .from("campaign_prep_scenes")
      .insert({
        campaign_id: campaignId,
        chapter_id: input.chapter_id ?? null,
        title: input.title,
        summary: input.summary ?? null,
        gm_notes: input.gm_notes ?? "",
        status: input.status ?? "draft",
        entity_ids: input.entity_ids ?? [],
        vtt_scene_id: input.vtt_scene_id ?? null,
        sort_order: sortOrder,
        created_by: userId,
      })
      .select()
      .single();
    return unwrap<PrepScene>(r);
  },

  updateScene: async (
    sceneId: string,
    patch: Partial<SceneInput> & { sort_order?: number; chapter_id?: string | null },
  ) => {
    const r = await db.from("campaign_prep_scenes").update(patch).eq("id", sceneId).select().single();
    return unwrap<PrepScene>(r);
  },

  // --- Session agenda: link prepared scenes to a planned session ---

  listSessionScenes: async (campaignId: string, sessionId: string): Promise<PrepScene[]> => {
    const r = await db
      .from("campaign_prep_scenes")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("session_id", sessionId)
      .order("agenda_order", { ascending: true });
    return unwrap<PrepScene[]>(r) ?? [];
  },

  assignScenesToSession: async (sceneIds: string[], sessionId: string | null, startOrder = 0) => {
    await Promise.all(
      sceneIds.map((id, i) =>
        db
          .from("campaign_prep_scenes")
          .update({ session_id: sessionId, agenda_order: startOrder + i })
          .eq("id", id),
      ),
    );
    return { ok: true };
  },

  reorderAgenda: async (scenes: { id: string; agenda_order: number }[]) => {
    await Promise.all(
      scenes.map((s) => db.from("campaign_prep_scenes").update({ agenda_order: s.agenda_order }).eq("id", s.id)),
    );
    return { ok: true };
  },

  setSceneStatus: async (sceneId: string, status: PrepSceneStatus) => {
    const r = await db.from("campaign_prep_scenes").update({ status }).eq("id", sceneId).select().single();
    return unwrap<PrepScene>(r);
  },

  removeScene: async (sceneId: string) => {
    const r = await db.from("campaign_prep_scenes").delete().eq("id", sceneId);
    if (r.error) fail(r.error);
    return { ok: true };
  },

  // Persist a whole ordering in one round-trip-per-row (small lists, keeps RLS simple).
  reorderScenes: async (scenes: { id: string; chapter_id: string | null; sort_order: number }[]) => {
    await Promise.all(
      scenes.map((s) =>
        db
          .from("campaign_prep_scenes")
          .update({ chapter_id: s.chapter_id, sort_order: s.sort_order })
          .eq("id", s.id),
      ),
    );
    return { ok: true };
  },

  reorderChapters: async (chapters: { id: string; sort_order: number }[]) => {
    await Promise.all(
      chapters.map((c) => db.from("campaign_chapters").update({ sort_order: c.sort_order }).eq("id", c.id)),
    );
    return { ok: true };
  },
};
