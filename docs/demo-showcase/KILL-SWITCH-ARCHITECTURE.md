# Demo Showcase — Kill-Switch Architecture Plan

Status: **Planned, not yet implemented.** Do the demo-canvas-lab → demo-showcase port first; come back to this.

## Problem statement

When a user interacts with a demo in the showcase carousel and then swipes to another variation — or presses the close button, or toggles back to simulation — we need to guarantee that **nothing the demo kicked off survives the transition**. Specifically:

- An API response that's mid-flight when the swipe happens must NOT render into the now-inactive demo.
- A microphone stream must release.
- Timers, intervals, animation frames, and `MediaRecorder` sessions must stop.
- Any state contamination between demos (e.g., warm-brown's transcript bleeding onto lavender's UI) must be impossible.

This is a **race-condition / resource-leak class of bug**. It has appeared multiple times historically in the voice-interface variants. Fixing it case-by-case per demo is:

1. Easy to miss — demos that never had mic/async code might acquire it later.
2. Copy-paste prone — every demo reinvents its own cancellation logic.
3. Subtle to test — leaks only manifest under fast swipe-then-trigger sequences.

We want a **single architectural primitive** every demo can honour, enforced by the showcase, cleaned up automatically on any "become inactive" transition.

## Principle

**`AbortController` + `AbortSignal` as the cross-cutting cancellation contract.**

- It's the Web Platform standard for cancelling async work.
- Every modern async API (`fetch`, `addEventListener`, streams, `MediaRecorder` via helper) accepts a signal.
- Cancellation composes: one signal can gate many operations; aborting the controller cancels them all.
- Demos that don't use the signal still work standalone (zero signal → zero external control).

## Architecture at a glance

```
demo-showcase (orchestrator)
   │
   ├── useActiveAbortSignal(isActive)  ← generates fresh AbortSignal per active session
   │     - aborts signal on isActive=false
   │     - creates new AbortController on next isActive=true
   │
   └── passes signal as prop to active demo
           │
           ▼
   AIConfidenceDemo (or any demo)
           │
           ├── accepts cancelSignal?: AbortSignal
           └── wires signal into internal fetches, streams, timeouts
```

Key invariant: **a demo never knows WHY it was cancelled (swipe / close / toggle / unmount / remount). It only knows THAT it was.** The demo cleans up and returns to idle. The showcase owns all orchestration.

## The showcase-side primitive

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

## The demo-side contract

Each demo gets an **optional** `cancelSignal?: AbortSignal` prop. The demo wires it into its own async work:

```tsx
interface AIConfidenceDemoProps {
  cancelSignal?: AbortSignal;
}

export const AIConfidenceDemo: React.FC<AIConfidenceDemoProps> = ({
  cancelSignal,
}) => {
  // Example: a fetch
  const transcribe = async (blob: Blob) => {
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: blob,
      signal: cancelSignal, // ← the only line that touches the signal
    });
    if (cancelSignal?.aborted) return; // belt-and-braces post-await check
    const data = await res.json();
    if (cancelSignal?.aborted) return;
    setTranscript(data);
  };

  // Example: a listener with signal-based auto-removal
  useEffect(() => {
    if (!cancelSignal) return;
    const onVisibility = () => { /* ... */ };
    document.addEventListener('visibilitychange', onVisibility, {
      signal: cancelSignal, // ← auto-removed when signal aborts
    });
  }, [cancelSignal]);

  // Example: timers that should clear on abort
  useEffect(() => {
    if (!cancelSignal) return;
    const id = setTimeout(() => { /* ... */ }, 3000);
    const onAbort = () => clearTimeout(id);
    cancelSignal.addEventListener('abort', onAbort, { once: true });
    return () => cancelSignal.removeEventListener('abort', onAbort);
  }, [cancelSignal]);

  // ... rest of demo
};
```

**Standalone usage unchanged**: if `cancelSignal` is undefined, every guard short-circuits safely. The demo works as before. It's only *additive*.

## How the showcase wires it

```tsx
// in demo-canvas-lab.tsx (later demo-showcase/index.tsx)

const isDemoActive = activeIdx === 0 && isDemoMode;
const cancelSignal = useActiveAbortSignal(isDemoActive);

<AIConfidenceDemo cancelSignal={cancelSignal} />
```

When the user swipes from warm brown → lavender:
1. `activeIdx` changes → `isDemoActive` becomes false
2. `useActiveAbortSignal` aborts the controller
3. Inside `AIConfidenceDemo`, any in-flight fetch/stream/timer sees the abort and bails
4. `isDemoMode` also resets to false (carousel navigation always lands on sim state)
5. Lavender's demo prop `cancelSignal` stays non-aborted (fresh controller would spin up only when user presses Try Demo on lavender)

## Why this is the right primitive

| Alternative | Why not |
|---|---|
| **Pure mount-gating** (`{activeIdx === N && <Demo />}`) | Relies on demo author's effect cleanup discipline; can't cancel in-flight fetches that started before unmount; pays full remount cost on every swipe |
| **`active` prop + internal teardown effect** | Every demo reinvents its own cancellation logic; no standard API; error-prone |
| **React Context with kill callback** | Works but requires custom contract; `AbortSignal` is literally the Web Platform's answer to this |
| **Imperative ref + `cancel()` method** | Non-standard, not async-friendly, doesn't compose with `fetch()` and other Web APIs |

**`AbortSignal` wins** because it's the same API Web APIs already consume. One line of wiring at the demo's call site; the demo's code ends up leak-free by construction.

## Rollout plan

1. **Phase 1 — Primitive + first demo.** Add `useActiveAbortSignal` hook under `src/projects/demo-showcase/hooks/`. Add `cancelSignal?: AbortSignal` prop to `AIConfidenceDemo`. Wire one async operation (the stubbed `transcribeAudio` fetch or its replacement).

2. **Phase 2 — Lab page integration.** Compute `isDemoActive` in demo-canvas-lab. Pass signal to the demo. Verify: rapid swipe during demo → no console errors, no leaked `MediaRecorder`, no late transcript render.

3. **Phase 3 — Port to demo-showcase/index.tsx.** Apply the same wiring in the real showcase page once the lab pattern is proven.

4. **Phase 4 — Document, don't migrate.** Add this file path + a one-liner comment at the top of each demo file pointing here. Future demos adopt the pattern by convention, not by mandate. If a demo has no async work, it doesn't need the prop.

## Testing strategy

- **Manual flash test**: start recording in a demo, immediately swipe to another variation, swipe back, press Try Demo. Expected: clean state, no old transcript, no leftover mic indicator.
- **DevTools network test**: trigger a slow-mock fetch in the demo, swipe away before it resolves, confirm the response is discarded (no state update log).
- **Media streams**: check `navigator.mediaDevices` active tracks after swipe — should be zero.
- **Timer leaks**: React DevTools Profiler; `console.time` around aborts to confirm setTimeout cancellations.

## Open questions (to resolve when implementing)

- Should the signal be passed via **prop** or **React Context**? Context reduces boilerplate in deeply-nested demos but makes the contract less visible. Leaning prop for the first demo; migrate to context if multiple deeply-nested demos end up needing it.
- Fresh signal identity on each activation triggers a re-render in the consumer (prop identity changed). Acceptable for now; if a bottleneck, memoise with `signal.aborted` check instead.
- What about **pause** (vs full cancel)? e.g., in a partial recording, user swipes for 200ms then swipes back — do we want to resume or restart? Default: restart (simpler). Revisit if UX feedback demands pause/resume.

## Out of scope for this plan

- Inter-demo state preservation (e.g., "remember that I had typed X in warm brown when I swipe back"). Not needed today; if it becomes needed, add a per-demo `persistState` store keyed by variation index.
- Unmount keep-alive patterns (`react-keep-alive` etc.) — the mount-gate-plus-abort-signal hybrid handles the current needs. Revisit if remount cost becomes a perf issue.
