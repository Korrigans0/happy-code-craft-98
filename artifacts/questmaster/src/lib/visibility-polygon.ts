// ============================================================
// POLYGONE DE VISIBILITÉ — Raycasting pour lumières dynamiques
// Fichier : artifacts/questmaster/src/lib/visibility-polygon.ts
// ============================================================
//
// Calcule le polygone visible depuis un point source, en tenant
// compte des segments bloquants (murs). Utilisé pour clipper les
// lumières dynamiques dans le VTT.

export interface Segment {
  x1: number; y1: number;
  x2: number; y2: number;
}

export interface Point { x: number; y: number; }

// Intersection rayon (origin + t * dir, t >= 0) avec segment [a, b]
// Retourne le point et la distance, ou null.
function rayIntersectsSegment(
  ox: number, oy: number,
  dx: number, dy: number,
  ax: number, ay: number,
  bx: number, by: number,
): { x: number; y: number; t: number } | null {
  const sx = bx - ax;
  const sy = by - ay;
  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-9) return null; // parallèle
  const t = ((ax - ox) * sy - (ay - oy) * sx) / denom;
  const u = ((ax - ox) * dy - (ay - oy) * dx) / denom;
  if (t < 0 || u < -1e-6 || u > 1 + 1e-6) return null;
  return { x: ox + dx * t, y: oy + dy * t, t };
}

/**
 * Calcule le polygone de visibilité depuis (ox, oy) avec rayon max R,
 * en tenant compte des segments bloquants fournis.
 * Renvoie une liste de points (dans l'ordre angulaire).
 */
export function computeVisibilityPolygon(
  ox: number, oy: number,
  radius: number,
  blockers: Segment[],
): Point[] {
  // Bounding box : ajoute 4 segments englobants à distance radius
  const R = radius;
  const box: Segment[] = [
    { x1: ox - R, y1: oy - R, x2: ox + R, y2: oy - R },
    { x1: ox + R, y1: oy - R, x2: ox + R, y2: oy + R },
    { x1: ox + R, y1: oy + R, x2: ox - R, y2: oy + R },
    { x1: ox - R, y1: oy + R, x2: ox - R, y2: oy - R },
  ];

  // Filtre les murs hors zone (optim simple : bbox d'intersection)
  const relevant: Segment[] = [];
  for (const s of blockers) {
    const minX = Math.min(s.x1, s.x2);
    const maxX = Math.max(s.x1, s.x2);
    const minY = Math.min(s.y1, s.y2);
    const maxY = Math.max(s.y1, s.y2);
    if (maxX < ox - R || minX > ox + R || maxY < oy - R || minY > oy + R) continue;
    relevant.push(s);
  }

  const all = [...relevant, ...box];

  // Points uniques (extrémités)
  const angles: number[] = [];
  const seen = new Set<string>();
  for (const s of all) {
    for (const [x, y] of [[s.x1, s.y1], [s.x2, s.y2]]) {
      const k = `${x.toFixed(2)}|${y.toFixed(2)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const a = Math.atan2(y - oy, x - ox);
      angles.push(a, a - 0.00005, a + 0.00005);
    }
  }

  // Pour chaque angle, lancer un rayon et trouver l'intersection la plus proche
  const hits: { angle: number; x: number; y: number }[] = [];
  for (const angle of angles) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let closest: { x: number; y: number; t: number } | null = null;
    for (const s of all) {
      const hit = rayIntersectsSegment(ox, oy, dx, dy, s.x1, s.y1, s.x2, s.y2);
      if (!hit) continue;
      if (hit.t > R) continue;
      if (!closest || hit.t < closest.t) closest = hit;
    }
    if (closest) hits.push({ angle, x: closest.x, y: closest.y });
  }

  // Tri par angle
  hits.sort((a, b) => a.angle - b.angle);
  return hits.map(h => ({ x: h.x, y: h.y }));
}
