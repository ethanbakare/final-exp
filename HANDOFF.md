# Handoff — 2026-04-19

Picking up where this session left off. Two pieces of work in flight: one shipped, one queued. Plus a known stub to undo when the API comes back.

---

## What shipped this session

### `VoiceTextBoxClip` — full Clip-style voice card
Built from variation 1 in 7 phases. Now live in two places:

- **Showcase**: `src/pages/voiceinterface/showcase/voicecomponent-clip.tsx` — runs in `simulate` mode for the demo loop.
- **Homepage Clipstream card**: `src/projects/new-home/components/previews/PreviewClipstream.tsx` — replaced the old static SVG mock. Same 393×160 footprint.

Component file: [VoiceTextBoxClip.tsx](src/projects/voiceinterface/components/VoiceTextBoxClip.tsx).

**Simulate mode auto-loop** (driven by a single `useEffect` on `[simulate, appState]`):

| Phase | Duration | What plays |
|---|---|---|
| `idle` | 1s | "Tap to speak" placeholder |
| `recording` | 3s | Music-driven waveform (BufferSource at 8s mark of `Naruto__Animal_I_have_become.mp3`), ticking timer, X close button |
| `processing` | ~1.2s | Bars freeze at last frame, spinner replaces red dot |
| `complete` | **4s** | Sample text reveals word-by-word (white on dark), trash button on left |
| → loop | | back to idle |

**Sample lines** (cycled in order, then loop):
1. "I'm Ethan. I build voice tools that survive bad networks."
2. "This demo records and transcribes — online or offline."
3. "Recordings queue locally, then sync the moment you reconnect."
4. "Most voice apps die without internet. This one doesn't."
5. "On a plane or in a tunnel, the transcript catches up later."
6. "Web Audio, Service Workers, IndexedDB — all in the browser."

Buttons render but onClick is `undefined` in simulate mode — the loop is the sole driver.

### `ClipLinearWaveform` — profile-driven bar styling
Path: [ClipLinearWaveform.tsx](src/projects/voiceinterface/components/ui/ClipLinearWaveform.tsx).

- Hardcoded Lure preset replaced with a runtime fetch of a **named profile** ("Clip") from `/api/studio-profiles?variant=linear-waveform`
- Polls every 2s while document is visible + refetches on `visibilitychange` and window `focus` so live edits in the playground (`/voiceinterface/linear-waveform/lab`) reflect in the card within ~2s
- Falls back to a built-in `LURE_FALLBACK` constant if fetch fails / profile renamed
- New profile entry added at the bottom of [linear-waveform-profiles.json](linear-waveform-profiles.json) — currently a verbatim Lure clone, ready for tuning

**Workflow for tuning the bars**: open `/voiceinterface/linear-waveform/lab`, select **Clip** from the dropdown, adjust `barWidth` / `barGap` / `barRadius` / `sensitivity` etc, click Update — the showcase + homepage card pick it up within ~2s.

### Bug fixes on the way
- **Text colors** — `.dimmed-text` / `.result-text` / `.old-text` / `.static-text` / `.animated-word` all hardcoded `var(--VoiceDarkGrey_30/90)` for variation 1's cream card. Overrode each in clip's scope to white / 30% white. Variation 1 untouched.
- **Gap balance** — added `padding-left: 4px` to `.right-cluster` so the visible gap on either side of the waveform reads even (left side was wider because of the close-icon's centring inside its 34×34 hit-target + waveform fade-edges).
- **Waveform freeze on `processing`** — was scrolling because the parent kept passing the last `Uint8Array` and `LinearWaveform` was re-pushing it to history every `updateRate` ms. Fix: null out `freqData` when `isActive` flips false.
- **Bottom fade-overlay only on overflow** — was always-on, dimming the bottom of any 2-line transcript. Now opacity 0 by default; `is-active` toggled by a `ResizeObserver`+polling effect that compares `scrollHeight > clientHeight`.

### Other
- **Ollama moodboard cycle**: trimmed blank tail from ~2.8s to ~1.5s. Total cycle 12s → 10.7s. Stack/hold/unstack absolute durations unchanged (every keyframe % rescaled by 12/10.7). File: [ollama.module.css](src/projects/ollama/styles/ollama.module.css) lines ~390–510.

---

## ⏳ Pending — AI Confidence Tracker preview auto-loop

The user wants the same playbook as Clipstream applied to `PreviewAIConfidence` ([file](src/projects/new-home/components/previews/PreviewAIConfidence.tsx)):

> "There's nothing technically wrong with it, but it's static. It's not animated; it animates once and that's it. We need to make sure we can get that several times."

**Critical constraint**: the homepage card crops the transcript box (positioned `right: -186px, bottom: -76px`, size 687×272). Visible from the crop is roughly the **top-left quadrant** — text line + highlight underlines + active-word focus area. The nav-bar, badges, and model-copy footer are clipped off, so the loop has to dramatize meaningfully through just the visible text region.

**Plan I drafted (not yet acted on, awaiting decisions)**:
1. Build looping component in a lab page (either new `/pages/ai-confidence-tracker/looper.tsx` or extend the existing `simulation.tsx` with a `?loop=1` mode). State cycle: `initial` → `recording` → `processing` → `results` → `clear` → loop. Total ~8s/cycle.
2. Verify in lab (highlights animate in, active-word focus pulses, no flicker on reset).
3. Wire into `PreviewAIConfidence` via a `simulate` prop, same pattern as `VoiceTextBoxClip`.
4. Verify on `/new-home` cropped view.

**Open decisions**:
- Sample variety — stick with "The quick brown fox..." every cycle, or rotate 3-4 sentences (e.g. include "Worcestershire wardens whisper weird wishes" from `simulation.tsx`)?
- Lab page — new file vs extend `simulation.tsx`?
- Animate during the rec/proc phase too, or only the results-state highlight reveal?

Existing simulation lives at [simulation.tsx](src/pages/ai-confidence-tracker/simulation.tsx). The full state machine is already there — needs an auto-driver wrapper similar to the `useEffect` in `VoiceTextBoxClip`.

---

## ⚠ Known stub — `transcribeAudio`

`/api/voice-interface/transcribe` was returning **400** when this session started. To unblock the demo, `transcribeAudio` in `VoiceTextBoxClip.tsx` is currently stubbed:

```ts
// Simulate ~1.2s of network/transcription latency, abortable.
await new Promise<void>((resolve, reject) => {
  const id = setTimeout(resolve, 1200);
  signal.addEventListener('abort', () => { ... });
});
const newText = SAMPLE_LINES[sampleIndexRef.current % SAMPLE_LINES.length];
```

When the endpoint is fixed, swap the `setTimeout`/SAMPLE_LINES branch back for the original `fetch('/api/voice-interface/transcribe', {...})`. The call-site signature is unchanged, so this is a one-block edit. Original code is in `git log` / commit `6a4d228`.

The `SAMPLE_LINES` array can stay — it's cheap to keep around and useful for offline / dev runs.

---

## Quick tour for next session

| File | Why you'd open it |
|---|---|
| [VoiceTextBoxClip.tsx](src/projects/voiceinterface/components/VoiceTextBoxClip.tsx) | The card. State machine, simulate loop, sample lines, all card styling. |
| [ClipLinearWaveform.tsx](src/projects/voiceinterface/components/ui/ClipLinearWaveform.tsx) | Waveform wrapper. Profile fetch, polling, AudioContext lifecycle. |
| [linear-waveform-profiles.json](linear-waveform-profiles.json) | "Clip" profile lives at the bottom. Edit via the playground, not by hand. |
| [voicemorphing-clip.tsx](src/projects/voiceinterface/components/ui/voicemorphing-clip.tsx) | Three button morphs (record / left-slot / timer). Has Emil press-squash + blur crossfade primitives. |
| [PreviewClipstream.tsx](src/projects/new-home/components/previews/PreviewClipstream.tsx) | Tiny 30-line homepage wrapper around `VoiceTextBoxClip simulate`. |
| [PreviewAIConfidence.tsx](src/projects/new-home/components/previews/PreviewAIConfidence.tsx) | The next thing to loop. |
| [simulation.tsx](src/pages/ai-confidence-tracker/simulation.tsx) | Full AI tracker state machine — copy the auto-driver pattern here. |
| [voicecomponent-clip.tsx](src/pages/voiceinterface/showcase/voicecomponent-clip.tsx) | Showcase page for the clip card with `simulate`. |

Recent commit history:
```
641d348 fix(ollama): trim moodboard blank tail 2.8s -> 1.5s
42fe40c feat(VoiceTextBoxClip): replace placeholder samples with Clipperstream story
363bd91 fix(VoiceTextBoxClip): bump complete linger 3.5s -> 4s
f474b1b fix(VoiceTextBoxClip): bump complete-state linger 2s -> 3.5s
7e76bbf feat(homepage): swap PreviewClipstream static SVG mock for live VoiceTextBoxClip
03452c2 fix(VoiceTextBoxClip): only show bottom fade-overlay when transcript overflows
47950ae feat(ClipLinearWaveform): drive bar styling from named "Clip" profile
a99f59a feat(VoiceTextBoxClip): drive simulate waveform from sample track
caacfd7 feat(VoiceTextBoxClip): simulate-mode auto-loop + balance right-cluster gap
b601ac8 / 9cdaa04 fix: white text colors for dark card
6a4d228 fix(VoiceTextBoxClip): stub transcribeAudio with sample text
5d3af26 fix(ClipLinearWaveform): freeze bars on processing by nulling freqData
65e4cbd Phase 5 — Lure linear waveform in middle slot
5df786c Phase 4 — fade text area during rec/proc
db77fa9 Phase 2 — wire full nav-pill to variation 1 handlers
77b0610 Phase 1 — nav-pill container styling
```

---

## Lessons logged this session

- **VoiceTextBatch ships dark-grey colors hardcoded on `.dimmed-text`/`.result-text`/`.old-text`/`.static-text`/`.animated-word`** — fine on variation 1's cream card, invisible on the dark Clip card. Any new dark-mode card needs to override all five inside the `.text-box .voice-text-content` scope.
- **`MediaRecorder.start()` errors on an OscillatorNode-driven `MediaStream`** — `NotSupportedError` because the codec doesn't match. Test waveforms on a synthetic stream WITHOUT recording. Real mic + Naruto sample-buffer both work.
- **Don't mutate React-managed DOM via `eval`** — `innerHTML` writes leave React's virtual DOM out of sync and the next reconciliation throws `removeChild ... not a child of this node`. Read-only inspection only; for write tests, reload after.
- **`AudioBuffer` is portable across `AudioContext`s** — decode once, replay through fresh contexts each cycle.
- **Polling beats websockets here** — the playground → showcase live-edit workflow needs ~2s freshness, not realtime. 2s polling + visibilitychange refetch is enough and dead-simple.
