/**
 * Limites des plans d'abonnement.
 * Source de vérité côté client — doublée par des triggers Postgres côté serveur.
 */

export type SubscriptionTier = "free" | "gm_premium" | "premium_plus";

export interface PlanLimits {
  campaigns: number;
  characters: number;
  playersPerCampaign: number;
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  free: { campaigns: 3, characters: 3, playersPerCampaign: 5 },
  gm_premium: { campaigns: Infinity, characters: Infinity, playersPerCampaign: Infinity },
  premium_plus: { campaigns: Infinity, characters: Infinity, playersPerCampaign: Infinity },
};

export function getLimits(tier: SubscriptionTier | null | undefined): PlanLimits {
  return PLAN_LIMITS[tier ?? "free"] ?? PLAN_LIMITS.free;
}

export const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: "Gratuit",
  gm_premium: "MJ Premium",
  premium_plus: "Premium+",
};

/**
 * Traduit un message d'erreur Postgres / Supabase en message utilisateur lisible.
 * Renvoie `null` si l'erreur n'est pas une limite connue.
 */
export function formatPlanError(message: string | undefined | null): string | null {
  if (!message) return null;
  if (message.includes("PLAN_LIMIT_CAMPAIGNS")) {
    return "Limite atteinte : le plan gratuit permet 3 campagnes maximum. Passez Premium pour en créer plus.";
  }
  if (message.includes("PLAN_LIMIT_CHARACTERS")) {
    return "Limite atteinte : le plan gratuit permet 3 personnages maximum. Passez Premium pour en créer plus.";
  }
  if (message.includes("PLAN_LIMIT_PLAYERS")) {
    return "Cette campagne est complète (5 joueurs maximum sur le plan gratuit du MJ).";
  }
  if (message.includes("STORAGE_QUOTA_EXCEEDED")) {
    return "Espace de stockage épuisé. Passez Premium pour étendre votre quota.";
  }
  return null;
}
