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
  { rang: "I", ajout: "Sans ajout — épreuve standard." },
  { rang: "II+", ajout: "Ajout modéré — rang ≈ moitié du niveau d'aptitude." },
  { rang: "III+", ajout: "Ajout conséquent — rang > moitié du niveau d'aptitude." },
];

export const RICHESSES = [
  { piece: "Bronze", taux: "Unité de base" },
  { piece: "Argent", taux: "10 Bronze = 1 Argent" },
  { piece: "Perle de Brume", taux: "1 Brume = 100 Argent" },
  { piece: "Rubis", taux: "1 Rubis = 250 Argent" },
  { piece: "Saphir", taux: "1 Saphir = 500 Argent" },
];

export const SENS = [
  { sens: "Vue", formule: "le plus bas entre ESP et CON" },
  { sens: "Ouïe", formule: "le plus bas entre ESP et CON" },
  { sens: "Instinct", formule: "le plus bas entre ESP et FOI" },
  { sens: "Flux", formule: "ESP − 1 niveau" },
];

export const DONS = [
  {
    cat: "Martiaux",
    items: [
      { nom: "Stratège", desc: "Le personnage offre ses propres réussites à l'épreuve d'initiative à une ou plusieurs créatures consentantes." },
      { nom: "Écorcheur", desc: "Sur un succès d'attaque mêlée, force la cible à tirer un jeton de sacrifice." },
      { nom: "Combattant", desc: "Sur un coup d'éclat à l'attaque, le coût de l'attaque est réduit d'un point d'action." },
    ],
  },
  {
    cat: "Foi",
    items: [
      { nom: "Fidèle compagnon", desc: "Compagnon loyal (non-combattant) : 1 aptitude niveau 4, 1 niveau 2, D4 partout sauf 1 caractéristique en D6." },
      { nom: "Courage radiant", desc: "Offre ses propres réussites de courage / résistance à la peur à des alliés consentants." },
      { nom: "Choisi", desc: "Change la caractéristique de référence de deux aptitudes en Foi. Peut lier un autre don à la Foi." },
    ],
  },
  {
    cat: "Survie",
    items: [
      { nom: "Toujours prêt", desc: "Commence chaque journée avec deux ingrédients supplémentaires dans son inventaire." },
    ],
  },
  {
    cat: "Esprit",
    items: [
      { nom: "Évocateur officiel", desc: "Cursus reconnu. Peut évoquer via la table d'immersion. Statut risqué hors zone d'influence." },
      { nom: "Évocateur sauvage", desc: "Évoque avec 2D d'immersion (meilleur dé), mais déclenche les événements de flux. Pourchassé s'il est démasqué." },
      { nom: "Marqué", desc: "Personne portant un glyphe. Peut évoquer ce glyphe. Choisit Foi ou Esprit comme caractéristique d'évocation." },
      { nom: "Araignée", desc: "Perçoit les liens du flux. Peut transférer points de corps/âme entre deux créatures consentantes." },
      { nom: "Rêveur", desc: "Mange-songe qui matérialise un compagnon (rêve doux) ou un cauchemar de combat (rêve cauchemar) selon le repos complet." },
    ],
  },
  {
    cat: "Social",
    items: [
      { nom: "Visage", desc: "Utilise la moitié des niveaux d'une autre aptitude sociale en remplacement d'une qu'il ne possède pas." },
    ],
  },
  {
    cat: "Érudition",
    items: [
      { nom: "Linguiste", desc: "Maîtrise Sylvain, commun, Brume-langue. Peut échanger une langue contre la langue des signes." },
      { nom: "Expert en créatures", desc: "Information gratuite sur créature commune ou déjà rencontrée ; épreuve d'instinct pour les rares." },
    ],
  },
  {
    cat: "Mouvement",
    items: [
      { nom: "Insaisissable", desc: "Se désengage gratuitement d'un corps-à-corps." },
    ],
  },
];

export const RACES = [
  {
    nom: "Humain",
    desc: "Habitants principaux des cités libres du Sud. Bâtisseurs, chercheurs, assoiffés de glyphes.",
    traits: [
      "Polyvalent : 1 niveau d'aptitude supplémentaire à la création.",
      "1 niveau de dé dans deux caractéristiques au choix.",
    ],
  },
  {
    nom: "Gourmet",
    desc: "Humains mutants capables d'absorber les capacités d'une créature dévorée. Se fondent dans la masse.",
    traits: [
      "Absorption d'aptitude : commence avec 2 niveaux seulement, peut absorber 2 niveaux supplémentaires en consommant une créature.",
      "1 niveau de dé dans deux caractéristiques au choix.",
    ],
  },
  {
    nom: "Arboreïde (Médéinite)",
    desc: "Créature végétale, sage et longévité hors norme. Habitants principaux de Tir'El.",
    traits: [
      "Langues : Sylvestre, commun.",
      "Prendre racine : se reposer 1h enraciné soigne une blessure.",
      "Endurant : 1 niveau de dé en CON ou FOI, et 1 dans une autre caractéristique au choix.",
    ],
  },
  {
    nom: "Fée (Médéinite)",
    desc: "Petite créature ailée à la peau d'écorce, en communion avec la nature.",
    traits: [
      "Langues : Sylvestre, commun.",
      "Vol : ignore les terrains difficiles et dangereux.",
      "Communion sylvestre : ne peut être surprise en environnement naturel.",
      "Vive et maligne : 1 niveau de dé en ESP ou SOU, et 1 dans une autre caractéristique.",
    ],
  },
  {
    nom: "Ombre",
    desc: "Créature des mers de brumes, peau pâle, yeux d'encre, odeur sucrée envoûtante.",
    traits: [
      "Vision nocturne, 1D d'ouïe supplémentaire.",
      "Langues : Brume-langue, commun.",
      "Danse des brumes : pour 1 PA, test de souplesse pour se dissimuler ; invisible dans le brouillard.",
      "Discret et endurant : 1 niveau de dé en SOU ou CON, et 1 dans une autre caractéristique.",
    ],
  },
  {
    nom: "Hybride — Cervidé",
    desc: "Hybride à bois de cerf, vision crépusculaire et âme puissante.",
    traits: [
      "Vision dans la pénombre, 1D d'instinct supplémentaire.",
      "Âme puissante : 1 niveau de dé en ESP ou FOI, et 1 dans une autre caractéristique.",
    ],
  },
  {
    nom: "Hybride — Lycan",
    desc: "L'hybride le plus répandu. Tacticien de meute, fiable et respecté.",
    traits: [
      "Vision dans la pénombre, 1D de vue supplémentaire.",
      "Crocs : comptés comme arme de pugilat.",
      "Étreinte mortelle : +1D pour restreindre une créature de taille G max.",
      "Féroce et fiable : 1 niveau de dé en PUI ou FOI, et 1 dans une autre caractéristique.",
    ],
  },
  {
    nom: "Hybride — Ursidé",
    desc: "Nomade, massif, doté d'un rite de passage : la quête du nom.",
    traits: [
      "Aura de menace : commence avec 1 niveau d'intimidation ou de courage.",
      "Dangerosité incarnée : poings comptés comme armes bâtardes, crocs comme arme de pugilat.",
      "Puissant : 1 niveau de dé en PUI ou CON, et 1 dans une autre caractéristique.",
    ],
  },
  {
    nom: "Hybride — Félin",
    desc: "Pupilles fendues, canines acérées, griffes et instinct félin.",
    traits: [
      "Vision nocturne, 1D de vue supplémentaire.",
      "Griffes acérées : armes légères ou de pugilat.",
      "Pisteur agile : 1 niveau de dé en SOU ou ESP, et 1 dans une autre caractéristique.",
    ],
  },
];

export const ACTIONS_HEROIQUES = [
  { nom: "Charge héroïque", cout: 3, desc: "Annule le coût de la charge en points d'action." },
  { nom: "Charme divin", cout: 2, desc: "Annule une réussite de résistance lors d'une tentative de séduction/charme." },
  { nom: "Cri de Ralliement", cout: 4, desc: "Alliés à 50 ft relancent l'initiative avec supériorité." },
  { nom: "Inspiration Héroïque", cout: 4, desc: "Accorde son niveau d'aptitude à une autre créature." },
  { nom: "La Mort Attendra", cout: 5, desc: "Tient 1 minute après une blessure mortelle. Tombe à la fin du combat." },
  { nom: "Persuasion surnaturelle", cout: 2, desc: "Annule une réussite de résistance lors d'une persuasion." },
  { nom: "Présence Menaçante", cout: 2, desc: "Annule une réussite de résistance lors d'une intimidation." },
  { nom: "Vitesse Monstrueuse", cout: 2, desc: "+10 ft de vitesse, réussit le désengagement automatiquement." },
  { nom: "Serrer les dents", cout: 2, desc: "Annule 1 réussite ennemie par 2 points dépensés (hors surprise)." },
  { nom: "Frappe dévastatrice", cout: 2, desc: "Armes lourdes mêlée : +1D à l'attaque par 2 points." },
  { nom: "Riposte Insaisissable", cout: 3, desc: "Sur une esquive réussie, inflige une riposte (armes légères/distance/mêlée)." },
  { nom: "Estourbir", cout: 2, desc: "Diminue la prochaine action de la cible d'1D par 2 points dépensés." },
  { nom: "Sentinelle", cout: 2, desc: "Tire sur une cible mouvante avec 1 PA si pas de déplacement utilisé." },
  { nom: "Levée de bouclier", cout: 2, desc: "Annule 1 réussite d'attaque ou de choc subi (cumulable)." },
  { nom: "Esquive", cout: 2, desc: "Lance ses dés d'esquive ; +1D pour 2 points supplémentaires." },
];

export const APTITUDES = [
  {
    cat: "Martiales",
    items: [
      { nom: "Armes légères de mêlée", carac: "SOU / PUI", desc: "+1D aux attaques par niveau, accès aux actions héroïques associées." },
      { nom: "Armes lourdes de mêlée", carac: "PUI", desc: "+1D aux attaques par niveau, actions héroïques associées." },
      { nom: "Armes légères à distance", carac: "SOU", desc: "+1D aux attaques par niveau." },
      { nom: "Armes lourdes à distance", carac: "SOU", desc: "+1D aux attaques par niveau." },
      { nom: "Armes de jets", carac: "SOU / PUI", desc: "+1D aux attaques avec armes de jet." },
      { nom: "Pugilat", carac: "SOU / PUI", desc: "+1D au combat à mains nues, actions héroïques de pugilat." },
    ],
  },
  {
    cat: "Furtivité & Infiltration",
    items: [
      { nom: "Camouflage", carac: "SOU", desc: "+1D aux épreuves de discrétion contre ouïe, vue, instinct." },
      { nom: "Main légère", carac: "SOU", desc: "+1D au crochetage, déverrouillage, vol à la tire." },
    ],
  },
  {
    cat: "Foi",
    items: [
      { nom: "Courageux", carac: "FOI", desc: "+1D aux épreuves de courage et à 'Serrer les dents'." },
    ],
  },
  {
    cat: "Évocation",
    items: [
      { nom: "Forge-glyphe", carac: "Flux", desc: "Appose un glyphe connu en 2h. +1D à l'épreuve par niveau." },
    ],
  },
  {
    cat: "Physique",
    items: [
      { nom: "Athlétique", carac: "PUI", desc: "+1D aux épreuves de force brute et 'Serrer les dents' physique." },
      { nom: "Pied léger", carac: "SOU", desc: "+1D agilité, escalade, terrains difficiles, esquive." },
      { nom: "Sang pourri", carac: "CON", desc: "+1D contre poisons, maladies, effets chimiques." },
    ],
  },
  {
    cat: "Survie & Récupération",
    items: [
      { nom: "Médecin", carac: "ESP / SOU", desc: "+1D aux guérisons et diagnostics." },
      { nom: "Scout", carac: "Instinct", desc: "+1D au repérage, accès cachés, détection des dangers et zones sûres." },
      { nom: "Vigilant", carac: "Vue / Ouïe", desc: "+1D aux épreuves de vigilance, réduit de 1D les épreuves adverses de camouflage." },
    ],
  },
  {
    cat: "Création",
    items: [
      { nom: "Alchimiste", carac: "ESP / SOU", desc: "+1D aux fabrications alchimiques." },
      { nom: "Ingénieur", carac: "ESP / SOU", desc: "+1D à la fabrication, réparation et modification d'objets." },
    ],
  },
  {
    cat: "Connaissances",
    items: [
      { nom: "Botanique", carac: "ESP", desc: "+1D aux récoltes et reconnaissance des plantes." },
      { nom: "Déduction", carac: "ESP", desc: "+1D aux énigmes, codes, déduction de difficulté." },
      { nom: "Érudition", carac: "FOI / ESP", desc: "+1D aux connaissances générales, géographiques, politiques." },
      { nom: "Traqueur", carac: "ESP", desc: "+1D au pistage et à la dissimulation des traces." },
    ],
  },
  {
    cat: "Social",
    items: [
      { nom: "Charme", carac: "SOC / SOU", desc: "+1D aux épreuves de charme et persuasion par le charme." },
      { nom: "Intimidation", carac: "SOC / PUI", desc: "+1D pour intimider." },
      { nom: "Négociateur", carac: "SOC / ESP", desc: "+1D aux négociations mercantiles ou non." },
      { nom: "Persuasion", carac: "SOC / ESP / FOI", desc: "+1D pour persuader." },
      { nom: "Tromperie", carac: "SOC / ESP", desc: "+1D pour tromper sur ses intentions, déguisement." },
    ],
  },
];

export const ETATS = [
  { etat: "Renversé", effet: "Au sol. Se relever coûte 1 PA. Attaques mêlée contre lui en supériorité." },
  { etat: "Sonné", effet: "Perd 1 PA et ne peut pas réagir au prochain tour." },
  { etat: "Empoisonné", effet: "Subit des dégâts récurrents ou −1D aux épreuves selon le poison." },
  { etat: "Immobilisé", effet: "Ne peut plus se déplacer. Action 'se libérer' contre la source." },
  { etat: "Apeuré", effet: "−1D aux épreuves face à la source de peur." },
  { etat: "Terrifié", effet: "Fuit la source. Ne peut s'en approcher volontairement." },
  { etat: "Charmé", effet: "Considère la source comme un allié. Ne peut l'attaquer directement." },
  { etat: "Invisible", effet: "Indétectable par la vue. Attaques en supériorité." },
  { etat: "Aveugle", effet: "Échoue les épreuves dépendant de la vue. Attaques en infériorité." },
  { etat: "Sourd", effet: "Échoue les épreuves d'ouïe. Désavantage à percevoir les sons." },
  { etat: "Estropié", effet: "Membre hors d'usage. Réduit le mouvement ou empêche une action liée." },
];

export const IMMERSION_TABLE = [
  { cout: 0,  portee: "Contact", magnitude: "Mineure",     zone: "Cible unique" },
  { cout: 2,  portee: "10 ft",   magnitude: "Simple",      zone: "5 ft" },
  { cout: 4,  portee: "20 ft",   magnitude: "Commune",     zone: "10 ft" },
  { cout: 6,  portee: "30 ft",   magnitude: "Héroïque",    zone: "15 ft" },
  { cout: 8,  portee: "40 ft",   magnitude: "Grandiose",   zone: "20 ft" },
  { cout: 10, portee: "50 ft",   magnitude: "Légendaire",  zone: "25 ft" },
  { cout: 12, portee: "60 ft",   magnitude: "Mythique",    zone: "30 ft" },
];

export const TEMPETE_PAR_ND = [
  { nd: "Commun", tempete: 1 },
  { nd: "Héroïque", tempete: 2 },
  { nd: "Grandiose", tempete: 3 },
  { nd: "Légendaire", tempete: 4 },
  { nd: "Mythique", tempete: 5 },
];

export const MAGNITUDE_DEGATS = [
  { resilience: 4, cout: 2 },
  { resilience: 6, cout: 4 },
  { resilience: 8, cout: 6 },
  { resilience: 10, cout: 8 },
  { resilience: 12, cout: 10 },
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
