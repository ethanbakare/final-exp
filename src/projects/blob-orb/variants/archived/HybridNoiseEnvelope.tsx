/**
 * ARCHIVED — This variant was explored but not selected for final use.
 *
 * Variant 4: Hybrid Noise + Audio Envelope
 *
 * Combines noise-based displacement with direct audio envelope shaping.
 * The noise provides organic texture while the envelope (RMS/bass) acts as
 * a multiplier that "inflates" the noise pattern. When audio is loud,
 * the noise bumps grow larger; when quiet, the surface is nearly smooth.
 * Mid/treble modulate the noise pattern speed and scale for variety.
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
  uniform float uMaxDisp;
  uniform float uEnvelope;    // Audio envelope (RMS-driven)
  uniform float uNoiseScale;  // Noise frequency
  uniform float uNoiseSpeed;  // Noise flow speed
  uniform float uDetailMix;   // How much fine detail (treble-driven)

  float noise3D(vec3 p) {
    float n = sin(p.x * 1.0 + p.y * 2.0 + p.z * 0.5)
            + sin(p.y * 1.7 - p.x * 1.3 + p.z * 0.8) * 0.7
            + sin(p.z * 2.1 + p.x * 0.9 - p.y * 1.1) * 0.5
            + sin(p.x * 3.2 + p.y * 0.7 + p.z * 2.8) * 0.3
            + sin(p.y * 4.1 - p.z * 1.9 + p.x * 2.3) * 0.2;
    return n / 2.7;
  }

  void main() {
    vUv = uv;
    vWorldNormal = normalize(normal);
    vNormal = normalize(normalMatrix * normal);

    vec3 flowOffset = vec3(
      uTime * uNoiseSpeed * 0.25,
      uTime * uNoiseSpeed * 0.15,
      uTime * uNoiseSpeed * 0.1
    );

    // Base noise layer
    float n1 = noise3D(normal * uNoiseScale + flowOffset);

    // Detail noise layer (higher frequency)
    float n2 = noise3D(normal * uNoiseScale * 2.5 + flowOffset * 1.5 + vec3(10.0, 7.0, 3.0));

    // Mix detail based on treble content
    float noiseMixed = n1 + n2 * uDetailMix;

    // The envelope multiplies the noise — silent = smooth sphere
    float noiseDisp = noiseMixed * uEnvelope * uMaxDisp;

    float displacement = uBreathScale + noiseDisp;
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

const HybridNoiseEnvelope: React.FC<Props> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothed = useRef({ envelope: 0, scale: 0, speed: 0, detail: 0 });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(config.palette[0]) },
    uColor2: { value: new THREE.Color(config.palette[1]) },
    uColor3: { value: new THREE.Color(config.palette[2]) },
    uBreathScale: { value: 0 },
    uMaxDisp: { value: config.maxDisplacement },
    uEnvelope: { value: 0 },
    uNoiseScale: { value: 1.5 },
    uNoiseSpeed: { value: 0.05 },
    uDetailMix: { value: 0.3 },
  }), [config.palette, config.maxDisplacement]);

  useFrame((state) => {
    if (!materialRef.current) return;
    const time = state.clock.getElapsedTime();

    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    materialRef.current.uniforms.uBreathScale.value = breathCycle * config.breatheAmp;

    const rms = audioData.rms;
    const b = audioData.bass;
    const m = audioData.mid;
    const t = audioData.treble;

    // Idle floor: surface always has slight noise activity (like V3 idleAmp)
    const idleEnvelope = 0.15;
    const targetEnv = idleEnvelope + Math.max(rms, b) * 1.2;
    const targetScale = 1.5 + b * 1.0;
    const targetSpeed = 0.05 + m * 0.3;
    const targetDetail = 0.3 + t * 0.7;

    // Constant asymmetric rates — no silent-mode override
    const attackRate = 0.18;
    const decayRate = 0.015;

    smoothed.current.envelope += (targetEnv - smoothed.current.envelope) * (targetEnv > smoothed.current.envelope ? attackRate : decayRate);
    smoothed.current.scale += (targetScale - smoothed.current.scale) * 0.05;
    smoothed.current.speed += (targetSpeed - smoothed.current.speed) * 0.05;
    smoothed.current.detail += (targetDetail - smoothed.current.detail) * 0.08;

    materialRef.current.uniforms.uEnvelope.value = smoothed.current.envelope;
    materialRef.current.uniforms.uNoiseScale.value = smoothed.current.scale;
    materialRef.current.uniforms.uNoiseSpeed.value = smoothed.current.speed;
    materialRef.current.uniforms.uDetailMix.value = smoothed.current.detail;
    materialRef.current.uniforms.uTime.value = time;

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001 + m * 0.003;
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

export default HybridNoiseEnvelope;
