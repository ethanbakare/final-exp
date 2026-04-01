/**
 * Metal Torus with thicken animation.
 *
 * Combines GentleOrbThicken's radius interpolation with CoralStoneMetalTorus's
 * CSM + MeshPhysicalMaterial PBR. 24-wave displacement with bump normals,
 * inner-face dampening, and smooth thick/thin animation.
 * Requires an <Environment> component in the parent scene.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { AudioData } from "../types";

const NUM_WAVES = 24;

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

const dirGlsl = DIRECTIONS.map(
  (d, i) =>
    `  if (idx == ${i}) return vec3(${d[0].toFixed(4)}, ${d[1].toFixed(4)}, ${d[2].toFixed(4)});`
).join("\n");

const csmVertexShader = `
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
${dirGlsl}
    return vec3(1.0, 0.0, 0.0);
  }

  float calcDisplacement(vec3 n) {
    float d = uBreathScale;
    for (int i = 0; i < ${NUM_WAVES}; i++) {
      vec3 dir = getWaveDir(i);
      float projection = dot(n, dir);
      d += uWaveAmps[i] * sin(projection * uWaveFreqs[i] + uWavePhases[i]);
    }
    return clamp(d, -uMaxDisp, uMaxDisp);
  }

  float innerDampen(float uvY) {
    float innerness = 1.0 - abs(uvY * 2.0 - 1.0);
    float dampening = smoothstep(0.3, 0.8, innerness);
    return mix(0.7, 0.3, dampening);
  }

  void main() {
    // Thicken: blend between thin and thick radii
    float R = mix(uOrigR, uThickR, uThicken);
    float r = mix(uOrigr, uThickr, uThicken);

    float theta = uv.x * 6.28318530718;
    float phi   = uv.y * 6.28318530718;

    float rp = R + r * cos(phi);
    vec3 basePosition = vec3(rp * cos(theta), rp * sin(theta), r * sin(phi));

    vec3 n = normalize(vec3(cos(phi) * cos(theta), cos(phi) * sin(theta), sin(phi)));

    float dampen = innerDampen(uv.y);
    float displacement = calcDisplacement(n) * dampen;
    csm_Position = basePosition + n * displacement;

    // Bump normal via finite differences
    vec3 tangent = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 bitangent = normalize(cross(n, tangent));

    float eps = 0.005;
    vec3 nT = normalize(n + tangent * eps);
    vec3 nB = normalize(n + bitangent * eps);

    float dT = calcDisplacement(nT) * dampen;
    float dB = calcDisplacement(nB) * dampen;

    vec3 posT = (basePosition + tangent * eps * r) + nT * dT;
    vec3 posB = (basePosition + bitangent * eps * r) + nB * dB;

    vec3 bumpNormal = normalize(cross(posT - csm_Position, posB - csm_Position));
    if (dot(bumpNormal, n) < 0.0) bumpNormal = -bumpNormal;

    csm_Normal = bumpNormal;
  }
`;

export interface MetalThickenProps {
  audioData: AudioData;
  goal: number;
  scale: number;
  thinRadius: number;
  thickRadius: number;
  thickenSpeed: number;
  waveIntensity: number;
  breathAmp: number;
  idleAmp: number;
  metalness: number;
  roughness: number;
  envMapIntensity: number;
  metalColor: string;
}

const MetalTorusThicken: React.FC<MetalThickenProps> = ({
  audioData,
  goal,
  scale,
  thinRadius,
  thickRadius,
  thickenSpeed,
  waveIntensity,
  breathAmp,
  idleAmp,
  metalness,
  roughness,
  envMapIntensity,
  metalColor,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const smoothedAmps = useRef(new Float32Array(NUM_WAVES));
  const phases = useRef(new Float32Array(NUM_WAVES));
  const thickenRef = useRef(0);

  const outerEdge = 1.0;
  const majorThin = outerEdge - thinRadius;
  const majorThick = outerEdge - thickRadius;

  const baseFreqs = useMemo(() => {
    const freqs = new Float32Array(NUM_WAVES);
    for (let i = 0; i < NUM_WAVES; i++) {
      freqs[i] = 6.0 + i * 0.7;
    }
    return freqs;
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
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

  const material = useMemo(() => {
    return new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      vertexShader: csmVertexShader,
      uniforms,
      metalness,
      roughness,
      color: new THREE.Color(metalColor),
      envMapIntensity,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, delta) => {
    if (!material) return;
    const time = state.clock.getElapsedTime();

    // Update dynamic uniforms from props
    material.uniforms.uMaxDisp.value = waveIntensity;
    material.uniforms.uOrigR.value = majorThin;
    material.uniforms.uOrigr.value = thinRadius;
    material.uniforms.uThickR.value = majorThick;
    material.uniforms.uThickr.value = thickRadius;

    // Update PBR properties
    (material as any).metalness = metalness;
    (material as any).roughness = roughness;
    (material as any).envMapIntensity = envMapIntensity;
    (material as any).color.set(metalColor);

    // Animate thicken
    const speed = delta / thickenSpeed;
    if (goal === 1) {
      thickenRef.current = Math.min(1, thickenRef.current + speed);
    } else {
      thickenRef.current = Math.max(0, thickenRef.current - speed);
    }
    const t = thickenRef.current;
    material.uniforms.uThicken.value = t * t * (3 - 2 * t);

    // Breath
    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    material.uniforms.uBreathScale.value = breathCycle * breathAmp;

    // Audio -> wave amplitudes
    const b = audioData.bass;
    const m = audioData.mid;
    const tr = audioData.treble;

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

    material.uniforms.uWaveAmps.value = smoothedAmps.current;
    material.uniforms.uWavePhases.value = phases.current;
    material.uniforms.uTime.value = time;
  });

  return (
    <mesh ref={meshRef} scale={scale} material={material}>
      <torusGeometry args={[majorThin, thinRadius, 64, 128]} />
    </mesh>
  );
};

export default MetalTorusThicken;
