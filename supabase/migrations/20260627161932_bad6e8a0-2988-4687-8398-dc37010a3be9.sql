
CREATE TYPE public.glyphes_content_kind AS ENUM ('creature', 'object', 'map');

CREATE TABLE public.glyphes_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  kind public.glyphes_content_kind NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.glyphes_content TO authenticated;
GRANT SELECT ON public.glyphes_content TO anon;
GRANT ALL ON public.glyphes_content TO service_role;

ALTER TABLE public.glyphes_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View public or own glyphes content"
  ON public.glyphes_content FOR SELECT
  USING (is_public OR created_by = auth.uid());

CREATE POLICY "Authenticated can insert own glyphes content"
  ON public.glyphes_content FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owner can update glyphes content"
  ON public.glyphes_content FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owner can delete glyphes content"
  ON public.glyphes_content FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE TRIGGER update_glyphes_content_updated_at
  BEFORE UPDATE ON public.glyphes_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX glyphes_content_kind_public_idx ON public.glyphes_content (kind, is_public);
CREATE INDEX glyphes_content_created_by_idx ON public.glyphes_content (created_by);
