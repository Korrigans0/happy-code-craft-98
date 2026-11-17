CREATE TABLE public.talespire_link_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.talespire_link_codes TO service_role;
ALTER TABLE public.talespire_link_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX talespire_link_codes_user_idx ON public.talespire_link_codes(user_id);

CREATE OR REPLACE FUNCTION public.create_talespire_link_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  _uid uuid := auth.uid();
  _alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  _code text := '';
  _bytes bytea := extensions.gen_random_bytes(8);
  i int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF (SELECT count(*) FROM talespire_link_codes WHERE user_id = _uid AND created_at > now() - interval '1 hour') >= 10 THEN
    RAISE EXCEPTION 'RATE_LIMITED';
  END IF;
  FOR i IN 0..7 LOOP
    _code := _code || substr(_alphabet, (get_byte(_bytes, i) % 32) + 1, 1);
  END LOOP;
  DELETE FROM talespire_link_codes WHERE user_id = _uid AND used_at IS NULL;
  INSERT INTO talespire_link_codes(code_hash, user_id, expires_at)
  VALUES (encode(extensions.digest(_code, 'sha256'), 'hex'), _uid, now() + interval '10 minutes');
  RETURN substr(_code, 1, 4) || '-' || substr(_code, 5, 4);
END $$;
REVOKE ALL ON FUNCTION public.create_talespire_link_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_talespire_link_code() TO authenticated;

CREATE OR REPLACE FUNCTION public.consume_talespire_link_code(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _uid uuid;
BEGIN
  UPDATE talespire_link_codes SET used_at = now()
  WHERE code_hash = encode(extensions.digest(upper(replace(_code, '-', '')), 'sha256'), 'hex')
    AND used_at IS NULL AND expires_at > now()
  RETURNING user_id INTO _uid;
  RETURN _uid;
END $$;
REVOKE ALL ON FUNCTION public.consume_talespire_link_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_talespire_link_code(text) TO service_role;

CREATE OR REPLACE FUNCTION public.is_gm_of_character_member(_uid uuid, _character_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaign_members m
    WHERE m.character_id = _character_id AND m.user_id <> _uid
      AND is_campaign_gm(_uid, m.campaign_id)
  )
$$;
REVOKE ALL ON FUNCTION public.is_gm_of_character_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_gm_of_character_member(uuid, uuid) TO authenticated;

CREATE POLICY "GM can update member characters of their campaign"
ON public.characters FOR UPDATE TO authenticated
USING (public.is_gm_of_character_member(auth.uid(), id))
WITH CHECK (public.is_gm_of_character_member(auth.uid(), id));

CREATE OR REPLACE FUNCTION public.protect_character_identity_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND OLD.user_id IS DISTINCT FROM auth.uid() AND OLD.kind <> 'pregen' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.system IS DISTINCT FROM OLD.system
       OR NEW.kind IS DISTINCT FROM OLD.kind OR NEW.pregen_campaign_id IS DISTINCT FROM OLD.pregen_campaign_id THEN
      RAISE EXCEPTION 'IDENTITY_FIELDS_LOCKED';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER characters_protect_identity BEFORE UPDATE ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.protect_character_identity_fields();