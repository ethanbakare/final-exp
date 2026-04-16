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
 * Slightly more active variant — used for "talking" (AI speaking) state.
 * A touch more energy than listening, but still controlled.
 */
export function getSimulatedAudioDataIntense(timeMs: number): AudioData {
  const t = timeMs / 1000;
  return {
    bass: 0.2 + 0.18 * Math.sin(t * 1.8),
    mid: 0.15 + 0.15 * Math.sin(t * 3.2 + 0.8),
    treble: 0.08 + 0.1 * Math.sin(t * 4.9 + 1.5),
    rms: 0.18 + 0.12 * Math.sin(t * 2.5 + 0.3),
  };
}
