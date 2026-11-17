import { describe, expect, test } from "bun:test";
import { APTITUDES, deriveSenses, hasFluxDie } from "./character";
import { HEROIC_ACTIONS } from "./heroic-actions";

const cost = (id: string) => HEROIC_ACTIONS.find((a) => a.id === id)?.cost;

describe("Glyphes module cœur", () => {
  test("an Esprit D4 gives no Flux die", () => {
    expect(deriveSenses({ ESP: 1, CON: 3, FOI: 2 }).Flux).toBe(0);
    expect(hasFluxDie({ ESP: 1 })).toBe(false);
  });

  test("Flux is one die level below Esprit", () => {
    expect(deriveSenses({ ESP: 3 }).Flux).toBe(2);
  });

  test("Scout, Botanique and Traqueur are replaced by Observateur and Survie", () => {
    const keys = APTITUDES.map((a) => a.key);
    expect(keys).toContain("observateur");
    expect(keys).toContain("survie");
    expect(keys).not.toContain("scout");
    expect(keys).not.toContain("botanique");
    expect(keys).not.toContain("traqueur");
  });

  test("heroic action costs follow the new module", () => {
    expect(cost("cri-de-ralliement")).toBe(5);
    expect(cost("riposte-insaisissable")).toBe(1);
    expect(cost("intervention-defensive")).toBe(3);
  });
});
