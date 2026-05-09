ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS discord_link TEXT;
COMMENT ON COLUMN public.campaigns.discord_link IS 'Lien d''invitation Discord pour le salon vocal de la campagne';