/**
 * ARCHIVED — This variant was explored but not selected for final use.
 * Showed visible white gaps beneath displaced cells.
 *
 * Variant: Grid Cells
 *
 * Divides the sphere surface into a grid of cells using spherical coordinates
 * (theta/phi bands). Each cell gets its own displacement amplitude, creating
 * discrete localised bumps rather than broad waves. Audio drives which cells
 * are active: bass lights up equatorial cells, treble lights up polar cells,
 * mid fills in between. Creates a "spiky ball" look with individual bumps.
 */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fragmentShader } from "../../shaders/fragmentShader";
import { AudioData, OrbConfig } from "../../types";

// Grid resolution: rows (theta) x cols (phi)
const ROWS = 8;
const COLS = 12;
const NUM_CELLS = ROWS * COLS; // 96 cells

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying float vDisplacement;

  uniform float uTime;
  uniform float uBreathScale;
  uniform float uMaxDisp;
  uniform float uCellAmps[${NUM_CELLS}];

  #define ROWS ${ROWS}
  #define COLS ${COLS}
  #define PI 3.14159265359
  #define TWO_PI 6.28318530718

  void main() {
    vUv = uv;
    vWorldNormal = normalize(normal);
    vNormal = normalize(normalMatrix * normal);

    // Convert normal to spherical coordinates
    float theta = acos(clamp(normal.y, -1.0, 1.0));           // 0..PI
    float phi = atan(normal.z, normal.x) + PI;                // 0..TWO_PI

    // Find which cell this vertex belongs to
    float rowF = theta / PI * float(ROWS);
    float colF = phi / TWO_PI * float(COLS);
    int row = int(floor(clamp(rowF, 0.0, float(ROWS) - 0.001)));
    int col = int(floor(clamp(colF, 0.0, float(COLS) - 0.001)));
    int cellIdx = row * COLS + col;

    // Distance from cell center for smooth bump shape
    float rowCenter = (float(row) + 0.5) / float(ROWS) * PI;
    float colCenter = (float(col) + 0.5) / float(COLS) * TWO_PI;
    float dTheta = (theta - rowCenter) / (PI / float(ROWS));
    float dPhi = (phi - colCenter) / (TWO_PI / float(COLS));
    float dist = sqrt(dTheta * dTheta + dPhi * dPhi);

    // Smooth bump: cos falloff from cell center (1 at center, 0 at edge)
    float bump = cos(clamp(dist, 0.0, 1.0) * PI * 0.5);
    bump = bump * bump; // Sharper falloff for more defined bumps

    // Look up this cell's amplitude
    float cellAmp = 0.0;
    for (int i = 0; i < ${NUM_CELLS}; i++) {
      if (i == cellIdx) {
        cellAmp = uCellAmps[i];
        break;
      }
    }

    float displacement = uBreathScale + cellAmp * bump * uMaxDisp;
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

const GridCells: React.FC<Props> = ({ audioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothedAmps = useRef(new Float32Array(NUM_CELLS));

  // Random phase offset per cell for organic feel
  const cellPhases = useMemo(() => {
    const p = new Float32Array(NUM_CELLS);
    for (let i = 0; i < NUM_CELLS; i++) {
      p[i] = Math.random() * Math.PI * 2;
    }
    return p;
  }, []);
  const cellPhasesRef = useRef(cellPhases);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(config.palette[0]) },
      uColor2: { value: new THREE.Color(config.palette[1]) },
      uColor3: { value: new THREE.Color(config.palette[2]) },
      uBreathScale: { value: 0 },
      uMaxDisp: { value: config.maxDisplacement },
      uCellAmps: { value: new Float32Array(NUM_CELLS) },
    }),
    [config.palette, config.maxDisplacement]
  );

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    const time = state.clock.getElapsedTime();

    const breathCycle = Math.sin(time * (Math.PI * 2) / 6.0);
    materialRef.current.uniforms.uBreathScale.value = breathCycle * config.breatheAmp;

    const b = audioData.bass;
    const m = audioData.mid;
    const t = audioData.treble;
    const rms = audioData.rms;

    const targets = new Float32Array(NUM_CELLS);
    const idleAmp = 0.08; // Idle floor per cell

    // Advance phases
    const speedMod = 1.0 + (b + m) * 1.5;
    for (let i = 0; i < NUM_CELLS; i++) {
      cellPhasesRef.current[i] += delta * 0.5 * speedMod;
    }

    for (let row = 0; row < ROWS; row++) {
      // Map rows to frequency bands:
      // Rows 0,7 (poles): treble
      // Rows 1,2,5,6 (mid latitude): mid
      // Rows 3,4 (equator): bass
      const distFromEquator = Math.abs(row - (ROWS - 1) / 2) / ((ROWS - 1) / 2);

      let bandEnergy: number;
      if (distFromEquator > 0.7) {
        bandEnergy = t; // Poles → treble
      } else if (distFromEquator > 0.3) {
        bandEnergy = m; // Mid latitudes → mid
      } else {
        bandEnergy = b; // Equator → bass
      }

      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        const phase = cellPhasesRef.current[idx];

        // Each cell pulses with its own phase, modulated by audio energy
        const pulse = Math.sin(phase) * 0.5 + 0.5; // 0..1
        targets[idx] = idleAmp + bandEnergy * pulse * 1.2;
      }
    }

    // Constant asymmetric smoothing — no silent-mode override
    for (let i = 0; i < NUM_CELLS; i++) {
      const rate = targets[i] > smoothedAmps.current[i] ? 0.15 : 0.02;
      smoothedAmps.current[i] += (targets[i] - smoothedAmps.current[i]) * rate;
    }

    materialRef.current.uniforms.uCellAmps.value = smoothedAmps.current;
    materialRef.current.uniforms.uTime.value = time;

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001 + m * 0.003;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.0, 160, 160]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};

export default GridCells;
