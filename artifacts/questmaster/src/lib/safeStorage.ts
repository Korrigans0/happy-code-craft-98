// localStorage throws in some browsers (Safari private mode, strict privacy
// settings, full quota). Local preferences must never crash a page: reads fall
// back to null and writes are skipped.
function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readStorage(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Returns false when the value could not be stored. */
export function writeStorage(key: string, value: string): boolean {
  try {
    const s = storage();
    if (!s) return false;
    s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    storage()?.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}
