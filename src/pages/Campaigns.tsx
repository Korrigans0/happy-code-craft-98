import { useState } from "react";
import { Plus, Search, Filter, Sword, Users, Calendar, Settings, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Campaign {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  playersCount: number;
  date: string;
  system: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    title: "La Malédiction de Strahd",
    description: "Un voyage sombre à travers les terres de Barovie, où les héros doivent affronter le vampire Strahd von Zarovich.",
    isActive: true,
    playersCount: 5,
    date: "Chaque Samedi",
    system: "D&D 5e",
  },
  {
    id: "2",
    title: "Mines Perdues de Phandelver",
    description: "Une aventure classique pour débutants dans la région de la Côte des Épées.",
    isActive: false,
    playersCount: 4,
    date: "En pause",
    system: "D&D 5e",
  },
  {
    id: "3",
    title: "Tomb of Annihilation",
    description: "Explorez la jungle de Chult et découvrez les secrets de l'Âme Atroce.",
    isActive: false,
    playersCount: 6,
    date: "Terminée",
    system: "D&D 5e",
  },
];

const Campaigns = () => {
  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCampaigns = campaigns.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Mes Campagnes
              </h1>
              <p className="text-muted-foreground">
                Gérez vos aventures et sessions de jeu
              </p>
            </div>
            <Button variant="gold">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Campagne
            </Button>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une campagne..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-card p-6 shadow-card transition-all duration-300 hover:border-primary/30"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                    <Sword className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {campaign.title}
                      </h3>
                      <Badge variant={campaign.isActive ? "active" : "inactive"}>
                        {campaign.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {campaign.description}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {campaign.playersCount} joueurs
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {campaign.date}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="join" size="sm" className="flex-1">
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                        Rejoindre
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Campaigns;