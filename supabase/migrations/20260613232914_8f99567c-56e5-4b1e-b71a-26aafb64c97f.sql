ALTER TABLE public.monsters ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.spells ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.magic_items ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_monsters_public ON public.monsters(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_spells_public ON public.spells(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_magic_items_public ON public.magic_items(is_public) WHERE is_public = true;