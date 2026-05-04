# Realtime-states plan: linked-profile control centre, v2

Path: `src/pages/voiceinterface/realtime-states.tsx` (single file, no shared component changes)

This document is the contract. If the implementation deviates from anything in here, the deviation is a bug.

---

## 1. What the user wants (in their words, distilled)

The four states on the realtime page (idle / listening / thinking / talking) are **not** four independent profiles. They share a common foundation, and only diverge where it matters.

**Shared foundation ("Rest"):**
- `idle` — just sits in this form
- `listening` — same form, but audio causes the surface to ripple
- `thinking` — pulses *out from* this form toward a thicker target, then back
- `talking` — *starts at* this form, then morphs to a sphere

So idle, listening, the rest-phase of thinking, and the start-frame of talking all draw from one shared dataset. Editing any field on any of these reads/writes the same underlying value. Change scale once, it changes for all four.

**Per-state divergence ("Peak"):**
- `thinking` has its own peak overrides — when the pulse reaches the thick top of the cycle, properties can deviate from base (different scale, different colors, etc.). At the bottom of the pulse, it returns to base.
- `talking` has its own peak overrides — when fully morphed, properties can deviate from base. The geometry is hard-pinned to a sphere (the visual signature of talking), so radius cannot be overridden, but everything else can.

**Listening and idle are bidirectionally linked.** Listening has no peak overrides — it *is* idle, just with audio playing on top. Editing listening = editing idle = editing the shared base.

**Snap-free morph between any two states.** Switching thinking-mid-pulse → talking must morph **directly** from where the blob currently is (mid-thick torus) to the talking peak (sphere). No flash through "thinnest" first. No flash through "fully thick" first. Just a direct lerp.

---

## 2. Data model

```ts
interface BaseSettings {
  scale: number;
  thinRadius: number;
  thickenSpeed: number;
  waveIntensity: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
  bgColor: string;
}

interface PeakOverrides {
  scale?: number;
  thickRadius?: number;     // thinking only — pulse target tube radius
  thickenSpeed?: number;
  waveIntensity?: number;
  breathAmp?: number;
  idleAmp?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  // bgColor: never overrideable — kept base-only
}

interface LinkedProfile {
  base: BaseSettings;       // shared by idle, listening, thinking-rest, talking-rest
  thinking: PeakOverrides;  // applies only at top of thinking pulse
  talking: PeakOverrides;   // applies only at peak of talking morph (geometry pinned to sphere)
}
```

**Inheritance rule:** for a peak property left unset, the peak inherits from base. So if `thinking.color1` is unset, the blob's color1 stays at `base.color1` even at peak — it just gets thicker without changing color. Setting `thinking.color1` causes color1 to lerp `base → thinking.color1` along the same animation curve as the geometry.

**Linkage rule:** all four state pills (idle/listening/thinking/talking) read base values from the same source. Editing scale on any pill's "Rest" slider mutates `profile.base.scale` once and re-renders everywhere. Editing a "Peak" slider on thinking mutates `profile.thinking.<field>` only; same for talking.

---

## 3. Animator (the load-bearing piece)

Single `requestAnimationFrame` loop. Maintains `current: RenderValues` (10 numeric/color fields). Each frame:

1. Compute `target` based on the active state:
   - **idle / listening** → `target = base`
   - **thinking** → oscillate a `phase` value 0↔1 with period `effective(thinking).thickenSpeed * 2` seconds. `target = lerp(base, thinkingPeak, smoothstep(phase))`
   - **talking** → `target = talkingPeak` with `thickRadius` forced to `1.0`
2. Exponentially ease `current → target` with tau `= target.thickenSpeed * 0.5`. Every numeric and color field uses the same alpha so they stay visually coherent.
3. Pass `current.*` to `<GentleOrbThicken>` as static-looking props with `goal=1` and `thickenSpeed=0.05` (so the shader's internal animator settles instantly and JS owns all motion).

**Why this avoids the snap:**
- Shader's internal goal-based geometry-blend is short-circuited (`goal=1` always, `uThicken` stays at 1 within milliseconds of mount).
- The only visible variable is `thickRadius`, which is a JS-driven `current` value that *only ever lerps*. It never instantaneously changes between frames.
- Switching state only changes the `target`. `current` continues from wherever it was. Mid-pulse thinking → talking takes `current.thickRadius` from (say) `0.22` directly to `1.0` over ~0.5s. No detour.

**Pulse reset on state exit:** when leaving `thinking`, the phase ref resets to 0/forward so re-entering thinking starts the pulse cleanly from the rest side.

---

## 4. UI (mirrors `GalleryNavBar` structure exactly)

### 4.1 Layout

The floating top state-pill row is **removed**. There is one bottom bar, period:

```
[≡] [idle] [listening] [thinking] [talking]   |   [Size] [Thickness] [Motion] [Colours]   [●●●]   [⟲]
```

- `≡` — hamburger; toggles 4-column expanded drawer (gallery pattern)
- `idle / listening / thinking / talking` — state pills. **Each pill is BOTH the preview state AND the edit scope** (the user's core request — no two-pill-set ambiguity)
- `Size / Thickness / Motion / Colours` — tab buttons; clicking pops up the popover above the bar with that tab's controls scoped to the active pill
- `●●●` — three color swatches showing the active pill's effective color1/2/3 (same as gallery)
- `⟲` — auto-loop (cycle through states every 2.5s)

### 4.2 Pill behavior

| Pill         | Blob preview                                | What sliders edit                                                              |
| ------------ | ------------------------------------------- | ------------------------------------------------------------------------------ |
| `idle`       | Open torus at base.thinRadius, no audio    | `base` only — all values are "Rest"                                            |
| `listening`  | Open torus at base.thinRadius + audio waves | `base` (same data as idle — touching either pill's slider updates the other)   |
| `thinking`   | Pulses thin↔thick                           | `base` ("Rest" rows) AND `thinking` overrides ("Peak" rows) — both visible     |
| `talking`    | Morphs to sphere                            | `base` ("Rest" rows) AND `talking` overrides ("Peak" rows) — both visible      |

**Audio override rule (already in place, kept as-is):** when audio first starts playing, state auto-jumps to `talking` *once* as visual confirmation. Subsequent manual pill clicks always win — clicking `listening` while audio plays moves the preview to listening and stays there.

### 4.3 Controls per tab × per pill

Where I write `(Rest)` the slider edits `profile.base.<field>` (shared with all pills).
Where I write `(Peak)` the slider edits `profile.<thinking|talking>.<field>` (only this state's peak).

**Size tab:**

| Pill            | Rows                                   |
| --------------- | -------------------------------------- |
| idle / listening | Scale (Rest)                          |
| thinking        | Scale (Rest), Scale (Peak)             |
| talking         | Scale (Rest), Scale (Peak)             |

**Thickness tab:**

| Pill            | Rows                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------- |
| idle / listening | Thin Radius (Rest), Thicken Speed (Rest)                                                |
| thinking        | Thin Radius (Rest), Thick Radius (Peak), Thicken Speed (Rest), Thicken Speed (Peak)       |
| talking         | Thin Radius (Rest), `[italic: "Geometry pinned to sphere — no peak slider"]`, Thicken Speed (Rest), Thicken Speed (Peak) |

The italic note keeps row symmetry with thinking and explains why there's no slider in that slot. Per user's earlier complaint about "vanished values", we never silently omit a row.

**Motion tab:**

| Pill            | Rows                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| idle / listening | Wave Intensity (Rest), Idle Intensity (Rest), Breath Amplitude (Rest)                                            |
| thinking        | Wave Intensity (Rest+Peak), Idle Intensity (Rest+Peak), Breath Amplitude (Rest+Peak)                             |
| talking         | Wave Intensity (Rest+Peak), Idle Intensity (Rest+Peak), Breath Amplitude (Rest+Peak)                             |

(Rest+Peak = two slider rows stacked: one for the shared base value, one for the state's peak override.)

**Colours tab:**

| Pill            | Rows                                                                          |
| --------------- | ----------------------------------------------------------------------------- |
| idle / listening | Highlight (Rest), Mid Tone (Rest), Edge (Rest), Background (Rest)            |
| thinking        | Highlight (Rest+Peak), Mid Tone (Rest+Peak), Edge (Rest+Peak), Background (Rest only — never peak-overrideable) |
| talking         | Highlight (Rest+Peak), Mid Tone (Rest+Peak), Edge (Rest+Peak), Background (Rest only)                            |

Background is base-only by user's earlier explicit decision: "leave background colour the same."

### 4.4 Slider terminology

Per user's confirmation: use `Field (Rest)` and `Field (Peak)` consistently across all pills. Idle and listening only show Rest rows; thinking and talking show both. Symmetric, no naming surprises.

### 4.5 Peak slider with no override set yet

When a peak slider has no override, it displays the inherited base value (so the user sees what it currently looks like). Touching the slider sets the override. Visual treatment for inherited-vs-overridden:

- Inherited (`thinking[field] === undefined`): slider value shown but label text uses `text-gray-400` to hint "this is the inherited value, not yet overridden"
- Overridden (`thinking[field] !== undefined`): slider label uses `text-gray-700` (normal)

(Optional extra: a tiny "↺ inherit" button next to overridden rows that resets to inherited. Only add if it doesn't bloat the layout.)

---

## 5. Auto-loop & misc

- Auto-loop button placed at the right end of the bottom bar (after color swatches). Same visual treatment as gallery's Repeat icon.
- Pressing any state pill cancels auto-loop.
- Audio controls (`GalleryAudioControls`) stay top-right, untouched.
- Background of the page is `profile.base.bgColor` (already wired this way).

---

## 6. Open decisions, all resolved

| Decision                                                  | Resolution                                                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| A vs B for idle/listening linkage                         | A — they share. (Plus thinking-rest and talking-start also share that base.)                        |
| Slider terminology — `Scale` or `Scale (Rest)`             | `Scale (Rest)` everywhere, for consistency across pills                                             |
| Talking thickness slider — italic note vs omit row        | Italic note. Row stays for symmetry; never silently hide rows                                       |
| Listening pill clicked while audio plays                  | Manual click wins — state moves to listening, stays there until next state click or auto-loop      |
| Background color overrideable per state                   | No. Base-only.                                                                                     |
| Snap glitch from thinking-mid-pulse → talking             | JS animator owns motion; `current` lerps directly from wherever it is to talking peak — no detour   |

---

## 7. Acceptance criteria (how I'll verify before saying done)

1. **Visual parity with gallery's bottom bar.** Same hamburger, same pill style, same tab buttons, same color swatches, same `SliderRow`/`ColorRow` rendering.
2. **No floating state pills above the canvas.** Only one control bar exists.
3. **Click `idle` then `listening`**: blob shows torus in both; toggle audio on, listening's torus ripples, idle's doesn't.
4. **Click `thinking`**: blob pulses thin↔thick in olive green; on the bottom bar, Thickness tab shows both `Thin Radius (Rest)` and `Thick Radius (Peak)` sliders.
5. **Click `talking`**: blob morphs to a sphere; Thickness tab shows the italic "Geometry pinned" note in place of the Peak slider.
6. **Edit base scale on `idle` pill** → switching to `listening`/`thinking`/`talking` shows the new scale across all (linkage proof).
7. **Edit thinking peak scale** → only thinking peak deviates; idle/listening/talking unaffected.
8. **Edit talking peak color** → only talking peak deviates; the morph's color lerps `base → talking.color*` along the geometry curve.
9. **Snap test:** while in thinking and the pulse is mid-thick, click `talking`. The blob morphs *directly* to a sphere. No frame where it visibly returns to thin first. No frame where it briefly fully closes before settling.
10. **Audio start while idle**: state auto-jumps to talking once. Click `thinking` while audio still plays: state stays on thinking, audio just keeps the surface rippling.

---

## 8. Implementation steps

1. **Update `LinkedProfile` shape** to use `PeakOverrides` covering all overrideable fields (currently `OverrideScope` is a subset — extend it to include scale/color/etc explicitly via the same shape).
2. **Replace state-pill-row + scope-pill-row with one pill row.** State = scope. Drive both from a single `state: PreviewState` value.
3. **Rewrite `renderTabControls`** to:
   - Take the *active state* (not active scope) as input.
   - For idle/listening: render Rest rows only.
   - For thinking/talking: render Rest rows AND Peak rows (peak rows write to the appropriate override scope).
   - For talking Thickness: italic note in place of Peak Radius.
4. **Add `setPeak(scope, key, value)`** mutator that writes to `profile.thinking` or `profile.talking`.
5. **Animator already handles colors via `lerpHex`**, just confirm scale/wave/breath/idleAmp lerps through too. They do (it's `lerpRender` which covers everything).
6. **Remove the floating top state-pill row from JSX.** Move auto-loop button into the bottom bar.
7. **Re-test against acceptance criteria 1–10 in section 7 in browser** before committing.

---

## 9. What I'm explicitly NOT doing in this pass

- No hybrid 8-wave/24-wave shader for talking (deferred per user — separate task).
- No profile save/load/CRUD UI (this preview is a single in-memory profile).
- No bgColor per-state.
- No changes to `GentleOrbThicken.tsx` or any shared component.
- No changes to production `/voiceinterface/realtime` page.
