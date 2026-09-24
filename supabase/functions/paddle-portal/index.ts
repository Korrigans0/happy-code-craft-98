import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { gatewayFetch, type PaddleEnv } from "../_shared/paddle.ts";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const auth = req.headers.get("Authorization"); if (!auth?.startsWith("Bearer ")) return json({ error: "Non authentifié" }, 401);
  const url = Deno.env.get("SUPABASE_URL"); const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); if (!url || !key) return json({ error: "Configuration indisponible" }, 500);
  const admin = createClient(url, key); const { data: userData } = await admin.auth.getUser(auth.slice(7)); if (!userData.user) return json({ error: "Non authentifié" }, 401);
  const { data: sub } = await admin.from("subscriptions").select("paddle_customer_id, environment").eq("user_id", userData.user.id).in("status", ["trialing", "active", "past_due", "canceled"]).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!sub?.paddle_customer_id) return json({ error: "Aucun abonnement gérable" }, 404);
  try { const env: PaddleEnv = sub.environment === "live" ? "live" : "sandbox"; const response = await gatewayFetch(env, `/customers/${sub.paddle_customer_id}/portal-sessions`, { method: "POST", body: "{}" }); const payload = await response.json(); if (!response.ok || !payload.data?.urls?.general?.overview) return json({ error: "Portail indisponible" }, 502); return json({ url: payload.data.urls.general.overview }); }
  catch (error) { return json({ error: error instanceof Error ? error.message : "Portail indisponible" }, 502); }
});
