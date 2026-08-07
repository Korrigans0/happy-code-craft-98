// Official compendium proxy.
//
// Serves *official* game content for the non-proprietary systems:
//  - D&D 5e        -> Open5e API (WotC SRD 5.1, OGL)
//  - Pathfinder 2e -> Archives of Nethys elasticsearch (ORC / Paizo Community Use)
//  - COF           -> built-in bilingual library (original text, CO-compatible)
//
// Aetheria and Glyphes are proprietary and are NEVER served from here.
//
// Bilingual: every response is rendered in `lang` (fr | en). Upstream SRD data
// is English-only, so French versions are machine-translated ONCE per entry and
// cached in `public.compendium_translations` — subsequent reads are instant.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { COF_ENTRIES, COF_SOURCE, type CofEntry } from "./cof-data.ts";

const OPEN5E = "https://api.open5e.com/v1";
const AON = "https://elasticsearch.aonprd.com/aon/_search";
const PAGE_SIZE = 40;

type Kind = "monsters" | "spells" | "items";
type Lang = "fr" | "en";

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

/** Localized literal helper. */
const T = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

/* ─────────────────────────── D&D 5e (Open5e) ─────────────────────────── */

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

function mapOpen5eMonster(m: Record<string, any>, lang: Lang): OfficialEntry {
  const saves = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
    .filter((s) => m[`${s}_save`] != null)
    .map((s) => `${s.slice(0, 3).toUpperCase()} +${m[`${s}_save`]}`)
    .join(", ");
  const skills = m.skills && typeof m.skills === "object"
    ? Object.entries(m.skills).map(([k, v]) => `${k} +${v}`).join(", ")
    : "";

  const meta: Record<string, string> = {
    [T(lang, "Classe d'armure", "Armour class")]: `${m.armor_class ?? "—"}${m.armor_desc ? ` (${m.armor_desc})` : ""}`,
    [T(lang, "Points de vie", "Hit points")]: `${m.hit_points ?? "—"}${m.hit_dice ? ` (${m.hit_dice})` : ""}`,
    [T(lang, "Vitesse", "Speed")]: speedToText(m.speed),
    [T(lang, "Facteur de puissance", "Challenge rating")]: String(m.challenge_rating ?? "—"),
  };
  if (saves) meta[T(lang, "Jets de sauvegarde", "Saving throws")] = saves;
  if (skills) meta[T(lang, "Compétences", "Skills")] = skills;
  if (m.damage_vulnerabilities) meta[T(lang, "Vulnérabilités", "Vulnerabilities")] = m.damage_vulnerabilities;
  if (m.damage_resistances) meta[T(lang, "Résistances", "Resistances")] = m.damage_resistances;
  if (m.damage_immunities) meta[T(lang, "Immunités aux dégâts", "Damage immunities")] = m.damage_immunities;
  if (m.condition_immunities) meta[T(lang, "Immunités aux états", "Condition immunities")] = m.condition_immunities;
  if (m.senses) meta[T(lang, "Sens", "Senses")] = m.senses;
  if (m.languages) meta[T(lang, "Langues", "Languages")] = m.languages;

  return {
    id: `dnd5e:monsters:${m.slug}`,
    name: m.name,
    kind: "monsters",
    subtitle: `${m.size ?? ""} ${m.type ?? ""}${m.subtype ? ` (${m.subtype})` : ""}, ${m.alignment ?? ""}`.trim(),
    tags: [m.type, m.size, `${T(lang, "FP", "CR")} ${m.challenge_rating}`].filter(Boolean),
    meta,
    abilities: {
      [T(lang, "FOR", "STR")]: m.strength,
      DEX: m.dexterity,
      CON: m.constitution,
      INT: m.intelligence,
      [T(lang, "SAG", "WIS")]: m.wisdom,
      [T(lang, "CHA", "CHA")]: m.charisma,
    },
    description: m.desc || "",
    sections: [
      ...blocks(m.special_abilities, T(lang, "Capacités spéciales", "Special abilities")),
      ...blocks(m.actions, T(lang, "Actions", "Actions")),
      ...blocks(m.bonus_actions, T(lang, "Actions bonus", "Bonus actions")),
      ...blocks(m.reactions, T(lang, "Réactions", "Reactions")),
      ...blocks(m.legendary_actions, T(lang, "Actions légendaires", "Legendary actions")),
      ...(m.legendary_desc ? [{ title: T(lang, "Légendaire", "Legendary"), text: m.legendary_desc }] : []),
      ...(m.spell_list?.length ? [{ title: T(lang, "Sorts", "Spells"), text: m.spell_list.join(", ") }] : []),
    ],
    source: m.document__title || "SRD 5.1",
  };
}

function mapOpen5eSpell(s: Record<string, any>, lang: Lang): OfficialEntry {
  return {
    id: `dnd5e:spells:${s.slug}`,
    name: s.name,
    kind: "spells",
    subtitle: `${s.level === "cantrip" ? T(lang, "Sort mineur", "Cantrip") : `${T(lang, "Niveau", "Level")} ${s.level_int}`} — ${s.school}`,
    tags: [
      s.school,
      s.level_int === 0 ? T(lang, "Tour de magie", "Cantrip") : `${T(lang, "Niv.", "Lvl")} ${s.level_int}`,
      s.concentration === "yes" ? T(lang, "Concentration", "Concentration") : "",
      s.ritual === "yes" ? T(lang, "Rituel", "Ritual") : "",
    ].filter(Boolean),
    meta: {
      [T(lang, "Temps d'incantation", "Casting time")]: s.casting_time ?? "—",
      [T(lang, "Portée", "Range")]: s.range ?? "—",
      [T(lang, "Composantes", "Components")]: `${s.components ?? "—"}${s.material ? ` (${s.material})` : ""}`,
      [T(lang, "Durée", "Duration")]: s.duration ?? "—",
      [T(lang, "Classes", "Classes")]: s.dnd_class || "—",
      [T(lang, "Concentration", "Concentration")]: s.concentration === "yes" ? T(lang, "Oui", "Yes") : T(lang, "Non", "No"),
      [T(lang, "Rituel", "Ritual")]: s.ritual === "yes" ? T(lang, "Oui", "Yes") : T(lang, "Non", "No"),
    },
    description: s.desc || "",
    sections: s.higher_level
      ? [{ title: T(lang, "Aux niveaux supérieurs", "At higher levels"), text: s.higher_level }]
      : [],
    source: s.document__title || "SRD 5.1",
  };
}

function mapOpen5eItem(i: Record<string, any>, lang: Lang): OfficialEntry {
  return {
    id: `dnd5e:items:${i.slug}`,
    name: i.name,
    kind: "items",
    subtitle: `${i.type ?? ""}${i.rarity ? `, ${i.rarity}` : ""}`,
    tags: [i.type, i.rarity, i.requires_attunement ? T(lang, "Harmonisation", "Attunement") : ""].filter(Boolean),
    meta: {
      [T(lang, "Type", "Type")]: i.type ?? "—",
      [T(lang, "Rareté", "Rarity")]: i.rarity ?? "—",
      [T(lang, "Harmonisation", "Attunement")]: i.requires_attunement
        ? String(i.requires_attunement)
        : T(lang, "Non", "No"),
    },
    description: i.desc || "",
    sections: [],
    source: i.document__title || "SRD 5.1",
  };
}

async function fetchDnd5e(kind: Kind, search: string, page: number, lang: Lang) {
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
    items: (data.results ?? []).map((r: Record<string, any>) => map(r, lang)),
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

function mapAonEntry(kind: Kind, src: Record<string, any>, id: string, lang: Lang): OfficialEntry {
  const text = cleanAonText(src.markdown || src.text || "");
  const meta: Record<string, string> = {};
  const put = (k: string, v: unknown) => {
    if (v == null || v === "") return;
    meta[k] = Array.isArray(v) ? v.join(", ") : String(v);
  };

  if (kind === "monsters") {
    put(T(lang, "Niveau", "Level"), src.level);
    put(T(lang, "CA", "AC"), src.ac);
    put(T(lang, "PV", "HP"), src.hp);
    put(T(lang, "Perception", "Perception"), src.perception);
    put(T(lang, "Vitesse", "Speed"), src.speed_raw ?? src.speed);
    put(T(lang, "Bonus d'attaque", "Attack bonus"), src.attack_bonus);
    put(T(lang, "Sauvegardes", "Saves"), [
      src.fortitude_save != null ? `${T(lang, "Vig", "Fort")} +${src.fortitude_save}` : "",
      src.reflex_save != null ? `${T(lang, "Réf", "Ref")} +${src.reflex_save}` : "",
      src.will_save != null ? `${T(lang, "Vol", "Will")} +${src.will_save}` : "",
    ].filter(Boolean).join(", "));
    put(T(lang, "Immunités", "Immunities"), src.immunity);
    put(T(lang, "Résistances", "Resistances"), src.resistance_raw ?? src.resistance);
    put(T(lang, "Faiblesses", "Weaknesses"), src.weakness_raw ?? src.weakness);
    put(T(lang, "Langues", "Languages"), src.language);
    put(T(lang, "Sens", "Senses"), src.sense);
    put(T(lang, "Famille", "Family"), src.creature_family);
  } else if (kind === "spells") {
    put(T(lang, "Niveau", "Level"), src.level);
    put(T(lang, "Tradition", "Tradition"), src.tradition);
    put(T(lang, "École", "School"), src.school);
    put(T(lang, "Incantation", "Cast"), src.actions);
    put(T(lang, "Composantes", "Components"), src.component);
    put(T(lang, "Portée", "Range"), src.range_raw ?? src.range);
    put(T(lang, "Cible", "Target"), src.target);
    put(T(lang, "Sauvegarde", "Saving throw"), src.saving_throw);
    put(T(lang, "Durée", "Duration"), src.duration_raw ?? src.duration);
  } else {
    put(T(lang, "Niveau", "Level"), src.level);
    put(T(lang, "Prix", "Price"), src.price_raw ?? src.price);
    put(T(lang, "Encombrement", "Bulk"), src.bulk_raw ?? src.bulk);
    put(T(lang, "Catégorie", "Category"), src.item_category);
    put(T(lang, "Utilisation", "Usage"), src.usage);
    put(T(lang, "Rareté", "Rarity"), src.rarity);
  }
  put("Source", src.source);

  return {
    id: `pathfinder2e:${kind}:${id}`,
    name: src.name,
    kind,
    subtitle: cleanAonText(src.summary || "").slice(0, 200),
    tags: [
      src.level != null ? `${T(lang, "Niv.", "Lvl")} ${src.level}` : "",
      src.rarity || "",
      ...(Array.isArray(src.trait) ? src.trait.slice(0, 4) : []),
    ].filter(Boolean),
    meta,
    abilities: kind === "monsters" && src.strength != null
      ? {
        [T(lang, "FOR", "STR")]: src.strength,
        DEX: src.dexterity,
        CON: src.constitution,
        INT: src.intelligence,
        [T(lang, "SAG", "WIS")]: src.wisdom,
        CHA: src.charisma,
      }
      : undefined,
    description: text,
    sections: Array.isArray(src.creature_ability) && src.creature_ability.length
      ? [{ title: T(lang, "Capacités", "Abilities"), text: src.creature_ability.join(", ") }]
      : [],
    source: Array.isArray(src.source) ? src.source.join(", ") : (src.source ?? "Archives of Nethys"),
    url: src.url ? `https://2e.aonprd.com${src.url}` : undefined,
  };
}

async function fetchPathfinder(kind: Kind, search: string, page: number, lang: Lang) {
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
    items: (data?.hits?.hits ?? []).map((h: Record<string, any>) =>
      mapAonEntry(kind, h._source ?? {}, h._id, lang)),
    pageSize: PAGE_SIZE,
  };
}

/* ──────────────────────────── COF (intégré) ──────────────────────────── */

function mapCof(e: CofEntry, lang: Lang): OfficialEntry {
  return {
    id: `cof:${e.kind}:${e.slug}`,
    name: e.name[lang],
    kind: e.kind,
    subtitle: e.subtitle[lang],
    tags: e.tags[lang],
    meta: e.meta[lang],
    abilities: e.abilities,
    description: e.description[lang],
    sections: e.sections[lang],
    source: COF_SOURCE[lang],
  };
}

function fetchCof(kind: Kind, search: string, page: number, lang: Lang) {
  const needle = search.toLowerCase();
  const all = COF_ENTRIES
    .filter((e) => e.kind === kind)
    .filter((e) =>
      !needle ||
      e.name[lang].toLowerCase().includes(needle) ||
      e.description[lang].toLowerCase().includes(needle) ||
      e.tags[lang].some((t) => t.toLowerCase().includes(needle)))
    .sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang));

  const start = (page - 1) * PAGE_SIZE;
  return {
    total: all.length,
    items: all.slice(start, start + PAGE_SIZE).map((e) => mapCof(e, lang)),
    pageSize: PAGE_SIZE,
  };
}

/* ───────────────────── Traduction FR (cache + IA) ────────────────────── */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

/** Fields sent to the model — everything else (numbers, keys) stays intact. */
interface Translatable {
  name: string;
  subtitle: string;
  description: string;
  sections: Section[];
}

const admin = () => createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function readCache(ids: string[], lang: Lang): Promise<Map<string, Translatable>> {
  const out = new Map<string, Translatable>();
  if (!ids.length) return out;
  const { data, error } = await admin()
    .from("compendium_translations")
    .select("entry_id, payload")
    .eq("lang", lang)
    .in("entry_id", ids);
  if (error) {
    console.error("translation cache read", error.message);
    return out;
  }
  for (const row of data ?? []) out.set(row.entry_id, row.payload as Translatable);
  return out;
}

async function writeCache(rows: { entry_id: string; lang: Lang; payload: Translatable }[]) {
  if (!rows.length) return;
  const { error } = await admin()
    .from("compendium_translations")
    .upsert(rows, { onConflict: "entry_id,lang" });
  if (error) console.error("translation cache write", error.message);
}

/** Translates a batch of entries with Lovable AI; returns id → translated fields. */
async function translateBatch(
  batch: { id: string; fields: Translatable }[],
): Promise<Map<string, Translatable>> {
  const out = new Map<string, Translatable>();
  if (!LOVABLE_API_KEY || !batch.length) return out;

  const payload = batch.map((b) => ({
    id: b.id,
    name: b.fields.name,
    subtitle: b.fields.subtitle,
    description: b.fields.description,
    sections: b.fields.sections,
  }));

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You translate tabletop RPG stat blocks from English to French. Keep the JSON structure, ids, " +
            "dice notation (2d6+3), numbers, units and markdown ** ** markers untouched. Use standard French " +
            "RPG terminology (hit points → points de vie, saving throw → jet de sauvegarde, DC → DD…). " +
            "Return ONLY a JSON array with the same ids and the fields name, subtitle, description, sections.",
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    }),
  });

  if (!res.ok) {
    console.error("AI translation failed", res.status, await res.text().catch(() => ""));
    return out;
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? "";
  const jsonText = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(jsonText);
    for (const item of Array.isArray(parsed) ? parsed : []) {
      if (!item?.id) continue;
      out.set(item.id, {
        name: String(item.name ?? ""),
        subtitle: String(item.subtitle ?? ""),
        description: String(item.description ?? ""),
        sections: Array.isArray(item.sections)
          ? item.sections.map((s: any) => ({ title: String(s?.title ?? ""), text: String(s?.text ?? "") }))
          : [],
      });
    }
  } catch (e) {
    console.error("AI translation parse", (e as Error).message);
  }
  return out;
}

/** Applies FR translations (cache-first) to upstream English entries. */
async function localize(entries: OfficialEntry[], lang: Lang): Promise<OfficialEntry[]> {
  if (lang !== "fr" || !entries.length) return entries;

  const cached = await readCache(entries.map((e) => e.id), lang);
  const missing = entries.filter((e) => !cached.has(e.id));

  if (missing.length) {
    // Small chunks keep the model response well inside its output budget.
    const chunks: OfficialEntry[][] = [];
    for (let i = 0; i < missing.length; i += 8) chunks.push(missing.slice(i, i + 8));

    const results = await Promise.all(chunks.map((chunk) =>
      translateBatch(chunk.map((e) => ({
        id: e.id,
        fields: { name: e.name, subtitle: e.subtitle, description: e.description, sections: e.sections },
      })))
    ));

    const fresh: { entry_id: string; lang: Lang; payload: Translatable }[] = [];
    for (const map of results) {
      for (const [id, fields] of map) {
        cached.set(id, fields);
        fresh.push({ entry_id: id, lang, payload: fields });
      }
    }
    // Fire-and-forget-ish: awaited, but failures never break the response.
    await writeCache(fresh).catch(() => {});
  }

  return entries.map((e) => {
    const tr = cached.get(e.id);
    if (!tr) return e;
    return {
      ...e,
      name: tr.name || e.name,
      subtitle: tr.subtitle || e.subtitle,
      description: tr.description || e.description,
      sections: tr.sections?.length ? tr.sections : e.sections,
    };
  });
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
    const lang: Lang = url.searchParams.get("lang") === "en" ? "en" : "fr";

    if (!["monsters", "spells", "items"].includes(kind)) {
      return json({ error: "kind invalide" }, 400);
    }

    if (system === "COF") return json(fetchCof(kind, search, page, lang));

    if (system === "D&D 5e") {
      const res = await fetchDnd5e(kind, search, page, lang);
      return json({ ...res, items: await localize(res.items, lang) });
    }

    if (system === "Pathfinder 2e") {
      const res = await fetchPathfinder(kind, search, page, lang);
      return json({ ...res, items: await localize(res.items, lang) });
    }

    return json({ error: "Système non supporté pour le contenu officiel" }, 400);
  } catch (e) {
    console.error("official-compendium", e);
    return json({ error: (e as Error).message ?? "Erreur inconnue" }, 502);
  }
});
