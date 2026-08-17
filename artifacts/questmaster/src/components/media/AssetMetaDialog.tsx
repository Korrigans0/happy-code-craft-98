// AssetMetaDialog — Édition du classement d'un média (nom, dossier, étiquettes).
//
// Utilisé par la bibliothèque d'assets : le MJ peut ranger un fichier dans un
// dossier existant ou nouveau, et lui coller des étiquettes libres pour la
// recherche transverse entre campagnes.

import { useEffect, useState, type KeyboardEvent } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { MediaAsset } from "@/hooks/useMediaLibrary";

interface Props {
  asset: MediaAsset | null;
  folders: string[];
  allTags: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (assetId: string, patch: { name: string; folder: string | null; tags: string[] }) => Promise<void>;
}

const normalize = (value: string) => value.trim().replace(/\s+/g, " ");

export function AssetMetaDialog({ asset, folders, allTags, open, onOpenChange, onSave }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [folder, setFolder] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!asset) return;
    setName(asset.name);
    setFolder(asset.folder ?? "");
    setTags(asset.tags ?? []);
    setTagDraft("");
  }, [asset]);

  const addTag = (raw: string) => {
    const value = normalize(raw).toLowerCase();
    if (!value) return;
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setTagDraft("");
  };

  const onTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    if (!asset) return;
    const cleanName = normalize(name) || asset.name;
    setSaving(true);
    try {
      await onSave(asset.id, {
        name: cleanName,
        folder: normalize(folder) || null,
        tags,
      });
      toast({ title: "Média mis à jour" });
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Enregistrement impossible", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const suggestions = allTags.filter((t) => !tags.includes(t)).slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Classer le média</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="asset-name">Nom</Label>
            <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asset-folder">Dossier</Label>
            <Input
              id="asset-folder"
              list="asset-folder-options"
              placeholder="Ex. Donjon de Karn"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
            <datalist id="asset-folder-options">
              {folders.map((f) => <option key={f} value={f} />)}
            </datalist>
            <p className="text-xs text-muted-foreground">Laissez vide pour ranger à la racine.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asset-tags">Étiquettes</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1 text-[11px]">
                  {t}
                  <button
                    type="button"
                    aria-label={`Retirer l'étiquette ${t}`}
                    onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              id="asset-tags"
              placeholder="Ajouter puis Entrée…"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={() => addTag(tagDraft)}
            />
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTag(t)}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                  >
                    <Tag className="h-3 w-3" aria-hidden />
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
