import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

/**
 * AIAvatarCanvas
 * ----------------
 * Renders a procedurally-animated 3D "AI core" (an icosahedron whose
 * vertices are displaced in real time by a GLSL simplex-noise function)
 * that visually reacts to the interview session's current audio state:
 *
 *   - "idle"      : slow ambient floating, deep cyber-blue/purple pulsation.
 *   - "speaking"  : rapid vibration + spiked displacement, simulating the
 *                   AI's voice output (TTS) intensity.
 *   - "listening" : smooth radiant emerald/cyan ripples reacting to the
 *                   candidate's live microphone input level.
 *
 * Props:
 *   state       : "idle" | "speaking" | "listening"
 *   audioLevel  : number 0..1 — optional real-time amplitude (mic level
 *                 while listening, or a synthetic TTS envelope while
 *                 speaking). Defaults to a gentle synthetic pulse when
 *                 not provided so the avatar never looks static.
 */

// -- GLSL: classic Ashima simplex noise (3D), used to displace vertices
const SIMPLEX_NOISE_GLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uFrequency;
  varying float vDisplacement;
  varying vec3 vNormal;

  ${SIMPLEX_NOISE_GLSL}

  void main() {
    vNormal = normal;
    float noise = snoise(position * uFrequency + uTime);
    float displacement = noise * uAmplitude;
    vDisplacement = displacement;
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uGlow;
  varying float vDisplacement;
  varying vec3 vNormal;

  void main() {
    float mixFactor = clamp(vDisplacement * 2.5 + 0.5, 0.0, 1.0);
    vec3 baseColor = mix(uColorA, uColorB, mixFactor);

    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
    vec3 finalColor = baseColor + fresnel * uGlow * uColorB;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const STATE_CONFIG = {
  idle: {
    colorA: new THREE.Color("#1e1b4b"),
    colorB: new THREE.Color("#818cf8"),
    baseFrequency: 1.1,
    baseAmplitude: 0.12,
    timeSpeed: 0.25,
    glow: 0.5,
    rotationSpeed: 0.08,
  },
  speaking: {
    colorA: new THREE.Color("#312e81"),
    colorB: new THREE.Color("#a78bfa"),
    baseFrequency: 1.6,
    baseAmplitude: 0.22,
    timeSpeed: 1.4,
    glow: 0.9,
    rotationSpeed: 0.18,
  },
  listening: {
    colorA: new THREE.Color("#022c22"),
    colorB: new THREE.Color("#34d399"),
    baseFrequency: 1.3,
    baseAmplitude: 0.16,
    timeSpeed: 0.7,
    glow: 1.0,
    rotationSpeed: 0.12,
  },
};

function AICore({ state = "idle", audioLevel = 0 }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  // Lazy-initialized so Math.random() runs once on mount, not on every render.
  const clockOffsetRef = useRef(null);
  if (clockOffsetRef.current === null) {
    clockOffsetRef.current = Math.random() * 100;
  }

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 0.12 },
      uFrequency: { value: 1.1 },
      uColorA: { value: new THREE.Color("#1e1b4b") },
      uColorB: { value: new THREE.Color("#818cf8") },
      uGlow: { value: 0.5 },
    }),
    []
  );

  useFrame((_, delta) => {
    const config = STATE_CONFIG[state] || STATE_CONFIG.idle;
    const mat = materialRef.current;
    const mesh = meshRef.current;
    if (!mat || !mesh) return;

    // Synthetic gentle pulse fallback so the avatar always feels alive,
    // layered with real audioLevel (mic amplitude / TTS envelope) when present.
    const syntheticPulse =
      0.5 + 0.5 * Math.sin(performance.now() * 0.002 + clockOffsetRef.current);
    const activity = Math.max(audioLevel, state === "idle" ? syntheticPulse * 0.3 : syntheticPulse * 0.6);

    uniforms.uTime.value += delta * config.timeSpeed * (1 + activity * 1.5);
    uniforms.uFrequency.value = THREE.MathUtils.lerp(
      uniforms.uFrequency.value,
      config.baseFrequency,
      0.05
    );
    uniforms.uAmplitude.value = THREE.MathUtils.lerp(
      uniforms.uAmplitude.value,
      config.baseAmplitude + activity * (state === "speaking" ? 0.35 : 0.2),
      0.1
    );
    uniforms.uGlow.value = THREE.MathUtils.lerp(uniforms.uGlow.value, config.glow, 0.08);
    uniforms.uColorA.value.lerp(config.colorA, 0.05);
    uniforms.uColorB.value.lerp(config.colorB, 0.05);

    mesh.rotation.y += delta * config.rotationSpeed;
    mesh.rotation.x += delta * config.rotationSpeed * 0.3;

    // Gentle ambient float
    mesh.position.y = Math.sin(performance.now() * 0.0008 + clockOffsetRef.current) * 0.15;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.4, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        wireframe={false}
      />
    </mesh>
  );
}

function OuterRipple({ state = "idle", audioLevel = 0 }) {
  const ringRef = useRef(null);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    const active = state === "listening";
    const targetScale = active ? 1.9 + audioLevel * 0.6 : 1.6;
    ringRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.06
    );
    ringRef.current.rotation.z += delta * (active ? 0.4 : 0.1);
    const mat = ringRef.current.material;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, active ? 0.35 + audioLevel * 0.3 : 0.12, 0.08);
    mat.color.lerp(
      new THREE.Color(state === "listening" ? "#34d399" : state === "speaking" ? "#a78bfa" : "#6366f1"),
      0.05
    );
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
      <torusGeometry args={[1.6, 0.015, 16, 100]} />
      <meshBasicMaterial color="#6366f1" transparent opacity={0.15} />
    </mesh>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} color="#c7d2fe" />
      <pointLight position={[-3, -2, -4]} intensity={0.8} color="#34d399" />
      <pointLight position={[2, -3, 3]} intensity={0.6} color="#a78bfa" />
    </>
  );
}

export default function AIAvatarCanvas({ state = "idle", audioLevel = 0, className = "" }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Suspense fallback={null}>
          <SceneLighting />
          <AICore state={state} audioLevel={audioLevel} />
          <OuterRipple state={state} audioLevel={audioLevel} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 2.6}
          maxPolarAngle={Math.PI / 1.6}
        />
      </Canvas>
    </div>
  );
}
