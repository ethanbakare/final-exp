# Offline Recording: Focused Fix Plan

**Date:** December 23, 2025  
**Updated:** December 24, 2025  
**Analysis:** See `001_recording_offline_fix_analysis.md` for independent review

---

## Fix Priority Order

We will tackle these **one at a time**, in this order:

| # | Fix | Files | Status | Notes |
|---|-----|-------|--------|-------|
| 1 | Proper naming (clip FILE vs items inside) | `clipStorage.ts`, `ClipMasterScreen.tsx` | ✅ Done | `getNextRecordingNumber()` added |
| 2 | Timer not reverting to 0:26 | `ClipMasterScreen.tsx` | ✅ Done | Uses `clip.duration` |
| 3 | Transcription on reconnect | `ClipMasterScreen.tsx` | ⚠️ Debug first | Need to verify `handleOnline` fires |
| 4 | Tap-to-retry for pending clips | `ClipMasterScreen.tsx`, `ClipRecordScreen.tsx` | 🔲 Pending | Blocked on Fix 3 |
| 5 | Icon spinning during transcription | Verify existing code | ⚠️ Investigate | `isActiveRequest` may not work for background retries |

---

## Fix 1: Proper Naming Convention

### The Problem

Per `clipofflinescreen_spec.md` (lines 240-252):

| Level | Expected Format | Current Format |
|-------|-----------------|----------------|
| **Clip FILE** (on home screen) | "Recording 01" | ❌ "Clip 001" |
| **ClipOffline** (inside clip detail) | "Clip 001" | Should be correct |

### Root Cause

`clipStorage.ts` only has `getNextClipNumber()` which returns "Clip 001". There's no function for "Recording XX".

### Exact Changes

#### File 1: `clipStorage.ts`

**Add new function after `getNextClipNumber()` (after line 262):**

```typescript
/* ============================================
   GENERATE NEXT RECORDING NUMBER
   Sequential numbering: "Recording 01", "Recording 02", etc.
   For clip FILE titles (container level)
   ============================================ */

export function getNextRecordingNumber(clips: Clip[]): string {
  // Extract all numeric recording titles
  const recordingNumbers = clips
    .map(c => {
      const match = c.title.match(/^Recording (\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);

  // Find highest number
  const maxNumber = recordingNumbers.length > 0 ? Math.max(...recordingNumbers) : 0;

  // Increment for next recording
  const nextNumber = maxNumber + 1;

  // Format with leading zeros (01, 02, etc.)
  return `Recording ${String(nextNumber).padStart(2, '0')}`;
}
```

#### File 2: `ClipMasterScreen.tsx`

**Change line 1054 (inside offline clip creation):**

FROM:
```typescript
const nextNumber = getNextClipNumber(getClips());
```

TO:
```typescript
const nextNumber = getNextRecordingNumber(getClips());
```

**Also add import at top:**
```typescript
import { getNextRecordingNumber } from '@/projects/clipperstream/services/clipStorage';
```

---

## Fix 2: Timer Not Reverting to 0:26

### The Problem

When viewing a pending clip, the time shows "0:26" instead of the actual recorded duration.

### Root Cause

`ClipMasterScreen.tsx` line 193 is hardcoded:
```typescript
time: '0:26',  // Hardcoded!
```

### Exact Changes

#### File: `ClipMasterScreen.tsx`

**Change line 193:**

FROM:
```typescript
time: '0:26',  // Duration would come from audio file in production
```

TO:
```typescript
time: clip.duration || '0:00',
```

---

## Fix 3: Transcription Not Happening on Reconnect

### The Problem

When coming back online, transcription doesn't automatically start. The spinner doesn't spin, nothing happens.

### What Should Happen

1. `handleOnline` fires when network reconnects
2. It finds clips with `status === 'pending'`
3. It calls `transcribeRecording()` for each
4. Spinner starts spinning

### Investigation Needed

Before fixing, I need to verify:
1. Is `handleOnline` actually being called? (Add console log)
2. Is the clip's `status` actually `'pending'` in localStorage?
3. Does the clip have `audioId` set?

### Exact Changes (pending investigation)

#### File: `ClipMasterScreen.tsx`

**Add debug log at line 402:**
```typescript
log.info('🟢 handleOnline triggered');
console.log('🟢 handleOnline - checking for pending clips');
```

Then test to see if this log appears when you reconnect.

---

## Fix 4: Tap-to-Retry for Pending Clips

### The Problem

When you tap a pending clip, nothing happens because:
1. `handleSmartRetry` only handles `'transcribing'` and `'failed'` - NOT `'pending'`
2. `isTappable` only allows tapping when `status === 'transcribing'`

### Exact Changes

#### File 1: `ClipMasterScreen.tsx`

**Change lines 606-609 in `handleSmartRetry`:**

FROM:
```typescript
} else if (clip.status === 'failed') {
  log.info('Manual retry from IndexedDB', { clipId });
  handleRetryTranscription(clipId);
} else {
```

TO:
```typescript
} else if (clip.status === 'failed' || clip.status === 'pending') {
  log.info('Manual retry from IndexedDB', { clipId, status: clip.status });
  handleRetryTranscription(clipId);
} else {
```

#### File 2: `ClipRecordScreen.tsx`

**Change line 227:**

FROM:
```typescript
isTappable={clip.status === 'transcribing' && !clip.isActiveRequest}
```

TO:
```typescript
isTappable={clip.status === 'waiting' || (clip.status === 'transcribing' && !clip.isActiveRequest)}
```

**Note:** We use `'waiting'` here (not `'pending'`) because `pendingClips` in `ClipRecordScreen` are `PendingClip` objects. The `clipToPendingClip` helper maps `Clip.status === 'pending'` → `PendingClip.status === 'waiting'`.

---

## Fix 5: Icon Spinning During Transcription

### What Should Happen

1. When transcription starts → icon spins
2. When waiting between retries → icon static
3. When transcription succeeds → icon disappears, text appears

### Current State

Need to verify:
- `isActiveRequest` is being set to `true` when `transcribeRecording()` is called
- `isActiveRequest` is passed to `ClipOffline` component
- `ClipOffline` uses `isActiveRequest` to control spinning

This was supposedly fixed in a previous session. Need to test if it's working.

---

## Status Terminology Reference

> **Important:** `Clip.status` (storage) is different from `PendingClip.status` (UI).

| `Clip.status` (Storage) | `PendingClip.status` (UI) | Meaning |
|------------------------|---------------------------|---------|
| `'pending'` | `'waiting'` | Recorded offline, waiting for network |
| `'transcribing'` | `'transcribing'` | Currently being sent to Deepgram |
| `'failed'` | `'waiting'` | Transcription failed, needs retry |
| `null` | N/A (not shown) | Successfully transcribed |

**Mapping is done in `clipToPendingClip` (line 390):**
```typescript
status: clip.status === 'transcribing' ? 'transcribing' : 'waiting'
```

Both `'pending'` and `'failed'` map to `'waiting'`, so both are tappable.

---

## Implementation Order (Updated per Builder Analysis)

### ~~Step 1: Fix Naming~~ ✅ DONE
- Added `getNextRecordingNumber()` to `clipStorage.ts`
- Updated call sites in `ClipMasterScreen.tsx` (lines 968, 1054)

### ~~Step 2: Fix Timer~~ ✅ DONE
- Changed line 193 to use `clip.duration || '0:00'`

### Step 3: Debug Transcription ⚠️ IN PROGRESS
1. Add console logs to `handleOnline` (line 402)
2. **Test:** Record offline, reconnect, check console
3. If log appears, investigate why transcription doesn't start
4. If log doesn't appear, check event listener

### Step 4: Fix Tap-to-Retry 🔲 BLOCKED ON STEP 3
1. Update `handleSmartRetry` to handle `'pending'` (line 606)
2. Update `isTappable` to include `'waiting'` status (line 227)
3. **Test:** Record offline, tap the pending clip, verify transcription starts

### Step 5: Verify Icon Spinning ⚠️ NEEDS INVESTIGATION
**Concern from Builder Analysis:**
- `isActiveRequest` is a **single boolean** for the current transcription
- Background retries may not set `isActiveRequest = true`
- Spinner might not show for clips being background-retried

**Test flow:**
1. Record offline
2. Navigate away from the pending clip
3. Come back online
4. Observe if spinner activates

---

## What's Next?

Per Builder Analysis recommendation:
1. **Fix 3 first** — Add debug logs to verify `handleOnline` fires
2. **Then Fix 4** — Add `'pending'` handling after confirming Fix 3 works
3. **Test Fix 5** — Verify spinner behavior

