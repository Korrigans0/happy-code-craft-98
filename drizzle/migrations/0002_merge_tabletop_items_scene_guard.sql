-- Token/drawing merges sent for a scene that is no longer active are refused,
-- so a player's late move from the previous scene cannot leak into the new one.
-- Older clients (no _check_scene) keep the previous behaviour.
DROP FUNCTION IF EXISTS public.merge_tabletop_items(uuid, text, jsonb, text[]);

CREATE FUNCTION public.merge_tabletop_items(
  _campaign_id uuid,
  _column text,
  _upserts jsonb,
  _removed text[],
  _expected_scene_id text DEFAULT NULL,
  _check_scene boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  cur jsonb;
  cur_scene text;
  merged jsonb;
  v_updated timestamptz;
BEGIN
  IF _column NOT IN ('tokens', 'drawings') THEN
    RAISE EXCEPTION 'Unsupported tabletop column %', _column USING ERRCODE = '22023';
  END IF;
  IF auth.uid() IS NULL OR NOT public.check_campaign_access(_campaign_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF _upserts IS NOT NULL AND jsonb_typeof(_upserts) <> 'array' THEN
    RAISE EXCEPTION 'Upserts must be an array' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.tabletop_state (campaign_id, updated_by)
  VALUES (_campaign_id, auth.uid())
  ON CONFLICT (campaign_id) DO NOTHING;

  EXECUTE format('SELECT %I, active_scene_id FROM public.tabletop_state WHERE campaign_id = $1 FOR UPDATE', _column)
    INTO cur, cur_scene USING _campaign_id;

  IF _check_scene AND cur_scene IS DISTINCT FROM _expected_scene_id THEN
    RAISE EXCEPTION 'Active scene changed' USING ERRCODE = 'SCN01';
  END IF;

  WITH base AS (
    SELECT e, ord FROM jsonb_array_elements(COALESCE(cur, '[]'::jsonb)) WITH ORDINALITY AS t(e, ord)
  ), ups AS (
    SELECT DISTINCT ON (e->>'id') e, ord
    FROM jsonb_array_elements(COALESCE(_upserts, '[]'::jsonb)) WITH ORDINALITY AS u(e, ord)
    WHERE e->>'id' IS NOT NULL
    ORDER BY e->>'id', ord DESC
  )
  SELECT COALESCE(jsonb_agg(x ORDER BY o), '[]'::jsonb) INTO merged FROM (
    SELECT COALESCE((SELECT u.e FROM ups u WHERE u.e->>'id' = b.e->>'id'), b.e) AS x, b.ord AS o
    FROM base b
    WHERE NOT (COALESCE(b.e->>'id', '') = ANY (COALESCE(_removed, '{}'::text[])))
    UNION ALL
    SELECT u.e, 1000000000 + u.ord
    FROM ups u
    WHERE NOT EXISTS (SELECT 1 FROM base b WHERE b.e->>'id' = u.e->>'id')
      AND NOT (u.e->>'id' = ANY (COALESCE(_removed, '{}'::text[])))
  ) s;

  EXECUTE format('UPDATE public.tabletop_state SET %I = $1, updated_by = $2 WHERE campaign_id = $3 RETURNING updated_at', _column)
    INTO v_updated USING merged, auth.uid(), _campaign_id;

  RETURN jsonb_build_object('items', merged, 'updated_at', v_updated);
END;
$function$;

REVOKE ALL ON FUNCTION public.merge_tabletop_items(uuid, text, jsonb, text[], text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_tabletop_items(uuid, text, jsonb, text[], text, boolean) TO authenticated, service_role;