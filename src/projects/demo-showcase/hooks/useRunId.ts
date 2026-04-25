/**
 * Session-generation guard primitive.
 *
 * Returns a ref whose .current is a monotonic id that bumps on every
 * false→true activation. Capture .current at the START of an async
 * operation (or at the moment a late-firing event handler is attached);
 * compare against .current inside the late callback to reject writes that
 * belong to an abandoned run.
 *
 * AbortSignal cancels future-tense work; runId rejects late completions
 * (MediaRecorder.onstop, IndexedDB onsuccess, queued Promise continuations)
 * that AbortSignal can't reach.
 *
 * Bumps SYNCHRONOUSLY during render on the activation transition, NOT in an
 * effect. The effect-based version has the same race the abort-signal hook
 * fixes: a late callback from the previous run could fire after re-activation
 * but before the effect bumped the ref, so its captured runId would still
 * match runIdRef.current and the stale write would commit. (See
 * KILL-SWITCH-ARCHITECTURE.md §1.2.)
 */
import { useRef } from 'react';

export function useRunId(isActive: boolean): React.MutableRefObject<number> {
  const runIdRef = useRef(0);
  const prevActiveRef = useRef(isActive);

  if (isActive && !prevActiveRef.current) {
    runIdRef.current += 1;
  }
  prevActiveRef.current = isActive;

  return runIdRef;
}
