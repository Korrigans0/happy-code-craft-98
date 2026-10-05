DROP POLICY IF EXISTS "Authenticated users can read translations" ON public.compendium_translations;
REVOKE SELECT ON public.compendium_translations FROM authenticated, anon;