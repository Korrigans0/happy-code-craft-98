// Server-side enforced chat clear with audit logging.
// Verifies the caller is a GM of the campaign before deleting messages.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Identify caller using their JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const campaignId = body?.campaign_id as string | undefined;
    const scope = (body?.scope as string | undefined) ?? "all";
    if (!campaignId || !["chat", "gm", "all"].includes(scope)) {
      return new Response(JSON.stringify({ error: "Paramètres invalides" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client for privileged checks + writes + audit log
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Server-side authorization: must be GM of the campaign
    const { data: gmRow, error: gmErr } = await admin
      .from("campaign_members")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)
      .eq("role", "gm")
      .maybeSingle();
    if (gmErr) throw gmErr;
    if (!gmRow) {
      return new Response(JSON.stringify({ error: "Accès refusé : MJ uniquement" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Perform the delete
    let q = admin.from("campaign_messages").delete({ count: "exact" }).eq("campaign_id", campaignId);
    if (scope === "chat") q = q.neq("message_type", "whisper");
    if (scope === "gm") q = q.eq("message_type", "whisper");
    const { error: delErr, count } = await q;
    if (delErr) throw delErr;

    // Audit log entry (best-effort)
    await admin.from("campaign_audit_log").insert({
      campaign_id: campaignId,
      user_id: userId,
      action: "clear_messages",
      scope,
      details: { deleted_count: count ?? null },
    });

    return new Response(JSON.stringify({ ok: true, deleted: count ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
