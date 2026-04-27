# Handoff — 2026-04-27 session

Very long extended session. Six major workstreams shipped end-to-end. One pre-existing bug fixed (mobile mic banner). Two new skill-doc artefacts dropped (`/remove-bg`, plus the rebg toolchain outside the repo). All work is in a known-good state.

---

## TL;DR by status

| ✅ Shipped and verified | 📚 New skills / tooling | 🐛 Fixed |
|---|---|---|
| ClipStream sim — full scripted rebuild per spec | `/remove-bg` slash command (`~/.claude/commands/remove-bg.md`) | Mobile mic banner stretch (pre-existing from Apr 23) |
| Trace ClearButton dormant-state pattern | `~/Documents/projects/rembg-tools/` venv + pipeline script | |
| Trace mobile -160px height compaction | `docs/trace/CLEAR-BUTTON-DORMANT-STATE.md` plan | |
| Receipt cleanup — 4 cleaned PNGs + WebP thumbnails | `docs/trace/RECEIPT-PICKER-MODAL.md` plan (16 sections) | |
| Trace sample-receipt picker (7-commit chain) | | |
| ClipStream narrative headline (dynamic dark pill) | | |

---

## 1. ClipStream sim rebuild — SHIPPED ✅

The big one this session. Replaces the broken `bb03044` rewrite with a clean scripted simulation built from a 16-section spec.

### Plan-driven workflow established

This was the first big thing this session, and set the pattern for every subsequent piece of work: write a plan doc, take reviewer feedback, patch the doc until it's implementable cold, then execute.

[docs/demo-showcase/CLIPSTREAM-SIM-REBUILD-SPEC.md](docs/demo-showcase/CLIPSTREAM-SIM-REBUILD-SPEC.md) — the full spec. 14 sections covering goal, scope, ClipStream architecture rules, what went wrong with the old rewrite, snapshot-based state model (`SimSnapshot` + `SimStep`), 11-step loop contract, sizing rules with explicit dimension-stickiness (§7.4), reuse policy, acceptance criteria, implementation plan, and a "Showcase Narrative Headline" section (§14) covering the dynamic dark-pill behavior.

### Implementation

Reset → rebuild → tweak → polish, in this order:

- `5d98091` — reset `ClipStreamSim.tsx` to pre-`bb03044` thin passthrough so the showcase kept working between commits
- `864be71` — full scripted simulation per spec (snapshot model, 11-step loop, persistent tray, scripted mock receipts, etc.)
- `27838ec` — proper clip title ("Lock that thought in") + longer offline/read beats
- `1c3b660` — bumped `online-transcribing` spinner from 1.3s to 2.5s
- Total loop: ~16.3s

### Dynamic narrative headline (the dark-pill swap)

The user-visible "voice notes that work offline" pill above the phone-frame turns dark and changes copy during the offline-recording / online-transcribing beats — making the differentiating story scannable at a glance, not buried in a tiny in-phone "Offline" indicator.

- `aad4a95` — dynamic narrative headline feature (data flow + per-step copy + dark variant)
- `dd8ca1e` — Emil-style blur-mask on the headline swap (`docs/skills/emil-design-eng.md` consulted)
- `88a4044` — extended "Back online" to span the transcribed-read step too (~5s window instead of glitch-feeling 2s)
- `9b98eed` — fixed wrong-color intermediate frame: dropped slow background/color transitions so swap is fully masked under blur

Per-step mapping:
- Steps 1, 6-9 → `default` ("Voice notes that work offline", light pill)
- Steps 2-4 → `recording-offline` ("Recording while offline", dark pill `#252525`)
- Steps 4.5-5-6 → `back-online` ("Back online", dark pill)

The architecture: ClipStreamSim emits a `ClipStreamNarrative` value via `onNarrativeChange`; the showcase tracks `clipStreamNarrative` state and overrides the `DemoIntroCard` headline + dark variant accordingly. Same display copy stays in the showcase chrome; sim only emits structured state.

### Reviewer pattern from this session

Both the ClipStream rebuild spec and the receipt-picker spec went through a reviewer-feedback loop. Pattern: write plan → reviewer pushes back → patch plan → reviewer signs off → execute. This pattern is now part of how big work flows here.

---

## 2. Trace ClearButton dormant state — SHIPPED ✅

First structural-fix-not-patch this session. `[CLEAR-BUTTON-DORMANT-STATE.md](docs/trace/CLEAR-BUTTON-DORMANT-STATE.md)` plan + `0e309b0` implementation.

### The rule

```ts
const isClearDisabled = entries.length === 0 || navbarState !== 'idle';
```

Single source of truth in TraceCore. When true:
- Visual: opacity 0.35, cursor `not-allowed`, `<button disabled>` for click-blocking
- Defense in depth: `requestClearAll` early-returns if disabled

### The structural shape

This established the pattern that the receipt-picker also uses:
1. Derive once in TraceCore from local state
2. Honor the `disabled` prop already declared on `BaseButtonProps`
3. Add `:disabled` CSS that was missing
4. Propagate via render-slot signature: `renderClearButton: (req, isDisabled) => ReactNode`
5. TraceDemo's portal-rendered button reads the flag — single source of truth across all render paths

### Verified

Empty entries → button dormant. Recording / processing → button dormant. Idle with entries → button active. Identical behavior on standalone `/trace` and showcase TraceDemo.

---

## 3. Trace mobile compaction — SHIPPED ✅

`1f24a27` — `TraceSim` mobile gets an additional -80px on top of the desktop -80px (total -160px from native), because mobile chrome eats more vertical space. Sim text-box: 484px → 404px CSS / ~436px → ~364px visual at 0.9 scale.

Also `8c2c5b4` — TraceDemo mobile clear-button positioning fixed (20px → 8px corners on mobile).

Standalone `/trace` and TraceDemo desktop are unaffected by the sim height tweak.

---

## 4. Receipt cleanup pipeline — SHIPPED ✅

User had four phone-photos of receipts and wanted background-removed cutouts for an upload-preview UI.

### The tool

Installed [`rembg`](https://github.com/danielgatis/rembg) instead of the requested `backgroundremover` because rembg has better Apple Silicon wheels and doesn't require ffmpeg for image-only use.

**Toolchain location** (sibling of figma-mcp, OUTSIDE this repo):
- `~/Documents/projects/rembg-tools/.venv/` — Python 3.13 venv with `rembg[cpu]` + `Pillow`
- `~/Documents/projects/rembg-tools/clean-receipts.py` — pipeline script (EXIF auto-rotate + resize 1500px max edge + bg-remove via u2net + alpha matting + save PNG)
- `~/.u2net/u2net.onnx` — model file (~176 MB, downloaded on first run, cached system-wide)

### The cleaned assets

Originals were deleted after cleanup. Final state in `public/images/receipts-cutout/`:

| File | Receipt | Conditions captured | Final caption |
|---|---|---|---|
| tesco-1.png | Tesco 21/12/2024 £14.65 | Heavily crumpled | "Crumpled receipt — creases obscure some values." |
| tesco-2.png | Tesco 18/01/2025 £21.05 | Slight thermal-paper fade near footer | "Well-shot but slight fading near the footer." |
| tesco-3.png | Tesco 25/01/2025 £13.30 | Dim lighting + faded values | "Dimly lit receipt with fading values." |
| sainsburys.png | Sainsbury's 06/08/2022 £5.75 | Clean / well-lit / all values legible | "Clean shot — all values strongly visible." |

Plus four matching square WebP thumbnails (200×200, ~5 KB each) at `public/images/receipts-cutout/thumbs/` for the strip render.

### The skill — `/remove-bg`

`~/.claude/commands/remove-bg.md` — full slash-command skill. Captures: where the tool lives, the pipeline, exact CLI to run, troubleshooting table for common failure modes (light-on-light, edges-too-soft, edges-too-sharp, model-lost-subject, portrait subject), output format constraint (PNG, never WebP for Trace's API), recovery instructions if the venv or pipeline script is ever lost.

This skill is fully indexed by Claude Code and can be invoked via `/remove-bg` from any future session.

---

## 5. Trace sample-receipt picker — SHIPPED ✅ (7-commit chain)

The biggest single feature this session. Lets a user demo Trace upload without a real receipt photo on hand by picking from the four cleaned sample receipts.

### Plan first

[docs/trace/RECEIPT-PICKER-MODAL.md](docs/trace/RECEIPT-PICKER-MODAL.md) — 16-section plan, 2 reviewer rounds. Caught:
1. State-gating gap (second upload entrance needs the same gate as Clear)
2. Layout contradiction (claimed shared row but desktop diagrams said independent)
3. Tight-row math on mobile (~3px slack on 375px viewport)

The structural fix path: independent positioning (strip and Clear are separate portals; on mobile they share the same Y band; on desktop strip is centered + Clear stays bottom-right). Plus a brand-new live-update contract for the modal (`useSyncExternalStore` reading TraceCore's gate, since the captured ReactNode is otherwise frozen by ShowcaseModalContext).

### The 7 commits

1. `b4aefe1` — data + assets (4 WebP thumbnails + `sample-receipts.ts` + plan doc)
2. `fe1468a` — TraceCore refactor: extracted `processImageFile`, added `onRequestSamplePicker` + `renderSampleStrip` render-slot props with full §5 gating + `subscribeIsDisabled` external-store contract
3. `991cba1` — `SampleReceiptPickerModal` component (carousel + caption + page dots + Upload + X close, drag-swipe + arrow keys + click peeks navigation, `useSyncExternalStore` for live disabled state)
4. `dad4373` — TraceDemo wires `renderSampleStrip` to a portal-rendered strip on `.canvas-content`
5. `812f2f4` — TraceDemo wires `onRequestSamplePicker` to open the picker modal
6. `e6daef2` — Upload wire-up end-to-end: fetch PNG → wrap in File → close modal → `processImageFile` → real `/api/trace/parse-receipt` call → entry rendered
7. `82fd677` — Emil-style polish: `cubic-bezier(0.23, 1, 0.32, 1)` easing throughout, hover gated behind `@media (hover: hover) and (pointer: fine)`, strip thumbs lift on hover

### Verified end-to-end

Tesco-1 uploaded via the picker → Gemini parsed it → returned 7 line items totaling £14.65 (matching the actual printed total on the original photo). The pipeline doesn't know the difference between a sample upload and a phone-photo upload.

### Strip dimensions

The user later tweaked thumb sizes after the initial 80/64 → **44 desktop, 38 mobile** in `b23345e` — smaller / more discreet thumbnails that read as a quiet selector under the card.

### Caption refinements

`02cdbd3` + `433afac` — final caption set, grounded in what's actually visible in each receipt photo. Drop "different store" framing since it's not a parsing condition.

### What's NOT done — Phase 2

[Per spec §2](docs/trace/RECEIPT-PICKER-MODAL.md), the standalone `/trace` page integration is **deferred to a future round**. Render-slot props and `processImageFile` are already in place on TraceCore; phase 2 just needs to:
1. Render the thumbnail strip via `renderSampleStrip` with positioning appropriate for the standalone page (probably below the card, with the existing Clear button shifted to the side)
2. Wire `onRequestSamplePicker` to `TraceModalOverlay` instead of `ShowcaseModalContext`

That's a small follow-up — the architecture already supports both consumers.

---

## 6. Mobile mic banner stretch fix — SHIPPED ✅

Pre-existing bug (introduced Apr 23 in commit `3dce800`, four days before this session) where the mobile small mic banner sat at content width instead of filling the row next to the close button. Only visible when:
- Viewport ≤ 768px
- Demo project requires mic (Trace, AI Confidence)
- Demo mode active (Try Demo)
- Mic state ≠ granted

Fix in `8925675`: extended the existing `flex: 1 1 0` selector from `.top-navbar-compact-small` to also cover `.top-navbar-mic-small`. Both possible occupants of the slot now stretch identically. Verified at 375px mobile: banner measures 289px wide.

---

## 7. Other things touched this session

### TraceCore architecture pattern is now stable

Two render-slot pairs in place, both following the same shape:
- `onRequestClearAll` + `renderClearButton` (modal trigger + render slot)
- `onRequestSamplePicker` + `renderSampleStrip` (modal trigger + render slot)

If a third upload entrance or destructive-action gets added, copy this pattern. Single source of truth in TraceCore for derived disabled state, propagated through the render-slot signature.

### `processImageFile` is reusable

Any source of a `File` (sample receipt, future drag-and-drop, paste-from-clipboard, etc.) can run through `processImageFile` and behave identically to a navbar-Upload-button file picker. The API never sees the difference.

### Skill artefacts created

- `~/.claude/commands/remove-bg.md` — `/remove-bg` slash command for background removal
- The image-convert skill at `~/.claude/commands/image-convert.md` was already present and integrates with `/remove-bg` for the WebP thumbnail step

### Outstanding `useLayoutEffect` SSR warning

When visiting `/clipperstream/showcase/clipscreencomponents` (or any page that server-renders WaveClipper), Next.js logs a "useLayoutEffect does nothing on the server" warning. **Not new, not harmful** — the canvas effect's first line is `if (!canvas) return;` and `canvasRef.current` is null on server, so the effect body would no-op anyway. Standard fix is the `useIsomorphicLayoutEffect` two-line pattern (`typeof window !== 'undefined' ? useLayoutEffect : useEffect`). Not done because it's noise, not a bug. User was made aware; the user can decide if/when to silence.

---

## Quick tour for the next session

| File | Why you'd open it |
|---|---|
| [BACKLOG.md](BACKLOG.md) | Current parked work |
| [docs/trace/RECEIPT-PICKER-MODAL.md](docs/trace/RECEIPT-PICKER-MODAL.md) | Plan for the receipt picker — phase 2 (standalone `/trace`) is the natural follow-up |
| [docs/trace/CLEAR-BUTTON-DORMANT-STATE.md](docs/trace/CLEAR-BUTTON-DORMANT-STATE.md) | Reference for the dormant-state pattern when adding more destructive actions |
| [docs/demo-showcase/CLIPSTREAM-SIM-REBUILD-SPEC.md](docs/demo-showcase/CLIPSTREAM-SIM-REBUILD-SPEC.md) | Authoritative reference for the new sim — read §14 if anyone changes ClipStream's headline behavior |
| [src/projects/trace/components/TraceCore.tsx](src/projects/trace/components/TraceCore.tsx) | Now has render-slot pattern + state gating + extracted `processImageFile` |
| [src/projects/trace/components/ui/SampleReceiptPickerModal.tsx](src/projects/trace/components/ui/SampleReceiptPickerModal.tsx) | The picker modal — uses `useSyncExternalStore` for live disabled state |
| [src/projects/trace/data/sample-receipts.ts](src/projects/trace/data/sample-receipts.ts) | Single source of truth for sample receipts — edit captions here |
| `~/.claude/commands/remove-bg.md` | The `/remove-bg` skill — invoke when more receipts (or other objects) need cutting out |

## Suggested next moves

1. **Phase 2 of the receipt picker** — wire it into standalone `/trace`. Architecture already supports it; just need a `TraceModalOverlay`-based fallback for the picker. Probably 2-3 commits, no new architectural work.
2. **Optional: silence the useLayoutEffect SSR warning** with `useIsomorphicLayoutEffect` — two-line patch in `WaveClipper.tsx`.
3. **Optional: Phase 2 polish on `/demo-showcase`** — manual testing across mobile + desktop on different mic-permission paths now that the Apr 23 bug is fixed.
4. Carry-over from previous handoff:
   - `KILL-SWITCH-ARCHITECTURE.md` doc has stale references to pre-split ClipStream (~10 minutes of doc cleanup)
   - Voice Interface `/api/voice-interface/transcribe` 400 stub fix (still in backlog)
   - Manual mic-required acceptance tests for kill-switch (carry-over from earlier session)

## Commit log this session (newest → oldest)

```
b23345e tweak(TraceDemo): smaller sample-strip thumbs (80→44 desktop, 64→38 mobile)
433afac tweak(Trace): drop 'different store' from sainsburys caption
02cdbd3 tweak(Trace): refine sample-receipt captions to match real conditions
8925675 fix(showcase): mobile mic banner stretches to fill row width
82fd677 polish(Trace): Emil pass on sample-picker transitions (commit 7/7)
e6daef2 feat(Trace): wire sample-receipt upload end-to-end (commit 6/7)
812f2f4 feat(Trace): wire sample-picker modal trigger (commit 5/7)
dad4373 feat(Trace): TraceDemo renders sample-receipt strip (commit 4/7)
991cba1 feat(Trace): SampleReceiptPickerModal component (commit 3/7)
fe1468a feat(Trace): TraceCore exposes sample-picker render slots (commit 2/7)
b4aefe1 feat(Trace): sample receipts data + thumbnails (commit 1/7)
5a38cd1 assets(trace): add background-removed receipt cutouts for upload preview
0e309b0 feat(Trace): dormant ClearButton when nothing to clear or flow in flight
1f24a27 tweak(TraceSim): extra -80px height on mobile to free showcase chrome space
1ca8030 docs(HANDOFF): note Safari waveform false-start experiment
8c2c5b4 fix(TraceDemo): tighter clear-button positioning on mobile
1c3b660 tweak(ClipStreamSim): bump online-transcribing spinner to 2.5s
9b98eed fix(DemoIntroCard): drop background/color transitions so swap is fully masked
88a4044 tweak(ClipStreamSim): 'Back online' spans transcribed-read for ~5s
dd8ca1e polish(DemoIntroCard): blur-mask the headline swap per Emil
aad4a95 feat(demo-showcase): dynamic narrative headline for ClipStream sim
27838ec tweak(ClipStreamSim): proper clip title + longer offline/read beats
864be71 feat(ClipStreamSim): scripted offline→online loop per rebuild spec
5d98091 revert(ClipStreamSim): restore thin passthrough pre-rebuild
d913a4e docs(demo-showcase): ClipStreamSim rebuild spec
```

Plus four plan/skill artefacts that aren't commit-history-visible:
- `docs/trace/CLEAR-BUTTON-DORMANT-STATE.md`
- `docs/trace/RECEIPT-PICKER-MODAL.md`
- `~/.claude/commands/remove-bg.md` (slash command)
- `~/Documents/projects/rembg-tools/` (toolchain, outside repo)

---

## Process patterns established this session

These are how things flowed; worth carrying forward:

1. **Plan first for non-trivial work.** Both the ClipStream rebuild and the receipt picker were preceded by long plan docs that went through reviewer cycles before any code was written. The reviewer feedback caught real architectural gaps (state gating, layout contradictions, modal-content-stale-state issue). Plan docs live in `docs/<project>/`.

2. **Reviewer pushback is fair game.** Pushed back on a reviewer comment about the modal Upload button's gating ("technically correct, but the practical risk is low"); also pushed back on a reviewer's literal "same row" mobile layout requirement when it broke the math. User explicitly endorsed taking ownership and pushing back when warranted.

3. **Structural fix over patch.** Made this explicit twice (clear-button dormant state, sample-picker gating). Both reused the same render-slot signature pattern. Both honor a prop that was already declared on the type interface but never wired. The pattern is now stable — copy it for similar work.

4. **Single source of truth + render-slot prop signature for showcase/standalone parity.** TraceCore derives state once, propagates through both `renderClearButton` and `renderSampleStrip` (or their `onRequest*` modal-trigger callbacks). Different consumers can never disagree.

5. **Emil's design.md as a real reference.** Not just decorative — `cubic-bezier(0.23, 1, 0.32, 1)` for UI motion, `@media (hover: hover) and (pointer: fine)` gating, `:active` scale-down for buttons, blur-mask for crossfades that feel jarring. Used in the dynamic narrative pill polish AND the sample-picker polish.

6. **Verify in browser before claiming done.** Used `preview_eval` + `preview_screenshot` extensively. Not always smooth (stale dev-server logs caused some confusion mid-session), but the workflow caught real issues.

End of handoff.
