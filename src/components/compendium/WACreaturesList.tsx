import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Skull, Swords, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface WACreature {
  id: string;
  name: string;
  power_level: string;
  size: string;
  profile: string;
  ra: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  description: string;
  author: string | null;
}

interface WACreaturesListProps {
  searchQuery: string;
}

const WACreaturesList = ({ searchQuery }: WACreaturesListProps) => {
  const { user } = useAuth();
  const [creatures, setCreatures] = useState<WACreature[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [powerFilter, setPowerFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [expandedCreature, setExpandedCreature] = useState<string | null>(null);

  const fetchCreatures = async () => {
    const { data, error } = await supabase
      .from("wa_creatures")
      .select("*")
      .order("name");
    if (!error) setCreatures((data as WACreature[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCreatures();
  }, []);

  const syncFromWA = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-wa-bestiary');
      if (error) throw error;
      if (data?.success) {
        toast.success(`Sync terminée : ${data.inserted} ajoutées, ${data.updated} mises à jour`);
        fetchCreatures();
      } else {
        toast.error(data?.error || "Erreur de synchronisation");
      }
    } catch (err: any) {
      toast.error("Erreur: " + (err.message || "Impossible de synchroniser"));
    }
    setSyncing(false);
  };

  const filtered = creatures.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPower = powerFilter === "all" || c.power_level === powerFilter;
    const matchesSize = sizeFilter === "all" || c.size === sizeFilter;
    return matchesSearch && matchesPower && matchesSize;
  });

  const powers = [...new Set(creatures.map(c => c.power_level))];
  const sizes = [...new Set(creatures.map(c => c.size))];

  const getPowerColor = (power: string) => {
    const colors: Record<string, string> = {
      "Standard": "bg-green-500/20 text-green-400 border-green-500/30",
      "Mini-Boss (PV)": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "Mini-Boss (DM)": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "Boss": "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[power] || "bg-muted text-muted-foreground border-border";
  };

  const formatMod = (val: number) => val >= 0 ? `+${val}` : `${val}`;

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
        <Select value={powerFilter} onValueChange={setPowerFilter}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Puissance" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">Toutes puissances</SelectItem>
            {powers.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger className="w-[160px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Taille" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all">Toutes tailles</SelectItem>
            {sizes.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} créature{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((creature) => (
          <div
            key={creature.id}
            className="group cursor-pointer rounded-xl border border-border/50 bg-gradient-card p-5 shadow-card transition-all duration-300 hover:border-primary/30"
            onClick={() => setExpandedCreature(expandedCreature === creature.id ? null : creature.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Swords className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">
                    {creature.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {creature.size} • {creature.profile} • RA {creature.ra}
                  </p>
                </div>
              </div>
              <Badge className={`shrink-0 ${getPowerColor(creature.power_level)}`}>
                {creature.power_level}
              </Badge>
            </div>

            {expandedCreature === creature.id && (
              <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                <div className="grid grid-cols-6 gap-2 text-center text-sm">
                  {[
                    { label: "FOR", val: creature.strength },
                    { label: "DEX", val: creature.dexterity },
                    { label: "CON", val: creature.constitution },
                    { label: "INT", val: creature.intelligence },
                    { label: "SAG", val: creature.wisdom },
                    { label: "CHA", val: creature.charisma },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex flex-col items-center rounded-lg bg-muted/30 p-2">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{formatMod(val)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{creature.description}</p>
                {creature.author && (
                  <p className="text-xs text-muted-foreground/60">Par {creature.author}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-gradient-card p-8 text-center shadow-card">
          <Skull className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Aucune créature trouvée avec ces critères
          </p>
        </div>
      )}
    </div>
  );
};

export default WACreaturesList;
