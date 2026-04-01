# 'Failed' Status Audit - Complete Analysis

**Date**: January 7, 2026
**Purpose**: Investigate whether 'failed' status is needed with continuous retry architecture
**User's Question**: "You can never fail because literally it's either when you come back online, the thing finally gets transcribed, right?"

---

## Executive Summary

**YOU ARE CORRECT** - The 'failed' status is **MISUSED** throughout the codebase.

With continuous retry (like Dropbox sync), transcription should **NEVER** permanently fail. The only things that can truly fail are:
1. **User-initiated cancellation** (debatable if this should even set 'failed')
2. **Formatting API** (acceptable - just show raw text)

All current uses of 'failed' for transcription errors should be replaced with **'pending-retry'** (continuous retry) or **'audio-corrupted'** (permanent audio storage error).

---

## All 'Failed' Status Usage in ClipMasterScreen.tsx

### ✅ VALID USE #1: User Cancellation (Line 421)

**Code**:
```typescript
// Context 2: Clip is processing (transcribing or formatting)
if (recordNavState === 'processing') {
  // Cancel the processing (if AbortController exists)
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();  // Cancel HTTP requests
  }

  // If clip was created (has ID), mark as failed
  if (currentClipId) {
    const clip = getClipById(currentClipId);
    if (clip && (clip.status === 'transcribing' || clip.status === 'formatting')) {
      updateClip(currentClipId, { status: 'failed' });  // ← LINE 421
    }
  }
}
```

**Trigger**: User clicks close button (❌) while clip is processing

**Analysis**:
- ✅ **Valid** - User explicitly canceled the operation
- ⚠️ **Debatable** - Should this be 'pending-retry' instead? User might want to resume later
- 💡 **Recommendation**: Keep as 'failed' OR create new status 'canceled' for user-initiated cancellations

---

### ❌ INVALID USE #2: Manual Retry Error (Line 743)

**Code**:
```typescript
try {
  await transcribeRecording(audioBlob);
  // Success - transcription will be handled by existing useEffect
} catch (error) {
  log.error('Retry failed', { clipId, error });

  updateClipById(clipId, {
    status: 'failed',  // ← LINE 743
    transcriptionError: error instanceof Error ? error.message : 'Retry failed'
  });
  setRecordNavState('record');
}
```

**Trigger**: Manual retry (tap to retry) fails with error

**Analysis**:
- ❌ **WRONG** - This should use continuous retry, not permanent failure
- 🔄 **Should be**: `status: 'pending-retry'` with next retry scheduled
- 📝 **Reasoning**: Network/server errors are temporary, should retry automatically

---

### ❌ INVALID USE #3: Audio Not Found (Line 1002)

**Code**:
```typescript
try {
  // Step 1: Get audio from IndexedDB
  const audioBlob = await getAudio(child.audioId!);
  if (!audioBlob) {
    console.warn('[ProcessChild] Audio not found for:', child.id);
    updateClip(child.id, {
      status: 'failed',  // ← LINE 1002
      transcriptionError: 'Audio not found in storage'
    });
    return { success: false, rawText: '', formattedText: '' };
  }
```

**Trigger**: Audio blob missing from IndexedDB during auto-retry

**Analysis**:
- ❌ **WRONG** - This is exactly what `'audio-corrupted'` status is for!
- 🔧 **Should be**: `status: 'audio-corrupted'`
- 📝 **Reasoning**: Permanent storage error (audio can't be retrieved, no point retrying)

---

### ❌ INVALID USE #4: Transcription Failed (Line 1024)

**Code**:
```typescript
const transcriptionResult = await transcribeRecording(audioBlob);
const { text: rawText, error: transcriptionError } = transcriptionResult;

if (!rawText || rawText.length === 0) {
  console.warn('[ProcessChild] Transcription failed:', child.pendingClipTitle);
  updateClip(child.id, {
    status: 'failed',  // ← LINE 1024
    transcriptionError: transcriptionError === 'validation'
      ? `No audio detected in ${child.pendingClipTitle}`
      : 'Transcription failed'
  });
  return { success: false, rawText: '', formattedText: '' };
}
```

**Trigger**: Transcription returns empty text (API error, network error, validation error)

**Analysis**:
- ❌ **WRONG** - Transcription errors are ALWAYS retryable
- 🔄 **Should be**: `status: 'pending-retry'` with continuous retry
- 📝 **Reasoning**: Even validation errors might be transient (API glitch, network packet loss, etc.)

---

### ❌ INVALID USE #5: Generic Child Processing Error (Line 1059)

**Code**:
```typescript
} catch (error) {
  console.error('[ProcessChild] Error:', child.pendingClipTitle, error);
  updateClip(child.id, {
    status: 'failed',  // ← LINE 1059
    transcriptionError: error instanceof Error ? error.message : 'Unknown error'
  });
  return { success: false, rawText: '', formattedText: '' };
}
```

**Trigger**: Unexpected error during child processing (transcribe + format)

**Analysis**:
- ❌ **WRONG** - Unknown errors should retry (might be transient)
- 🔄 **Should be**: `status: 'pending-retry'` with continuous retry
- 📝 **Reasoning**: "Unknown error" = retry is worth attempting

---

### ❌ INVALID USE #6: Transcription Error in useEffect (Line 1285)

**Code**:
```typescript
useEffect(() => {
  if (transcriptionError && transcriptionError !== 'offline' && transcriptionError !== 'network-retry') {
    // Definitive failure (not offline or network-retry)
    log.error('Definitive transcription failure', { error: transcriptionError });

    // Save audioId, duration, and error with clip for manual retry
    if (audioId && currentClipId) {
      updateClipById(currentClipId, {
        audioId: audioId,
        duration: formatDuration(duration),
        status: 'failed',  // ← LINE 1285
        transcriptionError: transcriptionError
      });
    }
```

**Trigger**: Transcription error that's not 'offline' or 'network-retry' (e.g., 'validation', 'server-error')

**Analysis**:
- ❌ **WRONG** - Even "definitive" errors should retry with continuous retry pattern
- 🔄 **Should be**: `status: 'pending-retry'` with continuous retry
- 📝 **Reasoning**:
  - 'validation' error might be API glitch
  - 'server-error' is temporary (API will recover)
  - Only truly permanent error is 'audio-corrupted'

---

## What About Formatting API Failures?

**Current Code**: No 'failed' status set for formatting errors

**formatTranscriptionInBackground** (Lines 899-913):
```typescript
} catch (error) {
  console.error('[Formatting] Error formatting clip:', clipId, '| Error:', error);
  // Fallback: use raw text as formatted
  updateClip(clipId, {
    formattedText: clip.rawText,
    content: clip.rawText,
    status: null  // ← Sets to COMPLETE with fallback
  });
```

**Analysis**:
- ✅ **Correct approach** - Formatting failure is acceptable
- 💡 **User's quote**: "If the formatting API fails, you just basically get the thing as it is, that's fine."
- 📝 **No change needed** - Falls back to raw text, marks as complete

---

## Summary Table

| Line | Location | Current Use | Should Be | Reasoning |
|------|----------|-------------|-----------|-----------|
| 421 | handleCloseClick | User cancellation → `'failed'` | ✅ Keep OR `'canceled'` | User explicitly stopped it |
| 743 | handleRetryTranscription | Retry error → `'failed'` | ❌ `'pending-retry'` | Network/API errors are retryable |
| 1002 | processChild | Audio not found → `'failed'` | ❌ `'audio-corrupted'` | Permanent storage error |
| 1024 | processChild | Transcription empty → `'failed'` | ❌ `'pending-retry'` | API/network errors are retryable |
| 1059 | processChild | Unknown error → `'failed'` | ❌ `'pending-retry'` | Unknown errors should retry |
| 1285 | useEffect | "Definitive" error → `'failed'` | ❌ `'pending-retry'` | Even validation errors should retry |

---

## Recommended Actions

### 1️⃣ CRITICAL: Remove 'failed' Status from Transcription Errors

**Replace ALL transcription-related 'failed' with**:
```typescript
// WRONG (current code)
status: 'failed'

// RIGHT (continuous retry)
status: 'pending-retry',
lastError: 'api-down',  // or 'network', 'validation', etc.
nextRetryTime: Date.now() + retryInterval,
retryCount: (clip.retryCount || 0) + 1
```

**Locations**: Lines 743, 1024, 1059, 1285

---

### 2️⃣ CRITICAL: Fix Audio Storage Errors

**Replace audio-not-found 'failed' with 'audio-corrupted'**:
```typescript
// WRONG (current code - line 1002)
status: 'failed',
transcriptionError: 'Audio not found in storage'

// RIGHT (permanent storage error)
status: 'audio-corrupted',
transcriptionError: 'Audio file could not be retrieved from storage'
```

**Location**: Line 1002

---

### 3️⃣ OPTIONAL: Rename User Cancellation

**Consider creating 'canceled' status**:
```typescript
// Current (line 421)
if (clip && (clip.status === 'transcribing' || clip.status === 'formatting')) {
  updateClip(currentClipId, { status: 'failed' });
}

// Alternative (more semantic)
if (clip && (clip.status === 'transcribing' || clip.status === 'formatting')) {
  updateClip(currentClipId, { status: 'canceled' });  // New status
}
```

**Benefit**: Distinguishes user action from system failure

---

### 4️⃣ OPTIONAL: Remove 'failed' from ClipStatus Type

**After fixes above, 'failed' might not be needed at all**:
```typescript
// Current (clipStore.ts line 10-16)
export type ClipStatus =
  | null
  | 'transcribing'
  | 'formatting'
  | 'pending-child'
  | 'pending-retry'
  | 'audio-corrupted'
  | 'failed';  // ← Remove if not used

// Alternative
export type ClipStatus =
  | null
  | 'transcribing'
  | 'formatting'
  | 'pending-child'
  | 'pending-retry'
  | 'audio-corrupted'
  | 'canceled';  // ← Add if implementing user cancellation
```

---

## Continuous Retry Architecture (043_v3)

**How it works** (per 043_v3_FINAL_CORRECTED.md):
1. **Rapid attempts 1-3**: Try immediately, no waits
2. **Interval phase**: 1min → 2min → 4min → 5min (repeat forever)
3. **Never stops**: Retries continue indefinitely like Dropbox sync
4. **No max attempts**: System keeps trying until success or user deletes

**What this means**:
- **Transcription errors**: `status: 'pending-retry'` (will retry automatically)
- **Network errors**: `status: 'pending-retry'` (will retry when online)
- **API errors**: `status: 'pending-retry'` (will retry when API recovers)
- **Audio storage errors**: `status: 'audio-corrupted'` (ONLY permanent error)

---

## Conclusion

**Your intuition is 100% correct**:
> "You can never fail because literally it's either when you come back online, the thing finally gets transcribed"

**The 'failed' status is overused and contradicts the continuous retry architecture.**

**Action Items**:
1. Replace all transcription 'failed' with 'pending-retry'
2. Replace audio-not-found 'failed' with 'audio-corrupted'
3. Consider removing 'failed' entirely OR rename to 'canceled' for user actions
4. Update 043_v3_FINAL_CORRECTED.md to reflect these changes

---

**END OF AUDIT**
