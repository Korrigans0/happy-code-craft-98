CREATE POLICY "GM can view characters of campaign members"
ON public.characters
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.campaign_members cm
    WHERE cm.user_id = characters.user_id
      AND public.is_campaign_gm(auth.uid(), cm.campaign_id)
  )
);