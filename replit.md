# QuestMaster / Aetheria VTT

French-language D&D/tabletop RPG campaign manager and virtual tabletop (VTT). Players and GMs manage campaigns, characters, sessions, combat, and a shared VTT board with token placement and drawing tools.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, built then started)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run cleanup:auth-hack` — one-time: null out legacy "auth:" password hashes from avatar_url column
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/questmaster), Tailwind CSS, shadcn/ui, Aetheria VTT dark navy/gold theme
- API: Express 5 (artifacts/api-server), port 8080
- DB: PostgreSQL + Drizzle ORM (lib/db)

## Where things live

- `artifacts/questmaster/src/lib/api.ts` — central REST client (campaignsApi, charactersApi, compendiumApi, profilesApi)
- `artifacts/questmaster/src/hooks/useAuth.tsx` — auth hook (Clerk-based)
- `artifacts/api-server/src/routes/` — Express routes (auth, campaigns, characters, profiles, compendium)
- `lib/db/src/schema.ts` — Drizzle ORM schema (source of truth)
- `artifacts/questmaster/src/integrations/supabase/client.ts` — no-op stub (keep as-is; no live imports remain but kept for safety)

## Architecture decisions

- Auth: Clerk (`@clerk/react` on frontend, `@clerk/express` + `requireAuth` middleware on backend)
- All API responses serialized to snake_case to match frontend contracts (see serializeCharacter, serializeProfile, serializeAetheriaCreature helpers in each route file)
- Supabase completely replaced: all DB access goes through Express REST API, realtime replaced with polling (3s interval for messages)
- CampaignCombat initiative tracker is fully local state (no DB persistence) — in-session only
- CampaignTabletop (VTT board) syncs via REST polling via useTabletopSync hook

## CORS / Deployment

- CORS allowlist: `localhost`, `REPLIT_DEV_DOMAIN` (auto-detected), and any domains in `ALLOWED_ORIGINS` env var (comma-separated)
- **Before deploying to a custom domain**, set `ALLOWED_ORIGINS=https://yourdomain.com` as a secret/env var — otherwise CORS will block requests from the production domain
- Example: `ALLOWED_ORIGINS=https://aetheria.example.com,https://www.aetheria.example.com`

## Product

- Campaign management: create, join (via invite code), chat, notes, sessions
- Character creation with Aetheria/D&D systems (stats, equipment, spells)
- Virtual tabletop: token placement, fog of war, drawing tools, dice roller
- Compendium: monsters, spells, magic items, WA creatures, Aetheria bestiary
- Combat tracker: initiative order, HP, conditions (local session state)

## Gotchas

- API server port is 8080, not 5000
- Avatar upload not supported (no object storage) — users must paste a URL directly
- Always run `pnpm --filter @workspace/db run push` after schema changes before restarting API
- `supabase/client.ts` is a no-op stub — kept for safety, no files import it
- `ResetPassword.tsx` is a dead route (not in App.tsx router) — it simply redirects to `/sign-in`
