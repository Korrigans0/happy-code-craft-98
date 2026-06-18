// BannerUpload — Upload d'image de bannière depuis le PC/mobile.
//
// Stocke l'image dans le bucket public `avatars` sous le préfixe `campaign-banners/`
// et renvoie l'URL publique via `onChange`. Évite à l'utilisateur d'avoir à
// fournir une URL externe.

import { useRef, useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Props {
  value: string;
  onChange: (url: string) => void;
  aspect?: "video" | "banner";
}

const BUCKET = "avatars";
const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo

export function BannerUpload({ value, onChange, aspect = "video" }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!user) {
      toast({ title: "Connectez-vous d'abord", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Format non supporté", description: "Choisissez une image (JPG, PNG, WebP).", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "Image trop lourde", description: "Maximum 8 Mo.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${user.id}/campaign-banners/${Date.now()}.${ext || "jpg"}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      });
      if (up.error) throw up.error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
      toast({ title: "Bannière importée ✓" });
    } catch (err) {
      console.error("[BannerUpload]", err);
      toast({ title: "Échec de l'envoi", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const aspectClass = aspect === "video" ? "aspect-video" : "h-32";

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {value ? (
        <div className={`relative ${aspectClass} w-full overflow-hidden rounded-lg border border-border/60 bg-muted`}>
          <img
            src={value}
            alt="Bannière"
            className="h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handlePick}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
              Changer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange("")}
              disabled={uploading}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePick}
          disabled={uploading}
          className={`group flex ${aspectClass} w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-card/40 text-muted-foreground transition hover:border-primary/60 hover:text-foreground disabled:opacity-50`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 opacity-60 group-hover:opacity-100" />
              <span className="text-sm font-medium">Importer une image</span>
              <span className="text-xs opacity-70">JPG, PNG ou WebP — max 8 Mo</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
