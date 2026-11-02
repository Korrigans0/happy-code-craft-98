import { describe, expect, it } from "bun:test";
import { mergeChatPages } from "./mergeChatPages";

const m = (id: string, at: string) => ({ id, created_at: at });

describe("mergeChatPages", () => {
  it("puts older pages before the live window", () => {
    const merged = mergeChatPages([m("a", "1"), m("b", "2")], [m("c", "3")]);
    expect(merged.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("shows a message present in both only once", () => {
    const merged = mergeChatPages([m("a", "1"), m("b", "2")], [m("b", "2"), m("c", "3")]);
    expect(merged.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});
