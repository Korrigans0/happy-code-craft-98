// Central API client — implemented directly on Supabase.
// The exported *Api objects keep the same shape as before so all existing
// callsites (campaignsApi.list(), charactersApi.create(), …) keep working.

import { supabase } from "@/integrations/supabase/client";
import { formatPlanError } from "@/lib/plan-limits";

// Kept for backward compatibility with App.tsx wiring; no longer used.
export function setTokenGetter(_fn: () => Promise<string | null>) {}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Non authentifié");
  return data.user.id;
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) {
    const friendly = formatPlanError(res.error.message);
    throw new Error(friendly ?? res.error.message);
  }
  return res.data as T;
}

function randomInviteCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .slice(0, 8);
}

// ============== PROFILES ==============
export const profilesApi = {
  getMe: async () => {
    const userId = await uid();
    const r = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    if (r.error) throw new Error(r.error.message);
    if (r.data) return r.data;
    // Auto-create if missing
    const ins = await supabase.from("profiles").insert({ user_id: userId }).select().single();
    return unwrap(ins);
  },
  updateMe: async (data: { display_name?: string; avatar_url?: string | null }) => {
    const userId = await uid();
    const r = await supabase.from("profiles").update(data).eq("user_id", userId).select().single();
    return unwrap(r);
  },
};

// ============== CAMPAIGNS ==============
export const campaignsApi = {
  list: async () => {
    const userId = await uid();
    // Campaigns where the user is a member (incl. GM via the trigger)
    const memberships = await supabase
      .from("campaign_members")
      .select("campaign_id")
      .eq("user_id", userId);
    if (memberships.error) throw new Error(memberships.error.message);
    const ids = (memberships.data ?? []).map((m: { campaign_id: string }) => m.campaign_id);
    if (ids.length === 0) return [];
    const r = await supabase
      .from("campaigns")
      .select("*")
      .in("id", ids)
      .order("updated_at", { ascending: false });
    return unwrap(r) ?? [];
  },
  create: async (data: Record<string, unknown>) => {
    const userId = await uid();
    const payload: Record<string, unknown> = {
      title: (data.title as string) ?? "Nouvelle campagne",
      description: (data.description as string) ?? null,
      system: (data.system as string) ?? "aetheria",
      image_url: (data.image_url as string) ?? null,
      is_active: data.is_active !== false,
      invite_code: (data.invite_code as string) ?? randomInviteCode(),
      discord_link: (data.discord_link as string) ?? null,
      summary: (data.summary as string) ?? null,
      planned_sessions: (data.planned_sessions as number) ?? null,
      level_min: (data.level_min as number) ?? null,
      level_max: (data.level_max as number) ?? null,
      max_players: (data.max_players as number) ?? null,
      schedule: (data.schedule as string) ?? null,
      tone: (data.tone as string) ?? null,
      tags: (data.tags as string[]) ?? [],
      user_id: userId,
    };
    const r = await supabase.from("campaigns").insert(payload as never).select().single();
    return unwrap(r);
  },
  get: async (id: string) => {
    const r = await supabase.from("campaigns").select("*").eq("id", id).single();
    return unwrap(r);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const r = await supabase.from("campaigns").update(data).eq("id", id).select().single();
    return unwrap(r);
  },
  delete: async (id: string) => {
    const r = await supabase.from("campaigns").delete().eq("id", id);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  },
  join: async (invite_code: string) => {
    const { data, error } = await supabase.rpc("join_campaign_by_invite_code", {
      _code: invite_code.trim(),
    });
    if (error) {
      const friendly = formatPlanError(error.message);
      if (friendly) throw new Error(friendly);
      throw new Error("Code d'invitation invalide");
    }
    if (!data) throw new Error("Code d'invitation invalide");
    return { campaign_id: data as string };
  },
  getMembers: async (id: string) => {
    const r = await supabase.from("campaign_members").select("*").eq("campaign_id", id);
    return unwrap(r) ?? [];
  },
  removeMember: async (id: string, memberId: string) => {
    const r = await supabase.from("campaign_members").delete().eq("id", memberId).eq("campaign_id", id);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  },
  assignCharacter: async (id: string, memberId: string, characterId: string | null) => {
    const r = await supabase
      .from("campaign_members")
      .update({ character_id: characterId })
      .eq("id", memberId)
      .eq("campaign_id", id)
      .select()
      .single();
    return unwrap(r);
  },
  getMessages: async (id: string) => {
    const r = await supabase
      .from("campaign_messages")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: true });
    return unwrap(r) ?? [];
  },
  postMessage: async (id: string, data: Record<string, unknown>) => {
    const userId = await uid();
    const r = await supabase
      .from("campaign_messages")
      .insert({
        campaign_id: id,
        user_id: userId,
        content: (data.content as string) ?? "",
        message_type: (data.message_type as string) ?? "chat",
        metadata: (data.metadata as Record<string, unknown>) ?? {},
      })
      .select()
      .single();
    return unwrap(r);
  },
  clearMessages: async (id: string, scope: "chat" | "gm" | "all" = "all") => {
    // Server-side enforced: edge function checks GM role and writes an audit log entry.
    const { data, error } = await supabase.functions.invoke("clear-campaign-messages", {
      body: { campaign_id: id, scope },
    });
    if (error) throw new Error(error.message);
    return data ?? { ok: true };
  },
  getAuditLog: async (id: string) => {
    const r = await supabase
      .from("campaign_audit_log")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    return unwrap(r) ?? [];
  },
  getNotes: async (id: string) => {
    const r = await supabase
      .from("campaign_notes")
      .select("*")
      .eq("campaign_id", id)
      .order("updated_at", { ascending: false });
    return unwrap(r) ?? [];
  },
  createNote: async (id: string, data: Record<string, unknown>) => {
    const userId = await uid();
    const r = await supabase
      .from("campaign_notes")
      .insert({
        campaign_id: id,
        user_id: userId,
        title: (data.title as string) ?? "Note",
        content: (data.content as string) ?? "",
        is_gm_only: !!data.is_gm_only,
      })
      .select()
      .single();
    return unwrap(r);
  },
  updateNote: async (_id: string, noteId: string, data: Record<string, unknown>) => {
    const r = await supabase.from("campaign_notes").update(data).eq("id", noteId).select().single();
    return unwrap(r);
  },
  deleteNote: async (_id: string, noteId: string) => {
    const r = await supabase.from("campaign_notes").delete().eq("id", noteId);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  },
  getCampaignCharacters: async (id: string) => {
    const members = await supabase
      .from("campaign_members")
      .select("character_id")
      .eq("campaign_id", id)
      .not("character_id", "is", null);
    if (members.error) throw new Error(members.error.message);
    const ids = (members.data ?? []).map((m: { character_id: string }) => m.character_id).filter(Boolean);
    if (!ids.length) return [];
    const r = await supabase.from("characters").select("*").in("id", ids);
    return unwrap(r) ?? [];
  },
  getSessions: async (id: string) => {
    const r = await supabase
      .from("campaign_sessions")
      .select("*")
      .eq("campaign_id", id)
      .order("session_number", { ascending: true });
    return unwrap(r) ?? [];
  },
  createSession: async (id: string, data: Record<string, unknown>) => {
    const r = await supabase
      .from("campaign_sessions")
      .insert({ ...data, campaign_id: id })
      .select()
      .single();
    return unwrap(r);
  },
  updateSession: async (_id: string, sessionId: string, data: Record<string, unknown>) => {
    const payload: Record<string, unknown> = { ...data };
    if (payload.mark_complete) {
      payload.completed_at = new Date().toISOString();
      delete payload.mark_complete;
    }
    const r = await supabase.from("campaign_sessions").update(payload).eq("id", sessionId).select().single();
    return unwrap(r);
  },
  markSessionComplete: async (id: string, sessionId: string) =>
    campaignsApi.updateSession(id, sessionId, { mark_complete: true }),
  deleteSession: async (_id: string, sessionId: string) => {
    const r = await supabase.from("campaign_sessions").delete().eq("id", sessionId);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  },
  getTabletop: async (id: string) => {
    const r = await supabase.from("tabletop_state").select("*").eq("campaign_id", id).maybeSingle();
    if (r.error) throw new Error(r.error.message);
    return r.data ?? { campaign_id: id, tokens: [], drawings: [], pan_offset: { x: 0, y: 0 }, zoom: 1, fog_visible: false };
  },
  saveTabletop: async (id: string, data: Record<string, unknown>) => {
    const userId = await uid();
    const r = await supabase
      .from("tabletop_state")
      .upsert({ ...data, campaign_id: id, updated_by: userId }, { onConflict: "campaign_id" })
      .select()
      .single();
    return unwrap(r);
  },
  // Proposals: not in schema — degrade gracefully
  getProposals: async (_id: string) => [],
  submitProposal: async (_id: string, _characterId: string) => ({ ok: true }),
  reviewProposal: async (_id: string, _proposalId: string, _status: "accepted" | "rejected") => ({ ok: true }),
  cancelProposal: async (_id: string, _proposalId: string) => ({ ok: true }),
  getMyCharacters: async () => charactersApi.list(),
  getCombat: async (id: string) => {
    const enc = await supabase
      .from("combat_encounters")
      .select("*")
      .eq("campaign_id", id)
      .eq("is_active", true)
      .maybeSingle();
    if (enc.error) throw new Error(enc.error.message);
    if (!enc.data) return null;
    const parts = await supabase
      .from("combat_participants")
      .select("*")
      .eq("encounter_id", enc.data.id)
      .order("turn_order", { ascending: true });
    if (parts.error) throw new Error(parts.error.message);
    return { ...enc.data, participants: parts.data ?? [] };
  },
  createCombat: async (id: string, name: string) => {
    const r = await supabase
      .from("combat_encounters")
      .insert({ campaign_id: id, name, is_active: true, current_turn: 0, round: 1 })
      .select()
      .single();
    return unwrap(r);
  },
  updateCombat: async (id: string, data: Record<string, unknown>) => {
    const r = await supabase
      .from("combat_encounters")
      .update(data)
      .eq("campaign_id", id)
      .eq("is_active", true)
      .select()
      .single();
    return unwrap(r);
  },
  endCombat: async (id: string) => {
    const r = await supabase
      .from("combat_encounters")
      .update({ is_active: false })
      .eq("campaign_id", id)
      .eq("is_active", true);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  },
  addCombatParticipant: async (id: string, data: Record<string, unknown>) => {
    const enc = await supabase
      .from("combat_encounters")
      .select("id")
      .eq("campaign_id", id)
      .eq("is_active", true)
      .single();
    if (enc.error) throw new Error(enc.error.message);
    const r = await supabase
      .from("combat_participants")
      .insert({ ...data, encounter_id: enc.data.id })
      .select()
      .single();
    return unwrap(r);
  },
  updateCombatParticipant: async (_id: string, pid: string, data: Record<string, unknown>) => {
    const r = await supabase.from("combat_participants").update(data).eq("id", pid).select().single();
    return unwrap(r);
  },
  removeCombatParticipant: async (_id: string, pid: string) => {
    const r = await supabase.from("combat_participants").delete().eq("id", pid);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  },
};

// ============== CHARACTERS ==============
export const charactersApi = {
  list: async () => {
    const userId = await uid();
    const r = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    return unwrap(r) ?? [];
  },
  create: async (data: Record<string, unknown>) => {
    const userId = await uid();
    const r = await supabase
      .from("characters")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    return unwrap(r);
  },
  get: async (id: string) => {
    const r = await supabase.from("characters").select("*").eq("id", id).single();
    return unwrap(r);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const r = await supabase.from("characters").update(data).eq("id", id).select().single();
    return unwrap(r);
  },
  delete: async (id: string) => {
    const r = await supabase.from("characters").delete().eq("id", id);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  },
};

// ============== COMPENDIUM ==============
async function listTable(table: string) {
  const r = await supabase.from(table).select("*").order("created_at", { ascending: false });
  return unwrap(r) ?? [];
}
async function listTableBySystem(table: string, system?: string) {
  let q: any = supabase.from(table).select("*");
  if (system) q = q.eq("system", system);
  q = q.order("created_at", { ascending: false });
  const r = await q;
  return unwrap(r) ?? [];
}
async function createInTable(table: string, data: Record<string, unknown>) {
  const userId = await uid();
  const r = await supabase.from(table).insert({ ...data, created_by: userId }).select().single();
  return unwrap(r);
}

async function listMyTable(table: string) {
  const userId = await uid();
  if (!userId) return [];
  const r = await supabase.from(table).select("*").eq("created_by", userId).order("created_at", { ascending: false });
  return unwrap(r) ?? [];
}
async function deleteFromTable(table: string, id: string) {
  const r = await supabase.from(table).delete().eq("id", id);
  if (r.error) throw new Error(r.error.message);
  return { ok: true };
}
async function updateInTable(table: string, id: string, patch: Record<string, unknown>) {
  const r = await supabase.from(table).update(patch).eq("id", id).select().single();
  return unwrap(r);
}

export const compendiumApi = {
  getSpells: (system?: string) => listTableBySystem("spells", system),
  createSpell: (d: Record<string, unknown>) => createInTable("spells", d),
  updateSpell: (id: string, d: Record<string, unknown>) => updateInTable("spells", id, d),
  deleteSpell: (id: string) => deleteFromTable("spells", id),
  getMonsters: (system?: string) => listTableBySystem("monsters", system),
  createMonster: (d: Record<string, unknown>) => createInTable("monsters", d),
  updateMonster: (id: string, d: Record<string, unknown>) => updateInTable("monsters", id, d),
  deleteMonster: (id: string) => deleteFromTable("monsters", id),
  getItems: (system?: string) => listTableBySystem("magic_items", system),
  createItem: (d: Record<string, unknown>) => createInTable("magic_items", d),
  updateItem: (id: string, d: Record<string, unknown>) => updateInTable("magic_items", id, d),
  deleteItem: (id: string) => deleteFromTable("magic_items", id),
  // Bibliothèque MJ : uniquement le contenu créé par l'utilisateur courant.
  getMyMonsters: () => listMyTable("monsters"),
  getMySpells: () => listMyTable("spells"),
  getMyItems: () => listMyTable("magic_items"),
  getWaCreatures: () => listTable("wa_creatures"),
  createWaCreature: (d: Record<string, unknown>) => createInTable("wa_creatures", d),
  syncWaCreatures: async () => {
    return { ok: true, synced: 0 };
  },
  getAetheriaCreatures: () => listTable("aetheria_creatures"),
  createAetheriaCreature: (d: Record<string, unknown>) => createInTable("aetheria_creatures", d),
  deleteAetheriaCreature: async (id: string) => {
    const r = await supabase.from("aetheria_creatures").delete().eq("id", id);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  },
};


// ============== ROLES ==============
export const rolesApi = {
  isAdmin: async (): Promise<boolean> => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return false;
    const r = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (r.error) return false;
    return !!r.data;
  },
};

