CREATE TABLE public.legal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  request_type text NOT NULL CHECK (request_type IN ('withdrawal', 'data-rights', 'content-report', 'account-deletion')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name text NOT NULL CHECK (char_length(requester_name) BETWEEN 2 AND 120),
  requester_email text NOT NULL CHECK (char_length(requester_email) <= 255),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 2 AND 160),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 4000),
  page_url text,
  user_agent text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'completed', 'rejected')),
  email_status text NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.legal_requests TO service_role;
ALTER TABLE public.legal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages legal requests" ON public.legal_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.update_legal_requests_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.update_legal_requests_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_legal_requests_updated_at() TO service_role;
CREATE TRIGGER update_legal_requests_updated_at BEFORE UPDATE ON public.legal_requests FOR EACH ROW EXECUTE FUNCTION public.update_legal_requests_updated_at();