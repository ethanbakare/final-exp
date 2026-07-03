---
kind: plan
id: 4b1a8e7c-9d2f-4a15-b7e3-c1f0a5d3b829
title: Realtime — fix WebRTC connect-window first-utterance-lost bug via chirp-on-ready + "Connecting…" label
created: 2026-07-02T22:30+01:00
revised: 2026-07-03T12:00+01:00
status: DRAFT-v3
related:
  - tasks/realtime-first-token-handoff.md
  - tasks/realtime-vad-and-vercel-401-handoff.md
  - tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md
  - tasks/PLAN_v2_review_synthesis_2026-07-03.md
target_file: src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx
prior_head: 5ff985e
current_head: 4cd7c45
estimate_range: ["3h", "5h"]
appetite_signal: v3 grows +1h on top of v2 gut estimate to cover run-id refactor + verification for late-resolve orphan cleanup
version_history:
  - v1 2026-07-02 22:30 — first draft (commit bb7b2c9)
  - v2 2026-07-02 23:30 — round-1 findings applied (commit 16bde7c)
  - v3 2026-07-03 12:00 — cross-family review synthesis applied (Rule B2.d two-SAFE Claude+Codex convergent on 2 Crit + 1 load-bearing Major)
---

# §0. Feature-PIS

*(This repo has no project-PIS — verified via `find tasks -name "*PIS*"` 2026-07-02. This §0 is a fresh feature-tier PIS anchoring THIS plan.)*

- **UVO** — When the user clicks the Record button on `/voiceinterface/realtime`, the interface communicates unambiguously that the pipeline is not yet live (visible **Connecting…** label with three bouncing dots) and delivers a distinct **audio ready-signal** (short synthesized chime) at the moment WebRTC is actually connected. Text then switches to **Listening…**. The first thing the user says AFTER the chime reaches OpenAI's VAD reliably; utterances spoken BEFORE the chime are the user's own fault, not the app's.
- **NNF**
  - The warming window must NOT visually revive the previously-rejected `Ready when you are` static text (`014f7af` regression). Text label switches directly from "Ready when you are" (idle) → "Connecting" (warming) → "Listening…" (ready).
  - The chime is short (≤150ms), soft (peak amplitude 0.24 of full scale), and ascends (440→660Hz). Not a system beep. Not a notification sound. It must feel like a voice-assistant ready-signal, not a UI alert.
  - The orb visual STAYS AT IDLE motion during warming — no fancy warming pulse. User chose this after seeing all four variants (Variant 02 in the [mockup artifact](https://claude.ai/code/artifact/8422cdb5-ba5b-4d33-9410-43b7af29a22a)). The orb only transitions to `listening` when the pipeline is actually live.
  - The button visually indicates the click was received (state distinct from idle-hover; e.g., a temporary disabled or "recording"-esque appearance) even while pipeline is warming — clicking the button must never feel like nothing happened.
  - **Unacceptable**: (a) UI says "Listening" while audio is silently dropped; (b) warming state lingers >3s without the chime firing; (c) chime fires without the orb + label transition; (d) any regression to the `014f7af` "Ready when you are" static text; (e) chime fails silently on subsequent Record clicks due to AudioContext being suspended.
- **Scope**
  - **In**: (1) add `isConnecting: boolean` state to `VoiceRealtimeOpenAI` (orthogonal to `AppState`); (2) reorder `handleStartConversation` so `setAppState('listening')` fires AFTER `session.connect()` resolves; (3) extend `VoiceStateLabelState` with a `'connecting'` value + render "Connecting" with three bouncing dots; (4) add Web Audio-synthesized chime helper (`playConnectChime`) fired at ready; (5) button visual during warming — keep click acknowledged.
  - **Out**: (a) removing the diagnostic `[TIMING +N ms]` logs (trivial follow-up, not scope here); (b) mic-permission-on-page-load (user raised as optional secondary win — deferred, tracked as §7.1); (c) connectionstatechange event polling beyond `session.connect()` resolution (deferred; `session.connect()` resolution is a safe MVP approximation); (d) chirp fatigue mitigation via user-toggle (deferred; not chosen); (e) any UX changes to the orb rendering pipeline; (f) any change to Vercel env / production infra (fixed earlier this session at commit `0d7003c` region-adjacent).
  - **Touches**: `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` (state machine + start handler), `src/projects/voiceinterface/components/ui/VoiceStateLabel.tsx` (label state union + dot animation CSS).
- **Falsifiers**
  - F-1: Browser autoplay policy blocks the chime because AudioContext was created before a user gesture. Mitigation: chime uses the SAME AudioContext already created inside `handleStartConversation` (line 584, post-gesture); no new context needed.
  - F-2: `session.connect()` rejects (network error, invalid token) mid-warm. Warming state must clear cleanly and return to idle. Mitigation: existing catch block at line 716-720 sets `appState='idle'` + error message; must also clear `isConnecting`.
  - F-3: Chime fires but AudioContext is suspended (browser tab backgrounded). Silent-ready-signal. Mitigation: call `ctx.resume()` if suspended before chime; if resume rejects, orb+label transition still fire — chime is defence-in-depth, not sole ready-signal.
  - F-4: User double-clicks Record; second click during warming causes state confusion. **v3 mitigation:** `disabled={isConnecting}` on `MorphingRecordWideSimple` (structurally suppresses click at the button element). Also see §6 for the historical option-1-vs-option-2 analysis — option 1 dropped after cross-family review flagged it as gating the wrong click handler.
  - F-5: Subsequent Start-Stop-Start cycles feel wrong because the warming state re-fires each time. This is CORRECT behavior — every fresh `session.connect()` genuinely takes ~1.5s. If it feels annoying, the mitigation is a follow-up (peer-connection reuse), not gating the chime.
  - F-6: On very slow networks (>3s connect), warming lingers past comfort. Mitigation: after a hard timeout (e.g., 6s), abort with error and return to idle — using existing error path.
  - F-7: Text label swap from "Connecting" → "Listening" is instant, without the existing 150ms fade animation, creating visual snap. Mitigation: reuse the existing `key={state}` re-mount trigger in `VoiceStateLabel` (line 27) — including `connecting` state should preserve the fade.
  - **F-8: Late-callback race when Stop fires during warming.** If the user clicks Stop while `await session.connect()` is still pending, `handleStopConversation` disposes of the session. But the awaited promise then resolves and the post-`session.connect()` block still runs — firing `setAppState('listening')`, `setIsConnecting(false)`, and `playConnectChime(ctx)` on a torn-down session. Result: phantom "Listening…" label + chime AFTER the user pressed Stop. **v3 mitigation (replaces v2's isConversationActiveRef mirror — Critical finding C-1):** use a per-Start `runIdRef` that is IMPERATIVELY incremented at try-entry (not via useEffect). Every post-await checkpoint captures `myRunId` at call time and compares `runIdRef.current === myRunId` before mutating state or firing the chime. Stop increments `runIdRef` too, imperatively, so any in-flight Start sees an invalidated run-id and returns early. Same pattern guards F-9 (see below).
  - **F-9: `session.connect()` resolution ≠ VAD-ready (Codex Major-3 finding).** SDK implementation at `node_modules/@openai/agents-realtime/dist/openaiRealtimeWebRtc.js:124` resolves connect() on WebRTC data-channel `open` event; `updateSessionConfig(...)` at line 131 is NOT awaited before `resolve()`. In practice: the chime may fire while OpenAI's server-side session config is still propagating and VAD is not yet accepting audio. The UVO promises first speech after chime reaches VAD reliably — if VAD isn't actually ready at chime, UVO fails silently. **Mitigation (v3 — deferred with escalation trigger):** ship on `session.connect()` resolution as MVP. AC-9 (§9) is an empirical acceptance gate: post-chime immediate speech in real Chrome must produce an AI response ≥90% (n=10). If <90%, promote §7.2 to in-scope in a v4 — options are (a) also await a `session.transport.on("connection_change","connected")` event before firing the chime, or (b) wait for the first VAD `input_audio_buffer.speech_started` event from the SDK before considering VAD live, or (c) both. §7.2 documents the option shapes; v3 doesn't ship them.
  - **F-10: Timeout branch of Promise.race does NOT abort the SDK connect (Codex Major-1 finding).** `RealtimeSessionConnectOptions` at `realtimeSession.d.ts:79-97` has no AbortSignal, no cancellation token. On timeout, the race returns to catch but the SDK's connect is still in-flight and eventually resolves. **Mitigation (v3):** the catch block MUST call `try { session.close(); } catch {}` on the local `session` binding (not `sessionRef.current`, which the run-id guard may have already cleared) to force-tear-down the pending peer connection. The run-id guard also fires in any late-resolve continuation and prevents state mutation from the orphan. Both defences apply — session.close() eliminates the peer connection; run-id eliminates the UI state mutation.
- **Appetite** — v3: 3-4 hours implementation + 60-90 min manual verification in real Chrome (Playwright cannot reproduce the real-audio timing that surfaces this bug). See §10 for full cost breakdown. Kill-conditions: (a) if Web Audio chime turns out to require external audio asset instead of synth (iOS Safari edge case) → re-scope; (b) AC-9 fails (Round C n=10 <90% AI-response) → v4 promotes §7.2 to in-scope.

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
- Button rendering at `VoiceRealtimeOpenAI.tsx:831-833` — reads `isConnecting` and passes to `disabled={isConnecting}` on `MorphingRecordWideSimple` (v3 uses option 2; option 1 dropped — see §6).

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
  connecting: 'Connecting',  // new — three bouncing dots rendered separately
  listening: 'Listening...',
  ai_thinking: 'Thinking...',
  ai_speaking: 'Speaking...',
};
```

## Rendering — three bouncing dots for connecting state only

Render change at `VoiceStateLabel.tsx:23-30`:

```tsx
export const VoiceStateLabel: React.FC<VoiceStateLabelProps> = ({ state }) => {
  return (
    <>
      <div key={state} className="voice-state-label">
        {STATE_LABELS[state]}
        {state === 'connecting' && (
          <span className="dots" aria-hidden="true">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </span>
        )}
      </div>
      <style jsx>{`
        /* existing styles unchanged */
        .voice-state-label { /* existing */ }
        @keyframes fadeIn { /* existing */ }

        /* new — dots */
        .dots {
          display: inline-flex;
          gap: 3px;
          margin-left: 6px;
          vertical-align: middle;
        }
        .dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.4;
          animation: dotBounce 1.2s ease-in-out infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          30%      { opacity: 1;   transform: translateY(-3px); }
          60%      { opacity: 0.3; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .dot { animation: none; opacity: 0.7; }
        }
      `}</style>
    </>
  );
};
```

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

## Button-during-warming affordance (v3 — option 2 chosen)

`MorphingRecordWideSimple` at `VoiceRealtimeOpenAI.tsx:831-833` currently receives `onRecordClick={handleStartConversation}` with no disabled-during-warming guard.

**v2's option 1 dropped.** Claude Finding 10 (verified at `voicemorphingbuttons.tsx:2387-2394`): during warming, `isConversationActive === true` → button state is `'recording'` → click routes to `onStopClick`, NOT `onRecordClick`. Gating `onRecordClick` during warming is a no-op; the double-click "guard" F-4 was structurally non-existent.

**v3 uses option 2** — pass `disabled={isConnecting}` to `MorphingRecordWideSimple`. Verified at `voicemorphingbuttons.tsx:2377`: prop accepted; verified at line 2401: applied to the actual `<button>` element (so click events are structurally suppressed by the browser, not gated in JS).

**Implementation:**

```tsx
<MorphingRecordWideSimple
  onRecordClick={handleStartConversation}
  onStopClick={handleStopConversation}
  state={isConversationActive ? 'recording' : 'idle'}
  disabled={isConnecting}
/>
```

**Edge case — Stop-during-warming is now BLOCKED.** With `disabled={isConnecting}`, clicking the button during warming does nothing. If the user wants to cancel a warming session, they must wait for it to complete (or timeout) then click Stop. This is arguably correct UX (Cancel-during-connecting is a niche path) and eliminates the F-8 race pathway at the source. The runIdRef guard remains in place as belt-and-suspenders for the timeout path (F-10) and any future code path that might bypass the button gate.

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
3. Observe: "Connection timed out" error; UI returns to idle; `isConnecting` clears.
4. Wait an additional 5s (in case real connect resolves late). Observe: no phantom "Listening…" label; no chime; console may have SDK-internal cleanup output but no unhandled promise rejection.

**Manual A/B** against `origin/main` HEAD (should preserve baseline bug) — optional; validates the fix is doing something rather than the environment having changed.

# §9. Acceptance criteria

Fix is done when ALL are true:

1. **AC-1 — Load-bearing bug fix.** On a fresh Chrome tab, clicking Record then immediately talking (within 500ms) produces an AI response for that utterance in ≥90% of trials (n=10). Baseline reproduction rate before fix: ~98% failure.
2. **AC-2 — Connecting label.** The "Connecting" text with bouncing dots appears within one frame of click.
3. **AC-3 — Chime firing.** A short chime plays at the moment `session.connect()` resolves (or, on very fast resolve <200ms, may be omitted per §7.3). Chime is audible on a MacBook Pro speaker at default volume; NOT annoying at repeat.
4. **AC-4 — Label transitions.** Text label transitions "Ready when you are" → "Connecting" → "Listening…" with the existing 150ms fade animation preserved on each transition.
5. **AC-5 — Network error case.** Kill wifi mid-warm; verify UI returns to idle with error message; `isConnecting` clears; `runIdRef` invalidates.
6. **AC-6 (falsifiable — ships blocker, v3 rewrite):** For every Start-Stop-Start cycle (n=5), when the full warming path fires it MUST be atomic: label swap "Connecting" → "Listening…" AND chime playback occur within one animation frame of each other. Failure modes that gate ship: (a) chime plays but label stays "Connecting"; (b) label swaps to "Listening…" but chime never plays; (c) chime fires BEFORE `session.connect() resolved` log line appears in console; (d) label + chime fire on a run whose Stop was already clicked (phantom Listening after Stop — F-8 race). v2's AC-6a listed "orb-jumping-to-listening-before-chime" — v3 removes this because §6 shows `setAppState('listening')` and `playConnectChime` are synchronous adjacent lines; the failure mode is structurally impossible under the shipped code.
7. **AC-7 (observation only — not gate):** Record in the test log whether §7.3's fast-resolve edge case fired empirically (n=5 cycles). If yes across all cycles, note it for the follow-up peer-connection-reuse investigation.
8. **AC-8 — Clean console.** No unhandled errors, no rejected promise warnings.
9. **AC-9 (v3 — Codex Major-3 escalation trigger, load-bearing to UVO):** For n=10 real-Chrome trials with "click → immediate speech (<200ms after chime)," AI response rate is ≥90%. If <90%, §7.2 promotes to in-scope for v4; ship of v3 is BLOCKED. This AC catches the "session.connect() resolves before VAD is server-side ready" pathology (F-9). Pass = MVP assumption validated. Fail = SDK data-channel-open is an insufficient ready signal; escalate.
10. **AC-10 — Timeout path.** Simulate slow network (Chrome DevTools throttle to "Slow 3G"). Click Record. Verify: (a) at ~6s the "Connection timed out" error appears; (b) UI returns to idle; (c) `isConnecting` clears; (d) if the real connect resolves >1s after the timeout, no phantom "Listening…" label or chime fires (runIdRef guard verified); (e) `console.warn` may show SDK internal cleanup output but no unhandled promise rejection.
11. **AC-11 — Stop-during-warming blocked.** During "Connecting" state, verify the button element has `disabled` attribute (DevTools inspection); clicking it produces no visible response. This is the v3 F-4 mitigation via option 2.

# §10. Cost estimate (v3)

- Implementation: 3-4 hours (state + label + chime + reorder + runIdRef pattern + timeout path + button disabled + verify all 11 ACs).
- Manual verification: 60-90 min in real Chrome + Safari (Round A + B + C + D — Round C's n=10 AC-9 gate is the longest single item).
- Total appetite: 3-5 hours (matches frontmatter `estimate_range: ["3h","5h"]`). Grew +1h over v2 to cover runIdRef refactor, explicit `session.close()` on timeout, and Round C empirical VAD-ready validation.
- Kill-condition: AC-9 fails (Round C n=10 shows <90% AI-response after immediate speech). Scope pivots to v4 promoting §7.2 to in-scope.

# §11. Cross-references

- `tasks/realtime-first-token-handoff.md` — prior investigation of this same bug class; documents `014f7af`'s Bug-1 fix + revert.
- `tasks/realtime-vad-and-vercel-401-handoff.md` — earlier this session; VAD hypothesis retracted; Vercel prod 401 unrelated fix.
- `tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md` — 4-pattern industry survey grounding this plan's Pattern-A recommendation.
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — target file for §3, §5, §6 edits.
- `src/projects/voiceinterface/components/ui/VoiceStateLabel.tsx` — target file for §4 edits.
- [OpenAI community forum thread](https://community.openai.com/t/realtime-api-webrtc-first-word-consistently-lost-when-voice-feedback-enabled-98-reproduction-rate/1370816) — 98% reproduction rate on this class of bug.
- [Warming-state mockup artifact](https://claude.ai/code/artifact/8422cdb5-ba5b-4d33-9410-43b7af29a22a) — the 4-variant UX comparison user tested to pick Variant 02.
