import {
  useRef,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars, Line, Billboard, Text } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useQuery } from '@tanstack/react-query';
import { searchTimelines } from '../api/timelineApi';
import { useTimelineStore } from '../store/useTimelineStore';
import type { TimelineEvent, PrecisionLevel } from '../types/timeline';

// ═══════════════════════════════════════════════════════════════════════════
// Constants & Helpers
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORY_COLORS: Record<number, string> = {
  1: '#ff6b6b',
  2: '#51cf66',
  3: '#339af0',
  4: '#fcc419',
  5: '#cc5de8',
  6: '#ff922b',
  7: '#20c997',
  8: '#e64980',
  9: '#74c0fc',
  10: '#a9e34b',
};

const PRECISION_SCALE: Record<PrecisionLevel, number> = {
  BILLION_YEARS: 1.6,
  HUNDRED_MILLION_YEARS: 1.35,
  TEN_MILLION_YEARS: 1.15,
  MILLION_YEARS: 1.0,
  HUNDRED_THOUSAND_YEARS: 0.85,
  TEN_THOUSAND_YEARS: 0.75,
  MILLENNIUM: 0.65,
  CENTURY: 0.55,
  DECADE: 0.48,
  YEAR: 0.42,
  MONTH: 0.38,
  DAY: 0.35,
  HOUR: 0.32,
  MINUTE: 0.3,
  SECOND: 0.28,
};

function categoryColor(id: number): string {
  return CATEGORY_COLORS[((id - 1) % 10) + 1] ?? '#ff6b6b';
}

function nodeRadius(precision: PrecisionLevel): number {
  return PRECISION_SCALE[precision] ?? 0.42;
}

/** Symmetric log: compresses huge spans while preserving sign & relative order */
function symlog(x: number): number {
  return Math.sign(x) * Math.log1p(Math.abs(x));
}

/** Inverse symlog */
function symexp(v: number): number {
  return Math.sign(v) * (Math.exp(Math.abs(v)) - 1);
}

/** Year -> X position on the timeline rail */
function yearToX(year: number): number {
  return symlog(year) * 1.8;
}

/** X position -> approximate year */
function xToYear(x: number): number {
  return symexp(x / 1.8);
}

/** Human-readable year label */
function formatYear(year: number): string {
  const abs = Math.abs(year);
  if (abs >= 1_000_000_000) return `${(year / 1_000_000_000).toFixed(1)} Billion years ago`;
  if (abs >= 1_000_000) return `${(year / 1_000_000).toFixed(1)} Million years ago`;
  if (abs >= 100_000) return `${(year / 1_000).toFixed(0)}K ${year < 0 ? 'BCE' : 'CE'}`;
  if (abs >= 10_000) return `${(year / 1_000).toFixed(1)}K ${year < 0 ? 'BCE' : 'CE'}`;
  if (year < 0) return `${abs} BCE`;
  return `${year} CE`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Demo Data
// ═══════════════════════════════════════════════════════════════════════════

const stub = {
  eventType: 'POINT' as const,
  eventLocalDateTime: null,
  eventUtcDateTime: null,
  timeZone: null,
  source: null,
  createdAt: '',
  updatedAt: '',
  createdBy: '',
  updatedBy: '',
} as const;

const DEMO_EVENTS: TimelineEvent[] = [
  { id: 1, title: 'Big Bang', description: 'The universe begins in an unimaginably hot, dense singularity', categoryId: 1, categoryName: 'Cosmology', eventYear: -13_800_000_000, precisionLevel: 'BILLION_YEARS', eventMonth: null, eventDay: null, sortOrder: 1, uncertaintyYears: 200_000_000, location: null, ...stub },
  { id: 2, title: 'First Stars Ignite', description: 'Hydrogen clouds collapse and the first stars blaze to life', categoryId: 1, categoryName: 'Cosmology', eventYear: -13_200_000_000, precisionLevel: 'BILLION_YEARS', eventMonth: null, eventDay: null, sortOrder: 2, uncertaintyYears: 500_000_000, location: null, ...stub },
  { id: 3, title: 'Solar System Forms', description: 'Our sun and planets coalesce from a swirling nebula', categoryId: 1, categoryName: 'Cosmology', eventYear: -4_600_000_000, precisionLevel: 'BILLION_YEARS', eventMonth: null, eventDay: null, sortOrder: 3, uncertaintyYears: 100_000_000, location: null, ...stub },
  { id: 4, title: 'First Life on Earth', description: 'Single-celled organisms emerge in primordial oceans', categoryId: 2, categoryName: 'Biology', eventYear: -3_800_000_000, precisionLevel: 'BILLION_YEARS', eventMonth: null, eventDay: null, sortOrder: 4, uncertaintyYears: 200_000_000, location: 'Earth', ...stub },
  { id: 5, title: 'Cambrian Explosion', description: 'An extraordinary burst of complex multicellular life', categoryId: 2, categoryName: 'Biology', eventYear: -538_000_000, precisionLevel: 'TEN_MILLION_YEARS', eventMonth: null, eventDay: null, sortOrder: 5, uncertaintyYears: 20_000_000, location: 'Earth', ...stub },
  { id: 6, title: 'Dinosaur Extinction', description: 'A cataclysmic asteroid impact ends 165 million years of dominance', categoryId: 2, categoryName: 'Biology', eventYear: -66_000_000, precisionLevel: 'MILLION_YEARS', eventMonth: null, eventDay: null, sortOrder: 6, uncertaintyYears: 1_000_000, location: 'Chicxulub, Mexico', ...stub },
  { id: 7, title: 'First Humans', description: 'Homo sapiens appear on the African plains', categoryId: 3, categoryName: 'Humanity', eventYear: -300_000, precisionLevel: 'HUNDRED_THOUSAND_YEARS', eventMonth: null, eventDay: null, sortOrder: 7, uncertaintyYears: 50_000, location: 'Africa', ...stub },
  { id: 8, title: 'Dawn of Agriculture', description: 'The Neolithic Revolution transforms human society', categoryId: 3, categoryName: 'Humanity', eventYear: -10_000, precisionLevel: 'MILLENNIUM', eventMonth: null, eventDay: null, sortOrder: 8, uncertaintyYears: 2_000, location: 'Fertile Crescent', ...stub },
  { id: 9, title: 'Rise of Ancient Egypt', description: 'One of history\u2019s greatest civilizations takes shape along the Nile', categoryId: 4, categoryName: 'Civilisation', eventYear: -3_100, precisionLevel: 'CENTURY', eventMonth: null, eventDay: null, sortOrder: 9, uncertaintyYears: 100, location: 'Egypt', ...stub },
  { id: 10, title: 'Roman Empire', description: 'Augustus becomes the first Roman Emperor', categoryId: 4, categoryName: 'Civilisation', eventYear: -27, precisionLevel: 'YEAR', eventMonth: 1, eventDay: 16, sortOrder: 10, uncertaintyYears: null, location: 'Rome', ...stub },
  { id: 11, title: 'Industrial Revolution', description: 'Steam and steel reshape civilisation', categoryId: 5, categoryName: 'Technology', eventYear: 1760, precisionLevel: 'DECADE', eventMonth: null, eventDay: null, sortOrder: 11, uncertaintyYears: 10, location: 'England', ...stub },
  { id: 12, title: 'World War I', description: 'The Great War engulfs Europe', categoryId: 6, categoryName: 'Conflict', eventYear: 1914, precisionLevel: 'YEAR', eventMonth: 7, eventDay: 28, sortOrder: 12, uncertaintyYears: null, location: 'Europe', ...stub },
  { id: 13, title: 'Moon Landing', description: 'Humanity sets foot on another world for the first time', categoryId: 5, categoryName: 'Technology', eventYear: 1969, precisionLevel: 'DAY', eventMonth: 7, eventDay: 20, sortOrder: 13, uncertaintyYears: null, location: 'Sea of Tranquility, Moon', ...stub },
  { id: 14, title: 'World Wide Web', description: 'Tim Berners-Lee connects the world', categoryId: 5, categoryName: 'Technology', eventYear: 1991, precisionLevel: 'YEAR', eventMonth: 8, eventDay: 6, sortOrder: 14, uncertaintyYears: null, location: 'CERN, Switzerland', ...stub },
  { id: 15, title: 'Present Day', description: 'You are here', categoryId: 7, categoryName: 'Modern', eventYear: 2026, precisionLevel: 'YEAR', eventMonth: 3, eventDay: 14, sortOrder: 15, uncertaintyYears: null, location: 'Earth', ...stub },
];

// ═══════════════════════════════════════════════════════════════════════════
// Position computation
// ═══════════════════════════════════════════════════════════════════════════

interface PositionedEvent {
  event: TimelineEvent;
  pos: THREE.Vector3;
  color: string;
  radius: number;
}

function buildPositionedEvents(events: TimelineEvent[]): PositionedEvent[] {
  const sorted = events.slice().sort((a, b) => a.eventYear - b.eventYear);
  return sorted.map((evt, i) => {
    const x = yearToX(evt.eventYear);
    // Gentle sine-wave offsets so the path has organic curvature
    const y = Math.sin(x * 0.12 + i * 0.3) * 1.6 + Math.cos(x * 0.06) * 0.7;
    const z = Math.cos(x * 0.09 + i * 0.5) * 1.4;
    return {
      event: evt,
      pos: new THREE.Vector3(x, y, z),
      color: categoryColor(evt.categoryId),
      radius: nodeRadius(evt.precisionLevel),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

// ── Cosmic Background ────────────────────────────────────────────────────

function CosmicBackground() {
  return (
    <>
      <color attach="background" args={['#010008']} />
      <fog attach="fog" args={['#030018', 80, 250]} />

      {/* Multi-layer starfield for depth */}
      <Stars radius={180} depth={120} count={5000} factor={5} saturation={0.2} fade speed={0.3} />
      <Stars radius={100} depth={80} count={2000} factor={3} saturation={0.6} fade speed={0.15} />

      {/* Ambient cosmic light */}
      <ambientLight intensity={0.06} color="#3333aa" />
      <pointLight position={[-40, 50, -60]} intensity={0.5} color="#5555ff" distance={250} decay={2} />
      <pointLight position={[60, -30, 40]} intensity={0.35} color="#9944ff" distance={200} decay={2} />
      <pointLight position={[0, 20, -20]} intensity={0.2} color="#2266cc" distance={150} decay={2} />
    </>
  );
}

// ── Nebula clouds ────────────────────────────────────────────────────────

function NebulaClouds() {
  const groupRef = useRef<THREE.Group>(null!);

  const clouds = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number; color: string; opacity: number }[] = [];
    const colors = ['#220044', '#110033', '#001144', '#220022', '#0a0033'];
    for (let i = 0; i < 12; i++) {
      result.push({
        pos: [
          (Math.random() - 0.5) * 160,
          (Math.random() - 0.5) * 40,
          -30 - Math.random() * 40,
        ],
        scale: 15 + Math.random() * 25,
        color: colors[i % colors.length],
        opacity: 0.04 + Math.random() * 0.06,
      });
    }
    return result;
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos}>
          <sphereGeometry args={[c.scale, 16, 16]} />
          <meshBasicMaterial
            color={c.color}
            transparent
            opacity={c.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Timeline glowing path ────────────────────────────────────────────────

function TimelinePath({ positioned }: { positioned: PositionedEvent[] }) {
  const curvePoints = useMemo(() => {
    if (positioned.length < 2) return [];

    const pts = positioned.map((p) => p.pos);
    const first = pts[0];
    const last = pts[pts.length - 1];
    const before = new THREE.Vector3(first.x - 10, first.y + 0.5, first.z - 1);
    const after = new THREE.Vector3(last.x + 10, last.y - 0.3, last.z + 0.5);

    const curve = new THREE.CatmullRomCurve3(
      [before, ...pts, after],
      false,
      'catmullrom',
      0.4,
    );
    return curve.getPoints(400);
  }, [positioned]);

  if (curvePoints.length < 2) return null;

  return (
    <>
      {/* Broad soft glow */}
      <Line points={curvePoints} color="#3344aa" lineWidth={8} transparent opacity={0.12} />
      {/* Medium glow */}
      <Line points={curvePoints} color="#5566dd" lineWidth={4} transparent opacity={0.35} />
      {/* Bright core */}
      <Line points={curvePoints} color="#8899ff" lineWidth={1.8} transparent opacity={0.9} />
    </>
  );
}

// ── Single event node ────────────────────────────────────────────────────

function EventNode({
  pe,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onUnhover,
}: {
  pe: PositionedEvent;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const coreRef = useRef<THREE.Mesh>(null!);
  const haloRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const colorObj = useMemo(() => new THREE.Color(pe.color), [pe.color]);
  const active = isSelected || isHovered;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.65 + Math.sin(t * 2.2 + pe.event.id * 1.7) * 0.35;

    // Core sphere
    if (coreRef.current) {
      const targetScale = active ? pe.radius * 1.5 : pe.radius;
      const s = THREE.MathUtils.lerp(coreRef.current.scale.x, targetScale, 0.12);
      coreRef.current.scale.setScalar(s);

      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      const targetEmissive = (active ? 3.0 : 1.4) * pulse;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, 0.1);
    }

    // Outer halo
    if (haloRef.current) {
      const haloTarget = (active ? pe.radius * 3.2 : pe.radius * 2.2) * (0.9 + pulse * 0.3);
      const hs = THREE.MathUtils.lerp(haloRef.current.scale.x, haloTarget, 0.06);
      haloRef.current.scale.setScalar(hs);
      const hMat = haloRef.current.material as THREE.MeshBasicMaterial;
      hMat.opacity = THREE.MathUtils.lerp(hMat.opacity, active ? 0.12 : 0.05, 0.08);
    }

    // Rotating ring for selected/hovered
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      ringRef.current.rotation.x = t * 0.3;
      const ringTarget = active ? pe.radius * 2.4 : 0.001;
      const rs = THREE.MathUtils.lerp(ringRef.current.scale.x, ringTarget, 0.1);
      ringRef.current.scale.setScalar(rs);
    }
  });

  return (
    <group position={pe.pos}>
      {/* Outer halo glow */}
      <mesh ref={haloRef} scale={pe.radius * 2.2}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={pe.color} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Selection ring */}
      <mesh ref={ringRef} scale={0.001}>
        <torusGeometry args={[1, 0.03, 12, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Core sphere */}
      <mesh
        ref={coreRef}
        scale={pe.radius}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onUnhover(); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={1.4}
          roughness={0.15}
          metalness={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* Point light for local illumination */}
      <pointLight color={pe.color} intensity={active ? 4 : 1.2} distance={pe.radius * 8} decay={2} />
    </group>
  );
}

// ── Billboarded labels with distance LOD ─────────────────────────────────

function EventLabels({
  positioned,
  hoveredId,
  selectedId,
}: {
  positioned: PositionedEvent[];
  hoveredId: number | null;
  selectedId: number | null;
}) {
  const { camera } = useThree();
  const [visible, setVisible] = useState<Set<number>>(new Set());

  useFrame(() => {
    const next = new Set<number>();
    for (const pe of positioned) {
      const d = camera.position.distanceTo(pe.pos);
      if (d < 35 || pe.event.id === hoveredId || pe.event.id === selectedId) {
        next.add(pe.event.id);
      }
    }
    if (next.size !== visible.size || [...next].some((id) => !visible.has(id))) {
      setVisible(next);
    }
  });

  return (
    <>
      {positioned
        .filter((pe) => visible.has(pe.event.id))
        .map((pe) => {
          const active = pe.event.id === hoveredId || pe.event.id === selectedId;
          return (
            <Billboard
              key={pe.event.id}
              position={[pe.pos.x, pe.pos.y + pe.radius * 2.5, pe.pos.z]}
              follow
              lockX={false}
              lockY={false}
              lockZ={false}
            >
              <Text
                fontSize={active ? 0.65 : 0.42}
                color={active ? '#ffffff' : '#aabbdd'}
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.04}
                outlineColor="#000011"
                maxWidth={14}
              >
                {pe.event.title}
              </Text>
              <Text
                position={[0, active ? -0.6 : -0.45, 0]}
                fontSize={active ? 0.32 : 0.24}
                color={active ? '#99bbff' : '#667799'}
                anchorX="center"
                anchorY="top"
                outlineWidth={0.02}
                outlineColor="#000011"
              >
                {formatYear(pe.event.eventYear)}
              </Text>
            </Billboard>
          );
        })}
    </>
  );
}

// ── Light trails connecting same-category events ─────────────────────────

function LightTrails({ positioned }: { positioned: PositionedEvent[] }) {
  const trails = useMemo(() => {
    const byCategory: Record<number, PositionedEvent[]> = {};
    for (const pe of positioned) {
      (byCategory[pe.event.categoryId] ??= []).push(pe);
    }
    const result: { points: THREE.Vector3[]; color: string }[] = [];
    for (const group of Object.values(byCategory)) {
      if (group.length < 2) continue;
      const sorted = group.slice().sort((a, b) => a.event.eventYear - b.event.eventYear);
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];
        const mid = new THREE.Vector3().lerpVectors(a.pos, b.pos, 0.5);
        mid.y += 2.0 + Math.random() * 0.5;
        const curve = new THREE.QuadraticBezierCurve3(a.pos, mid, b.pos);
        result.push({ points: curve.getPoints(40), color: a.color });
      }
    }
    return result;
  }, [positioned]);

  return (
    <>
      {trails.map((trail, i) => (
        <Line
          key={i}
          points={trail.points}
          color={trail.color}
          lineWidth={1.2}
          transparent
          opacity={0.1}
        />
      ))}
    </>
  );
}

// ── Floating atmospheric dust particles ──────────────────────────────────

function FloatingParticles() {
  const count = 1200;
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 250;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 70;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.015;
    const attr = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] += Math.sin(t + i * 0.08) * 0.002;
      a[i * 3] += Math.cos(t * 0.7 + i * 0.04) * 0.001;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#5566bb"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Camera controller ────────────────────────────────────────────────────

function CameraController({
  flyTarget,
  onYearChange,
}: {
  flyTarget: THREE.Vector3 | null;
  onYearChange: (year: number) => void;
}) {
  const { camera, gl } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const orbit = useRef({ theta: 0, phi: Math.PI * 0.42, radius: 20 });
  const dragging = useRef(false);
  const lastPtr = useRef({ x: 0, y: 0 });

  // Initial camera setup
  useEffect(() => {
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Pointer & scroll interaction
  useEffect(() => {
    const el = gl.domElement;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      lookAtTarget.current.x += e.deltaY * 0.06;
    };

    const handleDown = (e: PointerEvent) => {
      dragging.current = true;
      lastPtr.current = { x: e.clientX, y: e.clientY };
    };

    const handleMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = (e.clientX - lastPtr.current.x) * 0.004;
      const dy = (e.clientY - lastPtr.current.y) * 0.004;
      orbit.current.theta -= dx;
      orbit.current.phi = THREE.MathUtils.clamp(orbit.current.phi - dy, 0.15, Math.PI - 0.15);
      lastPtr.current = { x: e.clientX, y: e.clientY };
    };

    const handleUp = () => {
      dragging.current = false;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [gl]);

  // Fly to selected event
  useEffect(() => {
    if (flyTarget) {
      lookAtTarget.current.copy(flyTarget);
      orbit.current.theta = 0;
      orbit.current.phi = Math.PI * 0.38;
      orbit.current.radius = 14;
    }
  }, [flyTarget]);

  useFrame(() => {
    const { theta, phi, radius } = orbit.current;

    // Compute desired camera position on an orbit sphere around the look-at target
    const desiredCam = new THREE.Vector3(
      lookAtTarget.current.x + radius * Math.sin(phi) * Math.sin(theta),
      lookAtTarget.current.y + radius * Math.cos(phi),
      lookAtTarget.current.z + radius * Math.sin(phi) * Math.cos(theta),
    );

    camera.position.lerp(desiredCam, 0.045);
    currentLookAt.current.lerp(lookAtTarget.current, 0.055);
    camera.lookAt(currentLookAt.current);

    onYearChange(xToYear(currentLookAt.current.x));
  });

  return null;
}

// ── Time display HUD ─────────────────────────────────────────────────────

function TimeDisplay({ currentYear }: { currentYear: number }) {
  return (
    <Html fullscreen zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
      {/* Current year indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: 3,
          color: '#c0d0ff',
          textShadow: '0 0 16px #4466ff, 0 0 40px #2244cc, 0 0 60px #1122aa',
          background: 'linear-gradient(180deg, rgba(8,8,40,0.7) 0%, rgba(5,5,25,0.85) 100%)',
          padding: '10px 32px',
          borderRadius: 10,
          border: '1px solid rgba(100,130,255,0.2)',
          backdropFilter: 'blur(12px)',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {formatYear(Math.round(currentYear))}
      </div>

      {/* Controls hint */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 24,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontSize: 11,
          lineHeight: 1.9,
          color: '#556688',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: '#8899cc', marginBottom: 6, letterSpacing: 1 }}>
          COSMIC TIMELINE
        </div>
        <div><span style={{ color: '#7788bb' }}>Scroll</span> &mdash; travel through time</div>
        <div><span style={{ color: '#7788bb' }}>Drag</span> &mdash; orbit viewpoint</div>
        <div><span style={{ color: '#7788bb' }}>Click</span> &mdash; focus on event</div>
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          right: 24,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontSize: 10,
          lineHeight: 2,
          color: '#556677',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {Object.entries(CATEGORY_COLORS).slice(0, 7).map(([id, col]) => {
          const labels: Record<string, string> = {
            '1': 'Cosmology',
            '2': 'Biology',
            '3': 'Humanity',
            '4': 'Civilisation',
            '5': 'Technology',
            '6': 'Conflict',
            '7': 'Modern',
          };
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}` }} />
              <span>{labels[id] ?? `Category ${id}`}</span>
            </div>
          );
        })}
      </div>
    </Html>
  );
}

// ── Post-processing effects ──────────────────────────────────────────────

function PostEffects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.12}
        luminanceSmoothing={0.85}
        mipmapBlur
        radius={0.8}
      />
      <Vignette offset={0.35} darkness={0.75} blendFunction={BlendFunction.NORMAL} />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0005, 0.0005) as any}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Scene Assembly
// ═══════════════════════════════════════════════════════════════════════════

function TimelineScene({
  events,
  onYearChange,
  currentYear,
}: {
  events: TimelineEvent[];
  onYearChange: (year: number) => void;
  currentYear: number;
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [flyTarget, setFlyTarget] = useState<THREE.Vector3 | null>(null);

  const selectedEventId = useTimelineStore((s) => s.selectedEventId);
  const setSelectedEventId = useTimelineStore((s) => s.setSelectedEventId);
  const setShowDetailPanel = useTimelineStore((s) => s.setShowDetailPanel);

  const positioned = useMemo(() => buildPositionedEvents(events), [events]);

  const handleSelect = useCallback(
    (pe: PositionedEvent) => {
      setSelectedEventId(pe.event.id);
      setShowDetailPanel(true);
      setFlyTarget(pe.pos.clone());
    },
    [setSelectedEventId, setShowDetailPanel],
  );

  return (
    <>
      <CosmicBackground />
      <NebulaClouds />
      <TimelinePath positioned={positioned} />
      <LightTrails positioned={positioned} />
      <FloatingParticles />

      {positioned.map((pe) => (
        <EventNode
          key={pe.event.id}
          pe={pe}
          isSelected={selectedEventId === pe.event.id}
          isHovered={hoveredId === pe.event.id}
          onSelect={() => handleSelect(pe)}
          onHover={() => setHoveredId(pe.event.id)}
          onUnhover={() => setHoveredId(null)}
        />
      ))}

      <EventLabels positioned={positioned} hoveredId={hoveredId} selectedId={selectedEventId} />

      <CameraController flyTarget={flyTarget} onYearChange={onYearChange} />
      <TimeDisplay currentYear={currentYear} />
      <PostEffects />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Exported Component
// ═══════════════════════════════════════════════════════════════════════════

export default function ThreeTimeline() {
  const [currentYear, setCurrentYear] = useState(0);
  const filters = useTimelineStore((s) => s.filters);
  const setViewport = useTimelineStore((s) => s.setViewport);

  const { data: apiEvents } = useQuery({
    queryKey: ['timelines', 'search', filters],
    queryFn: () => searchTimelines(filters),
    staleTime: 60_000,
  });

  const events = useMemo(() => {
    if (apiEvents && apiEvents.length > 0) return apiEvents;
    return DEMO_EVENTS;
  }, [apiEvents]);

  const handleYearChange = useCallback(
    (year: number) => {
      setCurrentYear(year);
      setViewport({ centerYear: Math.round(year) });
    },
    [setViewport],
  );

  return (
    <div style={{ width: '100%', height: '100%', background: '#010008', position: 'relative' }}>
      <Canvas
        camera={{ fov: 55, near: 0.1, far: 600, position: [0, 10, 20] }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          alpha: false,
        }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <TimelineScene events={events} onYearChange={handleYearChange} currentYear={currentYear} />
      </Canvas>
    </div>
  );
}
