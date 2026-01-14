# 043_v5 DIAGNOSTIC: Offline Status Not Showing

**Date**: January 9, 2026
**Issue**: Parent doesn't show "waiting to transcribe" when child is `pending-child` while offline
**User Report**: "I was offline for 2-3 minutes and the parent never showed waiting to transcribe"

---

## Expected Behavior

**Timeline**:
1. User goes offline
2. Records audio → Creates parent + child with `status: 'pending-child'`
3. Navigates to home screen
4. **Should see**: Parent showing "Waiting to transcribe" (white icon)
5. User comes back online
6. **Should see**: Parent showing "Transcribing..." (spinning icon)
7. Transcription completes
8. **Should see**: Parent with no status (completed)

**Actual Behavior**:
1-3. Same
4. **Actually saw**: Parent with NO status (appeared completed)
5-7. Same

---

## The Data Flow (What SHOULD Happen)

### Step 1: Child Created with Pending Status
```typescript
// In useOfflineRecording.ts (line 158)
addClip(firstChild);  // firstChild has status: 'pending-child'
```

### Step 2: Zustand Store Updates
```typescript
// clipStore.ts
clips = [...clips, firstChild];  // Triggers re-render of all subscribers
```

### Step 3: ClipMasterScreen Re-renders
```typescript
// ClipMasterScreen.tsx (line 81)
const clips = useClipStore((state) => state.clips);  // Gets fresh clips with new child

// Line 1582
const homeScreenClips = useMemo(() => {
  return clips.filter(clip => !clip.parentId);  // Returns only parents
}, [clips]);
```

### Step 4: ClipHomeScreen Receives Fresh Props
```typescript
// ClipHomeScreen.tsx (line 47)
clips,  // Fresh from ClipMasterScreen
```

### Step 5: filteredClips Computed
```typescript
// ClipHomeScreen.tsx (line 200)
const filteredClips = clips
  .filter(clip => !clip.parentId)  // Only parents
  .filter(clip =>
    clip.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .sort((a, b) => b.createdAt - a.createdAt);
```

### Step 6: Render Loop - For Each Parent
```typescript
// ClipHomeScreen.tsx (line 377)
{showClipList && filteredClips.map((clip) => {
  // Line 380 - Derive status from children
  const displayClip = getDisplayClip(
    clip,
    clips,  // All clips (parents + children)
    activeTranscriptionParentId,
    activeHttpClipId
  );
```

### Step 7: getDisplayClip Derives Status
```typescript
// ClipHomeScreen.tsx (lines 145-197)
const getDisplayClip = (clip, allClips, ...) => {
  const children = allClips.filter(c => c.parentId === clip.id);  // Find children

  if (children.length === 0) {
    return { ...clip, isActiveRequest: false };  // No children = no status
  }

  // Line 157: Check child statuses
  const hasPendingChildren = children.some(c => c.status === 'pending-child');

  let derivedStatus = clip.status;

  // Line 178-179
  if (hasPendingChildren) {
    derivedStatus = 'pending-child';  // ✅ Should set this!
  }

  return {
    ...clip,
    status: derivedStatus,  // Should be 'pending-child'
    ...
  };
};
```

### Step 8: Status Mapping to ClipListItem
```typescript
// ClipHomeScreen.tsx (lines 388-399)
const listItemStatus =
  displayClip.status === 'transcribing'
    ? 'transcribing'
  : displayClip.status === 'pending-retry' && displayClip.lastError === 'dns-block'
    ? 'vpn-blocked'
  : displayClip.status === 'pending-retry'
    ? 'retry-pending'
  : displayClip.status === 'audio-corrupted'
    ? 'audio-corrupted'
  : displayClip.status === 'pending-child'
    ? 'pending'  // ✅ Should map to 'pending'!
  : null;
```

### Step 9: ClipListItem Renders
```typescript
// ClipList.tsx (lines 336-345)
{status === 'pending' && (  // ✅ Should match!
  <div className="status-frame">
    <div className="status-icon-wrapper">
      <PendingIcon />
    </div>
    <span className="status-text">
      Waiting to transcribe
    </span>
  </div>
)}
```

---

## Potential Failure Points

### Hypothesis #1: Child Not in allClips Array
**Problem**: `getDisplayClip` receives `allClips` but the child isn't in it yet
**Why**: Race condition? Zustand update not propagated?

**Test**:
```typescript
// In getDisplayClip (line 145)
const children = allClips.filter(c => c.parentId === clip.id);
console.log('[getDisplayClip] Children found:', children.length);  // Should be 1, might be 0
```

---

### Hypothesis #2: hasPendingChildren Not Detecting Child
**Problem**: Child exists but `hasPendingChildren` is false
**Why**: Child's status isn't 'pending-child'?

**Test**:
```typescript
// In getDisplayClip (line 157)
const hasPendingChildren = children.some(c => c.status === 'pending-child');
console.log('[getDisplayClip] Child statuses:', children.map(c => c.status));  // Should be ['pending-child']
console.log('[getDisplayClip] hasPendingChildren:', hasPendingChildren);  // Should be true
```

---

### Hypothesis #3: derivedStatus Not Set Correctly
**Problem**: `hasPendingChildren` is true but `derivedStatus` isn't set
**Why**: Logic error in if/else chain?

**Test**:
```typescript
// In getDisplayClip (after line 183)
console.log('[getDisplayClip] Derived status:', {
  hasPendingChildren,
  originalStatus: clip.status,
  derivedStatus
});  // derivedStatus should be 'pending-child' if hasPendingChildren is true
```

---

### Hypothesis #4: listItemStatus Not Mapped Correctly
**Problem**: `displayClip.status === 'pending-child'` but `listItemStatus` is null
**Why**: Status mapping logic error?

**Test**:
```typescript
// In ClipHomeScreen render (after line 399)
console.log('[Status Mapping]', {
  displayClipStatus: displayClip.status,
  listItemStatus
});  // Should be { displayClipStatus: 'pending-child', listItemStatus: 'pending' }
```

---

### Hypothesis #5: ClipListItem Not Receiving status='pending'
**Problem**: `listItemStatus` is 'pending' but ClipListItem receives null
**Why**: Props not passed correctly?

**Test**:
```typescript
// In ClipListItem (line 85)
console.log('[ClipListItem] Received status:', status);  // Should be 'pending', might be null
```

---

## Diagnostic Code to Add

### Add to ClipHomeScreen.tsx (in getDisplayClip function, after line 145)

**Location**: Right after `const children = allClips.filter(c => c.parentId === clip.id);`

```typescript
const children = allClips.filter(c => c.parentId === clip.id);

// 🔬 DIAGNOSTIC: Log when parent has children
if (children.length > 0) {
  console.log('[getDisplayClip] 🔍 DIAGNOSTIC:', {
    step: 'Children found for parent',
    parentId: clip.id.substring(0, 20) + '...',
    parentTitle: clip.title,
    parentStatus: clip.status,
    childCount: children.length,
    children: children.map(c => ({
      id: c.id.substring(0, 15) + '...',
      status: c.status,
      pendingClipTitle: c.pendingClipTitle
    }))
  });
}
```

### Add to ClipHomeScreen.tsx (in getDisplayClip function, after line 163)

**Location**: Right after `const hasNoAudioDetectedChildren = children.some(c => c.status === 'no-audio-detected');`

```typescript
const hasNoAudioDetectedChildren = children.some(c => c.status === 'no-audio-detected');

// 🔬 DIAGNOSTIC: Log all status checks
if (children.length > 0) {
  console.log('[getDisplayClip] 🔍 DIAGNOSTIC:', {
    step: 'Status checks completed',
    parentId: clip.id.substring(0, 20) + '...',
    flags: {
      hasPendingChildren,
      hasTranscribingChildren,
      hasRetryPendingChildren,
      hasVpnBlockedChildren,
      hasAudioCorruptedChildren,
      hasNoAudioDetectedChildren
    }
  });
}
```

### Add to ClipHomeScreen.tsx (in getDisplayClip function, before return statement)

**Location**: Right before `return { ...clip, status: derivedStatus, ... };`

```typescript
// 🔬 DIAGNOSTIC: Log final derived status
if (children.length > 0) {
  console.log('[getDisplayClip] 🔍 DIAGNOSTIC:', {
    step: 'Status derivation complete',
    parentId: clip.id.substring(0, 20) + '...',
    result: {
      originalStatus: clip.status,
      derivedStatus,
      derivedLastError
    }
  });
}

return {
  ...clip,
  status: derivedStatus,
  lastError: derivedLastError,
  isActiveRequest: derivedIsActiveRequest
};
```

### Add to ClipHomeScreen.tsx (in render loop, after status mapping)

**Location**: Right after the `listItemStatus` declaration (after line 399)

```typescript
const listItemStatus = ...;

// 🔬 DIAGNOSTIC: Log status mapping
if (displayClip.status) {  // Only log when there's a status
  console.log('[ClipHomeScreen] 🔍 DIAGNOSTIC:', {
    step: 'Status mapped for ClipListItem',
    parentId: clip.id.substring(0, 20) + '...',
    displayClipStatus: displayClip.status,
    displayClipLastError: displayClip.lastError,
    listItemStatus
  });
}
```

### Add to ClipList.tsx (in ClipListItem component, at the start)

**Location**: Right after the component function starts (after line 99)

```typescript
export const ClipListItem: React.FC<ClipListItemProps> = ({
  id = 'default-id',
  title = 'Teach me to love myself today and I will teach you to love yourself',
  date = 'May 13, 2025',
  status = null,
  isActiveRequest = false,
  onClick,
  onDotMenuClick,
  onRename,
  onCopy,
  onDelete,
  isDeleting = false,
  className = '',
  fullWidth = false
}) => {
  // 🔬 DIAGNOSTIC: Log received status (only when status exists)
  useEffect(() => {
    if (status) {
      console.log('[ClipListItem] 🔍 DIAGNOSTIC:', {
        step: 'Component received status',
        clipId: id?.substring(0, 20) + '...',
        title,
        status,
        isActiveRequest
      });
    }
  }, [status, id, title, isActiveRequest]);

  const [isHovered, setIsHovered] = useState(false);
```

---

## How to Use This Diagnostic

1. **Add all diagnostic code** from above sections to the respective files
2. **Clear browser cache** and refresh (Cmd+Shift+R)
3. **Open DevTools Console** (Cmd+Option+J)
4. **Go offline** (DevTools > Network tab > Throttling > Offline)
5. **Record audio** while offline
6. **Watch console** for diagnostic logs
7. **Look for missing steps** or unexpected values

The console should show logs in this order:
1. `[getDisplayClip] Children found for parent`
2. `[getDisplayClip] Status checks completed` (should show `hasPendingChildren: true`)
3. `[getDisplayClip] Status derivation complete` (should show `derivedStatus: 'pending-child'`)
4. `[ClipHomeScreen] Status mapped for ClipListItem` (should show `listItemStatus: 'pending'`)
5. `[ClipListItem] Component received status` (should show `status: 'pending'`)

**If any step is missing or has wrong values, that's where the bug is!**

---

## Most Likely Bug

Based on the code review, I suspect **Hypothesis #1**: The child isn't in the `allClips` array when `getDisplayClip` is called.

**Why**:
- The logs show "First child created, Zustand selector will auto-update"
- But this is a console log, not a Zustand state update confirmation
- There might be a timing issue where:
  1. Parent created in Zustand ✅
  2. Child created in Zustand ✅
  3. ClipHomeScreen re-renders with new `clips` prop
  4. BUT the `clips` prop still has old data (before child was added)?

**Possible cause**: Zustand's persistence middleware might be causing a delay in propagating the child update to all subscribers.

**If this is the bug, the fix would be**:
- Ensure child is added to store BEFORE navigation to home screen
- Or ensure ClipHomeScreen subscribes directly to Zustand instead of relying on props

---

**User: Please add all diagnostic code and test offline recording. Report back with console logs.**
