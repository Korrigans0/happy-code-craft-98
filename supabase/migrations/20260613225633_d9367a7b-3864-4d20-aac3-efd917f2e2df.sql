
-- Phase 3 — Restrictions de campagne par système
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS allow_homebrew_characters boolean NOT NULL DEFAULT false;

-- S'assurer que system n'est jamais NULL et adopter Aetheria comme défaut moderne
UPDATE public.campaigns SET system = 'Aetheria' WHERE system IS NULL;
ALTER TABLE public.campaigns ALTER COLUMN system SET DEFAULT 'Aetheria';
ALTER TABLE public.campaigns ALTER COLUMN system SET NOT NULL;

-- Phase 4 — Codex cloisonné par système
-- Ajout d'un système et d'une portée à chaque table de codex existante.
-- scope : 'official' | 'custom_personal' | 'custom_campaign'
ALTER TABLE public.monsters
  ADD COLUMN IF NOT EXISTS system text NOT NULL DEFAULT 'D&D 5e',
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'official',
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE;

ALTER TABLE public.spells
  ADD COLUMN IF NOT EXISTS system text NOT NULL DEFAULT 'D&D 5e',
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'official',
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.magic_items
  ADD COLUMN IF NOT EXISTS system text NOT NULL DEFAULT 'D&D 5e',
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'official',
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_monsters_system   ON public.monsters(system);
CREATE INDEX IF NOT EXISTS idx_spells_system     ON public.spells(system);
CREATE INDEX IF NOT EXISTS idx_magic_items_system ON public.magic_items(system);
CREATE INDEX IF NOT EXISTS idx_monsters_scope    ON public.monsters(scope, created_by);
CREATE INDEX IF NOT EXISTS idx_spells_scope      ON public.spells(scope, created_by);
CREATE INDEX IF NOT EXISTS idx_magic_items_scope ON public.magic_items(scope, created_by);
