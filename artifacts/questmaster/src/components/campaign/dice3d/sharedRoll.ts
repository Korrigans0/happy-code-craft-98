// Pure helpers for replaying a 3D roll on every table (no three.js imports so
// they stay cheap to load and easy to test).
import type { DiceRollBroadcast } from "@/lib/vtt/diceBroadcast";

export const SHARED_DIE_TYPES = [4, 6, 8, 10, 12, 20] as const;
export type SharedDieType = (typeof SHARED_DIE_TYPES)[number];

/** Max dice replayed at once (the result card still shows the full roll). */
export const MAX_SHARED_DICE_DESKTOP = 12;
export const MAX_SHARED_DICE_MOBILE = 8;
/** Max rolls animated simultaneously; older ones are dropped. */
export const MAX_CONCURRENT_SHARED_ROLLS = 2;

export interface SharedRoll {
  id: string;
  author: string;
  color: number;
  dice: { type: SharedDieType; value: number }[];
}

const isSharedDieType = (type: number): type is SharedDieType =>
  (SHARED_DIE_TYPES as readonly number[]).includes(type);

/**
 * Turn a broadcast payload into a roll to replay, or null when it must not be
 * shown here (not a 3D roll, our own roll, or malformed values).
 */
export function parseSharedRoll(
  payload: DiceRollBroadcast | null | undefined,
  myUserId: string | null | undefined,
  maxDice: number,
): SharedRoll | null {
  if (!payload || payload.source !== "3d") return null;
  if (myUserId && payload.senderId === myUserId) return null;
  if (!Array.isArray(payload.results) || payload.results.length === 0) return null;

  const dice: SharedRoll["dice"] = [];
  for (const r of payload.results) {
    const type = Number(r?.type);
    const value = Number(r?.value);
    if (!isSharedDieType(type)) return null;
    if (!Number.isInteger(value) || value < 1 || value > type) return null;
    if (dice.length < maxDice) dice.push({ type, value });
  }

  return {
    id: `${payload.t}-${payload.senderId ?? payload.author}`,
    author: String(payload.author || "Joueur"),
    color: Number.isInteger(payload.color) ? Number(payload.color) : 0,
    dice,
  };
}

/**
 * Relabel faces so the face the die physically landed on shows the value the
 * author actually rolled. Swaps two labels; returns a new array.
 */
export function remapFaceValues(faceValues: number[], landedFace: number, wanted: number): number[] {
  const next = [...faceValues];
  const from = next.indexOf(wanted);
  if (from < 0 || landedFace < 0 || landedFace >= next.length) return next;
  [next[landedFace], next[from]] = [next[from], next[landedFace]];
  return next;
}
