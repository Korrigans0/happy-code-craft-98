// Glyphes V0.2 — Résolution du combat : attaque, réactions, esquive, blessures.
// Sources : Module Coeur (ch. Confrontations / Combat) et Module Nouvel Empire
// (ch. Se protéger).
//
// ⚠️ Aucune notion de "jet d'attaque contre CA" : l'attaque est une ÉPREUVE
// dont le TD est la RÉSILIENCE de la cible et le rang son TAUX DE PROTECTION.

import { DieSize, DieRoll, rollPool, activeDice } from "./dice";
import { difficultyFromScore } from "./difficulty";
import { CheckResult, resolveCheck, Superiority } from "./checks";
import { ArmorCategory, getArmor, dodgeDicePool } from "./equipment";

export interface AttackInput {
  attackerName: string;
  targetName: string;
  /** Libellé de l'arme utilisée. */
  weaponLabel: string;
  /** Taille du dé de la caractéristique liée (PUI ou SOU selon l'arme). */
  dieSize: DieSize;
  /** Niveau d'aptitude martiale = nombre de dés. */
  aptitudeLevel: number;
  /** Résilience de la cible → score minimal de chaque dé (TD). */
  targetResilience: number;
  /** Taux de protection de la cible → rang (réussites nécessaires). */
  targetArmor: ArmorCategory | string;
  /** Protection explicite si elle diffère de la catégorie d'armure. */
  targetProtection?: number;
  superiorities?: Superiority[];
  spentHeroismThisTurn?: boolean;
}

export interface AttackResult {
  check: CheckResult;
  input: AttackInput;
  protection: number;
  /** Blessures avant réaction de la cible. */
  wounds: number;
  /** La cible peut-elle réagir (esquive, levée de bouclier) ? */
  reactionWindowOpen: boolean;
}

/**
 * Blessures infligées.
 * - Sans armure : autant de blessures que de réussites.
 * - Avec armure : une seule blessure dès que le taux de protection est atteint.
 */
export function woundsFromSuccesses(successes: number, protection: number): number {
  if (protection <= 0) return Math.max(0, successes);
  return successes >= protection ? 1 : 0;
}

export function resolveAttack(input: AttackInput): AttackResult {
  const armor = getArmor(input.targetArmor);
  const protection = input.targetProtection ?? armor.protection;
  const check = resolveCheck({
    label: `Attaque — ${input.weaponLabel}`,
    dieSize: input.dieSize,
    aptitudeLevel: input.aptitudeLevel,
    difficulty: difficultyFromScore(Math.max(1, input.targetResilience)),
    rank: Math.max(1, protection),
    superiorities: input.superiorities,
    spentHeroismThisTurn: input.spentHeroismThisTurn,
  });
  return {
    check,
    input,
    protection,
    wounds: woundsFromSuccesses(check.successes, protection),
    reactionWindowOpen: check.successes > 0,
  };
}

// ── Réactions ─────────────────────────────────────────────────────────────

export type ReactionKey = "esquive" | "levee-bouclier" | "serrer-les-dents" | "aucune";

export interface ReactionOption {
  key: ReactionKey;
  label: string;
  icon: string;
  /** Coût en points d'héroïsme (par unité d'effet). */
  heroismCost: number;
  hint: string;
}

export const REACTIONS: ReactionOption[] = [
  {
    key: "esquive",
    label: "Esquiver",
    icon: "💨",
    heroismCost: 2,
    hint: "Lance les dés d'esquive ; chaque dé annule un dé adverse de valeur égale ou inférieure. +1D par 2 points supplémentaires.",
  },
  {
    key: "levee-bouclier",
    label: "Levée de bouclier",
    icon: "🛡️",
    heroismCost: 2,
    hint: "2 points d'héroïsme annulent une réussite de l'attaque ; cumulable sur une même source.",
  },
  {
    key: "serrer-les-dents",
    label: "Serrer les dents",
    icon: "😤",
    heroismCost: 2,
    hint: "Annule une réussite de l'épreuve visant le personnage par tranche de 2 points (hors surprise).",
  },
  { key: "aucune", label: "Ne rien faire", icon: "—", heroismCost: 0, hint: "Subir l'attaque telle quelle." },
];

/** Réactions accessibles selon l'équipement, l'héroïsme et l'état du personnage. */
export function availableReactions(opts: {
  heroism: number;
  hasShield?: boolean;
  surprised?: boolean;
}): ReactionOption[] {
  return REACTIONS.filter((r) => {
    if (r.key === "aucune") return true;
    if (r.heroismCost > opts.heroism) return false;
    if (r.key === "levee-bouclier" && !opts.hasShield) return false;
    if (r.key === "serrer-les-dents" && opts.surprised) return false;
    return true;
  });
}

// ── Esquive ───────────────────────────────────────────────────────────────

export interface DodgeResult {
  dodgeDice: DieRoll[];
  /** Dés adverses après annulation (copie annotée). */
  attackDice: DieRoll[];
  cancelled: number;
  remainingSuccesses: number;
  wounds: number;
  heroismSpent: number;
  /** true si le pool d'esquive utilise la valeur de base non définie par les règles. */
  usedUndefinedBaseline: boolean;
}

/**
 * Esquive : chaque dé d'esquive annule UN dé adverse de valeur égale ou
 * inférieure. On annule en priorité les dés adverses réussis les plus forts
 * que l'esquive peut atteindre, pour maximiser l'effet défensif.
 */
export function resolveDodge(opts: {
  attack: AttackResult;
  dodgeDieSize: DieSize;
  armor?: ArmorCategory | string;
  baseDice?: number;
  bulkyItems?: number;
  /** Dés supplémentaires achetés (2 points d'héroïsme chacun). */
  extraDice?: number;
  bonusDice?: number;
}): DodgeResult {
  const extra = Math.max(0, opts.extraDice ?? 0);
  const count = dodgeDicePool({
    armor: opts.armor ?? opts.attack.input.targetArmor,
    baseDice: opts.baseDice,
    bulkyItems: opts.bulkyItems,
    heroismDice: extra,
    bonusDice: opts.bonusDice,
  });

  const pool = rollPool(count, opts.dodgeDieSize);
  const dodgeDice = activeDice(pool)
    .map((d) => ({ ...d }))
    .sort((a, b) => b.value - a.value);

  const threshold = opts.attack.check.difficulty.minScore;
  const attackDice = opts.attack.check.pool.dice.map((d) => ({ ...d }));

  // Cibles prioritaires : les dés adverses réussis, du plus fort au plus faible.
  const targets = attackDice
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => !d.ignored && !d.cancelled && d.value >= threshold)
    .sort((a, b) => b.d.value - a.d.value);

  let cancelled = 0;
  for (const dodge of dodgeDice) {
    const hit = targets.find((t) => !t.d.cancelled && t.d.value <= dodge.value);
    if (hit) {
      hit.d.cancelled = true;
      cancelled += 1;
    }
  }

  const remainingSuccesses = Math.max(
    0,
    attackDice.filter((d) => !d.ignored && !d.cancelled && d.value >= threshold).length +
      opts.attack.check.guaranteedSuccesses,
  );

  return {
    dodgeDice,
    attackDice,
    cancelled,
    remainingSuccesses,
    wounds: woundsFromSuccesses(remainingSuccesses, opts.attack.protection),
    heroismSpent: 2 + extra * 2,
    usedUndefinedBaseline: opts.baseDice === undefined,
  };
}

/** Levée de bouclier / Serrer les dents : annulation directe de réussites. */
export function cancelSuccesses(opts: {
  attack: AttackResult;
  /** Points d'héroïsme dépensés (2 points = 1 réussite annulée). */
  heroismSpent: number;
}): { remainingSuccesses: number; wounds: number; cancelled: number } {
  const cancelled = Math.floor(Math.max(0, opts.heroismSpent) / 2);
  const remaining = Math.max(0, opts.attack.check.successes - cancelled);
  return {
    cancelled,
    remainingSuccesses: remaining,
    wounds: woundsFromSuccesses(remaining, opts.attack.protection),
  };
}

// ── Blessures ─────────────────────────────────────────────────────────────

export interface WoundState {
  /** Blessures accumulées. */
  wounds: number;
  /** Points de corps (maximum 5). */
  maxWounds: number;
}

export function applyWounds(state: WoundState, wounds: number): WoundState {
  return { ...state, wounds: Math.min(state.maxWounds, Math.max(0, state.wounds + wounds)) };
}

export function healWounds(state: WoundState, amount: number): WoundState {
  return { ...state, wounds: Math.max(0, state.wounds - Math.max(0, amount)) };
}

export function isIncapacitated(state: WoundState): boolean {
  return state.wounds >= state.maxWounds;
}

/** Rendu texte d'une attaque, pour le chat et le journal des jets. */
export function formatAttack(result: AttackResult): string {
  const dice = result.check.pool.dice
    .map((d) => (d.ignored || d.cancelled ? `(${d.value})` : `${d.value}`))
    .join(" / ");
  return [
    `⚔️ ${result.input.attackerName} → ${result.input.targetName} — ${result.input.weaponLabel}`,
    `${result.check.pool.dice.length}D${result.check.pool.size} → ${dice}`,
    `Résilience ${result.input.targetResilience}+ — Protection ${result.protection}`,
    `${result.check.successes} réussite${result.check.successes > 1 ? "s" : ""} → ${result.wounds} blessure${result.wounds > 1 ? "s" : ""}`,
  ].join("\n");
}
