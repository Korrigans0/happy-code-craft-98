CREATE OR REPLACE FUNCTION public.get_storage_quota(_tier subscription_tier)
 RETURNS bigint
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE _tier
    WHEN 'free'         THEN (5::BIGINT  * 1024::BIGINT * 1024::BIGINT * 1024::BIGINT)
    WHEN 'gm_premium'   THEN (10::BIGINT * 1024::BIGINT * 1024::BIGINT * 1024::BIGINT)
    WHEN 'premium_plus' THEN (15::BIGINT * 1024::BIGINT * 1024::BIGINT * 1024::BIGINT)
    ELSE (5::BIGINT * 1024::BIGINT * 1024::BIGINT * 1024::BIGINT)
  END;
$function$;