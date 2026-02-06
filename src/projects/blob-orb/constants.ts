import { OrbConfig } from "./types";

export const DEFAULT_CONFIG: OrbConfig = {
  palette: ["#FFF5F0", "#FFD6C0", "#FFC4C4"],
  bloomStrength: 0.5,
  maxDisplacement: 0.12,
  breatheAmp: 0.015,
  smoothingConstant: 0.04,
  idleAmp: 0.02,
};

export const AUDIO_BANDS = {
  BASS: { min: 20, max: 150 },
  MID: { min: 150, max: 2000 },
  TREBLE: { min: 2000, max: 8000 },
};
