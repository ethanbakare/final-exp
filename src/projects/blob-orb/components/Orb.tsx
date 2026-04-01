import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { orbShader } from "../shaders/orbShader";
import { AudioData, OrbConfig } from "../types";

interface OrbProps {
  audioData: AudioData;
  config: OrbConfig;
}

const Orb: React.FC<OrbProps> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Smoothed audio values
  const smoothedAudio = useRef({ bass: 0, mid: 0, treble: 0 });

  // Harmonic energy states with asymmetric attack/decay
  const harmonicEnergy = useRef({ h0: 0, h1: 0, h2: 0 });

  // Accumulated phase for each harmonic (forward-only, no rewind)
  const phases = useRef({ p0: 0, p1: 0, p2: 0 });

  const uniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(orbShader.uniforms);
    u.uColor1.value = new THREE.Color(config.palette[0]);
    u.uColor2.value = new THREE.Color(config.palette[1]);
    u.uColor3.value = new THREE.Color(config.palette[2] || config.palette[0]);
    u.uMaxDisp.value = config.maxDisplacement;
    return u;
  }, [config.palette, config.maxDisplacement]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    const s = config.smoothingConstant;
    const time = state.clock.getElapsedTime();

    // Smooth audio bands
    smoothedAudio.current.bass +=
      (audioData.bass - smoothedAudio.current.bass) * s;
    smoothedAudio.current.mid +=
      (audioData.mid - smoothedAudio.current.mid) * s;
    smoothedAudio.current.treble +=
      (audioData.treble - smoothedAudio.current.treble) * s;

    const b = smoothedAudio.current.bass;
    const m = smoothedAudio.current.mid;
    const t = smoothedAudio.current.treble;

    // --- Breathing ---
    // 6s period matching BreatheInterface CSS keyframe
    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    const idleBreath = breathCycle * config.breatheAmp;
    // Bass adds to breathing (uniform radial expansion)
    const bassBreath = b * config.maxDisplacement * 0.5;
    materialRef.current.uniforms.uBreathScale.value = idleBreath + bassBreath;

    // --- Harmonic amplitudes from audio ---
    // Asymmetric attack/decay: fast attack, slow decay
    const attackSpeed = 0.15;
    const decaySpeed = 0.012;

    // H0 (axial bulge): driven by bass
    const targetH0 = b * config.maxDisplacement * 0.8;
    const lerpH0 = targetH0 > harmonicEnergy.current.h0 ? attackSpeed : decaySpeed;
    harmonicEnergy.current.h0 = THREE.MathUtils.lerp(
      harmonicEnergy.current.h0, targetH0, lerpH0
    );

    // H1 (tilted bulge): driven by mid
    const targetH1 = m * config.maxDisplacement * 0.6;
    const lerpH1 = targetH1 > harmonicEnergy.current.h1 ? attackSpeed : decaySpeed;
    harmonicEnergy.current.h1 = THREE.MathUtils.lerp(
      harmonicEnergy.current.h1, targetH1, lerpH1
    );

    // H2 (equatorial squeeze): driven by treble
    const targetH2 = t * config.maxDisplacement * 0.4;
    const lerpH2 = targetH2 > harmonicEnergy.current.h2 ? attackSpeed : decaySpeed;
    harmonicEnergy.current.h2 = THREE.MathUtils.lerp(
      harmonicEnergy.current.h2, targetH2, lerpH2
    );

    // --- Phase evolution (forward-only) ---
    // Phases advance slowly at idle, faster with audio
    phases.current.p0 += delta * (0.3 + b * 1.5);
    phases.current.p1 += delta * (0.4 + m * 2.0);
    phases.current.p2 += delta * (0.5 + t * 1.0);

    // Set uniforms
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uHarmonic0.value = harmonicEnergy.current.h0;
    materialRef.current.uniforms.uHarmonic1.value = harmonicEnergy.current.h1;
    materialRef.current.uniforms.uHarmonic2.value = harmonicEnergy.current.h2;
    materialRef.current.uniforms.uPhase0.value = phases.current.p0;
    materialRef.current.uniforms.uPhase1.value = phases.current.p1;
    materialRef.current.uniforms.uPhase2.value = phases.current.p2;

    // --- Gentle mesh rotation ---
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001 + m * 0.005;
      meshRef.current.rotation.z += 0.0005;
      const targetRotX = Math.sin(time * 0.15) * 0.02;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x, targetRotX, 0.02
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.0, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={orbShader.vertexShader}
        fragmentShader={orbShader.fragmentShader}
      />
    </mesh>
  );
};

export default Orb;
