# Handoff — 2026-04-26

Long session. Three major workstreams landed: **the kill-switch architecture (planned, reviewed twice, implemented across AI Confidence + ClipStream + Trace)**, **a navbar-slot mic permission UI for the showcase chrome (desktop + mobile)**, and **a brand-new `/demo-showcase/showcase/democomponents` page** for reviewing every showcase UI component in isolation.

The Trace `Try Demo` rendering bug (wrong component) was fixed mid-session via a `TraceCore` extraction. The TraceSim mid-viewport width bug was also fixed.

---

## 1. Kill-switch architecture — planned, reviewed, implemented

### Document
[docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md](docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md) went through three rounds of reviewer feedback. Final shape:

- **Three rules**: showcase owns activation/deactivation; project owns release of active resources + rejection of stale completions; durable product state stays untouched.
- **Two-layer architecture**:
  - **Layer 1 (universal)**: `useActiveAbortSignal`, `useRunId`, `abortUtils`, `cancelSignal?: AbortSignal` prop contract, abort-listener composition rule, "invoke product's existing cancel path" operational rule.
  - **Layer 2 (per-project adapter)**: each demo wires its own teardown — bodies differ, shape identical (one effect, one abort listener, one cleanup return).
- **Per-project state-classification table** — explicit durable vs session-ephemeral classification per project. ClipStream's pending clips / IndexedDB / zustand contents called out as durable.
- **Capture-at-start runId discipline** — covers late callbacks (`MediaRecorder.onstop`, IndexedDB `onsuccess`, queued promise residue) that AbortSignal can't reach. Three rounds of review caught a bug where I wrote `myRun = runIdRef.current` *inside* the late callback (tautology); the fix is to capture at attach-time so the closure carries the run-id.
- **Render-time-swap fix** in both `useActiveAbortSignal` and `useRunId` — previous draft did the swap in an effect, leaving a one-render window where consumers saw a stale aborted signal / unbumped runId on reactivation.

### What's implemented

**Phase 1a — Layer 1 primitives** ([commit `fbdaa5d`](#))
- [src/projects/demo-showcase/hooks/useActiveAbortSignal.ts](src/projects/demo-showcase/hooks/useActiveAbortSignal.ts)
- [src/projects/demo-showcase/hooks/useRunId.ts](src/projects/demo-showcase/hooks/useRunId.ts)
- [src/projects/demo-showcase/hooks/abortUtils.ts](src/projects/demo-showcase/hooks/abortUtils.ts) (`onAbort`, `composeAbortSignals`)

**Phase 1b — AI Confidence wiring** ([commit `9fb5e80`](#))
- `useAudioRecording(runIdRef?)` — captures runId at startRecording, guards `mediaRecorder.onstop` closure
- `useDeepgramProcessing(cancelSignal?, runIdRef?)` — `signal: cancelSignal` into transcribe fetch; AbortError swallowed; runId guards every post-await write
- `useSpeechConfidenceState({cancelSignal?, runIdRef?})` — abort-listener invokes `stopRecording()` + `resetState()`
- `SpeechConfidenceProvider` accepts both props
- `AIConfidenceDemo` forwards them
- Showcase: `useActiveAbortSignal(activeIdx === 0 && isDemoMode)` + `useRunId(...)` passed in

**Phase 1c — ClipStream plumbing (4 steps, all in `65fd7cb`)**
1. `useClipRecording(externalSignal?)` — composes external signal with the per-call 30s timeout `AbortController` inside `transcribeRecording`. AbortError differentiation: external-cancel bails silently (no retry); timeout still triggers existing retry pipeline.
2. ClipMasterScreen's two `/api/clipperstream/format-text` fetches — added `signal:` arg (originally took none).
3. ClipMasterScreen accepts `cancelSignal?` prop. `abortControllerRef` lazy-inits at render-time so it's never null at fetch sites and self-replaces after each abort. Effect listens for external abort and invokes the existing `handleCloseClick` cancel path. **Does NOT touch zustand store, IndexedDB, or `useAutoRetry`** — see KILL-SWITCH-ARCHITECTURE.md §2.3.
4. ClipStreamSim forwards `cancelSignal` to ClipMasterScreen.
- Showcase: `useActiveAbortSignal(activeIdx === 2)` — no `isDemoMode` gate (sim slot mounts the real product directly).

**Phase 2 — Trace** ([commit `6c78533`](#) is the right one; `90a91b9` was the wrong-component first attempt)
- Trace's interactive surface lives in [src/projects/trace/components/TraceCore.tsx](src/projects/trace/components/TraceCore.tsx) (extracted from `/trace/index.tsx`).
- Both standalone `/trace` and `TraceDemo` render `<TraceCore />`. Same UI everywhere.
- Kill-switch wired in TraceCore: `signal: cancelSignal` on both `/api/trace/parse-voice` and `/api/trace/parse-receipt` fetches; runId guards on every post-await; abort listener invokes the existing `handleCancelRecording` X-button path. localStorage `trace-expense-entries` is durable — explicitly not touched.

### `[DEMO-SHOWCASE]` markers
Every kill-switch addition inside product source files has `[DEMO-SHOWCASE]` tags so a future porter can `grep -rn '\[DEMO-SHOWCASE\]' src/projects/` and delete cleanly. File-top porting notes with checklists in:
- TraceCore.tsx
- SpeechConfidenceHooks.ts
- useClipRecording.ts
- ClipMasterScreen.tsx

The new mic-banner files (`ShowcaseNavbarMicBanner.tsx`, `ShowcaseNavbarMicBannerSmall.tsx`) and the showcase `index.tsx` mic-banner wiring still need a marker pass — that's Stage 4, not done yet.

### What's NOT implemented (kill-switch)
- **Manual mic-required acceptance scenarios** — listed in KILL-SWITCH-ARCHITECTURE.md "Testing strategy". Browser automation can't grant mic permission; user needs to manually walk through swipe-during-record / swipe-during-fetch / offline-reconnect. These are gating tests but pending.
- **Voice Interface** — entirely deferred from showcase project list; kill-switch will be wired when Voice ships.

---

## 2. Mic permission navbar swap — Stages 1, 2, 3 done

The `MicPermissionBanner` uses `position: fixed; top: 24px` of the viewport. On `/trace` standalone that's fine (no chrome to overlap). On `/demo-showcase` the showcase navbar pill ALSO sits at top of viewport — the banner overlaps and becomes a barely-visible "black ball under the navbar" at desktop widths. The fix is to suppress the floating banner inside the showcase context and replace the project pill with a navbar-slot mic-permission UI.

### Stage 1 ([commit `21e0837`](#))
- TraceCore accepts `hideMicBanner?: boolean` prop. When true, suppresses `<MicPermissionBanner />`.
- TraceDemo passes `hideMicBanner={true}`.
- `/trace` standalone unchanged (banner still floats).

### Stage 2 — Desktop navbar mic banner ([commits `15d81e0`, `5ecb5cb`, `1d54baa`, `57d2821`, `9729ee8`](#))
- New: [src/projects/demo-showcase/components/ui/ShowcaseNavbarMicBanner.tsx](src/projects/demo-showcase/components/ui/ShowcaseNavbarMicBanner.tsx)
- **Crucial design decision after multiple rebuilds**: the OUTER pill chrome (light tan, max-width 668, padding 8, border-radius 20, inset shadow) stays IDENTICAL to `ShowcaseNavbarCompact`. Only the INNER content swaps per state. The pill geometry is constant across all four states (granted, unknown, dismissed, blocked) so the navbar visually "stays the same shape" and only its contents change.
- `unknown` state: title "Demo requires microphone access" left + Enable (white) / Not now (dark) buttons right. Buttons sized like `arrow-btn` (35px, content-fit width).
- `dismissed` state: small orange "Enable Mic" centred inside the same tan outer pill (sized like the project counter / arrow buttons — NOT a full-pill takeover, that was the wrong attempt).
- `blocked` state: title + X dismiss.
- Inset shadow on the outer pill across all three states (matches the granted pill).
- Project config gained `needsMic?: boolean`. AI Confidence and Trace true; ClipStream omits.
- Showcase: `showMicInNavbar = isDemoMode && active.needsMic && (micState === 'unknown' || 'dismissed' || 'blocked')`. Lifted `useMicPermission` to the showcase component so navbar swap and any future consumer share one hook instance.

### Stage 3 — Mobile compact variant ([commit `e48e634`](#))
- New: [src/projects/demo-showcase/components/ui/ShowcaseNavbarMicBannerSmall.tsx](src/projects/demo-showcase/components/ui/ShowcaseNavbarMicBannerSmall.tsx)
- Sister to `ShowcaseNavbarCompactSmall` — same outer dimensions (padding 6, border-radius 14, F7F6F2 bg, inset shadow), OpenRunde 500 / 12px font, ~25px button heights.
- Shortened copy so it fits alongside the X close button: "Mic access needed", "Enable", "Not now", "Mic access denied".
- Wired into the showcase's `nav-mobile` slot via the same `showMicInNavbar` predicate.

### What's NOT done (mic banner)
- **Stage 4** — `[DEMO-SHOWCASE]` marker pass on the new mobile mic banner files + showcase mobile-slot wiring. The desktop variant's wiring already has markers; the mobile equivalents don't yet.
- The existing `MicPermissionBanner` from new-home still floats unchanged on `/trace` standalone — that's intentional (banner works correctly there).

---

## 3. Components review page — `/demo-showcase/showcase/democomponents`

Brand new route: [src/pages/demo-showcase/showcase/democomponents.tsx](src/pages/demo-showcase/showcase/democomponents.tsx). Mirrors the convention from `/pages/voiceinterface/showcase/voicecomponent.tsx` — white page bg, subtle dark cell borders, faded uppercase labels at the bottom of each cell.

Renders 14 cells across 6 sections:
- Top Navbar — Desktop: granted (project pill) + 3 mic banner states
- Top Navbar — Mobile: small project pill + close button + 3 small mic banner states
- CTA Buttons — Desktop: Try Demo, Play Simulation, View Case Study
- CTA Buttons — Mobile: corresponding *Small variants
- Demo Intro Card: headline only + headline-with-suffix (canvas backdrop)
- Demo Progress: default + transparent (canvas backdrop)

### GridBox — orthogonal `width` × `stretch` props ([commit `d1d4211`](#))
The GridBox has two independent layout knobs:
- **`width`** — fixed cell width in px, OR omit for fluid (100% of grid). Fluid is what makes the navbar cells respond to viewport width like production. Fixed is for atomic components shown at a specific size.
- **`stretch`** — when true, content area is column-flex with `align-items: stretch` so children fill cell width. Used for navbar variants and the mobile project pill (which has `width: 100%` in its own CSS but needs a parent that gives it room). Default false = flex-centred (atomic components stay at natural size).

The previous attempts with `:global(.top-navbar-compact)` overrides were patches and got removed — these props are the structural fix.

`canvasBackdrop` prop also exists for components designed to layer over the showcase canvas (DemoIntroCard, DemoProgressSection) — provides the tan canvas-tinted bg + `.demoCanvasRoot` className so the `--demo-*` CSS variables resolve.

### Key dimensions
- Desktop navbar cells: fluid (claim full row), height 100, content stretches to fill. At viewport 990 → cell 908, wrap 875, pill 668 (capped). Same proportions as live `/demo-showcase`.
- Mobile pill cell: fixed 360px, stretch=true. Wrap and pill both fill at 327 (after the new 16px cell padding). Matches mobile production proportions.
- 16px horizontal padding inside the cell content area so children don't touch the cell border ([commit `1195822`](#)).

---

## 4. Smaller fixes worth knowing

- **TraceSim mid-viewport width fix** ([commit `cc9a0d4`](#)) — at viewports between 640 and 768 the TraceSim's text-box was filling its slot via `width: 100% !important`, making the sim card ~2× wider than the demo card. Added `max-width: 320px !important` (calculated as 288 / 0.9 to match the demo's visual width post-scale-factor difference between `.layer-sim` 0.9 and `.layer-demo` 0.8).
- **Trace clear button portal** ([commit `7c8268c`](#)) — the trash button portals out of `trace-demo-wrapper` into the parent `.canvas-content` and is absolute-positioned bottom-right via `createPortal`. Original `.clear-button-below` is hidden via `display: none`. Click forwards to the hidden original via ref. Standalone `/trace` page unaffected.

---

## ⚠ Known stubs / open work

1. **Stage 4 — `[DEMO-SHOWCASE]` markers** on the new mic banner files:
   - `ShowcaseNavbarMicBannerSmall.tsx` (new — has no markers yet)
   - The mobile-slot wiring inside `/pages/demo-showcase/index.tsx` (also recent — has no markers yet)
   - Sanity-check that all stage-2/3 additions in `/pages/demo-showcase/index.tsx` (PROJECTS array `needsMic`, `useMicPermission` lift, `showMicInNavbar`, the conditional render) all have `[DEMO-SHOWCASE]` tags
2. **Manual mic-required acceptance tests** for kill-switch — listed in KILL-SWITCH-ARCHITECTURE.md "Testing strategy". Pending user walkthrough.
3. **Voice Interface kill-switch** — entirely deferred, pending Voice landing in the showcase.
4. **`transcribeAudio` stub** still 400ing in `VoiceTextBoxClip.tsx` (carried over from earlier sessions).

---

## Quick tour

| File | Why you'd open it |
|---|---|
| [docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md](docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md) | The architecture document |
| [/pages/demo-showcase/index.tsx](src/pages/demo-showcase/index.tsx) | Showcase carousel — kill-switch wiring + mic banner conditional |
| [/pages/demo-showcase/showcase/democomponents.tsx](src/pages/demo-showcase/showcase/democomponents.tsx) | Components-in-isolation review page |
| [TraceCore.tsx](src/projects/trace/components/TraceCore.tsx) | The actual Trace interactive surface (used by both `/trace` and `TraceDemo`) |
| [TraceDemo.tsx](src/projects/demo-showcase/components/demos/TraceDemo.tsx) | Showcase wrapper for Trace; portals trash button |
| [ShowcaseNavbarMicBanner.tsx](src/projects/demo-showcase/components/ui/ShowcaseNavbarMicBanner.tsx) | Desktop navbar mic banner (3 states) |
| [ShowcaseNavbarMicBannerSmall.tsx](src/projects/demo-showcase/components/ui/ShowcaseNavbarMicBannerSmall.tsx) | Mobile navbar mic banner (3 states) |
| [useActiveAbortSignal.ts](src/projects/demo-showcase/hooks/useActiveAbortSignal.ts) / [useRunId.ts](src/projects/demo-showcase/hooks/useRunId.ts) / [abortUtils.ts](src/projects/demo-showcase/hooks/abortUtils.ts) | Kill-switch Layer 1 primitives |

## Recent commits (this session, newest first)

```
1195822 fix(democomponents): inner cell padding so content doesn't touch edges
e48e634 feat(demo-showcase): mobile compact variant of navbar mic banner (Stage 3)
d1d4211 refactor(democomponents): orthogonal width/stretch props, fix mobile pill hug
7fe098a fix(showcase/democomponents): match navbar widths to live /demo-showcase exactly
e468947 Revert "fix(showcase/components): cell widths match production navbar wrapper"
b503bdd fix(showcase/components): cell widths match production navbar wrapper
522fe44 fix(showcase/components): white bg + proper cell dimensions + mobile pill at native width
0f61bab refactor(showcase/components): rebuild against trace/new-home pattern
3cda313 feat(demo-showcase): components page at /demo-showcase/showcase/components
9729ee8 fix(ShowcaseNavbarMicBanner): apply inset shadow to all states
57d2821 fix(ShowcaseNavbarMicBanner): restore inset shadow on outer pill in dismissed state
1d54baa fix(ShowcaseNavbarMicBanner): dismissed state — orange pill INSIDE the tan chrome
5ecb5cb refactor(ShowcaseNavbarMicBanner): rebuild against navbar pill chrome (Stage 2)
15d81e0 feat(demo-showcase): navbar-slot mic banner — desktop only (Stage 2)
21e0837 feat(TraceCore): suppress in-card MicPermissionBanner in showcase (Stage 1)
7c8268c feat(TraceDemo): portal clear button to canvas bottom-right
cc9a0d4 fix(TraceSim): cap text-box max-width so it doesn't fill mid-range viewports
6c78533 fix(demo-showcase): Trace 'Try Demo' renders the real product + DEMO-SHOWCASE markers
65fd7cb feat(kill-switch): wire ClipStream into kill-switch contract
9fb5e80 feat(kill-switch): wire AI Confidence demo into kill-switch contract
fbdaa5d feat(kill-switch): add Layer 1 primitives — useActiveAbortSignal, useRunId, abortUtils
```

---

## Suggested next moves

1. **Stage 4 marker pass** (~15 min) — `grep -L '\[DEMO-SHOWCASE\]' src/projects/demo-showcase/components/ui/ShowcaseNavbarMicBannerSmall.tsx src/pages/demo-showcase/index.tsx`, add file-top porting notes + inline tags on the kill-switch / mic-banner code in those two files.
2. **Manual mic-required acceptance tests** — walk through the scenarios in KILL-SWITCH-ARCHITECTURE.md "Testing strategy" with a real microphone. The critical ones: AI Confidence swipe-during-record, ClipStream offline-reconnect (record offline → swipe to AI Confidence → reconnect → swipe back → pending clip processes).
3. When **Voice Interface** lands in the showcase: build a `VoiceDemo` wrapper, wire kill-switch using the `composeAbortSignals` pattern (Voice already has its own internal `AbortController`s), set `needsMic: true` on the project config.
