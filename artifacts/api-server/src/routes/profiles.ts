import { Router } from "express";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

function serializeProfile(p: any) {
  // Strip any legacy "auth:" prefixed password hashes that may remain in old rows.
  // Avatar URLs are user-supplied image URLs and must never start with "auth:".
  const rawAvatar: string | null = p.avatarUrl ?? null;
  const avatarUrl =
    rawAvatar && rawAvatar.startsWith("auth:") ? null : rawAvatar;

  return {
    id: p.id,
    user_id: p.userId,
    display_name: p.displayName ?? null,
    avatar_url: avatarUrl,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

// GET /api/profiles/me
router.get("/me", requireAuth, async (req, res) => {
  const userId = req.userId!;

  let [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
  if (!profile) {
    [profile] = await db.insert(profilesTable).values({ userId }).returning();
  }
  res.json(serializeProfile(profile));
});

// PATCH /api/profiles/me
router.patch("/me", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { display_name, avatar_url } = req.body;

  // Reject any attempt to store legacy auth: prefixed password hashes.
  // Avatar URLs must be plain image URLs.
  if (typeof avatar_url === "string" && avatar_url.startsWith("auth:")) {
    res.status(400).json({ error: "Invalid avatar_url value." });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (display_name !== undefined) updates.displayName = display_name;
  if (avatar_url !== undefined) updates.avatarUrl = avatar_url;

  let [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
  if (!profile) {
    [profile] = await db.insert(profilesTable).values({ userId, ...updates }).returning();
  } else {
    [profile] = await db.update(profilesTable).set(updates).where(eq(profilesTable.userId, userId)).returning();
  }
  res.json(serializeProfile(profile));
});

// GET /api/profiles/:userId — authenticated profile lookup
router.get("/:userId", requireAuth, async (req, res) => {
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.params.userId));
  if (!profile) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeProfile(profile));
});

export default router;
