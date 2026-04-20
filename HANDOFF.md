# Handoff — 2026-04-20

Picking up where this session left off. Two major workstreams completed: Clipstream layout fix and AI Confidence Tracker preview loop. Both are live on the homepage.

---

## What shipped this session

### Clipstream layout fix
`PreviewClipstream` was rendering incorrectly on the homepage — red record button missing, waveform not adapting, no padding. Root cause: absolute-positioned children gave the morph container `min-content = 0`, causing the wrong flex slot to collapse.

Fix in [VoiceTextBoxClip.tsx](src/projects/voiceinterface/components/VoiceTextBoxClip.tsx):
- `flex-shrink: 0` on `.clip-left-morph` and `.clip-record-morph`
- `min-width: 0` on `.waveform-slot`
- `flex-shrink: 0` on `.right-cluster`
- 16px padding added to [PreviewClipstream.tsx](src/projects/new-home/components/previews/PreviewClipstream.tsx)

---

### AI Confidence Tracker — looper lab page
New page at [looper.tsx](src/pages/ai-confidence-tracker/looper.tsx). Three sections:

1. **Homepage animation** — exact `PreviewAIConfidence` at real card dimensions (574×321 desktop, fluid mobile). Replay button + auto every 5s checkbox. Both tied to same `replayKey`.
2. **Transcript card (standalone)** — inner white card (687×272) fully exposed, no pink bg, no cropping. Same animation sequence (delayed `activeWord`). Interactive hover on highlights.
3. **Full looper (auto)** — `SimulatedCard` cycling initial → recording → processing → results. Phase + timing readout. Uses Worcestershire sentence.

---

### `PreviewAIConfidence` — full auto-loop
[PreviewAIConfidence.tsx](src/projects/new-home/components/previews/PreviewAIConfidence.tsx) is now fully animated on the homepage.

**State machine** (auto-driver `useEffect` on `[state]`):

| Phase | Duration | What shows |
|---|---|---|
| `idle` | 3s | *"Record something: AI flags every word it may have misheard."* |
| `recording` | 2s | *"Recording in progress..."* with animated dots |
| `processing` | 1.5s | *"Checking confidence..."* with animated dots |
| `results` | 5s | Transcript with underlines animating in, tooltip fires at 2.2s |

**Cross-fade**: 200ms fade-out → content swap → 200ms fade-in between states.

**Animation order fix**: `activeWordId` starts `null` on mount; set to `ACTIVE_WORD_ID` after 2200ms so underline draws before background fill appears.

**Preview text**: `"Warchester's warden's whisper weird wishes"`
- wordId 0 = low confidence, 30% (Warchester's — intentionally wrong spelling)
- wordId 1 = medium confidence, 75% (warden's)
- `ACTIVE_WORD_ID = 0`

**Color fix**: `--darkGrey40` is scoped to `.container` in `ai-tracker.module.css` — not global. Hardcoded `rgba(94, 94, 94, 0.4)` directly in styled-jsx to match `TranscriptTextStates`.

---

### UX copy — agreed and shipped
All idle/initial states across the component family now read:
> *"Record something: AI flags every word it may have misheard."*

Updated in both:
- `PreviewAIConfidence` (homepage)
- [transcript-text-states.tsx](src/projects/ai-confidence-tracker/components/ui/transcript-text-states.tsx) (full app)

Copy rationale: "Record something" = instruction. "AI flags every word it may have misheard" = outcome. "Misheard" is precise — AI transcribed *something*, just possibly the wrong word. Not "missed" (omission) and not "confidence" (technical jargon).

---

## ⚠ Known stub — `transcribeAudio`
Still stubbed. `/api/voice-interface/transcribe` was returning 400. When fixed, swap the `setTimeout`/SAMPLE_LINES branch in `VoiceTextBoxClip.tsx` back for the original `fetch`. Original code in `git log` commit `6a4d228`.

---

## Lessons logged this session

- **`--darkGrey40` and other CSS vars in `ai-tracker.module.css` are scoped to `.container`** — not globally available. Components that don't apply `styles.container` must hardcode the literal value.
- **`right: -Xpx` positioning**: `right: -186px` means the right edge of the element is 186px PAST the right edge of the container — not 186px from the right. Box left = `container_width + 186 - box_width`.
- **Homepage card dimensions**: `card-ai-confidence` = `grid-column: 1 / span 2` in `repeat(4, 282px)` with 10px gap = **574px wide × 321px tall**. Visible slice of the transcript box = top-left ~501×196px.
- **`min-content: 0` trap**: absolutely positioned children contribute 0 to intrinsic width. Any flex child whose children are all `position: absolute` will collapse to 0 without `flex-shrink: 0`.

---

## Quick tour

| File | Why you'd open it |
|---|---|
| [PreviewAIConfidence.tsx](src/projects/new-home/components/previews/PreviewAIConfidence.tsx) | The homepage loop. State machine, copy, timing, color, highlights. |
| [looper.tsx](src/pages/ai-confidence-tracker/looper.tsx) | Lab page. Three sections: homepage preview, standalone card, full looper. |
| [transcript-text-states.tsx](src/projects/ai-confidence-tracker/components/ui/transcript-text-states.tsx) | App idle copy updated here too. |
| [VoiceTextBoxClip.tsx](src/projects/voiceinterface/components/VoiceTextBoxClip.tsx) | Clip voice card. Flex layout fix here. `transcribeAudio` stub here. |
| [PreviewClipstream.tsx](src/projects/new-home/components/previews/PreviewClipstream.tsx) | Tiny wrapper — padding fix here. |

Recent commits:
```
c86c01e fix(PreviewAIConfidence): hardcode rgba(94,94,94,0.4) — darkGrey40 scoped to .container
863060d fix(TranscriptTextStates): update initial copy to match agreed UX copy
3f4b72d fix(PreviewAIConfidence): match color and animated dots to TranscriptTextStates
845b435 feat(PreviewAIConfidence): add auto-loop state machine with UX copy per phase
3afb2c0 fix(ai-confidence): delay focus-highlight after underline, fix standalone card sizing and loop
fb967af feat(looper): add standalone transcript card section for direct interaction
64485bc fix(looper): make homepage preview card responsive with min(574px, 100%)
ac47261 fix(looper): correct homepage card dimensions to 574x321
aa3d9bd feat(ai-confidence-tracker): add homepage PreviewAIConfidence to looper lab
84dbd52 docs: refresh HANDOFF.md for previous session
```
