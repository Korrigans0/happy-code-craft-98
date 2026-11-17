CREATE TABLE public.character_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  owner_id uuid,
  changed_by uuid NOT NULL,
  changes jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.character_change_log TO authenticated;
GRANT ALL ON public.character_change_log TO service_role;
ALTER TABLE public.character_change_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX character_change_log_character_idx ON public.character_change_log(character_id, created_at DESC);

CREATE POLICY "Owner, campaign GM and author can read sheet history"
ON public.character_change_log FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR changed_by = auth.uid() OR public.is_gm_of_character_member(auth.uid(), character_id));

-- Returns {key: {old, new}} for keys that differ; nested objects are diffed recursively.
CREATE OR REPLACE FUNCTION public.jsonb_change_diff(_old jsonb, _new jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE _out jsonb := '{}'::jsonb; _k text; _o jsonb; _n jsonb; _inner jsonb;
BEGIN
  FOR _k IN SELECT jsonb_object_keys(coalesce(_old,'{}'::jsonb) || coalesce(_new,'{}'::jsonb)) LOOP
    _o := _old -> _k; _n := _new -> _k;
    IF _o IS DISTINCT FROM _n THEN
      IF jsonb_typeof(_o) = 'object' AND jsonb_typeof(_n) = 'object' THEN
        _inner := public.jsonb_change_diff(_o, _n);
        IF _inner <> '{}'::jsonb THEN _out := _out || jsonb_build_object(_k, _inner); END IF;
      ELSE
        _out := _out || jsonb_build_object(_k, jsonb_build_object('old', _o, 'new', _n));
      END IF;
    END IF;
  END LOOP;
  RETURN _out;
END $$;

CREATE OR REPLACE FUNCTION public.log_character_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _diff jsonb;
BEGIN
  -- Owners editing their own sheet are not logged (autosave would flood the log).
  IF _uid IS NULL OR _uid = OLD.user_id THEN RETURN NEW; END IF;
  _diff := public.jsonb_change_diff(to_jsonb(OLD) - 'updated_at', to_jsonb(NEW) - 'updated_at');
  IF _diff <> '{}'::jsonb THEN
    INSERT INTO character_change_log(character_id, owner_id, changed_by, changes)
    VALUES (NEW.id, OLD.user_id, _uid, _diff);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER characters_log_change AFTER UPDATE ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.log_character_change();