// Affichage d'un résultat d'épreuve Glyphes — même rendu dans le journal et le chat.
import type { GlyphesLogEntry } from "@/lib/game-systems/glyphes/chatMessage";

interface Props {
  entry: GlyphesLogEntry;
  /** Affiche l'auteur et l'heure (le chat les affiche déjà au-dessus de la bulle). */
  showHeader?: boolean;
  className?: string;
}

export default function GlyphesEntryCard({ entry: e, showHeader = true, className }: Props) {
  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">{e.author}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(e.t).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}
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
  );
}
