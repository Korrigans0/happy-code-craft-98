// ============================================================
// GÉNÉRATEUR DE CARTE PROCÉDURALE — Aetheria VTT
// Fichier : src/lib/vtt/mapGenerator.ts
//
// Module pur (pas de React) : génère une grille logique de cellules
// (sol / vide / porte), la rend en image (JPEG data URL) et en déduit
// des segments de murs dynamiques exploitables par le moteur VTT.
// ============================================================

import type { Wall } from "@/components/campaign/vtt/types";

export type MapGenKind = "dungeon" | "cave" | "forest" | "ruins";

export const MAP_GEN_LABELS: Record<MapGenKind, string> = {
  dungeon: "Donjon",
  cave: "Caverne",
  forest: "Forêt",
  ruins: "Ruines",
};

export const MAP_GEN_DESCRIPTIONS: Record<MapGenKind, string> = {
  dungeon: "Salles rectangulaires reliées par des couloirs et des portes.",
  cave: "Cavités organiques creusées par érosion cellulaire.",
  forest: "Clairières, sentiers et bosquets d'arbres denses.",
  ruins: "Vestiges effondrés, pans de murs et cours envahies.",
};

export interface MapGenOptions {
  kind: MapGenKind;
  /** Largeur en cases. */
  cols: number;
  /** Hauteur en cases. */
  rows: number;
  /** Taille d'une case en pixels (doit correspondre à la grille du plateau). */
  cellSize: number;
  /** Graine déterministe. */
  seed: number;
  /** Densité / complexité 0 → 1. */
  density: number;
  /** Génère aussi les murs dynamiques (vision & collisions). */
  withWalls: boolean;
}

export const DEFAULT_MAP_GEN_OPTIONS: MapGenOptions = {
  kind: "dungeon",
  cols: 40,
  rows: 28,
  cellSize: 40,
  seed: 1,
  density: 0.5,
  withWalls: true,
};

// 0 = roche / vide, 1 = sol praticable, 2 = porte
export type CellKind = 0 | 1 | 2;

export interface GeneratedMap {
  grid: CellKind[][];
  cols: number;
  rows: number;
  cellSize: number;
  /** Image de fond prête à être posée sur le calque « carte ». */
  dataUrl: string;
  /** Murs dynamiques (coordonnées monde en pixels). */
  walls: Wall[];
  /** Points de départ suggérés (centre des salles principales), en pixels. */
  spawnPoints: { x: number; y: number }[];
}

// ── RNG déterministe (mulberry32) ───────────────────────────
function makeRng(seed: number) {
  let a = (seed >>> 0) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const randInt = (rng: Rng, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

function makeGrid(cols: number, rows: number, fill: CellKind): CellKind[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

const inBounds = (g: CellKind[][], x: number, y: number) =>
  y >= 0 && y < g.length && x >= 0 && x < g[0].length;

// ── Génération : donjon (salles + couloirs) ─────────────────
interface Room { x: number; y: number; w: number; h: number }

function generateDungeon(o: MapGenOptions, rng: Rng) {
  const grid = makeGrid(o.cols, o.rows, 0);
  const rooms: Room[] = [];
  const target = Math.max(4, Math.round((o.cols * o.rows) / 90 * (0.6 + o.density)));
  const maxW = Math.max(4, Math.min(12, Math.floor(o.cols / 4)));
  const maxH = Math.max(4, Math.min(10, Math.floor(o.rows / 4)));

  for (let attempt = 0; attempt < target * 30 && rooms.length < target; attempt++) {
    const w = randInt(rng, 3, maxW);
    const h = randInt(rng, 3, maxH);
    const x = randInt(rng, 1, o.cols - w - 2);
    const y = randInt(rng, 1, o.rows - h - 2);
    const room: Room = { x, y, w, h };
    const overlaps = rooms.some(
      r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y,
    );
    if (overlaps) continue;
    rooms.push(room);
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) grid[j][i] = 1;
  }

  const centers = rooms.map(r => ({
    x: r.x + Math.floor(r.w / 2),
    y: r.y + Math.floor(r.h / 2),
  }));

  const carveH = (x1: number, x2: number, y: number) => {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) if (grid[y][x] === 0) grid[y][x] = 1;
  };
  const carveV = (y1: number, y2: number, x: number) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) if (grid[y][x] === 0) grid[y][x] = 1;
  };

  for (let i = 1; i < centers.length; i++) {
    const a = centers[i - 1];
    const b = centers[i];
    if (rng() < 0.5) { carveH(a.x, b.x, a.y); carveV(a.y, b.y, b.x); }
    else { carveV(a.y, b.y, a.x); carveH(a.x, b.x, b.y); }
  }
  // Quelques boucles pour éviter l'arbre strictement linéaire
  const loops = Math.round(centers.length * 0.25 * o.density);
  for (let i = 0; i < loops && centers.length > 2; i++) {
    const a = centers[randInt(rng, 0, centers.length - 1)];
    const b = centers[randInt(rng, 0, centers.length - 1)];
    if (a === b) continue;
    carveH(a.x, b.x, a.y); carveV(a.y, b.y, b.x);
  }

  // Portes : cellules de couloir accolées à une entrée de salle
  for (const r of rooms) {
    const edges: { x: number; y: number }[] = [];
    for (let x = r.x; x < r.x + r.w; x++) {
      edges.push({ x, y: r.y - 1 }, { x, y: r.y + r.h });
    }
    for (let y = r.y; y < r.y + r.h; y++) {
      edges.push({ x: r.x - 1, y }, { x: r.x + r.w, y });
    }
    const doorCells = edges.filter(c => inBounds(grid, c.x, c.y) && grid[c.y][c.x] === 1);
    if (doorCells.length && rng() < 0.85) {
      const d = doorCells[randInt(rng, 0, doorCells.length - 1)];
      grid[d.y][d.x] = 2;
    }
  }

  return { grid, spawnCells: centers };
}

// ── Génération : caverne (automate cellulaire) ──────────────
function generateCave(o: MapGenOptions, rng: Rng) {
  const fill = 0.52 - o.density * 0.12;
  let grid = makeGrid(o.cols, o.rows, 0);
  for (let y = 0; y < o.rows; y++) {
    for (let x = 0; x < o.cols; x++) {
      const border = x === 0 || y === 0 || x === o.cols - 1 || y === o.rows - 1;
      grid[y][x] = border ? 0 : rng() > fill ? 1 : 0;
    }
  }
  for (let step = 0; step < 5; step++) {
    const next = makeGrid(o.cols, o.rows, 0);
    for (let y = 0; y < o.rows; y++) {
      for (let x = 0; x < o.cols; x++) {
        if (x === 0 || y === 0 || x === o.cols - 1 || y === o.rows - 1) { next[y][x] = 0; continue; }
        let solid = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (grid[y + dy][x + dx] === 0) solid++;
        }
        next[y][x] = solid > 4 ? 0 : 1;
      }
    }
    grid = next;
  }

  // Ne conserver que la plus grande cavité, puis la relier au reste
  const regions = floodRegions(grid);
  regions.sort((a, b) => b.length - a.length);
  const main = new Set((regions[0] ?? []).map(c => `${c.x},${c.y}`));
  for (const region of regions.slice(1)) {
    if (region.length < 12) {
      for (const c of region) grid[c.y][c.x] = 0;
      continue;
    }
    // tunnel vers la cavité principale
    const from = region[randInt(rng, 0, region.length - 1)];
    let best = { x: 1, y: 1 }; let bestD = Infinity;
    for (const key of main) {
      const [mx, my] = key.split(",").map(Number);
      const d = Math.abs(mx - from.x) + Math.abs(my - from.y);
      if (d < bestD) { bestD = d; best = { x: mx, y: my }; }
    }
    let { x, y } = from;
    while (x !== best.x || y !== best.y) {
      if (x !== best.x) x += Math.sign(best.x - x);
      else y += Math.sign(best.y - y);
      if (inBounds(grid, x, y)) grid[y][x] = 1;
    }
  }

  const spawnCells = (regions[0] ?? []).filter((_, i) => i % Math.max(1, Math.floor((regions[0]?.length ?? 1) / 4)) === 0).slice(0, 4);
  return { grid, spawnCells };
}

function floodRegions(grid: CellKind[][]) {
  const rows = grid.length; const cols = grid[0].length;
  const seen = makeGrid(cols, rows, 0);
  const regions: { x: number; y: number }[][] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === 0 || seen[y][x]) continue;
      const stack = [{ x, y }]; const region: { x: number; y: number }[] = [];
      seen[y][x] = 1;
      while (stack.length) {
        const c = stack.pop()!;
        region.push(c);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = c.x + dx; const ny = c.y + dy;
          if (inBounds(grid, nx, ny) && !seen[ny][nx] && grid[ny][nx] !== 0) {
            seen[ny][nx] = 1; stack.push({ x: nx, y: ny });
          }
        }
      }
      regions.push(region);
    }
  }
  return regions;
}

// ── Génération : forêt (clairières + sentiers) ──────────────
function generateForest(o: MapGenOptions, rng: Rng) {
  const grid = makeGrid(o.cols, o.rows, 1);
  const clumps = Math.round(o.cols * o.rows * 0.02 * (0.5 + o.density));
  for (let i = 0; i < clumps; i++) {
    const cx = randInt(rng, 1, o.cols - 2);
    const cy = randInt(rng, 1, o.rows - 2);
    const r = randInt(rng, 1, 3);
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (!inBounds(grid, x, y)) continue;
      if (Math.hypot(x - cx, y - cy) <= r) grid[y][x] = 0;
    }
  }
  // Sentiers serpentants (toujours praticables)
  const paths = 2 + Math.round(o.density * 2);
  for (let p = 0; p < paths; p++) {
    let x = randInt(rng, 1, o.cols - 2);
    let y = p % 2 === 0 ? 0 : o.rows - 1;
    const dir = p % 2 === 0 ? 1 : -1;
    for (let step = 0; step < o.rows; step++) {
      for (let w = -1; w <= 1; w++) if (inBounds(grid, x + w, y)) grid[y][x + w] = 1;
      y += dir;
      x += randInt(rng, -1, 1);
      x = Math.max(1, Math.min(o.cols - 2, x));
      if (y < 0 || y >= o.rows) break;
    }
  }
  const spawnCells: { x: number; y: number }[] = [];
  for (let i = 0; i < 4; i++) {
    for (let tries = 0; tries < 60; tries++) {
      const x = randInt(rng, 1, o.cols - 2); const y = randInt(rng, 1, o.rows - 2);
      if (grid[y][x] === 1) { spawnCells.push({ x, y }); break; }
    }
  }
  return { grid, spawnCells };
}

// ── Génération : ruines (donjon érodé) ──────────────────────
function generateRuins(o: MapGenOptions, rng: Rng) {
  const base = generateDungeon({ ...o, density: Math.min(1, o.density + 0.2) }, rng);
  const grid = base.grid;
  // Érosion : on ouvre des brèches dans les murs et on effondre des dalles
  for (let y = 1; y < o.rows - 1; y++) {
    for (let x = 1; x < o.cols - 1; x++) {
      if (grid[y][x] === 0 && rng() < 0.16 + o.density * 0.12) {
        const neighbours = [grid[y - 1][x], grid[y + 1][x], grid[y][x - 1], grid[y][x + 1]];
        if (neighbours.some(n => n !== 0)) grid[y][x] = 1;
      } else if (grid[y][x] === 1 && rng() < 0.05) {
        grid[y][x] = 0;
      }
    }
  }
  return { grid, spawnCells: base.spawnCells };
}

// ── Murs dynamiques déduits de la grille ────────────────────
function buildWalls(grid: CellKind[][], cellSize: number): Wall[] {
  const rows = grid.length; const cols = grid[0].length;
  const walls: Wall[] = [];
  const solid = (x: number, y: number) => !inBounds(grid, x, y) || grid[y][x] === 0;
  const push = (type: Wall["type"], x1: number, y1: number, x2: number, y2: number) => {
    walls.push({ id: crypto.randomUUID(), type, x1, y1, x2, y2, isOpen: type === "door" ? false : undefined });
  };

  // Arêtes horizontales fusionnées
  for (let y = 0; y <= rows; y++) {
    let runStart: number | null = null;
    for (let x = 0; x <= cols; x++) {
      const isEdge = x < cols && solid(x, y - 1) !== solid(x, y);
      if (isEdge && runStart === null) runStart = x;
      if (!isEdge && runStart !== null) {
        push("solid", runStart * cellSize, y * cellSize, x * cellSize, y * cellSize);
        runStart = null;
      }
    }
  }
  // Arêtes verticales fusionnées
  for (let x = 0; x <= cols; x++) {
    let runStart: number | null = null;
    for (let y = 0; y <= rows; y++) {
      const isEdge = y < rows && solid(x - 1, y) !== solid(x, y);
      if (isEdge && runStart === null) runStart = y;
      if (!isEdge && runStart !== null) {
        push("solid", x * cellSize, runStart * cellSize, x * cellSize, y * cellSize);
        runStart = null;
      }
    }
  }

  // Portes : segment barrant la cellule marquée 2
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] !== 2) continue;
      const horizontal = solid(x, y - 1) && solid(x, y + 1);
      if (horizontal) push("door", x * cellSize, (y + 0.5) * cellSize, (x + 1) * cellSize, (y + 0.5) * cellSize);
      else push("door", (x + 0.5) * cellSize, y * cellSize, (x + 0.5) * cellSize, (y + 1) * cellSize);
    }
  }
  return walls;
}

// ── Rendu graphique ─────────────────────────────────────────
interface Palette { void1: string; void2: string; floor1: string; floor2: string; edge: string; accent: string }

const PALETTES: Record<MapGenKind, Palette> = {
  dungeon: { void1: "#0b0d14", void2: "#131725", floor1: "#3b3730", floor2: "#4a4438", edge: "#0a0b10", accent: "#c8a44d" },
  cave:    { void1: "#0a0a0f", void2: "#16151c", floor1: "#3a3229", floor2: "#4b4034", edge: "#08080c", accent: "#8a6f45" },
  forest:  { void1: "#12291b", void2: "#1b3a25", floor1: "#33502f", floor2: "#3e5f37", edge: "#0d1f14", accent: "#6b8f4a" },
  ruins:   { void1: "#0d0f16", void2: "#1a1c26", floor1: "#4a4640", floor2: "#59544a", edge: "#0a0b10", accent: "#9c8b6a" },
};

function renderMap(grid: CellKind[][], o: MapGenOptions, rng: Rng): string {
  const cols = grid[0].length; const rows = grid.length;
  const cs = o.cellSize;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cs;
  canvas.height = rows * cs;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const p = PALETTES[o.kind];

  // Fond « vide »
  ctx.fillStyle = p.void1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] !== 0) continue;
      ctx.fillStyle = rng() < 0.5 ? p.void1 : p.void2;
      ctx.fillRect(x * cs, y * cs, cs, cs);
    }
  }

  // Sol
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === 0) continue;
      ctx.fillStyle = rng() < 0.5 ? p.floor1 : p.floor2;
      ctx.fillRect(x * cs, y * cs, cs, cs);
      // grain
      ctx.fillStyle = `rgba(0,0,0,${0.04 + rng() * 0.06})`;
      ctx.fillRect(x * cs + rng() * cs * 0.6, y * cs + rng() * cs * 0.6, cs * 0.35, cs * 0.35);
      if (o.kind === "dungeon" || o.kind === "ruins") {
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cs + 0.5, y * cs + 0.5, cs - 1, cs - 1);
      }
    }
  }

  // Contours des zones pleines
  ctx.strokeStyle = p.edge;
  ctx.lineWidth = Math.max(2, cs * 0.12);
  ctx.beginPath();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === 0) continue;
      const up = y === 0 || grid[y - 1][x] === 0;
      const down = y === rows - 1 || grid[y + 1][x] === 0;
      const left = x === 0 || grid[y][x - 1] === 0;
      const right = x === cols - 1 || grid[y][x + 1] === 0;
      if (up) { ctx.moveTo(x * cs, y * cs); ctx.lineTo((x + 1) * cs, y * cs); }
      if (down) { ctx.moveTo(x * cs, (y + 1) * cs); ctx.lineTo((x + 1) * cs, (y + 1) * cs); }
      if (left) { ctx.moveTo(x * cs, y * cs); ctx.lineTo(x * cs, (y + 1) * cs); }
      if (right) { ctx.moveTo((x + 1) * cs, y * cs); ctx.lineTo((x + 1) * cs, (y + 1) * cs); }
    }
  }
  ctx.stroke();

  // Décor : arbres (forêt), rochers (caverne), gravats (ruines), portes
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = grid[y][x];
      const cx = x * cs + cs / 2; const cy = y * cs + cs / 2;
      if (o.kind === "forest" && cell === 0 && rng() < 0.9) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath(); ctx.arc(cx + cs * 0.08, cy + cs * 0.1, cs * 0.34, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rng() < 0.5 ? "#274d2c" : "#2f5c33";
        ctx.beginPath(); ctx.arc(cx, cy, cs * 0.34, 0, Math.PI * 2); ctx.fill();
      }
      if (o.kind === "cave" && cell === 0 && rng() < 0.25) {
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath(); ctx.arc(cx, cy, cs * (0.15 + rng() * 0.18), 0, Math.PI * 2); ctx.fill();
      }
      if (o.kind === "ruins" && cell === 1 && rng() < 0.12) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(cx - cs * 0.2, cy - cs * 0.14, cs * 0.4, cs * 0.28);
      }
      if (cell === 2) {
        ctx.fillStyle = p.accent;
        const horizontal = (y === 0 || grid[y - 1][x] === 0) && (y === rows - 1 || grid[y + 1][x] === 0);
        if (horizontal) ctx.fillRect(x * cs + cs * 0.05, cy - cs * 0.1, cs * 0.9, cs * 0.2);
        else ctx.fillRect(cx - cs * 0.1, y * cs + cs * 0.05, cs * 0.2, cs * 0.9);
      }
    }
  }

  // Vignettage doux
  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.3,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7,
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.82);
}

/** Génère une carte complète (image + murs) de façon déterministe. */
export function generateProceduralMap(options: Partial<MapGenOptions> = {}): GeneratedMap {
  const o: MapGenOptions = { ...DEFAULT_MAP_GEN_OPTIONS, ...options };
  o.cols = Math.max(10, Math.min(80, Math.round(o.cols)));
  o.rows = Math.max(10, Math.min(80, Math.round(o.rows)));
  o.cellSize = Math.max(20, Math.min(80, Math.round(o.cellSize)));
  o.density = Math.max(0, Math.min(1, o.density));

  const rng = makeRng(o.seed);
  const built =
    o.kind === "cave" ? generateCave(o, rng)
    : o.kind === "forest" ? generateForest(o, rng)
    : o.kind === "ruins" ? generateRuins(o, rng)
    : generateDungeon(o, rng);

  const dataUrl = renderMap(built.grid, o, makeRng(o.seed ^ 0x9e3779b9));
  const walls = o.withWalls ? buildWalls(built.grid, o.cellSize) : [];

  return {
    grid: built.grid,
    cols: o.cols,
    rows: o.rows,
    cellSize: o.cellSize,
    dataUrl,
    walls,
    spawnPoints: built.spawnCells.map(c => ({
      x: (c.x + 0.5) * o.cellSize,
      y: (c.y + 0.5) * o.cellSize,
    })),
  };
}

export const randomSeed = () => Math.floor(Math.random() * 1_000_000) + 1;
