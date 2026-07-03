---
kind: plan
id: 4b1a8e7c-9d2f-4a15-b7e3-c1f0a5d3b829
title: Realtime — fix WebRTC connect-window first-utterance-lost bug via ProcessingButtonDark warming + chirp-on-ready
created: 2026-07-02T22:30+01:00
revised: 2026-07-03T23:55+01:00
status: DRAFT-v4.2.4
related:
  - tasks/realtime-first-token-handoff.md
  - tasks/realtime-vad-and-vercel-401-handoff.md
  - tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md
  - tasks/PLAN_v2_review_synthesis_2026-07-03.md
  - tasks/DISCOVERY_2026-07-03_realtime-visual-surface.md
target_file: src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx
prior_head: 5ff985e
current_head: 49d4f13
estimate_range: ["5h", "8h"]
appetite_signal: v4 grows over v3 to cover ProcessingButtonDark substitution + Nebularr/Circle orb coherence verification + Feature-PIS-driven visual falsifiers. Elicited with user 2026-07-03.
version_history:
  - v1 2026-07-02 22:30 — first draft (commit bb7b2c9)
  - v2 2026-07-02 23:30 — round-1 findings applied (commit 16bde7c)
  - v3 2026-07-03 12:00 — cross-family review synthesis applied, two-SAFE Claude+Codex (commit 8107fbd)
  - v4 2026-07-03 13:00 — Feature-PIS re-elicited with user; §0 rewritten; button strategy pivoted to ProcessingButtonDark (no text, spinner-only); Nebularr/Circle coverage promoted to ship-blocker
  - v4.1 2026-07-03 18:35 — Pass-2 cross-family review (Claude + Codex) findings applied. Codex Major-1: `disabled` prop freezes spinner + `aria-label` not accepted by ProcessingButtonDarkProps + focus/aria-live missing. Claude Major-1: getUserMedia + response.json guard sites missing from §6 diff. Claude Major-2: AC-12 split into AC-12a/12b/12c with concrete criteria. Codex Minor-2: Round E reframed (Nebularr crossfade is mount-only, sibling to button-swap). Codex Minor-3: §7.2 option (a) demoted (connection_change=connected fires in same handler as unawaited updateSessionConfig).
  - v4.2 2026-07-03 18:45 — Pass-3 cross-family review two-SAFE (0 Crit, 1 Major, 5 Minor total). Codex Major (Pass-3): v4.1's post-getUserMedia guard placement was AFTER `micStreamRef.current = micStream` — Stop-during-permission-prompt would leak mic tracks. v4.2 fix: guard BEFORE assign; if mismatched, synchronously stop tracks. Also: aria-disabled prose corrected (no aria-disabled in JSX; aria-live on label is the load-bearing path); localSession = session capture promoted to concrete diff line; NODE_ENV gate on __DEBUG_STOP__ + AC-15 grep-bundle check; §7.2 "v3/v4" residue → "v4.2"; §0 UVO "replaces the Mic" → "component is swapped".
  - v4.2.1 2026-07-03 22:40 — IMR Pass-1 (Claude implementation-reviewer + Codex, Rule B2.d) found 1 Critical + 3 Major + 3 Minor. Applied: (1) catch-block runIdRef guard on state mutations (Site 1 Crit); (2) setupSessionEventListeners now accepts myRunId + isCurrentRun gate on transport_event and session.on('error') (Site 2 Major); (3) VoiceStateLabel aria-live moved to persistent outer .voice-state-live-region wrapper, inner keyed div still fades (Site 3 Major); (4) withConnectTimeout helper wraps BOTH getUserMedia and session.connect with 6s + clearTimeout on settle (Site 4 Major); (5) F-8 guard sites now log to console.log for audit trail; (6) ProcessingButtonDark gets className='warming-affordance' + :global cursor:default override. Followed by commit 408e5fb — console.warn vs console.error split for expected timeouts (user caught Next 15 Runtime Error overlay dialog on mic-timeout; console.error triggers the overlay, console.warn doesn't). Commit: 52be482 + 408e5fb.
  - v4.2.2 2026-07-03 23:20 — IMR Pass-2 (Claude implementation-reviewer + Codex, Rule B2.d) found 0 Crit + 4 Major + 2 Minor. Applied: (1) catch cleanup (audioIntervalRef + cleanupAudio) now guarded behind isCurrentRun — Codex Major 1 caught that unconditional cleanup on a superseded run would tear down Start #2's component-global refs; (2) deferred response.create setTimeout callback re-checks isCurrentRun() and routes through closure-captured session (not sessionRef.current) — Codex Major 2 caught that speech_stopped's setTimeout could send response.create to a stale/wrong session after runId flipped; (3) withConnectTimeout tags timeout errors with __expected=true + __timeoutTag properties instead of relying on strict string match on err.message — Claude Major Site 3 + Codex Minor 4 flagged the stringly-typed contract as drift-prone; (4) plan file version_history + status updated to reflect actual shipped code (this entry). Rule A1 cascade discipline: this update closes the plan-vs-code drift Claude Major Site 5 + Codex Minor 3 flagged.
  - v4.2.3 2026-07-03 23:40 — IMR Pass-3 (Claude implementation-reviewer + Codex, Rule B2.d) found 1 Crit + 3 Major + 3 Minor. Applied: (1) **CODEX CRITICAL — mic-stream leak on late-resolve**: withConnectTimeout only raced against timeout; if getUserMedia resolved after mic-timeout won, mic tracks stayed active while UI said "timed out." Fix: added `onLateResolve` callback to withConnectTimeout; getUserMedia call stops tracks on late resolve; session.connect call force-closes session on late resolve. (2) Codex Major 1 — speech_stopped's try/catch around sendEvent swallowed real bugs. Fix: removed the try/catch (isCurrentRun already checked; failures now surface via console.error or session's own error listener). (3) Claude Major — unmount cleanup did not increment runIdRef → warming Start's late timeout catch would set state on unmounted component. Fix: added `runIdRef.current += 1` as first line of unmount cleanup. (4) Codex Major 2 + Claude Minor — §6 §7.4 plan prose still described raw Promise.race and old console.error patterns. Fix: added historical-snapshot warning banners at top of §6 and §7.4 pointing readers to version_history for shipped state.
  - v4.2.4 2026-07-03 23:55 — IMR Pass-4 (Claude implementation-reviewer + Codex, Rule B2.d) achieved two-SAFE (Claude 0/0/2, Codex 0/1/0). Codex Major closed: v4.2.3's removal of the try/catch around speech_stopped sendEvent was an over-correction — WebRTC sendEvent throws SYNCHRONOUSLY on a natural data-channel closing race (openaiRealtimeWebRtc.js:223-226), which is recoverable, not a bug. Applied middle-ground: catch + console.error + set user-facing error state if still current. Neither rethrows (avoiding window.onerror for a recoverable race) nor silently swallows (making real bugs invisible). Pass-4 two-SAFE achieved per Rule B2.c/d; propose-stop threshold met. Remaining Minors (log density on late rejection, StrictMode double-fire noise, Codex Site 6 Pass-2 log payload density, Codex Site 8 Pass-2 12s composite budget) deliberately deferred per plan §7.4 tracking.
---

# §0. Feature-PIS (v4 — re-elicited with user 2026-07-03)

*(This repo has no project-PIS — verified via `find tasks -name "*PIS*"` 2026-07-02. This §0 is a fresh feature-tier PIS anchoring THIS plan. Elicited via `~/.claude/skills/plan-writing/ELICITATION.md` flow; user answers captured 2026-07-03 12:50-13:00 BST.)*

**Discovery anchor:** [tasks/DISCOVERY_2026-07-03_realtime-visual-surface.md](DISCOVERY_2026-07-03_realtime-visual-surface.md). Every claim below is grounded in a verified source read or a live-Playwright measurement.

- **UVO** — When the user clicks the Record button on `/voiceinterface/realtime`, the moment is **acknowledged**: the button *component* is swapped for a rotating-spinner pill (`ProcessingButtonDark` from `voicebuttons.tsx:1386` — same dark pill vocabulary, slightly smaller footprint 64×38 vs 76×44); the label above the orb reads "**Connecting**" (centered — no layout jitter because centered text pivots around the middle, not the left edge); the orb stays calm (no visual state change during warming — Coral's idle==listening constraint verified in `CoralRealtimeBlob.tsx:363-378`). When `session.connect()` resolves (~1.5s median in real Chrome), a short ascending chime plays, the label switches to "**Listening…**", and the button morphs to the Stop pill. From that moment on, the first thing the user says reaches OpenAI's VAD reliably. Utterances spoken BEFORE the chime are the user's own fault, not the app's — but the warming state's acknowledgment (spinner + label) is clear enough that the user naturally waits for the chime.
- **NNF** (v4 — expanded via elicitation)
  - **Text label**: no revival of the rejected `014f7af` "Ready when you are" static text. Label switches "Ready when you are" (idle) → "Connecting" (warming, centered) → "Listening…" (ready).
  - **Layout stability**: label container width is fixed (or text is centered on a middle-pivot) so text length differences ("Ready when you are" 18 chars vs "Connecting" 10 vs "Listening…" 12) don't cause horizontal jitter. User confirmed: centering solves this without a fixed-width container.
  - **Button vocabulary**: no text baked into the warming button (rules out `MorphingRecordToPillConfirmProcessing` which shows "Processing…" text). Use `ProcessingButtonDark` (spinner-only, no text, no huge size morph). The 12px width + 6px height delta between `MorphingRecordWideSimple` (76×44) and `ProcessingButtonDark` (64×38) is acceptable — user explicitly said "I'm not expecting a huge size change."
  - **Button state coherence**: during warming, the button MUST NOT show a Stop icon (v3 defect — verified in discovery §2). The click is acknowledged by swapping the whole component to `ProcessingButtonDark`, not by flipping `state='recording'` on `MorphingRecordWideSimple`.
  - **Orb calm**: orb stays at idle motion (Coral: torus + breath; Nebularr: base; Circle: base) during warming. No new warming-specific orb prop threads. Verified constraint from `CoralRealtimeBlob.tsx:363-378` — idle and listening render identically on Coral, so the orb literally CANNOT signal "connecting vs listening."
  - **Chime character**: short (≤150ms), soft (peak amplitude 0.24), ascending (440→660Hz sine). Feels like a voice-assistant ready-signal, not a system beep or notification. Semantic invariant: the chime is a *ready cue*, not a *notification*.
  - **Motion vocabulary coherence**: spinner rotation is 1.5s linear infinite (from `ProcessingButtonDark` line 1476). Coral's idle breath is ~1.3s morphSpeed. These are in the same tempo range — no visual noise from tempo mismatch.
  - **Reduced-motion compliance**: `ProcessingButtonDark` line 1494-1499 disables spinner animation on `prefers-reduced-motion: reduce`. The label + text-swap remain (they're the load-bearing signal for reduced-motion users). NOT a ship-blocker but must not regress.
  - **Cross-orb coherence**: warming state feels coherent on ALL 3 pinned orbs (Coral, Nebularr, Circle). Ship-blocker per user's falsifier selection. Verified in Round E (§8).
  - **Unacceptable**: (a) UI says "Listening" while audio is silently dropped; (b) warming lingers >3s with no chime; (c) chime fires without label transition; (d) `014f7af` "Ready when you are" static-text regression; (e) chime fails silently on subsequent clicks (AudioContext suspended); (f) button flips to Stop icon during warming; (g) label text jitters horizontally; (h) warming state stuck after timeout (button never reverts); (i) warming state breaks composition on Nebularr or Circle.
- **Scope** (v4 — pivoted after user surfaced ProcessingButtonDark)
  - **In**: (1) add `isConnecting: boolean` state to `VoiceRealtimeOpenAI` (orthogonal to `AppState`); (2) add imperative `runIdRef` per §2.1 for late-callback race safety; (3) reorder `handleStartConversation` so `setAppState('listening')` fires AFTER `session.connect()` resolves; (4) extend `VoiceStateLabelState` with a `'connecting'` value + render "Connecting" (centered, no bouncing dots — the spinner is on the button, not the label); (5) add async Web Audio-synthesized chime helper (`playConnectChime`) fired at ready with `await ctx.resume()` if suspended; (6) **conditional button component swap**: render `<ProcessingButtonDark isProcessing={true} />` while `isConnecting`, `<MorphingRecordWideSimple state='recording' />` while `isConversationActive && !isConnecting`, `<MorphingRecordWideSimple state='idle' />` otherwise; (7) Promise.race 6s timeout with explicit `localSession.close()` on timeout branch; (8) verify warming state on all 3 pinned orbs (Coral, Nebularr, Circle) — Round E.
  - **Out**: (a) removing diagnostic `[TIMING +N ms]` logs (trivial follow-up); (b) mic-permission-on-page-load (deferred, §7.1); (c) `connectionstatechange` event polling — deferred with AC-9 empirical escalation (§7.2); (d) chirp fatigue toggle (not chosen); (e) any orb rendering pipeline change; (f) Vercel infra (fixed at commit `0d7003c`); (g) RadialRealtimeBlob warming (not pinned on prod — future plan); (h) any change to `MorphingRecordToPillConfirmProcessing` — it's the wrong pattern for this window (has text + big morph); (i) `ProcessingButtonBigDark` / `ProcessingButtonOutlined` — not the visual vocabulary this needs.
  - **Touches**:
    - `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — state machine, start/stop handlers, button conditional render (~830-836), imports.
    - `src/projects/voiceinterface/components/ui/VoiceStateLabel.tsx` — add `'connecting'` value to union + STATE_LABELS map; NO bouncing-dot animation.
    - **NO changes to** `voicemorphingbuttons.tsx` — we use `ProcessingButtonDark` from `voicebuttons.tsx:1386` as-is.
    - **NO changes to** `RealtimeBlob.tsx` or any orb component — orb stays calm during warming.
- **Falsifiers**
  - F-1: Browser autoplay policy blocks the chime because AudioContext was created before a user gesture. Mitigation: chime uses the SAME AudioContext already created inside `handleStartConversation` (line 584, post-gesture); no new context needed.
  - F-2: `session.connect()` rejects (network error, invalid token) mid-warm. Warming state must clear cleanly and return to idle. Mitigation: existing catch block at line 716-720 sets `appState='idle'` + error message; must also clear `isConnecting`.
  - F-3: Chime fires but AudioContext is suspended (browser tab backgrounded). Silent-ready-signal. Mitigation: call `ctx.resume()` if suspended before chime; if resume rejects, orb+label transition still fire — chime is defence-in-depth, not sole ready-signal.
  - F-4: User double-clicks Record; second click during warming causes state confusion. **v4.1 mitigation (revised):** during warming the button is `<ProcessingButtonDark />` — a distinct component with NO `onClick` handler wired in the connecting branch (see §6). The **component swap** is the load-bearing mitigation; a click during warming lands on a button whose click handler is undefined and produces no side-effect. v4.1 does NOT use the `disabled` prop (that would freeze the spinner per `voicebuttons.tsx:1489` — the CSS pauses animation on `:disabled`).
  - F-5: Subsequent Start-Stop-Start cycles feel wrong because the warming state re-fires each time. This is CORRECT behavior — every fresh `session.connect()` genuinely takes ~1.5s. If it feels annoying, the mitigation is a follow-up (peer-connection reuse), not gating the chime.
  - F-6: On very slow networks (>3s connect), warming lingers past comfort. Mitigation: after a hard timeout (e.g., 6s), abort with error and return to idle — using existing error path.
  - F-7: Text label swap from "Connecting" → "Listening" is instant, without the existing 150ms fade animation, creating visual snap. Mitigation: reuse the existing `key={state}` re-mount trigger in `VoiceStateLabel` (line 27) — including `connecting` state should preserve the fade.
  - **F-8: Late-callback race when Stop fires during warming.** If the user clicks Stop while `await session.connect()` is still pending, `handleStopConversation` disposes of the session. But the awaited promise then resolves and the post-`session.connect()` block still runs — firing `setAppState('listening')`, `setIsConnecting(false)`, and `playConnectChime(ctx)` on a torn-down session. Result: phantom "Listening…" label + chime AFTER the user pressed Stop. **v3 mitigation (replaces v2's isConversationActiveRef mirror — Critical finding C-1):** use a per-Start `runIdRef` that is IMPERATIVELY incremented at try-entry (not via useEffect). Every post-await checkpoint captures `myRunId` at call time and compares `runIdRef.current === myRunId` before mutating state or firing the chime. Stop increments `runIdRef` too, imperatively, so any in-flight Start sees an invalidated run-id and returns early. Same pattern guards F-9 (see below).
  - **F-9: `session.connect()` resolution ≠ VAD-ready (Codex Major-3 finding, v4.1 updated).** SDK implementation at `node_modules/@openai/agents-realtime/dist/openaiRealtimeWebRtc.js:124-138` resolves connect() on WebRTC data-channel `open` event; `updateSessionConfig(...)` at line 134 is NOT awaited before `resolve()` at line 138. In practice: the chime may fire while OpenAI's server-side session config is still propagating and VAD is not yet accepting audio. The UVO promises first speech after chime reaches VAD reliably — if VAD isn't actually ready at chime, UVO fails silently. **Mitigation (v3/v4 — deferred with escalation trigger):** ship on `session.connect()` resolution as MVP. AC-9 (§9) is an empirical acceptance gate: post-chime immediate speech in real Chrome must produce an AI response ≥90% (n=10). If <90%, promote §7.2 to in-scope in a v5. Options in §7.2 revised in v4.1 — see there for the current option table (option `(a)` connection_change=connected demoted per Codex Minor-3 as it fires in the same handler).
  - **F-10: Timeout branch of Promise.race does NOT abort the SDK connect (Codex Major-1 finding).** `RealtimeSessionConnectOptions` at `realtimeSession.d.ts:79-97` has no AbortSignal, no cancellation token. On timeout, the race returns to catch but the SDK's connect is still in-flight and eventually resolves. **Mitigation (v3):** the catch block MUST call `try { session.close(); } catch {}` on the local `session` binding (not `sessionRef.current`, which the run-id guard may have already cleared) to force-tear-down the pending peer connection. The run-id guard also fires in any late-resolve continuation and prevents state mutation from the orphan. Both defences apply — session.close() eliminates the peer connection; run-id eliminates the UI state mutation.
- **Appetite** — v4: 5-8 hours (user-elicited). Implementation ~4-5h (state + label + chime + reorder + runIdRef + timeout path + button conditional swap + all 3-orb coherence checks) + 60-90 min manual verification in real Chrome (Playwright cannot reproduce mic timing). See §10 for full cost breakdown. Kill-conditions: (a) Web Audio chime requires external audio asset (iOS Safari edge case) → re-scope; (b) AC-9 fails (Round C n=10 <90% AI-response after immediate speech) → v5 promotes §7.2 to in-scope; (c) Round E reveals Nebularr or Circle need dedicated warming-state visual work → pause and re-plan (visual work is a ship-blocker per elicitation).

- **PIS wrongness-check** (per ELICITATION.md §Wrongness check, user answered 2026-07-03) — Strongest argument this PIS could still be wrong: **F-9 fires empirically.** SDK's `openaiRealtimeWebRtc.js:124` resolves `connect()` on data-channel `open`; `updateSessionConfig(...)` at line 131 is not awaited. So chime + label swap + spinner-off can all fire cleanly WHILE OpenAI's server-side session config is still propagating — user speaks → VAD misses first word → UVO silently fails despite perfect-looking UX. Mitigation: AC-9 (§9) is the empirical gate; ≥90% AI-response rate on immediate-speech Round C ships the assumption. <90% escalates §7.2 to in-scope for v5. The PIS accepts this residual risk with named escalation trigger rather than pre-emptively expanding scope.

# §1. Problem statement (verified against current code)

Verified at HEAD `0d7003c` (2026-07-02):

- `AppState` union at `VoiceRealtimeOpenAI.tsx:160`: `'idle' | 'listening' | 'ai_thinking' | 'ai_speaking'`. No `connecting` value.
- `handleStartConversation` at `VoiceRealtimeOpenAI.tsx:570`:
  - Line 580: `setAppState('listening')` fires synchronously on click, BEFORE `await getUserMedia`, BEFORE token fetch, BEFORE `await session.connect()`.
  - Line 713: `await session.connect({ apiKey: ephemeralKey })` — the actual moment WebRTC pipeline becomes live.
  - Line 714 (post-resolve): a `[TIMING +N ms]` log only. No state transition.
- `VoiceStateLabel` at `ui/VoiceStateLabel.tsx:10-21`:
  - `VoiceStateLabelState` union: same 4 values as AppState.
  - `STATE_LABELS.idle = 'Ready when you are'` — this is the string user rejected on the `014f7af` fix.
  - `STATE_LABELS.listening = 'Listening...'`.
  - Label re-renders with `key={state}` at line 27 → 150ms `fadeIn` animation on change.
- `getLabelState()` at `VoiceRealtimeOpenAI.tsx:782-784`: passes `appState` directly to the label. No transformation layer.

**Live evidence** (Playwright session earlier this session, prod at `https://www.littleexp.com/voiceinterface/realtime`):
- `session.connect()` resolved at `+12,135ms` from Record click (10.4s of which was Playwright's headless-mic delay — real Chrome is ~50-100ms for cached mic permission).
- Real-Chrome delay from click → `session.connect()` resolve = ~1.3-2.0s in normal conditions.
- Anything the user says between click and `session.connect()` resolve is captured by the local mic analyser (visible in orb) but does NOT reach OpenAI's VAD.

**Community corroboration** ([OpenAI community forum, 2025](https://community.openai.com/t/realtime-api-webrtc-first-word-consistently-lost-when-voice-feedback-enabled-98-reproduction-rate/1370816)): 98% reproduction rate for first-word loss; canonical fix is to gate audio-send on the WebRTC connection being actually live, not on button click.

# §2. Architectural decision — `isConnecting` boolean, orthogonal to `AppState`

**Decision**: introduce a separate `isConnecting: boolean` state alongside `AppState`. Do NOT add a `'connecting'` value to the `AppState` union.

**Why this over the alternative**:

The `AppState` union has consumers across **5 orb components** (`RealtimeBlob.tsx` declaration + consumer, `NebularrBlob.tsx` own declaration + consumer, `RadialRealtimeBlob.tsx` re-import + consumer, `CircleRealtimeBlob.tsx` re-import + consumer, `CoralRealtimeBlob.tsx` own declaration + consumer — re-verified via `grep -rn "RealtimeVoiceState" src/` 2026-07-03), plus the imported `RealtimeVoiceState` re-alias in `VoiceRealtimeOpenAI.tsx:8`. VelvetOrb.tsx has its own separate `VoiceState` union (line 19) and is not currently used by the realtime page. Adding a new union value would force each of the 5 orb consumers to either handle `'connecting'` or downcast — a wide surface for regression, and NOT the "keep orb calm during warming" behavior we want (Variant 02).

`isConnecting: boolean` is orthogonal:
- `AppState` remains `'idle'` during warming (orb stays calm — matches Variant 02).
- `isConnecting` gates the LABEL text (via a new `'connecting'` value in `VoiceStateLabelState`) and the button visual.
- Zero touch to the orb consumer graph.

## §2.1 `runIdRef` correctness pattern (NEW in v3)

The v2 plan proposed using `isConversationActiveRef.current` as the F-8 guard. Cross-family review (both Claude Crit-1 and Codex Major-2) flagged this as insufficient: `useEffect` sync of a state → ref is asynchronous. Between `handleStopConversation` calling `setIsConversationActive(false)` (line 761) and React committing the effect that writes the ref, an in-flight `session.connect()` can resolve. The ref still reads `true`, guard passes, phantom Listening + chime fires.

v3 replaces the state-derived mirror with an **imperative per-Start `runIdRef`**:

```ts
const runIdRef = useRef<number>(0);
```

- On every Start entry: `runIdRef.current += 1; const myRunId = runIdRef.current;` — SYNCHRONOUS write inside the click handler, no useEffect indirection.
- On every Stop entry (as the FIRST line of `handleStopConversation`, before any await): `runIdRef.current += 1;` — invalidates any in-flight Start.
- At **every** post-await checkpoint — five sites: post-`ctx.resume()`, post-`getUserMedia`, post-`fetch(token)`, post-`response.json()`, post-`Promise.race([session.connect(...), timeout])` — plus inside the catch/timeout paths: `if (runIdRef.current !== myRunId) { /* my Start was cancelled; return without mutating state */ return; }`. **v4.1 addition** (per Claude Major-1): post-`getUserMedia` and post-`response.json()` were promised here but omitted from v3/v4's §6 diff. v4.1 §6 now shows all five.
- Also on timeout (Promise.race): the timeout branch increments runIdRef and calls `try { session.close(); } catch {}` on the local session binding.

**Why this shape:**
- Synchronous write eliminates the React-commit gap that broke v2's isConversationActiveRef.
- Per-Start scoping via captured `myRunId` handles rapid Start→Stop→Start cycles: run 3 does not accept run 2's late resolve.
- Same pattern guards F-8 (Stop during warming), F-9 (late VAD-ready check if promoted in v4), F-10 (Promise.race timeout with in-flight orphan).

**Non-goal:** the runIdRef does NOT replace `isConversationActive` state. That state still drives orb rendering + audio interval + button visual. runIdRef is a *correctness gate* on state mutations from async closures, orthogonal to the rendering state.

## Consumers subsection (Principle 2 — visible enumeration)

Every place that reads or writes `isConnecting` OR `runIdRef` in the shipped change:

**Producers** (write `isConnecting`):
- `VoiceRealtimeOpenAI.tsx` `handleStartConversation` (line ~578 area): sets `true` on click, before token fetch.
- `VoiceRealtimeOpenAI.tsx` post-`session.connect()` (line ~714 area): sets `false` on ready — GUARDED by runIdRef check.
- `VoiceRealtimeOpenAI.tsx` error catch (line ~716 area): sets `false` on error/timeout.
- `VoiceRealtimeOpenAI.tsx` `handleStopConversation` (line ~763 area): sets `false` on stop — defense in depth.

**Producers** (write `runIdRef.current`):
- `handleStartConversation` first line of try block: `runIdRef.current += 1; const myRunId = runIdRef.current;`.
- `handleStopConversation` first line: `runIdRef.current += 1;`.
- Timeout branch of Promise.race: `runIdRef.current += 1;` (belt-and-suspenders — the Stop path also increments, but the timeout path is not user-driven).

**Consumers** (read `runIdRef.current`):
- Every post-await checkpoint in `handleStartConversation`: compares captured `myRunId`; returns early on mismatch.
- catch block in `handleStartConversation`: reads to decide whether to force `session.close()` on the local binding.

**Consumers** (read `isConnecting`):
- `getLabelState()` at `VoiceRealtimeOpenAI.tsx:782` — reads `isConnecting`; returns `'connecting'` when true, otherwise `appState`.
- Button rendering at `VoiceRealtimeOpenAI.tsx:831-836` — reads `isConnecting` to choose between `<ProcessingButtonDark>` (warming) and `<MorphingRecordWideSimple>` (idle/recording). v4 component-swap pattern; see §6 button-during-warming section for verified prop wiring.

**v3 removes** (v2 defect — Claude Finding 10 verified via `voicemorphingbuttons.tsx:2387-2394`):
- `isConversationActiveRef` mirror. Not introduced. Replaced by runIdRef.

**Non-consumers** (verified NOT touched):
- Orb rendering (`getVoiceState()` at line 772-776) — unchanged. Orb sees `appState === 'idle'` during warming and behaves as idle.
- Audio polling interval (line 664-668) — unchanged. Reads mic analyser only when `appState === 'listening'`, so orb's audio visualization stays silent during warming (matches Variant 02).
- All 5 orb-component `RealtimeVoiceState` union declarations (`RealtimeBlob.tsx:22`, `NebularrBlob.tsx:28`, `RadialRealtimeBlob.tsx` imports from `RealtimeBlob`, `CircleRealtimeBlob.tsx` imports from `RealtimeBlob`, `CoralRealtimeBlob.tsx:23`) — untouched. VelvetOrb.tsx's separate `VoiceState` union (line 19) also untouched.

# §3. State-machine transitions (concrete lifecycle)

Explicit transitions for every combination:

| Event                                 | Before                                          | After                                          |
|---------------------------------------|-------------------------------------------------|------------------------------------------------|
| Click Record (from idle)              | `appState='idle'`, `isConnecting=false`         | `appState='idle'`, `isConnecting=true`         |
| Mic permission denied / error thrown  | `isConnecting=true`, any `appState`             | `isConnecting=false`, `appState='idle'`, error set |
| `session.connect()` resolves          | `appState='idle'`, `isConnecting=true`          | `appState='listening'`, `isConnecting=false`, chime plays |
| `session.connect()` rejects           | `appState='idle'`, `isConnecting=true`          | `isConnecting=false`, `appState='idle'`, error set |
| Click Record during warming           | `isConnecting=true`                             | no-op (button disabled OR click ignored)       |
| Click Stop from `listening`           | `appState='listening'`, `isConnecting=false`    | `appState='idle'`, `isConnecting=false` (existing behavior)  |
| Click Stop during warming (edge case) | `appState='idle'`, `isConnecting=true`          | `appState='idle'`, `isConnecting=false`, session aborted if partially initialized. **v3 F-8 guard (§2.1 runIdRef)** — Stop increments runIdRef synchronously; when `session.connect()` later resolves, captured `myRunId` mismatches; post-await block returns early without state mutation or chime. |
| 6s timeout fires (Promise.race) | `appState='idle'`, `isConnecting=true`          | `appState='idle'`, `isConnecting=false`, error set to "Connection timed out — please try again". **v3 F-10 mitigation** — timeout branch increments runIdRef, force-calls `session.close()` on local binding, invokes catch block. Late-resolve of the real connect is caught by runIdRef mismatch and no-ops. |

## Lifecycle owner (Principle 5)

`isConnecting` is owned by `VoiceRealtimeOpenAI` alone. No child component sets it. All writes are inside `handleStartConversation`, its catch block, or `handleStopConversation`. `useEffect` cleanup does NOT touch it (nothing subscribes cross-mount).

## `appStateRef` mirror rule

`appState` has an existing `appStateRef` mirror at `VoiceRealtimeOpenAI.tsx:385-386` to work around closure-stale-state in intervals/handlers. `isConnecting` does NOT need a ref mirror because no closure in the current code reads it inside a setInterval/event-handler — verified via grep for all places `isConnecting` will be read (§2 Consumers). If a future consumer inside a closure reads it, add the mirror at that time.

**v3 clarification:** `isConnecting`'s state mirror is a *rendering-lag* concern; `runIdRef` is a *correctness-under-async-race* concern. They solve different problems and both exist.

# §4. UI changes — `VoiceStateLabel` extension

## Type extension

`VoiceStateLabelState` union at `ui/VoiceStateLabel.tsx:10`:

```ts
// BEFORE
export type VoiceStateLabelState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

// AFTER
export type VoiceStateLabelState = 'idle' | 'connecting' | 'listening' | 'ai_thinking' | 'ai_speaking';
```

## Label string

`STATE_LABELS` map at `ui/VoiceStateLabel.tsx:16`:

```ts
// AFTER — one new entry
const STATE_LABELS: Record<VoiceStateLabelState, string> = {
  idle: 'Ready when you are',
  connecting: 'Connecting',  // v4: text only, centered. Spinner is on the button (ProcessingButtonDark), not the label.
  listening: 'Listening...',
  ai_thinking: 'Thinking...',
  ai_speaking: 'Speaking...',
};
```

## Rendering — v4: label is TEXT-ONLY (no bouncing dots)

**v4 change from v3**: the spinner is on the BUTTON (`ProcessingButtonDark`), not the label. The label is text-only for all 5 states. This eliminates two-motion-source competition (dots + spinner) and lets `ProcessingButtonDark`'s existing spinner carry the whole "activity indicator" load. Layout jitter is solved by centering (`text-align: center` already exists at line 37).

Render change at `VoiceStateLabel.tsx:23-30`:

```tsx
export const VoiceStateLabel: React.FC<VoiceStateLabelProps> = ({ state }) => {
  return (
    <>
      {/* Key forces re-render on state change, triggering fade animation.
       * v4.1: aria-live="polite" + role="status" so screen-reader users
       * hear the transition "Ready when you are" → "Connecting" →
       * "Listening…" — load-bearing because focus drops to <body> on
       * the button component swap (see §6 button-during-warming). */}
      <div
        key={state}
        className="voice-state-label"
        aria-live="polite"
        role="status"
      >
        {STATE_LABELS[state]}
      </div>

      <style jsx>{`
        /* NO CHANGE from source — only the type + STATE_LABELS map above changed. */
        .voice-state-label {
          font-family: 'Open Runde', 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: var(--VoiceDarkGrey_30, rgba(38, 36, 36, 0.3));
          text-align: center;
          animation: fadeIn 150ms ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
};
```

**Removed from v4**: `.dots`, `.dot`, `@keyframes dotBounce`, `@media (prefers-reduced-motion)` block that dropped dots. Reduced-motion still works — the label + text-swap remain (they don't animate anything beyond the 150ms fadeIn which is unaffected).

**New in v4.1**: `aria-live="polite"` + `role="status"` attributes on the `.voice-state-label` div. This is load-bearing for the accessibility contract per Codex Major-1 (see §6). Screen-reader users hear state changes; focus-management is intentional (focus drops to `<body>` on button-component-swap but the ARIA announcement carries the transition).

## Consumers subsection (Principle 2)

**Producers** (write `VoiceStateLabelState` via the `state` prop):
- `VoiceRealtimeOpenAI.tsx:825` `<VoiceStateLabel state={getLabelState()} />` — the sole caller.

**Consumers** (read the union):
- The label component itself (this file).
- `VoiceRealtimeOpenAI.tsx:782-784` `getLabelState()` return type.
- **No other file** — verified via `grep -rn "VoiceStateLabelState" src/ 2>/dev/null` before writing this. If a consumer is added later, `'connecting'` must be added to its handling.

**Non-consumers** (verified):
- The 4 orb `RealtimeVoiceState` unions are structurally identical but semantically different (they drive orb rendering, not text labels). Not touched. If future refactoring merges them, the merge task owns propagating `'connecting'`.

# §5. Web Audio chime helper

## Implementation sketch

Add a helper function inside `VoiceRealtimeOpenAI.tsx` (or extracted to a new file — see §5.1 open question):

```ts
/**
 * playConnectChime — short ascending sine chime to signal "pipeline live".
 * Synthesised in-browser (no external audio asset). Uses the same AudioContext
 * already created for the mic analyser at handleStartConversation:584 — no
 * autoplay-policy issue because the ctx was created inside the click handler.
 * 440 → 660 Hz over 100ms; peak amplitude 0.24 with 20ms rise / 110ms decay envelope.
 */
async function playConnectChime(ctx: AudioContext): Promise<void> {
  try {
    // v3 (Claude Major-2 finding): AWAIT resume before scheduling, not
    // fire-and-forget. If ctx is suspended (e.g., tab backgrounded during
    // warming), ctx.currentTime is frozen. Scheduling on frozen currentTime
    // while resume completes later means the envelope math is applied to a
    // paused clock and the entire envelope replays instantaneously when
    // resume finishes — audible as a CLICK, not a chirp.
    // Awaiting resume ensures currentTime is live before we schedule.
    // If resume rejects (rare — e.g., audio hardware unavailable), we
    // return silently; the visual signal (setAppState + text swap) is
    // the load-bearing ready cue, chime is defence-in-depth.
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  } catch (err) {
    // Silent failure — chime is defence-in-depth; visual signal is load-bearing.
    console.warn('[OpenAI Realtime] Chime playback failed:', err);
  }
}
```

Byte-equivalent to the chime synth in `tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md`-derived mockup at `/private/tmp/.../scratchpad/warming-state-mockup.html` (scratchpad; not shipped). The mockup was empirically validated by the user (chose Variant 02 after playing all four); the shipped implementation must remain acoustically equivalent.

## §5.1 Open question — inline helper vs new file

Inline in `VoiceRealtimeOpenAI.tsx` is simplest (one file touched, no import). Extracting to `src/projects/voiceinterface/services/connectChime.ts` improves reusability if future voice pages want the same chime. **Default to inline** for MVP; extract at the second consumer if it arrives. Decision: inline.

## Consumers subsection (Principle 2)

**Producers** (call `playConnectChime`):
- `VoiceRealtimeOpenAI.tsx` post-`session.connect()` at ~line 714. Only caller.

**Consumers of the chime's timing**: the user's ears + any downstream analytics (none currently).

**Non-consumers**:
- No test currently asserts chime playback (Web Audio in Playwright headless is unreliable). Manual verification only.

# §6. `handleStartConversation` reordering sketch

> **⚠️ Historical snapshot (v3/v4 draft).** The diff and prose below are the v3/v4 authoring-time sketch. **Shipped code diverges** — see `version_history` (v4.2.1, v4.2.2, v4.2.3) for material changes: `withConnectTimeout` helper (replaces raw `Promise.race`), discriminator `__expected`+`__timeoutTag` on timeout errors (replaces `err.message ===` string match), `console.warn` for expected timeouts (replaces unconditional `console.error`), catch-block cleanup gated behind `isCurrentRun` (was unconditional), late-resolve callback on getUserMedia + session.connect (was missing — mic/session leaked on late resolve). For current shipped shape, read `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` at HEAD.

**v3 diff shape** at `VoiceRealtimeOpenAI.tsx:570-720` (concrete lines assume HEAD `4cd7c45`). Rewritten from v2 to address Crit-1 (imperative runIdRef) + Crit-2 (explicit session.close on error/timeout) + Codex-Major-1 (Promise.race clarification):

```diff
+  // Alongside existing state refs (~line 385):
+  const runIdRef = useRef<number>(0);

   const handleStartConversation = async () => {
     sessionT0Ref.current = performance.now();
     console.log(`[TIMING +${dtNow()}ms] Click Record → starting conversation`);
+    // v3 §2.1 — imperative per-Start ID. NO useEffect; must be
+    // synchronous inside the click handler so Stop's increment is
+    // visible to any in-flight await continuation.
+    runIdRef.current += 1;
+    const myRunId = runIdRef.current;
+    // Captured for late-resolve force-close of a Promise.race-abandoned
+    // SDK connect (F-10). Not the same as sessionRef.current because
+    // Stop may null sessionRef during the await window.
+    let localSession: RealtimeSession | null = null;
     try {
       setIsConversationActive(true);
-      setAppState('listening');
+      setIsConnecting(true);
       setError('');

       // 1. Create AudioContext
       const ctx = new AudioContext();
       audioContextRef.current = ctx;
       if (ctx.state === 'suspended') await ctx.resume();
+      if (runIdRef.current !== myRunId) return;

       // 2. Capture mic (existing at source line 589) — GUARD v4.2 (Codex Pass-3 Major fix)
+      // Original await:
+      //   const micStream = await navigator.mediaDevices.getUserMedia({...});
+      //   micStreamRef.current = micStream;
+      // v4.1 placed the guard AFTER `micStreamRef.current = micStream`; Codex
+      // Pass-3 flagged this as a mic-stream leak: if Stop fired during
+      // permission-prompt, cleanupAudio (source line 532) ran on a null ref
+      // and returned; then getUserMedia resolved, assigned a fresh stream to
+      // the ref, and the guard returned — orphan mic tracks stay live.
+      // v4.2 fix: guard BEFORE assigning to ref, and stop tracks SYNCHRONOUSLY
+      // if mismatched. Replace `micStreamRef.current = micStream;` with:
+      const micStream = await navigator.mediaDevices.getUserMedia({...});
+      if (runIdRef.current !== myRunId) {
+        // Late resolve — Stop already ran cleanupAudio on the old (null) ref.
+        // Stop the tracks we just captured; do NOT assign to the ref.
+        micStream.getTracks().forEach(t => t.stop());
+        return;
+      }
+      micStreamRef.current = micStream;

       // ... steps 3-5 unchanged (analysers, transport, agent) ...
       // Step 6: RealtimeSession creation.
       const session = new RealtimeSession(agent, { transport });
+      // v4.2 — capture the session in the outer `let localSession` so the
+      // catch/timeout paths can force-close it even if sessionRef has been
+      // nulled by Stop. Must happen at the SAME statement as construction —
+      // if a mid-await throws before this line, localSession stays null and
+      // the catch's `if (localSession)` guard skips the .close() gracefully.
+      localSession = session;
       // ... steps 7-9 unchanged (listeners) ...

       // 10. Get ephemeral token and connect
       console.log(`[TIMING +${dtNow()}ms] Fetching ephemeral token...`);
       const response = await fetch('/api/voice-interface/openai-realtime-token');
+      if (runIdRef.current !== myRunId) return;
       if (!response.ok) throw new Error(`Failed to get token: ${response.statusText}`);
       const tokenData = await response.json();
+      // v4.1 — guard AFTER response.json() too, since json() is an async parse.
+      // (Note: response.json() has no capture-and-assign shape like getUserMedia,
+      //  so a plain early-return here is safe — no orphan resources to clean up.)
+      if (runIdRef.current !== myRunId) return;
       const ephemeralKey = tokenData.key;
       if (!ephemeralKey) throw new Error('No ephemeral token received');
       console.log(`[TIMING +${dtNow()}ms] Got ephemeral token`);

-      await session.connect({ apiKey: ephemeralKey });
+      // v3 §7.4 — Promise.race gives us a UI-timeout, NOT a connect-abort.
+      // The SDK connect has no cancellation (verified: realtimeSession.d.ts:79-97
+      // — RealtimeSessionConnectOptions has no AbortSignal). On timeout, the
+      // race returns but the underlying SDK connect is still in-flight. The
+      // catch block's force-close and runIdRef guard together handle the
+      // orphan.
+      await Promise.race([
+        session.connect({ apiKey: ephemeralKey }),
+        new Promise<never>((_, rej) =>
+          setTimeout(() => rej(new Error('connect-timeout')), 6000)
+        ),
+      ]);
       console.log(`[TIMING +${dtNow()}ms] session.connect() resolved — WebRTC ready, OpenAI VAD active`);
+
+      // v3 F-8 guard — imperative runIdRef, not useEffect-derived.
+      // If Stop fired during the connect window OR timeout won the race
+      // and this is the late-resolve, myRunId no longer matches.
+      if (runIdRef.current !== myRunId) {
+        // Late resolve of an abandoned run. Force-close to prevent
+        // orphan peer connection + track leak.
+        try { session.close(); } catch { /* SDK may throw on double-close */ }
+        return;
+      }
+      setAppState('listening');
+      setIsConnecting(false);
+      // Chime is async in v3 (await ctx.resume() if suspended). Fire and
+      // forget the promise — the visual transition already fired above.
+      void playConnectChime(ctx);

     } catch (err) {
       console.error('[OpenAI Realtime] Error starting conversation:', err);
+      const isTimeout = err instanceof Error && err.message === 'connect-timeout';
+      setError(isTimeout
+        ? 'Connection timed out — please try again.'
+        : 'Failed to start conversation. Please check your microphone.');
-      setError('Failed to start conversation. Please check your microphone.');
       setAppState('idle');
+      setIsConnecting(false);
       setIsConversationActive(false);
+
+      // v3 F-10 — force-close any SDK session that may still be in-flight
+      // after the timeout branch or a mid-connect throw. The local
+      // binding is authoritative; sessionRef may have been nulled.
+      if (localSession) {
+        try { localSession.close(); } catch { /* best-effort */ }
+      }
+      // Invalidate the run so a late resolve of the abandoned connect
+      // does not mutate state.
+      runIdRef.current += 1;

       if (audioIntervalRef.current) {
         clearInterval(audioIntervalRef.current);
         audioIntervalRef.current = null;
       }
       cleanupAudio();
     }
   };

+  // In handleStopConversation, add as FIRST line (before any await):
+  //   runIdRef.current += 1;
+  // This invalidates any in-flight Start synchronously.
```

**Note on the catch block shown above.** The lines from `setIsConversationActive(false)` through `cleanupAudio()` (at `VoiceRealtimeOpenAI.tsx:722-727` at HEAD `4cd7c45`) already exist in the source — they are NOT new additions. New in v3: `setIsConnecting(false)`, the timeout-vs-generic error message split, the `localSession.close()` force-tear-down, the trailing `runIdRef.current += 1` invalidation. The diff shows the full block so a fresh implementer sees the additions in true context.

**Note on removed v2 mirror.** v3 does NOT introduce `isConversationActiveRef` / its useEffect sync. The v2 approach was flagged as racey (Claude Crit-1 + Codex Major-2 convergent). Replaced by imperative `runIdRef` per §2.1.

## Button-during-warming affordance (v4 — component swap to `ProcessingButtonDark`)

**v4 rejects v3's `disabled={isConnecting}` approach entirely.** User surfaced the correct pattern in elicitation: `ProcessingButtonDark` from `voicebuttons.tsx:1386` is a purpose-built spinner-only pill matching the voice interface's dark-pill vocabulary. Full component swap during warming avoids the entire "disabled Stop button" ambiguity (v3 defect verified in discovery §2).

**`ProcessingButtonDark` contract** (verified at `voicebuttons.tsx:1379-1503`):
- Props: `{ onClick?, disabled?, className?, isProcessing? }`. `isProcessing` defaults to `true` and controls spinner animation.
- Size: 64×38px (12px width + 6px height smaller than `MorphingRecordWideSimple`'s 76×44 — user explicitly accepted "not a huge size change").
- Background: `var(--VoiceDarkGrey_90)` (0.9 opacity — one shade lighter than Simple's 0.95; visually near-identical dark pill).
- Border-radius: 24px (pill, matches Simple's 23.16px within 1px).
- Spinner: 8-spoke SVG, `1.5s linear infinite` rotation via `.spinner-container.spinning`.
- Disabled behavior: `opacity: 0.5`, `cursor: not-allowed`, `animation-play-state: paused`.
- Reduced-motion: `@media (prefers-reduced-motion: reduce)` sets `animation: none !important` at line 1494-1499.

**v4.1 rewrite (post Codex Major-1)** — v4's naive `<ProcessingButtonDark disabled={true} aria-label="…" />` had 3 defects verified at source:

1. **Frozen spinner** (Codex): `voicebuttons.tsx:1489-1491` — `.processing-button-dark:disabled .processing-spinner { animation-play-state: paused; }`. Applying `disabled={true}` STOPS the spinner rotation. AC-11 requires spinner animating; self-contradictory plan.
2. **Type-check failure** (Codex): `ProcessingButtonDarkProps` at `voicebuttons.tsx:1379-1384` accepts ONLY `{onClick?, disabled?, className?, isProcessing?}`. `aria-label` is not a prop; component hardcodes `aria-label="Processing"` at line 1398. JSX won't type-check.
3. **Accessibility drop** (Codex): unmount of `MorphingRecordWideSimple` → mount of `ProcessingButtonDark` moves focus to `<body>` because the newly-mounted button isn't auto-focused. Screen-reader users get no announcement because `VoiceStateLabel` has no `aria-live` (verified via `grep aria-live` — zero hits).

**v4.1/v4.2 fix — suppress clicks via handler-omission at the swap boundary, NOT the DOM `disabled` prop.** During warming, `ProcessingButtonDark` renders with no `onClick` prop wired — clicks land on a button whose click handler is undefined and produce no side-effect. The spinner keeps animating (no `disabled` freeze). Focus WILL drop to `<body>` on the component-type swap (React reuses button elements only when the component type is stable, which it isn't across the swap) — so the label carries the state announcement via `aria-live` instead.

*v4.2 clarification (Codex Pass-3 Minor 2):* v4.1's prose claimed "handler-side guard + `aria-disabled`" but the JSX passes neither an onClick nor an aria-disabled. That was inaccurate. There is NO `aria-disabled` in the shipped JSX — extending `ProcessingButtonDarkProps` to accept it is deferred (would touch the shared component's contract). The load-bearing accessibility path is the `aria-live` on the label; the button itself is hardcoded `aria-label="Processing"` at `voicebuttons.tsx:1398` which SR users hear when they focus it.

**Implementation** (`VoiceRealtimeOpenAI.tsx` render section, replaces current lines 830-836):

```tsx
import {
  MorphingRecordWideSimple,
} from '@/projects/voiceinterface/components/ui/voicemorphingbuttons';
import { ProcessingButtonDark } from '@/projects/voiceinterface/components/ui/voicebuttons';

// ... inside the render, in the .button-container div ...
<div className="button-container">
  {isConnecting ? (
    <ProcessingButtonDark
      isProcessing={true}
      // NO `disabled` prop — that would freeze the spinner (verified at
      // voicebuttons.tsx:1489-1491 CSS animation-play-state:paused).
      // NO `aria-label` — ProcessingButtonDarkProps does not accept it
      // (verified at voicebuttons.tsx:1379-1384). The component hardcodes
      // aria-label="Processing" at line 1398. Accessible announcement of
      // the state change is carried by the aria-live region on
      // VoiceStateLabel (see §4).
      // No onClick handler → clicks are structurally no-op during warming.
    />
  ) : (
    <MorphingRecordWideSimple
      state={isConversationActive ? 'recording' : 'idle'}
      onRecordClick={handleStartConversation}
      onStopClick={handleStopConversation}
    />
  )}
</div>
```

**Focus + announcement contract (v4.1):**
- `VoiceStateLabel` gains `aria-live="polite"` + `role="status"` on the `.voice-state-label` div (§4 change). When state transitions "Ready when you are" → "Connecting" → "Listening…" fire, SR users hear the new label announced.
- Focus drops to `<body>` on the swap. That's acceptable per WCAG 2.1 because the state transition is announced via `aria-live`. If a keyboard user was tabbed to the Record button, they can re-tab to the Stop button after the transition.
- Alternative considered: extend `ProcessingButtonDarkProps` to accept `...React.ButtonHTMLAttributes<HTMLButtonElement>` and spread onto the `<button>` — deferred to a follow-up plan; would touch the shared component's public contract which is out of scope here.

**Size delta note** — the button-container is 44px tall (`VoiceRealtimeOpenAI.tsx:1005`). When `ProcessingButtonDark` (38px) renders, there's a 6px vertical delta. The container's `display: flex; align-items: center; justify-content: center` centers it; net effect is the button appears vertically-centered in the same 44px slot with 3px space top and bottom. Horizontal centering means the 12px width delta (76 vs 64) is 6px per side — also centered, no jump. Verified: `justify-content: center` at line 1002.

**Edge case — Stop-during-warming is BLOCKED.** With `ProcessingButtonDark` rendered instead of `MorphingRecordWideSimple` during warming, there is no Stop icon to click AND no `onClick` handler is wired. If the user wants to cancel a warming session, they must wait for connect to complete (~1.5s) or timeout to fire (6s). This is arguably correct UX (Cancel-during-connecting is a niche path) and eliminates the F-8 race pathway at the source. The runIdRef guard (§2.1) remains in place as belt-and-suspenders for the timeout path (F-10) and any future code path that might bypass the swap gate.

# §7. Deferred items + open questions

## §7.1 Mic permission on page load (deferred)

User raised: "what if we arrived on the page with the browser already asking you for permission so you do it first, before you even click?" This would shave ~50-100ms from the connect flow on first-time users AND avoid a subtle race where mic-permission-denied fires WHILE the user is watching the "Connecting" state.

**Deferred** for a separate plan. Not in scope here because it's a UX change to the page's entry (pre-click behavior) not to the warming path.

## §7.2 `session.connect()` resolution vs actual VAD-readiness — DEFERRED with escalation trigger (v3)

**v3 finding (Codex Major-3):** SDK's `openaiRealtimeWebRtc.js:124` resolves `connect()` on data-channel `open` event. `updateSessionConfig(...)` at line 131 is NOT awaited before `resolve()`. In practice: the chime may fire while OpenAI's server-side session config is still propagating and VAD is not accepting audio yet.

**UVO risk:** the plan promises "first thing user says AFTER the chime reaches OpenAI's VAD reliably." If VAD isn't actually live at chime-time, UVO fails silently — same first-utterance-lost pathology as pre-fix, just with a nicer-looking connecting state.

**v3 decision: keep deferred with empirical escalation trigger (AC-9).**

Rationale:
- The SDK's data-channel-open → VAD-ready gap is typically <100ms in normal conditions (the config propagation is a single message).
- Real-Chrome verification (§8) will surface any gap that exists in the load-bearing 90%+ pass rate metric.
- If empirically ≥10% of trials fail (AC-9 fails), v5 promotes §7.2 to in-scope. Options:
  - ~~**(a)** Await `session.transport.on("connection_change","connected")` before firing the chime.~~ **DEMOTED in v4.1 per Codex Minor-3.** Verified at `openaiRealtimeWebRtc.js:124-138`: `connection_change: 'connected'` is emitted in the SAME `dataChannel.addEventListener('open', ...)` handler that calls `updateSessionConfig(userSessionConfig)` (fire-and-forget) and `resolve()`. Awaiting this event provides NO additional readiness guarantee beyond `await session.connect()`.
  - **(b)** Await a server-side `session.updated` transport event (if verified to acknowledge the post-open `updateSessionConfig` call). This is upstream of VAD activation.
  - **(c)** Wait for the first `input_audio_buffer.speech_started` event from the SDK before considering VAD live — semantic proof (server-side VAD has processed at least one audio frame). Downside: only fires when user speaks; can't gate a ready-signal chime that must precede speech.
  - **(d)** Hybrid: promote `(b)` as the ready-signal gate; on first `speech_started`, retroactively confirm VAD was live at chime time (telemetry only, no UX impact).

**Shipped in v4.2.2/v4.2.3** on `session.connect()` resolution. AC-9 is the gate that either confirms the choice or triggers v5 (option (b), (c), or (d)).

## §7.3 Peer-connection reuse for subsequent conversations

User's observation: subsequent conversations "work fine without any lag." This is likely BECAUSE `handleStopConversation` disposes of the session and next Start re-negotiates from scratch — so the warming state SHOULD fire again. The user's observation may be selective; needs empirical verification during manual test (§8).

If subsequent Start conversations DO in fact skip the connect delay (e.g., some browser-level RTC state persists), the plan is correct but the warming state may fire unnecessarily. Mitigation for that case: only show "Connecting" if `session.connect()` takes >200ms — i.e., delay the "Connecting" label by 200ms and only show it if warming hasn't already resolved. **Not in MVP scope**; add if empirically warranted.

## §7.4 Hard timeout on warming (F-6) — COMMITTED IN-SCOPE

> **⚠️ Historical draft prose (v3/v4).** Shipped v4.2.3 uses the `withConnectTimeout` helper (not raw `Promise.race`), wraps BOTH getUserMedia AND session.connect, and now includes a late-resolve callback that stops mic tracks / closes the session if the underlying op resolves after the timeout fired. See `version_history` for the incremental fixes.

Falsifier F-6: warming lingers past ~6s on very slow networks. **Ship a 6s timeout** via `Promise.race([session.connect({...}), timeoutPromise])`.

**v3 clarification (Codex Major-1):** Promise.race is a UI-timeout ONLY, not a connect-abort. `RealtimeSessionConnectOptions` at `realtimeSession.d.ts:79-97` has no AbortSignal. On timeout:

1. The race's timeout branch rejects with `Error('connect-timeout')`, which is caught by the try/catch.
2. The catch block force-calls `localSession.close()` on the local session binding (see §6 diff) to tear down the in-flight peer connection.
3. The catch block sets `runIdRef.current += 1` so any late-resolve of the SDK's still-in-flight connect() sees a mismatched run-id and no-ops.
4. The user sees a "Connection timed out" error message; state returns to idle; `isConnecting` clears.

Without steps 2+3, the SDK connect would eventually resolve against a torn-down UI, opening a data channel that no consumer reads and leaking media tracks. Both defences apply. The runIdRef alone would prevent state mutation but leak the peer connection; `session.close()` alone leaves the useEffect race intact.

# §8. Verification approach

**Playwright headless CANNOT reproduce this bug** because its `getUserMedia` has a ~10s delay that dwarfs the ~1.5s connect window (verified: Playwright showed `+10,434ms` for mic capture vs real Chrome's ~50ms). By the time Playwright's mic is live, `session.connect()` is long resolved. Bug does not surface.

**Manual verification protocol** (in real Chrome):

**Round A — happy path (AC-1 through AC-8)**
1. Open `http://localhost:3000/voiceinterface/realtime` (dev server) or the deployed URL.
2. Click Record.
3. Immediately (within 500ms) say "Test one two three". Speech ends by ~2s.
4. Observe:
   - **Pass**: Chime plays; label swaps "Connecting" → "Listening…"; AI responds to the utterance.
   - **Fail-mode-1**: No chime, label jumps to listening immediately, AI doesn't respond (regression to baseline).
   - **Fail-mode-2 (F-9 evidence)**: Chime plays but AI doesn't respond to the immediate utterance (chime fired but VAD wasn't actually live — feeds AC-9).
   - **Fail-mode-3**: Warming state lingers >5s (network or handshake pathology; hits F-6).
5. Click Stop, wait 3 seconds, Click Record again. Repeat step 3.
   - **Pass**: Warming state fires again (correct — session was disposed).
   - **Observation**: if warming state does NOT fire (session.connect() resolves in <100ms), note it — that's §7.3's edge case.
6. Console: verify `[TIMING +N ms]` logs show `session.connect() resolved` FIRING BEFORE `setAppState('listening')` and chime playback (log timing).

**Round B — F-8 late-callback race (n=5, v4.1 reframe)**

In v4.1 the button is component-swapped, not disabled-in-place. During warming, `<ProcessingButtonDark />` renders with NO `onClick` handler → clicks during warming are structurally no-op. So Round B's original "click again during warming" no longer exercises the runIdRef guard through the UI.

To actually test the F-8 guard (Stop-during-warming), Round B force-invokes Stop via DevTools console. **v4.2 note (Claude Pass-3 Minor 3):** the `window.__DEBUG_STOP__` handle is a remove-before-commit hazard; gate its attach behind `if (process.env.NODE_ENV !== 'production') { (window as any).__DEBUG_STOP__ = handleStopConversation; }` so it's stripped from the prod bundle by Next's dead-code elimination. Add a §9 checklist item confirming absence from the built bundle (see AC-15 below).

1. Click Record.
2. Within 200ms (during warming, before chime), open DevTools console and execute `window.__DEBUG_STOP__()`.
3. Verify: NO phantom "Listening" label appears after connect resolves; NO chime plays; UI returns to idle; runIdRef mismatch fires the guarded return in the post-await block (add a `console.log` inside the guard branch to instrument the test).

If any phantom appears, the runIdRef pattern has a defect and must be fixed before ship (F-8 falsifier fired). Pass criterion: 5/5 clean cycles.

**Round C — AC-9 empirical VAD-ready check (n=10)**
1. Ten fresh Start-Stop-Start cycles. For each, log:
   - Did chime fire? (Y/N)
   - Time from click → chime (ms).
   - Did AI respond to immediate speech? (Y/N)
2. Compute AC-9 pass rate. ≥90% AI-response = v4.2 ships. <90% = F-9 fires empirically; v5 promotes §7.2.

**Round D — Timeout path (AC-10)**
1. Chrome DevTools → Network → Throttle to "Slow 3G".
2. Click Record. Wait 6s.
3. Observe: "Connection timed out" error; UI returns to idle; `isConnecting` clears; **`ProcessingButtonDark` unmounts and `MorphingRecordWideSimple` (state='idle') re-mounts** — no phantom stuck spinner (AC-11).
4. Wait an additional 5s (in case real connect resolves late). Observe: no phantom "Listening…" label; no chime; console may have SDK-internal cleanup output but no unhandled promise rejection.

**Round E — Cross-orb coherence (v4.1, AC-12a + AC-12b + AC-12c ship-blockers)**

*v4.1 reframe per Codex Minor-2:* verified at source (`NebularrBlob.tsx:90-111` empty-deps `useEffect`) that Nebularr's intro crossfade fires on **component mount only**, i.e. when the shader dispatcher `RealtimeBlob.tsx:50` swaps between `<CoralRealtimeBlob>` and `<NebularrBlob>` on profile change. Clicking Record is a sibling change below `.button-container` — the `.orb-container` above stays mounted. Round E must distinguish these two paths.

For EACH pinned orb — Coral (default), Nebularr, Circle — click the profile-strip thumb to swap, then WAIT ≥500ms for any mount-time animation to complete, THEN repeat Rounds A + C + D with that orb active.

- **AC-12a — Mount-context invariance (per orb)**: verifies the button swap doesn't remount the orb.
  1. With Nebularr active and settled, click Record.
  2. Capture DevTools screenshot at t=0 and t=200ms.
  3. Diff `.orb-container` bitmap (using DevTools "Rendering" → capture screenshot). Expected: only audio-reactive noise floor differences, no crossfade replay.
  4. If crossfade DOES replay: React reconciliation is remounting Nebularr when it shouldn't. STOP; investigate parent-render tree before ship.

- **AC-12b — Composition non-interference (per orb, ship-blocker)**: verifies spinner + label overlay coherently on each orb visual.
  1. With this orb active + settled, click Record and hold in warming state (throttle network to Slow 3G to extend the window to ~6s).
  2. Record 3-second screen capture of `.voice-realtime-card`.
  3. Concrete pass criteria: (i) spinner completes ≥1 full rotation without visual overlap collision with orb geometry; (ii) "Connecting" label fully readable, centered ±1px within `.state-label-container`; (iii) no visible frame tearing between orb r3f canvas and spinner SVG rotation in slow playback.
  4. Failure mode: any visible tearing/collision → ship BLOCKED. Log specifics and escalate to per-orb v5 treatment.

- **AC-12c — Profile-switch overlap (per orb, observation only, non-blocker)**:
  1. Click a fresh profile thumb (e.g. Nebularr from Coral), then click Record within 500ms of the switch (while crossfade is still running).
  2. Log: does the warming state visually conflict with the running crossfade? YES/NO. This is a niche path (user must be fast); observation feeds into potential follow-up if it's the source of any Round-E complaint.

Alternative acceptable outcome: all 3 orbs pass AC-12a + AC-12b cleanly. Ship.

**Manual A/B** against `origin/main` HEAD (should preserve baseline bug) — optional; validates the fix is doing something rather than the environment having changed.

# §9. Acceptance criteria

Fix is done when ALL are true:

1. **AC-1 — Load-bearing bug fix.** On a fresh Chrome tab, clicking Record then immediately talking (within 500ms) produces an AI response for that utterance in ≥90% of trials (n=10). Baseline reproduction rate before fix: ~98% failure.
2. **AC-2 (v4) — Connecting label + spinner button.** The "Connecting" text (centered, no dots) appears within one frame of click. Simultaneously, the button visually swaps from `MorphingRecordWideSimple` (mic icon) to `ProcessingButtonDark` (spinner). Both transitions land in the same paint.
3. **AC-3 — Chime firing.** A short chime plays at the moment `session.connect()` resolves (or, on very fast resolve <200ms, may be omitted per §7.3). Chime is audible on a MacBook Pro speaker at default volume; NOT annoying at repeat.
4. **AC-4 — Label transitions.** Text label transitions "Ready when you are" → "Connecting" → "Listening…" with the existing 150ms fade animation preserved on each transition.
5. **AC-5 — Network error case.** Kill wifi mid-warm; verify UI returns to idle with error message; `isConnecting` clears; `runIdRef` invalidates.
6. **AC-6 (falsifiable — ships blocker, v3 rewrite):** For every Start-Stop-Start cycle (n=5), when the full warming path fires it MUST be atomic: label swap "Connecting" → "Listening…" AND chime playback occur within one animation frame of each other. Failure modes that gate ship: (a) chime plays but label stays "Connecting"; (b) label swaps to "Listening…" but chime never plays; (c) chime fires BEFORE `session.connect() resolved` log line appears in console; (d) label + chime fire on a run whose Stop was already clicked (phantom Listening after Stop — F-8 race). v2's AC-6a listed "orb-jumping-to-listening-before-chime" — v3 removes this because §6 shows `setAppState('listening')` and `playConnectChime` are synchronous adjacent lines; the failure mode is structurally impossible under the shipped code.
7. **AC-7 (observation only — not gate):** Record in the test log whether §7.3's fast-resolve edge case fired empirically (n=5 cycles). If yes across all cycles, note it for the follow-up peer-connection-reuse investigation.
8. **AC-8 — Clean console.** No unhandled errors, no rejected promise warnings.
9. **AC-9 (v3 — Codex Major-3 escalation trigger, load-bearing to UVO):** For n=10 real-Chrome trials with "click → immediate speech (<200ms after chime)," AI response rate is ≥90%. If <90%, §7.2 promotes to in-scope for **v5**; ship of v4.1 is BLOCKED. This AC catches the "session.connect() resolves before VAD is server-side ready" pathology (F-9). Pass = MVP assumption validated. Fail = SDK data-channel-open is an insufficient ready signal; escalate per §7.2's option (b) or (d).
10. **AC-10 — Timeout path.** Simulate slow network (Chrome DevTools throttle to "Slow 3G"). Click Record. Verify: (a) at ~6s the "Connection timed out" error appears; (b) UI returns to idle; (c) `isConnecting` clears; (d) if the real connect resolves >1s after the timeout, no phantom "Listening…" label or chime fires (runIdRef guard verified); (e) `console.warn` may show SDK internal cleanup output but no unhandled promise rejection.
11. **AC-11 (v4.1 rewrite) — Component swap during warming.** During "Connecting" state, verify (DevTools):
   - Rendered button is `<button class="processing-button-dark">`, NOT `<button class="record-wide-stop-button">`.
   - Button `disabled` attribute is ABSENT (v4.1 removed it — disabled would freeze the spinner per `voicebuttons.tsx:1489-1491`).
   - Spinner `.processing-spinner` has computed style `animation-play-state: running` (or `animation: none` if `prefers-reduced-motion: reduce` is set).
   - Clicking the button while `isConnecting === true` produces no visible response (no `onClick` handler wired in the connecting branch — verified by absence of the prop in the JSX).
12. **AC-12a (v4.1 — mount-context invariance, ship-blocker).** Empirical verification per Codex Minor-2: **the button-component swap does NOT re-mount the orb.** With Nebularr active, click Record. Capture DevTools screenshots at t=0 (immediately post-click) and t=200ms (mid-warming). Diff the orb-container bitmap. Expected: no perceptible difference beyond the mic's own audio-reactive noise floor. Failure mode: if Nebularr's mount-time crossfade replays (`NebularrBlob.tsx:90-111` empty-deps useEffect), Round E has caught a React reconciliation surprise that must be investigated before ship.
13. **AC-12b (v4.1 — composition non-interference, ship-blocker).** With `ProcessingButtonDark` rendered during warming, record a 3-second screen capture on each of Coral/Nebularr/Circle. Concrete pass criteria: (i) spinner rotation (1.5s linear) is visible for at least one full cycle without visual overlap collision with orb geometry; (ii) label "Connecting" is fully readable, no truncation, centered ±1px within the `.state-label-container`; (iii) no frame-tearing across the composition (visible via slow playback). Failure mode: if any orb's motion produces a visual "tearing" against the spinner's frame boundaries, ship is BLOCKED per user's elicited ship-blocker.
14. **AC-12c (v4.1 — profile-switch overlap edge case, non-blocker).** Per Codex Minor-2 reframing: the Nebularr crossfade fires on **mount**, i.e. profile-switch. Distinct from Start. Test protocol: click a Nebularr profile thumb, then click Record within 500ms of the switch (while the crossfade is still running). Expected: crossfade completes cleanly regardless of warming state; if warming starts mid-crossfade, both animations run in parallel without visual conflict. NOT a ship-blocker; observation only. Log outcome for a potential follow-up.
15. **AC-13 (v4 — layout stability).** Take DevTools screenshot at each state (idle / connecting / listening / thinking / speaking) with the DevTools "device pixel ratio" toolbar overlay. Measure horizontal offset of the label's center. All 5 states must have the label center within ±1px of each other — proves centering solves the jitter concern raised in elicitation.
16. **AC-14 (v4.1 — accessibility, non-blocker).** VoiceOver / NVDA announces state transitions. Concrete test: with SR active, click Record; SR should announce "Connecting" within ~200ms of the click, and "Listening" within ~200ms of the chime. If SR announces nothing (indicating `aria-live` misconfigured), fix before ship. Reduced-motion users: verify spinner has `animation: none` per the media query at `voicebuttons.tsx:1494-1499`.
17. **AC-15 (v4.2 — no debug scaffolding in prod bundle, ship-blocker).** After a production build (`npm run build` or equivalent), grep the emitted JS bundle for `__DEBUG_STOP__`. Expected zero hits. If any hit, the NODE_ENV gate failed and the debug handle would ship — remove before deploy.

# §10. Cost estimate (v4)

- Implementation: 4-5 hours (state + label + chime + reorder + runIdRef pattern with 5 guard sites [with sync track-stop on getUserMedia mismatch] + timeout path + button component-swap + aria-live label + NODE_ENV-gated __DEBUG_STOP__ + import wiring + verify all 17 ACs — AC-1..AC-11, AC-12a/12b/12c, AC-13, AC-14, AC-15).
- Manual verification: 60-90 min in real Chrome + Safari for Coral (Round A + C + D). Plus 40-60 min for Round E (Nebularr + Circle coherence).
- Total appetite: 5-8 hours (matches frontmatter `estimate_range: ["5h","8h"]`). Elicited with user 2026-07-03.
- Kill-conditions:
  - AC-9 fails (Round C n=10 shows <90% AI-response after immediate speech) → v5 promotes §7.2 to in-scope.
  - AC-12a OR AC-12b fails on any orb (Round E reveals Nebularr/Circle remount surprise, orb/spinner tearing, or label truncation) → ship BLOCKED per elicited ship-blocker; escalate to per-orb v5 plan. (AC-12c is observation-only, not a ship gate.)
  - Web Audio chime requires external audio asset (iOS Safari edge case) → re-scope for asset choice.

# §11. Cross-references

- `tasks/realtime-first-token-handoff.md` — prior investigation of this same bug class; documents `014f7af`'s Bug-1 fix + revert.
- `tasks/realtime-vad-and-vercel-401-handoff.md` — earlier this session; VAD hypothesis retracted; Vercel prod 401 unrelated fix.
- `tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md` — 4-pattern industry survey grounding this plan's Pattern-A recommendation.
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — target file for §3, §5, §6 edits.
- `src/projects/voiceinterface/components/ui/VoiceStateLabel.tsx` — target file for §4 edits.
- `src/projects/voiceinterface/components/ui/voicebuttons.tsx:1379-1503` — `ProcessingButtonDark` source (used by v4, no changes to that file).
- `tasks/DISCOVERY_2026-07-03_realtime-visual-surface.md` — the discovery artifact this v4 PIS is grounded against.
- [OpenAI community forum thread](https://community.openai.com/t/realtime-api-webrtc-first-word-consistently-lost-when-voice-feedback-enabled-98-reproduction-rate/1370816) — 98% reproduction rate on this class of bug.
- [Warming-state mockup artifact](https://claude.ai/code/artifact/8422cdb5-ba5b-4d33-9410-43b7af29a22a) — the 4-variant UX comparison user tested to pick Variant 02.
