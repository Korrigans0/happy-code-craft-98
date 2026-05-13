CREATE TABLE public.tabletop_token_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  token_id text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, token_id)
);

ALTER TABLE public.tabletop_token_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "GM can view token notes"
ON public.tabletop_token_notes FOR SELECT
USING (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE POLICY "GM can insert token notes"
ON public.tabletop_token_notes FOR INSERT
WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id) AND auth.uid() = created_by);

CREATE POLICY "GM can update token notes"
ON public.tabletop_token_notes FOR UPDATE
USING (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE POLICY "GM can delete token notes"
ON public.tabletop_token_notes FOR DELETE
USING (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE TRIGGER set_tabletop_token_notes_updated_at
BEFORE UPDATE ON public.tabletop_token_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tabletop_token_notes_campaign ON public.tabletop_token_notes(campaign_id);