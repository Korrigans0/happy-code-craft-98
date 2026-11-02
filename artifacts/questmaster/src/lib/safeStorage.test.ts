import { afterEach, describe, expect, it } from "bun:test";
import { readStorage, removeStorage, writeStorage } from "./safeStorage";

const g = globalThis as unknown as { window?: unknown };
const original = g.window;
afterEach(() => {
  g.window = original;
});

describe("safeStorage with blocked storage", () => {
  it("returns null and false instead of throwing", () => {
    const blocked = {
      getItem: () => { throw new Error("SecurityError"); },
      setItem: () => { throw new Error("QuotaExceededError"); },
      removeItem: () => { throw new Error("SecurityError"); },
    };
    g.window = { localStorage: blocked };
    expect(readStorage("k")).toBeNull();
    expect(writeStorage("k", "v")).toBe(false);
    expect(() => removeStorage("k")).not.toThrow();
  });

  it("reads back what was written when storage works", () => {
    const map = new Map<string, string>();
    g.window = {
      localStorage: {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
      },
    };
    expect(writeStorage("k", "v")).toBe(true);
    expect(readStorage("k")).toBe("v");
    removeStorage("k");
    expect(readStorage("k")).toBeNull();
  });
});
