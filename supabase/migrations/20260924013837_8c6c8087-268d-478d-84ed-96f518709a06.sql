ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'premium_pj';
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'premium_mj';
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'premium_mixed';