// ============================================================
// TURN ORDER BAR — Aetheria VTT
// Fichier : artifacts/questmaster/src/components/campaign/vtt/TurnOrderBar.tsx
// ============================================================
// Barre d'ordre des tours visible par tous les joueurs
// Affiche : round, tour actuel, chronomètre, liste des participants
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SkipForward, Play, Pause, Skull, User,
  ChevronLeft, ChevronRight, Timer, Swords,
  Crown, RotateCcw
} from "lucide-react";

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

interface TurnOrderBarProps {
  participants: Participant[];
  currentTurn: number;
  round: number;
  isActive: boolean;
  isGM: boolean;
  campaignSystem?: string;
  onNextTurn: () => void;
  onPrevTurn?: () => void;
  onEndCombat?: () => void;
}

// Condition → couleur
const CONDITION_COLORS: Record<string, string> = {
  "Brûlure": "#ef4444",
  "Saignement": "#dc2626",
  "Déséquilibre": "#f97316",
  "Peur": "#a855f7",
  "Immobilisé": "#6366f1",
  "Corruption": "#7c3aed",
  "Stun": "#eab308",
  "Poison": "#22c55e",
};

// Icône de condition
const ConditionDot = ({ condition }: { condition: string }) => (
  <div
    className="h-2 w-2 rounded-full ring-1 ring-black/20"
    style={{ background: CONDITION_COLORS[condition] || "#94a3b8" }}
    title={condition}
  />
);

// Carte participant dans la barre
const ParticipantChip = ({
  participant,
  isActive,
  isCurrent,
  index,
  initShort,
}: {
  participant: Participant;
  isActive: boolean;
  isCurrent: boolean;
  index: number;
  initShort: string;
}) => {
  const isDead = participant.current_hp <= 0;
  const hpPct = Math.max(0, Math.min(100, (participant.current_hp / participant.max_hp) * 100));
  const hpColor = hpPct > 50 ? "#22c55e" : hpPct > 25 ? "#f97316" : "#ef4444";

  return (
    <div
      className={`relative flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-2 transition-all duration-300 ${
        isCurrent
          ? "scale-105 shadow-lg"
          : isDead
          ? "opacity-40 grayscale"
          : "opacity-70 hover:opacity-90"
      }`}
      style={{
        minWidth: "80px",
        borderColor: isCurrent
          ? participant.is_player
            ? "hsl(43,75%,50%)"
            : "#ef4444"
          : "hsl(var(--border))",
        background: isCurrent
          ? participant.is_player
            ? "hsl(43,75%,50%,0.15)"
            : "rgba(239,68,68,0.15)"
          : "hsl(var(--card))",
        boxShadow: isCurrent
          ? `0 0 16px ${participant.is_player ? "hsl(43,75%,50%,0.4)" : "rgba(239,68,68,0.4)"}`
          : undefined,
      }}
    >
      {/* Numéro d'ordre */}
      <div
        className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          background: isCurrent
            ? participant.is_player ? "hsl(43,75%,50%)" : "#ef4444"
            : "hsl(var(--muted))",
          color: isCurrent ? "#1a1a1a" : "hsl(var(--muted-foreground))",
        }}
      >
        {index + 1}
      </div>

      {/* Icône */}
      <div className="flex items-center justify-center">
        {isDead ? (
          <Skull className="h-5 w-5 text-red-500" />
        ) : participant.is_player ? (
          <User className={`h-5 w-5 ${isCurrent ? "text-amber-400" : "text-slate-400"}`} />
        ) : (
          <Swords className={`h-5 w-5 ${isCurrent ? "text-red-400" : "text-slate-500"}`} />
        )}
      </div>

      {/* Nom */}
      <span
        className="max-w-[72px] truncate text-center text-[11px] font-semibold"
        style={{ color: isCurrent ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
      >
        {participant.name}
      </span>

      {/* Initiative / Épreuve */}
      <span className="text-[10px] text-muted-foreground">
        {initShort}: <strong>{participant.initiative}</strong>
      </span>

      {/* Barre HP */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${hpPct}%`, background: hpColor }}
        />
      </div>
      <span className="text-[9px] text-muted-foreground">
        {participant.current_hp}/{participant.max_hp}
      </span>

      {/* Conditions */}
      {participant.conditions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5">
          {participant.conditions.slice(0, 3).map(c => (
            <ConditionDot key={c} condition={c} />
          ))}
          {participant.conditions.length > 3 && (
            <span className="text-[9px] text-muted-foreground">+{participant.conditions.length - 3}</span>
          )}
        </div>
      )}

      {/* Indicateur tour actuel */}
      {isCurrent && (
        <div
          className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full animate-pulse"
          style={{ background: participant.is_player ? "hsl(43,75%,50%)" : "#ef4444" }}
        />
      )}
    </div>
  );
};

export default function TurnOrderBar({
  participants,
  currentTurn,
  round,
  isActive,
  isGM,
  onNextTurn,
  onPrevTurn,
  onEndCombat,
}: TurnOrderBarProps) {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Reset chrono à chaque changement de tour
  useEffect(() => {
    setTimerSeconds(0);
    if (isActive && participants.length > 0) {
      setTimerRunning(true);
    }
  }, [currentTurn, isActive]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const sorted = [...participants].sort((a, b) => b.initiative - a.initiative);
  const currentParticipant = sorted[currentTurn];
  const timerWarning = timerSeconds >= 90;
  const timerDanger = timerSeconds >= 120;

  if (!isActive || participants.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{
        background: "linear-gradient(180deg, hsl(215,68%,10%) 0%, hsl(215,65%,8%) 100%)",
        borderColor: "hsl(43,75%,50%,0.25)",
        boxShadow: "0 4px 24px hsl(0,0%,0%,0.5), inset 0 1px 0 hsl(43,75%,50%,0.1)",
      }}
    >
      {/* ── Header barre ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-white/5">
        {/* Round + tour actuel */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-display text-xs font-bold text-amber-400">
              Round {round}
            </span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          {currentParticipant && (
            <span className="text-xs text-slate-300">
              Tour de{" "}
              <span
                className="font-semibold"
                style={{ color: currentParticipant.is_player ? "hsl(43,75%,60%)" : "#f87171" }}
              >
                {currentParticipant.name}
              </span>
            </span>
          )}
        </div>

        {/* Chronomètre */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-sm font-bold transition-colors ${
              timerDanger
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : timerWarning
                ? "bg-orange-500/15 text-orange-400"
                : "bg-white/5 text-slate-300"
            }`}
          >
            <Timer className="h-3.5 w-3.5" />
            {formatTimer(timerSeconds)}
          </div>

          {/* Contrôles */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-200"
              onClick={() => setTimerRunning(r => !r)}
              title={timerRunning ? "Pause chrono" : "Reprendre chrono"}
            >
              {timerRunning
                ? <Pause className="h-3.5 w-3.5" />
                : <Play className="h-3.5 w-3.5" />
              }
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-200"
              onClick={() => setTimerSeconds(0)}
              title="Reset chrono"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Actions MJ */}
        <div className="flex items-center gap-2">
          {onPrevTurn && isGM && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-200"
              onClick={onPrevTurn}
              title="Tour précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {isGM && (
            <Button
              size="sm"
              className="h-7 gap-1.5 px-3 text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, hsl(43,75%,50%) 0%, hsl(35,85%,40%) 100%)",
                color: "#1a1a1a",
              }}
              onClick={onNextTurn}
            >
              <SkipForward className="h-3.5 w-3.5" />
              Tour suivant
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-slate-300"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Afficher" : "Réduire"}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : "rotate-90"}`}
            />
          </Button>
        </div>
      </div>

      {/* ── Liste des participants ─────────────────────────── */}
      {!collapsed && (
        <div className="overflow-x-auto px-4 py-3">
          <div className="flex items-start gap-2" style={{ minWidth: "max-content" }}>
            {sorted.map((p, i) => (
              <ParticipantChip
                key={p.id}
                participant={p}
                isActive={isActive}
                isCurrent={i === currentTurn}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {/* Barre de progression du round */}
      {!collapsed && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((currentTurn + 1) / Math.max(sorted.length, 1)) * 100}%`,
                  background: "linear-gradient(90deg, hsl(43,75%,50%) 0%, hsl(35,85%,40%) 100%)",
                }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {currentTurn + 1}/{sorted.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
