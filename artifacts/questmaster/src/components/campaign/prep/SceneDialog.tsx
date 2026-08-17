import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { codexApi } from "@/lib/codex/api";
import { ENTITY_KINDS } from "@/lib/codex/types";
import { PREP_SCENE_STATUS, type PrepScene, type PrepSceneStatus } from "@/lib/prep/types";
import type { SceneInput } from "@/lib/prep/api";
import { Search } from "lucide-react";

interface SceneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  chapterId: string | null;
  scene?: PrepScene | null;
  onSubmit: (input: SceneInput) => void;
  isSaving?: boolean;
}

export default function SceneDialog({
  open, onOpenChange, campaignId, chapterId, scene, onSubmit, isSaving,
}: SceneDialogProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [gmNotes, setGmNotes] = useState("");
  const [status, setStatus] = useState<PrepSceneStatus>("draft");
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(scene?.title ?? "");
    setSummary(scene?.summary ?? "");
    setGmNotes(scene?.gm_notes ?? "");
    setStatus((scene?.status as PrepSceneStatus) ?? "draft");
    setEntityIds(scene?.entity_ids ?? []);
    setSearch("");
  }, [open, scene]);

  const { data: entities = [] } = useQuery({
    queryKey: ["codex-entities", campaignId],
    queryFn: () => codexApi.list(campaignId),
    enabled: open,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entities;
    return entities.filter((e) => e.name.toLowerCase().includes(q));
  }, [entities, search]);

  const toggleEntity = (id: string) =>
    setEntityIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      chapter_id: scene?.chapter_id ?? chapterId,
      title: title.trim(),
      summary: summary.trim() || null,
      gm_notes: gmNotes,
      status,
      entity_ids: entityIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {scene ? "Modifier la scène" : "Nouvelle scène"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="scene-title">Titre</Label>
            <Input
              id="scene-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="L'embuscade du col de Vhar"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scene-status">Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PrepSceneStatus)}>
                <SelectTrigger id="scene-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PREP_SCENE_STATUS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scene-summary">Résumé</Label>
            <Textarea
              id="scene-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              placeholder="Ce qui se passe, en une ou deux phrases."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scene-notes">Notes privées du MJ</Label>
            <Textarea
              id="scene-notes"
              value={gmNotes}
              onChange={(e) => setGmNotes(e.target.value)}
              rows={4}
              placeholder="Tactiques, secrets, récompenses… jamais visible par les joueurs."
            />
          </div>

          <div className="space-y-2">
            <Label>Éléments du Codex liés</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un PNJ, un lieu, une créature…"
                className="pl-8"
                aria-label="Rechercher dans le Codex"
              />
            </div>
            <ScrollArea className="h-44 rounded-md border border-border">
              <div className="p-2 space-y-1">
                {filtered.length === 0 && (
                  <p className="p-2 text-sm text-muted-foreground">
                    Aucun élément dans le Codex de cette campagne.
                  </p>
                )}
                {filtered.map((e) => {
                  const kind = ENTITY_KINDS.find((k) => k.id === e.kind);
                  const selected = entityIds.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => toggleEntity(e.id)}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                        selected ? "bg-primary/15 text-foreground" : "hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <span aria-hidden>{kind?.emoji ?? "📄"}</span>
                      <span className="flex-1 truncate">{e.name}</span>
                      {selected && <Badge variant="outline" className="text-[10px]">Lié</Badge>}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={!title.trim() || isSaving}>
            {scene ? "Enregistrer" : "Créer la scène"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
