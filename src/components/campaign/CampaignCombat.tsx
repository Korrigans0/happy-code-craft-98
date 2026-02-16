import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, Swords, Shield, Heart, Zap, Play, Pause, 
  SkipForward, RotateCcw, Trash2, ChevronUp, ChevronDown,
  Skull, User, Timer, Target, Flame, Snowflake, Dices
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Monster = Tables<"monsters">;
type Character = Tables<"characters">;

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
    name: "",
    initiative: 10,
    current_hp: 10,
    max_hp: 10,
    armor_class: 10,
    is_player: true,
  });

  // Combat timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
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

  // Fetch active encounter
  const { data: encounter } = useQuery({
    queryKey: ["combatEncounter", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("combat_encounters")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch participants
  const { data: participants = [] } = useQuery({
    queryKey: ["combatParticipants", encounter?.id],
    queryFn: async () => {
      if (!encounter) return [];
      const { data, error } = await supabase
        .from("combat_participants")
        .select("*")
        .eq("encounter_id", encounter.id)
        .order("initiative", { ascending: false });
      if (error) throw error;
      return data as Participant[];
    },
    enabled: !!encounter,
  });

  // Fetch monsters for quick add
  const { data: monsters = [] } = useQuery({
    queryKey: ["monstersForCombat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("monsters")
        .select("id, name, hit_points, armor_class")
        .order("name")
        .limit(50);
      return data || [];
    },
    enabled: isGM,
  });

  // Fetch party characters
  const { data: partyCharacters = [] } = useQuery({
    queryKey: ["partyCharacters", campaignId],
    queryFn: async () => {
      const { data: members } = await supabase
        .from("campaign_members")
        .select("character_id")
        .eq("campaign_id", campaignId)
        .not("character_id", "is", null);
      
      if (!members || members.length === 0) return [];
      
      const characterIds = members.map(m => m.character_id).filter(Boolean);
      const { data } = await supabase
        .from("characters")
        .select("id, name, hp, max_hp, armor_class, dexterity, initiative")
        .in("id", characterIds);
      
      return data || [];
    },
  });

  // Create encounter
  const createEncounterMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("combat_encounters")
        .insert({ campaign_id: campaignId, name: name || "Combat" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combatEncounter", campaignId] });
      setTimerSeconds(0);
      setTimerRunning(true);
      toast({ title: "Combat créé !" });
    },
  });

  // End encounter
  const endEncounterMutation = useMutation({
    mutationFn: async () => {
      if (!encounter) return;
      const { error } = await supabase
        .from("combat_encounters")
        .update({ is_active: false })
        .eq("id", encounter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combatEncounter", campaignId] });
      setTimerRunning(false);
      toast({ title: "Combat terminé" });
    },
  });

  // Add participant
  const addParticipantMutation = useMutation({
    mutationFn: async (data: typeof newParticipant) => {
      if (!encounter) return;
      const { error } = await supabase.from("combat_participants").insert({
        encounter_id: encounter.id,
        name: data.name,
        initiative: data.initiative,
        current_hp: data.current_hp,
        max_hp: data.max_hp,
        armor_class: data.armor_class,
        is_player: data.is_player,
        turn_order: participants.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combatParticipants", encounter?.id] });
      setIsAddOpen(false);
      setNewParticipant({ name: "", initiative: 10, current_hp: 10, max_hp: 10, armor_class: 10, is_player: true });
    },
  });

  // Update participant HP
  const updateHPMutation = useMutation({
    mutationFn: async ({ id, hp }: { id: string; hp: number }) => {
      const { error } = await supabase
        .from("combat_participants")
        .update({ current_hp: Math.max(0, hp) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combatParticipants", encounter?.id] });
    },
  });

  // Remove participant
  const removeParticipantMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("combat_participants")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combatParticipants", encounter?.id] });
    },
  });

  // Toggle condition on participant
  const toggleConditionMutation = useMutation({
    mutationFn: async ({ id, condition, current }: { id: string; condition: string; current: string[] }) => {
      const newConditions = current.includes(condition)
        ? current.filter(c => c !== condition)
        : [...current, condition];
      const { error } = await supabase
        .from("combat_participants")
        .update({ conditions: newConditions })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combatParticipants", encounter?.id] });
    },
  });

  // Quick dice roll
  const [lastRoll, setLastRoll] = useState<{ dice: string; result: number } | null>(null);
  const rollDice = (sides: number, count: number = 1, modifier: number = 0) => {
    let total = modifier;
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      results.push(r);
      total += r;
    }
    const dice = `${count}d${sides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? modifier : ''}`;
    setLastRoll({ dice, result: total });
    
    // Special messages for nat 20 / nat 1
    if (sides === 20 && count === 1) {
      if (results[0] === 20) {
        toast({ title: `🎲 CRITIQUE ! ${dice} = ${total} 🎉` });
        return;
      }
      if (results[0] === 1) {
        toast({ title: `🎲 ÉCHEC CRITIQUE ! ${dice} = ${total} 💀` });
        return;
      }
    }
    toast({ title: `🎲 ${dice} = ${total} [${results.join(", ")}]` });
  };

  const [conditionsOpenFor, setConditionsOpenFor] = useState<string | null>(null);
  const [encounterName, setEncounterName] = useState("Combat");

  // Next turn
  const nextTurnMutation = useMutation({
    mutationFn: async () => {
      if (!encounter || participants.length === 0) return;
      const nextTurn = (encounter.current_turn + 1) % participants.length;
      const newRound = nextTurn === 0 ? encounter.round + 1 : encounter.round;
      
      const { error } = await supabase
        .from("combat_encounters")
        .update({ current_turn: nextTurn, round: newRound })
        .eq("id", encounter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combatEncounter", campaignId] });
    },
  });

  // Auto-roll initiative for all participants
  const autoRollInitiative = async () => {
    if (!encounter) return;
    const updates = participants.map(p => {
      const roll = Math.floor(Math.random() * 20) + 1;
      return { id: p.id, initiative: roll };
    });
    
    for (const u of updates) {
      await supabase
        .from("combat_participants")
        .update({ initiative: u.initiative })
        .eq("id", u.id);
    }
    queryClient.invalidateQueries({ queryKey: ["combatParticipants", encounter.id] });
    toast({ title: "Initiative relancée pour tous !" });
  };

  // Add all party members at once
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

  const applyHpChange = (participantId: string) => {
    const amount = parseInt(hpAmount);
    if (isNaN(amount) || amount <= 0) return;
    const p = participants.find(p => p.id === participantId);
    if (!p) return;
    
    const newHp = hpMode === "damage" 
      ? Math.max(0, p.current_hp - amount) 
      : Math.min(p.max_hp, p.current_hp + amount);
    
    updateHPMutation.mutate({ id: participantId, hp: newHp });
    setHpDialogOpen(null);
    setHpAmount("");
    
    if (hpMode === "damage") {
      toast({ title: `💥 ${p.name} reçoit ${amount} dégâts (${newHp} PV)` });
    } else {
      toast({ title: `💚 ${p.name} récupère ${amount} PV (${newHp} PV)` });
    }
  };

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
            <Button variant="gold" onClick={() => createEncounterMutation.mutate(encounterName)}>
              <Swords className="mr-2 h-4 w-4" />
              Commencer un combat
            </Button>
          </div>
        )}
      </div>
    );
  }

  const currentParticipant = participants[encounter.current_turn];

  // Compute total monsters / players alive
  const playersAlive = participants.filter(p => p.is_player && p.current_hp > 0).length;
  const monstersAlive = participants.filter(p => !p.is_player && p.current_hp > 0).length;

  return (
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
            
            {/* Stats */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-blue-400 flex items-center gap-1">
                <User className="h-3 w-3" /> {playersAlive}
              </span>
              <span className="text-red-400 flex items-center gap-1">
                <Skull className="h-3 w-3" /> {monstersAlive}
              </span>
              {/* Timer */}
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
              {/* Quick Dice Roller */}
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
              
              <Button variant="outline" size="sm" onClick={() => nextTurnMutation.mutate()}>
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
                    {/* Quick Add All Party */}
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
                            <Button key={monster.id} variant="outline" size="sm" onClick={() => addMonster(monster as Monster)}>
                              <Skull className="mr-1 h-3 w-3" />
                              {monster.name}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Manual Add */}
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
                    <Button onClick={() => addParticipantMutation.mutate(newParticipant)}>Ajouter</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="destructive" size="sm" onClick={() => endEncounterMutation.mutate()}>
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
                {/* Initiative */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold text-lg ${
                  isCurrent ? "bg-primary/30 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {p.initiative}
                </div>

                {/* Info */}
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

                  {/* Conditions */}
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
                  
                  {/* HP Bar */}
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

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    {p.armor_class}
                  </div>
                </div>

                {/* HP Controls */}
                {isGM && (
                  <div className="flex items-center gap-1">
                    {/* Quick +/- 1 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => updateHPMutation.mutate({ id: p.id, hp: p.current_hp - 1 })}
                      title="-1 PV"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-400 hover:text-green-300"
                      onClick={() => updateHPMutation.mutate({ id: p.id, hp: p.current_hp + 1 })}
                      title="+1 PV"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    {/* Custom damage/heal dialog */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setHpDialogOpen(p.id); setHpAmount(""); setHpMode("damage"); }}
                      title="Dégâts/Soins"
                    >
                      <Target className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setConditionsOpenFor(conditionsOpenFor === p.id ? null : p.id)}
                      title="Conditions"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeParticipantMutation.mutate(p.id)}
                      title="Retirer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
              
              {/* Conditions Panel */}
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
                          onClick={() => toggleConditionMutation.mutate({
                            id: p.id,
                            condition,
                            current: p.conditions || [],
                          })}
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
            {/* Quick amounts */}
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
  );
};

export default CampaignCombat;
