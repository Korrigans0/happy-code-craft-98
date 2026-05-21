import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  MessageSquare, Swords, Users, Skull, BookOpen,
  Send, Dices, Plus, Trash2, ChevronRight, ChevronDown,
  Crown, Heart, Shield, Eye, EyeOff, Search, X, SkipForward,
  RotateCcw, PanelRight, MousePointerClick, ListPlus,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { campaignsApi } from "@/lib/api";
import { TokenItem, InitiativeEntry, CONDITIONS, rollDice } from "./types";

interface WACreature { id: string; name: string; power_level?: string; size?: string; constitution?: number; dexterity?: number; }
interface AetheriaCreature {
  id: string;
  name: string;
  size?: string;
  pv_max: number;
  def_physique: number;
  def_magique: number;
  attaque?: string;
  degats?: string;
  campaign_id?: string;
}
interface PlayerChar { id: string; name: string; level?: number; race?: string; class?: string; hp?: number; max_hp?: number; armor_class?: number; avatar_url?: string; }

interface GMPanelProps {
  campaignId: string;
  isGM: boolean;
  currentUserId: string;
  userName: string;
  tokens: TokenItem[];
  selectedTokenId?: string | null;
  waCreatures: WACreature[];
  aetheriaCreatures: AetheriaCreature[];
  userCharacters: PlayerChar[];
  initiative: InitiativeEntry[];
  initiativeRound: number;
  initiativeActiveIdx: number;
  onUpdateTokenHp: (tokenId: string, delta: number) => void;
  onSelectToken: (tokenId: string) => void;
  onSpawnCreature: (creature: WACreature) => void;
  onSpawnAetheriaCreature: (creature: AetheriaCreature) => void;
  onSpawnCharacter: (char: PlayerChar) => void;
  onAddToInitiative: (entry: Omit<InitiativeEntry, "id">) => void;
  onAddSelectedTokenToInitiative?: () => void;
  onAddAllTokensToInitiative?: () => void;
  onAutoRollAllInitiative?: () => void;
  onUpdateInitiativeValue?: (id: string, value: number) => void;
  onReorderInitiative?: (id: string, dir: "up" | "down") => void;
  onRemoveFromInitiative: (id: string) => void;
  onUpdateInitiativeHp: (id: string, delta: number) => void;
  onAddConditionToInitiative: (id: string, cond: string) => void;
  onRemoveConditionFromInitiative: (id: string, cond: string) => void;
  onNextTurn: () => void;
  onResetInitiative: () => void;
  onClose: () => void;
}

type Tab = "chat" | "initiative" | "tokens" | "bestiary" | "notes";

const TAB_ITEMS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: "chat",       icon: <MessageSquare className="h-4 w-4" />, label: "Chat" },
  { id: "initiative", icon: <Swords className="h-4 w-4" />,        label: "Initiative" },
  { id: "tokens",     icon: <Users className="h-4 w-4" />,         label: "Jetons" },
  { id: "bestiary",   icon: <Skull className="h-4 w-4" />,         label: "Bestiaire" },
  { id: "notes",      icon: <BookOpen className="h-4 w-4" />,      label: "Notes" },
];

function parseRollCommand(input: string): { formula: string; label?: string } | null {
  const m = input.match(/^\/r(?:oll)?\s+([\d]+[dD][\d]+(?:[+-][\d]+)?)\s*(.*)?$/i);
  if (!m) return null;
  return { formula: m[1], label: m[2]?.trim() || undefined };
}

export default function GMPanel({
  campaignId, isGM, currentUserId, userName,
  tokens, selectedTokenId, waCreatures, aetheriaCreatures, userCharacters,
  initiative, initiativeRound, initiativeActiveIdx,
  onUpdateTokenHp, onSelectToken,
  onSpawnCreature, onSpawnAetheriaCreature, onSpawnCharacter,
  onAddToInitiative, onAddSelectedTokenToInitiative, onAddAllTokensToInitiative,
  onAutoRollAllInitiative, onUpdateInitiativeValue, onReorderInitiative,
  onRemoveFromInitiative,
  onUpdateInitiativeHp, onAddConditionToInitiative, onRemoveConditionFromInitiative,
  onNextTurn, onResetInitiative, onClose,
}: GMPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [chatInput, setChatInput] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [bestiarySearch, setBestiarySearch] = useState("");
  const [notes, setNotes] = useState(() => localStorage.getItem(`vtt-notes-${campaignId}`) || "");
  const [addingToInit, setAddingToInit] = useState<{ name: string; roll: string; mod: string; hp: string; type: "player" | "monster" | "npc" }>({ name: "", roll: "", mod: "0", hp: "10", type: "monster" });
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["vtt-chat-messages", campaignId],
    queryFn: () => campaignsApi.getMessages(campaignId),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const saveNotes = (val: string) => {
    setNotes(val);
    localStorage.setItem(`vtt-notes-${campaignId}`, val);
  };

  const sendChatMessage = async (content: string) => {
    if (!content.trim()) return;
    const rollCmd = parseRollCommand(content);
    if (rollCmd) {
      const result = rollDice(rollCmd.formula);
      if (result) {
        const display = [
          `🎲 **${rollCmd.label || "Jet de dés"}** : ${result.formula}`,
          `[ ${result.rolls.join(", ")} ]${result.modifier !== 0 ? ` + (${result.modifier})` : ""}`,
          `**= ${result.total}**`,
          isSecret ? "*(secret)*" : "",
        ].filter(Boolean).join("\n");
        await campaignsApi.postMessage(campaignId, {
          content: display,
          message_type: "roll",
        });
      }
    } else {
      await campaignsApi.postMessage(campaignId, {
        content: content.trim(),
        message_type: "chat",
      });
    }
    setChatInput("");
    qc.invalidateQueries({ queryKey: ["vtt-chat-messages", campaignId] });
  };

  const quickRoll = async (formula: string, label: string) => {
    const result = rollDice(formula);
    if (!result) return;
    const display = [
      `🎲 **${label}** : ${formula}`,
      `[ ${result.rolls.join(", ")} ]${result.modifier !== 0 ? ` + (${result.modifier})` : ""}`,
      `**= ${result.total}**`,
    ].join("\n");
    await campaignsApi.postMessage(campaignId, { content: display, message_type: "roll" });
    qc.invalidateQueries({ queryKey: ["vtt-chat-messages", campaignId] });
  };

  const handleAddToInitiative = () => {
    const roll = parseInt(addingToInit.roll);
    const mod = parseInt(addingToInit.mod) || 0;
    const hp = parseInt(addingToInit.hp) || 10;
    if (!addingToInit.name.trim() || isNaN(roll)) return;
    onAddToInitiative({
      name: addingToInit.name,
      initiative: roll + mod,
      modifier: mod,
      hp,
      maxHp: hp,
      conditions: [],
      type: addingToInit.type,
      color: addingToInit.type === "player" ? "#f59e0b" : addingToInit.type === "monster" ? "#ef4444" : "#22c55e",
    });
    setAddingToInit({ name: "", roll: "", mod: "0", hp: "10", type: "monster" });
  };

  const filteredCreatures = waCreatures.filter(c =>
    c.name.toLowerCase().includes(bestiarySearch.toLowerCase())
  );

  const formatMessage = (msg: any) => {
    const content = msg.content || "";
    return content.split("\n").map((line: string, i: number) => {
      if (line.startsWith("🎲")) return <p key={i} className="text-primary font-medium">{line}</p>;
      if (line.startsWith("**=")) return <p key={i} className="text-2xl font-bold text-yellow-400">{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("[")) return <p key={i} className="text-xs text-muted-foreground font-mono">{line}</p>;
      return <p key={i} className="text-sm">{line.replace(/\*\*/g, "")}</p>;
    });
  };

  const sortedInit = [...initiative].sort((a, b) => b.initiative - a.initiative);

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="font-display text-sm font-semibold text-gradient-gold">
          {isGM ? "Panneau MJ" : "Panneau joueur"}
        </span>
        <button onClick={onClose} className="rounded p-1 hover:bg-muted transition-colors">
          <PanelRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {TAB_ITEMS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── CHAT ─────────────────────────────────────────── */}
        {activeTab === "chat" && (
          <>
            <ScrollArea className="flex-1">
              <div className="space-y-2 p-3">
                {messages.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Pas encore de messages.<br />
                    Tapez <span className="font-mono text-primary">/roll 1d20</span> pour lancer un dé.
                  </p>
                )}
                {messages.map((msg: any) => {
                  const isMe = msg.user_id === currentUserId;
                  const isRoll = msg.message_type === "roll";
                  return (
                    <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] text-muted-foreground">{msg.user_name || "Joueur"}</span>
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 bg-slate-900 text-slate-100 ${
                        isRoll
                          ? "border border-primary/30"
                          : isMe
                          ? "bg-slate-900 text-slate-100"
                          : "bg-muted"
                      }`}>
                        {formatMessage(msg)}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>
            </ScrollArea>

            {/* Quick dice */}
            <div className="flex flex-wrap gap-1 border-t border-border px-2 py-1.5">
              {["1d4", "1d6", "1d8", "1d10", "1d12", "1d20", "1d100", "2d6"].map(f => (
                <button
                  key={f}
                  className="rounded bg-muted/60 px-2 py-0.5 text-[11px] font-mono hover:bg-muted transition-colors"
                  onClick={() => quickRoll(f, f)}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-border p-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSecret(s => !s)}
                  className={`rounded p-1 text-xs transition-colors ${isSecret ? "bg-purple-500/20 text-purple-400" : "text-muted-foreground hover:bg-muted"}`}
                  title="Jet secret (MJ seulement)"
                >
                  {isSecret ? "🔒" : "🎲"}
                </button>
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (sendChatMessage(chatInput), e.preventDefault())}
                  placeholder="/roll 1d20+3 ou message..."
                  className="h-8 flex-1 text-sm"
                />
                <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => sendChatMessage(chatInput)} disabled={!chatInput.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── INITIATIVE ───────────────────────────────────── */}
        {activeTab === "initiative" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Round + controls */}
            <div className="flex items-center gap-2 border-b border-border p-2">
              <div className="flex-1">
                <span className="text-xs text-muted-foreground">Round</span>
                <span className="ml-1.5 text-base font-bold text-primary">{initiativeRound}</span>
              </div>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onNextTurn} disabled={sortedInit.length === 0}>
                <SkipForward className="h-3 w-3" />
                Suivant
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onResetInitiative} title="Réinitialiser">
                <RotateCcw className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>

            {/* Quick add from tokens */}
            {isGM && (onAddSelectedTokenToInitiative || onAddAllTokensToInitiative || onAutoRollAllInitiative) && (
              <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/10 p-2">
                {onAddSelectedTokenToInitiative && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={onAddSelectedTokenToInitiative}
                    disabled={!selectedTokenId}
                    title={selectedTokenId ? "Ajouter le jeton sélectionné à l'initiative" : "Aucun jeton sélectionné"}
                  >
                    <MousePointerClick className="h-3 w-3" />
                    Sélection
                  </Button>
                )}
                {onAddAllTokensToInitiative && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={onAddAllTokensToInitiative}
                    disabled={tokens.length === 0}
                    title="Ajouter tous les jetons du plateau"
                  >
                    <ListPlus className="h-3 w-3" />
                    Tous les jetons
                  </Button>
                )}
                {onAutoRollAllInitiative && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={onAutoRollAllInitiative}
                    disabled={initiative.length === 0}
                    title="Relancer l'initiative pour tous les combattants"
                  >
                    <Dices className="h-3 w-3" />
                    Init auto
                  </Button>
                )}
              </div>
            )}

            {/* Combatant list */}
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {sortedInit.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Aucun combattant.<br />Ajoutez-en ci-dessous.
                  </p>
                )}
                {sortedInit.map((entry, idx) => {
                  const isActive = idx === initiativeActiveIdx;
                  const hpRatio = entry.hp / (entry.maxHp || 1);
                  const linkedToken = entry.tokenId ? tokens.find(t => t.id === entry.tokenId) : undefined;
                  const avatarUrl = linkedToken?.imageUrl;
                  const avatarColor = linkedToken?.color || entry.color || "#94a3b8";
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-lg border p-2 transition-colors ${
                        isActive
                          ? "border-primary bg-primary/10 shadow-gold"
                          : "border-border bg-muted/20 hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Reorder arrows */}
                        {onReorderInitiative && isGM && (
                          <div className="flex flex-col gap-0.5">
                            <button
                              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                              onClick={() => onReorderInitiative(entry.id, "up")}
                              disabled={idx === 0}
                              title="Monter dans l'ordre"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                              onClick={() => onReorderInitiative(entry.id, "down")}
                              disabled={idx === sortedInit.length - 1}
                              title="Descendre dans l'ordre"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {/* Avatar/color */}
                        <div
                          className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border/60 cursor-pointer"
                          style={{ backgroundColor: avatarColor }}
                          onClick={() => entry.tokenId && onSelectToken(entry.tokenId)}
                          title={entry.tokenId ? "Centrer sur le jeton" : ""}
                        >
                          {avatarUrl && (
                            <img src={avatarUrl} alt={entry.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        {/* Initiative value (editable) */}
                        {onUpdateInitiativeValue && isGM ? (
                          <input
                            type="number"
                            value={entry.initiative}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v)) onUpdateInitiativeValue(entry.id, v);
                            }}
                            className={`h-7 w-10 shrink-0 rounded-full border border-border bg-background text-center text-xs font-bold tabular-nums ${
                              isActive ? "ring-2 ring-primary" : ""
                            }`}
                            title="Modifier l'initiative"
                          />
                        ) : (
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}>
                            {entry.initiative}
                          </div>
                        )}
                        {/* Name + type */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            {isActive && <ChevronRight className="h-3 w-3 text-primary shrink-0" />}
                            <span className="text-sm font-medium truncate">{entry.name}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {entry.conditions.map(c => {
                              const cond = CONDITIONS.find(x => x.id === c);
                              return cond ? (
                                <span key={c} title={cond.label} className="text-xs cursor-pointer"
                                  onClick={() => onRemoveConditionFromInitiative(entry.id, c)}>
                                  {cond.emoji}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                        {/* HP */}
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={`text-xs font-bold ${hpRatio > 0.5 ? "text-green-400" : hpRatio > 0.25 ? "text-yellow-400" : "text-red-400"}`}>
                            {entry.hp}/{entry.maxHp}
                          </span>
                          <div className="flex gap-0.5">
                            <button className="rounded bg-destructive/20 px-1 py-0.5 text-[10px] text-destructive hover:bg-destructive/40 transition-colors"
                              onClick={() => onUpdateInitiativeHp(entry.id, -1)}>-1</button>
                            <button className="rounded bg-green-500/20 px-1 py-0.5 text-[10px] text-green-400 hover:bg-green-500/40 transition-colors"
                              onClick={() => onUpdateInitiativeHp(entry.id, 1)}>+1</button>
                          </div>
                        </div>
                        <button onClick={() => onRemoveFromInitiative(entry.id)}
                          className="ml-1 rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                          title="Retirer de l'initiative">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      {/* HP bar */}
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(0, Math.min(100, hpRatio * 100))}%`,
                            backgroundColor: hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                      {/* Condition picker */}
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {CONDITIONS.slice(0, 8).map(cond => (
                          <button
                            key={cond.id}
                            title={cond.label}
                            onClick={() => entry.conditions.includes(cond.id)
                              ? onRemoveConditionFromInitiative(entry.id, cond.id)
                              : onAddConditionToInitiative(entry.id, cond.id)
                            }
                            className={`rounded text-xs px-0.5 transition-colors ${entry.conditions.includes(cond.id) ? "opacity-100" : "opacity-30 hover:opacity-60"}`}
                          >
                            {cond.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Add combatant */}
            <div className="border-t border-border p-2 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ajouter un combattant</p>
              <div className="flex gap-1">
                <Input
                  placeholder="Nom"
                  value={addingToInit.name}
                  onChange={e => setAddingToInit(p => ({ ...p, name: e.target.value }))}
                  className="h-7 flex-1 text-xs"
                />
                <Input
                  placeholder="Init"
                  value={addingToInit.roll}
                  onChange={e => setAddingToInit(p => ({ ...p, roll: e.target.value }))}
                  className="h-7 w-14 text-xs"
                  type="number"
                />
                <Input
                  placeholder="Mod"
                  value={addingToInit.mod}
                  onChange={e => setAddingToInit(p => ({ ...p, mod: e.target.value }))}
                  className="h-7 w-12 text-xs"
                  type="number"
                />
              </div>
              <div className="flex gap-1">
                <Input
                  placeholder="PV max"
                  value={addingToInit.hp}
                  onChange={e => setAddingToInit(p => ({ ...p, hp: e.target.value }))}
                  className="h-7 flex-1 text-xs"
                  type="number"
                />
                <select
                  value={addingToInit.type}
                  onChange={e => setAddingToInit(p => ({ ...p, type: e.target.value as "player" | "monster" | "npc" }))}
                  className="h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="player">Joueur</option>
                  <option value="monster">Monstre</option>
                  <option value="npc">PNJ</option>
                </select>
                <Button
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleAddToInitiative}
                  disabled={!addingToInit.name.trim() || !addingToInit.roll}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {/* Add from tokens */}
              {tokens.filter(t => t.hp !== undefined).length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">Depuis les jetons :</p>
                  <div className="flex flex-wrap gap-1">
                    {tokens.filter(t => t.hp !== undefined).map(t => (
                      <button
                        key={t.id}
                        className="flex items-center gap-1 rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] hover:bg-muted/60 transition-colors"
                        onClick={() => onAddToInitiative({
                          name: t.name,
                          initiative: Math.floor(Math.random() * 20) + 1,
                          modifier: 0,
                          hp: t.hp!,
                          maxHp: t.maxHp!,
                          ac: t.ac,
                          conditions: t.conditions || [],
                          tokenId: t.id,
                          type: t.creatureType === "character" ? "player" : "monster",
                          color: t.color,
                        })}
                      >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── JETONS ───────────────────────────────────────── */}
        {activeTab === "tokens" && (
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {tokens.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">Aucun jeton sur la carte.</p>
              )}
              {tokens.map(token => {
                const hpRatio = token.hp !== undefined ? token.hp / (token.maxHp || 1) : 1;
                return (
                  <div
                    key={token.id}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2 hover:border-border/80 transition-colors cursor-pointer"
                    onClick={() => onSelectToken(token.id)}
                  >
                    <div className="h-7 w-7 shrink-0 rounded-full border-2 border-transparent" style={{ backgroundColor: token.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{token.name}</p>
                      {token.hp !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(0, Math.min(100, hpRatio * 100))}%`,
                                backgroundColor: hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#f59e0b" : "#ef4444",
                              }}
                            />
                          </div>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{token.hp}/{token.maxHp}</span>
                        </div>
                      )}
                    </div>
                    {token.conditions && token.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {token.conditions.slice(0, 3).map(c => {
                          const cond = CONDITIONS.find(x => x.id === c);
                          return cond ? <span key={c} className="text-xs">{cond.emoji}</span> : null;
                        })}
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <button className="rounded bg-destructive/20 px-1 py-0.5 text-[10px] text-destructive hover:bg-destructive/40 transition-colors"
                        onClick={e => { e.stopPropagation(); onUpdateTokenHp(token.id, -1); }}>-1</button>
                      <button className="rounded bg-green-500/20 px-1 py-0.5 text-[10px] text-green-400 hover:bg-green-500/40 transition-colors"
                        onClick={e => { e.stopPropagation(); onUpdateTokenHp(token.id, 1); }}>+1</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* ── BESTIAIRE ────────────────────────────────────── */}
        {activeTab === "bestiary" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={bestiarySearch}
                  onChange={e => setBestiarySearch(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-1 px-2 pb-2">
                {/* Characters first */}
                {userCharacters.length > 0 && (
                  <>
                    <p className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Personnages</p>
                    {userCharacters.map(char => (
                      <div key={char.id} className="group flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2 hover:border-primary/30 hover:bg-muted/40 transition-colors">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                          {char.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{char.name}</p>
                          <p className="text-[10px] text-muted-foreground">Niv {char.level} • PV {char.hp}/{char.max_hp}</p>
                        </div>
                        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onSpawnCharacter(char)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {filteredCreatures.length > 0 && <Separator className="my-1" />}
                  </>
                )}
                {/* Creatures */}
                {filteredCreatures.length > 0 && (
                  <>
                    <p className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Créatures WA</p>
                    {filteredCreatures.map(creature => (
                      <div key={creature.id} className="group flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2 hover:border-primary/30 hover:bg-muted/40 transition-colors">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
                          <Skull className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{creature.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{creature.power_level} • {creature.size}</p>
                        </div>
                        {isGM && (
                          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onSpawnCreature(creature)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </>
                )}
                {filteredCreatures.length === 0 && userCharacters.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">Aucune créature trouvée</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* ── NOTES ────────────────────────────────────────── */}
        {activeTab === "notes" && (
          <div className="flex flex-1 flex-col p-2">
            <p className="mb-1.5 text-[10px] text-muted-foreground">Notes de session (sauvegarde locale)</p>
            <textarea
              className="flex-1 resize-none rounded-md border border-border bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Notes de session, PNJ rencontrés, secrets, etc."
              value={notes}
              onChange={e => saveNotes(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
