// Glyphes check results as shared campaign chat messages.
// The chat (campaign_messages) is the single persisted source of truth for
// check results: every participant reads the same row, it survives reloads,
// and the realtime broadcast only speeds up the live journal.

export interface GlyphesLogEntry {
  id: string;
  t: number;
  author: string;
  label: string;
  dice: { value: number; cancelled?: boolean; ignored?: boolean }[];
  dieSize: number;
  tdLabel: string;
  tdScore: number;
  rank: number;
  successes: number;
  isSuccess: boolean;
  isCoupDEclat: boolean;
  heroismGained: number;
  /** Wounds inflicted when the entry comes from an attack. */
  wounds?: number;
  target?: string;
}

/** Key under which the structured entry is stored in campaign_messages.metadata. */
export const GLYPHES_METADATA_KEY = "glyphes";
/** Existing chat message type used for every dice result. */
export const GLYPHES_MESSAGE_TYPE = "dice_roll";

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** Plain-text fallback stored in the message content (readable everywhere). */
export function glyphesChatContent(entry: GlyphesLogEntry): string {
  const values = entry.dice
    .map((d) => (d.ignored || d.cancelled ? `~${d.value}~` : String(d.value)))
    .join(", ");
  const parts = [
    `🎲 ${entry.label} — ${entry.dice.length}D${entry.dieSize}${entry.target ? ` → ${entry.target}` : ""} : [${values}]`,
    `TD ${entry.tdLabel} (${entry.tdScore}+) · Rang ${entry.rank} · ${plural(entry.successes, "réussite")} — ${entry.isSuccess ? "✓ Réussite" : "✗ Échec"}`,
  ];
  if (entry.isCoupDEclat) {
    parts.push(`✨ Coup d'éclat${entry.heroismGained ? ` — +${entry.heroismGained} héroïsme` : ""}`);
  }
  if (entry.wounds !== undefined) parts.push(plural(entry.wounds, "blessure"));
  return parts.join("\n");
}

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

/** Reads a Glyphes entry from a chat message row; null when absent or malformed. */
export function glyphesEntryFromMessage(msg: unknown): GlyphesLogEntry | null {
  const row = msg as { metadata?: Record<string, unknown> | null; created_at?: string } | null;
  const raw = row?.metadata?.[GLYPHES_METADATA_KEY] as Partial<GlyphesLogEntry> | undefined;
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.id !== "string" || !Array.isArray(raw.dice) || !isInt(raw.dieSize)) return null;
  if (!raw.dice.every((d) => d && isInt(d.value))) return null;
  if (!isInt(raw.successes) || !isInt(raw.tdScore) || !isInt(raw.rank)) return null;
  const createdAt = row?.created_at ? Date.parse(row.created_at) : NaN;
  return {
    id: raw.id,
    t: isInt(raw.t) ? raw.t : Number.isFinite(createdAt) ? createdAt : 0,
    author: typeof raw.author === "string" ? raw.author : "",
    label: typeof raw.label === "string" ? raw.label : "Épreuve",
    dice: raw.dice.map((d) => ({ value: d.value, cancelled: !!d.cancelled, ignored: !!d.ignored })),
    dieSize: raw.dieSize,
    tdLabel: typeof raw.tdLabel === "string" ? raw.tdLabel : "",
    tdScore: raw.tdScore,
    rank: raw.rank,
    successes: raw.successes,
    isSuccess: !!raw.isSuccess,
    isCoupDEclat: !!raw.isCoupDEclat,
    heroismGained: isInt(raw.heroismGained) ? raw.heroismGained : 0,
    wounds: isInt(raw.wounds) ? raw.wounds : undefined,
    target: typeof raw.target === "string" ? raw.target : undefined,
  };
}

/** Chat message payload for one check attempt (one attempt = one message). */
export function glyphesChatMessage(entry: GlyphesLogEntry) {
  return {
    content: glyphesChatContent(entry),
    message_type: GLYPHES_MESSAGE_TYPE,
    metadata: { [GLYPHES_METADATA_KEY]: entry },
  };
}

/**
 * Merges persisted entries (chat history) with entries received live, newest
 * first, keeping a single copy per entry id.
 */
export function mergeGlyphesEntries(
  persisted: GlyphesLogEntry[],
  live: GlyphesLogEntry[],
  max = 50,
): GlyphesLogEntry[] {
  const byId = new Map<string, GlyphesLogEntry>();
  for (const e of [...live, ...persisted]) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => b.t - a.t).slice(0, max);
}
