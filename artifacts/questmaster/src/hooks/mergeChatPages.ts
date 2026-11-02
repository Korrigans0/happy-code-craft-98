interface ChatRow {
  id: string;
}

/** Older pages first, then the live window, without duplicates. */
export function mergeChatPages<T extends ChatRow>(older: T[], recent: T[]): T[] {
  if (older.length === 0) return recent;
  const recentIds = new Set(recent.map((m) => m.id));
  return [...older.filter((m) => !recentIds.has(m.id)), ...recent];
}
