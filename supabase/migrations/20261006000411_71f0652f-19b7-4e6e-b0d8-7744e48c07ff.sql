-- 1. Idempotent pack installation
CREATE OR REPLACE FUNCTION public.install_content_package(_package_id uuid)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _copied integer := 0; _new_install uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.content_packages p WHERE p.id = _package_id AND (p.is_published = true OR p.owner_id = _uid)) THEN
    RAISE EXCEPTION 'Package not available';
  END IF;
  INSERT INTO public.package_installs (package_id, user_id) VALUES (_package_id, _uid)
  ON CONFLICT (package_id, user_id) DO NOTHING
  RETURNING id INTO _new_install;
  IF _new_install IS NULL THEN RETURN 0; END IF; -- already installed: no copy, no count
  INSERT INTO public.homebrew_content (owner_id, system, kind, name, summary, data, image_url, is_public)
  SELECT _uid, p.system, i.kind, i.name, NULLIF(i.payload->>'summary', ''), COALESCE(i.payload, '{}'::jsonb), NULLIF(i.payload->>'image_url', ''), false
  FROM public.package_items i JOIN public.content_packages p ON p.id = i.package_id
  WHERE i.package_id = _package_id;
  GET DIAGNOSTICS _copied = ROW_COUNT;
  UPDATE public.content_packages SET install_count = install_count + 1 WHERE id = _package_id;
  RETURN _copied;
END; $function$;

-- 2. Atomic pack creation
CREATE OR REPLACE FUNCTION public.create_content_package(_title text, _description text, _system text, _tags text[], _is_published boolean, _homebrew_ids uuid[])
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _pkg uuid; _n int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF coalesce(trim(_title), '') = '' THEN RAISE EXCEPTION 'Titre requis'; END IF;
  IF _homebrew_ids IS NULL OR array_length(_homebrew_ids, 1) IS NULL THEN RAISE EXCEPTION 'Au moins une création est nécessaire'; END IF;
  INSERT INTO public.content_packages (owner_id, title, description, system, tags, is_published)
  VALUES (_uid, trim(_title), NULLIF(trim(coalesce(_description, '')), ''), _system, coalesce(_tags, '{}'), coalesce(_is_published, false))
  RETURNING id INTO _pkg;
  INSERT INTO public.package_items (package_id, kind, name, payload)
  SELECT _pkg, h.kind, h.name, coalesce(h.data, '{}'::jsonb) || jsonb_build_object('summary', coalesce(h.summary, ''), 'image_url', coalesce(h.image_url, ''))
  FROM public.homebrew_content h WHERE h.id = ANY(_homebrew_ids) AND h.owner_id = _uid;
  GET DIAGNOSTICS _n = ROW_COUNT;
  IF _n = 0 THEN RAISE EXCEPTION 'Aucune création valide sélectionnée'; END IF; -- rolls back the pack
  RETURN _pkg;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.create_content_package(text, text, text, text[], boolean, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_content_package(text, text, text, text[], boolean, uuid[]) TO authenticated;

-- 3. Whispers protected server-side
DROP POLICY IF EXISTS "Members can view messages" ON public.campaign_messages;
CREATE POLICY "Members can view messages" ON public.campaign_messages FOR SELECT TO authenticated
USING (public.is_campaign_member(auth.uid(), campaign_id)
  AND (message_type <> 'whisper' OR user_id = auth.uid() OR public.is_campaign_gm(auth.uid(), campaign_id)));

DROP POLICY IF EXISTS "Members can send messages" ON public.campaign_messages;
CREATE POLICY "Members can send messages" ON public.campaign_messages FOR INSERT TO authenticated
WITH CHECK (public.is_campaign_member(auth.uid(), campaign_id) AND auth.uid() = user_id
  AND (message_type <> 'whisper'
       OR public.is_campaign_gm(auth.uid(), campaign_id)
       -- players may only send private macro rolls (visible to themselves + GM), never GM whispers
       OR (metadata ? 'macro' AND content NOT LIKE '%[Murmure MJ]%')));

-- 4. Server-side dice result validation
CREATE OR REPLACE FUNCTION public.validate_dice_message()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE _formula text; _res jsonb; _m text[]; _count int := 0; _max int := 0; _neg boolean := false;
  _sum bigint := 0; _v jsonb; _mod int; _total numeric; _n int; _s int;
BEGIN
  IF NEW.metadata IS NULL OR NOT (NEW.metadata ? 'results') THEN RETURN NEW; END IF;
  _res := NEW.metadata->'results';
  IF jsonb_typeof(_res) <> 'array' THEN RAISE EXCEPTION 'DICE_INVALID'; END IF;
  _formula := regexp_replace(coalesce(NEW.metadata->>'dice', ''), '\s', '', 'g');
  FOR _m IN SELECT regexp_matches(_formula, '([+-]?)(\d*)[dD](\d+)', 'g') LOOP
    _n := CASE WHEN _m[2] = '' THEN 1 ELSE _m[2]::int END; _s := _m[3]::int;
    IF _n < 1 OR _s < 2 OR _s > 1000 THEN RAISE EXCEPTION 'DICE_INVALID'; END IF;
    _count := _count + _n; _max := greatest(_max, _s);
    IF _m[1] = '-' THEN _neg := true; END IF;
  END LOOP;
  IF _count = 0 OR _count > 100 OR jsonb_array_length(_res) <> _count THEN RAISE EXCEPTION 'DICE_INVALID'; END IF;
  FOR _v IN SELECT * FROM jsonb_array_elements(_res) LOOP
    IF jsonb_typeof(_v) <> 'number' OR (_v)::text::numeric < 1 OR (_v)::text::numeric > _max OR (_v)::text::numeric <> trunc((_v)::text::numeric) THEN
      RAISE EXCEPTION 'DICE_INVALID';
    END IF;
    _sum := _sum + (_v)::text::int;
  END LOOP;
  IF NOT _neg AND NEW.metadata ? 'total' THEN
    _mod := coalesce((NEW.metadata->>'modifier')::int, 0);
    _total := (NEW.metadata->>'total')::numeric;
    IF _total <> _sum + _mod THEN RAISE EXCEPTION 'DICE_INVALID'; END IF;
  END IF;
  RETURN NEW;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.validate_dice_message() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_validate_dice_message ON public.campaign_messages;
CREATE TRIGGER trg_validate_dice_message BEFORE INSERT ON public.campaign_messages
FOR EACH ROW EXECUTE FUNCTION public.validate_dice_message();