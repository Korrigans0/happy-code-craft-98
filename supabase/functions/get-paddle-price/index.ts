import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { gatewayFetch, type PaddleEnv } from "../_shared/paddle.ts";
// Only the app's own published offers can be resolved.
const ALLOWED_PRICE_IDS = new Set(["pj", "mj", "mixed"].flatMap((t) => ["monthly", "quarterly", "annual"].map((p) => `aetheria_${t}_${p}`)));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: claims } = token ? await sb.auth.getClaims(token) : { data: null };
    if (!claims?.claims?.sub) return json({ error: "Connexion requise" }, 401);
    const { priceId, environment } = await req.json(); const env: PaddleEnv = environment === "live" ? "live" : "sandbox";
    if (!ALLOWED_PRICE_IDS.has(String(priceId ?? ""))) return json({ error: "Tarif invalide" }, 400);
    const response = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(priceId)}`); const payload = await response.json();
    if (!response.ok || !payload.data?.[0]?.id) return json({ error: "Tarif introuvable" }, 404);
    return json({ paddleId: payload.data[0].id });
  } catch (error) { return (console.error("get-paddle-price", error), json({ error: "Erreur de tarification" }, 500)); }
});
