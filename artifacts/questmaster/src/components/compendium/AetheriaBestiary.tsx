import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { compendiumApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import AetheriaCreatureDialog from "./AetheriaCreatureDialog";
import {
  Search, Heart, Zap, Shield, ChevronDown, ChevronRight,
  Skull, Swords, Globe, Lock,
} from "lucide-react";

interface AetheriaCreature {
  id: string;
  name: string;
  description: string;
  lore: string;
  size: string;
  force: number;
  agilite: number;
  esprit: number;
  endurance: number;
  pv: number;
  pv_max: number;
  pe_max: number;
  def_physique: number;
  def_magique: number;
  reduction_physique: number;
  reduction_magique: number;
  initiative_bonus: number;
  attaque: string;
  degats: string;
  capacites: { name: string; description: string; cost: string }[];
  conditions_immunites: string[];
  is_public: boolean;
  created_by: string;
  campaign_id?: string;
}

interface Props {
  campaignId?: string;
  isGM?: boolean;
}

function CreatureCard({ creature, currentUserId }: { creature: AetheriaCreature; currentUserId?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="w-full cursor-pointer p-3 rounded-lg border border-border hover:border-primary/40 bg-card/50 hover:bg-card transition-all">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Skull className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm truncate">{creature.name}</span>
                <Badge variant="outline" className="text-xs hidden sm:flex">{creature.size}</Badge>
                {creature.is_public
                  ? <Globe className="h-3 w-3 text-green-400 flex-shrink-0" />
                  : <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </div>
              {creature.description && (
                <p className="text-muted-foreground text-xs truncate mt-0.5">{creature.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-400" />
                <span className="text-red-400 text-xs font-bold">{creature.pv_max}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-400" />
                <span className="text-green-400 text-xs font-bold">{creature.def_physique}</span>
              </div>
              {creature.attaque && (
                <div className="flex items-center gap-1">
                  <Swords className="h-3 w-3 text-primary" />
                  <span className="text-primary text-xs font-bold">{creature.degats}</span>
                </div>
              )}
              {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mx-2 mb-2 p-4 rounded-b-lg bg-card border border-t-0 border-border space-y-4">
          <div>
            <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">Caractéristiques</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded bg-red-500/10 border border-red-500/20">
                <div className="text-red-400 font-bold">{creature.force}</div>
                <div className="text-muted-foreground text-xs">Force</div>
              </div>
              <div className="text-center p-2 rounded bg-green-500/10 border border-green-500/20">
                <div className="text-green-400 font-bold">{creature.agilite}</div>
                <div className="text-muted-foreground text-xs">Agilité</div>
              </div>
              <div className="text-center p-2 rounded bg-blue-500/10 border border-blue-500/20">
                <div className="text-blue-400 font-bold">{creature.esprit}</div>
                <div className="text-muted-foreground text-xs">Esprit</div>
              </div>
              <div className="text-center p-2 rounded bg-orange-500/10 border border-orange-500/20">
                <div className="text-orange-400 font-bold">{creature.endurance}</div>
                <div className="text-muted-foreground text-xs">Endurance</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">Points</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-foreground font-bold">{creature.pv_max}</span>
                  <span className="text-muted-foreground text-xs">PV</span>
                </div>
                {creature.pe_max > 0 && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-blue-400" />
                    <span className="text-foreground font-bold">{creature.pe_max}</span>
                    <span className="text-muted-foreground text-xs">PE</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">Défenses</p>
              <div className="flex gap-3 flex-wrap">
                <div className="text-center">
                  <div className="text-green-400 font-bold text-sm">{creature.def_physique}</div>
                  <div className="text-muted-foreground text-xs">DEF PHY</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-bold text-sm">{creature.def_magique}</div>
                  <div className="text-muted-foreground text-xs">DEF MAG</div>
                </div>
                {creature.reduction_physique > 0 && (
                  <div className="text-center">
                    <div className="text-primary font-bold text-sm">-{creature.reduction_physique}</div>
                    <div className="text-muted-foreground text-xs">RÉD PHY</div>
                  </div>
                )}
                {creature.reduction_magique > 0 && (
                  <div className="text-center">
                    <div className="text-primary font-bold text-sm">-{creature.reduction_magique}</div>
                    <div className="text-muted-foreground text-xs">RÉD MAG</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {creature.attaque && (
            <div className="p-2 rounded bg-muted/50 border border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <Swords className="h-4 w-4 text-primary" />
                <span className="text-primary font-semibold text-sm">{creature.attaque}</span>
                <span className="text-foreground text-sm">— {creature.degats}</span>
                <span className="text-muted-foreground text-xs ml-auto">Init: +{creature.initiative_bonus}</span>
              </div>
            </div>
          )}

          {creature.capacites && creature.capacites.length > 0 && (
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">Capacités</p>
              <div className="space-y-2">
                {creature.capacites.map((cap, i) => (
                  <div key={i} className="p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-foreground text-sm font-semibold">{cap.name}</span>
                      {cap.cost && (
                        <Badge variant="outline" className="text-blue-400 border-blue-400/40 text-xs">
                          {cap.cost} PE
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">{cap.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {creature.conditions_immunites && creature.conditions_immunites.length > 0 && (
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-1">Immunités</p>
              <div className="flex flex-wrap gap-1">
                {creature.conditions_immunites.map(cond => (
                  <Badge key={cond} variant="outline" className="text-xs border-red-500/40 text-red-400">
                    {cond}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {creature.lore && (
            <div className="p-3 rounded bg-background/50 border border-border">
              <p className="text-primary text-xs font-semibold mb-1">Lore</p>
              <p className="text-muted-foreground text-xs leading-relaxed italic">{creature.lore}</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AetheriaBestiary({ campaignId, isGM = false }: Props) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: creatures = [], isLoading } = useQuery({
    queryKey: ["aetheria-creatures", campaignId],
    queryFn: async () => {
      const data = await compendiumApi.getAetheriaCreatures(user?.id);
      return (data || []) as unknown as AetheriaCreature[];
    },
  });

  const filtered = creatures.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const myCreatures = filtered.filter(c => c.created_by === user?.id);
  const publicCreatures = filtered.filter(c => c.is_public && c.created_by !== user?.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-primary font-semibold flex items-center gap-2">
            <Skull className="h-4 w-4" />
            Bestiaire Aetheria
          </h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            {creatures.length} créature{creatures.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isGM && <AetheriaCreatureDialog campaignId={campaignId} />}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Chercher une créature..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <Skull className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search ? "Aucune créature trouvée" : "Aucune créature dans le bestiaire"}
          </p>
          {isGM && !search && (
            <p className="text-muted-foreground/70 text-xs mt-1">Crée ta première créature Aetheria !</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {myCreatures.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">Mes créatures</p>
              <div className="space-y-2">
                {myCreatures.map(c => <CreatureCard key={c.id} creature={c} currentUserId={user?.id} />)}
              </div>
            </div>
          )}

          {myCreatures.length > 0 && publicCreatures.length > 0 && <Separator />}

          {publicCreatures.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">Bestiaire communautaire</p>
              <div className="space-y-2">
                {publicCreatures.map(c => <CreatureCard key={c.id} creature={c} currentUserId={user?.id} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
