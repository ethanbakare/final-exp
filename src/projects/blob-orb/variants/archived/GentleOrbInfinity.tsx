/**
 * ARCHIVED — Figure-8 shape experiment. Not part of the final five but
 * preserved as reference. Also used as the morph target in GentleOrbMorph.
 *
 * EXPERIMENT: GentleOrbInfinity
 *
 * Figure-8 / infinity symbol tube. Same GentleOrb 8-wave shader with
 * inner-face dampening (70% outer, 30% inner). The path is a lemniscate
 * of Bernoulli with a Z offset at the crossing so the tube passes over
 * itself rather than intersecting.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fragmentShader } from "../../shaders/fragmentShader";
import { AudioData, OrbConfig } from "../../types";

const NUM_WAVES = 8;

/**
 * Build a lemniscate (figure-8 / infinity) curve.
 *
 * Parametric lemniscate of Bernoulli:
 *   x = scale * cos(t) / (1 + sin²(t))
 *   y = scale * cos(t) * sin(t) / (1 + sin²(t))
 *
 * A Z offset of sin(t) lifts one pass forward and the other backward
 * at the crossing point so the tube passes over itself cleanly.
 */
function makeInfinityCurve(
  scale: number,
  zLift = 0.25,
  numPoints = 200
): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * Math.PI * 2;
    const s = Math.sin(t);
    const c = Math.cos(t);
    const denom = 1 + s * s;

    const x = scale * c / denom;
    const y = scale * c * s / denom;
    // Z offset: sin(t) is +zLift at t=π/2 (first crossing) and
    // -zLift at t=3π/2 (second crossing), creating a clear over/under.
    const z = zLift * Math.sin(t);

    pts.push(new THREE.Vector3(x, y, z));
  }

  return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.0);
}

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

    // --- Inner-face dampening ---
    // TubeGeometry UV: uv.y goes 0 -> 1 around the tube cross-section.
    // 0.0 / 1.0 = outer edge, 0.5 = inner edge.
    float innerness = 1.0 - abs(uv.y * 2.0 - 1.0);
    float dampening = smoothstep(0.3, 0.8, innerness);
    displacement *= mix(0.7, 0.3, dampening);

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

const GentleOrbInfinity: React.FC<Props> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothedAmps = useRef(new Float32Array(NUM_WAVES));
  const phases = useRef(new Float32Array(NUM_WAVES));

  // Same base frequencies as GentleOrb
  const baseFreqs = useMemo(() => [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 10.0], []);

  // Build the infinity tube geometry once
  const geometry = useMemo(() => {
    const curve = makeInfinityCurve(0.85, 0.5); // scale, zLift
    const tubeRadius = 0.15;
    const tubularSegments = 200;
    const radialSegments = 64;
    return new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, radialSegments, true);
  }, []);

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

    // Same mapping as GentleOrb — 50% audio reaction
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

    // Constant asymmetric rates
    for (let i = 0; i < NUM_WAVES; i++) {
      const rate = targets[i] > smoothedAmps.current[i] ? 0.15 : 0.02;
      smoothedAmps.current[i] += (targets[i] - smoothedAmps.current[i]) * rate;
    }

    // Phase advances
    const speedMod = 1.0 + (b + m) * 2.0;
    for (let i = 0; i < NUM_WAVES; i++) {
      phases.current[i] += delta * (0.5 + i * 0.3) * speedMod;
    }

    materialRef.current.uniforms.uWaveAmps.value = smoothedAmps.current;
    materialRef.current.uniforms.uWavePhases.value = phases.current;
    materialRef.current.uniforms.uTime.value = time;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};

export default GentleOrbInfinity;
