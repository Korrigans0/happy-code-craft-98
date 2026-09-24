import { createClient } from "npm:@supabase/supabase-js@2";
import { envFromRequest, verifyPaddleSignature } from "../_shared/paddle.ts";
const productTiers: Record<string, string> = { pro_01m38gnah6kdezsgvh098pjehz: "premium_pj", pro_01m38gnbgk4wf0xbz2qcdz6xfx: "premium_mj", pro_01m38gnce0426h93rc9hnd8ax4: "premium_mixed" };
const periods: Record<string, string> = { pri_01m38gnas4qq1461twyv85ndf4: "monthly", pri_01m38gnb1vmj4dgs2zrdnyar32: "quarterly", pri_01m38gnb9xy2htyz7bb20st7ed: "annual", pri_01m38gnbr7bzxp66njpq8m7ntg: "monthly", pri_01m38gnc09ntxmmcsccbgr10vm: "quarterly", pri_01m38gnc8b6frc08mrs46nn9df: "annual", pri_01m38gncnh6tjx5ejm1scr8x06: "monthly", pri_01m38gncxf601qk52376pygt1t: "quarterly", pri_01m38gnd60ejxxwcem72rdbn0e: "annual" };
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const env = envFromRequest(req); const raw = await req.text();
  const secret = Deno.env.get(env === "live" ? "PADDLE_LIVE_WEBHOOK_SECRET" : "PADDLE_SANDBOX_WEBHOOK_SECRET");
  if (!secret || !(await verifyPaddleSignature(raw, req.headers.get("Paddle-Signature"), secret))) return new Response("Invalid signature", { status: 401 });
  const event = JSON.parse(raw); const data = event.data ?? {}; const item = data.items?.[0]?.price ?? data.items?.[0];
  const productId = typeof item?.product_id === "string" ? item.product_id : null; const priceId = typeof item?.id === "string" ? item.id : null;
  const userId = data.custom_data?.user_id ?? data.custom_data?.userId; const tier = productId ? productTiers[productId] : undefined;
  const url = Deno.env.get("SUPABASE_URL")!; const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; const admin = createClient(url, key);
  if (event.event_type?.startsWith("subscription.") && userId && tier) {
    const active = ["active", "trialing", "past_due"].includes(data.status);
    await admin.from("subscriptions").upsert({ user_id: userId, paddle_subscription_id: data.id, paddle_customer_id: data.customer_id, paddle_product_id: productId, paddle_price_id: priceId, billing_period: periods[priceId] ?? null, status: data.status, current_period_start: data.current_billing_period?.starts_at ?? null, current_period_end: data.current_billing_period?.ends_at ?? null, cancel_at_period_end: !!data.scheduled_change && data.scheduled_change.action === "cancel", environment: env, updated_at: new Date().toISOString() }, { onConflict: "paddle_subscription_id" });
    await admin.from("profiles").update({ tier: active ? tier : "free" }).eq("user_id", userId);
  }
  if (event.event_type === "transaction.payment_failed" && data.subscription_id) await admin.from("subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("paddle_subscription_id", data.subscription_id);
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
