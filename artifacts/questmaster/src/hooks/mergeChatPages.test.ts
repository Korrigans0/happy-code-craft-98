import { describe, expect, it } from "bun:test";
import { mergeChatPages, retainedFromWindow } from "./mergeChatPages";

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

describe("retainedFromWindow", () => {
  it("keeps the message pushed out of the live window by a new one", () => {
    const before = [m("b", "2026-01-01T00:00:02Z"), m("c", "2026-01-01T00:00:03Z")];
    const after = [m("c", "2026-01-01T00:00:03Z"), m("d", "2026-01-01T00:00:04Z")];
    const older = mergeChatPages([m("a", "2026-01-01T00:00:01Z")], retainedFromWindow(before, after));
    expect(mergeChatPages(older, after).map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
  });
  it("does not resurrect a message deleted from inside the window", () => {
    const before = [m("b", "2026-01-01T00:00:02Z"), m("c", "2026-01-01T00:00:03Z")];
    expect(retainedFromWindow(before, [m("b", "2026-01-01T00:00:02Z")])).toEqual([]);
  });
});
