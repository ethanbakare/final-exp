/**
 * ARCHIVED — Torus ↔ infinity morph experiment. Not part of the final five
 * but preserved as a standalone demo at /blob-orb/morph. Features arc-length
 * reparameterisation for symmetric morphing and blended normals.
 *
 * EXPERIMENT: GentleOrbMorph
 *
 * Morphs between the damped torus and the infinity/figure-8 shape.
 * Both geometries share the same TubeGeometry topology (same segment counts).
 * The infinity vertex positions are stored as a second attribute and blended
 * in the vertex shader via a uMorphT uniform (0 = torus, 1 = infinity).
 * A toggle triggers a smooth animated transition between the two.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fragmentShader } from "../../shaders/fragmentShader";
import { AudioData, OrbConfig } from "../../types";

const NUM_WAVES = 8;

const SCALE = 0.85;
const TUBE_RADIUS = 0.15;
const TUBULAR_SEGMENTS = 200;
const RADIAL_SEGMENTS = 64;
const Z_LIFT = 0.5;
const MORPH_DURATION = 1.2; // seconds

/** Circular torus center path */
function makeTorusCurve(scale: number, numPoints = 200): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * Math.PI * 2;
    pts.push(new THREE.Vector3(scale * Math.cos(t), scale * Math.sin(t), 0));
  }
  return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.0);
}

/** Sample a raw lemniscate point at parameter t */
function lemniscateAt(scale: number, zLift: number, t: number): THREE.Vector3 {
  const s = Math.sin(t);
  const c = Math.cos(t);
  const denom = 1 + s * s;
  return new THREE.Vector3(
    (scale * c) / denom,
    (scale * c * s) / denom,
    zLift * Math.sin(t)
  );
}

/**
 * Lemniscate (infinity / figure-8) center path with arc-length
 * reparameterisation so points are evenly spaced along the curve.
 * This ensures each vertex on the torus (evenly spaced circle) maps
 * to a corresponding evenly-spaced point on the lemniscate, giving
 * a symmetric morph transition.
 */
function makeInfinityCurve(
  scale: number,
  zLift: number,
  numPoints = 200
): THREE.CatmullRomCurve3 {
  // 1. Oversample to build a cumulative arc-length table
  const OVERSAMPLE = 2000;
  const rawPts: THREE.Vector3[] = [];
  const arcLengths: number[] = [0];

  for (let i = 0; i <= OVERSAMPLE; i++) {
    const t = (i / OVERSAMPLE) * Math.PI * 2;
    rawPts.push(lemniscateAt(scale, zLift, t));
    if (i > 0) {
      arcLengths.push(
        arcLengths[i - 1] + rawPts[i].distanceTo(rawPts[i - 1])
      );
    }
  }

  const totalLength = arcLengths[OVERSAMPLE];

  // 2. Resample at evenly-spaced arc-length intervals
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < numPoints; i++) {
    const targetLen = (i / numPoints) * totalLength;

    // Binary search for the segment containing targetLen
    let lo = 0;
    let hi = OVERSAMPLE;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (arcLengths[mid] < targetLen) lo = mid;
      else hi = mid;
    }

    // Lerp between the two bounding samples
    const segLen = arcLengths[hi] - arcLengths[lo];
    const frac = segLen > 0 ? (targetLen - arcLengths[lo]) / segLen : 0;
    const pt = rawPts[lo].clone().lerp(rawPts[hi], frac);
    pts.push(pt);
  }

  return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.0);
}

const vertexShader = `
  attribute vec3 morphTarget;
  attribute vec3 morphNormal;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying float vDisplacement;

  uniform float uTime;
  uniform float uMorphT;
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

    // Blend position between torus (position) and infinity (morphTarget)
    vec3 blendedPos = mix(position, morphTarget, uMorphT);

    // Blend normals so lighting stays correct throughout the transition
    vec3 blendedNormal = normalize(mix(normal, morphNormal, uMorphT));

    vWorldNormal = normalize(blendedNormal);
    vNormal = normalize(normalMatrix * blendedNormal);

    float displacement = uBreathScale;

    for (int i = 0; i < ${NUM_WAVES}; i++) {
      vec3 dir = getWaveDir(i);
      float projection = dot(blendedNormal, dir);
      displacement += uWaveAmps[i] * sin(projection * uWaveFreqs[i] + uWavePhases[i]);
    }

    displacement = clamp(displacement, -uMaxDisp, uMaxDisp);

    // Inner-face dampening
    float innerness = 1.0 - abs(uv.y * 2.0 - 1.0);
    float dampening = smoothstep(0.3, 0.8, innerness);
    displacement *= mix(0.7, 0.3, dampening);

    vDisplacement = displacement;

    vec3 newPosition = blendedPos + blendedNormal * displacement;
    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

interface Props {
  audioData: AudioData;
  config: OrbConfig;
  /** 0 = torus, 1 = infinity — animate toward this value */
  goal: number;
}

const GentleOrbMorph: React.FC<Props> = ({ audioData, config, goal }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothedAmps = useRef(new Float32Array(NUM_WAVES));
  const phases = useRef(new Float32Array(NUM_WAVES));

  // Morph animation
  const morphCurrent = useRef(0);

  const baseFreqs = useMemo(
    () => [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 10.0],
    []
  );

  // Build both geometries with identical topology, then merge
  const geometry = useMemo(() => {
    const torusCurve = makeTorusCurve(SCALE);
    const infinityCurve = makeInfinityCurve(SCALE, Z_LIFT);

    const torusGeo = new THREE.TubeGeometry(
      torusCurve, TUBULAR_SEGMENTS, TUBE_RADIUS, RADIAL_SEGMENTS, true
    );
    const infinityGeo = new THREE.TubeGeometry(
      infinityCurve, TUBULAR_SEGMENTS, TUBE_RADIUS, RADIAL_SEGMENTS, true
    );

    // Store infinity positions and normals as custom attributes on the torus geometry
    const infPositions = infinityGeo.getAttribute("position").array;
    const infNormals = infinityGeo.getAttribute("normal").array;
    torusGeo.setAttribute(
      "morphTarget",
      new THREE.Float32BufferAttribute(new Float32Array(infPositions), 3)
    );
    torusGeo.setAttribute(
      "morphNormal",
      new THREE.Float32BufferAttribute(new Float32Array(infNormals), 3)
    );

    infinityGeo.dispose();
    return torusGeo;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorphT: { value: 0 },
      uColor1: { value: new THREE.Color(config.palette[0]) },
      uColor2: { value: new THREE.Color(config.palette[1]) },
      uColor3: { value: new THREE.Color(config.palette[2]) },
      uBreathScale: { value: 0 },
      uMaxDisp: { value: config.maxDisplacement },
      uWaveAmps: { value: new Float32Array(NUM_WAVES) },
      uWaveFreqs: { value: new Float32Array(baseFreqs) },
      uWavePhases: { value: new Float32Array(NUM_WAVES) },
    }),
    [config.palette, config.maxDisplacement, baseFreqs]
  );

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    const time = state.clock.getElapsedTime();

    // Animate morphCurrent toward goal prop
    const speed = 1.0 / MORPH_DURATION;
    if (morphCurrent.current < goal) {
      morphCurrent.current = Math.min(goal, morphCurrent.current + delta * speed);
    } else if (morphCurrent.current > goal) {
      morphCurrent.current = Math.max(goal, morphCurrent.current - delta * speed);
    }
    // Ease in-out via smoothstep
    const t = morphCurrent.current;
    const eased = t * t * (3 - 2 * t);
    materialRef.current.uniforms.uMorphT.value = eased;

    // Breathing
    const breathCycle = Math.sin(time * ((Math.PI * 2) / 6.0));
    materialRef.current.uniforms.uBreathScale.value =
      breathCycle * config.breatheAmp;

    const b = audioData.bass;
    const m = audioData.mid;
    const tr = audioData.treble;

    const targets = new Float32Array(NUM_WAVES);
    const maxD = config.maxDisplacement;
    const idleAmp = maxD * 0.04;
    targets[0] = idleAmp + b * maxD * 0.2;
    targets[1] = idleAmp + b * maxD * 0.15;
    targets[2] = idleAmp + b * maxD * 0.125;
    targets[3] = idleAmp + m * maxD * 0.175;
    targets[4] = idleAmp + m * maxD * 0.15;
    targets[5] = idleAmp + m * maxD * 0.125;
    targets[6] = idleAmp + tr * maxD * 0.1;
    targets[7] = idleAmp + tr * maxD * 0.075;

    for (let i = 0; i < NUM_WAVES; i++) {
      const rate = targets[i] > smoothedAmps.current[i] ? 0.15 : 0.02;
      smoothedAmps.current[i] +=
        (targets[i] - smoothedAmps.current[i]) * rate;
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

export default GentleOrbMorph;
