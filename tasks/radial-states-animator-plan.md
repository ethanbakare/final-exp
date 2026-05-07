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
  updateRate: number;
}

interface RadialLinkedProfile {
  schemaVersion: 2;              // explicit version flag; legacy profiles lack this
  id: string;
  name: string;
  bars: RadialBars;              // shared across states
  idle: RadialStateSettings;
  listening: RadialStateSettings; // NEW — was implicit before
  thinking: RadialStateSettings;
  talking: RadialStateSettings;
  geometry: {
    idleRadius: number;          // canonical anchor; talking radius derived
    talkingInnerGap: number;     // unchanged from current
  };
  idleListeningLinked: boolean;  // when true, edits to idle.* mirror to listening.*
  backdrop?: RadialBackdrop;     // unchanged
  morph: {
    idleToThinking: number;      // seconds, default 0.4 — also covers thinking→idle
    thinkingToTalking: number;   // seconds, default 0.6 — also covers talking→idle
    reactiveStartAt: number;     // 0..1, default 1.0 — when Phase B begins relative to Phase A
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
| `barColor` | Bar identity (for v1) | Per-state color is a feature we *might* want; deferring as `barColorOverride?: string` is fine but adds a lerp-hex path. **Pushing this question to user.** |
| `segments` | Symmetry parameter, not state-specific | Bars re-assigned to different frequency buckets mid-morph |
| `rotationSpeed` | Should rotate continuously through morph | Snaps to a different speed at state change |
| `minBarLength` | Defines the morph length | Phase A's translation length is ambiguous |

### What stays per-state (and why)

- `maxBarLength` — talking's max can legitimately be smaller (audio dynamic range tradeoff).
- All wave/envelope params — the whole point of having states is for these to differ.
- `sensitivity` — talking is reactive; idle/listening have their own; thinking forces 0.
- `intensityOpacity`, `updateRate`, `smoothing` — render-time behavior that may differ per state.

### Migration

The 7 existing profiles in `radial-states-profiles.json` need a one-time migration. **Detection is explicit** via `schemaVersion`: legacy profiles lack the field and are normalized at fetch time.

For each legacy profile, `migrateLegacyProfile(p: any): RadialLinkedProfile`:

1. Read the old idle, thinking, talking objects.
2. Promote idle's bar-identity values into the new `bars` block. (Idle is canonical; it's been the source of truth for radius and bar count.) `bars.minBarLength` = `idle.minBarLength`.
3. Synthesize `listening` by deep-cloning idle's per-state values. Set `idleListeningLinked = true`.
4. Lift `idleRadius` from `idle.radius` into `geometry.idleRadius`. Carry `talkingInnerGap` over.
5. Drop the deprecated keys from per-state objects (barWidth, barGap, roundCaps, barColor, segments, rotationSpeed, minBarLength, radius).
6. Add `morph` defaults: `idleToThinking: 0.4`, `thinkingToTalking: 0.6`, `reactiveStartAt: 1.0`.
7. Set `schemaVersion: 2`. Bump `lastModified`.

**Trigger.** Migration runs in-memory inside `fetchRadialLinkedProfiles` whenever a profile is read with `schemaVersion !== 2`. The on-disk file is **not rewritten** automatically — only the next user-initiated `Update` or `Save As` writes back the new shape. This gives the user a chance to inspect and roll back if migration corrupts a profile.

**Cross-state divergence on legacy profiles.** Legacy profiles may have idle/thinking/talking with diverged bar-identity values (the cross-profile leak history pre-`63a2394`). Migration takes idle's values; thinking's and talking's are dropped silently. A dev-mode console log lists the dropped values per profile so the user can spot-check.

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

- `sensitivity` (idle/listening's value → 0 entering thinking; 0 → idle's value leaving)
- `ambientWave` (`true → false` entering; `false → true` leaving — boolean steps mid-lerp at `t=0.5`)
- `waveAmplitude`, `waveHeight`, `envelopeAmplitude` (lerp to/from 0 to silence the wave smoothly even before the boolean flips)
- All other wave/envelope params lerp normally.
- `inwardRatio` stays 1. Anchor stays at `geometry.idleRadius`.

**Length is NOT lerped explicitly.** It's an emergent property of the audio path: `barLength = minBarLength + value × (maxBarLength − minBarLength)`. When sensitivity and wave-amplitudes both reach 0, `value` reaches 0, and `barLength` settles at `minBarLength`. The length convergence is the natural consequence, not a separate state variable.

Why this matters: if length were lerped *and* derived from sensitivity, two paths would shape the same outcome (a seam). One path. The animator drives sensitivity + wave params; the renderer derives length.

### Transition: thinking → talking (the morph)

Two phases over total duration `morph.thinkingToTalking`. The phase boundary is `reactiveStartAt × morph.thinkingToTalking`.

**Phase A — translation.** `t ∈ [0, reactiveStartAt]`, normalized to `tA ∈ [0, 1]`.
- `anchor` lerps `geometry.idleRadius → talkingAnchor` linearly in `tA`.
- `inwardRatio` stays 1.
- `length = bars.minBarLength` (frozen).
- `sensitivity = 0`.
- All wave/envelope params: 0 / disabled.

**Phase B — reactive-style transition.** `t ∈ [reactiveStartAt, 1]`, normalized to `tB ∈ [0, 1]`.
- `anchor = talkingAnchor` (already there from end of Phase A).
- `inwardRatio` flips 1 → 0 at the moment Phase B starts. **Visually invisible** because at that instant length is exactly `minBarLength` — see §5 for the pixel-equivalence proof.
- `maxBarLength` lerps `idle's max → talking's max` in `tB`. (Sets the target ceiling; live audio drives where within `[minBarLength, max]` the bar actually sits.)
- `sensitivity` lerps `0 → talking's sensitivity` in `tB`. (Phase A zeroed it.)
- All wave/envelope params lerp `0 → talking's values` in `tB`. (Phase A zeroed them.)
- `ambientWave` flips false → true at `tB = 0` (start of Phase B), so the wave is enabled but starts with zero amplitude and ramps up via the param lerps.

When `reactiveStartAt = 1`, Phase B is instantaneous — bars finish translation, then snap into talking's reactive form.
When `reactiveStartAt = 0`, Phase B starts immediately and runs in parallel — translation and reactive ramp-up happen together.
Default `1.0`. Tunable per profile.

### Transition: talking → idle/listening (return path)

Same two-phase shape as thinking → talking, in reverse, sharing `morph.thinkingToTalking` and `morph.reactiveStartAt`:

- **Phase A (reverse-reactive transition)** runs first, `t ∈ [0, 1 - reactiveStartAt]`. Sensitivity, ambientWave, wave/envelope params lerp talking's values → 0 / off. Length collapses to `minBarLength` via the audio path. Anchor stays at `talkingAnchor`. `inwardRatio` stays 0.
- **Inverse flip** at the boundary: `inwardRatio` flips 0 → 1, anchor reference moves from inner-tip-at-T to outer-tip-at-(T+minBarLength) = same pixels.
- **Phase B (translation)** runs second, `t ∈ [1 - reactiveStartAt, 1]`. Anchor lerps `T + minBarLength → idleRadius`. Bars stay rigid at `minBarLength`. After arrival, idle's reactive form is already prepared (ambientWave true, sensitivity at idle's value).
- After full duration, state is fully idle.

This is the literal inverse so `reactiveStartAt = 1.0` means "reactive transition completes first, then translate" on return — a clean mirror of the forward path.

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

**Edge case:** if Phase A and Phase B overlap (`reactiveStartAt < 1`), the length is no longer pinned at `minBarLength` for the overlapping window. During overlap, the renderer is using two different (anchor, direction) interpretations simultaneously, which is incoherent unless we pick one for the overlap window.

**Resolution.** During any frame where `reactiveStartAt < 1` and we're in the overlap:
- Use Phase B's interpretation (anchor at `T`, outward). 
- Anchor was lerping toward `T` during Phase A; at `t = reactiveStartAt × duration`, anchor has reached `T` only if Phase A's lerp completed. But Phase A's lerp duration is the full `morph.thinkingToTalking`, not the truncated Phase A window.

Two ways to handle this:

(a) **Anchor finishes within Phase A.** Phase A's lerp anchor `idleRadius → T` completes by `t = reactiveStartAt × duration`. Length stays pinned for the rest of Phase A (the gap between anchor arrival and Phase B start, if any). Phase B then fires with anchor already at `T`.

(b) **Anchor lerps over the full duration.** Phase A's anchor lerp uses the full duration regardless of `reactiveStartAt`. With overlap, anchor and length-lerp run in parallel.

**Picking (a).** Cleaner contract: Phase A is "translation," Phase B is "reactive-style." When you set `reactiveStartAt = 0.5`, you're saying "translation finishes by 50% of the morph; reactive transition runs from 50% to 100%." If translation kept lerping through Phase B, the phase labels would be a lie.

This means the actual lerp speeds are not the same as the morph duration. Phase A's duration is `reactiveStartAt × morph.thinkingToTalking`. Phase B's duration is `(1 - reactiveStartAt) × morph.thinkingToTalking`. When `reactiveStartAt = 1`, Phase B duration is 0 — meaning the reactive transition is instantaneous (snap into talking). That's an acceptable edge.

When `reactiveStartAt = 0`, Phase A duration is 0 — translation is instantaneous (anchor snaps to T). Length stays at minBarLength. Then Phase B's reactive ramp-up runs over the full duration. **This is degenerate — it looks like an instant teleport followed by a fade-in of audio reactivity.** The user can set this if they want, but the default is 1.0 and the realistic range is `[0.5, 1.0]`. We don't clamp; we trust the user.

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
| `barWidth`, `barGap`, `roundCaps`, `barColor`, `segments`, `rotationSpeed` | `profile.bars.*` |
| `minBarLength` | `profile.bars.minBarLength` |
| `maxBarLength`, `sensitivity`, `ambientWave`, `waveSpeed`, `waveAmplitude`, `waveHeight`, `waveMode`, `waveShape`, `waveLobes`, `smoothing`, `waveEnvelope`, `envelopeAmplitude`, `envelopeSensitivity`, `intensityOpacity`, `updateRate` | `RenderValues.*` (lerped) |
| `barCount` | derived once from `profile.bars` + `geometry.idleRadius`; passed in unchanged across the morph (locked by §"Geometry rules" in handoff) |
| `frequencyData` | external — comes from the audio source, not the animator |
| `bgColor` | profile-level (one bg for the cell) |
| `showEnvelopeCeiling` | UI hover state, not from animator |

### File location

`src/projects/voiceinterface/radial-states/useLinkedRadialAnimator.ts`. Sibling to `index.tsx`. Mirrors `useLinkedProfileAnimator.ts` placement (under `voiceinterface/components/`); we keep it inside `radial-states/` because v1 has only one consumer.

---

## 7. Rendering surface — RadialBidirectional adoption

The tune-mode cell renders `RadialBidirectional` directly (not `RadialInward` or `RadialOutward`), passing the animator's output as props. `RadialBidirectional.tsx:9` already accepts `inwardRatio`, `radius`, `barWidth`, `barGap`, `minBarLength`, `maxBarLength`, `sensitivity`, all wave params, and `barCount` (added in `types.ts:69`).

The static three-cell mode keeps its current renderers (`RadialInward` for idle/listening/thinking, `RadialOutward` for talking) — no migration needed there.

### Required prop additions to RadialBidirectional

None. The existing prop surface covers everything the animator emits. Verified by reading `RadialBidirectional.tsx:5–37`.

### Required behavior change in RadialBidirectional

- **Bar count override propagation.** Currently `RadialInward` and `RadialOutward` accept the `barCount?` override (per `types.ts:69`); `RadialBidirectional` does not destructure it. Need to add `barCount: barCountOverride` to its destructure and use `barCountOverride ?? Math.floor(...)` on line 79. One-line change.

---

## 8. Editing surface — tune mode

### What changes on the page

A single mode toggle in the bottom bar, beside the state pills: **Static** (current 3-cell view) | **Tune** (single-cell with active state pills driving morphs).

In Tune mode:
- Three of the cells collapse; one large cell renders in the middle of the page.
- The state pills become live transition triggers (currently they only switch which controls panel is visible). Clicking "Talking" while the cell is showing thinking begins the `thinkingToTalking` morph.
- The controls panel still shows controls for the *focused* state. A user editing talking's `maxBarLength` while the cell is mid-morph sees the in-flight render keep using the lerped value (because the animator re-derives target from the live profile each frame).
- A new "Morph" subsection in the controls panel exposes `morph.idleToThinking`, `morph.thinkingToTalking`, `reactiveStartAt`. These are profile-level (not per-state).

### What does NOT change

- Static mode is unchanged. The 3-cell review remains the default.
- Profile load/save/discard logic is unchanged.
- The controls panel layout, color picker, backdrop section — unchanged.

### Toggle persistence

Mode is UI state only. Not persisted to the profile. Stored in `localStorage['radial-states-mode'] = 'static' | 'tune'`. Defaults to `'static'`.

### §8a — Controls panel reshape

Promoting bar-identity to `bars` forces the controls panel to be reorganized. The current 5-column grid (`Geometry | Audio | Wave | Envelope | Style`) stays, but its content reshapes.

**New top strip — shared across all states.** A horizontal "Bars" strip above the 5-column grid:

```
┌─ Bars (shared) ─────────────────────────────────────────────────────┐
│  Bar Width [—◯—]  Bar Gap [—◯—]  Round Caps [✓]  Bar Color [▣]      │
│  Segments [—◯—]   Rotation [—◯—]  Min Bar Length [—◯—]              │
└─────────────────────────────────────────────────────────────────────┘
```

Always visible regardless of focused state. Editing here updates every cell simultaneously in static mode and the morph baseline in tune mode.

**New top strip — geometry.** A second horizontal strip beside or below the Bars strip:

```
┌─ Geometry ──────────────────────────────────────────────────────────┐
│  Idle Radius [—◯—]   Talking Inner Gap [—◯—]   Lock bars to idle [✓]│
└─────────────────────────────────────────────────────────────────────┘
```

`talking.radius` displayed read-only in this strip when focused state is talking.

**Per-state 5-column grid.** Now narrower content because bar-identity is gone:

| Column | Per-state content |
|---|---|
| Geometry | `maxBarLength` only (radius is shared above) |
| Audio | `sensitivity`, `intensityOpacity`, `updateRate`, `smoothing` |
| Wave | `ambientWave`, `waveSpeed`, `waveAmplitude`, `waveHeight`, `waveMode`, `waveShape`, `waveLobes` |
| Envelope | `waveEnvelope`, `envelopeAmplitude`, `envelopeSensitivity` |
| Style + Backdrop | `bgColor`, backdrop section (unchanged) |

**Listening panel.** New per-state panel — *default behavior; pending §13(2) confirmation*. When `idleListeningLinked === true` (default), the listening panel renders a notice "Linked to idle — break link to edit independently" with a single "Break link" button. Editing idle's per-state values updates listening's via the **link-propagation rule** (below). When the link is broken, listening's panel becomes a full editable panel matching idle's.

**Link-propagation rule.** Lives in the slider/input commit handler in `index.tsx`, NOT in the animator. When the focused state is idle and the link is on, every commit to a per-state field also writes the same value to listening's matching field in the profile object. When the focused state is listening with the link on, the panel renders read-only (linked-notice + Break link button only); no commits originate from there, so propagation is unidirectional by construction. This is a UI-layer concern; the animator just reads whatever per-state values are in the profile. The cell renderer for the listening pill reads listening's settings — which equal idle's by construction.

If §13(2) confirms "omit listening panel entirely," replace this section with: listening pill is a label-only flip; no panel; render path uses idle's per-state settings whenever `state === 'listening'`.

**Morph subsection.** New section visible only in tune mode (Critical 2 transitions are tune-mode-only). Lives in the Style column (or as a new 6th block depending on space):

```
┌─ Morph ─────────────────┐
│  Idle ↔ Thinking [—◯—]s │
│  Thinking ↔ Talking [—]s│
│  Reactive Start At [—◯—]│
└─────────────────────────┘
```

**What disappears.** Per-state Bar Width, Bar Gap, Round Caps, Bar Color, Segments, Rotation Speed, Min Bar Length, Radius. (All moved to the shared strips.)

**Talking-specific extras stay.** Inner Gap and Lock-bars-to-idle remain in the Geometry strip (they're talking-relative, but they describe geometric rules so they live up top, not per-state).

**Implementation impact on `index.tsx`.** The `ControlsPanel` component (currently around `index.tsx:879`) gets a substantial restructure: header strip + per-state grid + listening branch + morph subsection. This is the largest single subtask in the plan.

---

## 9. Ghost-bar correction

Per chat: the current ghost bars on max-bar-length hover (commit `b52b7ca`) bake the wave envelope into the ceiling. The user wants pure geometric envelope — N bars at exactly `[radius, radius + maxBarLength]` (or inward equivalent), no audio, no envelope, no wave.

### Change

In `GhostBars` (`index.tsx:234`), drop the envelope/wave math. Render N bars at length = `maxBarLength` (full). Per-bar value is constant `1.0`. The ghost is a ring of max-length sticks.

This is a 5-line change inside the existing GhostBars effect. Doesn't depend on the animator.

### Why ship this with the animator

Because the animator surfaces the *travel space* explicitly (Phase A's bars are sticks of length 12 traveling across the same space the ghost bars represent). Having the ghost show the true geometric envelope is the natural complement.

---

## 10. Acceptance criteria

Testable conditions, run by hand on the review page.

1. **Schema migration**. Loading the page with the existing `radial-states-profiles.json` (pre-refactor) succeeds without errors. Each of the 7 profiles renders correctly in static mode after migration. The migrated JSON, when written, has the new shape.
2. **Static mode unchanged**. The 3-cell view renders identically to the pre-refactor state for every profile. Bar count, radius, donut, controls, save/discard — no observable difference.
3. **Tune mode toggle**. The mode toggle is present in the bottom bar. Clicking it swaps the page from 3-cell to 1-cell. Clicking again swaps back. State persists via localStorage.
4. **Idle → Thinking damp**. With the cell in idle, click the Thinking pill. Bars stop reacting to audio and damp to length 12 over `morph.idleToThinking` seconds. Anchor stays at idle radius. Rotation continues. No bars appear or disappear.
5. **Thinking → Talking morph (default `reactiveStartAt = 1.0`)**. From thinking, click Talking. Bars (length 12) translate inward as a ring. Inner tip travels `idle.radius - 12` → `talking.radius` over `morph.thinkingToTalking × 1.0` seconds. At the moment of arrival, audio reactivity kicks in and bars start growing outward. No visual snap at the flip.
6. **Thinking → Talking with `reactiveStartAt = 0.5`**. From thinking, click Talking. Translation completes by 50% of the morph. From 50% onward, audio reactivity ramps in over the second half. No visual snap at the flip; the only difference is the timing.
7. **Talking → Idle return**. From talking, click Idle. Phase A (reverse-reactive): wave + audio fade out, length collapses to 12. Inverse flip. Phase B: bars translate outward to idle's radius. After arrival, idle's reactive form is already prepared. No visual snap.
8. **Idle ↔ Listening label flip**. Switch focus from idle pill to listening pill. No visible motion (linked profile). Controls panel shows listening's panel with the linked-notice + Break link button.
9. **Idle → Talking direct**. From idle, click Talking. Two sequential morphs run back-to-back: idle→thinking (damp) then thinking→talking (translate + reactive). No bars appear/disappear at the leg boundary.
10. **Same-state click no-op**. Click idle while in idle. Nothing changes; no morph fires.
11. **Bar identity preserved**. Across every transition, count, width, gap, roundness, color stay constant. No bar appears or disappears mid-morph.
12. **Live editing during morph (target-only)**. While morphing, edit `talking.maxBarLength` in the controls panel. The morph's *target* updates immediately; the lerp continues from the original captured start toward the new target. (Start values are not retroactively changed by mid-morph profile edits — only the target is.)
13. **Ghost-bar correction**. Hovering Max Bar Length on idle's controls shows N bars at full max length, NOT modulated by wave envelope. Same on talking and thinking.
14. **Rotation continues through every state**. No state freezes rotation.
15. **Profile save/discard works post-refactor**. Save As creates a profile with `schemaVersion: 2` and the new shape; Update writes the new shape; Discard reverts the new-shape baseline.
16. **Legacy profile load**. On first page load post-deploy, all 7 legacy profiles render correctly (migration ran in-memory). Disk file unchanged until next save. After one Update, disk file has new shape for that profile only; others remain legacy until edited.
17. **Mid-morph interruption**. From idle, click talking. While leg 1 (idle→thinking) is in flight (~halfway), click thinking. The composed morph aborts; the animator captures current values and lerps to thinking from there. No teleport, no double-fire of leg 2.
18. **Same-target click during morph**. From idle, click talking. Mid-morph, click talking again. No-op — the morph continues uninterrupted. (`intendedFinalState` already equals `talking`.)

---

## 11. Verification — pre-mortem

Imagine the implementation fails on the first attempt. Top three predicted failure modes:

1. **Migration corrupts existing profiles.** A subtle field rename or a default mismatch silently breaks 7 saved profiles. Mitigation: write `migrateLegacyProfile` as a pure function with unit-style coverage (a small fixture file with one legacy profile and the expected migrated output, checked at runtime via console assert during dev). Don't write back to disk on first read — only on next user-initiated save. That gives a chance to inspect.
2. **The flip at the Phase A → B boundary is visible.** If length isn't *exactly* `minBarLength` at the flip frame (rounding error, lerp interpolation, RAF dt skew), the bar will jump. Mitigation: in Phase A, the animator emits `sensitivity = 0` and `ambientWave = false` and zeroed wave amplitudes — the renderer's length math collapses to exactly `minBarLength` with no rounding window. At the flip, only `inwardRatio` and `anchor` change (anchor was already at `T` per the §4 commitment). Dev assertion at the flip: `assert(Math.abs(currentRenderedLength - bars.minBarLength) < 0.5, 'Phase A→B flip with non-min length')`. Logged once per flip event to avoid log spam.
3. **Morph progress tracking double-fires on rapid state changes.** User clicks Talking mid-morph from idle → thinking. The hook needs to handle interrupted morphs cleanly: capture current render values as the new start, retarget to the new state, restart morphT. Mitigation: explicit `morphPhase` state machine in the hook; on state change, transition the phase atomically and reset `morphT = 0`.

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

---

## 13. Open questions for the user

1. **Bar color shared or per-state?** Plan defaults to shared for v1. Confirm or override.
2. **Listening mirroring idle.** v1 ships listening as an exact mirror of idle (`idleListeningLinked = true` default). The "Break link" button is always available but unused for v1. Acceptable, or omit listening's panel entirely until a use case appears?
3. **`reactiveStartAt` location in the UI.** Plan puts it in a Morph subsection always visible in tune mode. Confirm.
4. **Composed transitions** (idle→talking direct). Plan composes them as two sequential morphs. Acceptable, or should clicking talking from idle skip thinking entirely and go through a single longer morph?

---

## 14. File-touch list

| File | Change |
|---|---|
| `src/projects/voiceinterface/radial-states/api.ts` | Schema refactor; `migrateLegacyProfile`; new defaults |
| `src/projects/voiceinterface/radial-states/useLinkedRadialAnimator.ts` | NEW — animator hook |
| `src/projects/voiceinterface/radial-states/index.tsx` | Tune-mode toggle; single-cell render path; controls panel additions; consume animator; ghost-bar fix; consume new schema |
| `src/projects/radial-waveform/variants/RadialBidirectional.tsx` | Add `barCount` prop destructure + use override |
| `radial-states-profiles.json` | Not modified by deploy; legacy profiles re-saved one-by-one as users edit them |

No new pages. No new API routes. No changes outside `voiceinterface/radial-states/` and one prop addition in `radial-waveform/variants/`.

---

## 15. Concept index

For a plan this size, listing every named concept and the section(s) where it's defined / referenced. (Maintained on every edit — see plan-review §1.)

| Concept | Defined in | Also referenced in |
|---|---|---|
| `RadialBars` block | §3 | §4, §6, §8a, §10 |
| `RadialStateSettings` | §3 | §6, §8a, §10 |
| `schemaVersion: 2` | §3 | §3 (migration) |
| `geometry.idleRadius` | §3 | §4, §8a |
| `idleListeningLinked` | §3 | §4 (transition matrix), §8a, §13 |
| `morph.idleToThinking` | §3 | §4, §8a, §10, §11 |
| `morph.thinkingToTalking` | §3 | §4, §5, §8a, §10 |
| `reactiveStartAt` | §3 | §4, §5, §8a, §10 (3, 6), §13 |
| Transition matrix | §4 | §10 |
| Phase A (translation) | §4 | §5, §10, §11 |
| Phase B (reactive-style) | §4 | §5, §10 |
| `inwardRatio` flip | §4 | §5, §11 |
| `useLinkedRadialAnimator` | §6 | §7, §8, §10, §14 |
| Adapter mapping | §6 | §7 |
| Pause semantics | §6 | (v1 unused in UI) |
| Tune mode | §8 | §8a, §10 (3), §14 |
| Controls panel reshape | §8a | §10 |
| `migrateLegacyProfile` | §3 | §11, §14 |
| Ghost-bar correction | §9 | §10 (10) |
