/// <reference types="@react-three/fiber" />
import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Physics,
  useBox,
  usePlane,
  useConvexPolyhedron,
} from "@react-three/cannon";
import { Environment, ContactShadows, Trail, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  TetrahedronGeometry,
  OctahedronGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
} from "three";
import { Button } from "@/components/ui/button";
import { Dices, X, Plus, Minus, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

/* ============================================================
 *  Aetheria 3D Dice — physical dice, dark fantasy feel
 *  Tech: react-three-fiber + @react-three/cannon (cannon-es)
 * ============================================================ */

type DieType = 4 | 6 | 8 | 10 | 12 | 20;
const DIE_TYPES: DieType[] = [4, 6, 8, 10, 12, 20];

// Player color presets (HSL kept for brand-alignment with dark fantasy palette)
const COLOR_PRESETS = [
  { name: "Pierre noire",  base: "#22202a", emissive: "#3a2a08", metal: 0.25, rough: 0.78 },
  { name: "Or runique",    base: "#7a5a1c", emissive: "#3a2008", metal: 0.92, rough: 0.32 },
  { name: "Obsidienne",    base: "#0e0d14", emissive: "#2a164d", metal: 0.55, rough: 0.22 },
  { name: "Sang dragon",   base: "#3a0a10", emissive: "#1a0203", metal: 0.55, rough: 0.42 },
  { name: "Éther bleu",    base: "#152846", emissive: "#0a1a36", metal: 0.7,  rough: 0.32 },
  { name: "Émeraude",      base: "#0d3a26", emissive: "#021a0c", metal: 0.6,  rough: 0.36 },
  { name: "Améthyste",     base: "#2a1846", emissive: "#1a0833", metal: 0.55, rough: 0.32 },
];


interface DieMaterial {
  base: string;
  emissive: string;
  metal: number;
  rough: number;
}

interface PolyhedronData {
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

function buildD6CubeData(): PolyhedronData {
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

function buildD10DecahedronData(): PolyhedronData {
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

function getPolyhedronData(sides: DieType): PolyhedronData {
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
function getConvexArgs(geometry: THREE.BufferGeometry): [number[][], number[][]] {
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

/* ----------------------------------------------------------
 *  Sound system — synthesised dice clacks (no assets required)
 * --------------------------------------------------------- */

class DiceAudio {
  private ctx: AudioContext | null = null;
  private ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch { /* noop */ }
    }
    return this.ctx;
  }
  private impact(freq: number, duration: number, type: OscillatorType, gain = 0.18) {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq * 1.2;
    filter.Q.value = 6;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + duration);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(filter).connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
  felt() { this.impact(180 + Math.random() * 60, 0.18, "triangle", 0.12); }
  wood() { this.impact(280 + Math.random() * 80, 0.12, "square", 0.1); }
  crit() {
    const ctx = this.ensure(); if (!ctx) return;
    [440, 660, 880, 1320].forEach((f, i) => setTimeout(() => this.impact(f, 0.4, "sine", 0.18), i * 40));
  }
  fail() {
    this.impact(80, 0.6, "sawtooth", 0.22);
    setTimeout(() => this.impact(60, 0.8, "sawtooth", 0.18), 80);
  }
}

const audio = new DiceAudio();

/* ----------------------------------------------------------
 *  Floor & walls — invisible physics box keeps dice on table
 * --------------------------------------------------------- */

function PhysicsRoom() {
  // Floor
  const [floorRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: { friction: 0.6, restitution: 0.25 },
  }));

  // Invisible walls
  const wallProps = (pos: [number, number, number], rot: [number, number, number]) => ({
    position: pos,
    rotation: rot,
    material: { friction: 0.4, restitution: 0.4 },
  });

  const [w1] = usePlane(() => wallProps([0, 0, -8], [0, 0, 0]));
  const [w2] = usePlane(() => wallProps([0, 0, 8], [0, Math.PI, 0]));
  const [w3] = usePlane(() => wallProps([-10, 0, 0], [0, Math.PI / 2, 0]));
  const [w4] = usePlane(() => wallProps([10, 0, 0], [0, -Math.PI / 2, 0]));

  return (
    <>
      <mesh ref={floorRef as any} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#0d1018"
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>
      {/* Decorative felt circle */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial color="#1a1610" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.6, 5.95, 64]} />
        <meshStandardMaterial color="#c9a04a" emissive="#5a3a0a" emissiveIntensity={0.5} roughness={0.5} metalness={0.7} />
      </mesh>
      {/* invisible refs to keep physics live */}
      <group ref={w1 as any} /><group ref={w2 as any} /><group ref={w3 as any} /><group ref={w4 as any} />
    </>
  );
}

/* ----------------------------------------------------------
 *  Single physics die
 * --------------------------------------------------------- */

interface DieProps {
  id: string;
  type: DieType;
  material: DieMaterial;
  startPos: [number, number, number];
  impulse: [number, number, number];
  spin: [number, number, number];
  onSettle: (id: string, value: number) => void;
}

function Die({ id, type, material, startPos, impulse, spin, onSettle }: DieProps) {
  const data = useMemo(() => getPolyhedronData(type), [type]);
  const convexArgs = useMemo(() => getConvexArgs(data.geometry), [data.geometry]);

  const [ref, api] = useConvexPolyhedron(() => ({
    args: convexArgs as any,
    mass: 1.2,
    position: startPos,
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    angularDamping: 0.15,
    linearDamping: 0.12,
    material: { friction: 0.35, restitution: 0.45 },
  }));

  const settledRef = useRef(false);
  const stillFramesRef = useRef(0);
  const lastVelRef = useRef(new THREE.Vector3());
  const lastAngRef = useRef(new THREE.Vector3());
  const lastImpactRef = useRef(0);

  // Apply initial throw
  useEffect(() => {
    api.velocity.set(impulse[0], impulse[1], impulse[2]);
    api.angularVelocity.set(spin[0], spin[1], spin[2]);
    const unsub1 = api.velocity.subscribe(v => lastVelRef.current.set(v[0], v[1], v[2]));
    const unsub2 = api.angularVelocity.subscribe(v => lastAngRef.current.set(v[0], v[1], v[2]));
    return () => { unsub1(); unsub2(); };
  }, []); // eslint-disable-line

  useFrame(() => {
    if (settledRef.current || !ref.current) return;
    const v = lastVelRef.current.length();
    const a = lastAngRef.current.length();

    // Impact sound when bouncing hard
    if (v > 2.5 && performance.now() - lastImpactRef.current > 90) {
      lastImpactRef.current = performance.now();
      Math.random() > 0.5 ? audio.felt() : audio.wood();
    }

    if (v < 0.05 && a < 0.05) {
      stillFramesRef.current++;
      if (stillFramesRef.current > 12) {
        settledRef.current = true;
        // Determine up face
        const obj = ref.current as THREE.Object3D;
        const worldUp = new THREE.Vector3(0, 1, 0);
        let bestDot = -Infinity;
        let bestIdx = 0;
        const quat = new THREE.Quaternion();
        obj.getWorldQuaternion(quat);
        data.faceNormals.forEach((n, i) => {
          const wn = n.clone().applyQuaternion(quat);
          const d = wn.dot(worldUp);
          if (d > bestDot) { bestDot = d; bestIdx = i; }
        });
        const value = data.faceValues[bestIdx] ?? 1;
        onSettle(id, value);
      }
    } else {
      stillFramesRef.current = 0;
    }
  });

  return (
    <group>
      <Trail
        width={0.45}
        length={5}
        color={material.emissive}
        attenuation={(t) => t * t}
      >
        <mesh
          ref={ref as any}
          geometry={data.geometry}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color={material.base}
            emissive={material.emissive}
            emissiveIntensity={0.15}
            metalness={material.metal}
            roughness={material.rough}
            clearcoat={0.3}
            clearcoatRoughness={0.6}
            reflectivity={0.4}
            envMapIntensity={0.85}
          />
          <DieFaces type={type} data={data} />
        </mesh>
      </Trail>
    </group>
  );
}

/* ----------------------------------------------------------
 *  DieFaces — engraved digits / pips for a given die geometry
 * --------------------------------------------------------- */

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-0.28, -0.28], [0.28, 0.28]],
  3: [[-0.32, -0.32], [0, 0], [0.32, 0.32]],
  4: [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]],
  5: [[-0.3, -0.3], [0.3, -0.3], [0, 0], [-0.3, 0.3], [0.3, 0.3]],
  6: [[-0.3, -0.32], [0.3, -0.32], [-0.3, 0], [0.3, 0], [-0.3, 0.32], [0.3, 0.32]],
};

function makeFaceQuaternion(normal: THREE.Vector3, preferredUp: THREE.Vector3) {
  const N = normal.clone().normalize();
  let Y = preferredUp.clone().projectOnPlane(N);
  if (Y.lengthSq() < 0.0001) Y = Math.abs(N.y) > 0.9 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0).projectOnPlane(N);
  Y.normalize();
  const X = new THREE.Vector3().crossVectors(Y, N).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, N));
}

function D6Pips({ value }: { value: number }) {
  return (
    <>
      {(PIP_LAYOUTS[value] || []).map(([px, py], pi) => (
        <group key={pi} position={[px * 1.35, py * 1.35, 0]}>
          <mesh position={[0, 0, -0.007]} renderOrder={2}>
            <circleGeometry args={[0.155, 32]} />
            <meshBasicMaterial color="#050403" />
          </mesh>
          <mesh position={[0, 0, 0.004]} renderOrder={3}>
            <circleGeometry args={[0.112, 32]} />
            <meshBasicMaterial color="#fff1c2" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.009]} renderOrder={4}>
            <ringGeometry args={[0.122, 0.138, 32]} />
            <meshBasicMaterial color="#6b4613" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function EngravedDigit({ label, size, underline = false }: { label: string; size: number; underline?: boolean }) {
  return (
    <>
      <Text
        fontSize={size}
        color="#050403"
        anchorX="center"
        anchorY="middle"
        outlineWidth={size * 0.16}
        outlineColor="#050403"
        outlineOpacity={1}
        outlineBlur={size * 0.035}
        renderOrder={2}
        position={[0, underline ? size * 0.08 : 0, -0.007]}
      >
        {label}
      </Text>
      <Text
        fontSize={size}
        color="#fff1c2"
        anchorX="center"
        anchorY="middle"
        outlineWidth={size * 0.045}
        outlineColor="#5a360d"
        outlineOpacity={0.95}
        material-toneMapped={false}
        renderOrder={3}
        position={[0, underline ? size * 0.08 : 0, 0.004]}
      >
        {label}
      </Text>
      {underline && (
        <>
          <mesh position={[0, -size * 0.44, -0.004]} renderOrder={2}>
            <circleGeometry args={[size * 0.1, 24]} />
            <meshBasicMaterial color="#050403" />
          </mesh>
          <mesh position={[0, -size * 0.44, 0.006]} renderOrder={3}>
            <circleGeometry args={[size * 0.065, 24]} />
            <meshBasicMaterial color="#fff1c2" toneMapped={false} />
          </mesh>
        </>
      )}
    </>
  );
}

function DieFaces({
  type,
  data,
}: {
  type: DieType;
  data: PolyhedronData;
}) {
  const faceLabels = useMemo(() => {
    const worldUp = new THREE.Vector3(0, 1, 0);
    const worldFwd = new THREE.Vector3(0, 0, -1);
    const d10Top = new THREE.Vector3(0, 1.15, 0);
    const d10Bottom = new THREE.Vector3(0, -1.15, 0);
    const avgRadius = data.faceCenters.reduce((s, c) => s + c.length(), 0) / data.faceCenters.length;
    return data.faceNormals.map((n, i) => {
      const N = n.clone().normalize();
      let preferredUp: THREE.Vector3;
      if (type === 10) {
        preferredUp = new THREE.Vector3().subVectors(data.faceCenters[i].y >= 0 ? d10Top : d10Bottom, data.faceCenters[i]);
      } else if (type === 6) {
        preferredUp = Math.abs(N.y) > 0.9 ? worldFwd : worldUp;
      } else {
        preferredUp = Math.abs(N.dot(worldUp)) > 0.95 ? worldFwd : worldUp;
      }
      const q = makeFaceQuaternion(N, preferredUp);
      const pos = data.faceCenters[i].clone().addScaledVector(N, type === 6 ? 0.02 : 0.012);
      const value = data.faceValues[i];
      const sizeMap: Record<DieType, number> = {
        4:  avgRadius * 0.55,
        6:  0,
        8:  avgRadius * 0.62,
        10: 0.46,
        12: avgRadius * 0.55,
        20: avgRadius * 0.50,
      };
      const size = sizeMap[type];
      const label = type === 10 && value === 10 ? "0" : `${value}`;
      const needsUnderline = type !== 6 && (value === 6 || value === 9);
      return {
        pos: pos.toArray() as [number, number, number],
        quat: [q.x, q.y, q.z, q.w] as [number, number, number, number],
        label, size, needsUnderline, value,
      };
    });
  }, [data, type]);

  return (
    <>
      {faceLabels.map((f, i) => (
        <group key={i} position={f.pos} quaternion={f.quat}>
          {type === 6 ? <D6Pips value={f.value} /> : <EngravedDigit label={f.label} size={f.size} underline={f.needsUnderline} />}
        </group>
      ))}
    </>
  );
}

/* ----------------------------------------------------------
 *  Dynamic camera — slight orbit during throw
 * --------------------------------------------------------- */

function DynamicCamera({ active }: { active: boolean }) {
  const { camera } = useThree();
  const t = useRef(0);
  useFrame((_, delta) => {
    const target = new THREE.Vector3(0, 0, 0);
    if (active) {
      t.current += delta;
      const r = 9 + Math.sin(t.current * 0.8) * 0.6;
      camera.position.x = Math.sin(t.current * 0.4) * 1.2;
      camera.position.y = 7 + Math.sin(t.current * 1.2) * 0.4;
      camera.position.z = r;
    } else {
      // Ease back to default
      camera.position.lerp(new THREE.Vector3(0, 8, 9), 0.05);
    }
    camera.lookAt(target);
  });
  return null;
}

/* ----------------------------------------------------------
 *  Main component
 * --------------------------------------------------------- */

interface SpawnSpec {
  id: string;
  type: DieType;
  startPos: [number, number, number];
  impulse: [number, number, number];
  spin: [number, number, number];
  material: DieMaterial;
}

interface Roll {
  id: string;
  type: DieType;
  value: number | null;
}

interface DiceRoller3DProps {
  open: boolean;
  onClose: () => void;
  campaignId?: string;
  userName?: string;
}

const DICE_PRESET_LABELS: Record<DieType, string> = {
  4: "d4", 6: "d6", 8: "d8", 10: "d10", 12: "d12", 20: "d20",
};

const DiceRoller3D = ({ open, onClose, campaignId, userName }: DiceRoller3DProps) => {
  const [counts, setCounts] = useState<Record<DieType, number>>({
    4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 1,
  });
  const [modifier, setModifier] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [spawns, setSpawns] = useState<SpawnSpec[]>([]);
  const [rolls, setRolls] = useState<Record<string, Roll>>({});
  const [throwing, setThrowing] = useState(false);
  const [history, setHistory] = useState<{ formula: string; total: number; details: string; crit?: "success" | "fail" }[]>([]);
  const [shake, setShake] = useState<"none" | "crit" | "fail">("none");
  const dragStart = useRef<{ x: number; y: number; t: number } | null>(null);

  const material = COLOR_PRESETS[colorIdx];
  const totalDice = Object.values(counts).reduce((a, b) => a + b, 0);

  const updateCount = (t: DieType, d: number) =>
    setCounts(p => ({ ...p, [t]: Math.max(0, Math.min(15, p[t] + d)) }));

  const buildSpawns = useCallback(
    (countsMap: Partial<Record<DieType, number>>, strengthMul = 1): SpawnSpec[] => {
      const out: SpawnSpec[] = [];
      for (const t of DIE_TYPES) {
        const n = countsMap[t] ?? 0;
        for (let i = 0; i < n; i++) {
          const angle = Math.random() * Math.PI * 2;
          const startX = Math.cos(angle) * 5;
          const startZ = Math.sin(angle) * 5;
          const dirX = -Math.cos(angle) * (4 + Math.random() * 3) * strengthMul;
          const dirZ = -Math.sin(angle) * (4 + Math.random() * 3) * strengthMul;
          out.push({
            id: crypto.randomUUID(),
            type: t,
            material,
            startPos: [startX, 4 + Math.random() * 1.5, startZ],
            impulse: [dirX, 1 + Math.random() * 2, dirZ],
            spin: [
              (Math.random() - 0.5) * 18,
              (Math.random() - 0.5) * 18,
              (Math.random() - 0.5) * 18,
            ],
          });
        }
      }
      return out;
    },
    [material]
  );

  const launch = useCallback(
    (countsMap: Partial<Record<DieType, number>>, strengthMul = 1) => {
      const newSpawns = buildSpawns(countsMap, strengthMul);
      if (newSpawns.length === 0) return;
      const newRolls: Record<string, Roll> = {};
      newSpawns.forEach(s => { newRolls[s.id] = { id: s.id, type: s.type, value: null }; });
      setSpawns(newSpawns);
      setRolls(newRolls);
      setThrowing(true);
    },
    [buildSpawns]
  );

  const handleSettle = useCallback((id: string, value: number) => {
    setRolls(prev => {
      if (!prev[id] || prev[id].value !== null) return prev;
      const next = { ...prev, [id]: { ...prev[id], value } };
      // All settled?
      const all = Object.values(next);
      if (all.length > 0 && all.every(r => r.value !== null)) {
        setThrowing(false);
        const total = all.reduce((s, r) => s + (r.value ?? 0), 0) + modifier;
        const detailParts = all.map(r => `d${r.type}:${r.value}`);
        const formMap: Record<number, number> = {};
        all.forEach(r => { formMap[r.type] = (formMap[r.type] ?? 0) + 1; });
        const formula = Object.entries(formMap).map(([t, n]) => `${n}d${t}`).join(" + ")
          + (modifier ? ` ${modifier > 0 ? "+" : ""}${modifier}` : "");

        // Crit detection on d20s
        const d20s = all.filter(r => r.type === 20);
        let crit: "success" | "fail" | undefined;
        if (d20s.some(r => r.value === 20)) crit = "success";
        else if (d20s.length > 0 && d20s.every(r => r.value === 1)) crit = "fail";

        if (crit === "success") { audio.crit(); setShake("crit"); setTimeout(() => setShake("none"), 700); }
        else if (crit === "fail") { audio.fail(); setShake("fail"); setTimeout(() => setShake("none"), 700); }

        setHistory(h => [{ formula, total, details: detailParts.join(", "), crit }, ...h].slice(0, 10));

        // Broadcast roll to campaign chat + everyone's screen
        if (campaignId) {
          const detailsStr = all.map(r => r.value).join(" + ")
            + (modifier ? ` ${modifier > 0 ? "+" : ""}${modifier}` : "");
          const author = userName || "Joueur";
          const critTxt = crit === "success" ? " ✦ Critique !" : crit === "fail" ? " ✗ Échec critique" : "";
          const content = `🎲 ${author} lance ${formula} → [${detailsStr}]${critTxt}`;
          // Chat persistence (best-effort)
          import("@/lib/api").then(({ campaignsApi }) => {
            campaignsApi.postMessage(campaignId, {
              content,
              message_type: "dice_roll",
              metadata: { dice: formula, results: all.map(r => r.value), total, modifier, crit, author },
            }).catch(() => { /* ignore */ });
          });
          // Realtime broadcast for floating overlay
          const ch: any = (supabase as any).channel(`vtt-dice-${campaignId}`);
          ch.subscribe?.((status: string) => {
            if (status === "SUBSCRIBED") {
              ch.send?.({
                type: "broadcast",
                event: "roll",
                payload: { author, formula, total, results: all.map(r => ({ type: r.type, value: r.value })), modifier, crit, t: Date.now() },
              });
              setTimeout(() => { (supabase as any).removeChannel?.(ch); }, 800);
            }
          });
        }
      }
      return next;
    });
  }, [modifier, campaignId, userName]);

  const rollAll = () => {
    if (totalDice === 0) return;
    launch(counts, 1);
  };

  const quickRoll = (t: DieType) => launch({ [t]: 1 }, 1);

  const clearTable = () => { setSpawns([]); setRolls({}); setThrowing(false); };

  // Click & drag on the canvas wrapper for variable strength
  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    dragStart.current = null;
    if (dist < 6) {
      // simple click — quick d20 if no pool, else rollAll
      if (totalDice > 0) rollAll();
      else quickRoll(20);
    } else {
      const strength = Math.min(2.2, 0.6 + dist / 180);
      if (totalDice > 0) launch(counts, strength);
      else launch({ 20: 1 }, strength);
    }
  };

  const allValues = Object.values(rolls);
  const settledCount = allValues.filter(r => r.value !== null).length;
  const isComplete = allValues.length > 0 && settledCount === allValues.length;
  const total = isComplete
    ? allValues.reduce((s, r) => s + (r.value ?? 0), 0) + modifier
    : 0;
  const lastCrit = history[0]?.crit;

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background/95 backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Dices className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg text-gradient-gold">Lanceur de dés 3D</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left controls */}
        <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border bg-card/50 p-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lancer rapide</p>
            <div className="grid grid-cols-3 gap-1.5">
              {DIE_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => quickRoll(t)}
                  disabled={throwing}
                  className="rounded-md border border-primary/30 bg-gradient-to-br from-card to-background py-2 text-xs font-bold text-primary shadow-sm transition-transform hover:scale-105 hover:shadow-md hover:border-primary active:scale-95 disabled:opacity-50"
                >
                  {DICE_PRESET_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pool de dés</p>
            <div className="space-y-1.5">
              {DIE_TYPES.map(t => (
                <div key={t} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-primary/30 to-primary/10 text-[10px] font-bold text-primary">
                    d{t}
                  </span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCount(t, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={counts[t]}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      const safe = isNaN(v) ? 0 : Math.max(0, Math.min(15, v));
                      setCounts(p => ({ ...p, [t]: safe }));
                    }}
                    className="w-10 rounded border border-border/60 bg-background/60 px-1 py-0.5 text-center text-sm font-medium tabular-nums focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCount(t, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DiceModifierInput
            value={modifier}
            onChange={setModifier}
            formulaPreview={selectedDie ? `${dieCount}d${selectedDie.sides}` : undefined}
            compact
          />


          {/* Color picker */}
          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Palette className="h-3 w-3" /> Couleur des dés
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_PRESETS.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setColorIdx(i)}
                  title={c.name}
                  className={cn(
                    "h-8 rounded border-2 transition-transform hover:scale-110",
                    colorIdx === i ? "border-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]" : "border-border"
                  )}
                  style={{ background: `linear-gradient(135deg, ${c.base}, ${c.emissive})` }}
                />
              ))}
            </div>
          </div>

          <Button onClick={rollAll} disabled={totalDice === 0 || throwing} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            <Dices className="mr-2 h-4 w-4" /> Lancer ({totalDice})
          </Button>
          <Button variant="outline" size="sm" onClick={clearTable} disabled={spawns.length === 0}>
            Effacer la table
          </Button>

          {history.length > 0 && (
            <div className="mt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Historique</p>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div key={i} className={cn(
                    "rounded border px-2 py-1 text-xs",
                    h.crit === "success" && "border-primary/60 bg-primary/10",
                    h.crit === "fail" && "border-destructive/60 bg-destructive/10",
                    !h.crit && "border-border/50 bg-muted/20"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-muted-foreground">{h.formula}</span>
                      <span className={cn(
                        "font-bold",
                        h.crit === "success" ? "text-primary" : h.crit === "fail" ? "text-destructive" : "text-foreground"
                      )}>{h.total}</span>
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground/70">
                      {h.crit === "success" && "✦ Critique ! "}{h.crit === "fail" && "✗ Échec critique. "}{h.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3D Dice table */}
        <div
          className={cn(
            "relative flex-1 overflow-hidden select-none",
            shake === "crit" && "animate-shake-crit",
            shake === "fail" && "animate-shake-fail"
          )}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <Canvas
            shadows
            camera={{ position: [0, 8, 9], fov: 42 }}
            gl={{
              antialias: true,
              alpha: false,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.05,
            }}
            style={{ background: "radial-gradient(ellipse at center, #15131c 0%, #050407 70%)" }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.18} color="#9ca6c2" />
              <directionalLight
                position={[6, 12, 4]}
                intensity={2.1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-left={-8}
                shadow-camera-right={8}
                shadow-camera-top={8}
                shadow-camera-bottom={-8}
                shadow-bias={-0.0003}
                color="#fff1cc"
              />
              <directionalLight position={[-4, 6, -8]} intensity={1.2} color="#7a86c8" />
              <pointLight position={[4, 2, 4]} intensity={0.4} color="#c9a04a" distance={12} />

              {lastCrit === "success" && !throwing && (
                <pointLight position={[0, 3, 0]} intensity={3} color="#ffd97a" distance={8} />
              )}
              {lastCrit === "fail" && !throwing && (
                <pointLight position={[0, 2, 0]} intensity={2} color="#a01818" distance={6} />
              )}

              <Environment preset="warehouse" environmentIntensity={0.35} />

              <DynamicCamera active={throwing} />

              <Physics
                gravity={[0, -28, 0]}
                defaultContactMaterial={{ friction: 0.4, restitution: 0.4 }}
                iterations={12}
              >
                <PhysicsRoom />
                {spawns.map(s => (
                  <Die
                    key={s.id}
                    id={s.id}
                    type={s.type}
                    material={s.material}
                    startPos={s.startPos}
                    impulse={s.impulse}
                    spin={s.spin}
                    onSettle={handleSettle}
                  />
                ))}
              </Physics>
              <ContactShadows position={[0, 0.005, 0]} opacity={0.55} scale={20} blur={2.4} far={8} />
            </Suspense>
          </Canvas>

          {/* Total overlay */}
          {isComplete && (
            <div className={cn(
              "pointer-events-none absolute right-4 top-4 rounded-lg border bg-card/90 px-4 py-2 backdrop-blur-sm animate-fade-in",
              lastCrit === "success" ? "border-primary shadow-[0_0_25px_hsl(var(--primary)/0.6)]" :
              lastCrit === "fail" ? "border-destructive shadow-[0_0_25px_hsl(var(--destructive)/0.5)]" :
              "border-primary/40"
            )}>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {lastCrit === "success" ? "Critique !" : lastCrit === "fail" ? "Échec critique" : "Total"}
              </p>
              <p className={cn(
                "font-display text-3xl font-bold leading-none",
                lastCrit === "success" ? "text-gradient-gold" :
                lastCrit === "fail" ? "text-destructive" : "text-gradient-gold"
              )}>{total}</p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">
                {allValues.map(r => r.value).join(" + ")}
                {modifier ? ` ${modifier > 0 ? "+" : ""}${modifier}` : ""}
              </p>
            </div>
          )}

          {/* Per-die value badges */}
          {isComplete && allValues.length <= 8 && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 animate-fade-in">
              {allValues.map(r => (
                <div key={r.id} className="rounded-md border border-primary/40 bg-card/80 px-2.5 py-1 backdrop-blur-sm text-center">
                  <p className="text-[9px] uppercase text-muted-foreground">d{r.type}</p>
                  <p className="font-display text-lg font-bold text-primary leading-none">{r.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Empty state hint */}
          {spawns.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-12 text-center">
              <p className="font-display text-base text-muted-foreground/80">Cliquez ou glissez pour lancer</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Glissez plus loin = lancer plus puissant</p>
            </div>
          )}

          {/* Crit / fail flash overlays */}
          {shake === "crit" && (
            <div className="pointer-events-none absolute inset-0 animate-fade-out"
              style={{ background: "radial-gradient(circle at center, hsl(45,90%,60%,0.35) 0%, transparent 60%)" }} />
          )}
          {shake === "fail" && (
            <div className="pointer-events-none absolute inset-0 animate-fade-out"
              style={{ background: "radial-gradient(circle at center, hsl(0,80%,30%,0.5) 0%, transparent 70%)" }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DiceRoller3D;
