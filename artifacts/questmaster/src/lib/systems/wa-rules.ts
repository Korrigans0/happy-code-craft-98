// Worlds Awakening — official rules helpers.
// Sources: worlds-awakening.com (Guide du joueur / Codex)
//  - PV niveau 1 = maximum du/des dé(s) de vie de la classe (pas de mod. CON)
//  - Passage de niveau : on relance le pool de DV, on garde le meilleur résultat.
//    Le mod. CON détermine le nombre de lancers (voir CON_ROLLS).
//  - Def PHY = 10 + CON + niveau, Def MAG = 10 + SAG + niveau
//  - Initiative = 10 + DEX
//  - PM max = 2 x (MAG + niveau), minimum 0
//  - Niveau maximum = 8

import { WA_CLASS_META } from "@/lib/game-systems";

export const WA_MAX_LEVEL = 8;
export const WA_MIN_LEVEL = 1;

/** Nombre de lancers de dés de vie conservés selon le modificateur de CON. */
export function waHitDieRolls(con: number): number {
  if (con >= 6) return 4;
  if (con >= 4) return 3;
  if (con >= 2) return 2;
  return 1;
}

/** Parse "2d6" -> { count: 2, faces: 6 } */
export function parseHitDie(die: string | undefined): { count: number; faces: number } {
  const m = /^(\d*)d(\d+)$/i.exec((die ?? "").trim());
  if (!m) return { count: 1, faces: 6 };
  return { count: m[1] ? parseInt(m[1], 10) : 1, faces: parseInt(m[2], 10) };
}

/** Distribution des sommes possibles d'un pool de dés (index = somme). */
function poolDistribution(count: number, faces: number): number[] {
  let dist = [1];
  for (let i = 0; i < count; i++) {
    const next = new Array(dist.length + faces).fill(0);
    for (let s = 0; s < dist.length; s++) {
      if (!dist[s]) continue;
      for (let f = 1; f <= faces; f++) next[s + f] += dist[s];
    }
    dist = next;
  }
  return dist;
}

/** Espérance du meilleur résultat sur `rolls` lancers du pool (arrondie). */
export function expectedBestRoll(count: number, faces: number, rolls: number): number {
  const dist = poolDistribution(count, faces);
  const total = dist.reduce((a, b) => a + b, 0);
  // P(best <= s) = (P(sum <= s))^rolls
  let cum = 0;
  const cdf: number[] = dist.map((c) => {
    cum += c;
    return cum / total;
  });
  let expectation = 0;
  let prev = 0;
  for (let s = 0; s < cdf.length; s++) {
    const p = Math.pow(cdf[s], rolls);
    expectation += s * (p - prev);
    prev = p;
  }
  return Math.round(expectation);
}

/** PV maximum recommandés pour un personnage WA. */
export function waMaxHp(className: string | undefined, level: number, con: number): number {
  const { count, faces } = parseHitDie(WA_CLASS_META[className ?? ""]?.hitDie);
  const base = count * faces; // niveau 1 : maximum des dés
  const lvl = Math.min(WA_MAX_LEVEL, Math.max(WA_MIN_LEVEL, level || 1));
  const rolls = waHitDieRolls(con || 0);
  const perLevel = expectedBestRoll(count, faces, rolls);
  return base + (lvl - 1) * perLevel;
}

/** Caractéristique magique de la classe (défaut INT). */
export function waMagicStat(className: string | undefined): "INT" | "SAG" {
  const s = WA_CLASS_META[className ?? ""]?.magicStat;
  return s === "SAG" ? "SAG" : "INT";
}

/** PM max = 2 x (MAG + niveau), plancher 0. */
export function waMaxPm(magValue: number, level: number): number {
  return Math.max(0, 2 * ((magValue || 0) + (level || 1)));
}

export const waDefPhy = (con: number, level: number) => 10 + (con || 0) + (level || 1);
export const waDefMag = (sag: number, level: number) => 10 + (sag || 0) + (level || 1);
export const waInitiative = (dex: number) => 10 + (dex || 0);
