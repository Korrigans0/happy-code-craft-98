// Moteur de dés partagé — utilisé par le chat et par les macros.
// Format supporté : suite de termes séparés par + / - :
//   "1d20", "2d6+3", "1d20+{FOR}-1", "1d8+1d6+2"
// Les variables {VAR} doivent être résolues AVANT (voir variables.ts).

export interface DiceTerm {
  sign: 1 | -1;
  count: number;
  sides: number;
  results: number[];
}

export interface RollResult {
  /** Formule après résolution des variables */
  formula: string;
  terms: DiceTerm[];
  /** Somme des modificateurs constants */
  modifier: number;
  total: number;
  /** Tous les dés lancés, à plat */
  results: number[];
  /** Réussite / échec critique sur un unique d20 */
  crit: "success" | "fail" | null;
}

export class DiceError extends Error {}

const MAX_DICE = 50;
const MAX_SIDES = 1000;

/** Lance une formule `xdy+z` (multi-termes). Lève DiceError si invalide. */
export function rollFormula(raw: string): RollResult {
  const formula = raw.replace(/\s+/g, "");
  if (!formula) throw new DiceError("Formule vide");
  if (!/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/i.test(formula)) {
    throw new DiceError("Format invalide. Exemples : 1d20, 2d6+3, 1d20+5-1");
  }

  const tokens = formula.match(/[+-]?[^+-]+/g) ?? [];
  const terms: DiceTerm[] = [];
  let modifier = 0;
  let totalDice = 0;

  for (const token of tokens) {
    const sign: 1 | -1 = token.startsWith("-") ? -1 : 1;
    const body = token.replace(/^[+-]/, "");
    const dice = body.match(/^(\d*)d(\d+)$/i);
    if (dice) {
      const count = dice[1] ? parseInt(dice[1], 10) : 1;
      const sides = parseInt(dice[2], 10);
      if (count < 1 || sides < 2) throw new DiceError("Dé invalide");
      totalDice += count;
      if (totalDice > MAX_DICE) throw new DiceError(`Maximum ${MAX_DICE} dés par jet`);
      if (sides > MAX_SIDES) throw new DiceError(`Maximum ${MAX_SIDES} faces`);
      const results: number[] = [];
      for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * sides) + 1);
      }
      terms.push({ sign, count, sides, results });
    } else {
      modifier += sign * parseInt(body, 10);
    }
  }

  let total = modifier;
  const flat: number[] = [];
  for (const t of terms) {
    for (const r of t.results) {
      total += t.sign * r;
      flat.push(r);
    }
  }

  let crit: RollResult["crit"] = null;
  if (terms.length === 1 && terms[0].count === 1 && terms[0].sides === 20) {
    if (terms[0].results[0] === 20) crit = "success";
    if (terms[0].results[0] === 1) crit = "fail";
  }

  return { formula, terms, modifier, total, results: flat, crit };
}

/** Rendu texte d'un jet, style dark fantasy. */
export function formatRoll(result: RollResult, label?: string): string {
  const detail = result.terms
    .map((t) => `${t.sign < 0 ? "-" : ""}${t.count}d${t.sides} [${t.results.join(", ")}]`)
    .join(" ");
  const mod =
    result.modifier !== 0
      ? ` ${result.modifier > 0 ? "+" : "−"}${Math.abs(result.modifier)}`
      : "";
  const prefix =
    result.crit === "success" ? "🎲✨" : result.crit === "fail" ? "🎲💀" : "🎲";
  const head = label ? `${prefix} ${label} — ` : `${prefix} `;
  return `${head}${result.formula} → ${detail}${mod} = ${result.total}`;
}
