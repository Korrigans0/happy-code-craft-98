import { describe, expect, it } from "bun:test";
import { completeRealtimeRow } from "./tabletopRealtimeRow";

const fullRow = {
  tokens: [{ id: "t1" }, { id: "t2" }],
  map_image_url: "https://example.com/map.png",
  scenes: [{ id: "s1" }],
  initiative: [],
};

describe("completeRealtimeRow", () => {
  it("keeps tokens, map and scenes when the GM only adds tokens to the Épreuve", () => {
    const row = { initiative: [{ id: "i1", tokenId: "t1" }, { id: "i2", tokenId: "t2" }] };
    const merged = completeRealtimeRow(row, fullRow);
    expect(merged.tokens).toEqual(fullRow.tokens);
    expect(merged.map_image_url).toBe(fullRow.map_image_url);
    expect(merged.scenes).toEqual(fullRow.scenes);
    expect(merged.initiative).toEqual(row.initiative);
  });

  it("still applies an explicit removal of the map sent by the GM", () => {
    const merged = completeRealtimeRow({ map_image_url: null, tokens: [] }, fullRow);
    expect(merged.map_image_url).toBeNull();
    expect(merged.tokens).toEqual([]);
  });
});
