# Recording Error Loop Fix Implementation

**Date:** Dec 23, 2025  
**Status:** ✅ IMPLEMENTED

---

## The Bug

**Line 618 in ClipMasterScreen.tsx:**

```typescript
useEffect(() => {
  if (audioBlob && !isTranscribing && !transcription && recordNavState === 'processing') {
    transcribeRecording();  // ← Missing guard for transcriptionError
  }
}, [audioBlob, isTranscribing, transcription, recordNavState, transcribeRecording]);
```

When Deepgram returns "No speech detected", `transcriptionError` is set but this effect has no guard for it. Combined with `transcribeRecording` function recreating (due to `retryCount` dependency), it can trigger an infinite loop.

---

## Fix 1: Add Error Guard (CRITICAL)

**File:** `ClipMasterScreen.tsx` line 618

**Before:**
```typescript
if (audioBlob && !isTranscribing && !transcription && recordNavState === 'processing') {
```

**After:**
```typescript
if (audioBlob && !isTranscribing && !transcription && !transcriptionError && recordNavState === 'processing') {
```

**Also update dependency array:**
```typescript
}, [audioBlob, isTranscribing, transcription, transcriptionError, recordNavState, transcribeRecording]);
```

---

## Fix 2: Stable Function Reference (DEFENSIVE)

**File:** `ClipMasterScreen.tsx` around line 128

**Add:**
```typescript
// Stable ref to prevent re-triggers from function recreation
const transcribeRef = useRef(transcribeRecording);
useEffect(() => {
  transcribeRef.current = transcribeRecording;
}, [transcribeRecording]);
```

**Update the auto-transcribe effect to use ref:**
```typescript
useEffect(() => {
  if (audioBlob && !isTranscribing && !transcription && !transcriptionError && recordNavState === 'processing') {
    transcribeRef.current();  // Use ref instead of direct call
  }
}, [audioBlob, isTranscribing, transcription, transcriptionError, recordNavState]);
// Note: transcribeRecording removed from dependencies since we use ref
```

---

## Fix 3: Clear Toasts on New Recording (UX)

**File:** `ClipMasterScreen.tsx` in `handleRecordClick` (around line 227)

**What it does:** When starting a new recording, hide any lingering error/audio toasts from previous attempts. Purely visual cleanup.

**Add after `resetRecording():`**
```typescript
const handleRecordClick = async () => {
  resetRecording();
  
  // Clear any lingering toasts from previous recording
  setShowErrorToast(false);
  setShowAudioToast(false);
  
  // ... rest of existing logic
```

---

## Testing Checklist

- [ ] Record with no speech → Error shows ONCE, no loop
- [ ] After error → Record again → Works cleanly, no old toast
- [ ] Successful recording → Still works as expected

---

## Risk: Very Low

These changes only ADD guards - they don't modify existing flow logic.
