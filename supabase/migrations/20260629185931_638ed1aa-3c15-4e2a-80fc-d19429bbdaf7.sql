CREATE OR REPLACE FUNCTION public.get_storage_quota(_tier subscription_tier)
 RETURNS bigint
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE _tier
    WHEN 'free'         THEN (1::bigint  * 1024 * 1024 * 1024)              -- 1 GB
    WHEN 'gm_premium'   THEN (5::bigint  * 1024 * 1024 * 1024)              -- 5 GB
    WHEN 'premium_plus' THEN (25::bigint * 1024 * 1024 * 1024)              -- 25 GB
    ELSE (1::bigint * 1024 * 1024 * 1024)
  END;
$function$;