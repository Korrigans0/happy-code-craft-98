// Glyphes V0.2 — Types et rangs de difficulté (Module Coeur, ch. Épreuves)
// Source : "Difficulté et Score Minimum" — Nul 0, Commun 4, Héroïque 6,
// Grandiose 8, Légendaire 10, Mythique 12.

export type DifficultyTypeKey =
  | "nul"
  | "commun"
  | "heroique"
  | "grandiose"
  | "legendaire"
  | "mythique";

export interface DifficultyType {
  key: DifficultyTypeKey;
  label: string;
  /** Score minimal à obtenir sur un dé pour qu'il compte comme réussite. */
  minScore: number;
  hint: string;
}

export const DIFFICULTY_TYPES: DifficultyType[] = [
  { key: "nul", label: "Nul", minScore: 0, hint: "Réussite automatique — aucun point d'héroïsme." },
  { key: "commun", label: "Commun", minScore: 4, hint: "Difficulté par défaut des épreuves." },
  { key: "heroique", label: "Héroïque", minScore: 6, hint: "Vrai défi : fait dépenser corps et âme." },
  { key: "grandiose", label: "Grandiose", minScore: 8, hint: "Réservé aux aptitudes de niveau 4+." },
  { key: "legendaire", label: "Légendaire", minScore: 10, hint: "D8 minimum et aptitude niveau 5." },
  { key: "mythique", label: "Mythique", minScore: 12, hint: "Avertissement : l'échec peut être mortel." },
];

export const DEFAULT_DIFFICULTY: DifficultyTypeKey = "commun";

export function getDifficulty(key: DifficultyTypeKey | string | undefined): DifficultyType {
  return DIFFICULTY_TYPES.find((d) => d.key === key) ?? DIFFICULTY_TYPES[1];
}

/**
 * Type de difficulté correspondant à un score minimal (ex. la résilience d'une
 * cible, ou la valeur max du dé d'une caractéristique lors d'un parlementer).
 * Retourne le palier officiel le plus proche par le bas, sinon un TD ad hoc.
 */
export function difficultyFromScore(score: number): DifficultyType {
  const exact = DIFFICULTY_TYPES.find((d) => d.minScore === score);
  if (exact) return exact;
  return { key: "commun", label: `Sur mesure (${score}+)`, minScore: score, hint: "Score minimal imposé par la situation." };
}

/** Rangs de difficulté conseillés (Module Coeur, "Choisir la difficulté"). */
export const RANK_GUIDANCE = [
  { label: "Sans ajout de difficulté", value: "Rang I" },
  { label: "Ajout modéré", value: "Rang égal à la moitié du niveau d'aptitude" },
  { label: "Ajout conséquent", value: "Rang supérieur à la moitié du niveau d'aptitude" },
];

export const MIN_RANK = 1;
export const MAX_RANK = 10;
