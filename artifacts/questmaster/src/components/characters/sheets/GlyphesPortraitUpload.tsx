import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AvatarCropDialog from "@/components/profile/AvatarCropDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function GlyphesPortraitUpload({ onChange }: { onChange: (url: string) => void }) {
  const { user } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const upload = async (blob: Blob) => {
    if (!user || uploading) return;
    setUploading(true);
    try {
      const path = `${user.id}/character-${crypto.randomUUID()}.png`;
      const { error } = await supabase.storage.from("character-avatars").upload(path, blob, { contentType: "image/png" });
      if (error) throw error;
      const { data } = supabase.storage.from("character-avatars").getPublicUrl(path);
      onChange(data.publicUrl);
      setFile(null);
    } catch {
      toast.error("Impossible d’importer le portrait. L’image précédente est conservée.");
    } finally {
      setUploading(false);
    }
  };
  return <>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="Importer le portrait Glyphes" onChange={e => {
      const selected = e.target.files?.[0];
      e.target.value = "";
      if (!selected) return;
      if (!["image/png", "image/jpeg", "image/webp"].includes(selected.type) || selected.size > 5 * 1024 * 1024) {
        toast.error("Choisissez une image PNG, JPEG ou WebP de moins de 5 Mo.");
        return;
      }
      setFile(selected);
    }} />
    <Button type="button" variant="outline" size="sm" disabled={!user || uploading} onClick={() => input.current?.click()}>
      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}Portrait
    </Button>
    <AvatarCropDialog file={file} open={!!file} onCancel={() => setFile(null)} onConfirm={upload} isUploading={uploading} />
  </>;
}