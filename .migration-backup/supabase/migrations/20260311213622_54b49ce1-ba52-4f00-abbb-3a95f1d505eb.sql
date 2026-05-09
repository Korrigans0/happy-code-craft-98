
-- WA Creatures table for Worlds Awakening bestiary
CREATE TABLE public.wa_creatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  power_level text NOT NULL DEFAULT 'Standard',
  size text NOT NULL DEFAULT 'Moyen',
  profile text NOT NULL DEFAULT 'Équilibré',
  ra text NOT NULL DEFAULT '1/1',
  strength integer NOT NULL DEFAULT 0,
  dexterity integer NOT NULL DEFAULT 0,
  constitution integer NOT NULL DEFAULT 0,
  intelligence integer NOT NULL DEFAULT 0,
  wisdom integer NOT NULL DEFAULT 0,
  charisma integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  image_url text,
  author text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Public read access
ALTER TABLE public.wa_creatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wa_creatures"
  ON public.wa_creatures FOR SELECT
  TO public
  USING (true);
