ALTER TABLE public.campaign_prep_scenes
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.campaign_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agenda_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_prep_scenes_session ON public.campaign_prep_scenes(session_id);

ALTER TABLE public.campaign_sessions
  ADD COLUMN IF NOT EXISTS recap text,
  ADD COLUMN IF NOT EXISTS is_recap_shared boolean NOT NULL DEFAULT false;