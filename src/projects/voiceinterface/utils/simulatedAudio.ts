/**
 * Simulated audio data generator for blob demos.
 * Listening uses real amplitude data extracted from
 * Naruto - Animal I Have Become (8s–18s, 625 frames at 16ms).
 * Speaking uses overlapping sine waves with high floor.
 */
import type { AudioData } from '@/projects/voiceinterface/types';
import narutoFrames from './narutoAudioData.json';

/** Zero audio — used for idle/thinking states */
export const ZERO_AUDIO: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };

/** Frame duration in ms (60fps) */
const FRAME_MS = 16;

/**
 * Get audio data from the Naruto track amplitude profile.
 * Loops the 10s clip. Used for "listening" state.
 */
export function getSimulatedAudioData(timeMs: number): AudioData {
  const totalDuration = narutoFrames.length * FRAME_MS;
  const loopedTime = timeMs % totalDuration;
  const frameIndex = Math.min(
    Math.floor(loopedTime / FRAME_MS),
    narutoFrames.length - 1
  );
  return narutoFrames[frameIndex] as AudioData;
}

/**
 * Speaking state — continuous irregular energy, never drops to silence.
 * Uses multiple overlapping sine waves per band with spread frequencies
 * so troughs never align. High floor ensures constant movement.
 * Middle-ground peaks (~0.45–0.55) — reactive without overdoing it.
 */
export function getSimulatedAudioDataIntense(timeMs: number): AudioData {
  const t = timeMs / 1000;
  return {
    // floor 0.28, peaks ~0.54 — never below 0.16
    bass: 0.28 + 0.15 * Math.sin(t * 1.8) + 0.11 * Math.sin(t * 3.1 + 2.4),
    // floor 0.24, peaks ~0.46 — never below 0.12
    mid: 0.24 + 0.13 * Math.sin(t * 2.9 + 0.8) + 0.09 * Math.sin(t * 4.6 + 3.7),
    // floor 0.18, peaks ~0.35 — never below 0.07
    treble: 0.18 + 0.09 * Math.sin(t * 4.3 + 1.5) + 0.08 * Math.sin(t * 6.1 + 0.9),
    // floor 0.26, peaks ~0.45 — never below 0.15
    rms: 0.26 + 0.11 * Math.sin(t * 2.2 + 0.3) + 0.08 * Math.sin(t * 3.8 + 2.1),
  };
}
