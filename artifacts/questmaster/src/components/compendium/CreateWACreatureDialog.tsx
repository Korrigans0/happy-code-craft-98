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

interface CreateWACreatureDialogProps {
  onCreated: () => void;
}

const CreateWACreatureDialog = ({ onCreated }: CreateWACreatureDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", size: "Moyen", power_level: "Standard", profile: "Équilibré",
    ra: "1/1", strength: "0", dexterity: "0", constitution: "0",
    intelligence: "0", wisdom: "0", charisma: "0", description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try { await compendiumApi.createWaCreature(user.id, { ...form, strength: parseInt(form.strength), dexterity: parseInt(form.dexterity), constitution: parseInt(form.constitution), intelligence: parseInt(form.intelligence), wisdom: parseInt(form.wisdom), charisma: parseInt(form.charisma), author: "Personnalisé" }); }
    catch (e: any) { setLoading(false); toast.error("Erreur: " + e.message); return; }
    setLoading(false);
    toast.success("Créature WA créée !");
    setOpen(false);
    onCreated();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Créer une créature</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouvelle créature Worlds Awakening</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Nom</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Taille</Label>
              <Select value={form.size} onValueChange={v => setForm(f => ({ ...f, size: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Petit","Moyen","Grand","Très grand","Gigantesque"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Puissance</Label>
              <Select value={form.power_level} onValueChange={v => setForm(f => ({ ...f, power_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Standard","Mini-Boss (PV)","Mini-Boss (DM)","Boss"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Profil</Label><Input value={form.profile} onChange={e => setForm(f => ({ ...f, profile: e.target.value }))} /></div>
          </div>
          <div><Label>RA (Résistance / Attaque)</Label><Input value={form.ra} onChange={e => setForm(f => ({ ...f, ra: e.target.value }))} placeholder="ex: 2/3" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>FOR</Label><Input type="number" value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value }))} /></div>
            <div><Label>DEX</Label><Input type="number" value={form.dexterity} onChange={e => setForm(f => ({ ...f, dexterity: e.target.value }))} /></div>
            <div><Label>CON</Label><Input type="number" value={form.constitution} onChange={e => setForm(f => ({ ...f, constitution: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>INT</Label><Input type="number" value={form.intelligence} onChange={e => setForm(f => ({ ...f, intelligence: e.target.value }))} /></div>
            <div><Label>SAG</Label><Input type="number" value={form.wisdom} onChange={e => setForm(f => ({ ...f, wisdom: e.target.value }))} /></div>
            <div><Label>CHA</Label><Input type="number" value={form.charisma} onChange={e => setForm(f => ({ ...f, charisma: e.target.value }))} /></div>
          </div>
          <div><Label>Description</Label><Textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} /></div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Création..." : "Créer la créature"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWACreatureDialog;
