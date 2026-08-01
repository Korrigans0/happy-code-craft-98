// ============================================================
// AUDIO — bibliothèque de pistes + état de lecture partagé
// Fichier : src/hooks/useCampaignAudio.ts
// ============================================================
//
// Deux tables :
//  - `campaign_audio_tracks` : bibliothèque (fichiers importés dans le bucket
//    privé `campaign-audio` OU liens externes, y compris YouTube).
//  - `campaign_audio_state`  : état de lecture partagé, piloté par le MJ seul
//    (RLS). Les joueurs le lisent et suivent, avec leur propre volume local.
//
// La synchro passe par Realtime (websocket) : voir useRealtimeChannel.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";

const BUCKET = "campaign-audio";
/** 50 Mo : au-delà, le streaming en session devient pénible. */
export const MAX_AUDIO_SIZE = 50 * 1024 * 1024;

export type AudioKind = "music" | "sfx";
export type AudioSource = "upload" | "url";

export interface AudioTrack {
  id: string;
  campaign_id: string;
  name: string;
  kind: AudioKind;
  source: AudioSource;
  file_path: string | null;
  external_url: string | null;
  size_bytes: number | null;
  loop_default: boolean;
  volume_default: number;
  created_by: string;
  created_at: string;
}

export interface AudioState {
  campaign_id: string;
  track_id: string | null;
  is_playing: boolean;
  loop: boolean;
  master_volume: number;
  started_at: string | null;
  sfx_event: { track_id: string; nonce: string } | null;
  updated_at: string;
}

/** Extrait l'identifiant YouTube d'une URL (watch, youtu.be, embed, shorts). */
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  return m ? m[1] : null;
}

export function isYoutube(track: AudioTrack | null | undefined): boolean {
  return !!track && track.source === "url" && !!track.external_url && !!youtubeId(track.external_url);
}

export function formatAudioSize(n: number | null): string {
  if (!n) return "—";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}

export function useCampaignAudio(campaignId: string, isGM: boolean) {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [state, setState] = useState<AudioState | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const urlCache = useRef<Map<string, string>>(new Map());

  // ── Chargement ────────────────────────────────────────────
  const loadTracks = useCallback(async () => {
    const { data } = await supabase
      .from("campaign_audio_tracks" as never)
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });
    setTracks((data ?? []) as unknown as AudioTrack[]);
  }, [campaignId]);

  const loadState = useCallback(async () => {
    const { data } = await supabase
      .from("campaign_audio_state" as never)
      .select("*")
      .eq("campaign_id", campaignId)
      .maybeSingle();
    setState((data as unknown as AudioState) ?? null);
  }, [campaignId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([loadTracks(), loadState()]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loadTracks, loadState]);

  // ── Temps réel ────────────────────────────────────────────
  const subscriptions = useMemo(
    () => [
      {
        table: "campaign_audio_state",
        event: "*" as const,
        filter: `campaign_id=eq.${campaignId}`,
        onChange: (payload: { new?: Record<string, unknown> | null; eventType?: string }) => {
          const row = payload.new;
          if (!row || Object.keys(row).length === 0) { setState(null); return; }
          setState(row as unknown as AudioState);
        },
      },
      {
        table: "campaign_audio_tracks",
        event: "*" as const,
        filter: `campaign_id=eq.${campaignId}`,
        onChange: () => { void loadTracks(); },
      },
    ],
    [campaignId, loadTracks]
  );

  const realtimeStatus = useRealtimeChannel({
    channelName: `campaign:${campaignId}:audio`,
    subscriptions,
    enabled: !!campaignId,
  });

  // Filet de sécurité si le websocket tombe.
  useEffect(() => {
    if (realtimeStatus === "connected") return;
    const t = setInterval(() => { void loadState(); void loadTracks(); }, 5000);
    return () => clearInterval(t);
  }, [realtimeStatus, loadState, loadTracks]);

  // ── URL de lecture (signée pour les fichiers importés) ────
  const resolveUrl = useCallback(async (track: AudioTrack): Promise<string | null> => {
    if (track.source === "url") return track.external_url;
    if (!track.file_path) return null;
    const cached = urlCache.current.get(track.file_path);
    if (cached) return cached;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(track.file_path, 6 * 3600);
    if (!data?.signedUrl) return null;
    urlCache.current.set(track.file_path, data.signedUrl);
    return data.signedUrl;
  }, []);

  // ── Écritures MJ ──────────────────────────────────────────
  const writeState = useCallback(
    async (patch: Partial<AudioState>) => {
      if (!isGM) return;
      // Optimiste : le MJ voit sa propre action immédiatement.
      setState((prev) => ({
        campaign_id: campaignId,
        track_id: null,
        is_playing: false,
        loop: true,
        master_volume: 0.7,
        started_at: null,
        sfx_event: null,
        updated_at: new Date().toISOString(),
        ...(prev ?? {}),
        ...patch,
      } as AudioState));
      const { error } = await supabase
        .from("campaign_audio_state" as never)
        .upsert({ campaign_id: campaignId, ...patch } as never, { onConflict: "campaign_id" });
      if (error) throw new Error(error.message);
    },
    [campaignId, isGM]
  );

  const play = useCallback(
    (track: AudioTrack) =>
      writeState({
        track_id: track.id,
        is_playing: true,
        loop: track.loop_default,
        started_at: new Date().toISOString(),
      }),
    [writeState]
  );

  const pause = useCallback(() => writeState({ is_playing: false }), [writeState]);
  const resume = useCallback(() => writeState({ is_playing: true }), [writeState]);
  const stop = useCallback(
    () => writeState({ is_playing: false, track_id: null, started_at: null }),
    [writeState]
  );
  const setLoop = useCallback((loop: boolean) => writeState({ loop }), [writeState]);
  const setMasterVolume = useCallback(
    (master_volume: number) => writeState({ master_volume }),
    [writeState]
  );

  /** Déclenche un effet ponctuel chez tous les clients. */
  const triggerSfx = useCallback(
    (track: AudioTrack) =>
      writeState({ sfx_event: { track_id: track.id, nonce: crypto.randomUUID() } }),
    [writeState]
  );

  const uploadTrack = useCallback(
    async (file: File, kind: AudioKind, name?: string) => {
      if (!isGM) throw new Error("Seul le MJ peut ajouter des pistes.");
      if (file.size > MAX_AUDIO_SIZE) {
        throw new Error(`Fichier trop lourd (${formatAudioSize(file.size)}). Maximum 50 Mo.`);
      }
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Session expirée.");

      setUploading(true);
      const ext = (file.name.split(".").pop() || "mp3").toLowerCase();
      const path = `${campaignId}/${crypto.randomUUID()}.${ext}`;
      try {
        const up = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type || "audio/mpeg",
          upsert: false,
        });
        if (up.error) throw new Error(up.error.message);

        const { error } = await supabase.from("campaign_audio_tracks" as never).insert({
          campaign_id: campaignId,
          name: name?.trim() || file.name.replace(/\.[^.]+$/, ""),
          kind,
          source: "upload",
          file_path: path,
          size_bytes: file.size,
          loop_default: kind === "music",
          volume_default: kind === "music" ? 0.6 : 0.9,
          created_by: uid,
        } as never);
        if (error) {
          await supabase.storage.from(BUCKET).remove([path]);
          throw new Error(error.message);
        }
        await loadTracks();
      } finally {
        setUploading(false);
      }
    },
    [campaignId, isGM, loadTracks]
  );

  const addUrlTrack = useCallback(
    async (name: string, url: string, kind: AudioKind) => {
      if (!isGM) throw new Error("Seul le MJ peut ajouter des pistes.");
      const clean = url.trim();
      if (!/^https?:\/\//i.test(clean)) throw new Error("Le lien doit commencer par http(s)://");
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Session expirée.");

      const { error } = await supabase.from("campaign_audio_tracks" as never).insert({
        campaign_id: campaignId,
        name: name.trim() || clean.slice(0, 60),
        kind,
        source: "url",
        external_url: clean,
        loop_default: kind === "music",
        volume_default: kind === "music" ? 0.6 : 0.9,
        created_by: uid,
      } as never);
      if (error) throw new Error(error.message);
      await loadTracks();
    },
    [campaignId, isGM, loadTracks]
  );

  const deleteTrack = useCallback(
    async (track: AudioTrack) => {
      if (!isGM) return;
      if (state?.track_id === track.id) await stop();
      if (track.source === "upload" && track.file_path) {
        await supabase.storage.from(BUCKET).remove([track.file_path]);
        urlCache.current.delete(track.file_path);
      }
      const { error } = await supabase.from("campaign_audio_tracks" as never).delete().eq("id", track.id);
      if (error) throw new Error(error.message);
      await loadTracks();
    },
    [isGM, loadTracks, state?.track_id, stop]
  );

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === state?.track_id) ?? null,
    [tracks, state?.track_id]
  );

  return {
    tracks,
    music: useMemo(() => tracks.filter((t) => t.kind === "music"), [tracks]),
    sfx: useMemo(() => tracks.filter((t) => t.kind === "sfx"), [tracks]),
    state,
    currentTrack,
    loading,
    uploading,
    realtimeStatus,
    resolveUrl,
    play,
    pause,
    resume,
    stop,
    setLoop,
    setMasterVolume,
    triggerSfx,
    uploadTrack,
    addUrlTrack,
    deleteTrack,
  };
}
