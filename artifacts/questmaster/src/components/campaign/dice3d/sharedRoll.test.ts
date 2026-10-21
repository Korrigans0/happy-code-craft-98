import { describe, expect, test } from "bun:test";
import { parseSharedRoll, remapFaceValues } from "./sharedRoll";
import type { DiceRollBroadcast } from "@/lib/vtt/diceBroadcast";

const base: DiceRollBroadcast = {
  author: "Devar",
  formula: "1d20 + 1d6",
  total: 21,
  results: [{ type: 20, value: 17 }, { type: 6, value: 4 }],
  modifier: 0,
  t: 1000,
  source: "3d",
  color: 2,
  senderId: "player-a",
};

describe("parseSharedRoll", () => {
  test("another player's 3D roll is replayed with the exact rolled values", () => {
    const roll = parseSharedRoll(base, "gm", 12);
    expect(roll?.dice).toEqual([{ type: 20, value: 17 }, { type: 6, value: 4 }]);
    expect(roll?.color).toBe(2);
  });

  test("the author never sees his own roll replayed", () => {
    expect(parseSharedRoll(base, "player-a", 12)).toBeNull();
  });

  test("chat or macro rolls (not 3D) are not replayed", () => {
    expect(parseSharedRoll({ ...base, source: undefined }, "gm", 12)).toBeNull();
  });

  test("impossible values are rejected", () => {
    expect(parseSharedRoll({ ...base, results: [{ type: 6, value: 7 }] }, "gm", 12)).toBeNull();
    expect(parseSharedRoll({ ...base, results: [{ type: 100, value: 50 }] }, "gm", 12)).toBeNull();
  });

  test("dice beyond the display cap are not animated", () => {
    const results = Array.from({ length: 15 }, () => ({ type: 6, value: 3 }));
    expect(parseSharedRoll({ ...base, results }, "gm", 8)?.dice).toHaveLength(8);
  });
});

describe("remapFaceValues", () => {
  test("the landed face shows the wanted value and every value stays present once", () => {
    const values = [1, 2, 3, 4, 5, 6];
    const next = remapFaceValues(values, 0, 5);
    expect(next[0]).toBe(5);
    expect([...next].sort()).toEqual(values);
  });
});
