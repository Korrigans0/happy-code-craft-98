// ============================================================
// SFX ENGINE — lecture fiable des effets sonores ponctuels
// Fichier : src/lib/vtt/sfxEngine.ts
// ============================================================
//
// Pourquoi un moteur dédié plutôt qu'un `new Audio(url).play()` :
//  - les navigateurs bloquent la lecture tant que l'utilisateur n'a pas
//    interagi avec la page (autoplay policy) ; on débloque au premier geste ;
//  - un même effet peut être déclenché plusieurs fois de suite : la Web Audio
//    API permet de superposer les instances sans latence de téléchargement ;
//  - les buffers sont décodés une seule fois puis mis en cache.
//
// Fallback : si la Web Audio API est indisponible ou si le décodage échoue
// (flux distant sans CORS par exemple), on retombe sur un élément <audio>.

type Ctx = AudioContext & { resume: () => Promise<void> };

let ctx: Ctx | null = null;
let unlocked = false;
const buffers = new Map<string, AudioBuffer>();
const pending = new Map<string, Promise<AudioBuffer | null>>();
const listeners = new Set<(ready: boolean) => void>();

function getCtx(): Ctx | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Impl =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Impl) return null;
  ctx = new Impl() as Ctx;
  return ctx;
}

function notify() {
  for (const fn of listeners) fn(unlocked);
}

/** Indique si le moteur peut jouer un son sans geste utilisateur. */
export function isSfxUnlocked(): boolean {
  return unlocked || getCtx()?.state === "running";
}

export function onSfxUnlockChange(fn: (ready: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** À appeler depuis un geste utilisateur (clic, touche, tap). */
export async function unlockSfx(): Promise<boolean> {
  const c = getCtx();
  if (!c) return false;
  try {
    if (c.state !== "running") await c.resume();
    // Un buffer muet d'une frame suffit à « armer » iOS/Safari.
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, c.sampleRate);
    src.connect(c.destination);
    src.start(0);
    unlocked = c.state === "running";
  } catch {
    unlocked = false;
  }
  notify();
  return unlocked;
}

/** Installe le déblocage automatique au premier geste de l'utilisateur. */
export function installSfxAutoUnlock(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => { void unlockSfx(); };
  const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
  for (const e of events) window.addEventListener(e, handler, { passive: true });
  return () => { for (const e of events) window.removeEventListener(e, handler); };
}

async function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(url);
  if (cached) return cached;
  const inflight = pending.get(url);
  if (inflight) return inflight;

  const c = getCtx();
  if (!c) return null;

  const task = (async () => {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) return null;
      const raw = await res.arrayBuffer();
      const buf = await c.decodeAudioData(raw.slice(0));
      buffers.set(url, buf);
      return buf;
    } catch {
      return null;
    } finally {
      pending.delete(url);
    }
  })();

  pending.set(url, task);
  return task;
}

/** Précharge et décode un effet pour un déclenchement instantané. */
export function preloadSfx(url: string): void {
  void loadBuffer(url);
}

export interface PlaySfxResult {
  ok: boolean;
  /** true si le navigateur a refusé faute d'interaction utilisateur. */
  blocked: boolean;
}

/**
 * Joue un effet sonore ponctuel. Volume final = 0 → 1.
 * Renvoie `blocked: true` si un geste utilisateur est nécessaire.
 */
export async function playSfx(url: string, volume = 1): Promise<PlaySfxResult> {
  const vol = Math.min(1, Math.max(0, volume));
  if (vol === 0) return { ok: true, blocked: false };

  const c = getCtx();
  if (c) {
    if (c.state !== "running") {
      try { await c.resume(); } catch { /* ignoré */ }
    }
    if (c.state === "running") {
      unlocked = true;
      const buf = await loadBuffer(url);
      if (buf) {
        const src = c.createBufferSource();
        const gain = c.createGain();
        gain.gain.value = vol;
        src.buffer = buf;
        src.connect(gain).connect(c.destination);
        src.start(0);
        return { ok: true, blocked: false };
      }
    }
  }

  // Fallback élément <audio> (flux sans CORS, Web Audio indisponible…).
  try {
    const el = new Audio(url);
    el.crossOrigin = "anonymous";
    el.volume = vol;
    await el.play();
    return { ok: true, blocked: false };
  } catch {
    return { ok: false, blocked: true };
  }
}
