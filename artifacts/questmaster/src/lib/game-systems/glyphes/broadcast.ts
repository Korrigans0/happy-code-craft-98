// Publication des épreuves Glyphes : enregistrées dans le chat partagé de la
// campagne (source commune, historique) puis diffusées en direct sur le canal
// de dés pour rafraîchir immédiatement le journal des autres tables.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { getDiceChannel } from "@/lib/vtt/diceBroadcast";
import type { CheckResult } from "./checks";
import type { AttackResult } from "./combat";
import {
  glyphesChatMessage,
  glyphesEntryFromMessage,
  mergeGlyphesEntries,
  type GlyphesLogEntry,
} from "./chatMessage";

export type { GlyphesLogEntry } from "./chatMessage";

export const GLYPHES_EVENT = "glyphes-check";

/** Query keys of the two chat views reading campaign_messages. */
const chatQueryKeys = (campaignId: string) => [
  ["campaignMessages", campaignId],
  ["vtt-chat-messages", campaignId],
];

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

/** Live-only notification (no persistence). Prefer usePublishGlyphesEntry. */
export function broadcastGlyphesEntry(campaignId: string | null | undefined, entry: GlyphesLogEntry) {
  if (!campaignId) return;
  try {
    const channel: any = getDiceChannel(campaignId);
    channel.send?.({ type: "broadcast", event: GLYPHES_EVENT, payload: entry });
  } catch {
    /* non bloquant */
  }
}

/**
 * Returns a function publishing one check result: a single shared chat message
 * (visible to every campaign member, kept in history), then a live broadcast.
 */
export function usePublishGlyphesEntry(campaignId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useCallback(
    async (entry: GlyphesLogEntry) => {
      if (!campaignId) return;
      try {
        await campaignsApi.postMessage(campaignId, glyphesChatMessage(entry));
        chatQueryKeys(campaignId).forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      } catch {
        toast({
          title: "Résultat non partagé",
          description: "L'épreuve n'a pas pu être enregistrée dans le chat de la campagne.",
          variant: "destructive",
        });
      }
      broadcastGlyphesEntry(campaignId, entry);
    },
    [campaignId, queryClient],
  );
}

/** Journal partagé des épreuves : historique du chat + entrées reçues en direct. */
export function useGlyphesLog(campaignId: string | null | undefined, max = 50) {
  const queryClient = useQueryClient();
  const [live, setLive] = useState<GlyphesLogEntry[]>([]);

  const { data: messages = [] } = useQuery({
    queryKey: ["campaignMessages", campaignId],
    queryFn: () => campaignsApi.getMessages(campaignId as string),
    enabled: !!campaignId,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!campaignId) return;
    const channel: any = getDiceChannel(campaignId);
    const handler = ({ payload }: { payload: GlyphesLogEntry }) => {
      if (!payload?.id) return;
      setLive((prev) => (prev.some((e) => e.id === payload.id) ? prev : [payload, ...prev].slice(0, max)));
      // The author saved the chat row before broadcasting: refresh both chat views.
      chatQueryKeys(campaignId).forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    };
    channel.on?.("broadcast", { event: GLYPHES_EVENT }, handler);
    return () => {
      // Shared channel: only drop this listener.
      const bindings = channel.bindings?.broadcast;
      if (Array.isArray(bindings)) {
        channel.bindings.broadcast = bindings.filter((b: any) => b.callback !== handler);
      }
    };
  }, [campaignId, max, queryClient]);

  return useMemo(() => {
    const persisted = (messages as unknown[])
      .map(glyphesEntryFromMessage)
      .filter((e): e is GlyphesLogEntry => e !== null);
    return mergeGlyphesEntries(persisted, live, max);
  }, [messages, live, max]);
}
