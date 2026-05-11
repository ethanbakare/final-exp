# Listening → Talking transition — diagnostic report

State as of revert commit `23d9a3b`. The animator file has been reverted to its state at `2245407`. No fix is in place for listening → talking; the original composed-through-thinking routing is what's running.

This document is **not a plan**. It's a record of what I tried, what the user observed in each attempt, and where my reasoning was wrong. Anyone (me, the user, or another agent) picking this up should read this first.

---

## What the user wants (from their messages)

1. When user clicks Talking while at Listening, the bars should make **one combined motion** that:
   - Damps from listening's reactive form toward thinking's fixed-min uniform shape, AND
   - Translates from outer ring (idleRadius) inward to talking position (talkingAnchor).
   - Both happen at the same time, not in sequence.
2. By the time the bars reach the talking anchor position, they should be at uniform min height and ready to flip into talking's outward reactive form.
3. After the flip, bars grow into talking's reactive shape (existing Phase B behavior — that part works).
4. Reverse (talking → listening) is currently working correctly. Do NOT touch it.

User's exact phrasing across messages:
> "while the bars are moving, they have to adjust all to one fixed height, like it does happen in thinking, but they're still in motion"
> "It's literally like doing the transformation to thinking in real time while it's moving"
> "If you can literally go from listening to thinking, it is possible to literally, whilst we're morphing into thinking, actually move the bars to get to talking. This is not a difficult thing to do. It's just happening all at once rather than in bits."
> "when you click on listening, and then you click on talking, it would literally try to start going towards the middle, to talking, as it is, without trying to morph to thinking in the process"

---

## How the system works

- Page: `/voiceinterface/radial-states` (radial-states, NOT realtime-states).
- Animator: `src/projects/voiceinterface/radial-states/useLinkedRadialAnimator.ts` returns `RadialRenderValues` (anchor, inwardRatio, minBarLength, maxBarLength, sensitivity, freezeAtMin, all wave/envelope params, smoothing, intensityOpacity) every animation frame.
- Renderer: `src/projects/radial-waveform/variants/RadialBidirectional.tsx` consumes those values per frame via a refs-based renderer. The renderer applies:
  1. Audio path: `value_raw = audioFrequency * sensitivity` (per bar).
  2. Wave block: adds `wave_n * waveAmplitude` to value (per bar, varies by angle and time).
  3. Envelope ceiling clamp.
  4. **Smoothing** (the critical part for these attempts): `value = prevValue + (newValue - prevValue) * (1 - smoothing)`. With `smoothing = 0.95` (typical), value catches up to raw at 5% per frame ≈ 30 frames to converge.
  5. Length = `minBarLength + value * (maxBarLength - minBarLength)`.
- `freezeAtMin: true` — renderer skips audio/wave/smoothing entirely, sets `value = 0`, zeros `prevValuesRef` on entering frame. Length = `minBarLength` exactly.

---

## Attempts and why each failed

### Attempt 0 — Original composed routing (commit `2a807df`, still in place after revert)

`listening → talking` routes through thinking as two sequential legs:
- Leg 1: `listening → thinking` damp (anchor stationary, reactive fades over `morph.idleToThinking`).
- Leg 2: `thinking → talking` morph (Phase A translation at frozen min, Phase B reactive ramp).

**What the user observed:** "We haven't made a route for us to go from listening to talking. We've only made a route for us to go from listening to thinking and then from thinking to talking. That is why we're having these issues."

**Why this was wrong:** sequential structure. Bars stop at thinking shape (frozen, no motion) at outer ring, THEN start moving inward. User wanted the damp and translation visible at the same time, not in bits.

### Attempt 1 (commit `611582d`) — Smoothing taper for the listening → thinking damp

Did not touch listening → talking specifically. Tapered smoothing toward 0 in the second half of any damp toward a frozen state, and added a similar taper to Phase B forward/reverse to fix a post-morph bloom on talking → idle.

**What the user observed:** still the same problem on listening → talking because the composed routing was unchanged. (This attempt was addressing a different complaint about the listening → thinking damp glitch.)

### Attempt 2 (commit `c167adc`) — Direct path; damp + translate in parallel over the full Phase A

Removed `nextLegFrom` routing for listening → talking (no more thinking intermediate). Phase A now ran damp + translate simultaneously over the full Phase A duration:
- Anchor lerped `start.anchor → talkingAnchor + minBarLength` from frame 1.
- Sensitivity, waveAmp, etc. lerped toward 0 over the full Phase A.
- minBarLength lerped from `start.minBarLength` to `morphPinLength`.
- `freezeAtMin` engaged only at `tA >= 0.9`.
- Renderer smoothing was NOT overridden (stayed at the profile's value, typically 0.95).

**What the user observed:** "I'm still experiencing the same issue. The bars retain listening's height while translating."

**Why this was wrong:** the animator's lerping was correct, but the renderer's smoothing (0.95) lagged the actual rendered length by ~30 frames. So even though `sensitivity` and `waveAmp` were lerping toward zero, the rendered bar lengths stayed near listening's heights for the first chunk of Phase A. Bars LOOKED like they were translating without damping.

### Attempt 3 (commit `ea6d10c`) — Damp compressed to first 30% of Phase A

Realized smoothing was the culprit, but addressed it by compressing the damp into the first 30% of Phase A:
- `tA ∈ [0, 0.3]`: damp — sensitivity, waveAmp, minBarLength, smoothing all lerp toward target/0 over this short window. `freezeAtMin = false`. Anchor lerping.
- `tA ∈ [0.3, 1]`: freeze + translate. `freezeAtMin = true`. Anchor lerping. Reactive params at 0.

Also fixed the "first-click routing" bug where `anim?.currentlyIn ?? targetState` defaulted to `targetState` on first click (when `animRef` was null), causing routing to fall through to simple-lerp instead of forward Phase A. Added `lastRequestedStateRef` to track previous state.

**What the user observed:** "Still the same issue. Reverse works but forward doesn't."

**Why this was wrong:** smoothing was still 0.95 in the renderer during the first 30%. Smoothing only tapered to 0 inside this short window. With 0.6s morph × 50% Phase A = 0.3s, the damp window was only 0.09s ≈ 5 frames. Smoothing couldn't drop fast enough in 5 frames to bring value down naturally; bars still showed listening's height. Then `freezeAtMin` snapped them to min at tA=0.3 mid-translation. Bars appeared to retain listening's height for the first chunk, then snap, then continue translating.

### Attempt 4 (commit `9137211`) — Override `smoothing = 0` throughout Phase A

Diagnosis: smoothing is the only thing hiding the damp. Set `smoothing = 0` for the entire Phase A so the audio/wave path responds instantly to the animator's lerping reactive params. As `sensitivity` and `waveAmp` drop linearly across Phase A, rendered bar lengths shrink on the same frame.

- Anchor lerps `start.anchor → talkingAnchor + minBarLength` over full Phase A.
- All reactive params lerp toward 0 over full Phase A.
- `smoothing = 0` always.
- `freezeAtMin` engages at `tA ≥ 0.95`.

**What the user observed:** "It didn't work. Reverse what you've done."

**Why this is presumably still wrong:** unclear at the time of revert. Plausible explanations I'd want to verify before any next attempt:
- (a) `smoothing = 0` makes the rendered value too jittery because raw audio noise comes through unfiltered. Bars might be visibly twitchy rather than smoothly damping.
- (b) The damp visible through the audio path requires audio to be ON. If the user was testing with audio muted, value_raw is 0 always; only the wave block contributes; with waveAmp lerping to 0 there'd be visible shrinking but maybe not in the way the user wants.
- (c) The damp curve (linear lerp of sensitivity/waveAmp) might be too gradual for the user to perceive as "transformation to thinking." Maybe they want bars to converge to min in the first 20-30% of Phase A and translate at uniform min for the rest.
- (d) Some interaction with the renderer's `prevValuesRef` not being reset on the smoothing=0 path causes residual values.
- (e) I never confirmed via direct visual observation that frame-by-frame the bars actually shrink. The animator logs showed the EMITTED values were correct, but I never verified what the renderer actually drew.

---

## What I have not done that I should have done before any further code changes

1. **Captured actual mid-morph frames as images and compared them side-by-side.** I have screenshots from the user but my own analysis was always log-driven. The animator's emitted values matched my intent. The disconnect between emitted-correct values and user-perceived behavior could be (a) renderer behavior I'm not modeling, (b) audio state I'm not accounting for (mute vs unmute), or (c) timing issues I'm assuming away. Without frame captures across the morph, I'm guessing.
2. **Verified what the renderer ACTUALLY draws per frame, not what the animator emits.** I instrumented the animator with logs (the `[anim]` console.log spam) but never confirmed by reading `prevValuesRef` or sampling the canvas pixels what the rendered length is per frame.
3. **Asked the user to record their screen showing the broken transition.** Their text descriptions were precise but ambiguous about the exact visual ("retain listening's height" could mean variable wave heights OR full reactive heights including audio reaction).
4. **Verified my assumption about smoothing being the dominant factor.** It might not be. There could be a different rendering issue I'm not seeing (e.g., `RadialBidirectional`'s `lineCap = round` extending bars past their endpoints, making short bars look longer; or `intensityOpacity` affecting visible length perception; or the canvas size / rendering being subtly wrong).
5. **Checked if Tonic's actual saved profile has values that interact unexpectedly with my code paths.** Tonic has `idle.maxBarLength = 40` (same as talking's). If something is computing `lerp(start.maxBarLength, target.maxBarLength, t)` and getting 40 throughout, that's a different shape than I assumed.
6. **Watched reverse and forward side-by-side to identify the actual visual difference.** I theorized why reverse works (anchor stationary during fade), but never confirmed by direct observation that reverse's bars look correctly uniform-min during translation.

---

## What I'd want before the next attempt

1. The user's screen recording (10 seconds, listening → talking transition) so I can see frame-by-frame what's actually broken.
2. The audio state during their testing (mute vs unmute). The animator behaves identically either way, but the renderer's output is very different.
3. A specific moment-in-time description of what's wrong: "at 30% through the morph, the bars should look like X, but they look like Y."
4. A targeted instrumentation: dump `RadialBidirectional`'s `prevValuesRef` to console per frame and check whether actual rendered lengths match what the animator emitted.
5. The user's confirmation of which profile they're testing on (Tonic vs Default vs Primordial thicker) — different profiles have different morph timings, smoothing values, and max/min ranges that change the visible behavior.

---

## Concrete state of the code as of revert (`23d9a3b`)

- `useLinkedRadialAnimator.ts`: at state `2245407` (original composed-routing structure with `nextLegFrom('listening', 'talking') = 'thinking'` intermediate).
- listening → talking is composed: leg 1 (listening → thinking damp) followed by leg 2 (thinking → talking Phase A + B). User has already said this structure doesn't match their spec but it's what's running now.
- Reverse (talking → listening) is the working reverse path, untouched.
- All my dirty-state fixes (`handleUpdate`, `handleRenameCommit`) are still in place — they're in `index.tsx`, unrelated to the animator.

---

## What this report is for

For the next attempt at this fix — by me or by anyone else — to start with my mistakes documented rather than repeat them. The user has been patient through four attempts; the next one needs ground-truth visual data, not theory.
