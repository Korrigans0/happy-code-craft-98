// Shared realtime broadcast for dice rolls.
// Every roll (chat, quick actions, macros, 3D dice tab) is pushed on the same
// channel so the floating overlay on the tabletop shows: author + result.
// IMPORTANT: sender and listener MUST share the SAME channel instance with
// `broadcast.self = true`, otherwise the author never sees his own roll.
import { supabase } from "@/integrations/supabase/client";

export interface DiceRollBroadcast {
  author: string;
  formula: string;
  total: number;
  results: { type: number; value: number }[];
  modifier: number;
  label?: string;
  crit?: "success" | "fail";
  t: number;
}

export function diceChannelName(campaignId: string) {
  return `vtt-dice-${campaignId}`;
}

type Entry = { channel: any; ready: boolean; queue: DiceRollBroadcast[] };
const registry = new Map<string, Entry>();

/** Get (or lazily create) the shared dice channel for a campaign. */
export function getDiceChannel(campaignId: string): any {
  const existing = registry.get(campaignId);
  if (existing) return existing.channel;

  const channel: any = (supabase as any).channel(diceChannelName(campaignId), {
    config: { broadcast: { self: true } },
  });
  const entry: Entry = { channel, ready: false, queue: [] };
  registry.set(campaignId, entry);

  channel.subscribe?.((status: string) => {
    if (status === "SUBSCRIBED") {
      entry.ready = true;
      const pending = entry.queue.splice(0);
      pending.forEach(payload =>
        channel.send?.({ type: "broadcast", event: "roll", payload }),
      );
    }
  });

  return channel;
}

/** Detect crit/fumble on a single d20 roll. */
export function detectCrit(results: { type: number; value: number }[]): "success" | "fail" | undefined {
  const d20s = results.filter(r => r.type === 20);
  if (d20s.length === 0) return undefined;
  if (d20s.some(r => r.value === 20)) return "success";
  if (d20s.every(r => r.value === 1)) return "fail";
  return undefined;
}

/** Fire-and-forget broadcast of a dice roll to the campaign tabletop. */
export function broadcastDiceRoll(
  campaignId: string | null | undefined,
  payload: Omit<DiceRollBroadcast, "t"> & { t?: number },
) {
  if (!campaignId) return;
  try {
    const channel = getDiceChannel(campaignId);
    const entry = registry.get(campaignId);
    const full: DiceRollBroadcast = { ...payload, t: payload.t ?? Date.now() };
    if (entry?.ready) {
      channel.send?.({ type: "broadcast", event: "roll", payload: full });
    } else {
      entry?.queue.push(full);
    }
  } catch {
    /* non-blocking */
  }
}
