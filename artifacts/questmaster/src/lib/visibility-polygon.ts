// ============================================================
// POLYGONE DE VISIBILITÉ — Raycasting pour lumières dynamiques
// Fichier : artifacts/questmaster/src/lib/visibility-polygon.ts
// ============================================================
//
// Calcule le polygone visible depuis un point source (lumière /
// vision de token), borné par un rayon maximum et coupé par des
// segments bloquants (murs solides + portes fermées).
//
// Stratégie :
//  - On combine deux ensembles d'angles :
//      (a) les angles des extrémités de chaque mur (± epsilon) → ces
//          rayons capturent les contours d'ombre.
//      (b) un échantillonnage uniforme dense sur 360° → ces rayons
//          garantissent un arc lisse là où aucun mur n'est présent.
//  - Pour chaque angle, on prend l'intersection murale la plus proche
//    et on la clampe au rayon R. Le résultat (trié par angle) forme
//    un polygone fermé qui « grignote » le disque de lumière partout
//    où un mur l'occulte.

export interface Segment {
  x1: number; y1: number;
  x2: number; y2: number;
}

export interface Point { x: number; y: number; }

// Intersection rayon (origin + t * dir, t >= 0) avec segment [a, b].
// Retourne le point et la distance t le long du rayon, ou null.
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

const UNIFORM_RAYS = 96; // densité de l'arc circulaire

/**
 * Calcule le polygone de visibilité depuis (ox, oy) avec rayon max R,
 * tenant compte des segments bloquants fournis.
 * Renvoie une liste de points (ordre angulaire, polygone fermé).
 */
export function computeVisibilityPolygon(
  ox: number, oy: number,
  radius: number,
  blockers: Segment[],
): Point[] {
  const R = Math.max(0, radius);
  if (R <= 0) return [];

  // Filtrage spatial des murs pertinents
  const relevant: Segment[] = [];
  for (const s of blockers) {
    const minX = Math.min(s.x1, s.x2);
    const maxX = Math.max(s.x1, s.x2);
    const minY = Math.min(s.y1, s.y2);
    const maxY = Math.max(s.y1, s.y2);
    if (maxX < ox - R || minX > ox + R || maxY < oy - R || minY > oy + R) continue;
    relevant.push(s);
  }

  // Collecte des angles :
  //  - extrémités de murs (± epsilon pour capturer les bords d'ombre)
  //  - échantillonnage uniforme pour lisser l'arc
  const angleSet: number[] = [];
  const EPS = 0.0002;
  for (const s of relevant) {
    const a1 = Math.atan2(s.y1 - oy, s.x1 - ox);
    const a2 = Math.atan2(s.y2 - oy, s.x2 - ox);
    angleSet.push(a1, a1 - EPS, a1 + EPS, a2, a2 - EPS, a2 + EPS);
  }
  for (let i = 0; i < UNIFORM_RAYS; i++) {
    angleSet.push((i / UNIFORM_RAYS) * Math.PI * 2 - Math.PI);
  }

  // Tri par angle
  angleSet.sort((a, b) => a - b);

  // Pour chaque rayon : trouver la distance bloquante la plus proche,
  // clampée à R. Toujours produire un point (sur le cercle si rien).
  const out: Point[] = [];
  for (const angle of angleSet) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let bestT = R;
    for (const s of relevant) {
      const hit = rayIntersectsSegment(ox, oy, dx, dy, s.x1, s.y1, s.x2, s.y2);
      if (!hit) continue;
      if (hit.t > 1e-4 && hit.t < bestT) bestT = hit.t;
    }
    out.push({ x: ox + dx * bestT, y: oy + dy * bestT });
  }
  return out;
}
