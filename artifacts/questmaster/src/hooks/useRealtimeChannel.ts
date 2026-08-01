// ============================================================
// REALTIME — abonnement Postgres Changes par campagne
// Fichier : src/hooks/useRealtimeChannel.ts
// ============================================================
//
// Un seul channel par campagne et par consommateur (`campaign:<id>:<scope>`),
// avec un ou plusieurs abonnements `postgres_changes` filtrés côté serveur
// (campaign_id) afin de ne jamais recevoir les évènements d'autres parties.
//
// Realtime respecte les policies RLS : un joueur ne reçoit que les lignes
// qu'il aurait le droit de lire via l'API REST. Aucune règle supplémentaire
// n'est donc nécessaire côté client.

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

export interface RealtimeSubscription {
  /** Table du schéma public à écouter. */
  table: string;
  /** Type d'évènement ; "*" par défaut. */
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  /** Filtre serveur PostgREST, ex. `campaign_id=eq.<uuid>`. */
  filter?: string;
  /** Callback appelé pour chaque évènement reçu. */
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
}

interface Options {
  /** Nom unique du channel (ex. `campaign:<id>:tabletop`). */
  channelName: string;
  subscriptions: RealtimeSubscription[];
  /** Désactive proprement l'abonnement (ex. campagne non chargée). */
  enabled?: boolean;
}

/**
 * Abonne le composant aux changements Postgres en temps réel et expose
 * l'état de la connexion websocket pour permettre un fallback en polling.
 */
export function useRealtimeChannel({ channelName, subscriptions, enabled = true }: Options): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>(enabled ? "connecting" : "disconnected");

  // Les callbacks changent à chaque render : on les garde dans une ref pour
  // que le channel ne soit jamais recréé inutilement (évite les reconnexions
  // en boucle et les fuites d'abonnements).
  const subsRef = useRef(subscriptions);
  subsRef.current = subscriptions;

  // Signature stable des abonnements (table/event/filter uniquement).
  const signature = subscriptions.map((s) => `${s.table}|${s.event ?? "*"}|${s.filter ?? ""}`).join(";");

  useEffect(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let channel: RealtimeChannel | null = null;

    const connect = () => {
      if (cancelled) return;
      setStatus((s) => (s === "connected" ? s : "connecting"));

      channel = supabase.channel(channelName, { config: { broadcast: { self: false } } });

      subsRef.current.forEach((sub, index) => {
        channel!.on(
          "postgres_changes" as never,
          {
            event: sub.event ?? "*",
            schema: "public",
            table: sub.table,
            ...(sub.filter ? { filter: sub.filter } : {}),
          } as never,
          ((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            // On relit la ref pour toujours appeler le callback le plus récent.
            subsRef.current[index]?.onChange(payload);
          }) as never
        );
      });

      channel.subscribe((state) => {
        if (cancelled) return;
        if (state === "SUBSCRIBED") {
          attempts = 0;
          setStatus("connected");
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
          setStatus("disconnected");
          // Reconnexion avec backoff : 1s, 2s, 4s… max 20s.
          if (retryTimer) clearTimeout(retryTimer);
          const delay = Math.min(1000 * 2 ** attempts, 20_000);
          attempts = Math.min(attempts + 1, 5);
          retryTimer = setTimeout(() => {
            if (cancelled) return;
            if (channel) supabase.removeChannel(channel);
            channel = null;
            connect();
          }, delay);
        }
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (channel) supabase.removeChannel(channel);
    };
    // `signature` capture la forme des abonnements ; les callbacks passent par la ref.
  }, [channelName, enabled, signature]);

  return status;
}
