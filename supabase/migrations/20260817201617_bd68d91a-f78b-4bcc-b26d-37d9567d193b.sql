ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS folder TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_media_assets_owner_folder ON public.media_assets (owner_id, folder);
CREATE INDEX IF NOT EXISTS idx_media_assets_tags ON public.media_assets USING GIN (tags);