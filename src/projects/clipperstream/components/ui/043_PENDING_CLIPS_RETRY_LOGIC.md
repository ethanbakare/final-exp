# 043 - Auto-Retry Architecture & Retry Logic (REVISED)
## Industry Best Practice: Background Service + Shared Retry Logic

**Date**: January 6, 2026
**Status**: ✅ FINAL SPEC - Ready for Implementation
**Approach**: Event-driven auto-retry at app root + Shared retry function (Option B)

---

## Executive Summary

**What Changed From Original 043**:
- ❌ **OLD**: Auto-retry in ClipMasterScreen useEffect (tied to component lifecycle)
- ✅ **NEW**: Auto-retry at app root (independent background service)
- ❌ **OLD**: Retry logic embedded in handleOnline
- ✅ **NEW**: Retry logic extracted to shared function (used by both live and pending)
- ❌ **OLD**: Polling every 30s to check if online
- ✅ **NEW**: Event-driven (listen to 'online'/'offline' events)

**Why**: Industry best practice. Auto-retry should survive navigation, be reusable, and follow Single Responsibility Principle.

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
│    - Circuit breaker integration                           │
│    - Error classification (VPN, network, API down)         │
│    - Used by BOTH live recordings and pending clips        │
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
      window.addEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processAllPendingClips]);
}
```

**Usage** (in App.tsx or _app.tsx):
```typescript
import { useAutoRetry } from './hooks/useAutoRetry';
import { useClipStore } from './store/clipStore';

export default function App() {
  // Get processAllPendingClips from wherever it lives
  // (We'll define where below)
  const processAllPendingClips = useClipStore(state => state.processAllPendingClips);

  // Mount auto-retry service (runs for app lifetime)
  useAutoRetry(processAllPendingClips);

  return <YourApp />;
}
```

**Key Points**:
- ✅ Runs at app root (never unmounts)
- ✅ Event-driven (no polling)
- ✅ Single responsibility: detect when to retry
- ✅ Doesn't know HOW to retry (calls processAllPendingClips)

---

## File 2: Shared Retry Logic (NEW)

**Location**: `utils/transcriptionRetry.ts`

**Responsibility**: Perform retry attempts with circuit breaker integration

```typescript
import { circuitBreaker } from './circuitBreaker';
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
 * Integrates with circuit breaker:
 * - Detects API down (500/502/503/504)
 * - Switches to Whisper fallback
 * - Detects VPN/DNS issues
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
      circuitBreaker.recordSuccess();
      return result;
    }

    // DNS/VPN ERROR - Bail out immediately
    if (result.error === 'dns-block') {
      log.warn('DNS error detected (VPN), stopping retries');
      return result;
    }

    // API DOWN - Record failure, maybe switch to Whisper
    if (result.error === 'api-down') {
      circuitBreaker.recordFailure(new Error('API down'));

      // If circuit breaker says use Whisper, try it for remaining attempts
      if (circuitBreaker.shouldUseWhisper() && attempt < maxRapidAttempts) {
        log.info('Circuit breaker opened, trying Whisper');
        const whisperResult = await transcribeWithWhisper(audioBlob);

        if (whisperResult.text && whisperResult.text.length > 0) {
          log.info('Whisper succeeded', { attempt });
          return whisperResult;
        }
      }
    }

    // OFFLINE - Stop immediately
    if (!navigator.onLine) {
      log.info('Offline detected, stopping retries');
      return { text: '', error: 'network' };
    }
  }

  // All rapid attempts failed
  log.warn('All rapid attempts failed');

  // ============================================
  // PHASE 2: INTERVAL ATTEMPTS (if enabled)
  // ============================================

  if (!useIntervals) {
    log.info('Intervals disabled (live recording), stopping');
    return { text: '', error: 'network' };
  }

  // Intervals: 30s, 1min, 2min
  const intervals = [30000, 60000, 120000];

  for (let i = 0; i < intervals.length; i++) {
    const waitTime = intervals[i];
    const attempt = maxRapidAttempts + i + 1;

    log.info('Waiting before interval attempt', {
      attempt,
      waitSeconds: waitTime / 1000
    });

    await sleep(waitTime);

    // Check if still online before attempting
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
      circuitBreaker.recordSuccess();
      return result;
    }

    // DNS/VPN ERROR
    if (result.error === 'dns-block') {
      log.warn('DNS error detected during intervals');
      return result;
    }

    // API DOWN - Try Whisper
    if (result.error === 'api-down' && circuitBreaker.shouldUseWhisper()) {
      const whisperResult = await transcribeWithWhisper(audioBlob);
      if (whisperResult.text) return whisperResult;
    }
  }

  // All attempts exhausted
  log.error('All retry attempts exhausted');
  return { text: '', error: 'network' };
}

/**
 * Single transcription attempt (no retry logic)
 * Classifies errors and returns result
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
      const errorData = await response.json().catch(() => ({ error: 'Unknown' }));
      const status = response.status;

      // Classify error
      if (status === 401 || status === 402) {
        return { text: '', error: 'api-key-issue' };
      }

      if (status === 500 || status === 502 || status === 503 || status === 504) {
        return { text: '', error: 'api-down' };
      }

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

    // Network error
    if (error instanceof TypeError) {
      return { text: '', error: 'network' };
    }

    // DNS error (VPN)
    const errorMessage = error instanceof Error ? error.message : '';
    if (
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('DNS') ||
      errorMessage.includes('getaddrinfo')
    ) {
      return { text: '', error: 'dns-block' };
    }

    // Unknown error
    log.error('Unknown transcription error', error);
    return { text: '', error: 'validation' };
  }
}

/**
 * Transcribe with Whisper (fallback)
 */
async function transcribeWithWhisper(audioBlob: Blob): Promise<TranscriptionResult> {
  // TODO: Implement when circuit breaker is added
  // For now, just fail
  return { text: '', error: 'api-down' };
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
- ✅ Circuit breaker integration
- ✅ Error classification
- ✅ Testable

---

## File 3: Parent Orchestration (MODIFIED)

**Location**: `ClipMasterScreen.tsx`

**Responsibility**: Process pending clips with parent rotation

**Add this function** (after line 1192, before existing handleOnline):

```typescript
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
 */
const processAllPendingClips = useCallback(async () => {
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
  while (parentQueue.length > 0) {
    const currentParent = parentQueue[0];
    const firstClip = getFirstPendingClipInParent(currentParent);

    if (!firstClip) {
      // Parent has no more pending clips
      parentQueue.shift();
      continue;
    }

    console.log('[ProcessPending] Processing', currentParent.title, '|', firstClip.pendingClipTitle);

    // Get audio from IndexedDB
    const audioBlob = await getAudio(firstClip.audioId!);
    if (!audioBlob) {
      console.error('[ProcessPending] Audio not found, skipping');
      deleteClip(firstClip.id);
      continue;
    }

    // Update status
    updateClip(firstClip.id, { status: 'transcribing' });

    // ONE LOOP: Use shared retry logic
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
    if (result.error === 'dns-block') {
      console.warn('[ProcessPending] VPN detected, waiting 30s');
      updateClip(firstClip.id, { status: 'pending-child' });
      await new Promise(resolve => setTimeout(resolve, 30000));
      continue;
    }

    // LOOP FAILED - Rotate to next parent
    console.log('[ProcessPending] Loop failed, rotating parent');
    updateClip(firstClip.id, { status: 'pending-retry' });
    parentQueue.push(parentQueue.shift()!);
  }

  console.log('[ProcessPending] All pending clips processed');
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
- ✅ Can be called from auto-retry service OR manually

---

## File 4: Live Recording (MODIFIED)

**Location**: `ClipMasterScreen.tsx` (handleDoneClick)

**Change** (around line 509):

```typescript
// OLD (broken - uses useClipRecording's retry timers)
const transcriptionResult = await transcribeRecording(recordedBlob);

// NEW (uses shared retry logic)
const transcriptionResult = await attemptTranscription(recordedBlob, {
  maxRapidAttempts: 3,
  useIntervals: false,  // Live recording: 3 attempts only
});
```

**Import** at top of file:
```typescript
import { attemptTranscription } from '../../utils/transcriptionRetry';
```

---

## File 5: Zustand Store (MODIFIED)

**Location**: `store/clipStore.ts`

**Add** processAllPendingClips to store (so auto-retry can call it):

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

**In ClipMasterScreen** (on mount):
```typescript
useEffect(() => {
  // Register processAllPendingClips with store
  useClipStore.setState({ processAllPendingClips });

  return () => {
    // Clean up on unmount
    useClipStore.setState({
      processAllPendingClips: async () => {}
    });
  };
}, [processAllPendingClips]);
```

---

## Implementation Checklist

### Step 1: Create Shared Retry Logic
- [ ] Create `utils/transcriptionRetry.ts`
- [ ] Implement `attemptTranscription()`
- [ ] Implement `transcribeSingle()`
- [ ] Add error classification

### Step 2: Create Auto-Retry Service
- [ ] Create `hooks/useAutoRetry.ts`
- [ ] Listen to 'online'/'offline' events
- [ ] Call processAllPendingClips when ready

### Step 3: Update ClipMasterScreen
- [ ] Add `processAllPendingClips()` function
- [ ] Remove old handleOnline useEffect (lines 1195-1247)
- [ ] Update handleDoneClick to use `attemptTranscription()`
- [ ] Register processAllPendingClips with Zustand store

### Step 4: Update Zustand Store
- [ ] Add `processAllPendingClips` field to ClipStore interface
- [ ] Add `pending-retry` status to Clip interface

### Step 5: Mount Auto-Retry at App Root
- [ ] Import useAutoRetry in App.tsx or _app.tsx
- [ ] Call `useAutoRetry(processAllPendingClips)`

### Step 6: Test
- [ ] Offline recording → Come online → Should retry
- [ ] VPN on → Should detect, wait for VPN off
- [ ] Multiple parents → Should rotate
- [ ] Live recording → Should only try 3 times

---

## Files Modified Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `utils/transcriptionRetry.ts` | **CREATE** | ~250 new |
| `hooks/useAutoRetry.ts` | **CREATE** | ~50 new |
| `ClipMasterScreen.tsx` | **MODIFY** | -53, +150 |
| `store/clipStore.ts` | **MODIFY** | +10 |
| `App.tsx` or `_app.tsx` | **MODIFY** | +3 |

**Total**: ~410 lines (but most is well-structured, reusable code)

---

## Why This is Better Than Original 043

| Aspect | Original 043 | Revised 043 |
|--------|--------------|-------------|
| **Auto-retry location** | ClipMasterScreen (component) | App root (background service) |
| **Survives navigation?** | ❌ NO | ✅ YES |
| **Retry logic location** | Embedded in handleOnline | Separate utils file |
| **Reusability** | ❌ Not reusable | ✅ Used by live + pending |
| **Online detection** | ❌ Implied by event | ✅ Explicit event listeners |
| **Single Responsibility** | ❌ Mixed concerns | ✅ Clear separation |
| **Testability** | ❌ Hard to test | ✅ Easy to test |
| **Industry standard** | ❌ Component-based | ✅ Service-based |

---

## Next Steps

1. ✅ Agree on architecture (DONE)
2. ⏳ Implement shared retry logic (utils/transcriptionRetry.ts)
3. ⏳ Implement auto-retry service (hooks/useAutoRetry.ts)
4. ⏳ Update ClipMasterScreen
5. ⏳ Mount at app root
6. ⏳ Test thoroughly

**After this works**: Add circuit breaker (v1.50) + VPN UI

---

**END OF SPEC**
