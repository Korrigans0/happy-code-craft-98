CREATE OR REPLACE FUNCTION public.enforce_tabletop_gm_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_campaign_gm(auth.uid(), NEW.campaign_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.map_image_url IS DISTINCT FROM OLD.map_image_url
     OR NEW.fog_visible IS DISTINCT FROM OLD.fog_visible
     OR NEW.walls IS DISTINCT FROM OLD.walls
     OR NEW.lights IS DISTINCT FROM OLD.lights
     OR NEW.night_mode IS DISTINCT FROM OLD.night_mode
     OR NEW.initiative IS DISTINCT FROM OLD.initiative
     OR NEW.initiative_round IS DISTINCT FROM OLD.initiative_round
     OR NEW.initiative_active_idx IS DISTINCT FROM OLD.initiative_active_idx
     OR NEW.scenes IS DISTINCT FROM OLD.scenes
     OR NEW.active_scene_id IS DISTINCT FROM OLD.active_scene_id
     OR NEW.layers IS DISTINCT FROM OLD.layers
     OR NEW.shared_documents IS DISTINCT FROM OLD.shared_documents
  THEN
    RAISE EXCEPTION 'Only the GM can modify map, fog, walls, lights, night mode, initiative, scenes, layers or shared documents'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$function$;