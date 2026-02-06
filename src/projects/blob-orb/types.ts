export interface AudioData {
  bass: number;
  mid: number;
  treble: number;
  rms: number;
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
