-- Table pour les sorts D&D 5e
CREATE TABLE public.spells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  school TEXT NOT NULL,
  casting_time TEXT NOT NULL,
  range TEXT NOT NULL,
  components TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT NOT NULL,
  classes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les monstres D&D 5e
CREATE TABLE public.monsters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  type TEXT NOT NULL,
  alignment TEXT NOT NULL,
  armor_class INTEGER NOT NULL,
  hit_points TEXT NOT NULL,
  speed TEXT NOT NULL,
  challenge_rating TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les favoris des utilisateurs
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('spell', 'monster')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Enable RLS
ALTER TABLE public.spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Spells et monsters sont publics en lecture
CREATE POLICY "Anyone can read spells" ON public.spells FOR SELECT USING (true);
CREATE POLICY "Anyone can read monsters" ON public.monsters FOR SELECT USING (true);

-- Favoris: lecture/écriture par propriétaire uniquement
CREATE POLICY "Users can manage their favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Insérer des sorts D&D 5e de base
INSERT INTO public.spells (name, level, school, casting_time, range, components, duration, description, classes) VALUES
('Boule de feu', 3, 'Évocation', '1 action', '45 mètres', 'V, S, M', 'Instantanée', 'Une lumière brillante jaillit de votre doigt vers un point de votre choix. Chaque créature dans une sphère de 6 mètres de rayon doit effectuer un jet de sauvegarde de Dextérité. 8d6 dégâts de feu en cas d''échec.', ARRAY['Magicien', 'Ensorceleur']),
('Éclair', 3, 'Évocation', '1 action', 'Ligne de 30 mètres', 'V, S, M', 'Instantanée', 'Un éclair forme une ligne de 30 mètres de long et 1,50 mètre de large. Chaque créature doit effectuer un jet de sauvegarde de Dextérité. 8d6 dégâts de foudre.', ARRAY['Magicien', 'Ensorceleur']),
('Projectile magique', 1, 'Évocation', '1 action', '36 mètres', 'V, S', 'Instantanée', 'Vous créez trois fléchettes de force magique. Chaque fléchette inflige 1d4+1 dégâts de force à sa cible.', ARRAY['Magicien', 'Ensorceleur']),
('Soins', 1, 'Évocation', '1 action', 'Contact', 'V, S', 'Instantanée', 'Une créature que vous touchez récupère un nombre de points de vie égal à 1d8 + votre modificateur de caractéristique d''incantation.', ARRAY['Barde', 'Clerc', 'Druide', 'Paladin', 'Rôdeur']),
('Bouclier', 1, 'Abjuration', '1 réaction', 'Personnelle', 'V, S', '1 round', 'Une barrière invisible de force magique apparaît et vous protège. Vous gagnez un bonus de +5 à la CA.', ARRAY['Magicien', 'Ensorceleur']),
('Invisibilité', 2, 'Illusion', '1 action', 'Contact', 'V, S, M', 'Concentration, jusqu''à 1 heure', 'Une créature que vous touchez devient invisible jusqu''à la fin du sort.', ARRAY['Barde', 'Magicien', 'Ensorceleur', 'Occultiste']),
('Mot de guérison', 1, 'Évocation', '1 action bonus', '18 mètres', 'V', 'Instantanée', 'Une créature de votre choix récupère 1d4 + votre modificateur de caractéristique d''incantation points de vie.', ARRAY['Barde', 'Clerc']),
('Détection de la magie', 1, 'Divination', '1 action (rituel)', 'Personnelle', 'V, S', 'Concentration, jusqu''à 10 minutes', 'Vous percevez la présence de magie dans un rayon de 9 mètres. Vous pouvez utiliser votre action pour voir une faible aura autour de tout objet ou créature magique.', ARRAY['Barde', 'Clerc', 'Druide', 'Paladin', 'Rôdeur', 'Magicien', 'Ensorceleur']),
('Lumière', 0, 'Évocation', '1 action', 'Contact', 'V, M', '1 heure', 'Vous touchez un objet. L''objet émet une lumière vive dans un rayon de 6 mètres.', ARRAY['Barde', 'Clerc', 'Magicien', 'Ensorceleur']),
('Prestidigitation', 0, 'Transmutation', '1 action', '3 mètres', 'V, S', 'Jusqu''à 1 heure', 'Ce sort est un tour de magie mineur que les lanceurs de sorts novices utilisent pour s''entraîner.', ARRAY['Barde', 'Magicien', 'Ensorceleur', 'Occultiste']),
('Rayon de givre', 0, 'Évocation', '1 action', '18 mètres', 'V, S', 'Instantanée', 'Un rayon de lumière bleutée glaciale file vers une créature. 1d8 dégâts de froid et sa vitesse est réduite de 3 mètres.', ARRAY['Magicien', 'Ensorceleur']),
('Trait de feu', 0, 'Évocation', '1 action', '36 mètres', 'V, S', 'Instantanée', 'Vous lancez un trait de feu vers une créature ou un objet. 1d10 dégâts de feu.', ARRAY['Magicien', 'Ensorceleur']);

-- Insérer des monstres D&D 5e de base
INSERT INTO public.monsters (name, size, type, alignment, armor_class, hit_points, speed, challenge_rating, description) VALUES
('Gobelin', 'Petit', 'Humanoïde', 'Neutre Mauvais', 15, '7 (2d6)', '9 mètres', '1/4', 'Les gobelins sont de petits humanoïdes malveillants qui vivent dans des cavernes et des ruines. Ils sont lâches mais dangereux en groupe.'),
('Orc', 'Moyen', 'Humanoïde', 'Chaotique Mauvais', 13, '15 (2d8+6)', '9 mètres', '1/2', 'Les orcs sont des humanoïdes brutaux et agressifs qui vivent pour la guerre et le pillage.'),
('Squelette', 'Moyen', 'Mort-vivant', 'Loyal Mauvais', 13, '13 (2d8+4)', '9 mètres', '1/4', 'Les squelettes sont des morts-vivants animés par la magie noire, obéissant aveuglément à leur créateur.'),
('Zombie', 'Moyen', 'Mort-vivant', 'Neutre Mauvais', 8, '22 (3d8+9)', '6 mètres', '1/4', 'Les zombies sont des cadavres réanimés, lents mais tenaces, animés par une faim insatiable.'),
('Loup', 'Moyen', 'Bête', 'Non aligné', 13, '11 (2d8+2)', '12 mètres', '1/4', 'Les loups sont des prédateurs habiles qui chassent en meute pour traquer leurs proies.'),
('Ours brun', 'Grand', 'Bête', 'Non aligné', 11, '34 (4d10+12)', '12 mètres, escalade 9 mètres', '1', 'L''ours brun est un prédateur puissant qui peut être agressif quand il se sent menacé.'),
('Dragon rouge adulte', 'Très grand', 'Dragon', 'Chaotique Mauvais', 19, '256 (19d12+133)', '12 mètres, vol 24 mètres', '17', 'Les dragons rouges sont les plus arrogants et destructeurs des dragons chromatiques.'),
('Géant des collines', 'Très grand', 'Géant', 'Chaotique Mauvais', 13, '105 (10d12+40)', '12 mètres', '5', 'Les géants des collines sont stupides et brutaux, préférant frapper d''abord et réfléchir jamais.'),
('Troll', 'Grand', 'Géant', 'Chaotique Mauvais', 15, '84 (8d10+40)', '9 mètres', '5', 'Les trolls possèdent une régénération incroyable et ne peuvent être tués que par le feu ou l''acide.'),
('Mimique', 'Moyen', 'Créature monstrueuse', 'Neutre', 12, '58 (9d8+18)', '4,5 mètres', '2', 'Les mimiques sont des créatures métamorphes qui prennent la forme d''objets pour piéger leurs proies.');