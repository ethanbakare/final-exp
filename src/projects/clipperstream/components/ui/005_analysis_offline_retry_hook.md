# 005 Analysis: Offline Retry Hook Extraction

**Date:** December 24, 2025  
**Analyzes:** `004_extract_offline_retry_hook.md`  
**Verdict:** Good direction, but has gaps that need addressing

---

## Summary of Findings

| Category | Status | Notes |
|----------|--------|-------|
| **Line numbers** | ⚠️ Outdated | Several functions have moved since plan was written |
| **Dependency list** | ⚠️ Incomplete | Missing `setIsAppendMode`, `setRecordNavState` |
| **Hook interface** | ⚠️ Over-simplified | Doesn't account for all state mutations |
| **handleSmartRetry** | ❌ Bug unfixed | Still doesn't handle `'pending'` status |
| **Offline handler** | ✅ Correct call | Correctly recommends keeping in ClipMasterScreen |

---

## Issue 1: Outdated Line Numbers

The plan references outdated line numbers:

| Function | Plan Says | Actual |
|----------|-----------|--------|
| `clipToPendingClip` | lines 395-415 | lines 394-415 (~correct) |
| `handleOnline` | lines 418-510 | lines 417-507 (~correct) |
| `handleRetryTranscription` | lines 557-625 | lines 556-626 (~correct) |
| `handleSmartRetry` | lines 628-652 | lines 628-652 ✅ |
| Network listeners | lines 515-522 | lines 509-522 |
| Offline handler | lines 1078-1130 | lines 1078-1135 |

**Impact:** Minor - developers can find the correct code.

**Fix:** Update line numbers before implementation.

---

## Issue 2: Incomplete Dependency List

The proposed hook interface (lines 101-110):

```typescript
interface UseOfflineRetryOptions {
  clips: Clip[];
  isRecording: boolean;
  isActiveRequest: boolean;
  currentClipId: string | null;
  transcribeRecording: (blob: Blob) => Promise<void>;
  forceRetry: () => void;
  refreshClips: () => void;
  setCurrentClipId: (id: string | null) => void;
}
```

**Missing dependencies:**

| Missing | Used In | Why Needed |
|---------|---------|------------|
| `setIsAppendMode` | `handleRetryTranscription` (line 585) | Sets `setIsAppendMode(false)` |
| `setRecordNavState` | `handleRetryTranscription` (lines 586, 624) | Sets to `'processing'` or `'record'` |

**Impact:** High - the hook won't compile if these aren't passed.

**Fix:** Add to interface:
```typescript
setIsAppendMode: (mode: boolean) => void;
setRecordNavState: (state: RecordNavState) => void;
```

---

## Issue 3: handleSmartRetry Bug Not Fixed

The plan extracts `handleSmartRetry` as-is (lines 628-652), but the current code still has the bug we identified earlier:

```typescript
if (clip.status === 'transcribing' && !isActiveRequest && currentClipId === clipId) {
  forceRetry();
} else if (clip.status === 'failed') {  // ← Missing 'pending'!
  handleRetryTranscription(clipId);
} else {
  log.warn('Cannot retry: invalid state');  // Pending clips end up here
}
```

**Impact:** High - pending clips still won't be tappable for retry.

**Fix:** Before extracting, fix the condition:
```typescript
} else if (clip.status === 'failed' || clip.status === 'pending') {
```

---

## Issue 4: Network Listener Placement

The plan says to extract network listeners (lines 509-522), but it's unclear whether they should:

1. Stay in ClipMasterScreen (using the hook's `handleOnline`)
2. Move into the hook itself

Current code:
```typescript
useEffect(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => { ... };
}, [handleOnline]);
```

**The plan doesn't address this clearly.**

**My recommendation:** Keep event listeners in ClipMasterScreen. The hook should just export `handleOnline`, and the consumer (ClipMasterScreen) decides when to wire it up.

---

## Issue 5: Stale Closure Risk

The plan mentions "Stale closures - Low likelihood" but doesn't elaborate.

**Actual risk:** `clipToPendingClip` calls `getClips()` directly:
```typescript
const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
  const allClips = getClips();  // Fresh read from localStorage
  // ...
}, [isActiveRequest]);  // Only depends on isActiveRequest!
```

This is actually **safe** because `getClips()` reads from localStorage, not React state. But it's worth documenting why this pattern is used.

---

## Issue 6: Return Type Completeness

The proposed return type:
```typescript
interface UseOfflineRetryReturn {
  handleOnline: () => Promise<void>;
  handleRetryTranscription: (clipId: string) => Promise<void>;
  handleSmartRetry: (clipId: string) => void;
  clipToPendingClip: (clip: Clip) => PendingClip;
}
```

**This is correct.** All four functions are needed by ClipMasterScreen.

---

## Issue 7: Circular Dependency Risk

The hook needs `transcribeRecording` from `useClipRecording`:
```
ClipMasterScreen
  └── useClipRecording (provides transcribeRecording)
  └── useOfflineRetry (needs transcribeRecording)
```

**This is fine** - the hook receives it as a prop, no circular import.

---

## Recommendations

### Before implementing:

1. **Fix handleSmartRetry bug first** - Add `'pending'` to the status check
2. **Update dependency list** - Add `setIsAppendMode`, `setRecordNavState`
3. **Decide on event listeners** - Recommend keeping in ClipMasterScreen
4. **Update line numbers** - Minor but helps reviewers

### During implementation:

1. **Extract one function at a time** - Test after each extraction
2. **Keep network listeners last** - Least risk of breaking things
3. **Don't touch offline handler** - Keep in ClipMasterScreen as recommended

### After implementation:

1. **Test all scenarios** from the Testing Plan (lines 222-240)
2. **Verify no regressions** in online recording flow
3. **Check spinner behavior** - May still have isActiveRequest issues

---

## Alternative Approach

Instead of one big hook, consider three smaller hooks:

```typescript
// Hook 1: Just the pending clip transformation
function usePendingClipTransform(isActiveRequest: boolean) {
  return { clipToPendingClip };
}

// Hook 2: Network event handling
function useNetworkStatus(onOnline: () => void) {
  // Just the event listeners
}

// Hook 3: Retry logic
function useRetryLogic(opts: RetryOptions) {
  return { handleRetryTranscription, handleSmartRetry };
}
```

**Pros:** More modular, easier to test individually
**Cons:** More files, more imports

The single-hook approach in the plan is fine for now, but consider splitting if it grows further.

---

## Verdict

**The approach is fundamentally sound.** Extracting ~250 lines into a dedicated hook is the right architectural move. However:

1. **Don't implement until handleSmartRetry is fixed**
2. **Add missing dependencies to the interface**
3. **Keep event listeners in ClipMasterScreen**

With these adjustments, the refactor should be safe to proceed.
