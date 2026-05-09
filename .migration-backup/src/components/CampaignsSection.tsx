import { useEffect, useState } from "react";
import CampaignCard from "./CampaignCard";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
}

const CampaignsSection = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id, title, description, is_active, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);

      setCampaigns(data || []);
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

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
              title={campaign.title}
              description={campaign.description || "Aucune description"}
              isActive={campaign.is_active ?? true}
              date={new Date(campaign.created_at).toLocaleDateString("fr-FR")}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CampaignsSection;
