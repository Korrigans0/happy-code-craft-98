ALTER TABLE public.tabletop_state
  ADD COLUMN IF NOT EXISTS initiative jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS initiative_round integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS initiative_active_idx integer NOT NULL DEFAULT -1;