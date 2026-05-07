# Radial-states animator — plan (v1)

> Sibling to `tasks/radial-states-handoff.md`. The handoff describes the static review page that shipped; this plan covers the animator that morphs between states. Scope: a `useLinkedRadialAnimator` hook, a schema refactor that promotes bar-identity properties to shared, a ghost-bar correction, and a tune-mode toggle on the review page that lets the morph be edited live. The live voice page is **explicitly out of scope** for v1.

---

## 1. Problem & goal

**Problem.** The static three-cell review page renders idle/listening, thinking, and talking as independent snapshots. There is no way to see, edit, or tune the *transitions* between them. The locked-bar-count rule (handoff §"Geometry rules") was put in specifically to enable a continuous morph (no bars appearing or disappearing), but no morph code exists yet.

**Goal.** Add a JS-driven animator that can be observed and tuned on the review page, with two transitions defined:

1. `idle/listening → thinking` — a damp in place. Audio sensitivity → 0; bar length lerps to `minBarLength`. No translation.
2. `thinking → talking` — a two-phase morph:
   - Phase A (translation): rigid bars of length `minBarLength` slide inward as a ring. No audio.
   - Phase B (reactive-style transition): length unfreezes toward talking's audio-reactive envelope; sensitivity ramps to talking's value. The phase boundary is independently timeable via a per-profile knob.

**Success looks like.** With the tune-mode toggle on, clicking the state pills morphs a single radial cell smoothly between idle, thinking, and talking. The user can edit any control (length, sensitivity, wave params, morph durations, `reactiveStartAt`) and immediately see the morph respond. Bar identity (count, width, gap, roundness) is preserved across the morph. No bars appear or disappear; rotation continues.

---

## 2. Diagnosis — why a hook, why now

The animation is JS-owned, not shader-owned. `RadialBidirectional` already exposes the right surface (`inwardRatio`, `radius`, length envelope) — what's missing is a driver that lerps those numbers between named states and feeds the result into one renderer instance per frame.

The realtime-states (Tube) animator (`useLinkedProfileAnimator.ts:154`) is the structural prior. It owns: per-state target snapshots, an exponential decay toward the active state's target (`alpha = 1 - exp(-dt/τ)`), and per-state τ overrides (`entrySpeed`, `settleSpeed`). Same shape works here. The radial version has a different render type (`RadialRenderValues` instead of `RenderValues`) and a different state model (no thinking pulse for v1), but the lerp/decay engine is identical.

Why a hook, not inline state in the cell: testability, reuse on the live page later, and parallelism with the Tube editor. The hook is the contract; the renderer is the consumer.

---

## 3. Schema refactor — shared vs per-state

The current `RadialLinkedProfile` (`api.ts:42`) treats idle, thinking, and talking each as a full `RadialSettings` object. That stores three copies of bar-identity properties (width, gap, roundness, color, segments) which must be identical for a continuous morph to make sense — if they drift, bar identity breaks during the morph.

**The refactor.** Promote bar-identity properties from per-state to a shared `bars` block. Per-state objects only carry properties that are *meant* to differ between states (length envelope, audio reactivity, wave/envelope behavior).

### New shape

```ts
interface RadialBars {
  // Bar identity — invariant across all states. Editing here updates the entire morph.
  barWidth: number;
  barGap: number;
  roundCaps: boolean;
  barColor: string;
  segments: number;
  rotationSpeed: number;        // continues through morph
  minBarLength: number;         // == thinking length; also bars' floor at idle/talking
  updateRate: number;           // render throttle (ms); shared because it's a perf knob
}

interface RadialDisplay {
  // Display chrome — invariant across all states; not part of bar identity but cell-shared.
  bgColor: string;
  previewBg: string;
  containerBg: string;
  containerBgOpacity: number;
  containerRadius: number;
  containerPadding: number;
  showOutline: boolean;
  outlineColor: string;
  outlineWidth: number;
}

interface RadialStateSettings {
  // Per-state behavior.
  maxBarLength: number;          // talking can be smaller; thinking ignores (frozen)
  sensitivity: number;           // 0 for thinking
  ambientWave: boolean;
  waveSpeed: number;
  waveAmplitude: number;
  waveHeight: number;
  waveMode: 'additive' | 'reactive';
  waveShape: 'sine' | 'triangle' | 'square' | 'segments';
  waveLobes: number;
  smoothing: number;
  waveEnvelope: number;
  envelopeAmplitude: number;
  envelopeSensitivity: number;
  intensityOpacity: boolean;
}

interface RadialLinkedProfile {
  schemaVersion: 2;              // explicit version flag; legacy profiles lack this
  id: string;
  name: string;
  bars: RadialBars;              // shared across states (identity + perf)
  display: RadialDisplay;        // shared across states (display chrome)
  idle: RadialStateSettings;
  listening: RadialStateSettings; // NEW — was implicit before
  thinking: RadialStateSettings;
  talking: RadialStateSettings;
  geometry: {
    idleRadius: number;          // canonical anchor; talking radius derived
    talkingInnerGap: number;     // unchanged from current
  };
  idleListeningLinked: boolean;  // when true, edits to idle.* mirror to listening.*
  lockBarCount: boolean;         // default true; locks bar count to idle's circumference (Reviewer R2 P1.3)
  backdrop?: RadialBackdrop;     // unchanged
  morph: {
    idleToThinking: number;      // seconds, default 0.4 — also covers thinking→idle
    thinkingToTalking: number;   // seconds, default 0.6 — also covers talking→idle
    reactiveStartAt: number;     // 0..1, default 0.75 — when Phase B begins relative to Phase A
  };
  lastModified: number;
}
```

### Why listening becomes explicit

Per chat: idle and listening are visually identical *today*, but kept as distinct states so a future listening-specific intro can land without another schema bump. Editing rule: when the user edits any per-state value on idle, listening's value updates in lockstep until the user manually breaks the link (deferred — for v1 listening simply mirrors idle's `RadialStateSettings`, materialized via a `idleListeningLinked: true` flag, default true).

### What's no longer per-state (and why)

| Property | Why moved | Risk if left per-state |
|---|---|---|
| `barWidth` | Bar identity | Bars visibly change thickness mid-morph |
| `barGap` | Bar identity | Bar count derivation drifts; lockBarCount becomes inconsistent |
| `roundCaps` | Bar identity | Caps morph awkwardly |
| `barColor` | Bar identity | Bars visibly change color mid-morph (resolved as shared per §13). |
| `segments` | Symmetry parameter, not state-specific | Bars re-assigned to different frequency buckets mid-morph |
| `rotationSpeed` | Should rotate continuously through morph | Snaps to a different speed at state change |
| `minBarLength` | Defines the morph length | Phase A's translation length is ambiguous |

### What stays per-state (and why)

- `maxBarLength` — talking's max can legitimately be smaller (audio dynamic range tradeoff).
- All wave/envelope params — the whole point of having states is for these to differ.
- `sensitivity` — talking is reactive; idle/listening have their own; thinking forces 0.
- `intensityOpacity`, `smoothing` — render-time stylistic choices that may differ per state.

(`updateRate` was per-state in the old schema but is now shared in `bars` — it's a perf throttle, not a state behavior. `bgColor` and other display chrome are now shared in `display`.)

### Migration

The 7 existing profiles in `radial-states-profiles.json` need a one-time migration. **Detection is explicit** via `schemaVersion`: legacy profiles lack the field and are normalized at fetch time.

For each legacy profile, `migrateLegacyProfile(p: any): RadialLinkedProfile`:

1. Read the old idle, thinking, talking objects.
2. Promote bar-identity values into the new `bars` block:
   - `bars.barWidth`, `bars.barGap`, `bars.roundCaps`, `bars.barColor`, `bars.segments`, `bars.rotationSpeed`, `bars.updateRate` — take from `idle.*` (idle is canonical for these).
   - **`bars.minBarLength` = `thinking.minBarLength`** (NOT idle's). Thinking's value is what defines the morph length; idle's typical value (3) would collapse the thinking sticks. Reviewer P1.2.
3. Promote display chrome into the new `display` block: `bgColor`, `previewBg`, container fields, outline fields — take from `idle.*` (canonical for these too).
4. Synthesize `listening` by deep-cloning idle's per-state values (post-strip). Set `idleListeningLinked = true`.
5. Lift `idleRadius` from `idle.radius` into `geometry.idleRadius`. Carry `talkingInnerGap` over.
6. Drop the deprecated keys from per-state objects (barWidth, barGap, roundCaps, barColor, segments, rotationSpeed, minBarLength, radius, updateRate, bgColor, previewBg, container*, outline*, inwardRatio).
7. Add `morph` defaults: `idleToThinking: 0.4`, `thinkingToTalking: 0.6`, `reactiveStartAt: 0.75`.
8. Carry `lockBarCount` from legacy profile (which has it as a top-level field already in current code); default to `true` if absent.
9. Set `schemaVersion: 2`. Bump `lastModified`.

**Trigger.** Migration runs in-memory inside `fetchRadialLinkedProfiles` whenever a profile is read with `schemaVersion !== 2`. **The first user-initiated `Update` or `Save As` writes the entire array back as v2** — because `persistRadialLinkedProfiles` POSTs the whole array (`api.ts:74`), there's no per-profile write. Acceptance criterion 16 must reflect this: it's all-at-once on first save, not per-profile (Reviewer P1.5).

**Visual migration is real and reviewable.** Promoting bar-identity to shared values means existing profiles with diverged per-state values (`barWidth` differing across idle/thinking/talking, `minBarLength` differing, etc.) will look different after migration. This is unavoidable — see Reviewer P1.3. The static-mode acceptance criterion is changed accordingly.

**Dev-mode migration report.** During migration in dev only, log a structured report per profile:

```
[radial-states migration] profile <id> "<name>"
  bars.minBarLength: chose thinking=12 (idle was 3, talking was 3) — DIVERGED
  bars.barWidth: 2 (all states agreed)
  bars.barGap: 4 (all states agreed)
  bars.barColor: chose idle=#FFFFFF (thinking was #FFFFFF, talking was #FFFFFF) — agreed
  display.bgColor: idle=#0F0F11 (canonical)
  ...dropped fields: ...
```

Format: profile id + name; for each promoted key, the chosen value, the source state, and the values from non-source states; flag DIVERGED when non-source states held different values; flag AGREED when all matched. Logged once per migrated profile at fetch time. Console-only; not persisted.

---

## 4. State & transition model

### States

| State | Anchor | Direction | Length | Audio sensitivity | Rotation |
|---|---|---|---|---|---|
| `idle` | `geometry.idleRadius` | inward (`inwardRatio=1`) | reactive `[minBarLength, idle.maxBarLength]` | `idle.sensitivity` | continues |
| `listening` | same | same | same as idle (or per-state once differentiated) | `listening.sensitivity` (defaults match idle) | continues |
| `thinking` | same | inward (`inwardRatio=1`) | **frozen** at `bars.minBarLength` | 0 | continues |
| `talking` | derived: `geometry.idleRadius - idle.maxBarLength + (talkingInnerGap - DONUT_PADDING)` (== `donutInner + talkingInnerGap`, unchanged from current rule) | outward (`inwardRatio=0`) | reactive `[minBarLength, talking.maxBarLength]` | `talking.sensitivity` | continues |

### Transition: idle/listening → thinking (or thinking → idle/listening)

Pure damp. Anchor unchanged. Over `morph.idleToThinking` seconds, the animator lerps these values from start state → target state:

- **Numeric fields** (`sensitivity`, `waveSpeed`, `waveAmplitude`, `waveHeight`, `waveLobes`, `smoothing`, `waveEnvelope`, `envelopeAmplitude`, `envelopeSensitivity`, `maxBarLength`): lerp linearly.
- **Booleans** (`ambientWave`, `intensityOpacity`): step at `t = 0.5`. (Reviewer R2 P1.5 — booleans cannot lerp.)
- **String unions** (`waveMode`, `waveShape`): step at `t = 0.5` (same moment as booleans for consistency). v1 doesn't crossfade discrete shape changes.
- **Geometry** (`anchor`, `inwardRatio`): unchanged. Anchor stays at `geometry.idleRadius`. `inwardRatio` stays 1.
- **`freezeAtMin`**: false during `t ∈ [0, 0.9]` so length follows the audio fade smoothly. At `t = 0.9`, set `freezeAtMin = true` and zero `prevValuesRef` to clamp residual smoothed value down to exactly `minBarLength` by `t = 1.0`. Thinking's resting state then has `freezeAtMin = true` (matching §6 RenderValues comment). Reviewer R3 P1.4 fix.

**Inverse damp (thinking → idle/listening).** Mirror: `freezeAtMin = true` for the first 10% (preserves the rigid frozen length entering the damp), then `false` for `t ∈ [0.1, 1.0]`. Numerics, booleans, and string unions lerp/step from thinking's resting → idle's resting per the same rules.

**Length is NOT lerped explicitly.** It's an emergent property of the audio path: `barLength = minBarLength + value × (maxBarLength − minBarLength)`. When sensitivity and wave-amplitudes both reach 0, `value` reaches 0, and `barLength` settles at `minBarLength`. The length convergence is the natural consequence, not a separate state variable.

Why this matters: if length were lerped *and* derived from sensitivity, two paths would shape the same outcome (a seam). One path. The animator drives sensitivity + wave params; the renderer derives length.

### Transition: thinking → talking (the morph)

Two phases over total duration `morph.thinkingToTalking`. The phase boundary is `reactiveStartAt × morph.thinkingToTalking`.

**Phase A — translation.** `t ∈ [0, reactiveStartAt]`, normalized to `tA ∈ [0, 1]`.
- `anchor` lerps `geometry.idleRadius → (talkingAnchor + bars.minBarLength)` linearly in `tA`. (NOT `→ talkingAnchor` — see §5 for why. With `inwardRatio=1`, the bar segment is `[anchor − minBarLength, anchor]`. To land the inner tip at `talkingAnchor`, anchor must reach `talkingAnchor + minBarLength`.)
- `inwardRatio` stays 1.
- `length = bars.minBarLength` (frozen — enforced by the renderer's `freezeAtMin` path, not by audio sensitivity alone).
- `sensitivity = 0`.
- All wave/envelope params: 0 / disabled. `ambientWave = false`.

**End of Phase A** — anchor is at `talkingAnchor + minBarLength`, segment occupies `[talkingAnchor, talkingAnchor + minBarLength]`. This is the pre-flip state.

**The flip** (instantaneous, between Phase A and Phase B) — `inwardRatio` flips 1 → 0, anchor reference jumps from `talkingAnchor + minBarLength` (outer-tip semantics) to `talkingAnchor` (inner-tip semantics). Same pixels — see §5 table.

**Phase B — reactive-style transition.** `t ∈ [reactiveStartAt, 1]`, normalized to `tB ∈ [0, 1]`.
- `anchor = talkingAnchor` (post-flip; the flip moved the reference from `talkingAnchor + minBarLength` outer-tip to `talkingAnchor` inner-tip; same pixels).
- `inwardRatio` stepped 1 → 0 at the moment Phase B starts (the flip).
- `freezeAtMin` stepped true → false at the flip. Audio path resumes.
- **Numeric fields except `maxBarLength`** (`sensitivity`, all wave/envelope numerics): lerp `0 → talking's value` in `tB` (Phase A zeroed them; Phase B ramps them in).
- **`maxBarLength` is special** (Reviewer R4 P1.2): does NOT lerp through 0. It lerps `morphStart.maxBarLength → talking.maxBarLength` linearly across the FULL morph duration (Phase A + Phase B combined), capturing the from-state's resting maxBarLength at morph initiation. During Phase A `freezeAtMin` clamps length to `minBarLength` regardless of maxBarLength, so the lerping value doesn't visibly affect length. At Phase B, when `freezeAtMin` releases, maxBarLength is already partially lerped and continues smoothly. Both endpoints are >= `bars.minBarLength`, so the formula `min + value × (max − min)` is always safe.
- **Booleans + string unions** (`ambientWave`, `intensityOpacity`, `waveMode`, `waveShape`): step to talking's values at `tB = 0` (the flip moment, same as everything else changing). `ambientWave` going false → true means the wave is enabled but its amplitudes are still 0; they ramp up via the numeric lerps. (Reviewer R2 P1.5.)

When `reactiveStartAt = 1`, Phase B is instantaneous — bars finish translation, then SNAP into talking's reactive form. (Reviewer R1 P2.1: this snap is why default 1.0 was wrong.)
When `reactiveStartAt = 0`, **Phase A duration is zero** — anchor teleports from `idleRadius` to `talkingAnchor + minBarLength` instantly; Phase B then runs the full duration as a reactive ramp-up at the talking position. Tester degenerate; not a useful default.
**Default `0.75`** — translation runs 0→75% of the morph; reactive ramp runs 75→100%. No snap. Tunable per profile in `[0, 1]`.

### Transition: talking → idle/listening (return path)

Same two-phase shape as thinking → talking, in reverse, sharing `morph.thinkingToTalking` and `morph.reactiveStartAt`:

- **Phase A (reverse-reactive transition)** runs first, `t ∈ [0, 1 - reactiveStartAt]`. **Numeric wave/envelope/sensitivity params (NOT `maxBarLength`)** lerp `talking's value → 0` (D1 fix: maxBarLength excluded — follows its own full-morph lerp per R4 P1.2; see Phase B bullet below). Anchor stays at `talkingAnchor`. `inwardRatio` stays 0. **`freezeAtMin = false` for most of this window** — we want the audio path active so the user sees the reactive fade. **In the last 10% of Phase A** (`tA ∈ [0.9, 1.0]`), `freezeAtMin` ramps in: at `tA = 0.9`, set `freezeAtMin = true` and zero `prevValuesRef` (Reviewer R2 P1.6). This pulls residual smoothed length down to exactly `minBarLength` before the inverse flip.
- **Booleans + string unions** step to off / matching defaults at `tA = 0.5` (mid-Phase-A). `ambientWave` flips true → false at `tA = 0.5`.
- **Inverse flip** at the Phase A → Phase B boundary: `inwardRatio` steps 0 → 1, anchor reference jumps from `talkingAnchor` (inner-tip semantics) to `talkingAnchor + minBarLength` (outer-tip semantics) — same pixels because `freezeAtMin` ensured length is exactly `minBarLength`.
- **Phase B (translation + idle-resume)** runs second, `t ∈ [1 - reactiveStartAt, 1]`. Two things happen in parallel (Reviewer R3 P1.6):
  - **Translation**: anchor lerps `talkingAnchor + minBarLength → idleRadius`. `freezeAtMin = true` throughout — bars stay rigid at `minBarLength` during translation.
  - **Idle params lerp in**: numeric per-state params except maxBarLength (sensitivity, wave/envelope numerics) lerp `0 → idle's resting values` over the same `tB` window. **`maxBarLength` follows its own full-morph lerp** (`morphStart.maxBarLength → idle.maxBarLength` linearly across the full reverse morph duration; Reviewer R4 P1.2 — never goes below `bars.minBarLength`). Booleans + string unions step to idle's values at `tB = 0.5`.
- **After arrival** (full duration completes): `freezeAtMin = false` releases the audio path. Per-state params are *already at* idle's resting values (set during Phase B's parallel lerp), so the audio path engages immediately with the correct multipliers. Smoothing then naturally absorbs `value`'s rise from 0 toward whatever the live audio dictates — no visible snap.
- After full duration, state is fully idle.

This is the literal inverse, so `reactiveStartAt = 0.75` (default) means "reactive transition runs the first 25% of the return, then translation runs the last 75%" — a clean mirror of the forward path.

**Residual-length tradeoff.** The 10% tail clamp accepts a tiny visible step where length pulls down to `minBarLength` over a short window. v1 ships with this tradeoff. If users find it noticeable, two options for v2: (a) longer tail clamp, (b) renderer exposes a `targetValueOverride` prop that the animator drives toward 0 in the tail, replacing the tail clamp with a smooth value-path. Defer.

### Transition matrix

All 16 transitions (4 states × 4 destinations). `→` cells named, `=` cells are no-ops.

| From \ To | idle | listening | thinking | talking |
|---|---|---|---|---|
| **idle** | = (no-op) | instant (state label change only; identical render) | damp via `idleToThinking` | composed: idle→thinking then thinking→talking, back-to-back, sharing the same morph clock per leg |
| **listening** | instant | = | damp via `idleToThinking` | composed: listening→thinking→talking |
| **thinking** | un-damp via `idleToThinking` (length+audio recovers) | un-damp via `idleToThinking`, then label flips to listening | = | morph via `thinkingToTalking` (the main morph) |
| **talking** | morph via `thinkingToTalking` (return path) | morph via `thinkingToTalking`, then label flips | composed: talking→idle (return path) then idle→thinking (damp), two sequential morphs back-to-back. The intermediate idle frame is unavoidable; the user clicked thinking, so the system briefly passes through idle before damping. | = |

**Same-state click**: no-op. The animator detects `state === previousState` and does nothing.

**Composed transitions** (idle→talking, listening→talking, talking→thinking): the animator treats these as two sequential morphs. The first morph completes (Phase A + Phase B of leg 1), then the second morph starts. Total visible duration = sum of both legs' durations. v1 does not blend the legs into a single motion; sequential composition is simpler and matches user expectation that "talking → thinking" should look like a return-then-damp, not a novel motion.

**Idle ↔ listening** is purely a label flip in v1: same `RadialStateSettings` (because `idleListeningLinked = true` by default). When the link is broken later, this becomes an instant snap to listening's distinct values; still no morph.

### Mid-morph interruption

Any state-pill click during an active morph aborts that morph and starts a new one from the current rendered frame. Detailed mechanics live in §6 (internal model + duration table + state-change rules). High-level summary:

1. Capture current `RadialRenderValues` as the new morph start.
2. Set new target = the destination state's row from the §"States" table.
3. Reset `morphT = 0`. Pick duration via §6 duration table.
4. Run the standard lerp from captured-start → target.

The captured start may have intermediate `inwardRatio` (it's already a step function: 0 or 1, never fractional), intermediate `anchor`, and intermediate amplitudes. The lerp handles them naturally. The new transition does NOT necessarily go through Phase A + Phase B structure — that structure only applies to talking-related transitions. For e.g. mid-morph `thinking → talking` interrupted by click `idle`: the new transition is `[wherever-we-are] → idle`, run as a single-phase damp (no Phase A/B distinction since neither endpoint is talking). The animator just lerps the captured snapshot toward idle's row over `morph.idleToThinking` seconds.

Edge: if the click is on the same state currently being morphed *toward*, it's a no-op (don't restart). If the click is on the state being morphed *from*, it reverses the morph (captured-start → original-start, same duration as the elapsed morph time). v1 implements only the simple "abort + new lerp" path; reverse-by-elapsed is deferred.

---

## 5. The anchor / inwardRatio flip — visual derivation

This is the most error-prone math in the plan. Walking it explicitly.

Define **inner tip** = the bar end closer to the center, **outer tip** = the end farther from the center.

**Idle bar** (anchor at `R = idle.radius`, `inwardRatio=1`, `length=L`):
- Outer tip at `R`. Inner tip at `R - L`.

**Thinking bar** (same as idle, `L = minBarLength = 12`):
- Outer tip at `R = 134`. Inner tip at `134 - 12 = 122`.

**Talking bar** (anchor at `T = talking.radius = 94`, `inwardRatio=0`, `length=L'`):
- Inner tip at `T = 94`. Outer tip at `T + L' = 94 + L'`.

**End of Phase A — what the user wants** (per chat: "the bars for thinking would be at the exact radius point for the inner part of the bars for talking"). Inner tip at `T = 94`, length still 12.

Two interpretations of "anchor + direction" that produce the same bar segment `[94, 106]`:

| Interpretation | anchor | inwardRatio | inner tip | outer tip |
|---|---|---|---|---|
| Inward from outer | 106 | 1 | `anchor − length` = 94 | `anchor` = 106 |
| Outward from inner | 94 | 0 | `anchor` = 94 | `anchor + length` = 106 |

Same pixels. Phase A's ending state: bar segment occupies `[94, 106]`. Starting state: `[122, 134]`. The segment translates inward by 28 px, length unchanged.

**Now the flip.** At the instant Phase B begins, the renderer needs to interpret the bar with `(anchor=T=94, inwardRatio=0)` so that subsequent length growth is *outward* (matching talking). Before the flip, the renderer was using `(anchor=106, inwardRatio=1)` so length growth would be *inward* (which is wrong for talking).

At the flip instant, length is still 12, so:
- Pre-flip: anchor 106, inward, length 12 → segment `[94, 106]`. ✓
- Post-flip: anchor 94, outward, length 12 → segment `[94, 106]`. ✓

**Pixels are identical.** The flip is visually invisible iff length is exactly `minBarLength` at the flip instant. The plan must guarantee this — Phase A keeps length pinned at `minBarLength`, and Phase B's length lerp starts from `minBarLength`. There's no window where length has drifted before the flip.

**No overlap.** Phase A's lerp completes within its own window (`t ∈ [0, reactiveStartAt]`); during Phase B (`t ∈ [reactiveStartAt, 1]`), the anchor stays pinned at `talkingAnchor` (post-flip). Length is `minBarLength` exactly throughout Phase A (enforced by the renderer's `freezeAtMin` path), so the flip frame has no length ambiguity. Phase B's reactive lerp then runs from 0 → talking's values without any anchor motion.

Phase A's lerp duration is `reactiveStartAt × morph.thinkingToTalking`; Phase B's is `(1 − reactiveStartAt) × morph.thinkingToTalking`. Translation completes before reactive-style begins — the phase labels are accurate.

Edge values:
- `reactiveStartAt = 1`: Phase B duration is 0 — bars complete translation then SNAP into talking's reactive form. Pre-review default; rejected (Reviewer P2.1) because the snap is visible.
- `reactiveStartAt = 0`: Phase A duration is 0 — translation is instantaneous (anchor teleports to `T + minBarLength`); Phase B's reactive ramp-up runs over the full duration. Bars look like they teleport then fade in audio reactivity. Acceptable for tester paths; not a sensible default.

**Default `0.75`** balances clear translation (visible inward slide) with a meaningful reactive ramp at the end. Realistic range `[0.4, 0.9]`. We don't clamp the slider; we trust the user.

---

## 6. The animator hook

### Surface

```ts
type RadialState = 'idle' | 'listening' | 'thinking' | 'talking';

export interface RadialRenderValues {
  // Geometry
  anchor: number;                // current radius the bar is anchored at
  inwardRatio: 0 | 1;            // current direction (no smooth lerp; flips at Phase A→B)
  // Length envelope
  minBarLength: number;          // == bars.minBarLength always
  maxBarLength: number;          // lerped per state
  // Audio
  sensitivity: number;           // 0 during thinking and Phase A
  // Render gate
  freezeAtMin: boolean;          // true during thinking and forward Phase A; reverse-path tail and reverse Phase B — see §6.5
  // Per-state behavior (lerped)
  ambientWave: boolean;
  waveSpeed: number;
  waveAmplitude: number;
  waveHeight: number;
  waveMode: 'additive' | 'reactive';
  waveShape: 'sine' | 'triangle' | 'square' | 'segments';
  waveLobes: number;
  smoothing: number;
  waveEnvelope: number;
  envelopeAmplitude: number;
  envelopeSensitivity: number;
  intensityOpacity: boolean;
}

export function useLinkedRadialAnimator(
  profile: RadialLinkedProfile | null,
  state: RadialState,
  paused?: boolean,
): RadialRenderValues | null;
```

### Internal model

- One RAF loop, same as `useLinkedProfileAnimator`.
- A per-frame target derivation: read the live profile, look up the target state's row from the §"States" table, lerp from captured start.
- Internal state:
  ```ts
  morphActive: boolean;
  morphStart: RadialRenderValues | null;   // captured at morph start
  morphFrom: RadialState;                  // the from-state of the current leg (used for duration lookup)
  morphTarget: RadialState;                // the destination of the current leg
  morphT: number;                          // 0..1 progress along current leg
  morphDuration: number;                   // seconds, picked from the duration table
  intendedFinalState: RadialState | null;  // set on click; cleared when morphTarget reaches it
  currentlyIn: RadialState;                // last completed resting state; mid-morph this stays as the pre-morph state until the morph completes
  ```

**Duration table** (which `morph.*` knob applies to which (from, to) leg):

| From | To | Duration |
|---|---|---|
| idle / listening | thinking | `morph.idleToThinking` |
| thinking | idle / listening | `morph.idleToThinking` |
| thinking | talking | `morph.thinkingToTalking` |
| talking | idle / listening | `morph.thinkingToTalking` |
| any composed pair | (each leg) | leg-by-leg lookup above |
| mid-morph abort | new lerp | use the duration of the new (currentlyIn → target) row, not the elapsed time of the aborted morph |
- `dt` clamp: `Math.min(dt, 1/30)` to match `useLinkedProfileAnimator.ts:211`.

**Leg progression for composed transitions.** When the requested `state` requires a composed motion (e.g., user clicks talking from idle), the hook sets `intendedFinalState = 'talking'` and starts leg 1 (`idleToThinking`). When leg 1 completes (`morphT >= 1`), the hook checks `intendedFinalState`: if it's not the current resting state, start leg 2 toward it. When `intendedFinalState === currentlyIn`, clear it.

**State-change handling.**
1. If `state === currentlyIn` and no morph active: no-op.
2. If `state === intendedFinalState`: no-op (already heading there).
3. If `state === morphTarget`: no-op (already lerping there directly).
4. Otherwise: capture current render values as `morphStart`, set new target, set `intendedFinalState` to caller's state, reset `morphT = 0`, pick `morphDuration` from the §"Mid-morph interruption" rules.

`inwardRatio` is a step function: it flips at the Phase A → B boundary inside `thinkingToTalking`, and at the equivalent inverse boundary inside `talkingToIdle`. It is NEVER a fractional value in `RadialRenderValues`.

### What the hook does NOT do

- It does not produce frequency data. It produces a `sensitivity` scalar that the existing `mapFrequencyToBars` consumes. The renderer multiplies frequency by `sensitivity` per its existing path.
- It does not own the canvas. It returns numbers; the cell renders them.
- It does not know about the live voice page. v1 consumer is the tune-mode cell.

### Pause semantics

When `paused === true`:
- `morphT` is frozen (no progression toward target).
- The RAF loop continues but only re-emits the last computed values.
- Frequency data still flows to the renderer (audio reactivity is not paused; it's just decoupled from morph progress).
- Resuming continues from the captured `morphT`.

Default `paused = false`. v1 only uses `paused = true` if the user wants to inspect a mid-morph frame; not exposed in the UI for v1.

### Adapter — RadialRenderValues → RadialWaveformProps

The cell is the adapter between the animator's output and `RadialBidirectional`'s prop surface. Mapping table:

| RadialWaveformProps field | Source |
|---|---|
| `radius` | `RenderValues.anchor` |
| `inwardRatio` | `RenderValues.inwardRatio` |
| `barWidth`, `barGap`, `roundCaps`, `barColor`, `segments`, `rotationSpeed`, `updateRate` | `profile.bars.*` |
| `minBarLength` | `profile.bars.minBarLength` |
| `maxBarLength`, `sensitivity`, `ambientWave`, `waveSpeed`, `waveAmplitude`, `waveHeight`, `waveMode`, `waveShape`, `waveLobes`, `smoothing`, `waveEnvelope`, `envelopeAmplitude`, `envelopeSensitivity`, `intensityOpacity` | `RenderValues.*` (lerped) |
| `freezeAtMin` (new) | `RenderValues.freezeAtMin` |
| `barCount` | tune mode: derived once from `profile.bars` + `geometry.idleRadius` and held constant across the morph (locked-bar-count rule in handoff). Static mode: from `composeBaseWaveformProps` per `profile.lockBarCount` (undefined when off). D6 fix: rule depends on consumer mode. |
| `frequencyData` | external — comes from the audio source, not the animator |
| `bgColor` | `profile.display.bgColor` |
| `showEnvelopeCeiling` | UI hover state, not from animator |

### File location

`src/projects/voiceinterface/radial-states/useLinkedRadialAnimator.ts`. Sibling to `index.tsx`. v1 has only one consumer (the tune-mode cell), so the hook lives inside `radial-states/`. If/when the live page adopts it, the hook can be promoted to `voiceinterface/components/` later — defer the move until that consumer exists.

---

---

## 6.5 Renderer animation contract (Reviewer R2 main recommendation)

The current `RadialBidirectional`, `RadialInward`, and `RadialOutward` re-run their `useEffect` whenever any prop changes. With per-frame animator output, that would tear down the canvas + RAF loop every frame (Reviewer R2 P1.1). The renderers must be refactored to support per-frame animated props without re-mounting the effect.

### Contract for all three radial variants

1. **Single mount-time RAF loop.** The main draw `useEffect` has **exactly one dependency: `renderExtent`** (the only input that requires canvas resize + remount). Reviewer R3 P1.3 — every other prop, including `frequencyData`, goes through refs. The RAF loop is created once on mount and reads all live values from refs each frame.

2. **Animated props + frequency data go through refs — split by variant** (Reviewer R4 P2.3):

   **Shared refs (all three variants):** `radius`, `maxBarLength`, `sensitivity`, all wave/envelope params, `freezeAtMin`, `barColor`, `bgColor`, `barWidth`, `barGap`, `roundCaps`, `segments`, `rotationSpeed`, `intensityOpacity`, `updateRate`, `barCountOverride`, **`frequencyData`** (Reviewer R3 P1.1).

   **Bidirectional-only ref:** `inwardRatio`. RadialInward and RadialOutward don't read it.

   A `useRef<RadialAnimatedProps>` holds these. A small sync `useEffect` writes the latest props into the ref on every render. The main RAF loop reads from the ref each frame.

   **Component-level refs that persist across renderExtent remount** (Reviewer R4 P2.1): `rotationRef`, `waveTimeRef`, `prevValuesRef`, `wasFreezeAtMinRef`. Declared at component scope, NOT inside the draw effect. Their values survive the canvas-resize remount so rotation/wave time keep accumulating; `prevValuesRef` is reconciled to current bar count inside the loop on length mismatch.

3. **Stable canvas extent via prop — required for radial-states callers** (Reviewer R3 P1.2 + R4 P1.1). New `renderExtent?: number` prop on `RadialWaveformProps`. Optional in the type so existing external callers (e.g. `/radial-waveform/playground`) keep working with mount-time self-sizing.

   **Radial-states callers MUST pass `renderExtent`** — every static cell AND the tune cell:
   - Static cell: `renderExtent = state-settings.radius + state-settings.maxBarLength + 20`
   - Tune cell: `renderExtent = geometry.idleRadius + max(idle.maxBarLength, talking.maxBarLength) + 20`

   Renderer sizes canvas as `(renderExtent ?? radius + maxBarLength + 20) * 2`. Main draw effect dep array is exactly `[renderExtent]`. The renderer reads `radius` and `maxBarLength` from refs; the fallback inside the effect uses the values captured at mount time and doesn't track later changes (that's why radial-states callers must pass renderExtent — their values change live).

   **Why this avoids the R4 P1.1 bug**: with renderExtent passed by every radial-states cell, edits to `radius`/`maxBarLength` recompute renderExtent at the cell level (cell sees the live profile values via React state), the prop changes, the effect re-runs once, canvas resizes. The fallback exists only for non-radial-states callers whose props are already stable.

4. **Bar-count changes handled inside the RAF loop**, not via deps. The existing line `if (prevValuesRef.current.length !== barCount) { prevValuesRef.current = new Array(barCount).fill(0); }` already self-heals on mismatch; works equally well when `barCount` comes from a ref. Rotation and wave time accumulators are NOT reset on bar-count change.

5. **`freezeAtMin` semantics — both flips, with explicit entry-frame rule.** The renderer reads `freezeAtMin` from the ref each frame. When true, it skips the audio + wave + envelope blocks, sets `value = 0`, skips the smoothing block.

   **Entry-frame zeroing rule** (Reviewer R4 P2.5): track previous frame's freezeAtMin in `wasFreezeAtMinRef.current`. On the transition false → true, zero `prevValuesRef.current` (one-shot). Without this rule, implementers might zero continuously while frozen (wasteful) or fail to zero on the transition (bug):

   ```ts
   if (freezeAtMin && !wasFreezeAtMinRef.current) {
     prevValuesRef.current = new Array(barCount).fill(0);
   }
   wasFreezeAtMinRef.current = freezeAtMin; // at end of frame
   ```

   Engaged:
   - Forward damp (idle→thinking): false during `[0, 0.9]`, true at `[0.9, 1.0]` and onward at thinking's resting state (Reviewer R3 P1.4).
   - Forward Phase A (thinking→talking): true throughout, releases at flip.
   - Reverse Phase A (talking→idle): false during `[0, 0.9 × (1−reactiveStartAt)]`, true at the last 10%.
   - Reverse Phase B (translation): true throughout.
   - Idle's resting state: false (audio path active).

6. **Static adapter — variant-aware** (Reviewer R4 P2.4). Static mode passes `composeBaseWaveformProps(profile, state)` plus `freezeAtMin` (defaulted false, except `state === 'thinking'` which gets true so thinking renders frozen even in static mode). `inwardRatio` is added ONLY when the consumer is `RadialBidirectional` — for static `RadialInward` / `RadialOutward` callers, no inwardRatio is passed (those variants don't accept it).

   Tune mode renders `RadialBidirectional` exclusively. It passes `composeBaseWaveformProps(profile, animationTargetState)` merged with the animator's `RadialRenderValues`, which supplies `inwardRatio`, `freezeAtMin`, animated `radius`, and lerped per-state values that override the base.

### `composeBaseWaveformProps(profile, state)` helper

Lives in `radial-states/api.ts`. Pure function. Returns `RadialWaveformProps` minus `freezeAtMin` — that's added by the consumer (Reviewer R4 P2.2 — `inwardRatio` is NOT in `RadialWaveformProps`, only on `RadialBidirectionalProps`, so omitting it is a category error).

- Static `RadialInward` / `RadialOutward`: consumer adds `freezeAtMin` (true for thinking, false otherwise). Does NOT pass `inwardRatio` (those variants don't accept it).
- Static `RadialBidirectional`: not used in static mode for v1.
- Tune mode: consumer is `RadialBidirectional`. Merges `RadialRenderValues` from the animator providing `inwardRatio`, `freezeAtMin`, animated `radius`, and lerped per-state values.

`RadialState` is exported from a new `radial-states/types.ts` so api.ts and the hook share the type without circular dependency (Reviewer R3 P2.1).

```ts
export type BaseWaveformProps = Omit<RadialWaveformProps, 'freezeAtMin'>;

export function composeBaseWaveformProps(
  profile: RadialLinkedProfile,
  state: RadialState,
): BaseWaveformProps {
  const s = profile[state]; // RadialStateSettings
  const isInward = state !== 'talking';
  const radius = state === 'talking'
    ? deriveTalkingAnchor(profile)
    : profile.geometry.idleRadius;

  return {
    // From bars (shared identity + perf)
    barWidth: profile.bars.barWidth,
    barGap: profile.bars.barGap,
    roundCaps: profile.bars.roundCaps,
    barColor: profile.bars.barColor,
    segments: profile.bars.segments,
    rotationSpeed: profile.bars.rotationSpeed,
    minBarLength: profile.bars.minBarLength,
    updateRate: profile.bars.updateRate,

    // From display (shared chrome)
    bgColor: profile.display.bgColor,

    // Per-state
    radius,
    maxBarLength: s.maxBarLength,
    sensitivity: s.sensitivity,
    ambientWave: s.ambientWave,
    waveSpeed: s.waveSpeed,
    waveAmplitude: s.waveAmplitude,
    waveHeight: s.waveHeight,
    waveMode: s.waveMode,
    waveShape: s.waveShape,
    waveLobes: s.waveLobes,
    smoothing: s.smoothing,
    waveEnvelope: s.waveEnvelope,
    envelopeAmplitude: s.envelopeAmplitude,
    envelopeSensitivity: s.envelopeSensitivity,
    intensityOpacity: s.intensityOpacity,

    // Bar count from lockBarCount rule
    barCount: profile.lockBarCount
      ? Math.floor(2 * Math.PI * profile.geometry.idleRadius / (profile.bars.barWidth + profile.bars.barGap))
      : undefined,

    // Renderer-controlled — wired by caller
    frequencyData: null,

    // renderExtent omitted — static mode falls back to renderer's self-sizing.
    // Tune mode adds it explicitly.
  };
}
```

### `RadialState` location

```ts
// src/projects/voiceinterface/radial-states/types.ts (NEW)
export type RadialState = 'idle' | 'listening' | 'thinking' | 'talking';
```

Imported by both `api.ts` and `useLinkedRadialAnimator.ts`. Avoids the api → hook import direction Reviewer R3 P2.1 flagged.

### Refs refactor applies to all three variants

Reviewer-CM1: making only `RadialBidirectional` refs-based while leaving `RadialInward` / `RadialOutward` on the per-prop effect would create two renderer models in the same file tree. Apply the refs refactor uniformly. Static cells continue to work because their props are stable (no per-frame change), so the refs path is a no-op equivalent of the current behavior.

---

## 7. Rendering surface — RadialBidirectional adoption

The tune-mode cell renders `RadialBidirectional` directly (not `RadialInward` or `RadialOutward`). It builds props by **merging `composeBaseWaveformProps(profile, animationTargetState)` with the animator's `RadialRenderValues`** per §6.5 point 6 (D7 fix: not "passing animator output" alone — animator overrides the base for animated fields). `RadialBidirectional.tsx:9` already accepts `inwardRatio`, `radius`, `barWidth`, `barGap`, `minBarLength`, `maxBarLength`, `sensitivity`, all wave params, and `barCount` (added in `types.ts:69`).

**Static-mode cell count: 3, not 4** (Reviewer R3 P1.5). The 3 cells are: idle/listening (one cell, since `idleListeningLinked = true` makes them visually identical by default), thinking, talking. Pills in the bottom bar are 4 (idle, listening, thinking, talking) so the controls panel can route to the right per-state object — but cells stay 3. When the link is broken (deferred), revisit.

The static three-cell mode keeps its current renderers (`RadialInward` for idle/listening/thinking, `RadialOutward` for talking) but **now consumes `composeBaseWaveformProps(profile, state)` instead of reading `profile.idle` directly** (Reviewer R3 P2.5). The renderers themselves get the refs refactor (§6.5) but their visual output for static profiles is unchanged.

### Required prop / interface additions to RadialWaveformProps

- `barCount?: number` (already in `types.ts:69`; just needs propagation through `RadialBidirectional`'s destructure).
- `freezeAtMin?: boolean` (NEW). Default false.
- `renderExtent?: number` (NEW; Reviewer R3 P1.2). Default undefined; renderer falls back to self-sizing math.

### Required behavior changes in RadialBidirectional

1. **Bar count override propagation — through refs, not deps** (Reviewer R4 P1.3). Currently `RadialInward` and `RadialOutward` accept the `barCount?` override (per `types.ts:69`); `RadialBidirectional` does not destructure it. Add `barCount` to the destructure, write the latest value into the animated-props ref every render (just like every other live prop). Inside the RAF loop, read `barCountRef`, recompute when it changes via the existing `prevValuesRef.current.length !== barCount` reconciliation (line 84). **Do NOT add `barCountOverride` to the main draw-effect deps array** — that would defeat the §6.5 single-dep rule.

2. **`freezeAtMin` prop (NEW).** Add a `freezeAtMin?: boolean` prop. When true, the renderer:
   - Skips the audio + wave + envelope calculation entirely (the inner block from line 92 to line 127).
   - Sets `value = 0` directly.
   - Skips the smoothing block (line 129) — does not read or write `prevValuesRef`.
   - On the entering frame (false → true transition), zeros `prevValuesRef.current` per the **`wasFreezeAtMinRef` rule in §6.5 point 5** (D5 fix: single source of truth for the entry-frame logic).
   - Bar length collapses exactly to `minBarLength` because `value = 0`.

   Driven by the animator: see §6.5 point 5 "Engaged" list for the exact phases. Reviewer P1.4.

   This is the renderer-level pinning that makes the Phase A → B flip pixel-stable regardless of the `smoothing` slider value.

---

## 8. Editing surface — tune mode

### What changes on the page

A single mode toggle in the bottom bar, beside the state pills: **Static** (current 3-cell view) | **Tune** (single-cell with active state pills driving morphs).

In Tune mode:
- Three of the cells collapse; one large cell renders in the middle of the page.
- The state pills become live transition triggers (currently they only switch which controls panel is visible). Clicking "Talking" while the cell is showing thinking begins the `thinkingToTalking` morph.
- The controls panel still shows controls for the *focused* state. A user editing talking's `maxBarLength` while the cell is mid-morph sees the in-flight render keep using the lerped value (because the animator re-derives target from the live profile each frame).
- A new "Morph" subsection in the controls panel exposes `morph.idleToThinking`, `morph.thinkingToTalking`, `reactiveStartAt`. These are profile-level (not per-state).

### Focused state vs. animation target — v1 couples them

Two conceptually distinct ideas (Reviewer P2.2):

- `controlsFocusedState`: which state's controls the right panel is currently showing.
- `animationTargetState`: which state the cell is morphing toward (or resting at).

**v1 explicitly couples them.** Clicking a state pill sets BOTH at the same time. Consequence: in tune mode, you can't inspect another state's controls without firing a morph. This is acceptable for v1 because the workflow is "click pill → watch morph → tune controls → click again to retest." Decoupling (e.g., long-press or modifier-click to peek at controls without animating) is deferred.

In static mode, only `controlsFocusedState` matters — there's no animation. The two-name distinction exists in the code so the future decoupling is a small change.

### What does NOT change (intent vs. implementation)

Behavioral intent unchanged; implementation changes are required (Reviewer R2 P2.4):

- Static mode is the default view. (Implementation: cells now consume `composeBaseWaveformProps(profile, state)` instead of reading `profile.idle` directly, because the schema is reshaped.)
- Profile load/save/discard *behavior* matches today's review page. (Implementation: `snapshotOf`, `dirty` comparison, `handleSelectProfile`, `handleReset`, `handleSaveAs`, `updateFocused` all need updates to handle new fields — see §8b.)
- Color picker, backdrop section visual design — unchanged. (Implementation: their host panels reshape per §8a.)

### Toggle persistence

Mode is UI state only. Not persisted to the profile. Stored in `localStorage['radial-states-mode'] = 'static' | 'tune'`. Defaults to `'static'`.

### §8a — Controls panel reshape

Promoting bar-identity to `bars` forces the controls panel to be reorganized. The current 5-column grid (`Geometry | Audio | Wave | Envelope | Style`) stays, but its content reshapes.

**New top strip — shared across all states.** A horizontal "Bars" strip above the 5-column grid:

```
┌─ Bars (shared) ─────────────────────────────────────────────────────┐
│  Bar Width [—◯—]  Bar Gap [—◯—]  Round Caps [✓]  Bar Color [▣]      │
│  Segments [—◯—]   Rotation [—◯—]  Min Bar Length [—◯—]              │
│  Update Rate [—◯—]ms                                                │
└─────────────────────────────────────────────────────────────────────┘
```

(`Update Rate` was per-state in the legacy schema; it's a perf throttle, not state behavior — moved here in the refactor. Reviewer R2 P2.2.)

Always visible regardless of focused state. Editing here updates every cell simultaneously in static mode and the morph baseline in tune mode.

**New top strip — geometry.** A second horizontal strip beside or below the Bars strip:

```
┌─ Geometry ──────────────────────────────────────────────────────────┐
│  Idle Radius [—◯—]   Talking Inner Gap [—◯—]   Lock bars to idle [✓]│
└─────────────────────────────────────────────────────────────────────┘
```

`talking.radius` displayed read-only in this strip when focused state is talking.

**New top strip — display.** A third horizontal strip with shared display chrome (Reviewer R2 P2.3):

```
┌─ Display (shared) ──────────────────────────────────────────────────┐
│  Bg Color [▣]  Preview Bg [▣]  Container [▣ + opacity / radius / pad]│
│  Outline [✓ + color + width]                                        │
└─────────────────────────────────────────────────────────────────────┘
```

**Per-state 5-column grid.** Now narrower content because bar-identity, perf, and display chrome are all shared above:

| Column | Per-state content |
|---|---|
| Geometry | `maxBarLength` only (radius is shared above) |
| Audio | `sensitivity`, `intensityOpacity`, `smoothing` |
| Wave | `ambientWave`, `waveSpeed`, `waveAmplitude`, `waveHeight`, `waveMode`, `waveShape`, `waveLobes` |
| Envelope | `waveEnvelope`, `envelopeAmplitude`, `envelopeSensitivity` |
| Backdrop | backdrop section (unchanged structurally) |

**Listening panel.** New per-state panel (locked per §13). When `idleListeningLinked === true` (default), the listening panel renders a notice "Linked to idle — break link to edit independently" with a single "Break link" button. Editing idle's per-state values updates listening's via the **link-propagation rule** (below). When the link is broken, listening's panel becomes a full editable panel matching idle's.

**Link-propagation rule.** Lives in the slider/input commit handler in `index.tsx`, NOT in the animator. When the focused state is idle and the link is on, every commit to a per-state field also writes the same value to listening's matching field in the profile object. When the focused state is listening with the link on, the panel renders read-only (linked-notice + Break link button only); no commits originate from there, so propagation is unidirectional by construction. This is a UI-layer concern; the animator just reads whatever per-state values are in the profile. The cell renderer for the listening pill reads listening's settings — which equal idle's by construction.

**Morph subsection.** Visible only in tune mode AND only when the focused state is **thinking or talking** (the states involved in the morphs the knobs affect). Hidden on idle/listening — editing a knob with no visible connection to the watched cell is friction. Same underlying profile fields read/written from either thinking's panel or talking's panel; edits sync via the profile object.

```
┌─ Morph ─────────────────┐
│  Idle ↔ Thinking [—◯—]s │
│  Thinking ↔ Talking [—]s│
│  Reactive Start At [—◯—]│
└─────────────────────────┘
```

`Idle ↔ Thinking` duration is shown on thinking's panel only (talking has no idle-to-thinking morph in its scope). `Thinking ↔ Talking` and `Reactive Start At` show on both thinking's and talking's panels.

**What disappears.** Per-state Bar Width, Bar Gap, Round Caps, Bar Color, Segments, Rotation Speed, Min Bar Length, Radius. (All moved to the shared strips.)

**Talking-specific extras stay.** Inner Gap and Lock-bars-to-idle remain in the Geometry strip (they're talking-relative, but they describe geometric rules so they live up top, not per-state).

**Implementation impact on `index.tsx`.** The `ControlsPanel` component (currently around `index.tsx:879`) gets a substantial restructure: header strip + per-state grid + listening branch + morph subsection. This is the largest single subtask in the plan.

### §8b — Listening migration: the full code-site list

Adding listening as a fourth state touches more than the controls panel (Reviewer P2.3). Concrete update sites in `index.tsx` (line numbers approximate, verify at edit time):

| Symbol / function | Current shape | Update |
|---|---|---|
| `StateKey` type (~line 131) | `'idle' \| 'thinking' \| 'talking'` | add `'listening'` |
| `AllSettings` type (~line 143) | three keys | add `listening: RadialStateSettings` |
| `DEFAULT_ALL` const | three keys | seed listening from idle |
| `STATE_LABEL` const | `{idle: 'Idle / Listening', thinking: 'Thinking', talking: 'Talking'}` | split into idle + listening labels |
| `STATE_VARIANT` const | three mappings | listening uses same variant as idle (`RadialInward`) |
| `Cell` rendering for static mode (~line 568) | three cells in a row | unchanged: still 3 cells (idle/listening combined while linked). Pills are 4; cells are 3. Reviewer R3 P1.5. |
| Tune-mode rendering (NEW) | n/a | one cell, drives anim target from `controlsFocusedState` |
| `snapshotOf` (~line 200) | reads idle/thinking/talking | add listening; also pull bars/display/geometry/idleListeningLinked/morph |
| `ProfileSnapshot` type (~line 186) | settings × 3, backdrop, lockBarCount, talkingInnerGap | add listening; bars; display; geometry; idleListeningLinked; morph |
| `handleSelectProfile` (~line 1423) | restores three states | restore listening too; restore bars/display/geometry/idleListeningLinked/morph |
| `handleReset` / Discard (~line 1369) | reverts three states | revert listening too; revert all new shared blocks |
| `handleSaveAs` (~line 1288) | clones idle/thinking/talking | clone listening; clone bars/display/geometry/idleListeningLinked/morph |
| `updateFocused` mutator (~line 1549) | writes one state's settings | branch on link rule (Reviewer P2.3 / §8a link-propagation) |
| `dirty` comparison (~line 1358) | compares old snapshot to current | compare new shape including all new fields |

Reviewer P1.8 accepted: snapshot reshape is non-trivial; this list is the contract.

---

## 9. Ghost-bar correction

Per chat: the current ghost bars on max-bar-length hover (commit `b52b7ca`) bake the wave envelope into the ceiling. The user wants pure geometric envelope — N bars at exactly `[radius, radius + maxBarLength]` (or inward equivalent), no audio, no envelope, no wave.

### Change

In `GhostBars` (`index.tsx:234`), drop the envelope/wave math. Render N bars at length = `maxBarLength` (full). Per-bar value is constant `1.0`.

**Clamp behavior** (Reviewer P2.5): match the renderer's clamp, not the configured value. For inward variants, the renderer clamps inward length to `maxSafeInward = radius − minInnerRadius` (`RadialInward.tsx` and `RadialBidirectional.tsx:80–81`). The ghost should call the same clamp so what it shows is what the renderer can actually draw. The contract is "ghost = real-renderer max with audio frozen at 1.0," not "ghost = configured value."

This is a small change inside the existing GhostBars effect. Doesn't depend on the animator.

### Why ship this with the animator

Because the animator surfaces the *travel space* explicitly (Phase A's bars are sticks of length 12 traveling across the same space the ghost bars represent). Having the ghost show the true geometric envelope is the natural complement.

---

## 10. Acceptance criteria

Testable conditions, run by hand on the review page.

1. **Schema migration**. Loading the page with the existing `radial-states-profiles.json` (pre-refactor) succeeds without errors. Each of the 7 profiles renders without console errors after migration in memory. The dev-mode migration report logs once per profile with the format specified in §3.
2. **Static mode visual migration is reviewable** (Reviewer P1.3). The 3-cell view renders **with the migrated shared values**, which means profiles with previously-divergent per-state values (e.g. different barWidth on talking) will look different. Acceptance: each profile's visual diff is consistent with its dev-mode migration report (the chosen values came from idle for bar-identity; from thinking for `minBarLength`; from idle for display chrome). No silent visual changes — every diff is explained by the report.
3. **Tune mode toggle**. The mode toggle is present in the bottom bar. Clicking it swaps the page from 3-cell to 1-cell. Clicking again swaps back. State persists via localStorage.
4. **Idle → Thinking damp**. With the cell in idle, click the Thinking pill. Bars stop reacting to audio and damp to length 12 over `morph.idleToThinking` seconds. Anchor stays at idle radius. Rotation continues. No bars appear or disappear.
5. **Thinking → Talking morph (default `reactiveStartAt = 0.75`)**. From thinking, click Talking. Bars (length = `bars.minBarLength`) translate inward as a ring during the first 75% of the morph; inner tip travels `geometry.idleRadius − minBarLength` → `talkingAnchor` (anchor in animator state lerps `idleRadius` → `talkingAnchor + minBarLength`). At 75%, the flip fires (anchor reference → `talkingAnchor`, inwardRatio → 0, freezeAtMin → false); over the last 25%, sensitivity / wave / maxBarLength lerp from 0 to talking's values. No visible snap at the flip.
6. **Thinking → Talking with `reactiveStartAt = 1.0`**. Translation runs full duration; at `t = 1.0` the reactive params snap to talking's values instantly. Verifies the edge — bars may visibly snap; this is the explicit user-tunable degenerate behavior, not a default.
7. **Talking → Idle return**. From talking, click Idle. Phase A (reverse-reactive): wave + audio fade out, length collapses to 12. Inverse flip. Phase B: bars translate outward to idle's radius. After arrival, idle's reactive form is already prepared. No visual snap.
8. **Idle ↔ Listening label flip**. Switch focus from idle pill to listening pill. No visible motion (linked profile). Controls panel shows listening's panel with the linked-notice + Break link button.
9. **Idle → Talking direct**. From idle, click Talking. Two sequential morphs run back-to-back: idle→thinking (damp) then thinking→talking (translate + reactive). No bars appear/disappear at the leg boundary.
10. **Same-state click no-op**. Click idle while in idle. Nothing changes; no morph fires.
11. **Bar identity preserved**. Across every transition, count, width, gap, roundness, color stay constant. No bar appears or disappears mid-morph.
12. **Live editing during morph (target-only)**. While morphing, edit `talking.maxBarLength` in the controls panel. The morph's *target* updates immediately; the lerp continues from the original captured start toward the new target. (Start values are not retroactively changed by mid-morph profile edits — only the target is.)
13. **Ghost-bar correction**. Hovering Max Bar Length on idle's controls shows N bars at full max length, NOT modulated by wave envelope. Same on talking and thinking.
14. **Rotation continues through every state**. No state freezes rotation.
15. **Profile save/discard works post-refactor**. Save As creates a profile with `schemaVersion: 2` and the new shape; Update writes the new shape; Discard reverts the new-shape baseline.
16. **Legacy profile load + first save** (Reviewer P1.5). On first page load post-deploy, all 7 legacy profiles render correctly (migration ran in-memory). Disk file unchanged until next user save. The first user-initiated `Update` or `Save As` triggers a whole-array POST: every profile is rewritten as v2 in one shot. After that, the on-disk file has all 7 profiles in the new shape. (We don't try to preserve untouched legacy entries through fetch+save because the persistence layer is whole-array.)
17. **Mid-morph interruption**. From idle, click talking. While leg 1 (idle→thinking) is in flight (~halfway), click thinking. The composed morph aborts; the animator captures current values and lerps to thinking from there. No teleport, no double-fire of leg 2.
18. **Same-target click during morph**. From idle, click talking. Mid-morph, click talking again. No-op — the morph continues uninterrupted. (`intendedFinalState` already equals `talking`.)
19. **No effect-restart storm during audio** (Reviewer R3 P2.4). With audio active and `frequencyData` updating every frame, the renderer's draw `useEffect` runs **once on mount and only re-runs when `renderExtent` changes**. Verified by adding a temporary console.log inside the effect and watching the mount → no re-fires across hundreds of frames of audio.
20. **Tune-mode canvas size stable through morph**. From thinking, click talking. The cell's canvas dimensions in DOM (`canvas.width`, `canvas.height`) do NOT change during the morph. The bar segment moves inside a stable canvas.
21. **Editing render-extent inputs in tune mode** (e.g. `idle.maxBarLength`) recomputes `renderExtent`, triggers one controlled effect re-run, canvas bitmap resizes once. **`rotationRef` and `waveTimeRef` persist across the remount** (component-level refs declared outside the draw effect) so rotation and wave time keep accumulating without snapping. **`prevValuesRef` is reconciled inside the RAF loop** when bar-count changes, not reset by the remount itself. No audio-driven effect restart occurs.
22. **Static ↔ Tune toggle**. Switching modes mid-morph or while audio is playing does not leave stale `prevValuesRef` artifacts — bars are rendered cleanly in the new mode within one RAF.
23. **Static/Tune parity** (Reviewer R4 P3.2). For the same profile + state, static review and tune mode must call the same `composeBaseWaveformProps(profile, state)` path, with only mode-specific additions (static adds `freezeAtMin` per-state default; tune adds `inwardRatio`, animator-driven overrides, `frequencyData`, `renderExtent`). No two slightly-different visual interpretations of the same saved profile.

---

## 11. Verification — pre-mortem

Imagine the implementation fails on the first attempt. Top three predicted failure modes:

1. **Migration corrupts existing profiles.** A subtle field rename or a default mismatch silently breaks 7 saved profiles. Mitigation: write `migrateLegacyProfile` as a pure function with unit-style coverage (a small fixture file with one legacy profile and the expected migrated output, checked at runtime via console assert during dev). Don't write back to disk on first read — only on next user-initiated save. That gives a chance to inspect.
2. **The flip at the Phase A → B boundary is visible.** Two causes:
   - (a) Length not at `minBarLength` because of `prevValuesRef` smoothing carrying residual `value > 0` (Reviewer P1.4).
   - (b) Anchor not at `talkingAnchor + minBarLength` at the flip moment (Reviewer P1.1).

   Mitigation for (a): the new `freezeAtMin` renderer prop bypasses smoothing entirely and zeroes prevValuesRef. The animator emits `freezeAtMin = true` throughout Phase A. Length is exactly `minBarLength` on the flip frame.

   Mitigation for (b): Phase A's anchor target is `talkingAnchor + bars.minBarLength` (NOT `talkingAnchor`). At the flip, anchor reference jumps from `talkingAnchor + minBarLength` (outer-tip) to `talkingAnchor` (inner-tip). Same pixels under different semantics.

   Dev assertion at the flip: `console.assert(Math.abs(currentRenderedLength - bars.minBarLength) < 0.5 && Math.abs(currentAnchor - (talkingAnchor + bars.minBarLength)) < 0.5, 'Phase A→B flip preconditions failed')`. Logged once per flip event.
3. **Morph progress tracking double-fires on rapid state changes.** User clicks Talking mid-morph from idle → thinking. The hook needs to handle interrupted morphs cleanly: capture current render values as the new start, retarget to the new state, restart morphT. Mitigation: the explicit internal-state set defined in §6 (`morphActive`, `morphFrom`, `morphTarget`, `morphT`, `intendedFinalState`, `currentlyIn`); on state change, the rules in §6 "State-change handling" reset `morphT = 0` atomically and update target. (D4 fix: prior text referenced a `morphPhase` field that doesn't exist in §6.)

---

## 12. Out of scope (deferred)

- Wiring the live voice page (`/voiceinterface/realtime`) to use this animator.
- A new shader dispatch case (`shader: 'radial'`) on `RealtimeBlob`.
- Profile delete UI.
- Thinking breathing pulse.
- Listening-specific intro animation.
- Per-state bar color (`barColor` stays shared for v1; revisit if user wants it).
- Smooth `inwardRatio` lerp (deferred indefinitely; rigid translation is the design).
- Splitting `morph.thinkingToTalking` into separate forward/return durations.
- Moving radial profile editing into the realtime-states editor.
- Schema versioning beyond v2 (the literal `schemaVersion: 2` works for v1; v3 would need a discriminated union).
- Reverse-by-elapsed mid-morph behavior (clicking the from-state during a morph reverses by elapsed-time). v1 ships only the simple "abort + new lerp" path.
- **Live-page timing instrumentation.** When the animator runs in production driven by realtime API state events, a slow morph + fast API can leave the user staring at an in-flight transition that's already obsolete. The plan's mid-morph interruption rule handles correctness (leg 2 captures leg 1's in-flight values), but there's no telemetry surfacing "this profile's morph durations are tuned longer than your API's typical state-transition cadence." The Coral parallel: thinking-cycle-time vs response-time was never measured, so users couldn't tell when a thinking pulse was being skipped. Defer to live-page wiring; flag as something to instrument when that work starts.

---

## 13. Open questions for the user

All resolved as of the latest revision. Lock-in summary (so the reviewer can see what was decided):

- **Bar color**: shared across states. Locked.
- **Listening panel**: kept as a full per-state panel position (parallel to idle/thinking/talking). When `idleListeningLinked = true` (default), the panel renders the linked-notice + Break-link button. Locked.
- **Morph subsection visibility**: visible on thinking and talking panels only; hidden on idle/listening. Locked.
- **Composed transitions**: sequential (two back-to-back morphs sharing each leg's normal duration). Production-mode reasoning: the realtime API drives state transitions reactively, never asking for a pre-known blended path; composed = sequential matches that contract. Locked.

---

## 14. File-touch list

| File | Change |
|---|---|
| `src/projects/voiceinterface/radial-states/api.ts` | Schema refactor (RadialBars, RadialDisplay, listening, geometry, idleListeningLinked, lockBarCount, morph, schemaVersion); `migrateLegacyProfile`; in-memory normalization in `fetchRadialLinkedProfiles`; `composeBaseWaveformProps(profile, state)` helper; new defaults |
| `src/projects/voiceinterface/radial-states/useLinkedRadialAnimator.ts` | NEW — animator hook |
| `src/projects/voiceinterface/radial-states/index.tsx` | Tune-mode toggle; single-cell render path; controls panel reshape (§8a); listening sites (§8b list); consume animator; ghost-bar fix (with maxSafeInward clamp); consume new schema; static cells now call `composeBaseWaveformProps`; update snapshotOf, dirty comparison, save-as, reset, profile-switch; `controlsFocusedState` / `animationTargetState` named explicitly |
| `src/projects/radial-waveform/variants/RadialBidirectional.tsx` | Refs-based renderer refactor (single mount-time RAF; main effect deps reduced to `[renderExtent]`; all live props inc. `frequencyData` flow through a sync ref); add `barCount` propagation; add `freezeAtMin` handling (skip audio/wave/smoothing; zero prevValuesRef on entering frame); add `renderExtent`-based canvas sizing with fallback to self-sizing math (Reviewer R3 P1.1, P1.2, P1.3) |
| `src/projects/radial-waveform/variants/RadialInward.tsx` | Refs refactor + **honors `freezeAtMin`** (so static thinking renders frozen at min length, per §6.5 point 5). Does not read `inwardRatio` (not part of inward variant). Static-mode visual output unchanged for non-thinking states because props are stable per render. |
| `src/projects/radial-waveform/variants/RadialOutward.tsx` | Refs refactor + **honors `freezeAtMin`** (for symmetry; talking's reverse Phase B uses freezeAtMin true during the translation tail of static talking is theoretical but the prop is honored consistently). Does not read `inwardRatio`. |
| `src/projects/radial-waveform/types.ts` | Add `freezeAtMin?: boolean` and `renderExtent?: number` to `RadialWaveformProps` |
| `src/projects/voiceinterface/radial-states/types.ts` | NEW — exports `RadialState` so api and hook can share without circular import (Reviewer R3 P2.1) |
| `radial-states-profiles.json` | Rewritten on first user-initiated save post-deploy (whole-array POST migrates everything) |

No new pages. No new API routes.

**Cross-package changes** (Reviewer R4 P3.1): the renderer refactor extends beyond `voiceinterface/radial-states/`. Touched in `radial-waveform/`:
- `types.ts` — `freezeAtMin` and `renderExtent` props added; widens shape for all three variants.
- `variants/RadialBidirectional.tsx` — refs refactor, `freezeAtMin` handling, `inwardRatio` ref, `barCount` propagation.
- `variants/RadialInward.tsx` — refs refactor, honors `freezeAtMin` (for thinking's frozen rendering in static mode).
- `variants/RadialOutward.tsx` — refs refactor, honors `freezeAtMin` for symmetry.

Static-mode visual output is unchanged for existing profiles whose props are stable per render.

**External callers** (verified via grep): `radial-waveform/components/RadialGalleryCell.tsx` and `radial-waveform/components/RadialShowcase.tsx`. Neither needs to pass `renderExtent` — the prop is optional and these surfaces have stable props per render, so the renderer's mount-time fallback (`radius + maxBarLength + 20`) gives the same behavior as before. The refs refactor is also safe for them because their props don't change per frame. No code change needed at these call sites.

---

## 15. Concept index

For a plan this size, listing every named concept and the section(s) where it's defined / referenced. (Maintained on every edit — see plan-review §1.)

Updated for Reviewer R2 patches:

| Concept | Defined in | Also referenced in |
|---|---|---|
| `RadialBars` block | §3 | §4, §6, §8a, §10 |
| `RadialDisplay` block | §3 | §6, §8a, §10 |
| `RadialStateSettings` | §3 | §6, §8a, §10 |
| `schemaVersion: 2` | §3 | §3 (migration) |
| `geometry.idleRadius` | §3 | §4, §8a |
| `idleListeningLinked` | §3 | §4 (transition matrix), §8a, §13 |
| `morph.idleToThinking` | §3 | §4, §8a, §10, §11 |
| `morph.thinkingToTalking` | §3 | §4, §5, §8a, §10 |
| `reactiveStartAt` (default 0.75) | §3 | §4, §5, §8a, §10, §13 |
| Transition matrix | §4 | §10 |
| Phase A (translation, anchor → talkingAnchor + minBarLength) | §4 | §5, §10, §11 |
| Phase B (reactive-style, lerps from 0) | §4 | §5, §10 |
| `inwardRatio` flip | §4 | §5, §11 |
| `freezeAtMin` renderer path | §6.5, §7 | §4, §6, §11 |
| Renderer animation contract | §6.5 | §7, §14 |
| `composeBaseWaveformProps` helper | §6.5 | §7, §14 |
| `RadialState` type location (`radial-states/types.ts`) | §6.5 | §14 |
| `renderExtent` prop | §6.5, §7 | §10, §14 |
| Refs-based renderer (incl. frequencyData) | §6.5 | §7, §10, §14 |
| `lockBarCount` (profile-level) | §3 | §8a, §10 |
| Discrete-field step semantics | §4 | §10 |
| Reverse-path tail clamp | §4 | §11 |
| `useLinkedRadialAnimator` | §6 | §7, §8, §10, §14 |
| Adapter mapping | §6 | §7 |
| Pause semantics | §6 | (v1 unused in UI) |
| Tune mode | §8 | §8a, §10, §14 |
| `controlsFocusedState` / `animationTargetState` | §8 | §8a |
| Controls panel reshape | §8a | §10 |
| Listening migration sites | §8b | §14 |
| `migrateLegacyProfile` | §3 | §11, §14 |
| Migration report (dev-only) | §3 | §10 (1) |
| Ghost-bar correction (with clamp) | §9 | §10 |
