CREATE TABLE public.campaign_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_prep_scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.campaign_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  gm_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  entity_ids UUID[] NOT NULL DEFAULT '{}',
  vtt_scene_id TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_chapters_campaign ON public.campaign_chapters(campaign_id, sort_order);
CREATE INDEX idx_campaign_prep_scenes_chapter ON public.campaign_prep_scenes(chapter_id, sort_order);
CREATE INDEX idx_campaign_prep_scenes_campaign ON public.campaign_prep_scenes(campaign_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_chapters TO authenticated;
GRANT ALL ON public.campaign_chapters TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_prep_scenes TO authenticated;
GRANT ALL ON public.campaign_prep_scenes TO service_role;

ALTER TABLE public.campaign_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_prep_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "GMs manage campaign chapters"
ON public.campaign_chapters FOR ALL TO authenticated
USING (public.is_campaign_gm(auth.uid(), campaign_id))
WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE POLICY "GMs manage prep scenes"
ON public.campaign_prep_scenes FOR ALL TO authenticated
USING (public.is_campaign_gm(auth.uid(), campaign_id))
WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE TRIGGER update_campaign_chapters_updated_at
BEFORE UPDATE ON public.campaign_chapters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_prep_scenes_updated_at
BEFORE UPDATE ON public.campaign_prep_scenes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();