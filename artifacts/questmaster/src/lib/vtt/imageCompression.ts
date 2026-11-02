// Re-encodes tabletop pictures before upload: every player downloads them.
// Maps keep their pixel size (they are drawn 1:1 and often contain a drawn
// grid that must stay aligned with the table grid); token pictures are shown
// small and are downscaled.

export type TabletopImageKind = "map" | "token";

/** Longest side kept per kind. Maps above this are resized (memory limits on phones). */
export const MAX_IMAGE_SIDE: Record<TabletopImageKind, number> = { map: 8192, token: 512 };
const WEBP_QUALITY = 0.88;
/** Re-encoded file must be at least this much smaller to replace the original. */
const MIN_GAIN = 0.9;
// Animated or vector pictures would lose animation / sharpness on a canvas.
const KEEP_AS_IS = new Set(["image/gif", "image/svg+xml"]);

export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide || longest <= 0) return { width, height };
  const ratio = maxSide / longest;
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

export function shouldUseCompressed(original: Blob, compressed: Blob | null, resized: boolean): boolean {
  if (!compressed || compressed.size === 0) return false;
  return resized || compressed.size <= original.size * MIN_GAIN;
}

/**
 * Returns a WebP version of the picture when it is meaningfully lighter (or had
 * to be resized); otherwise the original. Never throws: any decoding/encoding
 * failure (old browser, out of memory) falls back to the original file.
 */
export async function compressTabletopImage(source: Blob, kind: TabletopImageKind): Promise<Blob> {
  if (KEEP_AS_IS.has(source.type) || typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return source;
  }
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(source);
    const target = fitWithin(bitmap.width, bitmap.height, MAX_IMAGE_SIDE[kind]);
    const resized = target.width !== bitmap.width || target.height !== bitmap.height;
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return source;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, target.width, target.height);
    const compressed = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    // Safari versions without WebP encoding silently return PNG: keep it only if lighter.
    return shouldUseCompressed(source, compressed, resized) ? (compressed as Blob) : source;
  } catch {
    return source;
  } finally {
    bitmap?.close?.();
  }
}
