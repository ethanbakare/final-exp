# Backlog

Non-urgent work captured so it doesn't get lost. Not prioritised — review before picking up.

---

## Tooling / infra

### Fix silent ESLint crash in Vercel builds
**Status:** deferred — site deploys fine, but lint is effectively disabled in CI.

**What's wrong:**
- Every Vercel build logs `⨯ ESLint: Converting circular structure to JSON` during the "Linting and checking validity of types" step.
- This is an ESLint *internal* crash (FlatCompat + eslint-plugin-react cycle under Next 15), not a rule violation. Next doesn't fail the build on internal errors, so deploys pass with lint never actually running.
- Net effect: no lint rules are enforced on new code. The `⨯` in logs looks scary but is misleading.

**Root causes (ours, not upstream):**
1. Two ESLint configs coexist — `.eslintrc.json` (legacy, has `no-unused-vars` underscore rule) and `eslint.config.mjs` (flat, extends `next/core-web-vitals` + `next/typescript`). Next 15 picks the flat config and silently ignores the legacy one — so the underscore rule has been dead for a while.
2. `package.json` pins `eslint` and `eslint-config-next` to `"latest"`. Builds aren't reproducible.
3. `next.config.mjs` has a `dirs: [...]` allowlist restricting lint to 6 legacy project dirs. Anything newer (`blob-studio`, `new-home`, `trace`, `voiceinterface`) wouldn't be linted even if ESLint worked.
4. No dedicated lint step in CI — we rely on `next build`'s lenient handling, which hides crashes.

**Recommended approach when we come back to it:**
1. Consolidate to a single flat config (`eslint.config.mjs`), port the `no-unused-vars` rule over, delete `.eslintrc.json`.
2. Pin exact versions of `eslint` and `eslint-config-next` (not `"latest"`).
3. Resolve the circular bug either by (a) pinning to a known-good `eslint-plugin-react` version, or (b) dropping `next/typescript` from extends and keeping `next/core-web-vitals` only.
4. Add a dedicated `npm run lint` step in a GitHub Action so ESLint crashes and rule violations fail CI.
5. Adopt **change-based linting** in CI (`git diff --name-only origin/main...HEAD | grep -E '\.(ts|tsx)$' | xargs eslint`) so new code gets linted but legacy dirs stay grandfathered until touched. Drop the `dirs` allowlist in `next.config.mjs` once change-based linting is in place.

**Why defer:** none of this blocks shipping. Doing it now would either surface hundreds of legacy lint errors (time sink) or require a baseline ratchet tool to manage them. Change-based CI is the cleanest escape hatch and avoids both problems — but it's still meaningful setup work.

---

<!-- Figma Bridge — refactor to singleton daemon architecture: SHIPPED 2026-04-26.
     Merged to master in figma-mcp at commit dbe8852. Plan in
     docs/figma-bridge/DAEMON-PLAN.md (R5, signed off through reviewer pass).
     See "Completed" section at bottom for one-line summary. -->

---

## Product work deferred from prior sessions

### Realtime — pre-warm session to fix first-utterance drop
On `/voiceinterface/realtime`, the first 2-3 seconds of every fresh-reload utterance are dropped at the network layer. Confirmed by the "count 1→10, AI heard 3→10" test. Cause: `session.connect()` takes 600 ms–2 s on a fresh page and the Agents SDK doesn't transmit audio over the RTP track until it resolves. The mic is captured locally (orb visualiser shows activity) but nothing reaches OpenAI in that window. Reproduces on `19dc15a` (pre-radial-states), so it's pre-existing, not a regression from the radial migration.

Fix: pre-warm the WebRTC connection before the Record click (on hover or on mount), with idle teardown after 3 s of no click. Synchronous `click → listening` UX is preserved; the connection is already up by click time.

**Why defer:** still in testing, only affects fresh-reload first utterance, not blocking. Diagnostic timing logs (`5ff985e`) are in place to reconfirm when picked up.

- Diagnostic context: [tasks/realtime-first-token-handoff.md](tasks/realtime-first-token-handoff.md)
- Design doc with variants, edge cases, implementation sketch: [tasks/realtime-prewarm-approach.md](tasks/realtime-prewarm-approach.md)

### Voice Interface — fix `/api/voice-interface/transcribe` 400s (blob path)
The non-realtime transcribe endpoint (used by `VoiceTextBoxClip` for the record-clip-then-transcribe flow) returns 400. As a workaround, [`transcribeAudio` in VoiceTextBoxClip.tsx:361](src/projects/voiceinterface/components/VoiceTextBoxClip.tsx:361) is a stub that fakes 1.2s latency and cycles through 6 hardcoded `SAMPLE_LINES`. UI state machine (recording → processing → reveal) still exercises correctly, but the transcript text is canned, not real STT.

To fix: debug the API route (likely `/pages/api/voice-interface/transcribe.*`), get it returning real transcriptions for an audio blob, then swap the stub call sites at lines 322 and 334 for the real fetch. **Does NOT affect the realtime API path** — that's a separate code path (live PCM over WebRTC to OpenAI). This is purely the blob-based transcription.

### Cancel button during Trace processing (standalone `/trace` only)
Production risk if the Gemini API hangs — standalone-page user has no way to bail out. The kill-switch wiring in TraceCore added a `cancelSignal` path so the showcase can abort fetches when the user swipes away, but that abort source isn't wired to a UI control on the standalone `/trace` page. Need a user-facing cancel button (or X-button surfaced during processing, not just recording) before Trace is truly production-ready.

### ClipStream simulation
Auto-play recording → processing → results loop for the `/demo-showcase` page. Not built. [ClipStreamSim.tsx](src/projects/demo-showcase/components/simulations/ClipStreamSim.tsx) currently passes through to the real `ClipMasterScreen` (the live `/clipperstream` component) so the sim slot renders the real product. Once scripted-loop logic is written, it lives in this file — must NOT touch anything under `src/projects/clipperstream` (kill-switch porting boundary). Pattern to follow: AIConfidenceSim (scripted states) and TraceSim (idle → recording → processing → results → clear loop).

### Voice Interface simulation
Design undecided. Separate from the Blob Studio page — this would be for the consolidated demo showcase.

### Case study URLs
All brand-carousel links on the home page point to `#` placeholders. Need real portfolio pages or external links.

### Port linear waveform from `otherexp` → `final-exp`
Linear waveform playground exists in `otherexp` but not in `final-exp`. Could ship as a gallery page similar to the radial waveform one.

### Consolidated `/demos` page
Single full-screen demo navigator (Figma "Dictation app" file). Nav with project dropdown + counter + up/down arrows, auto-playing simulation per demo, "Try Demo" + "View Case Study" CTAs. Would use simulation-mode versions of each project.

### Simulations for other projects
Status by project:
- AI Confidence Tracker — **done** (scripted-state autoplay sim).
- Trace — **done** ([TraceSim.tsx](src/projects/demo-showcase/components/simulations/TraceSim.tsx) auto-loops idle → recording → processing → results → clear → restart, using real `AnimatedTextBox` + `TRNavbarV2` with `simulateAudio`).
- ClipStream — **not built** (see "ClipStream simulation" above; currently a passthrough to the real product).
- Voice UI — **not built**, deferred (Voice Interface itself not yet in showcase).
- Ollama — **not built**.

### Navigation bar for new home page
Old home page had `MainNavBar`. New home page doesn't. Either adapt or build fresh from Figma.

---

## Cleanup

### Old `/old-home` page
Preserved at `/old-home` since the April refactor. Can be removed once new home is confirmed stable.

### Old voice-interface JPG/PNG images
`wt1.jpg`, `wt6.png`, `wt7.jpeg` in the public folder are no longer referenced (replaced by WebP versions). Can be deleted.

### Rename `demo-showcase` namespace to `demos`
The path/namespace `demo-showcase` is unnecessarily long. Mechanical rename, no behaviour change, ~206 occurrences across ~25 files. Scoped on 2026-04-26 — picking up later just means executing the plan below.

**Rename (definitely):**
- URL route: `/demo-showcase` → `/demos`
- Source dirs: `src/pages/demo-showcase` → `src/pages/demos`; `src/projects/demo-showcase` → `src/projects/demos`
- Asset dir: `public/images/demo-showcase` → `public/images/demos`
- Doc dir: `docs/demo-showcase` → `docs/demos`
- Page component: `DemoShowcasePage` → `DemosPage`
- All `@/projects/demo-showcase/...` and `@/pages/demo-showcase/...` imports
- Subroute survives: `/demos/showcase/democomponents` (inner `/showcase/` is a cross-project convention also used at `/voiceinterface/showcase/voicecomponent` — leave it)

**Rename for consistency:**
- `[DEMO-SHOWCASE]` porting markers → `[DEMOS]` (~30+ inline tags across `TraceCore.tsx`, `ClipMasterScreen.tsx`, hooks, showcase index, etc.). Documented in `docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md` and `HANDOFF.md`.

**Leave as-is:**
- `Showcase*` component prefix (`ShowcaseNavbarMicBanner`, `ShowcaseModalLayer`, ~14 components) — describes the layout chrome concept, not the URL. Not what made `demo-showcase` long.

**Verification:** collision check confirmed `src/pages/demos`, `src/projects/demos` do NOT exist. Single commit, then `npm run build` + `tsc` to verify.

### `@ts-nocheck` files
Three files have `@ts-nocheck` applied for Vercel build. Not urgent, but worth fixing when touching them:
- `src/pages/clipperstream/showcase/ClipOfflineScreen.tsx`
- `src/pages/trace/showcase/tracemorphing.tsx`
- `src/projects/home/components/Goal_Body.tsx`

---

## Completed

### Figma Bridge — singleton daemon architecture (2026-04-26)
Replaced the host-or-relay model in `/Users/ethan/Documents/projects/figma-mcp/` with a launchd-managed singleton daemon. Plugin connects once and stays connected across every AI-tool session. Multi-file UX (`AMBIGUOUS_FILE` errors + per-client active channel) baked into the MCP tool surface so Codex / Cursor / any MCP client benefits without per-client config.
- Plan: [docs/figma-bridge/DAEMON-PLAN.md](docs/figma-bridge/DAEMON-PLAN.md) (R5, four reviewer passes)
- Merge: `dbe8852` on `master` of figma-mcp
- Daemon: `~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist`, autostart at login
- T1–T3 verified end-to-end this session; T4–T14 available as on-demand validation
