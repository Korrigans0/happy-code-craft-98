ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS system text NOT NULL DEFAULT 'Aetheria',
  ADD COLUMN IF NOT EXISTS system_data jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_characters_system ON public.characters(system);