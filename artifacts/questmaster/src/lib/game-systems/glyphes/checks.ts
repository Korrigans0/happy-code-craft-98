// Glyphes V0.2 — Résolution des épreuves (Module Coeur, ch. Épreuves).
//
// Épreuve simple : on lance (niveau d'aptitude + supériorités) dés de la taille
// de la caractéristique. Chaque dé >= TD est une réussite. Si le nombre de
// réussites >= rang de difficulté, l'épreuve est un succès. Plus de réussites
// que le rang = coup d'éclat → autant de points d'héroïsme que le rang.

import { DieSize, PoolRoll, rollPool, activeDice } from "./dice";
import { DifficultyType, getDifficulty, DifficultyTypeKey } from "./difficulty";

export interface Superiority {
  /** Source lisible : "aide d'un allié", "équipement", "surprise", "charge"… */
  source: string;
  /** Nombre de dés apportés (+1D en général, négatif pour une infériorité). */
  dice: number;
}

export interface CheckInput {
  /** Libellé affiché : "Pied léger", "Attaque — épée courte"… */
  label: string;
  /** Taille du dé de la caractéristique liée. */
  dieSize: DieSize;
  /** Niveau d'aptitude = nombre de dés de base. */
  aptitudeLevel: number;
  /** Type de difficulté (score minimal par dé). */
  difficulty: DifficultyTypeKey | DifficultyType;
  /** Rang de difficulté = nombre de réussites nécessaires. */
  rank: number;
  /** Supériorités / infériorités cumulées, avec leur source. */
  superiorities?: Superiority[];
  /** Réussites garanties (actions héroïques sociales, "plein de ressources"). */
  guaranteedSuccesses?: number;
  /** true si le personnage a déjà dépensé de l'héroïsme ce tour-ci. */
  spentHeroismThisTurn?: boolean;
}

export interface CheckResult {
  label: string;
  difficulty: DifficultyType;
  rank: number;
  pool: PoolRoll;
  superiorities: Superiority[];
  /** Total de dés demandés après supériorités. */
  diceRequested: number;
  /** Réussites obtenues (dés >= TD, + réussites garanties). */
  successes: number;
  guaranteedSuccesses: number;
  /** Succès de l'épreuve. */
  isSuccess: boolean;
  /** Réussites au-delà du rang demandé. */
  isCoupDEclat: boolean;
  /** Points d'héroïsme gagnés (= rang, 0 si TD nul ou héroïsme déjà dépensé). */
  heroismGained: number;
  timestamp: number;
}

/** Un dé compte comme réussite s'il atteint le score minimal du TD. */
export function isSuccessDie(value: number, minScore: number): boolean {
  return value >= minScore;
}

export function resolveCheck(input: CheckInput): CheckResult {
  const difficulty =
    typeof input.difficulty === "string" ? getDifficulty(input.difficulty) : input.difficulty;
  const rank = Math.max(1, Math.round(input.rank || 1));
  const superiorities = input.superiorities ?? [];
  const bonusDice = superiorities.reduce((sum, s) => sum + s.dice, 0);
  const diceRequested = Math.round(input.aptitudeLevel || 0) + bonusDice;

  const pool = rollPool(diceRequested, input.dieSize);
  const guaranteed = Math.max(0, input.guaranteedSuccesses ?? 0);

  // TD Nul : l'épreuve réussit automatiquement, aucun point d'héroïsme.
  if (difficulty.minScore <= 0) {
    return {
      label: input.label,
      difficulty,
      rank,
      pool,
      superiorities,
      diceRequested,
      successes: Math.max(rank, guaranteed),
      guaranteedSuccesses: guaranteed,
      isSuccess: true,
      isCoupDEclat: false,
      heroismGained: 0,
      timestamp: Date.now(),
    };
  }

  const rolled = activeDice(pool).filter((d) => isSuccessDie(d.value, difficulty.minScore)).length;
  const successes = rolled + guaranteed;
  const isSuccess = successes >= rank;
  const isCoupDEclat = successes > rank;
  const heroismGained = isCoupDEclat && !input.spentHeroismThisTurn ? rank : 0;

  return {
    label: input.label,
    difficulty,
    rank,
    pool,
    superiorities,
    diceRequested,
    successes,
    guaranteedSuccesses: guaranteed,
    isSuccess,
    isCoupDEclat,
    heroismGained,
    timestamp: Date.now(),
  };
}

/**
 * Épreuve complexe : succession d'épreuves simples. Le nombre de succès requis
 * est égal au niveau de complexité. Tentatives éventuellement limitées.
 */
export interface ComplexCheckState {
  label: string;
  complexity: number;
  successes: number;
  attempts: number;
  maxAttempts?: number;
  /** Le MJ cache-t-il le nombre de succès nécessaires ? */
  hidden?: boolean;
  aborted?: boolean;
}

export type ComplexOutcome = "en cours" | "succès" | "échec partiel" | "échec complet";

export function complexOutcome(state: ComplexCheckState): ComplexOutcome {
  if (state.successes >= state.complexity) return "succès";
  if (state.aborted) return "échec partiel";
  if (state.maxAttempts && state.attempts >= state.maxAttempts) {
    return state.successes >= state.complexity / 2 ? "échec partiel" : "échec complet";
  }
  return "en cours";
}

/** Rendu texte d'une épreuve, pour le chat et le journal des jets. */
export function formatCheck(result: CheckResult): string {
  const dice = result.pool.dice
    .map((d) => (d.ignored || d.cancelled ? `(${d.value})` : `${d.value}`))
    .join(" / ");
  const lines = [
    `🎲 ${result.label} — ${result.pool.dice.length}D${result.pool.size}`,
    dice,
    `TD : ${result.difficulty.label} (${result.difficulty.minScore}+) — Rang ${result.rank}`,
    `${result.successes} réussite${result.successes > 1 ? "s" : ""}`,
    result.isSuccess ? "✓ Réussite" : "✗ Échec",
  ];
  if (result.isCoupDEclat) {
    lines.push(`✨ Coup d'éclat${result.heroismGained ? ` — +${result.heroismGained} héroïsme` : ""}`);
  }
  return lines.join("\n");
}
