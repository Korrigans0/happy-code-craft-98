import { describe, expect, it } from "bun:test";
import { applyDiff, changesActiveScene, diffById, isRetryableError, isSceneChangedError, pendingBelongsToOldScene, pickTabletopColumns, rebaseById } from "./tabletopMerge";

const t = (id: string, x: number) => ({ id, x });

describe("pickTabletopColumns", () => {
  it("drops keys that are not table columns, such as a scene grid", () => {
    const { payload, dropped } = pickTabletopColumns({ tokens: [], grid: { type: "square" }, active_scene_id: "s1" });
    expect(Object.keys(payload).sort()).toEqual(["active_scene_id", "tokens"]);
    expect(dropped).toEqual(["grid"]);
  });
});

describe("diffById", () => {
  it("sends only the moved token", () => {
    expect(diffById([t("a", 1), t("b", 1)], [t("a", 1), t("b", 5)])).toEqual({ upserts: [t("b", 5)], removed: [] });
  });
  it("reports added and removed tokens", () => {
    expect(diffById([t("a", 1), t("b", 1)], [t("a", 1), t("c", 2)])).toEqual({ upserts: [t("c", 2)], removed: ["b"] });
  });
  it("falls back to a full write when the order changes", () => {
    expect(diffById([t("a", 1), t("b", 1)], [t("b", 1), t("a", 1)])).toBeNull();
  });
  it("falls back to a full write when an item has no id", () => {
    expect(diffById([{ x: 1 }], [{ x: 2 }])).toBeNull();
  });
});

describe("rebaseById", () => {
  it("keeps a remote move by another player while replaying the local move", () => {
    const base = [t("gm", 0), t("pj", 0)];
    const remote = [t("gm", 9), t("pj", 0)]; // the GM moved their token
    const local = [t("gm", 0), t("pj", 3)]; // this player moved their own token
    expect(rebaseById(remote, base, local)).toEqual([t("gm", 9), t("pj", 3)]);
  });
  it("does not resurrect a token the remote side deleted unless edited locally", () => {
    const base = [t("a", 0), t("b", 0)];
    const remote = [t("a", 0)];
    const local = [t("a", 2), t("b", 0)];
    expect(rebaseById(remote, base, local)).toEqual([t("a", 2)]);
  });
  it("applyDiff appends new items at the end like the server", () => {
    expect(applyDiff([t("a", 0)], { upserts: [t("n", 1)], removed: [] })).toEqual([t("a", 0), t("n", 1)]);
  });
});

describe("isRetryableError", () => {
  it("retries network failures and timeouts", () => {
    expect(isRetryableError({ message: "TypeError: Failed to fetch" }, 0)).toBe(true);
    expect(isRetryableError({ code: "57014", message: "canceling statement due to statement timeout" }, 500)).toBe(true);
    expect(isRetryableError({ code: "", message: "Service unavailable" }, 503)).toBe(true);
  });
  it("does not retry permission refusals or unknown columns", () => {
    expect(isRetryableError({ code: "42501", message: "Only the GM can modify map" }, 403)).toBe(false);
    expect(isRetryableError({ code: "PGRST204", message: "Could not find the 'grid' column" }, 400)).toBe(false);
  });
});

describe("scene change safety", () => {
  it("a write that changes the active scene is not merged per id", () => {
    expect(changesActiveScene({ tokens: [], active_scene_id: "b" })).toBe(true);
    expect(changesActiveScene({ tokens: [] })).toBe(false);
  });
  it("unsaved token edits from the previous scene are not replayed on the new one", () => {
    expect(pendingBelongsToOldScene({ active_scene_id: "a" }, { active_scene_id: "b" })).toBe(true);
    expect(pendingBelongsToOldScene({ active_scene_id: "a" }, { active_scene_id: "a" })).toBe(false);
    expect(pendingBelongsToOldScene({}, { active_scene_id: "b" })).toBe(false);
  });
  it("recognises the server refusal for a stale scene and never retries it", () => {
    expect(isSceneChangedError({ code: "SCN01" })).toBe(true);
    expect(isRetryableError({ code: "SCN01", message: "Active scene changed" }, 400)).toBe(false);
  });
});
