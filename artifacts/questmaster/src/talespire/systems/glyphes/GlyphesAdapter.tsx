// Mounts the real Aetheria VTT Glyphes sheet unchanged; only the save target differs.
import GlyphesPdfSheet from "@/components/characters/sheets/GlyphesPdfSheet";
import type { SheetAdapterProps } from "../types";

export default function GlyphesAdapter({ character, editable, onSheetSave }: SheetAdapterProps) {
  return <GlyphesPdfSheet character={character} editable={editable} onSave={onSheetSave} />;
}
