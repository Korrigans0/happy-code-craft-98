
-- ============== PHASE 1 — Stockage MJ & Quotas ==============

-- 1. Tier enum + profile column
DO $$ BEGIN
  CREATE TYPE public.subscription_tier AS ENUM ('free', 'gm_premium', 'premium_plus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tier public.subscription_tier NOT NULL DEFAULT 'free';

-- 2. media_assets table
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('map','token','portrait','npc','creature','object','decor','document')),
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  mime TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  width INT,
  height INT,
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, checksum)
);

CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON public.media_assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_campaign ON public.media_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON public.media_assets(file_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage own media" ON public.media_assets;
CREATE POLICY "Owners manage own media" ON public.media_assets
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Campaign members can view campaign media" ON public.media_assets;
CREATE POLICY "Campaign members can view campaign media" ON public.media_assets
  FOR SELECT TO authenticated
  USING (campaign_id IS NOT NULL AND public.check_campaign_access(campaign_id, auth.uid()));

DROP TRIGGER IF EXISTS trg_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Quota config & usage RPC
CREATE OR REPLACE FUNCTION public.get_storage_quota(_tier public.subscription_tier)
RETURNS BIGINT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE _tier
    WHEN 'free' THEN 200 * 1024 * 1024            -- 200 MB
    WHEN 'gm_premium' THEN 5 * 1024 * 1024 * 1024 -- 5 GB
    WHEN 'premium_plus' THEN 25 * 1024 * 1024 * 1024 -- 25 GB
    ELSE 200 * 1024 * 1024
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_storage_usage(_user_id UUID)
RETURNS TABLE(used_bytes BIGINT, quota_bytes BIGINT, file_count BIGINT, tier public.subscription_tier)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _tier public.subscription_tier;
BEGIN
  SELECT p.tier INTO _tier FROM public.profiles p WHERE p.user_id = _user_id;
  IF _tier IS NULL THEN _tier := 'free'; END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(m.size_bytes), 0)::BIGINT,
    public.get_storage_quota(_tier),
    COUNT(*)::BIGINT,
    _tier
  FROM public.media_assets m
  WHERE m.owner_id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_storage_usage(UUID) TO authenticated;

-- 4. Enforce quota via trigger
CREATE OR REPLACE FUNCTION public.enforce_media_quota()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _tier public.subscription_tier;
  _used BIGINT;
  _quota BIGINT;
BEGIN
  SELECT tier INTO _tier FROM public.profiles WHERE user_id = NEW.owner_id;
  IF _tier IS NULL THEN _tier := 'free'; END IF;

  SELECT COALESCE(SUM(size_bytes), 0) INTO _used FROM public.media_assets WHERE owner_id = NEW.owner_id;
  _quota := public.get_storage_quota(_tier);

  IF _used + NEW.size_bytes > _quota THEN
    RAISE EXCEPTION 'STORAGE_QUOTA_EXCEEDED: % bytes used + % bytes new > % bytes quota (tier=%)',
      _used, NEW.size_bytes, _quota, _tier
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_media_quota ON public.media_assets;
CREATE TRIGGER trg_enforce_media_quota
  BEFORE INSERT ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.enforce_media_quota();

-- 5. Storage policies on gm-media bucket
-- Path convention: {owner_id}/{type}/{filename}
DROP POLICY IF EXISTS "GM media: owner read" ON storage.objects;
CREATE POLICY "GM media: owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'gm-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "GM media: owner write" ON storage.objects;
CREATE POLICY "GM media: owner write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gm-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "GM media: owner update" ON storage.objects;
CREATE POLICY "GM media: owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gm-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "GM media: owner delete" ON storage.objects;
CREATE POLICY "GM media: owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gm-media' AND (storage.foldername(name))[1] = auth.uid()::text);
