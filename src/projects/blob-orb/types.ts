export interface AudioData {
  bass: number;
  mid: number;
  treble: number;
  rms: number;
  /** Raw byte-frequency data from the AnalyserNode. Optional — most
   *  consumers (3D orbs) only read the aggregated bands. Surfaces that
   *  render radial-waveform variants (realtime-states editor, realtime
   *  voice page) read this directly to map across bars. Producers that
   *  don't supply it can leave it undefined. Mirrors the field on
   *  voiceinterface/types AudioData so the two interfaces stay
   *  structurally compatible. */
  frequencyData?: Uint8Array | null;
}

export interface OrbConfig {
  palette: string[];
  bloomStrength: number;
  /** Max audio-driven displacement as fraction of radius */
  maxDisplacement: number;
  /** Idle breathing amplitude (scale pulse) */
  breatheAmp: number;
  /** Audio smoothing factor (0-1, lower = smoother) */
  smoothingConstant: number;
  /** Idle wave amplitude as fraction of maxDisplacement (0-0.2) */
  idleAmp: number;
}
