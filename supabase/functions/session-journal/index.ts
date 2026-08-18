// Session journal — AI recap of what actually happened at the table.
//
// GM-only. Reads the campaign chat (messages, dice rolls, whispers excluded) for the
// session window, plus the GM's own notes and the session agenda, and returns a
// shareable recap written in the campaign's tone and game system.

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
  if (!LOVABLE_API_KEY) return json({ error: "Assistant indisponible : clé IA manquante." }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Authentification requise." }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return json({ error: "Authentification requise." }, 401);

  let body: { sessionId?: string; audience?: "players" | "gm" };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }

  const sessionId = body.sessionId;
  const audience = body.audience === "gm" ? "gm" : "players";
  if (!sessionId) return json({ error: "Requête invalide." }, 400);

  const { data: session } = await supabase
    .from("campaign_sessions")
    .select("id, campaign_id, title, session_number, description, notes, scheduled_at, completed_at, created_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return json({ error: "Session introuvable." }, 404);

  const campaignId = session.campaign_id;
  const { data: isGm, error: gmError } = await supabase.rpc("is_campaign_gm", {
    _user_id: user.id,
    _campaign_id: campaignId,
  });
  if (gmError || !isGm) return json({ error: "Réservé au MJ de cette campagne." }, 403);

  // Session window: from the previous session's end (or this session's creation) to its end.
  const { data: previous } = await supabase
    .from("campaign_sessions")
    .select("completed_at, created_at, session_number")
    .eq("campaign_id", campaignId)
    .lt("session_number", session.session_number)
    .order("session_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const from = previous?.completed_at ?? previous?.created_at ?? session.created_at;
  const to = session.completed_at ?? new Date().toISOString();

  const [{ data: campaign }, { data: messages }, { data: scenes }, { data: members }] = await Promise.all([
    supabase.from("campaigns").select("title, system, tone, summary").eq("id", campaignId).maybeSingle(),
    supabase
      .from("campaign_messages")
      .select("user_id, content, message_type, created_at")
      .eq("campaign_id", campaignId)
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true })
      .limit(600),
    supabase
      .from("campaign_prep_scenes")
      .select("title, summary, status")
      .eq("session_id", sessionId)
      .order("agenda_order", { ascending: true }),
    supabase.from("campaign_members").select("user_id").eq("campaign_id", campaignId),
  ]);

  if (!campaign) return json({ error: "Campagne introuvable." }, 404);

  // Resolve display names once, so the recap names the players instead of UUIDs.
  const ids = [...new Set((members ?? []).map((m: any) => m.user_id))];
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("user_id, display_name").in("user_id", ids)
    : { data: [] as any[] };
  const nameOf = new Map<string, string>((profiles ?? []).map((p: any) => [p.user_id, p.display_name || "Joueur"]));

  const log = (messages ?? [])
    .filter((m: any) => m.message_type !== "whisper" && typeof m.content === "string" && m.content.trim())
    .map((m: any) => {
      const who = nameOf.get(m.user_id) ?? "Joueur";
      const tag = m.message_type === "roll" || m.message_type === "dice" ? "[jet] " : "";
      return `${who}: ${tag}${String(m.content).slice(0, 400)}`;
    })
    .join("\n")
    .slice(0, 24000);

  if (!log && !session.notes) {
    return json(
      { error: "Pas assez de matière : aucun message de chat ni note de session sur cette période." },
      422,
    );
  }

  const systemLabel = SYSTEM_LABELS[campaign.system] ?? campaign.system;

  const audienceRules =
    audience === "gm"
      ? `Public : le MJ. Tu peux mentionner les intentions cachées, les pistes non suivies et ce qu'il reste à préparer. ` +
        `Termine par une section "### À préparer" listant 3 pistes pour la prochaine séance.`
      : `Public : les joueurs. N'évoque aucun secret du MJ, aucune information que les personnages n'ont pas obtenue. ` +
        `Écris comme la chronique de leurs exploits, à la troisième personne.`;

  const systemPrompt =
    `Tu es le chroniqueur d'Aetheria VTT. Tu écris en français un récit d'après-partie clair, ` +
    `évocateur et fidèle aux événements réellement joués : n'invente jamais un événement absent du journal.\n\n` +
    `RÈGLE D'ISOLATION DES SYSTÈMES : la campagne utilise « ${systemLabel} ». N'utilise aucune règle ou ` +
    `terminologie d'un autre système.\n\n${audienceRules}\n\n` +
    `Format : markdown court. Un paragraphe d'ouverture, puis "### Faits marquants" (liste de 3 à 6 puces), ` +
    `puis "### En suspens" (1 à 3 puces). Moins de 400 mots.` +
    (campaign.tone ? `\nTon de la campagne : ${campaign.tone}.` : "");

  const userPrompt = [
    `Campagne : ${campaign.title}`,
    campaign.summary ? `Contexte : ${campaign.summary}` : "",
    `Session #${session.session_number} — ${session.title}`,
    session.description ? `Prévu : ${session.description}` : "",
    scenes?.length
      ? `Scènes à l'agenda :\n${scenes.map((s: any) => `- (${s.status}) ${s.title}${s.summary ? ` — ${s.summary}` : ""}`).join("\n")}`
      : "",
    session.notes ? `Notes du MJ :\n${String(session.notes).slice(0, 4000)}` : "",
    log ? `Journal de table :\n${log}` : "Journal de table : vide.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (res.status === 429) return json({ error: "Trop de requêtes vers l'IA. Réessayez dans un instant." }, 429);
  if (res.status === 402) return json({ error: "Crédits IA épuisés. Rechargez-les pour continuer." }, 402);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, detail);
    return json({ error: "La génération du récit a échoué." }, 500);
  }

  const payload = await res.json();
  const recap = payload?.choices?.[0]?.message?.content?.trim();
  if (!recap) return json({ error: "Le récit généré est vide. Réessayez." }, 502);

  return json({ recap, audience, messageCount: messages?.length ?? 0 });
});
