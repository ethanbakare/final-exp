/**
 * Showcase-side cancellation primitive.
 *
 * Returns an AbortSignal bound to the given `isActive` state.
 *
 * - While isActive is true, the signal is "open" (not aborted).
 * - When isActive flips to false, the signal aborts during the commit phase.
 * - When isActive flips from false back to true, a FRESH AbortController is
 *   created SYNCHRONOUSLY during render so consumers never observe an
 *   already-aborted signal on the activation render. (See KILL-SWITCH-
 *   ARCHITECTURE.md §1.1 — the previous draft did the swap in an effect,
 *   which left a render window where consumers fired their abort handlers
 *   immediately on re-entry.)
 */
import { useEffect, useRef } from 'react';

export function useActiveAbortSignal(isActive: boolean): AbortSignal {
  const controllerRef = useRef<AbortController>(new AbortController());

  if (isActive && controllerRef.current.signal.aborted) {
    controllerRef.current = new AbortController();
  }

  useEffect(() => {
    if (!isActive && !controllerRef.current.signal.aborted) {
      controllerRef.current.abort();
    }
  }, [isActive]);

  return controllerRef.current.signal;
}
