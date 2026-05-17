export type CircleSawScaleMode = "static" | "reference-scale";

/** Ambient wave traveling direction across the bars. CSW-007 Phase 2 dropped
 *  the bounce variants (parked in the backlog) — the three modes below
 *  produce continuous sine-travel motion. Wave Spread (per-bar phase offset)
 *  is exposed separately as a knob so the user can tune visible overlap. */
export type WaveDirection = "inward" | "right" | "left";

export interface CircleSawSettings {
  diameter: number;
  /** Max envelope height — bars reach this silhouette at audio peak. */
  apexCircleHeight: number;
  /** Min envelope height — bars sit at this silhouette when silent. */
  arcCircleHeight: number;
  circleVisible: boolean;
  circleOpacity: number;
  /** When true, render dashed Arc (min, red) and Apex (max, green) silhouettes
   *  so the user can see the silent baseline and reach ceiling for each bar. */
  boundsVisible: boolean;
  barWidth: number;
  barGap: number;
  circleColor: string;
  barColor: string;
  pageColor: string;
  lineInset: number;
  thicknessFalloff: number;
  minThicknessRatio: number;
  scaleMode: CircleSawScaleMode;
  scaleReferenceDiameter: number;
  scaleReferenceCenterWidth: number;
  scaleReferenceMinWidth: number;
  scaleReferencePairs: number;
  /** Minimum rendered bar height in px (ellipse vertical diameter). 0 = geometry only. */
  minBarHeight: number;
  /** Audio reactivity multiplier applied to mapped frequency values [0..1]. */
  sensitivity: number;
  /** Per-bin gate: raw values below this threshold (0..0.95) are silenced before sensitivity. */
  noiseFloor: number;
  /** Throttle in ms between frequency-data sample → target updates. */
  updateRate: number;
  /** Smoothing time constant in ms [0..500]. Higher = slower convergence to audio target. 0 = instant. */
  smoothing: number;
  /** Blend between energy (0) and spectral (1) per-pair target values. */
  spectralMix: number;
  /** When true, per-bar fill opacity scales with that bar's audio value. */
  intensityOpacity: boolean;
  /** When true, a sine wave continuously modulates bar values (idle breathing). */
  ambientWave: boolean;
  /** CSW-002 talking-state experiment: invert the final bar-height mapping so
   *  bars rest at Max Height and *shrink* toward Min Height as the combined
   *  audio+wave value rises. Per-profile; ambient wave inverts with it. */
  audioInvert: boolean;
  /** How the wave combines with the audio value. */
  waveMode: "mul" | "add";
  /** Wave cycles per second. */
  waveSpeed: number;
  /** Wave contribution amount [0..1]. */
  waveAmplitude: number;
  /** Multiplier the wave reaches at its peak (mul/add weighting). UI label: "Audio Boost". */
  waveHeight: number;
  /** Direction of the ambient wave's traveling motion across pairs. */
  waveDirection: WaveDirection;
  /** Per-pair phase offset (radians) for sine-travel modes. Controls how
   *  much adjacent bars are out of phase — higher = more visible "travel".
   *  CSW-008: legacy field. The new wave renderer uses `waveCycles` instead;
   *  this field stays for the dual-path migration described in CSW-008 §4. */
  waveSpread: number;
  /** CSW-008 ambient wave shape. */
  waveShape: WaveShape;
  /** CSW-008 number of visible waves across the directional row span.
   *  OPTIONAL. Absence is the load-bearing signal that this profile uses
   *  the legacy `waveSpread` renderer path. Do NOT seed in DEFAULT_SETTINGS;
   *  do NOT add a destructure-with-default in normalizeSettings — see
   *  CSW-008 §4.3 for the exact merge pattern. */
  waveCycles?: number;
  /** CSW-008 Gaussian pulse FWHM as a fraction of a phase cycle. Only used
   *  when waveShape === "pulse". */
  pulseWidth: number;
}

/** CSW-008 §5 — available ambient wave shapes. */
export type WaveShape = "sine" | "sine-pulse" | "pulse";

/** Fixed baseline widths for Reference scale only; independent of circle-saw-profiles.json and unrelated to a saved profile labeled Apex in the UI. */
export const APEX_REFERENCE = {
  diameter: 276,
  centerWidth: 42,
  minWidth: 6.7,
  thicknessFalloff: 0.18,
  pairs: 5,
} as const;

export const DEFAULT_SETTINGS: CircleSawSettings = {
  diameter: 276,
  apexCircleHeight: 276,
  arcCircleHeight: 40,
  circleVisible: true,
  circleOpacity: 1,
  boundsVisible: true,
  barWidth: 42,
  barGap: 0,
  circleColor: "#D9D9D9",
  barColor: "#252525",
  pageColor: "#FFFFFF",
  lineInset: 0,
  thicknessFalloff: 0.18,
  minThicknessRatio: 0.16,
  scaleMode: "static",
  scaleReferenceDiameter: APEX_REFERENCE.diameter,
  scaleReferenceCenterWidth: APEX_REFERENCE.centerWidth,
  scaleReferenceMinWidth: APEX_REFERENCE.minWidth,
  scaleReferencePairs: APEX_REFERENCE.pairs,
  minBarHeight: 0,
  sensitivity: 1,
  noiseFloor: 0,
  updateRate: 50,
  smoothing: 100,
  spectralMix: 0.25,
  intensityOpacity: false,
  ambientWave: false,
  audioInvert: false,
  waveMode: "mul",
  waveSpeed: 2,
  waveAmplitude: 0.15,
  waveHeight: 1.5,
  waveDirection: "inward",
  waveSpread: 0.6,
  // CSW-008 §3 — waveShape and pulseWidth are required. waveCycles is
  // INTENTIONALLY OMITTED here: it must stay undefined for the dual-path
  // legacy contract (§4) to work. Seeding it would erase the "undefined
  // means legacy" signal during the {...DEFAULT_SETTINGS, ...incoming} merge.
  waveShape: "sine",
  pulseWidth: 0.4,
};

export const MIN_BAR_HEIGHT_MAX = 400;

export const GAP_SEQUENCE = [-3, 1, 4, 5, 6];

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSettings(settings: Partial<CircleSawSettings>): CircleSawSettings {
  // The legacy `audioMappingMode` field (CSW-006) may still appear in saved
  // JSON. Read it via a widened type, then strip it from the merged object so
  // it doesn't leak back into the in-memory settings or future writes.
  const raw = settings as Partial<CircleSawSettings> & {
    audioMappingMode?: unknown;
    spectralMix?: unknown;
    waveCycles?: unknown;
  };
  // CSW-008 §4.3 — strip `waveCycles` from `merged` so its raw incoming
  // value can't bypass clamping via the `...merged` spread. We re-add it
  // conditionally (clamped, or omitted entirely) at the end of the return.
  const {
    audioMappingMode: _droppedLegacyMode,
    waveCycles: _rawWaveCycles,
    ...merged
  } = {
    ...DEFAULT_SETTINGS,
    ...settings,
  } as typeof DEFAULT_SETTINGS & {
    audioMappingMode?: unknown;
    waveCycles?: unknown;
  };
  void _droppedLegacyMode;
  void _rawWaveCycles;

  const scaleReferenceDiameter =
    typeof merged.scaleReferenceDiameter === "number" && merged.scaleReferenceDiameter > 0
      ? merged.scaleReferenceDiameter
      : DEFAULT_SETTINGS.scaleReferenceDiameter;

  const scaleReferenceCenterWidth =
    typeof merged.scaleReferenceCenterWidth === "number"
      ? merged.scaleReferenceCenterWidth
      : DEFAULT_SETTINGS.scaleReferenceCenterWidth;

  const scaleReferenceMinWidth =
    typeof merged.scaleReferenceMinWidth === "number"
      ? merged.scaleReferenceMinWidth
      : DEFAULT_SETTINGS.scaleReferenceMinWidth;

  const scaleReferencePairs =
    typeof merged.scaleReferencePairs === "number" && merged.scaleReferencePairs >= 1
      ? merged.scaleReferencePairs
      : DEFAULT_SETTINGS.scaleReferencePairs;

  const scaleMode: CircleSawScaleMode =
    settings.scaleMode === "reference-scale" ? "reference-scale" : "static";

  const minBarHeight =
    typeof merged.minBarHeight === "number"
      ? clamp(merged.minBarHeight, 0, MIN_BAR_HEIGHT_MAX)
      : DEFAULT_SETTINGS.minBarHeight;

  const sensitivity =
    typeof merged.sensitivity === "number"
      ? clamp(merged.sensitivity, 0.1, 5)
      : DEFAULT_SETTINGS.sensitivity;

  const noiseFloor =
    typeof merged.noiseFloor === "number"
      ? clamp(merged.noiseFloor, 0, 0.95)
      : DEFAULT_SETTINGS.noiseFloor;

  const updateRate =
    typeof merged.updateRate === "number"
      ? clamp(merged.updateRate, 16, 200)
      : DEFAULT_SETTINGS.updateRate;

  // Smoothing is now a time-constant in ms (CSW-006C). Legacy profiles store
  // the dimensionless lerp factor in [0, 0.95]; convert it to its equivalent
  // ms time constant assuming the prior 60fps frame cadence. Anything > 1 is
  // already ms — clamp and use.
  const smoothing = (() => {
    const raw = merged.smoothing;
    if (typeof raw !== "number" || !Number.isFinite(raw)) return DEFAULT_SETTINGS.smoothing;
    if (raw > 1) return clamp(raw, 0, 500);
    if (raw <= 0) return 0;
    const tauMs = -16.6667 / Math.log(raw);
    return clamp(Math.round(tauMs), 0, 500);
  })();

  const intensityOpacity =
    typeof merged.intensityOpacity === "boolean"
      ? merged.intensityOpacity
      : DEFAULT_SETTINGS.intensityOpacity;

  const ambientWave =
    typeof merged.ambientWave === "boolean"
      ? merged.ambientWave
      : DEFAULT_SETTINGS.ambientWave;

  const audioInvert =
    typeof merged.audioInvert === "boolean"
      ? merged.audioInvert
      : DEFAULT_SETTINGS.audioInvert;

  const waveMode: "mul" | "add" =
    merged.waveMode === "add" ? "add" : "mul";

  const waveSpeed =
    typeof merged.waveSpeed === "number"
      ? clamp(merged.waveSpeed, 0, 10)
      : DEFAULT_SETTINGS.waveSpeed;

  const waveAmplitude =
    typeof merged.waveAmplitude === "number"
      ? clamp(merged.waveAmplitude, 0, 1)
      : DEFAULT_SETTINGS.waveAmplitude;

  const waveHeight =
    typeof merged.waveHeight === "number"
      ? clamp(merged.waveHeight, 0, 4)
      : DEFAULT_SETTINGS.waveHeight;

  // CSW-007 Phase 2 — three direction modes. Legacy profiles carrying the
  // dropped bounce variants migrate to 'inward' via the fallthrough.
  const waveDirection: WaveDirection =
    merged.waveDirection === "right" ? "right" :
    merged.waveDirection === "left" ? "left" :
    "inward";

  const waveSpread =
    typeof merged.waveSpread === "number"
      ? clamp(merged.waveSpread, 0, 2 * Math.PI)
      : DEFAULT_SETTINGS.waveSpread;

  // CSW-008 §4.2 — waveShape: validate, fall back to "sine". Profiles
  // saved during the brief window when square/triangle existed migrate
  // to "sine" (the safest visual default).
  const waveShape: WaveShape =
    merged.waveShape === "pulse" ? "pulse" :
    merged.waveShape === "sine-pulse" ? "sine-pulse" :
    "sine";

  // CSW-008 §4.3 — waveCycles MUST preserve undefined when absent in incoming
  // JSON. Read it from the raw `settings` (not `merged`) so the DEFAULT_SETTINGS
  // baseline can't accidentally seed it via the spread. Then list it
  // conditionally in the return object.
  const waveCyclesIncoming = settings.waveCycles;
  const waveCyclesClamped =
    typeof waveCyclesIncoming === "number"
      ? clamp(waveCyclesIncoming, 0.1, 5)
      : undefined;

  const pulseWidth =
    typeof merged.pulseWidth === "number"
      ? clamp(merged.pulseWidth, 0.05, 1)
      : DEFAULT_SETTINGS.pulseWidth;

  // CSW-006B migration precedence:
  //   1. explicit spectralMix wins (clamped to [0, 1])
  //   2. legacy audioMappingMode === "spectral" → 1
  //   3. legacy audioMappingMode === "energy"   → 0
  //   4. fallback → DEFAULT_SETTINGS.spectralMix (deliberate, see CSW-006B §3.1)
  let spectralMix: number;
  if (typeof raw.spectralMix === "number" && Number.isFinite(raw.spectralMix)) {
    spectralMix = clamp(raw.spectralMix, 0, 1);
  } else if (raw.audioMappingMode === "spectral") {
    spectralMix = 1;
  } else if (raw.audioMappingMode === "energy") {
    spectralMix = 0;
  } else {
    spectralMix = DEFAULT_SETTINGS.spectralMix;
  }

  return {
    ...merged,
    scaleMode,
    scaleReferenceDiameter,
    scaleReferenceCenterWidth,
    scaleReferenceMinWidth,
    scaleReferencePairs,
    minBarHeight,
    sensitivity,
    noiseFloor,
    updateRate,
    smoothing,
    intensityOpacity,
    ambientWave,
    audioInvert,
    waveMode,
    waveSpeed,
    waveAmplitude,
    waveHeight,
    waveDirection,
    waveSpread,
    waveShape,
    pulseWidth,
    spectralMix,
    // CSW-008 §4.3 — conditional spread keeps waveCycles absent (rather
    // than `waveCycles: undefined`) when there's no valid incoming value.
    // JSON.stringify drops undefined keys anyway, but this also keeps the
    // in-memory object clean for `"waveCycles" in settings` checks.
    ...(waveCyclesClamped !== undefined ? { waveCycles: waveCyclesClamped } : {}),
    circleVisible:
      typeof settings.circleVisible === "boolean"
        ? settings.circleVisible
        : typeof merged.circleVisible === "boolean"
          ? merged.circleVisible
          : DEFAULT_SETTINGS.circleVisible,
    boundsVisible:
      typeof settings.boundsVisible === "boolean"
        ? settings.boundsVisible
        : typeof merged.boundsVisible === "boolean"
          ? merged.boundsVisible
          : DEFAULT_SETTINGS.boundsVisible,
    circleOpacity:
      typeof settings.circleOpacity === "number"
        ? clamp(settings.circleOpacity, 0, 1)
        : typeof merged.circleOpacity === "number"
          ? clamp(merged.circleOpacity, 0, 1)
          : DEFAULT_SETTINGS.circleOpacity,
    apexCircleHeight: pickApexCircleHeight(settings, merged),
    arcCircleHeight: pickArcCircleHeight(settings, merged),
  };
}

export const HEIGHT_MIN = 0;
export const HEIGHT_MAX = 1024;

/** Resolve apexCircleHeight, accepting legacy `circleHeight` from older
 *  profiles or falling back to diameter then to the default. */
export function pickApexCircleHeight(
  raw: Partial<CircleSawSettings> & { circleHeight?: number },
  merged: CircleSawSettings & { circleHeight?: number },
): number {
  const candidate =
    typeof raw.apexCircleHeight === "number"
      ? raw.apexCircleHeight
      : typeof merged.apexCircleHeight === "number" && merged.apexCircleHeight > 0
        ? merged.apexCircleHeight
        : typeof raw.circleHeight === "number"
          ? raw.circleHeight
          : typeof merged.circleHeight === "number"
            ? merged.circleHeight
            : typeof raw.diameter === "number"
              ? raw.diameter
              : DEFAULT_SETTINGS.apexCircleHeight;
  return clamp(candidate, HEIGHT_MIN, HEIGHT_MAX);
}

/** Resolve arcCircleHeight from explicit input or fall through to default. */
export function pickArcCircleHeight(
  raw: Partial<CircleSawSettings>,
  merged: CircleSawSettings,
): number {
  const candidate =
    typeof raw.arcCircleHeight === "number"
      ? raw.arcCircleHeight
      : typeof merged.arcCircleHeight === "number"
        ? merged.arcCircleHeight
        : DEFAULT_SETTINGS.arcCircleHeight;
  return clamp(candidate, HEIGHT_MIN, HEIGHT_MAX);
}

export function getLineWidthAtDistance(distanceFromCenter: number, sawSettings: CircleSawSettings) {
  if (sawSettings.scaleMode === "reference-scale") {
    const scale = sawSettings.diameter / sawSettings.scaleReferenceDiameter;
    const centerWidth = sawSettings.scaleReferenceCenterWidth * scale;
    const ratio = 1 - distanceFromCenter * APEX_REFERENCE.thicknessFalloff;

    return Math.max(
      sawSettings.scaleReferenceMinWidth,
      centerWidth * ratio,
    );
  }

  const ratio = Math.max(
    sawSettings.minThicknessRatio,
    1 - distanceFromCenter * sawSettings.thicknessFalloff,
  );

  return sawSettings.barWidth * ratio;
}

export function getPairGap(distanceFromCenter: number, gapOffset: number) {
  const sequenceIndex = distanceFromCenter - 1;
  const sequenceGap =
    GAP_SEQUENCE[sequenceIndex] ?? GAP_SEQUENCE[GAP_SEQUENCE.length - 1] + sequenceIndex - 4;

  return sequenceGap + gapOffset;
}

export function getEllipseRadiusY(
  xOffset: number,
  radiusX: number,
  radiusY: number,
  barRadiusX: number,
) {
  const outerX = Math.abs(xOffset) + barRadiusX;
  const normalizedX = outerX / Math.max(1, radiusX);
  const verticalRatio = Math.sqrt(Math.max(0, 1 - normalizedX * normalizedX));

  return radiusY * verticalRatio;
}

export function barHalfHeightWithMin(minBarHeightPx: number, inscribedHalfHeight: number) {
  const minHalf = Math.max(0, minBarHeightPx) / 2;
  if (inscribedHalfHeight <= 0) return 0;
  return Math.max(minHalf, inscribedHalfHeight);
}

export interface GeneratedBar {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  pair: number;
  width: number;
}

/** Bar as returned from the render-time `bars` useMemo: geometry + the final
 *  per-bar combined audio+wave value in [0, 1]. Consumers like Intensity
 *  Opacity must read `value` (not the raw audioValues Map) so they reflect
 *  the wave contribution. See CSW-007 §7.2.1. */
export interface RenderedBar extends GeneratedBar {
  value: number;
}

/** Pure bar generator. Mirrors the bars `useMemo` but pure so it can be invoked
 *  for separate envelope profiles (Apex/Arc) at runtime. */
export function generateBars(sawSettings: CircleSawSettings, circleHeight: number): GeneratedBar[] {
  const { radiusX, radiusY, lineRadiusX, lineRadiusY } = getBarEnvelopeSpatial(sawSettings, circleHeight);
  const centerY = radiusY;
  const centerWidth = getLineWidthAtDistance(0, sawSettings);
  const centerRadiusX = centerWidth / 2;
  const centerEllipseRy = getEllipseRadiusY(0, lineRadiusX, lineRadiusY, centerRadiusX);
  const centerRadiusY = barHalfHeightWithMin(sawSettings.minBarHeight, centerEllipseRy);

  const bars: GeneratedBar[] = [
    {
      x: radiusX,
      y: centerY,
      radiusX: centerRadiusX,
      radiusY: centerRadiusY,
      pair: 0,
      width: centerWidth,
    },
  ];

  let previousCenterOffset = 0;
  let previousWidth = centerWidth;

  for (let distance = 1; ; distance += 1) {
    const width = getLineWidthAtDistance(distance, sawSettings);
    const barRadiusX = width / 2;
    const gap = getPairGap(distance, sawSettings.barGap);
    const centerOffset = previousCenterOffset + previousWidth / 2 + gap + barRadiusX;

    if (centerOffset + barRadiusX > lineRadiusX) break;

    const barEllipseRy = getEllipseRadiusY(centerOffset, lineRadiusX, lineRadiusY, barRadiusX);
    if (barEllipseRy <= 0) break;

    const barRadiusY = barHalfHeightWithMin(sawSettings.minBarHeight, barEllipseRy);

    bars.push(
      {
        x: radiusX - centerOffset,
        y: centerY,
        radiusX: barRadiusX,
        radiusY: barRadiusY,
        pair: distance,
        width,
      },
      {
        x: radiusX + centerOffset,
        y: centerY,
        radiusX: barRadiusX,
        radiusY: barRadiusY,
        pair: distance,
        width,
      },
    );

    previousCenterOffset = centerOffset;
    previousWidth = width;
  }

  return bars.sort((left, right) => left.x - right.x);
}

/** Build a per-pair ry lookup keyed by `pair` distance index. */
export function buildPairRyMap(bars: GeneratedBar[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const bar of bars) {
    if (!map.has(bar.pair)) map.set(bar.pair, bar.radiusY);
  }
  return map;
}

/** Map a frequency-bin buffer to per-pair [0..1] values. Center pair (p=0)
 *  reads the lowest relevant bin; outer pairs progress toward higher bins.
 *  Relevant slice is bins 5%–40% (voice + mid range, consistent with
 *  Linear/Radial visualizers). */
// Apply the noise-floor gate to a normalized [0, 1] bin value. Values below
// `floor` are silenced; values above are rescaled so the remaining range
// (floor..1) maps to (0..1). floor=0 is a no-op. Clamped at floor=0.95 in
// normalizeSettings, so the divisor is always > 0.
export function applyNoiseFloor(raw: number, floor: number): number {
  if (floor <= 0) return raw;
  if (raw <= floor) return 0;
  return (raw - floor) / (1 - floor);
}

export function mapFrequencyToPairs(
  freqData: Uint8Array | null,
  pairCount: number,
  sensitivity: number,
  noiseFloor: number,
): Map<number, number> {
  const out = new Map<number, number>();
  if (!freqData || freqData.length === 0 || pairCount <= 0) return out;
  const startBin = Math.floor(freqData.length * 0.05);
  const endBin = Math.floor(freqData.length * 0.4);
  const binCount = Math.max(1, endBin - startBin);
  for (let p = 0; p < pairCount; p++) {
    const t = pairCount === 1 ? 0 : p / (pairCount - 1);
    const binIndex = startBin + Math.min(binCount - 1, Math.floor(t * (binCount - 1)));
    const raw = (freqData[binIndex] ?? 0) / 255;
    const gated = applyNoiseFloor(raw, noiseFloor);
    out.set(p, Math.min(1, gated * sensitivity));
  }
  return out;
}

// Sensitivity is applied per bin (then clamped) before averaging, mirroring
// mapFrequencyToPairs so the same slider value produces comparable response
// in spectral and energy modes. See CSW-006A for the parity rationale.
export function computeEnergyAudioScalar(
  freqData: Uint8Array | null,
  sensitivity: number,
  noiseFloor: number,
): number {
  if (!freqData || freqData.length === 0) return 0;
  const startBin = Math.floor(freqData.length * 0.05);
  const endBin = Math.floor(freqData.length * 0.4);
  const binCount = Math.max(1, endBin - startBin);
  let sumSquares = 0;
  for (let i = startBin; i < endBin; i++) {
    const raw = (freqData[i] ?? 0) / 255;
    const gated = applyNoiseFloor(raw, noiseFloor);
    const clamped = Math.min(1, gated * sensitivity);
    sumSquares += clamped * clamped;
  }
  const rms = Math.sqrt(sumSquares / binCount);
  return Math.min(1, rms);
}

export const AUDIO_SENSITIVITY_DEFAULT = 1.0;
export const AUDIO_UPDATE_RATE_DEFAULT = 50;
export const AUDIO_SMOOTHING_DEFAULT = 0.85;

// CSW-007 §5.1 — signed bar index. Center bar: 0. Left bars in pair p: -p.
// Right bars in pair p: +p. The geometryCenterX argument is the SVG x-coord
// of the geometry center (NOT bar.radiusX, which is the bar's own ellipse rx).
export function signedBarIndex(bar: GeneratedBar, geometryCenterX: number): number {
  if (bar.pair === 0) return 0;
  return bar.x < geometryCenterX ? -bar.pair : bar.pair;
}

// CSW-007 §5.2 — LEGACY per-bar wave (sine only). Kept alive for profiles
// that have not yet opted into the CSW-008 wave shape picker (see CSW-008 §4
// for the dual-path contract). New code should use computeWaveForBarV2.
export function computeWaveForBar(
  direction: WaveDirection,
  signedIndex: number,
  t: number,
  waveSpeed: number,
  spread: number,
): number {
  let phase: number;
  if (direction === "inward") {
    phase = t * waveSpeed + Math.abs(signedIndex) * spread;
  } else if (direction === "right") {
    phase = t * waveSpeed - signedIndex * spread;
  } else {
    // left
    phase = t * waveSpeed + signedIndex * spread;
  }
  return (Math.sin(phase) + 1) / 2;
}

// CSW-008 §5 — new per-bar wave with selectable shape. The single
// phase formula `2π · cycles · u_dir - ω·t` drives all four shapes via
// `u_dir`, which is the only place `direction` appears.
//
//   inward: u_dir = |idx| / N        — edges peak first, mirrored
//   right:  u_dir = (idx + N) / 2N   — peak travels left → right
//   left:   u_dir = (N - idx) / 2N   — peak travels right → left
//
// N === 0 is treated as u_dir = 0 (degenerate single-bar row).
export function computeWaveForBarV2(
  shape: WaveShape,
  direction: WaveDirection,
  signedIndex: number,
  maxPairIndex: number,
  t: number,
  waveSpeed: number,
  cycles: number,
  pulseWidth: number,
): number {
  const N = maxPairIndex;
  let uDir: number;
  if (N === 0) {
    uDir = 0;
  } else if (direction === "inward") {
    uDir = Math.abs(signedIndex) / N;
  } else if (direction === "right") {
    uDir = (signedIndex + N) / (2 * N);
  } else {
    // left
    uDir = (N - signedIndex) / (2 * N);
  }
  const TWO_PI = 2 * Math.PI;
  // For inward, time advances WITH the |idx| term (matches legacy
  // computeWaveForBar:  phase = ωt + |idx|·spread). For right/left, time
  // OPPOSES the signed-position term, so the peak travels in the direction
  // implied by the u_dir mapping above. The t=0 snapshot is identical for
  // both sign conventions, so firstWriteWaveCycles continuity is preserved.
  const phase =
    direction === "inward"
      ? TWO_PI * cycles * uDir + t * waveSpeed
      : TWO_PI * cycles * uDir - t * waveSpeed;

  if (shape === "sine") {
    return (Math.sin(phase) + 1) / 2;
  }
  // Both pulse and sine-pulse use a Gaussian envelope on the wrapped
  // phase, peaking at wrapped = π. pulseWidth (∈ [0.05, 1]) scales σ
  // in phase-radians.
  const wrapped = ((phase % TWO_PI) + TWO_PI) % TWO_PI;
  const fromPeak = wrapped - Math.PI;
  const sigmaPhase = pulseWidth * Math.PI;
  const envelope = Math.exp(-(fromPeak * fromPeak) / (2 * sigmaPhase * sigmaPhase));
  if (shape === "sine-pulse") {
    // Raised cosine gated by the Gaussian envelope. `(1 - cos(phase)) / 2`
    // peaks at the same phase as the envelope (wrapped = π), so the
    // product can reach 1 (full Wave Amplitude). Using sin() here
    // would put the sine peak π/2 radians away from the envelope peak,
    // capping the product well below 1.
    const cosVal = (1 - Math.cos(phase)) / 2;
    return cosVal * envelope;
  }
  // pulse — pure Gaussian.
  return envelope;
}

// CSW-008 §4.1 — direction-aware conversion from the legacy `waveSpread`
// (radians of phase per pair-step) to `waveCycles` (visible cycles across
// the directional row span). Used at the moment a legacy profile opts in
// to the new wave shape picker, to preserve visual continuity.
//
// Legacy inward uses |signedIndex| → half-row phase span = N · waveSpread.
// Legacy right/left use signed indices → full-row phase span = 2N · waveSpread.
export function firstWriteWaveCycles(
  waveSpread: number,
  waveDirection: WaveDirection,
  N: number,
): number {
  if (N === 0) return 1;
  const raw =
    waveDirection === "inward"
      ? (N * waveSpread) / (2 * Math.PI)   // half-row span
      : (N * waveSpread) / Math.PI;        // full-row span (right or left)
  return clamp(raw, 0.1, 5);
}

// CSW-008E — combine smoothed audio with wave per bar via "MAX of two lifts".
// Structural model (see user's design discussion):
//   - audioLift = audio * max(1, audioBoost)  — audio's contribution, can
//                                                 reach 1 (full Apex).
//   - waveLift  = wave * waveAmplitude         — wave's contribution,
//                                                 capped at waveAmplitude (the
//                                                 "breathing band" above Min
//                                                 Height that the wave can
//                                                 reach).
// Whichever is taller wins. Wave's effect is structurally confined to the
// breathing band; once audio exceeds that band, audio takes over and the
// wave is invisible (still computed, just smaller than audio's level). No
// stacking, no multiplicative interference. Both clamp at 1 = Apex ceiling.
//
// The `mode` parameter is retained for back-compat with profile JSON but is
// ignored by this function — the Wave Mode pill was dropped from the UI in
// the same change.
export function combineAudioAndWave(
  audio: number,
  wave: number,
  _mode: "mul" | "add",
  waveAmplitude: number,
  waveHeight: number,
): number {
  const audioLift = audio * Math.max(1, waveHeight);
  const waveLift = wave * waveAmplitude;
  return Math.min(1, Math.max(audioLift, waveLift));
}

export function getBarEnvelopeSpatial(sawSettings: CircleSawSettings, circleHeight: number) {
  const radiusXSpatial = sawSettings.diameter / 2;
  const radiusYSpatial = circleHeight / 2;
  const centerThickness = getLineWidthAtDistance(0, sawSettings);
  const safeInsetLimited = Math.min(
    sawSettings.lineInset,
    Math.max(0, Math.min(radiusXSpatial, radiusYSpatial) - centerThickness),
  );
  const maxInsetLimited = Math.max(
    0,
    Math.floor(Math.min(radiusXSpatial, radiusYSpatial) - centerThickness),
  );
  /** Half-axes for bar placement vs grey ellipse minus inset — do not floor by bar width vertically (was freezing bar height when Circle Height shrunk). */
  const lineRadiusXSpatial = Math.max(1, radiusXSpatial - safeInsetLimited);
  const lineRadiusYSpatial = Math.max(1, radiusYSpatial - safeInsetLimited);

  return {
    radiusX: radiusXSpatial,
    radiusY: radiusYSpatial,
    centerThickness,
    safeInsetLimited,
    maxInsetLimited,
    lineRadiusX: lineRadiusXSpatial,
    lineRadiusY: lineRadiusYSpatial,
  };
}
