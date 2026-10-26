-- Private safety copy of tabletop rows whose images were embedded as base64 before they are moved to file storage.
CREATE TABLE IF NOT EXISTS public.tabletop_state_image_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  map_image_url text,
  scenes jsonb,
  tokens jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tabletop_state_image_backups TO service_role;
ALTER TABLE public.tabletop_state_image_backups ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.tabletop_state_image_backups IS 'Service-only backup of tabletop rows before inline images were externalized.';

INSERT INTO public.tabletop_state_image_backups (campaign_id, map_image_url, scenes, tokens)
SELECT campaign_id, map_image_url, scenes, tokens
FROM public.tabletop_state
WHERE map_image_url LIKE 'data:%' OR scenes::text LIKE '%data:image%' OR tokens::text LIKE '%data:image%';

-- Atomic per-id merge for multi-writer tabletop arrays (tokens, drawings).
CREATE OR REPLACE FUNCTION public.merge_tabletop_items(
  _campaign_id uuid,
  _column text,
  _upserts jsonb,
  _removed text[]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  cur jsonb;
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

  EXECUTE format('SELECT %I FROM public.tabletop_state WHERE campaign_id = $1 FOR UPDATE', _column)
    INTO cur USING _campaign_id;

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
$$;
REVOKE ALL ON FUNCTION public.merge_tabletop_items(uuid, text, jsonb, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_tabletop_items(uuid, text, jsonb, text[]) TO authenticated;

-- Per-token merge for Glyphes combat counters so one writer never overwrites other tokens with a stale copy.
CREATE OR REPLACE FUNCTION public.merge_glyphes_tokens(_campaign_id uuid, _tokens jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.check_campaign_access(_campaign_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF _tokens IS NULL OR jsonb_typeof(_tokens) <> 'object' THEN
    RAISE EXCEPTION 'Tokens must be an object' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.glyphes_combat_state (campaign_id, tokens, updated_by, updated_at)
  VALUES (_campaign_id, _tokens, auth.uid(), now())
  ON CONFLICT (campaign_id) DO UPDATE
    SET tokens = COALESCE(public.glyphes_combat_state.tokens, '{}'::jsonb) || EXCLUDED.tokens,
        updated_by = EXCLUDED.updated_by,
        updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.merge_glyphes_tokens(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_glyphes_tokens(uuid, jsonb) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_created
  ON public.campaign_messages (campaign_id, created_at);