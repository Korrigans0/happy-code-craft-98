import { describe, expect, it } from "bun:test";
import {
  glyphesChatMessage,
  glyphesEntryFromMessage,
  mergeGlyphesEntries,
  type GlyphesLogEntry,
} from "./chatMessage";

const entry = (id: string, t: number): GlyphesLogEntry => ({
  id,
  t,
  author: "Maggle",
  label: "Maggle — Athlétisme (PUI)",
  dice: [{ value: 5 }, { value: 2 }, { value: 7, cancelled: true }],
  dieSize: 8,
  tdLabel: "Commun",
  tdScore: 4,
  rank: 1,
  successes: 1,
  isSuccess: true,
  isCoupDEclat: false,
  heroismGained: 0,
});

describe("Glyphes chat messages", () => {
  it("stores a check result as a shared dice_roll chat message with the exact values", () => {
    const msg = glyphesChatMessage(entry("a", 1));
    expect(msg.message_type).toBe("dice_roll");
    expect(msg.content).toContain("[5, 2, ~7~]");
    const parsed = glyphesEntryFromMessage({ metadata: msg.metadata });
    expect(parsed?.dice.map((d) => d.value)).toEqual([5, 2, 7]);
    expect(parsed?.successes).toBe(1);
    expect(parsed?.isSuccess).toBe(true);
  });

  it("does not store dice results under the generic results key validated for XdY rolls", () => {
    expect("results" in glyphesChatMessage(entry("a", 1)).metadata).toBe(false);
  });

  it("ignores ordinary and malformed messages", () => {
    expect(glyphesEntryFromMessage({ metadata: { dice: "1d20", results: [3] } })).toBeNull();
    expect(glyphesEntryFromMessage({ metadata: { glyphes: { id: "x", dice: "oops" } } })).toBeNull();
  });

  it("keeps one entry when the same attempt arrives live and from chat history", () => {
    const merged = mergeGlyphesEntries([entry("a", 1), entry("b", 2)], [entry("b", 2), entry("c", 3)]);
    expect(merged.map((e) => e.id)).toEqual(["c", "b", "a"]);
  });
});
