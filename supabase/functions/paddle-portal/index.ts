import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { paddleRequest } from "../_shared/paddle.ts";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization"); if (!auth) return json({ error: "Non authentifié" }, 401);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: userData } = await admin.auth.getUser(auth.replace("Bearer ", "")); if (!userData.user) return json({ error: "Non authentifié" }, 401);
  const { data: sub } = await admin.from("subscriptions").select("paddle_customer_id, environment").eq("user_id", userData.user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!sub?.paddle_customer_id) return json({ error: "Aucun abonnement gérable" }, 404);
  try { const result = await paddleRequest(sub.environment === "live" ? "live" : "sandbox", `/customers/${sub.paddle_customer_id}/portal-sessions`, { method: "POST", body: "{}" }); return json({ url: result.data?.urls?.general?.overview }); }
  catch (error) { return json({ error: error instanceof Error ? error.message : "Portail indisponible" }, 502); }
});
