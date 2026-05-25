-- ============================================================
-- FIX : Rejoindre une campagne via code d'invitation bloqué
-- ============================================================

-- 1. campaigns — permettre la recherche par code d'invitation
DROP POLICY IF EXISTS "Anyone can find campaign by invite code" ON public.campaigns;

CREATE POLICY "Anyone can find campaign by invite code"
  ON public.campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_members
      WHERE campaign_members.campaign_id = campaigns.id
      AND campaign_members.user_id = auth.uid()
    )
    OR invite_code IS NOT NULL
  );

-- 2. campaign_members — permettre l'auto-inscription
DROP POLICY IF EXISTS "Users can join campaigns" ON public.campaign_members;

CREATE POLICY "Users can join campaigns"
  ON public.campaign_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'player'
  );

-- 3. campaign_members — permettre de lire sa propre appartenance
DROP POLICY IF EXISTS "Users can read own membership" ON public.campaign_members;

CREATE POLICY "Users can read own membership"
  ON public.campaign_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = campaign_members.campaign_id
      AND cm.user_id = auth.uid()
    )
  );