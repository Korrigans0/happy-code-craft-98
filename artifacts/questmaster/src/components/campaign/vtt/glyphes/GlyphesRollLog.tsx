// Journal des jets Glyphes — partagé en temps réel avec toute la table.
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollText } from "lucide-react";
import { useGlyphesLog } from "@/lib/game-systems/glyphes/broadcast";

interface Props {
  campaignId?: string | null;
  className?: string;
}

export default function GlyphesRollLog({ campaignId, className }: Props) {
  const entries = useGlyphesLog(campaignId);

  return (
    <div className={`flex min-h-0 flex-col ${className ?? ""}`}>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <ScrollText className="h-4 w-4 text-primary" />
        <span className="font-display text-sm font-semibold">Journal des jets</span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-2">
          {entries.length === 0 && (
            <p className="px-1 py-4 text-center text-xs text-muted-foreground">
              Aucune épreuve lancée pour l'instant.
            </p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="rounded-md border border-border bg-card/60 p-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">{e.author}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(e.t).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {e.label} — {e.dice.length}D{e.dieSize}
                {e.target ? ` → ${e.target}` : ""}
              </p>
              <div className="my-1 flex flex-wrap gap-1">
                {e.dice.map((d, i) => (
                  <span
                    key={i}
                    className={`flex h-6 w-6 items-center justify-center rounded border text-[11px] font-bold ${
                      d.ignored || d.cancelled
                        ? "border-border text-muted-foreground line-through"
                        : d.value >= e.tdScore
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {d.value}
                  </span>
                ))}
              </div>
              <p className="text-[11px]">
                <span className="text-muted-foreground">
                  TD {e.tdLabel} ({e.tdScore}+) · Rang {e.rank} ·{" "}
                </span>
                <span className={e.isSuccess ? "text-emerald-400" : "text-destructive"}>
                  {e.successes} réussite{e.successes > 1 ? "s" : ""} — {e.isSuccess ? "✓ Réussite" : "✗ Échec"}
                </span>
              </p>
              {e.isCoupDEclat && (
                <p className="text-[11px] text-amber-400">
                  ✨ Coup d'éclat{e.heroismGained ? ` — +${e.heroismGained} héroïsme` : ""}
                </p>
              )}
              {e.wounds !== undefined && (
                <p className="text-[11px] text-destructive">
                  {e.wounds} blessure{e.wounds > 1 ? "s" : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
