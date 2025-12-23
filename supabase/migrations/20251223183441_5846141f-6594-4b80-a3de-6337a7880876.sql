-- Table pour les objets magiques D&D 5e
CREATE TABLE public.magic_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  attunement BOOLEAN NOT NULL DEFAULT false,
  description TEXT NOT NULL,
  properties TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.magic_items ENABLE ROW LEVEL SECURITY;

-- Objets magiques publics en lecture
CREATE POLICY "Anyone can read magic_items" ON public.magic_items FOR SELECT USING (true);

-- Mettre à jour la table favorites pour inclure magic_item
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_item_type_check;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_item_type_check CHECK (item_type IN ('spell', 'monster', 'magic_item'));