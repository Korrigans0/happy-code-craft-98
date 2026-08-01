CREATE TABLE public.macros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  system text NOT NULL DEFAULT 'Aetheria',
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Général',
  icon text,
  color text,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  is_private_roll boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.macros TO authenticated;
GRANT ALL ON public.macros TO service_role;

ALTER TABLE public.macros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own macros"
  ON public.macros FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "Members can view shared campaign macros"
  ON public.macros FOR SELECT TO authenticated
  USING (is_shared = true AND campaign_id IS NOT NULL AND public.is_campaign_member(auth.uid(), campaign_id));

CREATE POLICY "Users can create their own macros"
  ON public.macros FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their own macros"
  ON public.macros FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can delete their own macros"
  ON public.macros FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());

CREATE INDEX idx_macros_owner ON public.macros(owner_user_id, sort_order);
CREATE INDEX idx_macros_campaign_shared ON public.macros(campaign_id) WHERE is_shared = true;

CREATE TRIGGER update_macros_updated_at
  BEFORE UPDATE ON public.macros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();