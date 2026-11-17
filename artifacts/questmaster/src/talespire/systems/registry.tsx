// One entry per game system integrated in TaleSpire. Each system keeps its own sheet,
// data and rules; adding a system means adding an adapter here, nothing else changes.
import { lazy, type ComponentType } from "react";
import type { SheetAdapterProps } from "./types";

const GlyphesAdapter = lazy(() => import("./glyphes/GlyphesAdapter"));

export interface TaleSpireSystem { id: string; label: string; Sheet: ComponentType<SheetAdapterProps> | null }

const SYSTEMS: Record<string, TaleSpireSystem> = {
  glyphes: { id: "Glyphes", label: "Glyphes", Sheet: GlyphesAdapter },
  aetheria: { id: "Aetheria", label: "Aetheria", Sheet: null },      // future integration
  dnd5e: { id: "D&D 5e", label: "D&D 5e", Sheet: null },             // future integration
};

export function systemFor(system: string | null | undefined): TaleSpireSystem | null {
  const key = (system ?? "").toLowerCase();
  return Object.values(SYSTEMS).find((s) => s.id.toLowerCase() === key) ?? null;
}
