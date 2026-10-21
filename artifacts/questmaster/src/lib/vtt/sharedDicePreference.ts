// Per-device preference: show other players' 3D dice rolling on the table.
// Defaults to on, except when the device asks for reduced motion.
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "aetheria:shared-dice-3d";
const CHANGE_EVENT = "aetheria:shared-dice-3d-change";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function readSharedDicePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "on") return true;
    if (stored === "off") return false;
  } catch {
    /* storage unavailable */
  }
  return !prefersReducedMotion();
}

export function writeSharedDicePreference(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSharedDicePreference(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(readSharedDicePreference);

  useEffect(() => {
    const sync = () => setEnabled(readSharedDicePreference());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((next: boolean) => {
    writeSharedDicePreference(next);
    setEnabled(next);
  }, []);

  return [enabled, update];
}
