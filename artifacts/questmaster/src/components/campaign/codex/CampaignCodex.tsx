import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { campaignsApi } from "@/lib/api";
import { codexApi, type EntityInput } from "@/lib/codex/api";
import { ENTITY_KINDS, kindMeta } from "@/lib/codex/types";
import type { CampaignEntity, EntityKind } from "@/lib/codex/types";
import EntityFormDialog from "./EntityFormDialog";
import EntityDetail from "./EntityDetail";
import { BookOpen, Plus, Search, ArrowLeft } from "lucide-react";

interface Props {
  campaignId: string;
  system?: string | null;
  isGM: boolean;
}

export default function CampaignCodex({ campaignId, system, isGM }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<EntityKind | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignEntity | null>(null);

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ["codex", campaignId],
    queryFn: () => codexApi.list(campaignId),
    enabled: !!campaignId,
  });

  const { data: links = [] } = useQuery({
    queryKey: ["codex-links", campaignId],
    queryFn: () => codexApi.getLinks(campaignId),
    enabled: !!campaignId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["campaign-members", campaignId],
    queryFn: () => campaignsApi.getMembers(campaignId),
    enabled: !!campaignId && isGM,
  });

  // System isolation: only show entities belonging to the campaign's system.
  const scoped = useMemo(
    () => entities.filter((e) => !system || !e.system || e.system === system),
    [entities, system],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    scoped.forEach((e) => e.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [scoped]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((e) => {
      if (kindFilter !== "all" && e.kind !== kindFilter) return false;
      if (tagFilter && !e.tags?.includes(tagFilter)) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        (e.summary ?? "").toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [scoped, search, kindFilter, tagFilter]);

  const selected = useMemo(
    () => scoped.find((e) => e.id === selectedId) ?? null,
    [scoped, selectedId],
  );

  const save = useMutation({
    mutationFn: async (input: EntityInput) => {
      if (editing) return codexApi.update(editing.id, input);
      return codexApi.create(campaignId, system ?? "Aetheria", input);
    },
    onSuccess: (entity) => {
      qc.invalidateQueries({ queryKey: ["codex", campaignId] });
      setFormOpen(false);
      setEditing(null);
      setSelectedId(entity.id);
      toast({ title: "Fiche enregistrée" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    scoped.forEach((e) => map.set(e.kind, (map.get(e.kind) ?? 0) + 1));
    return map;
  }, [scoped]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Codex de campagne</h2>
          {system && <Badge variant="outline">{system}</Badge>}
        </div>
        {isGM && (
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Nouvelle fiche
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
        {/* Colonne liste */}
        <div className={`space-y-3 ${selected ? "hidden lg:block" : ""}`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher dans le Codex…"
              className="pl-9"
              aria-label="Rechercher dans le Codex"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge
              variant={kindFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setKindFilter("all")}
            >
              Tout ({scoped.length})
            </Badge>
            {ENTITY_KINDS.map((k) => (
              <Badge
                key={k.id}
                variant={kindFilter === k.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setKindFilter(kindFilter === k.id ? "all" : k.id)}
              >
                {k.emoji} {k.plural} ({counts.get(k.id) ?? 0})
              </Badge>
            ))}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allTags.map((t) => (
                <Badge
                  key={t}
                  variant={tagFilter === t ? "secondary" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setTagFilter(tagFilter === t ? null : t)}
                >
                  #{t}
                </Badge>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
              Aucune fiche pour l'instant. {isGM ? "Créez votre première entrée du Codex." : ""}
            </Card>
          ) : (
            <ScrollArea className="max-h-[60vh] pr-2">
              <ul className="space-y-2">
                {filtered.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(e.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedId === e.id
                          ? "border-primary/60 bg-primary/10"
                          : "border-border/60 bg-card/60 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span aria-hidden>{kindMeta(e.kind).emoji}</span>
                        <span className="truncate font-medium">{e.name}</span>
                      </div>
                      {e.summary && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.summary}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        {/* Colonne fiche */}
        <div>
          {selected ? (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSelectedId(null)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Retour à la liste
              </Button>
              <EntityDetail
                entity={selected}
                entities={scoped}
                links={links}
                members={members as any[]}
                isGM={isGM}
                onSelect={setSelectedId}
                onEdit={() => { setEditing(selected); setFormOpen(true); }}
                onDeleted={() => setSelectedId(null)}
              />
            </div>
          ) : (
            <Card className="flex h-full min-h-[16rem] items-center justify-center border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
              Sélectionnez une fiche pour consulter ses détails et ses relations.
            </Card>
          )}
        </div>
      </div>

      <EntityFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        entity={editing}
        onSubmit={(input) => save.mutateAsync(input).then(() => undefined)}
        saving={save.isPending}
      />
    </div>
  );
}
