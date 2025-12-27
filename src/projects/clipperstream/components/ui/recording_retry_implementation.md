# Retry Logic Implementation

## Overview

Implement the interval-based retry scheduling from `recording_RETRY.md` by modifying existing files.

**Key:** Modify existing `useClipRecording.ts`, NOT create a new file.

---

## Part 1: Modify useClipRecording.ts

### File Location

`/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/hooks/useClipRecording.ts`

### Current Code (lines 58-61)

```typescript
const [retryCount, setRetryCount] = useState(0);
const MAX_RETRIES = 2;
```

### Current Code (lines 335-361)

```typescript
const shouldRetry = (isTimeout || isNetworkError) && retryCount < MAX_RETRIES;

if (shouldRetry) {
  setRetryCount(prev => prev + 1);
  setTimeout(() => transcribeRecording(), 2000); // Fixed 2s delay
  return;
}
```

---

### Required Changes

**1. Update constants (around line 61):**
```typescript
const MAX_RAPID_ATTEMPTS = 3;  // Attempts 1-3: no waits
const RETRY_INTERVALS = [60000, 120000, 240000, 300000]; // 1, 2, 4, 5 min
```

**2. Add new state and ref (around line 58):**
```typescript
const [isActiveRequest, setIsActiveRequest] = useState(false);
const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
```

**3. Add at start of transcribeRecording() function (around line 278):**
```typescript
setIsActiveRequest(true);  // Icon should spin during active attempt
```

**4. Replace retry logic (lines 335-361):**
```typescript
if (shouldRetry) {
  const nextRetryCount = retryCount + 1;  // Calculate next value first
  setRetryCount(nextRetryCount);          // Update state
  
  if (nextRetryCount < MAX_RAPID_ATTEMPTS) {  // Attempts 1-3: rapid phase
    // Rapid phase: immediate retry
    retryTimerRef.current = setTimeout(() => transcribeRecording(), 0);
  } else {
    // Interval phase: wait before retry (attempts 4+)
    // Formula: nextRetryCount=3 schedules attempt 4 with index 0 (1min)
    const intervalIndex = (nextRetryCount - MAX_RAPID_ATTEMPTS) % RETRY_INTERVALS.length;
    const waitTime = RETRY_INTERVALS[intervalIndex];
    setIsActiveRequest(false);  // Stop spinning during wait
    retryTimerRef.current = setTimeout(() => {
      setIsActiveRequest(true);
      transcribeRecording();
    }, waitTime);
  }
  return;
}
```

**5. Add forceRetry function (before reset function, around line 365):**
```typescript
const forceRetry = useCallback(() => {
  if (retryTimerRef.current) {
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  }
  setIsActiveRequest(true);
  transcribeRecording();
}, [transcribeRecording]);
```

**6. Update reset() function (around line 368):**
```typescript
const reset = useCallback(() => {
  stopRecording();
  setAudioBlob(null);
  setAudioId(null);
  setDuration(0);
  setError(null);
  setTranscription('');
  setTranscriptionError(null);
  setIsTranscribing(false);
  setRetryCount(0);
  setIsActiveRequest(false);  // NEW
  if (retryTimerRef.current) {  // NEW
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  }
  chunksRef.current = [];
}, [stopRecording]);
```

**7. Add cleanup in unmount effect (around line 396):**
```typescript
useEffect(() => {
  return () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    if (retryTimerRef.current) {  // NEW
      clearTimeout(retryTimerRef.current);
    }
  };
}, []);
```

**8. Expose in return (around line 409):**
```typescript
return {
  isRecording,
  audioBlob,
  audioId,
  duration,
  error,
  audioAnalyser: audioAnalyserRef.current,
  isTranscribing,
  transcription,
  transcriptionError,
  isActiveRequest,  // NEW: Controls icon spinning
  startRecording,
  stopRecording,
  transcribeRecording,
  forceRetry,       // NEW: Allows tap-to-skip wait
  reset,
};
```

---

## Part 2: Wire Up ClipMasterScreen.tsx

### File Location

`/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/components/ui/ClipMasterScreen.tsx`

### Changes Needed

Pass `isActiveRequest` and `forceRetry` to components:

```typescript
// When creating PendingClip objects, include isActiveRequest
const pendingClip: PendingClip = {
  id: clip.id,
  title: clip.title,
  time: clip.duration,
  status: clip.status === 'transcribing' ? 'transcribing' : 'waiting',
  isActiveRequest: isActiveRequest  // From useClipRecording
};
```

Pass `forceRetry` to ClipRecordScreen for tap-to-skip functionality.

---

## Part 3: Add Tap-to-Skip to ClipOffline.tsx

### File Location

`/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/components/ui/ClipOffline.tsx`

### Current Props (lines 16-23)

```typescript
interface ClipOfflineProps {
  title?: string;
  time?: string;
  status?: ClipOfflineStatus;
  onRetryClick?: () => void;
  fullWidth?: boolean;
  className?: string;
}
```

### Add New Props

```typescript
  onTap?: () => void;        // Called when entire row is tapped
  isTappable?: boolean;      // true = between attempts (waiting), false = active attempt
```

### Add Click Handler (line 73)

On `pending-master-clip` div:
```typescript
<div 
  className={`pending-master-clip ...`}
  onClick={isTappable ? onTap : undefined}
  style={{ cursor: isTappable ? 'pointer' : 'default' }}
>
```

### Behavior (from recording_RETRY.md lines 77-80)

- If not spinning (waiting between attempts) → Tap skips wait, forces immediate retry
- If spinning (active attempt) → No action, already trying

---

## Part 4: Update ClipOfflineScreen.tsx Showcase

### File Location

`/Users/ethan/Documents/projects/final-exp/src/pages/clipperstream/showcase/ClipOfflineScreen.tsx`

### Changes Needed (AFTER production is done)

1. Wire up tap-to-skip: when tapped during `betweenAttempts`, switch to `attemptActive`
2. Pass `isTappable={currentState === 'betweenAttempts'}` to ClipOffline
3. Add attempt/interval status display showing current state

---

## Note: handleOnline Interaction

The `handleOnline` in ClipMasterScreen handles background retries for saved offline clips. This is separate from the active recording retry logic in useClipRecording. If network comes online during a wait interval, `handleOnline` will trigger for any saved pending clips. No code change needed.

---

## File References

| File | Path |
|------|------|
| useClipRecording.ts | `hooks/useClipRecording.ts` |
| ClipMasterScreen.tsx | `components/ui/ClipMasterScreen.tsx` |
| ClipOffline.tsx | `components/ui/ClipOffline.tsx` |
| ClipOfflineScreen.tsx | `pages/clipperstream/showcase/ClipOfflineScreen.tsx` |
| recording_RETRY.md | `components/ui/recording_RETRY.md` (source spec) |

---

## Implementation Order

1. Modify `useClipRecording.ts` with all 8 changes above
2. Wire up `ClipMasterScreen.tsx` to pass `isActiveRequest` and `forceRetry`
3. Add `onTap`/`isTappable` to `ClipOffline.tsx`
4. Update `ClipOfflineScreen.tsx` showcase to reflect production

---