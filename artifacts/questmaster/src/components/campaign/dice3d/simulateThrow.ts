// Offline physics for shared table dice: the whole throw is simulated up front
// with cannon-es, then replayed frame by frame. Knowing the landed face before
// playback lets us relabel faces so the die shows the author's real result.
import * as CANNON from "cannon-es";
import * as THREE from "three";
import { getConvexArgs, type PolyhedronData } from "./diceGeometry";

export const SIM_FPS = 60;
const MAX_STEPS = SIM_FPS * 7;
const STILL_FRAMES = 12;
const STILL_SPEED = 0.06;

export interface ThrowBounds {
  halfWidth: number;
  halfDepth: number;
}

export interface DieTrack {
  /** 7 numbers per frame: x, y, z, qx, qy, qz, qw. */
  frames: Float32Array;
  frameCount: number;
  landedFace: number;
}

const convexCache = new WeakMap<THREE.BufferGeometry, CANNON.ConvexPolyhedron>();

function shapeFor(data: PolyhedronData): CANNON.ConvexPolyhedron {
  const cached = convexCache.get(data.geometry);
  if (cached) return cached;
  const [verts, faces] = getConvexArgs(data.geometry);
  const shape = new CANNON.ConvexPolyhedron({
    vertices: verts.map(([x, y, z]) => new CANNON.Vec3(x, y, z)),
    faces,
  });
  convexCache.set(data.geometry, shape);
  return shape;
}

function addWall(world: CANNON.World, position: [number, number, number], euler: [number, number, number], material: CANNON.Material) {
  const body = new CANNON.Body({ mass: 0, material, shape: new CANNON.Plane() });
  body.position.set(...position);
  body.quaternion.setFromEuler(...euler);
  world.addBody(body);
}

function landedFaceOf(data: PolyhedronData, q: CANNON.Quaternion): number {
  const quat = new THREE.Quaternion(q.x, q.y, q.z, q.w);
  const up = new THREE.Vector3(0, 1, 0);
  let best = 0;
  let bestDot = -Infinity;
  data.faceNormals.forEach((n, i) => {
    const d = n.clone().applyQuaternion(quat).dot(up);
    if (d > bestDot) { bestDot = d; best = i; }
  });
  return best;
}

export function simulateThrow(
  dice: PolyhedronData[],
  bounds: ThrowBounds,
  random: () => number = Math.random,
): DieTrack[] {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -28, 0) });
  (world.solver as CANNON.GSSolver).iterations = 12;
  world.defaultContactMaterial.friction = 0.4;
  world.defaultContactMaterial.restitution = 0.4;

  const tableMaterial = new CANNON.Material("table");
  const dieMaterial = new CANNON.Material("die");
  world.addContactMaterial(new CANNON.ContactMaterial(tableMaterial, dieMaterial, { friction: 0.5, restitution: 0.3 }));
  world.addContactMaterial(new CANNON.ContactMaterial(dieMaterial, dieMaterial, { friction: 0.35, restitution: 0.45 }));

  const { halfWidth: hw, halfDepth: hd } = bounds;
  addWall(world, [0, 0, 0], [-Math.PI / 2, 0, 0], tableMaterial);
  addWall(world, [0, 0, -hd], [0, 0, 0], tableMaterial);
  addWall(world, [0, 0, hd], [0, Math.PI, 0], tableMaterial);
  addWall(world, [-hw, 0, 0], [0, Math.PI / 2, 0], tableMaterial);
  addWall(world, [hw, 0, 0], [0, -Math.PI / 2, 0], tableMaterial);

  // One "hand" throw: every die comes from the same side with some spread.
  const angle = random() * Math.PI * 2;
  const bodies = dice.map((data) => {
    const a = angle + (random() - 0.5) * 0.8;
    const body = new CANNON.Body({
      mass: 1.2,
      material: dieMaterial,
      shape: shapeFor(data),
      linearDamping: 0.12,
      angularDamping: 0.15,
    });
    body.position.set(
      Math.cos(a) * (hw - 0.9),
      3.5 + random() * 1.5,
      Math.sin(a) * (hd - 0.9),
    );
    body.quaternion.setFromEuler(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    const speed = 4 + random() * 3;
    body.velocity.set(-Math.cos(a) * speed, 1 + random() * 2, -Math.sin(a) * speed);
    body.angularVelocity.set((random() - 0.5) * 18, (random() - 0.5) * 18, (random() - 0.5) * 18);
    world.addBody(body);
    return body;
  });

  const recorded: number[][] = bodies.map(() => []);
  const still = bodies.map(() => 0);
  let steps = 0;
  for (; steps < MAX_STEPS; steps++) {
    world.step(1 / SIM_FPS);
    let allStill = true;
    bodies.forEach((b, i) => {
      const p = b.position;
      const q = b.quaternion;
      recorded[i].push(p.x, p.y, p.z, q.x, q.y, q.z, q.w);
      const moving = b.velocity.length() > STILL_SPEED || b.angularVelocity.length() > STILL_SPEED;
      still[i] = moving ? 0 : still[i] + 1;
      if (still[i] < STILL_FRAMES) allStill = false;
    });
    if (allStill) break;
  }

  return bodies.map((b, i) => ({
    frames: Float32Array.from(recorded[i]),
    frameCount: recorded[i].length / 7,
    landedFace: landedFaceOf(dice[i], b.quaternion),
  }));
}
