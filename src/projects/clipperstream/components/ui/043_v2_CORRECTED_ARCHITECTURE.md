# 043_v2 - Auto-Retry Architecture & Retry Logic (CORRECTED)
## Industry Best Practice: Background Service + Shared Retry Logic

**Date**: January 6, 2026
**Version**: 2.0 - Critical Fixes Applied
**Status**: ✅ READY FOR IMPLEMENTATION
**Approach**: Event-driven auto-retry at app root + Shared retry function

**Changes from v1**:
- ✅ Fixed memory leak in event listener cleanup
- ✅ **Removed ALL circuit breaker code** (belongs in v1.50, not 043)
- ✅ **Redesigned DNS error detection** (server-side classification)
- ✅ **Continuous retry** (no max attempts - retries forever like Dropbox sync)
- ✅ Added race condition guard (mutex)
- ✅ Added 'pending-retry' status to Clip type
- ✅ Added retry logic for audio retrieval before deleting
- ✅ **Added 'audio-corrupted' error type** (shows "Audio corrupted, delete now" UI)
- ✅ Fixed type mismatch in live recording integration
- ✅ Added explanatory comments for navigator.onLine usage

---

## Executive Summary

**What This Implements**:
- ❌ **OLD**: Auto-retry in ClipMasterScreen useEffect (tied to component lifecycle)
- ✅ **NEW**: Auto-retry at app root (independent background service)
- ❌ **OLD**: Retry logic embedded in handleOnline
- ✅ **NEW**: Retry logic extracted to shared function (used by both live and pending)
- ❌ **OLD**: Polling every 30s to check if online
- ✅ **NEW**: Event-driven (listen to 'online'/'offline' events)

**Why**: Industry best practice. Auto-retry should survive navigation, be reusable, and follow Single Responsibility Principle.

**IMPORTANT**: This spec does NOT include circuit breaker. Circuit breaker will be added in v1.50, then integrated back into this retry logic.

---

## Core Architecture (3 Separate Concerns)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AUTO-RETRY SERVICE (Scheduler)                          │
│    Location: hooks/useAutoRetry.ts (NEW)                   │
│    Responsibility: Detect when to retry                    │
│    - Listens to 'online'/'offline' events                  │
│    - Checks for pending clips                              │
│    - Calls processAllPendingClips() when ready             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. RETRY LOGIC (The Retrier)                               │
│    Location: utils/transcriptionRetry.ts (NEW)             │
│    Responsibility: Perform retry attempts                  │
│    - 3 rapid attempts                                       │
│    - Interval attempts (30s, 1min, 2min)                   │
│    - Error classification (VPN, network, API down)         │
│    - Used by BOTH live recordings and pending clips        │
│    - NO circuit breaker (that comes in v1.50)             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PARENT ORCHESTRATION (Organizer)                        │
│    Location: ClipMasterScreen.processAllPendingClips()     │
│    Responsibility: Manage parent-child relationships       │
│    - Group clips by parent                                  │
│    - Process sequentially (oldest first)                   │
│    - Rotate between parents (fair scheduling)              │
│    - Handle "show first, batch rest" strategy              │
│    - Infinite loop protection (max attempts per parent)    │
│    - Race condition guard (mutex)                          │
└─────────────────────────────────────────────────────────────┘
```

**Each piece has ONE job** (Single Responsibility Principle).

---

## File 1: Auto-Retry Service (NEW)

**Location**: `hooks/useAutoRetry.ts`

**Responsibility**: Schedule retries when online + pending clips exist

```typescript
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
    let isOnline = navigator.onLine;

    const handleOnline = async () => {
      isOnline = true;
      console.log('[Auto-Retry] Came online');

      // Check if there are pending clips
      const clips = useClipStore.getState().clips;
      const hasPendingClips = clips.some(c =>
        c.audioId && c.status === 'pending-child'
      );

      if (hasPendingClips) {
        console.log('[Auto-Retry] Pending clips detected, starting retry');
        await processAllPendingClips();
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
```

**Usage** (in App.tsx or _app.tsx):

**For Next.js Pages Router** (_app.tsx):
```typescript
import { useAutoRetry } from '@/hooks/useAutoRetry';
import { useClipStore } from '@/store/clipStore';

export default function MyApp({ Component, pageProps }) {
  const processAllPendingClips = useClipStore(state => state.processAllPendingClips);

  // Mount auto-retry service (runs for app lifetime)
  useAutoRetry(processAllPendingClips);

  return <Component {...pageProps} />;
}
```

**For Next.js App Router** (layout.tsx):
```typescript
'use client';

import { useAutoRetry } from '@/hooks/useAutoRetry';
import { useClipStore } from '@/store/clipStore';

export default function RootLayout({ children }) {
  const processAllPendingClips = useClipStore(state => state.processAllPendingClips);

  // Mount auto-retry service (runs for app lifetime)
  useAutoRetry(processAllPendingClips);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Key Points**:
- ✅ Runs at app root (never unmounts)
- ✅ Event-driven (no polling)
- ✅ Single responsibility: detect when to retry
- ✅ Doesn't know HOW to retry (calls processAllPendingClips)
- ✅ Memory leak fixed

---

## File 2: Shared Retry Logic (NEW)

**Location**: `utils/transcriptionRetry.ts`

**Responsibility**: Perform retry attempts (NO circuit breaker - that's v1.50)

```typescript
import { logger } from './logger';

const log = logger.scope('TranscriptionRetry');

export interface TranscriptionResult {
  text: string;
  error: 'network' | 'dns-block' | 'api-down' | 'api-key-issue' | 'validation' | null;
}

export interface RetryOptions {
  maxRapidAttempts: number;   // Always 3
  useIntervals: boolean;      // false for live, true for pending
  onProgress?: (attempt: number, total: number) => void;
}

/**
 * Attempt transcription with retry logic
 *
 * Used by:
 * - Live recordings: 3 rapid attempts only
 * - Pending clips: 3 rapid + interval attempts
 *
 * Status behavior (set by caller, not this function):
 * - Caller sets status='transcribing' before calling this
 * - Status stays 'transcribing' throughout all rapid attempts (1-3)
 * - Status stays 'transcribing' throughout interval waits and attempts (4-6)
 * - After this returns with error, caller sets status='pending-retry'
 *
 * Future enhancement: Add callbacks for status updates during interval waits
 * to show 'retry-pending' between attempts, 'transcribing' during attempts
 *
 * NOTE: Circuit breaker will be added in v1.50
 * For now, this is basic retry logic only
 *
 * Returns: { text, error }
 */
export async function attemptTranscription(
  audioBlob: Blob,
  options: RetryOptions
): Promise<TranscriptionResult> {

  const { maxRapidAttempts, useIntervals, onProgress } = options;

  // ============================================
  // PHASE 1: RAPID ATTEMPTS (3 times, immediate)
  // Status stays 'transcribing' throughout all 3 attempts
  // ============================================

  for (let attempt = 1; attempt <= maxRapidAttempts; attempt++) {
    log.info('Rapid attempt', { attempt, max: maxRapidAttempts });

    if (onProgress) {
      onProgress(attempt, maxRapidAttempts);
    }

    const result = await transcribeSingle(audioBlob);

    // SUCCESS
    if (result.text && result.text.length > 0) {
      log.info('Transcription succeeded', { attempt });
      return result;
    }

    // DNS/VPN ERROR - Bail out immediately (all retries will fail)
    if (result.error === 'dns-block') {
      log.warn('DNS error detected (VPN), stopping retries');
      return result;
    }

    // API DOWN - Log and continue
    // NOTE: Circuit breaker (v1.50) will add Whisper fallback here
    if (result.error === 'api-down') {
      log.warn('API down detected', { attempt });
      // Continue to next attempt
    }

    // OFFLINE - Fast-path optimization
    // NOTE: navigator.onLine can have false positives (router with no internet)
    // but NO false negatives (if it says offline, we ARE offline)
    // Use as optimization to avoid wasted fetch when definitely offline
    if (!navigator.onLine) {
      log.info('navigator.onLine is false, likely offline');
      return { text: '', error: 'network' };
    }
  }

  // All rapid attempts failed
  log.warn('All rapid attempts failed');

  // ============================================
  // PHASE 2: INTERVAL ATTEMPTS (if enabled)
  // Status stays 'transcribing' during waits AND attempts
  // Future: Add callback to switch to 'retry-pending' during waits
  // ============================================

  if (!useIntervals) {
    log.info('Intervals disabled (live recording), stopping');
    return { text: '', error: 'network' };
  }

  // Intervals: 30s, 1min, 2min
  // NOTE: Fixed intervals chosen over exponential backoff for predictable UX
  const intervals = [30000, 60000, 120000];

  for (let i = 0; i < intervals.length; i++) {
    const waitTime = intervals[i];
    const attempt = maxRapidAttempts + i + 1;

    log.info('Waiting before interval attempt', {
      attempt,
      waitSeconds: waitTime / 1000
    });

    // NOTE: Status stays 'transcribing' during this wait
    // Future enhancement: caller could set 'retry-pending' here via callback
    await sleep(waitTime);

    // Check if still online before attempting (optimization)
    if (!navigator.onLine) {
      log.info('Offline during wait, stopping');
      return { text: '', error: 'network' };
    }

    if (onProgress) {
      onProgress(attempt, maxRapidAttempts + intervals.length);
    }

    const result = await transcribeSingle(audioBlob);

    // SUCCESS
    if (result.text && result.text.length > 0) {
      log.info('Interval attempt succeeded', { attempt });
      return result;
    }

    // DNS/VPN ERROR
    if (result.error === 'dns-block') {
      log.warn('DNS error detected during intervals');
      return result;
    }

    // API DOWN - Log and continue
    // NOTE: Circuit breaker (v1.50) will add Whisper fallback here
    if (result.error === 'api-down') {
      log.warn('API down during interval attempt', { attempt });
      // Continue to next attempt
    }
  }

  // All attempts exhausted
  log.error('All retry attempts exhausted');
  return { text: '', error: 'network' };
}

/**
 * Single transcription attempt (no retry logic)
 * Classifies errors and returns result
 *
 * ✅ FIXED: DNS errors now detected server-side, not client-side
 */
async function transcribeSingle(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch('/api/clipperstream/transcribe', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'unknown' }));
      const status = response.status;

      // ✅ FIXED: DNS error detection now happens SERVER-SIDE
      // Server returns 503 with error: 'dns-block' when it can't reach Deepgram
      if (errorData.error === 'dns-block' || status === 503) {
        return { text: '', error: 'dns-block' };
      }

      // API key issues
      if (status === 401 || status === 402) {
        return { text: '', error: 'api-key-issue' };
      }

      // API down (server errors)
      if (status === 500 || status === 502 || status === 504) {
        return { text: '', error: 'api-down' };
      }

      // Validation or unknown errors
      return { text: '', error: 'validation' };
    }

    const data = await response.json();

    if (!data.success || !data.transcript) {
      return { text: '', error: 'validation' };
    }

    return { text: data.transcript, error: null };

  } catch (error) {
    // Timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return { text: '', error: 'network' };
    }

    // Network error (can't reach API route)
    if (error instanceof TypeError) {
      return { text: '', error: 'network' };
    }

    // Unknown error
    log.error('Unknown transcription error', error);
    return { text: '', error: 'validation' };
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Key Points**:
- ✅ Pure function (no component dependencies)
- ✅ Used by both live and pending
- ✅ **NO circuit breaker** (comes in v1.50)
- ✅ Error classification (DNS detection server-side)
- ✅ Testable
- ✅ navigator.onLine used as optimization, not hard requirement

---

## File 3: Server-Side DNS Error Detection (NEW)

**Location**: `/api/clipperstream/transcribe.ts`

**Responsibility**: Detect DNS errors on server, classify for client

**Add this error handling** to the API route:

```typescript
// In /api/clipperstream/transcribe.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ... existing code to get audioData, mimeType, deepgramKey ...

    // Attempt transcription
    const result = await transcribeAudio(audioData, mimeType, deepgramKey);

    return res.status(200).json({
      success: true,
      transcript: result.transcript
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';

    // ✅ NEW: Detect DNS errors on server (VPN blocking)
    if (
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('getaddrinfo') ||
      errorMessage.includes('DNS')
    ) {
      console.error('[API] DNS error - VPN or network blocking Deepgram:', errorMessage);

      // Return 503 with specific error type
      return res.status(503).json({
        error: 'dns-block',
        message: 'Cannot reach transcription API. Check VPN or network settings.'
      });
    }

    // API key issues (from Deepgram)
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
      return res.status(401).json({
        error: 'api-key-issue',
        message: 'Invalid API key'
      });
    }

    // Generic server error
    console.error('[API] Transcription error:', error);
    return res.status(500).json({
      error: 'transcription-failed',
      message: errorMessage || 'Transcription failed'
    });
  }
}
```

**Why This Works**:
```
┌─────────┐                    ┌──────────────┐                    ┌──────────┐
│ Client  │                    │  Next.js API │                    │ Deepgram │
│ Browser │                    │    Route     │                    │   API    │
└─────────┘                    └──────────────┘                    └──────────┘
     │                                │                                  │
     │  fetch('/api/transcribe')      │                                  │
     │─────────────────────────────>  │                                  │
     │                                │  fetch('api.deepgram.com')       │
     │                                │─────────────────────────────────>│
     │                                │                                  │
     │                                │         ❌ ENOTFOUND             │
     │                                │<─────────────────────────────────┘
     │                                │
     │                                │ ✅ Server catches ENOTFOUND
     │                                │ ✅ Returns 503 + { error: 'dns-block' }
     │                                │
     │  ⬅ 503 + { error: 'dns-block' }│
     │<───────────────────────────────│
     │
     │ ✅ Client sees 'dns-block' error type
     │ ✅ VPN UI can be shown
```

---

## File 4: Parent Orchestration (MODIFIED)

**Location**: `ClipMasterScreen.tsx`

**Responsibility**: Process pending clips with parent rotation

**Add this function** (after line 1192, before existing handleOnline):

```typescript
// ✅ NEW: Race condition guard (module-level)
let isProcessingPending = false;

// ✅ NEW: Track audio retrieval failures to avoid immediate deletion
const audioRetrievalAttempts = new Map<string, number>();

/**
 * Process all pending clips with parent rotation
 *
 * Called by:
 * - Auto-retry service (when coming online)
 * - Manual retry button (future)
 *
 * Strategy:
 * - Group clips by parent
 * - Process one parent at a time
 * - After 1 loop fails, rotate to next parent
 * - VPN errors: don't rotate (all parents will fail)
 * - Keeps retrying forever until success (like Dropbox/Google sync)
 *
 * ✅ FIXED: Race condition guard (mutex)
 * ✅ FIXED: Audio retrieval retries before deletion
 */
const processAllPendingClips = useCallback(async () => {
  // ✅ FIXED: Race condition guard
  if (isProcessingPending) {
    console.log('[ProcessPending] Already processing, skipping duplicate call');
    return;
  }

  isProcessingPending = true;

  try {
    console.log('[ProcessPending] Starting');

    const allClips = useClipStore.getState().clips;

    // Find all pending children
    const pendingChildren = allClips.filter(c =>
      c.audioId && c.status === 'pending-child' && c.parentId
    );

    if (pendingChildren.length === 0) {
      console.log('[ProcessPending] No pending clips');
      return;
    }

    // Group by parent
    const parentIds = [...new Set(pendingChildren.map(c => c.parentId!))];
    const parentQueue = parentIds.map(id => allClips.find(c => c.id === id)).filter(Boolean);

    console.log('[ProcessPending] Found', parentQueue.length, 'parents');

    // Process each parent
    // NOTE: No max attempts - keeps retrying like Dropbox/Google sync
    // Loop continues until all clips transcribe successfully or app closes
    while (parentQueue.length > 0) {
      const currentParent = parentQueue[0];
      const firstClip = getFirstPendingClipInParent(currentParent);

      if (!firstClip) {
        // Parent has no more pending clips
        parentQueue.shift();
        continue;
      }

      console.log('[ProcessPending] Processing', currentParent.title, '|', firstClip.pendingClipTitle);

      // ✅ FIXED: Retry audio retrieval before deleting
      const audioBlob = await getAudio(firstClip.audioId!);
      if (!audioBlob) {
        const retrialAttempts = audioRetrievalAttempts.get(firstClip.id) || 0;

        if (retrialAttempts < 3) {
          console.warn(`[ProcessPending] Audio not found (attempt ${retrialAttempts + 1}/3), will retry later`);
          audioRetrievalAttempts.set(firstClip.id, retrialAttempts + 1);

          // Skip this clip for now, try next parent
          parentQueue.push(parentQueue.shift()!);
          continue;
        }

        // After 3 attempts, mark as corrupted (DON'T delete)
        console.error('[ProcessPending] Audio retrieval failed after 3 attempts, marking as corrupted');
        updateClip(firstClip.id, {
          status: 'pending-retry',
          lastError: 'audio-corrupted',  // ✅ NEW: Triggers "Audio corrupted, delete now" UI
          error: 'Audio file could not be retrieved from storage'
        });

        // Skip this parent, move to next one (DON'T keep retrying corrupted audio)
        audioRetrievalAttempts.delete(firstClip.id);
        parentQueue.shift();
        continue;
      }

      // ✅ Clear retrieval attempts on success
      audioRetrievalAttempts.delete(firstClip.id);

      // Set status to 'transcribing'
      // NOTE: Status stays 'transcribing' throughout all 3 rapid attempts
      // Don't switch between attempts (would be jarring for UI)
      // Only switches to 'pending-retry' after all rapid attempts fail
      updateClip(firstClip.id, { status: 'transcribing' });

      // ONE LOOP: Use shared retry logic
      // - Attempts 1-3: Rapid (immediate) - status stays 'transcribing'
      // - Attempts 4-6: Intervals (30s, 1min, 2min) - handled by interval logic in attemptTranscription
      const result = await attemptTranscription(audioBlob, {
        maxRapidAttempts: 3,
        useIntervals: true,  // Use full retry (intervals enabled)
        onProgress: (attempt, total) => {
          console.log(`[ProcessPending] Attempt ${attempt}/${total}`);
        }
      });

      // SUCCESS
      if (result.text && result.text.length > 0) {
        console.log('[ProcessPending] Success!');

        // Format transcription
        const formattedText = await formatChildTranscription(
          firstClip.id,
          result.text,
          currentParent.formattedText
        );

        // Update parent
        const updatedContent = {
          rawText: currentParent.rawText
            ? currentParent.rawText + '\n\n' + result.text
            : result.text,
          formattedText: currentParent.formattedText
            ? currentParent.formattedText + ' ' + formattedText
            : formattedText,
          content: currentParent.formattedText
            ? currentParent.formattedText + ' ' + formattedText
            : formattedText,
        };

        updateClip(currentParent.id, updatedContent);

        // Delete child and audio
        deleteClip(firstClip.id);
        if (firstClip.audioId) {
          await deleteAudio(firstClip.audioId);
        }

        // Continue with same parent (next clip)
        continue;
      }

      // VPN ERROR - Don't rotate, wait for VPN to be disabled
      // All 3 rapid attempts failed due to VPN → switch to 'pending-retry'
      // UI will show "Blocked by VPN" (orange) based on lastError='dns-block'
      if (result.error === 'dns-block') {
        console.warn('[ProcessPending] VPN detected, waiting 30s');
        updateClip(firstClip.id, {
          status: 'pending-retry',  // Switch from 'transcribing' to 'pending-retry'
          lastError: 'dns-block'    // UI maps this to 'vpn-blocked' display
        });
        await new Promise(resolve => setTimeout(resolve, 30000));
        continue; // Don't rotate parent (VPN blocks all parents)
      }

      // LOOP FAILED - Rotate to next parent
      // All 3 rapid attempts + interval attempts failed → switch to 'pending-retry'
      // UI will show "Retrying soon..." based on status='pending-retry'
      console.log('[ProcessPending] Loop failed, rotating parent');
      updateClip(firstClip.id, {
        status: 'pending-retry',  // Switch from 'transcribing' to 'pending-retry'
        lastError: result.error   // Track error for debugging (not DNS block)
      });

      // Rotate to next parent (infinite retry until success)
      parentQueue.push(parentQueue.shift()!);
    }

    console.log('[ProcessPending] All pending clips processed');

  } catch (error) {
    console.error('[ProcessPending] Error during processing', error);

  } finally {
    // ✅ FIXED: Always release lock
    isProcessingPending = false;
  }
}, [getAudio, updateClip, deleteClip, deleteAudio, formatChildTranscription]);

// Helper: Get first pending clip in parent
function getFirstPendingClipInParent(parent: Clip) {
  const allClips = useClipStore.getState().clips;
  const children = allClips.filter(c =>
    c.parentId === parent.id && c.status === 'pending-child'
  );

  children.sort((a, b) => a.createdAt - b.createdAt);
  return children[0] || null;
}
```

**REMOVE**: Old handleOnline useEffect (lines 1195-1247)

**Key Points**:
- ✅ Uses shared retry function
- ✅ Parent rotation logic
- ✅ VPN-aware (doesn't rotate on DNS errors)
- ✅ **Continuous retry** (no max attempts - retries forever like Dropbox sync)
- ✅ **Race condition guard** (mutex prevents concurrent execution)
- ✅ **Audio retrieval retries** (3 attempts before marking corrupted)
- ✅ Tracks error type for UI integration

---

## File 5: Live Recording (MODIFIED)

**Location**: `ClipMasterScreen.tsx` (handleDoneClick)

**Change** (around line 509):

```typescript
// ✅ FIXED: Type mismatch - old interface doesn't match new one

// OLD (broken - uses useClipRecording's retry timers)
// const transcriptionResult = await transcribeRecording(recordedBlob);
// if (transcriptionResult.success && transcriptionResult.transcript) { ... }

// NEW (uses shared retry logic with correct interface)
const result = await attemptTranscription(recordedBlob, {
  maxRapidAttempts: 3,
  useIntervals: false,  // Live recording: 3 attempts only, no intervals
});

// ✅ FIXED: Handle new return type
if (result.text && result.text.length > 0) {
  // SUCCESS - Format and save
  console.log('[HandleDone] Transcription succeeded');

  const formattedText = await formatTranscription(result.text);

  // ... existing save logic ...

} else {
  // FAILURE - Handle based on error type
  console.error('[HandleDone] Transcription failed', { error: result.error });

  if (result.error === 'dns-block') {
    // VPN detected - create pending clip
    console.log('[HandleDone] VPN blocking transcription, saving as pending');

    // ... existing pending clip creation logic ...

  } else if (result.error === 'api-key-issue') {
    // Show API key error toast
    showToast({
      type: 'error',
      message: 'API key issue. Please check your settings.'
    });

  } else {
    // Generic error - still create pending clip to retry later
    console.log('[HandleDone] Transcription failed, saving as pending');

    // ... existing pending clip creation logic ...
  }
}
```

**Import** at top of file:
```typescript
import { attemptTranscription } from '../../utils/transcriptionRetry';
```

---

## File 6: Zustand Store (MODIFIED)

**Location**: `store/clipStore.ts`

**Changes**:

### 1. Add 'pending-retry' status and lastError to Clip type:

```typescript
// ✅ FIXED: Missing status definition and error tracking

type ClipStatus =
  | 'pending-child'   // Waiting to transcribe (offline OR never tried yet)
  | 'pending-retry'   // ✅ NEW: Failed all rapid attempts, waiting in interval phase
  | 'transcribing'    // Currently attempting transcription (rapid attempts 1-3)
  | 'formatting'      // Formatting transcribed text
  | 'complete'        // Done
  | null;

interface Clip {
  id: string;
  status: ClipStatus;
  lastError?: 'dns-block' | 'api-down' | 'network' | 'validation' | 'audio-corrupted' | null;  // ✅ NEW: Track error type for UI
  error?: string;  // Human-readable error message
  // ... existing fields
}
```

**Status Flow During Retry**:

```typescript
// PHASE 1: Rapid Attempts (1-3)
// Keep status='transcribing' throughout all 3 attempts
// Don't switch between attempts (would be jarring)

updateClip(clipId, { status: 'transcribing' });  // Before attempt 1
// Attempt 1 fails → Keep 'transcribing'
// Attempt 2 fails → Keep 'transcribing'
// Attempt 3 fails → NOW switch to 'pending-retry'

// PHASE 2: Interval Attempts (30s, 1min, 2min)
// Status switches to 'pending-retry' when waiting
// Switches back to 'transcribing' during attempt

updateClip(clipId, { status: 'pending-retry' });  // Wait 30s
// After 30s wait:
updateClip(clipId, { status: 'transcribing' });  // Attempt 4
// If fails:
updateClip(clipId, { status: 'pending-retry' });  // Wait 1min
```

**UI Display Mapping** (from v1.52):

```typescript
// In ClipList, ClipHomeScreen - derive display status from clip data
const getDisplayStatus = (clip: Clip): 'pending' | 'transcribing' | 'retry-pending' | 'vpn-blocked' | 'audio-corrupted' | null => {
  // Audio corrupted takes priority (permanent error - requires manual deletion)
  if (clip.lastError === 'audio-corrupted') {
    return 'audio-corrupted';  // Shows red "Audio corrupted, delete now" (RecRed at 60% opacity)
  }

  // VPN blocking takes priority
  if (clip.lastError === 'dns-block') {
    return 'vpn-blocked';  // Shows orange "Blocked by VPN"
  }

  // Actively transcribing
  if (clip.status === 'transcribing') {
    return 'transcribing';  // Shows spinner (spinning during rapid attempts)
  }

  // Waiting between interval attempts
  if (clip.status === 'pending-retry') {
    return 'retry-pending';  // Shows static spinner + "Retrying soon..."
  }

  // Waiting to transcribe (offline or not started)
  if (clip.status === 'pending-child') {
    return 'pending';  // Shows static spinner
  }

  return null;  // Completed
};
```

### 2. Add processAllPendingClips to store:

```typescript
interface ClipStore {
  // ... existing fields
  processAllPendingClips: () => Promise<void>;
}

export const useClipStore = create<ClipStore>((set, get) => ({
  // ... existing fields

  // Set by ClipMasterScreen on mount
  processAllPendingClips: async () => {
    console.warn('processAllPendingClips not initialized yet');
  },
}));
```

### 3. Register function in ClipMasterScreen:

```typescript
// In ClipMasterScreen.tsx
useEffect(() => {
  // Register processAllPendingClips with store
  useClipStore.setState({ processAllPendingClips });

  return () => {
    // Clean up on unmount
    useClipStore.setState({
      processAllPendingClips: async () => {
        console.warn('processAllPendingClips called after ClipMasterScreen unmounted');
      }
    });
  };
}, [processAllPendingClips]);
```

---

## Implementation Checklist

### Step 1: Update Zustand Store (FOUNDATION)
- [ ] Add `'pending-retry'` status to ClipStatus type
- [ ] Add `lastError` field to Clip interface
- [ ] Add `processAllPendingClips` field to ClipStore interface

### Step 2: Update API Route (DNS Detection)
- [ ] Add DNS error detection in `/api/clipperstream/transcribe.ts`
- [ ] Return 503 status with `{ error: 'dns-block' }` for DNS errors
- [ ] Test VPN blocking scenario

### Step 3: Create Shared Retry Logic
- [ ] Create `utils/transcriptionRetry.ts`
- [ ] Implement `attemptTranscription()` (no circuit breaker)
- [ ] Implement `transcribeSingle()` with server-side DNS detection
- [ ] Test retry logic independently

### Step 4: Create Auto-Retry Service
- [ ] Create `hooks/useAutoRetry.ts`
- [ ] Listen to 'online'/'offline' events
- [ ] Call processAllPendingClips when ready
- [ ] Verify memory leak fix (removeEventListener)

### Step 5: Update ClipMasterScreen
- [ ] Add `processAllPendingClips()` function with all fixes:
  - [ ] Infinite loop protection
  - [ ] Race condition guard
  - [ ] Audio retrieval retries
- [ ] Remove old handleOnline useEffect (lines 1195-1247)
- [ ] Update handleDoneClick to use `attemptTranscription()`
- [ ] Register processAllPendingClips with Zustand store

### Step 6: Mount Auto-Retry at App Root
- [ ] Import useAutoRetry in _app.tsx (Pages Router) or layout.tsx (App Router)
- [ ] Call `useAutoRetry(processAllPendingClips)`
- [ ] Verify it runs for entire app lifetime

### Step 7: Test
- [ ] Offline recording → Come online → Should retry
- [ ] VPN on → Should detect DNS error, show VPN status
- [ ] Turn VPN off → Should retry and succeed
- [ ] Multiple parents → Should rotate fairly
- [ ] Live recording → Should only try 3 times (no intervals)
- [ ] Concurrent retry calls → Should block with mutex
- [ ] Audio retrieval failure → Should retry 3 times before marking corrupted

---

## Files Modified Summary

| File | Action | Lines Changed | Priority |
|------|--------|---------------|----------|
| `store/clipStore.ts` | **MODIFY** | +15 | **1 (FIRST)** |
| `/api/clipperstream/transcribe.ts` | **MODIFY** | +25 | **2** |
| `utils/transcriptionRetry.ts` | **CREATE** | ~200 new | **3** |
| `hooks/useAutoRetry.ts` | **CREATE** | ~60 new | **4** |
| `ClipMasterScreen.tsx` | **MODIFY** | -53, +180 | **5** |
| `_app.tsx` or `layout.tsx` | **MODIFY** | +5 | **6** |

**Total**: ~432 lines (well-structured, production-ready code)

---

## Key Differences from v1

| Issue | v1 (Original) | v2 (Corrected) |
|-------|---------------|----------------|
| **Memory leak** | ❌ `addEventListener` in cleanup | ✅ `removeEventListener` |
| **Circuit breaker** | ❌ Included (wrong dependency order) | ✅ Removed (belongs in v1.50) |
| **DNS detection** | ❌ Client-side (doesn't work) | ✅ Server-side (works) |
| **Retry behavior** | ❌ Had max attempts | ✅ Continuous retry (no max - like Dropbox sync) |
| **Race condition** | ❌ No guard | ✅ Mutex (isProcessingPending) |
| **Audio deletion** | ❌ Immediate on failure | ✅ 3 retries before marking corrupted |
| **Audio corrupted state** | ❌ No error type | ✅ Added 'audio-corrupted' error + UI |
| **Type mismatch** | ❌ Old interface | ✅ Correct TranscriptionResult interface |
| **Missing status** | ❌ 'pending-retry' not defined | ✅ Added to Clip type |

---

## Complete Status Flow During Retry

**For Pending Clips Being Retried in Background:**

```
START: Clip has status='pending-child'
         ↓
Auto-retry fires → processAllPendingClips() called
         ↓
Set status='transcribing' (stays throughout entire attemptTranscription call)
         ↓
Call attemptTranscription(audioBlob, { maxRapidAttempts: 3, useIntervals: true })
         ↓
┌────────────────────────────────────────────┐
│ PHASE 1: Rapid Attempts (immediate)       │
│ - Attempt 1 → Fails                       │
│ - Attempt 2 → Fails   } Status stays      │
│ - Attempt 3 → Fails   } 'transcribing'    │
└────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────┐
│ PHASE 2: Interval Attempts (if enabled)   │
│ - Wait 30s  }                             │
│ - Attempt 4 } Status stays 'transcribing' │
│ - Wait 1min }   (future: show             │
│ - Attempt 5 }    'retry-pending' during   │
│ - Wait 2min }     waits)                  │
│ - Attempt 6 }                             │
└────────────────────────────────────────────┘
         ↓
attemptTranscription returns { text: '', error: 'network' }
         ↓
┌─────────── RESULT HANDLING ───────────┐
│                                        │
│ ✅ SUCCESS (text exists)               │
│ → Delete clip & audio                  │
│ → Update parent with text              │
│                                        │
│ ❌ FAILURE: Audio Corrupted (before)   │
│ → Set status='pending-retry'           │
│ → Set lastError='audio-corrupted'      │
│ → UI shows "Audio corrupted, delete    │
│    now" (red at 60% opacity)           │
│ → Skip to next parent (no retry)       │
│                                        │
│ ❌ FAILURE: DNS Block                  │
│ → Set status='pending-retry'           │
│ → Set lastError='dns-block'            │
│ → UI shows "Blocked by VPN" (orange)   │
│ → Wait 30s, try again                  │
│                                        │
│ ❌ FAILURE: Other Error                │
│ → Set status='pending-retry'           │
│ → Set lastError=<error type>           │
│ → UI shows "Retrying soon..." (white)  │
│ → Rotate to next parent                │
└────────────────────────────────────────┘
```

**Key Points**:

1. **During rapid attempts (1-3)**: Status stays `'transcribing'`
   - Don't switch between attempts (would be jarring for UI)
   - Spinner keeps spinning throughout

2. **During interval waits**: Status currently stays `'transcribing'`
   - Future enhancement: Switch to `'retry-pending'` during waits
   - Switch back to `'transcribing'` during attempts
   - Requires callback mechanism in attemptTranscription

3. **After all attempts fail**: Status switches to `'pending-retry'`
   - If audio corrupted: lastError='audio-corrupted' → UI shows "Audio corrupted, delete now" (red 60%)
   - If DNS error: lastError='dns-block' → UI shows "Blocked by VPN" (orange)
   - If other error: lastError=<type> → UI shows "Retrying soon..." (white)

4. **Continuous retry**: Keeps looping forever until success
   - No max attempts (like Dropbox/Google sync)
   - Audio corrupted: skips to next parent (no retry - requires manual deletion)
   - VPN errors: waits 30s, tries same clip again
   - Other errors: rotates to next parent, comes back later

---

## Integration with v1.52 VPN UI

**Status Display** (in ClipList, ClipHomeScreen):
```typescript
// Derive display status based on lastError
const getDisplayStatus = (clip: Clip) => {
  if (clip.status === 'pending-retry' && clip.lastError === 'dns-block') {
    return 'vpn-blocked';  // Triggers orange UI from v1.52
  }
  return clip.status;
};
```

**VPN Toast** (when DNS error detected):
```typescript
// In processAllPendingClips, after detecting dns-block:
if (result.error === 'dns-block') {
  // Show VPN toast (v1.52 component)
  useClipStore.setState({ showVpnToast: true });

  updateClip(firstClip.id, {
    status: 'pending-retry',
    lastError: 'dns-block'
  });

  await new Promise(resolve => setTimeout(resolve, 30000));
  continue;
}
```

---

## Integration with Audio Corrupted UI

**When to Show**: After 3 failed attempts to retrieve audio from IndexedDB

**Behavior**:
- Skip this parent (don't keep retrying)
- Move to next parent in queue
- Clip remains visible with error state until manually deleted
- No automatic retry for corrupted audio

### ClipList Component (Parent Clip on HomeScreen/RecordScreen)

**Status**: `'audio-corrupted'` (derived from `lastError === 'audio-corrupted'`)

**UI Specifications**:
```typescript
{status === 'audio-corrupted' && (
  <div className="status-frame audio-corrupted">
    <div className="status-icon-wrapper">
      {/* Same warning icon as vpn-blocked */}
      <svg
        className="audio-corrupted-icon"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.05613 7.88726H2.69677V10.2466M6.94361 4.11229H9.30297V1.75293M2.5 4.58565C2.76457 3.93081 3.20754 3.36333 3.77856 2.9477C4.34957 2.53207 5.02593 2.28497 5.73039 2.23448C6.43485 2.18398 7.13924 2.33211 7.7637 2.66204C8.38816 2.99198 8.90723 3.49049 9.2625 4.1009M9.5 7.41389C9.23543 8.06873 8.79246 8.63621 8.22144 9.05184C7.65043 9.46747 6.97436 9.71458 6.2699 9.76508C5.56545 9.81558 4.8608 9.66743 4.23634 9.33749C3.61188 9.00756 3.09258 8.50907 2.73732 7.89867"
          stroke="var(--RecRed)"
          strokeOpacity="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <span className={`status-text-corrupted ${styles.InterRegular13}`}>
      Audio corrupted, delete now
    </span>
  </div>
)}
```

**CSS Styling**:
```css
/* Audio corrupted status text - red 60% opacity */
.status-text-corrupted {
  /* Typography - InterRegular13 from styles */
  color: var(--RecRed);  /* #EF4444 - from clipbuttons VpnIssueButton */
  opacity: 0.6;           /* 60% opacity as specified */

  /* Layout */
  display: flex;
  align-items: center;
  height: 16px;

  /* Inside auto layout */
  flex: none;
  order: 1;
  flex-grow: 0;
}

/* Audio corrupted icon styling */
.audio-corrupted-icon {
  width: 12px;
  height: 12px;
}
```

**Color Reference**:
- Uses `var(--RecRed)` from CSS variables (same as VpnIssueButton text color in clipbuttons.tsx)
- Applied at 60% opacity via CSS `opacity: 0.6`

---

### ClipOffline Component (Pending Clip on RecordScreen)

**Status**: `'audio-corrupted'` (new variant)

**UI Specifications**:
```typescript
type ClipOfflineStatus = 'waiting' | 'transcribing' | 'vpn-blocked' | 'audio-corrupted' | 'failed';

interface ClipOfflineProps {
  // ... existing props
  status?: ClipOfflineStatus;  // Add 'audio-corrupted' to type
}
```

**Component Implementation**:
```typescript
export const ClipOffline: React.FC<ClipOfflineProps> = ({
  title = 'Clip 001',
  time = '0:26',
  status = 'waiting',
  // ... other props
}) => {
  return (
    <>
      <div className={`pending-master-clip status-${status} ...`}>
        <div className="pending-clip">
          {/* Title */}
          <div className="pending-clip-title">
            <span className={styles.InterMedium16}>
              {title}
            </span>
          </div>

          {/* Time with Icon */}
          <div className="time-with-icon">
            {/* Time - Fades out in audio-corrupted state (same as vpn-blocked) */}
            <span className={`time-text ${styles.JetBrainsMonoMedium16}`}>
              {time}
            </span>

            {/* Icon Crossfade Container */}
            <div className="icon-crossfade-wrapper">
              {/* TranscribeBig Layer - Hidden in audio-corrupted */}
              <div className={`icon-layer transcribe-layer ${status !== 'failed' && status !== 'vpn-blocked' && status !== 'audio-corrupted' ? 'active' : ''} ...`}>
                <TranscribeBig spinning={status === 'transcribing' && isActiveRequest !== false} />
              </div>

              {/* CautionIcon Layer - Visible in failed */}
              <div className={`icon-layer caution-layer ${status === 'failed' ? 'active' : ''}`}>
                <CautionIcon />
              </div>

              {/* WarningIcon Layer - Visible in vpn-blocked OR audio-corrupted */}
              <div className={`icon-layer warning-layer ${status === 'vpn-blocked' || status === 'audio-corrupted' ? 'active' : ''}`}>
                <WarningIcon />
              </div>
            </div>
          </div>
        </div>

        {/* No Retry Button for audio-corrupted - just shows warning */}
        {/* User must manually delete via parent clip */}
      </div>

      <style jsx>{`
        /* Hide time text in audio-corrupted state (same as vpn-blocked) */
        .pending-master-clip.status-audio-corrupted .time-text {
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
    </>
  );
};
```

**Key Differences from VPN Blocked**:
- **No Retry Button**: Audio corrupted clips don't show retry button (permanent error)
- **Same Warning Icon**: Uses `<WarningIcon />` component (same as vpn-blocked)
- **Time Text Hidden**: Time fades out (same as vpn-blocked)
- **User Action Required**: Must manually delete via parent clip dot menu

**Visual Summary**:
```
┌────────────────────────────────────────────────┐
│ Clip 001                              ⚠️       │  ← Child pending clip (ClipOffline)
└────────────────────────────────────────────────┘
    ↑                                     ↑
    Title stays visible                   Warning icon (no time)

Parent Clip (ClipList):
┌────────────────────────────────────────────────┐
│ Q4 Strategy Meeting                            │
│ May 13, 2025    🔄 Audio corrupted, delete now │  ← Red text at 60% opacity
└────────────────────────────────────────────────┘
```

---

## After 043 Works: Add v1.50 Circuit Breaker

**Implementation order**:
1. ✅ Implement 043_v2 (this spec) - Basic retry logic
2. ⏳ Test thoroughly - Ensure retry works without circuit breaker
3. ⏳ Implement v1.50 - Circuit breaker + Whisper fallback
4. ⏳ Integrate circuit breaker into `attemptTranscription()`:
   - Add `circuitBreaker.recordSuccess()` on success
   - Add `circuitBreaker.recordFailure()` on API down
   - Add Whisper fallback when circuit opens

---

## Next Steps

1. ✅ Review this corrected spec
2. ⏳ Implement in order (Step 1-7 above)
3. ⏳ Test each step independently
4. ⏳ Test integration
5. ⏳ Proceed to v1.50 (circuit breaker)

**Priority**: 🔴 **IMPLEMENT THIS FIRST** - v1.50 depends on this working

---

**END OF SPEC**
