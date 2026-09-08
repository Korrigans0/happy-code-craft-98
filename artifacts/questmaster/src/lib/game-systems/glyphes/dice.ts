// Glyphes V0.2 — Moteur de dés.
// Caractéristique = TAILLE du dé (D4→D12). Aptitude = NOMBRE de dés lancés.
// Aucune notion de "1d20 + modificateur" ici : Glyphes ne fonctionne pas ainsi.

export type DieSize = 4 | 6 | 8 | 10 | 12;

/** Niveaux de dé : 1 = D4 … 5 = D12 (Module Coeur, Création de personnage). */
export const DIE_LEVELS: { level: number; size: DieSize; label: string }[] = [
  { level: 1, size: 4, label: "D4" },
  { level: 2, size: 6, label: "D6" },
  { level: 3, size: 8, label: "D8" },
  { level: 4, size: 10, label: "D10" },
  { level: 5, size: 12, label: "D12" },
];

export function dieSizeFromLevel(level: number): DieSize {
  const clamped = Math.max(1, Math.min(5, Math.round(level || 1)));
  return DIE_LEVELS[clamped - 1].size;
}

export function dieLevelFromSize(size: number): number {
  const found = DIE_LEVELS.find((d) => d.size === size);
  return found ? found.level : 1;
}

/** Augmente le niveau de dé (dépense de point de corps / d'âme). */
export function raiseDie(size: DieSize, steps = 1): DieSize {
  const level = Math.min(5, dieLevelFromSize(size) + steps);
  return dieSizeFromLevel(level);
}

/** Diminue le niveau de dé (perte de sens, états). */
export function lowerDie(size: DieSize, steps = 1): DieSize {
  const level = Math.max(1, dieLevelFromSize(size) - steps);
  return dieSizeFromLevel(level);
}

export interface DieRoll {
  /** Valeur obtenue. */
  value: number;
  /** Taille du dé. */
  size: DieSize;
  /** Dé ignoré (règle du pool nul ou négatif : on garde le moins bon score). */
  ignored?: boolean;
  /** Dé annulé par une esquive adverse. */
  cancelled?: boolean;
}

export interface PoolRoll {
  size: DieSize;
  /** Nombre de dés demandé (aptitude + supériorités − infériorités). */
  requested: number;
  /** Dés réellement lancés. */
  dice: DieRoll[];
  /** true si la règle du pool nul/négatif s'est appliquée. */
  degraded: boolean;
}

function rollDie(size: DieSize): number {
  return Math.floor(Math.random() * size) + 1;
}

/**
 * Lance un pool de dés.
 * Règle "Nombre de dés nul ou négatif" (Module Coeur, p.11) : si le pool tombe
 * à 0 ou moins, la créature lance 2 dés et n'utilise que le moins bon score.
 */
export function rollPool(count: number, size: DieSize): PoolRoll {
  const requested = Math.round(count);
  if (requested <= 0) {
    const a = rollDie(size);
    const b = rollDie(size);
    const worst = Math.min(a, b);
    let keptOnce = false;
    const dice: DieRoll[] = [a, b].map((value) => {
      const keep = value === worst && !keptOnce;
      if (keep) keptOnce = true;
      return { value, size, ignored: !keep };
    });
    return { size, requested, dice, degraded: true };
  }
  const dice: DieRoll[] = Array.from({ length: requested }, () => ({
    value: rollDie(size),
    size,
  }));
  return { size, requested, dice, degraded: false };
}

/** Dés effectivement pris en compte (non ignorés, non annulés). */
export function activeDice(pool: PoolRoll): DieRoll[] {
  return pool.dice.filter((d) => !d.ignored && !d.cancelled);
}

/** Rendu texte compact : "3D6 → 6 / 4 / 2". */
export function formatPool(pool: PoolRoll): string {
  const label = `${Math.max(pool.requested, pool.degraded ? 2 : pool.requested)}D${pool.size}`;
  return `${label} → ${pool.dice
    .map((d) => (d.ignored || d.cancelled ? `(${d.value})` : `${d.value}`))
    .join(" / ")}`;
}
