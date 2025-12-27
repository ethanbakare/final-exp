# 008: Pending Clip Naming Fix

**Date:** December 26, 2025  
**Status:** Analysis Complete - Ready for Builder  
**Issue:** Pending clips show "Clip 001" initially, only correct after re-entering clip file

---

## Problem

When creating a pending clip offline:
1. It shows "Clip 001" immediately
2. User exits clip file to home screen
3. User re-enters clip file
4. Now shows "Clip 003" (correct based on existing pending clips)

---

## Root Cause Analysis

### Issue 1: Wrong Filter Logic (lines 437-438)

```typescript
const allClips = getClips();
const clipIndex = allClips.filter(c => !c.content).findIndex(c => c.id === clip.id) + 1;
```

This filters by `!c.content` (clips without transcribed text). But a clip file with existing content AND a new pending recording would have `content` set, so it wouldn't be counted correctly.

---

### Issue 2: Missing Dependency (line 448)

```typescript
}, [isActiveRequest]);  // ← Missing 'clips' dependency!
```

The function uses `getClips()` but the callback is memoized without `clips` in dependencies. This means the callback might use stale data.

---

### Issue 3: Stale Data Chain (lines 1300-1302)

```typescript
const updatedClip = getClips().find(c => c.id === clipIdToUpdate);
if (updatedClip) {
  const pendingClip = clipToPendingClip(updatedClip);
```

Even though `refreshClips()` is called at line 1296, the React state update is async. Meanwhile, `getClips()` reads from sessionStorage which IS synchronously updated - but the callback memoization issue from Issue 2 means the function might not recalculate.

---

## Analysis: Does the Stale Data Perspective Hold Merit?

**Yes, it has merit.** The memoized `clipToPendingClip` callback doesn't include `clips` in its dependency array, so React won't recreate the function when clips change. Even though `getClips()` reads fresh data from storage, the issue is more about React patterns and consistency.

**However,** `getClips()` reads directly from sessionStorage which is synchronously updated by `updateClip()`. So technically the data should be fresh. The real issue might be the filter logic (Issue 1) rather than stale data.

**Recommendation:** Fix BOTH issues for correctness and proper React patterns.

---

## Suggested Fix

### Complete Fixed Function (lines 435-448)

Replace the entire `clipToPendingClip` function with:

```typescript
const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
  // Count ALL pending clips across all files (by status, not content)
  const pendingClips = clips.filter(c => 
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
}, [isActiveRequest, clips]);  // ← Add clips dependency
```

### Key Changes

| Line | Before | After |
|------|--------|-------|
| 437 | `getClips()` | `clips` (React state) |
| 438 | `!c.content` filter | `c.status === 'pending' \|\| c.status === 'transcribing'` |
| 448 | `[isActiveRequest]` | `[isActiveRequest, clips]` |

---

## Summary

1. **Use `clips` state** instead of `getClips()` for React consistency
2. **Filter by status** instead of content presence for correct counting
3. **Add `clips` to dependency array** so callback recalculates when clips change
