import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Trash2, ChevronRight, ChevronDown, GripVertical, Pencil,
  Loader2, BookMarked, Swords,
} from "lucide-react";
import { prepApi, type SceneInput } from "@/lib/prep/api";
import { statusMeta, type CampaignChapter, type PrepScene } from "@/lib/prep/types";
import { codexApi } from "@/lib/codex/api";
import { ENTITY_KINDS } from "@/lib/codex/types";
import SceneDialog from "./SceneDialog";

interface CampaignPrepProps {
  campaignId: string;
  isGM: boolean;
}

interface DragPayload {
  sceneId: string;
  fromChapter: string | null;
}

export default function CampaignPrep({ campaignId, isGM }: CampaignPrepProps) {
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newChapter, setNewChapter] = useState("");
  const [sceneDialog, setSceneDialog] = useState<{ open: boolean; chapterId: string | null; scene: PrepScene | null }>({
    open: false, chapterId: null, scene: null,
  });
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ["prep-chapters", campaignId],
    queryFn: () => prepApi.listChapters(campaignId),
    enabled: isGM,
  });

  const { data: scenes = [], isLoading: scenesLoading } = useQuery({
    queryKey: ["prep-scenes", campaignId],
    queryFn: () => prepApi.listScenes(campaignId),
    enabled: isGM,
  });

  const { data: entities = [] } = useQuery({
    queryKey: ["codex-entities", campaignId],
    queryFn: () => codexApi.list(campaignId),
    enabled: isGM,
  });

  const entityById = useMemo(
    () => new Map(entities.map((e) => [e.id, e])),
    [entities],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["prep-chapters", campaignId] });
    qc.invalidateQueries({ queryKey: ["prep-scenes", campaignId] });
  };

  const onError = (e: unknown) =>
    toast({ title: "Action impossible", description: (e as Error).message, variant: "destructive" });

  const createChapter = useMutation({
    mutationFn: (title: string) => prepApi.createChapter(campaignId, { title }, chapters.length),
    onSuccess: () => { setNewChapter(""); invalidate(); },
    onError,
  });

  const renameChapter = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => prepApi.updateChapter(id, { title }),
    onSuccess: invalidate,
    onError,
  });

  const deleteChapter = useMutation({
    mutationFn: (id: string) => prepApi.removeChapter(id),
    onSuccess: invalidate,
    onError,
  });

  const saveScene = useMutation({
    mutationFn: async (input: SceneInput) => {
      if (sceneDialog.scene) return prepApi.updateScene(sceneDialog.scene.id, input);
      const siblings = scenes.filter((s) => s.chapter_id === sceneDialog.chapterId);
      return prepApi.createScene(campaignId, input, siblings.length);
    },
    onSuccess: () => {
      setSceneDialog({ open: false, chapterId: null, scene: null });
      invalidate();
    },
    onError,
  });

  const deleteScene = useMutation({
    mutationFn: (id: string) => prepApi.removeScene(id),
    onSuccess: invalidate,
    onError,
  });

  const reorder = useMutation({
    mutationFn: (payload: { id: string; chapter_id: string | null; sort_order: number }[]) =>
      prepApi.reorderScenes(payload),
    onSuccess: invalidate,
    onError,
  });

  const scenesOf = (chapterId: string | null) =>
    scenes
      .filter((s) => (s.chapter_id ?? null) === chapterId)
      .sort((a, b) => a.sort_order - b.sort_order);

  // Drop a dragged scene either at the end of a chapter, or before a given scene.
  const handleDrop = (targetChapterId: string | null, beforeSceneId?: string) => {
    if (!dragging) return;
    const scene = scenes.find((s) => s.id === dragging.sceneId);
    setDragging(null);
    setDropTarget(null);
    if (!scene) return;

    const target = scenesOf(targetChapterId).filter((s) => s.id !== scene.id);
    const index = beforeSceneId ? target.findIndex((s) => s.id === beforeSceneId) : target.length;
    target.splice(index < 0 ? target.length : index, 0, scene);

    const payload = target.map((s, i) => ({ id: s.id, chapter_id: targetChapterId, sort_order: i }));
    // Also renumber the source chapter when the scene moved out of it.
    if ((scene.chapter_id ?? null) !== targetChapterId) {
      scenesOf(scene.chapter_id ?? null)
        .filter((s) => s.id !== scene.id)
        .forEach((s, i) => payload.push({ id: s.id, chapter_id: scene.chapter_id ?? null, sort_order: i }));
    }
    reorder.mutate(payload);
  };

  if (!isGM) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">
          L'espace de préparation est réservé au Maître du Jeu.
        </p>
      </div>
    );
  }

  if (chaptersLoading || scenesLoading) {
    return (
      <div className="flex h-full items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const orphanScenes = scenesOf(null);

  const renderScene = (scene: PrepScene, chapterId: string | null) => {
    const meta = statusMeta(scene.status);
    return (
      <div
        key={scene.id}
        draggable
        onDragStart={() => setDragging({ sceneId: scene.id, fromChapter: chapterId })}
        onDragEnd={() => { setDragging(null); setDropTarget(null); }}
        onDragOver={(e) => { e.preventDefault(); setDropTarget(scene.id); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(chapterId, scene.id); }}
        className={`group flex items-start gap-2 rounded-lg border bg-background/40 p-3 transition-colors ${
          dropTarget === scene.id ? "border-primary" : "border-border/60"
        } ${dragging?.sceneId === scene.id ? "opacity-50" : ""}`}
      >
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-foreground">{scene.title}</span>
            <Badge variant="outline" className={`text-[10px] ${meta.className}`}>{meta.label}</Badge>
          </div>
          {scene.summary && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{scene.summary}</p>
          )}
          {scene.entity_ids.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {scene.entity_ids.map((eid) => {
                const ent = entityById.get(eid);
                if (!ent) return null;
                const kind = ENTITY_KINDS.find((k) => k.id === ent.kind);
                return (
                  <Badge key={eid} variant="secondary" className="text-[10px]">
                    <span className="mr-1" aria-hidden>{kind?.emoji ?? "📄"}</span>
                    {ent.name}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            aria-label="Modifier la scène"
            onClick={() => setSceneDialog({ open: true, chapterId, scene })}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 text-destructive"
            aria-label="Supprimer la scène"
            onClick={() => deleteScene.mutate(scene.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <header className="space-y-1">
          <h2 className="font-display text-xl font-bold text-foreground">Préparation</h2>
          <p className="text-sm text-muted-foreground">
            Organisez votre campagne en chapitres et en scènes. Glissez une scène pour la réordonner
            ou la déplacer dans un autre chapitre. Ce contenu reste invisible pour les joueurs.
          </p>
        </header>

        <div className="flex gap-2">
          <Input
            value={newChapter}
            onChange={(e) => setNewChapter(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newChapter.trim()) createChapter.mutate(newChapter.trim()); }}
            placeholder="Nom du nouveau chapitre…"
            aria-label="Nom du nouveau chapitre"
          />
          <Button
            onClick={() => newChapter.trim() && createChapter.mutate(newChapter.trim())}
            disabled={!newChapter.trim() || createChapter.isPending}
          >
            <Plus className="mr-1 h-4 w-4" /> Chapitre
          </Button>
        </div>

        {chapters.length === 0 && orphanScenes.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <BookMarked className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-muted-foreground">
              Aucun chapitre pour l'instant. Créez le premier acte de votre histoire.
            </p>
          </div>
        )}

        {chapters.map((chapter: CampaignChapter) => {
          const isCollapsed = collapsed[chapter.id];
          const chapterScenes = scenesOf(chapter.id);
          return (
            <section
              key={chapter.id}
              onDragOver={(e) => { e.preventDefault(); setDropTarget(chapter.id); }}
              onDrop={(e) => { e.preventDefault(); handleDrop(chapter.id); }}
              className={`rounded-xl border bg-card/60 p-4 transition-colors ${
                dropTarget === chapter.id ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  aria-label={isCollapsed ? "Déplier le chapitre" : "Replier le chapitre"}
                  onClick={() => setCollapsed((c) => ({ ...c, [chapter.id]: !c[chapter.id] }))}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Input
                  defaultValue={chapter.title}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== chapter.title) renameChapter.mutate({ id: chapter.id, title: v });
                  }}
                  aria-label="Titre du chapitre"
                  className="h-8 border-transparent bg-transparent px-1 font-display text-base font-semibold focus-visible:border-input"
                />
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {chapterScenes.length} scène{chapterScenes.length > 1 ? "s" : ""}
                </Badge>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  aria-label="Supprimer le chapitre"
                  onClick={() => deleteChapter.mutate(chapter.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {!isCollapsed && (
                <div className="mt-3 space-y-2 pl-2">
                  {chapterScenes.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                      Déposez une scène ici ou créez-en une.
                    </p>
                  )}
                  {chapterScenes.map((s) => renderScene(s, chapter.id))}
                  <Button
                    variant="ghost" size="sm"
                    className="text-muted-foreground"
                    onClick={() => setSceneDialog({ open: true, chapterId: chapter.id, scene: null })}
                  >
                    <Swords className="mr-1 h-3.5 w-3.5" /> Ajouter une scène
                  </Button>
                </div>
              )}
            </section>
          );
        })}

        <section
          onDragOver={(e) => { e.preventDefault(); setDropTarget("__orphan__"); }}
          onDrop={(e) => { e.preventDefault(); handleDrop(null); }}
          className={`rounded-xl border border-dashed p-4 transition-colors ${
            dropTarget === "__orphan__" ? "border-primary" : "border-border/60"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-muted-foreground">Scènes non classées</h3>
            <Button
              variant="ghost" size="sm"
              onClick={() => setSceneDialog({ open: true, chapterId: null, scene: null })}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Scène
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {orphanScenes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune scène en attente de classement.</p>
            ) : (
              orphanScenes.map((s) => renderScene(s, null))
            )}
          </div>
        </section>
      </div>

      <SceneDialog
        open={sceneDialog.open}
        onOpenChange={(open) => setSceneDialog((d) => ({ ...d, open }))}
        campaignId={campaignId}
        chapterId={sceneDialog.chapterId}
        scene={sceneDialog.scene}
        onSubmit={(input) => saveScene.mutate(input)}
        isSaving={saveScene.isPending}
      />
    </ScrollArea>
  );
}
