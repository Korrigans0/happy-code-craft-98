// useMediaLibrary — Stockage MJ : upload optimisé, quota, anti-doublon.
//
// Le hook centralise toutes les opérations sur le bucket `gm-media` et la
// table `media_assets`. Il compresse les images côté client (WebP), génère
// une miniature, calcule un hash SHA-256 pour éviter les doublons, et vérifie
// la consommation avant insertion. Les erreurs de quota remontent un message
// clair utilisable par les composants.

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const BUCKET = "gm-media";

export type MediaFileType =
  | "map" | "token" | "portrait" | "npc" | "creature" | "object" | "decor" | "document";

export interface MediaAsset {
  id: string;
  owner_id: string;
  campaign_id: string | null;
  name: string;
  file_type: MediaFileType;
  storage_path: string;
  thumbnail_path: string | null;
  mime: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  checksum: string | null;
  created_at: string;
  updated_at: string;
  // Champ enrichi côté client.
  url?: string;
  thumbnail_url?: string;
}

export interface StorageUsage {
  used_bytes: number;
  quota_bytes: number;
  file_count: number;
  tier: "free" | "gm_premium" | "premium_plus";
}

const MAX_DIM: Record<MediaFileType, number> = {
  map: 4096,
  token: 512,
  portrait: 1024,
  npc: 1024,
  creature: 1024,
  object: 1024,
  decor: 2048,
  document: 4096,
};
const THUMB_DIM = 256;

async function sha256(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

async function resizeToBlob(img: HTMLImageElement, maxDim: number, quality = 0.85): Promise<{ blob: Blob; w: number; h: number }> {
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponible");
  ctx.drawImage(img, 0, 0, w, h);
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Compression échouée"))), "image/webp", quality);
  });
  return { blob, w, h };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} Mo`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} Go`;
}

async function signUrl(path: string | null): Promise<string | undefined> {
  if (!path) return undefined;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) return undefined;
  return data?.signedUrl;
}

export function useMediaLibrary() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const urlCache = useRef<Map<string, string>>(new Map());

  const enrich = useCallback(async (rows: MediaAsset[]): Promise<MediaAsset[]> => {
    return Promise.all(rows.map(async (r) => {
      const cacheKey = r.thumbnail_path ?? r.storage_path;
      let url = urlCache.current.get(cacheKey);
      if (!url) {
        url = await signUrl(cacheKey);
        if (url) urlCache.current.set(cacheKey, url);
      }
      let full = urlCache.current.get(r.storage_path);
      if (!full) {
        full = await signUrl(r.storage_path);
        if (full) urlCache.current.set(r.storage_path, full);
      }
      return { ...r, thumbnail_url: url, url: full };
    }));
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [a, u] = await Promise.all([
        supabase.from("media_assets").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
        supabase.rpc("get_storage_usage", { _user_id: user.id }),
      ]);
      if (a.error) throw a.error;
      const enriched = await enrich((a.data ?? []) as MediaAsset[]);
      setAssets(enriched);
      if (!u.error && u.data && Array.isArray(u.data) && u.data.length > 0) {
        const row = u.data[0] as any;
        setUsage({
          used_bytes: Number(row.used_bytes ?? 0),
          quota_bytes: Number(row.quota_bytes ?? 0),
          file_count: Number(row.file_count ?? 0),
          tier: row.tier ?? "free",
        });
      }
    } catch (e) {
      console.error("[useMediaLibrary] refresh", e);
    } finally {
      setLoading(false);
    }
  }, [user, enrich]);

  useEffect(() => { void refresh(); }, [refresh]);

  const upload = useCallback(async (
    file: File,
    opts: { fileType: MediaFileType; campaignId?: string | null; name?: string }
  ): Promise<MediaAsset> => {
    if (!user) throw new Error("Non authentifié");

    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith("image/");
    if (!isImage && !isPdf) throw new Error("Formats acceptés : images et PDF.");

    setUploading(true);
    try {
      let mainBlob: Blob;
      let thumbBlob: Blob | null = null;
      let mainMime: string;
      let mainExt: string;
      let width: number | null = null;
      let height: number | null = null;

      if (isImage) {
        const img = await loadImage(file);
        const main = await resizeToBlob(img, MAX_DIM[opts.fileType] ?? 2048, 0.85);
        const thumb = await resizeToBlob(img, THUMB_DIM, 0.8);
        mainBlob = main.blob;
        thumbBlob = thumb.blob;
        mainMime = "image/webp";
        mainExt = "webp";
        width = main.w;
        height = main.h;
      } else {
        // PDF : stocké tel quel, pas de miniature image.
        mainBlob = file;
        mainMime = "application/pdf";
        mainExt = "pdf";
      }
      const checksum = await sha256(mainBlob);

      // Anti-doublon : si on a déjà ce checksum, on retourne l'asset existant.
      const dup = await supabase
        .from("media_assets")
        .select("*")
        .eq("owner_id", user.id)
        .eq("checksum", checksum)
        .maybeSingle();
      if (!dup.error && dup.data) {
        const [enriched] = await enrich([dup.data as MediaAsset]);
        return enriched;
      }

      const stamp = Date.now();
      const safeName = (opts.name ?? file.name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
      const base = `${user.id}/${opts.fileType}/${stamp}-${safeName}`;
      const mainPath = `${base}.${mainExt}`;
      const thumbPath = thumbBlob ? `${base}.thumb.webp` : null;

      const up1 = await supabase.storage.from(BUCKET).upload(mainPath, mainBlob, { contentType: mainMime, upsert: false });
      if (up1.error) throw up1.error;
      if (thumbBlob && thumbPath) {
        const up2 = await supabase.storage.from(BUCKET).upload(thumbPath, thumbBlob, { contentType: "image/webp", upsert: false });
        if (up2.error) {
          await supabase.storage.from(BUCKET).remove([mainPath]);
          throw up2.error;
        }
      }

      const ins = await supabase.from("media_assets").insert({
        owner_id: user.id,
        campaign_id: opts.campaignId ?? null,
        name: opts.name ?? file.name,
        file_type: isPdf ? "document" : opts.fileType,
        storage_path: mainPath,
        thumbnail_path: thumbPath,
        mime: mainMime,
        size_bytes: mainBlob.size,
        width,
        height,
        checksum,
      }).select().single();

      if (ins.error) {
        const paths = [mainPath, thumbPath].filter(Boolean) as string[];
        await supabase.storage.from(BUCKET).remove(paths);
        if (ins.error.message?.includes("STORAGE_QUOTA_EXCEEDED")) {
          throw new Error("Quota de stockage dépassé. Supprimez des fichiers ou passez à une offre supérieure.");
        }
        throw new Error(ins.error.message);
      }

      const [enriched] = await enrich([ins.data as MediaAsset]);
      setAssets((prev) => [enriched, ...prev]);
      void refresh();
      return enriched;
    } finally {
      setUploading(false);
    }
  }, [user, refresh, enrich]);


  const remove = useCallback(async (asset: MediaAsset) => {
    const paths = [asset.storage_path, asset.thumbnail_path].filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    const r = await supabase.from("media_assets").delete().eq("id", asset.id);
    if (r.error) throw new Error(r.error.message);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    void refresh();
  }, [refresh]);

  const rename = useCallback(async (asset: MediaAsset, name: string) => {
    const r = await supabase.from("media_assets").update({ name }).eq("id", asset.id).select().single();
    if (r.error) throw new Error(r.error.message);
    setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, name } : a)));
  }, []);

  return { assets, usage, loading, uploading, upload, remove, rename, refresh };
}
