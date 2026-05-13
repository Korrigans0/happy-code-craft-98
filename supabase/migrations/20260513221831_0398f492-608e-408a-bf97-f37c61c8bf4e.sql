CREATE POLICY "Members can delete campaign messages"
ON public.campaign_messages
FOR DELETE
TO public
USING (public.is_campaign_member(auth.uid(), campaign_id));