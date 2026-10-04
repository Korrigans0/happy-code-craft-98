CREATE OR REPLACE FUNCTION public.list_package_creators()
RETURNS TABLE(owner_id uuid, display_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT cp.owner_id, COALESCE(p.display_name, 'Créateur')::text
  FROM content_packages cp LEFT JOIN profiles p ON p.user_id = cp.owner_id
  WHERE cp.is_published = true OR cp.owner_id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.list_package_creators() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_package_creators() TO authenticated;