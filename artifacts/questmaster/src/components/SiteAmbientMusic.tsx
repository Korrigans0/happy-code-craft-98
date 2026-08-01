import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Music, VolumeX } from "lucide-react";
import ambientAsset from "@/assets/aetheria-ambient.mp3.asset.json";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "aetheria.ambient.muted";
const DEFAULT_VOLUME = 0.08; // ambiance très discrète

/**
 * Global ambient music player for the marketing / navigation side of the site.
 * Fully isolated from the in-campaign audio system (CampaignAudioPlayer):
 * it unmounts its <audio> element whenever the user is inside a campaign session.
 */
const SiteAmbientMusic = () => {
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [started, setStarted] = useState(false);

  // Route inside a campaign session -> ambient music must be silent.
  const inCampaign = /^\/campaigns\/[^/]+/.test(location.pathname);
  const enabled = !inCampaign && !muted;

  // Start playback on the very first user interaction (browser autoplay policy).
  useEffect(() => {
    if (started) return;
    const unlock = () => setStarted(true);
    const opts = { once: true, passive: true } as AddEventListenerOptions;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, [started]);

  // Play / pause according to route + mute state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = DEFAULT_VOLUME;
    if (enabled && started) {
      void audio.play().catch(() => {
        /* autoplay refused, will retry on next interaction */
      });
    } else {
      audio.pause();
    }
  }, [enabled, started]);

  // Clean unmount: make sure no ghost audio element keeps playing.
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
    setStarted(true);
  }, []);

  if (inCampaign) return null;

  return (
    <>
      <audio ref={audioRef} src={ambientAsset.url} loop preload="none" />
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Activer la musique d'ambiance" : "Couper la musique d'ambiance"}
        title={muted ? "Activer la musique d'ambiance" : "Couper la musique d'ambiance"}
        className={cn(
          "fixed bottom-20 right-3 z-40 flex h-9 w-9 items-center justify-center rounded-full",
          "border border-primary/30 bg-background/70 text-primary/80 backdrop-blur-sm",
          "transition-all hover:border-primary/60 hover:text-primary hover:shadow-[0_0_12px_hsl(var(--primary)/0.35)]",
          "md:bottom-4",
        )}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Music className="h-4 w-4" />}
      </button>
    </>
  );
};

export default SiteAmbientMusic;
