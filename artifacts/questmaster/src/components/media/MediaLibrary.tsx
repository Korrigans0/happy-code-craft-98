// MediaLibrary — Grille de gestion des médias MJ.
//
// Affiche les images importées (cartes, tokens, portraits, etc.), filtre par
// type, recherche par nom, permet renommer / supprimer (unitairement ou en
// masse), supporte le drag-and-drop, et expose la jauge de stockage liée à
// l'abonnement du MJ.

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon, Loader2, Search, Trash2, Pencil, UploadCloud,
  AlertTriangle, CheckSquare, Square, FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMediaLibrary, formatBytes, type MediaAsset, type MediaFileType } from "@/hooks/useMediaLibrary";

const TYPE_OPTIONS: { value: MediaFileType | "all"; label: string }[] = [
  { value: "all", label: "Tous types" },
  { value: "map", label: "Cartes" },
  { value: "token", label: "Tokens" },
  { value: "portrait", label: "Portraits" },
  { value: "npc", label: "PNJ" },
  { value: "creature", label: "Créatures" },
  { value: "object", label: "Objets" },
  { value: "decor", label: "Décors" },
  { value: "document", label: "Documents" },
];

const TIER_LABEL: Record<string, string> = {
  free: "Gratuit",
  gm_premium: "MJ Premium",
  premium_plus: "Premium+",
};

interface Props {
  defaultType?: MediaFileType;
  campaignId?: string | null;
  onPick?: (asset: MediaAsset) => void;
}

export function MediaLibrary({ defaultType, campaignId, onPick }: Props) {
  const { assets, usage, loading, uploading, upload, remove, rename } = useMediaLibrary();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<MediaFileType | "all">(defaultType ?? "all");
  const [uploadType, setUploadType] = useState<MediaFileType>(defaultType ?? "map");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragActive, setDragActive] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (type !== "all" && a.file_type !== type) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, search, type]);

  const handleFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files) return;
    const list = Array.from(files);
    if (!list.length) return;
    let ok = 0, fail = 0;
    for (const file of list) {
      try {
        await upload(file, { fileType: uploadType, campaignId });
        ok++;
      } catch (e: any) {
        fail++;
        toast({ title: "Import refusé", description: `${file.name} — ${e?.message ?? "Erreur"}`, variant: "destructive" });
      }
    }
    if (ok) toast({ title: `${ok} fichier${ok > 1 ? "s" : ""} importé${ok > 1 ? "s" : ""}`, description: fail ? `${fail} échec(s)` : undefined });
    if (fileRef.current) fileRef.current.value = "";
  }, [upload, uploadType, campaignId, toast]);

  const handleRename = async (asset: MediaAsset) => {
    const next = window.prompt("Nouveau nom", asset.name);
    if (!next || next === asset.name) return;
    try { await rename(asset, next); toast({ title: "Renommé" }); }
    catch (e: any) { toast({ title: "Erreur", description: e?.message, variant: "destructive" }); }
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (allFilteredSelected) filtered.forEach((a) => n.delete(a.id));
      else filtered.forEach((a) => n.add(a.id));
      return n;
    });

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    setBulkDeleting(true);
    const targets = assets.filter((a) => selected.has(a.id));
    let ok = 0, fail = 0;
    for (const a of targets) {
      try { await remove(a); ok++; } catch { fail++; }
    }
    setBulkDeleting(false);
    setSelected(new Set());
    toast({
      title: `${ok} média${ok > 1 ? "s" : ""} supprimé${ok > 1 ? "s" : ""}`,
      description: fail ? `${fail} échec(s)` : undefined,
      variant: fail ? "destructive" : "default",
    });
  };

  const pct = usage && usage.quota_bytes > 0 ? Math.min(100, (usage.used_bytes / usage.quota_bytes) * 100) : 0;
  const isOver = usage ? usage.used_bytes >= usage.quota_bytes : false;

  // Drag-and-drop
  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setDragActive(true);
    }
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setDragActive(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (isOver) {
      toast({ title: "Quota atteint", description: "Supprimez des fichiers ou passez à une offre supérieure.", variant: "destructive" });
      return;
    }
    void handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`space-y-4 rounded-xl transition ${dragActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Jauge de stockage */}
      {usage && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-display text-foreground">
              Stockage — <Badge variant="outline" className="ml-1">{TIER_LABEL[usage.tier] ?? usage.tier}</Badge>
            </span>
            <span className="text-muted-foreground">
              {formatBytes(usage.used_bytes)} / {formatBytes(usage.quota_bytes)} · {usage.file_count} fichier{usage.file_count > 1 ? "s" : ""}
            </span>
          </div>
          <Progress value={pct} className={pct > 90 ? "[&>div]:bg-destructive" : ""} />
          {isOver && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Quota atteint — supprimez des fichiers ou passez à une offre supérieure.
            </p>
          )}
        </div>
      )}

      {/* Barre d'import */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
        <Select value={uploadType} onValueChange={(v) => setUploadType(v as MediaFileType)}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.filter((o) => o.value !== "all").map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading || isOver}>
          {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-1 h-4 w-4" />}
          Importer
        </Button>
        <span className="text-xs text-muted-foreground">
          Images (WebP auto) & PDF · doublons détectés · glisser-déposer accepté
        </span>

      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 pl-8"
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger className="h-10 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} média{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {/* Barre de sélection groupée */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card/30 p-2.5">
          <Button size="sm" variant="ghost" className="h-8" onClick={toggleAll}>
            {allFilteredSelected ? <CheckSquare className="mr-1 h-3.5 w-3.5" /> : <Square className="mr-1 h-3.5 w-3.5" />}
            {allFilteredSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          {selected.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="ml-auto h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer la sélection
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer {selected.size} média{selected.size > 1 ? "s" : ""} ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Action définitive. Les fichiers seront retirés de votre stockage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={bulkDeleting}
                    onClick={handleBulkDelete}
                  >
                    {bulkDeleting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Grille */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-display text-base text-foreground">Aucun média</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Importez vos premières cartes, tokens ou portraits — ou glissez-déposez vos images ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((a) => {
            const isSelected = selected.has(a.id);
            return (
              <div
                key={a.id}
                className={`group flex flex-col gap-2 rounded-xl border bg-gradient-card p-2 shadow-card transition ${
                  isSelected ? "border-primary ring-1 ring-primary/40" : "border-border/60 hover:border-primary/40"
                }`}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/30">
                  {/* Case de sélection */}
                  <button
                    type="button"
                    onClick={() => toggleOne(a.id)}
                    className="absolute right-1 top-1 z-10 rounded bg-background/80 p-1 backdrop-blur transition hover:bg-background"
                    title={isSelected ? "Désélectionner" : "Sélectionner"}
                  >
                    {isSelected
                      ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      : <Square className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button
                    type="button"
                    className="block h-full w-full"
                    onClick={() => onPick?.(a)}
                    title={onPick ? "Choisir cette image" : a.name}
                  >
                    {a.thumbnail_url ? (
                      <img
                        src={a.thumbnail_url}
                        alt={a.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                  <Badge className="absolute left-1 top-1 bg-background/70 text-[10px]">{a.file_type}</Badge>
                </div>
                <div className="min-w-0 px-1">
                  <p className="truncate text-xs font-medium text-foreground">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(a.size_bytes)}{a.width ? ` · ${a.width}×${a.height}` : ""}</p>
                </div>
                <div className="flex items-center justify-between gap-1 px-1 opacity-80 group-hover:opacity-100">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleRename(a)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer « {a.name} » ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Le fichier sera retiré de votre stockage. Les emplacements qui le référençaient garderont leur URL le temps de la session puis ne s'afficheront plus.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={async () => {
                            try { await remove(a); toast({ title: "Supprimé" }); }
                            catch (e: any) { toast({ title: "Erreur", description: e?.message, variant: "destructive" }); }
                          }}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
