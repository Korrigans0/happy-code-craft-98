import { describe, expect, test } from "bun:test";
import { canEditCharacter, mergeSystemData, pickEditableFields, sameVersion } from "./characterPatch";

describe("character MCP patch rules", () => {
  test("system_data patch keeps untouched keys", () => {
    const merged = mergeSystemData({ wounds: 1, heroism: 3, sheet: { a: 1, b: 2 } }, { sheet: { b: 5 } });
    expect(merged).toEqual({ wounds: 1, heroism: 3, sheet: { a: 1, b: 5 } });
  });
  test("ownership and system columns cannot be written", () => {
    const { update, rejected } = pickEditableFields({ hp: 4, gold: 10, user_id: "x", system: "D&D", kind: "pregen" });
    expect(update).toEqual({ hp: 4, gold: 10 });
    expect(rejected.sort()).toEqual(["kind", "system", "user_id"]);
  });
  test("a player cannot edit another player's sheet", () => {
    expect(canEditCharacter({ user_id: "a", kind: "character" }, "b", false)).toBe(false);
    expect(canEditCharacter({ user_id: "a", kind: "character" }, "b", true)).toBe(false);
    expect(canEditCharacter({ user_id: "a", kind: "character" }, "a", false)).toBe(true);
    expect(canEditCharacter({ user_id: null, kind: "pregen" }, "gm", true)).toBe(true);
  });
  test("version comparison ignores timestamp formatting", () => {
    expect(sameVersion("2026-11-17T16:00:00+00:00", "2026-11-17T16:00:00.000Z")).toBe(true);
    expect(sameVersion("2026-11-17T16:00:00Z", "2026-11-17T16:00:01Z")).toBe(false);
  });
});
