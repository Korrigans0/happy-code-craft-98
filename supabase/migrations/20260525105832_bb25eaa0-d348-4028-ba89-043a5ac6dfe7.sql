
-- Tighten campaigns SELECT: remove invite_code enumeration
DROP POLICY IF EXISTS "Authenticated users can find campaign by invite code" ON public.campaigns;
DROP POLICY IF EXISTS "Anyone can find campaign by invite code" ON public.campaigns;

CREATE POLICY "Owners and members can view campaigns"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.check_campaign_access(id, auth.uid()));

-- Remove self-insert into campaign_members (joining now requires invite code via RPC)
DROP POLICY IF EXISTS "Users can join campaigns" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can join campaigns as player" ON public.campaign_members;

-- Secure RPC: join campaign by invite code
CREATE OR REPLACE FUNCTION public.join_campaign_by_invite_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _campaign_id uuid;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _code IS NULL OR length(trim(_code)) = 0 THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  SELECT id INTO _campaign_id
  FROM public.campaigns
  WHERE invite_code = trim(_code)
  LIMIT 1;

  IF _campaign_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO public.campaign_members (campaign_id, user_id, role)
  VALUES (_campaign_id, _uid, 'player'::campaign_role)
  ON CONFLICT DO NOTHING;

  RETURN _campaign_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_campaign_by_invite_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_campaign_by_invite_code(text) TO authenticated;
