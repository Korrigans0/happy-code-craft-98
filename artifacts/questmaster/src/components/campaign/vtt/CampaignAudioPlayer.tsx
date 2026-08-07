// ============================================================
// AUDIO — lecteur partagé (tous les participants)
// Fichier : src/components/campaign/vtt/CampaignAudioPlayer.tsx
// ============================================================
//
// Le MJ pilote l'état partagé (piste, lecture, boucle, volume maître) ;
// chaque joueur garde un volume local et peut se couper le son.
// Volume effectif = volume maître (MJ) × volume local (joueur).
//
// Deux moteurs de lecture :
//  - <audio> pour les fichiers importés et les liens audio directs,
//  - IFrame YouTube (API JS) pour les liens YouTube.

import { useCallback, useEffect, useRef, useState } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useCampaignAudio,
  youtubeId,
  isYoutube,
  type AudioTrack,
} from "@/hooks/useCampaignAudio";

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  loadVideoById: (id: string) => void;
  destroy: () => void;
}

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const w = window as unknown as { YT?: { Player: unknown }; onYouTubeIframeAPIReady?: () => void };
    if (w.YT?.Player) return resolve();
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return ytApiPromise;
}

interface Props {
  campaignId: string;
  isGM: boolean;
  /** Instance partagée du hook (évite deux abonnements Realtime). */
  audio: ReturnType<typeof useCampaignAudio>;
}

export default function CampaignAudioPlayer({ campaignId, isGM, audio }: Props) {
  const { state, currentTrack, tracks, resolveUrl } = audio;

  const storageKey = `vtt-audio-local-${campaignId}`;
  const [localVolume, setLocalVolume] = useState<number>(() => {
    const raw = localStorage.getItem(storageKey);
    const n = raw === null ? 1 : Number(raw);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
  });
  const [muted, setMuted] = useState<boolean>(() => localStorage.getItem(`${storageKey}-muted`) === "1");
  // Les navigateurs bloquent l'autoplay tant que l'utilisateur n'a pas interagi.
  const [blocked, setBlocked] = useState(false);

  useEffect(() => { localStorage.setItem(storageKey, String(localVolume)); }, [localVolume, storageKey]);
  useEffect(() => { localStorage.setItem(`${storageKey}-muted`, muted ? "1" : "0"); }, [muted, storageKey]);

  const master = state?.master_volume ?? 0.7;
  const effective = muted ? 0 : Math.min(1, Math.max(0, master * localVolume));

  // ── Élément <audio> (fichiers & liens directs) ────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
  }

  const yt = useRef<YTPlayer | null>(null);
  const ytHostRef = useRef<HTMLDivElement | null>(null);

  const usingYoutube = isYoutube(currentTrack);

  // Charge / change la piste courante.
  useEffect(() => {
    let cancelled = false;
    const el = audioRef.current;

    const run = async () => {
      if (!currentTrack || usingYoutube) {
        if (el) { el.pause(); el.removeAttribute("src"); el.load(); }
        return;
      }
      const url = await resolveUrl(currentTrack);
      if (cancelled || !el || !url) return;
      if (el.src !== url) { el.src = url; el.load(); }
      el.loop = state?.loop ?? true;
      el.volume = effective;
      if (state?.is_playing) {
        el.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
      } else {
        el.pause();
      }
    };
    void run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, state?.is_playing, state?.loop, usingYoutube]);

  // Volume en direct sans recharger la piste.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = effective;
    yt.current?.setVolume(Math.round(effective * 100));
  }, [effective]);

  // ── YouTube ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const vid = usingYoutube && currentTrack?.external_url ? youtubeId(currentTrack.external_url) : null;

    if (!vid) {
      yt.current?.destroy?.();
      yt.current = null;
      return;
    }

    void loadYouTubeApi().then(() => {
      if (cancelled || !ytHostRef.current) return;
      const w = window as unknown as { YT: { Player: new (el: HTMLElement, o: unknown) => YTPlayer } };
      if (!yt.current) {
        yt.current = new w.YT.Player(ytHostRef.current, {
          height: "1",
          width: "1",
          videoId: vid,
          playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1 },
          events: {
            onReady: () => {
              yt.current?.setVolume(Math.round(effective * 100));
              if (state?.is_playing) yt.current?.playVideo();
            },
            onStateChange: (e: { data: number }) => {
              // 0 = ended → relance si la boucle est active.
              if (e.data === 0 && (state?.loop ?? true)) yt.current?.playVideo();
            },
          },
        });
      } else {
        yt.current.loadVideoById(vid);
        yt.current.setVolume(Math.round(effective * 100));
        if (!state?.is_playing) yt.current.pauseVideo();
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, usingYoutube]);

  useEffect(() => {
    if (!usingYoutube || !yt.current) return;
    if (state?.is_playing) yt.current.playVideo();
    else yt.current.pauseVideo();
  }, [state?.is_playing, usingYoutube]);

  // ── Effets sonores ponctuels ──────────────────────────────
  // Déblocage automatique du moteur audio au premier geste utilisateur.
  useEffect(() => installSfxAutoUnlock(), []);
  useEffect(() => onSfxUnlockChange((ready) => { if (ready) setBlocked(false); }), []);

  // Préchargement des effets : déclenchement instantané, sans latence réseau.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      for (const t of tracks) {
        if (t.kind !== "sfx" || isYoutube(t)) continue;
        const url = await resolveUrl(t);
        if (cancelled) return;
        if (url) preloadSfx(url);
      }
    })();
    return () => { cancelled = true; };
  }, [tracks, resolveUrl]);

  const lastSfx = useRef<string | null>(null);
  const sfxInit = useRef(false);
  useEffect(() => {
    const evt = state?.sfx_event;
    // Au premier chargement, on ignore l'événement déjà présent en base
    // (sinon un vieil effet se rejoue à chaque arrivée sur la table).
    if (!sfxInit.current) {
      sfxInit.current = true;
      lastSfx.current = evt?.nonce ?? null;
      return;
    }
    if (!evt?.nonce || evt.nonce === lastSfx.current) return;
    lastSfx.current = evt.nonce;
    const track = tracks.find((t: AudioTrack) => t.id === evt.track_id);
    if (!track || isYoutube(track)) return;
    void (async () => {
      const url = await resolveUrl(track);
      if (!url) return;
      const res = await playSfx(url, Math.min(1, effective * (track.volume_default ?? 0.9)));
      if (res.blocked) setBlocked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.sfx_event?.nonce, tracks]);

  // Débloque l'autoplay au premier clic de l'utilisateur.
  const unblock = useCallback(() => {
    void unlockSfx();
    setBlocked(false);
    if (usingYoutube) yt.current?.playVideo();
    else audioRef.current?.play().catch(() => setBlocked(true));
  }, [usingYoutube]);

  useEffect(() => () => { audioRef.current?.pause(); yt.current?.destroy?.(); }, []);


  const playing = !!state?.is_playing && !!currentTrack;

  return (
    <>
      {/* Hôte invisible du lecteur YouTube */}
      <div ref={ytHostRef} className="pointer-events-none absolute h-px w-px opacity-0" aria-hidden />

      <Popover>
        <PopoverTrigger asChild>
          <button
            className="relative flex h-8 items-center gap-1.5 rounded-lg border border-primary/25 bg-card/80 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            title={playing ? `Ambiance : ${currentTrack?.name}` : "Audio"}
            aria-label="Réglages audio"
          >
            {muted || effective === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {playing && (
              <span className="hidden max-w-[110px] truncate sm:inline text-primary">{currentTrack?.name}</span>
            )}
            {playing && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/70" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 space-y-3">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            <span className="truncate text-sm font-medium text-foreground">
              {currentTrack ? currentTrack.name : "Aucune ambiance"}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Mon volume</span>
              <span>{Math.round(localVolume * 100)} %</span>
            </div>
            <Slider
              value={[Math.round(localVolume * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) => setLocalVolume(v / 100)}
            />
          </div>

          <button
            onClick={() => setMuted((m) => !m)}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            {muted ? "Réactiver le son" : "Couper le son"}
          </button>

          {isGM && (
            <p className="text-[11px] text-muted-foreground">
              Volume maître de la table : {Math.round(master * 100)} % (onglet Audio du panneau MJ).
            </p>
          )}

          {blocked && (
            <button
              onClick={unblock}
              className="w-full rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground"
            >
              Activer le son
            </button>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
