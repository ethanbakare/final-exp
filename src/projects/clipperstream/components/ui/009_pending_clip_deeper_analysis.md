# 009: Pending Clip Naming - Verified Analysis

**Date:** December 26, 2025  
**Status:** Root Cause Verified  
**Supersedes:** 008 (which made the problem worse)

---

## Verified Root Cause

**Code path when pending clip is created:**

```
Line 1296: updateClip(status: 'pending')  → Writes to storage (SYNC)
Line 1298: refreshClips()                  → Updates clips STATE (ASYNC!)
Line 1302: getClips().find()               → Finds clip in storage ✓
Line 1304: clipToPendingClip(clip)         → Uses clips STATE (stale!)
```

**Inside clipToPendingClip (with 008 fix):**

```
clips.filter(...)  → Uses clips STATE (hasn't updated yet!)
                   → New clip NOT in clips state
                   → findIndex returns -1
                   → Falls back to wrong number
```

**Why it works after exit/re-enter:**
- User exits → clips state updates during navigation
- User re-enters → clips state now includes the clip
- findIndex returns correct position

---

## The 008 Fix Made It Worse

| Before 008 | After 008 |
|------------|-----------|
| `getClips()` - reads fresh storage | `clips` state - async, stale |
| Filter was wrong (`!content`) | Filter correct but timing broken |

---

## Solutions

### Solution 1: Quick Fix - Revert to getClips() with correct filter

```typescript
const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
  const allClips = getClips();  // ← Fresh from storage
  const pendingClips = allClips.filter(c => 
    c.status === 'pending' || c.status === 'transcribing'
  );
  const clipIndex = pendingClips.findIndex(c => c.id === clip.id) + 1;
  const clipNumber = String(clipIndex > 0 ? clipIndex : pendingClips.length + 1).padStart(3, '0');

  return {
    id: clip.id,
    title: `Clip ${clipNumber}`,
    time: clip.duration || '0:00',
    status: clip.status === 'transcribing' ? 'transcribing' : 'waiting',
    isActiveRequest: isActiveRequest
  };
}, [isActiveRequest]);  // ← NO clips dependency needed
```

### Solution 2: Permanent Fix - Store name on creation

Add `pendingClipTitle` to Clip type and assign it once when clip becomes pending.

---

## Recommendation

**Solution 1** - It's simpler and fixes the immediate issue. The original `getClips()` approach was correct for timing, we just needed the right filter.
