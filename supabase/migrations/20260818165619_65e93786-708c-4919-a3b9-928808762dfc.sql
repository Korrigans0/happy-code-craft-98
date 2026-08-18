CREATE TABLE public.homebrew_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  system text NOT NULL DEFAULT 'custom',
  kind text NOT NULL,
  name text NOT NULL,
  summary text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homebrew_content TO authenticated;
GRANT ALL ON public.homebrew_content TO service_role;
ALTER TABLE public.homebrew_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homebrew_owner_all" ON public.homebrew_content FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "homebrew_public_read" ON public.homebrew_content FOR SELECT TO authenticated USING (is_public = true);
CREATE TRIGGER homebrew_content_updated_at BEFORE UPDATE ON public.homebrew_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_homebrew_owner ON public.homebrew_content (owner_id);
CREATE INDEX idx_homebrew_system_kind ON public.homebrew_content (system, kind);

CREATE TABLE public.content_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text,
  system text NOT NULL DEFAULT 'custom',
  cover_url text,
  tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  install_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_packages TO authenticated;
GRANT ALL ON public.content_packages TO service_role;
ALTER TABLE public.content_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages_owner_all" ON public.content_packages FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "packages_published_read" ON public.content_packages FOR SELECT TO authenticated USING (is_published = true);
CREATE TRIGGER content_packages_updated_at BEFORE UPDATE ON public.content_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.content_packages(id) ON DELETE CASCADE,
  kind text NOT NULL,
  name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.package_items TO authenticated;
GRANT ALL ON public.package_items TO service_role;
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "package_items_owner_all" ON public.package_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.content_packages p WHERE p.id = package_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.content_packages p WHERE p.id = package_id AND p.owner_id = auth.uid()));
CREATE POLICY "package_items_published_read" ON public.package_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.content_packages p WHERE p.id = package_id AND p.is_published = true));
CREATE INDEX idx_package_items_package ON public.package_items (package_id);

CREATE TABLE public.package_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.content_packages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.package_installs TO authenticated;
GRANT ALL ON public.package_installs TO service_role;
ALTER TABLE public.package_installs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "installs_own" ON public.package_installs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.user_cosmetics (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  dice_skin text NOT NULL DEFAULT 'gold',
  token_frame text NOT NULL DEFAULT 'classic',
  ui_theme text NOT NULL DEFAULT 'aetheria',
  sfx_pack text NOT NULL DEFAULT 'default',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_cosmetics TO authenticated;
GRANT ALL ON public.user_cosmetics TO service_role;
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cosmetics_own" ON public.user_cosmetics FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "cosmetics_public_read" ON public.user_cosmetics FOR SELECT TO authenticated USING (true);
CREATE TRIGGER user_cosmetics_updated_at BEFORE UPDATE ON public.user_cosmetics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.install_content_package(_package_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _copied integer := 0;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.content_packages p WHERE p.id = _package_id AND (p.is_published = true OR p.owner_id = _uid)) THEN
    RAISE EXCEPTION 'Package not available';
  END IF;

  INSERT INTO public.homebrew_content (owner_id, system, kind, name, summary, data, image_url, is_public)
  SELECT _uid, p.system, i.kind, i.name,
         NULLIF(i.payload->>'summary', ''),
         COALESCE(i.payload, '{}'::jsonb),
         NULLIF(i.payload->>'image_url', ''),
         false
  FROM public.package_items i
  JOIN public.content_packages p ON p.id = i.package_id
  WHERE i.package_id = _package_id;
  GET DIAGNOSTICS _copied = ROW_COUNT;

  INSERT INTO public.package_installs (package_id, user_id) VALUES (_package_id, _uid)
  ON CONFLICT (package_id, user_id) DO NOTHING;

  UPDATE public.content_packages SET install_count = install_count + 1 WHERE id = _package_id;
  RETURN _copied;
END;
$$;
REVOKE ALL ON FUNCTION public.install_content_package(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.install_content_package(uuid) TO authenticated;