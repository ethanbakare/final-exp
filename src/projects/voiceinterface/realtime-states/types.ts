/**
 * Shared types for the realtime-states editor.
 *
 * Per the local convention: this file holds types and only types
 * (plus re-exports of types from sibling projects so all
 * realtime-states/ siblings have a single import path for shared types).
 *
 * Constants live in ./constants. Pure helpers live in ./helpers.
 * Network I/O lives in ./api. Page component lives in ./index.
 */
import type { AudioData } from '@/projects/voiceinterface/types';
import type { CoralRealtimeSettings } from '@/projects/voiceinterface/components/CoralRealtimeBlob';

export type PreviewState = 'idle' | 'listening' | 'thinking' | 'talking';
export type PeakScope = 'thinking' | 'talking';
export type ControlTab = 'size' | 'thickness' | 'motion' | 'colours';
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsb';

export interface BaseSettings {
  scale: number;
  thinRadius: number;
  thickenSpeed: number;
  waveIntensity: number;
  waveCount: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
  bgColor: string;
}

export interface PeakOverrides {
  scale?: number;
  thickRadius?: number;
  thickenSpeed?: number;
  entrySpeed?: number;
  settleSpeed?: number;
  waveIntensity?: number;
  waveCount?: number;
  breathAmp?: number;
  idleAmp?: number;
  color1?: string;
  color2?: string;
  color3?: string;
}

export interface LinkedProfile {
  base: BaseSettings;
  thinking: PeakOverrides;
  talking: PeakOverrides;
}

export interface SavedProfile {
  id: string;
  name: string;
  /** When true, this profile appears in the live realtime page's
   *  thumbnail strip. Toggleable via the bookmark button next to each
   *  entry in the dropdown. Default false (a profile must be explicitly
   *  pinned to show on the live page). */
  pinned?: boolean;
  /** When true, the talking-to-idle intro animation is SUPPRESSED on
   *  every mount of this profile — first-paint cascade, cross-shader
   *  switch, Tube `selectProfile`. The orb mounts directly at base/idle
   *  values with no sphere → torus morph. Default false (read via
   *  `=== true` defensively).
   *
   *  Replay button is unaffected — explicit user action always plays
   *  the intro regardless of this flag.
   *
   *  Same field on Tube (`SavedProfile`) and Coral (`SavedCoralProfile`)
   *  with identical semantics; both shaders show the toggle on the
   *  bottom bar. */
  skipIntroOnSelect?: boolean;
  settings: LinkedProfile;
  lastModified: number;
}

/** Saved-profile shape for the Coral D shader (parallel file). */
export interface SavedCoralProfile {
  id: string;
  name: string;
  pinned?: boolean;
  /** Same semantics as SavedProfile.skipIntroOnSelect — see that
   *  field's docstring. Suppresses sphere → torus morph on mount. */
  skipIntroOnSelect?: boolean;
  settings: CoralRealtimeSettings;
  lastModified: number;
}

/** Combined display row used by the dropdown — keeps the source
 *  variant so save/rename/pin can route to the right file. The editor
 *  preserves separate per-source arrays internally; this union is just
 *  the read-side projection. */
export type DropdownRow =
  | {
      shader: 'tube';
      sourceVariant: 'realtime-state';
      id: string;
      name: string;
      pinned: boolean;
    }
  | {
      shader: 'coral';
      sourceVariant: 'realtime-coral';
      id: string;
      name: string;
      pinned: boolean;
    };

/** Plan v8 (3D-0) — full discriminated union over both source files.
 *  Used as the editor's canonical active-orb shape. The dropdown's
 *  `DropdownRow` is a read-side projection of this; `BaselineSnapshot`
 *  is the dirty-detection projection. */
export type LoadedOrb =
  | {
      shader: 'tube';
      sourceVariant: 'realtime-state';
      id: string;
      name: string;
      pinned: boolean;
      /** Optional pass-through of the schema field — undefined /
       *  true / false flow through unchanged (no normalization at
       *  projection time). All read sites use `=== true` defensively. */
      skipIntroOnSelect?: boolean;
      settings: LinkedProfile;
      lastModified: number;
    }
  | {
      shader: 'coral';
      sourceVariant: 'realtime-coral';
      id: string;
      name: string;
      pinned: boolean;
      skipIntroOnSelect?: boolean;
      settings: CoralRealtimeSettings;
      lastModified: number;
    };

/** Plan v8 round-7 F1 — narrow shape for dirty detection. Inspects only
 *  `settings`, never `name`/`pinned`/`lastModified`/`sourceVariant`. */
export type BaselineSnapshot =
  | { key: string; shader: 'tube'; settings: LinkedProfile }
  | { key: string; shader: 'coral'; settings: CoralRealtimeSettings };

export interface RenderValues {
  scale: number;
  thickRadius: number;
  thickenSpeed: number; // animator bookkeeping; not passed to shader
  waveIntensity: number;
  waveCount: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
}

// Re-exports of types from sibling projects, so realtime-states/
// siblings can import every type they need from a single path.
// Keeps a single source of truth — these types remain defined in
// their original locations.
export type { AudioData, CoralRealtimeSettings };
