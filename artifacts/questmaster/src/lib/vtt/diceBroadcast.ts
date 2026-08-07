// Shared realtime broadcast for dice rolls.
// Every roll (chat, quick actions, macros, 3D dice tab) is pushed on the same
// channel so the floating overlay on the tabletop shows: author + result.
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
    const ch: any = (supabase as any).channel(diceChannelName(campaignId));
    ch.subscribe?.((status: string) => {
      if (status !== "SUBSCRIBED") return;
      ch.send?.({
        type: "broadcast",
        event: "roll",
        payload: { ...payload, t: payload.t ?? Date.now() },
      });
      setTimeout(() => { (supabase as any).removeChannel?.(ch); }, 800);
    });
  } catch {
    /* non-blocking */
  }
}
