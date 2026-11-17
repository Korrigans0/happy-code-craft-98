import { readStorage, removeStorage, writeStorage } from "@/lib/safeStorage";
import { STORAGE_PREFIX } from "./config";

/** JSON storage namespaced for the Symbiote; never throws. */
export function loadJson<T>(key: string, fallback: T): T {
  const raw = readStorage(STORAGE_PREFIX + key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
export const saveJson = (key: string, value: unknown) => writeStorage(STORAGE_PREFIX + key, JSON.stringify(value));
export const dropKey = (key: string) => removeStorage(STORAGE_PREFIX + key);
