
CREATE TABLE IF NOT EXISTS public.campaign_pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size_bytes BIGINT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_pdfs TO authenticated;
GRANT ALL ON public.campaign_pdfs TO service_role;

ALTER TABLE public.campaign_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can read pdfs"
  ON public.campaign_pdfs
  FOR SELECT
  TO authenticated
  USING (public.check_campaign_access(campaign_id, auth.uid()));

CREATE POLICY "GM can insert pdfs"
  ON public.campaign_pdfs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_campaign_gm(auth.uid(), campaign_id) AND uploaded_by = auth.uid());

CREATE POLICY "GM can update pdfs"
  ON public.campaign_pdfs
  FOR UPDATE
  TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE POLICY "GM can delete pdfs"
  ON public.campaign_pdfs
  FOR DELETE
  TO authenticated
  USING (public.is_campaign_gm(auth.uid(), campaign_id));

CREATE INDEX IF NOT EXISTS idx_campaign_pdfs_campaign ON public.campaign_pdfs(campaign_id);

-- Storage policies on storage.objects for the private bucket 'campaign-pdfs'.
-- File path convention: '<campaign_id>/<uuid>.pdf'
CREATE POLICY "Campaign members can read campaign pdf files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'campaign-pdfs'
    AND public.check_campaign_access((split_part(name, '/', 1))::uuid, auth.uid())
  );

CREATE POLICY "GM can upload campaign pdf files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-pdfs'
    AND public.is_campaign_gm(auth.uid(), (split_part(name, '/', 1))::uuid)
  );

CREATE POLICY "GM can delete campaign pdf files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'campaign-pdfs'
    AND public.is_campaign_gm(auth.uid(), (split_part(name, '/', 1))::uuid)
  );
