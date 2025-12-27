# Recording Error Loop Debug Analysis

**Date:** Dec 23, 2025  
**Issue:** Recording abruptly stopped + Server error toast flashing continuously

---

## 🐛 Bug Description

### User-Reported Symptoms

**Recording 1:**
- User recorded fast background speech (~5 seconds)
- Result: "No audio recorded" error toast
- This is working as intended (audio blob < 100 bytes validation)

**Recording 2:**
- User started a new recording
- Recording **abruptly stopped** (not by user action)
- Server error toast appeared: "Server error 500: No speech detected"
- Toast kept **flashing repeatedly** every ~2 seconds
- Loop only stopped after navigating back to home screen

---

## 🔍 Root Cause Analysis

### Problem 1: Infinite Auto-Transcribe Loop

**File:** `ClipMasterScreen.tsx`  
**Lines:** 618-622

```typescript
useEffect(() => {
  if (audioBlob && !isTranscribing && !transcription && recordNavState === 'processing') {
    transcribeRecording();
  }
}, [audioBlob, isTranscribing, transcription, recordNavState, transcribeRecording]);
```

#### The Chain Reaction

| Step | What Happens | State Changes |
|------|-------------|---------------|
| 1 | Recording stops → `audioBlob` set | `audioBlob = Blob` |
| 2 | User clicks "Done" → processing starts | `recordNavState = 'processing'` |
| 3 | Auto-transcribe useEffect triggers | Calls `transcribeRecording()` |
| 4 | Deepgram returns 500: "No speech detected" | `transcriptionError = 'Server error 500: No speech detected'` |
| 5 | Error handling useEffect triggers (lines 986-1019) | `setShowErrorToast(true)` |
| 6 | Toast displays for 3 seconds, auto-dismisses | Toast visibility cycles |
| 7 | **BUT** `transcribeRecording` function gets recreated | Function reference changes |
| 8 | Auto-transcribe useEffect sees new function → **RE-TRIGGERS** | Loop continues |

#### Why the Function Recreates

**File:** `useClipRecording.ts`  
**Line:** 387

```typescript
}, [audioBlob, retryCount]); // transcribeRecording depends on retryCount
```

- `transcribeRecording` is a `useCallback` with `retryCount` in dependencies
- During retry logic, `retryCount` increments (line 346)
- When `retryCount` changes, `transcribeRecording` function is **recreated**
- New function reference triggers the auto-transcribe useEffect
- Since `transcription` is still empty (because it failed), conditions are met again
- Infinite loop

#### The Missing Guard

The auto-transcribe useEffect has NO guard to prevent re-trigger after definitive failure:

```typescript
if (audioBlob && !isTranscribing && !transcription && recordNavState === 'processing') {
  //                                               NO CHECK FOR transcriptionError ❌
  transcribeRecording();
}
```

---

### Problem 2: Why Recording "Abruptly Stopped"

**File:** `useClipRecording.ts`  
**Lines:** 269-272

```typescript
// Validate audio blob size
if (blobToUse.size < 100) {
  log.warn('Audio blob too small', { size: blobToUse.size });
  setTranscriptionError('Recording is too short. Please record at least 1 second of audio.');
  return;
}
```

#### Two Possible Scenarios

**Scenario A: MediaRecorder Internal Error**
- MediaRecorder encountered internal issue during recording
- `onerror` handler triggered (lines 185-189)
- Automatically called `stopRecording()`
- Created blob, but Deepgram couldn't detect speech

**Scenario B: Valid Blob, No Speech**
- Recording was technically valid (> 100 bytes)
- User clicked "Done" quickly
- Blob contained audio data, but no intelligible speech
- Deepgram API returned 500: "No speech detected"
- This is a **definitive failure**, not a network error
- Retry logic shouldn't apply to this type of error

---

### Problem 3: Retry Logic for Non-Retryable Errors

**File:** `useClipRecording.ts`  
**Lines:** 344-372

```typescript
// Determine if we should retry
const isTimeout = error instanceof Error && error.name === 'AbortError';
const isNetworkError = error instanceof TypeError;
const shouldRetry = isTimeout || isNetworkError;

if (shouldRetry) {
  // Retry logic...
}
```

**Current Behavior:**
- Only retries on timeout (`AbortError`) or network errors (`TypeError`)
- Server 500 errors throw `Error`, not `TypeError`
- So server errors → definitive failure → `setTranscriptionError(errorMessage)`

**The Issue:**
- Server 500 "No speech detected" is correctly classified as definitive failure ✅
- BUT auto-transcribe useEffect has no protection against re-triggering after this ❌
- Toast appears, dismisses, function recreates, effect re-triggers, toast appears again...

---

## 🛠️ Proposed Solutions

### Solution 1: Add Transcription Error Guard (CRITICAL)

**File:** `ClipMasterScreen.tsx`  
**Lines:** 618-622

**Current Code:**
```typescript
useEffect(() => {
  if (audioBlob && !isTranscribing && !transcription && recordNavState === 'processing') {
    transcribeRecording();
  }
}, [audioBlob, isTranscribing, transcription, recordNavState, transcribeRecording]);
```

**Fixed Code:**
```typescript
// Store transcribeRecording in a ref to prevent re-triggers from function recreation
const transcribeRef = useRef(transcribeRecording);
useEffect(() => {
  transcribeRef.current = transcribeRecording;
}, [transcribeRecording]);

// Use stable ref in effect with error guard
useEffect(() => {
  if (
    audioBlob && 
    !isTranscribing && 
    !transcription && 
    !transcriptionError &&  // ← NEW GUARD: Don't retry after definitive failure
    recordNavState === 'processing'
  ) {
    transcribeRef.current();
  }
}, [audioBlob, isTranscribing, transcription, transcriptionError, recordNavState]);
//                                         ^^^^^^^^^^^^^^^^^^^ ADD THIS DEPENDENCY
```

**Why This Works:**
1. `!transcriptionError` guard prevents auto-retry after definitive failure
2. `useRef` stores stable function reference, avoiding unnecessary re-triggers
3. `transcriptionError` in dependencies ensures effect respects error state changes

---

### Solution 2: Clear Error State When Starting New Recording

**File:** `ClipMasterScreen.tsx`  
**Function:** `handleRecordClick`

**Add to beginning of function (around line 630):**
```typescript
const handleRecordClick = useCallback(async () => {
  // Clear any previous error states
  setShowErrorToast(false);
  setShowAudioToast(false);
  setTranscriptionError(null);  // Ensure clean state for new recording
  
  // ... rest of existing logic
```

**Why This Works:**
- Ensures stale error state doesn't interfere with new recording
- Provides clean slate for each recording attempt
- Prevents confusion from previous error toasts

---

### Solution 3: Clear Retry State When Starting New Recording

**File:** `useClipRecording.ts`  
**Lines:** 104-109

**Already Implemented ✅:**
```typescript
// Reset previous state
setError(null);
setAudioBlob(null);
setTranscription('');
setTranscriptionError(null);  // ← Already clears error
chunksRef.current = [];
```

**Additional Safety:** Already handled in hook's `startRecording()` function.

---

## 📊 Impact Analysis

### What Gets Fixed

| Issue | Status | Solution |
|-------|--------|----------|
| Infinite error toast loop | 🔥 **CRITICAL** | Solution 1 (error guard) |
| Function recreation triggers | 🔥 **CRITICAL** | Solution 1 (useRef) |
| Stale error state between recordings | ⚠️ **IMPORTANT** | Solution 2 (clear errors) |
| Recording abruptly stopping | ℹ️ **INFORMATIONAL** | Expected behavior for invalid audio |

### Expected Behavior After Fix

**Scenario: Recording with No Speech**
1. User records audio with no detectable speech
2. Clicks "Done"
3. Transcription attempts once
4. Deepgram returns 500: "No speech detected"
5. Error toast displays once
6. Toast auto-dismisses after 3 seconds
7. **No re-trigger** ✅
8. User can start new recording (error state cleared)

**Scenario: Network Timeout**
1. User records audio while offline
2. Clicks "Done"
3. Transcription times out (30s)
4. Retry logic engages (rapid attempts 1-3, then intervals)
5. Each retry is intentional, not a loop bug ✅

---

## 🧪 Testing Checklist

After implementing fixes, test these scenarios:

### Test 1: No Speech Detected
- [ ] Record valid-length audio with no speech
- [ ] Click "Done"
- [ ] Error toast appears once
- [ ] Toast auto-dismisses
- [ ] No additional toasts appear
- [ ] Can start new recording without issues

### Test 2: Very Short Audio
- [ ] Record < 1 second of audio
- [ ] Click "Done"
- [ ] "Recording too short" error appears
- [ ] Error appears once, no loop

### Test 3: Network Failure
- [ ] Go offline
- [ ] Record and submit
- [ ] Verify retry logic works (rapid attempts, then intervals)
- [ ] Verify this is intentional, not a loop bug

### Test 4: Starting New Recording After Error
- [ ] Trigger any error
- [ ] Start new recording
- [ ] Verify error state is cleared
- [ ] Verify new recording works normally

### Test 5: Multiple Recordings in Sequence
- [ ] Record successfully
- [ ] Record with error
- [ ] Record successfully again
- [ ] Verify no state interference between recordings

---

## 🎯 Implementation Priority

### Phase 1: Critical Fix (IMMEDIATE)
**Implement Solution 1** - Add error guard to auto-transcribe useEffect
- Prevents infinite loop
- Zero risk of breaking existing functionality
- Can deploy immediately

### Phase 2: Safety Enhancement
**Implement Solution 2** - Clear error state in handleRecordClick
- Improves UX between recordings
- Low risk

### Phase 3: Testing
- Run all test scenarios
- Monitor for edge cases

---

## 📝 Code Changes Summary

### Files Modified

1. **`ClipMasterScreen.tsx`**
   - Add `transcribeRef` for stable function reference
   - Update auto-transcribe useEffect with error guard
   - Clear error toasts in `handleRecordClick`

### Lines Changed

- Lines 618-622: Auto-transcribe useEffect (add guard)
- Lines ~630-650: `handleRecordClick` (add error clearing)
- New lines: `transcribeRef` declaration and sync useEffect

### Risk Assessment

- **Risk Level:** LOW
- **Breaking Changes:** NONE
- **Backward Compatibility:** ✅ Full
- **Testing Required:** Manual testing of error scenarios

---

## 🚀 Deployment Notes

### Before Deployment
1. Review error handling logic in `useClipRecording.ts`
2. Ensure all error states have proper cleanup paths
3. Test offline scenario separately from "no speech" scenario

### After Deployment
1. Monitor console logs for retry patterns
2. Watch for any new edge cases
3. Confirm toast behavior is single-show, not looping

---

## 📚 Related Documentation

- `recording_architecture.md` - Overall offline-first architecture
- `recording_retry_implementation.md` - Retry scheduling logic
- `recording_RETRY.md` - Retry behavior specification
- `useClipRecording.ts` lines 255-387 - Transcription & retry logic
- `ClipMasterScreen.tsx` lines 986-1081 - Error handling useEffect

---

## ✅ Resolution Checklist

- [ ] Implement Solution 1 (error guard)
- [ ] Implement Solution 2 (clear errors on new recording)
- [ ] Test all 5 scenarios
- [ ] Verify no console errors
- [ ] Verify logger output is clean
- [ ] Confirm with user that issue is resolved
- [ ] Document any additional findings

