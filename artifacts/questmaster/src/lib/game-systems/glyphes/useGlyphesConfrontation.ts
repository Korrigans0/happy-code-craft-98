// Confrontation Glyphes partagée par la campagne : enjeux, rounds, ordre de
// jeu et issue. Synchronisée en temps réel sur le canal de la campagne et
// conservée localement pour survivre à un rechargement de page.

import { useCallback, useEffect, useRef, useState } from "react";
import { getDiceChannel } from "@/lib/vtt/diceBroadcast";
import { createDebouncedSaver, loadGlyphesState } from "./persistence";
import {
  createConfrontation,
  nextRound,
  orderParticipants,
  resolveConfrontation,
  type Confrontation,
  type ConfrontationOutcome,
  type ConfrontationParticipant,
} from "./confrontations";

const EVENT = "glyphes-confrontation";

/** Campagnes déjà chargées depuis le serveur (une seule lecture par onglet). */
const hydrated = new Set<string>();
const saveState = createDebouncedSaver();

function storageKey(campaignId?: string | null) {
  return `glyphes-confrontation-${campaignId ?? "local"}`;
}

export function useGlyphesConfrontation(campaignId?: string | null) {
  const [confrontation, setConfrontation] = useState<Confrontation | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(storageKey(campaignId));
      return raw ? (JSON.parse(raw) as Confrontation) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (confrontation) {
        window.localStorage.setItem(storageKey(campaignId), JSON.stringify(confrontation));
      } else {
        window.localStorage.removeItem(storageKey(campaignId));
      }
    } catch {
      /* quota */
    }
  }, [confrontation, campaignId]);

  useEffect(() => {
    if (!campaignId) return;
    const channel: any = getDiceChannel(campaignId);
    const handler = ({ payload }: { payload: { confrontation: Confrontation | null } }) => {
      setConfrontation(payload.confrontation);
    };
    channel.on?.("broadcast", { event: EVENT }, handler);
    return () => {
      channel.off?.("broadcast", { event: EVENT }, handler);
    };
  }, [campaignId]);

  const push = useCallback(
    (next: Confrontation | null) => {
      if (!campaignId) return;
      try {
        const channel: any = getDiceChannel(campaignId);
        channel.send?.({ type: "broadcast", event: EVENT, payload: { confrontation: next } });
      } catch {
        /* non bloquant */
      }
    },
    [campaignId],
  );

  const commit = useCallback(
    (next: Confrontation | null) => {
      setConfrontation(next);
      push(next);
    },
    [push],
  );

  const start = useCallback((name: string) => commit(createConfrontation(name)), [commit]);

  const end = useCallback(() => commit(null), [commit]);

  const patch = useCallback(
    (changes: Partial<Confrontation>) => {
      if (!confrontation) return;
      commit({ ...confrontation, ...changes });
    },
    [confrontation, commit],
  );

  const addParticipant = useCallback(
    (participant: ConfrontationParticipant) => {
      if (!confrontation) return;
      if (confrontation.participants.some((p) => p.id === participant.id)) return;
      commit({
        ...confrontation,
        participants: orderParticipants([...confrontation.participants, participant]),
      });
    },
    [confrontation, commit],
  );

  const updateParticipant = useCallback(
    (id: string, changes: Partial<ConfrontationParticipant>) => {
      if (!confrontation) return;
      commit({
        ...confrontation,
        participants: confrontation.participants.map((p) => (p.id === id ? { ...p, ...changes } : p)),
      });
    },
    [confrontation, commit],
  );

  const removeParticipant = useCallback(
    (id: string) => {
      if (!confrontation) return;
      commit({ ...confrontation, participants: confrontation.participants.filter((p) => p.id !== id) });
    },
    [confrontation, commit],
  );

  const reorder = useCallback(() => {
    if (!confrontation) return;
    commit({ ...confrontation, participants: orderParticipants(confrontation.participants) });
  }, [confrontation, commit]);

  const advanceRound = useCallback(() => {
    if (!confrontation) return;
    commit(nextRound(confrontation));
  }, [confrontation, commit]);

  const resolve = useCallback(
    (outcome: ConfrontationOutcome) => {
      if (!confrontation) return;
      commit(resolveConfrontation(confrontation, outcome));
    },
    [confrontation, commit],
  );

  return {
    confrontation,
    start,
    end,
    patch,
    addParticipant,
    updateParticipant,
    removeParticipant,
    reorder,
    advanceRound,
    resolve,
  };
}
