// Tabletop images (maps, token pictures) are stored as files and referenced by
// URL. Embedding them as base64 inside the shared tabletop row made that row
// several megabytes: every load, poll, save and live update re-sent the whole
// picture, which progressively froze game sessions.
import { supabase } from "@/integrations/supabase/client";

// Same public bucket and per-user folder convention as campaign banners.
const BUCKET = "avatars";
const MAX_BYTES = 25 * 1024 * 1024;

export const isInlineImage = (url: unknown): url is string =>
  typeof url === "string" && url.startsWith("data:image/");

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("Image illisible.");
  const mime = match[1];
  const raw = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// One upload per inline image per tab, even if several saves reference it.
const uploads = new Map<string, Promise<string>>();

/** Uploads an image for a campaign tabletop and returns its public URL. */
export async function uploadTabletopImage(campaignId: string, source: Blob | string): Promise<string> {
  if (typeof source === "string") {
    const cached = uploads.get(source);
    if (cached) return cached;
    const task = uploadTabletopImage(campaignId, dataUrlToBlob(source));
    uploads.set(source, task);
    task.catch(() => uploads.delete(source));
    return task;
  }
  if (!source.type.startsWith("image/")) throw new Error("Ce fichier n'est pas une image.");
  if (source.size > MAX_BYTES) throw new Error("Image trop lourde (25 Mo maximum).");
  const { data: auth } = await supabase.auth.getSession();
  const userId = auth.session?.user?.id;
  if (!userId) throw new Error("Vous devez être connecté pour importer une image.");
  const ext = EXTENSIONS[source.type] ?? "png";
  const path = `${userId}/campaign-maps/${campaignId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, source, {
    contentType: source.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error("L'image n'a pas pu être enregistrée. Réessayez.");
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

interface SceneLike { mapImageUrl?: string; tokens?: { imageUrl?: string }[] }
interface InlineState {
  map_image_url?: string | null;
  scenes?: unknown[];
  tokens?: unknown[];
}

/** True when a saved tabletop still embeds pictures (campaigns created before this fix). */
export function hasInlineImages(state: InlineState): boolean {
  if (isInlineImage(state.map_image_url)) return true;
  if ((state.tokens as { imageUrl?: string }[] | undefined)?.some((t) => isInlineImage(t?.imageUrl))) return true;
  return !!(state.scenes as SceneLike[] | undefined)?.some(
    (s) => isInlineImage(s?.mapImageUrl) || s?.tokens?.some((t) => isInlineImage(t?.imageUrl)),
  );
}

/**
 * Returns a copy where every embedded picture is replaced by an uploaded file
 * URL. Pictures are unchanged byte for byte; only how they are referenced
 * changes.
 */
export async function externalizeInlineImages<T extends InlineState>(campaignId: string, state: T): Promise<T> {
  const upload = (url: string | undefined | null) =>
    isInlineImage(url) ? uploadTabletopImage(campaignId, url) : Promise.resolve(url ?? undefined);
  const mapTokens = (tokens: unknown[] | undefined) =>
    tokens
      ? Promise.all(tokens.map(async (t) => {
          const token = t as { imageUrl?: string };
          return isInlineImage(token?.imageUrl) ? { ...token, imageUrl: await upload(token.imageUrl) } : t;
        }))
      : Promise.resolve(tokens);
  const [map_image_url, tokens, scenes] = await Promise.all([
    isInlineImage(state.map_image_url) ? upload(state.map_image_url) : Promise.resolve(state.map_image_url),
    mapTokens(state.tokens),
    state.scenes
      ? Promise.all(state.scenes.map(async (raw) => {
          const scene = raw as SceneLike;
          if (!hasInlineImages({ scenes: [scene] })) return raw;
          return {
            ...scene,
            mapImageUrl: await upload(scene.mapImageUrl),
            tokens: scene.tokens ? await mapTokens(scene.tokens) : scene.tokens,
          };
        }))
      : Promise.resolve(state.scenes),
  ]);
  return { ...state, map_image_url, tokens, scenes };
}
