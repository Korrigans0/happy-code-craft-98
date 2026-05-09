import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { compendiumApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  campaignId?: string;
}

const SIZES = ["Minuscule", "Très petit", "Petit", "Moyen", "Grand", "Très grand", "Gigantesque"];

export default function AetheriaCreatureDialog({ campaignId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    lore: "",
    size: "Moyen",
    force: 0, agilite: 0, esprit: 0, endurance: 0,
    pv: 10, pv_max: 10, pe: 0, pe_max: 0,
    def_physique: 10, def_magique: 10,
    reduction_physique: 0, reduction_magique: 0,
    initiative_bonus: 0,
    attaque: "",
    degats: "",
    is_public: false,
  });

  const upd = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!user) return toast.error("Connexion requise");
    if (!form.name.trim()) return toast.error("Nom requis");
    setSaving(true);
    try {
      await compendiumApi.createAetheriaCreature(user.id, { ...form, campaign_id: campaignId ?? null, capacites: [], conditions_immunites: [] });
    } catch (e: any) {
      setSaving(false);
      toast.error("Erreur : " + e.message);
      return;
    }
    setSaving(false);
    toast.success("Créature créée !");
    qc.invalidateQueries({ queryKey: ["aetheria-creatures"] });
    setOpen(false);
    setForm({
      name: "", description: "", lore: "", size: "Moyen",
      force: 0, agilite: 0, esprit: 0, endurance: 0,
      pv: 10, pv_max: 10, pe: 0, pe_max: 0,
      def_physique: 10, def_magique: 10,
      reduction_physique: 0, reduction_magique: 0,
      initiative_bonus: 0, attaque: "", degats: "", is_public: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="gold">
          <Plus className="mr-2 h-4 w-4" /> Créer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Nouvelle créature Aetheria</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Nom</Label>
                <Input value={form.name} onChange={e => upd("name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Taille</Label>
                <Select value={form.size} onValueChange={v => upd("size", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Description courte</Label>
              <Input value={form.description} onChange={e => upd("description", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Lore</Label>
              <Textarea rows={3} value={form.lore} onChange={e => upd("lore", e.target.value)} />
            </div>

            <div>
              <Label className="mb-2 block">Caractéristiques</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["force", "agilite", "esprit", "endurance"] as const).map(s => (
                  <div key={s} className="space-y-1">
                    <Label className="text-xs capitalize">{s}</Label>
                    <Input type="number" value={form[s]} onChange={e => upd(s, parseInt(e.target.value) || 0)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>PV max</Label>
                <Input type="number" value={form.pv_max}
                  onChange={e => { const v = parseInt(e.target.value) || 0; upd("pv_max", v); upd("pv", v); }} />
              </div>
              <div className="space-y-1">
                <Label>PE max</Label>
                <Input type="number" value={form.pe_max}
                  onChange={e => { const v = parseInt(e.target.value) || 0; upd("pe_max", v); upd("pe", v); }} />
              </div>
              <div className="space-y-1">
                <Label>Def Physique</Label>
                <Input type="number" value={form.def_physique} onChange={e => upd("def_physique", parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <Label>Def Magique</Label>
                <Input type="number" value={form.def_magique} onChange={e => upd("def_magique", parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <Label>Réd. Physique</Label>
                <Input type="number" value={form.reduction_physique} onChange={e => upd("reduction_physique", parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <Label>Réd. Magique</Label>
                <Input type="number" value={form.reduction_magique} onChange={e => upd("reduction_magique", parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <Label>Bonus Initiative</Label>
                <Input type="number" value={form.initiative_bonus} onChange={e => upd("initiative_bonus", parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Attaque</Label>
                <Input value={form.attaque} onChange={e => upd("attaque", e.target.value)} placeholder="Griffes" />
              </div>
              <div className="space-y-1">
                <Label>Dégâts</Label>
                <Input value={form.degats} onChange={e => upd("degats", e.target.value)} placeholder="2d6" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded border border-border p-3">
              <div>
                <Label>Publier au bestiaire communautaire</Label>
                <p className="text-xs text-muted-foreground">Visible par tous les utilisateurs</p>
              </div>
              <Switch checked={form.is_public} onCheckedChange={v => upd("is_public", v)} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="gold" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
