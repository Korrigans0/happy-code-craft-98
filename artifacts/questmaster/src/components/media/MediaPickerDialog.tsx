// MediaPickerDialog — Sélecteur réutilisable.
//
// Affiche la bibliothèque média du MJ dans une boîte de dialogue et retourne
// l'URL signée du média choisi via `onSelect(url)`. Utilisé par la VTT pour
// importer cartes et tokens depuis le stockage local au lieu d'une URL brute.

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MediaLibrary } from "./MediaLibrary";
import type { MediaFileType, MediaAsset } from "@/hooks/useMediaLibrary";

interface Props {
  fileType?: MediaFileType;
  campaignId?: string | null;
  onSelect: (asset: MediaAsset) => void;
  trigger?: React.ReactNode;
  title?: string;
}

export function MediaPickerDialog({ fileType, campaignId, onSelect, trigger, title }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card/40 px-3 py-1.5 text-sm hover:border-primary/50"
          >
            <ImagePlus className="h-4 w-4" />
            Choisir une image
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title ?? "Choisir un média"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <MediaLibrary
            defaultType={fileType}
            campaignId={campaignId ?? null}
            onPick={(a) => { onSelect(a); setOpen(false); }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
