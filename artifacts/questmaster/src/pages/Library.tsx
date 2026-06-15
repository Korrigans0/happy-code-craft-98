// Library — Bibliothèque MJ.
//
// Vue dédiée listant uniquement le contenu créé par l'utilisateur connecté
// (monstres, sorts, objets) avec filtres par système et par scope.
// Permet la suppression rapide. L'édition complète passe encore par les
// dialogs de création — itération future.

import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Library as LibraryIcon, Skull, Wand2, Gem, Loader2, Trash2, Lock, Globe2, BookOpen, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageAmbiance from "@/components/fantasy/PageAmbiance";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { compendiumApi } from "@/lib/api";
import { SYSTEM_LIST } from "@/lib/systems";
import { MediaLibrary } from "@/components/media/MediaLibrary";

type Kind = "monsters" | "spells" | "items" | "media";

interface Row {
  id: string;
  name: string;
  system?: string | null;
  scope?: string | null;
  is_public?: boolean | null;
  campaign_id?: string | null;
  // champs spécifiques utilisés pour l'affichage compact
  type?: string;
  challenge_rating?: string;
  level?: number;
  school?: string;
  rarity?: string;
}

type CompendiumKind = Exclude<Kind, "media">;
const KIND_META: Record<CompendiumKind, { label: string; icon: typeof Skull; fetch: () => Promise<Row[]>; remove: (id: string) => Promise<unknown>; emptyHint: string }> = {
  monsters: {
    label: "Créatures",
    icon: Skull,
    fetch: () => compendiumApi.getMyMonsters() as Promise<Row[]>,
    remove: (id) => compendiumApi.deleteMonster(id),
    emptyHint: "Créez votre première créature depuis le Codex du système concerné.",
  },
  spells: {
    label: "Sorts",
    icon: Wand2,
    fetch: () => compendiumApi.getMySpells() as Promise<Row[]>,
    remove: (id) => compendiumApi.deleteSpell(id),
    emptyHint: "Créez votre premier sort depuis le Codex du système concerné.",
  },
  items: {
    label: "Objets",
    icon: Gem,
    fetch: () => compendiumApi.getMyItems() as Promise<Row[]>,
    remove: (id) => compendiumApi.deleteItem(id),
    emptyHint: "Créez votre premier objet depuis le Codex du système concerné.",
  },
};

const SCOPE_LABEL: Record<string, { label: string; icon: typeof Lock; color: string }> = {
  custom_personal: { label: "Personnel", icon: Lock, color: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  custom_global: { label: "Communauté", icon: Globe2, color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  custom_campaign: { label: "Campagne", icon: BookOpen, color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  official: { label: "Officiel", icon: BookOpen, color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
};

const ScopeBadge = ({ scope }: { scope?: string | null }) => {
  const meta = SCOPE_LABEL[scope ?? "custom_personal"] ?? SCOPE_LABEL.custom_personal;
  const Icon = meta.icon;
  return (
    <Badge className={`${meta.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
};

const SystemBadge = ({ system }: { system?: string | null }) => {
  const sys = SYSTEM_LIST.find((s) => s.id === system);
  if (!sys) return <Badge variant="outline" className="text-xs">{system ?? "—"}</Badge>;
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <span>{sys.emoji}</span>
      {sys.label}
    </Badge>
  );
};

const RowSummary = ({ kind, row }: { kind: CompendiumKind; row: Row }) => {
  if (kind === "monsters") return <>{row.type ?? "—"} • FP {row.challenge_rating ?? "?"}</>;
  if (kind === "spells") return <>{row.school ?? "—"} • Niveau {row.level ?? 0}</>;
  return <>{row.type ?? "—"} • {row.rarity ?? "Commun"}</>;
};

const updateFor = (kind: CompendiumKind) => (id: string, patch: Record<string, unknown>) => {
  if (kind === "monsters") return compendiumApi.updateMonster(id, patch);
  if (kind === "spells") return compendiumApi.updateSpell(id, patch);
  return compendiumApi.updateItem(id, patch);
};

const LibraryTab = ({ kind }: { kind: CompendiumKind }) => {
  const meta = KIND_META[kind];
  const update = updateFor(kind);
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [system, setSystem] = useState<string>("all");
  const [scope, setScope] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTarget, setBulkTarget] = useState<string>("");
  const [migrating, setMigrating] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await meta.fetch();
      setRows(data ?? []);
      setSelected(new Set());
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur de chargement", description: "Impossible de charger votre bibliothèque.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [meta, toast]);

  useEffect(() => { void reload(); }, [reload]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (system !== "all" && (r.system ?? "") !== system) return false;
      if (scope !== "all" && (r.scope ?? "custom_personal") !== scope) return false;
      if (q && !r.name?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, system, scope]);

  const handleDelete = async (id: string, name: string) => {
    try {
      await meta.remove(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      toast({ title: "Supprimé", description: `« ${name} » a été retiré de votre bibliothèque.` });
    } catch (e: any) {
      toast({ title: "Suppression refusée", description: e?.message ?? "Erreur inconnue.", variant: "destructive" });
    }
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (allFilteredSelected) filtered.forEach((r) => n.delete(r.id));
      else filtered.forEach((r) => n.add(r.id));
      return n;
    });

  const applyMigration = async () => {
    if (!bulkTarget || selected.size === 0) return;
    setMigrating(true);
    const ids = Array.from(selected);
    let ok = 0, fail = 0;
    for (const id of ids) {
      try { await update(id, { system: bulkTarget }); ok++; }
      catch (e) { console.error(e); fail++; }
    }
    setMigrating(false);
    toast({
      title: "Migration terminée",
      description: `${ok} entrée(s) réassignée(s)${fail ? `, ${fail} échec(s)` : ""}.`,
      variant: fail ? "destructive" : "default",
    });
    await reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder={`Rechercher dans vos ${meta.label.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 max-w-xs"
        />
        <Select value={system} onValueChange={setSystem}>
          <SelectTrigger className="h-10 w-[200px]"><SelectValue placeholder="Système" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous systèmes</SelectItem>
            {SYSTEM_LIST.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.emoji} {s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="h-10 w-[180px]"><SelectValue placeholder="Visibilité" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes visibilités</SelectItem>
            <SelectItem value="custom_personal">Personnel</SelectItem>
            <SelectItem value="custom_global">Communauté</SelectItem>
            <SelectItem value="custom_campaign">Campagne</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} {meta.label.toLowerCase()}
        </span>
      </div>

      {/* Barre de migration de masse */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAll}
              className="h-4 w-4 accent-primary"
            />
            Tout sélectionner
          </label>
          <span className="text-sm text-muted-foreground">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select value={bulkTarget} onValueChange={setBulkTarget}>
              <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Réassigner à…" /></SelectTrigger>
              <SelectContent>
                {SYSTEM_LIST.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.emoji} {s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!bulkTarget || selected.size === 0 || migrating}
              onClick={applyMigration}
            >
              {migrating ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Appliquer
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 text-center">
          <meta.icon className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-display text-base text-foreground">Rien à afficher</p>
          <p className="mt-1 text-sm text-muted-foreground">{meta.emptyHint}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/compendium">Aller au Codex</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <div
              key={row.id}
              className={`group flex flex-col gap-3 rounded-xl border bg-gradient-card p-4 shadow-card transition ${
                selected.has(row.id) ? "border-primary/60 ring-1 ring-primary/30" : "border-border/60 hover:border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <label className="flex min-w-0 items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold text-foreground">{row.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <RowSummary kind={kind} row={row} />
                    </p>
                  </div>
                </label>
                <meta.icon className="h-5 w-5 shrink-0 text-primary/70" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <SystemBadge system={row.system} />
                <ScopeBadge scope={row.scope} />
              </div>
              <div className="mt-auto flex justify-end">

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer « {row.name} » ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est définitive. Le contenu disparaîtra du codex et de toute campagne qui s'y référait.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDelete(row.id, row.name)}
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Library = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Kind>("monsters");

  return (
    <div className="relative flex min-h-screen flex-col">
      <PageAmbiance />
      <SEO
        title="Bibliothèque MJ — Aetheria VTT"
        description="Gérez le contenu que vous avez créé : créatures, sorts et objets, par système et par visibilité."
        path="/library"
      />
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                <LibraryIcon className="h-7 w-7 text-primary" />
                Bibliothèque MJ
              </h1>
              <p className="mt-2 text-muted-foreground">
                Votre contenu personnel — toutes campagnes, tous systèmes confondus.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/compendium">+ Créer dans le Codex</Link>
            </Button>
          </div>

          {!user ? (
            <div className="rounded-xl border border-border bg-card/40 p-8 text-center">
              <p className="text-muted-foreground">Connectez-vous pour accéder à votre bibliothèque.</p>
              <Button asChild className="mt-4"><Link to="/auth">Se connecter</Link></Button>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as Kind)}>
              <TabsList className="mb-6 flex flex-wrap gap-1 bg-muted/50 p-1">
                <TabsTrigger value="monsters" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Skull className="h-3.5 w-3.5" /> Créatures
                </TabsTrigger>
                <TabsTrigger value="spells" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Wand2 className="h-3.5 w-3.5" /> Sorts
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Gem className="h-3.5 w-3.5" /> Objets
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <ImageIcon className="h-3.5 w-3.5" /> Médias
                </TabsTrigger>
              </TabsList>
              <TabsContent value="monsters"><LibraryTab kind="monsters" /></TabsContent>
              <TabsContent value="spells"><LibraryTab kind="spells" /></TabsContent>
              <TabsContent value="items"><LibraryTab kind="items" /></TabsContent>
              <TabsContent value="media"><MediaLibrary /></TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Library;
