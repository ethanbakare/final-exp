/**
 * Types and constants for the Blob Studio page.
 */

export type BlobVoiceState = 'idle' | 'listening' | 'thinking' | 'talking';

export const BLOB_STATE_LABELS: Record<BlobVoiceState, string> = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  talking: 'Speaking',
};

/** Per-state blob settings that can be tweaked via sliders */
export interface BlobStateSettings {
  waveIntensity: number;
  breathAmp: number;
  idleAmp: number;
  thickenSpeed: number; // For thinking: speed of thick/thin pulse. For talking: morphSpeed.
}

/** Shared base settings (Whimsy profile) */
export interface BlobBaseSettings {
  scale: number;
  thinRadius: number;
  thickRadius: number;
  torusRadius: number;
  color1: string;
  color2: string;
  color3: string;
  bgColor: string;
}

/** Complete settings for the studio */
export interface BlobStudioSettings {
  base: BlobBaseSettings;
  states: Record<BlobVoiceState, BlobStateSettings>;
}

// ─── Whimsy profile values (source of truth) ──────────────
export const WHIMSY_BASE: BlobBaseSettings = {
  scale: 0.4,
  thinRadius: 0.275,
  thickRadius: 0.35,
  torusRadius: 0.3,
  color1: '#944b2e',
  color2: '#ffa279',
  color3: '#ffc4c4',
  bgColor: '#f7f6f4',
};

export const DEFAULT_STATE_SETTINGS: Record<BlobVoiceState, BlobStateSettings> = {
  // Idle = Whimsy's actual default values (source of truth)
  idle: {
    waveIntensity: 0.18,
    breathAmp: 0.03,
    idleAmp: 0.02,
    thickenSpeed: 1.2,
  },
  // Listening = same as idle but receives simulated audio
  listening: {
    waveIntensity: 0.18,
    breathAmp: 0.03,
    idleAmp: 0.02,
    thickenSpeed: 1.2,
  },
  // Thinking = idle base motion + thick/thin pulsing
  thinking: {
    waveIntensity: 0.18,
    breathAmp: 0.03,
    idleAmp: 0.02,
    thickenSpeed: 1.2, // Speed of thick/thin oscillation
  },
  // Talking = moderate reaction to simulated audio (not extreme)
  talking: {
    waveIntensity: 0.20,
    breathAmp: 0.03,
    idleAmp: 0.02,
    thickenSpeed: 0.5, // morphSpeed — torus→sphere transition
  },
};

// ─── Sequential demo timing (ms) ──────────────────────────
export const PHASE_IDLE = 2000;
export const PHASE_LISTENING = 3000;
export const PHASE_THINKING = 4000;
export const PHASE_TALKING = 5000;
export const PHASE_PAUSE = 1500;
export const TOTAL_LOOP = PHASE_IDLE + PHASE_LISTENING + PHASE_THINKING + PHASE_TALKING + PHASE_PAUSE;

// ─── Canvas config ─────────────────────────────────────────
export const CELL_SIZE = 400;
export const CAMERA_Z = 3.5;
export const CAMERA_FOV = 45;
