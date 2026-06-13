import { useState, useEffect } from "react";
import { compendiumApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Gem, Sparkles } from "lucide-react";

interface MagicItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  attunement: boolean;
  description: string;
  properties: string | null;
}

interface ItemsListProps {
  searchQuery: string;
  system?: string;
}

const ItemsList = ({ searchQuery, system }: ItemsListProps) => {
  const [items, setItems] = useState<MagicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await compendiumApi.getItems(system);
      setItems(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesRarity = rarityFilter === "all" || item.rarity === rarityFilter;
    return matchesSearch && matchesType && matchesRarity;
  });

  const types = [...new Set(items.map(i => i.type))];
  const rarities = ["Commune", "Peu commune", "Rare", "Très rare", "Légendaire", "Artefact"];

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      "Commune": "bg-gray-500/20 text-gray-400 border-gray-500/30",
      "Peu commune": "bg-green-500/20 text-green-400 border-green-500/30",
      "Rare": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Très rare": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Légendaire": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "Artefact": "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[rarity] || "bg-muted text-muted-foreground border-border";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">Tous types</SelectItem>
            {types.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={rarityFilter} onValueChange={setRarityFilter}>
          <SelectTrigger className="w-[160px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Rareté" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">Toutes raretés</SelectItem>
            {rarities.map(rarity => (
              <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {filteredItems.length} objet{filteredItems.length > 1 ? "s" : ""} trouvé{filteredItems.length > 1 ? "s" : ""}
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group cursor-pointer rounded-xl border border-border/50 bg-gradient-card p-5 shadow-card transition-all duration-300 hover:border-primary/30"
            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Gem className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {item.type}
                  </p>
                </div>
              </div>
              <Badge className={`shrink-0 ${getRarityColor(item.rarity)}`}>
                {item.rarity}
              </Badge>
            </div>

            {expandedItem === item.id && (
              <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                {item.attunement && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Sparkles className="h-3 w-3" />
                    Nécessite une harmonisation
                  </div>
                )}
                {item.properties && (
                  <p className="text-sm font-medium text-foreground">
                    {item.properties}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-gradient-card p-8 text-center shadow-card">
          <Gem className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Aucun objet trouvé avec ces critères
          </p>
        </div>
      )}
    </div>
  );
};

export default ItemsList;
