# 010: Pending Clip Naming Implementation

**Date:** December 26, 2025  
**Status:** ❌ FAILED

## Why It Failed

Even with the bug fix (`getNextClipNumber` checking `pendingClipTitle`), ALL clips became "Clip 001".

**Root cause:** Existing pending clips in sessionStorage don't HAVE `pendingClipTitle` (created before property existed). So `getNextClipNumber` found no existing "Clip XXX" numbers → always returned "Clip 001".

---

## Changes

### 1. clipStorage.ts (line ~18)

Add to Clip interface:
```typescript
pendingClipTitle?: string;  // "Clip 001" - only set when pending
```

---

### 2. ClipMasterScreen.tsx (line ~1293)

When clip becomes pending, store the name:
```typescript
updateClip(clipIdToUpdate, {
  audioId: audioId,
  duration: formatDuration(duration),
  status: 'pending',
  pendingClipTitle: getNextClipNumber(getClips())  // NEW
});
```

---

### 3. ClipMasterScreen.tsx (line ~435)

Simplify `clipToPendingClip` to use stored name:
```typescript
const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
  return {
    id: clip.id,
    title: clip.pendingClipTitle || 'Clip 001',  // Use stored name
    time: clip.duration || '0:00',
    status: clip.status === 'transcribing' ? 'transcribing' : 'waiting',
    isActiveRequest: isActiveRequest
  };
}, [isActiveRequest]);
```

---

### 4. ClipMasterScreen.tsx (line ~225)

Simplify `handleClipClick` to use stored name:
```typescript
setSelectedPendingClip({
  id: clip.id,
  title: clip.pendingClipTitle || 'Clip 001',  // Use stored name
  time: clip.duration || '0:00',
  status: pendingStatus,
  isActiveRequest: isActiveRequest
});
```

---

### 5. Cleanup (already happens with transcription)

After successful transcription, clear the title:
```typescript
updateClip(clipId, {
  status: null,
  pendingClipTitle: undefined  // Clear it
});
```

---

## Import Needed

In ClipMasterScreen.tsx, ensure `getNextClipNumber` is imported:
```typescript
import { getNextClipNumber } from '../../services/clipStorage';
```
