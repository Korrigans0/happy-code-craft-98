DROP POLICY IF EXISTS "cosmetics_public_read" ON public.user_cosmetics;

DROP POLICY IF EXISTS "Translations are readable by everyone" ON public.compendium_translations;
CREATE POLICY "Authenticated users can read translations"
ON public.compendium_translations
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.compendium_translations FROM anon;

DROP POLICY IF EXISTS "Character avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view character avatars" ON storage.objects;
CREATE POLICY "Owners can list character avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'character-avatars'
  AND owner_id = auth.uid()::text
);

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Owners can list avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND owner_id = auth.uid()::text
);