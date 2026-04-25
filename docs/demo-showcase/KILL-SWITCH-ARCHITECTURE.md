# Demo Showcase — Kill-Switch Architecture Plan

Status: **Planned, not yet implemented.** Reviewed and rewritten 2026-04-25 to fix conceptual errors caught in review (session-state vs durable-state conflation, ClipStream offline-queue blind spot, race in `useActiveAbortSignal`, fictional ClipStream APIs in adapter sketch).

## Three rules

The architecture is built on three rules. Everything else is mechanism.

1. **The showcase owns activation and deactivation.** Only the showcase decides "this demo is active now" or "this demo is inactive now." Demos do not self-deactivate.
2. **Each project owns how to release its active resources and reject stale completions.** The body of cancellation is necessarily project-specific; only the *contract* is universal.
3. **Persisted product artifacts stay unless the product itself defines them as session-only.** The showcase must not invent teardown the underlying product doesn't already perform when its main page unmounts. Cancellation kills active session work; it does not reset durable state.

The biggest reframe over the previous draft: **abort live work, ignore stale writes, preserve durable state** — not "cancel and reset everything inactive."

## Problem statement

When a user interacts with a demo in the showcase carousel and then swipes to another variation — or presses the close button, or toggles back to simulation — we need to guarantee that **active work the demo kicked off does not survive the transition**:

- An API response that's mid-flight when the swipe happens must NOT render into the now-inactive demo.
- A microphone stream must release.
- Timers, intervals, animation frames, `MediaRecorder` sessions, and `RTCPeerConnection`s must stop.
- Late callbacks (`MediaRecorder.onstop`, IndexedDB completion handlers, `await blob.arrayBuffer()` resolution) must NOT commit to state that belongs to a now-abandoned run.

What cancellation **does not** do:

- It does not reset zustand stores or other product-defined durable state.
- It does not delete IndexedDB blobs that have already been persisted.
- It does not interfere with global retry pipelines (e.g., ClipStream's offline queue).

## The four projects don't have the same shape

Ground truth on what we're cancelling, walked from the actual code:

| Project | State pattern | Active resources | Durable / product-defined state (DO NOT touch) |
|---|---|---|---|
| **AI Confidence** | React Context provider (`SpeechConfidenceProvider`) wrapping a hook tree | `getUserMedia` + `MediaRecorder` (1000ms timeslice) + one `fetch` to `/api/ai-confidence-tracker/transcribe` | (none — no persistence layer) |
| **Trace** | Single mega-component [TraceApp.tsx](../../src/projects/trace/components/TraceApp.tsx); second mic via [TraceLiveWaveform.tsx](../../src/projects/trace/components/ui/TraceLiveWaveform.tsx) | `getUserMedia` (twice) + `MediaRecorder` + two fetches (`/api/trace/parse-voice`, `/api/trace/parse-receipt`) | (none — no persistence layer) |
| **ClipStream** | **Zustand global store** ([clipStore.ts](../../src/projects/clipperstream/store/clipStore.ts)) + cooperating hooks (`useClipRecording`, `useOfflineRecording`, `useAutoRetry`) + **IndexedDB-backed audio storage**. Mounted in showcase already via [ClipStreamSim.tsx](../../src/projects/demo-showcase/components/simulations/ClipStreamSim.tsx). | Live mic stream, in-progress `MediaRecorder`, in-flight `/api/clipperstream/transcribe` request, in-flight `/api/clipperstream/format-text` request | **Pending clips queue, IndexedDB audio blobs, zustand store contents (clips list, current state machine), offline retry pipeline** ([useAutoRetry.ts](../../src/projects/clipperstream/hooks/useAutoRetry.ts) lives globally in `_app.tsx:14`) |
| **Voice Interface** | Sibling component variants. Realtime variant uses an OpenAI Realtime WebRTC peer connection ([VoiceRealtimeOpenAI.tsx](../../src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx)). | `RTCPeerConnection`, data channel, persistent streaming session, ephemeral token fetch, audio interval, `getUserMedia` | (none — session is the artifact) |

ClipStream is the most architecturally divergent and is **already live in the carousel** via the sim slot, so it is in scope from Phase 1, not deferred. Voice Interface is out of scope until it ships into the showcase.

## ClipStream's offline queue — important context

`useAutoRetry` is mounted globally in [src/pages/_app.tsx:14](../../src/pages/_app.tsx). It calls `processAllPendingClips`, which is registered into the zustand store by `ClipMasterScreen` on mount ([ClipMasterScreen.tsx:725-737](../../src/projects/clipperstream/components/ui/ClipMasterScreen.tsx)) and replaced with a warn-only stub on unmount ([clipStore.ts:197-198](../../src/projects/clipperstream/store/clipStore.ts)). Consequence: **while ClipMasterScreen is unmounted, pending clips wait. Reconnection alone doesn't process them; ClipMasterScreen must be mounted again.** This is intentional product behaviour, not a bug.

The kill switch must NOT change this. If a user records offline in the ClipStream sim slot, swipes to AI Confidence, then reconnects to the network — pending clips must remain queued and process when the user returns to the ClipStream slot. The showcase has no business resetting that state.

## Two-layer architecture

```
─────────────────────────────────────────────────────────────────
 LAYER 1 — UNIVERSAL  (identical for every demo, present + future)
─────────────────────────────────────────────────────────────────
 - useActiveAbortSignal(isActive)   ← signal source
 - useRunId(isActive)                ← session-generation guard
 - cancelSignal?: AbortSignal prop   ← contract
 - signal-listener pattern            ← composition rule
 - shared helpers (onAbort, composeAbortSignals)

─────────────────────────────────────────────────────────────────
 LAYER 2 — PER-PROJECT ADAPTER  (small, co-located, body differs)
─────────────────────────────────────────────────────────────────
 - On abort: invoke the product's existing cancel path
 - Each demo has its own adapter; bodies differ; shape is identical
```

Key invariant: **a demo never knows WHY it was cancelled** (swipe / close / toggle / unmount / remount). It only knows THAT it was. The demo invokes its own cancel path. The showcase owns all orchestration.

## Layer 1 — universal contract

### 1.1 The signal source

`AbortSignal` is the right primitive for cancelling future-tense async work: it's the Web Platform standard, every modern API consumes it, cancellation composes via `composeAbortSignals`.

```ts
// src/projects/demo-showcase/hooks/useActiveAbortSignal.ts

import { useEffect, useRef } from 'react';

/**
 * Returns an AbortSignal bound to the given `isActive` state.
 *
 * - While isActive is true, the signal is "open" (not aborted).
 * - When isActive flips to false, the signal aborts during the commit phase.
 * - When isActive flips from false back to true, a FRESH AbortController is
 *   created SYNCHRONOUSLY during render so consumers never observe an
 *   already-aborted signal on the activation render.
 */
export function useActiveAbortSignal(isActive: boolean): AbortSignal {
  const controllerRef = useRef<AbortController>(new AbortController());

  // Synchronous swap during render: if we're being activated and the current
  // controller is dead, replace it BEFORE any consumer reads the signal this
  // render. Render-time ref mutation is safe here — the new controller has
  // no observers yet.
  if (isActive && controllerRef.current.signal.aborted) {
    controllerRef.current = new AbortController();
  }

  // Abort in commit phase when going inactive. Signal identity stays stable;
  // listeners attached previously fire via the signal they're already bound to.
  useEffect(() => {
    if (!isActive && !controllerRef.current.signal.aborted) {
      controllerRef.current.abort();
    }
  }, [isActive]);

  return controllerRef.current.signal;
}
```

Note the render-time swap on reactivation. The previous draft did this swap inside an effect, which meant the activation render returned a stale aborted signal for one render; consumers with `[cancelSignal]` deps fired their abort handlers immediately on re-entry. The render-time swap eliminates that race.

### 1.2 The session-generation guard

`AbortSignal` cancels future-tense work but does **not** stop callbacks already in flight when abort is called: `MediaRecorder.onstop` will still fire with a Blob in hand; `await blob.arrayBuffer()` will still resolve; an IndexedDB `onsuccess` may still trigger; a `Promise.then` queued before abort still runs.

Every state-mutating callback must verify it still belongs to the currently-active run before committing. This is **first-class**, not belt-and-braces. The pattern:

```ts
// src/projects/demo-showcase/hooks/useRunId.ts

import { useEffect, useRef } from 'react';

/** Returns a ref whose .current is a monotonic id that bumps on every
 *  activation. Capture .current at the START of an async operation; check
 *  before any state write that follows an await. */
export function useRunId(isActive: boolean) {
  const runIdRef = useRef(0);
  useEffect(() => {
    if (isActive) runIdRef.current += 1;
  }, [isActive]);
  return runIdRef;
}
```

Adapter usage:

```ts
const runIdRef = useRunId(isActive);

const transcribe = async (blob: Blob) => {
  const myRun = runIdRef.current;       // capture at start
  const res = await fetch(url, { signal: cancelSignal, body: blob });
  if (myRun !== runIdRef.current) return; // run was abandoned
  const data = await res.json();
  if (myRun !== runIdRef.current) return;
  setTranscript(data);                   // safe to commit
};

mediaRecorder.onstop = () => {
  const myRun = runIdRef.current;
  if (myRun !== runIdRef.current) return; // late onstop after a new run started
  // ... commit blob to state
};
```

`AbortSignal` covers cancellable I/O. `runId` covers everything else: late event-fired callbacks, IndexedDB completions, Promise chain residue. Together they catch the entire late-write class.

### 1.3 The prop contract

Every demo accepts `cancelSignal?: AbortSignal`. Always optional, always the same name, always the same semantics:

> *"When this signal aborts, you are inactive. Invoke your existing cancel path. Do not commit late writes."*

Standalone usage (without showcase) is unchanged: pass nothing, get nothing, demo runs as before. Strictly additive.

### 1.4 The composition rules

**Pattern A — native AbortSignal support.** Pass it directly:

```ts
await fetch(url, { signal: cancelSignal });
document.addEventListener('visibilitychange', handler, { signal: cancelSignal });
```

**Pattern B — anything else.** Listen for the abort event and invoke the product's cancel path:

```ts
cancelSignal.addEventListener('abort', () => {
  // Invoke the product's existing cancel/X-button logic. NOT showcase-specific
  // teardown — the same code path the user would trigger by pressing X.
  productCancelPath();
}, { once: true });
```

This pattern handles `MediaRecorder`, `RTCPeerConnection`, intervals/timeouts, etc. Web Platform APIs use the same pattern internally for non-signal-aware resources.

### 1.5 The operational rule: invoke the product's existing cancel path

When a demo is cancelled, it does NOT invent teardown semantics. It invokes the same code path the product's own X / cancel button already invokes for whatever in-progress action is running. Two consequences:

- **The showcase inherits product semantics for free.** ClipStream's [handleCloseClick at ClipMasterScreen.tsx:739](../../src/projects/clipperstream/components/ui/ClipMasterScreen.tsx) already encodes cancel-while-recording, cancel-while-processing, and cancel-while-viewing. The adapter just routes the abort signal into that handler.
- **Product evolution is automatic.** If the product changes its cancel semantics tomorrow (e.g., a new product ships where partials are auto-saved on cancel), the showcase inherits the new behaviour without rewrite.

Stated as a rule:

> **The showcase's cancellation must not perform any teardown the underlying product doesn't already perform via its own cancel UI.**

### 1.6 Shared helpers (small, optional)

`src/projects/demo-showcase/hooks/abortUtils.ts`:

```ts
/** Run fn when signal aborts; return cleanup that removes listener. */
export function onAbort(signal: AbortSignal | undefined, fn: () => void): () => void {
  if (!signal) return () => {};
  if (signal.aborted) { fn(); return () => {}; }
  const handler = () => fn();
  signal.addEventListener('abort', handler, { once: true });
  return () => signal.removeEventListener('abort', handler);
}

/** Compose multiple signals: result aborts when any input aborts.
 *  Useful when a project has its own internal AbortController (e.g. ClipStream's
 *  per-fetch retry controller) and also needs to honour an external cancelSignal. */
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

Each adapter does three things only:

1. Threads `cancelSignal` into Pattern-A consumers (mostly `fetch`).
2. On abort, invokes the product's existing cancel path.
3. Uses `runId` to guard any state-mutating callback that runs after an await or on a late event.

### 2.1 AI Confidence

Reference implementation. The demo wrapper accepts the prop, threads it through `SpeechConfidenceProvider`. Inside the provider, the hooks use both `cancelSignal` (for fetch) and `runId` (for the Blob → setState path that involves a late `MediaRecorder.onstop`).

State classification: **all state is session-ephemeral**. No durable layer. Cancellation resets the entire state machine via `resetState()`.

```tsx
// src/projects/demo-showcase/components/demos/AIConfidenceDemo.tsx
export const AIConfidenceDemo: React.FC<{ cancelSignal?: AbortSignal }> = ({ cancelSignal }) => (
  <SpeechConfidenceProvider cancelSignal={cancelSignal}>
    <DeepReader />
    <IntegratedDeepCard />
  </SpeechConfidenceProvider>
);

// Inside useDeepgramProcessing — Pattern A
const myRun = runIdRef.current;
const response = await fetch('/api/ai-confidence-tracker/transcribe', {
  method: 'POST',
  body: formData,
  signal: cancelSignal,
});
if (myRun !== runIdRef.current) return;
// ... parse json, guard again, then setResult

// Inside useAudioRecording — Pattern B (MediaRecorder doesn't speak signals natively)
useEffect(() => onAbort(cancelSignal, () => {
  stopRecording();   // existing function — releases tracks, stops recorder
  resetState();      // existing function — returns AppState to INITIAL
}), [cancelSignal, stopRecording, resetState]);

// MediaRecorder.onstop — runId guard for late commit
mediaRecorder.onstop = () => {
  const myRun = runIdRef.current;
  if (myRun !== runIdRef.current) return;
  setAudioData(blob);
};
```

AbortError must be swallowed silently in the catch block (it's deliberate cancellation, not a user-facing error).

### 2.2 Trace

Mega-component. Adapter sits at the top of `TraceApp` and wires both fetches plus the mic teardown.

State classification: **all session-ephemeral**. Cancel = stop mic, abort fetches, return to idle.

```tsx
// inside TraceApp.tsx
const runIdRef = /* useRunId provided by parent */;

useEffect(() => onAbort(cancelSignal, () => {
  // Invoke whatever Trace's own cancel button does (or its closest equivalent
  // teardown if no explicit cancel UI exists).
  mediaRecorderRef.current?.stop();
  mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
}), [cancelSignal]);

// Both fetches get the signal:
await fetch('/api/trace/parse-voice', { ..., signal: cancelSignal });
await fetch('/api/trace/parse-receipt', { ..., signal: cancelSignal });

// Each post-await setState guarded by runId.

// TraceLiveWaveform: pass cancelSignal as prop, release tracks in its own onAbort.
```

### 2.3 ClipStream

The most divergent project, and the one most prone to mistakes. The adapter is **smaller** than for AI Confidence, not bigger, because most of what ClipStream tracks is durable product state that the kill switch must not touch.

State classification:

| Resource | Class | Cancel behaviour |
|---|---|---|
| Live mic `MediaStream` | Active | Release tracks |
| Active `MediaRecorder` | Active | Stop |
| In-flight transcribe / format fetch | Active | Abort (already uses an internal `AbortController` at [ClipMasterScreen.tsx:255](../../src/projects/clipperstream/components/ui/ClipMasterScreen.tsx)) |
| Per-fetch retry controller in [transcriptionRetry.ts:170](../../src/projects/clipperstream/utils/transcriptionRetry.ts) | Active | Compose with external `cancelSignal` via `composeAbortSignals` |
| Pending clips array in zustand store | **Durable** | Do NOT reset |
| IndexedDB audio blobs | **Durable** | Do NOT delete |
| Zustand state machine (current screen, recordNavState, etc.) | **Durable** | Do NOT reset |
| `useAutoRetry` global pipeline ([_app.tsx:14](../../src/pages/_app.tsx)) | **Durable / global** | Do NOT touch |
| `processAllPendingClips` registration | **Durable** | Do NOT unregister beyond what ClipMasterScreen's existing unmount cleanup does |

Existing cancel path: [`handleCloseClick` at ClipMasterScreen.tsx:739](../../src/projects/clipperstream/components/ui/ClipMasterScreen.tsx). It already encodes the right semantics for each state:

- Recording → `stopRecordingHook()` + `resetRecording()` (discard partial blob — confirmed product policy)
- Processing → `abortControllerRef.current.abort()` + mark clip `pending-retry`
- Complete → navigate

The adapter routes the kill-switch abort into `handleCloseClick`. Concretely, ClipMasterScreen accepts an optional `cancelSignal?: AbortSignal` prop and wires its own cancel handler internally:

```tsx
// inside ClipMasterScreen.tsx (additive change to product source)
useEffect(() => onAbort(cancelSignal, () => {
  handleCloseClick();   // existing X-button logic — invokes correct path per state
}), [cancelSignal, handleCloseClick]);
```

In the showcase wrapper:

```tsx
// ClipStreamSim wraps ClipMasterScreen — pass signal through.
<ClipMasterScreen cancelSignal={cancelSignal} />
```

Two important non-actions for ClipStream:

- **Do NOT call any zustand reset.** The store does not have a `reset` action ([clipStore.ts](../../src/projects/clipperstream/store/clipStore.ts) confirms), and adding one for the showcase would override product behaviour. Pending clips must persist across demo activations.
- **Do NOT touch `useAutoRetry`.** It lives globally in `_app.tsx` and is intentional. The offline-reconnect scenario must continue to work: record offline in ClipStream sim → swipe to AI Confidence → reconnect → swipe back to ClipStream → pending clip processes when ClipMasterScreen remounts.

### 2.4 Voice Interface (out of scope this phase)

Voice Interface is **not** in the showcase yet (per [HANDOFF.md](../../HANDOFF.md): "Voice Interface is deferred entirely"). When it lands, the adapter pattern will be:

- Realtime variant: `pc.close()`, `dataChannel.close()`, mic tracks stop, audio interval clear, on-abort.
- Token fetch: `signal: cancelSignal` (Pattern A).
- Other variants (`VoiceTextBoxStandard` / `VoiceTextBoxClip` / `VoiceTextBoxCheckClose`) already create their own internal `AbortController` — compose with external signal via `composeAbortSignals`.

Out of scope until Voice Interface ships into the showcase project list.

## How the showcase wires it

One signal per demo slot, computed independently. Demos do not share signals.

```tsx
// in src/pages/demo-showcase/index.tsx

const aiConfidenceSignal = useActiveAbortSignal(activeIdx === 0 && isDemoMode);
const traceSignal        = useActiveAbortSignal(activeIdx === 1 && isDemoMode);
const clipStreamSignal   = useActiveAbortSignal(activeIdx === 2 /* sim already mounts product */);
// voiceSignal — TBD when Voice ships

{activeIdx === 0 && (
  <AIConfidenceDemo cancelSignal={aiConfidenceSignal} />
)}
{activeIdx === 2 && (
  <ClipStreamSim cancelSignal={clipStreamSignal} />
)}
```

Note the gating differences:

- **AI Confidence**, **Trace**: gated on `activeIdx === N && isDemoMode`. Sim and demo are mounted simultaneously when `activeIdx === N`; toggling demo→sim must abort even though the demo isn't unmounting. Without the `isDemoMode` clause, swapping to sim would leave the demo's mic open.
- **ClipStream**: gated on `activeIdx === N` only — there is no separate demo, the sim slot mounts the real product. Cancellation triggers when the user swipes away from ClipStream entirely.

When the user swipes from warm brown → lavender:

1. `activeIdx` changes → both `(0 && isDemoMode)` and `(1 && isDemoMode)` evaluate fresh.
2. AI Confidence's signal aborts → adapter invokes its cancel path; mic released, fetch aborted, state reset.
3. Trace's signal stays unaborted but the demo isn't mounted yet — irrelevant.
4. `isDemoMode` resets to false (carousel always lands on sim).
5. If user later presses Try Demo on lavender, a fresh Trace signal is created.

ClipStream's offline retry pipeline continues running globally throughout — it's not tied to slot activation.

## AbortError handling

A deliberate abort surfaces in fetch as `AbortError`. Each demo's catch block must:

1. Detect it (`err.name === 'AbortError'` or `cancelSignal?.aborted`).
2. **Not** surface it as a user-facing error. Don't `setError(message)`.
3. Still update internal flags so the demo returns to idle (e.g. `setIsProcessing(false)`).

This is the single trickiest implementation point and the most common bug. Each adapter should include the AbortError swallow as a comment-worthy line.

## Why AbortSignal + runId is the right primitive set

| Alternative | Why not |
|---|---|
| **Pure mount-gating** | Relies on demo author's effect cleanup discipline; can't cancel in-flight fetches that started before unmount; doesn't handle the demo↔sim opacity-toggle case where the demo stays mounted. |
| **`active` prop + internal teardown effect** | Every demo reinvents its own cancellation logic; no standard API. |
| **React Context with kill callback** | Works but requires custom contract; `AbortSignal` is literally the Web Platform's answer. |
| **Imperative ref + `cancel()` method** | Non-standard, doesn't compose with `fetch()` / event listeners. |
| **`AbortSignal` alone, no runId** | Misses late callbacks: `MediaRecorder.onstop` after `stop()`, `await blob.arrayBuffer()` resolution, IndexedDB `onsuccess`, queued Promise continuations. |
| **A "universal cleanup" helper** | Would have to know every project's resources; turns into a leaky god-object that breaks the next time a project adds an `RTCPeerConnection` or new state store. |

`AbortSignal` cancels future-tense I/O. `runId` rejects stale completions. Adapters route abort to the product's own cancel path. Each layer addresses a class of bug the others can't.

## Robustness audit — does this hold for future projects?

The contract is robust because **every async resource on the web is cancellable via AbortSignal — either natively or via abort-event listener** — and **every late-write class is rejectable via session-generation comparison**:

- Native AbortSignal: `fetch`, `addEventListener`, `ReadableStream`, `WritableStream`, signal-aware IndexedDB wrappers
- Via abort listener: `MediaRecorder`, `RTCPeerConnection`, `WebSocket`, `Worker`, `setInterval`/`setTimeout`, `requestAnimationFrame`, `AudioContext`, third-party SDKs with `.close()` / `.dispose()`
- Via runId guard: any callback that runs after an await; any event handler attached to a long-lived resource (`onstop`, `onsuccess`, `ondatachannel`, etc.)

If a future project introduces a new async pattern not in these lists, the adapter author either (a) adds one more line to the abort listener, or (b) wraps a new callback site with a runId guard. The contract doesn't change.

The contract is **agnostic** to project nuance at the boundary layer. It is **deliberately not** agnostic at the implementation layer — each project's adapter routes to its own cancel path, knows about its own resources, and respects its own durable state.

## Resource teardown checklist (for new demos)

When wiring a new demo, audit these categories. For each one present, decide: route through the product cancel path, or add a teardown to the adapter, or guard with runId.

- [ ] **Mic / camera streams** — release tracks (`getTracks().forEach(t => t.stop())`)
- [ ] **MediaRecorder** — call `.stop()`; handle the late `onstop` with runId guard
- [ ] **fetch calls** — pass `signal` directly (Pattern A)
- [ ] **WebSocket / EventSource / RTCPeerConnection** — `.close()` in adapter
- [ ] **Intervals / timeouts / RAF** — `clearInterval` / `clearTimeout` / `cancelAnimationFrame`
- [ ] **External state stores (zustand, redux, etc.)** — **classify per-store**: session-ephemeral state may be reset; durable / product-defined state must NOT be touched
- [ ] **IndexedDB writes** — usually safe to let in-flight writes complete; guard subsequent reads with `if (cancelSignal?.aborted) return;`
- [ ] **AudioContext / AudioWorklet** — `.close()` or `.suspend()` per project convention
- [ ] **Third-party SDK sessions** — call SDK teardown
- [ ] **Late callbacks (onstop, onsuccess, queued Promise continuations)** — guard with runId
- [ ] **Post-await setState** — guard with runId (and/or `cancelSignal?.aborted`)
- [ ] **Global retry pipelines** — DO NOT touch
- [ ] **Persisted artifacts (IndexedDB blobs, store entries)** — DO NOT delete

Missing items are leaks; touching durable state is product-behaviour bugs. Use this list during code review.

## Rollout plan

1. **Phase 1 — Layer 1 + AI Confidence + ClipStream.** Build `useActiveAbortSignal`, `useRunId`, `abortUtils`. Wire AI Confidence end-to-end (prop → provider → hooks). Wire ClipStream by adding the optional `cancelSignal?: AbortSignal` prop to `ClipMasterScreen`, routing into `handleCloseClick`. Validate both with the test scenarios below before declaring Phase 1 done.

2. **Phase 2 — Trace adapter.** When `TraceDemo` is built (currently only sim is wired). Same pattern: wrapper accepts prop, threads into the mega-component.

3. **Phase 3 — Voice Interface.** Whenever Voice ships into the showcase. Realtime + non-realtime variants each get their own adapter pattern (composed with their existing internal `AbortController`s).

4. **Phase 4 — Convention enforcement.** Add a one-liner comment at the top of each demo file pointing to this doc. Consider a PR-review checklist that flags any new demo that doesn't accept `cancelSignal?: AbortSignal`.

## Testing strategy

Acceptance criteria for Phase 1:

**AI Confidence:**

- Start recording, swipe away mid-record → mic released (no live tracks), no late `setAudioData` warning in console.
- Start recording, swipe away during transcribe fetch → Network panel shows `(canceled)`, no late `setResult` fires, no error toast.
- Toggle demo→sim mid-record → mic released, state reset to INITIAL.
- Swipe back → demo state is fully clean (no stale transcript, no leftover error).

**ClipStream:**

- Record a clip while online, swipe away mid-record → partial audio discarded (per product policy at `handleCloseClick`), no entry appears in clips list.
- Record a clip while online, swipe away during transcription → clip marked `pending-retry` (existing product behaviour, kill switch did not change it).
- **Offline-reconnect scenario** (the critical one):
  1. Go offline.
  2. Record a clip in the ClipStream sim (it persists to IndexedDB, marked pending).
  3. Swipe to AI Confidence.
  4. Come back online.
  5. Swipe back to ClipStream.
  6. **Expected:** the pending clip processes when ClipMasterScreen remounts. Pending-clips queue, IndexedDB blob, and zustand store are intact across the swipe-away. Acceptance failure if the clip disappears, the queue is reset, or `useAutoRetry` is interfered with.
- **Tab-close parity:** at no point during a swipe does ClipStream's state look different from "user closed and reopened the tab in the same browser session." If the showcase ever causes more teardown than tab-close would, the kill switch has overstepped.

**General (all demos):**

- Reactivation (false→true) does NOT immediately fire abort handlers. (Catches the `useActiveAbortSignal` race.)
- After abort, no `setState on unmounted component` warnings in the React console.
- Live `MediaStreamTrack.readyState` is `ended` for any track the demo claimed.
- For Realtime (when Voice ships): `pc.connectionState === 'closed'` after abort.

## Open questions (revisit during implementation)

- **Prop vs context for the signal itself.** Currently planned as prop. Migrate to a `<DemoCancellationProvider>` if multiple deeply-nested demos end up needing it.
- **`composeAbortSignals` vs `AbortSignal.any([...])`.** The static method exists in modern browsers but isn't yet universal. Keep the userland helper until target-browser support is confirmed safe.
- **`runId` exposure.** Currently sketched as a hook returning a ref. May want a small `useGuardedCallback` wrapper for cleaner adapter code if the pattern proliferates.

## Out of scope

- Inter-demo state preservation ("remember warm brown's transcript when I swipe back"). Not needed today.
- Unmount keep-alive patterns (`react-keep-alive` etc.). The mount-gate-plus-abort-signal hybrid is sufficient.
- Cleanup of work already persisted to IndexedDB. Treated as durable; reads after abort are guarded.
- Showcase-specific behaviour that overrides product semantics. Explicitly forbidden by the operational rule.
