# 001 Recording Offline Fix Plan Analysis

**Date:** December 24, 2025  
**Purpose:** Independent analysis of the proposed fixes in `recording_offline_fix_plan.md`

---

## Summary

| Fix | Verdict | Notes |
|-----|---------|-------|
| 1 | ✅ Correct (Already implemented) | `getNextRecordingNumber()` added |
| 2 | ✅ Correct (Already implemented) | Timer uses `clip.duration` |
| 3 | ⚠️ Debug first | Need to verify `handleOnline` fires |
| 4 | ✅ Correct | `handleSmartRetry` doesn't handle `'pending'` |
| 5 | ⚠️ Investigate | `isActiveRequest` may not be set for background retries |

---

## Fix 3: handleOnline Analysis

### What the code does (lines 395-440)

```typescript
const handleOnline = useCallback(async () => {
  // Skip if recording in progress
  if (isRecording) return;
  
  // Find clips with audioId AND (pending OR failed)
  const pendingClips = allClips.filter(c =>
    c.audioId && (c.status === 'pending' || c.status === 'failed')
  );
  
  // For each, update status and transcribe
  for (const clip of pendingClips) {
    updateClip(clip.id, { status: 'transcribing' });
    const audioBlob = await getAudio(clip.audioId!);
    await transcribeRef.current?.(audioBlob);
  }
}, [...]);
```

### The logic is sound, BUT:

1. **Not tested in production** - We don't know if `window.addEventListener('online', handleOnline)` actually fires when you toggle WiFi/airplane mode
2. **Sequential processing** - Retries happen one at a time, not in parallel
3. **No error isolation** - If one clip fails, does it stop the loop?

### Recommendation

Add debug logs first (as the plan suggests), then test manually before assuming it works.

---

## Fix 4: handleSmartRetry Analysis

### Current code (lines 595-617)

```typescript
const handleSmartRetry = useCallback((clipId: string) => {
  const clip = clips.find(c => c.id === clipId);
  
  if (clip.status === 'transcribing' && !isActiveRequest && currentClipId === clipId) {
    forceRetry();  // Skip wait period
  } else if (clip.status === 'failed') {
    handleRetryTranscription(clipId);
  } else {
    log.warn('Cannot retry: invalid state');  // ← PENDING CLIPS END UP HERE
  }
}, [...]);
```

### The problem

When user taps a **pending** ClipOffline:
- `status` is `'pending'` (not `'transcribing'`)
- `status` is `'pending'` (not `'failed'`)
- Falls through to warning log
- **Nothing happens**

### The proposed fix is correct

```typescript
} else if (clip.status === 'failed' || clip.status === 'pending') {
  handleRetryTranscription(clipId);
}
```

This allows manual retry for both failed AND pending clips.

### isTappable condition

Current (line 227):
```typescript
isTappable={clip.status === 'transcribing' && !clip.isActiveRequest}
```

Proposed:
```typescript
isTappable={clip.status === 'waiting' || (clip.status === 'transcribing' && !clip.isActiveRequest)}
```

**Note:** The status mapping in `clipToPendingClip` (line 390):
```typescript
status: clip.status === 'transcribing' ? 'transcribing' : 'waiting',
```

Both `'pending'` and `'failed'` map to `'waiting'`, so the fix makes both tappable.

---

## Fix 5: Icon Spinning Analysis

### How spinning is controlled

1. `isActiveRequest` comes from `useClipRecording` hook
2. Passed to `ClipOffline` component via `clip.isActiveRequest`
3. `ClipOffline` uses this to determine if icon should spin

### Concern: Background retries

In `handleOnline`, after calling `transcribeRef.current?.(audioBlob)`:
- Does this set `isActiveRequest = true` in the hook?
- Or does background retry bypass the normal state updates?

Looking at `clipToPendingClip` (line 391):
```typescript
isActiveRequest: isActiveRequest  // Uses hook's isActiveRequest
```

But `isActiveRequest` is a single boolean for the CURRENT active transcription. If you have multiple pending clips and they're being processed in background, only one can be "active" at a time.

### Potential issue

When viewing a clip that's being background-retried:
- The clip's `status` is `'transcribing'`
- But `isActiveRequest` might be `false` if it's not the "current" clip in the hook's context
- Icon might not spin

### Recommendation

Test this flow:
1. Record offline
2. Navigate away from the pending clip
3. Come back online
4. Observe if spinner activates

---

## Additional Observations

### 1. Status terminology confusion

| Clip.status | PendingClip.status | Meaning |
|-------------|-------------------|---------|
| `'pending'` | `'waiting'` | Recorded offline, waiting for network |
| `'transcribing'` | `'transcribing'` | Currently being sent to Deepgram |
| `'failed'` | `'waiting'` | Transcription failed, needs retry |
| `null` | N/A | Successfully transcribed |

This mapping happens in `clipToPendingClip` and can be confusing when debugging.

### 2. currentClipId vs selectedPendingClip

- `currentClipId`: The clip being actively recorded/transcribed
- `selectedPendingClip`: A pending clip being viewed (not recorded in this session)

These serve different purposes but both affect what's displayed on RecordScreen.

### 3. Where tapping happens

- **HomeScreen (ClipHomeScreen)**: Shows clip FILE list. Tapping navigates INTO a clip.
- **RecordScreen (ClipRecordScreen)**: Shows transcribed text + pending ClipOffline components. Tapping a ClipOffline triggers retry.

---

## Implementation Order Recommendation

1. **Fix 3 first** - Add debug logs to `handleOnline` and test
2. **Fix 4** - Add `'pending'` to `handleSmartRetry` and update `isTappable`
3. **Fix 5** - Test spinner behavior after Fix 3 & 4 are working

Fixes 4 and 5 depend on understanding if Fix 3 even works, so start there.
