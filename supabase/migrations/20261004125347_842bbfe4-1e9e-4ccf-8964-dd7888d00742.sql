CREATE TABLE public.character_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX character_proposals_one_pending ON public.character_proposals(campaign_id, user_id) WHERE status = 'pending';
GRANT SELECT ON public.character_proposals TO authenticated;
GRANT ALL ON public.character_proposals TO service_role;
ALTER TABLE public.character_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or GM can view proposals" ON public.character_proposals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_campaign_gm(auth.uid(), campaign_id)
    OR campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()));
CREATE TRIGGER update_character_proposals_updated_at BEFORE UPDATE ON public.character_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public._is_campaign_manager(_uid uuid, _campaign uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_campaign_gm(_uid, _campaign) OR EXISTS (SELECT 1 FROM campaigns WHERE id = _campaign AND user_id = _uid)
$$;
REVOKE EXECUTE ON FUNCTION public._is_campaign_manager(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_campaign_proposals(_campaign_id uuid)
RETURNS TABLE(id uuid, status text, user_id uuid, character_id uuid, created_at timestamptz, player_name text,
  character_name text, character_race text, character_class text, character_level integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _mgr boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  _mgr := public._is_campaign_manager(_uid, _campaign_id);
  RETURN QUERY
  SELECT p.id, p.status, p.user_id, p.character_id, p.created_at,
    COALESCE(pr.display_name, 'Joueur')::text, c.name::text, c.race::text, c.class::text, c.level::integer
  FROM character_proposals p
  JOIN characters c ON c.id = p.character_id
  LEFT JOIN profiles pr ON pr.user_id = p.user_id
  WHERE p.campaign_id = _campaign_id AND (_mgr OR p.user_id = _uid)
  ORDER BY p.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.submit_character_proposal(_campaign_id uuid, _character_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = _campaign_id AND user_id = _uid) THEN
    RAISE EXCEPTION 'not_member'; END IF;
  IF NOT EXISTS (SELECT 1 FROM characters WHERE id = _character_id AND user_id = _uid AND kind = 'standard') THEN
    RAISE EXCEPTION 'not_owner'; END IF;
  IF EXISTS (SELECT 1 FROM character_proposals WHERE campaign_id = _campaign_id AND user_id = _uid AND status = 'pending') THEN
    RAISE EXCEPTION 'already_pending'; END IF;
  INSERT INTO character_proposals(campaign_id, user_id, character_id) VALUES (_campaign_id, _uid, _character_id) RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_character_proposal(_proposal_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE character_proposals SET status = 'cancelled'
  WHERE id = _proposal_id AND user_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.review_character_proposal(_proposal_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p character_proposals;
BEGIN
  IF _status NOT IN ('accepted','rejected') THEN RAISE EXCEPTION 'invalid_status'; END IF;
  SELECT * INTO _p FROM character_proposals WHERE id = _proposal_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF NOT public._is_campaign_manager(auth.uid(), _p.campaign_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE character_proposals SET status = _status, reviewed_by = auth.uid(), reviewed_at = now() WHERE id = _proposal_id;
  IF _status = 'accepted' THEN
    UPDATE campaign_members SET character_id = _p.character_id WHERE campaign_id = _p.campaign_id AND user_id = _p.user_id;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.list_campaign_proposals(uuid), public.submit_character_proposal(uuid, uuid),
  public.cancel_character_proposal(uuid), public.review_character_proposal(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_campaign_proposals(uuid), public.submit_character_proposal(uuid, uuid),
  public.cancel_character_proposal(uuid), public.review_character_proposal(uuid, text) TO authenticated;