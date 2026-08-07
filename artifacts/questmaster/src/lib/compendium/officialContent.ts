// Client for the `official-compendium` edge function.
// Serves official (SRD / Nethys) content for D&D 5e and Pathfinder 2e only.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export type OfficialKind = "monsters" | "spells" | "items";

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
export const OFFICIAL_SYSTEMS = ["D&D 5e", "Pathfinder 2e"] as const;

export function hasOfficialContent(system: string): boolean {
  return (OFFICIAL_SYSTEMS as readonly string[]).includes(system);
}

export const OFFICIAL_SOURCE_LABEL: Record<string, string> = {
  "D&D 5e": "SRD 5.1 (Open5e — licence OGL)",
  "Pathfinder 2e": "Archives of Nethys (Paizo — Community Use / ORC)",
};

export async function fetchOfficialContent(
  params: { system: string; kind: OfficialKind; search?: string; page?: number },
  signal?: AbortSignal,
): Promise<OfficialPage> {
  const url = new URL(`${SUPABASE_URL}/functions/v1/official-compendium`);
  url.searchParams.set("system", params.system);
  url.searchParams.set("kind", params.kind);
  if (params.search) url.searchParams.set("search", params.search);
  url.searchParams.set("page", String(params.page ?? 1));

  const res = await fetch(url.toString(), {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Contenu officiel indisponible pour le moment.");
  return { items: data.items ?? [], total: data.total ?? 0, pageSize: data.pageSize ?? 40 };
}
