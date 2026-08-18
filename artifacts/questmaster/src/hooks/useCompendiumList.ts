import { useCallback, useEffect, useRef, useState } from "react";
import { compendiumApi } from "@/lib/api";

export type CompendiumKind = "monsters" | "spells" | "items";

interface CacheEntry {
  data: unknown[];
  at: number;
  inflight?: Promise<unknown[]>;
}

// Module-level cache shared by every mounted list. Switching tabs or systems
// back and forth becomes instant instead of re-hitting the database.
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

const cacheKey = (kind: CompendiumKind, system?: string) => `${kind}|${system ?? "*"}`;

const fetcher = (kind: CompendiumKind, system?: string): Promise<unknown[]> => {
  if (kind === "monsters") return compendiumApi.getMonsters(system) as Promise<unknown[]>;
  if (kind === "spells") return compendiumApi.getSpells(system) as Promise<unknown[]>;
  return compendiumApi.getItems(system) as Promise<unknown[]>;
};

/** Invalidates cached entries (call after a create/update/delete). */
export function invalidateCompendium(kind?: CompendiumKind) {
  if (!kind) return CACHE.clear();
  for (const key of [...CACHE.keys()]) if (key.startsWith(`${kind}|`)) CACHE.delete(key);
}

/**
 * Cached + deduplicated loader for the database-backed compendium lists.
 * Concurrent mounts share a single in-flight request.
 */
export function useCompendiumList<T>(kind: CompendiumKind, system?: string) {
  const key = cacheKey(kind, system);
  const cached = CACHE.get(key);
  const fresh = cached && Date.now() - cached.at < TTL_MS ? (cached.data as T[]) : null;

  const [data, setData] = useState<T[]>(fresh ?? []);
  const [loading, setLoading] = useState(!fresh);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async (force = false) => {
      const entry = CACHE.get(key);
      if (!force && entry && Date.now() - entry.at < TTL_MS) {
        setData(entry.data as T[]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const inflight = !force && entry?.inflight ? entry.inflight : fetcher(kind, system);
        CACHE.set(key, { data: entry?.data ?? [], at: entry?.at ?? 0, inflight });
        const result = (await inflight) ?? [];
        CACHE.set(key, { data: result, at: Date.now() });
        if (mounted.current) setData(result as T[]);
      } catch (e) {
        console.error(e);
        if (mounted.current) setData([]);
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [key, kind, system],
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, refresh };
}

export default useCompendiumList;
