// ============================================================
// MATCHUPS AETHERIA — Données forces & faiblesses entre classes
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
  {
    classId: "artilleur-arcanique",
    roleDescription: "Tireur à distance, contrôle de zone, pression continue",
    playCasual: "Je tire vite, je tire loin, et je ne te laisse pas approcher",
    strengths: [
      { againstClassId: "arcaniste", level: "fort", note: "Interrompt les incantations longues à distance" },
      { againstClassId: "lie-demoniaque", level: "fort", note: "Empêche le contact et le build de corruption" },
    ],
    weaknesses: [
      { againstClassId: "danseur-brume", level: "tres-faible", note: "Trop mobile, esquive les tirs et engage en mêlée" },
      { againstClassId: "pugiliste", level: "faible", note: "Ferme la distance vite et met sous pression" },
    ],
  },
  {
    classId: "pugiliste",
    roleDescription: "Mêlée rapide, frappes répétées, mobilité au corps-à-corps",
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
  {
    classId: "maitre-arme",
    roleDescription: "Polyvalent en mêlée, technique pure, adaptabilité aux armes",
    playCasual: "Je m'adapte à toutes les situations avec la bonne arme",
    strengths: [
      { againstClassId: "pugiliste", level: "fort", note: "Allonge et parade contre la mêlée pure" },
      { againstClassId: "berserker", level: "fort", note: "Technique l'emporte sur la fureur brute" },
    ],
    weaknesses: [
      { againstClassId: "danseur-brume", level: "faible", note: "Difficulté à toucher une cible insaisissable" },
      { againstClassId: "artilleur-arcanique", level: "faible", note: "Souffre à distance" },
    ],
  },
  {
    classId: "berserker",
    roleDescription: "Dégâts massifs en mêlée, résistance par la rage, pression brute",
    playCasual: "Je frappe fort, je tombe pas tant que t'es pas mort",
    strengths: [
      { againstClassId: "lie-demoniaque", level: "fort", note: "Brise les transformations par la pure brutalité" },
      { againstClassId: "danseur-brume", level: "fort", note: "Résiste aux frappes rapides et punit les engagements" },
    ],
    weaknesses: [
      { againstClassId: "maitre-arme", level: "faible", note: "Technique > Fureur" },
      { againstClassId: "arcaniste", level: "tres-faible", note: "Sorts de contrôle stoppent la rage" },
    ],
  },
  {
    classId: "arcaniste",
    roleDescription: "Sorts puissants, contrôle de zone, dégâts élémentaires",
    playCasual: "Je transforme le terrain et je dicte le combat",
    strengths: [
      { againstClassId: "berserker", level: "tres-fort", note: "Contrôle annule la rage" },
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
    classId: "danseur-brume",
    roleDescription: "Insaisissable, frappes furtives, déplacements imprévisibles",
    playCasual: "Tu me vois, tu me vois plus, t'es mort",
    strengths: [
      { againstClassId: "artilleur-arcanique", level: "tres-fort", note: "Esquive les tirs et engage en mêlée" },
      { againstClassId: "maitre-arme", level: "fort", note: "Mobilité supérieure aux techniques rigides" },
    ],
    weaknesses: [
      { againstClassId: "berserker", level: "faible", note: "Résistance brute survit aux frappes furtives" },
      { againstClassId: "gardien-primordial", level: "faible", note: "Détection naturelle révèle les esquives" },
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
    classId: "lie-demoniaque",
    roleDescription: "Pacte démoniaque, transformations, dégâts à coût personnel",
    playCasual: "Plus je souffre, plus je suis dangereux",
    strengths: [
      { againstClassId: "gardien-primordial", level: "tres-fort", note: "La corruption détruit la nature" },
      { againstClassId: "arcaniste", level: "fort", note: "Résistance magique innée" },
    ],
    weaknesses: [
      { againstClassId: "berserker", level: "faible", note: "Pure brutalité brise les transformations" },
      { againstClassId: "artilleur-arcanique", level: "faible", note: "Distance empêche le build de corruption" },
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
    description: "Lié Démoniaque corrompt le Gardien, Berserker brise le Lié Démoniaque, Gardien épuise le Berserker.",
    color: "#a855f7",
    loop: ["lie-demoniaque", "gardien-primordial", "berserker", "lie-demoniaque"],
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
