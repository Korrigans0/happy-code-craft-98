// AI Game Master assistant.
//
// GM-only. Streams a chat completion from the Lovable AI gateway, grounded in the
// campaign's own data (system, tone, codex entities, prepared scenes) so the answer
// never mixes content coming from another game system.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_LABELS: Record<string, string> = {
  aetheria: "Aetheria",
  glyphes: "Glyphes",
  wa: "Worlds Awakening",
  worlds_awakening: "Worlds Awakening",
  dnd5e: "Dungeons & Dragons 5e",
  pathfinder2e: "Pathfinder 2e",
  cthulhu: "L'Appel de Cthulhu 7e",
  cof: "Chroniques Oubliées Fantasy",
  custom: "Système personnalisé (homebrew)",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  if (!LOVABLE_API_KEY) {
    return json({ error: "Assistant indisponible : clé IA manquante." }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Authentification requise." }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return json({ error: "Authentification requise." }, 401);

  let body: { campaignId?: string; messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }

  const campaignId = body.campaignId;
  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  if (!campaignId || messages.length === 0) return json({ error: "Requête invalide." }, 400);

  // Server-side permission check — the assistant sees GM-only material.
  const { data: isGm, error: gmError } = await supabase.rpc("is_campaign_gm", {
    _user_id: user.id,
    _campaign_id: campaignId,
  });
  if (gmError || !isGm) return json({ error: "Réservé au MJ de cette campagne." }, 403);

  // ── Campaign grounding (all reads pass through RLS) ──────────────────────
  const [{ data: campaign }, { data: entities }, { data: scenes }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("title, description, summary, system, tone, tags, level_min, level_max, max_players")
      .eq("id", campaignId)
      .maybeSingle(),
    supabase
      .from("campaign_entities")
      .select("kind, name, summary, tags")
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: false })
      .limit(80),
    supabase
      .from("campaign_prep_scenes")
      .select("title, summary, status")
      .eq("campaign_id", campaignId)
      .order("sort_order", { ascending: true })
      .limit(30),
  ]);

  if (!campaign) return json({ error: "Campagne introuvable." }, 404);

  const systemLabel = SYSTEM_LABELS[campaign.system] ?? campaign.system;

  const context = [
    `Campagne : ${campaign.title}`,
    campaign.summary ? `Résumé : ${campaign.summary}` : "",
    campaign.description ? `Description : ${campaign.description}` : "",
    campaign.tone ? `Ton : ${campaign.tone}` : "",
    campaign.tags?.length ? `Thèmes : ${campaign.tags.join(", ")}` : "",
    campaign.level_min || campaign.level_max
      ? `Niveaux : ${campaign.level_min ?? "?"} à ${campaign.level_max ?? "?"}`
      : "",
    entities?.length
      ? `Codex de la campagne :\n${entities
          .map((e) => `- [${e.kind}] ${e.name}${e.summary ? ` — ${e.summary}` : ""}`)
          .join("\n")}`
      : "Codex de la campagne : vide.",
    scenes?.length
      ? `Scènes préparées :\n${scenes
          .map((s) => `- (${s.status}) ${s.title}${s.summary ? ` — ${s.summary}` : ""}`)
          .join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt =
    `Tu es l'assistant du Maître du Jeu sur Aetheria VTT. Tu réponds toujours en français, ` +
    `d'un ton évocateur mais concis, en markdown court (titres ###, listes, gras).\n\n` +
    `RÈGLE ABSOLUE D'ISOLATION DES SYSTÈMES : cette campagne utilise le système « ${systemLabel} ». ` +
    `Tu n'utilises jamais de règles, créatures, sorts, classes ou terminologie d'un autre système. ` +
    `Si tu ne connais pas une règle précise de ce système, dis-le et propose une solution neutre ` +
    `plutôt que d'inventer une règle d'un autre jeu.\n\n` +
    `Tu aides le MJ à : créer des PNJ, factions, lieux, quêtes, objets et rencontres cohérents avec ` +
    `l'univers ci-dessous ; improviser des dialogues et des rebondissements ; résumer une session ; ` +
    `préparer une scène. Réutilise les éléments existants du codex quand c'est pertinent, et reste ` +
    `bref (moins de 400 mots) sauf demande explicite.\n\n` +
    `CONTEXTE DE LA CAMPAGNE\n${context}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 8000) })),
      ],
    }),
  });

  if (res.status === 429) {
    return json({ error: "Trop de requêtes vers l'IA. Réessayez dans un instant." }, 429);
  }
  if (res.status === 402) {
    return json({ error: "Crédits IA épuisés. Rechargez-les pour continuer." }, 402);
  }
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, detail);
    return json({ error: "L'assistant n'a pas pu répondre." }, 500);
  }

  return new Response(res.body, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
