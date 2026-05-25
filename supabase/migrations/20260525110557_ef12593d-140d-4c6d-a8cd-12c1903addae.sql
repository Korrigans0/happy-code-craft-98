
-- 1) Consolidate SELECT policies on campaign_members
DROP POLICY IF EXISTS "Members can view campaign members" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can read own membership" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can view members of their campaigns" ON public.campaign_members;

CREATE POLICY "Members can view campaign members"
  ON public.campaign_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_campaign_member(auth.uid(), campaign_id)
    OR campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
  );

-- 2) Tighten INSERT policy: only campaign owners (GMs via add_campaign_creator_as_gm trigger)
-- Players must join via the SECURITY DEFINER RPC join_campaign_by_invite_code.
DROP POLICY IF EXISTS "Campaign owners can manage members" ON public.campaign_members;

CREATE POLICY "Campaign owners can insert members"
  ON public.campaign_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
  );

-- 3) Realtime channel authorization
-- Restrict subscriptions on realtime.messages so only campaign members can
-- receive broadcasts on topics scoped to their campaigns.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaign members can read realtime messages" ON realtime.messages;
CREATE POLICY "Campaign members can read realtime messages"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.user_id = auth.uid()
        AND (
          realtime.topic() = 'vtt-dice-'   || cm.campaign_id::text
          OR realtime.topic() = 'vtt-ping-' || cm.campaign_id::text
          OR realtime.topic() = 'vtt-'      || cm.campaign_id::text
          OR realtime.topic() = 'campaign-' || cm.campaign_id::text
          OR realtime.topic() LIKE cm.campaign_id::text || '%'
        )
    )
  );

DROP POLICY IF EXISTS "Campaign members can send realtime messages" ON realtime.messages;
CREATE POLICY "Campaign members can send realtime messages"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.user_id = auth.uid()
        AND (
          realtime.topic() = 'vtt-dice-'   || cm.campaign_id::text
          OR realtime.topic() = 'vtt-ping-' || cm.campaign_id::text
          OR realtime.topic() = 'vtt-'      || cm.campaign_id::text
          OR realtime.topic() = 'campaign-' || cm.campaign_id::text
          OR realtime.topic() LIKE cm.campaign_id::text || '%'
        )
    )
  );
