import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import * as THREE from 'three';
import { tokenColor } from '../lib/color';

type Point3 = [number, number, number];

export interface HiddenState3DProps {
  tokens: string[];
  points: number[][];
  variance?: number[];
}

function toPoint3(point: number[] | undefined): Point3 {
  return [point?.[0] ?? 0, point?.[1] ?? 0, point?.[2] ?? 0];
}

function Bounds({ extent }: { extent: number }) {
  return (
    <>
      <Line points={[[-extent, 0, 0], [extent, 0, 0]]} color="#475569" lineWidth={1} transparent opacity={0.45} />
      <Line points={[[0, -extent, 0], [0, extent, 0]]} color="#475569" lineWidth={1} transparent opacity={0.45} />
      <Line points={[[0, 0, -extent], [0, 0, extent]]} color="#475569" lineWidth={1} transparent opacity={0.45} />
      <Text position={[extent + 0.35, 0, 0]} fontSize={0.24} color="#cbd5e1">
        X
      </Text>
      <Text position={[0, extent + 0.35, 0]} fontSize={0.24} color="#cbd5e1">
        Y
      </Text>
      <Text position={[0, 0, extent + 0.35]} fontSize={0.24} color="#cbd5e1">
        Z
      </Text>
    </>
  );
}

function CameraFit({ points }: { points: Point3[] }) {
  const { camera } = useThree();

  useEffect(() => {
    if (points.length === 0) {
      camera.position.set(3.8, 3.8, 6.2);
      camera.lookAt(0, 0, 0);
      return;
    }

    const center = new THREE.Vector3();
    const vectors = points.map((point) => new THREE.Vector3(point[0], point[1], point[2]));

    for (const vector of vectors) {
      center.add(vector);
    }
    center.divideScalar(vectors.length);

    let maxRadius = 0;
    for (const vector of vectors) {
      const distance = vector.distanceTo(center);
      if (distance > maxRadius) {
        maxRadius = distance;
      }
    }

    const fittedRadius = Math.max(maxRadius, 1);
    const direction = new THREE.Vector3(1, 0.8, 1.2).normalize();

    if (camera instanceof THREE.PerspectiveCamera) {
      const fovRadians = THREE.MathUtils.degToRad(camera.fov);
      const distance = (fittedRadius / Math.tan(fovRadians / 2)) * 1.2;
      camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      return;
    }

    camera.position.copy(center.clone().add(direction.multiplyScalar(fittedRadius * 2.4)));
    camera.lookAt(center);
  }, [camera, points]);

  return null;
}

interface TokenSphereProps {
  position: Point3;
  color: string;
  label: string;
  index: number;
  hovered: number | null;
  onHover: (index: number | null) => void;
}

function TokenSphere({ position, color, label, index, hovered, onHover }: TokenSphereProps) {
  const isHovered = hovered === index;
  const isDimmed = hovered !== null && !isHovered;
  const targetScale = isHovered ? 1.8 : 1;
  const opacity = isDimmed ? 0.3 : 1;
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) {
      return;
    }

    const currentScale = meshRef.current.scale.x;
    const nextScale = currentScale + (targetScale - currentScale) * 0.15;
    meshRef.current.scale.setScalar(nextScale);
  });

  const [x, y, z] = position;
  const labelText = isHovered
    ? `${label} [${index}]\n(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`
    : label;
  const labelSize = isHovered ? 0.26 : 0.18;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(index);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onHover(null);
        }}
      >
        <sphereGeometry args={[0.07, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={opacity}
        />
      </mesh>
      <Billboard position={[x + 0.2, y + 0.2, z + 0.2]} follow>
        <Text
          fontSize={labelSize}
          color={color}
          anchorX="left"
          anchorY="middle"
          fillOpacity={opacity}
        >
          {labelText}
        </Text>
      </Billboard>
    </group>
  );
}

function SequentialPath({ points, total }: { points: Point3[]; total: number }) {
  if (points.length < 2) {
    return null;
  }

  const segments: ReactElement[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    const colorA = new THREE.Color(tokenColor(index, total));
    const colorB = new THREE.Color(tokenColor(index + 1, total));

    segments.push(
      <Line
        key={`segment-${index}`}
        points={[from, to]}
        vertexColors={[colorA, colorB]}
        color={colorA}
        lineWidth={2}
        transparent
        opacity={0.4}
      />,
    );
  }

  return <>{segments}</>;
}

function AnimatedTokenCloud({ tokens, points }: Omit<HiddenState3DProps, 'variance'>) {
  const normalizedPoints = useMemo<Point3[]>(() => points.map((point) => toPoint3(point)), [points]);
  const [hovered, setHovered] = useState<number | null>(null);
  const targetRef = useRef<Point3[]>(normalizedPoints.map((point) => [...point] as Point3));
  const [animatedPoints, setAnimatedPoints] = useState<Point3[]>(() =>
    normalizedPoints.map(() => [0, 0, 0]),
  );

  useEffect(() => {
    targetRef.current = normalizedPoints.map((point) => [...point] as Point3);
    setAnimatedPoints((current) => {
      if (current.length === normalizedPoints.length) {
        return current;
      }
      return normalizedPoints.map(() => [0, 0, 0]);
    });
  }, [normalizedPoints]);

  useFrame((_, delta) => {
    const alpha = 1 - Math.exp(-delta / 0.12);

    setAnimatedPoints((current) => {
      if (current.length !== targetRef.current.length) {
        return targetRef.current.map(() => [0, 0, 0]);
      }

      let changed = false;
      const next = current.map((point, pointIndex) => {
        const target = targetRef.current[pointIndex] ?? [0, 0, 0];
        const nextPoint: Point3 = [0, 0, 0];

        for (let axis = 0; axis < 3; axis += 1) {
          const updated = point[axis] + (target[axis] - point[axis]) * alpha;
          nextPoint[axis] = updated;
          if (Math.abs(updated - point[axis]) > 0.0001) {
            changed = true;
          }
        }

        return nextPoint;
      });

      return changed ? next : current;
    });
  });

  const extent = useMemo(() => {
    const absoluteValues = normalizedPoints.flatMap((point) => point.map((value) => Math.abs(value)));
    return Math.max(1, ...absoluteValues) * 1.15;
  }, [normalizedPoints]);

  const handleHover = useCallback((index: number | null) => {
    setHovered(index);
  }, []);

  return (
    <>
      <Bounds extent={extent} />
      <CameraFit points={normalizedPoints} />
      <SequentialPath points={animatedPoints} total={tokens.length} />
      {animatedPoints.map((point, index) => (
        <TokenSphere
          key={`${tokens[index] ?? 'token'}-${index}`}
          position={point}
          color={tokenColor(index, tokens.length)}
          label={tokens[index] ?? ''}
          index={index}
          hovered={hovered}
          onHover={handleHover}
        />
      ))}
    </>
  );
}

export default function HiddenState3D({ tokens, points, variance }: HiddenState3DProps) {
  const [autoRotate, setAutoRotate] = useState(false);

  const axisNames = ['X axis', 'Y axis', 'Z axis'];
  const varianceLabel = variance && variance.length > 0
    ? variance.map((value, index) => `${axisNames[index] ?? `Axis ${index + 1}`}: ${Math.round(value * 100)}% of variation`).join('  ')
    : null;

  return (
    <div
      className="relative h-[340px] w-full overflow-hidden rounded-2xl"
      onDoubleClick={() => setAutoRotate((value) => !value)}
    >
      {varianceLabel ? (
        <div className="absolute left-3 top-3 z-10 rounded bg-slate-900/80 px-2 py-1 font-mono text-xs text-slate-300">
          {varianceLabel}
        </div>
      ) : null}
      <Canvas camera={{ position: [3.8, 3.8, 6.2], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <AnimatedTokenCloud tokens={tokens} points={points} />
        <OrbitControls autoRotate={autoRotate} autoRotateSpeed={1.1} enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}
