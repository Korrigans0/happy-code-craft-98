
ALTER FUNCTION public.get_storage_quota(public.subscription_tier) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_campaign_gm(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_campaign_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_campaign_access(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_storage_usage(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_campaign_by_invite_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_campaign_gm(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_campaign_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_campaign_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_storage_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_campaign_by_invite_code(text) TO authenticated;

DROP POLICY IF EXISTS "GM can view audit log" ON public.campaign_audit_log;
CREATE POLICY "GM can view audit log"
ON public.campaign_audit_log
FOR SELECT
TO authenticated
USING (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public, extensions
AS $$
  SELECT upper(encode(extensions.gen_random_bytes(6), 'hex'))
$$;
ALTER TABLE public.campaigns ALTER COLUMN invite_code SET DEFAULT public.generate_invite_code();

CREATE OR REPLACE FUNCTION public.enforce_tabletop_gm_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_campaign_gm(auth.uid(), NEW.campaign_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.map_image_url IS DISTINCT FROM OLD.map_image_url
     OR NEW.fog_visible IS DISTINCT FROM OLD.fog_visible
     OR NEW.walls IS DISTINCT FROM OLD.walls
     OR NEW.lights IS DISTINCT FROM OLD.lights
     OR NEW.night_mode IS DISTINCT FROM OLD.night_mode
     OR NEW.initiative IS DISTINCT FROM OLD.initiative
     OR NEW.initiative_round IS DISTINCT FROM OLD.initiative_round
     OR NEW.initiative_active_idx IS DISTINCT FROM OLD.initiative_active_idx
  THEN
    RAISE EXCEPTION 'Only the GM can modify map, fog, walls, lights, night mode, or initiative'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_tabletop_gm_fields_trg ON public.tabletop_state;
CREATE TRIGGER enforce_tabletop_gm_fields_trg
BEFORE UPDATE ON public.tabletop_state
FOR EACH ROW
EXECUTE FUNCTION public.enforce_tabletop_gm_fields();
