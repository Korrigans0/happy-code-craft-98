import CampaignCard from "./CampaignCard";
import { Badge } from "@/components/ui/badge";

const campaigns = [
  {
    title: "Les Mines de Phandalin",
    description: "Une aventure épique dans les mines abandonnées de Phandalin. Les gobelins ont envahi les anciennes mines naines et menacent la région.",
    isActive: true,
    date: "23/12/2025",
  },
];

const CampaignsSection = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground md:text-2xl">
            Vos Campagnes
          </h2>
          <Badge variant="outline" className="border-primary/30 text-primary">
            {campaigns.length} campagne{campaigns.length > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.title} {...campaign} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CampaignsSection;
