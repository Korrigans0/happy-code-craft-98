import { describe, expect, it } from "bun:test";
import { diffSystemData, systemDataToCombat } from "./sheetSync";

const base = { actionPoints: 3, maxActionPoints: 4, heroism: 2, wounds: 1, resilience: 4, movedFt: 15, approach: null };

describe("Glyphes sheet sync", () => {
  it("writes wounds, heroism, resilience and movement into the sheet", () => {
    const patch = diffSystemData({ race: "Humain" }, base)!;
    expect(patch.def_blessure).toBe(1);
    expect(patch.heroisme).toBe(2);
    expect(patch.def_resilience).toBe(4);
    expect((patch.combat as any).movedFt).toBe(15);
    expect(patch.race).toBe("Humain");
  });

  it("caps wounds at 3", () => {
    expect(diffSystemData({}, { ...base, wounds: 7 })!.def_blessure).toBe(3);
  });

  it("returns null when the sheet is already up to date", () => {
    const synced = diffSystemData({}, base)!;
    expect(diffSystemData(synced, base)).toBeNull();
  });

  it("ticks the PDF wound and heroism boxes", () => {
    const form = diffSystemData({}, { ...base, wounds: 2, heroism: 1 })!.pdf_form as Record<string, boolean>;
    expect([form["36"], form["37"], form["Case à cocher71"]]).toEqual([true, true, false]);
    expect(form["35"]).toBe(true);
    expect(form["26"]).toBe(false);
  });

  it("reads PDF boxes back to the token", () => {
    expect(systemDataToCombat({ pdf_form: { "36": true, "37": true, "35": true } })).toEqual({ wounds: 2, heroism: 1 });
  });

  it("maps sheet edits back to the token", () => {
    expect(systemDataToCombat({ def_blessure: 5, heroisme: 9, def_resilience: 2 })).toEqual({ wounds: 3, heroism: 5, resilience: 2 });
  });
});
