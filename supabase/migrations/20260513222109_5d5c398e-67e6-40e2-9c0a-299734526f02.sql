DROP POLICY IF EXISTS "Members can delete campaign messages" ON public.campaign_messages;

CREATE POLICY "GM can delete campaign messages"
ON public.campaign_messages
FOR DELETE
TO public
USING (public.is_campaign_gm(auth.uid(), campaign_id));