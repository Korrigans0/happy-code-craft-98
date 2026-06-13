
DROP POLICY IF EXISTS "Anyone can read monsters" ON public.monsters;
DROP POLICY IF EXISTS "Anyone can read spells" ON public.spells;
DROP POLICY IF EXISTS "Anyone can read magic_items" ON public.magic_items;

CREATE POLICY "Read monsters with privacy" ON public.monsters FOR SELECT
USING (
  scope = 'official'
  OR is_public = true
  OR created_by = auth.uid()
  OR (campaign_id IS NOT NULL AND public.check_campaign_access(campaign_id, auth.uid()))
);

CREATE POLICY "Read spells with privacy" ON public.spells FOR SELECT
USING (
  scope = 'official'
  OR is_public = true
  OR created_by = auth.uid()
  OR (campaign_id IS NOT NULL AND public.check_campaign_access(campaign_id, auth.uid()))
);

CREATE POLICY "Read magic_items with privacy" ON public.magic_items FOR SELECT
USING (
  scope = 'official'
  OR is_public = true
  OR created_by = auth.uid()
  OR (campaign_id IS NOT NULL AND public.check_campaign_access(campaign_id, auth.uid()))
);

GRANT SELECT ON public.monsters TO anon;
GRANT SELECT ON public.spells TO anon;
GRANT SELECT ON public.magic_items TO anon;
