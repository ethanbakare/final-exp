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
import type { RadialLinkedProfile } from '@/projects/voiceinterface/radial-states/api';

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

/** SCHEMA RULE — when adding a field to SavedProfile / SavedCoralProfile:
 *
 *   1. Mark it optional (`field?: T`) unless paired with a JSON
 *      migration. Persisted JSON files predate the field and will read
 *      it as `undefined` until the next save rewrites them.
 *   2. Read defensively at every consumer: `=== true` for booleans,
 *      `?? fallback` for values. Don't truthy-check.
 *   3. Mirror the field in BOTH `orbs` useMemo projections — there are
 *      currently two duplicates (parent at ~L1858, editor child at
 *      ~L226). Forgetting one causes silent field-loss between source
 *      array and runtime LoadedOrb.
 *   4. If the field affects a fetch-driven code path, ensure the
 *      fetches use `cache: 'no-store'`. Browser-cached responses
 *      predating the field will silently drop it (real bug — see
 *      commit 19dc15a).
 *
 *  See tasks/realtime-states-seam-audit.md §5.1 for context. */
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

/** Saved-profile shape for the radial-waveform shader (parallel file).
 *  `settings` is the existing `RadialLinkedProfile` from the
 *  radial-states page — no schema fork. Persisted via the
 *  `radial-states` variant of the studio-profiles API, which
 *  already exists and serves `radial-states-profiles.json`. */
export interface SavedRadialProfile {
  id: string;
  name: string;
  pinned?: boolean;
  /** Parity with Tube/Coral. Radial doesn't currently animate an
   *  intro on mount, so this is reserved for future use. */
  skipIntroOnSelect?: boolean;
  settings: RadialLinkedProfile;
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
    }
  | {
      shader: 'radial';
      sourceVariant: 'radial-states';
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
    }
  | {
      shader: 'radial';
      sourceVariant: 'radial-states';
      id: string;
      name: string;
      pinned: boolean;
      skipIntroOnSelect?: boolean;
      settings: RadialLinkedProfile;
      lastModified: number;
    };

/** Plan v8 round-7 F1 — narrow shape for dirty detection. Inspects only
 *  `settings`, never `name`/`pinned`/`lastModified`/`sourceVariant`. */
export type BaselineSnapshot =
  | { key: string; shader: 'tube'; settings: LinkedProfile }
  | { key: string; shader: 'coral'; settings: CoralRealtimeSettings }
  | { key: string; shader: 'radial'; settings: RadialLinkedProfile };

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
export type { AudioData, CoralRealtimeSettings, RadialLinkedProfile };
