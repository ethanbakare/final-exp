# Two Naming Systems: Complete Architecture Analysis

**Date:** December 26, 2025  
**Status:** Root cause identified - NOT stored in two places

---

## Summary

There are TWO separate naming systems, but both use the SAME storage (sessionStorage). The confusion comes from WHEN and WHERE each name is used.

---

## The Two Naming Systems

### System 1: "Recording XX" (Clip File Names)
**Purpose:** Names for clip FILES (containers shown on home screen)  
**Function:** `getNextRecordingNumber()` in `clipStorage.ts` (lines 272-289)  
**Format:** `Recording 01`, `Recording 02`, etc. (2 digits)  
**Storage:** PERSISTED in `clip.title` field in sessionStorage  
**Used when:**
- Creating a new clip file (lines 1042, 1274 in ClipMasterScreen)
- Displaying clip files on home screen

```typescript
export function getNextRecordingNumber(clips: Clip[]): string {
  const recordingNumbers = clips
    .map(c => {
      const match = c.title.match(/^Recording (\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);
  
  const maxNumber = recordingNumbers.length > 0 ? Math.max(...recordingNumbers) : 0;
  return `Recording ${String(maxNumber + 1).padStart(2, '0')}`;
}
```

---

### System 2: "Clip XXX" (Pending Clip Display Names)
**Purpose:** Display names for pending recordings INSIDE a clip file  
**Function:** `getNextClipNumber()` in `clipStorage.ts` (lines 246-263)  
**Format:** `Clip 001`, `Clip 002`, `Clip 003`, etc. (3 digits)  
**Storage:** NOT PERSISTED - CALCULATED AT DISPLAY TIME  
**Used when:**
- Displaying pending clips in ClipRecordScreen (line 435-450, `clipToPendingClip()`)

```typescript
export function getNextClipNumber(clips: Clip[]): string {
  const clipNumbers = clips
    .map(c => {
      const match = c.title.match(/^Clip (\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);
  
  const maxNumber = clipNumbers.length > 0 ? Math.max(...clipNumbers) : 0;
  return `Clip ${String(maxNumber + 1).padStart(3, '0')}`;
}
```

---

## Critical Architectural Issue

**The problem:** Pending clip titles ("Clip 001") are CALCULATED, not STORED!

### What Gets Stored (sessionStorage)

```json
{
  "id": "clip-1735231234567-abc123",
  "title": "Recording 01",  // ← This is stored
  "status": "pending",
  "audioId": "audio-xyz789",
  "duration": "0:26"
  // NO "pendingClipTitle" field exists!
}
```

### What Gets Displayed (on-the-fly)

When `clipToPendingClip()` is called:
1. It filters clips by status to find ALL pending clips
2. It finds the index of the current clip
3. It CALCULATES "Clip 001", "Clip 002" based on that index

```typescript
const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
  const pendingClips = clips.filter(c =>  // ← Uses React state!
    c.status === 'pending' || c.status === 'transcribing'
  );
  const clipIndex = pendingClips.findIndex(c => c.id === clip.id) + 1;
  const clipNumber = String(clipIndex > 0 ? clipIndex : pendingClips.length + 1).padStart(3, '0');
  
  return {
    title: `Clip ${clipNumber}`,  // ← Calculated, not stored!
    // ...
  };
}, [clips]);  // ← Depends on React state
```

---

## Why the Bug Happens

### Scenario: Create first pending clip offline

**Timeline:**
```
1. Line 1274: getNextRecordingNumber() → "Recording 01" ✓
2. Line 1276: createClip('', 'Recording 01', '') → Saved to sessionStorage ✓
3. Line 1298: refreshClips() → Triggers ASYNC React state update ⏳
4. Line 1302: getClips() → Reads from storage (has new clip) ✓
5. Line 1304: clipToPendingClip(updatedClip) → Uses React state `clips`
   → BUT: React state hasn't updated yet! Still shows OLD clips ❌
6. Line 1305: setSelectedPendingClip() → Shows wrong number ❌

LATER (after navigation):
7. User exits, re-enters
8. clipToPendingClip() called again
9. NOW React state `clips` is fresh ✓
10. Calculation is correct ✓
```

---

## The Real Problem

**It's not about two storage locations - it's about TIMING:**

1. `refreshClips()` triggers async React state update
2. `clipToPendingClip()` is called IMMEDIATELY after
3. React state hasn't updated yet → calculation uses STALE data

---

## Why Previous Fix Failed

```typescript
// Line 437: We filter from React state
const pendingClips = clips.filter(c => 
  c.status === 'pending' || c.status === 'transcribing'
);
```

**Problem:** `clips` is React state, updated asynchronously by `refreshClips()`.  
**When called:** Immediately after `refreshClips()` (before state updates).  
**Result:** Filters OLD clips, misses the newly created one.

---

## Storage Comparison

| Naming System | Function | Stored in sessionStorage? | When calculated? |
|---------------|----------|---------------------------|------------------|
| Recording XX | `getNextRecordingNumber()` | ✅ YES (in `clip.title`) | At creation time |
| Clip XXX | Via `clipToPendingClip()` | ❌ NO (calculated on-the-fly) | At display time |

---

## The Actual Storage Structure

```typescript
// sessionStorage key: 'clipstream_clips'
[
  {
    id: 'clip-123',
    title: 'Recording 01',  // ← FILE name (persisted)
    status: 'pending',
    audioId: 'audio-abc',
    // ... other fields
  },
  {
    id: 'clip-456',
    title: 'Recording 02',  // ← FILE name (persisted)
    status: 'pending',
    audioId: 'audio-def',
    // ... other fields
  }
]
```

**Key insight:** All clips are stored in ONE flat array. There's NO separate storage for "Recording XX" vs "Clip XXX".

---

## Solution Options

### Option A: Use getClips() instead of React state
**Change:** `clipToPendingClip()` uses `getClips()` (sync) instead of `clips` (async)
```typescript
const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
  const allClips = getClips();  // ← Direct storage read
  const pendingClips = allClips.filter(c => 
    c.status === 'pending' || c.status === 'transcribing'
  );
  // ... rest of calculation
}, [isActiveRequest]);  // No clips dependency
```

**Pros:**
- Simple 1-line change
- Gets fresh data immediately
- Fixes timing issue

**Cons:**
- Bypasses React's state management
- Could cause inconsistencies if other code modifies storage directly

---

### Option B: Store pendingClipTitle in clip object
**Change:** Add `pendingClipTitle` field to Clip interface, calculate and STORE it at creation time
```typescript
// In clipStorage.ts Clip interface:
export interface Clip {
  // ... existing fields
  pendingClipTitle?: string;  // "Clip 001" - only set when pending
}

// When creating pending clip:
const pendingTitle = getNextClipNumber(getClips());
updateClip(clipIdToUpdate, {
  audioId: audioId,
  status: 'pending',
  pendingClipTitle: pendingTitle  // ← Store it!
});

// In clipToPendingClip():
return {
  title: clip.pendingClipTitle || 'Clip 001',  // ← Just read it
  // ...
};
```

**Pros:**
- Proper architecture (data persisted, not recalculated)
- Title is stable across navigations
- No timing issues

**Cons:**
- Requires interface change
- Need to handle legacy clips without this field

---

## Recommendation

**Go with Option A** (use `getClips()`) for now because:
1. It's a 1-line fix
2. It solves the immediate timing issue
3. Option B would be better long-term, but requires more extensive refactoring

If Option A causes other issues, fall back to Option B (proper storage).

---

## Answer to User's Question

> "are the files being stored in two places for recording 00 and clip 00?"

**Answer: NO.** All clips are stored in ONE place (sessionStorage key `'clipstream_clips'`).

The confusion comes from:
1. "Recording XX" is the PERSISTED name in `clip.title`
2. "Clip XXX" is CALCULATED on-the-fly when displaying pending clips
3. Both read from the SAME storage, but at DIFFERENT times (creation vs display)

The bug is a **timing issue**, not a **storage issue**.

