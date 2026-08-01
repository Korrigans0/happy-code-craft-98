// ============================================================
// GÉOMÉTRIE DE GRILLE — AETHERIA VTT
// Fichier : src/lib/vtt/grid.ts
//
// Module unique regroupant toute la logique de coordonnées pour les
// trois modes de grille : carrée, hexagonale (pointy/flat) et libre.
// Fonctions pures — aucun état, aucune dépendance React/Canvas.
// ============================================================

export type GridType = "square" | "hex" | "none";
export type HexOrientation = "pointy" | "flat";
export type GridUnitLabel = "m" | "ft";

export interface GridConfig {
  type: GridType;
  /** Orientation des hexagones (ignoré hors mode hex). */
  orientation: HexOrientation;
  /** Taille de base en pixels : côté de case (carré) / diamètre horizontal de référence (hex). */
  size: number;
  /** Échelle libre 0.1 → 4 (10 % → 400 %). */
  scale: number;
  /** Unités de jeu représentées par une case / un hexagone. */
  unitsPerCell: number;
  unitLabel: GridUnitLabel;
  /** Mode libre uniquement : pixels correspondant à une unité de jeu. */
  pixelsPerUnit: number;
  /** Affiche le tracé de la grille (n'affecte pas le snap). */
  showLines: boolean;
  /** Active l'accrochage des jetons. */
  snapEnabled: boolean;
}

/** Valeurs par défaut : reproduisent exactement le comportement historique. */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  type: "square",
  orientation: "pointy",
  size: 40,
  scale: 1,
  unitsPerCell: 1.5,
  unitLabel: "m",
  pixelsPerUnit: 40 / 1.5,
  showLines: true,
  snapEnabled: true,
};

export const GRID_TYPE_LABELS: Record<GridType, string> = {
  square: "Carrée",
  hex: "Hexagonale",
  none: "Aucune (libre)",
};

export const HEX_ORIENTATION_LABELS: Record<HexOrientation, string> = {
  pointy: "Pointe en haut",
  flat: "Côté plat en haut",
};

/** Normalise une valeur inconnue (JSONB, scène ancienne) en config complète. */
export function normalizeGridConfig(raw: unknown): GridConfig {
  const base = { ...DEFAULT_GRID_CONFIG };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Partial<GridConfig>;
  if (o.type === "square" || o.type === "hex" || o.type === "none") base.type = o.type;
  if (o.orientation === "pointy" || o.orientation === "flat") base.orientation = o.orientation;
  if (typeof o.size === "number" && o.size > 0) base.size = o.size;
  if (typeof o.scale === "number" && o.scale > 0) base.scale = Math.min(4, Math.max(0.1, o.scale));
  if (typeof o.unitsPerCell === "number" && o.unitsPerCell > 0) base.unitsPerCell = o.unitsPerCell;
  if (o.unitLabel === "m" || o.unitLabel === "ft") base.unitLabel = o.unitLabel;
  if (typeof o.pixelsPerUnit === "number" && o.pixelsPerUnit > 0) base.pixelsPerUnit = o.pixelsPerUnit;
  if (typeof o.showLines === "boolean") base.showLines = o.showLines;
  if (typeof o.snapEnabled === "boolean") base.snapEnabled = o.snapEnabled;
  return base;
}

export interface Point { x: number; y: number; }
export interface Viewport { left: number; top: number; right: number; bottom: number; }

/** Taille effective d'une case (ou largeur de référence d'un hexagone) en pixels. */
export function cellPixels(config: GridConfig): number {
  return config.size * config.scale;
}

/** Pixels correspondant à une unité de jeu, quel que soit le mode. */
export function pixelsPerUnit(config: GridConfig): number {
  if (config.type === "none") return config.pixelsPerUnit;
  return cellPixels(config) / config.unitsPerCell;
}

// ── HEXAGONES : conversions axiales / cubiques ────────────────
// Convention : `size` = distance centre → sommet (rayon circonscrit).

function hexRadius(config: GridConfig): number {
  // On aligne le "pas" horizontal (pointy) ou vertical (flat) sur cellPixels
  // afin qu'une grille hexagonale de même réglage occupe la même densité
  // visuelle qu'une grille carrée équivalente.
  return cellPixels(config) / Math.sqrt(3);
}

export interface Axial { q: number; r: number; }

/** Pixel → coordonnées axiales fractionnaires. */
function pixelToAxialRaw(config: GridConfig, x: number, y: number): { q: number; r: number } {
  const R = hexRadius(config);
  if (config.orientation === "pointy") {
    return {
      q: ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / R,
      r: ((2 / 3) * y) / R,
    };
  }
  return {
    q: ((2 / 3) * x) / R,
    r: ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / R,
  };
}

/** Arrondi cubique standard. */
function hexRound(qf: number, rf: number): Axial {
  const sf = -qf - rf;
  let q = Math.round(qf), r = Math.round(rf), s = Math.round(sf);
  const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return { q, r };
}

export function pixelToHex(config: GridConfig, x: number, y: number): Axial {
  const raw = pixelToAxialRaw(config, x, y);
  return hexRound(raw.q, raw.r);
}

export function hexToPixel(config: GridConfig, hex: Axial): Point {
  const R = hexRadius(config);
  if (config.orientation === "pointy") {
    return {
      x: R * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r),
      y: R * ((3 / 2) * hex.r),
    };
  }
  return {
    x: R * ((3 / 2) * hex.q),
    y: R * ((Math.sqrt(3) / 2) * hex.q + Math.sqrt(3) * hex.r),
  };
}

/** Distance en hexagones entre deux coordonnées axiales (via cubiques). */
export function hexDistance(a: Axial, b: Axial): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -dq - dr;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
}

/** Sommets d'un hexagone centré en `center`. */
export function hexCorners(config: GridConfig, center: Point): Point[] {
  const R = hexRadius(config);
  const offset = config.orientation === "pointy" ? -Math.PI / 2 : 0;
  const pts: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const a = offset + (Math.PI / 3) * i;
    pts.push({ x: center.x + R * Math.cos(a), y: center.y + R * Math.sin(a) });
  }
  return pts;
}

// ── API COMMUNE AUX 3 MODES ──────────────────────────────────

/** Centre de cellule le plus proche d'un point du monde. */
export function cellCenter(config: GridConfig, x: number, y: number): Point {
  const S = cellPixels(config);
  switch (config.type) {
    case "square":
      return { x: Math.floor(x / S) * S + S / 2, y: Math.floor(y / S) * S + S / 2 };
    case "hex":
      return hexToPixel(config, pixelToHex(config, x, y));
    default:
      return { x, y };
  }
}

/**
 * Accroche le coin supérieur gauche d'un jeton de côté `size`.
 * Le centre du jeton est amené au centre de la cellule (hex) ou aligné
 * sur la trame (carré, comportement historique).
 */
export function snapTopLeft(config: GridConfig, x: number, y: number, size: number): Point {
  if (!config.snapEnabled || config.type === "none") return { x, y };
  const S = cellPixels(config);
  if (config.type === "square") {
    return { x: Math.round(x / S) * S, y: Math.round(y / S) * S };
  }
  const center = cellCenter(config, x + size / 2, y + size / 2);
  return { x: center.x - size / 2, y: center.y - size / 2 };
}

/** Accroche un point libre (mesures, gabarits). */
export function snapPoint(config: GridConfig, x: number, y: number): Point {
  if (!config.snapEnabled || config.type === "none") return { x, y };
  if (config.type === "square") {
    const S = cellPixels(config);
    return { x: Math.round(x / S) * S, y: Math.round(y / S) * S };
  }
  return cellCenter(config, x, y);
}

/** Distance entre deux points, exprimée en cases / hexagones. */
export function distanceInCells(config: GridConfig, a: Point, b: Point): number {
  const S = cellPixels(config);
  switch (config.type) {
    case "hex":
      return hexDistance(pixelToHex(config, a.x, a.y), pixelToHex(config, b.x, b.y));
    case "none":
    case "square":
    default: {
      const dx = b.x - a.x, dy = b.y - a.y;
      return Math.sqrt(dx * dx + dy * dy) / S;
    }
  }
}

/** Distance entre deux points, exprimée en unités de jeu (m / ft). */
export function distanceInUnits(config: GridConfig, a: Point, b: Point): number {
  if (config.type === "none") {
    const dx = b.x - a.x, dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy) / Math.max(0.0001, config.pixelsPerUnit);
  }
  return distanceInCells(config, a, b) * config.unitsPerCell;
}

/** Convertit une longueur en pixels vers des unités de jeu. */
export function pixelsToUnits(config: GridConfig, px: number): number {
  return px / Math.max(0.0001, pixelsPerUnit(config));
}

/** Convertit un rayon en unités de jeu (lumières, vision, auras) en pixels. */
export function unitsToPixels(config: GridConfig, units: number): number {
  return units * pixelsPerUnit(config);
}

/** Libellé de distance adapté au mode courant. */
export function formatDistance(config: GridConfig, px: number): string {
  const units = pixelsToUnits(config, px);
  const u = config.unitLabel;
  if (config.type === "none") return `${units.toFixed(1)} ${u}`;
  const cells = px / cellPixels(config);
  const cellsLabel = config.type === "hex"
    ? `${Math.round(cells)} hex`
    : `${cells.toFixed(1)} case${cells >= 2 ? "s" : ""}`;
  return `${units.toFixed(1)} ${u} (${cellsLabel})`;
}

// ── RENDU ─────────────────────────────────────────────────────

export interface GridColors {
  minor: string;
  major: string;
}

/**
 * Dessine la grille sur sa propre couche. Fonction pure vis-à-vis de l'état
 * applicatif : elle ne lit que `config` et le viewport monde.
 * Le mode "none" et `showLines: false` ne dessinent rien.
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  config: GridConfig,
  view: Viewport,
  colors: GridColors,
  zoom: number,
): void {
  if (config.type === "none" || !config.showLines) return;
  const S = cellPixels(config);
  if (S <= 0) return;
  // Anti-surcharge : au-delà d'un certain nombre de cellules visibles,
  // le tracé devient illisible et coûteux.
  const approxCells = ((view.right - view.left) / S) * ((view.bottom - view.top) / S);
  if (approxCells > 40000) return;

  ctx.save();
  if (config.type === "square") {
    const startX = Math.floor(view.left / S) * S;
    const startY = Math.floor(view.top / S) * S;

    ctx.strokeStyle = colors.minor;
    ctx.lineWidth = 0.5 / zoom;
    ctx.beginPath();
    for (let x = startX; x <= view.right; x += S) {
      if (Math.round(x / S) % 5 !== 0) { ctx.moveTo(x, view.top); ctx.lineTo(x, view.bottom); }
    }
    for (let y = startY; y <= view.bottom; y += S) {
      if (Math.round(y / S) % 5 !== 0) { ctx.moveTo(view.left, y); ctx.lineTo(view.right, y); }
    }
    ctx.stroke();

    ctx.strokeStyle = colors.major;
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let x = startX; x <= view.right; x += S) {
      if (Math.round(x / S) % 5 === 0) { ctx.moveTo(x, view.top); ctx.lineTo(x, view.bottom); }
    }
    for (let y = startY; y <= view.bottom; y += S) {
      if (Math.round(y / S) % 5 === 0) { ctx.moveTo(view.left, y); ctx.lineTo(view.right, y); }
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Hexagones : on parcourt les cellules couvrant le viewport élargi.
  const R = hexRadius(config);
  const margin = R * 2;
  const corners = [
    pixelToAxialRaw(config, view.left - margin, view.top - margin),
    pixelToAxialRaw(config, view.right + margin, view.top - margin),
    pixelToAxialRaw(config, view.left - margin, view.bottom + margin),
    pixelToAxialRaw(config, view.right + margin, view.bottom + margin),
  ];
  const qMin = Math.floor(Math.min(...corners.map(c => c.q)));
  const qMax = Math.ceil(Math.max(...corners.map(c => c.q)));
  const rMin = Math.floor(Math.min(...corners.map(c => c.r)));
  const rMax = Math.ceil(Math.max(...corners.map(c => c.r)));

  ctx.strokeStyle = colors.minor;
  ctx.lineWidth = 0.6 / zoom;
  ctx.beginPath();
  for (let r = rMin; r <= rMax; r++) {
    for (let q = qMin; q <= qMax; q++) {
      const c = hexToPixel(config, { q, r });
      if (c.x < view.left - margin || c.x > view.right + margin) continue;
      if (c.y < view.top - margin || c.y > view.bottom + margin) continue;
      const pts = hexCorners(config, c);
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < 6; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** Trace le contour de l'hexagone sous un point (surbrillance de gabarit). */
export function strokeHexAt(
  ctx: CanvasRenderingContext2D,
  config: GridConfig,
  x: number,
  y: number,
): void {
  if (config.type !== "hex") return;
  const center = cellCenter(config, x, y);
  const pts = hexCorners(config, center);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < 6; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.stroke();
}

/** Hexagones couverts par un disque (gabarit de zone en mode hex). */
export function hexesInRadius(config: GridConfig, center: Point, radiusPx: number): Point[] {
  if (config.type !== "hex") return [];
  const R = hexRadius(config);
  const span = Math.ceil(radiusPx / R) + 1;
  const originHex = pixelToHex(config, center.x, center.y);
  const out: Point[] = [];
  for (let dq = -span; dq <= span; dq++) {
    for (let dr = -span; dr <= span; dr++) {
      const hex = { q: originHex.q + dq, r: originHex.r + dr };
      if (hexDistance(hex, originHex) > span) continue;
      const c = hexToPixel(config, hex);
      const dist = Math.hypot(c.x - center.x, c.y - center.y);
      if (dist <= radiusPx) out.push(c);
    }
  }
  return out;
}
