/**
 * EXPERIMENT: GentleOrbThicken
 *
 * Based on GentleOrbTorusDamped. Adds a "thicken" toggle that increases
 * the tube (minor) radius while decreasing the ring (major) radius by the
 * same amount, so the outer silhouette stays fixed and the hole shrinks.
 *
 * All radii, speed, colors, scale, and wave intensity are configurable
 * via props for the controls panel.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fragmentShader } from "../shaders/fragmentShader";
import { AudioData } from "../types";

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
  uniform float uThicken;
  uniform float uOrigR;
  uniform float uOrigr;
  uniform float uThickR;
  uniform float uThickr;
  uniform float uWaveAmps[${NUM_WAVES}];
  uniform float uWaveFreqs[${NUM_WAVES}];
  uniform float uWavePhases[${NUM_WAVES}];

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

    // --- Thicken: reconstruct torus vertex with blended radii ---
    float R = mix(uOrigR, uThickR, uThicken);
    float r = mix(uOrigr, uThickr, uThicken);

    // Extract angles from UVs
    float theta = uv.x * 6.28318530718;
    float phi   = uv.y * 6.28318530718;

    // Reconstruct torus position with blended radii
    float rp = R + r * cos(phi);
    vec3 basePosition = vec3(rp * cos(theta), rp * sin(theta), r * sin(phi));

    // Normal = outward tube direction
    vec3 n = normalize(vec3(cos(phi) * cos(theta), cos(phi) * sin(theta), sin(phi)));

    vWorldNormal = normalize(n);
    vNormal = normalize(normalMatrix * n);

    // --- Wave displacement ---
    float displacement = uBreathScale;

    for (int i = 0; i < ${NUM_WAVES}; i++) {
      vec3 dir = getWaveDir(i);
      float projection = dot(n, dir);
      displacement += uWaveAmps[i] * sin(projection * uWaveFreqs[i] + uWavePhases[i]);
    }

    displacement = clamp(displacement, -uMaxDisp, uMaxDisp);

    // --- Inner-face dampening ---
    float innerness = 1.0 - abs(uv.y * 2.0 - 1.0);
    float dampening = smoothstep(0.3, 0.8, innerness);
    displacement *= mix(0.7, 0.3, dampening);

    vDisplacement = displacement;

    vec3 finalPosition = basePosition + n * displacement;
    vPosition = (modelViewMatrix * vec4(finalPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
  }
`;

export interface ThickenProps {
  audioData: AudioData;
  goal: number;
  scale: number;
  thinRadius: number;
  thickRadius: number;
  thickenSpeed: number;
  waveIntensity: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
}

const GentleOrbThicken: React.FC<ThickenProps> = ({
  audioData,
  goal,
  scale,
  thinRadius,
  thickRadius,
  thickenSpeed,
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
  const thickenRef = useRef(0);

  const outerEdge = 1.0;
  const majorThin = outerEdge - thinRadius;
  const majorThick = outerEdge - thickRadius;

  const baseFreqs = useMemo(() => [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 10.0], []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(color1) },
    uColor2: { value: new THREE.Color(color2) },
    uColor3: { value: new THREE.Color(color3) },
    uBreathScale: { value: 0 },
    uMaxDisp: { value: waveIntensity },
    uThicken: { value: 0 },
    uOrigR: { value: majorThin },
    uOrigr: { value: thinRadius },
    uThickR: { value: majorThick },
    uThickr: { value: thickRadius },
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
    materialRef.current.uniforms.uOrigR.value = majorThin;
    materialRef.current.uniforms.uOrigr.value = thinRadius;
    materialRef.current.uniforms.uThickR.value = majorThick;
    materialRef.current.uniforms.uThickr.value = thickRadius;
    materialRef.current.uniforms.uColor1.value.set(color1);
    materialRef.current.uniforms.uColor2.value.set(color2);
    materialRef.current.uniforms.uColor3.value.set(color3);

    // --- Animate thicken ---
    const speed = delta / thickenSpeed;
    if (goal === 1) {
      thickenRef.current = Math.min(1, thickenRef.current + speed);
    } else {
      thickenRef.current = Math.max(0, thickenRef.current - speed);
    }
    const t = thickenRef.current;
    materialRef.current.uniforms.uThicken.value = t * t * (3 - 2 * t);

    // --- Breath ---
    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    materialRef.current.uniforms.uBreathScale.value = breathCycle * breathAmp;

    // --- Audio -> wave amplitudes ---
    const b = audioData.bass;
    const m = audioData.mid;
    const tr = audioData.treble;

    const targets = new Float32Array(NUM_WAVES);
    const maxD = waveIntensity;
    const idle = maxD * idleAmp;
    targets[0] = idle + b * maxD * 0.2;
    targets[1] = idle + b * maxD * 0.15;
    targets[2] = idle + b * maxD * 0.125;
    targets[3] = idle + m * maxD * 0.175;
    targets[4] = idle + m * maxD * 0.15;
    targets[5] = idle + m * maxD * 0.125;
    targets[6] = idle + tr * maxD * 0.1;
    targets[7] = idle + tr * maxD * 0.075;

    for (let i = 0; i < NUM_WAVES; i++) {
      const rate = targets[i] > smoothedAmps.current[i] ? 0.15 : 0.02;
      smoothedAmps.current[i] += (targets[i] - smoothedAmps.current[i]) * rate;
    }

    const speedMod = 1.0 + (b + m) * 2.0;
    for (let i = 0; i < NUM_WAVES; i++) {
      phases.current[i] += delta * (0.5 + i * 0.3) * speedMod;
    }

    materialRef.current.uniforms.uWaveAmps.value = smoothedAmps.current;
    materialRef.current.uniforms.uWavePhases.value = phases.current;
    materialRef.current.uniforms.uTime.value = time;
  });

  return (
    <mesh ref={meshRef} scale={scale}>
      <torusGeometry args={[majorThin, thinRadius, 64, 128]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};

export default GentleOrbThicken;
