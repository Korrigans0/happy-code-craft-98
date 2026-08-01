import { Wifi, WifiOff, RefreshCw, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RealtimeStatus } from "@/hooks/useRealtimeChannel";

interface Props {
  status: "online" | "offline" | "reconnecting";
  isSaving?: boolean;
  isDirty?: boolean;
  lastSavedAt?: Date | null;
  /** État du websocket temps réel (point vert / orange / rouge). */
  realtimeStatus?: RealtimeStatus;
  className?: string;
}

/**
 * Petit badge de statut de connexion / synchronisation pour le VTT.
 * Aide les MJ et joueurs à comprendre instantanément si leurs actions
 * sont bien envoyées au serveur (vs perte réseau silencieuse).
 */
export function ConnectionStatus({ status, isSaving, isDirty, lastSavedAt, realtimeStatus, className }: Props) {
  let icon = <Wifi className="h-3.5 w-3.5" />;
  let label = "Connecté";
  let tone = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";

  if (status === "offline") {
    icon = <WifiOff className="h-3.5 w-3.5" />;
    label = "Hors ligne";
    tone = "text-destructive border-destructive/40 bg-destructive/10";
  } else if (status === "reconnecting") {
    icon = <RefreshCw className="h-3.5 w-3.5 animate-spin" />;
    label = "Reconnexion…";
    tone = "text-amber-400 border-amber-500/30 bg-amber-500/10";
  } else if (isSaving) {
    icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    label = "Sauvegarde…";
    tone = "text-blue-400 border-blue-500/30 bg-blue-500/10";
  } else if (isDirty) {
    icon = <RefreshCw className="h-3.5 w-3.5" />;
    label = "Modifs en attente";
    tone = "text-amber-400 border-amber-500/30 bg-amber-500/10";
  } else if (lastSavedAt) {
    icon = <Check className="h-3.5 w-3.5" />;
    label = "À jour";
  }

  const rtTone =
    realtimeStatus === "connected"
      ? "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/70"
      : realtimeStatus === "connecting"
        ? "bg-amber-400 animate-pulse"
        : "bg-destructive";
  const rtLabel =
    realtimeStatus === "connected"
      ? "Temps réel actif"
      : realtimeStatus === "connecting"
        ? "Temps réel : connexion…"
        : "Temps réel indisponible — synchronisation de secours";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {realtimeStatus && (
        <span
          className="inline-flex items-center"
          title={rtLabel}
          aria-label={rtLabel}
          role="status"
        >
          <span className={cn("h-2 w-2 rounded-full", rtTone)} />
        </span>
      )}
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          tone
        )}
        title={
          lastSavedAt
            ? `Dernière sauvegarde : ${lastSavedAt.toLocaleTimeString("fr-BE")}`
            : "Pas encore sauvegardé"
        }
        aria-live="polite"
      >
        {icon}
        <span>{label}</span>
      </span>
    </span>
  );
}
