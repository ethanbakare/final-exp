import { useState, useEffect } from 'react';

/**
 * useMicPermission Hook
 * Reusable hook for managing microphone permission state across any demo page.
 *
 * States:
 * - 'loading'    → initial check in progress (render nothing to avoid flash)
 * - 'granted'    → mic already enabled, no UI needed
 * - 'unknown'    → show the EnableModal toast
 * - 'dismissed'  → user clicked "Not now", show EnableMicButton fallback
 * - 'blocked'    → user permanently denied mic (e.g. "Never for This Website"),
 *                  show message to update browser settings
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

    // Check if already granted — only skip toast if mic is already enabled
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then((result) => {
        if (result.state === 'granted') {
          setState('granted');
        } else {
          // 'prompt' or 'denied' — show toast first
          setState('unknown');
        }
      })
      .catch(() => {
        // permissions API not supported, show toast
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

  // Handle "Enable" from the toast — triggers browser permission prompt
  const handleEnable = async () => {
    // First check if permanently blocked
    const blocked = await checkIfBlocked();
    if (blocked) {
      setState('blocked');
      return;
    }

    // Hide the toast immediately so it doesn't sit behind the browser prompt
    setState('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop — we just needed the permission grant
      stream.getTracks().forEach((track) => track.stop());
      setState('granted');
    } catch {
      // User denied in browser prompt — check if now permanently blocked
      const nowBlocked = await checkIfBlocked();
      if (nowBlocked) {
        setState('blocked');
      } else {
        setState('dismissed');
      }
    }
  };

  // Handle "Not now" from the toast
  const handleDismiss = () => {
    setState('dismissed');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, 'true');
    }
  };

  // Handle clicking the EnableMicButton — re-shows the toast
  const handleReshow = async () => {
    // Check if blocked before re-showing toast
    const blocked = await checkIfBlocked();
    if (blocked) {
      setState('blocked');
    } else {
      setState('unknown');
    }
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
