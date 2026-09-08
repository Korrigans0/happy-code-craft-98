// Glyphes V0.2 — Points d'action, déplacement, charge, désengagement.
// Source : Module Coeur, ch. Confrontations ("Agir", "Se déplacer en confrontation").

import { DieSize } from "./dice";
import { CheckResult, resolveCheck, Superiority } from "./checks";
import { difficultyFromScore } from "./difficulty";

/** Au début de son tour, le personnage reçoit 4 points d'action. */
export const ACTION_POINTS_PER_TURN = 4;

/** Un mouvement coûte 1 point pour 15 ft. */
export const MOVE_FT_PER_POINT = 15;

/** Approche choisie pour le tour : une seule par tour. */
export type Approach = "parlementer" | "guerroyer";

export type ActionKey =
  | "parlementer"
  | "deplacement"
  | "objet"
  | "attaque"
  | "desengagement"
  | "escalade"
  | "charge"
  | "attente";

export interface ActionDef {
  key: ActionKey;
  label: string;
  icon: string;
  /** Coût en points d'action (null = variable / calculé). */
  cost: number | null;
  approach?: Approach;
  hint: string;
}

export const ACTIONS: ActionDef[] = [
  {
    key: "parlementer",
    label: "Parlementer",
    icon: "🗣️",
    cost: 0,
    approach: "parlementer",
    hint: "Épreuve sociale gratuite ; le personnage peut se déplacer à sa guise.",
  },
  {
    key: "deplacement",
    label: "Se déplacer (15 ft)",
    icon: "🏃",
    cost: 1,
    hint: "1 point par tranche de 15 ft. Le déplacement peut être fragmenté.",
  },
  { key: "objet", label: "Donner / prendre / activer un objet", icon: "🎒", cost: 1, hint: "1 point d'action." },
  {
    key: "attaque",
    label: "Attaquer",
    icon: "⚔️",
    cost: 2,
    approach: "guerroyer",
    hint: "Épreuve d'attaque : TD = résilience de la cible, rang = taux de protection.",
  },
  {
    key: "desengagement",
    label: "Se désengager",
    icon: "↩️",
    cost: 1,
    hint: "Épreuve de souplesse ; TD = score max du dé de souplesse de l'adversaire.",
  },
  {
    key: "escalade",
    label: "Escalader un obstacle",
    icon: "🧗",
    cost: 1,
    hint: "1 point si l'obstacle est aussi haut ou plus haut que la créature, sinon gratuit.",
  },
  {
    key: "charge",
    label: "Charger",
    icon: "💨",
    cost: null,
    approach: "guerroyer",
    hint: "15 ft minimum en ligne droite + attaque ou mise à terre, avec supériorité.",
  },
  { key: "attente", label: "Attendre / observer", icon: "⏳", cost: 0, hint: "Le personnage garde ses points pour plus tard." },
];

export function getAction(key: ActionKey): ActionDef {
  return ACTIONS.find((a) => a.key === key) ?? ACTIONS[0];
}

/** Coût d'un déplacement en pieds. */
export function movementCost(distanceFt: number, ftPerPoint = MOVE_FT_PER_POINT): number {
  return Math.ceil(Math.max(0, distanceFt) / ftPerPoint);
}

/** Distance parcourable avec les points restants. */
export function movementRange(points: number, ftPerPoint = MOVE_FT_PER_POINT): number {
  return Math.max(0, points) * ftPerPoint;
}

// ── Charge ────────────────────────────────────────────────────────────────

export interface ChargeCheck {
  distanceFt: number;
  straightLine: boolean;
  /** Coût total = déplacement + attaque / mise à terre. */
  totalCost: number;
  valid: boolean;
  reasons: string[];
  superiority: Superiority;
}

export function evaluateCharge(opts: {
  distanceFt: number;
  straightLine: boolean;
  attackCost?: number;
  ftPerPoint?: number;
  /** Action héroïque "Charge héroïque" : 15 premiers ft gratuits. */
  heroicCharge?: boolean;
}): ChargeCheck {
  const ftPerPoint = opts.ftPerPoint ?? MOVE_FT_PER_POINT;
  const reasons: string[] = [];
  if (opts.distanceFt < 15) reasons.push("La charge exige au moins 15 ft parcourus.");
  if (!opts.straightLine) reasons.push("La charge doit se faire en ligne droite.");
  const billable = opts.heroicCharge ? Math.max(0, opts.distanceFt - 15) : opts.distanceFt;
  const totalCost = movementCost(billable, ftPerPoint) + (opts.attackCost ?? 2);
  return {
    distanceFt: opts.distanceFt,
    straightLine: opts.straightLine,
    totalCost,
    valid: reasons.length === 0,
    reasons,
    superiority: { source: "Charge", dice: 1 },
  };
}

// ── Désengagement ─────────────────────────────────────────────────────────

export interface DisengageResult {
  check: CheckResult;
  /** Coût du désengagement lui-même. */
  cost: number;
  /** Options offertes en cas d'échec (règles du module coeur). */
  failureOptions: string[];
}

export function resolveDisengage(opts: {
  souplesseDie: DieSize;
  aptitudeLevel: number;
  /** Score maximal du dé de souplesse de l'adversaire = TD. */
  enemySouplesseMax: number;
  superiorities?: Superiority[];
  spentHeroismThisTurn?: boolean;
}): DisengageResult {
  const check = resolveCheck({
    label: "Désengagement (Souplesse)",
    dieSize: opts.souplesseDie,
    aptitudeLevel: opts.aptitudeLevel,
    difficulty: difficultyFromScore(opts.enemySouplesseMax),
    rank: 1,
    superiorities: opts.superiorities,
    spentHeroismThisTurn: opts.spentHeroismThisTurn,
  });
  return {
    check,
    cost: 1,
    failureOptions: [
      "Rester au contact sans subir d'effet.",
      "Quitter le contact et subir une attaque de l'adversaire (1 point d'action pour lui).",
    ],
  };
}

// ── État de tour d'un participant ─────────────────────────────────────────

export interface TurnState {
  actionPoints: number;
  maxActionPoints: number;
  approach: Approach | null;
  /** Interdit de gagner de l'héroïsme sur un tour où l'on en a dépensé. */
  spentHeroismThisTurn: boolean;
  movedFt: number;
}

export function startTurn(max = ACTION_POINTS_PER_TURN): TurnState {
  return {
    actionPoints: max,
    maxActionPoints: max,
    approach: null,
    spentHeroismThisTurn: false,
    movedFt: 0,
  };
}

export function spendActionPoints(state: TurnState, cost: number): { state: TurnState; ok: boolean; error?: string } {
  if (cost > state.actionPoints) {
    return { state, ok: false, error: `Points d'action insuffisants (${state.actionPoints} restant).` };
  }
  return { state: { ...state, actionPoints: state.actionPoints - cost }, ok: true };
}

export function setApproach(state: TurnState, approach: Approach): { state: TurnState; ok: boolean; error?: string } {
  if (state.approach && state.approach !== approach) {
    return { state, ok: false, error: "Une seule approche par tour : elle pourra changer au prochain tour." };
  }
  return { state: { ...state, approach }, ok: true };
}
