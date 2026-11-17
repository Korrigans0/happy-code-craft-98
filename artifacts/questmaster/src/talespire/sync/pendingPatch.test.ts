import { describe, expect, test } from "bun:test";
import { applyPatch, combinePatches, patchFromSheetSave } from "./pendingPatch";

describe("TaleSpire offline edits", () => {
  const base = { id: "c", hp: 10, gold: 5, system_data: { pdf_form: { a: "1", b: "2" }, mana: 3 } };

  test("only changed system_data keys are sent", () => {
    const p = patchFromSheetSave(base, { system_data: { pdf_form: { a: "1", b: "9" }, mana: 3 } });
    expect(p.systemData).toEqual({ pdf_form: { b: "9" } });
    expect(p.fields).toEqual({});
  });

  test("a remote edit to another field survives the local rebase", () => {
    const local = patchFromSheetSave(base, { hp: 7 });
    const remote = { ...base, gold: 50, updated_at: "v2" };
    expect(applyPatch(remote, local)).toMatchObject({ hp: 7, gold: 50 });
  });

  test("queued edits combine, last one wins", () => {
    const p = combinePatches(patchFromSheetSave(base, { hp: 7 }), patchFromSheetSave(base, { hp: 6, gold: 1 }));
    expect(p.fields).toEqual({ hp: 6, gold: 1 });
  });
});
