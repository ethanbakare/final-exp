# Offline Recording: Complete Bug Analysis

**Date:** December 23, 2025  
**Priority:** Critical  
**Status:** Root causes identified

---

## 🐛 Reported Symptoms

1. **Wrong clip title** - Shows "Clip 001" instead of "Recording 01"
2. **Timer reverts to 0:26** - Hardcoded instead of actual duration
3. **Nothing happens on reconnect** - No spinner, no transcription
4. **Clicking doesn't respond** - Tap-to-retry not working
5. **Pending clip disappears** - Not visible after navigation

---

## ✅ Verified: What IS Working

From console logs and code analysis:

| Component | Status | Evidence |
|-----------|--------|----------|
| Online event listener | ✅ Bound | Line 481: `window.addEventListener('online', handleOnline)` |
| Audio storage to IndexedDB | ✅ Working | Console: `Audio retrieved from IndexedDB`, size: 93647 |
| Audio retrieval | ✅ Working | Console: `[AudioStorage] [DEBUG] Audio retrieved from IndexedDB` |
| Auto-retry trigger | ✅ Fires | Console: `[ClipMasterScreen] [DEBUG] Auto-retrying transcription` |
| Home screen filtering | ✅ No filter | Line 137-138 only filters by search query |

**The audio IS being saved and retrieved correctly.** The "No speech detected" error is Deepgram's response to the audio content, not a storage issue.

---

## ❌ What's Broken: Root Cause Analysis

### Issue 1: Wrong Naming Convention

**Spec says (lines 240-252 of `clipofflinescreen_spec.md`):**
| Level | Format |
|-------|--------|
| Clip FILE (home screen) | "Recording XX" |
| ClipOffline (inside clip) | "Clip XXX" |

**Current code (`ClipMasterScreen.tsx` line 1054-1056):**
```typescript
const nextNumber = getNextClipNumber(getClips()); // Returns "Clip 001"
const newClip = createClip('', nextNumber, '');   // Uses "Clip 001" as FILE title
```

**Problem:** `getNextClipNumber()` returns "Clip 001", but it should return "Recording 01" for the clip file.

**Fix needed:** Create `getNextRecordingNumber()` that returns "Recording XX" format.

---

### Issue 2: Hardcoded Timer (0:26)

**Code (`ClipMasterScreen.tsx` line 193):**
```typescript
time: '0:26',  // Hardcoded!
```

**Fix needed:** Use `clip.duration || '0:00'`

---

### Issue 3: Pending Clips Not Auto-Retried

**Problem:** `handleOnline` (line 395-472) looks for clips with:
```typescript
c.status === 'pending' || c.status === 'failed'
```

But there may be a race condition OR the `handleOnline` event isn't firing properly when network reconnects.

---

### Issue 4: Tap-to-Retry Doesn't Handle 'pending' Status

**Code (`ClipMasterScreen.tsx` line 595-617):**
```typescript
if (clip.status === 'transcribing' && !isActiveRequest && currentClipId === clipId) {
  forceRetry();
} else if (clip.status === 'failed') {
  handleRetryTranscription(clipId);
} else {
  log.warn('Cannot retry: invalid state'); // ← Falls here for 'pending'!
}
```

**Problem:** New offline clips have `status: 'pending'`, but there's no handler for that state!

**Fix needed:** Add handler for `'pending'` status:
```typescript
} else if (clip.status === 'pending') {
  log.info('Starting transcription for pending clip', { clipId });
  handleRetryTranscription(clipId);
}
```

---

### Issue 5: ClipOffline `isTappable` Too Restrictive

**Code (`ClipRecordScreen.tsx` line 227):**
```typescript
isTappable={clip.status === 'transcribing' && !clip.isActiveRequest}
```

**Problem:** This means you can ONLY tap when `status === 'transcribing'`. Pending clips (`status: 'pending'`) are NOT tappable!

**Fix needed:**
```typescript
isTappable={
  (clip.status === 'pending') || 
  (clip.status === 'transcribing' && !clip.isActiveRequest)
}
```

---

### Issue 6: selectedPendingClip Is React State Only

**Code (`ClipMasterScreen.tsx`):**
```typescript
const [selectedPendingClip, setSelectedPendingClip] = useState<PendingClip | null>(null);
```

When user navigates back (`handleBackClick` line 213):
```typescript
setSelectedPendingClip(null); // CLEARS the pending clip display!
```

**Impact:** The pending clip IS saved to localStorage (via `createClip` → `saveClips`), but when you re-enter from home screen, `selectedPendingClip` is null. The clip should appear in the home list, but if it's not showing, that's a separate issue in how clips are rendered.

---

### Issue 7: Duplicate Naming Paths

There are TWO places that set the pending clip title:

| Location | Line | How Title is Set |
|----------|------|------------------|
| `handleClipClick` (viewing pending) | 188-192 | Calculates `Clip ${clipNumber}` from index |
| `clipToPendingClip` helper | 386-392 | Uses `clip.title` directly |

The first one recalculates based on position, which could produce wrong names if clips are reordered.

---

## 🛠️ Summary of Required Fixes

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `clipStorage.ts` | 245-261 | Returns "Clip XXX" | Create `getNextRecordingNumber()` returning "Recording XX" |
| `ClipMasterScreen.tsx` | 1054 | Uses wrong function | Call `getNextRecordingNumber()` for clip FILE |
| `ClipMasterScreen.tsx` | 193 | Hardcoded "0:26" | Use `clip.duration \|\| '0:00'` |
| `ClipMasterScreen.tsx` | 188-192 | Recalculates title | Use `clip.title` directly |
| `ClipMasterScreen.tsx` | 595-617 | No handler for 'pending' | Add `else if (clip.status === 'pending')` |
| `ClipRecordScreen.tsx` | 227 | Pending clips not tappable | Add `clip.status === 'pending'` to condition |

---

## 📋 Proposed Implementation Order

1. **Fix naming** - Create `getNextRecordingNumber()` and update call site
2. **Fix timer** - Use actual duration instead of hardcoded value
3. **Fix title consistency** - Use `clip.title` in `handleClipClick`
4. **Fix tap handler** - Add 'pending' status handling
5. **Fix isTappable** - Make pending clips tappable
6. **Test** - Verify offline → online flow works end-to-end

---

## 📝 Prior Analysis Context (Preserved)

### Console Evidence (from user's screenshot)
```
[AudioStorage] [DEBUG] Audio retrieved from IndexedDB
  audioId: "audio-1766519199952-fd5xh0u"
  size: 93647

[ClipMasterScreen] [DEBUG] Auto-retrying transcription

[useClipRecording] [DEBUG] Sending audio for transcription
  attempt: 1
  size: 93647
  source: "retry-from-indexeddb"

:3000/api/clipperstream/transcribe:1 - 500 Internal Server Error
```

This confirms:
- Audio IS stored and retrieved correctly
- Auto-retry IS triggered
- The 500 error is from Deepgram ("No speech detected"), not a code bug

