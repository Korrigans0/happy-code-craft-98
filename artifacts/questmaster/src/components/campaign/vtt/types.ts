// ============================================================
// TYPES VTT — Aetheria VTT
// Fichier : artifacts/questmaster/src/components/campaign/vtt/types.ts
// ============================================================

export type Tool =
  | "pencil" | "eraser" | "line" | "rect" | "circle" | "text"
  | "move" | "token" | "cone" | "zone" | "fogReveal" | "ping"
  | "measure" | "wall" | "wallDoor" | "wallDelete"
  | "light" | "lightDelete";

export interface DrawAction {
  id: string;
  type: Tool;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  text?: string;
  layer: string;
  coneAngle?: number;
}

export interface TokenItem {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  sizeUnits: number;
  rotation: number;
  color: string;
  label: string;
  layer: string;
  visible: boolean;
  creatureId?: string;
  creatureType?: "wa_creature" | "monster" | "character" | "aetheria_creature";
  hp?: number;
  maxHp?: number;
  pe?: number;
  maxPe?: number;
  ac?: number;
  imageUrl?: string;
  conditions?: string[];
  auraSize?: number;
  auraColor?: string;
  isHidden?: boolean;
  isBoss?: boolean;
  // Vision dynamique : rayon en mètres (0 ou undefined = pas de vision propre)
  visionRadius?: number;
  // Propriétaire (user.id) — utilisé pour les permissions côté client.
  ownerUserId?: string;
  // Notes rapides éditables depuis la fiche du token.
  notes?: string;
}

export interface MapLayer {
  id: string;
  name: string;
  type: "map" | "tokens" | "drawings" | "fog";
  visible: boolean;
  locked: boolean;
  opacity: number;
  imageUrl?: string;
}

export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  modifier: number;
  hp: number;
  maxHp: number;
  ac?: number;
  conditions: string[];
  tokenId?: string;
  type: "player" | "monster" | "npc";
  color?: string;
}

export interface ContextMenuState {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
  type: "canvas" | "token";
  tokenId?: string;
}

export interface VTTScene {
  id: string;
  name: string;
  mapImageUrl?: string;
  tokens: TokenItem[];
  drawings: DrawAction[];
  walls?: Wall[];
  createdAt: number;
}

// ── MURS DYNAMIQUES ─────────────────────────────────────────

export type WallType =
  | "solid"    // Mur plein — bloque vision + mouvement
  | "door"     // Porte — peut s'ouvrir/fermer
  | "window"   // Fenêtre — bloque mouvement, pas vision
  | "terrain"; // Terrain difficile — ralentit mais ne bloque pas

export interface Wall {
  id: string;
  type: WallType;
  // Deux points définissent un segment de mur
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  // Porte
  isOpen?: boolean;
  // Visuel
  color?: string;
}

// Couleurs des murs par type — bien distinctes les unes des autres
export const WALL_COLORS: Record<WallType, string> = {
  solid:   "#ef4444", // Rouge vif — mur solide
  door:    "#a855f7", // Violet — porte (fermée)
  window:  "#38bdf8", // Cyan — fenêtre
  terrain: "#22c55e", // Vert — terrain difficile
};

// Couleur d'une porte ouverte
export const DOOR_OPEN_COLOR = "#c084fc"; // Violet clair

export const WALL_LABELS: Record<WallType, string> = {
  solid:   "Mur",
  door:    "Porte",
  window:  "Fenêtre",
  terrain: "Terrain difficile",
};

// ── LUMIÈRES DYNAMIQUES ─────────────────────────────────────

export type LightPreset = "torch" | "lantern" | "candle" | "daylight" | "darkvision" | "custom";

export interface LightSource {
  id: string;
  // Position fixe (si non attachée à un token)
  x?: number;
  y?: number;
  // Ou attachée à un token (suit ses déplacements)
  tokenId?: string;
  // Rayons en mètres
  brightRadius: number;  // pleine lumière
  dimRadius: number;     // pénombre (au-delà du bright)
  color: string;         // hex (ex: "#ffb86b")
  intensity: number;     // 0..1
  preset?: LightPreset;
  // Active / inactive (ex: torche éteinte)
  enabled: boolean;
}

export const LIGHT_PRESETS: Record<Exclude<LightPreset, "custom">, Omit<LightSource, "id" | "x" | "y" | "tokenId" | "enabled">> = {
  torch:      { brightRadius: 4.5, dimRadius: 9,  color: "#ffb86b", intensity: 1,    preset: "torch" },
  lantern:    { brightRadius: 9,   dimRadius: 18, color: "#ffd58a", intensity: 1,    preset: "lantern" },
  candle:     { brightRadius: 1.5, dimRadius: 3,  color: "#ffcc88", intensity: 0.9,  preset: "candle" },
  daylight:   { brightRadius: 18,  dimRadius: 36, color: "#fff8e7", intensity: 1,    preset: "daylight" },
  darkvision: { brightRadius: 0,   dimRadius: 18, color: "#5a6675", intensity: 0.6,  preset: "darkvision" },
};

export const LIGHT_PRESET_LABELS: Record<Exclude<LightPreset, "custom">, string> = {
  torch:      "Torche",
  lantern:    "Lanterne",
  candle:     "Bougie",
  daylight:   "Lumière du jour",
  darkvision: "Vision nocturne",
};

// ── CONDITIONS ───────────────────────────────────────────────

export const CONDITIONS = [
  { id: "blind",          label: "Aveuglé",      emoji: "🙈" },
  { id: "charmed",        label: "Charmé",        emoji: "💕" },
  { id: "frightened",     label: "Effrayé",       emoji: "😱" },
  { id: "grappled",       label: "Empoigné",      emoji: "🤜" },
  { id: "incapacitated",  label: "Incapacité",    emoji: "💫" },
  { id: "invisible",      label: "Invisible",     emoji: "👻" },
  { id: "paralyzed",      label: "Paralysé",      emoji: "⚡" },
  { id: "poisoned",       label: "Empoisonné",    emoji: "☠️" },
  { id: "prone",          label: "À terre",       emoji: "⬇️" },
  { id: "restrained",     label: "Entravé",       emoji: "⛓️" },
  { id: "stunned",        label: "Étourdi",       emoji: "⭐" },
  { id: "unconscious",    label: "Inconscient",   emoji: "💤" },
  { id: "concentration",  label: "Concentration", emoji: "🧘" },
  { id: "blessed",        label: "Béni",          emoji: "✨" },
  { id: "cursed",         label: "Maudit",        emoji: "🌑" },
  { id: "hasted",         label: "Accéléré",      emoji: "💨" },
] as const;

export type ConditionId = (typeof CONDITIONS)[number]["id"];

export const AURA_COLORS = [
  "#f59e0b88", "#ef444488", "#22c55e88",
  "#3b82f688", "#a855f788", "#ec489988",
  "#ffffff44", "#00000066",
];

export function rollDice(formula: string): {
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
} | null {
  const clean = formula.trim().replace(/\s+/g, "");
  const match = clean.match(/^(\d+)?[dD](\d+)([+-]\d+)?$/);
  if (!match) return null;
  const count = parseInt(match[1] || "1");
  const sides = parseInt(match[2]);
  const modifier = parseInt(match[3] || "0");
  const rolls = Array.from({ length: count }, () =>
    Math.floor(Math.random() * sides) + 1
  );
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  return { formula: clean, rolls, modifier, total };
}
