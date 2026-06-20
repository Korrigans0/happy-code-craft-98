
-- Free plan: max 3 campaigns per user
CREATE OR REPLACE FUNCTION public.enforce_campaign_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier subscription_tier;
  _count int;
BEGIN
  SELECT tier INTO _tier FROM profiles WHERE user_id = NEW.user_id;
  IF _tier IS NULL THEN _tier := 'free'; END IF;
  IF _tier = 'free' THEN
    SELECT count(*) INTO _count FROM campaigns WHERE user_id = NEW.user_id;
    IF _count >= 3 THEN
      RAISE EXCEPTION 'PLAN_LIMIT_CAMPAIGNS: Le plan gratuit est limité à 3 campagnes.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_campaign_quota_trigger ON public.campaigns;
CREATE TRIGGER enforce_campaign_quota_trigger
BEFORE INSERT ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.enforce_campaign_quota();

-- Free plan: max 3 characters per user
CREATE OR REPLACE FUNCTION public.enforce_character_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier subscription_tier;
  _count int;
BEGIN
  SELECT tier INTO _tier FROM profiles WHERE user_id = NEW.user_id;
  IF _tier IS NULL THEN _tier := 'free'; END IF;
  IF _tier = 'free' THEN
    SELECT count(*) INTO _count FROM characters WHERE user_id = NEW.user_id;
    IF _count >= 3 THEN
      RAISE EXCEPTION 'PLAN_LIMIT_CHARACTERS: Le plan gratuit est limité à 3 personnages.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_character_quota_trigger ON public.characters;
CREATE TRIGGER enforce_character_quota_trigger
BEFORE INSERT ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.enforce_character_quota();

-- Free plan: max 5 non-GM members per campaign owned by free-tier GM
CREATE OR REPLACE FUNCTION public.enforce_member_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _gm_id uuid;
  _tier subscription_tier;
  _count int;
BEGIN
  IF NEW.role = 'gm' THEN
    RETURN NEW;
  END IF;
  SELECT user_id INTO _gm_id FROM campaigns WHERE id = NEW.campaign_id;
  IF _gm_id IS NULL THEN RETURN NEW; END IF;
  SELECT tier INTO _tier FROM profiles WHERE user_id = _gm_id;
  IF _tier IS NULL THEN _tier := 'free'; END IF;
  IF _tier = 'free' THEN
    SELECT count(*) INTO _count
    FROM campaign_members
    WHERE campaign_id = NEW.campaign_id AND role <> 'gm';
    IF _count >= 5 THEN
      RAISE EXCEPTION 'PLAN_LIMIT_PLAYERS: Cette campagne est complète (limite 5 joueurs sur plan gratuit du MJ).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_member_quota_trigger ON public.campaign_members;
CREATE TRIGGER enforce_member_quota_trigger
BEFORE INSERT ON public.campaign_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_member_quota();
