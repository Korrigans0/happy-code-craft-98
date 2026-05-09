import { Router } from "express";
import { db } from "@workspace/db";
import {
  campaignsTable, campaignMembersTable, campaignMessagesTable,
  campaignNotesTable, campaignSessionsTable, tabletopStateTable
} from "@workspace/db";
import { eq, or, inArray, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

const router = Router();

const generateInviteCode = () => randomBytes(3).toString("hex").toUpperCase();

// GET /api/campaigns — list user's campaigns (owned + joined)
router.get("/", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const owned = await db.select().from(campaignsTable).where(eq(campaignsTable.userId, userId)).orderBy(desc(campaignsTable.createdAt));

  const memberships = await db.select({ campaignId: campaignMembersTable.campaignId })
    .from(campaignMembersTable).where(eq(campaignMembersTable.userId, userId));

  const joinedIds = memberships.map(m => m.campaignId).filter(id => !owned.find(c => c.id === id));

  let joined: typeof owned = [];
  if (joinedIds.length > 0) {
    joined = await db.select().from(campaignsTable).where(inArray(campaignsTable.id, joinedIds)).orderBy(desc(campaignsTable.createdAt));
  }

  res.json([...owned, ...joined]);
});

// POST /api/campaigns
router.post("/", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { title, description, system, is_active } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });

  const [campaign] = await db.insert(campaignsTable).values({
    userId, title, description, system: system || "Aetheria",
    isActive: is_active !== undefined ? is_active : true,
    inviteCode: generateInviteCode(),
  }).returning();

  res.status(201).json(campaign);
});

// GET /api/campaigns/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!campaign) return res.status(404).json({ error: "Not found" });
  res.json(campaign);
});

// PATCH /api/campaigns/:id
router.patch("/:id", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params;
  const { title, description, system, is_active } = req.body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (system !== undefined) updates.system = system;
  if (is_active !== undefined) updates.isActive = is_active;

  const [campaign] = await db.update(campaignsTable).set(updates).where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, userId))).returning();
  if (!campaign) return res.status(404).json({ error: "Not found" });
  res.json(campaign);
});

// DELETE /api/campaigns/:id
router.delete("/:id", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params;
  await db.delete(campaignsTable).where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, userId)));
  res.json({ success: true });
});

// POST /api/campaigns/join
router.post("/join", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { invite_code } = req.body;
  if (!invite_code) return res.status(400).json({ error: "invite_code required" });

  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.inviteCode, invite_code.trim().toUpperCase()));
  if (!campaign) return res.status(404).json({ error: "Code invalide" });

  const [existing] = await db.select().from(campaignMembersTable)
    .where(and(eq(campaignMembersTable.campaignId, campaign.id), eq(campaignMembersTable.userId, userId)));
  if (existing) return res.status(400).json({ error: "Vous êtes déjà membre" });

  await db.insert(campaignMembersTable).values({ campaignId: campaign.id, userId, role: "player" });
  res.json({ campaign_id: campaign.id });
});

// GET /api/campaigns/:id/members
router.get("/:id/members", async (req, res) => {
  const members = await db.select().from(campaignMembersTable).where(eq(campaignMembersTable.campaignId, req.params.id));
  res.json(members);
});

// GET /api/campaigns/:id/messages
router.get("/:id/messages", async (req, res) => {
  const messages = await db.select().from(campaignMessagesTable)
    .where(eq(campaignMessagesTable.campaignId, req.params.id))
    .orderBy(desc(campaignMessagesTable.createdAt))
    .limit(100);
  res.json(messages.reverse());
});

// POST /api/campaigns/:id/messages
router.post("/:id/messages", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { content, message_type, metadata } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });

  const [msg] = await db.insert(campaignMessagesTable).values({
    campaignId: req.params.id, userId, content,
    messageType: message_type || "chat",
    metadata: metadata ? JSON.stringify(metadata) : null,
  }).returning();
  res.status(201).json(msg);
});

// GET /api/campaigns/:id/notes
router.get("/:id/notes", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const notes = await db.select().from(campaignNotesTable)
    .where(eq(campaignNotesTable.campaignId, req.params.id))
    .orderBy(desc(campaignNotesTable.createdAt));
  res.json(notes);
});

// POST /api/campaigns/:id/notes
router.post("/:id/notes", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { title, content, is_gm_only } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });

  const [note] = await db.insert(campaignNotesTable).values({
    campaignId: req.params.id, userId, title, content, isGmOnly: is_gm_only || false,
  }).returning();
  res.status(201).json(note);
});

// DELETE /api/campaigns/:id/notes/:noteId
router.delete("/:id/notes/:noteId", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  await db.delete(campaignNotesTable).where(and(
    eq(campaignNotesTable.id, req.params.noteId),
    eq(campaignNotesTable.userId, userId),
  ));
  res.json({ success: true });
});

// GET /api/campaigns/:id/sessions
router.get("/:id/sessions", async (req, res) => {
  const sessions = await db.select().from(campaignSessionsTable)
    .where(eq(campaignSessionsTable.campaignId, req.params.id))
    .orderBy(desc(campaignSessionsTable.createdAt));
  res.json(sessions);
});

// POST /api/campaigns/:id/sessions
router.post("/:id/sessions", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { title, description, notes, session_number } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });

  const [session] = await db.insert(campaignSessionsTable).values({
    campaignId: req.params.id, title, description, notes,
    sessionNumber: session_number?.toString() || "1",
  }).returning();
  res.status(201).json(session);
});

// DELETE /api/campaigns/:id/sessions/:sessionId
router.delete("/:id/sessions/:sessionId", async (req, res) => {
  await db.delete(campaignSessionsTable).where(eq(campaignSessionsTable.id, req.params.sessionId));
  res.json({ success: true });
});

// GET /api/campaigns/:id/tabletop
router.get("/:id/tabletop", async (req, res) => {
  const [state] = await db.select().from(tabletopStateTable)
    .where(eq(tabletopStateTable.campaignId, req.params.id));
  if (!state) {
    return res.json({ tokens: [], drawings: [], map_image_url: null, fog_visible: false, zoom: 1, pan_offset: { x: 0, y: 0 } });
  }
  res.json({
    ...state,
    tokens: JSON.parse(state.tokens || "[]"),
    drawings: JSON.parse(state.drawings || "[]"),
    pan_offset: state.panOffset ? JSON.parse(state.panOffset) : { x: 0, y: 0 },
    zoom: parseFloat(state.zoom || "1"),
  });
});

// POST /api/campaigns/:id/tabletop
router.post("/:id/tabletop", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const { tokens, drawings, map_image_url, fog_visible, zoom, pan_offset } = req.body;

  const payload = {
    campaignId: req.params.id,
    tokens: JSON.stringify(tokens || []),
    drawings: JSON.stringify(drawings || []),
    mapImageUrl: map_image_url || null,
    fogVisible: fog_visible || false,
    zoom: zoom?.toString() || "1",
    panOffset: JSON.stringify(pan_offset || { x: 0, y: 0 }),
    updatedBy: userId || null,
    updatedAt: new Date(),
  };

  const [existing] = await db.select().from(tabletopStateTable).where(eq(tabletopStateTable.campaignId, req.params.id));
  if (existing) {
    const [updated] = await db.update(tabletopStateTable).set(payload).where(eq(tabletopStateTable.campaignId, req.params.id)).returning();
    return res.json(updated);
  }
  const [created] = await db.insert(tabletopStateTable).values(payload).returning();
  res.json(created);
});

export default router;
