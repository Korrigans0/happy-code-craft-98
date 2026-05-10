import { useState, useEffect } from "react";
import { compendiumApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Skull, Swords, RefreshCw, CheckCircle } from "lucide-react";
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
    try {
      const data = await compendiumApi.getWaCreatures();
      setCreatures((data as any[]).map(c => ({
        id: c.id,
        name: c.name,
        power_level: c.powerLevel ?? c.power_level ?? "",
        size: c.size,
        profile: c.profile,
        ra: c.ra,
        strength: c.strength,
        dexterity: c.dexterity,
        constitution: c.constitution,
        intelligence: c.intelligence,
        wisdom: c.wisdom,
        charisma: c.charisma,
        description: c.description,
        author: c.author ?? null,
      })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchCreatures();
  }, []);

  const syncFromWA = async () => {
    setSyncing(true);
    toast.info("Synchronisation en cours… Cela peut prendre 1–2 minutes.", { duration: 90000, id: "wa-sync" });
    try {
      const result: any = await compendiumApi.syncWaCreatures();
      toast.dismiss("wa-sync");
      if (result.inserted > 0) {
        toast.success(result.message || `${result.inserted} nouvelle(s) créature(s) ajoutée(s) au bestiaire !`);
        await fetchCreatures();
      } else {
        toast.success(result.message || "Le bestiaire est déjà à jour.", { icon: <CheckCircle className="h-4 w-4" /> });
        if (result.total > 0) await fetchCreatures();
      }
    } catch (e: any) {
      toast.dismiss("wa-sync");
      toast.error("Erreur lors de la synchronisation : " + (e.message || "Erreur inconnue"));
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

  const powers = [...new Set(creatures.map(c => c.power_level))].filter(Boolean);
  const sizes = [...new Set(creatures.map(c => c.size))].filter(Boolean);

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
      {/* Bandeau si vide */}
      {creatures.length === 0 && (
        <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 text-xl">🌍</div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-400 mb-1">Bestiaire vide</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Cliquez sur "Importer le bestiaire WA" pour récupérer toutes les créatures directement depuis worlds-awakening.com. L'import prend environ 1–2 minutes.
            </p>
            {user && (
              <Button onClick={syncFromWA} disabled={syncing} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Import en cours…" : "Importer le bestiaire WA"}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        {user && creatures.length > 0 && (
          <Button variant="outline" size="sm" onClick={syncFromWA} disabled={syncing} className="gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Synchronisation…" : "Sync WA (worlds-awakening.com)"}
          </Button>
        )}
        {creatures.length > 0 && (
          <>
            <Select value={powerFilter} onValueChange={setPowerFilter}>
              <SelectTrigger className="w-[180px] bg-muted/50 border-border/50">
                <SelectValue placeholder="Puissance" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all">Toutes puissances</SelectItem>
                {powers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="w-[160px] bg-muted/50 border-border/50">
                <SelectValue placeholder="Taille" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all">Toutes tailles</SelectItem>
                {sizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {creatures.length > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          {filtered.length} créature{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
          {" "}sur {creatures.length} au total
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((creature) => (
          <div
            key={creature.id}
            className="group cursor-pointer rounded-xl border border-border/50 bg-gradient-card p-5 shadow-card transition-all duration-300 hover:border-blue-500/30"
            onClick={() => setExpandedCreature(expandedCreature === creature.id ? null : creature.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  <Swords className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{creature.name}</h3>
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
                      <span className={`font-semibold ${val >= 0 ? "text-green-400" : "text-red-400"}`}>{formatMod(val)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{creature.description}</p>
                {creature.author && (
                  <p className="text-xs text-muted-foreground/60">Source : {creature.author}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {creatures.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-gradient-card p-8 text-center shadow-card">
          <Skull className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Aucune créature trouvée avec ces critères</p>
        </div>
      )}
    </div>
  );
};

export default WACreaturesList;
