// Pure rules for offline edits and conflict rebasing (no network, testable).
import { mergeSystemData, type JsonValue } from "@/lib/mcp/characterPatch";

type JsonObject = { [k: string]: JsonValue };
export interface PendingPatch { fields: Record<string, JsonValue>; systemData: JsonObject }

export const emptyPatch = (): PendingPatch => ({ fields: {}, systemData: {} });
export const isEmptyPatch = (p: PendingPatch) => !Object.keys(p.fields).length && !Object.keys(p.systemData).length;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const isObj = (v: unknown): v is JsonObject => typeof v === "object" && v !== null && !Array.isArray(v);

/** Leaf-level diff so two devices editing different boxes of the same form never clash. */
function diffObject(current: JsonObject, next: JsonObject): JsonObject {
  const out: JsonObject = {};
  for (const [k, v] of Object.entries(next)) {
    if (isObj(v) && isObj(current[k])) {
      const inner = diffObject(current[k] as JsonObject, v);
      if (Object.keys(inner).length) out[k] = inner;
    } else if (!same(current[k], v)) out[k] = v;
  }
  return out;
}

/**
 * Turns a sheet's onSave payload into a minimal patch against the last known server copy.
 * system_data is diffed key by key so untouched system keys are never sent.
 */
export function patchFromSheetSave(base: Record<string, any>, save: Record<string, any>): PendingPatch {
  const patch = emptyPatch();
  for (const [key, value] of Object.entries(save)) {
    if (key === "system_data" && value && typeof value === "object") {
      patch.systemData = diffObject((base.system_data ?? {}) as JsonObject, value as JsonObject);
    } else if (!same(base[key], value)) {
      patch.fields[key] = value as JsonValue;
    }
  }
  return patch;
}

/** Later local edits win over earlier queued ones. */
export function combinePatches(a: PendingPatch, b: PendingPatch): PendingPatch {
  return { fields: { ...a.fields, ...b.fields }, systemData: mergeSystemData(a.systemData, b.systemData) };
}

/** Optimistic local view: server copy + queued edits. */
export function applyPatch<T extends Record<string, any>>(character: T, patch: PendingPatch): T {
  if (isEmptyPatch(patch)) return character;
  return { ...character, ...patch.fields, system_data: mergeSystemData(character.system_data, patch.systemData) };
}
