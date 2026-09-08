// Glyphes V0.2 — Guerroyer : attaque, esquive, levée de bouclier, blessures.
// Sources : Module Coeur ch. Confrontations ; Module Nouvel Empire ch.
// "S'armer et se protéger".
//
// Attaque = épreuve. TD = résilience de la cible. Rang = taux de protection.
// Sans armure (protection 0) : la cible subit autant de blessures que de
// réussites. Sinon : atteindre le taux de protection inflige une blessure.

import { DieSize, DieRoll, PoolRoll, rollPool, activeDice } from "./dice";
import { difficultyFromScore } from "./difficulty";
import { CheckResult, Superiority, isSuccessDie } from "./checks";
import { ArmorCategory, CoverKey, effectiveProtection, getArmor, getCover } from "./equipment";

export interface AttackInput {
  label: string;
  attackerName?: string;
  targetName?: string;
  /** Dé de la caractéristique de combat (PUI ou SOU selon l'arme). */
  dieSize: DieSize;
  /** Niveau de l'aptitude martiale = nombre de dés. */
  aptitudeLevel: number;
  /** Supériorités : surprise, supériorité numérique, charge, action héroïque… */
  superiorities?: Superiority[];
  /** Résilience de la cible = TD de l'épreuve d'attaque. */
  targetResilience: number;
  /** Armure de la cible. */
  targetArmor: ArmorCategory | string;
  /** Couvert de la cible (attaques à distance). */
  targetCover?: CoverKey | string;
  /** Bonus de protection divers. */
  protectionBonus?: number;
}

export interface AttackResult extends CheckResult {
  attackerName?: string;
  targetName?: string;
  targetResilience: number;
  protection: number;
  /** Réussites restantes après réactions (esquive, bouclier, serrer les dents). */
  remainingSuccesses: number;
  wounds: number;
  /** Attaque impossible (couvert complet). */
  blocked: boolean;
  reactions: ReactionLog[];
}

export interface ReactionLog {
  kind: "esquive" | "levee-bouclier" | "serrer-les-dents";
  label: string;
  heroismSpent: number;
  /** Dés d'esquive lancés, le cas échéant. */
  pool?: PoolRoll;
  /** Valeurs de dés d'attaque annulés. */
  cancelledDice?: number[];
  /** Réussites annulées directement (bouclier, serrer les dents). */
  cancelledSuccesses?: number;
}

/** Calcule les blessures d'après les réussites restantes et la protection. */
export function woundsFromSuccesses(successes: number, protection: number): number {
  if (successes <= 0) return 0;
  // Sans armure : autant de blessures que de réussites.
  if (protection <= 0) return successes;
  // Armure : il faut atteindre le taux de protection pour infliger 1 blessure.
  return successes >= protection ? 1 : 0;
}

/** Lance l'épreuve d'attaque (avant réactions de la cible). */
export function resolveAttack(input: AttackInput): AttackResult {
  const cover = getCover(input.targetCover);
  const protection = effectiveProtection({
    armor: input.targetArmor,
    cover: input.targetCover,
    bonus: input.protectionBonus,
  });
  const difficulty = difficultyFromScore(input.targetResilience);
  const superiorities = input.superiorities ?? [];
  const diceRequested =
    Math.round(input.aptitudeLevel || 0) + superiorities.reduce((s, x) => s + x.dice, 0);

  const blocked = Boolean(cover.blocks);
  const pool: PoolRoll = blocked
    ? { size: input.dieSize, requested: 0, dice: [], degraded: false }
    : rollPool(diceRequested, input.dieSize);

  const successes = blocked
    ? 0
    : activeDice(pool).filter((d) => isSuccessDie(d.value, difficulty.minScore)).length;
  const rank = Math.max(1, protection || 1);

  return {
    label: input.label,
    attackerName: input.attackerName,
    targetName: input.targetName,
    difficulty,
    rank,
    pool,
    superiorities,
    diceRequested,
    successes,
    guaranteedSuccesses: 0,
    isSuccess: !blocked && successes >= rank,
    isCoupDEclat: !blocked && successes > rank,
    heroismGained: 0,
    timestamp: Date.now(),
    targetResilience: input.targetResilience,
    protection,
    remainingSuccesses: successes,
    wounds: blocked ? 0 : woundsFromSuccesses(successes, protection),
    blocked,
    reactions: [],
  };
}

/**
 * Esquive (action héroïque défensive, 2 points, +1D par 2 points supplémentaires).
 * Chaque dé d'esquive annule UN dé adverse de valeur égale ou inférieure.
 */
export function applyDodge(
  attack: AttackResult,
  opts: { dicePool: number; dieSize: DieSize; heroismSpent: number },
): AttackResult {
  const dodge = rollPool(opts.dicePool, opts.dieSize);
  const dodgeValues = activeDice(dodge)
    .map((d) => d.value)
    .sort((a, b) => b - a);

  const cancelled: number[] = [];
  const dice: DieRoll[] = attack.pool.dice.map((d) => ({ ...d }));
  // On annule en priorité les meilleurs dés adverses atteignables.
  for (const dodgeValue of dodgeValues) {
    const candidates = dice
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => !d.cancelled && !d.ignored && d.value <= dodgeValue)
      .sort((a, b) => b.d.value - a.d.value);
    if (candidates.length > 0) {
      dice[candidates[0].i].cancelled = true;
      cancelled.push(candidates[0].d.value);
    }
  }

  const pool: PoolRoll = { ...attack.pool, dice };
  const remaining = activeDice(pool).filter((d) =>
    isSuccessDie(d.value, attack.difficulty.minScore),
  ).length;

  return {
    ...attack,
    pool,
    remainingSuccesses: remaining,
    wounds: woundsFromSuccesses(remaining, attack.protection),
    isSuccess: remaining >= attack.rank,
    isCoupDEclat: remaining > attack.rank,
    reactions: [
      ...attack.reactions,
      {
        kind: "esquive",
        label: "Esquive",
        heroismSpent: opts.heroismSpent,
        pool: dodge,
        cancelledDice: cancelled,
      },
    ],
  };
}

/**
 * Levée de bouclier : 2 points d'héroïsme annulent une réussite (cumulable).
 * Serrer les dents : idem, 2 points par réussite annulée.
 */
export function cancelSuccesses(
  attack: AttackResult,
  opts: { count: number; kind: "levee-bouclier" | "serrer-les-dents" },
): AttackResult {
  const count = Math.max(0, Math.min(opts.count, attack.remainingSuccesses));
  const remaining = attack.remainingSuccesses - count;
  return {
    ...attack,
    remainingSuccesses: remaining,
    wounds: woundsFromSuccesses(remaining, attack.protection),
    isSuccess: remaining >= attack.rank,
    isCoupDEclat: remaining > attack.rank,
    reactions: [
      ...attack.reactions,
      {
        kind: opts.kind,
        label: opts.kind === "levee-bouclier" ? "Levée de bouclier" : "Serrer les dents",
        heroismSpent: count * 2,
        cancelledSuccesses: count,
      },
    ],
  };
}

/** Supériorités de combat prévues par les règles. */
export const COMBAT_SUPERIORITIES: Superiority[] = [
  { source: "Surprise", dice: 1 },
  { source: "Supériorité numérique", dice: 1 },
  { source: "Charge", dice: 1 },
  { source: "Aide d'un allié", dice: 1 },
  { source: "Objet de qualité", dice: 1 },
];

/** Blessures maximales avant conséquence (PJ : jeton de sacrifice à la 3e). */
export const PC_WOUNDS_BEFORE_SACRIFICE = 3;

export const SACRIFICES = [
  "Mort",
  "Destruction d'un membre inférieur",
  "Destruction d'un membre supérieur",
  "Perte d'usage temporaire d'un membre inférieur",
  "Perte d'usage temporaire d'un membre supérieur",
  "Perte d'un niveau d'aptitude",
  "Diminution permanente d'un sens",
  "Perte temporaire d'un sens",
  "Phobie",
  "Destruction d'équipement",
  "Blessure visible",
  "Furie",
];

/** Rendu texte d'une résolution d'attaque, pour le chat et le journal. */
export function formatAttack(result: AttackResult): string {
  if (result.blocked) return `🛡️ ${result.label} — couvert complet : attaque impossible.`;
  const dice = result.pool.dice
    .map((d) => (d.cancelled ? `~~${d.value}~~` : `${d.value}`))
    .join(" / ");
  const dodge = result.reactions.find((r) => r.kind === "esquive");
  const lines = [
    `⚔️ ${result.label} — ${result.pool.dice.length}D${result.pool.size}`,
    dice,
    `Résilience ${result.targetResilience} (TD ${result.difficulty.minScore}+) — Protection ${result.protection}`,
  ];
  if (dodge?.pool) {
    lines.push(`💨 Esquive : ${dodge.pool.dice.map((d) => d.value).join(" / ")}`);
  }
  for (const r of result.reactions.filter((x) => x.cancelledSuccesses)) {
    lines.push(`${r.label} : −${r.cancelledSuccesses} réussite(s)`);
  }
  lines.push(`${result.remainingSuccesses} réussite(s) restante(s)`);
  lines.push(result.wounds > 0 ? `🩸 ${result.wounds} blessure(s)` : "Aucune blessure");
  return lines.join("\n");
}
