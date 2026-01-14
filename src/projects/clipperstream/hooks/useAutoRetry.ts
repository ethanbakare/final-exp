import { useEffect } from 'react';
import { useClipStore } from '../store/clipStore';

/**
 * Auto-Retry Background Service
 *
 * Runs at app root (never unmounts)
 * Listens to online/offline events
 * Triggers retry when: online AND pending clips exist
 *
 * Industry pattern: Background service independent of UI lifecycle
 */
export function useAutoRetry(processAllPendingClips: () => Promise<void>) {
  useEffect(() => {
    // ✅ FIXED: SSR-safe check
    let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    // ✅ FIXED: Race condition guard (prevent concurrent execution)
    let isHandlingOnlineEvent = false;

    const handleOnline = async () => {
      // ✅ Guard against concurrent calls (e.g., WiFi flickering on/off/on)
      if (isHandlingOnlineEvent) {
        console.log('[Auto-Retry] Already handling online event, skipping duplicate');
        return;
      }

      isHandlingOnlineEvent = true;
      isOnline = true;
      console.log('[Auto-Retry] Came online');

      try {
        // Check if there are pending clips
        const clips = useClipStore.getState().clips;
        const hasPendingClips = clips.some(c =>
          c.audioId && c.status === 'pending-child'
        );

        if (hasPendingClips) {
          console.log('[Auto-Retry] Pending clips detected, starting retry');
          await processAllPendingClips();
        }
      } finally {
        // ✅ Always release lock
        isHandlingOnlineEvent = false;
      }
    };

    const handleOffline = () => {
      isOnline = false;
      console.log('[Auto-Retry] Went offline, retries will pause');
      // No action needed - retries naturally fail when offline
    };

    // Listen to network events (instant detection, no polling)
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // On mount: If already online and have pending clips, start immediately
    if (isOnline) {
      const clips = useClipStore.getState().clips;
      const hasPendingClips = clips.some(c =>
        c.audioId && c.status === 'pending-child'
      );

      if (hasPendingClips) {
        console.log('[Auto-Retry] Already online with pending clips, starting retry');
        processAllPendingClips();
      }
    }

    return () => {
      // ✅ FIXED: Was addEventListener, now correctly removeEventListener
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processAllPendingClips]);
}

