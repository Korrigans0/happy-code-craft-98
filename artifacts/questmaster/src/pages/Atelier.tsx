// Atelier — éditeurs de contenu maison (races, classes, sorts, objets,
// créatures, capacités, règles) sans toucher au code.
//
// Le formulaire est généré à partir du registre `src/lib/homebrew.ts`.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Hammer, Loader2, Plus, Trash2, Pencil, Globe2, Lock, Package } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEM_LIST } from "@/lib/systems";
import { HOMEBREW_KINDS, HomebrewKind, HomebrewRow, KIND_BY_ID, emptyData } from "@/lib/homebrew";

interface Draft {
  id?: string;
  kind: HomebrewKind;
  system: string;
  name: string;
  summary: string;
  is_public: boolean;
  data: Record<string, unknown>;
}

const newDraft = (kind: HomebrewKind, system: string): Draft => ({
  kind, system, name: "", summary: "", is_public: false, data: emptyData(kind),
});

const Atelier = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<HomebrewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKind, setActiveKind] = useState<HomebrewKind>("race");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("homebrew_content")
      .select("*")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) toast({ title: "Chargement impossible", description: error.message, variant: "destructive" });
    setRows((data ?? []) as HomebrewRow[]);
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(
    () => rows.filter((r) => r.kind === activeKind && (systemFilter === "all" || r.system === systemFilter)),
    [rows, activeKind, systemFilter],
  );

  const kindDef = KIND_BY_ID[activeKind];

  const save = async () => {
    if (!draft || !user) return;
    if (!draft.name.trim()) {
      toast({ title: "Nom requis", description: "Donnez un nom à votre création.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      owner_id: user.id,
      kind: draft.kind,
      system: draft.system,
      name: draft.name.trim(),
      summary: draft.summary.trim() || null,
      is_public: draft.is_public,
      data: draft.data,
    };
    const query = draft.id
      ? (supabase as any).from("homebrew_content").update(payload).eq("id", draft.id)
      : (supabase as any).from("homebrew_content").insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) {
      toast({ title: "Enregistrement impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: draft.id ? "Création mise à jour" : "Création enregistrée" });
    setDraft(null);
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from("homebrew_content").delete().eq("id", id);
    if (error) {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const setField = (key: string, value: unknown) =>
    setDraft((d) => (d ? { ...d, data: { ...d.data, [key]: value } } : d));

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <SEO
        title="Atelier de création — Aetheria VTT"
        description="Créez vos races, classes, sorts, objets et créatures maison, puis partagez-les en packs avec la communauté."
      />
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 font-heading text-3xl text-foreground">
              <Hammer className="h-7 w-7 text-primary" />
              Atelier de création
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Forgez votre propre contenu : races, classes, sorts, objets, créatures, capacités et règles maison.
              Tout est réutilisable dans vos campagnes et empaquetable pour la Boutique.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/marketplace"><Package className="mr-2 h-4 w-4" />Boutique</Link>
            </Button>
            <Button onClick={() => setDraft(newDraft(activeKind, systemFilter === "all" ? "custom" : systemFilter))}>
              <Plus className="mr-2 h-4 w-4" />Nouvelle création
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Tabs value={activeKind} onValueChange={(v) => setActiveKind(v as HomebrewKind)}>
            <TabsList className="flex-wrap">
              {HOMEBREW_KINDS.map((k) => (
                <TabsTrigger key={k.kind} value={k.kind} className="gap-1">
                  <span aria-hidden>{k.emoji}</span>
                  <span className="hidden sm:inline">{k.plural}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select value={systemFilter} onValueChange={setSystemFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Système" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les systèmes</SelectItem>
              {SYSTEM_LIST.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{kindDef?.hint}</p>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 py-16 text-center">
            <p className="text-muted-foreground">Aucune création de ce type pour l'instant.</p>
            <Button className="mt-4" onClick={() => setDraft(newDraft(activeKind, systemFilter === "all" ? "custom" : systemFilter))}>
              <Plus className="mr-2 h-4 w-4" />Créer {kindDef?.label.toLowerCase()}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((row) => (
              <div key={row.id} className="rounded-lg border border-border/60 bg-card/60 p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-heading text-lg text-foreground">{row.name}</h2>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{row.summary || "Sans résumé"}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {row.is_public ? <Globe2 className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                    {row.is_public ? "Public" : "Privé"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="secondary">{SYSTEM_LIST.find((s) => s.id === row.system)?.shortLabel ?? row.system}</Badge>
                  <div className="flex gap-1">
                    <Button
                      size="icon" variant="ghost" aria-label="Modifier"
                      onClick={() => setDraft({
                        id: row.id, kind: row.kind as HomebrewKind, system: row.system,
                        name: row.name, summary: row.summary ?? "", is_public: row.is_public,
                        data: { ...emptyData(row.kind as HomebrewKind), ...(row.data ?? {}) },
                      })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => void remove(row.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {draft?.id ? "Modifier" : "Créer"} — {draft ? KIND_BY_ID[draft.kind]?.label : ""}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="hb-name">Nom</Label>
                <Input id="hb-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <Label>Système</Label>
                <Select value={draft.system} onValueChange={(v) => setDraft({ ...draft, system: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SYSTEM_LIST.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={draft.kind}
                  onValueChange={(v) => setDraft({ ...draft, kind: v as HomebrewKind, data: emptyData(v as HomebrewKind) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOMEBREW_KINDS.map((k) => <SelectItem key={k.kind} value={k.kind}>{k.emoji} {k.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="hb-summary">Résumé</Label>
                <Input id="hb-summary" value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="Une ligne d'accroche" />
              </div>

              {KIND_BY_ID[draft.kind]?.fields.map((f) => {
                const value = draft.data[f.key];
                return (
                  <div key={f.key} className={f.wide ? "sm:col-span-2" : undefined}>
                    <Label htmlFor={`hb-${f.key}`}>{f.label}</Label>
                    {f.type === "textarea" ? (
                      <Textarea id={`hb-${f.key}`} rows={4} value={String(value ?? "")} placeholder={f.placeholder}
                        onChange={(e) => setField(f.key, e.target.value)} />
                    ) : f.type === "number" ? (
                      <Input id={`hb-${f.key}`} type="number" value={Number(value ?? 0)}
                        onChange={(e) => setField(f.key, Number(e.target.value))} />
                    ) : f.type === "tags" ? (
                      <Input id={`hb-${f.key}`} value={Array.isArray(value) ? (value as string[]).join(", ") : ""}
                        placeholder={f.placeholder}
                        onChange={(e) => setField(f.key, e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
                    ) : (
                      <Input id={`hb-${f.key}`} value={String(value ?? "")} placeholder={f.placeholder}
                        onChange={(e) => setField(f.key, e.target.value)} />
                    )}
                  </div>
                );
              })}

              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch id="hb-public" checked={draft.is_public} onCheckedChange={(v) => setDraft({ ...draft, is_public: v })} />
                <Label htmlFor="hb-public" className="cursor-pointer">
                  Rendre visible par la communauté
                </Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Annuler</Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Atelier;
