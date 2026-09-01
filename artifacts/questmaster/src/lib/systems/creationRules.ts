// Règles de création de personnage — couche commune à TOUS les systèmes.
//
// Objectif : le formulaire de création et les fiches appliquent exactement les
// mêmes bornes et les mêmes valeurs dérivées, quel que soit le système. Aucune
// logique `if (system === "...")` ne doit exister dans les composants : tout
// vient de la SystemDefinition (stats, defenses, calculations, min/maxLevel).

import type { SystemDefinition } from "./types";
import { DEFAULT_CALCULATIONS } from "./types";
import { readStats, writeStatPatch, readDefense } from "./statBridge";

export interface LevelBounds {
  min: number;
  max: number;
  /** false = le système ignore la notion de niveau (ex: L'Appel de Cthulhu). */
  enabled: boolean;
}

/**
 * Bornes de niveau du système. `currentLevel` (personnage existant) n'est
 * jamais rétrogradé : on ne casse pas une progression de campagne en cours.
 */
export function getLevelBounds(system: SystemDefinition, currentLevel?: number | null): LevelBounds {
  const enabled = system.hasLevels !== false;
  const min = system.minLevel ?? 1;
  const declaredMax = system.maxLevel ?? 20;
  return { min, max: Math.max(declaredMax, currentLevel ?? 0), enabled };
}

export interface DerivedValues {
  level: number;
  /** Valeurs brutes des caractéristiques, telles que saisies. */
  stats: Record<string, number>;
  /** Modificateurs dérivés des caractéristiques. */
  modifiers: Record<string, number>;
  maxHp: number;
  initiative: number;
  defenses: Record<string, number>;
  resources: Record<string, number>;
  proficiencyBonus?: number;
  attackBonus?: number;
  spellSaveDC?: number;
}

/**
 * Calcule toutes les valeurs recommandées par les règles du système pour un
 * personnage donné. Les calculs reçoivent les valeurs BRUTES : chaque système
 * applique lui-même sa conversion (score → mod, pourcentage → ⅕, etc.).
 */
export function computeDerived(system: SystemDefinition, character: any): DerivedValues {
  const calc = system.calculations ?? DEFAULT_CALCULATIONS;
  const bounds = getLevelBounds(system, character?.level);
  const level = bounds.enabled
    ? Math.min(bounds.max, Math.max(bounds.min, Number(character?.level) || bounds.min))
    : bounds.min;

  const stats = readStats(character, system);
  const modifiers: Record<string, number> = {};
  for (const s of system.stats) modifiers[s.key] = calc.statModifier(s, stats[s.key]);

  const ctx = {
    level,
    stats,
    subclass: character?.subclass as string | undefined,
    systemData: (character?.system_data as Record<string, unknown>) ?? {},
  };

  const defenses: Record<string, number> = {};
  const computedDefenses = calc.defenses?.(ctx) ?? {};
  for (const def of system.defenses) {
    defenses[def.key] = Number.isFinite(computedDefenses[def.key])
      ? computedDefenses[def.key]
      : def.default;
  }

  const resources = calc.derivedResources?.(ctx) ?? {};

  return {
    level,
    stats,
    modifiers,
    maxHp: Math.max(1, Math.round(calc.maxHp(ctx))),
    initiative: Math.round(calc.initiative(ctx)),
    defenses,
    resources,
    proficiencyBonus: calc.proficiencyBonus?.(ctx),
    attackBonus: calc.attackBonus?.(ctx),
    spellSaveDC: calc.spellSaveDC?.(ctx),
  };
}

export interface ValidationResult {
  /** Patch à fusionner dans le personnage pour le rendre conforme aux règles. */
  patch: Record<string, any>;
  /** Corrections appliquées, en français, à afficher à l'utilisateur. */
  notices: string[];
  /** Erreurs bloquantes (personnage non sauvegardable). */
  errors: string[];
}

/**
 * Vérifie et corrige un personnage vis-à-vis des règles de son système :
 * caractéristiques dans leurs bornes, niveau autorisé, PV cohérents.
 * Retourne un patch à appliquer plutôt que de muter l'objet.
 */
export function validateCharacter(system: SystemDefinition, character: any): ValidationResult {
  let patch: Record<string, any> = {};
  const notices: string[] = [];
  const errors: string[] = [];

  if (!String(character?.name ?? "").trim()) {
    errors.push("Le personnage doit avoir un nom.");
  }

  // 1. Caractéristiques : clamp aux bornes du système (writeStatPatch clampe).
  let working = { ...character };
  const stats = readStats(character, system);
  for (const stat of system.stats) {
    const raw = stats[stat.key];
    const clamped = Math.min(stat.max, Math.max(stat.min, Number.isFinite(raw) ? raw : stat.default));
    if (clamped !== raw) {
      notices.push(`${stat.longLabel ?? stat.label} ramené à ${clamped} (limites ${stat.min}–${stat.max}).`);
    }
    const p = writeStatPatch(working, stat, clamped);
    working = { ...working, ...p };
    patch = { ...patch, ...p };
  }

  // 2. Niveau.
  const bounds = getLevelBounds(system, character?.level);
  const rawLevel = Number(character?.level) || bounds.min;
  const level = bounds.enabled
    ? Math.min(bounds.max, Math.max(bounds.min, rawLevel))
    : bounds.min;
  if (level !== rawLevel) {
    notices.push(
      bounds.enabled
        ? `Niveau ajusté à ${level} (${system.shortLabel} : ${bounds.min}–${bounds.max}).`
        : `${system.label} ne gère pas les niveaux : niveau fixé à ${level}.`,
    );
  }
  patch.level = level;
  working.level = level;

  // 3. Points de vie : max ≥ 1, courant dans [0, max].
  const maxHp = Math.max(1, Number(character?.max_hp) || 0);
  if (maxHp !== character?.max_hp) {
    patch.max_hp = maxHp;
    if (!character?.max_hp) notices.push("Points de vie maximum initialisés à 1 minimum.");
  }
  const hp = Number.isFinite(Number(character?.hp)) ? Number(character.hp) : maxHp;
  const clampedHp = Math.min(maxHp, Math.max(0, hp));
  if (clampedHp !== character?.hp) {
    patch.hp = clampedHp;
    if (hp > maxHp) notices.push(`PV courants ramenés à ${clampedHp} (maximum du personnage).`);
  }

  // 4. Défenses : au minimum la valeur plancher du système.
  const sysData = { ...((working.system_data as Record<string, any>) ?? {}) };
  const defenses = { ...((sysData.defenses as Record<string, number>) ?? {}) };
  let defensesChanged = false;
  for (const def of system.defenses) {
    const current = readDefense(working, def.key, def.default);
    if (!Number.isFinite(current)) {
      defenses[def.key] = def.default;
      defensesChanged = true;
    } else if (defenses[def.key] !== current) {
      defenses[def.key] = current;
      defensesChanged = true;
    }
  }
  if (defensesChanged) {
    patch.system_data = { ...sysData, defenses };
  }

  return { patch, notices, errors };
}
