/**
 * ARCHIVED — Transparent torus with orbiting ball experiment. Not part of
 * the final five but preserved as reference for the alpha-blending technique.
 *
 * EXPERIMENT: GentleOrbDampedBall
 *
 * Same damped torus as GentleOrbTorusDamped but the tube is semi-transparent
 * (alpha blending) so you can see a small white sphere orbiting inside the
 * tube path. The ball travels at a constant speed unaffected by audio.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AudioData, OrbConfig } from "../../types";

const NUM_WAVES = 8;

const TORUS_MAJOR = 0.85;
const TORUS_MINOR = 0.15;
const BALL_RADIUS = TORUS_MINOR * 0.8; // 80% of tube diameter
const ORBIT_SPEED = 1.2; // radians per second

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

    // Inner-face dampening (same as GentleOrbTorusDamped)
    float innerness = 1.0 - abs(uv.y * 2.0 - 1.0);
    float dampening = smoothstep(0.3, 0.8, innerness);
    displacement *= mix(0.7, 0.3, dampening);

    vDisplacement = displacement;

    vec3 newPosition = position + normal * displacement;
    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Modified fragment shader with alpha transparency
const transparentFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying float vDisplacement;

  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 eye = normalize(-vPosition);
    float facing = dot(normal, eye);

    float gradientT = 1.0 - facing;
    vec3 baseColor = mix(uColor2, uColor3, smoothstep(0.15, 0.8, gradientT));

    vec3 highlightDir = normalize(vec3(-0.3, 0.4, 0.6));
    float highlight = pow(max(dot(vWorldNormal, highlightDir), 0.0), 1.2);
    baseColor = mix(baseColor, uColor1, highlight * 0.5);

    vec3 lightDir = normalize(vec3(1.5, 2.5, 4.0));
    vec3 halfDir = normalize(lightDir + eye);
    float spec = pow(max(dot(normal, halfDir), 0.0), 60.0);
    baseColor += spec * vec3(1.0, 0.98, 0.96) * 0.15;

    float hemisphereShade = 0.95 + 0.05 * dot(vWorldNormal, vec3(0.0, 1.0, 0.0));
    baseColor *= hemisphereShade;

    baseColor = mix(baseColor, uColor3, clamp(vDisplacement * 1.5, 0.0, 0.12));

    float innerShadow = pow(1.0 - facing, 4.0) * 0.05;
    baseColor -= vec3(innerShadow * 0.3, innerShadow * 0.1, innerShadow * 0.05);

    // Boost saturation to compensate for alpha dilution against white bg
    float lum = dot(baseColor, vec3(0.299, 0.587, 0.114));
    baseColor = mix(vec3(lum), baseColor, 1.25); // 25% saturation boost

    // Higher alpha keeps colour vibrant while still showing ball through tube
    float alpha = mix(0.7, 0.85, smoothstep(0.3, 0.9, 1.0 - facing));
    gl_FragColor = vec4(baseColor, alpha);
  }
`;

interface Props {
  audioData: AudioData;
  config: OrbConfig;
}

const GentleOrbDampedBall: React.FC<Props> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const smoothedAmps = useRef(new Float32Array(NUM_WAVES));
  const phases = useRef(new Float32Array(NUM_WAVES));
  const ballAngle = useRef(0);

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

    const targets = new Float32Array(NUM_WAVES);
    const maxD = config.maxDisplacement;
    const idleAmp = maxD * 0.04;
    targets[0] = idleAmp + b * maxD * 0.2;
    targets[1] = idleAmp + b * maxD * 0.15;
    targets[2] = idleAmp + b * maxD * 0.125;
    targets[3] = idleAmp + m * maxD * 0.175;
    targets[4] = idleAmp + m * maxD * 0.15;
    targets[5] = idleAmp + m * maxD * 0.125;
    targets[6] = idleAmp + t * maxD * 0.1;
    targets[7] = idleAmp + t * maxD * 0.075;

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

    // Orbit the ball along the torus center path (constant speed)
    if (ballRef.current) {
      ballAngle.current += delta * ORBIT_SPEED;
      const angle = ballAngle.current;
      ballRef.current.position.set(
        TORUS_MAJOR * Math.cos(angle),
        TORUS_MAJOR * Math.sin(angle),
        0
      );
    }
  });

  return (
    <group>
      {/* Semi-transparent torus — render after ball for correct blending */}
      <mesh ref={meshRef} renderOrder={1}>
        <torusGeometry args={[TORUS_MAJOR, TORUS_MINOR, 64, 128]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={transparentFragmentShader}
          transparent={true}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Orbiting sphere inside the tube */}
      <mesh ref={ballRef} renderOrder={0}>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

export default GentleOrbDampedBall;
