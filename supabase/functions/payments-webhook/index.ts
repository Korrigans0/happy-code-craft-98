import { createClient } from "npm:@supabase/supabase-js@2";
import { EventName, verifyWebhook, type PaddleEnv } from "../_shared/paddle.ts";
const tierByProduct: Record<string, string> = { aetheria_premium_pj: "premium_pj", aetheria_premium_mj: "premium_mj", aetheria_premium_mixed: "premium_mixed" };
const periodByPrice: Record<string, string> = { aetheria_pj_monthly: "monthly", aetheria_pj_quarterly: "quarterly", aetheria_pj_annual: "annual", aetheria_mj_monthly: "monthly", aetheria_mj_quarterly: "quarterly", aetheria_mj_annual: "annual", aetheria_mixed_monthly: "monthly", aetheria_mixed_quarterly: "quarterly", aetheria_mixed_annual: "annual" };
const getAdmin = () => { const url = Deno.env.get("SUPABASE_URL"); const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); if (!url || !key) throw new Error("Backend configuration missing"); return createClient(url, key); };
const entitled = (status: string, end?: string | null) => ["active", "trialing", "past_due"].includes(status) || (status === "canceled" && !!end && new Date(end) > new Date());
async function syncSubscription(data: any, env: PaddleEnv) {
  const admin = getAdmin(); const item = data.items?.[0];
  const productId = item?.product?.importMeta?.externalId; const priceId = item?.price?.importMeta?.externalId;
  const { data: existing } = await admin.from("subscriptions").select("user_id, product_id, price_id, billing_period").eq("paddle_subscription_id", data.id).eq("environment", env).maybeSingle();
  const userId = data.customData?.userId ?? existing?.user_id; if (!userId) { console.error("No userId for subscription", data.id); return; }
  const effectiveProduct = productId ?? existing?.product_id; const effectivePrice = priceId ?? existing?.price_id;
  const tier = tierByProduct[effectiveProduct]; if (!tier || !effectivePrice) { console.error("Unknown imported catalog identifiers", { effectiveProduct, effectivePrice }); return; }
  const start = data.currentBillingPeriod?.startsAt ?? null; const end = data.currentBillingPeriod?.endsAt ?? null;
  const { error } = await admin.from("subscriptions").upsert({ user_id: userId, paddle_subscription_id: data.id, paddle_customer_id: data.customerId, product_id: effectiveProduct, price_id: effectivePrice, billing_period: periodByPrice[effectivePrice] ?? existing?.billing_period, status: data.status, current_period_start: start, current_period_end: end, cancel_at_period_end: data.scheduledChange?.action === "cancel", environment: env, updated_at: new Date().toISOString() }, { onConflict: "paddle_subscription_id" });
  if (error) throw error;
  await admin.from("profiles").update({ tier: entitled(data.status, end) ? tier : "free" }).eq("user_id", userId);
}
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const env: PaddleEnv = new URL(req.url).searchParams.get("env") === "live" ? "live" : "sandbox";
  try {
    const event = await verifyWebhook(req, env); const data: any = event.data;
    if ([EventName.SubscriptionCreated, EventName.SubscriptionUpdated, EventName.SubscriptionCanceled].includes(event.eventType)) await syncSubscription(data, env);
    if (event.eventType === EventName.TransactionPaymentFailed && data.subscriptionId) await getAdmin().from("subscriptions").update({ status: "past_due", last_payment_failed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("paddle_subscription_id", data.subscriptionId).eq("environment", env);
    if (event.eventType === EventName.TransactionCompleted && data.subscriptionId) await getAdmin().from("subscriptions").update({ last_payment_failed_at: null, updated_at: new Date().toISOString() }).eq("paddle_subscription_id", data.subscriptionId).eq("environment", env);
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) { console.error("Webhook error", error); return new Response("Webhook error", { status: 400 }); }
});
