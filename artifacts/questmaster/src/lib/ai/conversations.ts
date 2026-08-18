// Persisted history for the GM AI assistant.
// One row per conversation, scoped to the campaign and to the GM who created it.

import { supabase } from "@/integrations/supabase/client";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiConversation {
  id: string;
  campaign_id: string;
  user_id: string;
  title: string;
  messages: AiChatMessage[];
  updated_at: string;
  created_at: string;
}

export interface AiConversationSummary {
  id: string;
  title: string;
  updated_at: string;
  preview: string;
}

const TABLE = "ai_conversations";
const db = () => (supabase as any).from(TABLE);

/** Builds a searchable plain-text transcript out of the message list. */
function buildTranscript(messages: AiChatMessage[]): string {
  return messages.map((m) => m.content).join("\n").slice(0, 20000);
}

/** Derives a short human title from the first user message. */
export function deriveTitle(messages: AiChatMessage[]): string {
  const first = messages.find((m) => m.role === "user")?.content?.trim();
  if (!first) return "Nouvelle conversation";
  const clean = first.replace(/\s+/g, " ");
  return clean.length > 60 ? `${clean.slice(0, 57)}…` : clean;
}

export const aiConversationsApi = {
  /** Lists the GM's conversations for a campaign, optionally filtered by a search term. */
  async list(campaignId: string, search = ""): Promise<AiConversationSummary[]> {
    let query = db()
      .select("id, title, messages, updated_at")
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: false })
      .limit(100);

    const term = search.trim();
    if (term) {
      const escaped = term.replace(/[,%()]/g, " ").trim();
      if (escaped) query = query.or(`title.ilike.%${escaped}%,transcript.ilike.%${escaped}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: any) => {
      const messages: AiChatMessage[] = Array.isArray(row.messages) ? row.messages : [];
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
      return {
        id: row.id,
        title: row.title,
        updated_at: row.updated_at,
        preview: lastAssistant.replace(/[#*_`>]/g, "").replace(/\s+/g, " ").slice(0, 120),
      };
    });
  },

  async get(id: string): Promise<AiConversation | null> {
    const { data, error } = await db().select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, messages: Array.isArray(data.messages) ? data.messages : [] } as AiConversation;
  },

  /** Creates a conversation and returns its id. */
  async create(campaignId: string, messages: AiChatMessage[]): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error("Session expirée, reconnectez-vous.");

    const { data, error } = await db()
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        title: deriveTitle(messages),
        messages,
        transcript: buildTranscript(messages),
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  },

  async saveMessages(id: string, messages: AiChatMessage[]): Promise<void> {
    const { error } = await db()
      .update({ messages, transcript: buildTranscript(messages) })
      .eq("id", id);
    if (error) throw error;
  },

  async rename(id: string, title: string): Promise<void> {
    const { error } = await db().update({ title: title.slice(0, 120) }).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await db().delete().eq("id", id);
    if (error) throw error;
  },
};
