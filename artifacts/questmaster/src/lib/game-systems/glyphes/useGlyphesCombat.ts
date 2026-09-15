// État de combat Glyphes par jeton (points d'action, héroïsme, blessures,
// approche) — synchronisé en temps réel sur le canal de la campagne et
// conservé localement pour survivre à un rechargement de page.

import { useCallback, useEffect, useState } from "react";
import { getDiceChannel } from "@/lib/vtt/diceBroadcast";
import { createDebouncedSaver, loadGlyphesState } from "./persistence";
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

/**
 * Magasin partagé par onglet : plusieurs composants (table de jeu, panneau,
 * tiroir mobile) utilisent le même état sans se désynchroniser.
 */
const stores = new Map<string, { state: GlyphesCombatMap; listeners: Set<(s: GlyphesCombatMap) => void> }>();

function getStore(key: string) {
  let store = stores.get(key);
  if (!store) {
    let initial: GlyphesCombatMap = {};
    if (typeof window !== "undefined") {
      try {
        initial = JSON.parse(window.localStorage.getItem(key) || "{}");
      } catch {
        initial = {};
      }
    }
    store = { state: initial, listeners: new Set() };
    stores.set(key, store);
  }
  return store;
}

function setStore(key: string, updater: (prev: GlyphesCombatMap) => GlyphesCombatMap) {
  const store = getStore(key);
  store.state = updater(store.state);
  try {
    window.localStorage.setItem(key, JSON.stringify(store.state));
  } catch {
    /* quota */
  }
  store.listeners.forEach((l) => l(store!.state));
}

/** Campagnes déjà chargées depuis le serveur (une seule lecture par onglet). */
const hydrated = new Set<string>();
const saveState = createDebouncedSaver();

export function useGlyphesCombat(campaignId?: string | null, enabled = true) {
  const key = storageKey(campaignId);
  const [states, setLocal] = useState<GlyphesCombatMap>(() => getStore(key).state);

  // Chargement de l'état enregistré côté serveur (survit au changement d'appareil)
  useEffect(() => {
    if (!enabled || !campaignId || hydrated.has(key)) return;
    hydrated.add(key);
    let cancelled = false;
    void loadGlyphesState(campaignId).then((remote) => {
      if (cancelled || !remote?.tokens) return;
      const tokens = remote.tokens as GlyphesCombatMap;
      if (Object.keys(tokens).length === 0) return;
      // Le serveur fait foi au chargement, le local complète les jetons absents.
      setStore(key, (prev) => ({ ...prev, ...tokens }));
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId, enabled, key]);

  // Enregistrement différé
  useEffect(() => {
    if (!enabled || !campaignId || !hydrated.has(key)) return;
    if (Object.keys(states).length === 0) return;
    saveState(campaignId, { tokens: states as Record<string, unknown> });
  }, [states, campaignId, enabled, key]);

  // Abonnement au magasin partagé
  useEffect(() => {
    const store = getStore(key);
    setLocal(store.state);
    const listener = (s: GlyphesCombatMap) => setLocal(s);
    store.listeners.add(listener);
    return () => {
      store.listeners.delete(listener);
    };
  }, [key]);

  const setStates = useCallback(
    (updater: (prev: GlyphesCombatMap) => GlyphesCombatMap) => setStore(key, updater),
    [key],
  );

  // Réception temps réel
  useEffect(() => {
    if (!enabled || !campaignId) return;
    const channel: any = getDiceChannel(campaignId);
    const handler = ({ payload }: { payload: { tokenId: string; state: GlyphesTokenState } }) => {
      setStore(key, (prev) => ({ ...prev, [payload.tokenId]: payload.state }));
    };
    channel.on?.("broadcast", { event: EVENT }, handler);
    return () => {
      channel.off?.("broadcast", { event: EVENT }, handler);
    };
  }, [campaignId, enabled, key]);

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
