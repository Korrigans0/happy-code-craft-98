CREATE OR REPLACE FUNCTION public.get_storage_quota(_tier subscription_tier)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT CASE _tier
    WHEN 'free' THEN 1024 * 1024 * 1024              -- 1 GB
    WHEN 'gm_premium' THEN 5 * 1024 * 1024 * 1024    -- 5 GB
    WHEN 'premium_plus' THEN 25 * 1024 * 1024 * 1024 -- 25 GB
    ELSE 1024 * 1024 * 1024
  END;
$function$;