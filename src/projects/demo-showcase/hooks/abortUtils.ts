/**
 * Shared helpers for adapter authors. Optional — adapters that don't need
 * them can use AbortSignal APIs directly.
 *
 * See KILL-SWITCH-ARCHITECTURE.md §1.6.
 */

/**
 * Run `fn` once when `signal` aborts. Returns a cleanup that removes the
 * listener. If `signal` is undefined, no-op. If already aborted, runs
 * synchronously and returns a no-op cleanup.
 */
export function onAbort(
  signal: AbortSignal | undefined,
  fn: () => void
): () => void {
  if (!signal) return () => {};
  if (signal.aborted) {
    fn();
    return () => {};
  }
  const handler = () => fn();
  signal.addEventListener('abort', handler, { once: true });
  return () => signal.removeEventListener('abort', handler);
}

/**
 * Compose multiple AbortSignals into one. The result aborts when ANY input
 * aborts. Useful when a project has its own internal AbortController (e.g.
 * a per-fetch retry/timeout controller) and also needs to honour an external
 * cancelSignal from the showcase.
 *
 * Equivalent in spirit to AbortSignal.any([...]) but written in userland for
 * cross-browser safety.
 */
export function composeAbortSignals(
  ...signals: (AbortSignal | undefined)[]
): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (!s) continue;
    if (s.aborted) {
      controller.abort();
      break;
    }
    s.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}
