-- Tabletop state for realtime sync
CREATE TABLE IF NOT EXISTS public.tabletop_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  tokens JSONB NOT NULL DEFAULT '[]'::jsonb,
  drawings JSONB NOT NULL DEFAULT '[]'::jsonb,
  map_image_url TEXT,
  pan_offset JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}'::jsonb,
  zoom NUMERIC NOT NULL DEFAULT 1,
  fog_visible BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE(campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_tabletop_state_campaign
  ON public.tabletop_state(campaign_id);

ALTER TABLE public.tabletop_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read tabletop state"
  ON public.tabletop_state FOR SELECT
  USING (public.check_campaign_access(campaign_id, auth.uid()));

CREATE POLICY "Members can insert tabletop state"
  ON public.tabletop_state FOR INSERT
  WITH CHECK (public.check_campaign_access(campaign_id, auth.uid()));

CREATE POLICY "Members can update tabletop state"
  ON public.tabletop_state FOR UPDATE
  USING (public.check_campaign_access(campaign_id, auth.uid()));

CREATE TRIGGER update_tabletop_state_updated_at
  BEFORE UPDATE ON public.tabletop_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tabletop_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tabletop_state;

-- Aetheria creatures bestiary
CREATE TABLE IF NOT EXISTS public.aetheria_creatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT 'Moyen',
  force INTEGER NOT NULL DEFAULT 0,
  agilite INTEGER NOT NULL DEFAULT 0,
  esprit INTEGER NOT NULL DEFAULT 0,
  endurance INTEGER NOT NULL DEFAULT 0,
  pv INTEGER NOT NULL DEFAULT 10,
  pv_max INTEGER NOT NULL DEFAULT 10,
  pe INTEGER NOT NULL DEFAULT 0,
  pe_max INTEGER NOT NULL DEFAULT 0,
  def_physique INTEGER NOT NULL DEFAULT 10,
  def_magique INTEGER NOT NULL DEFAULT 10,
  reduction_physique INTEGER NOT NULL DEFAULT 0,
  reduction_magique INTEGER NOT NULL DEFAULT 0,
  initiative_bonus INTEGER NOT NULL DEFAULT 0,
  attaque TEXT,
  degats TEXT,
  capacites JSONB NOT NULL DEFAULT '[]'::jsonb,
  conditions_immunites TEXT[] NOT NULL DEFAULT '{}',
  lore TEXT,
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aetheria_creatures_campaign
  ON public.aetheria_creatures(campaign_id);
CREATE INDEX IF NOT EXISTS idx_aetheria_creatures_public
  ON public.aetheria_creatures(is_public) WHERE is_public = true;

ALTER TABLE public.aetheria_creatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read aetheria creatures"
  ON public.aetheria_creatures FOR SELECT
  USING (
    is_public = true
    OR created_by = auth.uid()
    OR (campaign_id IS NOT NULL AND public.check_campaign_access(campaign_id, auth.uid()))
  );

CREATE POLICY "Insert aetheria creatures"
  ON public.aetheria_creatures FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Update own aetheria creatures"
  ON public.aetheria_creatures FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Delete own aetheria creatures"
  ON public.aetheria_creatures FOR DELETE
  USING (auth.uid() = created_by);

CREATE TRIGGER update_aetheria_creatures_updated_at
  BEFORE UPDATE ON public.aetheria_creatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();