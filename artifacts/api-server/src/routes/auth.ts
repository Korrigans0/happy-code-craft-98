import { Router } from "express";

const router = Router();

// Auth is handled entirely by Clerk — no custom auth endpoints needed.
//
// Migration history:
//   An earlier version stored SHA-256 password hashes in the `avatar_url` column
//   of the `profiles` table (prefixed with "auth:"). That approach has been fully
//   replaced by Clerk-managed authentication. Remaining legacy rows can be cleared
//   by running:
//     pnpm --filter @workspace/db run cleanup:auth-hack
//
// The profiles route (profiles.ts) also defensively strips any remaining "auth:"
// prefixed values from API responses so they are never exposed to clients.

export default router;
