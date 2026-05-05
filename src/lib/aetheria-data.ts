// ============================================================
// AETHERIA — SOURCE DE DONNÉES CENTRALE (V1)
// ============================================================
// Ce fichier contient TOUTES les données d'Aetheria :
// races, classes, règles, affinités, conditions, etc.
// Toutes les pages du site s'y branchent.
// ============================================================

// ============================================================
// TYPES
// ============================================================

export type ElementType = "feu" | "eau" | "vent" | "terre" | "ombre" | "lumiere" | "neutre";
export type RaceCategory = "commune" | "elementaire" | "rare";
export type ClassTier = "core" | "advanced";
export type AffinityLevel = "majeure" | "mineure";

export interface SubRace {
  id: string;
  name: string;
  description: string;
}

export interface RaceRelation {
  raceId: string;
  type: "allie" | "tension" | "neutre" | "complexe";
  description: string;
}

export interface AetheriaRace {
  id: string;
  name: string;
  emoji: string;
  category: RaceCategory;
  element?: ElementType;
  tagline: string;
  description: string;
  appearance: string;
  culture: string;
  mentality: string;
  place_in_world: string;
  subRaces?: SubRace[];
  relations: RaceRelation[];
  traits: string[];
}

export interface ClassAbility {
  id: string;
  name: string;
  type: "passive" | "active" | "reaction";
  actionCost?: string;
  peCost?: number;
  damage?: string;
  effect: string;
  recharge?: string;
  levels: {
    level: number;
    bonus: string;
  }[];
}

export interface ClassOutfit {
  id: string;
  name: string;
  description: string;
  abilities: ClassAbility[];
}

export interface AetheriaClass {
  id: string;
  name: string;
  emoji: string;
  tier: ClassTier;
  tagline: string;
  description: string;
  identity: string;
  primaryStat: string;
  secondaryStat: string;
  hpDie: "1d8" | "1d10";
  hpMinimum: number;
  armor: "legere" | "intermediaire" | "lourde" | "toutes";
  playstyle: string[];
  baseAbility: ClassAbility;
  outfits: ClassOutfit[];
}

export interface RaceClassAffinity {
  raceId: string;
  classId: string;
  level: AffinityLevel;
  loreReason: string;
  bonusChoices: {
    id: string;
    description: string;
  }[];
}

export interface AetheriaCondition {
  id: string;
  name: string;
  emoji: string;
  effect: string;
  duration: string;
  removal: string;
  special?: string;
}

export interface DifficultyLevel {
  value: number;
  label: string;
  description: string;
}

export interface AetheriaFaction {
  id: string;
  name: string;
  emoji: string;
  type: "ordre" | "guilde" | "culte" | "pouvoir" | "gardiens";
  tagline: string;
  description: string;
  vision: string;
  danger: string;
}

export interface AetheriaKingdom {
  id: string;
  name: string;
  emoji: string;
  continent: string;
  nature: string;
  ruler: string;
  vision: string;
  weaknesses: string[];
}

// ============================================================
// FORCES PRIMORDIALES
// ============================================================

export const PRIMORDIAL_FORCES = [
  { id: "feu", emoji: "🔥", name: "Feu", aspects: "destruction, volonté" },
  { id: "eau", emoji: "🌊", name: "Eau", aspects: "adaptation, flux" },
  { id: "vent", emoji: "🌪", name: "Vent", aspects: "mouvement, liberté" },
  { id: "terre", emoji: "🌍", name: "Terre", aspects: "stabilité, résistance" },
  { id: "ombre", emoji: "🌑", name: "Ombre", aspects: "dissimulation, corruption" },
  { id: "lumiere", emoji: "☀️", name: "Lumière", aspects: "ordre, contrôle" },
] as const;

// ============================================================
// CONTINENTS
// ============================================================

export const CONTINENTS = [
  {
    id: "edrasil",
    name: "Edrasil",
    emoji: "⚔️",
    subtitle: "Continent Central",
    description: "Le cœur du monde connu. Royaumes, villes, commerce, conflits. Majorité des campagnes.",
    tags: ["royaumes", "commerce", "conflits"],
  },
  {
    id: "varkhor",
    name: "Varkhor",
    emoji: "🔥",
    subtitle: "Terres Brisées",
    description: "Terres instables, influence démoniaque, zones dangereuses. Pour explorateurs et chasseurs de mystères.",
    tags: ["explorateurs", "cultes", "anomalies"],
  },
  {
    id: "thalassa",
    name: "Thalassa",
    emoji: "🌊",
    subtitle: "Océans & Archipels",
    description: "Routes maritimes, pirates, peuples marins. Contrôle stratégique des mers.",
    tags: ["pirates", "routes maritimes", "peuples marins"],
  },
  {
    id: "sylvara",
    name: "Sylvara",
    emoji: "🌿",
    subtitle: "Terres Anciennes",
    description: "Forêts profondes, magie naturelle, peuples anciens. Un équilibre fragile.",
    tags: ["forêts", "magie naturelle", "peuples anciens"],
  },
  {
    id: "nebulis",
    name: "Nébulis",
    emoji: "🌫️",
    subtitle: "Grande Cité Portuaire",
    description: "Autrefois la plus grande ville portuaire du monde. Quelque chose a changé. La brume altère. La mémoire change.",
    tags: ["brume", "mystère", "anomalie"],
    special: true,
  },
] as const;

// ============================================================
// RACES
// ============================================================

export const RACES: AetheriaRace[] = [
  // ── COMMUNES ──────────────────────────────────────────────
  {
    id: "humain",
    name: "Humain",
    emoji: "🧍",
    category: "commune",
    element: "neutre",
    tagline: "Rien d'exceptionnel. C'est précisément ce qui les rend dangereux.",
    description: "Les humains n'ont pas de forme parfaite, pas d'élément dominant, pas de don naturel évident. Mais ils apprennent, observent, s'adaptent. Et surtout — ils ne s'arrêtent jamais.",
    appearance: "Aucune norme. Chaque région façonne ses propres traits.",
    culture: "Les humains construisent des villes, des royaumes, des lois, des conflits. Ils organisent le monde… puis le détruisent pour le reconstruire autrement.",
    mentality: "Adaptabilité infinie. Ambition sans limites. Instabilité chronique.",
    place_in_world: "Présents partout. Dominants politiquement. Instables, mais incontournables.",
    relations: [
      { raceId: "terrak", type: "allie", description: "Alliance pragmatique de bâtisseurs" },
      { raceId: "elfe", type: "complexe", description: "Respect fragile, méfiance mutuelle" },
    ],
    traits: ["Adaptabilité", "Ambition", "Polyvalence", "Instabilité"],
  },
  {
    id: "nain",
    name: "Nain",
    emoji: "⛰️",
    category: "commune",
    element: "terre",
    tagline: "Ils viennent d'en dessous. Et ils en connaissent les fondations.",
    description: "Les nains sont liés aux profondeurs d'Aetheria. Aux cavernes. Aux montagnes creuses. Aux lieux où la pierre respire lentement.",
    appearance: "Taille réduite, corps large et dense, ossature lourde. Ils semblent plus lourds qu'ils ne devraient l'être.",
    culture: "Les nains ne vivent pas vite. Ils creusent, construisent, forgent. Et surtout — ils transmettent. Chaque objet a une histoire. Chaque salle a une mémoire.",
    mentality: "Fiabilité, fierté, rancune longue. Un nain n'oublie ni une dette, ni une trahison.",
    place_in_world: "Proches des Terraks. Respectés par les humains. Parfois en tension avec Arcanis.",
    relations: [
      { raceId: "terrak", type: "allie", description: "Parenté de pierre et de profondeur" },
      { raceId: "humain", type: "allie", description: "Respect mutuel de bâtisseurs" },
    ],
    traits: ["Endurance", "Mémoire", "Forge", "Loyauté"],
  },
  {
    id: "elfe",
    name: "Elfe",
    emoji: "🌲",
    category: "commune",
    element: "neutre",
    tagline: "Ils ne sont pas pressés. Parce qu'ils savent.",
    description: "Les elfes sont liés aux anciennes forêts, aux cycles naturels, et à une magie plus subtile que celle des mages humains. Ils ne dominent pas la nature — ils vivent avec elle.",
    appearance: "Silhouettes fines, traits précis, regard profond. Quelque chose d'ancien dans leurs yeux.",
    culture: "Les elfes ne cherchent pas à contrôler. Ils observent, comprennent, attendent. Leur culture repose sur le temps long, l'équilibre, la mémoire.",
    mentality: "Patients, parfois distants, rarement imprudents.",
    place_in_world: "Proches des Sylvans. Méfiants envers les humains. Opposés aux destructions massives.",
    relations: [
      { raceId: "humain", type: "complexe", description: "Respect fragile face à l'expansion humaine" },
    ],
    traits: ["Patience", "Magie naturelle", "Mémoire longue", "Distance"],
  },
  {
    id: "demi-orc",
    name: "Demi-Orc",
    emoji: "🪓",
    category: "commune",
    element: "neutre",
    tagline: "Nés du conflit. Jamais complètement acceptés. Rarement ignorés.",
    description: "Nés de mélanges entre humains et peuples orcs, les demi-orcs portent en eux une dualité. Ils ne sont jamais complètement acceptés. Mais rarement ignorés.",
    appearance: "Plus grands et massifs, peau variant du gris au vert, mâchoire marquée. Présence imposante.",
    culture: "Pas de culture unique. Certains vivent dans les royaumes humains, d'autres dans des clans, d'autres seuls.",
    mentality: "Détermination, résistance, besoin constant de prouver leur valeur.",
    place_in_world: "Souvent rejetés, utilisés comme soldats, respectés pour leur force.",
    relations: [],
    traits: ["Force brute", "Résistance", "Détermination", "Marginalité"],
  },
  {
    id: "halfelin",
    name: "Halfelin",
    emoji: "🍃",
    category: "commune",
    element: "neutre",
    tagline: "On les sous-estime toujours. C'est souvent une erreur.",
    description: "Les halfelins sont issus des petites communautés, des routes, des marges. Ils ne construisent pas des empires. Ils traversent ceux des autres.",
    appearance: "Petite taille, corps agile, traits doux. Faciles à ignorer… jusqu'à ce qu'il soit trop tard.",
    culture: "Ils vivent sur les routes, dans des villages discrets, dans les zones oubliées. Ils valorisent la discrétion, l'adaptation, la liberté.",
    mentality: "Observateurs, opportunistes, étonnamment résistants. Très difficiles à contrôler.",
    place_in_world: "Acceptés presque partout. Rarement pris au sérieux.",
    relations: [],
    traits: ["Discrétion", "Adaptation", "Chance", "Résistance"],
  },

  // ── ÉLÉMENTAIRES ─────────────────────────────────────────
  {
    id: "nereens",
    name: "Néréens",
    emoji: "🌊",
    category: "elementaire",
    element: "eau",
    tagline: "Ils ne quittent jamais vraiment l'eau.",
    description: "Même sur la terre ferme, leur présence semble légèrement déplacée, comme si une partie d'eux appartenait encore à quelque chose de plus vaste… et de plus silencieux.",
    appearance: "Peau légèrement bleutée ou humide, écailles fines selon la lignée, yeux profonds parfois entièrement sombres. Autour d'eux, l'air paraît toujours plus dense.",
    culture: "Les Néréens ne croient pas aux choses fixes. Tout change, tout s'adapte, tout revient sous une autre forme. Ils privilégient la mémoire orale, les cycles, l'équilibre.",
    mentality: "Calme trompeur. Adaptabilité profonde. Mémoire des flux.",
    place_in_world: "Alliés naturels des Morvar. Méfiance envers les Ignaris. Respectés en mer, souvent mal compris sur terre.",
    subRaces: [
      { id: "brumes-marines", name: "Brumes Marines", description: "Silencieux, discrets, souvent présents près des ports et zones brumeuses. Ils observent plus qu'ils n'agissent." },
      { id: "abyssaux", name: "Abyssaux", description: "Plus marqués. Corps et esprit façonnés par des profondeurs que peu peuvent comprendre. Leur présence dérange." },
      { id: "ecailleux", name: "Écailleux", description: "Plus robustes. Guerriers, navigateurs, protecteurs. Ils incarnent l'équilibre entre terre et mer." },
    ],
    relations: [
      { raceId: "morvar", type: "allie", description: "Alliance silencieuse des profondeurs" },
      { raceId: "ignaris", type: "tension", description: "Incompréhension fondamentale : adaptation vs impulsion" },
    ],
    traits: ["Adaptation", "Mémoire des eaux", "Calme profond", "Perception"],
  },
  {
    id: "aeriens",
    name: "Aériens",
    emoji: "🌪",
    category: "elementaire",
    element: "vent",
    tagline: "Ils vivent comme le vent : présents, puis ailleurs.",
    description: "Les Aériens ne s'attachent pas. Ni aux lieux, ni aux objets, parfois même ni aux gens.",
    appearance: "Corps fins et légers, mouvements fluides, cheveux toujours en mouvement. Difficile de savoir où ils regardent vraiment.",
    culture: "Ils refusent le poids des possessions, des promesses, des chaînes invisibles que les autres appellent 'vie'.",
    mentality: "Liberté absolue. Imprévisibilité. Observation sans engagement.",
    place_in_world: "Peu impliqués dans les conflits. Observateurs du monde. Jugés imprévisibles par tous.",
    subRaces: [
      { id: "fil-de-vent", name: "Fil-de-Vent", description: "Rapides, précis, presque insaisissables." },
      { id: "voiles", name: "Voilés", description: "Leur présence est floue. On les voit… sans être sûr de les avoir vraiment vus." },
      { id: "orageux", name: "Orageux", description: "Instables. Violents. Imprévisibles." },
    ],
    relations: [],
    traits: ["Vitesse", "Liberté", "Imprévisibilité", "Légèreté"],
  },
  {
    id: "ignaris",
    name: "Ignaris",
    emoji: "🔥",
    category: "elementaire",
    element: "feu",
    tagline: "Les Ignaris ne vivent pas. Ils brûlent.",
    description: "Leur sang porte quelque chose d'ancien, de violent, de vivant. Une chaleur qui ne s'éteint jamais complètement.",
    appearance: "Veines incandescentes, peau chaude, yeux rouge ou orange, parfois fissures lumineuses. Leur présence réchauffe… ou inquiète.",
    culture: "Tout est intense. Le combat, l'honneur, la colère, la loyauté. Rien n'est tiède.",
    mentality: "Intensité totale. Honneur prouvé par l'action. Loyauté absolue ou rupture totale.",
    place_in_world: "Conflits fréquents avec les Néréens. Respect des Terraks. Méfiance des Lumeni.",
    subRaces: [
      { id: "cendres", name: "Cendrés", description: "Maîtrise. Discipline. Contrôle." },
      { id: "magmatiques", name: "Magmatiques", description: "Plus massifs. Plus lourds. Plus dangereux." },
      { id: "volcaniques", name: "Volcaniques", description: "Instables. Puissants. Imprévisibles." },
    ],
    relations: [
      { raceId: "nereens", type: "tension", description: "Feu contre eau — impulsion contre adaptation" },
      { raceId: "terrak", type: "allie", description: "Respect mutuel de la force directe" },
    ],
    traits: ["Intensité", "Feu intérieur", "Honneur", "Impulsivité"],
  },
  {
    id: "terrak",
    name: "Terraks",
    emoji: "🌍",
    category: "elementaire",
    element: "terre",
    tagline: "Les Terraks ne cèdent pas.",
    description: "Ils avancent lentement, mais sûrement. Et quand ils s'arrêtent… rien ne les fait reculer.",
    appearance: "Peau épaisse parfois pierreuse, corps massif, présence imposante.",
    culture: "Ils respectent le temps, les traditions, les anciens. Chez eux, tout se construit pour durer.",
    mentality: "Solidité absolue. Tradition respectée. Lenteur assumée.",
    place_in_world: "Alliés des humains. Respectés par presque tous.",
    subRaces: [
      { id: "roche", name: "Roche", description: "Solides. Fiables." },
      { id: "montagne", name: "Montagne", description: "Massifs. Imposants." },
      { id: "cristallins", name: "Cristallins", description: "Marqués par la magie de la terre." },
    ],
    relations: [
      { raceId: "humain", type: "allie", description: "Alliance pragmatique de bâtisseurs" },
      { raceId: "nain", type: "allie", description: "Parenté de pierre et de profondeur" },
      { raceId: "goliath", type: "allie", description: "Peu de mots, beaucoup de respect" },
    ],
    traits: ["Solidité", "Endurance", "Tradition", "Fiabilité"],
  },
  {
    id: "noctaris",
    name: "Noctaris",
    emoji: "🌑",
    category: "elementaire",
    element: "ombre",
    tagline: "Les Noctaris ne fuient pas l'ombre. Ils y vivent.",
    description: "Ils y respirent. Et parfois… ils en deviennent une partie.",
    appearance: "Peau sombre ou très pâle, yeux visibles dans l'obscurité, ombre anormale.",
    culture: "Discrétion. Observation. Indépendance. Ils ne cherchent pas à être vus. Et encore moins compris.",
    mentality: "Observation constante. Indépendance totale. Vérité cachée.",
    place_in_world: "Opposition directe avec les Lumeni. Méfiance globale.",
    subRaces: [
      { id: "ombres-noc", name: "Ombres", description: "Rapides. Silencieux." },
      { id: "voileurs", name: "Voileurs", description: "Manipulateurs. Illusionnistes." },
      { id: "profonds", name: "Profonds", description: "Rares. Instables. Dangereux." },
    ],
    relations: [
      { raceId: "lumeni", type: "tension", description: "Guerre idéologique — ombre contre lumière" },
    ],
    traits: ["Discrétion", "Perception nocturne", "Manipulation", "Indépendance"],
  },
  {
    id: "lumeni",
    name: "Lumeni",
    emoji: "☀️",
    category: "elementaire",
    element: "lumiere",
    tagline: "Les Lumeni éclairent. Mais la lumière peut révéler… ou brûler.",
    description: "Porteurs d'une aura subtile, ils croient en un monde structuré, pur, compréhensible.",
    appearance: "Aura subtile, yeux clairs, présence marquée.",
    culture: "Ordre. Foi. Contrôle. Ils croient en un monde structuré. Pur. Compréhensible.",
    mentality: "Ordre absolu. Foi inébranlable. Intolérance possible.",
    place_in_world: "Opposition directe avec les Noctaris. Alliés des ordres religieux.",
    subRaces: [
      { id: "radieux", name: "Radieux", description: "Apaisants. Protecteurs." },
      { id: "purificateurs", name: "Purificateurs", description: "Intransigeants." },
      { id: "zelotes", name: "Zélotes", description: "Fanatiques." },
    ],
    relations: [
      { raceId: "noctaris", type: "tension", description: "Guerre idéologique fondamentale" },
    ],
    traits: ["Aura lumineuse", "Foi", "Ordre", "Contrôle"],
  },

  // ── RARES / SPÉCIALES ────────────────────────────────────
  {
    id: "varagn",
    name: "Varagns",
    emoji: "🐺",
    category: "rare",
    element: "neutre",
    tagline: "On ne naît pas Varagn. On le devient.",
    description: "Les Varagns peuvent apparaître dans différentes lignées à travers Aetheria. Tous partagent un même lien avec une bête primordiale.",
    appearance: "Sous leur forme normale, ils ressemblent à leur race d'origine. Mais quelque chose trahit toujours leur nature : regard trop fixe, mouvements trop précis, tension permanente.",
    culture: "Ils vivent en groupes appelés Tributs vénénères. Leur culture repose sur une vérité simple : ce n'est pas la force qui compte — c'est le contrôle de cette force.",
    mentality: "Deux voix : la leur et celle de la bête. Les faibles sont submergés. Les autres apprennent à écouter sans céder.",
    place_in_world: "Craints dans les royaumes. Utilisés comme armes puis rejetés. Respectés dans les terres sauvages.",
    subRaces: [
      { id: "loup", name: "Loup", description: "Posture tendue, griffes, mâchoire marquée. Même taille, mais plus dangereux." },
      { id: "ours", name: "Ours", description: "Masse accrue, épaules larges, coups lourds. Présence écrasante." },
      { id: "mammouth", name: "Mammouth", description: "Croissance physique, peau épaisse, apparition de défenses. Devient une forteresse vivante." },
      { id: "fauve", name: "Fauve", description: "Corps bas, rapidité extrême, précision. Frappe avant d'être vu." },
    ],
    relations: [
      { raceId: "goliath", type: "allie", description: "Respect mutuel des êtres de force contrôlée" },
      { raceId: "lumeni", type: "tension", description: "Jugement moral constant des Lumeni" },
    ],
    traits: ["Fusion bestiale", "Instinct", "Force brute", "Contrôle de soi"],
  },
  {
    id: "brumegrot",
    name: "Brumegrots",
    emoji: "🐗",
    category: "rare",
    element: "neutre",
    tagline: "Ils rient souvent. Mais on ne rit jamais longtemps avec eux.",
    description: "Les Brumegrots sont nés des terres oubliées — des landes, des marais, des pierres abandonnées.",
    appearance: "Petite taille, corps compact, traits mêlant gobelin et sanglier, défenses visibles, regard vif. Ils semblent faibles… jusqu'à ce qu'ils bougent.",
    culture: "Ils vivent en bandes, valorisent la ruse, le territoire, les pièges, la mémoire des lieux.",
    mentality: "Ruse, territoire, mémoire. Ils n'oublient rien.",
    place_in_world: "Méprisés par les humains. Sous-estimés par tous. Respectés par peu.",
    subRaces: [
      { id: "landes", name: "Landes", description: "Piégeurs, observateurs." },
      { id: "guerriers-brug", name: "Guerriers", description: "Frontaux, brutaux." },
      { id: "esprits-brug", name: "Esprits", description: "Silencieux, presque irréels." },
    ],
    relations: [
      { raceId: "korril", type: "complexe", description: "Relation instable — parfois alliés, parfois ennemis" },
    ],
    traits: ["Ruse", "Connaissance du terrain", "Mémoire", "Pièges"],
  },
  {
    id: "goliath",
    name: "Goliaths",
    emoji: "🪨",
    category: "rare",
    element: "terre",
    tagline: "Ils ne parlent pas beaucoup. Parce qu'ils n'en ont pas besoin.",
    description: "Nés dans les montagnes, façonnés par le froid, le vent et la pierre.",
    appearance: "Très grande taille, corps massif, peau dure parfois marquée comme de la roche. Ils ne semblent jamais pressés.",
    culture: "Chez eux, tout est simple : survivre, tenir, ne pas céder. Ils respectent la force utile, la parole tenue, le clan.",
    mentality: "Simplicité. Endurance. Parole rare mais toujours tenue.",
    place_in_world: "Respectés par les Terraks. Tolérés par les humains. Évités par les plus faibles.",
    relations: [
      { raceId: "terrak", type: "allie", description: "Respect mutuel de la lenteur et de la solidité" },
      { raceId: "varagn", type: "allie", description: "Respect des êtres de force contrôlée" },
    ],
    traits: ["Force titanesque", "Endurance", "Simplicité", "Montagne"],
  },
  {
    id: "korril",
    name: "Korrils",
    emoji: "🌿",
    category: "rare",
    element: "neutre",
    tagline: "On ne comprend jamais vraiment un Korril. Et c'est probablement volontaire.",
    description: "Les Korrils sont des esprits qui ont pris forme. Ou des êtres qui ont oublié qu'ils étaient des esprits.",
    appearance: "Humanoïdes, traits fins ou étranges, regard vif, sourire incertain. Quelque chose cloche… toujours.",
    culture: "Ils ne vivent pas comme les autres. Ils testent, observent, jouent. Mais ce jeu a des règles que seuls eux comprennent.",
    mentality: "Imprévisibles, parfois utiles, parfois dangereux. Toujours intéressants.",
    place_in_world: "Proches des Brumegrots. Tolérés par les Sylvans. Méfiance générale.",
    relations: [
      { raceId: "brumegrot", type: "complexe", description: "Relation instable de jeu et de piège" },
    ],
    traits: ["Imprévisibilité", "Perception", "Jeu", "Énigmes"],
  },
  {
    id: "morvar",
    name: "Morvar",
    emoji: "🌊",
    category: "rare",
    element: "eau",
    tagline: "Ils ne viennent pas de la mer. Ils viennent de ce qu'il y a sous la mer.",
    description: "Les Morvar vivent bien au-delà des eaux connues — là où la lumière disparaît, là où le silence devient une pression.",
    appearance: "Peau sombre ou profonde, yeux adaptés aux ténèbres, corps plus marqués que les Néréens. Pas faits pour la surface.",
    culture: "Ils ne parlent pas pour rien, ne bougent pas pour rien. Ils existent selon des règles anciennes.",
    mentality: "Silence. Règles anciennes. Regard profond sur les peuples terrestres.",
    place_in_world: "Liés aux Néréens. Craints des humains. Étudiés par les mages.",
    relations: [
      { raceId: "nereens", type: "allie", description: "Alliance silencieuse des profondeurs" },
    ],
    traits: ["Vision des abysses", "Silence", "Profondeur", "Puissance cachée"],
  },
  {
    id: "dolmenide",
    name: "Dolmenides",
    emoji: "🕯",
    category: "rare",
    element: "terre",
    tagline: "Ils se souviennent. Même quand le monde oublie.",
    description: "Liés aux pierres anciennes, aux dolmens, aux lieux sacrés. Ils sont là depuis… longtemps.",
    appearance: "Humanoïdes, peau marquée parfois minérale, regard profond, présence calme.",
    culture: "Ils protègent les lieux, les rites, la mémoire. Ils ne dominent pas — ils veillent.",
    mentality: "Ils pensent en siècles. Pas en jours.",
    place_in_world: "Respectés par les Terraks et Goliaths. Tolérés par les humains. Incompris par la majorité.",
    relations: [
      { raceId: "terrak", type: "allie", description: "Gardiens de la même mémoire profonde" },
      { raceId: "goliath", type: "allie", description: "Respect mutuel des anciens" },
    ],
    traits: ["Mémoire éternelle", "Protection des lieux", "Sagesse", "Lenteur"],
  },
  {
    id: "altere-nebulis",
    name: "Altérés de Nébulis",
    emoji: "🌫️",
    category: "rare",
    element: "ombre",
    tagline: "Ils ne sont plus ce qu'ils étaient. Mais pas encore autre chose.",
    description: "Exposés à la brume de Nébulis, leurs corps et esprits ont été modifiés d'une façon que personne ne comprend encore.",
    appearance: "Variable. Quelque chose d'instable dans leurs traits. Présence perturbante.",
    culture: "Pas de culture propre — chacun porte son ancienne identité, fragmentée.",
    mentality: "Mémoire instable. Perception altérée. Conscience fragmentée.",
    place_in_world: "Ils dérangent. Parce qu'ils rappellent ce qui peut arriver.",
    relations: [],
    traits: ["Mémoire instable", "Perception altérée", "Mystère", "Transformation"],
  },
];

// ============================================================
// CLASSES
// ============================================================

export const CLASSES: AetheriaClass[] = [
  {
    id: "artilleur-arcanique",
    name: "Artilleur Arcanique",
    emoji: "🔫",
    tier: "advanced",
    tagline: "Tir, cadence, précision arcanique.",
    description: "Spécialiste des armes à feu énergétiques alimentées par des gemmes arcaniques. Il mêle technologie et magie dans un style de combat unique.",
    identity: "Contrôle la distance et dicte le rythme du combat. Versatile selon la tenue choisie.",
    primaryStat: "Agilité",
    secondaryStat: "Esprit",
    hpDie: "1d8",
    hpMinimum: 4,
    armor: "legere",
    playstyle: ["Distance", "Cadence", "Précision", "Mobilité"],
    baseAbility: {
      id: "tir-instinctif",
      name: "Tir Instinctif",
      type: "passive",
      effect: "Peut effectuer une Attaque Double sans malus sur l'arme secondaire.",
      levels: [
        { level: 3, bonus: "+1 au test d'attaque sur le second tir" },
        { level: 5, bonus: "Possibilité de cibler deux ennemis différents" },
        { level: 7, bonus: "Si les deux tirs touchent, +1 dégât bonus" },
      ],
    },
    outfits: [
      {
        id: "pistolero",
        name: "Pistolero Arcanique",
        description: "Maîtrise de deux pistolets arcaniques. Combat rapproché et cadence élevée.",
        abilities: [
          {
            id: "cadence-elevee",
            name: "Cadence Élevée",
            type: "active",
            actionCost: "Action + Action Physique (DEX)",
            peCost: 1,
            damage: "Arme x2",
            effect: "Enchaîne deux tirs rapides sur une cible. Temps de rechargement : 1 tour.",
            recharge: "1 tour",
            levels: [
              { level: 3, bonus: "+1 au test d'attaque" },
              { level: 5, bonus: "+1d4 dégâts supplémentaires" },
              { level: 7, bonus: "+1d8 dégâts supplémentaires" },
            ],
          },
          {
            id: "tir-en-mouvement",
            name: "Tir en Mouvement",
            type: "active",
            actionCost: "Mouvement",
            effect: "Peut se déplacer puis tirer dans la même action.",
            levels: [
              { level: 3, bonus: "+1 DEF Physique pendant le mouvement" },
              { level: 5, bonus: "Ne provoque plus d'attaque d'opportunité" },
              { level: 7, bonus: "+1 au test d'attaque après déplacement" },
            ],
          },
          {
            id: "rafale-instable",
            name: "Rafale Instable",
            type: "active",
            actionCost: "Action Magique",
            peCost: 2,
            damage: "1d6",
            effect: "Force la gemme et tire une rafale instable. ⚠️ Échec critique : perte de contrôle → aucun tir au prochain tour.",
            recharge: "2 tours",
            levels: [
              { level: 3, bonus: "Dégâts 1d8" },
              { level: 5, bonus: "Dégâts 2d6" },
              { level: 7, bonus: "Dégâts 3d6" },
            ],
          },
          {
            id: "danse-de-mort",
            name: "Danse de Mort",
            type: "active",
            actionCost: "Action Mixte (PHY/MAG)",
            peCost: 3,
            effect: "Entre dans un état de tir extrême. Pendant 1 tour : +2 attaque, +1d6 dégâts. ⚠️ Après : -2 DEF PHY pendant 1 tour.",
            recharge: "4 tours",
            levels: [
              { level: 3, bonus: "Durée +1 tour" },
              { level: 5, bonus: "+1d8 dégâts" },
              { level: 7, bonus: "Annule le malus DEF" },
            ],
          },
        ],
      },
      {
        id: "tireur-eclat",
        name: "Tireur d'Éclat",
        description: "Précision extrême à distance. Chaque tir compte.",
        abilities: [
          {
            id: "tir-precise",
            name: "Tir Précis",
            type: "passive",
            effect: "+1 au test d'attaque avec les armes à feu à distance.",
            levels: [
              { level: 3, bonus: "Bonus +2" },
              { level: 5, bonus: "Bonus +3" },
              { level: 7, bonus: "Bonus +4" },
            ],
          },
          {
            id: "tir-charge",
            name: "Tir Chargé",
            type: "active",
            actionCost: "Action Magique",
            peCost: 2,
            damage: "1d8",
            effect: "Concentre l'énergie dans son mousquet.",
            recharge: "1 tour",
            levels: [
              { level: 3, bonus: "Dégâts 2d6" },
              { level: 5, bonus: "Dégâts 2d8" },
              { level: 7, bonus: "Dégâts 3d8" },
            ],
          },
          {
            id: "tir-percant",
            name: "Tir Perçant",
            type: "active",
            actionCost: "Action Magique",
            peCost: 2,
            damage: "1d6",
            effect: "Un tir qui traverse la cible. Peut toucher une seconde cible alignée.",
            recharge: "2 tours",
            levels: [
              { level: 3, bonus: "Dégâts 1d8" },
              { level: 5, bonus: "Dégâts 2d6" },
              { level: 7, bonus: "Touche jusqu'à 3 cibles" },
            ],
          },
          {
            id: "tir-parfait",
            name: "Tir Parfait",
            type: "active",
            actionCost: "Action Magique",
            peCost: 3,
            damage: "2d8",
            effect: "Le tir ultime. +2 au test d'attaque.",
            recharge: "3 tours",
            levels: [
              { level: 3, bonus: "Dégâts 3d8" },
              { level: 5, bonus: "Dégâts 4d8" },
              { level: 7, bonus: "Ignore une partie de la DEF ennemie" },
            ],
          },
        ],
      },
      {
        id: "duelliste-arcanique",
        name: "Duelliste Arcanique",
        description: "Mêlée + tir en alternance. Le maître du combat rapproché avec armes à feu.",
        abilities: [
          {
            id: "maitrise-mixte",
            name: "Maîtrise Mixte",
            type: "passive",
            effect: "Manie une arme à feu et une arme de mêlée sans difficulté. Peut alterner tir et attaque de mêlée sans malus.",
            levels: [
              { level: 3, bonus: "+1 au test d'attaque après un changement d'arme" },
              { level: 5, bonus: "+1 DEF PHY en combat rapproché" },
              { level: 7, bonus: "+1 au test d'attaque sur les combos" },
            ],
          },
          {
            id: "riposte",
            name: "Riposte",
            type: "reaction",
            actionCost: "Réaction (après esquive ou parade réussie)",
            peCost: 1,
            effect: "Après une esquive ou parade réussie : attaque immédiate.",
            recharge: "2 tours",
            levels: [
              { level: 3, bonus: "+1 au test d'attaque" },
              { level: 5, bonus: "+1d6 dégâts" },
              { level: 7, bonus: "Peut enchaîner avec un tir" },
            ],
          },
          {
            id: "tir-lame",
            name: "Tir + Lame",
            type: "active",
            actionCost: "Action PHY/MAG",
            peCost: 2,
            damage: "Arme + Arme",
            effect: "Enchaîne tir puis attaque de mêlée.",
            recharge: "2 tours",
            levels: [
              { level: 3, bonus: "+1 au test d'attaque" },
              { level: 5, bonus: "+1d4 dégâts sur chaque attaque" },
              { level: 7, bonus: "+1d8 dégâts" },
            ],
          },
          {
            id: "duel-final",
            name: "Duel Final",
            type: "active",
            actionCost: "Action Mixte PHY/MAG",
            peCost: 3,
            damage: "1d6 + 1d6 + 1d6",
            effect: "Combo complet : tir → frappe → tir. +2 au test d'attaque.",
            recharge: "3 tours",
            levels: [
              { level: 3, bonus: "Dégâts 1d8 x3" },
              { level: 5, bonus: "+1d6 supplémentaire" },
              { level: 7, bonus: "+3 au test d'attaque" },
            ],
          },
        ],
      },
    ],
  },

  // ── AUTRES CLASSES CORE (structure de base) ──────────────
  {
    id: "pugiliste",
    name: "Pugiliste",
    emoji: "👊",
    tier: "core",
    // CASUAL — Mêlée à mains nues axée réactions
    tagline: "Tu frappes ? Je te bloque. Tu rates ? Je te punis. Tu insistes ? J'enchaîne.",
    description: "Combattant à mains nues, maître absolu des réactions. Sa survie repose sur la lecture adverse, le timing, et ses réactions — pas sur le tanking pur.",
    identity: "La classe reine du contre et de la riposte. Chaque attaque reçue est une décision.",
    primaryStat: "Agilité",
    secondaryStat: "Force",
    hpDie: "1d8",
    hpMinimum: 4,
    armor: "legere",
    playstyle: ["Réactions", "Combos", "Contre-attaque", "Pression constante"],
    baseAbility: {
      id: "poing-reflexe",
      name: "Poing Réflexe",
      type: "passive",
      effect: "+1 dégâts sur toute Contre-attaque réussie.",
      levels: [
        { level: 3, bonus: "+2 dégâts" },
        { level: 5, bonus: "+3 dégâts + effet possible" },
        { level: 7, bonus: "+4 dégâts + déséquilibre automatique" },
      ],
    },
    outfits: [
      {
        id: "briseur-os",
        name: "Briseur d'Os",
        description: "Combat frontal. Dégâts maximaux. Encaissement agressif.",
        abilities: [
          {
            id: "flux-combat",
            name: "Flux de Combat",
            type: "passive",
            effect: "Si une Riposte parfaite touche : récupère 1 PE.",
            levels: [
              { level: 3, bonus: "Récupère 2 PE" },
              { level: 5, bonus: "Récupère 2 PE + +1 au prochain jet d'attaque" },
              { level: 7, bonus: "Récupère 3 PE" },
            ],
          },
          {
            id: "instinct-absolu",
            name: "Instinct Absolu",
            type: "active",
            peCost: 3,
            effect: "1 fois par combat : 2 réactions dans le round. Pas permanent — capacité exceptionnelle.",
            recharge: "1 par combat",
            levels: [
              { level: 3, bonus: "Durée 2 rounds" },
              { level: 5, bonus: "+1 dégâts sur chaque réaction" },
              { level: 7, bonus: "Les 2 réactions peuvent être offensives" },
            ],
          },
        ],
      },
      {
        id: "danseur-fer",
        name: "Danseur de Fer",
        description: "Mobilité et esquive. Frappe et disparaît.",
        abilities: [
          {
            id: "chaine-pression",
            name: "Chaîne de Pression",
            type: "passive",
            effect: "Si une Contre-attaque touche : +1 au prochain jet d'attaque.",
            levels: [
              { level: 3, bonus: "+2 au prochain jet" },
              { level: 5, bonus: "+2 + déplacement gratuit de 1 case" },
              { level: 7, bonus: "Enchaîne une 2e attaque à -2" },
            ],
          },
          {
            id: "tempete-poings",
            name: "Tempête de Poings",
            type: "active",
            peCost: 2,
            effect: "Si Riposte parfaite réussie : attaque supplémentaire gratuite sans consommer d'action.",
            recharge: "2 tours",
            levels: [
              { level: 3, bonus: "+1d4 dégâts sur l'attaque bonus" },
              { level: 5, bonus: "+1d6 dégâts" },
              { level: 7, bonus: "Peut déclencher une 2e Riposte parfaite" },
            ],
          },
        ],
      },
      {
        id: "poing-spirituel",
        name: "Poing Spirituel",
        description: "Combat instinctif lié aux énergies. Attaques imprégnées de force intérieure.",
        abilities: [
          {
            id: "frappe-energie",
            name: "Frappe d'Énergie",
            type: "active",
            actionCost: "Action Magique",
            peCost: 1,
            damage: "1d6 + Esprit",
            effect: "Attaque imprégnée d'énergie pure. Ignore 1 point de réduction d'armure.",
            levels: [
              { level: 3, bonus: "Dégâts 1d8" },
              { level: 5, bonus: "Ignore 2 points de réduction" },
              { level: 7, bonus: "Dégâts 2d6" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "maitre-arme",
    name: "Maître d'Arme",
    emoji: "⚔️",
    tier: "advanced",
    tagline: "Polyvalence totale. Expert du combat tactique.",
    description: "Le spécialiste martial polyvalent. Maîtrise n'importe quelle arme, s'adapte à n'importe quelle situation.",
    identity: "Pas de style imposé — il choisit son approche selon la situation.",
    primaryStat: "Force",
    secondaryStat: "Agilité",
    hpDie: "1d10",
    hpMinimum: 6,
    armor: "toutes",
    playstyle: ["Polyvalence", "Technique", "Adaptation", "Contrôle"],
    baseAbility: {
      id: "maitrise-armes",
      name: "Maîtrise des Armes",
      type: "passive",
      effect: "Aucun malus avec aucune arme. +1 au jet d'attaque avec son arme de prédilection.",
      levels: [
        { level: 3, bonus: "+2 avec arme de prédilection" },
        { level: 5, bonus: "+3, peut changer d'arme de prédilection après un repos court" },
        { level: 7, bonus: "+4, bonus sur toutes les armes maîtrisées" },
      ],
    },
    outfits: [],
  },
  {
    id: "guerrier",
    name: "Guerrier",
    emoji: "🛡️",
    tier: "core",
    tagline: "Le combattant fondamental d'Aetheria. Solide, fiable, redoutable.",
    description: "Combattant éprouvé. Moins technique que le Maître d'Arme, moins polyvalent que le Maître de Lame Élémentaire — mais d'une efficacité brute incomparable. Plusieurs voies disponibles, dont celle du Berserker.",
    identity: "Encaisser, frapper, recommencer. La fondation martiale du monde.",
    primaryStat: "Force",
    secondaryStat: "Endurance",
    hpDie: "1d10",
    hpMinimum: 6,
    armor: "intermediaire",
    playstyle: ["Frontline", "Dégâts soutenus", "Encaissement", "Voies multiples"],
    baseAbility: {
      id: "endurance-martiale",
      name: "Endurance Martiale",
      type: "passive",
      effect: "+1 PV par niveau au-delà du jet de dé de vie. Ignore le premier malus de Blessure léger reçu par combat.",
      levels: [
        { level: 3, bonus: "+2 PV par niveau bonus" },
        { level: 5, bonus: "Ignore aussi le premier Étourdi par combat" },
        { level: 7, bonus: "Une fois par combat : refuse une Mise à Terre" },
      ],
    },
    outfits: [
      {
        id: "berserker",
        name: "Berserker (Voie de la Rage)",
        description: "Voie brutale du Guerrier. La douleur devient du carburant. Dégâts massifs, encaissement agressif.",
        abilities: [
          {
            id: "rage",
            name: "Rage",
            type: "active",
            peCost: 2,
            effect: "Entre en Rage pendant 3 tours : +2 dégâts, -1 DEF Physique. Les Encaissements donnent +2 au prochain jet offensif au lieu de +1.",
            levels: [
              { level: 3, bonus: "+3 dégâts en Rage" },
              { level: 5, bonus: "Durée 4 tours, +1 PV récupéré par encaissement" },
              { level: 7, bonus: "La DEF Physique ne diminue plus en Rage" },
            ],
          },
        ],
      },
      {
        id: "champion",
        name: "Champion (Voie de la Discipline)",
        description: "Voie classique du Guerrier. Coups précis, posture maîtrisée, riposte automatique.",
        abilities: [
          {
            id: "frappe-disciplinee",
            name: "Frappe Disciplinée",
            type: "active",
            actionCost: "Action Physique",
            peCost: 1,
            damage: "Arme +1",
            effect: "Une attaque mesurée : +1 au test d'attaque, ne provoque pas d'attaque d'opportunité.",
            levels: [
              { level: 3, bonus: "+2 au test d'attaque" },
              { level: 5, bonus: "Touche aussi un ennemi adjacent à -2" },
              { level: 7, bonus: "Inflige Vulnérable 1 tour" },
            ],
          },
        ],
      },
      {
        id: "sentinelle",
        name: "Sentinelle (Voie du Bouclier)",
        description: "Voie défensive du Guerrier. Tient la ligne, protège les alliés, punit les engagements adverses.",
        abilities: [
          {
            id: "garde-prete",
            name: "Garde Prête",
            type: "reaction",
            actionCost: "Réaction",
            peCost: 1,
            effect: "Quand un allié adjacent est attaqué : intercepte l'attaque (la cible devient le Guerrier).",
            levels: [
              { level: 3, bonus: "+1 DEF PHY contre l'attaque interceptée" },
              { level: 5, bonus: "Riposte gratuite après interception" },
              { level: 7, bonus: "Peut intercepter pour 2 alliés par tour" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "arcaniste",
    name: "Arcaniste",
    emoji: "🔮",
    tier: "core",
    tagline: "Magie offensive, contrôle, polyvalence.",
    description: "Mage pur. Manipule la magie dans toute sa puissance et son instabilité.",
    identity: "Puissance brute à distance. Risque permanent de surcharge.",
    primaryStat: "Esprit",
    secondaryStat: "Agilité",
    hpDie: "1d8",
    hpMinimum: 4,
    armor: "legere",
    playstyle: ["Magie offensive", "Contrôle", "Distance", "Surcharge"],
    baseAbility: {
      id: "canalisation",
      name: "Canalisation Arcaniste",
      type: "passive",
      effect: "Récupère 1 PE supplémentaire par tour en combat. La surcharge inflige 1d4 - 1 dégâts (minimum 0).",
      levels: [
        { level: 3, bonus: "Récupère 2 PE par tour" },
        { level: 5, bonus: "Surcharge : 0 dégâts + bonus de sort" },
        { level: 7, bonus: "Peut surcharger sans risque 1 fois par combat" },
      ],
    },
    outfits: [],
  },
  {
    id: "danseur-brume",
    name: "Danseur de Brume",
    emoji: "🌫️",
    tier: "advanced",
    tagline: "Furtivité, repositionnement, confusion.",
    description: "Assassin / illusionniste / mobilité. Insaisissable et imprévisible.",
    identity: "N'est jamais là où on l'attend.",
    primaryStat: "Agilité",
    secondaryStat: "Esprit",
    hpDie: "1d8",
    hpMinimum: 4,
    armor: "legere",
    playstyle: ["Furtivité", "Mobilité", "Illusions", "Frappe chirurgicale"],
    baseAbility: {
      id: "pas-brume",
      name: "Pas de Brume",
      type: "active",
      peCost: 1,
      effect: "Se téléporte jusqu'à 2 cases dans la brume ou l'ombre. Prochain jet d'attaque +2.",
      levels: [
        { level: 3, bonus: "3 cases, +3 au jet" },
        { level: 5, bonus: "4 cases, invisibilité 1 tour" },
        { level: 7, bonus: "5 cases, peut entraîner un allié" },
      ],
    },
    outfits: [],
  },
  {
    id: "gardien-primordial",
    name: "Gardien Primordial",
    emoji: "🌿",
    tier: "core",
    tagline: "Tank naturel. Protecteur. Celui qui tient la ligne.",
    description: "Son rôle : protéger, absorber, régénérer. Pas de gros soins — il transfert les dégâts et régénère lentement.",
    identity: "Tenir la ligne. La force de l'arbre qui plie sans rompre.",
    primaryStat: "Endurance",
    secondaryStat: "Force",
    hpDie: "1d10",
    hpMinimum: 6,
    armor: "lourde",
    playstyle: ["Tank", "Protection", "Régénération", "Soutien"],
    baseAbility: {
      id: "lien-vital",
      name: "Lien Vital",
      type: "active",
      peCost: 3,
      effect: "Pendant 3 tours : 30% des dégâts d'un allié sont redirigés vers toi. Le transfert ne peut pas faire descendre sous 1 PV sur un même tour.",
      levels: [
        { level: 3, bonus: "40% des dégâts redirigés" },
        { level: 5, bonus: "50% + soin léger 1d6 pour l'allié" },
        { level: 7, bonus: "60% + tu régénères 1 PV par tour" },
      ],
    },
    outfits: [],
  },
  {
    id: "lie-demoniaque",
    name: "Lié Démoniaque",
    emoji: "👹",
    tier: "advanced",
    tagline: "Puissance corrompue. Le pouvoir a un prix.",
    description: "Utilise les PE comme tout le monde MAIS peut forcer des capacités démoniaques en gagnant de la Corruption. Plus la Corruption monte, plus il est fort… et moins il se contrôle.",
    identity: "La descente est une mécanique. Le joueur raconte sa corruption à travers ses stats.",
    primaryStat: "Force",
    secondaryStat: "Esprit",
    hpDie: "1d10",
    hpMinimum: 6,
    armor: "intermediaire",
    playstyle: ["Sacrifice", "Puissance brute", "Corruption", "Transformation"],
    baseAbility: {
      id: "jauge-corruption",
      name: "Jauge de Corruption",
      type: "passive",
      effect: "Jauge de 0 à 10. Certaines capacités coûtent PE + Corruption. Effets par palier : 1-3 (bonus démoniaques), 4-6 (mutations + malus contrôle), 7-9 (transformations + risque), 10 (explosion démoniaque — le MJ peut déclencher une possession).",
      levels: [
        { level: 3, bonus: "Jauge max 12, récupère 1 Corruption par repos long" },
        { level: 5, bonus: "Contrôle amélioré : palier critique à 12 au lieu de 10" },
        { level: 7, bonus: "Peut purger 2 Corruption par repos long" },
      ],
    },
    outfits: [],
  },
  {
    id: "rodeur",
    name: "Rôdeur",
    emoji: "🏹",
    tier: "core",
    tagline: "L'œil de la nature. Pisteur, archer, survivant.",
    description: "Combattant hybride mêlée/distance, expert du terrain. Privilégie la précision, la connaissance des ennemis et la mobilité aux confrontations frontales.",
    identity: "Frapper le bon ennemi, au bon moment, depuis le bon endroit.",
    primaryStat: "Agilité",
    secondaryStat: "Esprit",
    hpDie: "1d8",
    hpMinimum: 4,
    armor: "intermediaire",
    playstyle: ["Distance", "Pistage", "Survie", "Hybride mêlée/arc"],
    baseAbility: {
      id: "ennemi-jure",
      name: "Ennemi Juré",
      type: "passive",
      effect: "Choisis une famille de créatures (bêtes, démons, morts-vivants, humanoïdes…). +1 dégât et +1 au pistage contre elles.",
      levels: [
        { level: 3, bonus: "+2 dégâts contre l'ennemi juré" },
        { level: 5, bonus: "Choisit un second ennemi juré" },
        { level: 7, bonus: "+1 au test d'attaque contre tout ennemi juré" },
      ],
    },
    outfits: [],
  },
  {
    id: "maitre-lame-elementaire",
    name: "Maître de Lame Élémentaire",
    emoji: "🗡️",
    tier: "advanced",
    tagline: "Lame et élément ne font qu'un.",
    description: "Spadassin avancé qui imprègne ses armes blanches d'énergie élémentaire (feu, glace, foudre, vent…). Combat de mêlée magique, frappes chargées, contrôle de zone proche.",
    identity: "Chaque coup est aussi un sort. Pas de sort sans un coup.",
    primaryStat: "Agilité",
    secondaryStat: "Esprit",
    hpDie: "1d8",
    hpMinimum: 4,
    armor: "intermediaire",
    playstyle: ["Mêlée magique", "Élémentaire", "Combos", "Burst"],
    baseAbility: {
      id: "infusion-elementaire",
      name: "Infusion Élémentaire",
      type: "passive",
      effect: "Ses attaques de mêlée peuvent infliger des dégâts d'un élément choisi (feu/eau/vent/terre/foudre/glace). +1d4 dégâts élémentaires sur attaques chargées.",
      levels: [
        { level: 3, bonus: "+1d6 dégâts élémentaires" },
        { level: 5, bonus: "Peut alterner deux éléments par combat" },
        { level: 7, bonus: "+1d8, applique un état lié à l'élément (Brûlure, Givre…)" },
      ],
    },
    outfits: [],
  },
  {
    id: "exorciste",
    name: "Exorciste",
    emoji: "✨",
    tier: "advanced",
    tagline: "Purifier la corruption. Bannir le démoniaque.",
    description: "Spécialiste anti-démoniaque et anti-corruption. Combine soutien sacré, dégâts radiants et bannissement. Contre direct du Lié Démoniaque et des entités spirituelles.",
    identity: "Là où la corruption avance, l'Exorciste l'arrête.",
    primaryStat: "Esprit",
    secondaryStat: "Endurance",
    hpDie: "1d8",
    hpMinimum: 4,
    armor: "intermediaire",
    playstyle: ["Soutien sacré", "Anti-corruption", "Bannissement", "Dégâts radiants"],
    baseAbility: {
      id: "verbe-purificateur",
      name: "Verbe Purificateur",
      type: "active",
      actionCost: "Action Magique",
      peCost: 2,
      effect: "Inflige 1d8 dégâts radiants à une cible démoniaque/corrompue (1d4 sinon). Réduit la jauge de Corruption d'un Lié Démoniaque allié de 1.",
      levels: [
        { level: 3, bonus: "Dégâts 2d6 sur démoniaques" },
        { level: 5, bonus: "Soigne aussi 1d6 PV à un allié à portée" },
        { level: 7, bonus: "Bannit temporairement une entité corrompue (1 tour)" },
      ],
    },
    outfits: [],
  },
];

// ============================================================
// AFFINITÉS RACE / CLASSE
// ============================================================

export const AFFINITIES: RaceClassAffinity[] = [
  {
    raceId: "ignaris",
    classId: "berserker",
    level: "majeure",
    loreReason: "Le feu intérieur des Ignaris s'embrasse naturellement dans la rage du Berserker.",
    bonusChoices: [
      { id: "ignaris-berserk-1", description: "+1 dégâts en Rage" },
      { id: "ignaris-berserk-2", description: "Réduction de feu +1" },
      { id: "ignaris-berserk-3", description: "+1 aux tests d'intimidation" },
    ],
  },
  {
    raceId: "ignaris",
    classId: "maitre-arme",
    level: "mineure",
    loreReason: "L'intensité des Ignaris donne de la conviction à leurs techniques.",
    bonusChoices: [
      { id: "ignaris-maitre-1", description: "+1 dégâts avec armes lourdes" },
      { id: "ignaris-maitre-2", description: "+1 initiative" },
    ],
  },
  {
    raceId: "varagn",
    classId: "berserker",
    level: "mineure",
    loreReason: "La bête intérieure du Varagn résonne avec la rage du Berserker.",
    bonusChoices: [
      { id: "varagn-berserk-1", description: "+1 aux jets de Rage" },
      { id: "varagn-berserk-2", description: "+1 dégâts en forme de fusion" },
    ],
  },
  {
    raceId: "noctaris",
    classId: "danseur-brume",
    level: "majeure",
    loreReason: "L'ombre est leur domaine naturel — se fondre dans la brume est une seconde nature.",
    bonusChoices: [
      { id: "noctaris-danseur-1", description: "+1 en Discrétion" },
      { id: "noctaris-danseur-2", description: "+1 à l'Esquive" },
      { id: "noctaris-danseur-3", description: "+1 en Initiative" },
    ],
  },
  {
    raceId: "brumegrot",
    classId: "danseur-brume",
    level: "mineure",
    loreReason: "Les Brumegrots connaissent les chemins invisibles mieux que quiconque.",
    bonusChoices: [
      { id: "brumegrot-danseur-1", description: "+1 Discrétion" },
      { id: "brumegrot-danseur-2", description: "+1 connaissance du terrain" },
    ],
  },
  {
    raceId: "aeriens",
    classId: "danseur-brume",
    level: "mineure",
    loreReason: "La légèreté et la mobilité des Aériens s'accordent naturellement.",
    bonusChoices: [
      { id: "aerien-danseur-1", description: "+1 Esquive" },
      { id: "aerien-danseur-2", description: "+1 Initiative" },
    ],
  },
  {
    raceId: "terrak",
    classId: "gardien-primordial",
    level: "majeure",
    loreReason: "La résistance naturelle des Terraks fait d'eux des gardiens nés.",
    bonusChoices: [
      { id: "terrak-gardien-1", description: "+1 DEF Physique" },
      { id: "terrak-gardien-2", description: "Réduction dégâts physiques +1" },
      { id: "terrak-gardien-3", description: "+1 aux jets d'Endurance" },
    ],
  },
  {
    raceId: "goliath",
    classId: "gardien-primordial",
    level: "mineure",
    loreReason: "La masse des Goliaths en fait des boucliers naturels.",
    bonusChoices: [
      { id: "goliath-gardien-1", description: "+2 PV au niveau 1" },
      { id: "goliath-gardien-2", description: "+1 DEF Physique" },
    ],
  },
  {
    raceId: "nain",
    classId: "gardien-primordial",
    level: "mineure",
    loreReason: "La robustesse des Nains s'allie bien au rôle de protecteur.",
    bonusChoices: [
      { id: "nain-gardien-1", description: "Réduction dégâts +1" },
      { id: "nain-gardien-2", description: "+1 aux tests de résistance" },
    ],
  },
  {
    raceId: "humain",
    classId: "maitre-arme",
    level: "mineure",
    loreReason: "L'adaptabilité humaine s'exprime parfaitement dans la polyvalence martiale.",
    bonusChoices: [
      { id: "humain-maitre-1", description: "+1 avec une arme au choix" },
      { id: "humain-maitre-2", description: "+1 Initiative" },
    ],
  },
  {
    raceId: "nereens",
    classId: "arcaniste",
    level: "mineure",
    loreReason: "L'esprit profond et cyclique des Néréens renforce la concentration magique.",
    bonusChoices: [
      { id: "nerens-arc-1", description: "+1 PE au niveau 1" },
      { id: "nerens-arc-2", description: "+1 DEF Magique" },
    ],
  },
  {
    raceId: "lumeni",
    classId: "arcaniste",
    level: "mineure",
    loreReason: "La lumière intérieure des Lumeni amplifie les canalisations magiques.",
    bonusChoices: [
      { id: "lumeni-arc-1", description: "+1 aux sorts de Lumière" },
      { id: "lumeni-arc-2", description: "+1 DEF Magique" },
    ],
  },
  {
    raceId: "pugiliste",
    classId: "pugiliste",
    level: "majeure",
    loreReason: "— Classe sans race attitrée, ouverte à tous.",
    bonusChoices: [],
  },
  {
    raceId: "varagn",
    classId: "pugiliste",
    level: "majeure",
    loreReason: "Le combat à mains nues amplifié par la fusion bestiale — redoutable.",
    bonusChoices: [
      { id: "varagn-pugil-1", description: "+1 dégâts en Contre-attaque" },
      { id: "varagn-pugil-2", description: "+1 à la Parade en forme de fusion" },
      { id: "varagn-pugil-3", description: "+1 jet de Riposte parfaite" },
    ],
  },
  {
    raceId: "demi-orc",
    classId: "berserker",
    level: "majeure",
    loreReason: "Le sang orc résonne naturellement avec la rage du Berserker.",
    bonusChoices: [
      { id: "demiorc-berserk-1", description: "+2 PV en Rage" },
      { id: "demiorc-berserk-2", description: "+1 dégâts sur attaques lourdes" },
      { id: "demiorc-berserk-3", description: "+1 Endurance pour résister aux conditions" },
    ],
  },
  {
    raceId: "lie-demoniaque",
    classId: "lie-demoniaque",
    level: "majeure",
    loreReason: "— Classe thématique.",
    bonusChoices: [],
  },
];

// ============================================================
// CONDITIONS
// ============================================================

export const CONDITIONS: AetheriaCondition[] = [
  {
    id: "desequilibre",
    name: "Déséquilibre",
    emoji: "💫",
    effect: "Impossible d'utiliser sa réaction. -2 DEF Physique.",
    duration: "1 tour",
    removal: "Se retire automatiquement.",
  },
  {
    id: "saignement",
    name: "Saignement",
    emoji: "🩸",
    effect: "Perd 1d4 PV au début de son tour.",
    duration: "3 tours",
    removal: "Action libre + test de soin (difficulté 12).",
  },
  {
    id: "brulure",
    name: "Brûlure",
    emoji: "🔥",
    effect: "1d6 dégâts directs par tour.",
    duration: "2 tours",
    removal: "Action libre ou eau à disposition.",
  },
  {
    id: "immobilise",
    name: "Immobilisé",
    emoji: "⛓️",
    effect: "Aucun déplacement possible.",
    duration: "Jusqu'à libération",
    removal: "Test de Force (difficulté selon source).",
  },
  {
    id: "peur",
    name: "Peur",
    emoji: "😨",
    effect: "-2 aux jets d'attaque. Impossible d'avancer vers la source de peur.",
    duration: "2 tours",
    removal: "Test mental à la fin de chaque tour (difficulté 12).",
  },
  {
    id: "corruption",
    name: "Corruption",
    emoji: "🌑",
    effect: "Accumulation spéciale au Lié Démoniaque. Par palier : 1-3 (bonus démoniaques), 4-6 (mutations + malus contrôle), 7-9 (transformations + risque perte de contrôle), 10 (explosion démoniaque).",
    duration: "Permanente jusqu'à purge",
    removal: "Repos long (récupère 1), capacités spéciales de purge.",
    special: "Unique à la classe Lié Démoniaque. Double corruption : physique ET spirituelle.",
  },
];

// ============================================================
// SYSTÈME DE RÉACTIONS
// ============================================================

export const REACTIONS = [
  {
    id: "esquive",
    name: "Esquive",
    emoji: "💨",
    type: "defensive",
    trigger: "Quand une attaque physique te touche.",
    mechanic: "Jet d20 + Agilité contre le jet d'attaque adverse.",
    results: [
      { condition: "Ton jet dépasse l'attaque", effect: "Attaque annulée" },
      { condition: "Égalité", effect: "Dégâts réduits de moitié" },
      { condition: "Échec", effect: "Dégâts normaux" },
    ],
    limit: "Impossible en armure lourde (ou malus selon classe).",
  },
  {
    id: "parade",
    name: "Parade",
    emoji: "🛡️",
    type: "defensive",
    trigger: "Attaque de mêlée reçue.",
    mechanic: "Jet d20 + Force (ou Agilité avec arme légère) contre l'attaque ennemie.",
    results: [
      { condition: "Réussite", effect: "Dégâts réduits de moitié" },
      { condition: "Dépasse de 3 ou plus", effect: "Attaque complètement bloquée" },
      { condition: "Échec", effect: "Dégâts normaux" },
    ],
    limit: "Nécessite une arme ou un bouclier.",
  },
  {
    id: "encaissement",
    name: "Encaissement",
    emoji: "🪨",
    type: "defensive",
    trigger: "Toujours disponible.",
    mechanic: "Pas de jet. Tu acceptes le coup.",
    results: [
      { condition: "Automatique", effect: "Réduction supplémentaire -2 dégâts + bonus +1 au prochain jet offensif" },
    ],
    limit: "Style parfait pour Berserker / tank.",
  },
  {
    id: "contre-attaque",
    name: "Contre-attaque",
    emoji: "⚔️",
    type: "offensive",
    trigger: "Si l'ennemi rate une attaque au corps-à-corps.",
    mechanic: "Attaque immédiate. 1 seule attaque (pas de double attaque en réaction).",
    results: [
      { condition: "Automatique si au contact", effect: "Attaque normale, consomme la réaction" },
    ],
    limit: "Doit être au contact. Consomme la réaction.",
  },
  {
    id: "opportunite",
    name: "Attaque d'Opportunité",
    emoji: "🚶",
    type: "zone",
    trigger: "Si un ennemi quitte ton corps-à-corps sans action adaptée.",
    mechanic: "Attaque gratuite qui consomme ta réaction.",
    results: [
      { condition: "Automatique", effect: "Attaque normale — punit la fuite et contrôle le terrain" },
    ],
    limit: "Consomme la réaction.",
  },
  {
    id: "riposte-parfaite",
    name: "Riposte Parfaite",
    emoji: "🩸",
    type: "offensive",
    trigger: "Après une Esquive ou Parade réussie complètement (pas partielle).",
    mechanic: "Attaque de riposte immédiate avec bonus. Fait partie de la même réaction — ne consomme pas de réaction supplémentaire.",
    results: [
      { condition: "Esquive parfaite", effect: "Riposte avec bonus de classe" },
      { condition: "Parade parfaite", effect: "Riposte avec bonus de classe" },
      { condition: "Réduction partielle (égalité)", effect: "Pas de riposte" },
    ],
    limit: "Capacité de classe — disponible uniquement si débloquée.",
    special: "Différence clé : Contre-attaque = punition de l'adversaire. Riposte parfaite = récompense de maîtrise.",
  },
];

// ============================================================
// RÈGLE : 1 RÉACTION = PEUT CONTENIR PLUSIEURS EFFETS LIÉS
// si ces effets appartiennent au même déclenchement.
// ============================================================

// ============================================================
// DIFFICULTÉ DES TESTS
// ============================================================

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { value: 8, label: "Facile", description: "Accessible à la plupart" },
  { value: 12, label: "Normal", description: "Défi raisonnable" },
  { value: 16, label: "Difficile", description: "Requiert expertise" },
  { value: 20, label: "Expert", description: "Limite des capacités humaines" },
  { value: 24, label: "Héroïque", description: "Prouesse exceptionnelle" },
  { value: 28, label: "Quasi impossible", description: "Réservé aux légendes" },
];

// ============================================================
// FACTIONS
// ============================================================

export const FACTIONS: AetheriaFaction[] = [
  {
    id: "lame-aube",
    name: "La Lame d'Aube",
    emoji: "⚔️",
    type: "ordre",
    tagline: "Purifier le monde.",
    description: "Ordre militant qui chasse démons, corruptions et anomalies.",
    vision: "Un monde purifié de toute corruption démoniaque.",
    danger: "Peut devenir extrémiste — la pureté à tout prix.",
  },
  {
    id: "conclave-arcanis",
    name: "Conclave d'Arcanis",
    emoji: "🧙",
    type: "ordre",
    tagline: "Comprendre le monde. Peu importe le prix.",
    description: "Les mages organisés. Cherchent savoir, pouvoir, contrôle.",
    vision: "La connaissance absolue de la magie.",
    danger: "Expérimentations dangereuses. Arrogance chronique.",
  },
  {
    id: "guilde-cendres",
    name: "Guilde des Cendres",
    emoji: "🗡",
    type: "guilde",
    tagline: "Invisible. Partout.",
    description: "Assassins, espions, manipulateurs. Aucune allégeance fixe.",
    vision: "Le pouvoir dans l'ombre.",
    danger: "Manipule tous les camps.",
  },
  {
    id: "maitres-marees",
    name: "Maîtres des Marées",
    emoji: "⚓",
    type: "pouvoir",
    tagline: "Contrôler les routes maritimes.",
    description: "Pouvoir maritime. Contrôlent routes, ports et commerce.",
    vision: "La maîtrise des océans = la maîtrise du monde.",
    danger: "Monopole commercial brutal.",
  },
  {
    id: "gardiens-anciens",
    name: "Gardiens Anciens",
    emoji: "🌿",
    type: "gardiens",
    tagline: "Empêcher les dérives.",
    description: "Druides et protecteurs. Maintiennent l'équilibre naturel.",
    vision: "Préserver Aetheria de sa propre destruction.",
    danger: "Parfois en opposition totale avec la civilisation.",
  },
  {
    id: "pacte-ecarlate",
    name: "Pacte Écarlate",
    emoji: "🩸",
    type: "culte",
    tagline: "Culte interdit.",
    description: "Utilise démons, sacrifices et corruption pour gagner du pouvoir.",
    vision: "Ouvrir les portes entre les mondes.",
    danger: "Infiltration progressive de toutes les institutions.",
  },
];

// ============================================================
// ROYAUMES
// ============================================================

export const KINGDOMS: AetheriaKingdom[] = [
  {
    id: "aldoria",
    name: "Aldoria",
    emoji: "👑",
    continent: "Edrasil",
    nature: "Royaume structuré, organisé, influent. Armée disciplinée, villes fortifiées, administration solide.",
    ruler: "Roi Kaelor IV — vieillissant, lucide, dangereux. Il sait que le monde change.",
    vision: "Maintenir l'ordre. Contrôler les flux. Éviter l'effondrement.",
    weaknesses: ["Dépendance économique", "Tensions internes", "Pression des autres puissances"],
  },
  {
    id: "valkar",
    name: "Valkar",
    emoji: "⚔️",
    continent: "Edrasil",
    nature: "Culture du combat. Société dure. Le respect se gagne par la force.",
    ruler: "Reine Brynja la Rouge — directe, brutale, respectée. Ne négocie pas avec la faiblesse.",
    vision: "Le monde appartient à ceux qui peuvent le prendre.",
    weaknesses: ["Instabilité", "Conflits constants", "Pertes élevées"],
  },
  {
    id: "arcanis",
    name: "Cités d'Arcanis",
    emoji: "🧙",
    continent: "Edrasil",
    nature: "Gouvernées par des mages. Indépendantes. Puissantes mais divisées.",
    ruler: "Le Conseil des Archontes — groupe de mages influents, rarement d'accord entre eux.",
    vision: "Comprendre le monde. Peu importe le prix.",
    weaknesses: ["Arrogance", "Expérimentations dangereuses", "Conflits internes"],
  },
  {
    id: "khar-dum",
    name: "Khar-Dum",
    emoji: "⛰️",
    continent: "Edrasil",
    nature: "Cités souterraines. Maîtrise du métal. Stabilité extrême.",
    ruler: "Durgan Fer-Cœur — un roi solide. Littéralement.",
    vision: "Durée. Solidité. Transmission.",
    weaknesses: ["Lenteur", "Isolement"],
  },
  {
    id: "lunethiel",
    name: "Lunethiel",
    emoji: "🌲",
    continent: "Sylvara",
    nature: "Forêts anciennes. Peuples sylvans. Magie naturelle.",
    ruler: "Reine Elaris — calme mais inflexible.",
    vision: "Préserver. Même contre le reste du monde.",
    weaknesses: ["Isolement", "Incompréhension extérieure"],
  },
];

// ============================================================
// RÈGLES DE BASE
// ============================================================

export const GAME_RULES = {
  characteristics: {
    list: ["Force", "Agilité", "Esprit", "Endurance"],
    creation: {
      points: 6,
      maxPerStat: 3,
      minPerStat: 0,
      example: "Force 2 / Agilité 2 / Esprit 1 / Endurance 1",
    },
    progression: {
      perLevel: "1 ou 2 points",
      capMid: 6,
      capAdvanced: 8,
    },
  },
  defenses: {
    physical: {
      formula: "10 + Agilité",
      cap: 16,
      usedAgainst: ["Mêlée", "Projectiles", "Capacités physiques"],
    },
    magical: {
      formula: "10 + Esprit",
      cap: 16,
      usedAgainst: ["Magie", "Énergie", "Effets mentaux"],
    },
    rule: "Sans équipement ni bonus spéciaux, aucune défense ne dépasse 16.",
  },
  armor: {
    rule: "L'armure N'augmente PAS la défense. Elle RÉDUIT les dégâts.",
    types: [
      { name: "Légère", reduction: "0-1", penalty: "Aucune", for: ["Mages", "Artilleurs", "Voleurs"] },
      { name: "Intermédiaire", reduction: "1-2", penalty: "Légère contrainte possible", for: ["Hybrides", "Combattants rapides"] },
      { name: "Lourde", reduction: "2-3", penalty: "-1 esquive ou malus mobilité", for: ["Tanks", "Guerriers"] },
    ],
  },
  hitPoints: {
    nonFrontal: { die: "1d8", minimum: 4, classes: ["Mage", "Artilleur"] },
    frontal: { die: "1d10", minimum: 6, classes: ["Guerrier", "Berserker"] },
    rule: "Si le résultat est inférieur au minimum, prendre le minimum.",
  },
  energy: {
    formula: "5 + Esprit",
    recovery: {
      inCombat: "+1 PE par tour",
      outCombat: "Récupération complète",
    },
    costs: {
      simple: 1,
      strong: 2,
      major: 3,
    },
    overload: {
      trigger: "Plus de PE",
      consequence: "1d4 dégâts ou malus temporaire",
      canForce: true,
    },
  },
  combat: {
    attackFormula: "d20 + Caractéristique contre DEF adverse",
    statsByAttack: {
      melee_heavy: "Force",
      distance_finesse: "Agilité",
      magic: "Esprit",
    },
    partialSuccess: {
      threshold: 2,
      rule: "Si l'attaque échoue de 2 ou moins : touche quand même mais dégâts réduits.",
    },
    criticals: {
      trigger: "20 naturel",
      options: ["Dégâts x2", "Effet critique (saignement / déséquilibre / blessure ciblée)"],
    },
  },
  turnStructure: {
    actions: [
      { name: "Mouvement", count: 1, allows: ["Déplacement", "Repositionnement", "Fuite"] },
      { name: "Action principale", count: 1, allows: ["Attaquer", "Lancer un sort", "Compétence offensive"] },
      { name: "Action gratuite", count: 1, allows: ["Boire une potion", "Recharger", "Changer d'arme", "Interaction rapide"] },
      { name: "Réaction", count: 1, allows: ["Esquive", "Parade", "Encaissement", "Contre-attaque", "Opportunité"] },
    ],
    doubleAttack: {
      allowed: true,
      cost: "Sacrifice du Mouvement + Action gratuite",
      option: "2e attaque à -2 au jet (conseillé pour équilibrage)",
    },
  },
  ranges: {
    contact: { label: "Contact", distance: "0-2m" },
    short: { label: "Court", distance: "3-6m" },
    medium: { label: "Moyen", distance: "7-12m" },
    long: { label: "Long", distance: "13-20m" },
    extreme: { label: "Extrême", distance: "21m+" },
    vttScale: "1 case = 1 mètre",
  },
  healing: {
    potions: [
      { name: "Potion mineure", action: "Action libre", heal: "1d6 + 2", limit: "1 par tour max" },
      { name: "Potion standard", action: "Action libre", heal: "2d6 + 4", limit: "1 par tour max" },
    ],
    rest: {
      short: { duration: "30 min", hp: "50% PV max", pe: "25% PE max" },
      long: { duration: "8h", hp: "100% PV", pe: "100% PE" },
      special: "Si blessure grave ou corruption : repos incomplet possible.",
    },
  },
  maxLevel: 15,
  subclassLevel: 3,
} as const;

// ============================================================
// HELPERS
// ============================================================

export function getRaceById(id: string): AetheriaRace | undefined {
  return RACES.find(r => r.id === id);
}

export function getClassById(id: string): AetheriaClass | undefined {
  return CLASSES.find(c => c.id === id);
}

export function getAffinitiesForRace(raceId: string): RaceClassAffinity[] {
  return AFFINITIES.filter(a => a.raceId === raceId);
}

export function getAffinitiesForClass(classId: string): RaceClassAffinity[] {
  return AFFINITIES.filter(a => a.classId === classId);
}

export function getAffinity(raceId: string, classId: string): RaceClassAffinity | undefined {
  return AFFINITIES.find(a => a.raceId === raceId && a.classId === classId);
}

export function getRacesByCategory(category: RaceCategory): AetheriaRace[] {
  return RACES.filter(r => r.category === category);
}

export function getCoreClasses(): AetheriaClass[] {
  return CLASSES.filter(c => c.tier === "core");
}

export function getAdvancedClasses(): AetheriaClass[] {
  return CLASSES.filter(c => c.tier === "advanced");
}

export function calculateDefense(stat: number, type: "physical" | "magical"): number {
  return Math.min(16, 10 + stat);
}

export function calculatePE(esprit: number): number {
  return 5 + esprit;
}

export function calculateModifier(stat: number): number {
  return Math.floor((stat - 10) / 2);
}
