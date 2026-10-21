/// <reference types="@react-three/fiber" />
// Transparent 3D layer drawn over the map: replays other players' 3D rolls.
// Physics are simulated up front (simulateThrow) and faces relabelled so every
// die lands on the value the author really rolled.
import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COLOR_PRESETS, getPolyhedronData, type DieType, type PolyhedronData } from "./diceGeometry";
import { DieFaces } from "./DieFaces";
import { remapFaceValues, type SharedRoll } from "./sharedRoll";
import { SIM_FPS, simulateThrow, type DieTrack } from "./simulateThrow";

const HOLD_SECONDS = 2.6;
const FADE_SECONDS = 0.4;
const HALF_DEPTH = 4;

const baseDataCache = new Map<DieType, PolyhedronData>();
function baseData(type: DieType): PolyhedronData {
  let data = baseDataCache.get(type);
  if (!data) {
    data = getPolyhedronData(type);
    baseDataCache.set(type, data);
  }
  return data;
}

interface PreparedDie {
  key: string;
  data: PolyhedronData;
  track: DieTrack;
}

function ReplayRoll({ roll, onDone }: { roll: SharedRoll; onDone: (id: string) => void }) {
  const size = useThree((s) => s.size);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const elapsed = useRef(0);
  const finished = useRef(false);

  const prepared = useMemo<PreparedDie[]>(() => {
    const aspect = size.width / Math.max(1, size.height);
    // Keep dice in the middle of the map, away from side panels.
    const halfWidth = Math.min(7, Math.max(2.6, HALF_DEPTH * 0.75 * aspect));
    const bases = roll.dice.map((d) => baseData(d.type));
    const tracks = simulateThrow(bases, { halfWidth, halfDepth: HALF_DEPTH });
    return roll.dice.map((d, i) => ({
      key: `${roll.id}-${i}`,
      track: tracks[i],
      data: { ...bases[i], faceValues: remapFaceValues(bases[i].faceValues, tracks[i].landedFace, d.value) },
    }));
    // Simulate once per roll; later resizes must not restart the throw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll.id]);

  const duration = useMemo(
    () => Math.max(...prepared.map((p) => p.track.frameCount)) / SIM_FPS,
    [prepared],
  );

  const preset = COLOR_PRESETS[roll.color] ?? COLOR_PRESETS[0];

  useFrame((_, delta) => {
    if (finished.current) return;
    elapsed.current += Math.min(delta, 0.1);
    const t = elapsed.current;
    const fadeStart = duration + HOLD_SECONDS;
    const scale = t <= fadeStart ? 1 : Math.max(0, 1 - (t - fadeStart) / FADE_SECONDS);

    prepared.forEach((p, i) => {
      const group = groupRefs.current[i];
      if (!group) return;
      const frame = Math.min(p.track.frameCount - 1, Math.floor(t * SIM_FPS));
      const o = frame * 7;
      const f = p.track.frames;
      group.position.set(f[o], f[o + 1], f[o + 2]);
      group.quaternion.set(f[o + 3], f[o + 4], f[o + 5], f[o + 6]);
      group.scale.setScalar(Math.max(0.001, scale));
    });

    if (scale <= 0) {
      finished.current = true;
      onDone(roll.id);
    }
  });

  return (
    <>
      {prepared.map((p, i) => (
        <group key={p.key} ref={(el) => { groupRefs.current[i] = el; }} scale={0.001}>
          <mesh geometry={p.data.geometry} castShadow>
            <meshStandardMaterial
              color={preset.base}
              emissive={preset.emissive}
              emissiveIntensity={0.25}
              metalness={Math.min(preset.metal, 0.45)}
              roughness={preset.rough}
            />
            <DieFaces type={roll.dice[i].type} data={p.data} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function ShadowFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <shadowMaterial opacity={0.35} />
    </mesh>
  );
}

interface SharedDiceSceneProps {
  rolls: SharedRoll[];
  onDone: (id: string) => void;
}

const SharedDiceScene = ({ rolls, onDone }: SharedDiceSceneProps) => (
  <Canvas
    shadows
    dpr={[1, 1.5]}
    gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
    camera={{ position: [0, 22, 9.5], fov: 34 }}
    onCreated={({ camera, gl }) => {
      camera.lookAt(0, 0, 0);
      gl.setClearColor(0x000000, 0);
    }}
    style={{ background: "transparent" }}
  >
    <ambientLight intensity={0.8} />
    <hemisphereLight args={["#fff1cc", "#1a1430", 0.7]} />
    <directionalLight
      castShadow
      position={[4, 14, 6]}
      intensity={2.4}
      color="#fff1cc"
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-left={-9}
      shadow-camera-right={9}
      shadow-camera-top={9}
      shadow-camera-bottom={-9}
    />
    <pointLight position={[-4, 5, -3]} intensity={0.6} color="#c9a04a" distance={16} />
    <ShadowFloor />
    {rolls.map((roll) => (
      <ReplayRoll key={roll.id} roll={roll} onDone={onDone} />
    ))}
  </Canvas>
);

export default SharedDiceScene;
