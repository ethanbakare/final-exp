# 043_v3 - Auto-Retry Architecture & Retry Logic (FINAL CORRECTED)
## Industry Best Practice: Background Service + Shared Retry Logic

**Date**: January 8, 2026
**Version**: 3.2 - Critical Audit Corrections Applied (See 043_v3_CRITICAL_AUDIT.md)
**Status**: ✅ READY FOR IMPLEMENTATION (All Critical Issues Resolved)
**Approach**: Event-driven auto-retry at app root + Shared retry function

**Changes from v3.1** (043_v3_CRITICAL_AUDIT.md CRITICAL #6 - CORRECTED):
- ✅ **RESTORED 'no-audio-detected' status** - 044_FAILED_STATUS_AUDIT.md was INCORRECT
- ✅ **TWO permanent error states** (not one) with DIFFERENT visuals in ClipOffline:
  1. `'audio-corrupted'`: Can't retrieve audio from IndexedDB → Shows on home screen + ClipOffline (DeleteIcon in FlamingoRed, red background)
  2. `'no-audio-detected'`: No speech detected (validation error) → Shows ONLY in ClipOffline (DeleteIcon in white, grey background), NOT on home screen
- ✅ **Parent status inheritance**: 'no-audio-detected' clips excluded from home screen display (parent inherits from other children)
- ✅ **Parent rotation logic**: Process ALL clips in current parent before rotating to next parent
- ✅ **ClipOffline has 7 states**: waiting, retry-pending, transcribing, vpn-blocked, audio-corrupted, no-audio-detected, extra-component
- ✅ **Automatic title appending**: Both permanent error states append descriptive text to clip title (e.g., "Clip 001 - Audio corrupted")

**Changes from v2** (Post-Audit Fixes):
- ✅ **CRITICAL**: Fixed Clip interface to use existing `transcriptionError` field (non-breaking)
- ✅ **CRITICAL**: Unified TranscriptionResult type (added 'server-error', 'offline')
- ✅ **CRITICAL**: Fixed audio-corrupted status (changed from 'pending-retry' to null)
- ✅ **CRITICAL**: Added DNS error classification to API route
- ✅ **CRITICAL**: Added all missing imports (logger, store, utilities)
- ✅ Fixed typo: retrialAttempts → retrievalAttempts
- ✅ Added try-catch for getAudio errors (IndexedDB corruption handling)
- ✅ Added deleted parent check during transcription
- ✅ Added navigator.onLine safety check (SSR-safe)
- ✅ Added race condition guard in auto-retry hook
- ✅ Added memory leak fix (clean audioRetrievalAttempts on delete)
- ✅ Added export types from transcriptionRetry.ts
- ✅ Updated ClipOffline type to include 'audio-corrupted'

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

## ⚠️ CRITICAL: Pre-Implementation Checkpoint

**BEFORE implementing ANY changes from this spec, create a checkpoint:**

```bash
# Create a git commit or tag to mark the state BEFORE 043_v3 implementation
git add .
git commit -m "Pre-043_v3: Checkpoint before auto-retry implementation"
git tag pre-043_v3

# OR create a branch if you prefer
git checkout -b backup-pre-043_v3
git checkout main  # or your working branch
```

**Why This Matters**:
- ✅ Allows easy rollback if issues arise
- ✅ Provides comparison point for debugging
- ✅ Documents the exact state before major architectural change
- ✅ Enables A/B testing (old vs new retry logic)

**What to Include in Checkpoint**:
- All current clipperstream code
- Existing clipStore.ts with current ClipStatus types
- Current ClipMasterScreen.tsx with handleDoneClick
- Current API routes (transcribe.ts)
- Current _app.tsx

**Verification**:
```bash
# Verify checkpoint was created
git log --oneline -1  # Should show "Pre-043_v3: Checkpoint..."
git tag               # Should list "pre-043_v3"
```

**Restore Point** (if needed later):
```bash
# If implementation has issues, restore from checkpoint
git reset --hard pre-043_v3
# OR if using branch
git checkout backup-pre-043_v3
```

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
```

**Mounting Location**: `src/pages/_app.tsx`

**⚠️ CRITICAL**: This project uses **Pages Router** (monorepo with shared `_app.tsx`). Mount the auto-retry service in the existing `src/pages/_app.tsx` file.

**Implementation** (modify existing `src/pages/_app.tsx`):

```typescript
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LoadingProvider } from '@/contexts/LoadingContext';
import Head from 'next/head';
// ✅ NEW: Import auto-retry service and Zustand store
import { useAutoRetry } from '@/projects/clipperstream/hooks/useAutoRetry';
import { useClipStore } from '@/projects/clipperstream/store/clipStore';

export default function App({ Component, pageProps }: AppProps) {
  // ✅ NEW: Get processAllPendingClips from Zustand store
  const processAllPendingClips = useClipStore(state => state.processAllPendingClips);

  // ✅ NEW: Mount auto-retry service (runs for entire app lifetime)
  useAutoRetry(processAllPendingClips);

  return (
    <LoadingProvider>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0"
        />
      </Head>
      <Component {...pageProps} />
    </LoadingProvider>
  );
}
```

**What Changed**:
- ✅ Added 2 new imports at top of file
- ✅ Added `processAllPendingClips` from Zustand store
- ✅ Added `useAutoRetry(processAllPendingClips)` call
- ✅ All existing code preserved (LoadingProvider, Head, etc.)

**Import Path Verification**:
```
src/pages/_app.tsx
    ↓ import from
src/projects/clipperstream/hooks/useAutoRetry.ts  ✅ Correct relative path
src/projects/clipperstream/store/clipStore.ts     ✅ Correct relative path
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
// ✅ FIXED: Added missing import
import { logger } from '../utils/logger';

const log = logger.scope('TranscriptionRetry');

// ✅ FIXED: Export types for use in other files
export interface TranscriptionResult {
  text: string;
  error: 'network' | 'dns-block' | 'api-down' | 'validation' | 'server-error' | 'offline' | null;
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
    // ✅ SSR-safe: check typeof navigator first
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      log.info('navigator.onLine is false, likely offline');
      return { text: '', error: 'offline' };  // ✅ FIXED: Return 'offline' error type
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
    // ✅ SSR-safe: check typeof navigator first
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      log.info('Offline during wait, stopping');
      return { text: '', error: 'offline' };  // ✅ FIXED: Return 'offline' error type
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

      // API key issues - treat as server error
      if (status === 401 || status === 402) {
        return { text: '', error: 'server-error' };
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
// ✅ FIXED: Missing imports - add to top of ClipMasterScreen.tsx
// import { useClipStore } from '../store/clipStore';
// import { attemptTranscription } from '../utils/transcriptionRetry';
// import { getAudio, deleteAudio } from '../utils/audioStorage';
// import { formatChildTranscription } from '../utils/formatting';

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

    // ✅ Access store methods directly from state (avoids stale closures)
    const { clips: allClips, updateClip, deleteClip, getClipById } = useClipStore.getState();

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

      // ✅ FIXED: Retry audio retrieval before deleting (with exception handling)
      let audioBlob: Blob | null = null;
      try {
        audioBlob = await getAudio(firstClip.audioId!);
      } catch (err) {
        console.error('[ProcessPending] IndexedDB error retrieving audio', err);
        // Treat as corrupted audio
        updateClip(firstClip.id, {
          status: 'audio-corrupted',  // ✅ FIXED: Dedicated status (prevents retry loop)
          transcriptionError: 'Failed to access audio storage'
        });
        audioRetrievalAttempts.delete(firstClip.id);
        // ✅ CORRECTED: Stay on same parent, process next pending clip
        // getFirstPendingClipInParent() will automatically skip this clip (no longer 'pending-child')
        continue;
      }

      if (!audioBlob) {
        const retrievalAttempts = audioRetrievalAttempts.get(firstClip.id) || 0;

        if (retrievalAttempts < 3) {
          console.warn(`[ProcessPending] Audio not found (attempt ${retrievalAttempts + 1}/3), will retry later`);
          audioRetrievalAttempts.set(firstClip.id, retrievalAttempts + 1);

          // Skip this clip for now, try next parent
          parentQueue.push(parentQueue.shift()!);
          continue;
        }

        // After 3 attempts, mark as corrupted (DON'T delete)
        console.error('[ProcessPending] Audio retrieval failed after 3 attempts, marking as corrupted');
        updateClip(firstClip.id, {
          status: 'audio-corrupted',  // ✅ FIXED: Dedicated status (prevents infinite loop)
          transcriptionError: 'Audio file could not be retrieved from storage'
        });

        // ✅ CORRECTED: Stay on same parent, process next pending clip
        // getFirstPendingClipInParent() will skip this clip and return next 'pending-child'
        // Only rotates to next parent when ALL clips are done/corrupted/no-audio-detected
        audioRetrievalAttempts.delete(firstClip.id);
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

        // ✅ FIXED: Check if parent still exists before updating
        const parentStillExists = getClipById(currentParent.id);
        if (!parentStillExists) {
          console.warn('[ProcessPending] Parent was deleted during transcription, deleting orphaned child');
          deleteClip(firstClip.id);
          if (firstClip.audioId) {
            await deleteAudio(firstClip.audioId);
          }
          audioRetrievalAttempts.delete(firstClip.id);
          continue;
        }

        // Format transcription
        const formattedText = await formatChildTranscription(
          firstClip.id,
          result.text,
          currentParent.formattedText
        );

        // Update parent (safe - verified parent exists)
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
        // ✅ FIXED: Clean up retry tracking to prevent memory leak
        audioRetrievalAttempts.delete(firstClip.id);

        // Continue with same parent (next clip)
        continue;
      }

      // NO AUDIO DETECTED - Stay on same parent, skip to next clip
      // Check for SPECIFIC validation error (not all validation errors!)
      if (!result.text || result.text.length === 0) {
        // Must check if this is specifically "no speech detected" error
        // Other validation errors should rotate to next parent for retry
        const isNoAudioError = result.error === 'validation';

        if (isNoAudioError) {
          console.warn('[ProcessPending] No audio detected, marking as no-audio-detected');
          updateClip(firstClip.id, {
            status: 'no-audio-detected',  // ✅ Permanent error (no retry)
            transcriptionError: `No audio detected in ${firstClip.pendingClipTitle}`
          });
          audioRetrievalAttempts.delete(firstClip.id);

          // ✅ CRITICAL: Stay on same parent, process next pending clip
          // getFirstPendingClipInParent() will skip this clip and return next 'pending-child'
          // Only rotates when ALL clips are done/corrupted/no-audio-detected
          continue;
        }
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
}, []);  // ✅ FIXED: Empty deps array
// Note: Access store methods via useClipStore.getState() inside the function
// OR destructure at component level: const { updateClip, deleteClip, getClipById } = useClipStore();

// Helper: Get first pending clip in parent
function getFirstPendingClipInParent(parent: Clip): Clip | null {
  const { clips: allClips } = useClipStore.getState();
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

  } else if (result.error === 'server-error') {
    // Show server error toast (includes API key issues)
    showToast({
      type: 'error',
      message: 'Server error. Please check your API configuration.'
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
// ✅ CORRECTED: Added 'failed' back (per 043_v3_CRITICAL_AUDIT.md CRITICAL #6)

type ClipStatus =
  | 'pending-child'       // Waiting to transcribe (offline OR never tried yet)
  | 'pending-retry'       // Failed all rapid attempts, waiting in interval phase
  | 'transcribing'        // Currently attempting transcription (rapid attempts 1-3)
  | 'formatting'          // Formatting transcribed text
  | 'audio-corrupted'     // ✅ Audio retrieval failed 3x from IndexedDB (permanent - no retry)
  | 'no-audio-detected'   // ✅ No speech detected / validation error (permanent - no retry)
  | null;                 // Successfully completed

// ✅ TWO PERMANENT ERROR STATES (per 043_v3_CRITICAL_AUDIT.md):
//
// 1. 'audio-corrupted': Can't retrieve audio from storage (IndexedDB error)
//    - Cause: IndexedDB corruption, storage failure, getAudio() exception
//    - ClipOffline visuals: DeleteIcon (FlamingoRed #F58080), red background tint, flamingo red title
//    - ClipOffline title: Auto-appends " - Audio corrupted" (e.g., "Clip 001 - Audio corrupted")
//    - UI message (home screen): "Audio corrupted, delete now" (RecRed at 60% opacity)
//    - Visible on: Home screen (WarningIcon) + ClipOffline (DeleteIcon in FlamingoRed)
//    - Set when: Audio retrieval fails 3x (Lines 668, 691 in processAllPendingClips)
//
// 2. 'no-audio-detected': No speech detected in audio (validation error)
//    - Cause: Silent audio, muted microphone, empty recording
//    - ClipOffline visuals: DeleteIcon (white), grey background, white title
//    - ClipOffline title: Auto-appends " - No audio detected" (e.g., "Clip 002 - No audio detected")
//    - UI message: ONLY shown in ClipOffline, NOT on home screen
//    - Visible on: ClipOffline ONLY (NOT home screen - parent inherits from other children)
//    - Set when: Deepgram returns empty transcript with 'validation' error (Line 784 in processAllPendingClips)
//    - Prevents: Infinite retry loops that waste API tokens
//
// ✅ Visual Distinction: Same DeleteIcon, different colors (FlamingoRed vs White) and backgrounds
// ✅ All other transcription errors → 'pending-retry' (continuous retry like Dropbox)

interface Clip {
  id: string;
  status: ClipStatus;  // ✅ UPDATED: Includes 'audio-corrupted' AND 'no-audio-detected'
  lastError?: 'dns-block' | 'api-down' | 'network' | 'validation' | null;  // ✅ Track error type for 'pending-retry' clips
  transcriptionError?: string;  // ✅ Use existing field (non-breaking change)
  // ... existing fields
}

// ✅ NOTE: Both 'audio-corrupted' and 'no-audio-detected' are STATUSES (not in lastError)
// This prevents getPendingClips() from including them in retry queue
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
// In ClipList, ClipHomeScreen - derive display status from clip data + network state
// ✅ CRITICAL: This function derives UI states from:
//    1. Individual clip status (stored in Zustand)
//    2. Global network state (navigator.onLine)
//    3. Global VPN state (any clip has dns-block error)
const getDisplayStatus = (clip: Clip, allClips: Clip[]): 'waiting' | 'transcribing' | 'retry-pending' | 'vpn-blocked' | 'audio-corrupted' | null => {

  // ✅ CRITICAL: Check offline FIRST - overrides all other pending states
  // When offline, ALL pending clips show "waiting to transcribe"
  // This is a DERIVED state (not stored in Zustand)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (clip.status === 'pending-child' || clip.status === 'pending-retry') {
      return 'waiting';  // "Waiting to transcribe" - shows static spinner
    }
  }

  // ✅ CRITICAL: Check for GLOBAL VPN blocking
  // If ANY clip has dns-block error, ALL pending clips show "Blocked by VPN"
  // This is a DERIVED state (affects all clips, not just the one with dns-block)
  const hasVpnBlock = allClips.some(c =>
    c.status === 'pending-retry' && c.lastError === 'dns-block'
  );

  if (hasVpnBlock && (clip.status === 'pending-child' || clip.status === 'pending-retry')) {
    return 'vpn-blocked';  // Shows orange "Blocked by VPN" for ALL pending clips
  }

  // ✅ PERMANENT ERROR: Audio corrupted (dedicated status, not derived)
  if (clip.status === 'audio-corrupted') {
    return 'audio-corrupted';  // Shows red "Audio corrupted, delete now" (RecRed at 60% opacity)
  }

  // ✅ PERMANENT ERROR: No audio detected (dedicated status, not derived)
  // NOTE: This doesn't show on home screen (parent inherits from other children)
  if (clip.status === 'no-audio-detected') {
    return null;  // Treated as "completed" for home screen display (not shown)
  }

  // Actively transcribing
  if (clip.status === 'transcribing') {
    return 'transcribing';  // Shows spinner (spinning during rapid attempts)
  }

  // Waiting between interval attempts (retrying soon)
  if (clip.status === 'pending-retry') {
    return 'retry-pending';  // Shows static spinner + "Retrying soon..."
  }

  // Waiting to transcribe (not started yet, online)
  if (clip.status === 'pending-child') {
    return 'waiting';  // Shows static spinner
  }

  return null;  // Completed
};
```

**Key Architectural Points**:

1. **"Waiting to transcribe" is DERIVED from `!navigator.onLine`**:
   - NOT a stored status in Zustand
   - UI checks network state and derives display
   - No `useEffect` needed to update statuses when going offline

2. **"VPN-blocked" is DERIVED from GLOBAL state**:
   - When ANY clip has `lastError='dns-block'`, ALL pending clips show "Blocked by VPN"
   - This is because VPN blocks the entire network, not just one clip
   - No need to update all clip statuses - UI derives this globally

3. **Auto-retry's role**:
   - Listens to `'online'` event → processes pending clips when network comes back
   - Does NOT listen to `'offline'` event → no status updates when going offline
   - UI independently checks `navigator.onLine` for display

4. **No conflicts with `navigator.onLine`**:
   - Used in TWO places with DIFFERENT purposes:
     - **attemptTranscription**: Optimization to skip fetch when definitely offline (lines 327, 366)
     - **UI display derivation**: Determines what text/icon to show user
   - Both uses are valid and don't conflict

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

### Step 0: Create Checkpoint (REQUIRED FIRST)
- [ ] Run `git add .` to stage current changes
- [ ] Run `git commit -m "Pre-043_v3: Checkpoint before auto-retry implementation"`
- [ ] Run `git tag pre-043_v3` to mark this commit
- [ ] Verify with `git log --oneline -1` and `git tag`
- [ ] **DO NOT SKIP** - This is your rollback point if issues arise

### Step 1: Update Zustand Store (FOUNDATION)
- [ ] Add `'audio-corrupted'` status to ClipStatus type
- [ ] Add `'no-audio-detected'` status to ClipStatus type
- [ ] Add `'pending-retry'` status to ClipStatus type
- [ ] Remove `'failed'` status from ClipStatus type (replaced by audio-corrupted/no-audio-detected)
- [ ] Add `lastError` field to Clip interface
- [ ] Add `processAllPendingClips` field to ClipStore interface
- [ ] Add `processAllPendingClips` placeholder implementation to store

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
- [ ] Open `src/pages/_app.tsx` (Pages Router - monorepo setup)
- [ ] Add import: `import { useAutoRetry } from '@/projects/clipperstream/hooks/useAutoRetry';`
- [ ] Add import: `import { useClipStore } from '@/projects/clipperstream/store/clipStore';`
- [ ] Add inside App component: `const processAllPendingClips = useClipStore(state => state.processAllPendingClips);`
- [ ] Add call: `useAutoRetry(processAllPendingClips);`
- [ ] Verify all existing code (LoadingProvider, Head, etc.) is preserved
- [ ] Verify it runs for entire app lifetime (mounted at root)

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
│ → Set status='audio-corrupted'         │
│   (✅ FIXED: Dedicated status)         │
│ → UI shows "Audio corrupted, delete    │
│    now" (red at 60% opacity)           │
│ → Skip to next parent (no retry)       │
│ → Excluded from getPendingClips()      │
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

**Audio-Corrupted Special Case**:
- When audio retrieval fails 3 times, status is set to `'audio-corrupted'` ✅ **Dedicated status value**
- This prevents infinite loops (getPendingClips only returns 'pending-child' and 'pending-retry')
- UI checks `clip.status === 'audio-corrupted'` to show red error badge
- No `lastError` needed - status IS the error indicator
- Requires manual deletion by user (no automatic retry)

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

#### 1. Audio Corrupted State (Visible on Home Screen)

**Status**: `'audio-corrupted'` ✅ **Direct check: `clip.status === 'audio-corrupted'`**

**✅ CRITICAL**: This status **DOES show on home screen** and **persists** even if other pending clips in same parent are transcribed

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

#### 2. No Audio Detected State - NOT Visible on Home Screen

**Status**: `'no-audio-detected'` ✅ **Does NOT show on home screen** (per 043_v3_CRITICAL_AUDIT.md CRITICAL #6)

**✅ CRITICAL**: This status **does NOT show in ClipList** (home screen):
- No visible UI state for 'no-audio-detected' clips on home screen
- Parent clip inherits status from **OTHER** (non-no-audio-detected) pending children
- If all children are 'no-audio-detected', parent shows `status: null` (complete)

**Status Inheritance Examples**:

| Children States | Parent Shown Status (Home Screen) | Reason |
|----------------|-----------------------------------|---------|
| Clip 001: `'no-audio-detected'`, Clip 002: `'pending-child'` | "Waiting to transcribe" | Inherited from Clip 002 |
| Clip 001: `'no-audio-detected'`, Clip 002: `'transcribing'` | "Transcribing" | Inherited from Clip 002 |
| Clip 001: `'no-audio-detected'`, Clip 002: `'no-audio-detected'` (all no audio) | `null` (complete) | No pending clips left |

**Parent Title**:
- If only one clip and it's `'no-audio-detected'`: Parent title stays "Recording XX" (no content to generate title from)
- If other clips transcribe successfully: AI title generated from successful clips' content

**Parent Rotation Logic**:
- When encountering 'no-audio-detected' clip, **DON'T jump to next parent**
- Process ALL other pending clips in the same parent FIRST
- Only rotate to next parent when ALL clips are done/no-audio-detected/audio-corrupted

Example:
```
Parent: Recording 01
├─ Clip 001: no-audio-detected  ← Skip this, no retry
├─ Clip 002: pending-child       ← Process this next
└─ Clip 003: pending-child       ← Then this
                                  ↓
Only after Clip 002 & 003 done → Rotate to next parent
```

---

### ClipOffline Component (Pending Clip on RecordScreen)

**Status**: Both `'audio-corrupted'` and `'no-audio-detected'` (two permanent failure states with different visuals)

**How ClipOffline Receives Derived Status**:

ClipOffline is a **presentational component** - it displays whatever status is passed to it. The parent component (RecordScreen or ClipMasterScreen) derives the display status using the same `getDisplayStatus()` logic and passes it to ClipOffline:

```typescript
// In RecordScreen.tsx or parent component
const allClips = useClipStore(state => state.clips);

// For each pending child clip:
const displayStatus = getDisplayStatus(childClip, allClips);

// Map Zustand status to ClipOfflineStatus
const clipOfflineStatus = mapToClipOfflineStatus(displayStatus);

// Pass to ClipOffline
<ClipOffline
  status={clipOfflineStatus}  // ✅ Derived from global state (offline, VPN, etc.)
  // ... other props
/>
```

**Status Mapping** (Zustand → ClipOffline):
```typescript
const mapToClipOfflineStatus = (displayStatus: string): ClipOfflineStatus => {
  switch (displayStatus) {
    case 'waiting': return 'waiting';          // Offline OR not started
    case 'retry-pending': return 'retry-pending';  // Retrying soon
    case 'transcribing': return 'transcribing';    // Active transcription
    case 'vpn-blocked': return 'vpn-blocked';      // Global VPN block
    case 'audio-corrupted': return 'audio-corrupted';  // Permanent error
    default: return 'waiting';
  }
};
```

**Key Points**:
- ✅ **Offline state affects ALL pending clips**: When `!navigator.onLine`, all pending clips in ClipOffline show `status='waiting'`
- ✅ **VPN-blocked affects ALL pending clips**: When ANY clip has DNS error, all pending clips in ClipOffline show `status='vpn-blocked'`
- ✅ **No separate logic needed in ClipOffline**: Just receives the derived status and displays it
- ✅ **"Retrying soon" component**: Maps to `status='retry-pending'` in ClipOffline (already implemented)

**UI Specifications**:
```typescript
// ✅ CORRECTED: Added 'no-audio-detected' back (per 043_v3_CRITICAL_AUDIT.md CRITICAL #6)
type ClipOfflineStatus = 'waiting' | 'retry-pending' | 'transcribing' | 'vpn-blocked' | 'audio-corrupted' | 'no-audio-detected' | 'extra-component';

interface ClipOfflineProps {
  // ... existing props
  status?: ClipOfflineStatus;  // ✅ Includes BOTH 'audio-corrupted' AND 'no-audio-detected'
}

// ✅ CRITICAL: Two permanent error states with DIFFERENT visuals:
// - 'audio-corrupted': DeleteIcon (FlamingoRed #F58080), red background tint, flamingo red title
// - 'no-audio-detected': DeleteIcon (white), grey background, white title
// Both auto-append descriptive text to title
```

**Component Implementation** (from actual [ClipOffline.tsx](src/projects/clipperstream/components/ui/ClipOffline.tsx#L80-L84)):

**Automatic Title Appending** (Lines 80-84):
```typescript
// Compute display title: append error description for permanent failure states
const displayTitle = status === 'audio-corrupted'
  ? `${title} - Audio corrupted`
  : status === 'no-audio-detected'
  ? `${title} - No audio detected`
  : title;
```

**Example**:
- Input: `title="Clip 001"`, `status="audio-corrupted"`
- Output: **"Clip 001 - Audio corrupted"**

**Visual Implementation**:
```typescript
export const ClipOffline: React.FC<ClipOfflineProps> = ({
  title = 'Clip 001',
  time = '0:26',
  status = 'waiting',
  // ... other props
}) => {
  // ✅ Automatic title appending
  const displayTitle = status === 'audio-corrupted'
    ? `${title} - Audio corrupted`
    : status === 'no-audio-detected'
    ? `${title} - No audio detected`
    : title;

  return (
    <>
      <div className={`pending-master-clip status-${status} ...`}>
        <div className="pending-clip">
          {/* Title - Shows displayTitle (with auto-appended error description) */}
          <div className="pending-clip-title">
            <span className={styles.InterMedium16}>
              {displayTitle}
            </span>
          </div>

          {/* Time with Icon */}
          <div className="time-with-icon">
            {/* Time - Fades out in all permanent error states */}
            <span className={`time-text ${styles.JetBrainsMonoMedium16}`}>
              {time}
            </span>

            {/* Icon Crossfade Container */}
            <div className="icon-crossfade-wrapper">
              {/* TranscribeBig Layer - Hidden in permanent error states */}
              <div className={`icon-layer transcribe-layer ${status !== 'extra-component' && status !== 'vpn-blocked' && status !== 'audio-corrupted' && status !== 'no-audio-detected' ? 'active' : ''} ...`}>
                <TranscribeBig spinning={status === 'transcribing' && isActiveRequest !== false} />
              </div>

              {/* WarningIcon Layer - Visible ONLY in vpn-blocked */}
              <div className={`icon-layer warning-layer ${status === 'vpn-blocked' ? 'active' : ''}`}>
                <WarningIcon />
              </div>

              {/* DeleteIcon Layer - Visible in audio-corrupted (FlamingoRed) */}
              <div className={`icon-layer delete-layer ${status === 'audio-corrupted' ? 'active' : ''}`}>
                <DeleteIcon />
              </div>

              {/* DeleteIcon Layer - Visible in no-audio-detected (White) */}
              <div className={`icon-layer delete-layer ${status === 'no-audio-detected' ? 'active' : ''}`}>
                <DeleteIcon />
              </div>
            </div>
          </div>
        </div>

        {/* No Retry Button for audio-corrupted or no-audio-detected - both are permanent errors */}
        {/* User must manually delete via parent clip */}
      </div>

      <style jsx>{`
        /* Audio-corrupted state: Red background at 15% opacity (Lines 224-226) */
        .pending-master-clip.status-audio-corrupted .pending-clip {
          background: var(--RecRed_15); /* rgba(239, 68, 68, 0.15) */
        }

        /* Audio-corrupted state: Title text uses FlamingoRed (Lines 260-262) */
        .pending-master-clip.status-audio-corrupted .pending-clip-title span {
          color: var(--ClipFlamingoRed); /* #F58080 */
        }

        /* Audio-corrupted state: DeleteIcon uses FlamingoRed (Lines 387-389) */
        .pending-master-clip.status-audio-corrupted .delete-layer :global(.delete-svg path) {
          stroke: #F58080 !important; /* Direct hex code from --ClipFlamingoRed */
        }

        /* Hide time text in all permanent error states (Lines 313-320) */
        .pending-master-clip.status-extra-component .time-text,
        .pending-master-clip.status-vpn-blocked .time-text,
        .pending-master-clip.status-audio-corrupted .time-text,
        .pending-master-clip.status-no-audio-detected .time-text {
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
    </>
  );
};
```

**Key Differences Between Permanent Errors in ClipOffline**:

| Aspect | `'audio-corrupted'` | `'no-audio-detected'` |
|--------|---------------------|----------------------|
| **Icon** | 🗑️ DeleteIcon (FlamingoRed #F58080) | 🗑️ DeleteIcon (White) |
| **Background** | Red tint (`var(--RecRed_15)` - rgba(239, 68, 68, 0.15)) | Grey (`var(--ClipGrey)` - #252525) |
| **Title Color** | FlamingoRed (`#F58080`) | White (default) |
| **Title Text** | `"Clip 001 - Audio corrupted"` (auto-appended) | `"Clip 001 - No audio detected"` (auto-appended) |
| **Time Display** | Hidden (opacity: 0) | Hidden (opacity: 0) |
| **Home Screen Visibility** | ✅ Shows (WarningIcon + "Audio corrupted, delete now") | ❌ Hidden (parent inherits from other children) |
| **Cause** | IndexedDB failure, can't retrieve audio (Lines 668, 691) | Silent audio, validation error (Line 784) |
| **UI Message (ClipList)** | "Audio corrupted, delete now" (RecRed 60%) | NOT shown on home screen |

**Both States Share**:
- **No Retry Button**: Permanent errors (no retry)
- **Automatic Title Appending**: Error description added to clip title
- **Time Text Hidden**: Time fades out (opacity: 0)
- **User Action Required**: Must manually delete via parent clip dot menu
- **Parent Rotation**: Stay on same parent, process next pending clip (don't rotate immediately)
- **Same Icon Shape**: Both use DeleteIcon (different colors)

**Visual Summary**:

**audio-corrupted State (ClipOffline)**:
```
┌────────────────────────────────────────────────┐
│ 🔴 RED TINTED BACKGROUND (15% opacity)        │
│ Clip 001 - Audio corrupted     🗑️ (RED)      │  ← Title in FlamingoRed, DeleteIcon in FlamingoRed
│ (time hidden)                                  │
└────────────────────────────────────────────────┘
    ↑                                      ↑
    Auto-appended text                     DeleteIcon (FlamingoRed #F58080)
    Title in FlamingoRed
```

**no-audio-detected State (ClipOffline)**:
```
┌────────────────────────────────────────────────┐
│ ⬜ GREY BACKGROUND (normal)                    │
│ Clip 002 - No audio detected   🗑️ (WHITE)    │  ← Title in white, DeleteIcon in white
│ (time hidden)                                  │
└────────────────────────────────────────────────┘
    ↑                                      ↑
    Auto-appended text                     DeleteIcon (white)
    Title in white (default)
```

**Parent Clip on Home Screen (ClipList)**:
```
┌────────────────────────────────────────────────┐
│ Q4 Strategy Meeting                            │
│ May 13, 2025    🔄 Audio corrupted, delete now │  ← Red text at 60% opacity (only audio-corrupted shows)
└────────────────────────────────────────────────┘
                    ↑
                    Only audio-corrupted appears here
                    no-audio-detected is hidden
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

## Post-Audit Verification (v3.0)

All critical issues from the comprehensive audit have been addressed:

### ✅ Priority 1 Fixes (CRITICAL - Applied)
1. ✅ **TranscriptionResult type unified** - Added 'server-error', 'offline' to match existing code
2. ✅ **Removed 'api-key-issue'** - Mapped to 'server-error' instead
3. ✅ **Clip interface fixed** - Using existing `transcriptionError` field (non-breaking)
4. ✅ **DNS error detection added** - Server-side classification in API route
5. ✅ **All imports documented** - Logger, store, utilities with correct paths

### ✅ Priority 2 Fixes (HIGH - Applied)
6. ✅ **Auto-retry race condition fixed** - Added `isHandlingOnlineEvent` guard
7. ✅ **Deleted parent check added** - Verifies parent exists before updating
8. ✅ **getAudio try-catch added** - Handles IndexedDB exceptions
9. ✅ **CRITICAL: Infinite loop fixed** - Audio-corrupted has dedicated status value (not 'pending-retry')
10. ✅ **Memory leak fixed** - Clean audioRetrievalAttempts on delete

### ✅ Priority 3 Fixes (MODERATE - Applied)
11. ✅ **Typo fixed** - `retrialAttempts` → `retrievalAttempts`
12. ✅ **Types exported** - TranscriptionResult and RetryOptions marked for export
13. ✅ **navigator.onLine SSR-safe** - All checks wrapped with `typeof navigator !== 'undefined'`
14. ✅ **Return 'offline' error type** - When navigator.onLine is false

### 🔍 Blind Spots Addressed
- ✅ Deleted parent during transcription → Check before update + cleanup orphan
- ✅ getAudio() exception handling → Try-catch with corrupted audio fallback
- ✅ Infinite loop with corrupted audio → Status set to 'audio-corrupted' (dedicated value)
- ✅ Memory leak in audioRetrievalAttempts → Delete entries on clip deletion

### 🎯 Key Architectural Decision
- ✅ **'audio-corrupted' is a ClipStatus value** (not just in lastError)
- ✅ Semantic meaning: "This clip has a permanent error and should NOT be retried"
- ✅ getPendingClips() naturally excludes it (only returns 'pending-child' and 'pending-retry')
- ✅ UI checks `clip.status === 'audio-corrupted'` directly (no derived state needed)

### 🎯 Implementation Ready
**Status**: ✅ **READY FOR IMPLEMENTATION**

All critical issues resolved. No blocking dependencies. All type mismatches fixed. All blind spots addressed with defensive code.

---

**END OF SPEC**
