# Realtime-states plan: linked-profile control centre, v2.1

Path: `src/pages/voiceinterface/realtime-states.tsx` (single file, no shared component changes)

This document is the contract. If the implementation deviates from anything in here, the deviation is a bug.

Revision history:
- v2 (initial)
- v2.1 — clarifications from reviewer feedback: audio gating, bottom-swatch write semantics, thickenSpeed semantics, inherited-row styling implementation, gallery parity precision, thinking color inheritance, shader-mount assumption for the snap-free guarantee, stale implementation step.

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

(The current code already declares an `OverrideScope` with all the required fields — it just needs renaming to `PeakOverrides` for clarity. No shape change.)

**Inheritance rule:** for a peak property left unset, the peak inherits from base. So if `thinking.color1` is unset, the blob's color1 stays at `base.color1` even at peak — it just gets thicker without changing color. Setting `thinking.color1` causes color1 to lerp `base → thinking.color1` along the same animation curve as the geometry.

**Linkage rule:** all four state pills (idle/listening/thinking/talking) read base values from the same source. Editing scale on any pill's "Rest" slider mutates `profile.base.scale` once and re-renders everywhere. Editing a "Peak" slider on thinking mutates `profile.thinking.<field>` only; same for talking.

**Initial profile:** Kyoto's saved gallery values fill `base`. `thinking` starts with only `thickRadius: 0.25` (the gallery-saved pulse target). `talking` starts empty `{}`. Colors at peak are inherited from base by default — no olive-only-during-thinking trick. (See §7, criterion 4.)

---

## 3. Animator (the load-bearing piece)

Single `requestAnimationFrame` loop. Maintains `current: RenderValues` (10 numeric/color fields). Each frame:

1. Compute `target` based on the active state:
   - **idle / listening** → `target = base`
   - **thinking** → oscillate a `phase` value 0↔1 between rest and thinking-peak. `target = lerp(base, thinkingPeak, smoothstep(phase))`
   - **talking** → `target = talkingPeak` with `thickRadius` forced to `1.0`
2. Exponentially ease `current → target` with tau derived from the relevant **effective state speed** (see Thicken Speed semantics below). Every numeric and color field uses the same alpha so they stay visually coherent.
3. Pass `current.*` to `<GentleOrbThicken>` as static-looking props with `goal=1` and `thickenSpeed=0.05` (so the shader's internal animator settles instantly and JS owns all motion).

### 3.1 Thicken Speed semantics (explicit)

`thickenSpeed` is overloaded — it's both an editable per-scope value AND the clock that drives the animation. Pin behavior precisely:

- `profile.base.thickenSpeed` is the **Rest speed**.
- `profile.thinking.thickenSpeed` is the **thinking peak speed**, inherited from base when unset.
- `profile.talking.thickenSpeed` is the **talking peak speed**, inherited from base when unset.
- **Thinking pulse clock**: full out-and-back cycle takes `effectiveThinking.thickenSpeed * 2` seconds. Driven by the *effective* thinking-peak value, **not** the currently-lerping `current.thickenSpeed`. The clock must not jitter while the lerped value is in motion.
- **Talking target easing tau**: `effectiveTalking.thickenSpeed * 0.5` — uses the effective talking-peak value.
- **Idle/listening target easing tau**: `profile.base.thickenSpeed * 0.5`.
- The lerped `current.thickenSpeed` is still passed to the shader as a prop for consistency, but it does not drive the JS animator. JS uses the *target's* effective speed for its tau.

### 3.2 Snap-free assumption (explicit)

The snap-free guarantee depends on the shader staying mounted across state changes. Rules:

- `<GentleOrbThicken>` must remain mounted while switching states.
- State changes only update its props.
- Do **not** key the `<Canvas>` or the blob component by `state`.
- `goal=1` and `thickenSpeed=0.05` are used to keep the shader's internal `uThicken` effectively settled within ~50ms of mount. After that point, JS owns all visible motion.
- The snap-free guarantee applies **after initial mount**. The very first frame post-mount may show `uThicken=0` briefly (since the shader's animator starts at 0). For practical purposes the orb starts at idle/thin anyway, so this is a non-issue. If first-frame correctness ever became required, the shader would need a separate change to initialize `uThicken=1` — out of scope for this pass.

### 3.3 Pulse reset on state exit

When leaving `thinking`, the phase ref resets to 0 / forward direction so re-entering thinking starts the pulse cleanly from the rest side, not mid-cycle.

---

## 4. UI

### 4.1 Layout

The floating top state-pill row is **removed**. There is one bottom bar, period:

```
[≡] [idle] [listening] [thinking] [talking]   |   [Size] [Thickness] [Motion] [Colours]   [●●●]   [⟲]
```

- `≡` — hamburger; toggles 4-column expanded drawer
- `idle / listening / thinking / talking` — state pills. **Each pill is BOTH the preview state AND the edit scope** (no two-pill-set ambiguity)
- `Size / Thickness / Motion / Colours` — tab buttons; clicking pops up the popover above the bar with that tab's controls scoped to the active pill
- `●●●` — three color swatches (write semantics defined in §4.6)
- `⟲` — auto-loop (cycle through states every 2.5s)

### 4.2 Pill behavior

| Pill         | Blob preview                                | What sliders edit                                                              |
| ------------ | ------------------------------------------- | ------------------------------------------------------------------------------ |
| `idle`       | Open torus at base.thinRadius, no audio    | `base` only — all values are "Rest"                                            |
| `listening`  | Open torus at base.thinRadius + audio waves | `base` (same data as idle — touching either pill's slider updates the other)   |
| `thinking`   | Pulses thin↔thick                           | `base` ("Rest" rows) AND `thinking` overrides ("Peak" rows) — both visible     |
| `talking`    | Morphs to sphere                            | `base` ("Rest" rows) AND `talking` overrides ("Peak" rows) — both visible      |

### 4.3 Audio gating (explicit)

The blob receives audio data only on states where ripples make visual sense. Rule:

```ts
const blobAudioData = audioActive && state !== 'idle' ? audioData : SILENT;
```

- `idle` always passes `SILENT` to the blob — its surface stays still even if audio is playing.
- `listening`, `thinking`, `talking` pass live `audioData` while `audioActive`, otherwise `SILENT`.

This makes the visual difference between idle and listening unambiguous: idle is geometrically still at all times; listening ripples when audio is on.

### 4.4 Auto-pop-to-talking + auto-loop interaction

- When `audioActive` transitions `false → true` AND `autoLoop === true`, **cancel auto-loop first**, then jump to `talking`. (Without this, auto-loop's interval would yank the state away from talking on the next tick.)
- Manual pill clicks always cancel auto-loop (already in current code).

### 4.5 Controls per tab × per pill

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
| talking         | Thin Radius (Rest), `[italic note: "Geometry pinned to sphere — no peak slider"]`, Thicken Speed (Rest), Thicken Speed (Peak) |

The italic note keeps row symmetry with thinking and explains why there's no slider in that slot. Per user's earlier complaint about "vanished values," we never silently omit a row.

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

### 4.6 Bottom swatch write semantics (explicit)

The three always-visible color swatches at the right of the bottom bar resolve as follows:

- **idle / listening pills** → swatches edit `profile.base.color1/2/3` (Rest colors).
- **thinking pill** → swatches edit `profile.thinking.color1/2/3` (Peak colors).
- **talking pill** → swatches edit `profile.talking.color1/2/3` (Peak colors).

Rest colors for thinking/talking remain editable — they live inside the Colours popover via the `Highlight (Rest)` / `Mid Tone (Rest)` / `Edge (Rest)` rows. The bottom swatches are a quick-edit surface for whatever's most contextually relevant on the active pill.

**Inherited Peak swatches:** when a Peak color is inherited (`profile.thinking.color1 === undefined`, etc.), the swatch displays the inherited *effective* value (i.e., `base.color1`). Touching the swatch creates the Peak override at the picked color.

### 4.7 Slider terminology

Per user's confirmation: use `Field (Rest)` and `Field (Peak)` consistently across all pills. Idle and listening only show Rest rows; thinking and talking show both. Symmetric, no naming surprises.

### 4.8 Inherited Peak row visual treatment + implementation

Shared `SliderRow` and `ColorRow` have hardcoded label classes. They will **not** be modified.

Implementation: create local wrapper rows in `realtime-states.tsx`:

- `PeakSliderRow` — wraps `SliderRow`, takes an `inherited: boolean` flag plus a `(field, scope)` pair. Renders the shared `SliderRow` underneath a small label header that styles itself based on inherited state. Fields the wrapper can render around the shared control: a label-row above (with inherited dimming), an optional "↺ inherit" reset button, etc. Or, if cleaner, the wrapper can re-implement a minimal slider row inline (it's small and self-contained).
- `PeakColorRow` — same pattern wrapping `ColorRow`.

Rest rows can render shared `SliderRow` / `ColorRow` directly with no wrapper.

Inherited-vs-overridden indication:
- Inherited Peak row: label text uses a muted/lighter color (e.g. `text-gray-400`), value still reflects effective base.
- Overridden Peak row: normal label color (e.g. `text-gray-700`), value reflects the override.
- Optional `↺` reset button on overridden Peak rows that calls `clearPeak(scope, field)`. Only add if it fits without crowding.

### 4.9 Mobile

Mobile parity is not required this pass:
- Desktop / tablet (>= ~768px wide): match the gallery's bottom-bar pattern as defined in §4.10.
- Mobile (< ~768px): controls in the bottom bar may wrap to multiple lines via `flex-wrap`. No side drawer is added in this pass.

### 4.10 GalleryNavBar parity (precise subset)

**Required parity** (for visual + structural consistency with the gallery):

- Fixed bottom bar.
- Same hamburger button styling (`p-1.5 rounded-lg bg-gray-100 …`).
- Same pill button styling for the state pills (rounded-full, dark on active, light on inactive).
- Same tab button styling.
- Same single-tab popover position (slides up directly above the bar).
- Same expanded drawer concept (full 4-column drawer behind the bar).
- Same round color swatch treatment.
- Same Repeat icon treatment for auto-loop.

**NOT required this pass** (gallery has them; this preview doesn't need them):

- Profile dropdown (gallery's "Default ▾").
- Save / Update / Bookmark controls.
- Hue / Saturation / Lightness controls.
- Variant tabs (Tube / Coral / Coral D / Coral Morph).
- Goal toggle ("Thick" / "Thin" button).

---

## 5. Auto-loop & misc

- Auto-loop button placed at the right end of the bottom bar (after color swatches). Same visual treatment as gallery's Repeat icon.
- Pressing any state pill cancels auto-loop.
- Audio start cancels auto-loop, then jumps to talking (per §4.4).
- Audio controls (`GalleryAudioControls`) stay top-right, untouched.
- Background of the page is `profile.base.bgColor`.

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
| Bottom-swatch write target on thinking/talking            | Swatches edit Peak. Rest editable from the popover. (§4.6)                                         |
| Audio rippling idle                                       | Idle always passes SILENT regardless of audio state. (§4.3)                                        |
| Auto-loop + audio start interaction                       | Audio start cancels auto-loop, then jumps to talking. (§4.4)                                        |
| Pulse clock source — current or peak `thickenSpeed`        | Effective peak `thickenSpeed`. Render `current.thickenSpeed` may lerp but does not drive the clock. (§3.1) |
| First-frame `uThicken` correctness                        | Out of scope. Snap-free guarantee applies after initial mount only. (§3.2)                          |

---

## 7. Acceptance criteria (how I'll verify before saying done)

1. **Visual parity with gallery's bottom bar (per §4.10).** Same hamburger, same pill style, same tab buttons, same popover position, same color swatches, same Repeat icon.
2. **No floating state pills above the canvas.** Only one control bar exists.
3. **Click `idle` then `listening`**: blob shows torus in both; toggle audio on, listening's torus ripples, idle's stays still (per §4.3 audio gating).
4. **Click `thinking`**: blob pulses thin↔thick. If thinking Peak colors are unset, colors stay inherited from Rest (the orb gets thicker but does not shift hue at peak). If colors are set, peak colors lerp in along the morph curve.
5. **Click `talking`**: blob morphs to a sphere; Thickness tab shows the italic "Geometry pinned" note in place of the Peak Radius slider.
6. **Edit base scale on `idle` pill** → switching to `listening` / `thinking` / `talking` shows the new scale across all (linkage proof).
7. **Edit thinking peak scale** → only thinking peak deviates; idle/listening/talking unaffected.
8. **Edit talking peak color** → only talking peak deviates; the morph's color lerps `base → talking.color*` along the geometry curve.
9. **Snap test:** while in thinking and the pulse is mid-thick, click `talking`. The blob morphs *directly* to a sphere. No frame where it visibly returns to thin first. No frame where it briefly fully closes before settling.
10. **Audio start while idle**: state auto-jumps to talking once. If auto-loop was on, auto-loop is cancelled at the same moment. Click `thinking` while audio still plays: state stays on thinking, audio just keeps the surface rippling.
11. **Bottom swatch write semantics**: with `idle` active, clicking a swatch and picking a color updates `profile.base.color*` (visible across all pills). With `thinking` active, clicking a swatch updates `profile.thinking.color*` (visible only at thinking peak; other pills unaffected). Same for `talking`.
12. **Inherited row visual cue**: on the thinking pill with no Peak overrides set, Peak slider/color labels appear muted (lighter text). After touching a Peak slider, the label switches to normal weight, indicating it's now an override.

---

## 8. Implementation steps

1. **Type rename + cleanup.** Rename `OverrideScope` → `PeakOverrides` for clarity. No shape change (it already covers all required fields). Update the `LinkedProfile` type to use the new name.
2. **Remove `activeScope` state.** Use the single `state: PreviewState` value to drive both preview AND edit scope. Drop the bottom-bar's separate scope-pill row.
3. **Add helper functions** in the page:
   - `getRestValue<K extends keyof BaseSettings>(field: K): BaseSettings[K]` — reads `profile.base[field]`.
   - `getPeakValue<K extends keyof PeakOverrides>(scope: 'thinking' | 'talking', field: K): PeakOverrides[K]` — reads override directly (may be `undefined` for inherited).
   - `getPeakEffective<K extends keyof PeakOverrides & keyof BaseSettings>(scope, field)` — peak override if set, otherwise base.
   - `setRest<K>(field, value)` — writes `profile.base[field]`.
   - `setPeak(scope, field, value)` — writes `profile[scope][field]`.
   - `clearPeak(scope, field)` — deletes the override key.
4. **Replace `renderTabControls` to take active state** (not active scope) and render Rest rows for idle/listening, Rest+Peak rows for thinking/talking. Use `PeakSliderRow`/`PeakColorRow` wrappers (defined in §4.8) for Peak rows.
5. **Audio gating in render**: compute `blobAudioData` once per render per §4.3 and pass to `<GentleOrbThicken>`.
6. **Auto-loop + audio interaction**: in the `audioActive` useEffect, set `autoLoop=false` before `setState('talking')`.
7. **Animator changes**: confirm pulse clock uses `effectiveThinking.thickenSpeed` (not `current.thickenSpeed`). Update tau computation per §3.1.
8. **Bottom swatch handler**: on click, route to `setRest` (idle/listening) or `setPeak(state, color*, value)` (thinking/talking). Display the inherited effective value if Peak is unset.
9. **Move auto-loop button into bottom bar.** Remove the separate floating Repeat button above the canvas.
10. **Verify against acceptance criteria 1–12** in §7 before committing. Browser-test each one.

---

## 9. What I'm explicitly NOT doing in this pass

- No hybrid 8-wave/24-wave shader for talking (deferred per user — separate task).
- No profile save/load/CRUD UI (this preview is a single in-memory profile).
- No bgColor per-state.
- No changes to `GentleOrbThicken.tsx` or any other shared component.
- No mobile side drawer.
- No first-frame `uThicken=1` shader change.
- No changes to production `/voiceinterface/realtime` page.
