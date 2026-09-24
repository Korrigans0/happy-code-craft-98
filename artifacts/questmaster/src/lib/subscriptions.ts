import type { LucideIcon } from "lucide-react";
import { Crown, Sparkles, Sword, User } from "lucide-react";

export type SubscriptionTier = "free" | "premium_pj" | "premium_mj" | "premium_mixed";
export type BillingPeriod = "monthly" | "quarterly" | "annual";

export interface PlanQuota { campaigns: number; characters: number; playersPerCampaign: number; storageGb: number }
export interface PlanPrice { cents: number; paddlePriceId: string | null; label: string }
export interface SubscriptionPlan {
  id: SubscriptionTier; name: string; tagline: string; hue: number; icon: LucideIcon;
  recommended?: boolean; quotas: PlanQuota; prices: Record<BillingPeriod, PlanPrice>;
  features: string[];
}

export const PERIOD_LABELS: Record<BillingPeriod, string> = { monthly: "Mensuel", quarterly: "Trimestriel", annual: "Annuel" };
export const PERIOD_MONTHS: Record<BillingPeriod, number> = { monthly: 1, quarterly: 3, annual: 12 };
export const PERIOD_BILLING: Record<BillingPeriod, string> = { monthly: "Facturé chaque mois", quarterly: "Facturé tous les 3 mois", annual: "Facturé annuellement" };

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "free", name: "AÉTHERIA", tagline: "Pour découvrir l’aventure", hue: 190, icon: Sparkles,
    quotas: { campaigns: 3, characters: 3, playersPerCampaign: 5, storageGb: 5 },
    prices: { monthly: { cents: 0, paddlePriceId: null, label: "à vie" }, quarterly: { cents: 0, paddlePriceId: null, label: "à vie" }, annual: { cents: 0, paddlePriceId: null, label: "à vie" } },
    features: ["3 campagnes actives", "3 personnages actifs", "5 joueurs par campagne", "5 Go de stockage", "Table virtuelle et brouillard de guerre", "Codex Aétheria, Worlds Awakening, Glyphes et D&D 5e/SRD"] },
  { id: "premium_pj", name: "PREMIUM PJ", tagline: "Pour les joueurs passionnés", hue: 270, icon: User,
    quotas: { campaigns: 3, characters: 20, playersPerCampaign: 5, storageGb: 10 },
    prices: {
      monthly: { cents: 299, paddlePriceId: "pri_01m38gnas4qq1461twyv85ndf4", label: "/mois" },
      quarterly: { cents: 849, paddlePriceId: "pri_01m38gnb1vmj4dgs2zrdnyar32", label: "/3 mois" },
      annual: { cents: 2990, paddlePriceId: "pri_01m38gnb9xy2htyz7bb20st7ed", label: "/an" },
    }, features: ["20 personnages actifs", "10 Go de stockage", "Inventaire avancé", "Portraits HD", "Historique complet", "Effets visuels"] },
  { id: "premium_mj", name: "PREMIUM MJ", tagline: "Pour les Maîtres de Jeu", hue: 43, icon: Sword,
    quotas: { campaigns: 20, characters: 3, playersPerCampaign: 10, storageGb: 15 },
    prices: {
      monthly: { cents: 499, paddlePriceId: "pri_01m38gnbr7bzxp66njpq8m7ntg", label: "/mois" },
      quarterly: { cents: 1419, paddlePriceId: "pri_01m38gnc09ntxmmcsccbgr10vm", label: "/3 mois" },
      annual: { cents: 4990, paddlePriceId: "pri_01m38gnc8b6frc08mrs46nn9df", label: "/an" },
    }, features: ["20 campagnes actives", "10 joueurs par campagne", "15 Go de stockage", "Lumières et murs avancés", "Sauvegardes automatiques", "Import optimisé des cartes"] },
  { id: "premium_mixed", name: "PREMIUM MIXTE", tagline: "Pour ceux qui jouent et créent", hue: 320, icon: Crown, recommended: true,
    quotas: { campaigns: 50, characters: 50, playersPerCampaign: 10, storageGb: 30 },
    prices: {
      monthly: { cents: 799, paddlePriceId: "pri_01m38gncnh6tjx5ejm1scr8x06", label: "/mois" },
      quarterly: { cents: 2279, paddlePriceId: "pri_01m38gncxf601qk52376pygt1t", label: "/3 mois" },
      annual: { cents: 7990, paddlePriceId: "pri_01m38gnd60ejxxwcem72rdbn0e", label: "/an" },
    }, features: ["Tous les avantages Premium PJ", "Tous les avantages Premium MJ", "50 campagnes et 50 personnages", "30 Go de stockage"] },
];

export const PLAN_BY_ID = Object.fromEntries(SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan])) as Record<SubscriptionTier, SubscriptionPlan>;
export const TIER_LABEL: Record<SubscriptionTier, string> = Object.fromEntries(SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan.name])) as Record<SubscriptionTier, string>;
export const isSubscriptionTier = (value: unknown): value is SubscriptionTier => typeof value === "string" && value in PLAN_BY_ID;
export const formatEuro = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
export const monthlyEquivalent = (plan: SubscriptionPlan, period: BillingPeriod) => plan.prices[period].cents / PERIOD_MONTHS[period];
export const savingsPercent = (plan: SubscriptionPlan, period: BillingPeriod) => {
  if (plan.id === "free" || period === "monthly") return 0;
  const monthlyTotal = plan.prices.monthly.cents * PERIOD_MONTHS[period];
  return Math.round((1 - plan.prices[period].cents / monthlyTotal) * 100);
};
