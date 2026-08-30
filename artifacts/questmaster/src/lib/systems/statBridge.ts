// Pont entre les colonnes "legacy" de la table `characters` (strength, dexterity, …)
// et le stockage générique `system_data.stats` utilisé par les fiches multi-systèmes.
//
// Objectif : quel que soit le système, le formulaire de création et la fiche
// lisent/écrivent la MÊME valeur pour une caractéristique donnée.

import type { StatDef, SystemDefinition } from "./types";

/** Colonne SQL historique correspondant à une clé de stat canonique. */
export const LEGACY_FIELD_BY_STAT: Record<string, string> = {
  FOR: "strength",
  STR: "strength",
  DEX: "dexterity",
  CON: "constitution",
  INT: "intelligence",
  SAG: "wisdom",
  WIS: "wisdom",
  CHA: "charisma",
};

export function legacyField(statKey: string): string | undefined {
  return LEGACY_FIELD_BY_STAT[statKey];
}

/**
 * Lit la valeur d'une caractéristique : `system_data.stats` d'abord, puis la
 * colonne historique, puis la valeur par défaut du système.
 */
export function readStat(character: any, stat: StatDef): number {
  const fromSysData = character?.system_data?.stats?.[stat.key];
  if (typeof fromSysData === "number") return fromSysData;
  const field = legacyField(stat.key);
  if (field) {
    const v = character?.[field];
    if (typeof v === "number") return v;
  }
  return stat.default;
}

/** Lit toutes les stats d'un système pour un personnage. */
export function readStats(character: any, system: SystemDefinition): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of system.stats) out[s.key] = readStat(character, s);
  return out;
}

/**
 * Retourne le patch à appliquer au personnage pour définir une stat.
 * Écrit dans `system_data.stats` ET dans la colonne historique si elle existe,
 * pour que toutes les fiches restent synchronisées.
 */
export function writeStatPatch(
  character: any,
  stat: StatDef,
  value: number,
): Record<string, any> {
  const clamped = Math.min(stat.max, Math.max(stat.min, Number.isFinite(value) ? value : stat.default));
  const sysData = (character?.system_data as Record<string, any>) ?? {};
  const patch: Record<string, any> = {
    system_data: {
      ...sysData,
      stats: { ...(sysData.stats ?? {}), [stat.key]: clamped },
    },
  };
  const field = legacyField(stat.key);
  if (field) patch[field] = clamped;
  return patch;
}

/** Lit une défense (system_data.defenses puis colonnes historiques). */
export function readDefense(character: any, key: string, fallback: number): number {
  const v = character?.system_data?.defenses?.[key];
  if (typeof v === "number") return v;
  if ((key === "ac" || key === "phy_def") && typeof character?.armor_class === "number") {
    return character.armor_class;
  }
  if (key === "mag_def" && typeof character?.initiative === "number") return character.initiative;
  return fallback;
}

/**
 * Patch d'initialisation des caractéristiques pour un nouveau personnage :
 * valeurs par défaut du système, écrites dans `system_data.stats` ET dans les
 * colonnes historiques. Évite les scores hors bornes (ex. 0 en D&D 5e).
 */
export function defaultStatsPatch(system: SystemDefinition): Record<string, any> {
  const stats: Record<string, number> = {};
  const patch: Record<string, any> = {};
  for (const s of system.stats) {
    stats[s.key] = s.default;
    const field = legacyField(s.key);
    if (field) patch[field] = s.default;
  }
  patch.system_data = { stats };
  return patch;
}
