import { test } from "node:test";
import { strict as assert } from "node:assert";
import { PORTRAIT_RECT, portraitPlacement } from "./portrait";

test("the portrait remains inside its official PDF box", () => {
  const square = portraitPlacement(512, 512, 595.44);
  assert.equal(square.x, 15);
  assert.equal(square.width, 106);
  assert.equal(square.height, 106);
  assert.equal(square.y + square.height, 595.44 - 56);
  const wide = portraitPlacement(1024, 512, 595.44);
  assert.equal(wide.width, PORTRAIT_RECT.width);
  assert.equal(wide.height, 53);
  assert.ok(wide.y > square.y);
});