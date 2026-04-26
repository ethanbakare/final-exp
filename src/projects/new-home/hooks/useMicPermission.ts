import { useState, useEffect } from 'react';

/**
 * useMicPermission Hook
 * Reusable hook for managing microphone permission state across any demo page.
 *
 * States:
 * - 'loading'    → initial check in progress (render nothing to avoid flash)
 * - 'granted'    → mic already enabled, no UI needed
 * - 'unknown'    → show the EnableModal toast
 * - 'dismissed'  → user clicked "Not now". Reserved for that one path —
 *                  any getUserMedia failure goes to 'blocked', not here.
 * - 'blocked'    → mic is denied at the browser level (clicked Block in
 *                  prompt, or "Never for This Website" in browser settings).
 *                  getUserMedia won't re-prompt; user must change browser
 *                  settings to recover.
 *
 * State machine:
 *   mount + permission='granted'  → 'granted'   (no UI)
 *   mount + permission='denied'   → 'blocked'   (X message)
 *   mount + permission='prompt'   → 'unknown'   (toast)
 *   click Enable → granted        → 'granted'
 *   click Enable → denied/error   → 'blocked'   (single error path)
 *   click Not now                 → 'dismissed' (orange button)
 *   click orange Enable Mic       → re-runs handleEnable (browser prompt)
 *   click X on blocked            → 'dismissed' (lets user retry via orange)
 */

type MicPermissionState = 'loading' | 'unknown' | 'granted' | 'dismissed' | 'blocked';

const SESSION_KEY = 'mic-permission-dismissed';

export function useMicPermission() {
  const [state, setState] = useState<MicPermissionState>('loading');

  // Check permission on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (dismissed) {
      setState('dismissed');
      return;
    }

    // Initial probe via permissions API. Three branches:
    //   granted → hide UI entirely
    //   denied  → show 'blocked' immediately (clicking Enable would
    //             auto-reject anyway; spare the user the wasted click)
    //   prompt  → show the toast so the user can choose
    // If the permissions API isn't available or throws, fall back to
    // showing the toast — getUserMedia is the next chance to discover
    // the real state.
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then((result) => {
        if (result.state === 'granted') {
          setState('granted');
        } else if (result.state === 'denied') {
          setState('blocked');
        } else {
          setState('unknown');
        }
      })
      .catch(() => {
        setState('unknown');
      });
  }, []);

  // Check if mic is permanently blocked
  const checkIfBlocked = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state === 'denied';
    } catch {
      return false;
    }
  };

  // Handle "Enable" from the toast — triggers browser permission prompt.
  // Once the user clicks Enable, they're committed to the prompt path:
  // any failure (cached denial, click-Block in prompt, no device, etc.)
  // resolves to 'blocked'. We do NOT fall back to 'dismissed' (orange)
  // because that state is reserved for the explicit "Not now" path.
  // permissions.query is also unreliable across browsers for detecting
  // post-prompt denial, so trusting the getUserMedia outcome is more
  // honest.
  const handleEnable = async () => {
    // Pre-flight: if already denied at the browser level, show the
    // blocked message without bothering with a getUserMedia call that
    // would auto-reject anyway.
    const blocked = await checkIfBlocked();
    if (blocked) {
      setState('blocked');
      return;
    }

    // Hide the toast/button immediately so it doesn't sit behind the
    // browser prompt.
    setState('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop — we just needed the permission grant.
      stream.getTracks().forEach((track) => track.stop());
      setState('granted');
    } catch {
      // Any failure → blocked. Single error path; predictable UX.
      setState('blocked');
    }
  };

  // Handle "Not now" from the toast
  const handleDismiss = () => {
    setState('dismissed');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, 'true');
    }
  };

  // Handle clicking the orange "Enable Mic" button. Re-runs the same
  // browser-prompt path as the original Enable click — no UI cycle in
  // between. This means the orange button is a one-step retry, not a
  // toggle back to the toast.
  const handleReshow = async () => {
    await handleEnable();
  };

  // Handle dismissing the blocked message
  const handleDismissBlocked = () => {
    setState('dismissed');
  };

  return {
    micState: state,
    handleEnable,
    handleDismiss,
    handleReshow,
    handleDismissBlocked,
  };
}
