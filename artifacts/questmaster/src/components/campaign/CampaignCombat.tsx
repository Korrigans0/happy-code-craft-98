import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Swords, Shield, Heart, Zap, Play, Pause,
  SkipForward, Trash2, ChevronUp, ChevronDown,
  Skull, User, Timer, Target, Flame, Snowflake, Dices, ScrollText
} from "lucide-react";
import TurnOrderBar from "@/components/campaign/vtt/TurnOrderBar";

interface Monster { id: string; name: string; hit_points: string; armor_class: number; }
interface Character { id: string; name: string; hp: number; max_hp: number; armor_class: number; dexterity: number; }

interface CampaignCombatProps {
  campaignId: string;
  isGM: boolean;
}

interface Participant {
  id: string;
  name: string;
  initiative: number;
  current_hp: number;
  max_hp: number;
  armor_class: number;
  is_player: boolean;
  conditions: string[];
  turn_order: number;
}

interface Encounter {
  id: string;
  campaign_id: string;
  name: string;
  round: number;
  current_turn: number;
  is_active: boolean;
  participants: Participant[];
}

const CONDITIONS = [
  "Aveuglé", "Charmé", "Assourdi", "Effrayé", "Empoigné",
  "Incapacité", "Invisible", "Paralysé", "Pétrifié", "Empoisonné",
  "À terre", "Entravé", "Étourdi", "Inconscient", "Concentration"
];

const CampaignCombat = ({ campaignId, isGM }: CampaignCombatProps) => {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [hpDialogOpen, setHpDialogOpen] = useState<string | null>(null);
  const [hpAmount, setHpAmount] = useState("");
  const [hpMode, setHpMode] = useState<"damage" | "heal">("damage");
  const [newParticipant, setNewParticipant] = useState({
    name: "", initiative: 10, current_hp: 10, max_hp: 10, armor_class: 10, is_player: true,
  });
  const [conditionsOpenFor, setConditionsOpenFor] = useState<string | null>(null);
  const [encounterName, setEncounterName] = useState("Combat");

  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [lastRoll, setLastRoll] = useState<{ dice: string; result: number } | null>(null);
  const [combatLogs, setCombatLogs] = useState<{
    id: string;
    round: number;
    turn: number;
    actorName: string;
    action: string;
    result?: string;
    timestamp: Date;
  }[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const { data: combatData, isLoading } = useQuery<Encounter | null>({
    queryKey: ["combat", campaignId],
    queryFn: () => campaignsApi.getCombat(campaignId),
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  const encounter = combatData ?? null;
  const participants: Participant[] = encounter?.participants ?? [];

  const { data: monstersData = [] } = useQuery({
    queryKey: ["compendiumMonsters"],
    queryFn: async () => {
      const { compendiumApi } = await import("@/lib/api");
      return compendiumApi.getMonsters();
    },
  });
  const monsters: Monster[] = (monstersData as any[]).map((m: any) => ({
    id: m.id, name: m.name,
    hit_points: m.hit_points || String(m.hitPoints || "10"),
    armor_class: m.armor_class ?? m.armorClass ?? 10,
  }));

  const { data: campaignCharactersData = [] } = useQuery({
    queryKey: ["campaignCharacters", campaignId],
    queryFn: () => campaignsApi.getCampaignCharacters(campaignId),
  });
  const partyCharacters: Character[] = (campaignCharactersData as any[]).map((c: any) => ({
    id: c.id, name: c.name, hp: c.hp ?? 10, max_hp: c.max_hp ?? c.maxHp ?? 10,
    armor_class: c.armor_class ?? c.armorClass ?? 10, dexterity: c.dexterity ?? 10,
  }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["combat", campaignId] });

  const createEncounterMutation = useMutation({
    mutationFn: (name: string) => campaignsApi.createCombat(campaignId, name),
    onSuccess: () => {
      invalidate();
      setTimerSeconds(0);
      setTimerRunning(true);
      toast({ title: "Combat créé !" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const endEncounterMutation = useMutation({
    mutationFn: () => campaignsApi.endCombat(campaignId),
    onSuccess: () => {
      invalidate();
      setTimerRunning(false);
      toast({ title: "Combat terminé" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const addParticipantMutation = useMutation({
    mutationFn: (data: typeof newParticipant) => campaignsApi.addCombatParticipant(campaignId, data),
    onSuccess: () => {
      invalidate();
      setIsAddOpen(false);
      setNewParticipant({ name: "", initiative: 10, current_hp: 10, max_hp: 10, armor_class: 10, is_player: true });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateParticipantMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      campaignsApi.updateCombatParticipant(campaignId, id, data),
    onSuccess: invalidate,
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const removeParticipantMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.removeCombatParticipant(campaignId, id),
    onSuccess: invalidate,
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const nextTurnMutation = useMutation({
    mutationFn: async () => {
      if (!encounter || participants.length === 0) return;
      const nextTurn = (encounter.current_turn + 1) % participants.length;
      const newRound = nextTurn === 0 ? encounter.round + 1 : encounter.round;
      return campaignsApi.updateCombat(campaignId, { current_turn: nextTurn, round: newRound });
    },
    onSuccess: invalidate,
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const rollDice = (sides: number, count: number = 1, modifier: number = 0) => {
    let total = modifier;
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      results.push(r);
      total += r;
    }
    const dice = `${count}d${sides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? modifier : ""}`;
    setLastRoll({ dice, result: total });
    if (sides === 20 && count === 1) {
      if (results[0] === 20) { toast({ title: `🎲 CRITIQUE ! ${dice} = ${total} 🎉` }); return; }
      if (results[0] === 1) { toast({ title: `🎲 ÉCHEC CRITIQUE ! ${dice} = ${total} 💀` }); return; }
    }
    toast({ title: `🎲 ${dice} = ${total} [${results.join(", ")}]` });
  };

  const autoRollInitiative = async () => {
    try {
      const results = await Promise.allSettled(participants.map(p =>
        campaignsApi.updateCombatParticipant(campaignId, p.id, {
          initiative: Math.floor(Math.random() * 20) + 1,
        })
      ));
      const failed = results.filter(r => r.status === "rejected").length;
      invalidate();
      if (failed > 0) {
        toast({ title: `Initiative relancée (${failed} échec${failed > 1 ? "s" : ""})`, variant: "destructive" });
      } else {
        toast({ title: "Initiative relancée pour tous !" });
      }
    } catch (e: any) {
      toast({ title: e.message ?? "Erreur lors du lancer d'initiative", variant: "destructive" });
    }
  };

  const addAllPartyMembers = () => {
    partyCharacters.forEach(char => {
      const dexMod = Math.floor(((char as any).dexterity - 10) / 2);
      addParticipantMutation.mutate({
        name: char.name,
        initiative: Math.floor(Math.random() * 20) + 1 + dexMod,
        current_hp: char.hp,
        max_hp: char.max_hp,
        armor_class: char.armor_class,
        is_player: true,
      });
    });
  };

  const addMonster = (monster: Monster) => {
    const hpMatch = monster.hit_points.match(/(\d+)/);
    const hp = hpMatch ? parseInt(hpMatch[1]) : 10;
    addParticipantMutation.mutate({
      name: monster.name,
      initiative: Math.floor(Math.random() * 20) + 1,
      current_hp: hp,
      max_hp: hp,
      armor_class: monster.armor_class,
      is_player: false,
    });
  };

  const addLog = (actorName: string, action: string, result?: string) => {
    setCombatLogs(prev => [{
      id: crypto.randomUUID(),
      round: encounter?.round ?? 1,
      turn: encounter?.current_turn ?? 0,
      actorName,
      action,
      result,
      timestamp: new Date(),
    }, ...prev.slice(0, 49)]);
  };

  const applyHpChange = (participantId: string) => {
    const amount = parseInt(hpAmount);
    if (isNaN(amount) || amount <= 0) return;
    const p = participants.find(p => p.id === participantId);
    if (!p) return;
    const newHp = hpMode === "damage"
      ? Math.max(0, p.current_hp - amount)
      : Math.min(p.max_hp, p.current_hp + amount);
    updateParticipantMutation.mutate({ id: participantId, current_hp: newHp });
    setHpDialogOpen(null);
    setHpAmount("");
    addLog(p.name, hpMode === "heal" ? "Soin" : "Dégâts",
      `${Math.abs(amount)} PV → ${newHp}/${p.max_hp}`);
    if (hpMode === "damage") {
      toast({ title: `💥 ${p.name} reçoit ${amount} dégâts (${newHp} PV)` });
    } else {
      toast({ title: `💚 ${p.name} récupère ${amount} PV (${newHp} PV)` });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="text-muted-foreground">Chargement du combat...</span>
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-gradient-card p-12">
        <Swords className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Pas de combat actif</h3>
        <p className="text-muted-foreground mb-6">Lancez un combat pour commencer le tracker d'initiative</p>
        {isGM && (
          <div className="flex flex-col items-center gap-3">
            <Input
              value={encounterName}
              onChange={e => setEncounterName(e.target.value)}
              placeholder="Nom du combat"
              className="w-64 text-center"
            />
            <Button variant="gold" onClick={() => createEncounterMutation.mutate(encounterName)} disabled={createEncounterMutation.isPending}>
              <Swords className="mr-2 h-4 w-4" />
              Commencer un combat
            </Button>
          </div>
        )}
      </div>
    );
  }

  const currentParticipant = participants[encounter.current_turn];
  const playersAlive = participants.filter(p => p.is_player && p.current_hp > 0).length;
  const monstersAlive = participants.filter(p => !p.is_player && p.current_hp > 0).length;

  return (
    <>
      {encounter && encounter.is_active && (
        <TurnOrderBar
          participants={participants}
          currentTurn={encounter.current_turn}
          round={encounter.round}
          isActive={encounter.is_active}
          isGM={isGM}
          onNextTurn={() => nextTurnMutation.mutate()}
          onPrevTurn={isGM ? () => {
            const prev = (encounter.current_turn - 1 + participants.length) % participants.length;
            const newRound = prev === participants.length - 1 && encounter.current_turn === 0
              ? Math.max(1, encounter.round - 1)
              : encounter.round;
            campaignsApi.updateCombat(campaignId, { current_turn: prev, round: newRound })
              .then(() => queryClient.invalidateQueries({ queryKey: ["combat", campaignId] }));
          } : undefined}
          onEndCombat={isGM ? () => endEncounterMutation.mutate() : undefined}
        />
      )}
    <div className="space-y-4">
      {/* Combat Header */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="text-lg px-3 py-1">
                Round {encounter.round}
              </Badge>
              {currentParticipant && (
                <span className="text-foreground">
                  Tour de <strong className="text-primary">{currentParticipant.name}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-blue-400 flex items-center gap-1">
                <User className="h-3 w-3" /> {playersAlive}
              </span>
              <span className="text-red-400 flex items-center gap-1">
                <Skull className="h-3 w-3" /> {monstersAlive}
              </span>
              <div className="flex items-center gap-1 border-l border-border pl-3">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-foreground">{formatTimer(timerSeconds)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTimerRunning(!timerRunning)}>
                  {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>

          {isGM && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-1 border-r border-border pr-2">
                {[4, 6, 8, 10, 12, 20].map(d => (
                  <Button key={d} variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => rollDice(d)}>
                    d{d}
                  </Button>
                ))}
                {lastRoll && (
                  <Badge variant="outline" className="ml-1 text-xs">
                    {lastRoll.dice} = <strong>{lastRoll.result}</strong>
                  </Badge>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => nextTurnMutation.mutate()} disabled={nextTurnMutation.isPending}>
                <SkipForward className="mr-1 h-4 w-4" />
                Tour suivant
              </Button>
              <Button variant="outline" size="sm" onClick={autoRollInitiative}>
                <Dices className="mr-1 h-4 w-4" />
                Relancer Init.
              </Button>

              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter un combattant</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {partyCharacters.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Ajout rapide - Personnages</Label>
                          <Button variant="outline" size="sm" onClick={addAllPartyMembers}>
                            <Plus className="mr-1 h-3 w-3" />
                            Ajouter tous
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {partyCharacters.map((char) => (
                            <Button key={char.id} variant="outline" size="sm" onClick={() => {
                              const dexMod = Math.floor(((char as any).dexterity - 10) / 2);
                              addParticipantMutation.mutate({
                                name: char.name,
                                initiative: Math.floor(Math.random() * 20) + 1 + dexMod,
                                current_hp: char.hp,
                                max_hp: char.max_hp,
                                armor_class: char.armor_class,
                                is_player: true,
                              });
                            }}>
                              <User className="mr-1 h-3 w-3" />
                              {char.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Ajout rapide - Monstres</Label>
                      <ScrollArea className="h-32">
                        <div className="flex flex-wrap gap-2">
                          {monsters.slice(0, 20).map((monster) => (
                            <Button key={monster.id} variant="outline" size="sm" onClick={() => addMonster(monster)}>
                              <Skull className="mr-1 h-3 w-3" />
                              {monster.name}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="border-t pt-4 grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Nom</Label>
                        <Input
                          value={newParticipant.name}
                          onChange={(e) => setNewParticipant(p => ({ ...p, name: e.target.value }))}
                          placeholder="Nom du combattant"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Initiative</Label>
                        <Input
                          type="number"
                          value={newParticipant.initiative}
                          onChange={(e) => setNewParticipant(p => ({ ...p, initiative: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CA</Label>
                        <Input
                          type="number"
                          value={newParticipant.armor_class}
                          onChange={(e) => setNewParticipant(p => ({ ...p, armor_class: parseInt(e.target.value) || 10 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PV actuels</Label>
                        <Input
                          type="number"
                          value={newParticipant.current_hp}
                          onChange={(e) => setNewParticipant(p => ({ ...p, current_hp: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PV max</Label>
                        <Input
                          type="number"
                          value={newParticipant.max_hp}
                          onChange={(e) => setNewParticipant(p => ({ ...p, max_hp: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Label>Type:</Label>
                        <Button
                          variant={newParticipant.is_player ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewParticipant(p => ({ ...p, is_player: true }))}
                        >
                          <User className="mr-1 h-3 w-3" /> Joueur
                        </Button>
                        <Button
                          variant={!newParticipant.is_player ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewParticipant(p => ({ ...p, is_player: false }))}
                        >
                          <Skull className="mr-1 h-3 w-3" /> Monstre
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>Annuler</Button>
                    <Button onClick={() => addParticipantMutation.mutate(newParticipant)} disabled={addParticipantMutation.isPending}>
                      Ajouter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="destructive" size="sm" onClick={() => endEncounterMutation.mutate()} disabled={endEncounterMutation.isPending}>
                Terminer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Initiative Tracker */}
      <div className="grid gap-3">
        {participants.map((p, idx) => {
          const isCurrent = idx === encounter.current_turn;
          const hpPercent = p.max_hp > 0 ? (p.current_hp / p.max_hp) * 100 : 0;
          const isDead = p.current_hp <= 0;
          const isBloody = hpPercent <= 50 && hpPercent > 0;

          return (
            <Card
              key={p.id}
              className={`bg-gradient-card border-border transition-all ${
                isCurrent ? "ring-2 ring-primary shadow-lg" : ""
              } ${isDead ? "opacity-50" : ""}`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold text-lg ${
                  isCurrent ? "bg-primary/30 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {p.initiative}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {p.is_player ? (
                      <User className="h-4 w-4 text-primary" />
                    ) : (
                      <Skull className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-semibold text-foreground truncate">{p.name}</span>
                    {isCurrent && <Badge variant="default">En cours</Badge>}
                    {isDead && <Badge variant="destructive">Mort</Badge>}
                    {isBloody && !isDead && (
                      <Badge variant="outline" className="text-orange-400 border-orange-400/30 text-xs">Blessé</Badge>
                    )}
                  </div>

                  {p.conditions && p.conditions.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.conditions.map(c => (
                        <Badge key={c} variant="outline" className={`text-xs ${
                          c === "Concentration"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : "bg-destructive/10 text-destructive border-destructive/30"
                        }`}>
                          <Zap className="mr-1 h-2 w-2" />{c}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <Progress
                        value={hpPercent}
                        className={`h-3 ${isDead ? "[&>div]:bg-destructive" : isBloody ? "[&>div]:bg-orange-500" : ""}`}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right">
                      <Heart className="h-3 w-3 inline mr-1 text-destructive" />
                      {p.current_hp}/{p.max_hp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    {p.armor_class}
                  </div>
                </div>

                {isGM && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => updateParticipantMutation.mutate({ id: p.id, current_hp: Math.max(0, p.current_hp - 1) })}
                      title="-1 PV"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:text-green-300"
                      onClick={() => updateParticipantMutation.mutate({ id: p.id, current_hp: Math.min(p.max_hp, p.current_hp + 1) })}
                      title="+1 PV"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => { setHpDialogOpen(p.id); setHpAmount(""); setHpMode("damage"); }}
                      title="Dégâts/Soins"
                    >
                      <Target className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => setConditionsOpenFor(conditionsOpenFor === p.id ? null : p.id)}
                      title="Conditions"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeParticipantMutation.mutate(p.id)}
                      title="Retirer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>

              {conditionsOpenFor === p.id && isGM && (
                <div className="border-t border-border px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Conditions / Effets</p>
                  <div className="flex flex-wrap gap-1">
                    {CONDITIONS.map(condition => {
                      const active = (p.conditions || []).includes(condition);
                      return (
                        <Button
                          key={condition}
                          variant={active ? "default" : "outline"}
                          size="sm"
                          className={`h-7 text-xs ${
                            active
                              ? condition === "Concentration"
                                ? "bg-purple-600 hover:bg-purple-700"
                                : "bg-destructive hover:bg-destructive/80"
                              : ""
                          }`}
                          onClick={() => {
                            const newConditions = (p.conditions || []).includes(condition)
                              ? (p.conditions || []).filter(c => c !== condition)
                              : [...(p.conditions || []), condition];
                            updateParticipantMutation.mutate({ id: p.id, conditions: newConditions });
                          }}
                        >
                          {condition}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card/50">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <ScrollText className="h-4 w-4 text-amber-400" />
          <span className="font-display text-xs font-semibold text-foreground">
            Historique du combat
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {combatLogs.length} actions
          </span>
          {combatLogs.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
              onClick={() => setCombatLogs([])}>
              Effacer
            </Button>
          )}
        </div>
        <ScrollArea className="h-40">
          <div className="space-y-1 p-2">
            {combatLogs.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Aucune action enregistrée
              </p>
            ) : (
              combatLogs.map(log => (
                <div key={log.id}
                  className="flex items-start gap-2 rounded-lg bg-muted/30 px-2 py-1.5 text-xs">
                  <span className="shrink-0 rounded bg-amber-500/15 px-1 py-0.5 text-[10px] font-bold text-amber-400">
                    R{log.round}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">{log.actorName}</span>
                    <span className="text-muted-foreground"> — {log.action}</span>
                    {log.result && (
                      <span className="ml-1 text-amber-400/70">{log.result}</span>
                    )}
                  </div>
                  <span className="shrink-0 text-[9px] text-muted-foreground">
                    {log.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>


      {/* Damage/Heal Dialog */}
      <Dialog open={!!hpDialogOpen} onOpenChange={(o) => !o && setHpDialogOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {hpMode === "damage" ? "💥 Infliger des dégâts" : "💚 Soigner"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={hpMode === "damage" ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => setHpMode("damage")}
              >
                <Flame className="mr-2 h-4 w-4" />
                Dégâts
              </Button>
              <Button
                variant={hpMode === "heal" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setHpMode("heal")}
              >
                <Heart className="mr-2 h-4 w-4" />
                Soins
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Montant</Label>
              <Input
                type="number"
                value={hpAmount}
                onChange={(e) => setHpAmount(e.target.value)}
                placeholder="Entrez le montant..."
                className="text-center text-2xl font-bold h-14"
                min="0"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && hpDialogOpen && applyHpChange(hpDialogOpen)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 5, 10, 15, 20, 25, 50].map(n => (
                <Button key={n} variant="outline" size="sm" onClick={() => setHpAmount(n.toString())}>
                  {n}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHpDialogOpen(null)}>Annuler</Button>
            <Button
              variant={hpMode === "damage" ? "destructive" : "default"}
              onClick={() => hpDialogOpen && applyHpChange(hpDialogOpen)}
            >
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};

export default CampaignCombat;
