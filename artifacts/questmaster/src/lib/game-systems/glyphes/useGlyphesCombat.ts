// État de combat Glyphes par jeton (points d'action, héroïsme, blessures,
// approche) — synchronisé en temps réel sur le canal de la campagne et
// conservé localement pour survivre à un rechargement de page.

import { useCallback, useEffect, useRef, useState } from "react";
import { getDiceChannel } from "@/lib/vtt/diceBroadcast";
import { ACTION_POINTS_PER_TURN, type Approach } from "./actions";
import { MAX_HEROISM } from "./heroic-actions";
import { MAX_BODY } from "./character";

export interface GlyphesTokenState {
  actionPoints: number;
  maxActionPoints: number;
  heroism: number;
  wounds: number;
  maxWounds: number;
  resilience: number;
  armor: string;
  hasShield: boolean;
  approach: Approach | null;
  spentHeroismThisTurn: boolean;
  movedFt: number;
}

export type GlyphesCombatMap = Record<string, GlyphesTokenState>;

const EVENT = "glyphes-state";

export function defaultTokenState(partial?: Partial<GlyphesTokenState>): GlyphesTokenState {
  return {
    actionPoints: ACTION_POINTS_PER_TURN,
    maxActionPoints: ACTION_POINTS_PER_TURN,
    heroism: 0,
    wounds: 0,
    maxWounds: MAX_BODY,
    resilience: 4,
    armor: "aucune",
    hasShield: false,
    approach: null,
    spentHeroismThisTurn: false,
    movedFt: 0,
    ...partial,
  };
}

function storageKey(campaignId?: string | null) {
  return `glyphes-combat-${campaignId ?? "local"}`;
}

export function useGlyphesCombat(campaignId?: string | null, enabled = true) {
  const [states, setStates] = useState<GlyphesCombatMap>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem(storageKey(campaignId)) || "{}");
    } catch {
      return {};
    }
  });
  const skipBroadcast = useRef(false);

  // Persistance locale
  useEffect(() => {
    if (!enabled) return;
    try {
      window.localStorage.setItem(storageKey(campaignId), JSON.stringify(states));
    } catch {
      /* quota */
    }
  }, [states, campaignId, enabled]);

  // Réception temps réel
  useEffect(() => {
    if (!enabled || !campaignId) return;
    const channel: any = getDiceChannel(campaignId);
    const handler = ({ payload }: { payload: { tokenId: string; state: GlyphesTokenState } }) => {
      skipBroadcast.current = true;
      setStates((prev) => ({ ...prev, [payload.tokenId]: payload.state }));
    };
    channel.on?.("broadcast", { event: EVENT }, handler);
    return () => {
      channel.off?.("broadcast", { event: EVENT }, handler);
    };
  }, [campaignId, enabled]);

  const push = useCallback(
    (tokenId: string, state: GlyphesTokenState) => {
      if (!campaignId) return;
      try {
        const channel: any = getDiceChannel(campaignId);
        channel.send?.({ type: "broadcast", event: EVENT, payload: { tokenId, state } });
      } catch {
        /* non bloquant */
      }
    },
    [campaignId],
  );

  const getState = useCallback(
    (tokenId: string, defaults?: Partial<GlyphesTokenState>) =>
      states[tokenId] ?? defaultTokenState(defaults),
    [states],
  );

  const update = useCallback(
    (tokenId: string, patch: Partial<GlyphesTokenState>) => {
      setStates((prev) => {
        const next = { ...(prev[tokenId] ?? defaultTokenState()), ...patch };
        next.actionPoints = Math.max(0, Math.min(next.maxActionPoints, next.actionPoints));
        next.heroism = Math.max(0, Math.min(MAX_HEROISM, next.heroism));
        next.wounds = Math.max(0, Math.min(next.maxWounds, next.wounds));
        push(tokenId, next);
        return { ...prev, [tokenId]: next };
      });
    },
    [push],
  );

  /** Nouveau tour pour un jeton : points d'action rechargés. */
  const startTurn = useCallback(
    (tokenId: string) => {
      const current = states[tokenId] ?? defaultTokenState();
      update(tokenId, {
        actionPoints: current.maxActionPoints,
        approach: null,
        spentHeroismThisTurn: false,
        movedFt: 0,
      });
    },
    [states, update],
  );

  const spend = useCallback(
    (tokenId: string, cost: number): boolean => {
      const current = states[tokenId] ?? defaultTokenState();
      if (cost > current.actionPoints) return false;
      update(tokenId, { actionPoints: current.actionPoints - cost });
      return true;
    },
    [states, update],
  );

  const spendHeroism = useCallback(
    (tokenId: string, cost: number): boolean => {
      const current = states[tokenId] ?? defaultTokenState();
      if (cost > current.heroism) return false;
      update(tokenId, { heroism: current.heroism - cost, spentHeroismThisTurn: true });
      return true;
    },
    [states, update],
  );

  const gainHeroism = useCallback(
    (tokenId: string, amount: number) => {
      const current = states[tokenId] ?? defaultTokenState();
      if (current.spentHeroismThisTurn || amount <= 0) return;
      update(tokenId, { heroism: current.heroism + amount });
    },
    [states, update],
  );

  return { states, getState, update, startTurn, spend, spendHeroism, gainHeroism };
}
