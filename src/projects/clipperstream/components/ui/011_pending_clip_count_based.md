# 011: Pending Clip Naming - Count Based

**Date:** December 26, 2025  
**Status:** To Test

## Approach

When clip becomes pending:
1. Count existing pending clips in storage: `count`
2. New clip name = `Clip ${count + 1}`
3. Store as `pendingClipTitle` on clip
4. Display uses stored `pendingClipTitle`

When all pending clips are transcribed:
- Count = 0
- Next pending = Clip 001

## Important

**Must clear sessionStorage before testing** - existing clips don't have `pendingClipTitle`.

## Changes

1. `clipStorage.ts` - Add `pendingClipTitle` to Clip interface
2. `ClipMasterScreen.tsx` - Store name based on count:
```typescript
const pendingCount = getClips().filter(c => 
  c.status === 'pending' || c.status === 'transcribing'
).length;
const newClipName = `Clip ${String(pendingCount + 1).padStart(3, '0')}`;

updateClip(clipIdToUpdate, {
  status: 'pending',
  pendingClipTitle: newClipName
});
```
3. `clipToPendingClip` - Use `clip.pendingClipTitle`
4. `handleClipClick` - Use `clip.pendingClipTitle`
