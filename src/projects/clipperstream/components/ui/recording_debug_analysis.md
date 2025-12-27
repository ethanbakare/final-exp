# Offline Recording - Deep Code Analysis Report

## Date: 2025-12-18

---

## 1. ClipOffline Not Rendering

### Problem
ClipOffline only renders when `state === 'offline'`, but `state` only becomes `'offline'` when `selectedPendingClip` is set - which never happens during the save flow.

### Code Location
- `ClipRecordScreen.tsx` line 199: Render condition
- `ClipMasterScreen.tsx` line 876-882: `getRecordScreenState()`

### Current Code
```typescript
// getRecordScreenState() - line 876
if (selectedPendingClip) return 'offline';  // Only way to get 'offline'
```

### Solution
**Option A:** Set `selectedPendingClip` when saving offline
```typescript
// After saving clip with audioId, also set:
const pendingClip: PendingClip = {
  id: newClip.id,
  title: `Recording ${clipNumber}`,
  time: formatDuration(duration),
  status: 'waiting'
};
setSelectedPendingClip(pendingClip);
```

**Option B:** Change render condition to check clips with audioId
```typescript
// getRecordScreenState() - add this check:
const hasPendingClip = clips.some(c => c.audioId && c.status === 'pending');
if (selectedPendingClip || hasPendingClip) return 'offline';
```

**Recommended:** Option A - explicitly set the pending clip being viewed.

---

## 2. Done Button Flow

### Status
✅ **Working correctly.** Audio is saved to IndexedDB before transcription is attempted.

### Flow Verified
1. `handleDoneClick()` → `stopRecordingHook()`
2. `mediaRecorder.onstop` → `storeAudio()` → `setAudioId()` → `setAudioBlob()`
3. `audioBlob` change triggers transcription useEffect

No changes needed here.

---

## 3. handleOnline Interferes With Active Recording

### Problem
When user goes offline→online WHILE recording, `handleOnline` fires and calls `setRecordNavState('processing')`, disrupting the current recording. The recording jumps to processing state before user presses Done.

### Clarification
The issue is NOT that handleOnline processes other pending clips. That's fine. The issue is:
- It sets `setRecordNavState('processing')` which affects the CURRENT recording UI
- It should ONLY process pending clips without touching the current recording session

### Code Location
`ClipMasterScreen.tsx` line 358-418

### Current Code
```typescript
const handleOnline = useCallback(async () => {
  // No guard - processes immediately
  for (const clip of pendingClips) {
    setRecordNavState('processing');  // ← Affects current session!
    await transcribeRecording(audioBlob);
  }
}, []);
```

### Solution
**Guard against active recording AND don't change nav state:**
```typescript
const handleOnline = useCallback(async () => {
  // Guard: Don't interfere with active recording
  if (isRecording) {
    log.info('Network online but recording active - skipping auto-retry');
    return;
  }
  
  for (const clip of pendingClips) {
    // Update CLIP status, not nav state
    updateClip(clip.id, { status: 'transcribing' });
    refreshClips();
    
    // DON'T call setRecordNavState here
    // The nav state belongs to the current session, not background retries
    
    const audioBlob = await getAudio(clip.audioId);
    await transcribeRecording(audioBlob);
  }
}, [isRecording, refreshClips, transcribeRecording]);
```

**Key Insight:** Background retry of pending clips should update clip.status, NOT recordNavState. The nav bar state tracks the CURRENT recording session only.

---

## 4. Status Transitions

### Question
Is the current approach correct, or does it need restructuring?

### Analysis
Status is set in 8+ places. This is scattered but follows a pattern:
- `'transcribing'` = currently attempting
- `'pending'` = waiting for network
- `'failed'` = error occurred
- `null` = success (audio deleted)

### Finding
The architecture is acceptable. The issue is missing cleanup in error paths.

### Solution
Add status cleanup to all error handlers:
```typescript
// When transcription fails (line 787):
updateClip(currentClipId, {
  status: 'failed',  // ← Already done
  transcriptionError: transcriptionError
});

// When auto-retry fails (line 411):
updateClip(clip.id, {
  status: 'failed',  // ← Already done
  // Good
});
```

Current code IS cleaning up status in error paths. The "stuck at transcribing" issue may be from interrupted flows (hot reload, navigation away).

**Recommendation:** No architectural change needed. Add logging to track status transitions for debugging.

---

## 5. Duration Not Flowing to ClipOffline

### Problem
Recording duration is tracked in `useClipRecording` but never passed to PendingClip.

### Missing Code
1. No transformation from Clip (with audioId) → PendingClip (with time)
2. Duration not stored with clip when saving offline

### Solution
**Step 1:** Store duration when saving offline
```typescript
// In saveAudioThenTranscribe or equivalent:
updateClip(newClip.id, {
  audioId: savedAudioId,
  duration: formatDuration(recordingDuration),  // ← Add this
  status: 'pending'
});
```

**Step 2:** Create transformation function
```typescript
const clipToPendingClip = (clip: Clip): PendingClip => ({
  id: clip.id,
  title: clip.title,
  time: clip.duration || '0:00',
  status: clip.status === 'transcribing' ? 'transcribing' : 'waiting'
});
```

**Step 3:** Use transformation when getting pending clips to display
```typescript
const getDisplayPendingClips = (): PendingClip[] => {
  const pendingRaw = clips.filter(c => c.audioId && c.status);
  return pendingRaw.map(clipToPendingClip);
};
```

---

## 6. Wrong Toast Type for Offline Save

### Problem
Line 816 shows `setShowErrorToast(true)` for offline saves. This shows ErrorToast, not AudioToast.

### Code Location
`ClipMasterScreen.tsx` line 813-816

### Current Code
```typescript
// Show "Audio saved for later" toast (existing toast)
setShowErrorToast(true);  // ← Wrong toast type!
```

### Solution
Add AudioToast state and show it instead:
```typescript
const [showAudioToast, setShowAudioToast] = useState(false);

// In offline save handler:
setShowAudioToast(true);  // Not setShowErrorToast
```

Add to JSX:
```typescript
<ToastNotification
  isVisible={showAudioToast}
  onDismiss={() => setShowAudioToast(false)}
  type="audio"
/>
```

---

## Summary: Priority Fixes

| Priority | Issue | Solution |
|----------|-------|----------|
| 1 | handleOnline interferes | Add `isRecording` guard, don't change nav state |
| 2 | ClipOffline not showing | Set `selectedPendingClip` when saving offline |
| 3 | Wrong toast | Add AudioToast state, use for offline saves |
| 4 | Duration missing | Store duration, add transformation function |
| 5 | Status stuck | Already handled, add logging for debugging |
