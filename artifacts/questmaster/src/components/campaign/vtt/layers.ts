// Définitions canoniques des 9 calques VTT (Phase 2 du plan de construction).
//
// Chaque scène / état tabletop possède un dictionnaire `layers` indexé par
// `LayerId`. Le renderer consommera progressivement ces métadonnées pour
// filtrer/afficher les éléments. Les valeurs par défaut sont alignées avec la
// migration `20260624120000_tabletop_layers.sql` pour rester rétro-compatibles.

import {
  Mountain, Trees, Package, Users, Sparkles, Sun, BrickWall, Cloud, Crown,
  type LucideIcon,
} from "lucide-react";

export type LayerId =
  | "background" | "decor" | "objects" | "tokens" | "effects"
  | "lights" | "walls" | "fog" | "gm_ui";

export interface LayerConfig {
  visible: boolean;
  locked: boolean;
  /** Si false, le calque est masqué pour les joueurs. */
  pjVisible: boolean;
  opacity: number;
  order: number;
}

export type LayersState = Record<LayerId, LayerConfig>;

export interface LayerMeta {
  id: LayerId;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Calques que les joueurs ne devraient jamais voir par défaut. */
  gmOnlyByDefault: boolean;
}

export const LAYER_ORDER: LayerId[] = [
  "background", "decor", "objects", "tokens", "effects",
  "lights", "walls", "fog", "gm_ui",
];

export const LAYER_META: Record<LayerId, LayerMeta> = {
  background: { id: "background", label: "Fond de carte", description: "Image principale, grille.", icon: Mountain,  gmOnlyByDefault: false },
  decor:      { id: "decor",      label: "Décor",         description: "Éléments décoratifs fixes.", icon: Trees,     gmOnlyByDefault: false },
  objects:    { id: "objects",    label: "Objets",        description: "Coffres, pièges, marqueurs.", icon: Package,  gmOnlyByDefault: false },
  tokens:     { id: "tokens",     label: "Jetons",        description: "Personnages, créatures, PNJ.", icon: Users,   gmOnlyByDefault: false },
  effects:    { id: "effects",    label: "Effets",        description: "Sorts, zones, dessins.",     icon: Sparkles, gmOnlyByDefault: false },
  lights:     { id: "lights",     label: "Lumières",      description: "Sources lumineuses.",         icon: Sun,      gmOnlyByDefault: false },
  walls:      { id: "walls",      label: "Murs",          description: "Murs dynamiques, portes.",    icon: BrickWall, gmOnlyByDefault: true },
  fog:        { id: "fog",        label: "Brouillard",    description: "Brouillard de guerre.",       icon: Cloud,    gmOnlyByDefault: false },
  gm_ui:      { id: "gm_ui",      label: "MJ uniquement", description: "Notes & marqueurs MJ.",       icon: Crown,    gmOnlyByDefault: true },
};

export const DEFAULT_LAYERS: LayersState = LAYER_ORDER.reduce((acc, id, index) => {
  acc[id] = {
    visible: true,
    locked: false,
    pjVisible: !LAYER_META[id].gmOnlyByDefault,
    opacity: 1,
    order: index,
  };
  return acc;
}, {} as LayersState);

/** Normalise une valeur potentiellement partielle/inconnue en `LayersState` complet. */
export function normalizeLayers(raw: unknown): LayersState {
  const base: LayersState = { ...DEFAULT_LAYERS };
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, Partial<LayerConfig>>;
  for (const id of LAYER_ORDER) {
    const partial = obj[id];
    if (!partial) continue;
    base[id] = {
      visible: typeof partial.visible === "boolean" ? partial.visible : base[id].visible,
      locked: typeof partial.locked === "boolean" ? partial.locked : base[id].locked,
      pjVisible: typeof partial.pjVisible === "boolean" ? partial.pjVisible : base[id].pjVisible,
      opacity: typeof partial.opacity === "number" ? Math.min(1, Math.max(0, partial.opacity)) : base[id].opacity,
      order: typeof partial.order === "number" ? partial.order : base[id].order,
    };
  }
  return base;
}

/** Renvoie la liste ordonnée des calques (filtrée si vue PJ). */
export function getOrderedLayers(layers: LayersState, opts?: { forPlayer?: boolean }): Array<{ id: LayerId; config: LayerConfig; meta: LayerMeta }> {
  return LAYER_ORDER
    .map((id) => ({ id, config: layers[id], meta: LAYER_META[id] }))
    .filter(({ config }) => {
      if (!config.visible) return false;
      if (opts?.forPlayer && !config.pjVisible) return false;
      return true;
    })
    .sort((a, b) => a.config.order - b.config.order);
}
