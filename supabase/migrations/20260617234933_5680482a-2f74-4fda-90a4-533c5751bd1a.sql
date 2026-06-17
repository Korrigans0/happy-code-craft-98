
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS planned_sessions integer,
  ADD COLUMN IF NOT EXISTS level_min integer,
  ADD COLUMN IF NOT EXISTS level_max integer,
  ADD COLUMN IF NOT EXISTS max_players integer,
  ADD COLUMN IF NOT EXISTS schedule text,
  ADD COLUMN IF NOT EXISTS tone text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_level_range_chk
    CHECK (level_min IS NULL OR level_max IS NULL OR level_min <= level_max);
