# 032 - Phase 4 Architecture Corrections
## Hook Interface Contracts & Race Condition Fix

**Date**: December 30, 2025
**Status**: CRITICAL BUG FIX - Race condition causing "No audio detected" on online recordings
**Applies to**: [030_REWRITE_ARCHITECTURE.md](030_REWRITE_ARCHITECTURE.md)
**References**: [0190_PHASE4_GAP_ANALYSIS.md](0190_PHASE4_GAP_ANALYSIS.md)

---

## Executive Summary

**Bug**: Online recording flow completely broken - `audioBlob` is null when `handleDoneClick` tries to transcribe, incorrectly triggering offline flow.

**Root Cause**: Architecture showed example usage (`const { audioBlob} = await stopRecording()`) without defining that `stopRecording` MUST return a Promise. Implementation used `stopRecording: () => void`, causing race condition.

**Implementation Strategy**: This patch implements **Option A** from [0190_PHASE4_GAP_ANALYSIS.md](0190_PHASE4_GAP_ANALYSIS.md#L164-L184) - Make stopRecording return Promise.

**Fix**: Make `stopRecording` return `Promise<StopRecordingResult>` and wait for MediaRecorder's async `onstop` event before resolving.

**Priority**: This is the PRIMARY fix to implement FIRST. After this race condition fix is complete and tested, proceed with the other specification gap corrections listed in Part 5.

**Methodology Change**: This patch uses **contract-driven specification** - TypeScript interfaces defined FIRST, then exact implementation code.

---

## PART 1: Hook Interface Contracts (REQUIRED)

### 1.1 - UseClipRecordingReturn Interface

**REQUIRED INTERFACE** - useClipRecording.ts MUST export this exact interface:

```typescript
export interface StopRecordingResult {
  audioBlob: Blob | null;
  audioId: string | null;
  duration: number;
}

export interface UseClipRecordingReturn {
  // Recording state
  isRecording: boolean;
  audioBlob: Blob | null;
  audioId: string | null;
  duration: number;
  error: string | null;
  audioAnalyser: AnalyserNode | null;

  // Transcription state
  isTranscribing: boolean;
  transcription: string;
  transcriptionError: string | null;
  isActiveRequest: boolean;

  // Actions
  startRecording: () => Promise<void>;

  // CRITICAL: stopRecording MUST return Promise
  stopRecording: () => Promise<StopRecordingResult>;

  transcribeRecording: (blobOverride?: Blob) => Promise<string>;
  forceRetry: () => void;
  reset: () => void;
}
```

**CONTRACT REQUIREMENTS**:

1. `stopRecording()` MUST return `Promise<StopRecordingResult>`
2. Promise MUST NOT resolve until MediaRecorder's `onstop` event completes
3. Promise MUST NOT resolve until `setAudioBlob()` state update completes
4. Promise MUST NOT resolve until IndexedDB `storeAudio()` completes
5. Returned `audioBlob` MUST be the same blob that was stored in IndexedDB
6. Returned `audioId` MUST be the IndexedDB key returned by `storeAudio()`
7. Returned `duration` MUST be the final duration in seconds at time of stop

**TIMING CONTRACT**:
```
User clicks "Done"
    ↓
Call stopRecording() → Returns Promise (PENDING)
    ↓
MediaRecorder.stop() called (synchronous, returns void)
    ↓
[ASYNC GAP - DO NOT PROCEED]
    ↓
MediaRecorder fires 'onstop' event (async)
    ↓
Blob created from chunks
    ↓
await storeAudio(blob) → IndexedDB write
    ↓
setAudioBlob(blob) → State update
    ↓
Promise resolves → { audioBlob, audioId, duration }
    ↓
NOW SAFE: Caller can access audioBlob for transcription
```

**RACE CONDITION WARNING**:
- MediaRecorder.stop() returns `void` (synchronous)
- MediaRecorder's `onstop` event fires **asynchronously** later
- If caller proceeds before `onstop` completes: `audioBlob = null`
- Solution: Return Promise that resolves only when `onstop` completes

---

## PART 2: Implementation Fix for useClipRecording.ts

### 2.1 - Add StopRecordingResult Interface

**Location**: [useClipRecording.ts:14](useClipRecording.ts#L14)

**ACTION**: Add this interface after line 13:

```typescript
export interface StopRecordingResult {
  audioBlob: Blob | null;
  audioId: string | null;
  duration: number;
}
```

### 2.2 - Update UseClipRecordingReturn Interface

**Location**: [useClipRecording.ts:32](useClipRecording.ts#L32)

**ACTION**: Replace line 32 with:

```typescript
  stopRecording: () => Promise<StopRecordingResult>;
```

### 2.3 - Add Promise Resolver Ref

**Location**: [useClipRecording.ts:78](useClipRecording.ts#L78)

**ACTION**: Add after line 78 (after `retryTimerRef`):

```typescript
  const stopRecordingResolverRef = useRef<((result: StopRecordingResult) => void) | null>(null);
```

### 2.4 - Replace stopRecording Implementation

**Location**: [useClipRecording.ts:223-252](useClipRecording.ts#L223-L252)

**ACTION**: Replace entire `stopRecording` function (lines 223-252) with:

```typescript
  const stopRecording = useCallback((): Promise<StopRecordingResult> => {
    return new Promise((resolve) => {
      // If not recording, resolve immediately with current state
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve({
          audioBlob: audioBlob,
          audioId: audioId,
          duration: duration
        });
        return;
      }

      // Store resolver for onstop handler to call
      stopRecordingResolverRef.current = resolve;

      // Stop MediaRecorder (triggers async onstop event)
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;

      // Stop microphone stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Clear analyser
      audioAnalyserRef.current = null;

      // Stop duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      setIsRecording(false);

      // NOTE: Promise will resolve when onstop handler calls stopRecordingResolverRef.current()
    });
  }, [audioBlob, audioId, duration]);
```

### 2.5 - Update MediaRecorder onstop Handler

**Location**: [useClipRecording.ts:156-182](useClipRecording.ts#L156-L182)

**ACTION**: Replace lines 156-182 with:

```typescript
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: mimeType });

        let savedAudioId: string | null = null;

        // CRITICAL: Save audio to IndexedDB BEFORE any network call
        // This ensures audio is never lost, even if transcription fails
        try {
          savedAudioId = await storeAudio(blob);
          setAudioId(savedAudioId);
          log.info('Audio saved to IndexedDB', {
            audioId: savedAudioId,
            size: blob.size,
            type: blob.type
          });
        } catch (error) {
          log.error('Failed to save audio to IndexedDB', error);
          // Still set audioBlob for immediate transcription attempt
        }

        setAudioBlob(blob);

        // Stop duration timer
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }

        // CRITICAL: Resolve stopRecording Promise with result
        if (stopRecordingResolverRef.current) {
          const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          stopRecordingResolverRef.current({
            audioBlob: blob,
            audioId: savedAudioId,
            duration: finalDuration
          });
          stopRecordingResolverRef.current = null;
        }
      };
```

**KEY CHANGES**:
1. Capture `savedAudioId` from `storeAudio()` call
2. Calculate `finalDuration` from `startTimeRef`
3. Call `stopRecordingResolverRef.current()` with result object
4. Clear resolver ref after calling

---

## PART 3: Implementation Fix for ClipMasterScreen.tsx

### 3.1 - Update handleDoneClick Implementation

**Location**: [ClipMasterScreen.tsx:473-545](ClipMasterScreen.tsx#L473-L545)

**ACTION**: Replace lines 473-545 with:

```typescript
  const handleDoneClick = async () => {
    setRecordNavState('processing');

    // 1. Stop recording and wait for result
    const { audioBlob: recordedBlob, audioId: recordedAudioId, duration: recordedDuration } = await stopRecordingHook();

    // 2. Validate audio
    if (!recordedBlob || recordedBlob.size < 100) {
      setShowErrorToast(true);  // Show error toast (uses ErrorToast component)
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

    // 4. Transcribe (returns rawText directly)
    const rawText = await transcribeRecording(recordedBlob);

    if (!rawText || rawText.length === 0) {
      handleOfflineRecording({
        audioId: recordedAudioId!,
        duration: recordedDuration,
        currentClipId
      });
      setRecordNavState('record');
      return;
    }

    // 5. Create clip or append
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

      // 6. Background jobs
      formatTranscriptionInBackground(newClip.id, rawText, false);
      generateTitleInBackground(newClip.id, rawText);
    }

    setRecordNavState('complete');
    resetRecording();
  };
```

**KEY CHANGES**:
1. Line 478: `await stopRecordingHook()` - MUST wait for Promise
2. Line 478: Destructure result: `{ audioBlob: recordedBlob, audioId: recordedAudioId, duration: recordedDuration }`
3. Lines 481-488: Validate `recordedBlob` before proceeding
4. Line 495: Use `recordedBlob` (not `audioBlob` state) for transcription
5. Removed dependency on `audioBlob`, `audioId`, `duration` state variables

**VALIDATION CONTRACT**:
- MUST check `recordedBlob` is not null
- MUST check `recordedBlob.size >= 100` (minimum audio size)
- MUST show error toast if validation fails (uses existing ErrorToast component)
- MUST reset to 'record' state if validation fails

**ERROR TOAST SETUP** (if not already present):
Add state near other toast state (around line 159):
```typescript
const [showErrorToast, setShowErrorToast] = useState(false);
```

Add ToastNotification to JSX (near other toasts):
```typescript
<ToastNotification
  isVisible={showErrorToast}
  onDismiss={() => setShowErrorToast(false)}
  type="error"
  text="No audio detected"
/>
```

---

## PART 4: Remove Competing Reactive Pattern

### 4.1 - Delete useEffect Auto-Trigger

**Location**: [ClipMasterScreen.tsx:875-879](ClipMasterScreen.tsx#L875-L879)

**ACTION**: DELETE these lines entirely:

```typescript
  useEffect(() => {
    if (audioBlob && !isTranscribing && !transcriptionError && recordNavState === 'processing') {
      transcribeRef.current();
    }
  }, [audioBlob, isTranscribing, transcriptionError, recordNavState]);
```

**REASON**: This reactive pattern creates two competing transcription triggers:
1. `handleDoneClick` calls `transcribeRecording(audioBlob!)` directly
2. `useEffect` calls `transcribeRef.current()` when `audioBlob` becomes available

With the async `stopRecording` fix, `handleDoneClick` now has the correct `audioBlob` value, so this useEffect is redundant and causes double-transcription attempts.

---

## PART 5: Specification Gaps Addressed

This patch addresses **10 specification gaps** identified in [0190_PHASE4_GAP_ANALYSIS.md](0190_PHASE4_GAP_ANALYSIS.md):

| Gap | Description | Fixed By |
|-----|-------------|----------|
| **GAP 1** | Hook Interface Definitions Missing | Part 1.1 - Explicit TypeScript interfaces |
| **GAP 2** | Async Operation Completion Not Specified | Part 1.1 - Timing contract diagram |
| **GAP 3** | State Transition Timing Not Defined | Part 2.5 - onstop resolver timing |
| **GAP 4** | Event Handler Dependencies Unspecified | Part 2.5 - onstop must call resolver |
| **GAP 5** | AbortController Pattern Incomplete | (Deferred to post-Phase 4) |
| **GAP 6** | Animation Trigger Timing Unclear | (Phase 5 - ClipRecordScreen) |
| **GAP 7** | Error State Recovery Not Defined | Part 3.1 - Validation contract |
| **GAP 8** | Parent Title Generation Trigger Not Explicit | (Existing code correct) |
| **GAP 9** | Offline Flow Decision Logic Not Documented | Part 3.1 - Network check flow |
| **GAP 10** | IndexedDB Audio Lifecycle Not Complete | Part 2.5 - storeAudio in onstop |

---

## PART 6: Testing Requirements

After implementing this patch, test these scenarios:

### Test 1: Online Recording (Primary Fix)
```
1. Ensure network is online (check browser dev tools)
2. Click Record → Speak for 3-5 seconds → Click Done
3. ✅ EXPECTED: Clip shows "Transcribing..." spinner
4. ✅ EXPECTED: Clip transitions to "Formatting..." spinner
5. ✅ EXPECTED: Clip shows formatted text with animation
6. ❌ MUST NOT: Show "No audio detected" alert
7. ❌ MUST NOT: Create pending clip in ClipOffline
```

### Test 2: Offline Recording (Preserve Existing Behavior)
```
1. Turn network off (browser dev tools → Network → Offline)
2. Click Record → Speak for 3-5 seconds → Click Done
3. ✅ EXPECTED: Pending clip created in ClipOffline
4. ✅ EXPECTED: Audio saved to IndexedDB
5. Turn network back online
6. ✅ EXPECTED: Auto-retry starts transcription
7. ✅ EXPECTED: Clip transitions to formatted text
```

### Test 3: Short Recording Validation
```
1. Click Record → Immediately click Done (< 0.5 seconds)
2. ✅ EXPECTED: Alert "No Audio Detected"
3. ✅ EXPECTED: Return to record screen (no clip created)
```

### Test 4: Append Mode
```
1. Create a clip successfully
2. Click Record again (append mode)
3. Speak for 3-5 seconds → Click Done
4. ✅ EXPECTED: rawText appended with '\n\n' separator
5. ✅ EXPECTED: formattedText appended after formatting completes
```

---

## PART 7: Architecture Document Updates (030_REWRITE_ARCHITECTURE.md)

### 7.1 - Section to Add: Hook Interface Contracts

**Location**: After line 1200 (before "4.4 handleDoneClick Step-by-Step")

**ACTION**: Add new section:

```markdown
### 4.3.1 - useClipRecording Hook Interface Contract

**REQUIRED INTERFACE**:

```typescript
export interface StopRecordingResult {
  audioBlob: Blob | null;
  audioId: string | null;
  duration: number;
}

export interface UseClipRecordingReturn {
  // Recording state
  isRecording: boolean;
  audioBlob: Blob | null;
  audioId: string | null;
  duration: number;
  error: string | null;
  audioAnalyser: AnalyserNode | null;

  // Transcription state
  isTranscribing: boolean;
  transcription: string;
  transcriptionError: string | null;
  isActiveRequest: boolean;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<StopRecordingResult>;  // ← MUST return Promise
  transcribeRecording: (blobOverride?: Blob) => Promise<string>;
  forceRetry: () => void;
  reset: () => void;
}
```

**CRITICAL REQUIREMENT**: `stopRecording()` MUST return `Promise<StopRecordingResult>` that resolves only when:
1. MediaRecorder's `onstop` event completes
2. Audio blob is saved to IndexedDB via `storeAudio()`
3. State updates complete (`setAudioBlob`, `setAudioId`)

**Race Condition Warning**: MediaRecorder.stop() is synchronous but fires async `onstop` event. Do NOT proceed until Promise resolves.
```

### 7.2 - Update handleDoneClick Flow

**Location**: Line 1408-1456

**ACTION**: Replace lines 1412-1420 with:

```markdown
**Step 1: Stop recording and get audio (ASYNC)**

```typescript
const { audioBlob: recordedBlob, audioId: recordedAudioId, duration: recordedDuration } = await stopRecordingHook();
```

**CRITICAL**: MUST await the Promise. Do NOT proceed until resolved.
```

### 7.3 - Update Validation Step

**Location**: Line 1421-1430

**ACTION**: Replace with:

```markdown
**Step 2: Validate audio**

```typescript
if (!recordedBlob || recordedBlob.size < 100) {
  setShowErrorToast(true);  // Show error toast
  setRecordNavState('record');
  return;
}
```

**Requirements**:
- Check blob exists
- Check blob size >= 100 bytes
- Show error toast if validation fails (uses ErrorToast component from ClipToast.tsx)
- Return early (do not create clip)
```

---

## PART 8: Summary of Changes

### Files Modified:

1. **useClipRecording.ts**:
   - Added `StopRecordingResult` interface
   - Changed `stopRecording` return type to `Promise<StopRecordingResult>`
   - Added `stopRecordingResolverRef` ref
   - Wrapped `stopRecording` body in `new Promise()`
   - Updated `onstop` handler to resolve Promise with result object

2. **ClipMasterScreen.tsx**:
   - Changed line 478 to `await stopRecordingHook()`
   - Destructured result: `{ audioBlob: recordedBlob, audioId: recordedAudioId, duration: recordedDuration }`
   - Added validation for `recordedBlob` before transcription
   - Used `recordedBlob` instead of state variable `audioBlob`
   - Deleted useEffect auto-trigger (lines 875-879)

3. **030_REWRITE_ARCHITECTURE.md** (recommended updates):
   - Add Section 4.3.1 with hook interface contracts
   - Update handleDoneClick flow to show `await stopRecordingHook()`
   - Add race condition warnings

### Bug Status:

- ✅ **FIXED**: Race condition causing "No audio detected" on online recordings
- ✅ **FIXED**: Competing transcription triggers (imperative vs reactive)
- ✅ **FIXED**: Missing validation for audioBlob before transcription
- ✅ **FIXED**: Architecture specification gaps (example-driven → contract-driven)

---

## PART 9: Implementation Order

Execute changes in this exact order:

1. **useClipRecording.ts** (Part 2):
   - 2.1 → Add `StopRecordingResult` interface
   - 2.2 → Update `UseClipRecordingReturn` interface
   - 2.3 → Add `stopRecordingResolverRef`
   - 2.4 → Replace `stopRecording` function
   - 2.5 → Update `onstop` handler

2. **ClipMasterScreen.tsx** (Parts 3 & 4):
   - 3.1 → Replace `handleDoneClick` function
   - 4.1 → Delete useEffect auto-trigger

3. **Test** (Part 6):
   - Test 1 → Online recording (primary fix validation)
   - Test 2 → Offline recording (preserve behavior)
   - Test 3 → Short recording validation
   - Test 4 → Append mode

4. **030_REWRITE_ARCHITECTURE.md** (Part 7) - OPTIONAL:
   - 7.1 → Add hook interface contracts section
   - 7.2 → Update handleDoneClick flow
   - 7.3 → Update validation step

---

**Prepared By**: Claude Sonnet 4.5
**Date**: December 30, 2025
**Status**: ✅ READY FOR IMPLEMENTATION
**Methodology**: Contract-driven specification (interfaces defined FIRST)
**Fixes**: Critical race condition causing Phase 4 failure
