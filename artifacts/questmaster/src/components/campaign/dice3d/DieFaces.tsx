// Engraved digits / pips for a die. Labels come from data.faceValues, so a
// remapped PolyhedronData shows the remapped numbers.
import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import type { DieType, PolyhedronData } from "./diceGeometry";

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

export function DieFaces({
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
