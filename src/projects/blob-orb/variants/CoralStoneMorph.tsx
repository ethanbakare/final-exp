/**
 * CoralStoneMorph
 *
 * Morphs between a sphere (CoralStone-like) and a torus (CoralStoneTorusDamped-like).
 * Uses UV-based torus vertex reconstruction with interpolated radii:
 *   Sphere state (morph=0): R≈0, r≈outerEdge  (tube fills everything, no hole)
 *   Torus  state (morph=1): R=0.7, r=0.3       (clear donut shape)
 * Outer edge (R+r) stays constant so the silhouette doesn't grow or shrink.
 * Inner-face dampening fades in as the hole opens.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { bumpHueShiftShader } from "../shaders/bumpHueShiftShader";
import { AudioData } from "../types";

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
  uniform float uMorph;
  uniform float uSphereR;
  uniform float uSpherer;
  uniform float uTorusR;
  uniform float uTorusr;
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

  // Inner-face dampening — fades in as morph increases (hole opens)
  // At morph=0 (sphere), no dampening needed. At morph=1 (torus), full dampening.
  float innerDampen(float uvY, float morph) {
    float innerness = 1.0 - abs(uvY * 2.0 - 1.0);
    float dampening = smoothstep(0.3, 0.8, innerness);
    float torusDampen = mix(0.7, 0.3, dampening);
    // Blend between 1.0 (no dampening) and torus dampening based on morph
    return mix(1.0, torusDampen, morph);
  }

  void main() {
    vUv = uv;

    // --- Morph: reconstruct torus vertex with blended radii ---
    float R = mix(uSphereR, uTorusR, uMorph);
    float r = mix(uSpherer, uTorusr, uMorph);

    // Extract angles from UVs
    float theta = uv.x * 6.28318530718;
    float phi   = uv.y * 6.28318530718;

    // Reconstruct torus position with blended radii
    float rp = R + r * cos(phi);
    vec3 basePosition = vec3(rp * cos(theta), rp * sin(theta), r * sin(phi));

    // Normal = outward tube direction
    vec3 n = normalize(vec3(cos(phi) * cos(theta), cos(phi) * sin(theta), sin(phi)));

    vWorldNormal = n;
    vNormal = normalize(normalMatrix * n);

    // Dampening multiplier for this vertex (fades in with morph)
    float dampen = innerDampen(uv.y, uMorph);

    // Displaced position with dampening
    float displacement = calcDisplacement(n) * dampen;
    vDisplacement = displacement;
    vec3 newPosition = basePosition + n * displacement;

    // --- Recalculate normal via finite differences ---
    vec3 tangent = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 bitangent = normalize(cross(n, tangent));

    float eps = 0.005;
    vec3 nT = normalize(n + tangent * eps);
    vec3 nB = normalize(n + bitangent * eps);

    float dT = calcDisplacement(nT) * dampen;
    float dB = calcDisplacement(nB) * dampen;

    vec3 posT = (basePosition + tangent * eps * r) + nT * dT;
    vec3 posB = (basePosition + bitangent * eps * r) + nB * dB;

    vec3 bumpNormal = normalize(cross(posT - newPosition, posB - newPosition));
    if (dot(bumpNormal, n) < 0.0) bumpNormal = -bumpNormal;

    vWorldBumpNormal = bumpNormal;
    vBumpNormal = normalize(normalMatrix * bumpNormal);

    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

export interface CoralStoneMorphProps {
  audioData: AudioData;
  goal: number;        // 0 = sphere, 1 = torus
  scale: number;
  morphSpeed: number;  // seconds for full transition
  torusRadius: number; // minor radius r when morphed to torus (R = outerEdge - r)
  waveIntensity: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
}

const CoralStoneMorph: React.FC<CoralStoneMorphProps> = ({
  audioData,
  goal,
  scale,
  morphSpeed,
  torusRadius,
  waveIntensity,
  breathAmp,
  idleAmp,
  color1,
  color2,
  color3,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothedAmps = useRef(new Float32Array(NUM_WAVES));
  const phases = useRef(new Float32Array(NUM_WAVES));
  const morphRef = useRef(0);

  // Constant: outer edge R + r stays the same
  const outerEdge = 1.0;

  // Sphere state: R ≈ 0, r ≈ outerEdge (tube fills everything)
  const sphereR = 0.01;
  const spherer = outerEdge - sphereR; // 0.99

  // Torus state: driven by torusRadius prop (minor radius)
  const torusr = torusRadius;
  const torusR = outerEdge - torusr;

  // Higher base frequencies for denser bumps (6-~22.8 range)
  const baseFreqs = useMemo(() => {
    const freqs = new Float32Array(NUM_WAVES);
    for (let i = 0; i < NUM_WAVES; i++) {
      freqs[i] = 6.0 + i * 0.7;
    }
    return freqs;
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(color1) },
    uColor2: { value: new THREE.Color(color2) },
    uColor3: { value: new THREE.Color(color3) },
    uBreathScale: { value: 0 },
    uMaxDisp: { value: waveIntensity },
    uMorph: { value: 0 },
    uSphereR: { value: sphereR },
    uSpherer: { value: spherer },
    uTorusR: { value: torusR },
    uTorusr: { value: torusr },
    uWaveAmps: { value: new Float32Array(NUM_WAVES) },
    uWaveFreqs: { value: new Float32Array(baseFreqs) },
    uWavePhases: { value: new Float32Array(NUM_WAVES) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    const time = state.clock.getElapsedTime();

    // Update dynamic uniforms from props every frame
    materialRef.current.uniforms.uMaxDisp.value = waveIntensity;
    materialRef.current.uniforms.uTorusR.value = outerEdge - torusRadius;
    materialRef.current.uniforms.uTorusr.value = torusRadius;
    materialRef.current.uniforms.uColor1.value.set(color1);
    materialRef.current.uniforms.uColor2.value.set(color2);
    materialRef.current.uniforms.uColor3.value.set(color3);

    // --- Animate morph ---
    const speed = delta / morphSpeed;
    if (goal === 1) {
      morphRef.current = Math.min(1, morphRef.current + speed);
    } else {
      morphRef.current = Math.max(0, morphRef.current - speed);
    }
    const t = morphRef.current;
    // Smoothstep easing
    materialRef.current.uniforms.uMorph.value = t * t * (3 - 2 * t);

    // --- Breath ---
    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    materialRef.current.uniforms.uBreathScale.value = breathCycle * breathAmp;

    const b = audioData.bass;
    const m = audioData.mid;
    const tr = audioData.treble;

    // Map audio bands across 24 waves:
    // 0-7: bass, 8-17: mid, 18-23: treble
    const targets = new Float32Array(NUM_WAVES);
    const maxD = waveIntensity;
    const idle = maxD * idleAmp;

    for (let i = 0; i < 8; i++) {
      targets[i] = idle + b * maxD * (0.15 - i * 0.01);
    }
    for (let i = 8; i < 18; i++) {
      targets[i] = idle + m * maxD * (0.12 - (i - 8) * 0.006);
    }
    for (let i = 18; i < NUM_WAVES; i++) {
      targets[i] = idle + tr * maxD * (0.08 - (i - 18) * 0.008);
    }

    for (let i = 0; i < NUM_WAVES; i++) {
      const rate = targets[i] > smoothedAmps.current[i] ? 0.15 : 0.02;
      smoothedAmps.current[i] += (targets[i] - smoothedAmps.current[i]) * rate;
    }

    const speedMod = 1.0 + (b + m) * 1.5;
    for (let i = 0; i < NUM_WAVES; i++) {
      phases.current[i] += delta * (0.3 + i * 0.15) * speedMod;
    }

    materialRef.current.uniforms.uWaveAmps.value = smoothedAmps.current;
    materialRef.current.uniforms.uWavePhases.value = phases.current;
    materialRef.current.uniforms.uTime.value = time;
  });

  // Use torus geometry — at morph=0, the shader reshapes it into a sphere
  // Need enough segments for smooth morphing
  return (
    <mesh ref={meshRef} scale={scale}>
      <torusGeometry args={[torusR, torusr, 64, 128]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={bumpHueShiftShader}
      />
    </mesh>
  );
};

export default CoralStoneMorph;
