// SessionAgenda — Ordre du jour d'une session : scènes préparées rattachées.
//
// Réservé au MJ (les scènes de préparation sont MJ-only côté base). Permet
// d'ajouter des scènes préparées à la session, de les réordonner, de changer
// leur statut (brouillon / prête / jouée) et de les détacher.

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ListChecks, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { prepApi } from "@/lib/prep/api";
import { PREP_SCENE_STATUS, statusMeta, type PrepScene, type PrepSceneStatus } from "@/lib/prep/types";

interface Props {
  campaignId: string;
  sessionId: string;
}

export default function SessionAgenda({ campaignId, sessionId }: Props) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const { data: allScenes = [] } = useQuery({
    queryKey: ["prep-scenes", campaignId],
    queryFn: () => prepApi.listScenes(campaignId),
  });

  const agenda = useMemo(
    () =>
      (allScenes as PrepScene[])
        .filter((s) => s.session_id === sessionId)
        .sort((a, b) => (a.agenda_order ?? 0) - (b.agenda_order ?? 0)),
    [allScenes, sessionId],
  );

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (allScenes as PrepScene[])
      .filter((s) => !s.session_id)
      .filter((s) => (q ? s.title.toLowerCase().includes(q) : true));
  }, [allScenes, search]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["prep-scenes", campaignId] });

  const assign = useMutation({
    mutationFn: (ids: string[]) => prepApi.assignScenesToSession(ids, sessionId, agenda.length),
    onSuccess: () => {
      invalidate();
      setPickerOpen(false);
      setPicked([]);
      setSearch("");
      toast({ title: "Scènes ajoutées à l'ordre du jour" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e?.message, variant: "destructive" }),
  });

  const detach = useMutation({
    mutationFn: (id: string) => prepApi.assignScenesToSession([id], null, 0),
    onSuccess: invalidate,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PrepSceneStatus }) => prepApi.setSceneStatus(id, status),
    onSuccess: invalidate,
  });

  const move = useMutation({
    mutationFn: (next: PrepScene[]) =>
      prepApi.reorderAgenda(next.map((s, i) => ({ id: s.id, agenda_order: i }))),
    onSuccess: invalidate,
  });

  const shift = (index: number, dir: -1 | 1) => {
    const next = [...agenda];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    move.mutate(next);
  };

  return (
    <div className="mt-3 rounded-md border border-border/60 bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-medium text-foreground">
          <ListChecks className="h-3.5 w-3.5 text-primary" />
          Ordre du jour ({agenda.length})
        </p>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPickerOpen(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Ajouter une scène
        </Button>
      </div>

      {agenda.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucune scène rattachée. Préparez vos scènes dans l'onglet Préparation, puis ajoutez-les ici.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {agenda.map((scene, i) => {
            const meta = statusMeta(scene.status);
            return (
              <li
                key={scene.id}
                className="flex items-center gap-2 rounded-md border border-border/50 bg-background/40 px-2 py-1.5"
              >
                <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{scene.title}</p>
                  {scene.summary && (
                    <p className="truncate text-xs text-muted-foreground">{scene.summary}</p>
                  )}
                </div>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${meta.className}`}>
                  {meta.label}
                </Badge>
                <Select
                  value={scene.status}
                  onValueChange={(v) => setStatus.mutate({ id: scene.id, status: v as PrepSceneStatus })}
                >
                  <SelectTrigger className="h-7 w-[110px] shrink-0 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREP_SCENE_STATUS.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => shift(i, -1)}
                    aria-label="Monter"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={i === agenda.length - 1}
                    onClick={() => shift(i, 1)}
                    aria-label="Descendre"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => detach.mutate(scene.id)}
                  title="Retirer de la session"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des scènes préparées</DialogTitle>
          </DialogHeader>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une scène..."
          />
          <ScrollArea className="max-h-72">
            <div className="space-y-1.5 pr-3">
              {available.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucune scène disponible. Créez-en dans l'onglet Préparation.
                </p>
              ) : (
                available.map((scene) => {
                  const active = picked.includes(scene.id);
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() =>
                        setPicked((prev) =>
                          prev.includes(scene.id) ? prev.filter((x) => x !== scene.id) : [...prev, scene.id],
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition ${
                        active ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/40"
                      }`}
                    >
                      <span className="truncate text-sm text-foreground">{scene.title}</span>
                      <Badge variant="outline" className={`text-[10px] ${statusMeta(scene.status).className}`}>
                        {statusMeta(scene.status).label}
                      </Badge>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              Annuler
            </Button>
            <Button disabled={!picked.length || assign.isPending} onClick={() => assign.mutate(picked)}>
              Ajouter ({picked.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
