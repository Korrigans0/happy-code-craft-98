// ============================================================
// AUDIO — onglet MJ : bibliothèque et contrôles d'ambiance
// Fichier : src/components/campaign/vtt/AudioTab.tsx
// ============================================================

import { useRef, useState } from "react";
import {
  Music, Play, Pause, Square, Repeat, Trash2, Upload, Link2, Zap, Loader2, Volume2, Headphones,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { playSfx, unlockSfx } from "@/lib/vtt/sfxEngine";
import {
  formatAudioSize,
  isYoutube,
  type AudioKind,
  type AudioTrack,
  type useCampaignAudio,
} from "@/hooks/useCampaignAudio";


interface Props {
  audio: ReturnType<typeof useCampaignAudio>;
}

export default function AudioTab({ audio }: Props) {
  const {
    music, sfx, state, currentTrack, loading, uploading,
    play, pause, resume, stop, setLoop, setMasterVolume, triggerSfx,
    uploadTrack, addUrlTrack, deleteTrack,
  } = audio;

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pendingKind, setPendingKind] = useState<AudioKind>("music");
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlName, setUrlName] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [busy, setBusy] = useState(false);

  const guard = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); }
    catch (e) { toast({ title: "Audio", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await guard(async () => {
      await uploadTrack(file, pendingKind);
      toast({ title: "Piste ajoutée", description: file.name });
    });
  };

  const submitUrl = async () => {
    await guard(async () => {
      await addUrlTrack(urlName, urlValue, pendingKind);
      setUrlName(""); setUrlValue(""); setUrlOpen(false);
      toast({ title: "Lien ajouté" });
    });
  };

  const TrackRow = ({ t }: { t: AudioTrack }) => {
    const active = currentTrack?.id === t.id;
    return (
      <div
        className={`flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors ${
          active ? "border-primary/60 bg-primary/10" : "border-border bg-background/40"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">{t.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {t.source === "url" ? (isYoutube(t) ? "YouTube" : "Lien externe") : formatAudioSize(t.size_bytes)}
          </p>
        </div>
        {t.kind === "music" ? (
          <button
            title={active && state?.is_playing ? "Pause" : "Lancer"}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-primary"
            onClick={() => guard(() => (active && state?.is_playing ? pause() : active ? resume() : play(t)))}
          >
            {active && state?.is_playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        ) : (
          <>
            <button
              title="Écouter (moi seul)"
              className="rounded p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
              disabled={isYoutube(t)}
              onClick={() => void previewSfx(t)}
            >
              <Headphones className="h-4 w-4" />
            </button>
            <button
              title={isYoutube(t) ? "YouTube non supporté pour les effets" : "Déclencher pour tous"}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-amber-400 disabled:opacity-40"
              onClick={() => guard(async () => {
                await unlockSfx();
                await triggerSfx(t);
              })}
              disabled={isYoutube(t)}
            >
              <Zap className="h-4 w-4" />
            </button>
          </>
        )}

        <button
          title="Supprimer"
          className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
          onClick={() => { if (confirm(`Supprimer « ${t.name} » ?`)) void guard(() => deleteTrack(t)); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {/* Lecture en cours */}
      <div className="rounded-lg border border-primary/25 bg-background/50 p-2.5">
        <div className="mb-2 flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          <span className="truncate text-xs font-medium text-foreground">
            {currentTrack ? currentTrack.name : "Aucune ambiance"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="rounded border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-40"
            disabled={!currentTrack || busy}
            onClick={() => guard(() => (state?.is_playing ? pause() : resume()))}
            title={state?.is_playing ? "Pause" : "Reprendre"}
          >
            {state?.is_playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            className="rounded border border-border p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-40"
            disabled={!currentTrack || busy}
            onClick={() => guard(() => stop())}
            title="Arrêter"
          >
            <Square className="h-4 w-4" />
          </button>
          <button
            className={`rounded border border-border p-1.5 transition-colors ${
              state?.loop ?? true ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => guard(() => setLoop(!(state?.loop ?? true)))}
            title="Boucle"
          >
            <Repeat className="h-4 w-4" />
          </button>
          <div className="ml-1 flex flex-1 items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            <Slider
              value={[Math.round((state?.master_volume ?? 0.7) * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) => void setMasterVolume(v / 100)}
            />
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Volume maître de la table — chaque joueur garde son propre réglage.
        </p>
      </div>

      {/* Ajout */}
      <div className="space-y-2">
        <div className="flex gap-1">
          {(["music", "sfx"] as AudioKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setPendingKind(k)}
              className={`flex-1 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                pendingKind === k
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {k === "music" ? "Ambiance" : "Effet sonore"}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Importer
          </button>
          <button
            onClick={() => setUrlOpen((v) => !v)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Link2 className="h-3.5 w-3.5" />
            Lien
          </button>
        </div>
        <input ref={fileRef} type="file" accept="audio/*,.mp3,.ogg,.wav,.m4a" hidden onChange={onFile} />

        {urlOpen && (
          <div className="space-y-1.5 rounded-md border border-border bg-background/40 p-2">
            <input
              value={urlName}
              onChange={(e) => setUrlName(e.target.value)}
              placeholder="Nom de la piste"
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://… (MP3/OGG direct ou YouTube)"
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={submitUrl}
              disabled={busy || !urlValue.trim()}
              className="w-full rounded bg-primary py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              Ajouter
            </button>
            <p className="text-[10px] text-muted-foreground">
              YouTube fonctionne pour l'ambiance uniquement (pas pour les effets ponctuels).
            </p>
          </div>
        )}
      </div>

      {/* Bibliothèque */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {loading && <p className="text-center text-xs text-muted-foreground">Chargement…</p>}

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ambiances ({music.length})
          </p>
          {music.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground">Aucune musique d'ambiance.</p>
          )}
          {music.map((t) => <TrackRow key={t.id} t={t} />)}
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Effets sonores ({sfx.length})
          </p>
          {sfx.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground">Aucun effet sonore.</p>
          )}
          {sfx.map((t) => <TrackRow key={t.id} t={t} />)}
        </div>
      </div>
    </div>
  );
}
