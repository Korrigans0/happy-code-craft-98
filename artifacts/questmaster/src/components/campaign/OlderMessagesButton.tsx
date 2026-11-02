import { Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  history: { hasMore: boolean; loading: boolean; error: boolean; loadOlder: () => void };
  compact?: boolean;
}

/** « Voir les messages précédents » shown above the chat when older pages exist. */
export default function OlderMessagesButton({ history, compact = false }: Props) {
  if (!history.hasMore) return null;
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={compact ? "h-7 text-[11px]" : "h-8 text-xs"}
        onClick={history.loadOlder}
        disabled={history.loading}
      >
        {history.loading ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <History className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        )}
        Voir les messages précédents
      </Button>
      {history.error && (
        <p className="text-[11px] text-destructive" role="status">
          Chargement impossible. Réessayez.
        </p>
      )}
    </div>
  );
}
