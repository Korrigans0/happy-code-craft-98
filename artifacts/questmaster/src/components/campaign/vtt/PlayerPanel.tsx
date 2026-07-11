import { ScrollArea } from "@/components/ui/scroll-area";
import { Swords, ChevronRight, X } from "lucide-react";
import { TokenItem, InitiativeEntry, CONDITIONS } from "./types";

interface PlayerPanelProps {
  tokens: TokenItem[];
  initiative: InitiativeEntry[];
  initiativeRound: number;
  initiativeActiveIdx: number;
  campaignSystem?: string;
  onClose: () => void;
}

export default function PlayerPanel({
  tokens,
  initiative,
  initiativeRound,
  initiativeActiveIdx,
  campaignSystem = "Aetheria",
  onClose,
}: PlayerPanelProps) {
  const isGlyphes = campaignSystem === "Glyphes";
  const initTerm = isGlyphes ? "Épreuve" : "Initiative";
  const sortedInit = [...initiative].sort((a, b) => b.initiative - a.initiative);

  return (
    <aside
      className="flex h-full w-72 shrink-0 flex-col border-l border-border bg-card"
      aria-label={`Suivi d'${initTerm.toLowerCase()}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-semibold text-foreground">
            {initTerm}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Fermer le panneau"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Round */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">Round</span>
        <span className="text-base font-bold text-primary">{initiativeRound}</span>
      </div>

      {/* Combatant list (read-only) */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {sortedInit.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Aucun combattant pour le moment.
            </p>
          )}
          {sortedInit.map((entry, idx) => {
            const isActive = idx === initiativeActiveIdx;
            const hpRatio = entry.hp / (entry.maxHp || 1);
            const linkedToken = entry.tokenId
              ? tokens.find((t) => t.id === entry.tokenId)
              : undefined;
            const avatarUrl = linkedToken?.imageUrl;
            const avatarColor = linkedToken?.color || entry.color || "#94a3b8";
            return (
              <div
                key={entry.id}
                className={`rounded-lg border p-2 transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-gold"
                    : "border-border bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Avatar */}
                  <div
                    className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border/60"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {avatarUrl && (
                      <img
                        src={avatarUrl}
                        alt={entry.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  {/* Initiative value */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {entry.initiative}
                  </div>
                  {/* Name + conditions */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      {isActive && (
                        <ChevronRight className="h-3 w-3 shrink-0 text-primary" />
                      )}
                      <span className="truncate text-sm font-medium">
                        {entry.name}
                      </span>
                    </div>
                    {entry.conditions.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {entry.conditions.map((c) => {
                          const cond = CONDITIONS.find((x) => x.id === c);
                          return cond ? (
                            <span
                              key={c}
                              title={cond.label}
                              className="text-xs"
                            >
                              {cond.emoji}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  {/* HP read-only */}
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      hpRatio > 0.5
                        ? "text-green-400"
                        : hpRatio > 0.25
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {entry.hp}/{entry.maxHp}
                  </span>
                </div>
                {/* HP bar */}
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(100, hpRatio * 100))}%`,
                      backgroundColor:
                        hpRatio > 0.5
                          ? "#22c55e"
                          : hpRatio > 0.25
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
