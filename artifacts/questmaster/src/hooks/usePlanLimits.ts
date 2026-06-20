import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLimits, type SubscriptionTier, type PlanLimits } from "@/lib/plan-limits";

export interface PlanUsage {
  tier: SubscriptionTier;
  limits: PlanLimits;
  campaignsUsed: number;
  charactersUsed: number;
  canCreateCampaign: boolean;
  canCreateCharacter: boolean;
}

/**
 * Renvoie le niveau d'abonnement de l'utilisateur courant et son usage actuel
 * (nombre de campagnes possédées, nombre de personnages possédés).
 */
export function usePlanLimits(): PlanUsage | null {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data } = useQuery({
    queryKey: ["plan-limits", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<PlanUsage | null> => {
      if (!userId) return null;
      const [profile, campaigns, characters] = await Promise.all([
        supabase.from("profiles").select("tier").eq("user_id", userId).maybeSingle(),
        supabase
          .from("campaigns")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("characters")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      const rawTier = (profile.data as { tier?: string } | null)?.tier;
      const tier: SubscriptionTier =
        rawTier === "gm_premium" || rawTier === "premium_plus" ? rawTier : "free";
      const limits = getLimits(tier);
      const campaignsUsed = campaigns.count ?? 0;
      const charactersUsed = characters.count ?? 0;
      return {
        tier,
        limits,
        campaignsUsed,
        charactersUsed,
        canCreateCampaign: campaignsUsed < limits.campaigns,
        canCreateCharacter: charactersUsed < limits.characters,
      };
    },
  });

  return data ?? null;
}
