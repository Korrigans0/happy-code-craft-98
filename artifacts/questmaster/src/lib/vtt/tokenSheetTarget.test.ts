import { describe, expect, test } from "bun:test";
import { getDirectTokenSheetId } from "./tokenSheetTarget";

describe("Glyphes token sheet routing", () => {
  const linked = { creatureType: "character", creatureId: "glyphes-character" };
  test("opens the linked Glyphes character directly", () => {
    expect(getDirectTokenSheetId(true, true, linked)).toBe("glyphes-character");
  });
  test("does not open another player's forbidden sheet", () => {
    expect(getDirectTokenSheetId(true, false, linked)).toBeNull();
  });
  test("preserves the token panel for other systems", () => {
    expect(getDirectTokenSheetId(false, true, linked)).toBeNull();
  });
  test("keeps unlinked tokens on their existing panel", () => {
    expect(getDirectTokenSheetId(true, true, { creatureType: "character" })).toBeNull();
  });
  test("does not treat a creature as a character", () => {
    expect(getDirectTokenSheetId(true, true, { ...linked, creatureType: "monster" })).toBeNull();
  });
});