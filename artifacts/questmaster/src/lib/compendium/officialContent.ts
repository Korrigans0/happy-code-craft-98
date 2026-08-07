// Client for the `official-compendium` edge function.
// Serves official content for the open systems: D&D 5e (SRD 5.1), Pathfinder 2e
// (Archives of Nethys) and COF (bibliothèque intégrée).
// Every kind of content is available in French and in English.

const SUPABASE_URL =
  ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined) ||
  "https://snawpxrejmcxfbiiowxr.supabase.co";
const SUPABASE_ANON_KEY =
  ((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuYXdweHJlam1jeGZiaWlvd3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDgwNTEsImV4cCI6MjA4MjA4NDA1MX0.1knQmnMMqbD4XetxEFJ7YO8IZSN959KpNF1ZXyWTwz0";

export type OfficialKind = "monsters" | "spells" | "items";
export type OfficialLang = "fr" | "en";

export interface OfficialSection {
  title: string;
  text: string;
}

export interface OfficialEntry {
  id: string;
  name: string;
  kind: OfficialKind;
  subtitle: string;
  tags: string[];
  meta: Record<string, string>;
  abilities?: Record<string, number>;
  description: string;
  sections: OfficialSection[];
  source: string;
  url?: string;
}

export interface OfficialPage {
  items: OfficialEntry[];
  total: number;
  pageSize: number;
}

/** Systems that expose an official (open-licensed) content library. */
export const OFFICIAL_SYSTEMS = ["D&D 5e", "Pathfinder 2e", "COF"] as const;

export function hasOfficialContent(system: string): boolean {
  return (OFFICIAL_SYSTEMS as readonly string[]).includes(system);
}

export const OFFICIAL_SOURCE_LABEL: Record<string, Record<OfficialLang, string>> = {
  "D&D 5e": {
    fr: "SRD 5.1 (Open5e — licence OGL)",
    en: "SRD 5.1 (Open5e — OGL licence)",
  },
  "Pathfinder 2e": {
    fr: "Archives of Nethys (Paizo — Community Use / ORC)",
    en: "Archives of Nethys (Paizo — Community Use / ORC)",
  },
  COF: {
    fr: "Compendium COF intégré (contenu original Aetheria VTT)",
    en: "Built-in COF compendium (original Aetheria VTT content)",
  },
};

export function officialSourceLabel(system: string, lang: OfficialLang): string {
  return OFFICIAL_SOURCE_LABEL[system]?.[lang] ?? (lang === "fr" ? "Contenu officiel" : "Official content");
}

export async function fetchOfficialContent(
  params: { system: string; kind: OfficialKind; search?: string; page?: number; lang?: OfficialLang },
  signal?: AbortSignal,
): Promise<OfficialPage> {
  const url = new URL(`${SUPABASE_URL}/functions/v1/official-compendium`);
  url.searchParams.set("system", params.system);
  url.searchParams.set("kind", params.kind);
  if (params.search) url.searchParams.set("search", params.search);
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("lang", params.lang ?? "fr");

  const res = await fetch(url.toString(), {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error ||
      (params.lang === "en"
        ? "Official content is unavailable right now."
        : "Contenu officiel indisponible pour le moment."),
    );
  }
  return { items: data.items ?? [], total: data.total ?? 0, pageSize: data.pageSize ?? 40 };
}
