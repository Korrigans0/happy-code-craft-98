import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { codexApi } from "@/lib/codex/api";
import {
  PERMISSION_LEVELS, RELATION_LABELS, RELATION_TYPES, VISIBILITY_OPTIONS, kindMeta,
} from "@/lib/codex/types";
import type { CampaignEntity, EntityLink, PermissionLevel } from "@/lib/codex/types";
import { Link2, Lock, History, Copy, Pencil, Trash2, Plus, RotateCcw } from "lucide-react";

interface Props {
  entity: CampaignEntity;
  entities: CampaignEntity[];
  links: EntityLink[];
  members: any[];
  isGM: boolean;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onDeleted: () => void;
}

export default function EntityDetail({
  entity, entities, links, members, isGM, onSelect, onEdit, onDeleted,
}: Props) {
  const qc = useQueryClient();
  const meta = kindMeta(entity.kind);
  const byId = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);

  const relations = useMemo(
    () =>
      links
        .filter((l) => l.source_id === entity.id || l.target_id === entity.id)
        .map((l) => {
          const otherId = l.source_id === entity.id ? l.target_id : l.source_id;
          return { link: l, other: byId.get(otherId) ?? null, outgoing: l.source_id === entity.id };
        })
        .filter((r) => !!r.other),
    [links, entity.id, byId],
  );

  // ── GM private notes ──────────────────────────────────────────────────────
  const { data: gmNotes = "" } = useQuery({
    queryKey: ["entity-gm-notes", entity.id],
    queryFn: () => codexApi.getGmNotes(entity.id),
    enabled: isGM,
  });
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const notesValue = notesDraft ?? gmNotes;

  const saveNotes = useMutation({
    mutationFn: () => codexApi.saveGmNotes(entity.id, entity.campaign_id, notesValue),
    onSuccess: () => {
      setNotesDraft(null);
      qc.invalidateQueries({ queryKey: ["entity-gm-notes", entity.id] });
      toast({ title: "Notes privées enregistrées" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  // ── Relations ─────────────────────────────────────────────────────────────
  const [linkTarget, setLinkTarget] = useState("");
  const [linkRelation, setLinkRelation] = useState<string>("related");

  const addLink = useMutation({
    mutationFn: () => codexApi.addLink(entity.campaign_id, entity.id, linkTarget, linkRelation),
    onSuccess: () => {
      setLinkTarget("");
      qc.invalidateQueries({ queryKey: ["codex-links", entity.campaign_id] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const removeLink = useMutation({
    mutationFn: (id: string) => codexApi.removeLink(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["codex-links", entity.campaign_id] }),
  });

  // ── Permissions ───────────────────────────────────────────────────────────
  const { data: permissions = [] } = useQuery({
    queryKey: ["entity-permissions", entity.id],
    queryFn: () => codexApi.getPermissions(entity.id),
    enabled: isGM,
  });

  const setPermission = useMutation({
    mutationFn: ({ userId, level }: { userId: string; level: PermissionLevel }) =>
      codexApi.setPermission(entity.id, entity.campaign_id, userId, level),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entity-permissions", entity.id] }),
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  // ── Revisions ─────────────────────────────────────────────────────────────
  const { data: revisions = [] } = useQuery({
    queryKey: ["entity-revisions", entity.id],
    queryFn: () => codexApi.getRevisions(entity.id),
    enabled: isGM,
  });

  const restore = useMutation({
    mutationFn: (snapshot: Record<string, any>) => codexApi.restoreRevision(entity.id, snapshot),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["codex", entity.campaign_id] });
      qc.invalidateQueries({ queryKey: ["entity-revisions", entity.id] });
      toast({ title: "Version restaurée" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const duplicate = useMutation({
    mutationFn: () => codexApi.duplicate(entity),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["codex", entity.campaign_id] });
      onSelect(created.id);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: () => codexApi.remove(entity.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["codex", entity.campaign_id] });
      onDeleted();
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const visibilityLabel =
    VISIBILITY_OPTIONS.find((v) => v.id === entity.visibility)?.label ?? entity.visibility;
  const description = (entity.content as any)?.description as string | undefined;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card className="overflow-hidden border-border/60 bg-card/70">
        {entity.image_url && (
          <img
            src={entity.image_url}
            alt={`Illustration de ${entity.name}`}
            loading="lazy"
            className="h-40 w-full object-cover"
          />
        )}
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold text-foreground">{entity.name}</h2>
                <Badge variant="outline">{meta.emoji} {meta.label}</Badge>
                <Badge variant="secondary">{visibilityLabel}</Badge>
              </div>
              {entity.summary && <p className="mt-1 text-sm text-muted-foreground">{entity.summary}</p>}
            </div>
            {isGM && (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={onEdit} aria-label="Modifier la fiche">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => duplicate.mutate()} aria-label="Dupliquer la fiche">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove.mutate()} aria-label="Supprimer la fiche">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entity.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>
              ))}
            </div>
          )}

          {description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{description}</p>
          )}
        </div>
      </Card>

      {/* Relations */}
      <Card className="space-y-3 border-border/60 bg-card/70 p-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">Relations</h3>
        </div>
        {relations.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune relation pour l'instant.</p>
        )}
        <ul className="space-y-1">
          {relations.map(({ link, other, outgoing }) => (
            <li key={link.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted/50">
              <button
                type="button"
                onClick={() => onSelect(other!.id)}
                className="flex min-w-0 items-center gap-2 text-left text-sm text-primary hover:underline"
              >
                <span className="text-muted-foreground">
                  {RELATION_LABELS[link.relation] ?? link.relation}{outgoing ? "" : " (inverse)"} :
                </span>
                <span className="truncate">{kindMeta(other!.kind).emoji} {other!.name}</span>
              </button>
              {isGM && (
                <Button size="icon" variant="ghost" onClick={() => removeLink.mutate(link.id)} aria-label="Retirer la relation">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>

        {isGM && (
          <div className="flex flex-wrap items-end gap-2 pt-2">
            <div className="min-w-[9rem] flex-1 space-y-1">
              <Label className="text-xs">Relation</Label>
              <Select value={linkRelation} onValueChange={setLinkRelation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((r) => (
                    <SelectItem key={r} value={r}>{RELATION_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[10rem] flex-[2] space-y-1">
              <Label className="text-xs">Fiche liée</Label>
              <Select value={linkTarget} onValueChange={setLinkTarget}>
                <SelectTrigger><SelectValue placeholder="Choisir une fiche" /></SelectTrigger>
                <SelectContent>
                  {entities.filter((e) => e.id !== entity.id).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{kindMeta(e.kind).emoji} {e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" disabled={!linkTarget} onClick={() => addLink.mutate()}>
              <Plus className="mr-1 h-4 w-4" /> Lier
            </Button>
          </div>
        )}
      </Card>

      {/* Notes privées MJ */}
      {isGM && (
        <Card className="space-y-3 border-border/60 bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-400" />
            <h3 className="font-display text-sm font-semibold">Notes privées du MJ</h3>
            <span className="text-xs text-muted-foreground">jamais visibles par les joueurs</span>
          </div>
          <Textarea
            rows={5}
            value={notesValue}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Secrets, twists, PV réels, intentions du PNJ…"
          />
          <Button size="sm" disabled={notesDraft === null || saveNotes.isPending} onClick={() => saveNotes.mutate()}>
            Enregistrer les notes
          </Button>
        </Card>
      )}

      {/* Permissions */}
      {isGM && entity.visibility === "selected_players" && (
        <Card className="space-y-3 border-border/60 bg-card/70 p-4">
          <h3 className="font-display text-sm font-semibold">Accès des joueurs</h3>
          <div className="space-y-2">
            {members.filter((m) => m.role !== "gm").map((m) => {
              const current = (permissions.find((p) => p.user_id === m.user_id)?.level ?? "none") as PermissionLevel;
              return (
                <div key={m.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm">{m.display_name || m.character_name || "Joueur"}</span>
                  <Select
                    value={current}
                    onValueChange={(level) => setPermission.mutate({ userId: m.user_id, level: level as PermissionLevel })}
                  >
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PERMISSION_LEVELS.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            {members.filter((m) => m.role !== "gm").length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun joueur dans cette campagne.</p>
            )}
          </div>
        </Card>
      )}

      {/* Historique de la fiche */}
      {isGM && revisions.length > 0 && (
        <Card className="space-y-2 border-border/60 bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">Versions précédentes</h3>
          </div>
          <Separator />
          <ul className="space-y-1">
            {revisions.map((rev) => (
              <li key={rev.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-muted-foreground">
                  {new Date(rev.created_at).toLocaleString("fr-BE")} — {(rev.snapshot as any)?.name}
                </span>
                <Button size="sm" variant="ghost" onClick={() => restore.mutate(rev.snapshot as any)}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restaurer
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
