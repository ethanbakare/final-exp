# 004 v2: Hook Coordination Analysis

**Date:** December 24, 2025  
**Status:** Planning - Needs Implementation  
**Related:** 004_extract_offline_retry_hook.md, 005_analysis_offline_retry_hook.md

---

## Summary

After extracting offline/retry logic into `useOfflineRetry`, we identified two architectural gaps where the hooks don't coordinate properly.

---

## Current Architecture

```
useClipRecording (manages current transcription attempt)
    ├── transcribeRecording() - API call + internal retry logic
    ├── forceRetry() - cancels timer, restarts immediately
    └── retryTimerRef - internal timer for interval retries
        ↓
useOfflineRetry (manages historical clips from storage)
    ├── handleOnline() - triggers transcribeRecording for pending clips
    ├── handleRetryTranscription() - manual retry, calls transcribeRecording
    └── handleSmartRetry() - routes to forceRetry or handleRetryTranscription
```

**Key insight:** `useOfflineRetry` already uses `useClipRecording`'s functions. They talk to each other through:
- `transcribeRecording(blob)` - passed as prop
- `forceRetry()` - passed as prop

---

## Gap 1: No Pending Clip During Interval Retry

### Problem

When **online but network is flaky**:
1. Recording finishes, transcription attempted
2. Fails 3 times (rapid retries)
3. Enters interval mode (1, 2, 4, 5 min waits)
4. **No pending clip is created** - user doesn't see their recording is saved

When **offline**:
1. Recording finishes
2. `transcriptionError === 'offline'` triggers
3. Pending clip IS created with `status='pending'` and `audioId`

### Why This Matters

During interval wait:
- User doesn't know their recording is safe
- User can't tap-to-retry (no clip to tap)
- `useOfflineRetry` can't manage it (no clip with `audioId`)

### Fix

When entering interval mode (line 333 in `useClipRecording`), trigger the same pending clip creation as offline:

**Option A:** Set `transcriptionError = 'network-retry'` which ClipMasterScreen handles alongside `'offline'`

**Option B:** Have `useClipRecording` directly call a passed-in callback like `onEnterIntervalMode()`

**Recommended:** Option A - simpler, uses existing patterns

---

## Gap 2: Missing Timer Cancellation

### Problem

`transcribeRecording()` does NOT cancel existing retry timers:

```typescript
// Current code (line 232+)
const transcribeRecording = useCallback(async (blobOverride?: Blob) => {
  // No timer cancellation here!
  const blobToUse = blobOverride || audioBlob;
  // ...
});
```

But `forceRetry()` DOES cancel:

```typescript
// Current code (line 370+)
const forceRetry = useCallback(() => {
  if (retryTimerRef.current) {
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  }
  // ...
});
```

### Why This Matters

If `useOfflineRetry.handleRetryTranscription()` calls `transcribeRecording(blob)`:
- The existing interval timer is still running
- Both could fire simultaneously → clash

### Fix

Add timer cancellation at the start of `transcribeRecording()`:

```typescript
const transcribeRecording = useCallback(async (blobOverride?: Blob) => {
  // Cancel any pending retry timer (prevents clash with external calls)
  if (retryTimerRef.current) {
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  }
  
  const blobToUse = blobOverride || audioBlob;
  // ... rest unchanged
});
```

---

## Edge Cases Covered After Fixes

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Offline recording | ✅ Pending clip created | ✅ Same |
| Online, 3 failures, entering interval | ❌ No clip visible | ✅ Pending clip created |
| Going offline during interval wait | ❌ Possible clash | ✅ Timer cancelled |
| Coming back online while interval timer scheduled | ❌ Both try to transcribe | ✅ Timer cancelled |
| Manual tap-to-retry during interval wait | ✅ forceRetry cancels | ✅ Same |
| App opens with pending clips while online | ❌ No auto-retry | ⚠️ Still needs fix (separate issue) |

---

## Implementation Order

1. **Add timer cancellation to `transcribeRecording()`** - Low risk, prevents clashes
2. **Add `'network-retry'` error state** - Creates pending clip when entering interval mode
3. **Handle `'network-retry'` in ClipMasterScreen** - Same as `'offline'` but different toast message
4. **Test full flow** - Online flaky → interval → pending clip → manual retry

---

## Files to Modify

| File | Change |
|------|--------|
| `useClipRecording.ts` | Add timer cancellation at start of `transcribeRecording()` |
| `useClipRecording.ts` | Set `transcriptionError = 'network-retry'` when entering interval mode |
| `ClipMasterScreen.tsx` | Handle `'network-retry'` same as `'offline'` in useEffect |

---

## Notes

- The hooks don't need to be merged - they have clear responsibilities
- They coordinate through shared functions (`transcribeRecording`, `forceRetry`)
- The gaps are in **state signaling**, not function calls
- Fixes use existing patterns (error states, timer refs)
