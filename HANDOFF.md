# Handoff — 2026-04-26 (extended session)

Long extended session. **Eight workstreams shipped, one still wrong.** The ClipStream simulation rewrite at the very end has known visual issues and the user has explicitly asked to start it fresh from a new conversation. Everything else is in a known-good state.

---

## TL;DR by status

| ✅ Shipped and verified | ⚠️ Shipped but not visually verified | ❌ Done badly, restart from scratch |
|---|---|---|
| Backlog grooming + Voice transcribe stub note | ClipStream sim/demo split (works architecturally; visuals depend on no further changes from previous session) | **ClipStreamSim scripted simulation rewrite — user has tested, sees issues, wants to start fresh** |
| Figma bridge daemon refactor (R1→R5 plan + implementation, plugin reconnected, T1–T3 verified) | | |
| `useMicPermission` state-machine fix | | |
| ShowcaseNavbarMicBanner dark variant (desktop + mobile) | | |
| Mic banner button hierarchy swap (light variant) | | |
| Trace `Send Audio` waveform misalignment fix (real cause: `getBoundingClientRect` returning post-transform sizes inside Framer Motion's scaling carousel) | | |
| Same-class fix for ClipStream's `WaveClipper` canvas | | |
| Keyboard arrow navigation on `/demo-showcase` (↓ next, ↑ previous) | | |

---

## 1. Figma Bridge — singleton daemon refactor (SHIPPED) ✅

The biggest infrastructure change of the session. Replaces the host-or-relay model in `/Users/ethan/Documents/projects/figma-mcp/` with a launchd-managed singleton daemon. Plugin connects once and stays connected across every Claude Code / Codex / Cursor session and every reboot.

### What's done

- **Plan:** [`docs/figma-bridge/DAEMON-PLAN.md`](docs/figma-bridge/DAEMON-PLAN.md) — five revisions (R1 → R2 → R3 → R4 → R5) through three reviewer passes. Final estimate ~8.5h, actual ~3h focused work plus testing.
- **Implementation:** Single feature branch `feat/singleton-daemon` in `figma-mcp`, merged to `master` at commit `dbe8852`.
  - New: `src/daemon/index.ts`, `scripts/install-daemon.sh`, `scripts/uninstall-daemon.sh`, `README.md`
  - Renamed: `relay-client.ts` → `daemon-client.ts`
  - Modified: `types.ts` (new wire types + ClientStatusSnapshot + async FigmaBridge), `websocket-server.ts` (per-client active channel map, push status broadcast, AMBIGUOUS_FILE flow), `mcp-server.ts` (await async methods, embed disambiguation hints), `server/index.ts` (host-or-relay fork removed, depend on daemon-client), `plugin/ui.ts` + `plugin/manifest.json` (port narrowing 3055-3060 → 3055 only)
- **Daemon installed and running:** `~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist`, autostart at every login.
- **Plugin connected** to the new daemon (channel `b9yfir9k` initially, channel cycles per plugin reload).
- **T1–T3 verified end-to-end this session:** clean install, plugin connects, MCP comes-and-goes (the central proof of value — restart Claude Code, plugin stays connected, new session immediately sees `connected: true`).
- **Multi-file works:** confirmed via `get_connection_status` returning `pluginCount: 2` with both files when "2025" file was opened alongside "Dictation app".

### Pending tests (user-driven, optional)
- T4 multi-file with explicit `join_channel` round-trips
- T5 daemon crash resilience (`kill -9` daemon, watch launchd respawn after 10s)
- T6 concurrent Claude Code sessions
- T7 Mac reboot
- T8/T9 uninstall/reinstall cycle

### Backlog reflects this work as shipped
[BACKLOG.md](BACKLOG.md) — moved from active section to "Completed" at the bottom.

---

## 2. Showcase modal layer refactor (SHIPPED) ✅

Replaces the MutationObserver + mobile transform-strip hack with proper showcase-owned modal infrastructure that portals to `document.body`.

- **TraceCore** gained two opt-in props: `onRequestClearAll`, `renderClearButton` (both `[DEMO-SHOWCASE]` marked). Standalone `/trace` unaffected when not passed.
- **New:** `ShowcaseModalContext` + `useShowcaseModal` hook + `ShowcaseModalLayer` (portals to body, esc + backdrop dismiss, scroll lock, scale-in animation respects `prefers-reduced-motion`).
- **TraceDemo** delegates the clear-confirm modal through the showcase modal layer.
- Showcase `index.tsx` wraps the carousel in `ShowcaseModalProvider`.

Commit: `feb6186`

---

## 3. ShowcaseNavbarMicBanner dark variant + button hierarchy fix (SHIPPED) ✅

Both desktop and mobile mic banners now have a `variant?: 'light' | 'dark'` prop, default `'light'`. Original beige render is bit-for-bit unchanged when no variant is passed.

### Light variant button hierarchy fix
The original had `Not now` more prominent than `Enable` (dark on beige is heavier than white on beige). Swapped:
- **Enable**: dark pill (`#252525`), white text — primary action wins
- **Not now**: `rgba(50, 51, 51, 0.10)` background + `#5E5E5C` text (the project-counter chip tokens) — sits quietly on the beige pill, picks up the tint

### Dark variant
Lifted from `EnableModal` palette: pill `#252525`, white title, white X stroke, no inset shadow. Buttons swap back to the EnableModal hierarchy (Enable=white, Not now=`#373737`) — same prominent/subtle relationship inverted because the pill background flipped.

Dismissed-state orange "Enable Mic" pill is **identical between variants** — the call to action shouldn't shift.

Mobile mirrors all of this.

Components review page (`/demo-showcase/showcase/democomponents`) gains four new cells: dark unknown + dark blocked for both desktop and mobile.

Commits: `5d9a307`, `cada9d5`, `5729fef`

---

## 4. `useMicPermission` state-machine fix (SHIPPED) ✅

Two real UX bugs the user reported on `/demo-showcase`:

1. **Clicking Enable sometimes landed on the orange button (dismissed) instead of triggering the browser prompt.** Cause: `handleEnable`'s catch fell through to `'dismissed'` if `permissions.query` couldn't confirm denial — but that API is unreliable for post-prompt state, so real denials were hidden behind a misleading retry button.

2. **Clicking the orange "Enable Mic" button just re-showed the toast — didn't actually re-trigger `getUserMedia`.**

### Fix
- `handleEnable` catch → always `setState('blocked')`. Clicking Enable can no longer land on orange. Orange is reserved for the explicit Not-now path.
- `handleReshow` → calls `handleEnable`. Orange button is now a one-step retry of the browser prompt.
- Mount-time `permissions.query()` returning `'denied'` → go straight to `'blocked'` (skip the wasted Enable click on a permanently denied origin).

State machine documented inline at the top of [`useMicPermission.ts`](src/projects/new-home/hooks/useMicPermission.ts).

Commit: `9f80fb9`

---

## 5. Trace `Send Audio` waveform fix — TraceLiveWaveform offsetWidth (SHIPPED) ✅

This one took multiple attempts. The actual bug was deep, the diagnosis from screenshots was misleading, and the user (correctly) suggested the cause when I was stuck.

### What the user saw
On the showcase Trace demo's Send Audio button (recording state), the waveform appeared as small bars at the top-left of the orange button, not centered with the "Send Audio" text. On standalone `/trace`, same component rendered correctly.

### Two false starts that I reverted
- `afa8d55` — added `inset: 0` to the absolute-positioned `.sendaudio-content` overlays. Idea was that the flex parent's static-position rule for absolutely positioned children was failing in the showcase ancestor chain. **Didn't fix it.**
- `2538628` — switched to `top: 50%; left: 50%; transform: translate(-50%, -50%)` centering. Bulletproof in theory. **Also didn't fix it.** (Both reverted.)

### The actual cause (user's hint cracked it)
The `WaveClipper`-equivalent component for Trace, `TraceLiveWaveform`, sized its canvas via `container.getBoundingClientRect()` in a `ResizeObserver`. `getBoundingClientRect` returns the **post-transform visual size**.

Flow:
1. User swipes to Trace in the showcase carousel
2. Framer Motion animates `.canvas-motion` through `scale: 0.6 → 1` for the entry transition
3. `TraceLiveWaveform` mounts during this transition; ResizeObserver fires for the first time
4. Reads container rect at scale ~0.622 → canvas sized to `24 × 0.622 = 14.92px` instead of 24px
5. Animation completes, parent reaches `scale: 1`. **ResizeObserver does NOT fire on ancestor transform changes** — only on layout-box changes — so the canvas stays stuck at 14.92px forever
6. Visual: tiny bars looking off-center against the much larger "Send Audio" text

### Real fix
Replaced every `getBoundingClientRect()` in `TraceLiveWaveform.tsx` with `offsetWidth`/`offsetHeight`. Those return the CSS layout-box size and are immune to ancestor transforms. Five call sites updated (resize observer, processing animation barCount, static-mode bar baseline, four spots in active-mode bar drawing).

Commit: `be2ccf9`

### Same-class bug in ClipStream
After the Trace fix, the user found the same symptom on the ClipStream record-bar waveform (showing as missing/invisible in the demo-showcase view). Same root cause — `WaveClipper` also used `canvas.getBoundingClientRect()` in its resize observer. Fixed identically: replaced with `canvas.offsetWidth`/`canvas.offsetHeight`. Now the waveform is fully dynamic — works at any wrapper scale (0.5, 0.68, 1.2, etc.) without further changes.

Commit: `4ff40a3`

### Pattern to remember
**Any component that sizes itself via `getBoundingClientRect()` will break inside the demo-showcase wrapper chain** because of the various `transform: scale(...)` wrappers (Framer Motion variants on the carousel, plus the per-demo wrapper transforms). If you find a third one, this is almost certainly the cause — same one-line fix.

---

## 6. Keyboard arrow navigation (SHIPPED) ✅

Document-level keydown handler on `/demo-showcase`. ↓ = next demo, ↑ = previous. Routes through the same `go()` callback the navbar arrows and mobile swipe use, so all the side-effects (resetting `isDemoMode`, kill-switch firing on swipe-away) apply consistently.

Safeguards:
- Modifier keys (Cmd/Ctrl/Alt/Shift) skip the handler — preserves browser shortcuts like Cmd+Down
- Inputs (`input`/`textarea`/`select`) and contenteditable elements skip — cursor movement still works inside demos like Trace

Commit: `23d0462`

---

## 7. ClipStream demo/sim split (USER'S CHANGES, COMMITTED) ✅ (architecturally)

Earlier in the session the user split `ClipStreamSim` into:
- **`ClipStreamSim`** (sim mode) — `onLoopRestart` only, no `cancelSignal`
- **`ClipStreamDemo`** (new file) — receives `cancelSignal` and forwards to `ClipMasterScreen`

Showcase wiring updated:
- `clipStreamActive = activeIdx === 2 && isDemoMode` (now matches AI Confidence + Trace gating)
- Cancel signal flows only to `<ClipStreamDemo>`
- **Conditional mount** rather than `layer-hidden` (because both wrappers currently render the same `ClipMasterScreen` — having two instances simultaneously would race on the zustand store's `processAllPendingClips` registration, fight for the mic, etc.)

Commit: `4480e42`

### Important architectural note documented in this session
The user asked whether to switch ClipStream to keep-mounted (the AI Confidence / Trace pattern). Answer: **no, not yet** — the prerequisite is that `ClipStreamSim` becomes a scripted-state mock that doesn't render `ClipMasterScreen`. Until that exists, two `ClipMasterScreen` instances would step on each other. The "build the scripted ClipStreamSim" item in the backlog is exactly this prerequisite. **§9 below was the attempt to do that — and it has issues.**

### Doc staleness flagged but NOT yet fixed
[`docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md`](docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md) still describes the pre-split state in several places (line 3 status, lines 38, 41, 47, 395, 405, 433, 440). I did a full code review of ClipStream's kill-switch wiring earlier in the session and reported the affected lines, but the user wanted to focus on building the sim. Doc fixes are still pending.

---

## 8. Backlog grooming (SHIPPED) ✅

Multiple updates to [BACKLOG.md](BACKLOG.md):

- Added **Voice Interface `/api/voice-interface/transcribe` 400 stub** entry (the dummy `transcribeAudio` in `VoiceTextBoxClip.tsx` faking 1.2s latency + cycling 6 hardcoded `SAMPLE_LINES`). Commit: `397a1c5`
- Updated **per-project sim status** to reflect reality (AI Confidence + Trace done; ClipStream + Voice + Ollama still outstanding) and clarified Trace cancel button (showcase has it via swipe; standalone `/trace` still needs a UI control). Commit: `86386b2`
- Added **`demo-showcase` → `demos` rename** as a parked item with the full scope analysis (206 occurrences, three distinct uses, recommended scope). Commit: `95f1e97`
- Marked **Figma Bridge daemon refactor as Completed** at the bottom. Commit: `b5981ee`

---

## 9. ❌ ClipStreamSim scripted offline-loop simulation (BROKEN — start fresh)

**Status: do not build on this. The user explicitly asked to restart this from a new conversation.**

### What we tried to build
A scripted ~12-second loop that mimics the offline-recording UX:

1. Idle on record screen, RECORD button visible, `Offline` in the header (always offline at the start, no "Online → Offline" flip)
2. Auto-tap RECORD → recording state, synthetic waveform animates, timer 0:00 → 0:03
3. Auto-tap DONE → record bar morphs back to RECORD; `ClipOffline` block appears showing "Clip 001 — 0:03" with the muted/static spinner; `AudioToast` slides in showing "Audio saved for later", then auto-dismisses
4. Status flips Offline → Online
5. ClipOffline spinner starts spinning (status: `'transcribing'`)
6. Transcribed text appears (`ClipRecordScreen` switches to `'transcribed'` state, `selectedClip` set)
7. Reading pause (~1.5s)
8. Slide back to home screen — new clip in list with title + date
9. Auto-open triple-dot dropdown menu
10. Clip fades out via the existing `isDeleting` animation
11. Slide back to record screen → loop

### What was implemented
Commit: `bb03044` (~570-line rewrite plus minimal `[DEMO-SHOWCASE]`-tagged prop additions to four product files).

**Architectural decisions taken:**
- Reuse the real product's leaf components (`ClipHomeScreen`, `ClipRecordScreen`, `ClipOffline`, `RecordNavBarVarMorphing`, `ToastNotification`, `ClipRecordHeader`, `ClipListItem`, `OptionsDropDown`) so visuals match `/clipperstream` 1:1
- **Do NOT use** `ClipMasterScreen`, `useClipRecording`, `useClipStore`, `useAutoRetry`, IndexedDB, or `MediaRecorder` — bypass the entire real recording/transcription pipeline
- Drive everything via a single setTimeout-chained state machine of phases inside `ClipStreamSim`
- Synthetic waveform: `OscillatorNode → LFO-modulated GainNode → AnalyserNode`, never connected to `ctx.destination` (silent), fed to `WaveClipper` via the existing `audioAnalyser` prop

### `[DEMO-SHOWCASE]` prop additions to four product files
All marked with strip-on-port comments. Listed here so they can be cleanly removed if the rewrite goes a different direction:

| File | Prop added | Purpose |
|---|---|---|
| `cliplist.tsx` (`ClipListItem`) | `simulationOpenMenu?: boolean` + sync useEffect | Force the triple-dot dropdown open from outside |
| `ClipHomeScreen.tsx` | `simulationOpenMenuForClipId?: string`, `simulationDeletingClipId?: string` | Forwards to the matching `ClipListItem` |
| `cliprecordheader.tsx` | `forcedNetworkState?: 'online' \| 'offline'` | Bypass `navigator.onLine` + event listeners; sim drives the indicator |
| `ClipRecordScreen.tsx` | `forcedNetworkState?: 'online' \| 'offline'` | Passthrough to `ClipRecordHeader` |

### What I got wrong (multiple iterations, still not right)

**Attempt 1 issue:** Rendered my own custom record-screen header on top of `ClipRecordScreen`'s internal `ClipRecordHeader`. **Result: duplicated headers stacked vertically** (Offline label on top, Online below, then the clip block). User caught this in a screenshot.

**Attempt 1 partial fix:** Added the `forcedNetworkState` prop to `ClipRecordHeader` and `ClipRecordScreen`, removed my custom header. Header is no longer duplicated.

**Attempt 2 issue:** My custom `.record-bar` styles in `ClipStreamSim` were a stripped-down version. Result: **RECORD button at the very bottom of the master-screen with no padding/tray container** — scraping the floor. User caught this too.

**Attempt 2 fix:** Mirrored the real `.record-bar` styles from `ClipMasterScreen` (160px height, `padding: 24px 12px 0`, `background: var(--ClipRecTrayBg)`, `border-radius: 16px 16px 0 0`, transitions). The button now sits in the proper dark tray.

**Status when handed off:** committed at `bb03044`. The user has tested after both fixes and reports the simulation is still wrong / has visible problems. They have NOT specified exactly what's still wrong in the latest screenshot — only that they want to restart from scratch.

### Why this likely needs a fresh start (my read)
Multiple back-and-forth attempts on visual fitting suggest the architecture itself is fragile:

- Composing `ClipRecordScreen` + a separate `RecordNavBarVarMorphing` outside of `ClipMasterScreen`'s natural layout means I'm rebuilding the master-screen plumbing without the master-screen guarantees. Each time I miss a CSS rule, something breaks visibly.
- The real `ClipMasterScreen` has subtleties (`shouldHideRecordBar` derived from screen state, `animationVariant` for slide vs fade, search-active integrations, etc.) that I didn't replicate. Some of those probably matter and I'm only finding out what when the user spots a regression.
- The four `[DEMO-SHOWCASE]`-tagged prop additions to product files mean the boundary is leaky — every product change has to remember the sim's dependency.

### Safari waveform false start (do not repeat blindly)

After this handoff was written, one additional idea was tested and **reverted** because it made no visible difference:

- Hypothesis: the mobile Safari "flat / tiny bars" problem in `ClipStreamSim` matched the homepage preview's suspended-`AudioContext` issue, so the same `ctx.resume()` + gesture/visibility retry pattern from `VoiceTextBoxClip` should be copied into `ClipStreamSim`'s `useFakeAnalyser`.
- Result: **no visible change** on device. The patch was reverted immediately; `ClipStreamSim.tsx` is back to its pre-test state.

Why this matters:

- The homepage preview does not just differ by the Safari resume snippet.
- It uses `VoiceTextBoxClip` + `ClipLinearWaveform` + a sample-audio `MediaStream` simulation path.
- `ClipStreamSim` uses `WaveClipper` fed by a simpler oscillator/analyser path.

So the likely lesson is: if the Safari/mobile waveform issue needs solving later, start by comparing the **simulation source strategy** between those two implementations, not by re-applying the no-effect resume patch.

### Recommended approach for the next session
1. Open the new conversation with a clear-eyed read of the existing `ClipStreamSim.tsx` from commit `bb03044` AND the user's screenshots.
2. Decide whether to:
   - **(a) Fix the existing rewrite** — likely several more rounds of "you broke X" → fix → "you broke Y." Probably most of an additional session.
   - **(b) Take a different architectural approach** — e.g., fork `ClipMasterScreen` itself into a `ClipMasterScreenSim` that takes mock state as props rather than using its hooks. Bigger change, but probably less fragile because you're not re-composing leaf components manually.
   - **(c) Build the simulation as a standalone phone-frame component that doesn't try to reuse `ClipRecordScreen` or `ClipHomeScreen` at all** — purely scripted visuals using the same icons/buttons. More work but full control.
3. Whatever path is chosen, **start with screenshots of the real `/clipperstream` flow** at every relevant state, then build the sim to match those exactly.
4. Keep the four `[DEMO-SHOWCASE]` prop additions — they're each genuinely useful regardless of the sim approach. (Or remove them if going with option C.)

### Files in the broken state right now
- `src/projects/demo-showcase/components/simulations/ClipStreamSim.tsx` — full ~570-line scripted simulation (commit `bb03044`)
- `src/projects/clipperstream/components/ui/cliplist.tsx` — `simulationOpenMenu` prop added
- `src/projects/clipperstream/components/ui/ClipHomeScreen.tsx` — `simulationOpenMenuForClipId` + `simulationDeletingClipId` props added
- `src/projects/clipperstream/components/ui/cliprecordheader.tsx` — `forcedNetworkState` prop added
- `src/projects/clipperstream/components/ui/ClipRecordScreen.tsx` — `forcedNetworkState` passthrough added

If the next session decides to fully restart, those four product files can keep their props (still useful) or be reverted. The simulation file itself should probably be reset to its pre-`bb03044` state (a thin passthrough to `ClipMasterScreen`) before building the new approach, so the showcase still works while the new sim is being developed.

---

## Commits this session (newest → oldest)

```
bb03044 feat(ClipStreamSim): scripted offline→online recording loop      ❌ broken
4ff40a3 fix(WaveClipper): size canvas via offsetWidth                    ✅
23d0462 feat(demo-showcase): keyboard arrow nav (↓ next, ↑ previous)    ✅
be2ccf9 fix(TraceLiveWaveform): size canvas via offsetWidth              ✅
2538628 fix(TRNavbar): switch to transform-based centering               ⚠️ reverted
afa8d55 fix(TRNavbar): pin content overlays with inset:0                 ⚠️ reverted
9f80fb9 fix(useMicPermission): correct state machine                     ✅
4480e42 refactor(showcase/clipstream): split into separate sim and demo  ✅ (user's)
5729fef fix(MicBanner light): Not now adopts project-counter palette    ✅
cada9d5 feat(ShowcaseNavbarMicBanner+Small): light-variant button hierarchy + mobile dark variant ✅
5d9a307 feat(ShowcaseNavbarMicBanner): add dark variant alongside light ✅
95f1e97 docs(backlog): park demo-showcase → demos rename                 ✅
b5981ee docs(backlog): mark Figma Bridge daemon refactor as shipped     ✅
a47dc04 docs(figma-bridge): R5 — final consistency pass on plan         ✅
e3f484a docs(figma-bridge): R4 — address R3 reviewer feedback           ✅
ec3136d docs(figma-bridge): R3 — user direction, multi-file in daemon   ✅
b0e3381 docs(figma-bridge): R2 — address review feedback                ✅
00cec23 docs(figma-bridge): draft singleton daemon refactor plan        ✅
feb6186 refactor(demo-showcase): showcase-owned modal layer              ✅ (user's)
86386b2 docs(backlog): reflect current sim + Trace cancel status        ✅
397a1c5 docs(backlog): add Voice Interface transcribe 400 stub note     ✅
```

Plus, in the figma-mcp repo:
```
dbe8852 feat(daemon): replace host-or-relay with singleton daemon architecture  ✅
```

---

## Quick tour for the next session

| File | Why you'd open it |
|---|---|
| [BACKLOG.md](BACKLOG.md) | Current parked work; "ClipStream simulation" entry is the one we tried + failed at |
| [docs/figma-bridge/DAEMON-PLAN.md](docs/figma-bridge/DAEMON-PLAN.md) | Reference if any figma-mcp issues come up; the daemon is live |
| [docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md](docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md) | **Has stale references to pre-split ClipStream** — clean up next session |
| [src/projects/demo-showcase/components/simulations/ClipStreamSim.tsx](src/projects/demo-showcase/components/simulations/ClipStreamSim.tsx) | The broken simulation. Either fix or fully rewrite. |
| [src/projects/demo-showcase/components/simulations/AIConfidenceSim.tsx](src/projects/demo-showcase/components/simulations/AIConfidenceSim.tsx) + [TraceSim.tsx](src/projects/demo-showcase/components/simulations/TraceSim.tsx) | Working scripted-state sims to use as reference patterns |
| [src/projects/clipperstream/components/ui/ClipMasterScreen.tsx](src/projects/clipperstream/components/ui/ClipMasterScreen.tsx) | The real product orchestrator. Read this carefully if rebuilding the sim. |
| [src/projects/clipperstream/components/ui/000_COMPLETE_APPLICATION_FLOW.md](src/projects/clipperstream/components/ui/000_COMPLETE_APPLICATION_FLOW.md) | Best entry point for understanding the real ClipStream flow if you haven't read it |

## Suggested next moves

1. **ClipStream sim from scratch.** Open a new conversation. Don't pick up the existing rewrite without fresh consideration of the architecture options listed in §9. The user's frustration is real and the code so far isn't worth defending.
2. **Clean up KILL-SWITCH-ARCHITECTURE.md** stale references to pre-split ClipStream (~10 minutes, line list in §7 above).
3. **Optional:** delete the `feat/singleton-daemon` local branch in `figma-mcp` (already merged to `master`). One-liner: `git -C ~/Documents/projects/figma-mcp branch -d feat/singleton-daemon`. Cosmetic only.
4. Manual mic-required acceptance tests for kill-switch (carry-over from previous session, still pending).
5. Voice Interface transcribe 400 stub fix (in backlog; carry-over).
