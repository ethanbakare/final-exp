# Listening → Talking morph — fix plan

## How the system works (your question)

This is the **radial-states** review page (`/voiceinterface/radial-states`), not the realtime-states one. The animator lives in `src/projects/voiceinterface/radial-states/useLinkedRadialAnimator.ts` and drives a single `RadialBidirectional` renderer in tune mode.

Four states:
- `idle` — silent at outer ring, bars short (e.g. min=3), inward-going.
- `listening` — same shape as idle, but audio-reactive. Currently linked to idle by default.
- `thinking` — bars at outer ring, frozen at a fixed min height (e.g. 12). No audio, no wave.
- `talking` — bars at inner ring (radius ~94), going *outward*, audio-reactive.

The natural state progression in production is `idle → listening → thinking → talking → idle`. Each pair has a well-defined transition:

| Pair | Visual |
|---|---|
| listening → thinking | Bars at outer ring damp from varying heights to uniform fixed-min. No translation. |
| thinking → talking | Bars at outer ring (uniform fixed-min) translate inward to inner ring while staying at min. Then flip to outward and grow into reactive talking. |
| talking → listening | Reverse of above. |

## Why "listening → talking" should work as one combined motion

Your point is correct and the implementation should reflect it: **damp-to-thinking and translate-to-talking are independent**, and there is no reason they can't happen at the same time. The system can:

- Reduce reactive amplitude (sensitivity, wave) → bars converge toward fixed-min height.
- Translate anchor from outer ring (134) inward → bars slide toward talking position.
- Both can lerp on the same morph clock, simultaneously.

The end state of the combined motion: bars at `talkingAnchor + min`, uniform min height, frozen. Then flip + reactive ramp into talking (Phase B).

## Why my last two attempts didn't deliver this

### Attempt 1 (route through thinking — composed leg structure)
Built it as two sequential legs: `listening → thinking` damp first, then `thinking → talking` morph. Bars stopped at thinking shape, then started moving. That's the "in bits" structure you rejected.

### Attempt 2 (direct path with damp compressed to first 30% of Phase A)
Made it a single leg. Damp + translate in the same Phase A. But the damp was invisible for the first 30% because the renderer's `smoothing = 0.95` (Tonic's value) means value lags raw input by ~30 frames. So even though `sensitivity` and `waveAmp` were lerping toward zero, the rendered bar lengths stayed at listening's heights for the first portion. Bars APPEARED to translate without damping.

When `freezeAtMin = true` engaged at `tA = 0.3`, bars then snapped to uniform min mid-translation. Still wrong.

## The actual fix

Damp + translate are simultaneous and BOTH visible. The smoothing lag is what's hiding the damp. So:

**Override `smoothing` to 0 throughout Phase A.** With no smoothing, the audio/wave path responds instantly to the animator's lerping reactive params. As `sensitivity` and `waveAmp` lerp toward 0, the rendered value shrinks **on the same frame** — bars visibly shrink in real time as the morph progresses, while the anchor is translating.

Specifically, in forward Phase A (any non-talking → talking):

```
For tA ∈ [0, 1]:
  anchor       = lerp(start.anchor, talkingAnchor + morphPinLength, tA)
  inwardRatio  = 1
  minBarLength = lerp(start.minBarLength, morphPinLength, tA)
  sensitivity  = lerp(start.sensitivity, 0, tA)
  waveAmplitude = lerp(start.waveAmplitude, 0, tA)
  waveEnvelope  = lerp(start.waveEnvelope, 0, tA)
  envelopeAmplitude = lerp(start.envelopeAmplitude, 0, tA)
  ambientWave  = (tA < 0.95) ? start.ambientWave : false
  smoothing    = 0        ← key change; no rendering lag
  freezeAtMin  = (tA >= 0.95)  ← engages only at the very end
```

What the user sees:
- **Frame 1**: bars at listening's full reactive form, anchor at idleRadius (134).
- **Frames 1 → ~50% of Phase A**: bars visibly shrink (peaks drop fast because waveAmp is dropping; smoothing isn't holding them up anymore) while anchor slides inward. Damp and translate happening together.
- **~50% → end of Phase A**: bars near uniform min, still translating.
- **End of Phase A**: bars at `[talkingAnchor, talkingAnchor + min]`, frozen, uniform min.
- **Flip** (invisible — same pixels at flip moment).
- **Phase B**: bars grow into talking's reactive form (existing Phase B behavior, unchanged).

Reverse direction (talking → listening) is already working. Won't touch it.

## What changes in code

Single function: `computeMorphFrame` in `useLinkedRadialAnimator.ts`. Specifically the forward branch (lines ~277–321). Replace the current split-into-damp-portion-and-translate-portion logic with a single linear Phase A that lerps everything in parallel and overrides `smoothing = 0` throughout.

That's the entire change. No routing changes, no state-management changes, no renderer changes.

## Why this is "common sense" as you said

- Damp and translate are independent properties of the morph.
- They run on the same morph clock.
- The only reason they LOOKED sequential was that smoothing was hiding the damp.
- Remove smoothing during the morph → damp becomes visible alongside translation.

## What I want confirmed before coding

1. Override `smoothing = 0` during forward Phase A — confirm OK. (Renderer will be more responsive to audio/wave during the morph; that's the whole point so the damp shows visually.)
2. `freezeAtMin` engages at `tA = 0.95` (last 5% of Phase A) just to guarantee exact min length at the flip moment. The 5% window is enough for the renderer to clamp without a visible snap because reactive params are already near 0. OK?
3. No change to reverse path. OK?
4. No change to state-change handler / routing. OK?

If all four are OK, I'll code it. If you want to change any, tell me.
