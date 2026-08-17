CREATE TABLE public.session_email_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.campaign_sessions(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  recipient_email text,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.session_email_notifications TO authenticated;
GRANT ALL ON public.session_email_notifications TO service_role;

ALTER TABLE public.session_email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view session notification status"
ON public.session_email_notifications
FOR SELECT
TO authenticated
USING (public.is_campaign_member(auth.uid(), campaign_id));

CREATE UNIQUE INDEX session_email_notifications_unique_once
  ON public.session_email_notifications (session_id, user_id, kind)
  WHERE kind IN ('created', 'reminder');

CREATE INDEX idx_session_email_notifications_session ON public.session_email_notifications (session_id);
CREATE INDEX idx_campaign_sessions_scheduled_at ON public.campaign_sessions (scheduled_at) WHERE scheduled_at IS NOT NULL;