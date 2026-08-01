// Variables de fiche disponibles dans les macros.
// Résolution DYNAMIQUE : les valeurs sont lues sur la fiche au moment de
// l'exécution, jamais figées à la création de la macro.
//
// Syntaxe : {FOR}, {NIV}, {DE:ESP} (Glyphes), {DEMI:FOR} / {CINQ:FOR} (CoC).

import { getSystem, type SystemDefinition } from "@/lib/systems";

export interface VariableDoc {
  token: string;
  label: string;
}

type AnyChar = Record<string, any> | null | undefined;

/** Taille de dé Glyphes selon le niveau de caractéristique (0 → aucun). */
const GLYPHES_DICE = [0, 4, 6, 8, 10, 12];

function sysData(character: AnyChar): Record<string, any> {
  return (character?.system_data as Record<string, any>) ?? {};
}

/** Valeurs brutes des caractéristiques, quelle que soit la source. */
function rawStats(character: AnyChar, system: SystemDefinition): Record<string, number> {
  const data = sysData(character);
  const fromData: Record<string, any> = data.stats ?? data.caracs ?? {};
  const legacy: Record<string, number> = {
    STR: character?.strength,
    DEX: character?.dexterity,
    CON: character?.constitution,
    INT: character?.intelligence,
    WIS: character?.wisdom,
    CHA: character?.charisma,
    FOR: character?.strength,
    SAG: character?.wisdom,
  };
  const out: Record<string, number> = {};
  for (const s of system.stats) {
    const v = fromData[s.key] ?? legacy[s.key] ?? s.default;
    out[s.key] = Number(v) || 0;
  }
  return out;
}

/**
 * Construit la table de variables (clé majuscule → valeur numérique) pour une
 * fiche donnée. Retourne aussi les tailles de dés Glyphes.
 */
export function buildVariables(character: AnyChar, systemId?: string | null) {
  const system = getSystem(systemId ?? character?.system);
  const data = sysData(character);
  const stats = rawStats(character, system);
  const vars: Record<string, number> = {};
  const dice: Record<string, string> = {};

  for (const s of system.stats) {
    const value = stats[s.key];
    const mod = system.calculations?.statModifier(s, value) ?? value;
    vars[s.key] = mod;
    vars[`VAL_${s.key}`] = value;
    vars[`MOD_${s.key}`] = mod;
    vars[`DEMI_${s.key}`] = Math.floor(value / 2);
    vars[`CINQ_${s.key}`] = Math.floor(value / 5);
    dice[s.key] = `1d${GLYPHES_DICE[Math.max(0, Math.min(5, value))] || 4}`;
  }

  const level = Number(character?.level) || 1;
  vars.NIV = level;
  vars.NIVEAU = level;
  vars.PV = Number(character?.hp) || 0;
  vars.PVMAX = Number(character?.max_hp) || 0;
  vars.CA = Number(character?.armor_class) || 0;
  vars.INIT = Number(character?.initiative) || 0;
  vars.VIT = Number(character?.speed) || 0;
  vars.MAIT = Number(character?.proficiency_bonus) || 0;
  vars.DDSORT = Number(character?.spell_save_dc) || 0;
  vars.ATQSORT = Number(character?.spell_attack_bonus) || 0;

  // Défenses & ressources spécifiques au système (system_data)
  const defenses: Record<string, any> = data.defenses ?? {};
  for (const d of system.defenses) {
    vars[d.key.toUpperCase()] = Number(defenses[d.key] ?? d.default) || 0;
  }
  const resources: Record<string, any> = data.resources ?? {};
  for (const r of system.resources ?? []) {
    vars[r.key.toUpperCase()] = Number(resources[r.key] ?? data[r.key] ?? 0) || 0;
  }

  // Alias lisibles
  vars.DEFPHY = vars.PHY_DEF ?? vars.CA;
  vars.DEFMAG = vars.MAG_DEF ?? 0;
  vars.CORPS = vars.HP ?? vars.PV;
  vars.AME = vars.AME ?? 0;

  // Calculs dérivés du système
  const ctx = { level, stats: vars, systemData: data, subclass: character?.subclass };
  vars.ATQ = system.calculations?.attackBonus?.(ctx) ?? 0;
  if (!vars.DDSORT) vars.DDSORT = system.calculations?.spellSaveDC?.(ctx) ?? 0;

  return { system, vars, dice, name: character?.name ?? "" };
}

/**
 * Remplace les {VARIABLES} d'une formule/texte par leurs valeurs actuelles.
 * Les variables inconnues valent 0 et sont renvoyées dans `unknown`.
 */
export function resolveVariables(
  input: string,
  character: AnyChar,
  systemId?: string | null,
): { text: string; unknown: string[] } {
  const { vars, dice, name } = buildVariables(character, systemId);
  const unknown: string[] = [];

  const text = input.replace(/\{([A-Za-zÀ-ÿ_]+)(?::([A-Za-z_]+))?\}/g, (_m, rawKey, arg) => {
    const key = String(rawKey).toUpperCase();
    const argKey = arg ? String(arg).toUpperCase() : null;

    if (key === "NOM") return name || "Personnage";
    if (argKey) {
      if (key === "DE" || key === "POOL") return dice[argKey] ?? "1d4";
      if (key === "DEMI") return String(vars[`DEMI_${argKey}`] ?? 0);
      if (key === "CINQ") return String(vars[`CINQ_${argKey}`] ?? 0);
    }
    if (key in vars) {
      const v = vars[key];
      return v < 0 ? String(v) : String(v);
    }
    unknown.push(`{${rawKey}${arg ? `:${arg}` : ""}}`);
    return "0";
  });

  // "1d20+-2" → "1d20-2"
  return { text: text.replace(/\+\s*-/g, "-").replace(/-\s*-/g, "+"), unknown };
}

/** Liste documentée des variables proposées à l'édition, selon le système. */
export function listVariables(systemId?: string | null): VariableDoc[] {
  const system = getSystem(systemId);
  const docs: VariableDoc[] = [];

  for (const s of system.stats) {
    docs.push({ token: `{${s.key}}`, label: s.longLabel || s.label });
    if (s.mode === "score") docs.push({ token: `{VAL_${s.key}}`, label: `${s.label} (score brut)` });
    if (s.mode === "percentage") {
      docs.push({ token: `{DEMI:${s.key}}`, label: `${s.label} — moitié` });
      docs.push({ token: `{CINQ:${s.key}}`, label: `${s.label} — cinquième` });
    }
  }
  if (system.id === "Glyphes") {
    for (const s of system.stats) {
      docs.push({ token: `{DE:${s.key}}`, label: `Dé de ${s.label} (D4→D12)` });
    }
  }
  for (const d of system.defenses) {
    docs.push({ token: `{${d.key.toUpperCase()}}`, label: d.label });
  }
  for (const r of system.resources ?? []) {
    docs.push({ token: `{${r.key.toUpperCase()}}`, label: r.label });
  }
  docs.push(
    { token: "{NIV}", label: "Niveau" },
    { token: "{NOM}", label: "Nom du personnage" },
    { token: "{PV}", label: "Points de vie actuels" },
    { token: "{PVMAX}", label: "Points de vie max" },
    { token: "{CA}", label: "Défense principale" },
    { token: "{INIT}", label: "Initiative" },
    { token: "{ATQ}", label: "Bonus d'attaque" },
    { token: "{DDSORT}", label: "DD de sauvegarde des sorts" },
  );
  if (system.id === "Dnd5e" || system.id === "D&D 5e" || system.id === "Pathfinder 2e") {
    docs.push({ token: "{MAIT}", label: "Bonus de maîtrise" });
  }

  // Dédoublonnage
  const seen = new Set<string>();
  return docs.filter((d) => (seen.has(d.token) ? false : (seen.add(d.token), true)));
}
