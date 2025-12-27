# 003 Pending Clips Display & Transcription Fix

**Date:** December 24, 2025  
**Priority:** High  
**Status:** Identified, pending investigation after 002
**Depends on:** 002_multiple_offline_recordings_fix.md

---

## Issue

When `handleOnline` fires and transcription succeeds (confirmed via console logs), the transcribed text does NOT appear on screen. The ClipOffline component should disappear and be replaced with the transcribed text, but this isn't happening.

## Evidence from Console Logs

```
🟢 handleOnline FIRED - network is back online
🟢 handleOnline - clips found: {total: 4, pendingCount: 1, pendingClips: Array(1)}
[INFO] Found pending clips for auto-retry {count: 1}
[INFO] Status transition {clipId: '...', from: 'pending', to: 'transcribing'}
[DEBUG] Audio retrieved from IndexedDB {audioId: '...', size: 166705}
[DEBUG] Auto-retrying transcription {...}
[DEBUG] Sending audio for transcription {size: 166705, attempt: 1}
[INFO] Transcription successful {textLength: 44, preview: 'My name is Ethan...'}
```

**The transcription succeeded** but the UI didn't update.

---

## Suspected Root Causes

### 1. Clip Status Not Updating to Success

After transcription succeeds, the clip's `status` should change from `'transcribing'` to `null`. If this doesn't happen, the ClipOffline component keeps displaying.

**Check:** Does `handleOnline` update the clip status after transcription success?

### 2. selectedPendingClip Not Cleared

If `selectedPendingClip` remains set after transcription, the ClipOffline will keep showing.

**Check:** What clears `selectedPendingClip` after successful transcription?

### 3. UI Not Re-rendering

The clip data might be updated in storage, but the component might not be re-rendering to reflect the change.

**Check:** Is `refreshClips()` called after successful transcription in background retry?

### 4. Content Not Being Set

After transcription, the clip's `content` should be populated. If not, the component might still think it's pending.

**Check:** Does the background retry path properly save transcription to clip?

---

## Investigation Plan

1. Trace `handleOnline` → `transcribeRecording` → success path
2. Verify clip is updated with:
   - `content` set to transcription
   - `status` set to `null`
3. Verify `selectedPendingClip` is cleared after success
4. Verify `refreshClips()` is called to trigger re-render

---

## Related Architecture Concern

The current architecture has multiple code paths for transcription:
1. **Immediate online path** - recording → transcription → display
2. **Background retry path** - `handleOnline` → `transcribeRecording`
3. **Manual retry path** - tap → `handleSmartRetry` → `handleRetryTranscription`

These paths may have inconsistent handling of:
- Clip status updates
- UI state updates (`selectedPendingClip`, `selectedClip`, `contentBlocks`)
- Navigation state (`recordNavState`, `activeScreen`)

**Goal:** Ensure ALL transcription paths result in consistent UI updates.

---

## Files to Investigate

| File | Purpose |
|------|---------|
| `ClipMasterScreen.tsx` `handleOnline` | Background retry trigger |
| `ClipMasterScreen.tsx` success path | How transcription result updates UI |
| `useClipRecording.ts` | Hook that handles transcription |

---

## Notes

This issue should be investigated AFTER implementing 002, as the multiple recordings fix may affect how pending clips are tracked and displayed.
