# Realtime States Handoff

Date: 2026-05-05

## Current Goal

The realtime-states editor should be the source-of-truth preview for the Kyoto/Nebularr linked profile behavior. The requested intro/replay behavior is not a separate shader topology morph. It should match the already-working manual transition:

1. show the active profile's `talking` render,
2. keep the selected state as `idle`,
3. let the existing JS render animator settle from talking values into idle/base values.

In practice: replay/reload should look like clicking `talking` and then `idle`, not like a new sphere-to-torus effect.

## Important Correction

An attempted `shapeMorph` sphere-to-torus shader path was added and then removed because it made the visual look wrong. Do not reintroduce that path unless the user explicitly asks for a different topology experiment.

The current correct direction is:

- `GentleOrbThicken` stays on its normal torus/thick-radius geometry.
- The intro is simulated by seeding the React-side `render` object with the profile's talking target.
- The existing realtime-states animator then lerps that render toward idle.

## Files Changed

### `src/pages/voiceinterface/realtime-states.tsx`

Current meaningful changes:

- Added `entrySpeed?: number` and `settleSpeed?: number` to the local `PeakOverrides` type so saved realtime-state profile data can round-trip these fields.
- Added `talkingRenderForProfile(profile)` helper.
- Initial `render` state now starts from `talkingRenderForProfile(KYOTO_SEED)` instead of `baseRender(KYOTO_SEED.base)`.
- Added `setRenderNow()` so replay can update both React state and the RAF ref immediately.
- Added `restartIntro()`:
  - resets the RAF timestamp and thinking pulse phase,
  - disables auto-loop,
  - clears thinking pause,
  - sets selected state to `idle`,
  - seeds the current render to the active profile's talking render.
- Calls `restartIntro()` after first profile load and after profile switch.
- Added a bottom-bar replay button titled `Replay talking-to-idle intro`.
- Color picker popover work from earlier remains in this file:
  - portaled/fixed popover positioning,
  - recalculates position after layout and format changes,
  - wider `w-72` format selector with `HEX`, `RGB`, `HSL`, `HSB`.

### `src/projects/blob-orb/variants/GentleOrbThicken.tsx`

Current meaningful change:

- `thickenRef` now initializes from `goal` instead of `0`.

Reason: realtime-states and Nebularr pass `goal={1}` and expect the shader to begin already settled at the thick/torus side. Starting from `0` made replay/reload look like the orb was merely growing in size before the expected torus state appeared.

No `shapeMorph` prop currently exists here.

### `src/projects/voiceinterface/components/NebularrBlob.tsx`

Current meaningful change:

- `useLinkedProfileAnimator()` is now called with `activeProfile` instead of possibly `null`, so the fallback Nebularr profile is animated through the same hook path.
- No `shapeMorph` logic remains.

### `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx`

Current meaningful changes:

- Active thumbnail border changed from black to a soft dark ring:
  - `box-shadow: 0 0 0 2px var(--VoiceDarkGrey_30, rgba(38, 36, 36, 0.3))`
- Hover state now only applies to non-active thumbnails:
  - opacity becomes `0.8`,
  - no upward translate,
  - gets a subtle `VoiceDarkGrey_10` ring.

### `realtime-state-profiles.json`

Current dirty data change:

- Kyoto/Nebularr talking `settleSpeed` changed from `0.6` to `1.2`.
- `lastModified` changed.

This is profile data edited through the app/user flow. Do not revert unless the user explicitly asks.

### `tasks/lessons.md`

Added lessons for:

- realtime-states being the source-of-truth preview page for profile-driven behavior,
- reusing the proven manual talking-to-idle transition instead of adding a separate shader topology path.

## Verification Done

- `npx tsc --noEmit` passes after the latest correction.
- `curl -i http://localhost:3000/voiceinterface/realtime-states` returned `HTTP/1.1 200 OK`.
- Browser screenshot after latest fix showed the torus visible again on `localhost:3000`.

## Verification Caveats

- Full `npm run build` has unrelated repo issues:
  - ESLint circular structure warning/error,
  - intermittent Next page-data/module collection errors.
- Headless Playwright/WebGL checks can be unreliable in this environment. One run hit `Error creating WebGL context`.

## Current Dirty Files

At handoff time:

- `realtime-state-profiles.json`
- `src/pages/voiceinterface/realtime-states.tsx`
- `src/projects/blob-orb/variants/GentleOrbThicken.tsx`
- `src/projects/voiceinterface/components/NebularrBlob.tsx`
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx`
- `tasks/lessons.md`
- `tasks/todo.md`
- `tasks/realtime-states-handoff.md`

## Next-Pass Guidance

- If the replay still looks wrong, compare it directly against the manual sequence:
  1. click `talking`,
  2. wait until it visually settles,
  3. click `idle`.
- The replay button should reproduce that same path by render seeding, not by shader shape changes.
- Avoid adding new shader geometry controls unless the user explicitly asks for a new visual experiment.
- If changing timing, look at `talking.settleSpeed` and the JS animator tau calculation before touching shader internals.

