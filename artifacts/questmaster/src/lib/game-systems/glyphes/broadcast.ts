// Diffusion temps réel des épreuves Glyphes + journal des jets.
// Réutilise le canal de dés existant de la campagne (broadcast.self = true).

import { useEffect, useState } from "react";
import { getDiceChannel } from "@/lib/vtt/diceBroadcast";
import type { CheckResult } from "./checks";
import type { AttackResult } from "./combat";

export interface GlyphesLogEntry {
  id: string;
  t: number;
  author: string;
  label: string;
  dice: { value: number; cancelled?: boolean; ignored?: boolean }[];
  dieSize: number;
  tdLabel: string;
  tdScore: number;
  rank: number;
  successes: number;
  isSuccess: boolean;
  isCoupDEclat: boolean;
  heroismGained: number;
  /** Blessures infligées si l'entrée provient d'une attaque. */
  wounds?: number;
  target?: string;
}

export const GLYPHES_EVENT = "glyphes-check";

export function entryFromCheck(author: string, result: CheckResult): GlyphesLogEntry {
  return {
    id: crypto.randomUUID(),
    t: result.timestamp,
    author,
    label: result.label,
    dice: result.pool.dice.map((d) => ({ value: d.value, cancelled: d.cancelled, ignored: d.ignored })),
    dieSize: result.pool.size,
    tdLabel: result.difficulty.label,
    tdScore: result.difficulty.minScore,
    rank: result.rank,
    successes: result.successes,
    isSuccess: result.isSuccess,
    isCoupDEclat: result.isCoupDEclat,
    heroismGained: result.heroismGained,
  };
}

export function entryFromAttack(author: string, attack: AttackResult): GlyphesLogEntry {
  return {
    ...entryFromCheck(author, attack.check),
    wounds: attack.wounds,
    target: attack.input.targetName,
  };
}

export function broadcastGlyphesEntry(campaignId: string | null | undefined, entry: GlyphesLogEntry) {
  if (!campaignId) return;
  try {
    const channel: any = getDiceChannel(campaignId);
    channel.send?.({ type: "broadcast", event: GLYPHES_EVENT, payload: entry });
  } catch {
    /* non bloquant */
  }
}

/** Journal partagé des épreuves de la campagne (mémoire de session). */
export function useGlyphesLog(campaignId: string | null | undefined, max = 50) {
  const [entries, setEntries] = useState<GlyphesLogEntry[]>([]);

  useEffect(() => {
    if (!campaignId) return;
    const channel: any = getDiceChannel(campaignId);
    const handler = ({ payload }: { payload: GlyphesLogEntry }) => {
      setEntries((prev) => {
        if (prev.some((e) => e.id === payload.id)) return prev;
        return [payload, ...prev].slice(0, max);
      });
    };
    channel.on?.("broadcast", { event: GLYPHES_EVENT }, handler);
    return () => {
      channel.off?.("broadcast", { event: GLYPHES_EVENT }, handler);
    };
  }, [campaignId, max]);

  return entries;
}
