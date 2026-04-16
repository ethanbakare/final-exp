/**
 * Simulated audio data generator for blob demos.
 * Produces fake AudioData values using sine waves at different
 * frequencies — no mic or WebAudio needed.
 */
import type { AudioData } from '@/projects/voiceinterface/types';

/** Zero audio — used for idle/thinking states */
export const ZERO_AUDIO: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };

/**
 * Generate simulated audio data from a timestamp.
 * Gentle oscillation — used for "listening" state.
 * Peaks are moderate to give natural mic-like movement.
 */
export function getSimulatedAudioData(timeMs: number): AudioData {
  const t = timeMs / 1000;
  return {
    bass: 0.15 + 0.15 * Math.sin(t * 2.1),
    mid: 0.1 + 0.12 * Math.sin(t * 3.7 + 1),
    treble: 0.05 + 0.08 * Math.sin(t * 5.3 + 2),
    rms: 0.12 + 0.1 * Math.sin(t * 2.8 + 0.5),
  };
}

/**
 * Speaking state — continuous irregular energy, never drops to silence.
 * Uses multiple overlapping sine waves per band with spread frequencies
 * so troughs never align. High floor ensures constant movement.
 */
export function getSimulatedAudioDataIntense(timeMs: number): AudioData {
  const t = timeMs / 1000;
  return {
    // floor 0.22, range 0.08+0.06 — never below 0.08
    bass: 0.22 + 0.08 * Math.sin(t * 1.8) + 0.06 * Math.sin(t * 3.1 + 2.4),
    // floor 0.18, range 0.07+0.05 — never below 0.06
    mid: 0.18 + 0.07 * Math.sin(t * 2.9 + 0.8) + 0.05 * Math.sin(t * 4.6 + 3.7),
    // floor 0.12, range 0.05+0.04 — never below 0.03
    treble: 0.12 + 0.05 * Math.sin(t * 4.3 + 1.5) + 0.04 * Math.sin(t * 6.1 + 0.9),
    // floor 0.20, range 0.06+0.04 — never below 0.10
    rms: 0.20 + 0.06 * Math.sin(t * 2.2 + 0.3) + 0.04 * Math.sin(t * 3.8 + 2.1),
  };
}
