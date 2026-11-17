import { test } from "node:test";
import { strict as assert } from "node:assert";
import { PORTRAIT_RECT, portraitPlacement } from "./portrait";

test("the portrait remains inside its official PDF box", () => {
  const square = portraitPlacement(512, 512, 595.44);
  assert.equal(square.x, 13);
  assert.equal(square.width, 107);
  assert.equal(square.height, 107);
  assert.equal(square.y + square.height, 595.44 - 52);
  const wide = portraitPlacement(1024, 512, 595.44);
  assert.equal(wide.width, PORTRAIT_RECT.width);
  assert.equal(wide.height, 53.5);
  assert.ok(wide.y > square.y);
});