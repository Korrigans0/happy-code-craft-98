CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  problem_type text NOT NULL,
  description text NOT NULL,
  page_url text,
  user_agent text,
  platform text,
  screen_size text,
  language text,
  reporter_email text,
  screenshot_url text,
  email_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.bug_reports TO service_role;
GRANT SELECT ON public.bug_reports TO authenticated;

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read bug reports"
ON public.bug_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_bug_reports_updated_at
BEFORE UPDATE ON public.bug_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can read bug screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'bug-screenshots' AND public.has_role(auth.uid(), 'admin'));