GRANT EXECUTE ON FUNCTION public.check_campaign_access(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_campaign_member(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_campaign_gm(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.can_view_entity(uuid, uuid) TO anon;