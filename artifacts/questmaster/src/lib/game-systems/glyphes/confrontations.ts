// Glyphes V0.2 — Confrontations (Module Coeur, ch. Confrontations).
// Une confrontation se joue par rounds, avec un ENJEU clair de chaque camp.
// La victoire dépend de l'enjeu, jamais du seul décompte des blessures.

import { DieSize } from "./dice";
import { CheckResult, resolveCheck } from "./checks";
import { Approach, ACTION_POINTS_PER_TURN } from "./actions";
import { VICTORY_HEROISM } from "./heroic-actions";

export type StakeKey =
  | "convaincre"
  | "tenir-proteger"
  | "effrayer"
  | "derober"
  | "distraire"
  | "neutraliser"
  | "personnalise";

export const STAKES: { key: StakeKey; label: string; description: string }[] = [
  { key: "convaincre", label: "Convaincre", description: "Persuasion, tromperie, marchandage ou démonstration de force." },
  { key: "tenir-proteger", label: "Tenir / Protéger", description: "Tenir une position, protéger un lieu ou garder quelqu'un en vie." },
  { key: "effrayer", label: "Effrayer / Mettre en déroute", description: "Malice ou démonstration de force disproportionnée." },
  { key: "derober", label: "Dérober / Acquérir", description: "Discrétion ou action éclair coordonnée." },
  { key: "distraire", label: "Distraire", description: "Faire diversion, séduire, organiser un faux duel." },
  { key: "neutraliser", label: "Neutraliser", description: "Mettre l'adversaire hors d'état, létalement ou non." },
  { key: "personnalise", label: "Enjeu personnalisé", description: "Défini librement par le camp qui initie la confrontation." },
];

export type ConfrontationOutcome = "en-cours" | "victoire" | "defaite" | "nulle";

export interface Stake {
  key: StakeKey;
  /** Formulation précise donnée par le camp. */
  text: string;
  /** Enjeu adverse dissimulé par le MJ tant qu'il n'est pas découvert. */
  hidden?: boolean;
  /** Enjeu imposé par le MJ : victoire ou défaite automatique. */
  imposed?: boolean;
  fulfilled?: boolean | null;
}

export interface Confrontation {
  id: string;
  name: string;
  round: number;
  /** Enjeu du camp des joueurs. */
  playerStake: Stake | null;
  /** Enjeu du camp adverse. */
  opponentStake: Stake | null;
  outcome: ConfrontationOutcome;
  /** Participants et état de leur tour. */
  participants: ConfrontationParticipant[];
  activeParticipantId?: string;
  createdAt: number;
}

export interface ConfrontationParticipant {
  id: string;
  name: string;
  side: "joueurs" | "adversaires";
  tokenId?: string;
  characterId?: string;
  /** Résultat de l'épreuve d'instinct (ordre de jeu). */
  instinctSuccess: boolean;
  actionPoints: number;
  maxActionPoints: number;
  approach: Approach | null;
  heroism: number;
  wounds: number;
  maxWounds: number;
  resilience: number;
  armor: string;
  hasShield?: boolean;
  spentHeroismThisTurn: boolean;
  movedFt: number;
  surprised?: boolean;
}

export function createConfrontation(name: string): Confrontation {
  return {
    id: crypto.randomUUID(),
    name: name || "Confrontation",
    round: 1,
    playerStake: null,
    opponentStake: null,
    outcome: "en-cours",
    participants: [],
    createdAt: Date.now(),
  };
}

/**
 * Ordre de jeu : épreuve d'instinct au début de la confrontation (TD commun,
 * rang 1 par défaut). Une réussite place le personnage AVANT les adversaires.
 * La surprise inflige un échec automatique.
 */
export function rollInitiativeOrder(opts: {
  name: string;
  instinctDie: DieSize;
  aptitudeLevel: number;
  surprised?: boolean;
  rank?: number;
}): { check: CheckResult | null; success: boolean } {
  if (opts.surprised) return { check: null, success: false };
  const check = resolveCheck({
    label: `Ordre de jeu — Instinct (${opts.name})`,
    dieSize: opts.instinctDie,
    aptitudeLevel: opts.aptitudeLevel,
    difficulty: "commun",
    rank: opts.rank ?? 1,
  });
  return { check, success: check.isSuccess };
}

/** Tri : réussites d'instinct d'abord, puis les adversaires, puis les échecs. */
export function orderParticipants(list: ConfrontationParticipant[]): ConfrontationParticipant[] {
  const weight = (p: ConfrontationParticipant) => {
    if (p.side === "joueurs") return p.instinctSuccess ? 0 : 2;
    return 1;
  };
  return [...list].sort((a, b) => weight(a) - weight(b));
}

/** Nouveau round : tout le monde récupère ses points d'action. */
export function nextRound(conf: Confrontation): Confrontation {
  return {
    ...conf,
    round: conf.round + 1,
    participants: conf.participants.map((p) => ({
      ...p,
      actionPoints: p.maxActionPoints || ACTION_POINTS_PER_TURN,
      approach: null,
      spentHeroismThisTurn: false,
      movedFt: 0,
      surprised: false,
    })),
  };
}

/**
 * Résolution de la confrontation par les enjeux.
 * - Victoire : enjeu rempli (ou retrait de l'adversaire) → +5 héroïsme chacun.
 * - Défaite : enjeu intenable → les participants perdent tout leur héroïsme.
 * - Nulle : les deux camps échouent → aucun effet mécanique.
 */
export function resolveConfrontation(conf: Confrontation, outcome: ConfrontationOutcome): Confrontation {
  const participants = conf.participants.map((p) => {
    if (p.side !== "joueurs") return p;
    if (outcome === "victoire") return { ...p, heroism: Math.min(5, p.heroism + VICTORY_HEROISM) };
    if (outcome === "defaite") return { ...p, heroism: 0 };
    return p;
  });
  return { ...conf, outcome, participants };
}

/** Déduction automatique de l'issue à partir des enjeux renseignés. */
export function deriveOutcome(conf: Confrontation): ConfrontationOutcome {
  const player = conf.playerStake;
  const opponent = conf.opponentStake;
  if (player?.imposed && player.fulfilled === true) return "victoire";
  if (player?.imposed && player.fulfilled === false) return "defaite";
  if (player?.fulfilled === true) return "victoire";
  if (player?.fulfilled === false && opponent?.fulfilled === false) return "nulle";
  if (player?.fulfilled === false) return "defaite";
  return "en-cours";
}

export const OUTCOME_LABELS: Record<ConfrontationOutcome, string> = {
  "en-cours": "En cours",
  victoire: "Victoire — +5 points d'héroïsme pour chaque participant",
  defaite: "Défaite — perte de tous les points d'héroïsme",
  nulle: "Confrontation nulle — aucun effet mécanique",
};
