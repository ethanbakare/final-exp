/**
 * Material variant: Liquid Metal Torus
 *
 * CoralStone torus geometry with CSM + MeshPhysicalMaterial for PBR
 * metallic rendering. Inner-face dampening keeps the hole edge clean.
 * Requires an <Environment> component in the parent scene.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { AudioData, OrbConfig } from "../types";

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

// Torus radii: tube radius 0.3, major radius = 1.0 - 0.3 = 0.7
const TUBE_R = 0.3;
const MAJOR_R = 1.0 - TUBE_R;

const csmVertexShader = `
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

  float calcDisplacement(vec3 n) {
    float d = uBreathScale;
    for (int i = 0; i < ${NUM_WAVES}; i++) {
      vec3 dir = getWaveDir(i);
      float projection = dot(n, dir);
      d += uWaveAmps[i] * sin(projection * uWaveFreqs[i] + uWavePhases[i]);
    }
    return clamp(d, -uMaxDisp, uMaxDisp);
  }

  // Inner-face dampening: fades from 70% (outer) to 30% (inner)
  float innerDampen(float uvY) {
    float innerness = 1.0 - abs(uvY * 2.0 - 1.0);
    float dampening = smoothstep(0.3, 0.8, innerness);
    return mix(0.7, 0.3, dampening);
  }

  void main() {
    // Reconstruct torus position from UVs
    float theta = uv.x * 6.28318530718;
    float phi   = uv.y * 6.28318530718;

    float R = ${MAJOR_R.toFixed(4)};
    float r = ${TUBE_R.toFixed(4)};

    float rp = R + r * cos(phi);
    vec3 basePosition = vec3(rp * cos(theta), rp * sin(theta), r * sin(phi));

    // Normal = outward tube direction
    vec3 n = normalize(vec3(cos(phi) * cos(theta), cos(phi) * sin(theta), sin(phi)));

    // Dampening multiplier
    float dampen = innerDampen(uv.y);

    // Displaced position
    float displacement = calcDisplacement(n) * dampen;
    csm_Position = basePosition + n * displacement;

    // Recalculate normal via finite differences
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

interface Props {
  audioData: AudioData;
  config: OrbConfig;
}

const CoralStoneMetalTorus: React.FC<Props> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const smoothedAmps = useRef(new Float32Array(NUM_WAVES));
  const phases = useRef(new Float32Array(NUM_WAVES));

  const baseFreqs = useMemo(() => {
    const freqs = new Float32Array(NUM_WAVES);
    for (let i = 0; i < NUM_WAVES; i++) {
      freqs[i] = 6.0 + i * 0.7;
    }
    return freqs;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBreathScale: { value: 0 },
      uMaxDisp: { value: config.maxDisplacement },
      uWaveAmps: { value: new Float32Array(NUM_WAVES) },
      uWaveFreqs: { value: new Float32Array(baseFreqs) },
      uWavePhases: { value: new Float32Array(NUM_WAVES) },
    }),
    [baseFreqs, config.maxDisplacement]
  );

  const material = useMemo(() => {
    return new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      vertexShader: csmVertexShader,
      uniforms,
      metalness: 1.0,
      roughness: 0.08,
      color: new THREE.Color(0.75, 0.75, 0.78),
      envMapIntensity: 1.2,
    });
  }, [uniforms]);

  useFrame((state, delta) => {
    if (!material) return;
    const time = state.clock.getElapsedTime();

    material.uniforms.uMaxDisp.value = config.maxDisplacement;

    const breathCycle = Math.sin((time * (Math.PI * 2)) / 6.0);
    material.uniforms.uBreathScale.value = breathCycle * config.breatheAmp;

    const b = audioData.bass;
    const m = audioData.mid;
    const t = audioData.treble;

    const targets = new Float32Array(NUM_WAVES);
    const maxD = config.maxDisplacement;
    const idle = maxD * config.idleAmp;

    for (let i = 0; i < 8; i++) {
      targets[i] = idle + b * maxD * (0.15 - i * 0.01);
    }
    for (let i = 8; i < 18; i++) {
      targets[i] = idle + m * maxD * (0.12 - (i - 8) * 0.006);
    }
    for (let i = 18; i < NUM_WAVES; i++) {
      targets[i] = idle + t * maxD * (0.08 - (i - 18) * 0.008);
    }

    for (let i = 0; i < NUM_WAVES; i++) {
      const rate = targets[i] > smoothedAmps.current[i] ? 0.15 : 0.02;
      smoothedAmps.current[i] +=
        (targets[i] - smoothedAmps.current[i]) * rate;
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
    <mesh ref={meshRef} material={material}>
      <torusGeometry args={[MAJOR_R, TUBE_R, 64, 128]} />
    </mesh>
  );
};

export default CoralStoneMetalTorus;
