# Recording Architecture - To-Do List

## Pending Implementation Items

These features have shells/placeholders but need actual implementation.

---

## 1. Auto-Retry on Network Reconnect

**Current State:** Event listener exists but does nothing

**Location:** `ClipMasterScreen.tsx` Lines 352-370

**Current Code:**
```typescript
const handleOnline = () => {
  log.info('Network online - will retry pending transcriptions');
  // Auto-retry will be triggered by pending clips on next render ← LIE
};
```

**What's Missing:**
```typescript
const handleOnline = async () => {
  const pendingClips = clips.filter(c => c.status === 'pending' && c.audioId);
  
  for (const clip of pendingClips) {
    updateClip(clip.id, { status: 'transcribing' });
    
    const audioBlob = await getAudio(clip.audioId);
    if (audioBlob) {
      // Transcribe and update clip...
    }
  }
};
```

**Blocker:** `transcribeRecording()` reads from hook state, not a parameter. Need to refactor to accept `audioBlob` as argument.

---

## 2. Manual Retry Button

**Current State:** Function retrieves audio but doesn't transcribe

**Location:** `ClipMasterScreen.tsx` Lines 409-453

**Current Code:**
```typescript
const handleRetryTranscription = useCallback(async (clipId: string) => {
  const audioBlob = await getAudio(clip.audioId);
  
  // TODO: Trigger transcription with retrieved audio
  // This requires refactoring transcribeRecording to accept audioBlob parameter
  // For now, this is a placeholder that demonstrates the flow
});
```

**What's Missing:** Actually call transcription with the retrieved blob.

**Blocker:** Same as above - `transcribeRecording()` needs refactoring.

---

## Required Refactoring

Both issues require this change in `useClipRecording.ts`:

**Current:**
```typescript
const transcribeRecording = useCallback(async () => {
  if (!audioBlob) return; // Reads from state
  // ...
}, [audioBlob]);
```

**Needed:**
```typescript
const transcribeRecording = useCallback(async (blob?: Blob) => {
  const blobToUse = blob || audioBlob; // Accept parameter OR use state
  if (!blobToUse) return;
  // ...
}, [audioBlob]);
```

This allows both:
- Normal flow (uses state)
- Retry flow (pass blob directly)



---
---
---



## 3. Append Mode Error Handling

**Current State:** Always goes to `record` state on failure, even when existing text exists

**Location:** `ClipMasterScreen.tsx` Lines 710-741

**Current Code:**
```typescript
if (transcriptionError && transcriptionError !== 'offline') {
  // ...save audioId and error...
  setShowErrorToast(true);
  setRecordNavState('record');  // ← ALWAYS goes to record
}
```

**The Problem:**
| Scenario | Has Existing Text? | Current Behavior | Should Be |
|----------|-------------------|------------------|-----------|
| New clip fails | No | `record` ✅ | `record` |
| Append fails | Yes | `record` ❌ | `complete` |

When appending to existing text and transcription fails, user should still be able to copy/structure the existing content.

**What's Needed:**
```typescript
if (transcriptionError && transcriptionError !== 'offline') {
  // ...save audioId and error...
  
  setShowErrorToast(true);
  
  // If append mode with existing content, stay in complete (can still use buttons)
  // If new clip (no content), go back to record
  if (isAppendMode && appendBaseContent) {
    setRecordNavState('complete');
  } else {
    setRecordNavState('record');
  }
}
```

**Same logic applies to offline case (lines 726-741).**

