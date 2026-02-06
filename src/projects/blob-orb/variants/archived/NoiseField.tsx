/**
 * ARCHIVED — This variant was explored but not selected for final use.
 *
 * Variant 3: Noise Field
 *
 * Uses 3D simplex-style noise (implemented as layered sine waves to avoid
 * needing a noise texture) to create organic, flowing surface displacement.
 * Audio RMS controls noise amplitude, bass controls noise scale (zoom),
 * mid controls flow speed. Creates a "bubbling" or "boiling" effect.
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
  uniform float uNoiseAmp;
  uniform float uNoiseScale;
  uniform float uNoiseSpeed;

  // Simple pseudo-noise from layered sine waves (no texture needed)
  float noise3D(vec3 p) {
    float n = sin(p.x * 1.0 + p.y * 2.0 + p.z * 0.5)
            + sin(p.y * 1.7 - p.x * 1.3 + p.z * 0.8) * 0.7
            + sin(p.z * 2.1 + p.x * 0.9 - p.y * 1.1) * 0.5
            + sin(p.x * 3.2 + p.y * 0.7 + p.z * 2.8) * 0.3
            + sin(p.y * 4.1 - p.z * 1.9 + p.x * 2.3) * 0.2;
    return n / 2.7; // Normalize roughly to -1..1
  }

  void main() {
    vUv = uv;
    vWorldNormal = normalize(normal);
    vNormal = normalize(normalMatrix * normal);

    // Sample noise at vertex position, offset by time for flow
    vec3 noisePos = normal * uNoiseScale + vec3(uTime * uNoiseSpeed * 0.3, uTime * uNoiseSpeed * 0.2, uTime * uNoiseSpeed * 0.1);
    float n = noise3D(noisePos);

    // Second octave for finer detail
    float n2 = noise3D(noisePos * 2.0 + vec3(5.0, 3.0, 7.0)) * 0.4;

    float noiseDisp = (n + n2) * uNoiseAmp;
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

const NoiseField: React.FC<Props> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothed = useRef({ amp: 0, scale: 0, speed: 0 });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(config.palette[0]) },
    uColor2: { value: new THREE.Color(config.palette[1]) },
    uColor3: { value: new THREE.Color(config.palette[2]) },
    uBreathScale: { value: 0 },
    uMaxDisp: { value: config.maxDisplacement },
    uNoiseAmp: { value: 0 },
    uNoiseScale: { value: 1.2 },
    uNoiseSpeed: { value: 0.05 },
  }), [config.palette, config.maxDisplacement]);

  useFrame((state) => {
    if (!materialRef.current) return;
    const time = state.clock.getElapsedTime();

    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    materialRef.current.uniforms.uBreathScale.value = breathCycle * config.breatheAmp;

    const rms = audioData.rms;
    const b = audioData.bass;
    const m = audioData.mid;

    // Idle floor: surface always has slight noise activity (like V3 idleAmp)
    const idleAmp = 0.15 * config.maxDisplacement;
    const targetAmp = idleAmp + rms * config.maxDisplacement * 1.0;
    const targetScale = 1.2 + b * 1.0;
    const targetSpeed = 0.05 + m * 0.4;

    // Constant asymmetric rates — no silent-mode override
    const attackRate = 0.15;
    const decayRate = 0.02;

    smoothed.current.amp += (targetAmp - smoothed.current.amp) * (targetAmp > smoothed.current.amp ? attackRate : decayRate);
    smoothed.current.scale += (targetScale - smoothed.current.scale) * 0.05;
    smoothed.current.speed += (targetSpeed - smoothed.current.speed) * 0.05;

    materialRef.current.uniforms.uNoiseAmp.value = smoothed.current.amp;
    materialRef.current.uniforms.uNoiseScale.value = smoothed.current.scale;
    materialRef.current.uniforms.uNoiseSpeed.value = smoothed.current.speed;
    materialRef.current.uniforms.uTime.value = time;

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
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

export default NoiseField;
