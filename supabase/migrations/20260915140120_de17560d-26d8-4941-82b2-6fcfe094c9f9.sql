CREATE TABLE public.glyphes_combat_state (
  campaign_id UUID NOT NULL PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
  tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  confrontation JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.glyphes_combat_state TO authenticated;
GRANT ALL ON public.glyphes_combat_state TO service_role;

ALTER TABLE public.glyphes_combat_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can read glyphes combat state"
  ON public.glyphes_combat_state FOR SELECT TO authenticated
  USING (public.check_campaign_access(campaign_id, auth.uid()));

CREATE POLICY "Campaign members can insert glyphes combat state"
  ON public.glyphes_combat_state FOR INSERT TO authenticated
  WITH CHECK (public.check_campaign_access(campaign_id, auth.uid()));

CREATE POLICY "Campaign members can update glyphes combat state"
  ON public.glyphes_combat_state FOR UPDATE TO authenticated
  USING (public.check_campaign_access(campaign_id, auth.uid()))
  WITH CHECK (public.check_campaign_access(campaign_id, auth.uid()));

CREATE POLICY "Game masters can delete glyphes combat state"
  ON public.glyphes_combat_state FOR DELETE TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE TRIGGER update_glyphes_combat_state_updated_at
  BEFORE UPDATE ON public.glyphes_combat_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();