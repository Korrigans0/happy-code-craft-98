// ============================================================
// MATCHUPS AETHERIA — Données forces & faiblesses entre classes
// ============================================================
// Liste officielle des classes (alignée sur src/lib/aetheria-data.ts) :
//
// Casual : guerrier, rodeur, arcaniste, gardien-primordial, pugiliste
// Avancées : maitre-lame-elementaire, danseur-brume, lie-demoniaque,
//            artilleur-arcanique, maitre-arme, exorciste
// ============================================================

export type MatchupLevel =
  | "tres-fort"
  | "fort"
  | "neutre"
  | "faible"
  | "tres-faible"
  | "special";

export interface Matchup {
  againstClassId: string;
  level: MatchupLevel;
  note?: string;
}

export interface ClassMatchupData {
  classId: string;
  roleDescription: string;
  playCasual: string;
  strengths: Matchup[];
  weaknesses: Matchup[];
  specialRelations?: Matchup[];
}

export interface MatchupLoop {
  id: string;
  label: string;
  description: string;
  color: string;
  loop: string[];
}

// ── Données de matchups par classe ──────────────────────────
export const CLASS_MATCHUPS: ClassMatchupData[] = [
  // ── CASUAL ───────────────────────────────────────────────
  {
    classId: "guerrier",
    roleDescription: "Frontline polyvalent. Tient la ligne, frappe fort, encaisse.",
    playCasual: "Je suis devant. Tant que je tiens, l'équipe tient.",
    strengths: [
      { againstClassId: "danseur-brume", level: "fort", note: "Endurance et voies multiples résistent aux frappes furtives" },
      { againstClassId: "lie-demoniaque", level: "fort", note: "Brise les transformations par la pure brutalité (Voie Berserker)" },
    ],
    weaknesses: [
      { againstClassId: "maitre-arme", level: "faible", note: "Technique pure surclasse l'efficacité brute" },
      { againstClassId: "arcaniste", level: "tres-faible", note: "Sorts de contrôle annulent la pression" },
    ],
  },
  {
    classId: "rodeur",
    roleDescription: "Hybride mêlée/distance, pisteur, expert anti-bête",
    playCasual: "Je connais ta race, je connais ton point faible, je vise.",
    strengths: [
      { againstClassId: "danseur-brume", level: "fort", note: "Pistage révèle les esquives et embuscades" },
      { againstClassId: "lie-demoniaque", level: "fort", note: "Ennemi Juré — démons : +1 dégâts garantis" },
    ],
    weaknesses: [
      { againstClassId: "arcaniste", level: "faible", note: "Difficulté à fermer la distance face au contrôle de zone" },
      { againstClassId: "maitre-lame-elementaire", level: "faible", note: "Absorbé en mêlée chargée d'élément" },
    ],
  },
  {
    classId: "arcaniste",
    roleDescription: "Sorts puissants, contrôle de zone, dégâts élémentaires",
    playCasual: "Je transforme le terrain et je dicte le combat",
    strengths: [
      { againstClassId: "guerrier", level: "tres-fort", note: "Contrôle annule la pression frontale" },
      { againstClassId: "maitre-arme", level: "fort", note: "Distance et altérations limitent l'engagement" },
    ],
    weaknesses: [
      { againstClassId: "pugiliste", level: "tres-faible", note: "Brise la concentration en mêlée" },
      { againstClassId: "artilleur-arcanique", level: "faible", note: "Interrupteur à distance" },
    ],
    specialRelations: [
      { againstClassId: "gardien-primordial", level: "special", note: "Synergie élémentaire selon les affinités partagées" },
    ],
  },
  {
    classId: "gardien-primordial",
    roleDescription: "Endurance, soins, lien avec la nature, protection d'allié",
    playCasual: "Je tiens la ligne et je soigne pendant que vous frappez",
    strengths: [
      { againstClassId: "pugiliste", level: "fort", note: "Soins et endurance épuisent l'agresseur" },
      { againstClassId: "danseur-brume", level: "fort", note: "Détection naturelle révèle l'invisible" },
    ],
    weaknesses: [
      { againstClassId: "lie-demoniaque", level: "tres-faible", note: "Corruption ronge le lien vital" },
      { againstClassId: "arcaniste", level: "faible", note: "Sorts perçants brisent les défenses" },
    ],
    specialRelations: [
      { againstClassId: "arcaniste", level: "special", note: "Synergie élémentaire selon les affinités partagées" },
    ],
  },
  {
    classId: "pugiliste",
    roleDescription: "Mêlée à mains nues, frappes répétées, mobilité au corps-à-corps",
    playCasual: "Je rentre dedans et je n'arrête plus",
    strengths: [
      { againstClassId: "artilleur-arcanique", level: "fort", note: "Engage rapidement et neutralise les tirs" },
      { againstClassId: "arcaniste", level: "tres-fort", note: "Briser la concentration des sorts" },
    ],
    weaknesses: [
      { againstClassId: "maitre-arme", level: "faible", note: "Allonge supérieure et techniques défensives" },
      { againstClassId: "gardien-primordial", level: "faible", note: "Endurance et soins gênent l'agression" },
    ],
  },

  // ── AVANCÉES ─────────────────────────────────────────────
  {
    classId: "maitre-lame-elementaire",
    roleDescription: "Mêlée magique. Lame imprégnée d'élément, combos chargés.",
    playCasual: "Ma lame coupe, brûle, gèle. Au choix.",
    strengths: [
      { againstClassId: "rodeur", level: "fort", note: "Absorbe la mêlée et inflige des dégâts élémentaires sur engagement" },
      { againstClassId: "guerrier", level: "fort", note: "Les dégâts élémentaires contournent l'armure intermédiaire" },
    ],
    weaknesses: [
      { againstClassId: "exorciste", level: "faible", note: "Le Verbe Purificateur perturbe l'infusion élémentaire" },
      { againstClassId: "artilleur-arcanique", level: "faible", note: "Souffre à distance avant de fermer le contact" },
    ],
  },
  {
    classId: "danseur-brume",
    roleDescription: "Insaisissable, frappes furtives, déplacements imprévisibles",
    playCasual: "Tu me vois, tu me vois plus, t'es mort",
    strengths: [
      { againstClassId: "artilleur-arcanique", level: "tres-fort", note: "Esquive les tirs et engage en mêlée" },
      { againstClassId: "maitre-arme", level: "fort", note: "Mobilité supérieure aux techniques rigides" },
    ],
    weaknesses: [
      { againstClassId: "guerrier", level: "faible", note: "Encaissement brut survit aux frappes furtives" },
      { againstClassId: "gardien-primordial", level: "faible", note: "Détection naturelle révèle les esquives" },
    ],
  },
  {
    classId: "lie-demoniaque",
    roleDescription: "Pacte démoniaque, transformations, dégâts à coût personnel",
    playCasual: "Plus je souffre, plus je suis dangereux",
    strengths: [
      { againstClassId: "gardien-primordial", level: "tres-fort", note: "La corruption détruit la nature" },
      { againstClassId: "arcaniste", level: "fort", note: "Résistance magique innée" },
    ],
    weaknesses: [
      { againstClassId: "exorciste", level: "tres-faible", note: "Bannissement et radiance ciblent directement la corruption" },
      { againstClassId: "guerrier", level: "faible", note: "Pure brutalité brise les transformations (Voie Berserker)" },
    ],
  },
  {
    classId: "artilleur-arcanique",
    roleDescription: "Tireur à distance, contrôle de zone, pression continue",
    playCasual: "Je tire vite, je tire loin, et je ne te laisse pas approcher",
    strengths: [
      { againstClassId: "arcaniste", level: "fort", note: "Interrompt les incantations longues à distance" },
      { againstClassId: "maitre-lame-elementaire", level: "fort", note: "Empêche le contact et neutralise l'infusion" },
    ],
    weaknesses: [
      { againstClassId: "danseur-brume", level: "tres-faible", note: "Trop mobile, esquive les tirs et engage en mêlée" },
      { againstClassId: "pugiliste", level: "faible", note: "Ferme la distance vite et met sous pression" },
    ],
  },
  {
    classId: "maitre-arme",
    roleDescription: "Polyvalent en mêlée, technique pure, adaptabilité aux armes",
    playCasual: "Je m'adapte à toutes les situations avec la bonne arme",
    strengths: [
      { againstClassId: "pugiliste", level: "fort", note: "Allonge et parade contre la mêlée pure" },
      { againstClassId: "guerrier", level: "fort", note: "Technique l'emporte sur l'efficacité brute" },
    ],
    weaknesses: [
      { againstClassId: "danseur-brume", level: "faible", note: "Difficulté à toucher une cible insaisissable" },
      { againstClassId: "artilleur-arcanique", level: "faible", note: "Souffre à distance" },
    ],
  },
  {
    classId: "exorciste",
    roleDescription: "Anti-corruption, dégâts radiants, soutien sacré",
    playCasual: "Je purifie, je bannis, je soigne. Dans cet ordre.",
    strengths: [
      { againstClassId: "lie-demoniaque", level: "tres-fort", note: "Counter direct : Verbe Purificateur réduit la Corruption" },
      { againstClassId: "maitre-lame-elementaire", level: "fort", note: "La purification dissipe l'infusion élémentaire" },
    ],
    weaknesses: [
      { againstClassId: "danseur-brume", level: "faible", note: "Difficulté à cibler une menace insaisissable" },
      { againstClassId: "artilleur-arcanique", level: "faible", note: "Souffre à distance avant de pouvoir bannir" },
    ],
    specialRelations: [
      { againstClassId: "gardien-primordial", level: "special", note: "Soutiens sacrés complémentaires : protection physique + spirituelle" },
    ],
  },
];

// ── Boucles de matchups (style pierre-feuille-ciseaux) ──────
export const MATCHUP_LOOPS: MatchupLoop[] = [
  {
    id: "triangle-mele",
    label: "Triangle de la Mêlée",
    description: "Pugiliste rentre sur l'Arcaniste, Maître d'Arme contre le Pugiliste, Arcaniste contrôle le Maître d'Arme.",
    color: "#f59e0b",
    loop: ["pugiliste", "arcaniste", "maitre-arme", "pugiliste"],
  },
  {
    id: "triangle-distance",
    label: "Triangle de la Distance",
    description: "L'Artilleur écrase l'Arcaniste, le Danseur de Brume neutralise l'Artilleur, l'Arcaniste contrôle le Danseur.",
    color: "#3b82f6",
    loop: ["artilleur-arcanique", "arcaniste", "danseur-brume", "artilleur-arcanique"],
  },
  {
    id: "triangle-spirituel",
    label: "Triangle Spirituel",
    description: "Lié Démoniaque corrompt le Gardien, Exorciste bannit le Lié Démoniaque, Gardien protège l'Exorciste.",
    color: "#a855f7",
    loop: ["lie-demoniaque", "gardien-primordial", "exorciste", "lie-demoniaque"],
  },
  {
    id: "triangle-martial",
    label: "Triangle Martial",
    description: "Guerrier brise le Danseur, Maître d'Arme surclasse le Guerrier, Danseur de Brume contourne le Maître d'Arme.",
    color: "#84cc16",
    loop: ["guerrier", "danseur-brume", "maitre-arme", "guerrier"],
  },
];

// ── Helpers ─────────────────────────────────────────────────
export function getMatchupData(classId: string): ClassMatchupData | undefined {
  return CLASS_MATCHUPS.find(m => m.classId === classId);
}

export function getMatchupBetween(
  fromClassId: string,
  toClassId: string,
): Matchup | undefined {
  const data = getMatchupData(fromClassId);
  if (!data) return undefined;
  return (
    data.strengths.find(m => m.againstClassId === toClassId) ||
    data.weaknesses.find(m => m.againstClassId === toClassId) ||
    data.specialRelations?.find(m => m.againstClassId === toClassId)
  );
}

export function getMatchupColor(level: MatchupLevel): string {
  switch (level) {
    case "tres-fort": return "#10b981";
    case "fort": return "#84cc16";
    case "neutre": return "#94a3b8";
    case "faible": return "#f97316";
    case "tres-faible": return "#ef4444";
    case "special": return "#a855f7";
  }
}

export function getMatchupLabel(level: MatchupLevel): string {
  switch (level) {
    case "tres-fort": return "Très fort";
    case "fort": return "Fort";
    case "neutre": return "Neutre";
    case "faible": return "Faible";
    case "tres-faible": return "Très faible";
    case "special": return "Spécial";
  }
}
