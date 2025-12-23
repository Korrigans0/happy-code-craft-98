-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create characters table with full D&D attributes
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  race TEXT NOT NULL,
  class TEXT NOT NULL,
  subclass TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  background TEXT,
  alignment TEXT,
  
  -- Lore
  backstory TEXT,
  personality_traits TEXT,
  ideals TEXT,
  bonds TEXT,
  flaws TEXT,
  appearance TEXT,
  
  -- Stats
  strength INTEGER NOT NULL DEFAULT 10,
  dexterity INTEGER NOT NULL DEFAULT 10,
  constitution INTEGER NOT NULL DEFAULT 10,
  intelligence INTEGER NOT NULL DEFAULT 10,
  wisdom INTEGER NOT NULL DEFAULT 10,
  charisma INTEGER NOT NULL DEFAULT 10,
  
  -- Combat stats
  hp INTEGER NOT NULL DEFAULT 10,
  max_hp INTEGER NOT NULL DEFAULT 10,
  temp_hp INTEGER DEFAULT 0,
  armor_class INTEGER NOT NULL DEFAULT 10,
  initiative INTEGER DEFAULT 0,
  speed INTEGER DEFAULT 30,
  hit_dice TEXT,
  
  -- Proficiencies & Skills
  proficiency_bonus INTEGER DEFAULT 2,
  saving_throws TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  
  -- Equipment (references to magic_items)
  equipped_weapon_id UUID REFERENCES public.magic_items(id),
  equipped_armor_id UUID REFERENCES public.magic_items(id),
  equipped_items UUID[] DEFAULT '{}',
  inventory TEXT,
  gold INTEGER DEFAULT 0,
  
  -- Spellcasting
  spellcasting_ability TEXT,
  spell_save_dc INTEGER,
  spell_attack_bonus INTEGER,
  known_spells UUID[] DEFAULT '{}',
  prepared_spells UUID[] DEFAULT '{}',
  spell_slots JSONB DEFAULT '{}',
  
  -- Campaign
  campaign TEXT,
  experience_points INTEGER DEFAULT 0,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all characters (for party view)
CREATE POLICY "Anyone can read characters" 
ON public.characters 
FOR SELECT 
USING (true);

-- Policy: Users can manage their own characters
CREATE POLICY "Users can create their own characters" 
ON public.characters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own characters" 
ON public.characters 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own characters" 
ON public.characters 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Trigger for updated_at
CREATE TRIGGER update_characters_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();