// Official compendium proxy.
//
// Serves *official* game content for the non-proprietary systems:
//  - D&D 5e        -> Open5e API (WotC SRD 5.1, OGL)
//  - Pathfinder 2e -> Archives of Nethys elasticsearch (ORC / Paizo Community Use)
//
// Aetheria and Glyphes are proprietary and are NEVER served from here.
//
// The function normalizes every upstream shape into a single `OfficialEntry`
// contract so the frontend renders one rich detail sheet for all systems.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const OPEN5E = "https://api.open5e.com/v1";
const AON = "https://elasticsearch.aonprd.com/aon/_search";
const PAGE_SIZE = 40;

type Kind = "monsters" | "spells" | "items";

interface Section {
  title: string;
  text: string;
}

interface OfficialEntry {
  id: string;
  name: string;
  kind: Kind;
  subtitle: string;
  /** Short badges shown on the card (type, rarity, level, CR…). */
  tags: string[];
  /** Key/value block shown at the top of the detail sheet. */
  meta: Record<string, string>;
  /** Ability scores, when the entry has them. */
  abilities?: Record<string, number>;
  description: string;
  sections: Section[];
  source: string;
  url?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });

/* ─────────────────────────── D&D 5e (Open5e) ─────────────────────────── */

const CR_LABEL = (cr: string) => `FP ${cr}`;

const SIZE_FR: Record<string, string> = {
  Tiny: "TP", Small: "P", Medium: "M", Large: "G", Huge: "TG", Gargantuan: "Gig",
};

function speedToText(speed: unknown): string {
  if (!speed || typeof speed !== "object") return String(speed ?? "—");
  return Object.entries(speed as Record<string, unknown>)
    .map(([k, v]) => `${k} ${v}${typeof v === "number" ? " ft." : ""}`)
    .join(", ");
}

function blocks(list: unknown, title: string): Section[] {
  if (!Array.isArray(list) || list.length === 0) return [];
  return [{
    title,
    text: list
      .map((a: Record<string, unknown>) =>
        `**${a.name ?? ""}${a.attack_bonus ? ` (+${a.attack_bonus})` : ""}.** ${a.desc ?? ""}`)
      .join("\n\n"),
  }];
}

function mapOpen5eMonster(m: Record<string, any>): OfficialEntry {
  const saves = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
    .filter((s) => m[`${s}_save`] != null)
    .map((s) => `${s.slice(0, 3).toUpperCase()} +${m[`${s}_save`]}`)
    .join(", ");
  const skills = m.skills && typeof m.skills === "object"
    ? Object.entries(m.skills).map(([k, v]) => `${k} +${v}`).join(", ")
    : "";

  const meta: Record<string, string> = {
    "Classe d'armure": `${m.armor_class ?? "—"}${m.armor_desc ? ` (${m.armor_desc})` : ""}`,
    "Points de vie": `${m.hit_points ?? "—"}${m.hit_dice ? ` (${m.hit_dice})` : ""}`,
    Vitesse: speedToText(m.speed),
    "Facteur de puissance": String(m.challenge_rating ?? "—"),
  };
  if (saves) meta["Jets de sauvegarde"] = saves;
  if (skills) meta["Compétences"] = skills;
  if (m.damage_vulnerabilities) meta["Vulnérabilités"] = m.damage_vulnerabilities;
  if (m.damage_resistances) meta["Résistances"] = m.damage_resistances;
  if (m.damage_immunities) meta["Immunités aux dégâts"] = m.damage_immunities;
  if (m.condition_immunities) meta["Immunités aux états"] = m.condition_immunities;
  if (m.senses) meta["Sens"] = m.senses;
  if (m.languages) meta["Langues"] = m.languages;

  return {
    id: `dnd5e:monsters:${m.slug}`,
    name: m.name,
    kind: "monsters",
    subtitle: `${m.size ?? ""} ${m.type ?? ""}${m.subtype ? ` (${m.subtype})` : ""}, ${m.alignment ?? ""}`.trim(),
    tags: [m.type, SIZE_FR[m.size] ? m.size : m.size, CR_LABEL(String(m.challenge_rating))].filter(Boolean),
    meta,
    abilities: {
      FOR: m.strength, DEX: m.dexterity, CON: m.constitution,
      INT: m.intelligence, SAG: m.wisdom, CHA: m.charisma,
    },
    description: m.desc || "",
    sections: [
      ...blocks(m.special_abilities, "Capacités spéciales"),
      ...blocks(m.actions, "Actions"),
      ...blocks(m.bonus_actions, "Actions bonus"),
      ...blocks(m.reactions, "Réactions"),
      ...blocks(m.legendary_actions, "Actions légendaires"),
      ...(m.legendary_desc ? [{ title: "Légendaire", text: m.legendary_desc }] : []),
      ...(m.spell_list?.length ? [{ title: "Sorts", text: m.spell_list.join(", ") }] : []),
    ],
    source: m.document__title || "SRD 5.1",
  };
}

function mapOpen5eSpell(s: Record<string, any>): OfficialEntry {
  return {
    id: `dnd5e:spells:${s.slug}`,
    name: s.name,
    kind: "spells",
    subtitle: `${s.level === "cantrip" ? "Sort mineur" : `Niveau ${s.level_int}`} — ${s.school}`,
    tags: [s.school, s.level_int === 0 ? "Tour de magie" : `Niv. ${s.level_int}`, s.concentration === "yes" ? "Concentration" : "", s.ritual === "yes" ? "Rituel" : ""].filter(Boolean),
    meta: {
      "Temps d'incantation": s.casting_time ?? "—",
      Portée: s.range ?? "—",
      Composantes: `${s.components ?? "—"}${s.material ? ` (${s.material})` : ""}`,
      Durée: s.duration ?? "—",
      Classes: s.dnd_class || "—",
      Concentration: s.concentration === "yes" ? "Oui" : "Non",
      Rituel: s.ritual === "yes" ? "Oui" : "Non",
    },
    description: s.desc || "",
    sections: s.higher_level ? [{ title: "Aux niveaux supérieurs", text: s.higher_level }] : [],
    source: s.document__title || "SRD 5.1",
  };
}

function mapOpen5eItem(i: Record<string, any>): OfficialEntry {
  return {
    id: `dnd5e:items:${i.slug}`,
    name: i.name,
    kind: "items",
    subtitle: `${i.type ?? ""}${i.rarity ? `, ${i.rarity}` : ""}`,
    tags: [i.type, i.rarity, i.requires_attunement ? "Harmonisation" : ""].filter(Boolean),
    meta: {
      Type: i.type ?? "—",
      Rareté: i.rarity ?? "—",
      Harmonisation: i.requires_attunement ? String(i.requires_attunement) : "Non",
    },
    description: i.desc || "",
    sections: [],
    source: i.document__title || "SRD 5.1",
  };
}

async function fetchDnd5e(kind: Kind, search: string, page: number) {
  const path = kind === "monsters" ? "monsters" : kind === "spells" ? "spells" : "magicitems";
  const url = new URL(`${OPEN5E}/${path}/`);
  url.searchParams.set("document__slug", "wotc-srd");
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("ordering", "name");
  if (search) url.searchParams.set("search", search);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Open5e ${res.status}`);
  const data = await res.json();
  const map = kind === "monsters" ? mapOpen5eMonster : kind === "spells" ? mapOpen5eSpell : mapOpen5eItem;
  return {
    total: data.count ?? 0,
    items: (data.results ?? []).map(map),
    pageSize: PAGE_SIZE,
  };
}

/* ─────────────────────── Pathfinder 2e (Nethys) ──────────────────────── */

/** AoN stores rich markdown with custom pseudo-tags — flatten to readable text. */
function cleanAonText(raw: string): string {
  return (raw || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(?:title|row|column|center|sup|sub|b|i|u|span|div|table|tr|td|th|li|ul|ol)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const AON_CATEGORY: Record<Kind, string> = {
  monsters: "creature",
  spells: "spell",
  items: "equipment",
};

function mapAonEntry(kind: Kind, src: Record<string, any>, id: string): OfficialEntry {
  const text = cleanAonText(src.markdown || src.text || "");
  const meta: Record<string, string> = {};
  const put = (k: string, v: unknown) => {
    if (v == null || v === "") return;
    meta[k] = Array.isArray(v) ? v.join(", ") : String(v);
  };

  if (kind === "monsters") {
    put("Niveau", src.level);
    put("CA", src.ac);
    put("PV", src.hp);
    put("Perception", src.perception);
    put("Vitesse", src.speed_raw ?? src.speed);
    put("Bonus d'attaque", src.attack_bonus);
    put("Sauvegardes", [
      src.fortitude_save != null ? `Vig +${src.fortitude_save}` : "",
      src.reflex_save != null ? `Réf +${src.reflex_save}` : "",
      src.will_save != null ? `Vol +${src.will_save}` : "",
    ].filter(Boolean).join(", "));
    put("Immunités", src.immunity);
    put("Résistances", src.resistance_raw ?? src.resistance);
    put("Faiblesses", src.weakness_raw ?? src.weakness);
    put("Langues", src.language);
    put("Sens", src.sense);
    put("Famille", src.creature_family);
  } else if (kind === "spells") {
    put("Niveau", src.level);
    put("Tradition", src.tradition);
    put("École", src.school);
    put("Incantation", src.actions);
    put("Composantes", src.component);
    put("Portée", src.range_raw ?? src.range);
    put("Cible", src.target);
    put("Sauvegarde", src.saving_throw);
    put("Durée", src.duration_raw ?? src.duration);
  } else {
    put("Niveau", src.level);
    put("Prix", src.price_raw ?? src.price);
    put("Encombrement", src.bulk_raw ?? src.bulk);
    put("Catégorie", src.item_category);
    put("Utilisation", src.usage);
    put("Rareté", src.rarity);
  }
  put("Source", src.source);

  return {
    id: `pathfinder2e:${kind}:${id}`,
    name: src.name,
    kind,
    subtitle: cleanAonText(src.summary || "").slice(0, 200),
    tags: [
      src.level != null ? `Niv. ${src.level}` : "",
      src.rarity || "",
      ...(Array.isArray(src.trait) ? src.trait.slice(0, 4) : []),
    ].filter(Boolean),
    meta,
    abilities: kind === "monsters" && src.strength != null
      ? {
        FOR: src.strength, DEX: src.dexterity, CON: src.constitution,
        INT: src.intelligence, SAG: src.wisdom, CHA: src.charisma,
      }
      : undefined,
    description: text,
    sections: Array.isArray(src.creature_ability) && src.creature_ability.length
      ? [{ title: "Capacités", text: src.creature_ability.join(", ") }]
      : [],
    source: Array.isArray(src.source) ? src.source.join(", ") : (src.source ?? "Archives of Nethys"),
    url: src.url ? `https://2e.aonprd.com${src.url}` : undefined,
  };
}

async function fetchPathfinder(kind: Kind, search: string, page: number) {
  const must: unknown[] = [];
  if (search) {
    must.push({
      multi_match: {
        query: search,
        fields: ["name^3", "text", "trait", "summary"],
        type: "best_fields",
        fuzziness: "AUTO",
      },
    });
  }
  const body = {
    size: PAGE_SIZE,
    from: (page - 1) * PAGE_SIZE,
    query: {
      bool: {
        filter: [
          { term: { category: AON_CATEGORY[kind] } },
          { term: { exclude_from_search: false } },
        ],
        must: must.length ? must : [{ match_all: {} }],
      },
    },
    sort: search ? ["_score"] : [{ "name.keyword": "asc" }],
  };

  const res = await fetch(AON, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Nethys ${res.status}`);
  const data = await res.json();
  return {
    total: data?.hits?.total?.value ?? 0,
    items: (data?.hits?.hits ?? []).map((h: Record<string, any>) => mapAonEntry(kind, h._source ?? {}, h._id)),
    pageSize: PAGE_SIZE,
  };
}

/* ───────────────────────────── handler ───────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const system = url.searchParams.get("system") ?? "";
    const kind = (url.searchParams.get("kind") ?? "monsters") as Kind;
    const search = (url.searchParams.get("search") ?? "").slice(0, 120).trim();
    const page = Math.min(Math.max(parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1), 200);

    if (!["monsters", "spells", "items"].includes(kind)) {
      return json({ error: "kind invalide" }, 400);
    }

    if (system === "D&D 5e") return json(await fetchDnd5e(kind, search, page));
    if (system === "Pathfinder 2e") return json(await fetchPathfinder(kind, search, page));

    return json({ error: "Système non supporté pour le contenu officiel" }, 400);
  } catch (e) {
    console.error("official-compendium", e);
    return json({ error: (e as Error).message ?? "Erreur inconnue" }, 502);
  }
});
