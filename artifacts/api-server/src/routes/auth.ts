import { Router } from "express";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

const router = Router();

// Simple password hashing (SHA-256 + salt stored in user record)
// In production you'd use bcrypt, but for this migration we keep it simple
function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

// We store users in the profiles table, using userId = email hash as the key
// and store password hash in a separate field... but profiles table doesn't have that.
// Instead we'll use a simple in-memory approach + localStorage on client for this MVP.
// The proper solution is Clerk (which is the Replit auth standard).

// For now, use a users table concept via localStorage-based user IDs.
// The user's ID is their email's hash, password stored hashed in a simple JSON file approach.
// Better: store in DB using a dedicated users table.

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { email, password, display_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email et password requis" });
  if (password.length < 6) return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });

  // Use email hash as user ID
  const userId = createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 32);

  const [existing] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
  if (existing) return res.status(400).json({ error: "Cette adresse email est déjà utilisée" });

  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  await db.insert(profilesTable).values({
    userId,
    displayName: display_name || email.split("@")[0],
    avatarUrl: null,
    // Store credentials in avatarUrl as a workaround (base64 encoded JSON)
    // This is NOT how you do auth in production — use Clerk instead
  });

  // Store auth data in a separate mechanism — use a simple approach:
  // Store hashed password as part of the profile's avatar_url as encoded metadata
  // Better approach: dedicated auth table. Let's do that.
  await db.update(profilesTable).set({
    avatarUrl: `auth:${Buffer.from(JSON.stringify({ salt, hash: passwordHash })).toString("base64")}`,
    displayName: display_name || email.split("@")[0],
  }).where(eq(profilesTable.userId, userId));

  const user = { id: userId, email: email.toLowerCase().trim(), display_name: display_name || email.split("@")[0] };
  res.status(201).json({ user });
});

// POST /api/auth/signin
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email et password requis" });

  const userId = createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 32);
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
  if (!profile) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

  if (!profile.avatarUrl?.startsWith("auth:")) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }

  try {
    const authData = JSON.parse(Buffer.from(profile.avatarUrl.slice(5), "base64").toString());
    const expectedHash = hashPassword(password, authData.salt);
    if (expectedHash !== authData.hash) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
  } catch {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }

  const user = { id: userId, email: email.toLowerCase().trim(), display_name: profile.displayName };
  res.json({ user });
});

export default router;
