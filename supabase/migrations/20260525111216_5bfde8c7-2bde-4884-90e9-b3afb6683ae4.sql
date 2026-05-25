GRANT EXECUTE ON FUNCTION public.check_campaign_access(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_campaign_gm(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_campaign_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;