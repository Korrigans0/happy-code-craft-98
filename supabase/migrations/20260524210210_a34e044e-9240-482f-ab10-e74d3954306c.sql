
-- FIX 1: prevent role self-escalation
DROP POLICY IF EXISTS "GM or self can update membership" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign owners can update members" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can join campaigns" ON public.campaign_members;

CREATE POLICY "Only GM or owner can update members"
  ON public.campaign_members
  FOR UPDATE
  USING (
    public.is_campaign_gm(auth.uid(), campaign_id)
    OR campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_campaign_gm(auth.uid(), campaign_id)
    OR campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
  );

-- Self-join restricted to player role only
CREATE POLICY "Users can join campaigns as player"
  ON public.campaign_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'player');

-- FIX 2: profiles visible to co-campaign members
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Profiles visible to owner and campaign members"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.campaign_members cm1
      JOIN public.campaign_members cm2 ON cm1.campaign_id = cm2.campaign_id
      WHERE cm1.user_id = auth.uid()
        AND cm2.user_id = profiles.user_id
    )
  );

-- FIX 3: restrict character-avatars bucket writes to owner folder
DROP POLICY IF EXISTS "Character avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload character avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update character avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete character avatars" ON storage.objects;

CREATE POLICY "Character avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'character-avatars');

CREATE POLICY "Users upload own character avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'character-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own character avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'character-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own character avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'character-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
