// Marketplace — packs de contenu communautaires.
//
// Un pack regroupe des créations de l'Atelier. Publication par l'auteur,
// installation par n'importe quel utilisateur connecté (copie dans son Atelier
// via la fonction serveur `install_content_package`).

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, Loader2, Plus, Download, Trash2, Globe2, Lock, Search, Hammer, Check,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEM_LIST } from "@/lib/systems";
import { HomebrewRow, KIND_BY_ID } from "@/lib/homebrew";

interface PackageRow {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  system: string;
  tags: string[];
  is_published: boolean;
  install_count: number;
  created_at: string;
}

const Marketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [installed, setInstalled] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [category, setCategory] = useState<"all" | "pregens">("all");
  const [pregenItems, setPregenItems] = useState<Record<string, Record<string, any>[]>>({});
  const [creators, setCreators] = useState<Record<string, string>>({});
  const [raceFilter, setRaceFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");

  // Création de pack
  const [creating, setCreating] = useState(false);
  const [myContent, setMyContent] = useState<HomebrewRow[]>([]);
  const [form, setForm] = useState({ title: "", description: "", system: "custom", tags: "", is_published: true });
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [pub, mine, inst] = await Promise.all([
      (supabase as any).from("content_packages").select("*").eq("is_published", true).order("install_count", { ascending: false }),
      user ? (supabase as any).from("content_packages").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
      user ? (supabase as any).from("package_installs").select("package_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    const map = new Map<string, PackageRow>();
    for (const p of [...(pub.data ?? []), ...(mine.data ?? [])] as PackageRow[]) map.set(p.id, p);
    setPackages([...map.values()]);
    const ids = [...map.keys()];
    if (ids.length) {
      const { data: pi } = await (supabase as any)
        .from("package_items").select("package_id,payload").eq("kind", "pregen_character").in("package_id", ids);
      const grouped: Record<string, Record<string, any>[]> = {};
      for (const r of (pi ?? []) as { package_id: string; payload: Record<string, any> }[]) {
        (grouped[r.package_id] ||= []).push(r.payload ?? {});
      }
      setPregenItems(grouped);
    }
    setInstalled(((inst.data ?? []) as { package_id: string }[]).map((r) => r.package_id));
    if (user) {
      const { data: cr } = await (supabase as any).rpc("list_package_creators");
      const m: Record<string, string> = {};
      for (const r of (cr ?? []) as { owner_id: string; display_name: string }[]) m[r.owner_id] = r.display_name;
      setCreators(m);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("homebrew_content").select("*").eq("owner_id", user.id).order("kind");
    setMyContent((data ?? []) as HomebrewRow[]);
    setPicked([]);
    setForm({ title: "", description: "", system: "custom", tags: "", is_published: true });
    setCreating(true);
  };

  const createPackage = async () => {
    if (!user) return;
    if (!form.title.trim() || picked.length === 0) {
      toast({ title: "Pack incomplet", description: "Un titre et au moins une création sont nécessaires.", variant: "destructive" });
      return;
    }
    setSaving(true);
    // Atomic server-side creation: pack + items in one transaction (full rollback on error).
    const { error } = await (supabase as any).rpc("create_content_package", {
      _title: form.title.trim(),
      _description: form.description.trim() || null,
      _system: form.system,
      _tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      _is_published: form.is_published,
      _homebrew_ids: picked,
    });
    setSaving(false);
    if (error) {
      console.error("create_content_package", error);
      toast({ title: "Création impossible", description: "Le pack n'a pas pu être créé. Aucun contenu n'a été publié, réessayez.", variant: "destructive" });
      return;
    }
    const items = picked;
    toast({ title: "Pack créé", description: `${items.length} élément(s) empaqueté(s).` });
    setCreating(false);
    setTab("mine");
    void load();
  };

  const install = async (id: string) => {
    setBusyId(id);
    const { data, error } = await (supabase as any).rpc("install_content_package", { _package_id: id });
    setBusyId(null);
    if (error) {
      console.error("install_content_package", error);
      toast({ title: "Installation impossible", description: "Ce pack n'est plus disponible ou une erreur est survenue. Réessayez plus tard.", variant: "destructive" });
      return;
    }
    setInstalled((prev) => [...new Set([...prev, id])]);
    toast({ title: "Pack installé", description: `${data ?? 0} création(s) copiée(s) dans votre Atelier.` });
    void load();
  };

  const removePackage = async (id: string) => {
    const { error } = await (supabase as any).from("content_packages").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast({ title: "Suppression impossible", description: "Le pack n'a pas pu être supprimé. Réessayez.", variant: "destructive" });
      return;
    }
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePublish = async (pack: PackageRow) => {
    const { error } = await (supabase as any)
      .from("content_packages").update({ is_published: !pack.is_published }).eq("id", pack.id);
    if (error) {
      console.error(error);
      toast({ title: "Modification impossible", description: "La publication n'a pas pu être modifiée. Réessayez.", variant: "destructive" });
      return;
    }
    setPackages((prev) => prev.map((p) => (p.id === pack.id ? { ...p, is_published: !p.is_published } : p)));
  };

  // Filter options derived from published pregens (no hardcoded lists).
  const filterOptions = useMemo(() => {
    const all = Object.values(pregenItems).flat();
    const uniq = (vals: unknown[]) => [...new Set(vals.map((v) => String(v ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
    return {
      races: uniq(all.map((c) => c.race)),
      classes: uniq(all.map((c) => c.class)),
      creators: [...new Set(packages.map((p) => p.owner_id))].map((id) => ({ id, name: creators[id] ?? "Créateur" })),
    };
  }, [pregenItems, packages, creators]);

  const LEVEL_RANGES: Record<string, [number, number]> = { "1-4": [1, 4], "5-10": [5, 10], "11-16": [11, 16], "17+": [17, 999] };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
    return packages.filter((p) => {
      if (tab === "mine" ? p.owner_id !== user?.id : !p.is_published) return false;
      if (systemFilter !== "all" && p.system !== systemFilter) return false;
      // All packs are currently free: "Payant" yields no result.
      if (priceFilter === "paid") return false;
      if (creatorFilter !== "all" && p.owner_id !== creatorFilter) return false;
      let pcs = pregenItems[p.id] ?? [];
      if (category === "pregens") {
        if (raceFilter !== "all") pcs = pcs.filter((c) => norm(c.race) === raceFilter.toLowerCase());
        if (classFilter !== "all") pcs = pcs.filter((c) => norm(c.class) === classFilter.toLowerCase());
        if (levelFilter !== "all") {
          const [lo, hi] = LEVEL_RANGES[levelFilter];
          pcs = pcs.filter((c) => Number(c.level) >= lo && Number(c.level) <= hi);
        }
        if (pcs.length === 0) return false;
      }
      if (!q) return true;
      return p.title.toLowerCase().includes(q)
        || pcs.some((c) => [c.name, c.race, c.class, c.subclass, c.level ? `niveau ${c.level}` : ""]
          .some((v) => String(v ?? "").toLowerCase().includes(q)))
        || (p.description ?? "").toLowerCase().includes(q)
        || p.tags.some((t) => t.toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packages, tab, search, systemFilter, user, category, pregenItems, raceFilter, classFilter, levelFilter, priceFilter, creatorFilter]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <SEO
        title="Boutique de packs — Aetheria VTT"
        description="Découvrez, installez et partagez des packs de contenu créés par la communauté Aetheria VTT."
        path="/marketplace"
      />
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 font-heading text-3xl text-foreground">
              <Package className="h-7 w-7 text-primary" />
              Boutique de packs
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Partagez vos créations en packs et installez celles de la communauté en un clic.
              Les packs installés sont copiés dans votre Atelier : vous restez libre de les modifier.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/atelier"><Hammer className="mr-2 h-4 w-4" />Atelier</Link>
            </Button>
            <Button onClick={() => void openCreate()} disabled={!user}>
              <Plus className="mr-2 h-4 w-4" />Publier un pack
            </Button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "browse" | "mine")}>
            <TabsList>
              <TabsTrigger value="browse">Communauté</TabsTrigger>
              <TabsTrigger value="mine">Mes packs</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder={category === "pregens" ? "Nom, race, classe, niveau…" : "Rechercher un pack…"} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as "all" | "pregens")}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="pregens">Personnages pré-tirés</SelectItem>
            </SelectContent>
          </Select>
          <Select value={systemFilter} onValueChange={setSystemFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Système" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les systèmes</SelectItem>
              {SYSTEM_LIST.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Prix" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les prix</SelectItem>
              <SelectItem value="free">Gratuit</SelectItem>
              <SelectItem value="paid">Payant</SelectItem>
            </SelectContent>
          </Select>
          <Select value={creatorFilter} onValueChange={setCreatorFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Créateur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les créateurs</SelectItem>
              {filterOptions.creators.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {category === "pregens" && (
            <>
              <Select value={raceFilter} onValueChange={setRaceFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Race" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les races</SelectItem>
                  {filterOptions.races.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Classe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {filterOptions.classes.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Niveau" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  {Object.keys(LEVEL_RANGES).map((k) => <SelectItem key={k} value={k}>Niveau {k}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 py-16 text-center">
            <p className="text-muted-foreground">
              {tab === "mine" ? "Vous n'avez pas encore publié de pack." : "Aucun pack ne correspond à votre recherche."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => {
              const isMine = p.owner_id === user?.id;
              const isInstalled = installed.includes(p.id);
              return (
                <article key={p.id} className="flex flex-col rounded-lg border border-border/60 bg-card/60 p-4 backdrop-blur">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-heading text-lg text-foreground">{p.title}</h2>
                    <Badge variant="outline" className="shrink-0">
                      {p.is_published ? <Globe2 className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                      {p.is_published ? "Publié" : "Brouillon"}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">{p.description || "Sans description"}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge variant="secondary">{SYSTEM_LIST.find((s) => s.id === p.system)?.shortLabel ?? p.system}</Badge>
                    {p.tags.slice(0, 3).map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                  </div>
                  {(pregenItems[p.id] ?? []).map((c, i) => (
                    <p key={i} className="mt-2 text-xs text-muted-foreground">
                      🧙 <span className="text-foreground">{c.name}</span>
                      {" — "}{[c.class, c.subclass, c.race, c.level ? `Niveau ${c.level}` : null].filter(Boolean).join(" · ")}
                    </p>
                  ))}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Gratuit · {creators[p.owner_id] ? `par ${creators[p.owner_id]} · ` : ""}{p.install_count} installation(s)
                    </span>
                    <div className="flex gap-1">
                      {isMine && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => void togglePublish(p)}>
                            {p.is_published ? "Dépublier" : "Publier"}
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Supprimer le pack" onClick={() => void removePackage(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" onClick={() => void install(p.id)} disabled={busyId === p.id || !user || isInstalled}>
                        {busyId === p.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          : isInstalled ? <Check className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
                        {pregenItems[p.id]?.length ? (isInstalled ? "Déjà dans ma bibliothèque" : "Ajouter à ma bibliothèque") : (isInstalled ? "Déjà installé" : "Installer")}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Publier un pack</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="pk-title">Titre</Label>
              <Input id="pk-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="pk-desc">Description</Label>
              <Textarea id="pk-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Système</Label>
                <Select value={form.system} onValueChange={(v) => setForm({ ...form, system: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SYSTEM_LIST.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pk-tags">Étiquettes</Label>
                <Input id="pk-tags" placeholder="donjon, horreur…" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Contenu à inclure ({picked.length} sélectionné(s))</Label>
              <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
                {myContent.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">
                    Aucune création disponible. Commencez par en forger dans l'Atelier.
                  </p>
                )}
                {myContent.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-muted/40">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                      checked={picked.includes(c.id)}
                      onChange={(e) => setPicked((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))}
                    />
                    <span aria-hidden>{KIND_BY_ID[c.kind]?.emoji ?? "📦"}</span>
                    <span className="flex-1 truncate text-sm text-foreground">{c.name}</span>
                    <Badge variant="outline" className="shrink-0">{KIND_BY_ID[c.kind]?.label ?? c.kind}</Badge>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="pk-pub" checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label htmlFor="pk-pub" className="cursor-pointer">Publier immédiatement dans la Boutique</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Annuler</Button>
            <Button onClick={() => void createPackage()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer le pack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
