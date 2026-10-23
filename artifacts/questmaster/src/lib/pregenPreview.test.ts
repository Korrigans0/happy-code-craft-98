import { describe, expect, test } from "bun:test";
import { canPreviewPregen } from "./pregenPreview";

describe("canPreviewPregen", () => {
  test("Glyphes pregens have no quick preview", () => {
    expect(canPreviewPregen("Glyphes")).toBe(false);
    expect(canPreviewPregen("glyphes")).toBe(false);
  });

  test("D&D 5e pregens keep their quick preview", () => {
    expect(canPreviewPregen("D&D 5e")).toBe(true);
  });

  test("Aetheria pregens keep their quick preview", () => {
    expect(canPreviewPregen("Aetheria")).toBe(true);
  });
});
