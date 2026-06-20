import { Link } from "react-router-dom";
import { Crown, AlertTriangle } from "lucide-react";
import type { SubscriptionTier } from "@/lib/plan-limits";

interface Props {
  used: number;
  limit: number;
  label: string;
  tier: SubscriptionTier;
  /** Si true, n'affiche le bandeau qu'à partir de la dernière unité disponible. Sinon, toujours. */
  warnOnlyNearLimit?: boolean;
}

/**
 * Affiche un bandeau d'alerte sur l'usage du plan gratuit.
 * - Caché si l'utilisateur n'est pas sur le plan gratuit (ou si la limite est infinie).
 * - Avertissement (ambre) quand il reste 1 emplacement.
 * - Bloquant (rouge) quand la limite est atteinte.
 */
export default function PlanLimitBanner({ used, limit, label, tier, warnOnlyNearLimit = true }: Props) {
  if (tier !== "free" || !Number.isFinite(limit)) return null;
  const reached = used >= limit;
  const near = used >= limit - 1;
  if (warnOnlyNearLimit && !near) return null;

  return (
    <div
      className={`mb-6 flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
        reached
          ? "border-red-500/40 bg-red-500/10"
          : "border-amber-500/40 bg-amber-500/10"
      }`}
      role="status"
    >
      <div className="flex items-center gap-2 text-foreground">
        {reached ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
        ) : (
          <Crown className="h-4 w-4 shrink-0 text-amber-400" />
        )}
        <span>
          {label} : <strong>{used}/{limit}</strong>
          {reached ? " — limite atteinte" : " — bientôt à la limite"}
        </span>
      </div>
      <Link
        to="/subscriptions"
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400"
      >
        Passer Premium
      </Link>
    </div>
  );
}
