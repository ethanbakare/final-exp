/**
 * Module-wide constants for the realtime-states editor.
 *
 * Anything used by two or more sibling files lives here. URL constants
 * for the API (only consumed inside ./api) are NOT here — they're
 * module-private to api.ts.
 */
import type { AudioData, ColorFormat, LinkedProfile, PreviewState } from './types';

export const TUBE_SEED: LinkedProfile = {
  base: {
    scale: 0.55,
    thinRadius: 0.15,
    thickenSpeed: 1.2,
    waveIntensity: 0.18,
    waveCount: 8,
    breathAmp: 0.015,
    idleAmp: 0.04,
    color1: '#080602',
    color2: '#efff08',
    color3: '#693a22',
    bgColor: '#fffafa',
  },
  thinking: { thickRadius: 0.25 },
  talking: { color3: '#949e05', waveCount: 16 },
};

export const STATES: PreviewState[] = ['idle', 'listening', 'thinking', 'talking'];
export const TALKING_GEOMETRY = 1.0;
export const SILENT: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };
export const REALTIME_SEED_NAME = 'Kyoto Realtime';

export const COLOR_FORMATS: ColorFormat[] = ['hex', 'rgb', 'hsl', 'hsb'];

// Speed sliders store a "tau coefficient": tau = value * 0.5, then the
// animator decays toward target with alpha = 1 - exp(-dt/tau). Visually
// "feels done" at ~3 tau (95% settled), so the *visible* duration the
// user perceives is approximately value * 1.5 seconds. We surface this
// number under each speed slider so the labelled "s" stays honest.
export const SETTLE_DURATION_MULTIPLIER = 1.5;

/** thickenSpeed value passed to GentleOrbThicken in the editor canvas.
 *  GentleOrbThicken has its own internal `thicken` animator (interpolates
 *  uniforms between thin and thick parameter sets, controlled by `goal`
 *  and this speed). The editor pins `goal={1}` and runs all visible
 *  morph animation through `render.thickRadius` (driven by the JS
 *  animator effect in index.tsx). With this speed value (~0.05s) the
 *  internal animator converges to its goal in ~3 frames, effectively
 *  becoming a no-op so the only visible animation is the externally-
 *  controlled `thickRadius`. Don't change without understanding the
 *  Tube morph architecture (see seam audit §4.1, §4.4). */
export const TUBE_INTERNAL_THICKEN_SPEED = 0.05;
