# 032_v3 - Error Handling Architecture
## Proper Error Classification & Validation

**Date**: December 30, 2025
**Status**: 🏗️ **ARCHITECTURAL IMPROVEMENT** - Not a patch, fills gap in error handling
**Applies to**: [032_ARCHITECTURE_CORRECTIONS.md](032_ARCHITECTURE_CORRECTIONS.md)
**Priority**: Fix BEFORE proceeding to Phase 5

---

## Executive Summary

Testing revealed that the current architecture is **missing error classification**. All transcription failures are treated as network issues, creating pending clips even when the server definitively rejects the audio.

**This is NOT a patch** - it's completing the error handling architecture that should have been in place.

### Bugs Addressed:

1. **Bug 3**: Duration validation incomplete (checks blob size but not duration)
2. **Bug 4**: Server rejections create pending clips (should show error toast)
3. **Bug 5**: Nav bar breaks with 'failed' status (DEFER to Phase 5)

---

## Architectural Gap Analysis

### Current Broken Flow:

```typescript
// ClipMasterScreen.tsx handleDoneClick (CURRENT):
const rawText = await transcribeRecordingHook(recordedBlob);

if (!rawText) {
  // ❌ ASSUMES ALL FAILURES ARE NETWORK ISSUES
  handleOfflineRecording(recordedBlob, recordedAudioId, recordedDuration);
}
```

**Problem**: `transcribeRecording` returns empty string for:
- Network timeout → Should create pending clip ✅
- Server 500 "No speech detected" → **Should show error** ❌ (currently creates pending clip)
- Blob too small → Should show error ❌

**Root Cause**: No error type information returned from transcription layer

---

### Proper Architectural Solution:

**Establish error classification contract between layers**:

```
┌─────────────────────┐
│ ClipMasterScreen    │  ← UI Layer
└──────────┬──────────┘
           │ calls transcribeRecording
           │ receives TranscriptionResult
           ▼
┌─────────────────────┐
│ useClipRecording    │  ← Transcription Layer
└──────────┬──────────┘
           │ classifies errors
           │ returns error type + text
           ▼
┌─────────────────────┐
│ Deepgram API        │  ← External Service
└─────────────────────┘
```

**Error Classification Strategy**:

| Error Type | Source | Action | Creates Pending Clip? |
|------------|--------|--------|----------------------|
| `network` | Timeout, fetch failed | Retry + pending clip | ✅ YES |
| `validation` | Blob too small, duration < 1s | Error toast | ❌ NO |
| `server-error` | Deepgram 500 "No speech" | Error toast | ❌ NO |
| `offline` | navigator.onLine = false | Pending clip | ✅ YES |

---

## Implementation Plan

### Part 1: Complete Validation Contract (Bug 3)

**Location**: [ClipMasterScreen.tsx:477](ClipMasterScreen.tsx#L477) - `handleDoneClick` validation block

**Current Code** (INCOMPLETE):
```typescript
// 3. Validate audio blob
if (!recordedBlob || recordedBlob.size < 100) {
  setShowErrorToast(true);
  setRecordNavState('record');
  return;
}
// ❌ MISSING: Duration validation
```

**Fixed Code**:
```typescript
// 3. Validate audio blob AND duration
if (!recordedBlob || recordedBlob.size < 100 || recordedDuration < 1) {
  setShowErrorToast(true);
  setRecordNavState('record');
  return;
}
```

**Why This is Architectural**:
- Extends existing validation layer (not a new concept)
- Prevents invalid data at system boundary
- Same pattern as blob size validation

---

### Part 2: Error Classification Architecture (Bug 4)

#### Step 2.1: Define Error Type Contract

**Location**: [useClipRecording.ts:15-19](useClipRecording.ts#L15-L19) - Add new interface

**Add BEFORE `StopRecordingResult` interface**:
```typescript
/* ============================================
   INTERFACES
   ============================================ */

// NEW: Transcription result with error classification
export interface TranscriptionResult {
  text: string;
  error: 'network' | 'validation' | 'server-error' | 'offline' | null;
}

export interface StopRecordingResult {
  audioBlob: Blob | null;
  audioId: string | null;
  duration: number;
}
```

---

#### Step 2.2: Update Hook Return Type

**Location**: [useClipRecording.ts:21-42](useClipRecording.ts#L21-L42) - Update interface

**Current Code**:
```typescript
export interface UseClipRecordingReturn {
  // ... other properties
  transcribeRecording: (blobOverride?: Blob) => Promise<string>;
  // ...
}
```

**Fixed Code**:
```typescript
export interface UseClipRecordingReturn {
  // ... other properties
  transcribeRecording: (blobOverride?: Blob) => Promise<TranscriptionResult>;
  // ...
}
```

---

#### Step 2.3: Update transcribeRecording Implementation

**Location**: [useClipRecording.ts:293-441](useClipRecording.ts#L293-L441) - `transcribeRecording` function

**Change 1**: Update function signature
```typescript
// OLD:
const transcribeRecording = useCallback(async (blobOverride?: Blob): Promise<string> => {

// NEW:
const transcribeRecording = useCallback(async (blobOverride?: Blob): Promise<TranscriptionResult> => {
```

**Change 2**: Return validation error (lines 303-314)
```typescript
// OLD:
if (!blobToUse) {
  log.warn('No audio blob to transcribe');
  setTranscriptionError('No audio to transcribe');
  return '';
}

if (blobToUse.size < 100) {
  log.warn('Audio blob too small', { size: blobToUse.size });
  setTranscriptionError('Recording is too short. Please record at least 1 second of audio.');
  return '';
}

// NEW:
if (!blobToUse) {
  log.warn('No audio blob to transcribe');
  setTranscriptionError('No audio to transcribe');
  return { text: '', error: 'validation' };
}

if (blobToUse.size < 100) {
  log.warn('Audio blob too small', { size: blobToUse.size });
  setTranscriptionError('Recording is too short. Please record at least 1 second of audio.');
  return { text: '', error: 'validation' };
}
```

**Change 3**: Return offline error (lines 316-322)
```typescript
// OLD:
if (!navigator.onLine) {
  log.info('Offline - transcription will retry when online');
  setTranscriptionError('offline');
  setIsTranscribing(false);
  return '';
}

// NEW:
if (!navigator.onLine) {
  log.info('Offline - transcription will retry when online');
  setTranscriptionError('offline');
  setIsTranscribing(false);
  return { text: '', error: 'offline' };
}
```

**Change 4**: Return success (line 377)
```typescript
// OLD:
return data.transcript;

// NEW:
return { text: data.transcript, error: null };
```

**Change 5**: Classify server errors vs network errors (lines 379-434)
```typescript
    } catch (error) {
      log.error('Transcription failed', {
        error,
        attempt: retryCount + 1
      });

      // ✅ NEW: Classify error type
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const isNetworkError = error instanceof TypeError;
      const isServerError = error instanceof Error && error.message.includes('Server error');

      // Server errors (4xx/5xx) are DEFINITIVE failures - don't retry
      if (isServerError) {
        setTranscriptionError('Server rejected audio');
        setRetryCount(0);
        setIsActiveRequest(false);
        log.error('Server rejection (definitive failure)', {
          errorMessage: error instanceof Error ? error.message : 'Unknown',
          retriesAttempted: retryCount + 1
        });
        return { text: '', error: 'server-error' };
      }

      // Network errors (timeout, connection failed) should retry
      const shouldRetry = isTimeout || isNetworkError;

      if (shouldRetry) {
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);

        if (nextRetryCount < MAX_RAPID_ATTEMPTS) {
          // Rapid phase: immediate retry
          log.info('Rapid retry (immediate)', {
            attempt: nextRetryCount + 1,
            reason: isTimeout ? 'timeout' : 'network error'
          });
          retryTimerRef.current = setTimeout(() => transcribeRecording(), 0);
          return { text: '', error: 'network' };
        } else {
          // Interval phase: wait before retry
          const intervalIndex = (nextRetryCount - MAX_RAPID_ATTEMPTS) % RETRY_INTERVALS.length;
          const waitTime = RETRY_INTERVALS[intervalIndex];

          setTranscriptionError('network-retry');
          setIsActiveRequest(false);

          log.info('Interval retry (scheduled)', {
            attempt: nextRetryCount + 1,
            waitMinutes: waitTime / 60000,
            reason: isTimeout ? 'timeout' : 'network error'
          });

          retryTimerRef.current = setTimeout(() => {
            setIsActiveRequest(true);
            setTranscriptionError(null);
            transcribeRecording();
          }, waitTime);
          return { text: '', error: 'network' };
        }
      } else {
        // Unknown error - treat as definitive failure
        const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
        setTranscriptionError(errorMessage);
        setRetryCount(0);
        setIsActiveRequest(false);
        log.error('Unknown transcription failure', { errorMessage, retriesAttempted: retryCount + 1 });
        return { text: '', error: 'server-error' };
      }
    } finally {
      if (!retryTimerRef.current) {
        setIsTranscribing(false);
      }
    }
```

---

#### Step 2.4: Update ClipMasterScreen to Use Error Classification

**Location**: [ClipMasterScreen.tsx:473-546](ClipMasterScreen.tsx#L473-L546) - Complete `handleDoneClick` function

**CRITICAL NOTE**: Changing transcribeRecording return type affects TWO places:
1. The transcription call itself (line 500)
2. The append mode code that uses `rawText` (line 517)

Both need to be updated to use the new `TranscriptionResult` type.

**Complete Function Replacement**:

Replace the entire `handleDoneClick` function with:

```typescript
const handleDoneClick = async () => {
  setRecordNavState('processing');

  // 1. Stop recording and wait for result
  const { audioBlob: recordedBlob, audioId: recordedAudioId, duration: recordedDuration } = await stopRecordingHook();

  // 2. Validate audio (Bug 3 fix: added duration check)
  if (!recordedBlob || recordedBlob.size < 100 || recordedDuration < 1) {
    setShowErrorToast(true);
    setRecordNavState('record');
    return;
  }

  // 3. Check network status
  const isOnline = navigator.onLine;

  if (!isOnline) {
    handleOfflineRecording({
      audioId: recordedAudioId!,
      duration: recordedDuration,
      currentClipId
    });
    setRecordNavState('record');
    return;
  }

  // 4. Transcribe and classify error (Bug 4 fix: use TranscriptionResult)
  let transcriptionResult: TranscriptionResult;
  try {
    transcriptionResult = await transcribeRecording(recordedBlob);
  } catch (error) {
    console.error('Transcription error:', error);
    // Fallback to validation error if hook throws unexpectedly
    transcriptionResult = { text: '', error: 'validation' };
  }

  const { text: rawText, error: transcriptionError } = transcriptionResult;

  // 5. Route based on error type (Bug 4 fix: classify errors)
  if (!rawText || rawText.length === 0) {
    // Network or offline errors → Create pending clip
    if (transcriptionError === 'network' || transcriptionError === 'offline') {
      handleOfflineRecording({
        audioId: recordedAudioId!,
        duration: recordedDuration,
        currentClipId
      });
      setRecordNavState('record');
      return;
    }

    // Validation or server errors → Show error toast, stay in record state
    if (transcriptionError === 'validation' || transcriptionError === 'server-error') {
      setShowErrorToast(true);
      setRecordNavState('record');
      return;
    }

    // Fallback: treat as validation error
    setShowErrorToast(true);
    setRecordNavState('record');
    return;
  }

  // 6. Create clip or append (rawText is now guaranteed non-empty)
  if (isAppendMode && currentClipId) {
    const existingClip = getClipById(currentClipId);
    if (existingClip) {
      updateClip(currentClipId, {
        rawText: existingClip.rawText + '\n\n' + rawText,
        status: 'formatting'
      });
      formatTranscriptionInBackground(currentClipId, rawText, true);
    }
  } else {
    const newClip: Clip = {
      id: generateClipId(),
      createdAt: Date.now(),
      title: useClipStore.getState().nextRecordingTitle(),
      date: today(),
      rawText: rawText,
      formattedText: '',
      content: rawText,
      status: 'formatting',
      currentView: 'formatted'
    };

    addClip(newClip);
    setSelectedClip(newClip);
    setCurrentClipId(newClip.id);

    // Background jobs
    formatTranscriptionInBackground(newClip.id, rawText, false);
    generateTitleInBackground(newClip.id, rawText);
  }

  setRecordNavState('complete');
  resetRecording();
};
```

**Add import at top of file** (around line 9):
```typescript
import { TranscriptionResult } from '../../hooks/useClipRecording';
```

**Why Append Mode is Updated Here**:
The append mode code (lines 71-79 above) uses the `rawText` variable which is now extracted from `TranscriptionResult`. The code itself doesn't change, but it depends on the destructuring in line 38. This is why the Builder flagged it - changing the API contract requires updating all dependent code.

---

## Testing Protocol

After implementing this architecture:

### Test 1: Duration Validation (Bug 3)
```
1. Click Record
2. Immediately click Done (< 1 second)
3. EXPECTED: Error toast "No audio detected" ✅
4. EXPECTED: No pending clip created ✅
5. EXPECTED: Stay in record state ✅
```

### Test 2: Server Error Handling (Bug 4)
```
1. Click Record
2. Record very quiet audio (Deepgram will reject)
3. Click Done
4. EXPECTED: Error toast shown ✅
5. EXPECTED: No pending clip created ✅
6. EXPECTED: Stay in record state ✅
```

### Test 3: Network Error Handling (Bug 4)
```
1. Turn off network
2. Click Record → speak → Done
3. EXPECTED: Pending clip created ✅
4. EXPECTED: No error toast ✅
5. Turn network back on
6. EXPECTED: Auto-transcription attempts ✅
```

### Test 4: Valid Recording (Regression)
```
1. Click Record
2. Speak clearly for 3+ seconds
3. Click Done
4. EXPECTED: Text appears immediately ✅
5. EXPECTED: No pending clip created ✅
```

---

## Architectural Justification

### Why This is NOT a Patch:

1. **Bug 3 (Duration Validation)**:
   - Extends existing validation layer
   - Same architectural pattern as blob size check
   - Prevents invalid data at system boundary

2. **Bug 4 (Error Classification)**:
   - Establishes proper contract between layers
   - Fills gap in error handling architecture
   - Routes errors to correct handling paths

### Why This IS Proper Architecture:

- **Separation of Concerns**: Transcription layer classifies errors, UI layer routes them
- **Type Safety**: TypeScript interface defines error contract
- **Extensibility**: Easy to add new error types in future
- **Testability**: Each error path can be tested independently

---

## Implementation Checklist

### Step 1: Error Classification Contract in useClipRecording.ts
- [ ] Add `TranscriptionResult` interface (before `StopRecordingResult`)
- [ ] Update `UseClipRecordingReturn.transcribeRecording` signature to return `Promise<TranscriptionResult>`
- [ ] Update all `return` statements in `transcribeRecording` function:
  - [ ] Line 304: validation error - return `{ text: '', error: 'validation' }`
  - [ ] Line 313: validation error - return `{ text: '', error: 'validation' }`
  - [ ] Line 322: offline error - return `{ text: '', error: 'offline' }`
  - [ ] Line 377: success - return `{ text: data.transcript, error: null }`
  - [ ] Lines 379-434: Add server error classification in catch block
- [ ] Save file

### Step 2: Update ClipMasterScreen.tsx handleDoneClick
- [ ] Add import: `import { TranscriptionResult } from '../../hooks/useClipRecording';`
- [ ] Replace entire `handleDoneClick` function (lines 473-546) with the complete implementation from Step 2.4
  - [ ] Includes duration validation (Bug 3)
  - [ ] Includes error classification (Bug 4)
  - [ ] Includes append mode with `rawText` variable (uses new TranscriptionResult)
- [ ] Save file

### Step 3: Test All Error Paths
- [ ] Test duration validation (< 1s recording) → Error toast, no pending clip
- [ ] Test server rejection (5s quiet audio) → Error toast, no pending clip  ← **THIS IS YOUR BUG**
- [ ] Test network error (offline → online) → Pending clip created, auto-retry works
- [ ] Test valid recording (regression) → Text appears, no pending clip
- [ ] Test append mode (regression) → Second recording appends to first

---

## Summary of Changes

| Component | Change | Lines | Type |
|-----------|--------|-------|------|
| **useClipRecording.ts** | Add `TranscriptionResult` interface | +5 | New contract |
| **useClipRecording.ts** | Update return type signature | 1 changed | Contract |
| **useClipRecording.ts** | Update all return statements | ~10 changed | Implementation |
| **useClipRecording.ts** | Add server error classification | ~15 added | Architecture |
| **ClipMasterScreen.tsx** | Complete duration validation | 1 changed | Validation |
| **ClipMasterScreen.tsx** | Import `TranscriptionResult` | 1 added | Type safety |
| **ClipMasterScreen.tsx** | Use error classification routing | ~20 changed | Architecture |

**Total**: ~50 lines changed/added

---

## Related Documents

- [032_ARCHITECTURE_CORRECTIONS.md](032_ARCHITECTURE_CORRECTIONS.md) - Original async Promise fix
- [032_v2_BUGFIX_APPEND_AND_TOAST.md](032_v2_BUGFIX_APPEND_AND_TOAST.md) - Append + toast fixes
- [013_ZUSTANDv11_debug.md](013_ZUSTANDv11_debug.md) - Debug evidence for bugs 3-5
- [030_v5_PHASE5_SPINNER_PATCH.md](030_v5_PHASE5_SPINNER_PATCH.md) - Next phase (Bug 5 fix)

---

**Prepared By**: Claude Sonnet 4.5
**Date**: December 30, 2025
**Status**: ✅ READY FOR IMPLEMENTATION
**Type**: 🏗️ ARCHITECTURAL IMPROVEMENT (Not a patch)
**Urgency**: HIGH - Fixes critical error handling gap
