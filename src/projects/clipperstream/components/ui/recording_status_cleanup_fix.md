# Status Cleanup Bug Fix

## Issue

After successful transcription, the clip's `status` field remains stuck at `"transcribing"` instead of being cleared to `null`. This causes the home screen to incorrectly show "Transcribing..." next to clips that have already been fully transcribed.

---

## Evidence from SessionStorage

```json
{
  "id": "clip-1766103644441-cc0v4byhn",
  "title": "Perseverance in Personal Growth Journey",  // ← Title generated = SUCCESS
  "content": "Okay. I'm going to test making a recording...",  // ← Content exists = SUCCESS
  "audioId": "audio-1766103643048-210e6kvzy",  // ← Should be deleted
  "status": "transcribing"  // ← BUG: Should be null
}
```

Transcription succeeded (title + content present) but cleanup never ran.

---

## Root Cause

**File:** `ClipMasterScreen.tsx`
**Lines:** 903-940

```typescript
// Delete audio 10 seconds after successful transcription
useEffect(() => {
  if (recordNavState === 'complete' && audioId && currentClipId) {
    const deleteTimer = setTimeout(async () => {
      updateClip(currentClipId, {
        audioId: undefined,
        status: null  // ← Status cleared here
      });
    }, 10000);
    
    return () => clearTimeout(deleteTimer);  // ← PROBLEM: Cancels on unmount
  }
}, [recordNavState, audioId, currentClipId]);
```

**Why it fails:**
1. User navigates away from record screen (goes to home)
2. React unmounts the component
3. Cleanup function runs: `clearTimeout(deleteTimer)`
4. The 10-second delay never completes
5. Status is never cleared

---

## The Fix

Clear status **immediately when transcription succeeds**, not in a delayed effect that can be cancelled.

### Where to Fix

**File:** `ClipMasterScreen.tsx`

Look for where transcription result is processed and the clip is updated with title/content. Status should be cleared in the same operation.

### Search for

```typescript
// Find these patterns:
updateClip(clipId, {
  title: generatedTitle,
  content: transcribedText,
  // ADD: status: null
});
```

### Proposed Solution

**Clear status AND delete audio immediately when transcription succeeds.**

Find where transcription result is saved (title/content) and add:

```typescript
// After saving transcription result successfully:
updateClip(newClipId, {
  title: generatedTitle,
  content: transcription,
  formattedText: formattedResult,
  rawText: transcription,
  status: null,       // ← Clear status immediately
  audioId: undefined  // ← Clear audioId reference
});

// Delete audio from IndexedDB immediately
// NOTE: Previously used 10-second delay in a useEffect, but that caused status
// to remain stuck at 'transcribing' if user navigated away before timer completed.
// Immediate deletion is simpler and avoids the race condition.
await deleteAudio(audioId);
```

### Remove Old Cleanup Effect

The useEffect at lines 903-940 that handled the 10-second delay can be removed entirely since cleanup now happens immediately on success.

```typescript
// REMOVE THIS ENTIRE EFFECT:
// useEffect(() => {
//   if (recordNavState === 'complete' && audioId && currentClipId) {
//     const deleteTimer = setTimeout(async () => {
//       // ... was here for 10-second delay
//     }, 10000);
//     return () => clearTimeout(deleteTimer);
//   }
// }, [recordNavState, audioId, currentClipId]);
```

---

## Test After Fix

1. Record something online
2. Wait for transcription to complete (title appears)
3. Navigate to home screen immediately (don't wait 10 seconds)
4. **Expected:** No "Transcribing..." text shown
5. Check sessionStorage: `status` should be `null`
