# 002 Multiple Offline Recordings Fix

**Date:** December 24, 2025  
**Priority:** Critical  
**Status:** Root causes identified, pending implementation

---

## Issues Discovered

### Issue 1: Second Offline Recording Creates New Clip File
When inside a clip file with a pending recording, making a second offline recording creates a NEW clip file instead of adding the pending clip to the existing one.

### Issue 2: Clip Numbering Is Reversed
Newest clips get "Clip 001" and older clips get bumped up to "Clip 002". Should be the opposite - older clips keep their original numbers.

---

## Root Cause Analysis

### Issue 1: handleRecordClick Case 3

**File:** `ClipMasterScreen.tsx`  
**Lines:** 290-299

```typescript
// Case 3: Recording from record screen (no existing content) → NEW clip
else {
  setIsAppendMode(false);
  setCurrentClipId(null);  // ← CLEARS currentClipId!
  setAppendBaseContent('');
  setContentBlocks([]);
  ...
}
```

**The Problem:**
1. You're inside a clip file viewing a pending clip (no `content`)
2. You press record to add another recording
3. `selectedClip?.content` is falsy (pending = no content yet)
4. Case 2 doesn't match: `if (selectedClip?.content)` is false
5. Case 3 runs, which clears `currentClipId`
6. Second recording goes offline
7. `!currentClipId` is now true, so line 1074 creates NEW clip

**Missing Case:** "Recording from a pending clip" should keep `currentClipId` set.

---

### Issue 2: findIndex Returns Array Position

**File:** `ClipMasterScreen.tsx`  
**Lines:** 392 (clipToPendingClip) and 188 (handleClipClick)

```typescript
const clipIndex = allClips.filter(c => !c.content).findIndex(c => c.id === clip.id) + 1;
```

**File:** `clipStorage.ts`  
**Line:** 185

```typescript
// Add to beginning of array (newest first)
const updatedClips = [newClip, ...clips];
```

**The Problem:**
- Clips are stored **newest first** in the array
- `findIndex` returns position: newer clips have lower indices
- Result: Newest clip → index 0 → "Clip 001"

**Expected:** Older clips should have lower numbers (stable numbering)

---

## Proposed Fixes

### Fix 1: Add Case for "Recording from Pending Clip"

**Location:** `handleRecordClick` between Case 2 and Case 3

**Add new case:**
```typescript
// Case 2.5: Recording from pending clip (has pending status but no content)
else if (activeScreen === 'record' && selectedPendingClip) {
  // Keep currentClipId - we're adding to existing clip file
  // Just start new recording, don't clear clip context
  setIsAppendMode(true);  // Mark as append to existing clip
  log.debug('Recording from pending clip', { clipId: currentClipId });
  setTimeout(() => startRecordingHook(), 200);
}
```

Or modify Case 3 condition:
```typescript
// Case 3: Recording from record screen (no existing content AND no pending clip) → NEW clip
else if (!selectedPendingClip) {
  ...
}
```

---

### Fix 2: Sort Pending Clips by createdAt Before Index Calculation

**Option A: Sort in clipToPendingClip**

```typescript
const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
  const allClips = getClips();
  // Sort pending clips by createdAt ASCENDING (oldest first = lower index)
  const pendingClips = allClips
    .filter(c => !c.content)
    .sort((a, b) => a.createdAt - b.createdAt);
  
  const clipIndex = pendingClips.findIndex(c => c.id === clip.id) + 1;
  const clipNumber = String(clipIndex > 0 ? clipIndex : 1).padStart(3, '0');
  
  return { ... };
}, [isActiveRequest]);
```

**Option B: Use clip.createdAt for stable numbering**

Instead of using array index, generate number based on creation order:
```typescript
// Count how many pending clips were created BEFORE this one
const pendingClips = allClips.filter(c => !c.content);
const clipIndex = pendingClips.filter(c => c.createdAt <= clip.createdAt).length;
```

---

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `ClipMasterScreen.tsx` | 290-299 | Add check for `selectedPendingClip` |
| `ClipMasterScreen.tsx` | 392 | Sort pending clips by `createdAt` ascending |
| `ClipMasterScreen.tsx` | 188 | Same fix for `handleClipClick` |

---

## Test Cases

### Test 1: Multiple Offline Recordings in Same Clip
1. Go offline
2. Start new recording → "Recording 01" clip file created
3. Finish → "Clip 001" pending inside
4. Press record again (still offline)
5. Finish → "Clip 002" should appear UNDER "Clip 001"
6. Both should be in SAME clip file

### Test 2: Numbering Stability
1. Create clip offline → "Clip 001"
2. Create second clip offline → "Clip 002"
3. Navigate away and back
4. "Clip 001" should still be the OLDER one
5. "Clip 002" should still be the NEWER one

---

## Related Documents

- `001_recording_offline_fix_analysis.md` - Previous analysis
- `recording_offline_fix_plan.md` - Overall fix plan
- `recording_offline_new_clip_fix.md` - Original new clip creation fix
- `clipofflinescreen_spec.md` - Naming convention spec
