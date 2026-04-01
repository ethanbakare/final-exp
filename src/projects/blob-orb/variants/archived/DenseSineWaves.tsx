/**
 * ARCHIVED — Foundation for CoralStone. Superseded by the hue-shift shader
 * variant which solved the brown-valley problem with colour-temperature contrast.
 *
 * Variant: Dense Sine Waves
 *
 * Extends the LayeredSineWaves concept with 24 waves at higher spatial
 * frequencies spread across many directions. The higher count and frequency
 * create denser, more granular surface texture — lots of small bumps
 * from constructive interference rather than broad undulations.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { bumpFragmentShader } from "../../shaders/bumpFragmentShader";
import { AudioData, OrbConfig } from "../../types";

const NUM_WAVES = 24;

// Pre-generate 24 well-distributed direction vectors using golden spiral
const DIRECTIONS: [number, number, number][] = [];
for (let i = 0; i < NUM_WAVES; i++) {
  const golden = (1 + Math.sqrt(5)) / 2;
  const theta = Math.acos(1 - (2 * (i + 0.5)) / NUM_WAVES);
  const phi = (2 * Math.PI * i) / golden;
  DIRECTIONS.push([
    Math.sin(theta) * Math.cos(phi),
    Math.sin(theta) * Math.sin(phi),
    Math.cos(theta),
  ]);
}

// Build the direction lookup as GLSL
const dirGlsl = DIRECTIONS.map(
  (d, i) =>
    `  if (idx == ${i}) return vec3(${d[0].toFixed(4)}, ${d[1].toFixed(4)}, ${d[2].toFixed(4)});`
).join("\n");

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vBumpNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldBumpNormal;
  varying float vDisplacement;

  uniform float uTime;
  uniform float uBreathScale;
  uniform float uMaxDisp;
  uniform float uWaveAmps[${NUM_WAVES}];
  uniform float uWaveFreqs[${NUM_WAVES}];
  uniform float uWavePhases[${NUM_WAVES}];

  vec3 getWaveDir(int idx) {
${dirGlsl}
    return vec3(1.0, 0.0, 0.0);
  }

  // Compute total displacement for a given surface normal direction
  float calcDisplacement(vec3 n) {
    float d = uBreathScale;
    for (int i = 0; i < ${NUM_WAVES}; i++) {
      vec3 dir = getWaveDir(i);
      float projection = dot(n, dir);
      d += uWaveAmps[i] * sin(projection * uWaveFreqs[i] + uWavePhases[i]);
    }
    return clamp(d, -uMaxDisp, uMaxDisp);
  }

  void main() {
    vUv = uv;
    vec3 n = normalize(normal);
    vWorldNormal = n;
    vNormal = normalize(normalMatrix * n);

    // Displaced position
    float displacement = calcDisplacement(n);
    vDisplacement = displacement;
    vec3 newPosition = position + n * displacement;

    // --- Recalculate normal via finite differences ---
    // Build tangent frame on the sphere surface
    vec3 tangent = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 bitangent = normalize(cross(n, tangent));

    // Sample displacement at small offsets along tangent and bitangent
    float eps = 0.005;
    vec3 nT = normalize(n + tangent * eps);
    vec3 nB = normalize(n + bitangent * eps);

    float dT = calcDisplacement(nT);
    float dB = calcDisplacement(nB);

    // Compute displaced neighbour positions
    vec3 posT = (n + tangent * eps) + nT * dT;
    vec3 posB = (n + bitangent * eps) + nB * dB;

    // New normal from cross product of displaced surface vectors
    vec3 bumpNormal = normalize(cross(posT - newPosition, posB - newPosition));

    // Ensure bump normal points outward (same hemisphere as original normal)
    if (dot(bumpNormal, n) < 0.0) bumpNormal = -bumpNormal;

    vWorldBumpNormal = bumpNormal;
    vBumpNormal = normalize(normalMatrix * bumpNormal);

    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

interface Props {
  audioData: AudioData;
  config: OrbConfig;
}

const DenseSineWaves: React.FC<Props> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothedAmps = useRef(new Float32Array(NUM_WAVES));
  const phases = useRef(new Float32Array(NUM_WAVES));

  // Higher base frequencies for denser bumps (8-20 range vs original 2-10)
  const baseFreqs = useMemo(() => {
    const freqs = new Float32Array(NUM_WAVES);
    for (let i = 0; i < NUM_WAVES; i++) {
      freqs[i] = 6.0 + i * 0.7; // 6.0 to ~22.8
    }
    return freqs;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(config.palette[0]) },
      uColor2: { value: new THREE.Color(config.palette[1]) },
      uColor3: { value: new THREE.Color(config.palette[2]) },
      uBreathScale: { value: 0 },
      uMaxDisp: { value: config.maxDisplacement },
      uWaveAmps: { value: new Float32Array(NUM_WAVES) },
      uWaveFreqs: { value: new Float32Array(baseFreqs) },
      uWavePhases: { value: new Float32Array(NUM_WAVES) },
    }),
    [config.palette, config.maxDisplacement, baseFreqs]
  );

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    const time = state.clock.getElapsedTime();

    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    materialRef.current.uniforms.uBreathScale.value = breathCycle * config.breatheAmp;

    const b = audioData.bass;
    const m = audioData.mid;
    const t = audioData.treble;

    // Map audio bands across 24 waves:
    // 0-7: bass, 8-17: mid, 18-23: treble
    const targets = new Float32Array(NUM_WAVES);
    const maxD = config.maxDisplacement;
    const idleAmp = maxD * 0.02; // Subtle idle floor

    for (let i = 0; i < 8; i++) {
      targets[i] = idleAmp + b * maxD * (0.15 - i * 0.01);
    }
    for (let i = 8; i < 18; i++) {
      targets[i] = idleAmp + m * maxD * (0.12 - (i - 8) * 0.006);
    }
    for (let i = 18; i < NUM_WAVES; i++) {
      targets[i] = idleAmp + t * maxD * (0.08 - (i - 18) * 0.008);
    }

    // Constant asymmetric rates — no silent-mode override
    for (let i = 0; i < NUM_WAVES; i++) {
      const rate = targets[i] > smoothedAmps.current[i] ? 0.15 : 0.02;
      smoothedAmps.current[i] += (targets[i] - smoothedAmps.current[i]) * rate;
    }

    // Phase advances — speed modulated by audio
    const speedMod = 1.0 + (b + m) * 1.5;
    for (let i = 0; i < NUM_WAVES; i++) {
      phases.current[i] += delta * (0.3 + i * 0.15) * speedMod;
    }

    materialRef.current.uniforms.uWaveAmps.value = smoothedAmps.current;
    materialRef.current.uniforms.uWavePhases.value = phases.current;
    materialRef.current.uniforms.uTime.value = time;

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001 + m * 0.004;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.0, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={bumpFragmentShader}
      />
    </mesh>
  );
};

export default DenseSineWaves;
