# Fix: New Offline Recordings Not Creating Clips

## Issue

When recording offline, new recordings don't create a clip entry at all. The audio is saved to IndexedDB, the toast shows "Audio saved for later", but no clip appears in storage or on screen.

---

## Root Cause

**File:** `ClipMasterScreen.tsx`
**Lines:** 990-1028

The offline handler assumes a clip already exists:

```typescript
} else if (transcriptionError === 'offline') {
  if (audioId && currentClipId) {  // ← currentClipId is NULL for new recordings!
    updateClip(currentClipId, { ... });  // Never runs
  }
}
```

**Why `currentClipId` is NULL:**
- For NEW recordings, clip is created at line 916 in the SUCCESS path
- Offline = transcription fails immediately = clip never created
- Handler tries to UPDATE a clip that doesn't exist

---

## The Fix

For NEW offline recordings (not append mode), CREATE a clip before updating.

**Replace lines 990-1028 with this logic:**

```typescript
} else if (transcriptionError === 'offline') {
  log.info('Offline - clip saved as pending');
  
  if (audioId) {
    let clipIdToUpdate = currentClipId;
    
    // For NEW recordings, we need to CREATE a clip first
    if (!currentClipId && !isAppendMode) {
      const nextNumber = getNextClipNumber(getClips());
      // Create a minimal clip with just title - content comes after transcription
      const newClip = createClip('', nextNumber, '');
      clipIdToUpdate = newClip.id;
      setCurrentClipId(newClip.id);
      log.info('Created new clip for offline recording', { clipId: newClip.id, title: nextNumber });
    }
    
    if (clipIdToUpdate) {
      log.info('Status transition', {
        clipId: clipIdToUpdate,
        from: null,
        to: 'pending',
        trigger: 'offline-save'
      });
      
      updateClip(clipIdToUpdate, {
        audioId: audioId,
        duration: formatDuration(duration),
        status: 'pending'
      });
      refreshClips();
      
      // Create and set PendingClip to display ClipOffline immediately
      const updatedClip = clips.find(c => c.id === clipIdToUpdate) || getClips().find(c => c.id === clipIdToUpdate);
      if (updatedClip) {
        const pendingClip = clipToPendingClip(updatedClip);
        setSelectedPendingClip(pendingClip);
        log.debug('Set selectedPendingClip for offline display', { pendingClip });
      }
    }
  }
  
  // Show "Audio saved for later" toast
  setShowAudioToast(true);
  
  // Preserve existing content access if appending
  if (isAppendMode && appendBaseContent) {
    setRecordNavState('complete');
    log.debug('Offline append - staying in complete state to preserve existing content access');
  } else {
    setRecordNavState('record');
  }
}
```

---

## Key Changes

| Before | After |
|--------|-------|
| Only `updateClip` (assumes clip exists) | `createClip` if no currentClipId |
| Guard: `if (audioId && currentClipId)` | Guard: `if (audioId)` then create if needed |
| Fails silently for new recordings | Creates clip, saves, shows ClipOffline |

---

## Test After Fix

1. Turn WiFi OFF
2. Start NEW recording (not append)
3. Press Done
4. **Expected:** 
   - Toast shows "Audio saved for later" (ONCE, not repeatedly)
   - ClipOffline component appears
   - Clip appears in sessionStorage with `status: 'pending'`
5. Check sessionStorage - clip should have `audioId` and `status: 'pending'`

---

## Issue 2: AudioToast Fires Continuously (Infinite Loop)

### Symptom

When offline, the "Audio saved for later" toast keeps firing repeatedly in a loop.

### Root Cause

**File:** `ClipMasterScreen.tsx`
**Line:** 1048 (dependency array)

```typescript
}, [transcriptionError, audioId, currentClipId, duration, isAppendMode, 
    appendBaseContent, clips, refreshClips, formatDuration, clipToPendingClip]);
```

**The Loop:**

1. `transcriptionError === 'offline'` triggers useEffect
2. Inside: `refreshClips()` is called (updates `clips` state)
3. `clips` is in dependency array
4. useEffect re-runs because `clips` changed
5. Still offline → `setShowAudioToast(true)` fires again
6. Loop continues indefinitely

### Fix Options

**Option 1: Remove `clips` from dependency array**

```typescript
// Change dependency array to not include `clips`
// Only use getClips() inside the effect instead of clips state
], [transcriptionError, audioId, currentClipId, duration, isAppendMode, 
    appendBaseContent, refreshClips, formatDuration, clipToPendingClip]);
```

Also change line 1028 from:
```typescript
const updatedClip = clips.find(c => c.id === clipIdToUpdate) || getClips().find(c => c.id === clipIdToUpdate);
```
To:
```typescript
const updatedClip = getClips().find(c => c.id === clipIdToUpdate);
```

---

**Option 2: Add a guard ref to run only once**

```typescript
// Add ref at component level
const hasHandledOfflineRef = useRef(false);

// At start of offline handler:
} else if (transcriptionError === 'offline') {
  // Guard: only handle once per offline event
  if (hasHandledOfflineRef.current) return;
  hasHandledOfflineRef.current = true;
  
  // ... rest of handler
}

// Reset when going back online or starting new recording
// (needs to be reset in appropriate places)
```

---

**Option 3: Track processed error with state**

```typescript
// Add state to track last processed error
const [lastProcessedError, setLastProcessedError] = useState<string | null>(null);

// At start of offline handler:
} else if (transcriptionError === 'offline') {
  // Skip if we already processed this offline error
  if (lastProcessedError === 'offline') return;
  setLastProcessedError('offline');
  
  // ... rest of handler
}
```

---

### Recommended: Option 1

Option 1 is cleanest - just remove `clips` from dependencies and use `getClips()` directly. The effect doesn't need to re-run when clips change; it only needs to run when `transcriptionError` changes.

