// useAutosave — sauvegarde debounce d'un patch sur la fiche personnage.
//
// Toutes les fiches multi-systèmes utilisent ce hook : modification locale → setLocal
// → debounce 800 ms → onSave(patch). Annule le timer au démontage.

import { useEffect, useRef, useState, useCallback } from "react";

export function useAutosave<T extends Record<string, unknown>>(
  initial: T,
  onSave: (patch: Partial<T>) => void | Promise<void>,
  delay = 800,
) {
  const [local, setLocal] = useState<T>(initial);
  const initialRef = useRef(initial);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef<Partial<T>>({});

  // Sync si la prop initial change (changement de personnage)
  useEffect(() => {
    initialRef.current = initial;
    setLocal(initial);
    dirtyRef.current = {};
  }, [initial]);

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    dirtyRef.current = { ...dirtyRef.current, [key]: value };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (Object.keys(dirtyRef.current).length > 0) {
        onSave(dirtyRef.current);
        dirtyRef.current = {};
      }
    }, delay);
  }, [onSave, delay]);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (Object.keys(dirtyRef.current).length > 0) {
      onSave(dirtyRef.current);
      dirtyRef.current = {};
    }
  }, [onSave]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { local, update, flush };
}
