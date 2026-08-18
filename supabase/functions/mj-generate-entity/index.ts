// Structured codex generation for the GM assistant.
//
// GM-only. Returns a strictly-shaped codex entity (name, summary, description,
// sections, hooks, secrets, tags) grounded in the campaign's own data so the
// result can be written straight into the campaign codex — no free text parsing.

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

const KIND_LABELS: Record<string, string> = {
  npc: "PNJ",
  faction: "faction",
  location: "lieu",
  quest: "quête",
  item: "objet",
  monster: "créature",
  event: "événement",
  note: "note",
  handout: "aide de jeu",
};

// Which sections the model must produce, per entity kind.
const KIND_SECTIONS: Record<string, string[]> = {
  npc: ["Apparence", "Personnalité & voix", "Objectifs", "Ressources & alliés", "Comment l'utiliser en jeu"],
  faction: ["Idéal & méthodes", "Figures clés", "Ressources", "Rivalités", "Comment l'utiliser en jeu"],
  location: ["Ambiance", "Détails sensoriels", "Points d'intérêt", "Dangers", "Rumeurs"],
  quest: ["Commanditaire", "Enjeu", "Étapes", "Obstacles", "Récompense"],
  item: ["Apparence", "Histoire", "Effet en jeu", "Prix narratif"],
  monster: ["Description", "Comportement & tactique", "Capacités notables", "Terrain & mise en scène", "Condition de victoire alternative"],
  event: ["Déclencheur", "Déroulement", "Conséquences", "Mise en scène"],
  note: ["Contenu", "À retenir"],
  handout: ["Texte à lire aux joueurs", "Notes MJ"],
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

  let body: { campaignId?: string; kind?: string; brief?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }

  const campaignId = body.campaignId;
  const kind = String(body.kind ?? "npc");
  const brief = String(body.brief ?? "").slice(0, 2000);
  if (!campaignId || !KIND_LABELS[kind]) return json({ error: "Requête invalide." }, 400);

  const { data: membership, error: memberError } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (memberError) console.error("membership lookup failed", memberError.message, user.id, campaignId);
  if (membership?.role !== "gm") return json({ error: "Réservé au MJ de cette campagne." }, 403);

  const [{ data: campaign }, { data: entities }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("title, description, summary, system, tone, tags, level_min, level_max")
      .eq("id", campaignId)
      .maybeSingle(),
    supabase
      .from("campaign_entities")
      .select("kind, name, summary")
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: false })
      .limit(60),
  ]);

  if (!campaign) return json({ error: "Campagne introuvable." }, 404);

  const systemLabel = SYSTEM_LABELS[campaign.system] ?? campaign.system;
  const sections = KIND_SECTIONS[kind] ?? KIND_SECTIONS.note;

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
      ? `Codex existant :\n${entities.map((e) => `- [${e.kind}] ${e.name}${e.summary ? ` — ${e.summary}` : ""}`).join("\n")}`
      : "Codex existant : vide.",
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt =
    `Tu es l'assistant du Maître du Jeu sur Aetheria VTT. Tu produis une fiche de codex ` +
    `complète et jouable, en français, dans un style évocateur mais utilisable en table.\n\n` +
    `RÈGLE ABSOLUE D'ISOLATION DES SYSTÈMES : cette campagne utilise le système « ${systemLabel} ». ` +
    `N'emploie jamais de règles, créatures, sorts, classes ou terminologie d'un autre système.\n\n` +
    `Tu crées une fiche de type « ${KIND_LABELS[kind]} ». Produis exactement ces sections, dans cet ordre : ` +
    `${sections.join(", ")}. Chaque section fait 2 à 5 phrases. Réutilise le codex existant quand c'est cohérent.\n\n` +
    `CONTEXTE DE LA CAMPAGNE\n${context}`;

  const tool = {
    type: "function",
    function: {
      name: "creer_fiche",
      description: "Renvoie la fiche de codex structurée.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "Nom propre, court et mémorable." },
          summary: { type: "string", description: "Accroche d'une phrase (max 180 caractères)." },
          sections: {
            type: "array",
            description: "Sections demandées, dans l'ordre.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                body: { type: "string" },
              },
              required: ["title", "body"],
            },
          },
          hooks: {
            type: "array",
            description: "2 à 4 accroches d'intrigue exploitables immédiatement.",
            items: { type: "string" },
          },
          secret: { type: "string", description: "Un secret réservé au MJ." },
          tags: {
            type: "array",
            description: "3 à 6 mots-clés en minuscules.",
            items: { type: "string" },
          },
        },
        required: ["name", "summary", "sections", "hooks", "secret", "tags"],
      },
    },
  };

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
        {
          role: "user",
          content:
            brief.trim() ||
            `Crée un(e) ${KIND_LABELS[kind]} marquant(e) et cohérent(e) avec la campagne.`,
        },
      ],
      tools: [tool],
      tool_choice: { type: "function", function: { name: "creer_fiche" } },
    }),
  });

  if (res.status === 429) return json({ error: "Trop de requêtes vers l'IA. Réessayez dans un instant." }, 429);
  if (res.status === 402) return json({ error: "Crédits IA épuisés. Rechargez-les pour continuer." }, 402);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, detail);
    return json({ error: "La génération a échoué." }, 500);
  }

  const payload = await res.json();
  const call = payload?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) {
    return json({ error: "La génération n'a produit aucune fiche exploitable." }, 502);
  }

  let entity: Record<string, unknown>;
  try {
    entity = JSON.parse(call.function.arguments);
  } catch {
    return json({ error: "La génération n'a produit aucune fiche exploitable." }, 502);
  }

  return json({ kind, entity });
});
