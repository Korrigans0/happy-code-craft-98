// Browser for official (open-licensed) content of non-proprietary systems.
// Renders a searchable, paginated list plus a full stat-block detail sheet:
// attacks, actions, saves, senses, spells, complete descriptions…

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Skull, Wand2, Gem, ChevronLeft, ChevronRight, ExternalLink, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchOfficialContent,
  OFFICIAL_SOURCE_LABEL,
  type OfficialEntry,
  type OfficialKind,
} from "@/lib/compendium/officialContent";

const KIND_ICON: Record<OfficialKind, typeof Skull> = {
  monsters: Skull,
  spells: Wand2,
  items: Gem,
};

const KIND_LABEL: Record<OfficialKind, string> = {
  monsters: "créature",
  spells: "sort",
  items: "objet",
};

const KIND_ACCENT: Record<OfficialKind, string> = {
  monsters: "bg-red-500/15 text-red-400",
  spells: "bg-violet-500/15 text-violet-300",
  items: "bg-amber-500/15 text-amber-300",
};

/** Minimal inline formatter: **bold** + paragraph splitting. */
const RichText = ({ text }: { text: string }) => {
  if (!text?.trim()) return null;
  return (
    <div className="space-y-2">
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
          {para.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
            chunk.startsWith("**") && chunk.endsWith("**") ? (
              <strong key={j} className="font-semibold text-foreground">{chunk.slice(2, -2)}</strong>
            ) : (
              <span key={j}>{chunk}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
};

interface Props {
  system: string;
  kind: OfficialKind;
  searchQuery: string;
}

const OfficialContentBrowser = ({ system, kind, searchQuery }: Props) => {
  const [entries, setEntries] = useState<OfficialEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(40);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OfficialEntry | null>(null);
  const [debounced, setDebounced] = useState(searchQuery);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce the shared search field before hitting the upstream APIs.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [debounced, kind, system]);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOfficialContent({ system, kind, search: debounced, page }, ctrl.signal);
      setEntries(res.items);
      setTotal(res.total);
      setPageSize(res.pageSize);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message);
      setEntries([]);
      setTotal(0);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [system, kind, debounced, page]);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const Icon = KIND_ICON[kind];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading ? "Chargement…" : `${total} ${KIND_LABEL[kind]}${total > 1 ? "s" : ""} officiel${total > 1 ? "les" : "le"}`}
          {debounced && !loading ? ` pour « ${debounced} »` : ""}
        </p>
        <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
          {OFFICIAL_SOURCE_LABEL[system] ?? "Contenu officiel"}
        </Badge>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Contenu officiel indisponible</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={load}>Réessayer</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setSelected(entry)}
              className="group rounded-xl border border-border/50 bg-gradient-card p-5 text-left shadow-card transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${KIND_ACCENT[kind]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-display font-semibold text-foreground">{entry.name}</h3>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{entry.subtitle || entry.source}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {entry.tags.slice(0, 4).map((tag, i) => (
                  <Badge key={`${entry.id}-t${i}`} variant="outline" className="text-[10px] font-normal">{tag}</Badge>
                ))}
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                {entry.description.replace(/\*\*/g, "").slice(0, 180)}
              </p>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-gradient-card p-8 text-center shadow-card">
          <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Aucun résultat officiel pour cette recherche.</p>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Précédent
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Suivant <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Fiche détaillée complète */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-hidden p-0">
          {selected && (
            <>
              <DialogHeader className="border-b border-border/50 px-6 py-4">
                <DialogTitle className="font-display text-2xl">{selected.name}</DialogTitle>
                <DialogDescription className="italic">{selected.subtitle || selected.source}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-5 px-6 py-5">
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((tag, i) => (
                      <Badge key={`d-${i}`} variant="outline" className="text-[11px] font-normal">{tag}</Badge>
                    ))}
                  </div>

                  {selected.abilities && (
                    <div className="grid grid-cols-6 gap-2">
                      {Object.entries(selected.abilities).map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-border/50 bg-muted/30 p-2 text-center">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                          <p className="font-semibold text-foreground">{value ?? "—"}</p>
                          {typeof value === "number" && (
                            <p className="text-[10px] text-muted-foreground">
                              {Math.floor((value - 10) / 2) >= 0 ? "+" : ""}{Math.floor((value - 10) / 2)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {Object.keys(selected.meta).length > 0 && (
                    <div className="grid gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-4 sm:grid-cols-2">
                      {Object.entries(selected.meta).map(([k, v]) => (
                        <div key={k} className="text-sm">
                          <span className="font-semibold text-foreground">{k} : </span>
                          <span className="text-muted-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selected.description && (
                    <div>
                      <h4 className="mb-2 font-display text-sm font-semibold text-primary">Description</h4>
                      <RichText text={selected.description} />
                    </div>
                  )}

                  {selected.sections.map((section) => (
                    <div key={section.title}>
                      <h4 className="mb-2 font-display text-sm font-semibold text-primary">{section.title}</h4>
                      <RichText text={section.text} />
                    </div>
                  ))}

                  <div className="flex items-center justify-between border-t border-border/50 pt-4">
                    <p className="text-xs text-muted-foreground">Source : {selected.source}</p>
                    {selected.url && (
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Fiche officielle <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficialContentBrowser;
