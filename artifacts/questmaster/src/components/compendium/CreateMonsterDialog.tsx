import { useState } from "react";
import { compendiumApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateMonsterDialogProps {
  onCreated: () => void;
  defaultSystem?: string;
}

const SYSTEM_OPTIONS = ["D&D 5e", "Pathfinder 2e", "Aetheria", "Worlds Awakening", "Personnalisé"];

const CreateMonsterDialog = ({ onCreated, defaultSystem = "D&D 5e" }: CreateMonsterDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [system, setSystem] = useState(defaultSystem);
  const [scope, setScope] = useState<"custom_personal" | "custom_campaign">("custom_personal");
  const [form, setForm] = useState({
    name: "", size: "Moyen", type: "Humanoïde", alignment: "Neutre",
    armor_class: "10", hit_points: "10 (2d8+1)", speed: "9 m",
    challenge_rating: "1", description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await compendiumApi.createMonster({
        ...form,
        armor_class: parseInt(form.armor_class),
        system,
        scope,
      });
    }
    catch (e: any) { setLoading(false); toast.error("Erreur: " + e.message); return; }
    setLoading(false);
    toast.success("Monstre créé !");
    setOpen(false);
    onCreated();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Créer un monstre</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouveau monstre personnalisé</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Nom</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Système</Label>
              <Select value={system} onValueChange={setSystem}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SYSTEM_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Portée</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom_personal">Codex personnel</SelectItem>
                  <SelectItem value="custom_campaign">Pour cette campagne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Taille</Label>
              <Select value={form.size} onValueChange={v => setForm(f => ({ ...f, size: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Très petit","Petit","Moyen","Grand","Très grand","Gigantesque"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label><Input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} /></div>
            <div><Label>Alignement</Label><Input value={form.alignment} onChange={e => setForm(f => ({ ...f, alignment: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>CA</Label><Input type="number" value={form.armor_class} onChange={e => setForm(f => ({ ...f, armor_class: e.target.value }))} /></div>
            <div><Label>PV</Label><Input value={form.hit_points} onChange={e => setForm(f => ({ ...f, hit_points: e.target.value }))} /></div>
            <div><Label>Vitesse</Label><Input value={form.speed} onChange={e => setForm(f => ({ ...f, speed: e.target.value }))} /></div>
          </div>
          <div><Label>FP (Facteur de Puissance)</Label><Input value={form.challenge_rating} onChange={e => setForm(f => ({ ...f, challenge_rating: e.target.value }))} /></div>
          <div><Label>Description</Label><Textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} /></div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Création..." : "Créer le monstre"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMonsterDialog;
