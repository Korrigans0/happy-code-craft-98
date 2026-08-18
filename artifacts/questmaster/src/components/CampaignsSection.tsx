import { useEffect, useState } from "react";
import CampaignCard from "./CampaignCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { campaignsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
  user_id?: string | null;
}

const CampaignsSection = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await campaignsApi.list();
        setCampaigns((data || []).filter((c: Campaign) => c.is_active).slice(0, 6));
      } catch {
        setCampaigns([]);
      }
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await campaignsApi.delete(pendingDelete.id);
      setCampaigns(prev => prev.filter(c => c.id !== pendingDelete.id));
      toast({ title: "Campagne supprimée", description: pendingDelete.title });
      setPendingDelete(null);
    } catch {
      toast({
        title: "Impossible de supprimer",
        description: "Seul le MJ propriétaire peut supprimer cette campagne.",
        variant: "destructive",
      });
    }
    setDeleting(false);
  };

  if (loading) return null;
  if (campaigns.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground md:text-2xl">
            Campagnes Actives
          </h2>
          <Badge variant="outline" className="border-primary/30 text-primary">
            {campaigns.length} campagne{campaigns.length > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              id={campaign.id}
              title={campaign.title}
              description={campaign.description || "Aucune description"}
              isActive={campaign.is_active ?? true}
              date={new Date(campaign.created_at).toLocaleDateString("fr-FR")}
              canManage={!!user && campaign.user_id === user.id}
              deleting={deleting && pendingDelete?.id === campaign.id}
              onDelete={() => setPendingDelete(campaign)}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && !deleting && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer «&nbsp;{pendingDelete?.title}&nbsp;» ?</DialogTitle>
            <DialogDescription>
              Cette action est définitive. Les scènes, jetons, notes et messages de cette
              campagne seront perdus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Trash2 className="mr-2 h-4 w-4" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CampaignsSection;
