// Browser for official (open-licensed) content of non-proprietary systems.
// Renders a searchable, paginated list plus a full stat-block detail sheet:
// attacks, actions, saves, senses, spells, complete descriptions…
// Bilingual: every entry can be read in French or in English.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Skull, Wand2, Gem, ChevronLeft, ChevronRight, ExternalLink, AlertCircle, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchOfficialContent,
  officialSourceLabel,
  type OfficialEntry,
  type OfficialKind,
  type OfficialLang,
} from "@/lib/compendium/officialContent";

const KIND_ICON: Record<OfficialKind, typeof Skull> = {
  monsters: Skull,
  spells: Wand2,
  items: Gem,
};

const KIND_LABEL: Record<OfficialLang, Record<OfficialKind, { one: string; many: string }>> = {
  fr: {
    monsters: { one: "créature officielle", many: "créatures officielles" },
    spells: { one: "sort officiel", many: "sorts officiels" },
    items: { one: "objet officiel", many: "objets officiels" },
  },
  en: {
    monsters: { one: "official creature", many: "official creatures" },
    spells: { one: "official spell", many: "official spells" },
    items: { one: "official item", many: "official items" },
  },
};

const UI: Record<OfficialLang, Record<string, string>> = {
  fr: {
    loading: "Chargement…",
    for: "pour",
    unavailableTitle: "Contenu officiel indisponible",
    retry: "Réessayer",
    empty: "Aucun résultat officiel pour cette recherche.",
    prev: "Précédent",
    next: "Suivant",
    page: "Page",
    description: "Description",
    source: "Source",
    officialSheet: "Fiche officielle",
    translating: "Traduction française en cours pour les nouvelles fiches…",
  },
  en: {
    loading: "Loading…",
    for: "for",
    unavailableTitle: "Official content unavailable",
    retry: "Retry",
    empty: "No official result for this search.",
    prev: "Previous",
    next: "Next",
    page: "Page",
    description: "Description",
    source: "Source",
    officialSheet: "Official page",
    translating: "",
  },
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
  const [lang, setLang] = useState<OfficialLang>("fr");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OfficialEntry | null>(null);
  const [debounced, setDebounced] = useState(searchQuery);
  const abortRef = useRef<AbortController | null>(null);
  const t = UI[lang];

  // Debounce the shared search field before hitting the upstream APIs.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [debounced, kind, system, lang]);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOfficialContent({ system, kind, search: debounced, page, lang }, ctrl.signal);
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
  }, [system, kind, debounced, page, lang]);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  // Selected entry must follow the language switch.
  useEffect(() => { setSelected(null); }, [lang]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const Icon = KIND_ICON[kind];
  const countLabel = total > 1 ? KIND_LABEL[lang][kind].many : KIND_LABEL[lang][kind].one;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading ? t.loading : `${total} ${countLabel}`}
          {debounced && !loading ? ` ${t.for} « ${debounced} »` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de langue */}
          <div className="flex items-center rounded-lg border border-border bg-card/50 p-0.5">
            <Languages className="mx-1.5 h-3.5 w-3.5 text-muted-foreground" />
            {(["fr", "en"] as const).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition ${
                  lang === code ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {code === "fr" ? "FR" : "EN"}
              </button>
            ))}
          </div>
          <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
            {officialSourceLabel(system, lang)}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">{t.unavailableTitle}</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={load}>{t.retry}</Button>
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
          <p className="mt-4 text-muted-foreground">{t.empty}</p>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> {t.prev}
          </Button>
          <span className="text-sm text-muted-foreground">{t.page} {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            {t.next} <ChevronRight className="h-4 w-4" />
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
                      <h4 className="mb-2 font-display text-sm font-semibold text-primary">{t.description}</h4>
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
                    <p className="text-xs text-muted-foreground">{t.source} : {selected.source}</p>
                    {selected.url && (
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {t.officialSheet} <ExternalLink className="h-3 w-3" />
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
