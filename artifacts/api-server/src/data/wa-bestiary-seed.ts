// Bestiaire officiel Worlds Awakening — données de seed
// Source : fiches officielles WA (importées manuellement)

export interface WaSeedCreature {
  name: string;
  description: string;
  profile: string;
  power_level: string;
  size: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  ra: string;
  author: string;
}

export const WA_BESTIARY_SEED: WaSeedCreature[] = [
  // ── STANDARDS ──────────────────────────────────────────────
  {
    name: "Loup des Ombres",
    description: "Prédateur nocturne dont le pelage absorbe la lumière. Chasse en meute silencieuse et coordonnée.",
    profile: "Rapide", power_level: "Standard", size: "Moyen",
    strength: 1, dexterity: 3, constitution: 0, intelligence: -1, wisdom: 2, charisma: -1, ra: "1/2",
    author: "WA Officiel",
  },
  {
    name: "Goule des Marais",
    description: "Mort-vivant pourrissant errant dans les marécages. Sa morsure paralyse sa proie.",
    profile: "Défensif", power_level: "Standard", size: "Moyen",
    strength: 2, dexterity: 0, constitution: 2, intelligence: -2, wisdom: 0, charisma: -2, ra: "2/1",
    author: "WA Officiel",
  },
  {
    name: "Araignée Géante",
    description: "Arachnide de la taille d'un cheval. Tisse des toiles quasi-invisibles et injecte un venin paralysant.",
    profile: "Équilibré", power_level: "Standard", size: "Grand",
    strength: 2, dexterity: 2, constitution: 1, intelligence: -2, wisdom: 1, charisma: -3, ra: "1/2",
    author: "WA Officiel",
  },
  {
    name: "Bandit des Routes",
    description: "Humain désespéré ou mercenaire sans foi. Attaque en groupe, fuit si malmené.",
    profile: "Offensif", power_level: "Standard", size: "Moyen",
    strength: 1, dexterity: 1, constitution: 0, intelligence: 0, wisdom: -1, charisma: 0, ra: "1/1",
    author: "WA Officiel",
  },
  {
    name: "Squelette Guerrier",
    description: "Ossements animés par une nécromancie ancienne. Insensible à la douleur et à la fatigue.",
    profile: "Offensif", power_level: "Standard", size: "Moyen",
    strength: 2, dexterity: 1, constitution: 0, intelligence: -2, wisdom: -1, charisma: -2, ra: "1/2",
    author: "WA Officiel",
  },
  {
    name: "Kobold Piégeur",
    description: "Petit reptile rusé qui défend son territoire avec des pièges élaborés. Lâche seul, dangereux en groupe.",
    profile: "Rapide", power_level: "Standard", size: "Petit",
    strength: -2, dexterity: 3, constitution: -1, intelligence: 1, wisdom: 0, charisma: -1, ra: "0/2",
    author: "WA Officiel",
  },
  {
    name: "Orc Berserker",
    description: "Guerrier orc entré en transe de combat. Ignore les blessures tant que son rage dure.",
    profile: "Offensif", power_level: "Standard", size: "Grand",
    strength: 3, dexterity: 0, constitution: 2, intelligence: -1, wisdom: -1, charisma: 0, ra: "2/1",
    author: "WA Officiel",
  },
  {
    name: "Spectre Mineur",
    description: "Écho d'une âme torturée. Traverse les murs et draine la vitalité par simple contact.",
    profile: "Équilibré", power_level: "Standard", size: "Moyen",
    strength: -2, dexterity: 2, constitution: 0, intelligence: 0, wisdom: 1, charisma: -1, ra: "1/1",
    author: "WA Officiel",
  },
  {
    name: "Gobelin Éclaireur",
    description: "Petit être vert et malin. Préfère fuir et tendre des embuscades plutôt que d'affronter directement.",
    profile: "Rapide", power_level: "Standard", size: "Petit",
    strength: -1, dexterity: 2, constitution: -1, intelligence: 0, wisdom: 1, charisma: -1, ra: "0/1",
    author: "WA Officiel",
  },
  {
    name: "Crocodile des Eaux Noires",
    description: "Reptile colossal tapi sous la surface sombre des rivières infestées. Sa gueule broie l'armure.",
    profile: "Défensif", power_level: "Standard", size: "Grand",
    strength: 3, dexterity: -1, constitution: 3, intelligence: -3, wisdom: 0, charisma: -3, ra: "3/1",
    author: "WA Officiel",
  },
  {
    name: "Vipère Venimeuse",
    description: "Serpent aux écailles noires, venin foudroyant. Frappe vite, disparaît dans l'herbe.",
    profile: "Rapide", power_level: "Standard", size: "Petit",
    strength: -2, dexterity: 4, constitution: -1, intelligence: -3, wisdom: 1, charisma: -3, ra: "0/3",
    author: "WA Officiel",
  },
  {
    name: "Noyé",
    description: "Cadavre revenu des profondeurs, gonflé d'eau saumâtre. Entraîne ses victimes sous la surface.",
    profile: "Défensif", power_level: "Standard", size: "Moyen",
    strength: 3, dexterity: -1, constitution: 2, intelligence: -2, wisdom: -1, charisma: -3, ra: "2/1",
    author: "WA Officiel",
  },
  {
    name: "Hobgobelin Soldat",
    description: "Gobelin évolué discipliné et entraîné militairement. Combat en formation serrée.",
    profile: "Équilibré", power_level: "Standard", size: "Moyen",
    strength: 1, dexterity: 1, constitution: 1, intelligence: 0, wisdom: 0, charisma: -1, ra: "1/2",
    author: "WA Officiel",
  },
  {
    name: "Ours des Cavernes",
    description: "Immense ursidé des grottes profondes. Ses griffes laissent des marques sur la pierre.",
    profile: "Robuste", power_level: "Standard", size: "Grand",
    strength: 4, dexterity: -1, constitution: 3, intelligence: -3, wisdom: 1, charisma: -2, ra: "3/2",
    author: "WA Officiel",
  },
  {
    name: "Zombie de Guerre",
    description: "Ancien soldat réanimé encore portant son équipement rouillé. Lent mais implacable.",
    profile: "Défensif", power_level: "Standard", size: "Moyen",
    strength: 2, dexterity: -2, constitution: 3, intelligence: -4, wisdom: -2, charisma: -4, ra: "3/0",
    author: "WA Officiel",
  },
  {
    name: "Satyre Cornu",
    description: "Créature mi-humaine mi-bouc, espiègle et imprévisible. Use de magie sonique et charme ses adversaires.",
    profile: "Équilibré", power_level: "Standard", size: "Moyen",
    strength: 1, dexterity: 2, constitution: 0, intelligence: 1, wisdom: 1, charisma: 3, ra: "1/2",
    author: "WA Officiel",
  },
  {
    name: "Harpy Sifflante",
    description: "Créature ailée au chant ensorcelant. Attire ses proies avant de les lacérer de ses griffes.",
    profile: "Rapide", power_level: "Standard", size: "Moyen",
    strength: 1, dexterity: 3, constitution: 0, intelligence: 0, wisdom: 0, charisma: 1, ra: "1/2",
    author: "WA Officiel",
  },
  {
    name: "Golem d'Argile",
    description: "Construction magique basique, lente mais presque indestructible. Obéit à son créateur aveuglément.",
    profile: "Défensif", power_level: "Standard", size: "Grand",
    strength: 4, dexterity: -2, constitution: 4, intelligence: -5, wisdom: -2, charisma: -5, ra: "4/1",
    author: "WA Officiel",
  },
  {
    name: "Pixie Malicieuse",
    description: "Fée minuscule dotée de magie illusoire puissante. Adore jouer des tours dangereux aux voyageurs.",
    profile: "Rapide", power_level: "Standard", size: "Petit",
    strength: -4, dexterity: 5, constitution: -2, intelligence: 2, wisdom: 2, charisma: 4, ra: "0/2",
    author: "WA Officiel",
  },
  {
    name: "Basilic de Pierre",
    description: "Reptile à huit pattes dont le regard transforme la chair en pierre. Même son reflet est dangereux.",
    profile: "Défensif", power_level: "Standard", size: "Grand",
    strength: 3, dexterity: -1, constitution: 3, intelligence: -3, wisdom: 0, charisma: -4, ra: "3/3",
    author: "WA Officiel",
  },
  {
    name: "Gnoll Pillard",
    description: "Humanoïde hyène au service du chaos. Attaque par vagues successives, féroce quand il sent la peur.",
    profile: "Offensif", power_level: "Standard", size: "Moyen",
    strength: 2, dexterity: 1, constitution: 1, intelligence: -1, wisdom: 0, charisma: -1, ra: "2/1",
    author: "WA Officiel",
  },
  {
    name: "Élémentaire de Feu Mineur",
    description: "Fragment de plan élémentaire du feu. Brûle tout ce qu'il touche, attire par les flammes.",
    profile: "Offensif", power_level: "Standard", size: "Petit",
    strength: 0, dexterity: 2, constitution: 0, intelligence: -3, wisdom: -1, charisma: -2, ra: "0/3",
    author: "WA Officiel",
  },
  {
    name: "Merrow des Profondeurs",
    description: "Ogre aquatique des fonds marins, cruel et territorialiste. Frappe avec un harpon osseux.",
    profile: "Offensif", power_level: "Standard", size: "Grand",
    strength: 4, dexterity: 0, constitution: 3, intelligence: -1, wisdom: 0, charisma: -2, ra: "3/2",
    author: "WA Officiel",
  },
  {
    name: "Sorcière des Bois",
    description: "Vieille femme nouée à la magie naturelle corrompue. Jette des malédictions et commande aux animaux sauvages.",
    profile: "Équilibré", power_level: "Standard", size: "Moyen",
    strength: 0, dexterity: 1, constitution: 0, intelligence: 3, wisdom: 3, charisma: 2, ra: "1/3",
    author: "WA Officiel",
  },

  // ── MINI-BOSS (PV) ─────────────────────────────────────────
  {
    name: "Troll des Marécages",
    description: "Géant verdâtre à la régénération prodigieuse. Seul le feu et l'acide stoppent sa guérison rapide.",
    profile: "Robuste", power_level: "Mini-Boss (PV)", size: "Grand",
    strength: 4, dexterity: -1, constitution: 5, intelligence: -2, wisdom: 0, charisma: -2, ra: "4/2",
    author: "WA Officiel",
  },
  {
    name: "Vampire Mineur",
    description: "Aristocrate mort-vivant de moindre puissance. Charme ses victimes et se régénère en buvant leur sang.",
    profile: "Équilibré", power_level: "Mini-Boss (PV)", size: "Moyen",
    strength: 2, dexterity: 3, constitution: 3, intelligence: 2, wisdom: 1, charisma: 4, ra: "2/3",
    author: "WA Officiel",
  },
  {
    name: "Hydre à Cinq Têtes",
    description: "Reptile amphibien à cinq têtes autonomes. Chaque tête tranchée en repousse deux.",
    profile: "Défensif", power_level: "Mini-Boss (PV)", size: "Très grand",
    strength: 5, dexterity: -1, constitution: 5, intelligence: -3, wisdom: 0, charisma: -2, ra: "5/3",
    author: "WA Officiel",
  },
  {
    name: "Géant des Collines",
    description: "Colossal humanoïde stupide mais d'une force colossale. Lance des rochers, écrase sous ses pieds.",
    profile: "Offensif", power_level: "Mini-Boss (PV)", size: "Très grand",
    strength: 6, dexterity: -1, constitution: 4, intelligence: -3, wisdom: -1, charisma: -2, ra: "5/3",
    author: "WA Officiel",
  },
  {
    name: "Cyclope Gardien",
    description: "Géant borgne aux capacités de prescience limitée. Défend son territoire avec une massue taillée dans un tronc.",
    profile: "Défensif", power_level: "Mini-Boss (PV)", size: "Très grand",
    strength: 5, dexterity: -1, constitution: 5, intelligence: -1, wisdom: 2, charisma: 0, ra: "5/2",
    author: "WA Officiel",
  },
  {
    name: "Manticore Chasseuse",
    description: "Lion ailé à queue de scorpion. Bombarde ses cibles de piques empoisonnées avant d'attaquer au corps à corps.",
    profile: "Offensif", power_level: "Mini-Boss (PV)", size: "Grand",
    strength: 4, dexterity: 2, constitution: 3, intelligence: 0, wisdom: 1, charisma: 0, ra: "3/4",
    author: "WA Officiel",
  },
  {
    name: "Wyverne Jeune",
    description: "Dragon mineur à deux pattes. Son dard caudale injecte un venin mortel. Vole avec une agilité surprenante.",
    profile: "Rapide", power_level: "Mini-Boss (PV)", size: "Grand",
    strength: 4, dexterity: 2, constitution: 3, intelligence: -1, wisdom: 1, charisma: 0, ra: "3/4",
    author: "WA Officiel",
  },
  {
    name: "Méduse Oubliée",
    description: "Fée déchue aux serpents à la place des cheveux. Son regard pétrifie en pierre en quelques secondes.",
    profile: "Équilibré", power_level: "Mini-Boss (PV)", size: "Moyen",
    strength: 1, dexterity: 2, constitution: 2, intelligence: 2, wisdom: 1, charisma: 2, ra: "2/4",
    author: "WA Officiel",
  },

  // ── MINI-BOSS (DM) ─────────────────────────────────────────
  {
    name: "Démon de Sang",
    description: "Entité du plan infernal matérialisée dans le sang versé. Chaque blessure qu'il inflige le renforce.",
    profile: "Offensif", power_level: "Mini-Boss (DM)", size: "Grand",
    strength: 5, dexterity: 3, constitution: 2, intelligence: 1, wisdom: 0, charisma: 2, ra: "2/6",
    author: "WA Officiel",
  },
  {
    name: "Chimère Furieuse",
    description: "Monstre composite lion/chèvre/dragon. Souffle du feu, charge avec ses cornes, lacère avec ses griffes.",
    profile: "Offensif", power_level: "Mini-Boss (DM)", size: "Grand",
    strength: 5, dexterity: 2, constitution: 3, intelligence: -1, wisdom: 0, charisma: 0, ra: "3/5",
    author: "WA Officiel",
  },
  {
    name: "Golem de Fer Runique",
    description: "Automate de guerre gravé de runes de destruction. Résiste à presque toute magie, frappe avec une précision mortelle.",
    profile: "Défensif", power_level: "Mini-Boss (DM)", size: "Grand",
    strength: 6, dexterity: -1, constitution: 4, intelligence: -5, wisdom: -1, charisma: -5, ra: "5/5",
    author: "WA Officiel",
  },
  {
    name: "Nécromancien Liche-Seigneur",
    description: "Sorcier mort-vivant ayant transcendé la mort. Commande des légions de morts-vivants et lance des sorts dévastateurs.",
    profile: "Offensif", power_level: "Mini-Boss (DM)", size: "Moyen",
    strength: 0, dexterity: 2, constitution: 2, intelligence: 5, wisdom: 4, charisma: 3, ra: "1/7",
    author: "WA Officiel",
  },
  {
    name: "Griffon de Tempête",
    description: "Être ailé mi-aigle mi-lion qui contrôle les vents. Sa plongée brise l'armure, son rugissement désorganise.",
    profile: "Rapide", power_level: "Mini-Boss (DM)", size: "Grand",
    strength: 4, dexterity: 4, constitution: 2, intelligence: 0, wisdom: 2, charisma: 1, ra: "2/5",
    author: "WA Officiel",
  },
  {
    name: "Ombre Primordiale",
    description: "Obscurité consciente issue des ténèbres entre les plans. Drainer la lumière et la vie des créatures alentour.",
    profile: "Rapide", power_level: "Mini-Boss (DM)", size: "Grand",
    strength: -2, dexterity: 4, constitution: 1, intelligence: 2, wisdom: 2, charisma: 3, ra: "1/6",
    author: "WA Officiel",
  },

  // ── BOSS ───────────────────────────────────────────────────
  {
    name: "Dragon Rouge Adulte",
    description: "Prédateur apical de montagne. Souffle une gerbe de feu incandescente, tyrannise les royaumes depuis son antre. Ego démesuré.",
    profile: "Offensif", power_level: "Boss", size: "Gigantesque",
    strength: 8, dexterity: 0, constitution: 6, intelligence: 3, wisdom: 2, charisma: 4, ra: "7/8",
    author: "WA Officiel",
  },
  {
    name: "Liche Ancienne",
    description: "Archimage ayant sacrifié son humanité pour l'immortalité. Son phylactère doit être détruit pour la tuer définitivement.",
    profile: "Équilibré", power_level: "Boss", size: "Moyen",
    strength: 1, dexterity: 3, constitution: 3, intelligence: 7, wisdom: 6, charisma: 5, ra: "4/9",
    author: "WA Officiel",
  },
  {
    name: "Tarrasque Éveillée",
    description: "Créature légendaire de destruction pure. Régénère en permanence, résiste à presque toute magie, dévore les villes.",
    profile: "Robuste", power_level: "Boss", size: "Gigantesque",
    strength: 10, dexterity: -3, constitution: 10, intelligence: -5, wisdom: 0, charisma: -3, ra: "10/7",
    author: "WA Officiel",
  },
  {
    name: "Seigneur Démon Balor",
    description: "Prince des abysses portant une épée de feu et un fouet de flammes. Sa mort déclenche une explosion dévastiatrice.",
    profile: "Offensif", power_level: "Boss", size: "Très grand",
    strength: 8, dexterity: 2, constitution: 7, intelligence: 3, wisdom: 4, charisma: 5, ra: "6/9",
    author: "WA Officiel",
  },
  {
    name: "Kraken des Profondeurs",
    description: "Dieu marin tentaculaire dormant dans des fosses abyssales. Ses tentacules arrachent des navires entiers.",
    profile: "Défensif", power_level: "Boss", size: "Gigantesque",
    strength: 10, dexterity: 1, constitution: 9, intelligence: 5, wisdom: 4, charisma: 4, ra: "9/8",
    author: "WA Officiel",
  },
  {
    name: "Archiphénix Immortel",
    description: "Oiseau de feu divin renaissant perpétuellement de ses cendres. À chaque renaissance, plus fort et plus enragé.",
    profile: "Offensif", power_level: "Boss", size: "Très grand",
    strength: 5, dexterity: 5, constitution: 5, intelligence: 4, wisdom: 5, charisma: 6, ra: "5/8",
    author: "WA Officiel",
  },
  {
    name: "Titan de Pierre",
    description: "Géant primordial lié à la terre elle-même. Fait trembler le sol à chaque pas, immunisé aux attaques non-magiques.",
    profile: "Défensif", power_level: "Boss", size: "Gigantesque",
    strength: 9, dexterity: -3, constitution: 9, intelligence: 1, wisdom: 3, charisma: 2, ra: "9/6",
    author: "WA Officiel",
  },
  {
    name: "Dragon Chromatique Ancien",
    description: "Dragon multi-couleurs maîtrisant tous les souffles élémentaires. Le plus vieux et le plus corrompu des dragons.",
    profile: "Équilibré", power_level: "Boss", size: "Gigantesque",
    strength: 9, dexterity: 1, constitution: 8, intelligence: 6, wisdom: 5, charisma: 7, ra: "8/9",
    author: "WA Officiel",
  },
];
