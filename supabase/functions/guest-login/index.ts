import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const guestEmail = "guest@taverne.com";
    const guestPassword = "guest123456!";

    // List users to find guest
    const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=50`, {
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
      },
    });
    const listData = await listRes.json();
    const users = listData.users || listData || [];
    const existingGuest = Array.isArray(users)
      ? users.find((u: any) => u.email === guestEmail)
      : null;

    if (existingGuest) {
      // Update existing guest user
      const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existingGuest.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: guestPassword,
          email_confirm: true,
          user_metadata: { display_name: "Invité" },
        }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.text();
        throw new Error(`Failed to update guest: ${err}`);
      }
      await updateRes.text();
    } else {
      // Create guest user
      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: guestEmail,
          password: guestPassword,
          email_confirm: true,
          user_metadata: { display_name: "Invité" },
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Failed to create guest: ${err}`);
      }
      await createRes.text();
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
