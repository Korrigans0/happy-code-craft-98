-- Allow campaign members (and GM) to view characters that are linked to a campaign they belong to via campaign_members.character_id
CREATE POLICY "Campaign members can view linked characters"
ON public.characters
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.campaign_members cm_self
    JOIN public.campaign_members cm_owner
      ON cm_owner.campaign_id = cm_self.campaign_id
    WHERE cm_self.user_id = auth.uid()
      AND cm_owner.character_id = characters.id
  )
);