CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.partner_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  key_hint text NOT NULL,
  plan public.subscription_tier NOT NULL DEFAULT 'premium_mixed',
  duration_days integer NOT NULL DEFAULT 365 CHECK (duration_days > 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','used','disabled')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  activated_by uuid,
  expires_at timestamptz,
  disabled_at timestamptz,
  CONSTRAINT partner_keys_used_consistency CHECK (
    (status = 'used' AND activated_by IS NOT NULL AND activated_at IS NOT NULL AND expires_at IS NOT NULL)
    OR (status <> 'used' AND activated_by IS NULL AND activated_at IS NULL)
  ),
  CONSTRAINT partner_keys_disabled_consistency CHECK ((status = 'disabled') = (disabled_at IS NOT NULL))
);
CREATE INDEX partner_keys_activated_by_idx ON public.partner_keys(activated_by, expires_at);
GRANT SELECT ON public.partner_keys TO authenticated;
GRANT ALL ON public.partner_keys TO service_role;
ALTER TABLE public.partner_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read partner keys" ON public.partner_keys FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER partner_keys_updated_at BEFORE UPDATE ON public.partner_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Once used, a key can never change again
CREATE OR REPLACE FUNCTION public.protect_used_partner_key() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status = 'used' THEN RAISE EXCEPTION 'PARTNER_KEY_IMMUTABLE'; END IF;
  IF OLD.status = 'disabled' AND NEW.status <> 'disabled' THEN RAISE EXCEPTION 'PARTNER_KEY_DISABLED'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER partner_keys_protect_used BEFORE UPDATE ON public.partner_keys FOR EACH ROW EXECUTE FUNCTION public.protect_used_partner_key();

CREATE TABLE public.partner_key_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  success boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX partner_key_attempts_user_idx ON public.partner_key_attempts(user_id, created_at DESC);
GRANT ALL ON public.partner_key_attempts TO service_role;
ALTER TABLE public.partner_key_attempts ENABLE ROW LEVEL SECURITY;

-- Effective tier = partner grant (premium_mixed) if active, else the payment-derived profile tier
CREATE OR REPLACE FUNCTION public.effective_tier(_user_id uuid) RETURNS public.subscription_tier
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.partner_keys k WHERE k.activated_by = _user_id AND k.status = 'used' AND k.expires_at > now())
      THEN 'premium_mixed'::public.subscription_tier
    ELSE COALESCE((SELECT p.tier FROM public.profiles p WHERE p.user_id = _user_id), 'free'::public.subscription_tier)
  END
$$;

CREATE OR REPLACE FUNCTION public.get_my_partner_grant() RETURNS TABLE(effective_tier public.subscription_tier, partner_expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.effective_tier(auth.uid()),
    (SELECT max(k.expires_at) FROM public.partner_keys k WHERE k.activated_by = auth.uid() AND k.status = 'used' AND k.expires_at > now())
  WHERE auth.uid() IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.admin_generate_partner_keys(_count integer)
RETURNS TABLE(id uuid, partner_key text) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  _alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  _bytes bytea; _raw text; _key text; _i int; _j int; _id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF _count IS NULL OR _count < 1 OR _count > 500 THEN RAISE EXCEPTION 'INVALID_COUNT'; END IF;
  FOR _i IN 1.._count LOOP
    LOOP
      _bytes := extensions.gen_random_bytes(20); _raw := '';
      FOR _j IN 0..19 LOOP _raw := _raw || substr(_alphabet, 1 + (get_byte(_bytes, _j) % 32), 1); END LOOP;
      _key := 'AETH-MIX-' || substr(_raw,1,4)||'-'||substr(_raw,5,4)||'-'||substr(_raw,9,4)||'-'||substr(_raw,13,4)||'-'||substr(_raw,17,4);
      BEGIN
        INSERT INTO public.partner_keys (key_hash, key_hint, created_by)
        VALUES (encode(extensions.digest(_key, 'sha256'), 'hex'), 'AETH-MIX-' || substr(_raw,1,4) || '-••••-••••-••••-' || substr(_raw,17,4), auth.uid())
        RETURNING partner_keys.id INTO _id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
    END LOOP;
    id := _id; partner_key := _key; RETURN NEXT;
  END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_partner_keys()
RETURNS TABLE(id uuid, key_hint text, plan public.subscription_tier, status text, created_at timestamptz, activated_at timestamptz, expires_at timestamptz, disabled_at timestamptz, activated_by uuid, activated_email text, activated_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'insufficient_privilege'; END IF;
  RETURN QUERY SELECT k.id, k.key_hint, k.plan, k.status, k.created_at, k.activated_at, k.expires_at, k.disabled_at, k.activated_by, u.email::text, p.display_name
  FROM public.partner_keys k LEFT JOIN auth.users u ON u.id = k.activated_by LEFT JOIN public.profiles p ON p.user_id = k.activated_by
  ORDER BY k.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_disable_partner_key(_key_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'insufficient_privilege'; END IF;
  UPDATE public.partner_keys SET status = 'disabled', disabled_at = now() WHERE id = _key_id AND status = 'available';
  RETURN FOUND;
END; $$;

CREATE OR REPLACE FUNCTION public.redeem_partner_key(_key text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  _uid uuid := auth.uid(); _clean text; _hash text; _row public.partner_keys%ROWTYPE; _fails int; _status text;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  SELECT count(*) INTO _fails FROM public.partner_key_attempts WHERE user_id = _uid AND success = false AND created_at > now() - interval '15 minutes';
  IF _fails >= 5 THEN RETURN jsonb_build_object('ok', false, 'error', 'rate_limited'); END IF;
  IF EXISTS (SELECT 1 FROM public.partner_keys WHERE activated_by = _uid AND status = 'used' AND expires_at > now()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_active');
  END IF;

  _clean := upper(regexp_replace(coalesce(_key, ''), '[^A-Za-z0-9]', '', 'g'));
  IF length(_clean) = 27 AND left(_clean, 7) = 'AETHMIX' THEN
    _clean := 'AETH-MIX-' || substr(_clean,8,4)||'-'||substr(_clean,12,4)||'-'||substr(_clean,16,4)||'-'||substr(_clean,20,4)||'-'||substr(_clean,24,4);
  END IF;
  _hash := encode(extensions.digest(_clean, 'sha256'), 'hex');

  -- Atomic consumption: the row lock guarantees only one concurrent winner
  UPDATE public.partner_keys SET status = 'used', activated_by = _uid, activated_at = now(), expires_at = now() + make_interval(days => duration_days)
  WHERE key_hash = _hash AND status = 'available'
  RETURNING * INTO _row;

  IF FOUND THEN
    INSERT INTO public.partner_key_attempts (user_id, success) VALUES (_uid, true);
    RETURN jsonb_build_object('ok', true, 'plan', _row.plan, 'expires_at', _row.expires_at);
  END IF;

  INSERT INTO public.partner_key_attempts (user_id, success) VALUES (_uid, false);
  SELECT status INTO _status FROM public.partner_keys WHERE key_hash = _hash;
  RETURN jsonb_build_object('ok', false, 'error', CASE WHEN _status = 'used' THEN 'used' WHEN _status = 'disabled' THEN 'disabled' ELSE 'invalid' END);
END; $$;

REVOKE EXECUTE ON FUNCTION public.effective_tier(uuid), public.get_my_partner_grant(), public.admin_generate_partner_keys(integer), public.admin_list_partner_keys(), public.admin_disable_partner_key(uuid), public.redeem_partner_key(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_partner_grant(), public.admin_generate_partner_keys(integer), public.admin_list_partner_keys(), public.admin_disable_partner_key(uuid), public.redeem_partner_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.effective_tier(uuid) TO service_role;

-- Quotas now use the effective tier (partner grant or paid subscription)
CREATE OR REPLACE FUNCTION public.enforce_campaign_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _tier public.subscription_tier; _count int; _limit int;
BEGIN
 _tier := public.effective_tier(NEW.user_id);
 _limit:=CASE _tier WHEN 'premium_mj' THEN 20 WHEN 'premium_mixed' THEN 50 WHEN 'gm_premium' THEN 20 WHEN 'premium_plus' THEN 50 ELSE 3 END;
 SELECT count(*) INTO _count FROM public.campaigns WHERE user_id=NEW.user_id;
 IF _count>=_limit THEN RAISE EXCEPTION 'PLAN_LIMIT_CAMPAIGNS: Limite de % campagnes atteinte.',_limit USING ERRCODE='check_violation'; END IF; RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.enforce_character_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _tier public.subscription_tier; _count int; _limit int;
BEGIN
 _tier := public.effective_tier(NEW.user_id);
 _limit:=CASE _tier WHEN 'premium_pj' THEN 20 WHEN 'premium_mixed' THEN 50 WHEN 'premium_plus' THEN 50 ELSE 3 END;
 SELECT count(*) INTO _count FROM public.characters WHERE user_id=NEW.user_id;
 IF _count>=_limit THEN RAISE EXCEPTION 'PLAN_LIMIT_CHARACTERS: Limite de % personnages atteinte.',_limit USING ERRCODE='check_violation'; END IF; RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.enforce_member_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _gm_id uuid; _tier public.subscription_tier; _count int; _limit int;
BEGIN
 IF NEW.role='gm' THEN RETURN NEW; END IF; SELECT user_id INTO _gm_id FROM public.campaigns WHERE id=NEW.campaign_id; IF _gm_id IS NULL THEN RETURN NEW; END IF;
 _tier := public.effective_tier(_gm_id);
 _limit:=CASE _tier WHEN 'premium_mj' THEN 10 WHEN 'premium_mixed' THEN 10 WHEN 'gm_premium' THEN 10 WHEN 'premium_plus' THEN 10 ELSE 5 END;
 SELECT count(*) INTO _count FROM public.campaign_members WHERE campaign_id=NEW.campaign_id AND role<>'gm';
 IF _count>=_limit THEN RAISE EXCEPTION 'PLAN_LIMIT_PLAYERS: Limite de % joueurs atteinte.',_limit USING ERRCODE='check_violation'; END IF; RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.enforce_media_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _tier public.subscription_tier; _used BIGINT; _quota BIGINT; _new_size BIGINT;
BEGIN
  _tier := public.effective_tier(NEW.owner_id);
  SELECT COALESCE(SUM(size_bytes), 0)::BIGINT INTO _used FROM public.media_assets WHERE owner_id = NEW.owner_id;
  _quota := public.get_storage_quota(_tier); _new_size := COALESCE(NEW.size_bytes, 0)::BIGINT;
  IF _used + _new_size > _quota THEN
    RAISE EXCEPTION 'STORAGE_QUOTA_EXCEEDED: % bytes used + % bytes new > % bytes quota (tier=%)', _used, _new_size, _quota, _tier USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_storage_usage(_user_id uuid) RETURNS TABLE(used_bytes bigint, quota_bytes bigint, file_count bigint, tier subscription_tier)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _tier public.subscription_tier;
BEGIN
  _tier := public.effective_tier(_user_id);
  RETURN QUERY SELECT COALESCE(SUM(m.size_bytes), 0)::BIGINT, public.get_storage_quota(_tier), COUNT(*)::BIGINT, _tier
  FROM public.media_assets m WHERE m.owner_id = _user_id;
END; $function$;