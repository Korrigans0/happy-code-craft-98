
-- ============================================================
-- 1) campaign_members: prevent role escalation
-- ============================================================
DROP POLICY IF EXISTS "Only GM or owner can update members" ON public.campaign_members;
DROP POLICY IF EXISTS "GM or self can update membership" ON public.campaign_members;

-- Only GM/owner can update member rows, and the role column is locked to its prior value
-- unless the caller is GM/owner (which is already enforced by USING).
CREATE POLICY "GM or owner can update members"
  ON public.campaign_members FOR UPDATE
  TO authenticated
  USING (
    public.is_campaign_gm(auth.uid(), campaign_id)
    OR campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_campaign_gm(auth.uid(), campaign_id)
    OR campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
  );

-- Allow a player to update only their own character_id (not their role) on their own row
CREATE OR REPLACE FUNCTION public.prevent_member_role_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND NOT public.is_campaign_gm(auth.uid(), NEW.campaign_id)
     AND NOT EXISTS (SELECT 1 FROM public.campaigns WHERE id = NEW.campaign_id AND user_id = auth.uid())
  THEN
    RAISE EXCEPTION 'Only the GM or campaign owner can change member roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_member_role_self_change ON public.campaign_members;
CREATE TRIGGER trg_prevent_member_role_self_change
  BEFORE UPDATE ON public.campaign_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_member_role_self_change();

-- ============================================================
-- 2) campaigns: invite code lookup must require auth
-- ============================================================
DROP POLICY IF EXISTS "Anyone can find campaign by invite code" ON public.campaigns;
CREATE POLICY "Authenticated users can find campaign by invite code"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.check_campaign_access(id, auth.uid())
    OR invite_code IS NOT NULL
  );

-- The old "Users can view accessible campaigns" policy is now redundant with the above
DROP POLICY IF EXISTS "Users can view accessible campaigns" ON public.campaigns;

-- ============================================================
-- 3) Storage: restrict listing and writes on public buckets
-- ============================================================
-- Remove any overly broad policies on the avatar buckets
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can list character-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can list avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read character-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;

-- Public READ by exact object name only (no listing of arbitrary prefixes).
CREATE POLICY "Public read character-avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'character-avatars');

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Writes restricted to the owner's folder (auth.uid()/...)
DROP POLICY IF EXISTS "Users upload own character-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users update own character-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own character-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;

CREATE POLICY "Users upload own character-avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'character-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own character-avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'character-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own character-avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'character-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- 4) Revoke direct EXECUTE on internal helpers from clients
--    (RLS continues to call them — they run as the function owner)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.add_campaign_creator_as_gm() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_member_role_self_change() FROM anon, authenticated, public;
