import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEM_LIST } from "@/lib/systems";
import { pregensApi, PREGEN_KIND } from "@/lib/pregens";

interface Row { id: string; name: string; system: string; summary: string | null; image_url: string | null; data: Record<string, any> }
interface CampaignOpt { id: string; title: string; system: string }

const db = supabase as any;

/** Pré-tirés récupérés depuis la Boutique (stockés dans la bibliothèque homebrew). */
export const LibraryPregens = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<Row | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [h, c] = await Promise.all([
        db.from("homebrew_content").select("id,name,system,summary,image_url,data").eq("owner_id", userId).eq("kind", PREGEN_KIND).order("created_at", { ascending: false }),
        db.from("campaigns").select("id,title,system").eq("user_id", userId).order("updated_at", { ascending: false }),
      ]);
      setRows((h.data ?? []) as Row[]);
      setCampaigns((c.data ?? []) as CampaignOpt[]);
      setLoading(false);
    })();
  }, [userId]);

  const remove = async (id: string) => {
    const { error } = await db.from("homebrew_content").delete().eq("id", id);
    if (error) {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const add = async () => {
    if (!target || !campaignId) return;
    setBusy(true);
    try {
      await pregensApi.addFromLibrary(target.id, campaignId);
      toast({ title: "Pré-tiré ajouté ✓", description: "Rendez-le disponible aux joueurs depuis l'onglet Joueurs." });
      const cid = campaignId;
      setTarget(null);
      navigate(`/campaigns/${cid}?tab=members`);
    } catch (e: any) {
      toast({ title: "Ajout impossible", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
        Aucun personnage pré-tiré. Récupérez-en depuis la Boutique.
      </div>
    );
  }

  const compatible = target ? campaigns.filter((c) => c.system === target.system) : [];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const c = r.data ?? {};
          return (
            <article key={r.id} className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/60 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-primary/30">
                  <AvatarImage src={c.avatar_url ?? r.image_url ?? undefined} alt={r.name} />
                  <AvatarFallback>{r.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold text-foreground">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[c.class, c.race, c.level ? `Niveau ${c.level}` : null].filter(Boolean).join(" — ")}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">{SYSTEM_LIST.find((s) => s.id === r.system)?.shortLabel ?? r.system}</Badge>
              <div className="mt-auto flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => { setCampaignId(""); setTarget(r); }}>
                  <Plus className="mr-1 h-3.5 w-3.5" />Ajouter à une campagne
                </Button>
                <Button size="icon" variant="ghost" aria-label="Retirer de la bibliothèque" onClick={() => void remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter « {target?.name} » à une campagne</DialogTitle>
            <DialogDescription>Une copie indépendante est créée ; l'original reste intact.</DialogDescription>
          </DialogHeader>
          {compatible.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune de vos campagnes n'utilise ce système de jeu.</p>
          ) : (
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger><SelectValue placeholder="Choisir une campagne" /></SelectTrigger>
              <SelectContent>
                {compatible.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>Annuler</Button>
            <Button disabled={!campaignId || busy} onClick={() => void add()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
