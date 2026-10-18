/** Resolve a direct character sheet without bypassing token access checks. */
export function getDirectTokenSheetId(
  isGlyphes: boolean,
  canSelect: boolean,
  token: { creatureType?: string; creatureId?: string },
): string | null {
  return canSelect && isGlyphes && token.creatureType === "character" && token.creatureId
    ? token.creatureId
    : null;
}