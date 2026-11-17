// Données du système Glyphes — Module Cœur + Nouvel Empire (Médiéval Fantastique)
// Extraits des PDF officiels fournis par l'auteur. Synthétisé pour la consultation web.

export const SECTIONS = [
  { id: "avant-propos", label: "Avant-Propos" },
  { id: "histoire", label: "Un peu d'Histoire" },
  { id: "epreuves", label: "Jouer à Glyphes" },
  { id: "personnages", label: "Personnages" },
  { id: "fiche", label: "Fiche de personnage" },
  { id: "dons", label: "Dons" },
  { id: "races", label: "Races" },
  { id: "actions", label: "Actions Héroïques" },
  { id: "magie", label: "Magie des Glyphes" },
  { id: "repos", label: "Activités & Repos" },
  { id: "fabrication", label: "Fabrication" },
  { id: "combat", label: "Combattre" },
  { id: "etats", label: "États & Effets" },
  { id: "progression", label: "Progression" },
  { id: "exploration", label: "Exploration" },
  { id: "richesses", label: "Richesses & Équipements" },
  { id: "armes", label: "S'armer" },
  { id: "armures", label: "Se protéger" },
  { id: "aptitudes", label: "Aptitudes" },
  { id: "qualite", label: "Objets de qualité" },
  { id: "legende", label: "Objets de légende" },
  { id: "factions", label: "Les Factions" },
  { id: "atlas", label: "Atlas des Territoires Libres" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

// Caractéristiques
export const CARACTERISTIQUES = [
  { key: "PUI", label: "Puissance", desc: "Capacités physiques, combat au corps-à-corps en force brute." },
  { key: "SOU", label: "Souplesse", desc: "Dextérité, agilité, finesse. Combat précis ou à distance." },
  { key: "CON", label: "Constitution", desc: "Encaisse les blessures, poisons et maladies." },
  { key: "FOI", label: "Foi", desc: "Engagement envers un concept divin ou la confiance en soi." },
  { key: "ESP", label: "Esprit", desc: "Intellect, robustesse de l'âme. Caractéristique des évocateurs." },
  { key: "SOC", label: "Social", desc: "Tromperie, charme, persuasion, marchandage." },
];

export const NIVEAUX_DES = ["D4", "D6", "D8", "D10", "D12"];

export const DIFFICULTES = [
  { td: "Nul", valeur: 0, desc: "Réussite automatique, aucun héroïsme gagné." },
  { td: "Commun", valeur: 4, desc: "Défi de base. Possibilité réelle d'échec." },
  { td: "Héroïque", valeur: 6, desc: "Vrai défi, encourage à dépenser corps/âme." },
  { td: "Grandiose", valeur: 8, desc: "Très haute volée. Réservé aux personnages aguerris." },
  { td: "Légendaire", valeur: 10, desc: "Déconseillé sous D8 et aptitude 5. Récompense majeure." },
  { td: "Mythique", valeur: 12, desc: "Avertissement — conséquences mortelles probables." },
];

export const RANGS = [
  { rang: "I", ajout: "Sans ajout de difficulté." },
  { rang: "II+", ajout: "Ajout modéré — rang égal à la moitié du niveau d'aptitude." },
  { rang: "III+", ajout: "Ajout conséquent — rang supérieur à la moitié du niveau d'aptitude." },
];

export const RICHESSES = [
  { piece: "Bronze", taux: "Unité de base" },
  { piece: "Argent", taux: "10 Bronze = 1 Argent" },
  { piece: "Barre d'argent", taux: "1 Barre = 50 Argent" },
  { piece: "Perle de Brume", taux: "1 Brume = 100 Argent" },
  { piece: "Rubis", taux: "1 Rubis = 250 Argent" },
  { piece: "Saphir", taux: "1 Saphir = 500 Argent" },
];

export const SENS = [
  { sens: "Vue", formule: "le niveau de dé le plus bas entre ESP et CON" },
  { sens: "Ouïe", formule: "le niveau de dé le plus bas entre ESP et CON" },
  { sens: "Instinct", formule: "le niveau de dé le plus bas entre ESP et FOI" },
  { sens: "Flux", formule: "dé d'ESP moins un niveau — aucun dé de Flux si ESP est un D4" },
];

export const DONS = [
  {
    cat: "Martiaux",
    items: [
      { nom: "Stratège", desc: "Utilise son aptitude Vigilant (avec n'importe quel sens) pour les épreuves d'initiative et peut céder ses réussites aux alliés dans un rayon de 30 ft lors de ces épreuves." },
      { nom: "Écorcheur", desc: "Sur un succès d'attaque de mêlée contre une créature, la force à tirer un jeton de sacrifice." },
      { nom: "Combattant", desc: "Sur un coup d'éclat lors d'une épreuve d'attaque, le coût de l'attaque est réduit d'un point d'action." },
      { nom: "Charnière", desc: "Clé de voûte du groupe : la portée de déclenchement des combos de ses actions héroïques passe à 60 ft." },
    ],
  },
  {
    cat: "Esprit",
    items: [
      { nom: "Évocateur officiel", desc: "Cursus reconnu ; évoque via la table d'immersion. Peut dépenser les réussites de ses dés rituels pour écarter un dé d'immersion impair (ignoré pour la réussite, la tempête et les événements de flux). Traqué s'il quitte son ordre." },
      { nom: "Évocateur sauvage", desc: "Évoque de manière instinctive via la table d'immersion. Obtient 1 dé rituel bonus pour chaque 2 points de tempête déjà possédés lors de l'immersion. Poursuivi par les autorités s'il est reconnu." },
      { nom: "Marqué", desc: "Pas un évocateur : peut évoquer le glyphe qu'il porte. Choisit la caractéristique d'évocation entre Foi, Constitution et Esprit." },
      { nom: "Araignée", desc: "Voit les liens entre les créatures comme une toile : transfère points de corps et d'âme entre deux créatures consentantes dans un rayon de 40 ft." },
      { nom: "Rêveur", desc: "Un mange-songe se matérialise après chaque repos complet (dé : pair = petit compagnon aux mêmes caractéristiques ; impair = cauchemar de taille moyenne, +1 niveau sur un dé et +1 niveau sur deux aptitudes, disparaît à 3 blessures). Garder le cauchemar : épreuve de flux chaque tour, échec = 1 point de tempête." },
    ],
  },
  {
    cat: "Mouvement",
    items: [
      { nom: "Insaisissable", desc: "+5 ft de déplacement par point d'action dépensé, et se désengage gratuitement d'un corps-à-corps." },
    ],
  },
  {
    cat: "Social",
    items: [
      { nom: "Visage", desc: "Lors d'une épreuve sociale, peut utiliser la moitié (arrondie au supérieur) du niveau de son aptitude sociale la plus élevée pour définir le nombre de dés lancés." },
    ],
  },
  {
    cat: "Érudition",
    items: [
      { nom: "Linguiste", desc: "Maîtrise le Sylvain, la langue commune et la Brume-langue. Peut échanger l'une d'elles contre la langue des signes." },
      { nom: "Expert en créatures", desc: "Reçoit une information sur toute créature commune ou déjà rencontrée ; épreuve d'instinct pour les créatures rares ou uniques." },
    ],
  },
  {
    cat: "Corps",
    items: [
      { nom: "Sens surdéveloppés", desc: "Utilise le dé le plus élevé entre les deux caractéristiques pour ses sens, et son dé de Flux est égal à son dé d'Esprit." },
    ],
  },
  {
    cat: "Foi",
    items: [
      { nom: "Fidèle compagnon", desc: "Compagnon loyal qui ne peut pas combattre : une aptitude niveau 4, une niveau 2, D4 partout et D6 dans une caractéristique au choix." },
      { nom: "Courage radiant", desc: "Peut céder ses propres réussites aux épreuves de courage aux alliés dans un rayon de 30 ft." },
      { nom: "Choisi", desc: "Change la caractéristique de référence de deux aptitudes en Foi (ou lie un autre don à la Foi à la place d'une aptitude, comme un don d'évocation)." },
    ],
  },
];

export const RACES = [
  {
    nom: "Humain",
    desc: "Habitants principaux des cités libres du Sud. Bâtisseurs, chercheurs et guerriers, assoiffés de connaissances liées aux glyphes.",
    traits: [
      "Polyvalent : 1 niveau d'aptitude supplémentaire à la création.",
      "Agrandit de 1 le dé de deux caractéristiques au choix.",
    ],
  },
  {
    nom: "Gourmet",
    desc: "Humains mutants (« goules ») capables d'absorber les capacités d'une créature en s'en repaissant. Se fondent dans la masse.",
    traits: [
      "Absorption d'aptitude : seulement 2 niveaux d'aptitude au départ (au lieu de 5), mais peut absorber deux aptitudes en ingérant une partie d'une créature ; chacune prend le niveau exact de celle de la créature. Ingérer une autre créature remplace une aptitude absorbée.",
      "Agrandit de 1 le dé de deux caractéristiques au choix.",
    ],
  },
  {
    nom: "Arboreïde (Médéinite)",
    desc: "Tréant de taille moyenne à la longévité hors norme. Habitants principaux du domaine de Tir'El.",
    traits: [
      "Langues : Sylvestre et commun.",
      "Prendre racine : enraciné, peut se reposer une heure pour soigner une de ses blessures.",
      "Endurant : agrandit de 1 son dé de CON ou de FOI, ainsi qu'un autre dé au choix.",
    ],
  },
  {
    nom: "Fée végétale (Médéinite)",
    desc: "Petite créature joviale à la peau d'écorce et aux ailes de libellule, en lien permanent avec la nature.",
    traits: [
      "Langues : Sylvestre et commun.",
      "Vol : ignore les malus de terrains difficiles et dangereux.",
      "Communion sylvestre : ne peut être surprise par une créature hostile en environnement naturel.",
      "Vive et maligne : agrandit de 1 son dé d'ESP ou de SOU, ainsi qu'un autre dé au choix.",
    ],
  },
  {
    nom: "Ombre",
    desc: "Créature quasi légendaire venue des mers de brumes : peau pâle, pupilles d'encre, odeur sucrée envoûtante.",
    traits: [
      "Vision nocturne, 1D d'ouïe supplémentaire.",
      "Langues : Brume-langue et commun.",
      "Danse des brumes : pour 1 point d'action, test de souplesse pour se dissimuler ; invisible dans le brouillard ou la pénombre.",
      "Discret et endurant : agrandit de 1 son dé de SOU ou de CON, ainsi qu'un autre dé au choix.",
    ],
  },
  {
    nom: "Hybride — Lycan",
    desc: "L'hybride le plus répandu et le plus toléré. Tacticien de meute, fiable.",
    traits: [
      "Vision dans la pénombre, 1D de vue supplémentaire.",
      "Crocs : comptés comme une arme de pugilat.",
      "Héroïsme de meute : les alliés dans un rayon de 40 ft peuvent utiliser les actions héroïques des autres alliés présents dans cette zone.",
      "Féroce et fiable : agrandit de 1 son dé de PUI ou de FOI, ainsi qu'un autre dé au choix.",
    ],
  },
  {
    nom: "Hybride — Ursidé",
    desc: "Nomade mi-humain mi-ours, en quête de son nom.",
    traits: [
      "Aura de menace : commence avec un niveau d'aptitude supplémentaire en Intimidation ou en Courageux.",
      "Dangerosité incarnée : traite toutes les armes de mêlée comme lourdes et peut utiliser « Armes lourdes de mêlée » avec n'importe quelle arme de contact.",
      "Puissant : agrandit son dé de PUI ou de CON, ainsi qu'un autre dé au choix.",
    ],
  },
  {
    nom: "Hybride — Cervidé",
    desc: "Nomade idéaliste en quête de Vatur Pakk'ia, voyageant en caravanes.",
    traits: [
      "Vision dans la pénombre, 1D d'instinct supplémentaire.",
      "Instinct des survivants : peut traiter n'importe quelle épreuve de vigilance avec le sens d'instinct.",
      "Âme puissante : agrandit son dé d'ESP ou de FOI, ainsi qu'un autre dé au choix.",
    ],
  },
];

export const ACTIONS_HEROIQUES = [
  // Tactiques
  { nom: "Vitesse monstrueuse", cout: "2", desc: "+10 ft de déplacement pendant le tour et réussite automatique des épreuves de désengagement." },
  { nom: "À couvert !", cout: "1+", desc: "Face à une attaque à distance : 1 point par allié prévenu ; chaque allié peut dépenser 2 points pour augmenter sa couverture de 1 jusqu'à la fin du tour." },
  { nom: "Cri de ralliement", cout: "5", desc: "Combo, parlementer. Les alliés à 50 ft peuvent relancer leur initiative avec une supériorité ; un stratège peut redistribuer ses réussites." },
  { nom: "Chargez !", cout: "1+", desc: "Combo, guerroyer. 1 point par allié emmené ; ils peuvent dépenser tous leurs points restants (15 ft par point) puis guerroyer." },
  { nom: "Charge héroïque", cout: "3", desc: "Combo, guerroyer. Bonus d'une charge classique, et les 15 premiers ft ne coûtent aucun point d'action." },
  // Survie
  { nom: "Serrer les dents", cout: "2+", desc: "Réussite garantie. Hors surprise, annule une réussite de l'épreuve qui le vise par tranche de 2 points." },
  { nom: "Plein de ressources", cout: "2+", desc: "Réussite garantie lors d'une épreuve d'observation, de récolte ou de survie." },
  // Sociales
  { nom: "Charme divin", cout: "2+", desc: "Réussite garantie lors d'une épreuve de charme ou de séduction." },
  { nom: "Persuasion surnaturelle", cout: "2+", desc: "Réussite garantie lors d'une épreuve de persuasion." },
  { nom: "Langue de velours", cout: "2+", desc: "Réussite garantie lors d'une épreuve de duperie ou d'escroquerie." },
  { nom: "Compromis accablant", cout: "2+", desc: "Réussite garantie lors d'une épreuve de marchandage ou de négociation." },
  { nom: "Présence menaçante", cout: "2+", desc: "Réussite garantie lors d'une épreuve d'intimidation." },
  // Offensives
  { nom: "Frappe dévastatrice", cout: "2", desc: "Lo Me. Le combattant dépasse ses limites pour une frappe dévastatrice." },
  { nom: "Tir traversant", cout: "2", desc: "Lo Di. +1D à l'attaque ; sur un succès le projectile traverse et attaque la créature suivante avec un dé de moins." },
  { nom: "Sentinelle", cout: "2", desc: "Le Lo Di. Sans avoir utilisé son déplacement, tire sur une créature en mouvement pour un seul point d'action." },
  { nom: "Riposte insaisissable", cout: "1 + esquive", desc: "Le Di Me. Après une esquive réussie, attaque la source du danger évité." },
  { nom: "Estourbir", cout: "2+", desc: "Le Lo Me. La prochaine action de la cible perd 1D par tranche de 2 points." },
  // Défensives
  { nom: "Levée de bouclier", cout: "2+", desc: "Bou. 2 points annulent une réussite d'une attaque ou d'un choc ; cumulable sur une même source." },
  { nom: "Intervention défensive", cout: "3", desc: "Bou, combo. S'interpose avec son bouclier : +1 point de protection à un allié pour l'action en cours." },
  { nom: "Esquive", cout: "2+", desc: "Le In Lo. Lance ses dés d'esquive (+1D par 2 points) ; chaque dé annule un dé adverse de valeur égale ou inférieure." },
];

export const APTITUDES = [
  {
    cat: "Martiales",
    items: [
      { nom: "Armes légères de mêlée", carac: "SOU / PUI", desc: "+1D aux attaques par niveau, accès aux actions héroïques associées." },
      { nom: "Armes lourdes de mêlée", carac: "PUI", desc: "+1D aux attaques par niveau, actions héroïques associées." },
      { nom: "Armes légères à distance", carac: "SOU", desc: "+1D aux attaques par niveau, actions héroïques associées." },
      { nom: "Armes lourdes à distance", carac: "SOU", desc: "+1D aux attaques par niveau, actions héroïques associées." },
      { nom: "Armes de jet", carac: "SOU / PUI", desc: "+1D aux attaques avec armes de jet par niveau." },
      { nom: "Pugilat", carac: "SOU / PUI", desc: "+1D au combat à mains nues par niveau, actions héroïques de pugilat." },
    ],
  },
  {
    cat: "Furtivité & Infiltration",
    items: [
      { nom: "Camouflage", carac: "SOU", desc: "+1D aux épreuves de discrétion contre l'ouïe, la vue et l'instinct." },
      { nom: "Main légère", carac: "SOU", desc: "+1D au crochetage, déverrouillage de mécanismes, vol à la tire." },
    ],
  },
  {
    cat: "Foi",
    items: [
      { nom: "Courageux", carac: "FOI", desc: "+1D par niveau aux épreuves de courage et lors de « Serrer les dents »." },
    ],
  },
  {
    cat: "Évocation",
    items: [
      { nom: "Forge-glyphe", carac: "Flux", desc: "Appose un glyphe connu en 2 heures de travail. +1D à l'épreuve par niveau." },
    ],
  },
  {
    cat: "Physique",
    items: [
      { nom: "Athlétique", carac: "PUI", desc: "+1D par niveau aux épreuves de force brute, y compris « Serrer les dents » contre un choc ou un poids." },
      { nom: "Pied léger", carac: "SOU", desc: "+1D par niveau aux épreuves d'agilité, d'escalade, de terrains difficiles et dangereux ou d'esquive." },
      { nom: "Sang pourri", carac: "CON", desc: "+1D par niveau aux résistances aux états, poisons et maladies." },
    ],
  },
  {
    cat: "Survie & Récupération",
    items: [
      { nom: "Médecin", carac: "ESP / SOU", desc: "+1D par niveau aux guérisons et diagnostics de maladies ou empoisonnements." },
      { nom: "Observateur", carac: "Vue / Instinct", desc: "+1D par niveau aux épreuves de repérage et d'investigation." },
      { nom: "Vigilant", carac: "Vue / Ouïe / Instinct / Flux", desc: "+1D aux épreuves de vigilance ; réduit passivement les épreuves adverses de camouflage de 1 rang par niveau." },
    ],
  },
  {
    cat: "Création",
    items: [
      { nom: "Alchimiste", carac: "ESP / SOU", desc: "+1D par niveau aux fabrications alchimiques." },
      { nom: "Ingénieur", carac: "ESP / SOU", desc: "+1D par niveau à la fabrication, réparation et modification d'objets." },
    ],
  },
  {
    cat: "Connaissances",
    items: [
      { nom: "Survie", carac: "Vue / Ouïe / Instinct / Flux", desc: "+1D par niveau aux épreuves de survie : sentir le danger, reconnaître poisons et remèdes, découvrir des traces." },
      { nom: "Déduction", carac: "ESP", desc: "+1D par niveau aux codes, énigmes et déductions, y compris pour deviner la difficulté d'une épreuve." },
      { nom: "Érudition", carac: "FOI / ESP", desc: "+1D par niveau aux connaissances générales, géographiques ou politiques." },
    ],
  },
  {
    cat: "Social",
    items: [
      { nom: "Charme", carac: "SOC / SOU", desc: "+1D par niveau aux épreuves de charme ou de persuasion par le charme." },
      { nom: "Intimidation", carac: "SOC / PUI", desc: "+1D par niveau pour intimider." },
      { nom: "Négociateur", carac: "SOC / ESP", desc: "+1D par niveau à toute négociation, mercantile ou non." },
      { nom: "Persuasion", carac: "SOC / ESP / FOI", desc: "+1D par niveau pour persuader son interlocuteur." },
      { nom: "Tromperie", carac: "SOC / ESP", desc: "+1D par niveau pour tromper ses interlocuteurs ou se déguiser." },
    ],
  },
];

export const ETATS = [
  { etat: "Renversé", effet: "À terre. Se relever coûte 1 point d'action. Les attaques de mêlée contre lui gagnent un dé de supériorité." },
  { etat: "Sonné / Étourdi", effet: "Perd 2 points d'action lors de son prochain tour. Non cumulable." },
  { etat: "Terrifié", effet: "Doit utiliser tous ses points d'action pour se désengager et s'éloigner de la source." },
  { etat: "Apeuré", effet: "Doit utiliser au moins 1 point d'action pour se désengager ou s'éloigner de la source." },
  { etat: "Charmé", effet: "−2D à toutes ses épreuves contre la source." },
  { etat: "Invisible", effet: "Ne peut être détecté que par l'ouïe ou l'odorat." },
  { etat: "Empoisonné / Malade", effet: "Retire à toutes ses épreuves autant de dés que le niveau du poison ou de la maladie." },
  { etat: "Immobilisé / Pétrifié", effet: "Ne peut plus dépenser de points d'action pour se déplacer jusqu'à la fin de l'effet." },
  { etat: "Aveugle", effet: "Tous les terrains sont difficiles. −2D aux épreuves nécessitant la vue." },
  { etat: "Sourd", effet: "Aucune épreuve basée sur l'ouïe ; surpris par toute créature qu'il ne voit pas." },
  { etat: "Estropié", effet: "Double le coût en points d'action des épreuves ou actions utilisant le membre estropié." },
];

/** Dépense des points d'immersion (bonus à l'effet de base : 30 ft, magnitude simple, cible unique). */
export const IMMERSION_TABLE = [
  { cout: 1, portee: "+10 ft", magnitude: "Commune", zone: "+5 ft", duree: "+5 sec" },
  { cout: 2, portee: "+20 ft", magnitude: "Héroïque", zone: "+10 ft", duree: "+10 sec" },
  { cout: 3, portee: "+30 ft", magnitude: "Grandiose", zone: "+15 ft", duree: "+20 sec" },
  { cout: 4, portee: "+40 ft", magnitude: "Légendaire", zone: "+20 ft", duree: "+30 sec" },
  { cout: 5, portee: "+50 ft", magnitude: "Mythique", zone: "+25 ft", duree: "+1 min" },
];

/** Points d'immersion gagnés par réussite selon le TD choisi. */
export const TEMPETE_PAR_ND = [
  { nd: "Commun (4+)", points: 1 },
  { nd: "Héroïque (6+)", points: 2 },
  { nd: "Grandiose (8+)", points: 3 },
  { nd: "Légendaire (10+)", points: 4 },
  { nd: "Mythique (12+)", points: 5 },
];

/** Coût en points d'immersion d'une blessure : magnitude ≥ résilience de la cible. */
export const MAGNITUDE_DEGATS = [
  { resilience: "4 (commune)", cout: 1 },
  { resilience: "6 (héroïque)", cout: 2 },
  { resilience: "8 (grandiose)", cout: 3 },
  { resilience: "10 (légendaire)", cout: 4 },
  { resilience: "12 (mythique)", cout: 5 },
];

/** Jetons de sacrifice (tirés à la 3e blessure d'un PJ). */
export const SACRIFICES = [
  { n: 1, nom: "Mort", effet: "Le personnage trépasse de ses blessures. Autant de jetons que de joueurs présents ; ils retournent dans le sac." },
  { n: 2, nom: "Destruction d'un membre inférieur", effet: "Courage héroïque rang 1 pour rester conscient ; enjeu de groupe : stabiliser (médecine commune rang 2) avant deux tours. Déplacement 10 ft par PA, Pied léger max 2." },
  { n: 3, nom: "Destruction d'un membre supérieur", effet: "Comme ci-dessus ; interdit les armes lourdes de mêlée, Main légère max 2." },
  { n: 4, nom: "Perte d'usage temporaire d'un membre inférieur", effet: "Même effet que la destruction pendant 3D4 jours." },
  { n: 5, nom: "Perte d'usage temporaire d'un membre supérieur", effet: "Même effet que la destruction pendant 3D4 jours." },
  { n: 6, nom: "Perte d'un niveau d'aptitude", effet: "Perd un niveau dans une aptitude de niveau 2 ou plus tirée au hasard." },
  { n: 7, nom: "Diminution permanente d'un sens", effet: "1D4 (1 Vue, 2 Ouïe, 3 Flux, 4 Instinct) : −1 niveau de dé dans ce sens." },
  { n: 8, nom: "Perte temporaire d'un sens", effet: "1D4 (1 Vue, 2 Ouïe, 3 Flux, 4 Instinct) : sens perdu pendant 1D4 heures." },
  { n: 9, nom: "Phobie", effet: "Face à la source : courage TD commun rang 2, sinon enjeu personnel « fuir la confrontation »." },
  { n: 10, nom: "Destruction d'équipement", effet: "Détruit au choix le bouclier, l'armure ou l'arme portée au lieu de la blessure terrible." },
  { n: 11, nom: "Blessure visible", effet: "Supériorité aux intimidations quand elle est visible ; les autres aptitudes sociales perdent 1 niveau maximum." },
  { n: 12, nom: "Furie", effet: "Enjeu personnel : tuer une créature de son choix avant la fin du prochain round. Un seul jeton." },
];

/** Paliers de progression (points de potentiel dépensés). */
export const PALIERS = [
  { palier: "Commun", pp: 0 },
  { palier: "Héroïque", pp: 10 },
  { palier: "Grandiose", pp: 20 },
  { palier: "Légendaire", pp: 30 },
  { palier: "Mythique", pp: 40 },
];

export const GLYPHES_CONNUS = [
  { nom: "Vue", desc: "Voir à distance, dans le passé, à travers les illusions. Concept de perception." },
  { nom: "Transfert", desc: "Déplacer une qualité, une force ou un état d'une cible à une autre." },
  { nom: "Feu", desc: "Enflammer un objet, des sentiments, accélérer une combustion." },
];

export const FABRICATION_TABLE = [
  { cout: "−1", zone: "/", duree: "/", temps: "Un jour" },
  { cout: "0",  zone: "Cible unique", duree: "Instantané", temps: "Activité complète" },
  { cout: "1",  zone: "5 ft", duree: "1 minute", temps: "2 par activité complète" },
  { cout: "2",  zone: "10 ft", duree: "15 minutes", temps: "3 par activité complète" },
  { cout: "3",  zone: "15 ft", duree: "1 heure", temps: "Activité simple" },
];

export const ARMES_CATEGORIES = [
  { cat: "Légères mêlée", desc: "Rapides, à une main, précises. Utilisent PUI ou SOU.", exemples: "Épée courte, dague, rapière, masse 1M." },
  { cat: "Lourdes mêlée", desc: "Deux mains, dégâts massifs. Utilisent PUI.", exemples: "Épée à deux mains, hallebarde, hache lourde." },
  { cat: "Distance légères", desc: "Portée 50 ft. Précision.", exemples: "Arc court, arbalète légère, armes de jet." },
  { cat: "Distance lourdes", desc: "Portée 100 ft. Puissance.", exemples: "Arc long, arbalète lourde, fusil à silex." },
];

export const ARMURES_CATEGORIES = [
  { cat: "Sans armure", protection: "0", bonus: "+2D esquive", desc: "Subit autant de blessures que de réussites." },
  { cat: "Légère", protection: "1", bonus: "+1D esquive", desc: "Cuir léger, étoffes renforcées." },
  { cat: "Intermédiaire", protection: "2", bonus: "—", desc: "Maille légère, cuir clouté. Polyvalente." },
  { cat: "Lourde", protection: "3", bonus: "−2D esquive", desc: "Plaques, maille complète. Absorbe les chocs." },
];

export const OBJETS_QUALITE = [
  { type: "Outils de fabrication grande qualité", prix: "60 Argent", effet: "+1D6 à l'épreuve de fabrication." },
  { type: "Trousse de soins bien fournie", prix: "60 Argent", effet: "+1D6 aux épreuves de médecine." },
  { type: "Cape de rôdeur", prix: "60 Argent", effet: "+1D6 au camouflage (vue)." },
  { type: "Équipement d'escalade complet", prix: "60 Argent", effet: "+1D6 au pied léger (escalade)." },
  { type: "Atlas détaillé de maître cartographe", prix: "200 Argent", effet: "+1D8 aux épreuves de Scout dans la région cartographiée." },
  { type: "Arme d'artisan renommé", prix: "60 Argent", effet: "+1D6 aux attaques." },
  { type: "Arme de légende", prix: "150 Argent", effet: "+1D8 aux attaques." },
  { type: "Arme en fer-argent", prix: "1200 Argent", effet: "+1D supplémentaire à l'attaque (affecté par corps/âme)." },
  { type: "Bouclier de très bonne facture", prix: "80 Argent", effet: "Parade ne coûte qu'1 point d'héroïsme." },
  { type: "Armure en fer-argent", prix: "800 Argent", effet: "Protection lourde (3), mais comptée comme intermédiaire (sans malus)." },
];

export const FACTIONS = [
  {
    nom: "Confédération Marchande des Territoires Libres — l'Hydre",
    desc: "Organisation mercantile d'origine impériale, garante du fond monétaire des Territoires Libres depuis le traité de 1428 AE. Dirigée par un cercle de marchands élus par décennie. À l'origine de la pièce d'argent impériale.",
  },
  {
    nom: "Les Messagers",
    desc: "Culte dédié à Mort, fondé par Loyy Uhi en 678 AE. Devenu organisation d'assassins en loges indépendantes, vénérant la mort. Persécutés mais omniprésents.",
  },
  {
    nom: "L'Académie de Solstice (Sol'kerim)",
    desc: "Créée en 74 par décret impérial. Collecte, traque et formation des évocateurs. Possède 'Les Limiers', chasseurs d'évocateurs sauvages. Puissance politique majeure.",
  },
  {
    nom: "Les Tisserands",
    desc: "Culte de Destin. Recherchent les oracles porteurs du glyphe de Vue. 'Prédiction est pouvoir'. Conseillent l'Hydre en sous-main.",
  },
  {
    nom: "Le S.A.E.N.",
    desc: "Service des Actions Extérieures de Nocturne. Espionnage et formation clandestine d'évocateurs pour contrer Solstice. Soupçonné d'avoir orchestré les massacres d'évocateurs via les Messagers.",
  },
  {
    nom: "Le Gantelet",
    desc: "Culte d'Ordre. Règne en maître sur Grise-Forge depuis le coup d'État de 1425-28. A préservé la cité du chaos lors de la chute de l'Empire.",
  },
];

export const ATLAS = [
  { lieu: "Solstice", desc: "Ancienne capitale impériale, abrite l'Académie. Port fluvial sur le lac des Reflets, frontière nord Sol'Vel." },
  { lieu: "Port-Pourpre", desc: "Nommée d'après le bain de sang du soulèvement de 1426. Guerre avec Solstice un an plus tard." },
  { lieu: "Grise-Forge", desc: "Cité des fanatiques d'Ordre. Discipline rigide, sécurité absolue." },
  { lieu: "Nocturne", desc: "Cité souterraine. Avènement du premier empereur en 84 Av.E. Réseau d'espionnage paradoxal." },
  { lieu: "Plaines de Sarval", desc: "Vallons venteux à l'Est de Solstice. Accès non surveillé aux Monts Gris et au désert de soie. Kutkas sauvages." },
  { lieu: "Tir'El", desc: "Domaine médéinite des forêts. Ambassade végétale, traités commerciaux avec Solstice." },
  { lieu: "Deux-Rives, Havreclair, La Croisée", desc: "Étapes des grandes routes marchandes du Sud-Ouest et du Nord." },
  { lieu: "Grevirr", desc: "Grenier à grain. Approvisionne Solstice." },
];

export const ANNEE_DE_REFERENCE = "1527 AE (Après l'Évocation)";
