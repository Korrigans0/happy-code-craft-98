CREATE OR REPLACE FUNCTION public.validate_dice_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE _formula text; _res jsonb; _m text[]; _count int := 0; _max int := 0; _neg boolean := false;
  _sum bigint := 0; _v jsonb; _mod int; _total numeric; _n int; _s int;
  _g jsonb; _gsize numeric; _gcount int; _gval numeric; _gsucc numeric;
BEGIN
  -- Glyphes check results shared in chat: dice pool of one die size (d4..d12).
  IF NEW.metadata IS NOT NULL AND NEW.metadata ? 'glyphes' THEN
    _g := NEW.metadata->'glyphes';
    IF jsonb_typeof(_g) <> 'object' OR jsonb_typeof(_g->'dice') IS DISTINCT FROM 'array'
       OR jsonb_typeof(_g->'dieSize') IS DISTINCT FROM 'number'
       OR jsonb_typeof(_g->'successes') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'DICE_INVALID';
    END IF;
    _gsize := (_g->>'dieSize')::numeric;
    IF _gsize NOT IN (4, 6, 8, 10, 12) THEN RAISE EXCEPTION 'DICE_INVALID'; END IF;
    _gcount := jsonb_array_length(_g->'dice');
    IF _gcount < 1 OR _gcount > 40 THEN RAISE EXCEPTION 'DICE_INVALID'; END IF;
    FOR _v IN SELECT * FROM jsonb_array_elements(_g->'dice') LOOP
      IF jsonb_typeof(_v) <> 'object' OR jsonb_typeof(_v->'value') IS DISTINCT FROM 'number' THEN
        RAISE EXCEPTION 'DICE_INVALID';
      END IF;
      _gval := (_v->>'value')::numeric;
      IF _gval < 1 OR _gval > _gsize OR _gval <> trunc(_gval) THEN RAISE EXCEPTION 'DICE_INVALID'; END IF;
    END LOOP;
    _gsucc := (_g->>'successes')::numeric;
    IF _gsucc < 0 OR _gsucc > _gcount OR _gsucc <> trunc(_gsucc) THEN RAISE EXCEPTION 'DICE_INVALID'; END IF;
  END IF;

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