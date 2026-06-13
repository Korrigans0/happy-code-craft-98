// Multi-system registry — registre central.
//
// Importez `getSystem(id)` pour obtenir la définition d'un système, ou
// `SYSTEM_LIST` pour itérer (sélecteurs UI).
//
// Ajouter un nouveau système : créer `./<system>.ts`, l'importer ici, et
// l'ajouter à `SYSTEM_LIST`. Le reste de l'app (formulaire, fiche, combat)
// s'y adapte automatiquement.

import type { SystemDefinition } from "./types";
import { AETHERIA_SYSTEM } from "./aetheria";
import { WA_SYSTEM } from "./worlds-awakening";
import { DND5E_SYSTEM } from "./dnd5e";
import { PF2E_SYSTEM } from "./pathfinder2e";
import { COC_SYSTEM } from "./cthulhu7e";
import { CUSTOM_SYSTEM } from "./custom";

export const SYSTEM_LIST: SystemDefinition[] = [
  AETHERIA_SYSTEM,
  WA_SYSTEM,
  DND5E_SYSTEM,
  PF2E_SYSTEM,
  COC_SYSTEM,
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

export type { SystemDefinition, StatDef, DefenseDef, RollMode } from "./types";
export { AETHERIA_SYSTEM, WA_SYSTEM, DND5E_SYSTEM, PF2E_SYSTEM, COC_SYSTEM, CUSTOM_SYSTEM };
