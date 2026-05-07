# Radial-states — handoff

> Snapshot for picking up in a new conversation. Captures what's shipped, where to read it, the open follow-ups, and the next big piece of work (the morph animator). Built on top of `tasks/realtime-states-handoff.md`'s patterns.

## Current state (as of commit `0dec6ac`)

A static three-state review page lives at `/voiceinterface/radial-states`. It shows idle/listening, thinking, and talking radial cells side-by-side, fully editable, persisted to disk as linked profiles. **Animation between states has not started.**

### Page structure

- **Route**: `/voiceinterface/radial-states` → 2-line shim at `src/pages/voiceinterface/radial-states.tsx`.
- **Module dir**: `src/projects/voiceinterface/radial-states/`
  - `index.tsx` (~1940 lines) — page component, all UI, mutators, GhostBars, Cell, ControlsPanel.
  - `api.ts` (~84 lines) — fetch/persist wrappers, `RadialLinkedProfile` + `RadialBackdrop` types.
  - `ColorPicker.tsx` (~333 lines) — react-aria-components ColorArea + ColorSlider + format-aware HEX/RGB/HSL/HSB inputs, dark theme to match the navbar.
- **Disk**: `radial-states-profiles.json` at repo root (committed). Persists via `/api/studio-profiles?variant=radial-states` — variant registered in `src/pages/api/studio-profiles.ts:28`.
- **Active profile id**: `localStorage['radial-states-active-profile-id']`. Profile values themselves live on disk.

## Schema — `RadialLinkedProfile`

```ts
interface RadialLinkedProfile {
  id: string;
  name: string;
  idle: RadialSettings;       // inward variant
  thinking: RadialSettings;   // inward variant
  talking: RadialSettings;    // outward variant; .radius is DERIVED at render time
  backdrop?: RadialBackdrop;  // shared across all three cells
  lockBarCount?: boolean;     // default true; forces same bar count across cells
  talkingInnerGap?: number;   // default 14; gap between donut.inner and talking.radius
  lastModified: number;
}

interface RadialBackdrop {
  enabled?: boolean;          // default true
  color?: string;             // default '#262424'
  opacity?: number;           // default 0.03
  shape?: 'circle' | 'segments';     // default 'circle' — inner edge
  segments?: number;          // default 7 — inner lobe count
  depth?: number;             // default 6 — inner lobe depth in px
  outerShape?: 'circle' | 'segments'; // outer edge
  outerSegments?: number;
  outerDepth?: number;
}
```

## Geometry rules

The whole UI runs on three rules:

1. **Donut envelope** wraps the idle/thinking bar zone with `DONUT_PADDING = 14` px on both edges:
   - `donut.outer = idle.radius + 14`
   - `donut.inner = idle.radius - idle.maxBarLength - 14`
   - All three cells share this single donut.

2. **Talking's radius is DERIVED**, not stored:
   - `talking.radius = donut.inner + talkingInnerGap` (default `talkingInnerGap = 14`, so the 14s cancel and `talking.radius = idle.radius - idle.maxBarLength`).
   - The Radius slider is replaced with a read-only `94px (from idle)` line on the Talking panel.
   - Inner gap is editable per profile via a slider on the Talking panel; default 14 honors the donut-padding rule, raising it pushes talking inward, lowering it brings talking closer to / past the donut ring.

3. **Bar count is shared** across cells when `lockBarCount` is true (default):
   - `barCount = floor(2π × idle.radius / (idle.barWidth + idle.barGap))`.
   - Talking's smaller circumference compresses the same N bars angularly. The visible bar gap on talking becomes `(2π × talking.radius / barCount) - barWidth`, surfaced as a read-only `Bar Gap: 4.4px (calculated)` line on the Talking panel.
   - Toggle off via "Lock bars to idle" on the Talking Geometry panel — each cell then auto-computes from its own circumference.

The `barCount` override prop is opt-in on `RadialInward` / `RadialOutward` (added in `src/projects/radial-waveform/types.ts`); the playground at `/radial-waveform/playground` continues to auto-compute.

## Bottom-bar layout

Mirrors realtime-states: hamburger toggle | state pills (Idle / Listening, Thinking, Talking) | profile dropdown | Rename pencil | Save (Save As) | Update (when dirty) | Discard (when dirty, with `RotateCcw` icon + "Discard" label).

- **Save** auto-fills with a fresh name from a 50-name curated list (`CURATED_NAMES` in `index.tsx`); duplicates fall back to `<name> 2`, `<name> 3`.
- **Rename** in place: pencil button swaps the dropdown trigger into a yellow-bordered text input pre-filled with the active name. Enter commits, Esc cancels.
- **Discard** reverts settings + backdrop + lockBarCount + talkingInnerGap to last-saved baseline.

## Controls panel

5 columns: **Geometry**, **Audio**, **Wave**, **Envelope**, **Style** (Backdrop is a sub-section under Style).

- All numeric values are click-to-edit (clamped + stepped on commit).
- Each value gets a `↺` reset icon when it differs from baseline; one click reverts that single field.
- **Style row 1**: Intensity toggle + Bar swatch + BG swatch inline.
- **Backdrop sub-section**: header carries the Show toggle inline; Color swatch + Opacity slider on one row; Inner / Outer pill rows ("Circle / Segments") with conditional Segments + Depth sliders below each.
- **Backdrop component** (SVG): one path with `fillRule="evenodd"`; `buildBackdropContour` helper emits either two arcs (circle) or a 360-sample polyline `r(θ) = baseR + depth × cos(N × θ)` (segments). viewBox sized to `outerR + outerDepth` so peaks aren't clipped.
- **Talking-only Geometry rows**: read-only Radius `(from idle)`, "Inner gap" slider, `Bar Width` (still editable), read-only `Bar Gap (calculated)` when locked, "Lock bars to idle" toggle.

## Color picker (ColorPicker.tsx)

- React-aria `ColorArea` + `ColorSlider` (saturation/brightness + hue) on a portaled popover.
- Format selector at the **bottom** (HEX / RGB / HSL / HSB pills); active pill highlights.
- `ChannelFields` shows 1 input for HEX, 3 inputs (R G B / H S L / H S B) for the others. Helpers reused from `realtime-states/helpers` (`colorFieldValues`, `colorDraftsToHex`).
- Title at top of popover (the swatch's `title` prop) shows which slot is being edited.
- Dark theme: popover bg `#1a1a1e`, borders `rgba(255,255,255,0.1)`, hex input fill `rgba(255,255,255,0.05)` with `#e5e7eb` text.

## Saved profiles (7)

| Name | id | Notes |
|---|---|---|
| Default | `rs-default` | Seed |
| primodial | `rs-1778167974817-efflnb` | First user-saved profile |
| primog | `rs-1778170847274-3d5962` | |
| Solstice | `rs-1778171597313-72me5v` | |
| Primordial thicker | `rs-1778174941286-o90qez` | Currently active per `localStorage` |
| Tonic | `rs-1778183026912-542yw8` | |
| Mosaic | `rs-1778186458407-n378fb` | |

## Bugs hit + fixed (read commit messages for full context)

- **Cross-profile state leak** (`63a2394`). `handleSaveAs` and `snapshotOf` were copying object references; combined with Discard / profile-switch reverting from baseline by reference, two profiles re-shared idle/thinking/talking/backdrop and persist serialized the cross-bleed. Fixed by `structuredClone` at every boundary where a profile is copied — mirrors realtime-states `handleSave`'s pattern. Pre-fix data captured in `a67a1c2`; visibly leaked profiles re-edited in `06d9a5e`.
- **Hydration mismatch on localStorage values** (`6bfb8a0`). Lazy `useState` init read localStorage on the client but returned defaults on the server; React reported `Text content did not match`. Switched to post-mount load + `loaded` state-gate so persist doesn't clobber saved values during StrictMode double-mount (`e54f480`).
- **Stuck dev server masquerading as a build error**. Importing the realtime-states `ColorPickerButton` triggered `getStaticProps with getServerSideProps` 500. I downgraded the picker without checking — that was wrong. A clean `preview_stop` + `preview_start` would have fixed it. Memory saved at `~/.claude/projects/.../memory/feedback_silent_substitution.md`. Final picker is in `radial-states/ColorPicker.tsx`.

## Open follow-ups

### 1. **Animator** — the next big piece, not started

Goal: morph between states (idle/thinking ↔ talking) with continuous bar motion, exploiting the locked bar count. Per the design discussion:

For each of the N bars at angular position `θᵢ`, the morph from idle/thinking → talking lerps three things over a duration `T`:

1. **Anchor radius**: `idle.radius` → `talking.radius` (134 → 94 with current Default).
2. **Direction parameter**: `inwardRatio` from 1 (inward) → 0 (outward).
3. **Length envelope**: minBarLength, maxBarLength, wave envelope ceiling lerp from idle's values to talking's.

Implementation shape:
- New hook `useLinkedRadialAnimator` analogous to `useLinkedProfileAnimator.ts` (Tube). RAF loop, lerp toward target, `alpha = 1 - exp(-dt/τ)` decay.
- `RadialBidirectional` is the morph-state renderer (already supports `inwardRatio`). Add the same `barCount` override prop already added to `Inward` / `Outward` (the `RadialWaveformProps` field is shared).
- Keep `barWidth`, `barGap`, `segments` from idle (don't lerp — preserves bar identity).
- Audio reactivity decision: freeze during morph (simpler) vs. lerp `sensitivity` along with the rest. Likely freeze for the first pass.

Where it lives: NOT on the review page. The review page exists to *see* the three states. The animator belongs on the live voice page where state transitions actually happen — likely a `RadialRealtimeBlob` analogous to `NebularrBlob` / `CoralRealtimeBlob`, dispatched by a future `RealtimeBlob` shader case (e.g. `shader: 'radial'`). The radial-states profiles would need a way to be marked "active for the live page" similar to `pinned` / `skipIntroOnSelect` on the Tube schema.

### 2. Validate per-cell vs. linked: lock-off case

When `lockBarCount` is off, idle/thinking/talking each compute their own count. Hasn't been visually verified after recent rules change (talking radius is now derived even when lock is off). Quick check: toggle off in Talking panel, confirm talking shows ~38 bars and idle/thinking stay at 54.

### 3. Profile delete

Currently no UI for deleting a profile. To delete, hand-edit `radial-states-profiles.json`. Low priority; add when the list gets unwieldy.

### 4. Live page wiring

The live voice page (`/voiceinterface/realtime`) doesn't know about radial. Wiring it up is part of the animator work above (item 1).

### 5. Move profile editing into realtime-states (eventual)

User originally said the radial-states review page was a temporary editing surface. Once the schema and rules are stable, profile editing should move into the realtime-states editor (so the live page picks pinned profiles from one place). Defer until the morph behavior is settled.

## Picking up in a new conversation

Open with: "Read `tasks/radial-states-handoff.md` for context, then [next task]."

Most likely next task is the **animator**. Ask the user whether they want a plan doc first (recommended given the architectural reach — animator hook + new shader dispatch + live-page wiring) or to start prototyping in the review page as a one-off.

## Recent commit timeline (most recent first)

```
0dec6ac  data: user-edited profiles + new entries (Tonic, Mosaic, Primordial thicker)
75ccafe  feat: talking inner gap slider
d4a8180  ux: show calculated bar gap on talking when locked
8aaae15  ux: mute Bar Gap on talking when bar count is locked
e604395  feat: derive talking.radius from idle (donut inner + 14)
16873df  feat: toggle to lock/unlock talking's bar count to idle
06d9a5e  data: restore leaked primodial values
a582f6b  feat: share bar count across cells anchored on idle
a67a1c2  data: captured state after cross-profile leak (pre-fix snapshot)
63a2394  fix: structuredClone every profile copy to stop cross-profile state leak
b334437  feat: format-aware color picker with bottom format selector + radial-states title
c91e906  polish: dark theme for color picker popover to match navbar
27ac6c1  feat: full ColorPickerButton matching realtime-states
f229da1  feat: swatch + editable hex input for all color pickers
bd50f02  feat: rename profile, curated names, backdrop color/opacity, Discard icon
f23ee92  polish: UX pass on Backdrop section + bottom-bar Discard
bbc0abb  feat: backdrop on/off, inline edit, per-field reset; drop Reset state
cbf3169  feat: outer ring wavy variant + independent inner/outer config
6fc1ef0  feat: backdrop shape with parametric wavy inner edge
6244190  feat: donut envelope tracks live idle.maxBarLength
9c5a8fc  feat: proper disk-backed profile saving + reorganized bottom bar
b52b7ca  feat: bake wave envelope into max-bar ghost
e145a71  feat: max-bar ghost as individual bars instead of a ring
71183d6  feat: hover-preview ghost ring for Max Bar Length
6aa166f  feat: collapse/expand toggle for the controls panel
552b4aa  feat: per-state controls + localStorage persistence
e725ffb  feat: add static donut envelope behind bars
f74068e  feat: three-state review page (idle/listening, thinking, talking)
```
