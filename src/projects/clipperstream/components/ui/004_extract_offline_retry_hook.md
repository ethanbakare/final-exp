# 004 Extract Offline/Retry Logic to useOfflineRetry Hook

**Date:** December 24, 2025  
**Updated:** December 24, 2025 (per 005 analysis)  
**Priority:** High (Architectural)  
**Status:** Planning  
**Goal:** Reduce ClipMasterScreen from ~1400 lines by extracting ~250 lines of offline/retry logic

---

## Prerequisites (MUST DO BEFORE EXTRACTION)

### 1. Fix handleSmartRetry Bug First

**Current code (broken):**
```typescript
if (clip.status === 'transcribing' && !isActiveRequest && currentClipId === clipId) {
  forceRetry();
} else if (clip.status === 'failed') {  // ← Missing 'pending'!
  handleRetryTranscription(clipId);
} else {
  log.warn('Cannot retry: invalid state');  // Pending clips end up here
}
```

**Fix BEFORE extracting:**
```typescript
} else if (clip.status === 'failed' || clip.status === 'pending') {
  handleRetryTranscription(clipId);
}
```

### 2. Verify Network Listeners Stay in ClipMasterScreen

The hook exports `handleOnline`, but ClipMasterScreen keeps the event listeners:
```typescript
// ClipMasterScreen (NOT in hook)
useEffect(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => { /* cleanup */ };
}, [handleOnline]);
```

---

## Problem Statement

`ClipMasterScreen.tsx` is 1400+ lines and growing. Offline/retry logic is spread across multiple functions, making it hard to maintain and debug. This logic should be in a dedicated hook.

---

## Code to Extract from ClipMasterScreen

### Function 1: `clipToPendingClip` (lines 395-415, ~20 lines)
```typescript
const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
  // Transform Clip → PendingClip for display
  // Calculates "Clip XXX" numbering
});
```

### Function 2: `handleOnline` (lines 418-510, ~92 lines)
```typescript
const handleOnline = useCallback(async () => {
  // Auto-retry pending clips when network comes online
  // Finds clips with audioId and pending/failed status
  // Retrieves audio from IndexedDB
  // Calls transcribeRecording
});
```

### Function 3: `handleRetryTranscription` (lines 557-625, ~68 lines)
```typescript
const handleRetryTranscription = useCallback(async (clipId: string) => {
  // Manual retry from IndexedDB
  // Updates clip status
  // Retrieves audio and calls transcribeRecording
});
```

### Function 4: `handleSmartRetry` (lines 628-652, ~24 lines)
```typescript
const handleSmartRetry = useCallback((clipId: string) => {
  // Routes tap to correct handler
  // forceRetry() for active transcribing
  // handleRetryTranscription() for failed/pending
});
```

### Effect: Network listeners (lines 515-522, ~8 lines)
```typescript
useEffect(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => { /* cleanup */ };
}, [handleOnline]);
```

### Offline handler in useEffect (lines 1078-1130, ~52 lines)
```typescript
} else if (transcriptionError === 'offline') {
  // Save clip as pending
  // Store audioId
  // Update clip status
  // Show toast
}
```

**Total: ~264 lines to extract**

---

## New File Structure

### Create: `hooks/useOfflineRetry.ts`

```typescript
import { useCallback, useEffect, useRef } from 'react';
import { Clip, getClips, updateClip } from '../services/clipStorage';
import { getAudio } from '../services/audioStorage';
import { logger } from '../utils/logger';

const log = logger.scope('useOfflineRetry');

/* ============================================
   INTERFACES
   ============================================ */

interface PendingClip {
  id: string;
  title: string;
  time: string;
  status: 'waiting' | 'transcribing' | 'failed';
  isActiveRequest: boolean;
}

interface UseOfflineRetryOptions {
  clips: Clip[];
  isRecording: boolean;
  isActiveRequest: boolean;
  currentClipId: string | null;
  transcribeRecording: (blob: Blob) => Promise<void>;
  forceRetry: () => void;
  refreshClips: () => void;
  setCurrentClipId: (id: string | null) => void;
  // FIX from 005 analysis: Missing dependencies
  setIsAppendMode: (mode: boolean) => void;
  setRecordNavState: (state: RecordNavState) => void;
}

interface UseOfflineRetryReturn {
  handleOnline: () => Promise<void>;
  handleRetryTranscription: (clipId: string) => Promise<void>;
  handleSmartRetry: (clipId: string) => void;
  clipToPendingClip: (clip: Clip) => PendingClip;
}

/* ============================================
   HOOK
   ============================================ */

export function useOfflineRetry(options: UseOfflineRetryOptions): UseOfflineRetryReturn {
  const {
    clips,
    isRecording,
    isActiveRequest,
    currentClipId,
    transcribeRecording,
    forceRetry,
    refreshClips,
    setCurrentClipId,
    setIsAppendMode,
    setRecordNavState
  } = options;

  // ... all extracted functions here ...

  return {
    handleOnline,
    handleRetryTranscription,
    handleSmartRetry,
    clipToPendingClip
  };
}
```

---

## Dependencies to Pass

| Dependency | Type | Purpose |
|------------|------|---------|
| `clips` | `Clip[]` | Current clips list |
| `isRecording` | `boolean` | Skip retry if recording |
| `isActiveRequest` | `boolean` | For clipToPendingClip |
| `currentClipId` | `string \| null` | Current clip context |
| `transcribeRecording` | `(blob: Blob) => Promise<void>` | From useClipRecording |
| `forceRetry` | `() => void` | From useClipRecording |
| `refreshClips` | `() => void` | Update UI |
| `setCurrentClipId` | Function | Set clip context |
| `setIsAppendMode` | `(boolean) => void` | **ADDED per 005** - Used in handleRetryTranscription |
| `setRecordNavState` | `(RecordNavState) => void` | **ADDED per 005** - Used in handleRetryTranscription |

---

## Changes in ClipMasterScreen

### Before (current)
```typescript
// Lines 395-652: All retry functions defined inline
const clipToPendingClip = useCallback(...);
const handleOnline = useCallback(...);
const handleRetryTranscription = useCallback(...);
const handleSmartRetry = useCallback(...);
```

### After (refactored)
```typescript
import { useOfflineRetry } from '../hooks/useOfflineRetry';

// Single hook call replaces ~250 lines
const {
  handleOnline,
  handleRetryTranscription,
  handleSmartRetry,
  clipToPendingClip
} = useOfflineRetry({
  clips,
  isRecording,
  isActiveRequest,
  currentClipId,
  transcribeRecording,
  forceRetry,
  refreshClips,
  setCurrentClipId,
  setIsAppendMode,
  setRecordNavState
});
```

---

## Affected Components

| Component | Impact |
|-----------|--------|
| `ClipMasterScreen.tsx` | Removes ~250 lines, adds hook import |
| `ClipRecordScreen.tsx` | No change (receives functions via props) |
| `ClipHomeScreen.tsx` | No change (receives functions via props) |
| `ClipOffline.tsx` | No change (UI component) |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stale closures | Low | Proper useCallback dependencies |
| Missing dependencies | Medium | Thorough testing |
| Breaking existing UI | Low | No UI changes, just code relocation |
| Performance regression | Very Low | Same code, just moved |

---

## Testing Plan

### 1. Record Online → Transcribe
- Same behavior as before

### 2. Record Offline → Save Pending
- Audio saved to IndexedDB
- Clip shows "Clip 001" with pending status

### 3. Go Online → Auto-Retry
- handleOnline fires
- Transcription starts automatically

### 4. Tap Pending Clip → Manual Retry
- handleSmartRetry routes correctly
- Transcription starts

### 5. Multiple Pending Clips
- All retried when online
- Correct clip numbering

---

## Implementation Steps (Updated per 005 Analysis)

### Step 0: Fix handleSmartRetry Bug ⚠️ MUST DO FIRST
- Add `|| clip.status === 'pending'` to the status check
- Test that pending clips are now tappable

### Step 1: Create `useOfflineRetry.ts`
- Copy all identified functions
- Define interface with ALL dependencies (including setIsAppendMode, setRecordNavState)
- Export hook

### Step 2: Update `ClipMasterScreen.tsx`
- Import new hook
- Replace inline functions with hook call
- Remove old function definitions
- **KEEP network event listeners in ClipMasterScreen** (hook just exports handleOnline)

### Step 3: Keep Offline useEffect in ClipMasterScreen
- The offline handler at line 1078 stays in ClipMasterScreen
- It's tied to recording completion, not retry logic

### Step 4: Extract One Function at a Time
- Extract `clipToPendingClip` first (simplest)
- Test
- Extract `handleRetryTranscription`
- Test
- Extract `handleSmartRetry`
- Test
- Extract `handleOnline`
- Test

### Step 5: Final Testing
- Online recording
- Offline recording
- Auto-retry on reconnect
- Manual tap-to-retry

---

## Decision Point: Offline Handler

The offline handler at lines 1078-1130 is triggered by `transcriptionError === 'offline'` from the recording hook. It needs:
- `audioId` from recording
- `currentClipId` / `isAppendMode` context
- Access to `createClip` / `updateClip`

**Options:**
1. Keep in ClipMasterScreen (it's in a useEffect tied to recording state)
2. Move to hook but pass more context

**Recommendation:** Keep the offline handler in ClipMasterScreen since it's tied to recording completion. Only extract the retry/reconnection functions.

---

## Summary

| Category | Current | After |
|----------|---------|-------|
| ClipMasterScreen lines | ~1400 | ~1150 (-250) |
| New file | N/A | useOfflineRetry.ts (~300 with docs) |
| Functions extracted | 4 | 4 |
| Breaking changes | N/A | None |

---

## Next Steps

1. ~~Review this plan~~ ✅ Reviewed, updated per 005 analysis
2. **Fix handleSmartRetry bug FIRST** (Step 0)
3. Create useOfflineRetry.ts with correct interface
4. Update ClipMasterScreen.tsx
5. Test all scenarios
6. Update 002 and 003 if needed

---

## Changelog

| Date | Change |
|------|--------|
| Dec 24, 2025 | Initial plan |
| Dec 24, 2025 | Updated per 005 analysis: added missing deps, prereqs, clarified network listeners |
