UPDATE public.profiles SET tier = 'premium_mj'::public.subscription_tier WHERE tier = 'gm_premium'::public.subscription_tier;
UPDATE public.profiles SET tier = 'premium_mixed'::public.subscription_tier WHERE tier = 'premium_plus'::public.subscription_tier;

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'annual')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),
  last_payment_failed_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_subscriptions_user_environment ON public.subscriptions(user_id, environment, created_at DESC);
CREATE INDEX idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = user_uuid AND environment = check_env AND ((status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now())) OR (status = 'canceled' AND current_period_end > now())))
$$;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.prevent_profile_tier_self_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tier IS DISTINCT FROM OLD.tier AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'SUBSCRIPTION_TIER_PROTECTED: Le niveau d’abonnement est géré par le service de paiement.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.prevent_profile_tier_self_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_profile_tier ON public.profiles;
CREATE TRIGGER protect_profile_tier BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_tier_self_change();

CREATE OR REPLACE FUNCTION public.get_storage_quota(_tier public.subscription_tier) RETURNS bigint LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _tier WHEN 'free' THEN 5::bigint*1024*1024*1024 WHEN 'premium_pj' THEN 10::bigint*1024*1024*1024 WHEN 'premium_mj' THEN 15::bigint*1024*1024*1024 WHEN 'premium_mixed' THEN 30::bigint*1024*1024*1024 WHEN 'gm_premium' THEN 15::bigint*1024*1024*1024 WHEN 'premium_plus' THEN 30::bigint*1024*1024*1024 ELSE 5::bigint*1024*1024*1024 END
$$;

CREATE OR REPLACE FUNCTION public.enforce_campaign_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tier public.subscription_tier; _count int; _limit int;
BEGIN
 SELECT tier INTO _tier FROM public.profiles WHERE user_id=NEW.user_id; _tier:=COALESCE(_tier,'free');
 _limit:=CASE _tier WHEN 'premium_mj' THEN 20 WHEN 'premium_mixed' THEN 50 WHEN 'gm_premium' THEN 20 WHEN 'premium_plus' THEN 50 ELSE 3 END;
 SELECT count(*) INTO _count FROM public.campaigns WHERE user_id=NEW.user_id;
 IF _count>=_limit THEN RAISE EXCEPTION 'PLAN_LIMIT_CAMPAIGNS: Limite de % campagnes atteinte.',_limit USING ERRCODE='check_violation'; END IF; RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.enforce_character_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tier public.subscription_tier; _count int; _limit int;
BEGIN
 SELECT tier INTO _tier FROM public.profiles WHERE user_id=NEW.user_id; _tier:=COALESCE(_tier,'free');
 _limit:=CASE _tier WHEN 'premium_pj' THEN 20 WHEN 'premium_mixed' THEN 50 WHEN 'premium_plus' THEN 50 ELSE 3 END;
 SELECT count(*) INTO _count FROM public.characters WHERE user_id=NEW.user_id;
 IF _count>=_limit THEN RAISE EXCEPTION 'PLAN_LIMIT_CHARACTERS: Limite de % personnages atteinte.',_limit USING ERRCODE='check_violation'; END IF; RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.enforce_member_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _gm_id uuid; _tier public.subscription_tier; _count int; _limit int;
BEGIN
 IF NEW.role='gm' THEN RETURN NEW; END IF; SELECT user_id INTO _gm_id FROM public.campaigns WHERE id=NEW.campaign_id; IF _gm_id IS NULL THEN RETURN NEW; END IF;
 SELECT tier INTO _tier FROM public.profiles WHERE user_id=_gm_id; _tier:=COALESCE(_tier,'free');
 _limit:=CASE _tier WHEN 'premium_mj' THEN 10 WHEN 'premium_mixed' THEN 10 WHEN 'gm_premium' THEN 10 WHEN 'premium_plus' THEN 10 ELSE 5 END;
 SELECT count(*) INTO _count FROM public.campaign_members WHERE campaign_id=NEW.campaign_id AND role<>'gm';
 IF _count>=_limit THEN RAISE EXCEPTION 'PLAN_LIMIT_PLAYERS: Limite de % joueurs atteinte.',_limit USING ERRCODE='check_violation'; END IF; RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.prevent_media_size_tampering() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN IF NEW.size_bytes IS DISTINCT FROM OLD.size_bytes AND COALESCE(auth.role(),'')<>'service_role' THEN RAISE EXCEPTION 'MEDIA_SIZE_PROTECTED: La taille du fichier ne peut pas être modifiée.' USING ERRCODE='insufficient_privilege'; END IF; RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.prevent_media_size_tampering() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_media_size ON public.media_assets;
CREATE TRIGGER protect_media_size BEFORE UPDATE OF size_bytes ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.prevent_media_size_tampering();