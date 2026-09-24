import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { gatewayFetch, type PaddleEnv } from "../_shared/paddle.ts";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { priceId, environment } = await req.json(); const env: PaddleEnv = environment === "live" ? "live" : "sandbox";
    if (!/^[a-z0-9_]{3,80}$/.test(String(priceId ?? ""))) return json({ error: "Tarif invalide" }, 400);
    const response = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(priceId)}`); const payload = await response.json();
    if (!response.ok || !payload.data?.[0]?.id) return json({ error: "Tarif introuvable" }, 404);
    return json({ paddleId: payload.data[0].id });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Erreur de tarification" }, 500); }
});
