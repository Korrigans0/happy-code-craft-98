import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateSpellDialogProps {
  onCreated: () => void;
}

const CreateSpellDialog = ({ onCreated }: CreateSpellDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", level: "0", school: "Évocation", casting_time: "1 action",
    range: "9 mètres", components: "V, S", duration: "Instantanée",
    description: "", classes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("spells").insert({
      ...form,
      level: parseInt(form.level),
      classes: form.classes.split(",").map(c => c.trim()).filter(Boolean),
      created_by: user.id,
    } as any);
    setLoading(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Sort créé !");
    setOpen(false);
    setForm({ name: "", level: "0", school: "Évocation", casting_time: "1 action", range: "9 mètres", components: "V, S", duration: "Instantanée", description: "", classes: "" });
    onCreated();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Créer un sort</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouveau sort personnalisé</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Nom</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Niveau</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Tour de magie</SelectItem>
                  {[1,2,3,4,5,6,7,8,9].map(l => <SelectItem key={l} value={l.toString()}>Niveau {l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>École</Label>
              <Select value={form.school} onValueChange={v => setForm(f => ({ ...f, school: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Abjuration","Divination","Enchantement","Évocation","Illusion","Invocation","Nécromancie","Transmutation"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Temps d'incantation</Label><Input value={form.casting_time} onChange={e => setForm(f => ({ ...f, casting_time: e.target.value }))} /></div>
            <div><Label>Portée</Label><Input value={form.range} onChange={e => setForm(f => ({ ...f, range: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Composantes</Label><Input value={form.components} onChange={e => setForm(f => ({ ...f, components: e.target.value }))} /></div>
            <div><Label>Durée</Label><Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
          </div>
          <div><Label>Classes (séparées par des virgules)</Label><Input value={form.classes} onChange={e => setForm(f => ({ ...f, classes: e.target.value }))} placeholder="Magicien, Sorcier" /></div>
          <div><Label>Description</Label><Textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} /></div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Création..." : "Créer le sort"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSpellDialog;
