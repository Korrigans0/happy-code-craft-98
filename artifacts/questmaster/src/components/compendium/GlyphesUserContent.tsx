// GlyphesUserContent — bibliothèque communautaire pour le système Glyphes.
// 3 catégories : bestiaire, objets, maps. Tout utilisateur connecté peut créer ;
// le créateur choisit si son entrée est publique ou privée. Cloisonné au système
// Glyphes — n'interagit avec aucun autre univers.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Skull, Package, Map as MapIcon, Plus, Eye, EyeOff, Trash2, ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";

type Kind = "creature" | "object" | "map";

interface Entry {
  id: string;
  created_by: string;
  kind: Kind;
  name: string;
  description: string;
  image_url: string | null;
  data: Record<string, unknown>;
  is_public: boolean;
  created_at: string;
}

const KIND_META: Record<Kind, { label: string; icon: typeof Skull; placeholder: string }> = {
  creature: { label: "Bestiaire", icon: Skull, placeholder: "PUI D8, SOU D6, attaques, capacités…" },
  object:   { label: "Objet",    icon: Package, placeholder: "Type, prix, effets, propriétés magiques…" },
  map:      { label: "Carte",    icon: MapIcon, placeholder: "Lieu, échelle, contexte narratif…" },
};

interface Props { kind: Kind; }

const GlyphesUserContent = ({ kind }: Props) => {
  const { user } = useAuth();
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", image_url: "", is_public: true,
  });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("glyphes_content" as any)
      .select("*")
      .eq("kind", kind)
      .order("created_at", { ascending: false });
    if (error) toast.error("Impossible de charger les entrées");
    else setEntries(((data as unknown) as Entry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [kind]);

  const resetForm = () => {
    setForm({ name: "", description: "", image_url: "", is_public: true });
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (e: Entry) => {
    setEditing(e);
    setForm({
      name: e.name, description: e.description ?? "",
      image_url: e.image_url ?? "", is_public: e.is_public,
    });
    setOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (!user) { toast.error("Connexion requise"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image > 5 Mo"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `glyphes/${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: false });
    if (error) { toast.error("Upload échoué"); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    if (!user) { toast.error("Connexion requise"); return; }
    if (!form.name.trim()) { toast.error("Le nom est requis"); return; }
    const payload = {
      kind, name: form.name.trim(), description: form.description,
      image_url: form.image_url || null, is_public: form.is_public,
      created_by: user.id,
    };
    if (editing) {
      const { error } = await supabase.from("glyphes_content" as any)
        .update(payload).eq("id", editing.id);
      if (error) { toast.error("Sauvegarde échouée"); return; }
    } else {
      const { error } = await supabase.from("glyphes_content" as any).insert(payload);
      if (error) { toast.error("Création échouée"); return; }
    }
    toast.success(editing ? "Mise à jour" : "Créé");
    setOpen(false); resetForm(); load();
  };

  const toggleVisibility = async (e: Entry) => {
    const { error } = await supabase.from("glyphes_content" as any)
      .update({ is_public: !e.is_public }).eq("id", e.id);
    if (error) toast.error("Action refusée");
    else { toast.success(!e.is_public ? "Rendu public" : "Rendu privé"); load(); }
  };

  const remove = async (e: Entry) => {
    if (!confirm(`Supprimer "${e.name}" ?`)) return;
    const { error } = await supabase.from("glyphes_content" as any).delete().eq("id", e.id);
    if (error) toast.error("Suppression refusée");
    else { toast.success("Supprimé"); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-amber-400" />
          <div>
            <h3 className="font-display text-base font-semibold text-amber-300">
              {meta.label} — Communauté Glyphes
            </h3>
            <p className="text-xs text-muted-foreground">
              Cloisonné au système Glyphes. Chaque entrée peut rester privée ou être partagée avec tous.
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate} disabled={!user}>
              <Plus className="mr-1 h-4 w-4" /> Créer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier" : "Créer"} — {meta.label}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nom</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Description / statistiques</Label>
                <Textarea rows={6} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={meta.placeholder} />
              </div>
              <div>
                <Label className="text-xs">Image / carte</Label>
                <div className="flex items-center gap-2">
                  <Input value={form.image_url} placeholder="URL ou laissez vide"
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input bg-card px-3 py-2 text-xs hover:bg-accent">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? "…" : "Importer"}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                  </label>
                </div>
                {form.image_url && (
                  <img src={form.image_url} alt="" className="mt-2 max-h-32 rounded border border-border" />
                )}
              </div>
              <div className="flex items-center gap-3 rounded-md border border-border p-3">
                <Switch checked={form.is_public}
                  onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
                <div className="text-xs">
                  <div className="font-semibold">{form.is_public ? "Public" : "Privé"}</div>
                  <div className="text-muted-foreground">
                    {form.is_public ? "Visible par toute la communauté Glyphes." : "Visible seulement par vous."}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Chargement…</p>
      ) : entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aucune entrée pour l'instant. {user ? "Créez la première !" : "Connectez-vous pour contribuer."}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((e) => {
            const mine = user?.id === e.created_by;
            return (
              <div key={e.id} className="overflow-hidden rounded-xl border border-amber-500/20 bg-card transition hover:border-amber-500/40">
                {e.image_url ? (
                  <img src={e.image_url} alt={e.name} className="h-40 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-muted/30">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-sm font-semibold text-amber-300">{e.name}</h4>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                      e.is_public ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"
                    }`}>
                      {e.is_public ? "Public" : "Privé"}
                    </span>
                  </div>
                  {e.description && (
                    <p className="line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">{e.description}</p>
                  )}
                  {mine && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(e)}>Éditer</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleVisibility(e)}>
                        {e.is_public ? <><EyeOff className="mr-1 h-3 w-3" /> Privé</> : <><Eye className="mr-1 h-3 w-3" /> Public</>}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300" onClick={() => remove(e)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GlyphesUserContent;
