/**
 * ARCHIVED — This was the original variant we started from. Essentially
 * identical to the main /blob-orb page Orb.tsx. A solid foundation but
 * we moved on to sine-wave-based approaches for more surface detail.
 *
 * Variant 1: Spherical Harmonics
 *
 * Uses low-order spherical harmonics (Y_2^0, Y_2^1, Y_2^2) for smooth,
 * global shape deformations. Bass drives axial bulge, mid drives tilt,
 * treble drives equatorial squeeze. Produces slow, organic "breathing" shapes.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fragmentShader } from "../../shaders/fragmentShader";
import { AudioData, OrbConfig } from "../../types";

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying float vDisplacement;

  uniform float uTime;
  uniform float uBreathScale;
  uniform float uHarmonic0;
  uniform float uHarmonic1;
  uniform float uHarmonic2;
  uniform float uPhase0;
  uniform float uPhase1;
  uniform float uPhase2;
  uniform float uMaxDisp;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(normal);
    vNormal = normalize(normalMatrix * normal);

    float displacement = uBreathScale;

    // Y_2^0 — axial bulge/pinch
    float y20 = 0.25 * (3.0 * normal.y * normal.y - 1.0);
    displacement += uHarmonic0 * y20 * sin(uPhase0);

    // Y_2^1 — tilted bulge
    float y21 = normal.y * normal.x;
    displacement += uHarmonic1 * y21 * sin(uPhase1);

    // Y_2^2 — equatorial squeeze
    float y22 = normal.x * normal.x - normal.z * normal.z;
    displacement += uHarmonic2 * y22 * cos(uPhase2);

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

const SphericalHarmonics: React.FC<Props> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothed = useRef({ bass: 0, mid: 0, treble: 0 });
  const energy = useRef({ h0: 0, h1: 0, h2: 0 });
  const phases = useRef({ p0: 0, p1: 0, p2: 0 });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(config.palette[0]) },
    uColor2: { value: new THREE.Color(config.palette[1]) },
    uColor3: { value: new THREE.Color(config.palette[2]) },
    uBreathScale: { value: 0 },
    uHarmonic0: { value: 0 },
    uHarmonic1: { value: 0 },
    uHarmonic2: { value: 0 },
    uPhase0: { value: 0 },
    uPhase1: { value: 0 },
    uPhase2: { value: 0 },
    uMaxDisp: { value: config.maxDisplacement },
  }), [config.palette, config.maxDisplacement]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    const s = config.smoothingConstant;
    const time = state.clock.getElapsedTime();

    const silent = audioData.bass === 0 && audioData.mid === 0 && audioData.treble === 0;
    const silentDecay = 0.15;

    smoothed.current.bass += (audioData.bass - smoothed.current.bass) * (silent ? silentDecay : s);
    smoothed.current.mid += (audioData.mid - smoothed.current.mid) * (silent ? silentDecay : s);
    smoothed.current.treble += (audioData.treble - smoothed.current.treble) * (silent ? silentDecay : s);

    const b = smoothed.current.bass;
    const m = smoothed.current.mid;
    const t = smoothed.current.treble;

    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    materialRef.current.uniforms.uBreathScale.value =
      breathCycle * config.breatheAmp + b * config.maxDisplacement * 0.5;

    const attack = 0.15;
    const decay = silent ? silentDecay : 0.012;

    const tH0 = b * config.maxDisplacement * 0.8;
    energy.current.h0 = THREE.MathUtils.lerp(energy.current.h0, tH0, tH0 > energy.current.h0 ? attack : decay);

    const tH1 = m * config.maxDisplacement * 0.6;
    energy.current.h1 = THREE.MathUtils.lerp(energy.current.h1, tH1, tH1 > energy.current.h1 ? attack : decay);

    const tH2 = t * config.maxDisplacement * 0.4;
    energy.current.h2 = THREE.MathUtils.lerp(energy.current.h2, tH2, tH2 > energy.current.h2 ? attack : decay);

    phases.current.p0 += delta * (0.3 + b * 1.5);
    phases.current.p1 += delta * (0.4 + m * 2.0);
    phases.current.p2 += delta * (0.5 + t * 1.0);

    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uHarmonic0.value = energy.current.h0;
    materialRef.current.uniforms.uHarmonic1.value = energy.current.h1;
    materialRef.current.uniforms.uHarmonic2.value = energy.current.h2;
    materialRef.current.uniforms.uPhase0.value = phases.current.p0;
    materialRef.current.uniforms.uPhase1.value = phases.current.p1;
    materialRef.current.uniforms.uPhase2.value = phases.current.p2;

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001 + m * 0.005;
      meshRef.current.rotation.z += 0.0005;
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

export default SphericalHarmonics;
