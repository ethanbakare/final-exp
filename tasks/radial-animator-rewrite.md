# Radial animator rewrite — plan

## Why rewrite, not patch (attempt #5)

Four patches to `useLinkedRadialAnimator.ts` did not fix listening → talking. The structure of that animator is the root cause. Specific structural problems:

1. **One `morphT` clock drives all properties.** Anchor, sensitivity, waveAmplitude, etc. all advance at the same rate within a single leg. We cannot independently tune "damp finishes faster than translation completes".
2. **`morphStart` is captured once at leg start.** Per-property current-value is not preserved across leg boundaries — leg 2 captures from leg 1's emitted frame as a single snapshot, creating opportunities for snap.
3. **Discrete flips (`freezeAtMin`, `inwardRatio`) are gated on phase progress (`tA`), not on actual property values.** Phase B sets `inwardRatio = 0` and `anchor = talkingAnchor` at the moment `t` crosses `reactiveStartAt`, but anchor's Phase A target was `talkingAnchor + morphPinLength`, so there is a hard `morphPinLength`-px anchor jump at the Phase A→B boundary.
4. **Composed transitions are two sequential legs with a hard boundary.** Leg 1 must run to `t ≥ 1` before leg 2 starts. Leg 2 captures a fresh `morphStart` from leg 1's end frame. If anything is off in that handoff, snap.

Coral's approach (see `CoralRealtimeBlob.tsx`'s `useEasedNumber`) avoids all four by using **independent per-property eased values**. Each property holds (current, target, fromValue, startTime, duration) and lerps independently. Re-targeting mid-animation snaps `fromValue` to the current eased value — no leg-boundary snap is possible.

## New animator: per-property eased values + small phase scheduler

### Per-property primitive

```ts
interface EasedNum {
  current: number;
  fromValue: number;
  target: number;
  startMs: number;
  duration: number; // seconds
}

retarget(e, newTarget, newDuration, nowMs): // fromValue = e.current (capture from where we are NOW), restart clock
step(e, nowMs): // advance current toward target with linear lerp
```

One `EasedNum` per lerpable property: `anchor`, `minBarLength`, `maxBarLength`, `sensitivity`, `waveAmplitude`, `waveEnvelope`, `envelopeAmplitude`, `smoothing`.

Discrete properties (`inwardRatio`, `freezeAtMin`, `ambientWave`, `waveMode`, `waveShape`, etc.) are latched on the animator state and updated discretely at phase boundaries or by derived rules.

### Phase scheduler

Phases: `'rest' | 'forwardA' | 'forwardB' | 'reverseA' | 'reverseB' | 'simple'`.

On state change, decide which phase to enter based on current anchor position + `inwardRatio` + target state. Each phase entry sets per-property `(target, duration)` pairs. The RAF loop advances all eased values each frame and transitions to the next phase when the phase's longest duration completes.

### Forward (listening/idle → talking) — Phase A

Damp + translate in parallel, **damp finishes before translation**:

| Property | Target | Duration |
|---|---|---|
| `anchor` | `talkingAnchor + morphPinLength` | full A (`morph.thinkingToTalking`) |
| `minBarLength` | `thinking.minBarLength` (morphPin) | A × 0.5 |
| `sensitivity` | `0` | A × 0.5 |
| `waveAmplitude` | `0` | A × 0.5 |
| `waveEnvelope` | `0` | A × 0.5 |
| `envelopeAmplitude` | `0` | A × 0.5 |
| `smoothing` | `0` | A × 0.5 |
| `maxBarLength` | `talking.maxBarLength` | A |
| `inwardRatio` | latched at `1` | — |
| `freezeAtMin` | flips to `true` at ~50% of A (when damp is done) | — |

By tA = 0.5: all reactive amplitudes at 0, smoothing at 0 (renderer prevValues catch up instantly), minBarLength at morphPin, anchor halfway translated. Bars look like thinking shape and are halfway to talking anchor.

By tA = 1.0: anchor at `talkingAnchor + morphPin`. Bars uniform-min, ready to flip.

### Forward — Flip + Phase B

At Phase A complete: anchor snaps from `talkingAnchor + morphPin` to `talkingAnchor`, `inwardRatio` flips 1→0. These are same pixels (with inward=1 and bar length=morphPin starting at outer edge `talkingAnchor + morphPin`, vs with inward=0 starting at inner edge `talkingAnchor`). No visible jump.

Phase B (`reactiveStartAt` portion of A): retarget all reactive props from 0 → talking's values over `A × (1 - reactiveStartAt)`. Bars grow into talking's reactive shape.

### Reverse (talking → listening/idle) — preserves existing behavior

Reverse is currently working in production. Mirror it via two phases:

**reverseA** (damp at inner ring):
- `anchor` stays at `talkingAnchor` for duration `A × (1 - reactiveStartAt)`.
- Reactive props decay to 0 over `A × 0.5` (damp finishes first).
- `inwardRatio` stays `0`.

**reverseB** (flip + translate outward):
- Anchor snaps from `talkingAnchor` to `talkingAnchor + morphPin`, `inwardRatio` flips 0→1.
- Anchor retargets to target's `idleRadius`, reactive props ramp to target rest, over `A × reactiveStartAt`.

### Simple (everything else)

`idle ↔ listening`, `idle/listening ↔ thinking`, `talking ↔ thinking` (with reverse traversal for talking→thinking).

Single phase: retarget all properties to target state's resting values, duration = `morph.idleToThinking`. No phase machine.

### Why this fixes listening → talking

- No `morphStart` capture: each property's `fromValue` is its current value at the moment a phase begins. If a phase change happens mid-frame, properties pick up smoothly from where they are.
- Damp completes by tA = 0.5 because we use a shorter duration on those properties. Anchor continues translating to tA = 1.0. **No "retain listening's shape while translating" because the reactive amplitudes have already gone to 0 by the time the anchor is halfway in.**
- The Phase A→B anchor flip is at the same pixel position (anchor + morphPin with inward=1 → anchor with inward=0), so it's invisible.
- Composed routing via thinking is gone — replaced by per-property timing inside Phase A.

## Rollout — staged commits

### Stage 0: Plan doc (this file)
Commit message: `docs(radial-states): plan for animator rewrite`
Revert: not needed; doc only.

### Stage 1: Build new animator alongside the old
Create `src/projects/voiceinterface/radial-states/useRadialAnimatorV2.ts`. Old animator untouched. Page still wired to old animator.
Commit message: `feat(radial-states): add V2 animator (per-property eased values, parallel-tuned forward Phase A)`
Revert: drop the new file; nothing else changes.

### Stage 2: Swap the page to V2
Change one import in `index.tsx`:
```ts
- import { useLinkedRadialAnimator } from './useLinkedRadialAnimator';
+ import { useRadialAnimatorV2 as useLinkedRadialAnimator } from './useRadialAnimatorV2';
```
Test all six transitions:
- idle ↔ listening (~no-op)
- listening → thinking ✓
- thinking → talking ✓
- talking → listening ✓ (currently working — must not regress)
- talking → thinking ✓
- **listening → talking** (the bug; expect parallel damp + translate with no snap)

Commit message: `feat(radial-states): switch to V2 animator`
Revert: `git revert HEAD` reverts the import; old animator and V2 both still in tree.

### Stage 3: Delete old animator
Once Stage 2 is confirmed visually across all six transitions, remove `useLinkedRadialAnimator.ts`, move V2 → that filename, drop the rename alias.
Commit message: `chore(radial-states): remove V1 animator after V2 swap`
Revert: only after this commit, full revert chain is Stage 3 → Stage 2 → Stage 1.

## Out of scope for this rewrite

- Mid-morph interruption (clicking Talking while listening→thinking is partway through). The per-property re-targeting model naturally handles this gracefully (current value becomes new fromValue), but I'm not changing the existing interruption rules.
- The `lastRequestedStateRef` first-click bug (separate concern, present in V1).
- Profile data changes — no JSON edits.
