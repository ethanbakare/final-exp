---
kind: plan
id: 4b1a8e7c-9d2f-4a15-b7e3-c1f0a5d3b829
title: Realtime — fix WebRTC connect-window first-utterance-lost bug via ProcessingButtonDark warming + chirp-on-ready
created: 2026-07-02T22:30+01:00
revised: 2026-07-03T13:00+01:00
status: DRAFT-v4
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
---

# §0. Feature-PIS (v4 — re-elicited with user 2026-07-03)

*(This repo has no project-PIS — verified via `find tasks -name "*PIS*"` 2026-07-02. This §0 is a fresh feature-tier PIS anchoring THIS plan. Elicited via `~/.claude/skills/plan-writing/ELICITATION.md` flow; user answers captured 2026-07-03 12:50-13:00 BST.)*

**Discovery anchor:** [tasks/DISCOVERY_2026-07-03_realtime-visual-surface.md](DISCOVERY_2026-07-03_realtime-visual-surface.md). Every claim below is grounded in a verified source read or a live-Playwright measurement.

- **UVO** — When the user clicks the Record button on `/voiceinterface/realtime`, the moment is **acknowledged**: the button visually replaces the Mic with a rotating spinner (via `ProcessingButtonDark` from `voicebuttons.tsx:1386` — same dark pill vocabulary, slightly smaller footprint 64×38 vs 76×44); the label above the orb reads "**Connecting**" (centered — no layout jitter because centered text pivots around the middle, not the left edge); the orb stays calm (no visual state change during warming — Coral's idle==listening constraint verified in `CoralRealtimeBlob.tsx:363-378`). When `session.connect()` resolves (~1.5s median in real Chrome), a short ascending chime plays, the label switches to "**Listening…**", and the button morphs to the Stop pill. From that moment on, the first thing the user says reaches OpenAI's VAD reliably. Utterances spoken BEFORE the chime are the user's own fault, not the app's — but the warming state's acknowledgment (spinner + label) is clear enough that the user naturally waits for the chime.
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
  - F-4: User double-clicks Record; second click during warming causes state confusion. **v4 mitigation:** during warming the button is `<ProcessingButtonDark disabled={true} />` — the click target itself is disabled at the DOM `<button disabled>` level (verified `voicebuttons.tsx:1397`). Since the whole component is swapped (not just disabled), there's no path where `onRecordClick` fires during warming.
  - F-5: Subsequent Start-Stop-Start cycles feel wrong because the warming state re-fires each time. This is CORRECT behavior — every fresh `session.connect()` genuinely takes ~1.5s. If it feels annoying, the mitigation is a follow-up (peer-connection reuse), not gating the chime.
  - F-6: On very slow networks (>3s connect), warming lingers past comfort. Mitigation: after a hard timeout (e.g., 6s), abort with error and return to idle — using existing error path.
  - F-7: Text label swap from "Connecting" → "Listening" is instant, without the existing 150ms fade animation, creating visual snap. Mitigation: reuse the existing `key={state}` re-mount trigger in `VoiceStateLabel` (line 27) — including `connecting` state should preserve the fade.
  - **F-8: Late-callback race when Stop fires during warming.** If the user clicks Stop while `await session.connect()` is still pending, `handleStopConversation` disposes of the session. But the awaited promise then resolves and the post-`session.connect()` block still runs — firing `setAppState('listening')`, `setIsConnecting(false)`, and `playConnectChime(ctx)` on a torn-down session. Result: phantom "Listening…" label + chime AFTER the user pressed Stop. **v3 mitigation (replaces v2's isConversationActiveRef mirror — Critical finding C-1):** use a per-Start `runIdRef` that is IMPERATIVELY incremented at try-entry (not via useEffect). Every post-await checkpoint captures `myRunId` at call time and compares `runIdRef.current === myRunId` before mutating state or firing the chime. Stop increments `runIdRef` too, imperatively, so any in-flight Start sees an invalidated run-id and returns early. Same pattern guards F-9 (see below).
  - **F-9: `session.connect()` resolution ≠ VAD-ready (Codex Major-3 finding).** SDK implementation at `node_modules/@openai/agents-realtime/dist/openaiRealtimeWebRtc.js:124` resolves connect() on WebRTC data-channel `open` event; `updateSessionConfig(...)` at line 131 is NOT awaited before `resolve()`. In practice: the chime may fire while OpenAI's server-side session config is still propagating and VAD is not yet accepting audio. The UVO promises first speech after chime reaches VAD reliably — if VAD isn't actually ready at chime, UVO fails silently. **Mitigation (v3 — deferred with escalation trigger):** ship on `session.connect()` resolution as MVP. AC-9 (§9) is an empirical acceptance gate: post-chime immediate speech in real Chrome must produce an AI response ≥90% (n=10). If <90%, promote §7.2 to in-scope in a v4 — options are (a) also await a `session.transport.on("connection_change","connected")` event before firing the chime, or (b) wait for the first VAD `input_audio_buffer.speech_started` event from the SDK before considering VAD live, or (c) both. §7.2 documents the option shapes; v3 doesn't ship them.
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
- At every post-await checkpoint (post-getUserMedia, post-token, post-`session.connect()`, and inside the catch/timeout paths): `if (runIdRef.current !== myRunId) { /* my Start was cancelled; return without mutating state */ return; }`
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
      {/* Key forces re-render on state change, triggering fade animation */}
      <div key={state} className="voice-state-label">
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

       // ... steps 2-9 unchanged (mic capture, analysers, transport, agent, session, listeners) ...
+      // NOTE: at step ~6 where the RealtimeSession is created, capture:
+      //   localSession = session;
+      // (Used only in the catch/timeout paths for force-close.)

       // 10. Get ephemeral token and connect
       console.log(`[TIMING +${dtNow()}ms] Fetching ephemeral token...`);
       const response = await fetch('/api/voice-interface/openai-realtime-token');
+      if (runIdRef.current !== myRunId) return;
       if (!response.ok) throw new Error(`Failed to get token: ${response.statusText}`);
       const tokenData = await response.json();
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

**Implementation** (`VoiceRealtimeOpenAI.tsx` render section, replaces the current line 831-836 block):

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
      disabled={true}   /* also visually communicates "you can't click me yet" */
      aria-label="Connecting to OpenAI Realtime"
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

**Size delta note** — the button-container is 44px tall (`VoiceRealtimeOpenAI.tsx:1005`). When `ProcessingButtonDark` (38px) renders, there's a 6px vertical delta. The container's `display: flex; align-items: center; justify-content: center` centers it; net effect is the button appears vertically-centered in the same 44px slot with 3px space top and bottom. This is acceptable. If the delta reads as too small at implementation time, add a 6px height compensator or bump `ProcessingButtonDark` via className override (would need an `!important` — worst-case a wrapping div; document either way).

**Edge case — Stop-during-warming is BLOCKED.** With `ProcessingButtonDark` rendered instead of `MorphingRecordWideSimple` during warming, there is no Stop icon to click. If the user wants to cancel a warming session, they must wait for connect to complete (~1.5s) or timeout to fire (6s). This is arguably correct UX (Cancel-during-connecting is a niche path) and eliminates the F-8 race pathway at the source. The runIdRef guard (§2.1) remains in place as belt-and-suspenders for the timeout path (F-10) and any future code path that might bypass the swap gate.

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
- If empirically ≥10% of trials fail (AC-9 fails), a v4 plan promotes §7.2 to in-scope. Options:
  - **(a)** Additionally await `session.transport.on("connection_change","connected")` before firing the chime. Verified this event exists in the SDK's transport layer (though it doesn't fire on the data-channel path — it fires on peer-connection state change).
  - **(b)** Wait for the first `input_audio_buffer.speech_started` event from the SDK before considering VAD live. This is a semantic proof (server-side VAD has processed at least one audio frame) rather than a mechanical readiness signal.
  - **(c)** Both, with (a) as a first gate and (b) as a "definitely-ready" upgrade.

Ship v3 on `session.connect()` resolution. AC-9 is the gate that either confirms the choice or triggers v4.

## §7.3 Peer-connection reuse for subsequent conversations

User's observation: subsequent conversations "work fine without any lag." This is likely BECAUSE `handleStopConversation` disposes of the session and next Start re-negotiates from scratch — so the warming state SHOULD fire again. The user's observation may be selective; needs empirical verification during manual test (§8).

If subsequent Start conversations DO in fact skip the connect delay (e.g., some browser-level RTC state persists), the plan is correct but the warming state may fire unnecessarily. Mitigation for that case: only show "Connecting" if `session.connect()` takes >200ms — i.e., delay the "Connecting" label by 200ms and only show it if warming hasn't already resolved. **Not in MVP scope**; add if empirically warranted.

## §7.4 Hard timeout on warming (F-6) — COMMITTED IN-SCOPE

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

**Round B — F-8 late-callback race (n=5)**
1. Click Record.
2. Immediately (within 200ms — during warming) click again (which now fires Stop because the button is disabled during warming per AC-11 — verify the button IS disabled first; if disabled, this test round is inapplicable and passes trivially).
3. If the button was clickable during warming (v3 defect vs plan), verify NO phantom "Listening" label appears after connect resolves; NO chime plays; UI stays idle. Log any phantom.

**Round C — AC-9 empirical VAD-ready check (n=10)**
1. Ten fresh Start-Stop-Start cycles. For each, log:
   - Did chime fire? (Y/N)
   - Time from click → chime (ms).
   - Did AI respond to immediate speech? (Y/N)
2. Compute AC-9 pass rate. ≥90% AI-response = v3 ships. <90% = F-9 fires empirically; v4 promotes §7.2.

**Round D — Timeout path (AC-10)**
1. Chrome DevTools → Network → Throttle to "Slow 3G".
2. Click Record. Wait 6s.
3. Observe: "Connection timed out" error; UI returns to idle; `isConnecting` clears; **`ProcessingButtonDark` unmounts and `MorphingRecordWideSimple` (state='idle') re-mounts** — no phantom stuck spinner (AC-11).
4. Wait an additional 5s (in case real connect resolves late). Observe: no phantom "Listening…" label; no chime; console may have SDK-internal cleanup output but no unhandled promise rejection.

**Round E — Cross-orb coherence (v4, AC-12, ship-blocker)**
For EACH pinned orb — Coral (default), Nebularr, Circle — click the profile-strip thumb to swap, then repeat Rounds A + C + D with that orb active. Observe per orb:
- **Coral (baseline)**: warming state visually matches design intent (spinner button + centered "Connecting" label + calm torus). Pass reference.
- **Nebularr**: warming state must not collide with Nebularr's mount-time talking→idle crossfade (`NebularrBlob.tsx:90-111`). Specifically: does the crossfade replay on session Start (fresh component mount)? If yes, does it visually clash with the spinner + Connecting label composition? Log YES/NO.
- **Circle**: warming state visual coherence with Circle's shader rendering. Log any composition break (e.g., orb color competing with spinner, motion tempo mismatch).
Any orb showing collision/breakage: ship blocked; document the specific collision, escalate to v5 planning for dedicated per-orb warming treatment. Alternative acceptable outcome: all 3 orbs pass Round E cleanly with the ProcessingButtonDark + centered-label composition.

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
9. **AC-9 (v3 — Codex Major-3 escalation trigger, load-bearing to UVO):** For n=10 real-Chrome trials with "click → immediate speech (<200ms after chime)," AI response rate is ≥90%. If <90%, §7.2 promotes to in-scope for v4; ship of v3 is BLOCKED. This AC catches the "session.connect() resolves before VAD is server-side ready" pathology (F-9). Pass = MVP assumption validated. Fail = SDK data-channel-open is an insufficient ready signal; escalate.
10. **AC-10 — Timeout path.** Simulate slow network (Chrome DevTools throttle to "Slow 3G"). Click Record. Verify: (a) at ~6s the "Connection timed out" error appears; (b) UI returns to idle; (c) `isConnecting` clears; (d) if the real connect resolves >1s after the timeout, no phantom "Listening…" label or chime fires (runIdRef guard verified); (e) `console.warn` may show SDK internal cleanup output but no unhandled promise rejection.
11. **AC-11 (v4 rewrite) — Component swap during warming.** During "Connecting" state, verify (DevTools) that the rendered button is `<ProcessingButtonDark>` (class `.processing-button-dark`), NOT `<MorphingRecordWideSimple>` (class `.record-wide-stop-button`). Verify spinner is animating (or `animation: none` under prefers-reduced-motion). Clicking the disabled button produces no visible response.
12. **AC-12 (v4 — cross-orb coherence, ship-blocker per elicitation).** Complete Rounds A + C + D (§8) TWICE MORE, swapping to the Nebularr orb and the Circle orb via the profile strip. Warming state must feel coherent on all 3 orbs: no visual collision with Nebularr's mount-time talking→idle crossfade, no jarring transition on Circle. If any orb shows collision or breakage, ship is blocked; escalate to Round E (§8) analysis + potentially v5.
13. **AC-13 (v4 — layout stability).** Take DevTools screenshot at each state (idle / connecting / listening / thinking / speaking) with the DevTools "device pixel ratio" toolbar overlay. Measure horizontal offset of the label's center. All 5 states must have the label center within ±1px of each other — proves centering solves the jitter concern raised in elicitation.

# §10. Cost estimate (v4)

- Implementation: 4-5 hours (state + label + chime + reorder + runIdRef pattern + timeout path + button component-swap + import wiring + verify all 13 ACs).
- Manual verification: 60-90 min in real Chrome + Safari for Coral (Round A + C + D). Plus 40-60 min for Round E (Nebularr + Circle coherence).
- Total appetite: 5-8 hours (matches frontmatter `estimate_range: ["5h","8h"]`). Elicited with user 2026-07-03.
- Kill-conditions:
  - AC-9 fails (Round C n=10 shows <90% AI-response after immediate speech) → v5 promotes §7.2 to in-scope.
  - AC-12 fails (Round E reveals Nebularr or Circle collision) → ship BLOCKED per elicited ship-blocker; escalate to per-orb v5 plan.
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
