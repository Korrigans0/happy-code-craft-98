import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Dices } from "lucide-react";

interface RollPayload {
  author: string;
  formula: string;
  total: number;
  results: { type: number; value: number }[];
  modifier: number;
  crit?: "success" | "fail";
  t: number;
}

interface DisplayRoll extends RollPayload {
  id: string;
}

const formatRollLine = (roll: RollPayload) => {
  const details = roll.results.map(d => d.value).join(" + ")
    + (roll.modifier ? ` ${roll.modifier > 0 ? "+" : ""}${roll.modifier}` : "");
  return `🎲 ${roll.author} lance ${roll.formula} → [${details}]`;
};

const DiceBroadcastOverlay = ({ campaignId }: { campaignId: string }) => {
  const [rolls, setRolls] = useState<DisplayRoll[]>([]);

  useEffect(() => {
    if (!campaignId) return;
    const channel: any = (supabase as any).channel(`vtt-dice-${campaignId}`, {
      config: { broadcast: { self: true } },
    });
    channel.on?.("broadcast", { event: "roll" }, ({ payload }: { payload: RollPayload }) => {
      if (!payload || typeof payload.total !== "number") return;
      const id = `${payload.t}-${Math.random().toString(36).slice(2, 7)}`;
      setRolls(prev => [...prev, { ...payload, id }].slice(-3));
      setTimeout(() => {
        setRolls(prev => prev.filter(r => r.id !== id));
      }, 6000);
    });
    channel.subscribe?.();
    return () => { (supabase as any).removeChannel?.(channel); };
  }, [campaignId]);

  if (rolls.length === 0) return null;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-40 flex flex-col gap-2">
      {rolls.map(r => (
        <div
          key={r.id}
          className={cn(
            "min-w-[140px] rounded-lg border bg-card/95 px-3 py-2 backdrop-blur-md shadow-lg animate-fade-in",
            r.crit === "success" ? "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]" :
            r.crit === "fail" ? "border-destructive shadow-[0_0_20px_hsl(var(--destructive)/0.5)]" :
            "border-primary/40"
          )}
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Dices className="h-3 w-3 text-primary" />
            <span className="truncate">Jet de dés</span>
          </div>
          <p className={cn(
            "mt-1 text-sm font-semibold leading-snug",
            r.crit === "success" ? "text-gradient-gold" :
            r.crit === "fail" ? "text-destructive" : "text-gradient-gold"
          )}>
            {formatRollLine(r)}
          </p>
          {r.crit === "success" && <p className="text-[9px] font-bold text-primary">✦ Critique !</p>}
          {r.crit === "fail" && <p className="text-[9px] font-bold text-destructive">✗ Échec critique</p>}
        </div>
      ))}
    </div>
  );
};

export default DiceBroadcastOverlay;
