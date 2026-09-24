import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isSubscriptionTier, type BillingPeriod, type SubscriptionTier } from "@/lib/subscriptions";

export interface UserSubscription {
  tier: SubscriptionTier; status: string; billingPeriod: BillingPeriod | null; priceId: string | null;
  currentPeriodStart: string | null; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean;
  environment: "sandbox" | "live" | null; customerId: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subscription", user?.id], enabled: !!user, staleTime: 20_000,
    queryFn: async (): Promise<UserSubscription> => {
      if (!user) throw new Error("Non authentifié");
      const [profileResult, subscriptionResult] = await Promise.all([
        supabase.from("profiles").select("tier").eq("user_id", user.id).maybeSingle(),
        (supabase as any).from("subscriptions").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const rawTier = (profileResult.data as { tier?: unknown } | null)?.tier;
      const tier = isSubscriptionTier(rawTier) ? rawTier : "free";
      const row = subscriptionResult.data as any;
      return { tier, status: row?.status ?? (tier === "free" ? "gratuit" : "inconnu"), billingPeriod: row?.billing_period ?? null,
        priceId: row?.paddle_price_id ?? null, currentPeriodStart: row?.current_period_start ?? null,
        currentPeriodEnd: row?.current_period_end ?? null, cancelAtPeriodEnd: !!row?.cancel_at_period_end,
        environment: row?.environment ?? null, customerId: row?.paddle_customer_id ?? null };
    },
  });
}

export async function openCustomerPortal() {
  const { data, error } = await supabase.functions.invoke("paddle-portal", { body: {} });
  if (error || !data?.url) throw new Error(error?.message ?? "Portail indisponible");
  window.open(data.url, "_blank", "noopener,noreferrer");
}
