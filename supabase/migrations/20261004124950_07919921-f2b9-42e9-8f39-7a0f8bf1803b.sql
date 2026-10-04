CREATE OR REPLACE FUNCTION public.admin_generate_partner_keys(_count integer, _duration_days integer DEFAULT 365)
 RETURNS TABLE(id uuid, partner_key text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  _bytes bytea; _raw text; _key text; _i int; _j int; _id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF _count IS NULL OR _count < 1 OR _count > 500 THEN RAISE EXCEPTION 'INVALID_COUNT'; END IF;
  IF _duration_days IS NULL OR _duration_days NOT IN (30, 90, 180, 270, 365) THEN RAISE EXCEPTION 'INVALID_DURATION'; END IF;
  FOR _i IN 1.._count LOOP
    LOOP
      _bytes := extensions.gen_random_bytes(20); _raw := '';
      FOR _j IN 0..19 LOOP _raw := _raw || substr(_alphabet, 1 + (get_byte(_bytes, _j) % 32), 1); END LOOP;
      _key := 'AETH-MIX-' || substr(_raw,1,4)||'-'||substr(_raw,5,4)||'-'||substr(_raw,9,4)||'-'||substr(_raw,13,4)||'-'||substr(_raw,17,4);
      BEGIN
        INSERT INTO public.partner_keys (key_hash, key_hint, created_by, duration_days)
        VALUES (encode(extensions.digest(_key, 'sha256'), 'hex'), 'AETH-MIX-' || substr(_raw,1,4) || '-••••-••••-••••-' || substr(_raw,17,4), auth.uid(), _duration_days)
        RETURNING partner_keys.id INTO _id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
    END LOOP;
    id := _id; partner_key := _key; RETURN NEXT;
  END LOOP;
END; $function$;
REVOKE ALL ON FUNCTION public.admin_generate_partner_keys(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_generate_partner_keys(integer, integer) TO authenticated;