import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { getDirectTokenSheetId } from "./tokenSheetTarget";

describe("Glyphes token sheet routing", () => {
  const linked = { creatureType: "character", creatureId: "glyphes-character" };
  test("opens the linked Glyphes character directly", () => {
    assert.equal(getDirectTokenSheetId(true, true, linked), "glyphes-character");
  });
  test("does not open another player's forbidden sheet", () => {
    assert.equal(getDirectTokenSheetId(true, false, linked), null);
  });
  test("preserves the token panel for other systems", () => {
    assert.equal(getDirectTokenSheetId(false, true, linked), null);
  });
  test("keeps unlinked tokens on their existing panel", () => {
    assert.equal(getDirectTokenSheetId(true, true, { creatureType: "character" }), null);
  });
  test("does not treat a creature as a character", () => {
    assert.equal(getDirectTokenSheetId(true, true, { ...linked, creatureType: "monster" }), null);
  });
});