ALTER TABLE public.characters
  ADD COLUMN kind text NOT NULL DEFAULT 'standard',
  ADD COLUMN pregen_campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  ADD COLUMN pregen_available boolean NOT NULL DEFAULT false,
  ADD COLUMN pregen_allow_multiple boolean NOT NULL DEFAULT false,
  ADD COLUMN source_character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  ADD COLUMN source_package_id uuid REFERENCES public.content_packages(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS characters_pregen_campaign_idx ON public.characters(pregen_campaign_id) WHERE kind = 'pregen';
CREATE INDEX IF NOT EXISTS characters_source_idx ON public.characters(source_character_id);

-- Validation of pregen fields
CREATE OR REPLACE FUNCTION public.validate_character_pregen()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.kind NOT IN ('standard','pregen') THEN
    RAISE EXCEPTION 'Invalid character kind';
  END IF;
  IF NEW.kind = 'pregen' THEN
    IF NEW.pregen_campaign_id IS NULL THEN RAISE EXCEPTION 'Pregen requires a campaign'; END IF;
    IF auth.uid() IS NOT NULL AND NOT public.is_campaign_gm(auth.uid(), NEW.pregen_campaign_id) THEN
      RAISE EXCEPTION 'Only the campaign GM can manage pregens';
    END IF;
  ELSE
    NEW.pregen_campaign_id := NULL;
    NEW.pregen_available := false;
    NEW.pregen_allow_multiple := false;
  END IF;
  IF TG_OP = 'UPDATE' AND auth.uid() IS NOT NULL THEN
    NEW.source_character_id := OLD.source_character_id;
    NEW.source_package_id := OLD.source_package_id;
    IF OLD.kind <> NEW.kind THEN RAISE EXCEPTION 'Character kind cannot change'; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER characters_validate_pregen BEFORE INSERT OR UPDATE ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.validate_character_pregen();

-- Quota: pregens do not count
CREATE OR REPLACE FUNCTION public.enforce_character_quota()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _tier public.subscription_tier; _count int; _limit int;
BEGIN
 IF NEW.kind = 'pregen' THEN RETURN NEW; END IF;
 _tier := public.effective_tier(NEW.user_id);
 _limit:=CASE _tier WHEN 'premium_pj' THEN 20 WHEN 'premium_mixed' THEN 50 WHEN 'premium_plus' THEN 50 ELSE 3 END;
 SELECT count(*) INTO _count FROM public.characters WHERE user_id=NEW.user_id AND kind='standard';
 IF _count>=_limit THEN RAISE EXCEPTION 'PLAN_LIMIT_CHARACTERS: Limite de % personnages atteinte.',_limit USING ERRCODE='check_violation'; END IF; RETURN NEW;
END; $function$;

-- Players read available pregens of their campaigns; GM reads all pregens of their campaigns
CREATE POLICY "Members can view available pregens" ON public.characters FOR SELECT TO authenticated
USING (kind = 'pregen' AND (
  public.is_campaign_gm(auth.uid(), pregen_campaign_id)
  OR (pregen_available AND public.is_campaign_member(auth.uid(), pregen_campaign_id))
));
CREATE POLICY "GM can update campaign pregens" ON public.characters FOR UPDATE TO authenticated
USING (kind = 'pregen' AND public.is_campaign_gm(auth.uid(), pregen_campaign_id))
WITH CHECK (kind = 'pregen' AND public.is_campaign_gm(auth.uid(), pregen_campaign_id));
CREATE POLICY "GM can delete campaign pregens" ON public.characters FOR DELETE TO authenticated
USING (kind = 'pregen' AND public.is_campaign_gm(auth.uid(), pregen_campaign_id));

-- Internal copy helper (not exposed)
CREATE OR REPLACE FUNCTION public._copy_character(_src jsonb, _overrides jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid := gen_random_uuid(); _rec public.characters;
BEGIN
  _rec := jsonb_populate_record(NULL::public.characters,
    (_src - 'id' - 'created_at' - 'updated_at') || jsonb_build_object('id', _id, 'created_at', now(), 'updated_at', now()) || _overrides);
  INSERT INTO public.characters SELECT _rec.*;
  RETURN _id;
END; $$;
REVOKE ALL ON FUNCTION public._copy_character(jsonb, jsonb) FROM PUBLIC, anon, authenticated;

-- Pregen assignment core
CREATE OR REPLACE FUNCTION public._assign_pregen(_pregen_id uuid, _user_id uuid, _by_gm boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.characters; _new uuid;
BEGIN
  SELECT * INTO _p FROM public.characters WHERE id = _pregen_id AND kind = 'pregen' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pré-tiré introuvable'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.campaign_members WHERE campaign_id = _p.pregen_campaign_id AND user_id = _user_id AND role = 'player') THEN
    RAISE EXCEPTION 'Ce joueur n''est pas membre de la campagne';
  END IF;
  IF NOT _by_gm AND NOT _p.pregen_available THEN RAISE EXCEPTION 'Ce pré-tiré n''est pas disponible'; END IF;
  IF NOT _p.pregen_allow_multiple AND EXISTS (
    SELECT 1 FROM public.campaign_members cm JOIN public.characters c ON c.id = cm.character_id
    WHERE cm.campaign_id = _p.pregen_campaign_id AND c.source_character_id = _pregen_id) THEN
    RAISE EXCEPTION 'Ce pré-tiré est déjà attribué';
  END IF;
  _new := public._copy_character(to_jsonb(_p), jsonb_build_object(
    'user_id', _user_id, 'kind', 'standard', 'pregen_campaign_id', NULL,
    'pregen_available', false, 'pregen_allow_multiple', false, 'source_character_id', _pregen_id));
  UPDATE public.campaign_members SET character_id = _new
  WHERE campaign_id = _p.pregen_campaign_id AND user_id = _user_id;
  RETURN _new;
END; $$;
REVOKE ALL ON FUNCTION public._assign_pregen(uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_pregen_character(_pregen_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  RETURN public._assign_pregen(_pregen_id, auth.uid(), false);
END; $$;

CREATE OR REPLACE FUNCTION public.gm_assign_pregen(_pregen_id uuid, _user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid;
BEGIN
  SELECT pregen_campaign_id INTO _cid FROM public.characters WHERE id = _pregen_id AND kind = 'pregen';
  IF _cid IS NULL OR NOT public.is_campaign_gm(auth.uid(), _cid) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN public._assign_pregen(_pregen_id, _user_id, true);
END; $$;

CREATE OR REPLACE FUNCTION public.gm_unassign_pregen(_pregen_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid;
BEGIN
  SELECT pregen_campaign_id INTO _cid FROM public.characters WHERE id = _pregen_id AND kind = 'pregen';
  IF _cid IS NULL OR NOT public.is_campaign_gm(auth.uid(), _cid) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE public.campaign_members cm SET character_id = NULL
  FROM public.characters c
  WHERE cm.character_id = c.id AND c.source_character_id = _pregen_id
    AND cm.campaign_id = _cid AND cm.user_id = _user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.duplicate_pregen(_pregen_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.characters;
BEGIN
  SELECT * INTO _p FROM public.characters WHERE id = _pregen_id AND kind = 'pregen';
  IF NOT FOUND OR NOT public.is_campaign_gm(auth.uid(), _p.pregen_campaign_id) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN public._copy_character(to_jsonb(_p), jsonb_build_object(
    'user_id', auth.uid(), 'name', _p.name || ' (copie)', 'pregen_available', false, 'source_character_id', NULL));
END; $$;

-- List pregens with assignment info (role-aware)
CREATE OR REPLACE FUNCTION public.list_campaign_pregens(_campaign_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _gm boolean := public.is_campaign_gm(auth.uid(), _campaign_id);
BEGIN
  IF NOT public.is_campaign_member(auth.uid(), _campaign_id) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'character', to_jsonb(p),
      'assigned', COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'user_id', cm.user_id,
          'display_name', CASE WHEN _gm OR cm.user_id = auth.uid() THEN COALESCE(pr.display_name, 'Joueur') ELSE NULL END,
          'is_me', cm.user_id = auth.uid()))
        FROM public.campaign_members cm
        JOIN public.characters c ON c.id = cm.character_id
        LEFT JOIN public.profiles pr ON pr.user_id = cm.user_id
        WHERE cm.campaign_id = _campaign_id AND c.source_character_id = p.id), '[]'::jsonb)
    ) ORDER BY p.created_at)
    FROM public.characters p
    WHERE p.kind = 'pregen' AND p.pregen_campaign_id = _campaign_id AND (_gm OR p.pregen_available)), '[]'::jsonb);
END; $$;

-- Publish to shop (snapshot; model stays independent)
CREATE OR REPLACE FUNCTION public.publish_pregen_to_shop(_pregen_id uuid, _title text, _description text, _tags text[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.characters; _pkg uuid; _snap jsonb;
BEGIN
  SELECT * INTO _p FROM public.characters WHERE id = _pregen_id AND kind = 'pregen';
  IF NOT FOUND OR NOT public.is_campaign_gm(auth.uid(), _p.pregen_campaign_id) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  _snap := to_jsonb(_p) - 'id' - 'user_id' - 'pregen_campaign_id' - 'pregen_available' - 'pregen_allow_multiple'
           - 'source_character_id' - 'source_package_id' - 'created_at' - 'updated_at' - 'campaign';
  INSERT INTO public.content_packages (owner_id, title, description, system, cover_url, tags, is_published)
  VALUES (auth.uid(), COALESCE(NULLIF(trim(_title), ''), _p.name), NULLIF(trim(_description), ''), _p.system, _p.avatar_url,
          COALESCE(_tags, '{}') || ARRAY['pre-tire'], true)
  RETURNING id INTO _pkg;
  INSERT INTO public.package_items (package_id, kind, name, payload)
  VALUES (_pkg, 'pregen_character', _p.name,
    _snap || jsonb_build_object('summary', concat_ws(' — ', _p.class, _p.race, 'Niveau ' || _p.level), 'image_url', _p.avatar_url));
  RETURN _pkg;
END; $$;

-- Library -> campaign (new independent pregen)
CREATE OR REPLACE FUNCTION public.add_library_pregen_to_campaign(_homebrew_id uuid, _campaign_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _h public.homebrew_content; _sys text;
BEGIN
  SELECT * INTO _h FROM public.homebrew_content WHERE id = _homebrew_id AND owner_id = auth.uid() AND kind = 'pregen_character';
  IF NOT FOUND THEN RAISE EXCEPTION 'Contenu introuvable'; END IF;
  IF NOT public.is_campaign_gm(auth.uid(), _campaign_id) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT system INTO _sys FROM public.campaigns WHERE id = _campaign_id;
  IF _sys IS DISTINCT FROM _h.system THEN RAISE EXCEPTION 'Le système de ce personnage ne correspond pas à celui de la campagne'; END IF;
  RETURN public._copy_character(
    (_h.data - 'summary' - 'image_url' - 'id') || jsonb_build_object('system', _h.system),
    jsonb_build_object('user_id', auth.uid(), 'kind', 'pregen', 'pregen_campaign_id', _campaign_id,
      'pregen_available', false, 'pregen_allow_multiple', false, 'source_character_id', NULL,
      'name', COALESCE(_h.data->>'name', _h.name)));
END; $$;

REVOKE ALL ON FUNCTION public.claim_pregen_character(uuid), public.gm_assign_pregen(uuid, uuid), public.gm_unassign_pregen(uuid, uuid),
  public.duplicate_pregen(uuid), public.list_campaign_pregens(uuid), public.publish_pregen_to_shop(uuid, text, text, text[]),
  public.add_library_pregen_to_campaign(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_pregen_character(uuid), public.gm_assign_pregen(uuid, uuid), public.gm_unassign_pregen(uuid, uuid),
  public.duplicate_pregen(uuid), public.list_campaign_pregens(uuid), public.publish_pregen_to_shop(uuid, text, text, text[]),
  public.add_library_pregen_to_campaign(uuid, uuid) TO authenticated;