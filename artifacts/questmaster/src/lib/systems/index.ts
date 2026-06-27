// Multi-system registry — registre central.
//
// Importez `getSystem(id)` pour obtenir la définition d'un système, ou
// `SYSTEM_LIST` pour itérer (sélecteurs UI).
//
// Ajouter un nouveau système : créer `./<system>.ts`, l'importer ici, et
// l'ajouter à `SYSTEM_LIST`. Le reste de l'app (formulaire, fiche, combat)
// s'y adapte automatiquement.

import type { SystemDefinition } from "./types";
import { DEFAULT_CALCULATIONS } from "./types";
import { AETHERIA_SYSTEM } from "./aetheria";
import { WA_SYSTEM } from "./worlds-awakening";
import { DND5E_SYSTEM } from "./dnd5e";
import { PF2E_SYSTEM } from "./pathfinder2e";
import { COC_SYSTEM } from "./cthulhu7e";
import { GLYPHES_SYSTEM } from "./glyphes";
import { CUSTOM_SYSTEM } from "./custom";

export const SYSTEM_LIST: SystemDefinition[] = [
  AETHERIA_SYSTEM,
  WA_SYSTEM,
  DND5E_SYSTEM,
  PF2E_SYSTEM,
  COC_SYSTEM,
  GLYPHES_SYSTEM,
  CUSTOM_SYSTEM,
];

const BY_ID = new Map<string, SystemDefinition>(SYSTEM_LIST.map((s) => [s.id, s]));

/**
 * Retourne la définition du système demandé, ou Aetheria par défaut si
 * l'identifiant est inconnu (sécurité : permet de gérer des valeurs historiques).
 */
export function getSystem(id?: string | null): SystemDefinition {
  if (!id) return AETHERIA_SYSTEM;
  return BY_ID.get(id) ?? AETHERIA_SYSTEM;
}

export function isKnownSystem(id?: string | null): boolean {
  return !!id && BY_ID.has(id);
}

/**
 * Résout les calculs d'un système avec fallback générique. Utiliser ce helper
 * plutôt que `system.calculations` directement pour rester safe.
 */
export function getCalculations(id?: string | null) {
  const sys = getSystem(id);
  return sys.calculations ?? DEFAULT_CALCULATIONS;
}

/** Liste des systèmes acceptés comme système de campagne (Homebrew inclus). */
export const CAMPAIGN_SYSTEM_IDS = SYSTEM_LIST.map((s) => s.id);

export type {
  SystemDefinition, StatDef, DefenseDef, RollMode,
  SkillDef, ResourceDef, CalculationsAPI, CalcContext, SheetComponentKey,
} from "./types";
export { DEFAULT_CALCULATIONS, genericStatModifier } from "./types";
export { AETHERIA_SYSTEM, WA_SYSTEM, DND5E_SYSTEM, PF2E_SYSTEM, COC_SYSTEM, GLYPHES_SYSTEM, CUSTOM_SYSTEM };
