# Handoff — 2026-04-25

Picking up where this session left off. Two big workstreams shipped: **the demo-canvas-lab → demo-showcase port** (lab patterns now live on the real `/demo-showcase` page) and **a dedicated ClipStreamSim** for the ClipStream slot. Plus a documented but **not-yet-implemented** AbortSignal kill-switch architecture for cancellation across demos.

---

## What shipped this session

### 1. Lab → Production port (demo-canvas-lab → /demo-showcase)
The entire layout + mobile polish proven in the lab now runs on `/demo-showcase`. Lab page kept untouched at `/demo-canvas-lab`.

Three projects wired:
- **AI Confidence tracker** (idx 0) — full sim + demo (`AIConfidenceSim` + `AIConfidenceDemo`), warm-brown tint, headline with desktop-only suffix " in what it heard"
- **Trace** (idx 1) — `TraceSim` only; inline demo not yet built
- **ClipStream** (idx 2) — `ClipStreamSim` (new, see below); inline demo not yet built

Voice Interface is **deferred entirely** — not yet "inline-demo-ready".

Mobile polish ported: app-shell body lock (no iOS PTR), close-btn slide-in + CTA collapse on demo mode (`.is-demo`), `scale(0.9)` sim / `scale(0.8)` demo on mobile, edge-to-edge transparent progress + full-width nav pill, small CTA variants with animated label swap + blur crossfade, intro card `headlineSuffix` (desktop-only tail), transcript-bar single-line legend in results state, `touch-action: none !important` on canvas-motion, Framer Motion spring carousel.

### 2. ClipStreamSim — dedicated wrapper
New file: [ClipStreamSim.tsx](src/projects/demo-showcase/components/simulations/ClipStreamSim.tsx). Sister to `AIConfidenceSim` / `TraceSim` — same interface (`onLoopRestart?` prop + exported `CLIPSTREAM_SIM_DURATION`). Renders `ClipMasterScreen` with:
- **Hydration gate** (useEffect + mounted flag) — mirrors what `/clipperstream` does for SSR-unsafe internals (zustand rehydration, mic, audio storage)
- **`SimErrorBoundary`** — local crash surface so a `ClipMasterScreen` error doesn't blank the whole showcase

All ClipStream-specific size/shape adjustments live as **scoped `:global()` CSS overrides** on the wrapper. Critical: `/clipperstream` source is **untouched**. Three live overrides:

| Override | Value | Scope |
|---|---|---|
| `.master-screen` height | **852 → 652** | desktop |
| `transform: scale(0.8)` | wrapper-level | both breakpoints |
| `.master-screen` border-radius | **0 → 16px** | mobile |

Reverted/abandoned along the way: width reduction (393→314), record-bar 15% shrink, desktop radius 8→16. Settled on `scale(0.8)` instead which shrinks everything uniformly.

### 3. Kill-switch architecture plan (NOT IMPLEMENTED)
Reference doc at [docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md](docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md). Detailed plan for an `AbortSignal`-based cancellation contract across demos, so swiping during an in-flight async op (recording, transcribe fetch, mic stream) cleanly aborts without leaking results into the now-inactive demo.

Proposed primitive (in plan, not built):
```ts
function useActiveAbortSignal(isActive: boolean): AbortSignal {
  // returns a signal that aborts when isActive flips false,
  // fresh AbortController on next isActive=true
}
```

Demos opt in via optional `cancelSignal?: AbortSignal` prop. Standalone demos work as before; in showcase they get the signal and abort cleanly. Phases laid out in the doc — recommend starting with `AIConfidenceDemo` since it has the most async surface.

### 4. Smaller fixes worth knowing
- **`offset*` instead of `getBoundingClientRect()`** in [deepUIcomponents.tsx](src/projects/ai-confidence-tracker/components/ui/deepUIcomponents.tsx:446) for underline measurement — fixes underline positioning under transformed ancestors (was breaking at scale(0.9) on mobile).
- **DRY headline** — `DemoIntroCard` accepts optional `headlineSuffix` (CSS-hidden on mobile) instead of duplicating cards. Single DOM element, full text in DOM for screen readers.
- **Record-button jitter on Brave iOS** — `.clip-record-morph` got `contain: paint` + `will-change: transform`; removed `filter: blur` from layer crossfade (replaced with opacity-only). Layer isolation prevents canvas-neighbour repaints from coupling.
- **iOS audio context** — both `createFakeStream` (in `VoiceTextBoxClip`) and `ClipLinearWaveform` now use a fire-and-forget resume() pattern (NOT awaited — WebKit can hang). Gesture + visibilitychange listeners resume on next interaction / tab return.
- **Transcript-bar on mobile in results state** — microcopy `display: none`, legend reflows row + `align-self: flex-end` to anchor at the same baseline as the microcopy was. No card jump between states.

---

## Architectural patterns established this session

These are now the conventions for any future work:

1. **Mobile variants are sibling components, not media-query overrides.** `ShowcaseNavbarCompactSmall`, `ShowcaseButtonsSmall`, `DemoProgressSectionTransparent`, `ShowcaseCloseBtnSmall` all sit alongside their desktop versions; the lab/showcase swaps via CSS `display: none` on wrapper class (not JS viewport detection). Real layout savings, not transform: scale.

2. **App-shell layout** for full-bleed pages: `.lab` / `.showcase` use `position: fixed; inset: 0; overflow: hidden; overscroll-behavior: none` PLUS a mounted-time body/html lock via useEffect. Restores prior body state on unmount so other scrollable pages still work. This is what kills iOS pull-to-refresh + rubber-band properly.

3. **Project showcase isolation: never edit project source for showcase customization.** Use scoped `:global()` overrides via styled-jsx wrapper class. ClipStreamSim demonstrates this — three CSS overrides, zero edits to `src/projects/clipperstream/**`.

4. **Use `offset*` properties for measurement-driven layout, not `getBoundingClientRect()`.** GBCR returns post-transform screen pixels; if you then apply those values as CSS inside a transformed ancestor, the value gets scaled twice. `offsetLeft/offsetTop/offsetWidth` are layout-space and round-trip cleanly through transforms.

5. **Don't bake `transform: scale()` into layout decisions.** Use it for micro-interactions (`:active`, `:hover`). For "smaller on mobile," resize via real dimensions (sibling component or CSS values) so getBoundingClientRect, hit-testing, and sub-component math all work correctly. Exception: ClipStreamSim uses `scale(0.8)` deliberately as a visual experiment because we don't want to fork ClipMasterScreen.

6. **CSS module classes (not styled-jsx) for components wrapped in framer-motion.** `motion.button` strips styled-jsx's scope class on the root, so `<style jsx>` selectors miss. CSS modules are unaffected. (Hit this on `ShowcaseButtonsSmall` — bug discovered, fixed by moving to CSS module.)

---

## ⚠ Known stubs / open work

1. **Trace inline demo** — only sim wired in showcase; demo not built. When it lands, slot in like AIConfidence: `<TraceDemo />` next to `<TraceSim />` inside `activeIdx === 1` block.
2. **ClipStream inline demo** — not built either. Same plug-in pattern when ready.
3. **Voice Interface** — entirely deferred; not in showcase project list yet.
4. **AbortSignal kill-switch** — see plan doc; pick when ready. Recommend starting with `AIConfidenceDemo` since its `transcribeAudio` stub is the most likely leak point.
5. **`transcribeAudio` stub** still returning 400 (carried over from prior session). When fixed, swap the `setTimeout`/SAMPLE_LINES branch in `VoiceTextBoxClip.tsx` back for the original `fetch`. Original code in commit `6a4d228`.

---

## Quick tour

| File | Why you'd open it |
|---|---|
| [/pages/demo-showcase/index.tsx](src/pages/demo-showcase/index.tsx) | The production showcase page — 3 projects, full mobile polish |
| [/pages/demo-canvas-lab.tsx](src/pages/demo-canvas-lab.tsx) | Scratchpad/lab — kept around for future iterations |
| [ClipStreamSim.tsx](src/projects/demo-showcase/components/simulations/ClipStreamSim.tsx) | ClipStream-specific overrides; pattern for future per-project sims |
| [ShowcaseNavbarCompactSmall.tsx](src/projects/demo-showcase/components/ui/ShowcaseNavbarCompactSmall.tsx) | Mobile navbar — 0.7× baked-in dimensions |
| [ShowcaseButtonsSmall.tsx](src/projects/demo-showcase/components/ui/ShowcaseButtonsSmall.tsx) | Mobile CTAs — animated label swap with blur crossfade |
| [ShowcaseCloseBtnSmall.tsx](src/projects/demo-showcase/components/ui/ShowcaseCloseBtnSmall.tsx) | X button shown in mobile demo mode |
| [DemoProgressSectionTransparent.tsx](src/projects/demo-showcase/components/ui/DemoProgressSectionTransparent.tsx) | Mobile edge-to-edge progress |
| [DemoIntroCard.tsx](src/projects/demo-showcase/components/ui/DemoIntroCard.tsx) | Headline pill — accepts `headlineSuffix` (desktop-only tail) |
| [transcript-bar.tsx](src/projects/ai-confidence-tracker/components/ui/transcript-bar.tsx) | Single-line legend in results state on mobile |
| [docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md](docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md) | The pending AbortSignal plan |

## Recent commits (this session)

```
2fabddb style(ClipStreamSim): round master-screen corners on mobile too
8c4e828 style(ClipStreamSim): transform scale(0.8) on the whole frame (experiment)
c4f1749 style(ClipStreamSim): shrink master-screen 852 -> 652 on desktop
2020064 feat(demo-showcase): dedicated ClipStreamSim component
8d7f050 feat(demo-showcase): port ClipMasterScreen into ClipStream slot
491728d style(demo-showcase): ClipStream uses warm pink variation (from lab)
3dce800 feat(demo-showcase): port lab layout + mobile polish to production page
c7b9dc2 docs(demo-showcase): kill-switch architecture plan (AbortSignal pattern)
da32816 style(ai-confidence): pin legend to bottom of reserved bar slot on mobile
f3c9f3d fix(ai-confidence): add min-height 38px to transcript-bar on mobile
b383978 style(ai-confidence): legend renders as single row on mobile in results state
d1c418b refactor(ai-confidence): simplify mobile results state to just microcopy hide
9a89d82 feat(ai-confidence): hide microcopy in results state on mobile
a1d0935 fix(ai-confidence): use offset* instead of GBCR for underline position math
34a0413 feat(demo-canvas-lab): demo-mode adds X close btn + collapses CTA (mobile)
2e1d77a style(ShowcaseButtonsSmall): stacked-absolute label crossfade with blur
a7c4525 fix(ShowcaseButtonsSmall): move styles to CSS module — styled-jsx broke motion.button
17f94b0 feat(demo-canvas-lab): wire ShowcaseNavbarCompactSmall on mobile
93af6fc feat(demo-showcase): ShowcaseNavbarCompactSmall component
06f6669 feat(demo-canvas-lab): wire DemoProgressSectionTransparent on mobile
587168c fix(clip): architectural fixes for WebKit jitter + iOS audio suspension
a4e1c2d fix(demo-canvas-lab): lock body + html on mount to kill iOS pull-to-refresh
7f9a752 fix(demo-canvas-lab): app-shell layout to disable mobile PTR + overscroll
```

---

## Suggested next moves

1. **Implement the AbortSignal kill-switch** (see plan doc). Start with `AIConfidenceDemo` — add `cancelSignal?` prop, wire into transcribe fetch + mic teardown. Validate with a fast swipe-during-recording test.
2. **Build inline demos** for Trace and ClipStream when ready. Same pattern: a `TraceDemo` / `ClipStreamDemo` component sibling to the sim, wired in the `activeIdx === N` block.
3. **Tune ClipStream visuals** — the warm pink variation + 0.8 scale + 16px corners is a starting point. May want sim-specific phone bezel, status bar, etc. once the inline demo lands.
