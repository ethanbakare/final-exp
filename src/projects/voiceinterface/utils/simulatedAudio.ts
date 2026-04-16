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
 * Values oscillate naturally — bass dominant, treble subtle, slightly out of phase.
 */
export function getSimulatedAudioData(timeMs: number): AudioData {
  const t = timeMs / 1000;
  return {
    bass: 0.3 + 0.3 * Math.sin(t * 2.1),
    mid: 0.2 + 0.25 * Math.sin(t * 3.7 + 1),
    treble: 0.1 + 0.15 * Math.sin(t * 5.3 + 2),
    rms: 0.25 + 0.2 * Math.sin(t * 2.8 + 0.5),
  };
}

/**
 * Higher intensity variant — used for "talking" (AI speaking) state.
 * Peaks are stronger to make the blob react more dramatically.
 */
export function getSimulatedAudioDataIntense(timeMs: number): AudioData {
  const t = timeMs / 1000;
  return {
    bass: 0.45 + 0.35 * Math.sin(t * 1.8),
    mid: 0.35 + 0.3 * Math.sin(t * 3.2 + 0.8),
    treble: 0.2 + 0.2 * Math.sin(t * 4.9 + 1.5),
    rms: 0.4 + 0.25 * Math.sin(t * 2.5 + 0.3),
  };
}
