# Radial → realtime-states migration plan

## Goal

Surface the radial-states tune-mode element on the realtime-states editor and the realtime OpenAI voice page, alongside the existing Tube and Coral shaders. Profiles (Tonic, Primordial, Primordial thicker, Mosaic) live in the existing `radial-states-profiles.json`. No static mode on the realtime side. Animator stays at V2 (`useRadialAnimatorV2`), driven by the realtime page's `voiceState`.

## Current architecture (what's in place)

- **Existing shaders in realtime**: Tube (`NebularrBlob` + `useLinkedProfileAnimator`) and Coral (`CoralRealtimeBlob` + `useEasedNumber`). Both wrappers own their own canvas. Dispatched by `RealtimeBlob` based on a discriminated union `{ shader: 'tube' | 'coral'; profile }`.
- **Realtime page**: `VoiceRealtimeOpenAI` fetches profiles via `Promise.allSettled` from two variants (`realtime-state` for Tube, `realtime-coral` for Coral). Profile strip shows thumbnails. Active profile drives `RealtimeBlob`.
- **Editor page**: `realtime-states/index.tsx` has `CoralTabPanel` and `TubeTabPanel` for editing each shader's profile.
- **Radial-states (this codebase)**: standalone page at `/voiceinterface/radial-states`. Animator is V2 (`useRadialAnimatorV2`). Renderer is `RadialBidirectional`. Profile shape: `RadialLinkedProfile` in `radial-states/api.ts`. Profile data: `radial-states-profiles.json` (Tonic, Primordial, Primordial thicker, Mosaic, Default).
- **API**: `src/pages/api/studio-profiles.ts` already serves the `radial-states` variant from `radial-states-profiles.json`. No new endpoint needed.

## Voice-state mapping

Realtime page emits `voiceState: 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking'`. Radial animator expects `RadialState: 'idle' | 'listening' | 'thinking' | 'talking'`. The mapping is direct: `ai_thinking → thinking`, `ai_speaking → talking`.

## Audio data

Realtime page passes `AudioData` (a `Uint8Array | null` frequencyData stream) to each blob. The radial animator V2 doesn't consume audio directly — it only emits geometry/style values per frame. The audio path is in the `RadialBidirectional` renderer, which takes `frequencyData` as a prop. So the new `RadialRealtimeBlob` wrapper just needs to pass `audioData.frequencyData` through to the renderer.

## Stages — each commit independently revertible

### Stage 0 — Plan doc (this file)
Commit: `docs(radial-states): plan for realtime migration`

### Stage 1 — `RadialRealtimeBlob` wrapper component
New file: `src/projects/voiceinterface/components/RadialRealtimeBlob.tsx`.
- Props: `audioData: AudioData`, `voiceState: RealtimeVoiceState`, `profile: RadialLinkedProfile | null`, `width`, `height`, `skipIntro?`.
- Maps `voiceState` → `RadialState`.
- Calls `useRadialAnimatorV2(profile, mappedState)`.
- Renders `RadialBidirectional` with the animator's emitted values + `frequencyData` from `audioData`.
- `skipIntro` semantics: if true, snap to the resting values for `mappedState` on mount (no Phase A/B intro).
Commit: `feat(realtime): RadialRealtimeBlob wrapper for radial waveform on realtime page`

### Stage 2 — Extend `RealtimeBlob` dispatcher
Edit `src/projects/voiceinterface/components/RealtimeBlob.tsx`.
- Add `{ shader: 'radial'; profile: RadialLinkedProfile | null }` to `RealtimeOrb` union.
- Branch in the dispatcher to render `RadialRealtimeBlob`.
Existing Tube/Coral paths untouched.
Commit: `feat(realtime): dispatcher routes shader === 'radial' to RadialRealtimeBlob`

### Stage 3 — Extend realtime-states types
Edit `src/projects/voiceinterface/realtime-states/types.ts`.
- Add `{ shader: 'radial' }` variants to the saved-profile discriminated unions (parallel to Tube and Coral).
- Add `{ key: string; shader: 'radial'; settings: RadialLinkedProfile }` to the active-profile union.
Commit: `feat(realtime-states): add radial variant to profile discriminated unions`

### Stage 4 — API fetch/persist functions for radial profiles
Edit `src/projects/voiceinterface/realtime-states/api.ts`.
- Add `fetchRadialProfiles()` and `persistRadialProfiles(arr)` mirroring the Tube and Coral helpers. Use variant `radial-states` (already wired in `studio-profiles.ts`).
Commit: `feat(realtime-states): fetch/persist helpers for radial profiles`

### Stage 5 — Wire realtime-states editor (`index.tsx`)
This is the largest stage. Edits to `realtime-states/index.tsx`:
- Load radial profiles in parallel with Tube/Coral.
- Add radial entries to the profile strip / picker.
- Add a third tab (`RadialTabPanel` — separate file, follows the Coral/Tube tab pattern).
- Tune-mode preview: when active profile is radial, render `RadialRealtimeBlob` (or the same RadialBidirectional + V2 animator setup that the radial-states page uses) in the central canvas slot. No static mode for radial.
The `RadialTabPanel` is a thin reuse of the existing radial-states controls. To keep the scope tight, Stage 5 ships a minimal set of controls (state selector, profile picker); detailed sliders can land in a follow-up.
Commit: `feat(realtime-states): editor surface for radial profiles (tune mode only)`

### Stage 6 — Wire `VoiceRealtimeOpenAI`
Edit `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx`.
- Add a third fetch call in the `Promise.allSettled` block for radial profiles (variant `radial-states`).
- Map fetched entries into the orbs list with `shader: 'radial'`.
- Profile strip thumbnails for radial profiles use `profile.display.previewBg` as the background (mirrors how radial-states cells already display).
Commit: `feat(realtime): surface radial profiles on realtime voice page`

### Stage 7 — Smoke test
Manual verification on `/voiceinterface/realtime` with mic input:
- Switch active profile to a radial profile (Tonic / Primordial / Primordial thicker / Mosaic).
- Confirm voiceState changes drive the radial animator correctly:
  - idle ↔ listening
  - listening → ai_thinking (= radial thinking)
  - ai_thinking → ai_speaking (= radial talking)
  - ai_speaking → listening (reverse)
- No code changes here unless a regression appears; in that case, surgical fixes (audio prop wiring, voiceState mapping edge cases) with targeted commits.

## Out of scope for this migration

- Editing radial profiles from the realtime-states editor at slider-level fidelity. Stage 5 ships a basic profile picker; the per-slider edit surface can be added later by reusing the existing radial-states/index.tsx controls in a separate panel component.
- Removing static mode from `/voiceinterface/radial-states`. That page is the original surface and stays as-is; the migration only adds radial as an option on the realtime side.
- Changing the audio path inside `RadialBidirectional`. Audio wiring is identical to the standalone radial-states page.

## Rollback

Each stage is its own commit. If any stage misbehaves, `git revert <hash>` reverts only that stage. The Tube and Coral paths through `RealtimeBlob` and `VoiceRealtimeOpenAI` are never modified — only extended — so a revert can never break those existing shaders.
