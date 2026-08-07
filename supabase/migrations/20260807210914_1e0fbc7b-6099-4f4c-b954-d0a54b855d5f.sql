-- Invite codes must never contain the ambiguous characters O or 0.
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _alphabet text := 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  _out text := '';
  _i int;
BEGIN
  FOR _i IN 1..8 LOOP
    _out := _out || substr(_alphabet, 1 + floor(random() * length(_alphabet))::int, 1);
  END LOOP;
  RETURN _out;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.generate_invite_code() FROM anon;

-- Regenerate any existing campaign code containing O or 0.
UPDATE public.campaigns
SET invite_code = public.generate_invite_code()
WHERE invite_code ~ '[Oo0]';

-- Joining tolerates lowercase / whitespace, still exact on the safe alphabet.
CREATE OR REPLACE FUNCTION public.join_campaign_by_invite_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _campaign_id uuid;
  _uid uuid := auth.uid();
  _clean text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _clean := upper(regexp_replace(coalesce(_code, ''), '[^A-Za-z0-9]', '', 'g'));
  _clean := regexp_replace(_clean, '[O0]', '', 'g');

  IF length(_clean) = 0 THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  SELECT id INTO _campaign_id
  FROM public.campaigns
  WHERE upper(invite_code) = _clean
  LIMIT 1;

  IF _campaign_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO public.campaign_members (campaign_id, user_id, role)
  VALUES (_campaign_id, _uid, 'player'::campaign_role)
  ON CONFLICT DO NOTHING;

  RETURN _campaign_id;
END;
$function$;