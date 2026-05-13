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

/* ============================================================
 *  Aetheria 3D Dice — physical dice, dark fantasy feel
 *  Tech: react-three-fiber + @react-three/cannon (cannon-es)
 * ============================================================ */

type DieType = 4 | 6 | 8 | 10 | 12 | 20;
const DIE_TYPES: DieType[] = [4, 6, 8, 10, 12, 20];

// Player color presets (HSL kept for brand-alignment with dark fantasy palette)
const COLOR_PRESETS = [
  { name: "Or runique",  base: "#c9a04a", emissive: "#3d2a06", metal: 0.85, rough: 0.25 },
  { name: "Obsidienne",  base: "#1a1a22", emissive: "#3a0066", metal: 0.6,  rough: 0.15 },
  { name: "Sang dragon", base: "#5a0d12", emissive: "#1a0203", metal: 0.4,  rough: 0.4  },
  { name: "Éther bleu",  base: "#1d3a6b", emissive: "#082046", metal: 0.7,  rough: 0.25 },
  { name: "Émeraude",    base: "#0f5132", emissive: "#021a0c", metal: 0.55, rough: 0.3  },
  { name: "Pierre",      base: "#5d5b57", emissive: "#0a0a0a", metal: 0.1,  rough: 0.85 },
  { name: "Améthyste",   base: "#3d1f5c", emissive: "#1a0833", metal: 0.5,  rough: 0.3  },
];

interface DieMaterial {
  base: string;
  emissive: string;
  metal: number;
  rough: number;
}

/* ----------------------------------------------------------
 *  Geometry factories — return geometry + per-face normals
 *  (face normals are used to determine the "up" face)
 * --------------------------------------------------------- */

/**
 * Build a true pentagonal trapezohedron (real d10 shape: 10 congruent kite faces).
 */
function buildPentagonalTrapezohedron(scale = 1): THREE.BufferGeometry {
  const apex = 1.0 * scale;
  const r = 1.0 * scale;
  const z = 0.18 * scale; // equatorial zigzag offset
  const top = new THREE.Vector3(0, 0, apex);
  const bot = new THREE.Vector3(0, 0, -apex);
  const upper: THREE.Vector3[] = [];
  const lower: THREE.Vector3[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    upper.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z));
  }
  for (let i = 0; i < 5; i++) {
    const a = ((i + 0.5) / 5) * Math.PI * 2;
    lower.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, -z));
  }
  // 10 kite faces (each split into 2 triangles for buffer)
  const verts: number[] = [];
  const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    verts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  for (let i = 0; i < 5; i++) {
    const u0 = upper[i], u1 = upper[(i + 1) % 5];
    const l0 = lower[i];
    // Upper kite: top, u0, l0, u1
    pushTri(top, u0, l0);
    pushTri(top, l0, u1);
  }
  for (let i = 0; i < 5; i++) {
    const l0 = lower[i], l1 = lower[(i + 1) % 5];
    const u1 = upper[(i + 1) % 5];
    // Lower kite: bot, l1, u1, l0  (winding for outward normal)
    pushTri(bot, l1, u1);
    pushTri(bot, u1, l0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}

function getPolyhedronData(sides: DieType): {
  geometry: THREE.BufferGeometry;
  faceNormals: THREE.Vector3[];
  faceCenters: THREE.Vector3[];
  faceValues: number[];
  radius: number;
} {
  let geom: THREE.BufferGeometry;
  let radius: number;
  switch (sides) {
    case 4:  geom = new TetrahedronGeometry(0.95); radius = 0.95; break;
    case 6:  geom = new THREE.BoxGeometry(1.4, 1.4, 1.4); radius = 0.7; break;
    case 8:  geom = new OctahedronGeometry(1); radius = 1; break;
    case 10: geom = buildPentagonalTrapezohedron(0.95); radius = 0.95; break;
    case 12: geom = new DodecahedronGeometry(0.95); radius = 0.95; break;
    case 20: geom = new IcosahedronGeometry(0.95); radius = 0.95; break;
  }
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
  if (sides === 10) {
    // Walk 10 faces; assign 1..10 such that opposite (anti-normal) faces sum to 11.
    const used = new Array(10).fill(false);
    const order: number[] = [];
    for (let i = 0; i < 10; i++) {
      if (used[i]) continue;
      // find opposite
      let opp = -1;
      for (let j = 0; j < 10; j++) {
        if (i !== j && faceNormals[i].dot(faceNormals[j]) < -0.95) { opp = j; break; }
      }
      order.push(i);
      if (opp >= 0) order.push(opp);
      used[i] = true;
      if (opp >= 0) used[opp] = true;
    }
    const tmp = new Array(10).fill(0);
    for (let k = 0; k < order.length; k += 2) {
      const v = (k / 2) + 1;
      tmp[order[k]] = v;
      if (order[k + 1] !== undefined) tmp[order[k + 1]] = 11 - v;
    }
    faceValues.push(...tmp);
  } else {
    for (let i = 0; i < faceNormals.length; i++) faceValues.push(i + 1);
  }

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

  // Pre-compute per-face label transforms.
  // Text is oriented so its plane normal matches the face outward normal,
  // and slightly inset away from the surface to fake an engraving.
  const faceLabels = useMemo(() => {
    const up = new THREE.Vector3(0, 0, 1);
    // Determine a reference scale based on the average face-center distance
    const avgRadius = data.faceCenters.reduce((s, c) => s + c.length(), 0) / data.faceCenters.length;
    return data.faceNormals.map((n, i) => {
      const q = new THREE.Quaternion().setFromUnitVectors(up, n.clone().normalize());
      // Sit just outside the face (avoids z-fighting, reads as engraved with emissive)
      const pos = data.faceCenters[i].clone().addScaledVector(n, 0.008);
      const value = data.faceValues[i];
      // Per-die font sizing — tuned per shape so digits are big & legible
      const sizeMap: Record<DieType, number> = {
        4:  avgRadius * 0.55,
        6:  0.55,
        8:  avgRadius * 0.62,
        10: avgRadius * 0.55,
        12: avgRadius * 0.55,
        20: avgRadius * 0.50,
      };
      const size = sizeMap[type];
      // Display 10 as "0" on real d10 face (classic), keep others as digits
      const label = type === 10 && value === 10 ? "0" : `${value}`;
      const needsUnderline = value === 6 || value === 9;
      return {
        pos: pos.toArray() as [number, number, number],
        quat: [q.x, q.y, q.z, q.w] as [number, number, number, number],
        label, size, needsUnderline,
      };
    });
  }, [data, type]);

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
            emissiveIntensity={0.18}
            metalness={material.metal}
            roughness={material.rough}
            clearcoat={0.35}
            clearcoatRoughness={0.55}
            reflectivity={0.45}
            envMapIntensity={0.8}
          />

          {faceLabels.map((f, i) => (
            <group key={i} position={f.pos} quaternion={f.quat}>
              {/* Engraved digit — emissive so it reads as a glowing rune */}
              <Text
                fontSize={f.size}
                color="#fff1c2"
                anchorX="center"
                anchorY="middle"
                outlineWidth={f.size * 0.06}
                outlineColor="#1a0d02"
                outlineOpacity={0.85}
                material-toneMapped={false}
                renderOrder={2}
                position={[0, f.needsUnderline ? f.size * 0.08 : 0, 0]}
              >
                {f.label}
              </Text>
              {/* Tiny dot under 6/9 for orientation — much cleaner than combining underline */}
              {f.needsUnderline && (
                <mesh position={[0, -f.size * 0.42, 0.001]} renderOrder={3}>
                  <circleGeometry args={[f.size * 0.07, 16]} />
                  <meshBasicMaterial color="#fff1c2" toneMapped={false} />
                </mesh>
              )}
            </group>
          ))}
        </mesh>
      </Trail>
    </group>
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
}

const DICE_PRESET_LABELS: Record<DieType, string> = {
  4: "d4", 6: "d6", 8: "d8", 10: "d10", 12: "d12", 20: "d20",
};

const DiceRoller3D = ({ open, onClose }: DiceRoller3DProps) => {
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
      }
      return next;
    });
  }, [modifier]);

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
                  <span className="w-5 text-center text-sm font-medium tabular-nums">{counts[t]}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCount(t, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mod</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setModifier(m => m - 1)}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="flex-1 text-center text-sm font-medium tabular-nums">
              {modifier >= 0 ? `+${modifier}` : modifier}
            </span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setModifier(m => m + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>

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
            camera={{ position: [0, 8, 9], fov: 45 }}
            gl={{ antialias: true, alpha: false }}
            style={{ background: "radial-gradient(ellipse at center, #1a1822 0%, #07060c 70%)" }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.25} />
              <directionalLight
                position={[5, 12, 5]}
                intensity={1.4}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-left={-8}
                shadow-camera-right={8}
                shadow-camera-top={8}
                shadow-camera-bottom={-8}
                color="#fff5d8"
              />
              <pointLight position={[-4, 3, -4]} intensity={0.6} color="#6b3df0" />
              <pointLight position={[4, 3, -4]} intensity={0.5} color="#c9a04a" />

              {/* Critical effect lights */}
              {lastCrit === "success" && !throwing && (
                <pointLight position={[0, 3, 0]} intensity={3} color="#ffd97a" distance={8} />
              )}
              {lastCrit === "fail" && !throwing && (
                <pointLight position={[0, 2, 0]} intensity={2} color="#a01818" distance={6} />
              )}

              <Environment preset="night" />
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
