interface ChatRow {
  id: string;
  created_at?: string;
}

/** Older pages first, then the live window, without duplicates. */
export function mergeChatPages<T extends ChatRow>(older: T[], recent: T[]): T[] {
  if (older.length === 0) return recent;
  const recentIds = new Set(recent.map((m) => m.id));
  return [...older.filter((m) => !recentIds.has(m.id)), ...recent];
}

/**
 * Rows that slid out of the live window because newer messages arrived (older
 * than the new window's first row). Rows removed from inside the window, such
 * as deleted messages, are not retained.
 */
export function retainedFromWindow<T extends ChatRow>(previous: T[], next: T[]): T[] {
  const firstCreatedAt = next[0]?.created_at;
  if (!firstCreatedAt) return [];
  const nextIds = new Set(next.map((m) => m.id));
  return previous.filter(
    (m) =>
      !nextIds.has(m.id) &&
      !String(m.id).startsWith("optimistic-") &&
      !!m.created_at &&
      m.created_at < firstCreatedAt,
  );
}
