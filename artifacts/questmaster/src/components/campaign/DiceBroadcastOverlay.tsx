import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Dices } from "lucide-react";
import { getDiceChannel, type DiceRollBroadcast } from "@/lib/vtt/diceBroadcast";

interface DisplayRoll extends DiceRollBroadcast {
  id: string;
}

const formatDetails = (roll: DiceRollBroadcast) =>
  roll.results.map(d => d.value).join(" + ")
  + (roll.modifier ? ` ${roll.modifier > 0 ? "+" : ""}${roll.modifier}` : "");

const DiceBroadcastOverlay = ({ campaignId }: { campaignId: string }) => {
  const [rolls, setRolls] = useState<DisplayRoll[]>([]);

  useEffect(() => {
    if (!campaignId) return;
    const channel: any = getDiceChannel(campaignId);
    const handler = ({ payload }: { payload: DiceRollBroadcast }) => {
      if (!payload || typeof payload.total !== "number") return;
      const id = `${payload.t}-${Math.random().toString(36).slice(2, 7)}`;
      setRolls(prev => [...prev, { ...payload, id }].slice(-4));
      setTimeout(() => {
        setRolls(prev => prev.filter(r => r.id !== id));
      }, 7000);
    };
    channel.on?.("broadcast", { event: "roll" }, handler);
    return () => {
      // Keep the shared channel alive, just drop this listener.
      const bindings = channel.bindings?.broadcast;
      if (Array.isArray(bindings)) {
        channel.bindings.broadcast = bindings.filter((b: any) => b.callback !== handler);
      }
    };
  }, [campaignId]);


  if (rolls.length === 0) return null;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-40 flex flex-col gap-2">
      {rolls.map(r => (
        <div
          key={r.id}
          className={cn(
            "w-[230px] max-sm:w-[190px] overflow-hidden rounded-lg border bg-card/95 backdrop-blur-md shadow-xl animate-fade-in",
            r.crit === "success" ? "border-primary shadow-[0_0_24px_hsl(var(--primary)/0.5)]" :
            r.crit === "fail" ? "border-destructive shadow-[0_0_24px_hsl(var(--destructive)/0.5)]" :
            "border-primary/40"
          )}
        >
          {/* Header : pseudo de l'auteur */}
          <div className="flex items-center gap-1.5 border-b border-border/60 bg-primary/10 px-2.5 py-1">
            <Dices className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate text-xs font-semibold text-foreground">{r.author}</span>
          </div>

          <div className="flex items-center gap-3 px-2.5 py-2">
            {/* Résultat */}
            <div className={cn(
              "min-w-[46px] shrink-0 rounded-md border px-2 py-1 text-center",
              r.crit === "success" ? "border-primary/60 bg-primary/15" :
              r.crit === "fail" ? "border-destructive/60 bg-destructive/15" :
              "border-primary/30 bg-background/60"
            )}>
              <span className={cn(
                "block text-xl font-bold leading-none",
                r.crit === "fail" ? "text-destructive" : "text-gradient-gold"
              )}>
                {r.total}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              {r.label && <p className="truncate text-[11px] font-medium text-foreground">{r.label}</p>}
              <p className="truncate text-[11px] text-muted-foreground">{r.formula}</p>
              <p className="truncate text-[10px] text-muted-foreground/80">[{formatDetails(r)}]</p>
            </div>
          </div>

          {r.crit === "success" && (
            <p className="border-t border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">✦ Critique !</p>
          )}
          {r.crit === "fail" && (
            <p className="border-t border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[10px] font-bold text-destructive">✗ Échec critique</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DiceBroadcastOverlay;
