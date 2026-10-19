import { describe, expect, it } from "bun:test";
import { applySheetEdits, systemDataToCombat } from "./sheetSync";
import { acknowledgeEdits, reconcileCounters, recordEdits } from "./syncState";

const defaults = { actionPoints: 4, maxActionPoints: 4, heroism: 0, wounds: 0, resilience: 4, movedFt: 0, approach: null };
const sheet = { race: "Humain", def_resilience: 6, pdf_form: { "35": true, "26": true, "27": true, "36": true, name: "Test" } };

describe("Glyphes sheet edit provenance", () => {
  it("preserves 3 heroism and 1 wound on first movement from defaults", () => {
    const moved = { ...defaults, movedFt: 15, actionPoints: 3 };
    const edits = recordEdits(defaults, moved, { movedFt: 15, actionPoints: 3 }, {}, 1);
    const saved = applySheetEdits(sheet, edits);
    expect(systemDataToCombat(saved)).toEqual({ heroism: 3, wounds: 1, resilience: 6 });
    expect(saved?.combat).toEqual({ movedFt: 15, actionPoints: 3 });
  });
  it("restored zero snapshots cannot write counters without local edits", () => {
    expect(applySheetEdits(sheet, {})).toBeNull();
    expect(reconcileCounters(defaults, systemDataToCombat(sheet), {})).toMatchObject({ heroism: 3, wounds: 1, resilience: 6 });
  });
  it("new turn only changes combat metadata", () => {
    const old = { ...defaults, actionPoints: 1, movedFt: 30 };
    const edits = recordEdits(old, defaults, { actionPoints: 4, movedFt: 0, approach: null }, {}, 2);
    expect(systemDataToCombat(applySheetEdits(sheet, edits))).toMatchObject({ heroism: 3, wounds: 1 });
  });
  it("explicit zero is saved without changing other counters or fields", () => {
    const saved = applySheetEdits(sheet, { heroism: { value: 0, revision: 1 } });
    expect(systemDataToCombat(saved)).toMatchObject({ heroism: 0, wounds: 1, resilience: 6 });
    expect(saved?.pdf_form.name).toBe("Test");
    expect(saved?.race).toBe("Humain");
  });
  it("caps explicit wounds at 3", () => {
    expect(systemDataToCombat(applySheetEdits(sheet, { wounds: { value: 9, revision: 1 } })).wounds).toBe(3);
  });
  it("late sheet reads preserve newer pending edits", () => {
    const pending = { heroism: { value: 2, revision: 2 } };
    expect(reconcileCounters({ ...defaults, heroism: 2 }, { heroism: 3, wounds: 1 }, pending)).toMatchObject({ heroism: 2, wounds: 1 });
  });
  it("acknowledging a save cannot discard a newer revision", () => {
    const sent = { heroism: { value: 2, revision: 1 } };
    const pending = { heroism: { value: 1, revision: 2 } };
    expect(acknowledgeEdits(pending, sent)).toEqual(pending);
    expect(acknowledgeEdits(sent, sent)).toEqual({});
  });
  it("empty PDF forms retain numeric counters and resilience", () => {
    expect(systemDataToCombat({ pdf_form: {}, def_blessure: 1, heroisme: 3, def_resilience: 6 })).toEqual({ wounds: 1, heroism: 3, resilience: 6 });
  });
});
