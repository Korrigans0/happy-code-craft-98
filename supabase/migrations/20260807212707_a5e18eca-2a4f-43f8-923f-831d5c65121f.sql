CREATE TABLE public.compendium_translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id text NOT NULL,
  lang text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (entry_id, lang)
);

GRANT SELECT ON public.compendium_translations TO anon;
GRANT SELECT ON public.compendium_translations TO authenticated;
GRANT ALL ON public.compendium_translations TO service_role;

ALTER TABLE public.compendium_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Translations are readable by everyone"
ON public.compendium_translations
FOR SELECT
USING (true);

CREATE TRIGGER update_compendium_translations_updated_at
BEFORE UPDATE ON public.compendium_translations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_compendium_translations_lookup ON public.compendium_translations (lang, entry_id);