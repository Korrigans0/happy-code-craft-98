import { Wifi, WifiOff, RefreshCw, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  status: "online" | "offline" | "reconnecting";
  isSaving?: boolean;
  isDirty?: boolean;
  lastSavedAt?: Date | null;
  className?: string;
}

/**
 * Petit badge de statut de connexion / synchronisation pour le VTT.
 * Aide les MJ et joueurs à comprendre instantanément si leurs actions
 * sont bien envoyées au serveur (vs perte réseau silencieuse).
 */
export function ConnectionStatus({ status, isSaving, isDirty, lastSavedAt, className }: Props) {
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

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone,
        className
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
  );
}
