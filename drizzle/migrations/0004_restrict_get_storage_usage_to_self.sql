CREATE OR REPLACE FUNCTION public.get_storage_usage(_user_id uuid)
RETURNS TABLE(used_bytes bigint, quota_bytes bigint, file_count bigint, tier subscription_tier)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _tier public.subscription_tier;
BEGIN
  -- Callers may only read their own storage usage.
  IF auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  _tier := public.effective_tier(_user_id);
  RETURN QUERY SELECT COALESCE(SUM(m.size_bytes), 0)::BIGINT, public.get_storage_quota(_tier), COUNT(*)::BIGINT, _tier
  FROM public.media_assets m WHERE m.owner_id = _user_id;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.get_storage_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_storage_usage(uuid) TO authenticated;