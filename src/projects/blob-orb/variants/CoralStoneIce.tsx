/**
 * Material variant: Ice (v3 — CPU displacement + MeshPhysicalMaterial transmission)
 *
 * Transmission requires a special internal render pass that CSM may interfere
 * with. This variant does vertex displacement on the CPU via geometry buffer
 * updates, and uses a plain MeshPhysicalMaterial with transmission for real
 * refraction. Requires an <Environment> component in the parent scene.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
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

// Precompute direction vectors as flat array for fast access
const DIR_FLAT = new Float32Array(NUM_WAVES * 3);
for (let i = 0; i < NUM_WAVES; i++) {
  DIR_FLAT[i * 3] = DIRECTIONS[i][0];
  DIR_FLAT[i * 3 + 1] = DIRECTIONS[i][1];
  DIR_FLAT[i * 3 + 2] = DIRECTIONS[i][2];
}

function calcDisplacement(
  nx: number, ny: number, nz: number,
  amps: Float32Array, freqs: Float32Array, phases: Float32Array,
  breathScale: number, maxDisp: number
): number {
  let d = breathScale;
  for (let i = 0; i < NUM_WAVES; i++) {
    const dx = DIR_FLAT[i * 3], dy = DIR_FLAT[i * 3 + 1], dz = DIR_FLAT[i * 3 + 2];
    const projection = nx * dx + ny * dy + nz * dz;
    d += amps[i] * Math.sin(projection * freqs[i] + phases[i]);
  }
  return Math.max(-maxDisp, Math.min(maxDisp, d));
}

const SEG = 96; // slightly lower res to keep CPU displacement fast

interface Props {
  audioData: AudioData;
  config: OrbConfig;
}

const CoralStoneIce: React.FC<Props> = ({ audioData, config }) => {
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

  // Store original sphere normals (unit vectors from centre)
  const baseNormals = useRef<Float32Array | null>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;

    // Capture base normals on first frame
    if (!baseNormals.current) {
      baseNormals.current = new Float32Array(normAttr.array);
    }

    const time = state.clock.getElapsedTime();
    const breathCycle = Math.sin((time * (Math.PI * 2)) / 6.0);
    const breathScale = breathCycle * config.breatheAmp;
    const maxD = config.maxDisplacement;

    const b = audioData.bass;
    const m = audioData.mid;
    const t = audioData.treble;

    // Compute wave amplitude targets
    const targets = new Float32Array(NUM_WAVES);
    const idle = maxD * config.idleAmp;
    for (let i = 0; i < 8; i++) targets[i] = idle + b * maxD * (0.15 - i * 0.01);
    for (let i = 8; i < 18; i++) targets[i] = idle + m * maxD * (0.12 - (i - 8) * 0.006);
    for (let i = 18; i < NUM_WAVES; i++) targets[i] = idle + t * maxD * (0.08 - (i - 18) * 0.008);

    for (let i = 0; i < NUM_WAVES; i++) {
      const rate = targets[i] > smoothedAmps.current[i] ? 0.15 : 0.02;
      smoothedAmps.current[i] += (targets[i] - smoothedAmps.current[i]) * rate;
    }

    const speedMod = 1.0 + (b + m) * 1.5;
    for (let i = 0; i < NUM_WAVES; i++) {
      phases.current[i] += delta * (0.3 + i * 0.15) * speedMod;
    }

    const amps = smoothedAmps.current;
    const phasesArr = phases.current;
    const bn = baseNormals.current;
    const pos = posAttr.array as Float32Array;
    const norms = normAttr.array as Float32Array;
    const count = posAttr.count;
    const eps = 0.005;

    for (let v = 0; v < count; v++) {
      const i3 = v * 3;
      const nx = bn[i3], ny = bn[i3 + 1], nz = bn[i3 + 2];

      const disp = calcDisplacement(nx, ny, nz, amps, baseFreqs, phasesArr, breathScale, maxD);

      // Displaced position = unitNormal * (1 + displacement)
      pos[i3] = nx * (1.0 + disp);
      pos[i3 + 1] = ny * (1.0 + disp);
      pos[i3 + 2] = nz * (1.0 + disp);

      // Bump normal via finite differences
      // Tangent direction
      const absy = Math.abs(ny);
      let tx: number, ty: number, tz: number;
      if (absy < 0.99) {
        // cross(n, up)
        tx = nz; ty = 0; tz = -nx;
      } else {
        // cross(n, right)
        tx = 0; ty = -nz; tz = ny;
      }
      const tlen = Math.sqrt(tx * tx + ty * ty + tz * tz);
      tx /= tlen; ty /= tlen; tz /= tlen;

      // Bitangent = cross(n, tangent)
      const bx = ny * tz - nz * ty;
      const by = nz * tx - nx * tz;
      const bz = nx * ty - ny * tx;

      // Neighbour in tangent direction
      let ntx = nx + tx * eps, nty = ny + ty * eps, ntz = nz + tz * eps;
      const ntlen = Math.sqrt(ntx * ntx + nty * nty + ntz * ntz);
      ntx /= ntlen; nty /= ntlen; ntz /= ntlen;
      const dT = calcDisplacement(ntx, nty, ntz, amps, baseFreqs, phasesArr, breathScale, maxD);

      // Neighbour in bitangent direction
      let nbx = nx + bx * eps, nby = ny + by * eps, nbz = nz + bz * eps;
      const nblen = Math.sqrt(nbx * nbx + nby * nby + nbz * nbz);
      nbx /= nblen; nby /= nblen; nbz /= nblen;
      const dB = calcDisplacement(nbx, nby, nbz, amps, baseFreqs, phasesArr, breathScale, maxD);

      // Positions of neighbours
      const ptx = (nx + tx * eps) + ntx * dT;
      const pty = (ny + ty * eps) + nty * dT;
      const ptz = (nz + tz * eps) + ntz * dT;

      const pbx = (nx + bx * eps) + nbx * dB;
      const pby = (ny + by * eps) + nby * dB;
      const pbz = (nz + bz * eps) + nbz * dB;

      // Cross product for bump normal
      const ax = ptx - pos[i3], ay = pty - pos[i3 + 1], az = ptz - pos[i3 + 2];
      const cx = pbx - pos[i3], cy = pby - pos[i3 + 1], cz = pbz - pos[i3 + 2];
      let bnx = ay * cz - az * cy;
      let bny = az * cx - ax * cz;
      let bnz = ax * cy - ay * cx;
      const bnlen = Math.sqrt(bnx * bnx + bny * bny + bnz * bnz);
      bnx /= bnlen; bny /= bnlen; bnz /= bnlen;

      // Flip if pointing inward
      if (bnx * nx + bny * ny + bnz * nz < 0) {
        bnx = -bnx; bny = -bny; bnz = -bnz;
      }

      norms[i3] = bnx;
      norms[i3 + 1] = bny;
      norms[i3 + 2] = bnz;
    }

    posAttr.needsUpdate = true;
    normAttr.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.0, SEG, SEG]} />
      <meshPhysicalMaterial
        metalness={0}
        roughness={0.12}
        color={new THREE.Color(0.75, 0.88, 1.0)}
        transmission={1.0}
        thickness={1.0}
        attenuationColor={new THREE.Color(0.3, 0.55, 0.85)}
        attenuationDistance={0.5}
        ior={1.31}
        envMapIntensity={1.2}
      />
    </mesh>
  );
};

export default CoralStoneIce;
