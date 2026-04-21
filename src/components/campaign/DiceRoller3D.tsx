import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dices, X, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type DieType = 4 | 6 | 8 | 10 | 12 | 20 | 100;

interface RolledDie {
  id: string;
  type: DieType;
  value: number;
  rolling: boolean;
  // Random end position on the table (% from center)
  tx: number;
  ty: number;
  tr: number;
}

const DIE_TYPES: DieType[] = [4, 6, 8, 10, 12, 20, 100];

const DIE_COLORS: Record<DieType, string> = {
  4: "from-red-700 to-red-900",
  6: "from-amber-600 to-amber-800",
  8: "from-emerald-700 to-emerald-900",
  10: "from-sky-700 to-sky-900",
  12: "from-violet-700 to-violet-900",
  20: "from-yellow-500 to-amber-700",
  100: "from-pink-700 to-pink-900",
};

interface DiceRoller3DProps {
  open: boolean;
  onClose: () => void;
}

const DiceRoller3D = ({ open, onClose }: DiceRoller3DProps) => {
  const [counts, setCounts] = useState<Record<DieType, number>>({
    4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 1, 100: 0,
  });
  const [modifier, setModifier] = useState(0);
  const [rolledDice, setRolledDice] = useState<RolledDie[]>([]);
  const [history, setHistory] = useState<{ formula: string; total: number; details: string }[]>([]);

  const updateCount = (type: DieType, delta: number) => {
    setCounts(prev => ({ ...prev, [type]: Math.max(0, Math.min(20, prev[type] + delta)) }));
  };

  const totalDice = Object.values(counts).reduce((a, b) => a + b, 0);

  const rollAll = () => {
    if (totalDice === 0) return;
    const newDice: RolledDie[] = [];
    for (const t of DIE_TYPES) {
      for (let i = 0; i < counts[t]; i++) {
        newDice.push({
          id: crypto.randomUUID(),
          type: t,
          value: Math.floor(Math.random() * t) + 1,
          rolling: true,
          tx: (Math.random() - 0.5) * 280,
          ty: (Math.random() - 0.5) * 180,
          tr: Math.random() * 720 - 360,
        });
      }
    }
    setRolledDice(newDice);

    // Stop rolling animation
    setTimeout(() => {
      setRolledDice(prev => prev.map(d => ({ ...d, rolling: false })));
      const total = newDice.reduce((s, d) => s + d.value, 0) + modifier;
      const formulaParts: string[] = [];
      for (const t of DIE_TYPES) if (counts[t] > 0) formulaParts.push(`${counts[t]}d${t}`);
      const formula = formulaParts.join(" + ") + (modifier ? ` ${modifier > 0 ? "+" : ""}${modifier}` : "");
      const details = newDice.map(d => `d${d.type}:${d.value}`).join(", ");
      setHistory(prev => [{ formula, total, details }, ...prev].slice(0, 10));
    }, 1400);
  };

  const quickRoll = (type: DieType) => {
    const value = Math.floor(Math.random() * type) + 1;
    const die: RolledDie = {
      id: crypto.randomUUID(),
      type, value, rolling: true,
      tx: (Math.random() - 0.5) * 280,
      ty: (Math.random() - 0.5) * 180,
      tr: Math.random() * 720 - 360,
    };
    setRolledDice([die]);
    setTimeout(() => {
      setRolledDice(prev => prev.map(d => ({ ...d, rolling: false })));
      setHistory(prev => [{ formula: `1d${type}`, total: value, details: `d${type}:${value}` }, ...prev].slice(0, 10));
    }, 1400);
  };

  const clearTable = () => setRolledDice([]);

  const total = rolledDice.reduce((s, d) => s + d.value, 0) + (rolledDice.length ? modifier : 0);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background/95 backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Dices className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg text-gradient-gold">Lanceur de dés</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left controls */}
        <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border bg-card/50 p-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lancer rapide</p>
            <div className="grid grid-cols-4 gap-1.5">
              {DIE_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => quickRoll(t)}
                  className={cn(
                    "rounded-md border border-border bg-gradient-to-br py-2 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 hover:shadow-md active:scale-95",
                    DIE_COLORS[t]
                  )}
                >
                  d{t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pool de dés</p>
            <div className="space-y-1.5">
              {DIE_TYPES.map(t => (
                <div key={t} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br text-[10px] font-bold text-white", DIE_COLORS[t])}>
                    d{t}
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCount(t, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-5 text-center text-sm font-medium tabular-nums">{counts[t]}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCount(t, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mod</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setModifier(m => m - 1)}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="flex-1 text-center text-sm font-medium tabular-nums">
              {modifier >= 0 ? `+${modifier}` : modifier}
            </span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setModifier(m => m + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button onClick={rollAll} disabled={totalDice === 0} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            <Dices className="mr-2 h-4 w-4" /> Lancer ({totalDice})
          </Button>
          <Button variant="outline" size="sm" onClick={clearTable} disabled={rolledDice.length === 0}>
            Effacer la table
          </Button>

          {history.length > 0 && (
            <div className="mt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Historique</p>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="rounded border border-border/50 bg-muted/20 px-2 py-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-muted-foreground">{h.formula}</span>
                      <span className="font-bold text-primary">{h.total}</span>
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground/70">{h.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dice table */}
        <div className="dice-table relative flex-1 overflow-hidden">
          {/* Table felt background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(216,30%,8%)] via-[hsl(216,35%,5%)] to-[hsl(216,40%,3%)]">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: "radial-gradient(circle at center, hsl(42,65%,58%,0.15) 0%, transparent 50%)"
            }} />
            <div className="absolute inset-4 rounded-3xl border-2 border-primary/20 shadow-[inset_0_0_60px_hsl(0,0%,0%,0.6)]" />
          </div>

          {/* Total display */}
          {rolledDice.length > 0 && !rolledDice[0].rolling && (
            <div className="absolute right-4 top-4 rounded-lg border border-primary/40 bg-card/90 px-4 py-2 backdrop-blur-sm animate-fade-in">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="font-display text-3xl font-bold text-gradient-gold leading-none">{total}</p>
            </div>
          )}

          {/* Empty state */}
          {rolledDice.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Dices className="h-16 w-16 text-primary/30 animate-float" />
              <p className="mt-4 font-display text-lg text-muted-foreground">Lancez les dés !</p>
              <p className="mt-1 text-sm text-muted-foreground/60">Cliquez un dé pour un lancer rapide<br />ou composez votre pool</p>
            </div>
          )}

          {/* Dice */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {rolledDice.map((die) => (
              <div
                key={die.id}
                className="dice-piece absolute"
                style={{
                  ['--tx' as any]: `${die.tx}px`,
                  ['--ty' as any]: `${die.ty}px`,
                  ['--tr' as any]: `${die.tr}deg`,
                  animation: die.rolling ? 'dice-roll 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards' : undefined,
                  transform: die.rolling ? undefined : `translate(${die.tx}px, ${die.ty}px) rotate(${die.tr}deg)`,
                }}
              >
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br text-2xl font-bold text-white shadow-2xl border-2 border-white/20",
                    DIE_COLORS[die.type],
                    die.rolling && "dice-tumble"
                  )}
                  style={{
                    boxShadow: '0 10px 25px hsl(0,0%,0%,0.5), inset 0 2px 4px hsl(0,0%,100%,0.2), inset 0 -4px 8px hsl(0,0%,0%,0.3)',
                  }}
                >
                  {die.rolling ? '?' : die.value}
                </div>
                <div className="mt-1 text-center text-[10px] font-medium text-muted-foreground">d{die.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceRoller3D;
