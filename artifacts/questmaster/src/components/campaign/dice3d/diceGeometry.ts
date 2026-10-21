// Shared 3D dice geometry: used by the personal 3D roller and the shared
// table overlay so both render identical dice.
import * as THREE from "three";
import {
  TetrahedronGeometry,
  OctahedronGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
} from "three";

export type DieType = 4 | 6 | 8 | 10 | 12 | 20;
export const DIE_TYPES: DieType[] = [4, 6, 8, 10, 12, 20];

// Player color presets (HSL kept for brand-alignment with dark fantasy palette)
export const COLOR_PRESETS = [
  { name: "Pierre noire",  base: "#22202a", emissive: "#3a2a08", metal: 0.25, rough: 0.78 },
  { name: "Or runique",    base: "#7a5a1c", emissive: "#3a2008", metal: 0.92, rough: 0.32 },
  { name: "Obsidienne",    base: "#0e0d14", emissive: "#2a164d", metal: 0.55, rough: 0.22 },
  { name: "Sang dragon",   base: "#3a0a10", emissive: "#1a0203", metal: 0.55, rough: 0.42 },
  { name: "Éther bleu",    base: "#152846", emissive: "#0a1a36", metal: 0.7,  rough: 0.32 },
  { name: "Émeraude",      base: "#0d3a26", emissive: "#021a0c", metal: 0.6,  rough: 0.36 },
  { name: "Améthyste",     base: "#2a1846", emissive: "#1a0833", metal: 0.55, rough: 0.32 },
];


export interface DieMaterial {
  base: string;
  emissive: string;
  metal: number;
  rough: number;
}

export interface PolyhedronData {
  geometry: THREE.BufferGeometry;
  faceNormals: THREE.Vector3[];
  faceCenters: THREE.Vector3[];
  faceValues: number[];
  radius: number;
}

/* ----------------------------------------------------------
 *  Geometry factories — return geometry + per-face normals
 *  (face normals are used to determine the "up" face)
 * --------------------------------------------------------- */

export function buildD6CubeData(): PolyhedronData {
  const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4).toNonIndexed();
  geometry.computeVertexNormals();
  const faceNormals = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];
  return {
    geometry,
    faceNormals,
    faceCenters: faceNormals.map(n => n.clone().multiplyScalar(0.706)),
    faceValues: [1, 6, 3, 4, 2, 5],
    radius: 0.7,
  };
}

export function buildD10DecahedronData(): PolyhedronData {
  const top = new THREE.Vector3(0, 1.15, 0);
  const bottom = new THREE.Vector3(0, -1.15, 0);
  const ring = Array.from({ length: 5 }, (_, i) => {
    const a = Math.PI / 2 + (i / 5) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
  });
  const vertices: number[] = [];
  const faceNormals: THREE.Vector3[] = [];
  const faceCenters: THREE.Vector3[] = [];
  const faceValues: number[] = [];

  const pushFace = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, value: number) => {
    let aa = a.clone();
    let bb = b.clone();
    let cc = c.clone();
    let normal = new THREE.Vector3().subVectors(bb, aa).cross(new THREE.Vector3().subVectors(cc, aa)).normalize();
    const center = new THREE.Vector3().add(aa).add(bb).add(cc).divideScalar(3);
    if (normal.dot(center) < 0) {
      [bb, cc] = [cc, bb];
      normal = new THREE.Vector3().subVectors(bb, aa).cross(new THREE.Vector3().subVectors(cc, aa)).normalize();
    }
    vertices.push(aa.x, aa.y, aa.z, bb.x, bb.y, bb.z, cc.x, cc.y, cc.z);
    faceNormals.push(normal);
    faceCenters.push(center);
    faceValues.push(value);
  };

  for (let i = 0; i < 5; i++) pushFace(top, ring[i], ring[(i + 1) % 5], i * 2 + 1);
  for (let i = 0; i < 5; i++) pushFace(bottom, ring[(i + 1) % 5], ring[i], (i + 1) * 2);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return { geometry, faceNormals, faceCenters, faceValues, radius: 1.15 };
}

export function getPolyhedronData(sides: DieType): PolyhedronData {
  if (sides === 6) return buildD6CubeData();
  if (sides === 10) return buildD10DecahedronData();
  let geom: THREE.BufferGeometry;
  let radius: number;
  switch (sides) {
    case 4:  geom = new TetrahedronGeometry(0.95); radius = 0.95; break;
    case 8:  geom = new OctahedronGeometry(1); radius = 1; break;
    case 12: geom = new DodecahedronGeometry(0.95); radius = 0.95; break;
    case 20: geom = new IcosahedronGeometry(0.95); radius = 0.95; break;
  }
  geom = geom.index ? geom.toNonIndexed() : geom;
  geom.computeVertexNormals();

  const pos = geom.attributes.position as THREE.BufferAttribute;
  const triCount = pos.count / 3;

  type Tri = { n: THREE.Vector3; c: THREE.Vector3; v: THREE.Vector3[] };
  const tris: Tri[] = [];
  for (let i = 0; i < triCount; i++) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i * 3);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i * 3 + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i * 3 + 2);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const cen = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
    tris.push({ n, c: cen, v: [a, b, c] });
  }

  // Group coplanar triangles together (same outward normal)
  const groups: { normal: THREE.Vector3; verts: THREE.Vector3[] }[] = [];
  for (const t of tris) {
    const g = groups.find(g => g.normal.dot(t.n) > 0.999);
    if (g) g.verts.push(...t.v);
    else groups.push({ normal: t.n.clone(), verts: [...t.v] });
  }

  const faceNormals = groups.map(g => g.normal);
  const faceCenters = groups.map(g => {
    const sum = new THREE.Vector3();
    g.verts.forEach(v => sum.add(v));
    return sum.divideScalar(g.verts.length);
  });

  // Standard d-die numbering: opposite faces sum to (sides+1) for d4/d6/d8/d12/d20.
  // Real d10 numbers 0-9 (we map 1-10 with 10 = "0" face); opposite faces sum to 9.
  const faceValues: number[] = [];
  for (let i = 0; i < faceNormals.length; i++) faceValues.push(i + 1);

  return { geometry: geom, faceNormals, faceCenters, faceValues, radius };
}

// Convex hull vertices for cannon physics (per geometry)
export function getConvexArgs(geometry: THREE.BufferGeometry): [number[][], number[][]] {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const verts: number[][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < pos.count; i++) {
    const v = [
      +pos.getX(i).toFixed(4),
      +pos.getY(i).toFixed(4),
      +pos.getZ(i).toFixed(4),
    ];
    const key = v.join(",");
    if (!seen.has(key)) {
      seen.add(key);
      verts.push(v);
    }
  }
  // Convex faces — cannon will rebuild; we pass triangle indices
  const faces: number[][] = [];
  const findIdx = (vec: THREE.Vector3) => {
    const key = [+vec.x.toFixed(4), +vec.y.toFixed(4), +vec.z.toFixed(4)].join(",");
    return verts.findIndex(v => v.join(",") === key);
  };
  const triCount = pos.count / 3;
  for (let i = 0; i < triCount; i++) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i * 3);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i * 3 + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i * 3 + 2);
    const ia = findIdx(a), ib = findIdx(b), ic = findIdx(c);
    if (ia >= 0 && ib >= 0 && ic >= 0) faces.push([ia, ib, ic]);
  }
  return [verts, faces];
}
