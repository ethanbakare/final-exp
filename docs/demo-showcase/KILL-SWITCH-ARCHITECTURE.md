# Demo Showcase — Kill-Switch Architecture Plan

Status: **Planned, not yet implemented.** Lab → demo-showcase port has shipped; this is the next workstream.

## Problem statement

When a user interacts with a demo in the showcase carousel and then swipes to another variation — or presses the close button, or toggles back to simulation — we need to guarantee that **nothing the demo kicked off survives the transition**. Specifically:

- An API response that's mid-flight when the swipe happens must NOT render into the now-inactive demo.
- A microphone stream must release.
- Timers, intervals, animation frames, `MediaRecorder` sessions, and `RTCPeerConnection`s must stop.
- External state stores (zustand, IndexedDB) tied to the active demo must be reset.
- Any state contamination between demos (e.g., warm-brown's transcript bleeding onto lavender's UI) must be impossible.

This is a **race-condition / resource-leak class of bug**. It has appeared multiple times historically. Fixing it case-by-case per demo is:

1. Easy to miss — demos that never had mic/async code might acquire it later.
2. Copy-paste prone — every demo reinvents its own cancellation logic.
3. Subtle to test — leaks only manifest under fast swipe-then-trigger sequences.

We want a **single architectural primitive** every demo can honour, enforced by the showcase, cleaned up automatically on any "become inactive" transition — while accepting that **what each demo does on cancellation is necessarily project-specific**, because their internal architectures genuinely differ.

## The four projects don't have the same shape

Before designing the contract, this is the ground truth on what we're trying to cancel. Walking the codebase:

| Project | State pattern | Async resources to release |
|---|---|---|
| **AI Confidence** | React Context provider (`SpeechConfidenceProvider`) wrapping a hook tree (`useAudioRecording` + `useDeepgramProcessing` + `useSpeechConfidenceState`) | `getUserMedia` + `MediaRecorder` (1000ms timeslice) + one `fetch` to `/api/ai-confidence-tracker/transcribe` |
| **Trace** | Single mega-component [TraceApp.tsx](../../src/projects/trace/components/TraceApp.tsx) holding mic refs + state locally; second mic via [TraceLiveWaveform.tsx](../../src/projects/trace/components/ui/TraceLiveWaveform.tsx) | `getUserMedia` (twice) + `MediaRecorder` + **two** fetches (`/api/trace/parse-voice` and `/api/trace/parse-receipt`) |
| **ClipStream** | **Zustand global store** + cooperating hooks (`useClipRecording`, `useOfflineRecording`, `useAutoRetry`) + **IndexedDB-backed audio storage**. Already uses `AbortController` *internally* in [transcriptionRetry.ts:170](../../src/projects/clipperstream/utils/transcriptionRetry.ts) for retry logic. | `getUserMedia` + `MediaRecorder` + interval timer + fetch + IndexedDB writes + zustand state that **survives component unmount** |
| **Voice Interface** | Sibling component variants. The wild card is [VoiceRealtimeOpenAI.tsx](../../src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx) — opens an **OpenAI Realtime WebRTC peer connection** (line 261-350), totally different from one-shot fetches | `RTCPeerConnection`, data channel, persistent streaming session, ephemeral token fetch, audio interval, `getUserMedia` |

A single magic "clean up any demo" helper would either be too generic to work or so configurable it'd be a leaky abstraction. We split the concerns instead.

## Two-layer architecture

```
─────────────────────────────────────────────────────────────────
 LAYER 1 — UNIVERSAL  (identical for every demo, present + future)
─────────────────────────────────────────────────────────────────
 - useActiveAbortSignal(isActive)        ← signal source
 - cancelSignal?: AbortSignal prop       ← contract
 - signal-listener pattern                ← composition rule

─────────────────────────────────────────────────────────────────
 LAYER 2 — PER-PROJECT ADAPTER  (small, co-located, body differs)
─────────────────────────────────────────────────────────────────
 - One useEffect per demo
 - Translates "signal aborted" → "tear down THIS project's resources"
 - Body necessarily differs by project; shape is identical
```

Key invariant: **a demo never knows WHY it was cancelled** (swipe / close / toggle / unmount / remount). It only knows THAT it was. The demo cleans up and returns to idle. The showcase owns all orchestration.

## Layer 1 — the universal contract

Three things are identical across every demo:

### 1.1 The signal source

```ts
// src/projects/demo-showcase/hooks/useActiveAbortSignal.ts

import { useEffect, useRef, useState } from 'react';

/**
 * Returns an AbortSignal bound to the given `isActive` state.
 *
 * - While isActive is true, the signal is "open" (not aborted).
 * - When isActive flips to false, the signal aborts — any async work
 *   the consumer wired to it bails out gracefully.
 * - When isActive flips back to true, a FRESH AbortController is
 *   created. This means the new activation starts with a clean,
 *   non-aborted signal — prior abort does not leak into the next
 *   session.
 */
export function useActiveAbortSignal(isActive: boolean): AbortSignal {
  const controllerRef = useRef<AbortController>(new AbortController());
  const [, forceRerender] = useState(0);

  useEffect(() => {
    if (!isActive) {
      if (!controllerRef.current.signal.aborted) {
        controllerRef.current.abort();
      }
    } else if (controllerRef.current.signal.aborted) {
      controllerRef.current = new AbortController();
      forceRerender(n => n + 1); // propagate new signal identity to consumers
    }
  }, [isActive]);

  return controllerRef.current.signal;
}
```

### 1.2 The prop contract

Every demo accepts `cancelSignal?: AbortSignal`. Always optional, always the same name, always the same semantics:

> *"When this signal aborts, you are inactive. Release everything you've claimed."*

Standalone usage (without showcase) is unchanged: pass nothing, get nothing, demo runs as before. The contract is strictly additive.

### 1.3 The composition rule

Two patterns cover every async resource:

**Pattern A — native AbortSignal support.** Pass it directly:

```ts
await fetch(url, { signal: cancelSignal });
document.addEventListener('visibilitychange', handler, { signal: cancelSignal });
```

**Pattern B — anything else.** Listen for the abort event and run the project's teardown:

```ts
cancelSignal.addEventListener('abort', () => {
  mediaRecorder.stop();
  stream.getTracks().forEach(t => t.stop());
  clearInterval(timerId);
  pc.close();
  store.reset();
}, { once: true });
```

This pattern handles `MediaRecorder`, `RTCPeerConnection`, intervals/timeouts, zustand resets, IndexedDB rollbacks, animation frames, audio contexts — anything that doesn't natively speak AbortSignal. Web Platform APIs use exactly this same pattern internally.

### 1.4 Shared helpers (small, optional)

`src/projects/demo-showcase/hooks/abortUtils.ts`:

```ts
/** Run fn when signal aborts; return cleanup that removes listener.
 *  Wraps the addEventListener boilerplate so adapters stay terse. */
export function onAbort(signal: AbortSignal | undefined, fn: () => void): () => void {
  if (!signal) return () => {};
  if (signal.aborted) { fn(); return () => {}; }
  const handler = () => fn();
  signal.addEventListener('abort', handler, { once: true });
  return () => signal.removeEventListener('abort', handler);
}

/** Compose multiple signals: result aborts when any input aborts.
 *  Useful when a demo has its own internal AbortController (e.g., per-fetch
 *  retry) and also wants to honour an external cancelSignal. */
export function composeAbortSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (!s) continue;
    if (s.aborted) { controller.abort(); break; }
    s.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}
```

## Layer 2 — per-project adapters

The body differs because each project's resources differ. The shape — one `useEffect`, one abort listener, one cleanup return — is identical.

### 2.1 AI Confidence (reference implementation)

Layered: the demo wrapper accepts the prop, threads it through `SpeechConfidenceProvider`, and the provider hands it to the hooks where the actual `fetch` and `MediaRecorder` live.

```tsx
// src/projects/demo-showcase/components/demos/AIConfidenceDemo.tsx
export const AIConfidenceDemo: React.FC<{ cancelSignal?: AbortSignal }> = ({ cancelSignal }) => (
  <SpeechConfidenceProvider cancelSignal={cancelSignal}>
    <DeepReader />
    <IntegratedDeepCard />
  </SpeechConfidenceProvider>
);

// inside useDeepgramProcessing
const response = await fetch('/api/ai-confidence-tracker/transcribe', {
  method: 'POST',
  body: formData,
  signal: cancelSignal,
});

// inside useAudioRecording — abort listener tears down what fetch can't
useEffect(() => onAbort(cancelSignal, () => {
  stopRecording();
  // tracks already released inside stopRecording()
}), [cancelSignal, stopRecording]);

// post-await guard for setState safety
if (cancelSignal?.aborted) return;
setResult(data);
```

AbortError must be swallowed silently inside the catch block (deliberate cancellation, not a user-facing error).

### 2.2 Trace

The mega-component pattern. Adapter sits at the top of `TraceApp` and wires both fetches.

```tsx
// inside TraceApp.tsx
useEffect(() => onAbort(cancelSignal, () => {
  mediaRecorderRef.current?.stop();
  mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
}), [cancelSignal]);

// both fetches get the signal:
await fetch('/api/trace/parse-voice', { ..., signal: cancelSignal });
await fetch('/api/trace/parse-receipt', { ..., signal: cancelSignal });

// TraceLiveWaveform's separate getUserMedia: pass cancelSignal as prop,
// release tracks in its own onAbort.
```

### 2.3 ClipStream

Has the most state to reset because of the global zustand store and IndexedDB writes. ClipStream already uses an internal `AbortController` for retry logic — we **compose** rather than replace it.

```tsx
// inside ClipStreamDemo (or its top-level container)
useEffect(() => onAbort(cancelSignal, () => {
  // 1. Stop active mic + recorder
  useClipRecording.getState().stop();
  // 2. Abort in-flight transcription (hooks into the existing internal controller)
  abortInflightTranscription();
  // 3. Reset zustand store so next activation starts clean
  useClipStore.getState().reset();
  // 4. IndexedDB: outstanding writes can complete; we just don't read them back
}), [cancelSignal]);

// fetches use composed signal (internal retry signal + external cancel)
const signal = composeAbortSignals(retryController.signal, cancelSignal);
await fetch('/api/clipperstream/transcribe', { ..., signal });
```

The zustand reset is the critical part — without it, swipe-away-then-back would show stale clip state because the store outlives the component tree.

### 2.4 Voice Interface (Realtime variant)

WebRTC. Doesn't speak AbortSignal natively. Pure Pattern B.

```tsx
// inside VoiceRealtimeOpenAI
useEffect(() => onAbort(cancelSignal, () => {
  peerConnectionRef.current?.close();
  dataChannelRef.current?.close();
  micStreamRef.current?.getTracks().forEach(t => t.stop());
  if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
}), [cancelSignal]);

// token fetch uses the signal
const tokenResp = await fetch('/api/voice-interface/openai-realtime-token', {
  signal: cancelSignal,
});
```

The other Voice variants (`VoiceTextBoxStandard`, `VoiceTextBoxClip`, `VoiceTextBoxCheckClose`) already create their own internal `AbortController`. They become Pattern A + compose: thread the external `cancelSignal` into their existing flow via `composeAbortSignals`.

## How the showcase wires it

One signal per demo slot, computed independently. Demos do not share signals.

```tsx
// in src/pages/demo-showcase/index.tsx

const aiConfidenceSignal = useActiveAbortSignal(activeIdx === 0 && isDemoMode);
const traceSignal        = useActiveAbortSignal(activeIdx === 1 && isDemoMode);
const clipStreamSignal   = useActiveAbortSignal(activeIdx === 2 && isDemoMode);
// voiceSignal when Voice ships

// then at the mount sites:
{activeIdx === 0 && (
  <AIConfidenceDemo cancelSignal={aiConfidenceSignal} />
)}
```

Note the gating: `activeIdx === N && isDemoMode`, not just `activeIdx === N`. This means **toggling demo→sim** also aborts (mic releases, fetch aborts), not just swiping. The sim/demo opacity-toggle pattern (handoff.md item: both sim and demo mounted simultaneously when active) makes this gating critical — without it, swapping to sim leaves the demo's mic open.

When the user swipes from warm brown → lavender:

1. `activeIdx` changes → both `(0 && isDemoMode)` and `(1 && isDemoMode)` evaluate fresh
2. AI Confidence's signal aborts → its adapter tears down mic, fetch, state
3. Trace's signal stays unaborted but the demo isn't mounted yet — irrelevant
4. `isDemoMode` resets to false (carousel always lands on sim state)
5. If user later presses Try Demo on lavender, a fresh Trace signal is created and passed in

## Why AbortSignal is the right primitive

| Alternative | Why not |
|---|---|
| **Pure mount-gating** (`{activeIdx === N && <Demo />}`) | Relies on demo author's effect cleanup discipline; can't cancel in-flight fetches that started before unmount; pays full remount cost on every swipe; doesn't handle the demo↔sim toggle case where the demo stays mounted |
| **`active` prop + internal teardown effect** | Every demo reinvents its own cancellation logic; no standard API; error-prone; doesn't compose with `fetch()` |
| **React Context with kill callback** | Works but requires custom contract; `AbortSignal` is literally the Web Platform's answer to this problem |
| **Imperative ref + `cancel()` method** | Non-standard, not async-friendly, doesn't compose with Web APIs |
| **A single "universal cleanup" helper** | Would have to know about every project's resources — turns into a leaky god-object that breaks the next time a project adds an `RTCPeerConnection` or new state store |

`AbortSignal` wins because it's the same API Web APIs already consume, and per-project resource teardown is correctly factored as an event listener on the same signal.

## Robustness audit — does this hold for future projects?

The contract is robust because **every async resource on the web is cancellable via AbortSignal — either natively or via abort-event listener**:

- Native: `fetch`, `addEventListener`, `ReadableStream`, `WritableStream`, IndexedDB requests (via signal-aware wrappers)
- Via listener: `MediaRecorder`, `RTCPeerConnection`, `WebSocket`, `Worker`, `setInterval`/`setTimeout`, `requestAnimationFrame`, `AudioContext`, zustand stores, any third-party SDK with a `.close()` / `.dispose()` method

If a future project introduces a new async pattern not in this list, the adapter author adds one more line to their `onAbort` body. The contract doesn't change.

The contract is **agnostic** to project nuance at the boundary layer (every demo gets the prop, every demo cleans up when it aborts). It is **deliberately not** agnostic at the implementation layer (each project's adapter knows about its own resources). That's the correct factoring — abstracting the body would re-introduce the leaky god-object problem.

## Resource teardown checklist (for new demos)

When wiring `cancelSignal` into a new demo, audit these resource categories. For each one present, add a teardown to your adapter:

- [ ] **Mic / camera streams** — `getUserMedia` results: call `.getTracks().forEach(t => t.stop())`
- [ ] **MediaRecorder** — `mediaRecorder.stop()` (releases tracks via Pattern B)
- [ ] **fetch calls** — pass `signal` directly (Pattern A)
- [ ] **WebSocket / EventSource / RTCPeerConnection** — `.close()` in adapter
- [ ] **Intervals / timeouts / RAF** — `clearInterval` / `clearTimeout` / `cancelAnimationFrame`
- [ ] **Zustand or other external stores** — call `store.getState().reset()` (or equivalent) so state doesn't leak across activations
- [ ] **IndexedDB writes** — usually safe to let them complete; just guard reads behind `if (cancelSignal?.aborted) return;`
- [ ] **AudioContext / AudioWorklet** — `.close()` or `.suspend()` per project convention
- [ ] **Third-party SDK sessions** — whatever the SDK's teardown API is
- [ ] **In-flight setState after await** — `if (cancelSignal?.aborted) return;` guard before any state write that follows an await

Missing items aren't fatal but are leaks. Use this list during code review of any new demo.

## AbortError handling

A deliberate abort surfaces in fetch as `AbortError`. Each demo's catch block must:

1. Detect it (`err.name === 'AbortError'` or `cancelSignal?.aborted`).
2. **Not** call `setError(message)` — this is intentional cancellation, not a user-facing failure.
3. Still update internal flags so the demo returns to idle (e.g., `setIsProcessing(false)`).

This is the single trickiest part of writing a Layer 2 adapter and is the most common bug. Each adapter should include the AbortError swallow as a comment-worthy line.

## Rollout plan

1. **Phase 1 — Layer 1 + reference Layer 2 (AI Confidence).** Build `useActiveAbortSignal` and `abortUtils.ts`. Wire AI Confidence end-to-end: prop → provider → hooks. Validate on demo-canvas-lab first if useful, then on `/demo-showcase`.

2. **Phase 2 — Trace adapter.** When `TraceDemo` is built (currently only sim is wired), apply the same pattern. This is the second proof point that the contract generalises.

3. **Phase 3 — ClipStream adapter.** When `ClipStreamDemo` is built. This will exercise the zustand-reset and `composeAbortSignals` paths — the most architecturally divergent case.

4. **Phase 4 — Voice Interface adapter.** Whenever Voice lands. Realtime variant will exercise the WebRTC `pc.close()` path; other variants will exercise abort-signal composition.

5. **Phase 5 — Convention enforcement.** Add a one-liner comment at the top of each demo file pointing to this doc. Consider a lint rule or PR-review checklist that flags any new demo that doesn't accept `cancelSignal?: AbortSignal`.

## Testing strategy

- **Manual flash test**: start recording in a demo, immediately swipe to another variation, swipe back, press Try Demo. Expected: clean state, no old transcript, no leftover mic indicator.
- **DevTools network test**: trigger a slow-mock fetch in the demo, swipe away before it resolves, confirm the response is `(canceled)` in the Network panel and no state update fires.
- **Media streams**: `navigator.mediaDevices.enumerateDevices()` is not enough — instead inspect `MediaStreamTrack.readyState` of any references the test holds, or use `chrome://media-internals` for live tracks. After swipe, all should be `ended`.
- **WebRTC**: `pc.connectionState` should be `closed` after abort. Check `chrome://webrtc-internals` for live peer connections.
- **Zustand**: snapshot store state before swipe, after swipe — should equal `initialState`.
- **Timer leaks**: React DevTools Profiler; `console.time` around aborts to confirm setTimeout/setInterval cancellations.

## Open questions (to resolve when implementing)

- **Prop vs context for the signal itself.** Currently planned as prop. Context reduces boilerplate in deeply-nested demos but makes the contract less visible. Lean prop for now; migrate to a `<DemoCancellationProvider>` if multiple deeply-nested demos end up needing it.
- **Fresh signal identity on each activation triggers a re-render** in the consumer (prop identity changed). Acceptable for now; if it becomes a perf bottleneck, memoise with a stable wrapper that exposes `signal.aborted` checks instead.
- **Pause vs full cancel.** e.g., partial recording, user swipes for 200ms then swipes back — do we resume or restart? Default: restart (simpler, avoids state-merge complexity). Revisit if UX feedback demands pause/resume.
- **Should `composeAbortSignals` be replaced with `AbortSignal.any([...])`?** That static method exists in modern browsers but isn't yet universal. Keep the userland helper until target-browser support is confirmed safe.

## Out of scope for this plan

- Inter-demo state preservation (e.g., "remember that I had typed X in warm brown when I swipe back"). Not needed today; if it becomes needed, add a per-demo `persistState` store keyed by variation index.
- Unmount keep-alive patterns (`react-keep-alive` etc.) — the mount-gate-plus-abort-signal hybrid handles current needs. Revisit if remount cost becomes a perf issue.
- Cancellation of work already persisted to IndexedDB (e.g., "rollback the partial clip recording"). Treated as out-of-scope: writes that completed are kept; reads after abort are guarded.
