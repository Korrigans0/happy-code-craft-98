DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND roles::text = '{public}'
      AND (coalesce(qual,'')||coalesce(with_check,'')) ~ '(check_campaign_access|can_view_entity|can_edit_entity|is_campaign_gm|is_campaign_member|has_role)'
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO authenticated', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Preserve genuinely public read access for signed-out visitors, without calling helper functions
DROP POLICY IF EXISTS "Anon can read public aetheria creatures" ON public.aetheria_creatures;
CREATE POLICY "Anon can read public aetheria creatures" ON public.aetheria_creatures
  FOR SELECT TO anon USING (is_public = true);

DROP POLICY IF EXISTS "Anon can read public monsters" ON public.monsters;
CREATE POLICY "Anon can read public monsters" ON public.monsters
  FOR SELECT TO anon USING (scope = 'official' OR is_public = true);

DROP POLICY IF EXISTS "Anon can read public spells" ON public.spells;
CREATE POLICY "Anon can read public spells" ON public.spells
  FOR SELECT TO anon USING (scope = 'official' OR is_public = true);

DROP POLICY IF EXISTS "Anon can read public magic items" ON public.magic_items;
CREATE POLICY "Anon can read public magic items" ON public.magic_items
  FOR SELECT TO anon USING (scope = 'official' OR is_public = true);

-- Revoke SECURITY DEFINER helper execution from unauthenticated callers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_campaign_access(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_campaign_gm(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_campaign_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_view_entity(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_entity_change() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_campaign_access(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_campaign_gm(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_campaign_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_entity(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_entity_change() TO service_role;

-- Homebrew WA creatures are private unless the creator opts in
ALTER TABLE public.wa_creatures ALTER COLUMN is_public SET DEFAULT false;