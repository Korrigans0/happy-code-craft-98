ALTER TABLE public.campaign_pdfs
  ALTER COLUMN size_bytes TYPE BIGINT USING size_bytes::BIGINT;

ALTER TABLE public.media_assets
  ALTER COLUMN size_bytes TYPE BIGINT USING size_bytes::BIGINT;

CREATE OR REPLACE FUNCTION public.get_storage_quota(_tier public.subscription_tier)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE _tier
    WHEN 'free'         THEN (1::BIGINT  * 1024::BIGINT * 1024::BIGINT * 1024::BIGINT)
    WHEN 'gm_premium'   THEN (5::BIGINT  * 1024::BIGINT * 1024::BIGINT * 1024::BIGINT)
    WHEN 'premium_plus' THEN (25::BIGINT * 1024::BIGINT * 1024::BIGINT * 1024::BIGINT)
    ELSE (1::BIGINT * 1024::BIGINT * 1024::BIGINT * 1024::BIGINT)
  END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_media_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _tier public.subscription_tier;
  _used BIGINT;
  _quota BIGINT;
  _new_size BIGINT;
BEGIN
  SELECT tier INTO _tier FROM public.profiles WHERE user_id = NEW.owner_id;
  IF _tier IS NULL THEN _tier := 'free'; END IF;

  SELECT COALESCE(SUM(size_bytes), 0)::BIGINT INTO _used
  FROM public.media_assets
  WHERE owner_id = NEW.owner_id;

  _quota := public.get_storage_quota(_tier);
  _new_size := COALESCE(NEW.size_bytes, 0)::BIGINT;

  IF _used + _new_size > _quota THEN
    RAISE EXCEPTION 'STORAGE_QUOTA_EXCEEDED: % bytes used + % bytes new > % bytes quota (tier=%)',
      _used, _new_size, _quota, _tier
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_storage_usage(_user_id uuid)
RETURNS TABLE(used_bytes BIGINT, quota_bytes BIGINT, file_count BIGINT, tier public.subscription_tier)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _tier public.subscription_tier;
BEGIN
  SELECT p.tier INTO _tier FROM public.profiles p WHERE p.user_id = _user_id;
  IF _tier IS NULL THEN _tier := 'free'; END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(m.size_bytes), 0)::BIGINT,
    public.get_storage_quota(_tier),
    COUNT(*)::BIGINT,
    _tier
  FROM public.media_assets m
  WHERE m.owner_id = _user_id;
END;
$function$;