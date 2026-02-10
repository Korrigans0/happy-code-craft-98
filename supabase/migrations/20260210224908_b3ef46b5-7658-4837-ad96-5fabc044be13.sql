
-- Allow campaign members to view campaigns they've joined
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
CREATE POLICY "Users can view accessible campaigns" 
ON public.campaigns 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.campaign_members 
    WHERE campaign_members.campaign_id = campaigns.id 
    AND campaign_members.user_id = auth.uid()
  )
);
