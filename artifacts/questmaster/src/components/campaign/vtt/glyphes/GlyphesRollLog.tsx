// Journal des jets Glyphes — lu depuis le chat partagé de la campagne
// (historique conservé) et complété en direct par le canal de dés.
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollText } from "lucide-react";
import { useGlyphesLog } from "@/lib/game-systems/glyphes/broadcast";
import GlyphesEntryCard from "./GlyphesEntryCard";

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
            <GlyphesEntryCard key={e.id} entry={e} className="rounded-md border border-border bg-card/60 p-2" />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
