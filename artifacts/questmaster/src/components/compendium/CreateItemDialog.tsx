import { useState } from "react";
import { compendiumApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateItemDialogProps {
  onCreated: () => void;
  defaultSystem?: string;
}

// Aetheria et Worlds Awakening sont exclus : ils possèdent leur propre catalogue d'objets.
const SYSTEM_OPTIONS = ["D&D 5e", "Pathfinder 2e", "Call of Cthulhu", "Personnalisé"];

const CreateItemDialog = ({ onCreated, defaultSystem = "Personnalisé" }: CreateItemDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [system, setSystem] = useState(defaultSystem);
  const [isPublic, setIsPublic] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "Arme", rarity: "Commune", attunement: false,
    description: "", properties: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await compendiumApi.createItem({
        ...form,
        properties: form.properties || null,
        system,
        scope: "custom_personal",
        is_public: isPublic,
      });
    } catch (e: any) {
      setLoading(false);
      toast.error("Erreur: " + e.message);
      return;
    }
    setLoading(false);
    toast.success("Objet créé !");
    setOpen(false);
    onCreated();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Créer un objet</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouvel objet personnalisé</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Système</Label>
            <Select value={system} onValueChange={setSystem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SYSTEM_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
            <div>
              <Label className="text-sm">Partager avec la communauté</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublic ? "Visible par tous les joueurs Aetheria VTT." : "Visible uniquement par vous."}
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <div><Label>Nom</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Type</Label><Input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} /></div>
            <div><Label>Rareté</Label>
              <Select value={form.rarity} onValueChange={v => setForm(f => ({ ...f, rarity: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Commune","Peu commune","Rare","Très rare","Légendaire","Artefact"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.attunement} onCheckedChange={v => setForm(f => ({ ...f, attunement: !!v }))} />
            <Label>Nécessite une harmonisation</Label>
          </div>
          <div><Label>Propriétés</Label><Input value={form.properties} onChange={e => setForm(f => ({ ...f, properties: e.target.value }))} placeholder="Optionnel" /></div>
          <div><Label>Description</Label><Textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} /></div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Création..." : "Créer l'objet"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateItemDialog;
