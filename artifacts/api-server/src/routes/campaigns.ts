import { Router } from "express";
import { db } from "@workspace/db";
import {
  campaignsTable, campaignMembersTable, campaignMessagesTable,
  campaignNotesTable, campaignSessionsTable, tabletopStateTable,
  profilesTable, charactersTable,
} from "@workspace/db";
import { eq, inArray, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const generateInviteCode = () => randomBytes(3).toString("hex").toUpperCase();

function serializeCampaign(c: any) {
  return {
    id: c.id, user_id: c.userId, title: c.title, description: c.description,
    system: c.system, is_active: c.isActive, invite_code: c.inviteCode,
    image_url: c.imageUrl, discord_link: c.discordLink,
    created_at: c.createdAt, updated_at: c.updatedAt,
  };
}

function serializeMember(m: any) {
  return {
    id: m.id, campaign_id: m.campaignId, user_id: m.userId,
    role: m.role, character_id: m.characterId, joined_at: m.joinedAt,
  };
}

function serializeMessage(m: any) {
  return {
    id: m.id, campaign_id: m.campaignId, user_id: m.userId,
    content: m.content, message_type: m.messageType,
    metadata: m.metadata, created_at: m.createdAt,
  };
}

function serializeNote(n: any) {
  return {
    id: n.id, campaign_id: n.campaignId, user_id: n.userId,
    title: n.title, content: n.content, is_gm_only: n.isGmOnly,
    created_at: n.createdAt, updated_at: n.updatedAt,
  };
}

function serializeSession(s: any) {
  return {
    id: s.id, campaign_id: s.campaignId, title: s.title,
    description: s.description, notes: s.notes,
    session_number: s.sessionNumber, scheduled_at: s.scheduledAt,
    completed_at: s.completedAt, created_at: s.createdAt, updated_at: s.updatedAt,
  };
}

async function isMember(campaignId: string, userId: string): Promise<boolean> {
  const [row] = await db.select({ id: campaignMembersTable.id })
    .from(campaignMembersTable)
    .where(and(
      eq(campaignMembersTable.campaignId, campaignId),
      eq(campaignMembersTable.userId, userId),
    ));
  return !!row;
}

// GET /api/campaigns
router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId! as string;

  const owned = await db.select().from(campaignsTable)
    .where(eq(campaignsTable.userId, userId))
    .orderBy(desc(campaignsTable.createdAt));

  const memberships = await db.select({ campaignId: campaignMembersTable.campaignId })
    .from(campaignMembersTable).where(eq(campaignMembersTable.userId, userId));

  const joinedIds = memberships
    .map(m => m.campaignId)
    .filter((id): id is string => !!id && !owned.find(c => c.id === id));

  let joined: typeof owned = [];
  if (joinedIds.length > 0) {
    joined = await db.select().from(campaignsTable)
      .where(inArray(campaignsTable.id, joinedIds))
      .orderBy(desc(campaignsTable.createdAt));
  }

  res.json([...owned, ...joined].map(serializeCampaign));
});

// POST /api/campaigns
router.post("/", requireAuth, async (req, res) => {
  const userId = req.userId! as string;
  const { title, description, system, is_active } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }

  const [campaign] = await db.insert(campaignsTable).values({
    userId, title, description, system: system || "Aetheria",
    isActive: is_active !== undefined ? is_active : true,
    inviteCode: generateInviteCode(),
  }).returning();

  await db.insert(campaignMembersTable).values({ campaignId: campaign.id, userId, role: "gm" });
  res.status(201).json(serializeCampaign(campaign));
});

// POST /api/campaigns/join (must be before /:id)
router.post("/join", requireAuth, async (req, res) => {
  const userId = req.userId! as string;
  const { invite_code } = req.body;
  if (!invite_code) { res.status(400).json({ error: "invite_code required" }); return; }

  const [campaign] = await db.select().from(campaignsTable)
    .where(eq(campaignsTable.inviteCode, String(invite_code).trim().toUpperCase()));
  if (!campaign) { res.status(404).json({ error: "Code invalide" }); return; }

  const [existing] = await db.select().from(campaignMembersTable)
    .where(and(eq(campaignMembersTable.campaignId, campaign.id), eq(campaignMembersTable.userId, userId)));
  if (existing) { res.status(400).json({ error: "Vous êtes déjà membre" }); return; }

  await db.insert(campaignMembersTable).values({ campaignId: campaign.id, userId, role: "player" });
  res.json({ campaign_id: campaign.id });
});

// GET /api/campaigns/:id
router.get("/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }
  res.json(serializeCampaign(campaign));
});

// PATCH /api/campaigns/:id
router.patch("/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  const { title, description, system, is_active, discord_link, invite_code } = req.body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (system !== undefined) updates.system = system;
  if (is_active !== undefined) updates.isActive = is_active;
  if (discord_link !== undefined) updates.discordLink = discord_link;
  if (invite_code !== undefined) updates.inviteCode = invite_code;

  const [campaign] = await db.update(campaignsTable).set(updates)
    .where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, userId)))
    .returning();
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeCampaign(campaign));
});

// DELETE /api/campaigns/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  await db.delete(campaignsTable).where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, userId)));
  res.json({ success: true });
});

// GET /api/campaigns/:id/members — enriched with profile + assigned character info
router.get("/:id/members", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }

  const members = await db.select().from(campaignMembersTable)
    .where(eq(campaignMembersTable.campaignId, id));

  const userIds = [...new Set(members.map(m => m.userId))];
  const characterIds = members.map(m => m.characterId).filter((c): c is string => !!c);

  const [profiles, characters] = await Promise.all([
    userIds.length > 0
      ? db.select({ userId: profilesTable.userId, displayName: profilesTable.displayName, avatarUrl: profilesTable.avatarUrl })
          .from(profilesTable).where(inArray(profilesTable.userId, userIds))
      : Promise.resolve([]),
    characterIds.length > 0
      ? db.select({ id: charactersTable.id, name: charactersTable.name, race: charactersTable.race, class: charactersTable.class, level: charactersTable.level })
          .from(charactersTable).where(inArray(charactersTable.id, characterIds))
      : Promise.resolve([]),
  ]);

  const profileMap = Object.fromEntries(profiles.map(p => [p.userId, p]));
  const characterMap = Object.fromEntries(characters.map(c => [c.id, c]));

  res.json(members.map(m => ({
    ...serializeMember(m),
    display_name: profileMap[m.userId]?.displayName ?? null,
    avatar_url: profileMap[m.userId]?.avatarUrl ?? null,
    character_name: m.characterId ? (characterMap[m.characterId]?.name ?? null) : null,
    character_class: m.characterId ? (characterMap[m.characterId]?.class ?? null) : null,
    character_race: m.characterId ? (characterMap[m.characterId]?.race ?? null) : null,
    character_level: m.characterId ? (characterMap[m.characterId]?.level ?? null) : null,
  })));
});

// GET /api/campaigns/:id/characters — characters of all campaign members (for GM assignment)
router.get("/:id/characters", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }

  const members = await db.select({ userId: campaignMembersTable.userId })
    .from(campaignMembersTable).where(eq(campaignMembersTable.campaignId, id));
  const memberIds = [...new Set(members.map(m => m.userId))];
  if (memberIds.length === 0) { res.json([]); return; }

  const chars = await db.select({
    id: charactersTable.id, name: charactersTable.name,
    race: charactersTable.race, class: charactersTable.class,
    level: charactersTable.level, hp: charactersTable.hp,
    maxHp: charactersTable.maxHp, armorClass: charactersTable.armorClass,
    dexterity: charactersTable.dexterity, userId: charactersTable.userId,
  }).from(charactersTable).where(inArray(charactersTable.userId, memberIds));
  res.json(chars.map(c => ({ ...c, max_hp: c.maxHp, armor_class: c.armorClass, user_id: c.userId })));
});

// DELETE /api/campaigns/:id/members/:memberId
router.delete("/:id/members/:memberId", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const memberId = String(req.params.memberId);
  const userId = req.userId! as string;
  const [gm] = await db.select({ userId: campaignsTable.userId })
    .from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!gm || gm.userId !== userId) {
    res.status(403).json({ error: "Seul le MJ peut retirer des membres" }); return;
  }
  await db.delete(campaignMembersTable).where(and(
    eq(campaignMembersTable.campaignId, id),
    eq(campaignMembersTable.id, memberId),
  ));
  res.json({ success: true });
});

// PATCH /api/campaigns/:id/members/:memberId
router.patch("/:id/members/:memberId", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const memberId = String(req.params.memberId);
  const userId = req.userId! as string;
  const [gm] = await db.select({ userId: campaignsTable.userId })
    .from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!gm || gm.userId !== userId) {
    res.status(403).json({ error: "Seul le MJ peut assigner des personnages" }); return;
  }
  const { character_id } = req.body;
  const [updated] = await db.update(campaignMembersTable)
    .set({ characterId: character_id || null })
    .where(and(
      eq(campaignMembersTable.campaignId, id),
      eq(campaignMembersTable.id, memberId),
    ))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeMember(updated));
});

// GET /api/campaigns/:id/messages
router.get("/:id/messages", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }
  const messages = await db.select().from(campaignMessagesTable)
    .where(eq(campaignMessagesTable.campaignId, id))
    .orderBy(desc(campaignMessagesTable.createdAt))
    .limit(100);
  res.json(messages.reverse().map(serializeMessage));
});

// POST /api/campaigns/:id/messages
router.post("/:id/messages", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }
  const { content, message_type, metadata } = req.body;
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const [msg] = await db.insert(campaignMessagesTable).values({
    campaignId: id, userId, content,
    messageType: message_type || "chat",
    metadata: metadata ? JSON.stringify(metadata) : null,
  }).returning();
  res.status(201).json(serializeMessage(msg));
});

// GET /api/campaigns/:id/notes
router.get("/:id/notes", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }

  const [gm] = await db.select({ userId: campaignsTable.userId })
    .from(campaignsTable).where(eq(campaignsTable.id, id));
  const isGm = gm?.userId === userId;

  const notes = await db.select().from(campaignNotesTable)
    .where(eq(campaignNotesTable.campaignId, id))
    .orderBy(desc(campaignNotesTable.createdAt));
  const filtered = isGm ? notes : notes.filter(n => !n.isGmOnly);
  res.json(filtered.map(serializeNote));
});

// POST /api/campaigns/:id/notes
router.post("/:id/notes", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }
  const { title, content, is_gm_only } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }

  const [note] = await db.insert(campaignNotesTable).values({
    campaignId: id, userId, title, content, isGmOnly: is_gm_only || false,
  }).returning();
  res.status(201).json(serializeNote(note));
});

// PATCH /api/campaigns/:id/notes/:noteId
router.patch("/:id/notes/:noteId", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const noteId = String(req.params.noteId);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }

  const [gm] = await db.select({ userId: campaignsTable.userId })
    .from(campaignsTable).where(eq(campaignsTable.id, id));
  const isGm = gm?.userId === userId;

  const { title, content, is_gm_only } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (is_gm_only !== undefined && isGm) updates.isGmOnly = is_gm_only;

  const ownerClause = and(
    eq(campaignNotesTable.campaignId, id),
    eq(campaignNotesTable.id, noteId),
    isGm ? undefined : eq(campaignNotesTable.userId, userId),
  );

  const [note] = await db.update(campaignNotesTable).set(updates)
    .where(ownerClause!).returning();
  if (!note) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeNote(note));
});

// DELETE /api/campaigns/:id/notes/:noteId
router.delete("/:id/notes/:noteId", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const noteId = String(req.params.noteId);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }

  const [gm] = await db.select({ userId: campaignsTable.userId })
    .from(campaignsTable).where(eq(campaignsTable.id, id));
  const isGm = gm?.userId === userId;

  const clause = and(
    eq(campaignNotesTable.campaignId, id),
    eq(campaignNotesTable.id, noteId),
    isGm ? undefined : eq(campaignNotesTable.userId, userId),
  );

  await db.delete(campaignNotesTable).where(clause!);
  res.json({ success: true });
});

// GET /api/campaigns/:id/sessions
router.get("/:id/sessions", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }
  const sessions = await db.select().from(campaignSessionsTable)
    .where(eq(campaignSessionsTable.campaignId, id))
    .orderBy(desc(campaignSessionsTable.createdAt));
  res.json(sessions.map(serializeSession));
});

// POST /api/campaigns/:id/sessions
router.post("/:id/sessions", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  const [gm] = await db.select({ userId: campaignsTable.userId })
    .from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!gm || gm.userId !== userId) {
    res.status(403).json({ error: "Seul le MJ peut créer des sessions" }); return;
  }
  const { title, description, notes, session_number } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }

  const [session] = await db.insert(campaignSessionsTable).values({
    campaignId: id, title, description, notes,
    sessionNumber: session_number?.toString() || "1",
  }).returning();
  res.status(201).json(serializeSession(session));
});

// PATCH /api/campaigns/:id/sessions/:sessionId
router.patch("/:id/sessions/:sessionId", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const sessionId = String(req.params.sessionId);
  const userId = req.userId! as string;
  const [gm] = await db.select({ userId: campaignsTable.userId })
    .from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!gm || gm.userId !== userId) {
    res.status(403).json({ error: "Seul le MJ peut modifier les sessions" }); return;
  }

  const { title, description, notes, scheduled_at, mark_complete } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (notes !== undefined) updates.notes = notes;
  if (scheduled_at !== undefined) updates.scheduledAt = scheduled_at ? new Date(scheduled_at) : null;
  if (mark_complete === true) updates.completedAt = new Date();
  if (mark_complete === false) updates.completedAt = null;

  const [session] = await db.update(campaignSessionsTable).set(updates)
    .where(and(
      eq(campaignSessionsTable.campaignId, id),
      eq(campaignSessionsTable.id, sessionId),
    ))
    .returning();
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeSession(session));
});

// DELETE /api/campaigns/:id/sessions/:sessionId
router.delete("/:id/sessions/:sessionId", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const sessionId = String(req.params.sessionId);
  const userId = req.userId! as string;
  const [gm] = await db.select({ userId: campaignsTable.userId })
    .from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!gm || gm.userId !== userId) {
    res.status(403).json({ error: "Seul le MJ peut supprimer des sessions" }); return;
  }
  await db.delete(campaignSessionsTable).where(and(
    eq(campaignSessionsTable.campaignId, id),
    eq(campaignSessionsTable.id, sessionId),
  ));
  res.json({ success: true });
});

// GET /api/campaigns/:id/tabletop
router.get("/:id/tabletop", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }
  const [state] = await db.select().from(tabletopStateTable)
    .where(eq(tabletopStateTable.campaignId, id));
  if (!state) {
    res.json({ tokens: [], drawings: [], map_image_url: null, fog_visible: false, zoom: 1, pan_offset: { x: 0, y: 0 } });
    return;
  }
  res.json({
    id: state.id, campaign_id: state.campaignId,
    tokens: JSON.parse(state.tokens || "[]"),
    drawings: JSON.parse(state.drawings || "[]"),
    map_image_url: state.mapImageUrl, fog_visible: state.fogVisible,
    zoom: parseFloat(state.zoom || "1"),
    pan_offset: state.panOffset ? JSON.parse(state.panOffset) : { x: 0, y: 0 },
    updated_by: state.updatedBy, updated_at: state.updatedAt,
  });
});

// POST /api/campaigns/:id/tabletop
router.post("/:id/tabletop", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId! as string;
  if (!(await isMember(id, userId))) { res.status(403).json({ error: "Accès refusé" }); return; }
  const { tokens, drawings, map_image_url, fog_visible, zoom, pan_offset } = req.body;

  const payload = {
    campaignId: id,
    tokens: JSON.stringify(tokens || []),
    drawings: JSON.stringify(drawings || []),
    mapImageUrl: (map_image_url as string) || null,
    fogVisible: fog_visible || false,
    zoom: zoom?.toString() || "1",
    panOffset: JSON.stringify(pan_offset || { x: 0, y: 0 }),
    updatedBy: userId,
    updatedAt: new Date(),
  };

  const [existing] = await db.select().from(tabletopStateTable)
    .where(eq(tabletopStateTable.campaignId, id));
  if (existing) {
    const [updated] = await db.update(tabletopStateTable).set(payload)
      .where(eq(tabletopStateTable.campaignId, id)).returning();
    res.json(updated); return;
  }
  const [created] = await db.insert(tabletopStateTable).values(payload).returning();
  res.json(created);
});

export default router;
