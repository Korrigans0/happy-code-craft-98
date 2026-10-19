// État de combat Glyphes par jeton (points d'action, héroïsme, blessures,
// approche) — synchronisé en temps réel sur le canal de la campagne et
// conservé localement pour survivre à un rechargement de page.

import { useCallback, useEffect, useState } from "react";
import { getDiceChannel } from "@/lib/vtt/diceBroadcast";
import { createDebouncedSaver, loadGlyphesState } from "./persistence";
import { ACTION_POINTS_PER_TURN, type Approach } from "./actions";
import { MAX_HEROISM } from "./heroic-actions";
import { systemDataToCombat, type CombatSnapshot } from "./sheetSync";
import { COUNTER_FIELDS, acknowledgeEdits, reconcileCounters, recordEdits, type PendingEdits } from "./syncState";
// Nombre maximal de blessures avant qu'un jeton tombe au combat (règle Glyphes : 3).
export const MAX_WOUNDS = 3;

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
  const state: GlyphesTokenState = {
    actionPoints: ACTION_POINTS_PER_TURN,
    maxActionPoints: ACTION_POINTS_PER_TURN,
    heroism: 0,
    wounds: 0,
    maxWounds: MAX_WOUNDS,
    resilience: 4,
    armor: "aucune",
    hasShield: false,
    approach: null,
    spentHeroismThisTurn: false,
    movedFt: 0,
    ...partial,
  };
  // Règle Glyphes : les blessures sont toujours sur 3, même pour un état enregistré avant cette règle.
  state.maxWounds = MAX_WOUNDS;
  state.wounds = Math.max(0, Math.min(MAX_WOUNDS, state.wounds));
  return state;
}

function storageKey(campaignId?: string | null) {
  return `glyphes-combat-${campaignId ?? "local"}`;
}

/**
 * Magasin partagé par onglet : plusieurs composants (table de jeu, panneau,
 * tiroir mobile) utilisent le même état sans se désynchroniser.
 */
interface CombatStore {
  state: GlyphesCombatMap;
  listeners: Set<(s: GlyphesCombatMap) => void>;
  linked: Set<string>;
  ready: Set<string>;
  pending: Record<string, PendingEdits>;
  revision: number;
}
const stores = new Map<string, CombatStore>();

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
    store = { state: initial, listeners: new Set(), linked: new Set(), ready: new Set(), pending: {}, revision: 0 };
    stores.set(key, store);
  }
  return store;
}

function setStore(key: string, updater: (prev: GlyphesCombatMap) => GlyphesCombatMap) {
  const store = getStore(key);
  const next = updater(store.state);
  if (next === store.state) return;
  store.state = next;
  try {
    window.localStorage.setItem(key, JSON.stringify(store.state));
  } catch {
    /* quota */
  }
  store.listeners.forEach((l) => l(store.state));
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
      // Les états enregistrés avant la règle « blessures sur 3 » sont normalisés.
      const normalized: GlyphesCombatMap = {};
      for (const [id, token] of Object.entries(tokens)) {
        const store = getStore(key);
        const local = store.state[id];
        let next = defaultTokenState(token);
        // Sheet hydration and newer local actions win over a late snapshot.
        if (local && store.ready.has(id)) next = reconcileCounters(next, local, {});
        for (const field of Object.keys(store.pending[id] ?? {}) as (keyof CombatSnapshot)[]) {
          if (local) next = { ...next, [field]: local[field] };
        }
        normalized[id] = next;
      }
      setStore(key, (prev) => ({ ...prev, ...normalized }));
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
    const handler = ({ payload }: { payload: { tokenId: string; state: GlyphesTokenState; counterFields?: string[] } }) => {
      setStore(key, (prev) => {
        const store = getStore(key);
        let next = defaultTokenState(payload.state);
        const pending = store.pending[payload.tokenId] ?? {};
        const previous = prev[payload.tokenId];
        if (previous && store.linked.has(payload.tokenId)) {
          for (const field of COUNTER_FIELDS) {
            if (!payload.counterFields?.includes(field) || !store.ready.has(payload.tokenId)) next[field] = previous[field];
          }
        }
        for (const field of Object.keys(pending) as (keyof CombatSnapshot)[]) {
          const local = prev[payload.tokenId];
          if (local) next = { ...next, [field]: local[field] };
        }
        return { ...prev, [payload.tokenId]: next };
      });
    };
    channel.on?.("broadcast", { event: EVENT }, handler);
    return () => {
      channel.off?.("broadcast", { event: EVENT }, handler);
    };
  }, [campaignId, enabled, key]);

  const push = useCallback(
    (tokenId: string, state: GlyphesTokenState, counterFields: string[] = []) => {
      if (!campaignId) return;
      try {
        const channel: any = getDiceChannel(campaignId);
        channel.send?.({ type: "broadcast", event: EVENT, payload: { tokenId, state, counterFields } });
      } catch {
        /* non bloquant */
      }
    },
    [campaignId],
  );

  const configureLinked = useCallback((ids: string[]) => {
    const store = getStore(key);
    const next = new Set(ids);
    for (const id of store.linked) if (!next.has(id)) { store.ready.delete(id); delete store.pending[id]; }
    for (const id of next) store.ready.delete(id);
    store.linked = next;
  }, [key]);

  const isReady = useCallback((id: string) => {
    const store = getStore(key);
    return !store.linked.has(id) || store.ready.has(id);
  }, [key]);

  const acceptSheet = useCallback((tokenId: string, data: Record<string, any> | null, authoritative = false) => {
    const store = getStore(key);
    const sheet = { wounds: 0, heroism: 0, resilience: 4, ...systemDataToCombat(data) };
    const wasReady = store.ready.has(tokenId);
    store.ready.add(tokenId);
    setStore(key, prev => {
      const previous = prev[tokenId] ?? defaultTokenState();
      const next = reconcileCounters(previous, sheet, authoritative ? {} : store.pending[tokenId] ?? {});
      if (authoritative) {
        store.pending[tokenId] = recordEdits(previous, next, systemDataToCombat(data), store.pending[tokenId] ?? {}, ++store.revision);
      }
      if (wasReady && JSON.stringify(previous) === JSON.stringify(next) && prev[tokenId]) return prev;
      return { ...prev, [tokenId]: next };
    });
  }, [key]);

  const getPending = useCallback((id: string) => ({ ...(getStore(key).pending[id] ?? {}) }), [key]);
  const acknowledge = useCallback((id: string, sent: PendingEdits) => {
    const store = getStore(key);
    store.pending[id] = acknowledgeEdits(store.pending[id] ?? {}, sent);
    // Notify even when a newer edit already holds the same displayed value.
    setStore(key, prev => ({ ...prev }));
  }, [key]);

  const getState = useCallback(
    (tokenId: string, defaults?: Partial<GlyphesTokenState>) =>
      states[tokenId] ?? defaultTokenState(defaults),
    [states],
  );

  const update = useCallback(
    (tokenId: string, patch: Partial<GlyphesTokenState>) => {
      setStates((prev) => {
        const store = getStore(key);
        const previous = prev[tokenId] ?? defaultTokenState();
        const allowedPatch = { ...patch };
        if (store.linked.has(tokenId) && !store.ready.has(tokenId)) {
          for (const field of COUNTER_FIELDS) delete allowedPatch[field];
        }
        const next = defaultTokenState({ ...previous, ...allowedPatch });
        next.actionPoints = Math.max(0, Math.min(next.maxActionPoints, next.actionPoints));
        next.heroism = Math.max(0, Math.min(MAX_HEROISM, next.heroism));
        next.wounds = Math.max(0, Math.min(next.maxWounds, next.wounds));
        store.pending[tokenId] = recordEdits(previous, next, allowedPatch, store.pending[tokenId] ?? {}, ++store.revision);
        push(tokenId, next, COUNTER_FIELDS.filter(field => field in allowedPatch));
        return { ...prev, [tokenId]: next };
      });
    },
    [push, key, setStates],
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
      if (!isReady(tokenId) || cost > current.heroism) return false;
      update(tokenId, { heroism: current.heroism - cost, spentHeroismThisTurn: true });
      return true;
    },
    [states, update, isReady],
  );

  const gainHeroism = useCallback(
    (tokenId: string, amount: number) => {
      const current = states[tokenId] ?? defaultTokenState();
      if (!isReady(tokenId) || current.spentHeroismThisTurn || amount <= 0) return;
      update(tokenId, { heroism: current.heroism + amount });
    },
    [states, update, isReady],
  );

  return { states, getState, update, startTurn, spend, spendHeroism, gainHeroism, configureLinked, isReady, acceptSheet, getPending, acknowledge };
}
