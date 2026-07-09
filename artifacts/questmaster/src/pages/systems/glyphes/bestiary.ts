// Bestiaire officiel Glyphes — Nouvel Empire.
// Contenu extrait des documents source (Bandits, Faune sauvage, Mycoïdes, Gardiens).
// Système isolé : ne se mélange jamais à d'autres univers.

export type GlyphesCreature = {
  nom: string;
  categorie: "Bandits" | "Faune sauvage" | "Créatures végétales" | "Gardiens";
  tags?: string[]; // ex: "Violent 8", "Peur", "Effrayant"
  description: string;
  blessure: number; // nombre d'icônes 🔴
  protection: number; // nombre de 🛡️
  stats: { PUI: string; SOU: string; CON: string; FOI: string; SOC: string; ESP: string };
  defense: { resilience: number | string; esquive: string };
  attaque: { melee: string; distance: string };
  aptitudes: { nom: string; niveau: number }[];
  capacites?: { nom: string; desc: string }[];
  expert?: string; // Note "Expert en créatures"
};

export const GLYPHES_BESTIARY: GlyphesCreature[] = [
  // ═══ BANDITS ═══
  {
    nom: "Bandit tireur",
    categorie: "Bandits",
    description:
      "Commun dans les gangs de malfrats, équipé d'arc long. Parfaite couverture pour ses alliés plus brutaux, redoutable en embuscade. Certains sont munis d'arbalètes doubles.",
    blessure: 1,
    protection: 1,
    stats: { PUI: "D4", SOU: "D6", CON: "D4", FOI: "D4", SOC: "D4", ESP: "D4" },
    defense: { resilience: 4, esquive: "2D6" },
    attaque: { melee: "2D4", distance: "2D6" },
    aptitudes: [
      { nom: "Armes légères à distance", niveau: 2 },
      { nom: "Armes légères de mêlée", niveau: 2 },
      { nom: "Camouflage", niveau: 2 },
    ],
  },
  {
    nom: "Coupe-jarret",
    categorie: "Bandits",
    description:
      "Unité d'assaut par excellence. Mieux protégé que l'archer et plus puissant, capable de charges meurtrières. Son mental plus élevé lui évite la panique.",
    blessure: 1,
    protection: 2,
    stats: { PUI: "D6", SOU: "D4", CON: "D4", FOI: "D4", SOC: "D4", ESP: "D4" },
    defense: { resilience: 4, esquive: "2D4" },
    attaque: { melee: "2D6", distance: "2D4" },
    aptitudes: [
      { nom: "Armes légères à distance", niveau: 2 },
      { nom: "Armes légères de mêlée", niveau: 2 },
      { nom: "Camouflage", niveau: 2 },
    ],
  },
  {
    nom: "Brute",
    categorie: "Bandits",
    description:
      "Accompagne les escouades d'assaut les plus dangereuses. Peu d'armure, arme lourde, agit comme un berserker porté par sa soif de sang. Obéit au chef d'escouade et prend peu d'initiatives sauf danger imminent.",
    blessure: 2,
    protection: 1,
    stats: { PUI: "D8", SOU: "D6", CON: "D6", FOI: "D4", SOC: "D4", ESP: "D4" },
    defense: { resilience: 6, esquive: "2D6" },
    attaque: { melee: "3D8", distance: "1D6" },
    aptitudes: [
      { nom: "Armes lourdes de mêlée", niveau: 3 },
      { nom: "Athlétisme", niveau: 2 },
      { nom: "Inébranlable", niveau: 2 },
    ],
    capacites: [
      { nom: "Charge puissante", desc: "La brute effectue une charge dévastatrice : ses dés de PUI comptent automatiquement comme le résultat maximum." },
      { nom: "Enragé", desc: "À la première blessure, la brute entre en rage : ses attaques ne coûtent plus qu'un point d'action." },
    ],
  },
  {
    nom: "Chef de gang",
    categorie: "Bandits",
    description:
      "Leader d'un groupe de malfrats. Plus intelligent et fort que ses subordonnés, certains recrutent même un troll solitaire. Se tient en arrière avec les archers pour orchestrer, mais reste dangereux au corps à corps.",
    blessure: 3,
    protection: 2,
    stats: { PUI: "D6", SOU: "D6", CON: "D4", FOI: "D6", SOC: "D8", ESP: "D6" },
    defense: { resilience: 4, esquive: "2D6" },
    attaque: { melee: "3D6", distance: "1D6" },
    aptitudes: [
      { nom: "Armes légères de mêlée", niveau: 3 },
      { nom: "Courageux", niveau: 2 },
      { nom: "Vigilant", niveau: 2 },
    ],
    capacites: [
      { nom: "Barrage de flèches", desc: "Action combinée avec ses tireurs : un PA pour donner l'ordre, puis déclencher le barrage en réaction." },
      { nom: "Ordre de charge", desc: "Pour 1 PA, tout bandit brutal ou brute à 60 ft charge en réaction." },
    ],
  },
  {
    nom: "Troll",
    categorie: "Bandits",
    tags: ["Peur", "Violent 5"],
    description:
      "3 mètres de haut, peau dure comme la roche, bras simiesques à l'allonge dévastatrice. Rare, violent, intelligence limitée mais social — s'allie parfois à des gangs puissants pour la nourriture et la liberté de violence.",
    blessure: 3,
    protection: 1,
    stats: { PUI: "D8", SOU: "D4", CON: "D10", FOI: "D8", SOC: "D4", ESP: "D4" },
    defense: { resilience: 8, esquive: "/" },
    attaque: { melee: "4D8", distance: "3D8" },
    aptitudes: [
      { nom: "Armes lourdes de mêlée", niveau: 4 },
      { nom: "Armes de jets", niveau: 3 },
      { nom: "Courageux", niveau: 4 },
      { nom: "Athlétique", niveau: 5 },
    ],
    expert:
      "Une épreuve d'instinct ou de vigilance révèle que les trolls sont maladroits. Les faire trébucher les met à terre — leur résilience descend alors à 6.",
    capacites: [
      { nom: "Lancer de rocher", desc: "Épreuve d'athlétisme (commune) pour soulever un rocher/tronc jusqu'à ½ tonne. La cible subit autant de blessures que de réussites. 1× par combat." },
      { nom: "Balayage", desc: "Les attaques du troll couvrent un arc de 10 ft sur 180°." },
    ],
  },
  // ═══ FAUNE SAUVAGE ═══
  {
    nom: "Panthère des forêts",
    categorie: "Faune sauvage",
    tags: ["Violent 8"],
    description:
      "Félin territorial au pelage sombre, discrétion inégalée en forêt. Solitaire sauf en période de reproduction — accompagnée de son partenaire, elle devient encore plus dangereuse.",
    blessure: 2,
    protection: 2,
    stats: { PUI: "D4", SOU: "D8", CON: "D4", FOI: "D4", SOC: "D4", ESP: "D4" },
    defense: { resilience: 4, esquive: "3D8" },
    attaque: { melee: "4D8", distance: "/" },
    aptitudes: [
      { nom: "Camouflage", niveau: 4 },
      { nom: "Pied léger", niveau: 3 },
      { nom: "Pugilat (griffes)", niveau: 4 },
    ],
    expert:
      "Un chasseur avisé reconnaît les frontières du territoire aux griffes sur arbres/rochers. Des marques plus petites à côté indiquent une progéniture — n'y pénétrez sous aucun prétexte.",
  },
  {
    nom: "Ours brun",
    categorie: "Faune sauvage",
    tags: ["Violent 6"],
    description:
      "Créature sylvestre paisible sauf si elle se sent menacée. Territoriale, elle partage parfois une symbiose avec la faune végétale locale : protection contre fertilisation des sols.",
    blessure: 3,
    protection: 2,
    stats: { PUI: "D8", SOU: "D4", CON: "D4", FOI: "D4", SOC: "D4", ESP: "D4" },
    defense: { resilience: 4, esquive: "1D4" },
    attaque: { melee: "4D8", distance: "/" },
    aptitudes: [
      { nom: "Pugilat (griffes)", niveau: 4 },
      { nom: "Athlétique", niveau: 3 },
    ],
    expert:
      "Traces de griffes et destructions végétales facilement reconnaissables (réussite auto si vigilance ≥ 3).",
  },
  {
    nom: "Centipède géant",
    categorie: "Faune sauvage",
    description:
      "Insecte monstrueux des forêts Ouest des Monts Gris. Jusqu'à 8 ft pour les mâles. Utilise venin et agilité naturelle plutôt que force brute.",
    blessure: 2,
    protection: 1,
    stats: { PUI: "D4", SOU: "D6", CON: "D4", FOI: "D4", SOC: "D4", ESP: "D4" },
    defense: { resilience: 4, esquive: "1D6" },
    attaque: { melee: "3D6", distance: "/" },
    aptitudes: [
      { nom: "Camouflage", niveau: 3 },
      { nom: "Pugilat (mandibules, dard)", niveau: 3 },
    ],
    expert: "Évolue souvent en groupe de minimum 3 créatures.",
    capacites: [
      { nom: "Étreinte", desc: "Sur une attaque réussie, le centipède s'enroule et applique un poison. Sur un échec à un jet de « sang pourri » (commun, rang 1), la cible est paralysée." },
    ],
  },
  // ═══ VÉGÉTALES ═══
  {
    nom: "Mycoïde",
    categorie: "Créatures végétales",
    description:
      "Créature mi-fongique mi-humanoïde d'environ 1 m, au chapeau atteignant 50 cm. Langage primitif propre, très intelligents, plutôt jovials et peuvent troquer. Se défendent en expulsant des spores volatiles.",
    blessure: 1,
    protection: 0,
    stats: { PUI: "D4", SOU: "D6", CON: "D4", FOI: "D4", SOC: "D6", ESP: "D8" },
    defense: { resilience: 4, esquive: "2D6" },
    attaque: { melee: "1D4", distance: "2D6" },
    aptitudes: [
      { nom: "Armes de jets", niveau: 2 },
      { nom: "Pied léger", niveau: 3 },
      { nom: "Négociateur", niveau: 2 },
    ],
    expert:
      "Trois variétés : vénéneux (poison mortel), incandescent (spores inflammables), contagieux (maladies).",
    capacites: [
      { nom: "Nuée de spores", desc: "Zone de 5 ft de rayon, déplacement aléatoire de 5 ft en début de tour. Vénéneux : jet de sang pourri (commun, rang 1) sinon empoisonné. Bactériens : idem, maladie. Inflammables : toute flamme les enflamme — attaque de 3D6 à 10 ft." },
    ],
  },
  {
    nom: "Linguiste (mycoïde)",
    categorie: "Créatures végétales",
    description:
      "Un personnage avec le don « Linguistes » peut étudier le langage primitif des mycoïdes en une journée, et apprendre les signes universels pour communiquer avec d'autres communautés fongiques. Les mycoïdes sont friands d'échanges culinaires.",
    blessure: 1,
    protection: 0,
    stats: { PUI: "D4", SOU: "D6", CON: "D4", FOI: "D4", SOC: "D8", ESP: "D8" },
    defense: { resilience: 4, esquive: "2D6" },
    attaque: { melee: "1D4", distance: "1D6" },
    aptitudes: [
      { nom: "Négociateur", niveau: 3 },
      { nom: "Érudition", niveau: 2 },
    ],
  },
  // ═══ GARDIENS ═══
  {
    nom: "Gardien de fer-argent",
    categorie: "Gardiens",
    tags: ["Violent 8", "Effrayant"],
    description:
      "Rare gardien des temples du Premier Peuple, entièrement fait de fer-argent. Indestructible sauf par une arme du Premier Peuple ou sertie de nacre.",
    blessure: 3,
    protection: 0,
    stats: { PUI: "D10", SOU: "D8", CON: "D10", FOI: "D12", SOC: "/", ESP: "D10" },
    defense: { resilience: "—", esquive: "—" },
    attaque: { melee: "—", distance: "—" },
    aptitudes: [
      { nom: "Armes lourdes de mêlée", niveau: 4 },
      { nom: "Armes lourdes à distance", niveau: 3 },
      { nom: "Traqueur", niveau: 3 },
    ],
    capacites: [
      { nom: "Sculpture", desc: "Le gardien évoque le Glyphe de sculpture pour forger des sentinelles mécaniques — jusqu'à 4 contrôlées simultanément." },
    ],
  },
  {
    nom: "Sentinelle mécanique",
    categorie: "Gardiens",
    tags: ["Effrayant"],
    description:
      "Automate arachnéen créé par un gardien de fer-argent. Visage rappelant une créature traquée (souvent humaine). Destructible par des armes conventionnelles, contrairement à son créateur.",
    blessure: 1,
    protection: 1,
    stats: { PUI: "D4", SOU: "D8", CON: "D6", FOI: "D4", SOC: "/", ESP: "D6" },
    defense: { resilience: "—", esquive: "—" },
    attaque: { melee: "—", distance: "—" },
    aptitudes: [
      { nom: "Armes légères de mêlée", niveau: 4 },
      { nom: "Armes légères à distance", niveau: 3 },
      { nom: "Pieds légers", niveau: 3 },
    ],
    expert: "Sa présence signale clairement un gardien de fer-argent actif dans la zone.",
    capacites: [
      { nom: "Traque interminable", desc: "Une fois un échantillon obtenu, la sentinelle traque sa cible sans être affectée par son camouflage." },
    ],
  },
];

export const BESTIARY_CATEGORIES = [
  "Bandits",
  "Faune sauvage",
  "Créatures végétales",
  "Gardiens",
] as const;
