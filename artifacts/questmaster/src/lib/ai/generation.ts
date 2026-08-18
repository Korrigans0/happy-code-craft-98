// GM AI helpers backed by edge functions: structured codex generation and
// session journals. Both are GM-only server-side; the client only renders.

import { supabase } from "@/integrations/supabase/client";
import type { EntityKind } from "@/lib/codex/types";
import type { EntityInput } from "@/lib/codex/api";

export interface GeneratedSection {
  title: string;
  body: string;
}

export interface GeneratedEntity {
  name: string;
  summary: string;
  sections: GeneratedSection[];
  hooks: string[];
  secret: string;
  tags: string[];
}

function invokeError(error: any, data: any): Error {
  return new Error(data?.error || error?.message || "L'IA n'a pas pu répondre.");
}

/** Asks the model for a fully structured codex sheet of the given kind. */
export async function generateEntity(
  campaignId: string,
  kind: EntityKind,
  brief: string,
): Promise<GeneratedEntity> {
  const { data, error } = await supabase.functions.invoke("mj-generate-entity", {
    body: { campaignId, kind, brief },
  });
  if (error || !data?.entity) throw invokeError(error, data);
  const e = data.entity as Partial<GeneratedEntity>;
  return {
    name: (e.name ?? "Sans nom").slice(0, 120),
    summary: (e.summary ?? "").slice(0, 200),
    sections: Array.isArray(e.sections) ? e.sections.filter((s) => s?.title && s?.body) : [],
    hooks: Array.isArray(e.hooks) ? e.hooks.filter(Boolean) : [],
    secret: e.secret ?? "",
    tags: Array.isArray(e.tags) ? e.tags.filter(Boolean).slice(0, 8) : [],
  };
}

/** Flattens a generated sheet into the codex entity payload. */
export function toEntityInput(kind: EntityKind, gen: GeneratedEntity): EntityInput {
  const description = gen.sections.map((s) => `**${s.title}**\n${s.body}`).join("\n\n");
  return {
    kind,
    name: gen.name,
    summary: gen.summary,
    content: {
      description,
      sections: gen.sections,
      hooks: gen.hooks,
      secret: gen.secret,
      source: "ai",
    },
    tags: [...new Set(["ia", ...gen.tags.map((t) => t.toLowerCase())])],
    visibility: "gm_only",
  };
}

/** Writes the session journal from the real table log. */
export async function generateSessionRecap(
  sessionId: string,
  audience: "players" | "gm" = "players",
): Promise<{ recap: string; messageCount: number }> {
  const { data, error } = await supabase.functions.invoke("session-journal", {
    body: { sessionId, audience },
  });
  if (error || !data?.recap) throw invokeError(error, data);
  return { recap: data.recap as string, messageCount: data.messageCount ?? 0 };
}
