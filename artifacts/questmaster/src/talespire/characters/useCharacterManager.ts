import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { AetheriaMcpClient } from "../core/mcpClient";
import { loadJson, saveJson } from "../core/storage";
import { CharacterSync } from "../sync/characterSync";

export interface CharacterSummary {
  id: string; name: string; race: string; class: string; level: number; system: string;
  avatar_url: string | null; is_owner: boolean; version: string;
}

/** Character list, open tabs (restored between sessions) and the shared sync engine. */
export function useCharacterManager(client: AetheriaMcpClient, enabled: boolean) {
  const sync = useMemo(() => new CharacterSync(client), [client]);
  const [list, setList] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>(() => loadJson<string[]>("tabs", []));
  const [active, setActive] = useState<string | null>(() => loadJson<string | null>("active", null));
  useSyncExternalStore((cb) => sync.subscribe(cb), () => sync, () => sync);
  const [, force] = useState(0);
  useEffect(() => sync.subscribe(() => force((n) => n + 1)), [sync]);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await client.callTool<{ characters: CharacterSummary[] }>("list_characters", { scope: "accessible", limit: 100 });
      setList(res.characters);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { if (enabled) { refresh(); tabs.forEach((id) => sync.open(id).catch(() => undefined)); } return () => sync.stop(); }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { saveJson("tabs", tabs); saveJson("active", active); }, [tabs, active]);

  const open = useCallback(async (id: string) => {
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setActive(id);
    if (!sync.get(id)) await sync.open(id).catch((e) => setError((e as Error).message));
  }, [sync]);

  const close = useCallback((id: string) => {
    sync.close(id);
    setTabs((t) => {
      const next = t.filter((x) => x !== id);
      setActive((a) => (a === id ? next[next.length - 1] ?? null : a));
      return next;
    });
  }, [sync]);

  return { sync, list, loading, error, refresh, tabs, active, setActive, open, close };
}
