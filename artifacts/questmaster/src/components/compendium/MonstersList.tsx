import { useState, useEffect } from "react";
import { compendiumApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Skull, Shield, Heart, Footprints } from "lucide-react";

interface Monster {
  id: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  armor_class: number;
  hit_points: string;
  speed: string;
  challenge_rating: string;
  description: string;
}

interface MonstersListProps {
  searchQuery: string;
}

const MonstersList = ({ searchQuery }: MonstersListProps) => {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [crFilter, setCrFilter] = useState<string>("all");
  const [expandedMonster, setExpandedMonster] = useState<string | null>(null);

  useEffect(() => {
    fetchMonsters();
  }, []);

  const fetchMonsters = async () => {
    try {
      const data = await compendiumApi.getMonsters();
      setMonsters(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredMonsters = monsters.filter((monster) => {
    const matchesSearch = monster.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monster.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || monster.type === typeFilter;
    const matchesSize = sizeFilter === "all" || monster.size === sizeFilter;
    const matchesCr = crFilter === "all" || monster.challenge_rating === crFilter;
    return matchesSearch && matchesType && matchesSize && matchesCr;
  });

  const types = [...new Set(monsters.map(m => m.type))];
  const sizes = [...new Set(monsters.map(m => m.size))];
  const crs = [...new Set(monsters.map(m => m.challenge_rating))];

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Dragon": "bg-red-500/20 text-red-400 border-red-500/30",
      "Mort-vivant": "bg-green-500/20 text-green-400 border-green-500/30",
      "Humanoïde": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Bête": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "Géant": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "Créature monstrueuse": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return colors[type] || "bg-muted text-muted-foreground border-border";
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
      {/* Filters */}
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

        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger className="w-[160px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Taille" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">Toutes tailles</SelectItem>
            {sizes.map(size => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={crFilter} onValueChange={setCrFilter}>
          <SelectTrigger className="w-[160px] bg-muted/50 border-border/50">
            <SelectValue placeholder="FP" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">Tous FP</SelectItem>
            {crs.map(cr => (
              <SelectItem key={cr} value={cr}>FP {cr}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filteredMonsters.length} monstre{filteredMonsters.length > 1 ? "s" : ""} trouvé{filteredMonsters.length > 1 ? "s" : ""}
      </p>

      {/* Monsters grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMonsters.map((monster) => (
          <div
            key={monster.id}
            className="group cursor-pointer rounded-xl border border-border/50 bg-gradient-card p-5 shadow-card transition-all duration-300 hover:border-primary/30"
            onClick={() => setExpandedMonster(expandedMonster === monster.id ? null : monster.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                  <Skull className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">
                    {monster.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {monster.size} • FP {monster.challenge_rating}
                  </p>
                </div>
              </div>
              <Badge className={`shrink-0 ${getTypeColor(monster.type)}`}>
                {monster.type}
              </Badge>
            </div>

            {expandedMonster === monster.id && (
              <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex flex-col items-center rounded-lg bg-muted/30 p-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <span className="mt-1 font-semibold text-foreground">{monster.armor_class}</span>
                    <span className="text-xs text-muted-foreground">CA</span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg bg-muted/30 p-2">
                    <Heart className="h-4 w-4 text-red-400" />
                    <span className="mt-1 font-semibold text-foreground">{monster.hit_points.split(" ")[0]}</span>
                    <span className="text-xs text-muted-foreground">PV</span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg bg-muted/30 p-2">
                    <Footprints className="h-4 w-4 text-amber-400" />
                    <span className="mt-1 font-semibold text-foreground">{monster.speed.split(" ")[0]}</span>
                    <span className="text-xs text-muted-foreground">Vit.</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {monster.alignment}
                </p>
                <p className="text-sm text-muted-foreground">
                  {monster.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredMonsters.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-gradient-card p-8 text-center shadow-card">
          <Skull className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Aucun monstre trouvé avec ces critères
          </p>
        </div>
      )}
    </div>
  );
};

export default MonstersList;
