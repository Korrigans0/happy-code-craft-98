/**
 * One-time data cleanup: remove legacy password hashes from the avatar_url column.
 *
 * Background: an earlier version of the app stored SHA-256 password hashes in the
 * `avatar_url` column of the `profiles` table, prefixed with "auth:". Auth has since
 * been migrated to Clerk, so those rows serve no purpose and must be cleared so the
 * column can be used for real avatar image URLs.
 *
 * Run once against each environment (dev + prod):
 *   pnpm --filter @workspace/db run cleanup:auth-hack
 */

import { db, pool } from "../index.js";
import { profilesTable } from "../schema/index.js";
import { like } from "drizzle-orm";

async function run() {
  console.log("Scanning profiles for legacy auth: password hashes…");

  const affected = await db
    .update(profilesTable)
    .set({ avatarUrl: null })
    .where(like(profilesTable.avatarUrl, "auth:%"))
    .returning({ userId: profilesTable.userId });

  if (affected.length === 0) {
    console.log("No legacy password hashes found — nothing to clean up.");
  } else {
    console.log(
      `Cleared ${affected.length} legacy password hash(es) from avatar_url.`,
    );
    console.log(
      "Affected user IDs:",
      affected.map((r) => r.userId),
    );
  }

  await pool.end();
}

run().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
