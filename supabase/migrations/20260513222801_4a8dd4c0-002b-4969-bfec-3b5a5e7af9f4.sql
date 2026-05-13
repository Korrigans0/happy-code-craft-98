-- Audit log for campaign administrative actions
CREATE TABLE public.campaign_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  scope text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_audit_log_campaign ON public.campaign_audit_log(campaign_id, created_at DESC);

ALTER TABLE public.campaign_audit_log ENABLE ROW LEVEL SECURITY;

-- Only GMs of the campaign can view the log
CREATE POLICY "GM can view audit log"
ON public.campaign_audit_log
FOR SELECT
USING (public.is_campaign_gm(auth.uid(), campaign_id));

-- No direct INSERT policy: writes happen via the edge function (service role).
