// Older chat pages loaded on demand above the live window of recent messages.
// The recent window stays owned by the shared react-query cache (realtime +
// polling); this hook only keeps the extra pages the reader asked for.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { campaignsApi, CHAT_PAGE_SIZE } from "@/lib/api";
import { mergeChatPages } from "./mergeChatPages";

interface ChatRow {
  id: string;
  created_at: string;
}

export function useChatHistory<T extends ChatRow>(campaignId: string, recent: T[]) {
  const [older, setOlder] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState(false);
  const requestRef = useRef(0);

  // New campaign: forget pages of the previous one.
  useEffect(() => {
    requestRef.current++;
    setOlder([]);
    setExhausted(false);
    setError(false);
    setLoading(false);
  }, [campaignId]);

  // A live window shorter than one page means nothing older exists (fresh
  // campaign, or the chat was just cleared): drop stale older pages.
  const recentIsComplete = recent.length < CHAT_PAGE_SIZE;
  useEffect(() => {
    if (recentIsComplete) setOlder([]);
  }, [recentIsComplete]);

  const messages = useMemo(() => mergeChatPages(older, recent), [older, recent]);
  const hasMore = !recentIsComplete && !exhausted;

  const loadOlder = useCallback(async () => {
    if (loading || !hasMore) return;
    const oldest = messages[0];
    if (!oldest?.created_at || String(oldest.id).startsWith("optimistic-")) return;
    const request = ++requestRef.current;
    setLoading(true);
    setError(false);
    try {
      const page = (await campaignsApi.getMessagesBefore(campaignId, oldest.created_at)) as T[];
      if (request !== requestRef.current) return;
      setOlder((prev) => mergeChatPages(page, prev));
      if (page.length < CHAT_PAGE_SIZE) setExhausted(true);
    } catch {
      if (request === requestRef.current) setError(true);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [campaignId, hasMore, loading, messages]);

  return { messages, hasMore, loading, error, loadOlder };
}
