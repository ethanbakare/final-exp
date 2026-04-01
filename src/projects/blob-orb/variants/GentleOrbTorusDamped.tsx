/**
 * FINAL VARIANT: GentleOrbTorusDamped
 *
 * Same as GentleOrbTorus but displacement is dampened on the inner face
 * of the tube. The outer half reacts normally to audio; from the halfway
 * point inward, displacement gradually fades to zero so the inner hole
 * edge stays as a clean, stable circle.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fragmentShader } from "../shaders/fragmentShader";
import { AudioData, OrbConfig } from "../types";

const NUM_WAVES = 8;

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying float vDisplacement;

  uniform float uTime;
  uniform float uBreathScale;
  uniform float uMaxDisp;
  uniform float uWaveAmps[${NUM_WAVES}];
  uniform float uWaveFreqs[${NUM_WAVES}];
  uniform float uWavePhases[${NUM_WAVES}];

  // Pre-defined wave direction vectors (spread across sphere surface)
  vec3 getWaveDir(int idx) {
    if (idx == 0) return normalize(vec3(1.0, 0.0, 0.0));
    if (idx == 1) return normalize(vec3(0.0, 1.0, 0.0));
    if (idx == 2) return normalize(vec3(0.0, 0.0, 1.0));
    if (idx == 3) return normalize(vec3(1.0, 1.0, 0.0));
    if (idx == 4) return normalize(vec3(1.0, 0.0, 1.0));
    if (idx == 5) return normalize(vec3(0.0, 1.0, 1.0));
    if (idx == 6) return normalize(vec3(1.0, -1.0, 0.0));
    return normalize(vec3(-1.0, 0.0, 1.0));
  }

  void main() {
    vUv = uv;
    vWorldNormal = normalize(normal);
    vNormal = normalize(normalMatrix * normal);

    float displacement = uBreathScale;

    for (int i = 0; i < ${NUM_WAVES}; i++) {
      vec3 dir = getWaveDir(i);
      float projection = dot(normal, dir);
      displacement += uWaveAmps[i] * sin(projection * uWaveFreqs[i] + uWavePhases[i]);
    }

    displacement = clamp(displacement, -uMaxDisp, uMaxDisp);

    // --- Inner-face dampening ---
    // uv.y goes 0 -> 1 around the tube cross-section.
    // 0.0 / 1.0 = outer edge, 0.5 = inner edge (facing the hole).
    // innerness: 0 at outer, 1 at inner
    float innerness = 1.0 - abs(uv.y * 2.0 - 1.0);
    // Fade displacement from 70% (outer) to 30% (inner)
    float dampening = smoothstep(0.3, 0.8, innerness);
    displacement *= mix(0.7, 0.3, dampening);

    vDisplacement = displacement;

    vec3 newPosition = position + normal * displacement;
    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

interface Props {
  audioData: AudioData;
  config: OrbConfig;
}

const GentleOrbTorusDamped: React.FC<Props> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothedAmps = useRef(new Float32Array(NUM_WAVES));
  const phases = useRef(new Float32Array(NUM_WAVES));

  // Same base frequencies as original
  const baseFreqs = useMemo(() => [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 10.0], []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(config.palette[0]) },
    uColor2: { value: new THREE.Color(config.palette[1]) },
    uColor3: { value: new THREE.Color(config.palette[2]) },
    uBreathScale: { value: 0 },
    uMaxDisp: { value: config.maxDisplacement },
    uWaveAmps: { value: new Float32Array(NUM_WAVES) },
    uWaveFreqs: { value: new Float32Array(baseFreqs) },
    uWavePhases: { value: new Float32Array(NUM_WAVES) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [baseFreqs]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    const time = state.clock.getElapsedTime();

    // Update dynamic uniforms from config every frame (smooth slider response)
    materialRef.current.uniforms.uMaxDisp.value = config.maxDisplacement;
    materialRef.current.uniforms.uColor1.value.set(config.palette[0]);
    materialRef.current.uniforms.uColor2.value.set(config.palette[1]);
    materialRef.current.uniforms.uColor3.value.set(config.palette[2]);

    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    materialRef.current.uniforms.uBreathScale.value = breathCycle * config.breatheAmp;

    const b = audioData.bass;
    const m = audioData.mid;
    const t = audioData.treble;

    // Same mapping as original but all audio multipliers halved (50% reaction)
    const targets = new Float32Array(NUM_WAVES);
    const maxD = config.maxDisplacement;
    const idleAmp = maxD * 0.04;
    targets[0] = idleAmp + b * maxD * 0.2;
    targets[1] = idleAmp + b * maxD * 0.15;
    targets[2] = idleAmp + b * maxD * 0.125;
    targets[3] = idleAmp + m * maxD * 0.175;
    targets[4] = idleAmp + m * maxD * 0.15;
    targets[5] = idleAmp + m * maxD * 0.125;
    targets[6] = idleAmp + t * maxD * 0.1;
    targets[7] = idleAmp + t * maxD * 0.075;

    // Constant asymmetric rates — no silent-mode override
    for (let i = 0; i < NUM_WAVES; i++) {
      const rate = targets[i] > smoothedAmps.current[i] ? 0.15 : 0.02;
      smoothedAmps.current[i] += (targets[i] - smoothedAmps.current[i]) * rate;
    }

    // Phase advances — same as original
    const speedMod = 1.0 + (b + m) * 2.0;
    for (let i = 0; i < NUM_WAVES; i++) {
      phases.current[i] += delta * (0.5 + i * 0.3) * speedMod;
    }

    materialRef.current.uniforms.uWaveAmps.value = smoothedAmps.current;
    materialRef.current.uniforms.uWavePhases.value = phases.current;
    materialRef.current.uniforms.uTime.value = time;

    // No rotation — torus faces camera via parent group tilt.
    // Wave displacement provides all the visual movement.
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.85, 0.15, 64, 128]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};

export default GentleOrbTorusDamped;
