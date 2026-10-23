// Live database updates omit large columns that did not change (Postgres
// "unchanged TOAST" values): an update touching only `initiative` arrives
// without `tokens`, `scenes`, `layers` or even `map_image_url`. A missing
// column therefore means "unchanged" and must never be read as "empty".

/**
 * Fills every column absent from a realtime row with the last known full row,
 * so a partial payload can be normalized without wiping tokens, map or scenes.
 */
export function completeRealtimeRow(
  row: Record<string, unknown>,
  previous: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!previous) return { ...row };
  const merged: Record<string, unknown> = { ...previous };
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) merged[key] = value;
  }
  return merged;
}
