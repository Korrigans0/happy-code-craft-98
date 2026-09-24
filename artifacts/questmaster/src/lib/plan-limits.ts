import { PLAN_BY_ID, TIER_LABEL, type SubscriptionTier } from "@/lib/subscriptions";
export type { SubscriptionTier } from "@/lib/subscriptions";
export interface PlanLimits { campaigns: number; characters: number; playersPerCampaign: number; storageGb: number }
export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = Object.fromEntries(Object.entries(PLAN_BY_ID).map(([id, plan]) => [id, plan.quotas])) as Record<SubscriptionTier, PlanLimits>;
export function getLimits(tier: SubscriptionTier | null | undefined): PlanLimits { return PLAN_LIMITS[tier ?? "free"] ?? PLAN_LIMITS.free; }
export { TIER_LABEL };
export function formatPlanError(message: string | undefined | null): string | null {
  if (!message) return null;
  if (message.includes("PLAN_LIMIT_CAMPAIGNS")) return "Limite de campagnes atteinte pour votre offre. Vous pouvez archiver une campagne ou changer d’offre.";
  if (message.includes("PLAN_LIMIT_CHARACTERS")) return "Limite de personnages atteinte pour votre offre. Vous pouvez archiver un personnage ou changer d’offre.";
  if (message.includes("PLAN_LIMIT_PLAYERS")) return "Cette campagne a atteint la limite de joueurs de l’offre du MJ.";
  if (message.includes("STORAGE_QUOTA_EXCEEDED")) return "Espace de stockage épuisé. Supprimez des fichiers ou changez d’offre.";
  return null;
}
