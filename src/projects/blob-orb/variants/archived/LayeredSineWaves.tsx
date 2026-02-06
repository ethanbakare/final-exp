/**
 * ARCHIVED — This was the variant chosen from the original set of five.
 * Its 50% reaction version (GentleOrb) became one of the two final variants.
 *
 * Variant 5: Layered Sine Waves
 *
 * Uses 8 sine waves with different frequencies and orientations, each
 * tied to audio frequency bands. Each wave displaces along a different
 * axis/angle, creating interference patterns that shift with the audio.
 * Produces a "rippling water" effect when active.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fragmentShader } from "../../shaders/fragmentShader";
import { AudioData, OrbConfig } from "../../types";

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

const LayeredSineWaves: React.FC<Props> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothedAmps = useRef(new Float32Array(NUM_WAVES));
  const phases = useRef(new Float32Array(NUM_WAVES));

  // Base frequencies for each wave (increasing)
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
  }), [config.palette, config.maxDisplacement, baseFreqs]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    const time = state.clock.getElapsedTime();

    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    materialRef.current.uniforms.uBreathScale.value = breathCycle * config.breatheAmp;

    const b = audioData.bass;
    const m = audioData.mid;
    const t = audioData.treble;

    // Map audio bands to wave amplitudes
    // Waves 0-2: bass, 3-5: mid, 6-7: treble
    // Idle floor per wave so surface always has subtle activity
    const targets = new Float32Array(NUM_WAVES);
    const maxD = config.maxDisplacement;
    const idleAmp = maxD * 0.04;
    targets[0] = idleAmp + b * maxD * 0.4;
    targets[1] = idleAmp + b * maxD * 0.3;
    targets[2] = idleAmp + b * maxD * 0.25;
    targets[3] = idleAmp + m * maxD * 0.35;
    targets[4] = idleAmp + m * maxD * 0.3;
    targets[5] = idleAmp + m * maxD * 0.25;
    targets[6] = idleAmp + t * maxD * 0.2;
    targets[7] = idleAmp + t * maxD * 0.15;

    // Constant asymmetric rates — no silent-mode override
    for (let i = 0; i < NUM_WAVES; i++) {
      const rate = targets[i] > smoothedAmps.current[i] ? 0.15 : 0.02;
      smoothedAmps.current[i] += (targets[i] - smoothedAmps.current[i]) * rate;
    }

    // Phase advances — speed modulated by audio
    const speedMod = 1.0 + (b + m) * 2.0;
    for (let i = 0; i < NUM_WAVES; i++) {
      phases.current[i] += delta * (0.5 + i * 0.3) * speedMod;
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
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};

export default LayeredSineWaves;
