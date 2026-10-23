import { isGlyphesSystem } from "./game-systems/glyphes";

/**
 * Whether the quick pregen preview dialog (FOR/DEX/CON/INT/SAG/CHA, PV, Défense)
 * fits the given system. Glyphes uses dice-sized characteristics and wounds,
 * so that layout would misrepresent its sheets: no quick preview until a
 * dedicated Glyphes one exists.
 */
export function canPreviewPregen(system?: string | null): boolean {
  return !isGlyphesSystem(system);
}
