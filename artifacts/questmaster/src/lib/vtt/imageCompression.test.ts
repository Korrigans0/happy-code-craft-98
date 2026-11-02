import { describe, expect, it } from "bun:test";
import { fitWithin, MAX_IMAGE_SIDE, shouldUseCompressed } from "./imageCompression";

describe("fitWithin", () => {
  it("keeps a 6000 px map at its exact size so drawn grids stay aligned", () => {
    expect(fitWithin(6000, 4000, MAX_IMAGE_SIDE.map)).toEqual({ width: 6000, height: 4000 });
  });
  it("reduces a map above 8192 px, keeping its proportions", () => {
    expect(fitWithin(16384, 8192, MAX_IMAGE_SIDE.map)).toEqual({ width: 8192, height: 4096 });
  });
  it("reduces token pictures to 512 px", () => {
    expect(fitWithin(2048, 1024, MAX_IMAGE_SIDE.token)).toEqual({ width: 512, height: 256 });
  });
});

describe("shouldUseCompressed", () => {
  const original = new Blob([new Uint8Array(1000)]);
  it("keeps the original when the WebP is barely lighter", () => {
    expect(shouldUseCompressed(original, new Blob([new Uint8Array(950)]), false)).toBe(false);
  });
  it("uses the WebP when it saves at least 10 %", () => {
    expect(shouldUseCompressed(original, new Blob([new Uint8Array(900)]), false)).toBe(true);
  });
  it("uses the resized picture even if not lighter", () => {
    expect(shouldUseCompressed(original, new Blob([new Uint8Array(1200)]), true)).toBe(true);
  });
});
