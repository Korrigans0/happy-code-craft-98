-- Migration: cleanup_auth_password_hack
-- Removes legacy SHA-256 password hashes stored in the avatar_url column.
--
-- Background: an earlier version of the app stored password hashes in the
-- `avatar_url` column of the `profiles` table, prefixed with "auth:".
-- Auth has since been migrated to Clerk. This migration clears any remaining
-- legacy rows so the avatar_url column is free for real image URLs.

UPDATE "profiles"
SET "avatar_url" = NULL
WHERE "avatar_url" LIKE 'auth:%';
