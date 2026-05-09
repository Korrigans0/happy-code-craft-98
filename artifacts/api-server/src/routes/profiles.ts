import { Router } from "express";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// GET /api/profiles/me
router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;

  let [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
  if (!profile) {
    [profile] = await db.insert(profilesTable).values({ userId }).returning();
  }
  res.json(profile);
});

// PATCH /api/profiles/me
router.patch("/me", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { display_name, avatar_url } = req.body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (display_name !== undefined) updates.displayName = display_name;
  if (avatar_url !== undefined) updates.avatarUrl = avatar_url;

  let [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
  if (!profile) {
    [profile] = await db.insert(profilesTable).values({ userId, ...updates }).returning();
  } else {
    [profile] = await db.update(profilesTable).set(updates).where(eq(profilesTable.userId, userId)).returning();
  }
  res.json(profile);
});

// GET /api/profiles/:userId — public profile lookup
router.get("/:userId", async (req, res) => {
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.params.userId));
  if (!profile) { res.status(404).json({ error: "Not found" }); return; }
  res.json(profile);
});

export default router;
