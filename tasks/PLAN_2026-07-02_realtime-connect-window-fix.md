---
kind: plan
id: 4b1a8e7c-9d2f-4a15-b7e3-c1f0a5d3b829
title: Realtime — fix WebRTC connect-window first-utterance-lost bug via chirp-on-ready + "Connecting…" label
created: 2026-07-02T22:30+01:00
status: DRAFT
related:
  - tasks/realtime-first-token-handoff.md
  - tasks/realtime-vad-and-vercel-401-handoff.md
  - tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md
target_file: src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx
prior_head: 5ff985e
current_head: 0d7003c
estimate_range: ["2h", "4h"]
appetite_signal: gut estimate; no prior variance dataset in this repo
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
  - F-4: User double-clicks Record; second click during warming causes state confusion. Mitigation: button must not re-fire `handleStartConversation` if `isConnecting === true` (button disabled OR click no-ops during warming).
  - F-5: Subsequent Start-Stop-Start cycles feel wrong because the warming state re-fires each time. This is CORRECT behavior — every fresh `session.connect()` genuinely takes ~1.5s. If it feels annoying, the mitigation is a follow-up (peer-connection reuse), not gating the chime.
  - F-6: On very slow networks (>3s connect), warming lingers past comfort. Mitigation: after a hard timeout (e.g., 6s), abort with error and return to idle — using existing error path.
  - F-7: Text label swap from "Connecting" → "Listening" is instant, without the existing 150ms fade animation, creating visual snap. Mitigation: reuse the existing `key={state}` re-mount trigger in `VoiceStateLabel` (line 27) — including `connecting` state should preserve the fade.
- **Appetite** — 2-4 hours implementation + 30-60 min manual verification in real Chrome (Playwright cannot reproduce the real-audio timing that surfaces this bug). Kill-condition: if the Web Audio chime turns out to require an external audio asset instead of synth (e.g., iOS Safari policy edge case), re-scope to include asset choice.

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

The `AppState` union has consumers across 6+ orb components (`RealtimeBlob.tsx`, `CoralRealtimeBlob.tsx`, `NebularrBlob.tsx`, `CircleRealtimeBlob.tsx`, `VelvetOrb.tsx`, and the imported `RealtimeVoiceState` re-alias in `VoiceRealtimeOpenAI.tsx:8`). Adding a new union value would force each of those consumers to either handle `'connecting'` or downcast — a wide surface for regression, and NOT the "keep orb calm during warming" behavior we want (Variant 02).

`isConnecting: boolean` is orthogonal:
- `AppState` remains `'idle'` during warming (orb stays calm — matches Variant 02).
- `isConnecting` gates the LABEL text (via a new `'connecting'` value in `VoiceStateLabelState`) and the button visual.
- Zero touch to the orb consumer graph.

## Consumers subsection (Principle 2 — visible enumeration)

Every place that reads or writes `isConnecting` in the shipped change:

**Producers** (write `isConnecting`):
- `VoiceRealtimeOpenAI.tsx` `handleStartConversation` (line ~578 area): sets `true` on click, before token fetch.
- `VoiceRealtimeOpenAI.tsx` post-`session.connect()` (line ~714 area): sets `false` on ready.
- `VoiceRealtimeOpenAI.tsx` error catch (line ~716 area): sets `false` on error.
- `VoiceRealtimeOpenAI.tsx` `handleStopConversation` (line ~763 area): sets `false` on stop — defense in depth against orphaned state.

**Consumers** (read `isConnecting`):
- `getLabelState()` at `VoiceRealtimeOpenAI.tsx:782` — reads `isConnecting`; returns `'connecting'` when true, otherwise `appState`.
- Button rendering at `VoiceRealtimeOpenAI.tsx:831-833` — reads `isConnecting`; passes to `MorphingRecordWideSimple` OR wraps the `onRecordClick` handler to no-op during warming.

**Non-consumers** (verified NOT touched):
- Orb rendering (`getVoiceState()` at line 772-776) — unchanged. Orb sees `appState === 'idle'` during warming and behaves as idle.
- Audio polling interval (line 664-668) — unchanged. Reads mic analyser only when `appState === 'listening'`, so orb's audio visualization stays silent during warming (matches Variant 02).
- All 6 orb-component `RealtimeVoiceState` union duplications — untouched.

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
| Click Stop during warming (edge case) | `appState='idle'`, `isConnecting=true`          | `appState='idle'`, `isConnecting=false`, session aborted if partially initialized |

## Lifecycle owner (Principle 5)

`isConnecting` is owned by `VoiceRealtimeOpenAI` alone. No child component sets it. All writes are inside `handleStartConversation`, its catch block, or `handleStopConversation`. `useEffect` cleanup does NOT touch it (nothing subscribes cross-mount).

## `appStateRef` mirror rule

`appState` has an existing `appStateRef` mirror at `VoiceRealtimeOpenAI.tsx:385-386` to work around closure-stale-state in intervals/handlers. `isConnecting` does NOT need a ref mirror because no closure in the current code reads it inside a setInterval/event-handler — verified via grep for all places `isConnecting` will be read (§2 Consumers). If a future consumer inside a closure reads it, add the mirror at that time. This decision is a scoped-not-eager mitigation for the closure-stale-state pattern.

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
function playConnectChime(ctx: AudioContext): void {
  try {
    if (ctx.state === 'suspended') {
      ctx.resume(); // best-effort; if it fails, orb+label transition still fire
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

Diff shape at `VoiceRealtimeOpenAI.tsx:570-720` (concrete lines below assume current numbering at HEAD `0d7003c`):

```diff
   const handleStartConversation = async () => {
     sessionT0Ref.current = performance.now();
     console.log(`[TIMING +${dtNow()}ms] Click Record → starting conversation`);
     try {
       setIsConversationActive(true);
-      setAppState('listening');
+      setIsConnecting(true);
       setError('');

       // 1. Create AudioContext
       const ctx = new AudioContext();
       audioContextRef.current = ctx;
       if (ctx.state === 'suspended') await ctx.resume();

       // ... steps 2-9 unchanged (mic capture, analysers, transport, agent, session, listeners) ...

       // 10. Get ephemeral token and connect
       console.log(`[TIMING +${dtNow()}ms] Fetching ephemeral token...`);
       const response = await fetch('/api/voice-interface/openai-realtime-token');
       if (!response.ok) throw new Error(`Failed to get token: ${response.statusText}`);
       const tokenData = await response.json();
       const ephemeralKey = tokenData.key;
       if (!ephemeralKey) throw new Error('No ephemeral token received');
       console.log(`[TIMING +${dtNow()}ms] Got ephemeral token`);

       await session.connect({ apiKey: ephemeralKey });
       console.log(`[TIMING +${dtNow()}ms] session.connect() resolved — WebRTC ready, OpenAI VAD active`);
+
+      // Pipeline is now live — transition UI + fire chime.
+      setAppState('listening');
+      setIsConnecting(false);
+      playConnectChime(ctx);

     } catch (err) {
       console.error('[OpenAI Realtime] Error starting conversation:', err);
       setError('Failed to start conversation. Please check your microphone.');
       setAppState('idle');
+      setIsConnecting(false);
     }
   };
```

## Button-during-warming affordance

`MorphingRecordWideSimple` at `VoiceRealtimeOpenAI.tsx:831-833` currently receives `onRecordClick={handleStartConversation}` with no disabled-during-warming guard. Options:

1. **Guard in `onRecordClick` wrapper** (simplest): `onRecordClick={isConnecting ? undefined : handleStartConversation}` — button becomes visually a no-op during warming without any prop change.
2. **Pass `isConnecting` as `disabled`-esque prop** (requires MorphingRecordWideSimple to accept it — verify before choosing this route).

**Default to option 1** unless the button already visually renders differently when `onRecordClick` is undefined. Verify at implementation time via `grep -n "onRecordClick" src/projects/voiceinterface/components/ui/voicemorphingbuttons.tsx`.

# §7. Deferred items + open questions

## §7.1 Mic permission on page load (deferred)

User raised: "what if we arrived on the page with the browser already asking you for permission so you do it first, before you even click?" This would shave ~50-100ms from the connect flow on first-time users AND avoid a subtle race where mic-permission-denied fires WHILE the user is watching the "Connecting" state.

**Deferred** for a separate plan. Not in scope here because it's a UX change to the page's entry (pre-click behavior) not to the warming path.

## §7.2 connectionstatechange vs `session.connect()` resolution

The OpenAI community fix references `RTCPeerConnection.connectionstatechange === 'connected'` as the canonical ready signal. In practice, `await session.connect()` should resolve at or after that transition (the SDK internally awaits handshake completion). If field data reveals a gap between `session.connect()` resolution and actual audio-send readiness (rare but possible per the community thread's discussion of media/data-channel independence), add a secondary gate on `connectionstatechange`.

**Deferred** to observation. Ship the MVP on `session.connect()` resolution.

## §7.3 Peer-connection reuse for subsequent conversations

User's observation: subsequent conversations "work fine without any lag." This is likely BECAUSE `handleStopConversation` disposes of the session and next Start re-negotiates from scratch — so the warming state SHOULD fire again. The user's observation may be selective; needs empirical verification during manual test (§8).

If subsequent Start conversations DO in fact skip the connect delay (e.g., some browser-level RTC state persists), the plan is correct but the warming state may fire unnecessarily. Mitigation for that case: only show "Connecting" if `session.connect()` takes >200ms — i.e., delay the "Connecting" label by 200ms and only show it if warming hasn't already resolved. **Not in MVP scope**; add if empirically warranted.

## §7.4 Hard timeout on warming (F-6)

Falsifier F-6: warming lingers past ~6s on very slow networks. Add a 6s timeout that rejects the pending connect and returns to idle with an error. **In-scope but low priority**; if implementation is trivial (setTimeout inside handleStartConversation), include; otherwise defer.

# §8. Verification approach

**Playwright headless CANNOT reproduce this bug** because its `getUserMedia` has a ~10s delay that dwarfs the ~1.5s connect window (verified: Playwright showed `+10,434ms` for mic capture vs real Chrome's ~50ms). By the time Playwright's mic is live, `session.connect()` is long resolved. Bug does not surface.

**Manual verification protocol** (in real Chrome):

1. Open `http://localhost:3000/voiceinterface/realtime` (dev server) or the deployed URL.
2. Click Record.
3. Immediately (within 500ms) say "Test one two three". Speech ends by ~2s.
4. Observe:
   - **Pass**: Chime plays; orb blooms; label swaps "Connecting" → "Listening…"; AI responds to the utterance.
   - **Fail-mode-1**: No chime, orb jumps to listening immediately, AI doesn't respond (regression to baseline).
   - **Fail-mode-2**: Chime plays but AI doesn't respond (chime fired but pipeline wasn't actually live — investigate `session.connect()` resolution timing).
   - **Fail-mode-3**: Warming state lingers >5s (network or handshake pathology; hits F-6).
5. Click Stop, wait 3 seconds, Click Record again. Repeat step 3.
   - **Pass**: Warming state fires again (correct — session was disposed). Chime + transition works.
   - **Observation**: if warming state does NOT fire (session.connect() resolves in <100ms), note it — that's §7.3's edge case.
6. Console: verify `[TIMING +N ms]` logs show `session.connect() resolved` FIRING BEFORE `setAppState('listening')` and chime playback (log timing).

**Manual A/B** against `origin/main` HEAD (should preserve baseline bug) — optional; validates the fix is doing something rather than the environment having changed.

# §9. Acceptance criteria

Fix is done when ALL are true:

1. On a fresh Chrome tab, clicking Record then immediately talking (within 500ms) produces an AI response for that utterance in >90% of trials (n≥10). Baseline reproduction rate before fix: ~98% failure.
2. The "Connecting" text with bouncing dots appears within one frame of click.
3. A short chime plays at the moment `session.connect()` resolves. Chime is audible on a MacBook Pro speaker at default volume; NOT annoying at repeat.
4. Text label transitions "Ready when you are" → "Connecting" → "Listening…" with the existing 150ms fade animation preserved on each transition.
5. Error case: kill wifi mid-warm; verify UI returns to idle with error message; `isConnecting` clears.
6. Stop-Start-Stop-Start cycle (n=5) — every cycle behaves identically (warming state fires cleanly each time OR skips only when connect resolves in <200ms — §7.3 observation).
7. Console: no unhandled errors, no rejected promise warnings.

# §10. Cost estimate

- Implementation: 2-3 hours (state + label + chime + reorder + edge cases).
- Manual verification: 30-60 min in real Chrome + Safari (Safari's stricter autoplay policy is the outside chance F-3 fires).
- Total appetite: 2-4 hours. Kill-condition: if manual verification reveals `session.connect()` resolution is not a reliable ready signal (§7.2 open question fires empirically), re-scope to include `connectionstatechange` polling.

# §11. Cross-references

- `tasks/realtime-first-token-handoff.md` — prior investigation of this same bug class; documents `014f7af`'s Bug-1 fix + revert.
- `tasks/realtime-vad-and-vercel-401-handoff.md` — earlier this session; VAD hypothesis retracted; Vercel prod 401 unrelated fix.
- `tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md` — 4-pattern industry survey grounding this plan's Pattern-A recommendation.
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — target file for §3, §5, §6 edits.
- `src/projects/voiceinterface/components/ui/VoiceStateLabel.tsx` — target file for §4 edits.
- [OpenAI community forum thread](https://community.openai.com/t/realtime-api-webrtc-first-word-consistently-lost-when-voice-feedback-enabled-98-reproduction-rate/1370816) — 98% reproduction rate on this class of bug.
- [Warming-state mockup artifact](https://claude.ai/code/artifact/8422cdb5-ba5b-4d33-9410-43b7af29a22a) — the 4-variant UX comparison user tested to pick Variant 02.
