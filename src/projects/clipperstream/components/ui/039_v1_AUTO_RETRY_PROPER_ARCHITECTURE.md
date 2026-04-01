# 036_v1 - Auto-Retry Proper Architecture Design

**Date**: December 31, 2025  
**Status**: ARCHITECTURE DESIGN - Industry best practices  
**Type**: Design Document - No code changes yet

---

## Goals

Design a proper auto-retry architecture that:
1. Correctly handles parent-child clip relationships
2. Implements "show first, batch rest" UX strategy
3. Provides proper queue management for multiple parents
4. Coordinates status indicators across home and record screens
5. Uses context-aware formatting with cumulative content
6. Follows industry best practices for async job processing

---

## Core Principle: Child Clips Are Temporary

**Child clips are NOT user-facing entities.**

```
Parent Clip (User-facing)
├─ ID: "clip-parent-1"
├─ Title: "Recording 01"
├─ Content: "..." (accumulated from all children)
├─ Status: null (complete)
└─ Children (Temporary storage)
    ├─ Child 1: audioId → transcribe → append to parent → DELETE
    ├─ Child 2: audioId → transcribe → append to parent → DELETE
    ├─ Child 3: audioId → transcribe → append to parent → DELETE
    └─ Child 4: audioId → transcribe → append to parent → DELETE
```

**Lifecycle:**
1. Created offline (with audioId)
2. Transcribed when online
3. Appended to parent
4. **Deleted immediately**

**Child clips should NEVER:**
- Have their own `content` field (except temporarily during processing)
- Be displayed to user as separate clips
- Trigger title generation
- Remain in clips array after processing

---

## Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DETECT ONLINE EVENT                                       │
│    - window.addEventListener('online', handleOnline)        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. FIND ALL PENDING CLIPS                                    │
│    - Filter: audioId && (pending-child | pending-retry)     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GROUP BY PARENT                                           │
│    - Create map: parentId → [child1, child2, child3, ...]  │
│    - Sort children by createdAt (oldest first)              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PROCESS EACH PARENT SEQUENTIALLY                         │
│    For each parent:                                         │
│    ├─ Process FIRST child: Show immediately                 │
│    ├─ Process REST children: Batch together                 │
│    └─ Clean up: Delete children, delete audio              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. UPDATE TITLE (If parent still has default name)          │
│    - Check if parent.title matches "Recording 0X"          │
│    - If yes: Generate AI title from accumulated content    │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Architecture

### Phase 1: Grouping by Parent

**Purpose**: Organize pending clips by their parent for efficient processing.

```typescript
interface PendingClipGroup {
  parentId: string;
  parent: Clip;
  children: Clip[];  // Sorted by createdAt (oldest first)
}

function groupPendingClipsByParent(allClips: Clip[]): PendingClipGroup[] {
  // 1. Find all pending children
  const pendingChildren = allClips.filter(c =>
    c.audioId && 
    c.parentId &&  // MUST have parentId
    (c.status === 'pending-child' || c.status === 'pending-retry')
  );

  // 2. Group by parentId
  const grouped = new Map<string, Clip[]>();
  for (const child of pendingChildren) {
    if (!grouped.has(child.parentId!)) {
      grouped.set(child.parentId!, []);
    }
    grouped.get(child.parentId!)!.push(child);
  }

  // 3. Create PendingClipGroup objects
  const groups: PendingClipGroup[] = [];
  for (const [parentId, children] of grouped.entries()) {
    const parent = allClips.find(c => c.id === parentId);
    if (!parent) {
      console.warn('[Auto-retry] Parent not found for children:', parentId);
      continue;
    }

    // Sort children by createdAt (oldest first = recording order)
    children.sort((a, b) => a.createdAt - b.createdAt);

    groups.push({ parentId, parent, children });
  }

  return groups;
}
```

**Why This Matters:**
- Processes all children of a parent together
- Maintains recording order (oldest first)
- Detects orphaned children (parent deleted)

---

### Phase 2: Process First Child (Immediate Feedback)

**Purpose**: Give user immediate feedback that transcription is working.

```typescript
async function processFirstChild(
  parent: Clip,
  child: Clip
): Promise<{ rawText: string; formattedText: string } | null> {
  
  console.log('[Auto-retry] Processing FIRST child of parent:', parent.id);
  
  // 1. Update child status: transcribing
  updateClip(child.id, { status: 'transcribing' });
  
  // 2. Get audio from IndexedDB
  const audioBlob = await getAudio(child.audioId!);
  if (!audioBlob) {
    console.error('[Auto-retry] Audio not found for child:', child.id);
    updateClip(child.id, { status: 'failed' });
    return null;
  }
  
  // 3. Transcribe
  const { text: rawText, error } = await transcribeRecording(audioBlob);
  if (!rawText || rawText.length === 0) {
    console.error('[Auto-retry] Transcription failed for child:', child.id);
    updateClip(child.id, { status: 'failed' });
    return null;
  }
  
  // 4. Format (NO CONTEXT for first child)
  const isAppending = parent.content && parent.content.length > 0;
  const context = isAppending ? parent.formattedText : undefined;
  
  const { formattedText } = await formatText(rawText, context);
  
  // 5. Append to parent IMMEDIATELY (user sees text appear)
  const updatedParent = {
    rawText: parent.rawText 
      ? parent.rawText + '\n\n' + rawText 
      : rawText,
    formattedText: parent.formattedText 
      ? parent.formattedText + ' ' + formattedText 
      : formattedText,
    content: parent.content 
      ? parent.content + ' ' + formattedText 
      : formattedText,
    status: null  // Parent is now complete (has content)
  };
  
  updateClip(parent.id, updatedParent);
  
  // 6. Delete child clip
  deleteClip(child.id);
  
  // 7. Delete audio from IndexedDB
  await deleteAudio(child.audioId!);
  
  console.log('[Auto-retry] First child processed, parent updated immediately');
  
  return { rawText, formattedText };
}
```

**Why This Matters:**
- User sees first transcription appear within ~2 seconds
- Confirms the process is working
- Reduces perceived wait time

---

### Phase 3: Process Remaining Children (Batched)

**Purpose**: Process remaining children efficiently without jarring UI updates.

```typescript
async function processRemainingChildren(
  parent: Clip,
  children: Clip[],
  cumulativeContent: { rawText: string; formattedText: string }
): Promise<void> {
  
  console.log('[Auto-retry] Processing REMAINING', children.length, 'children of parent:', parent.id);
  
  // Accumulate all transcriptions before updating UI
  let accumulatedRaw = cumulativeContent.rawText;
  let accumulatedFormatted = cumulativeContent.formattedText;
  
  for (const child of children) {
    // 1. Update child status: transcribing
    updateClip(child.id, { status: 'transcribing' });
    
    // 2. Get audio
    const audioBlob = await getAudio(child.audioId!);
    if (!audioBlob) {
      console.error('[Auto-retry] Audio not found for child:', child.id);
      updateClip(child.id, { status: 'failed' });
      continue;
    }
    
    // 3. Transcribe
    const { text: rawText, error } = await transcribeRecording(audioBlob);
    if (!rawText || rawText.length === 0) {
      console.error('[Auto-retry] Transcription failed for child:', child.id);
      updateClip(child.id, { status: 'failed' });
      continue;
    }
    
    // 4. Format WITH CONTEXT (cumulative content so far)
    const { formattedText } = await formatText(rawText, accumulatedFormatted);
    
    // 5. Accumulate (don't update parent yet)
    accumulatedRaw += '\n\n' + rawText;
    accumulatedFormatted += ' ' + formattedText;
    
    // 6. Delete child clip
    deleteClip(child.id);
    
    // 7. Delete audio
    await deleteAudio(child.audioId!);
    
    console.log('[Auto-retry] Child processed (batched):', child.id);
  }
  
  // 8. Update parent ONCE with all accumulated content
  const currentParent = getClipById(parent.id);
  if (currentParent) {
    updateClip(parent.id, {
      rawText: accumulatedRaw,
      formattedText: accumulatedFormatted,
      content: accumulatedFormatted,
      status: null
    });
    
    console.log('[Auto-retry] Batch complete, parent updated with all remaining content');
  }
}
```

**Why This Matters:**
- User sees ONE smooth update for all remaining clips
- Not 3-4 jarring individual animations
- AI formatter has full context for each clip (better paragraph decisions)

---

### Phase 4: Title Generation

**Purpose**: Update parent title after all children processed.

```typescript
async function updateParentTitle(parent: Clip): Promise<void> {
  // Only generate title if parent still has default "Recording 0X" name
  const isDefaultTitle = /^Recording \d+$/.test(parent.title);
  
  if (!isDefaultTitle) {
    console.log('[Auto-retry] Parent already has custom title, skipping:', parent.title);
    return;
  }
  
  // Only generate if parent has content
  if (!parent.content || parent.content.length === 0) {
    console.log('[Auto-retry] Parent has no content, skipping title generation');
    return;
  }
  
  console.log('[Auto-retry] Generating title for parent:', parent.id);
  
  // Trigger title generation (existing logic)
  await generateTitleInBackground(parent.id, parent.content);
}
```

**Why This Matters:**
- Only generates title AFTER all children processed
- Doesn't generate for children (they're deleted)
- Respects user's custom titles

---

### Phase 5: Main Auto-Retry Loop

**Purpose**: Orchestrate the entire process.

```typescript
async function handleOnline() {
  console.log('[Auto-retry] Going online, checking for pending clips');
  
  const allClips = useClipStore.getState().clips;
  
  // 1. Group pending clips by parent
  const groups = groupPendingClipsByParent(allClips);
  
  if (groups.length === 0) {
    console.log('[Auto-retry] No pending clips to process');
    return;
  }
  
  console.log('[Auto-retry] Found', groups.length, 'parents with pending children');
  
  // 2. Process each parent SEQUENTIALLY
  for (const group of groups) {
    const { parent, children } = group;
    
    console.log('[Auto-retry] Processing parent:', parent.id, 'with', children.length, 'children');
    
    if (children.length === 0) continue;
    
    // 3. Split children: first vs rest
    const [firstChild, ...restChildren] = children;
    
    // 4. Process first child (immediate feedback)
    const firstResult = await processFirstChild(parent, firstChild);
    if (!firstResult) {
      console.error('[Auto-retry] First child failed, skipping remaining');
      continue;
    }
    
    // 5. Process remaining children (batched)
    if (restChildren.length > 0) {
      await processRemainingChildren(parent, restChildren, firstResult);
    }
    
    // 6. Update parent title (if needed)
    await updateParentTitle(parent);
    
    console.log('[Auto-retry] Completed parent:', parent.id);
  }
  
  console.log('[Auto-retry] All pending clips processed');
}
```

**Why This Matters:**
- Clear orchestration of entire flow
- Each parent processed independently
- Handles multiple parents in queue

---

## Status Indicator Coordination

### Problem Statement

From user's requirements:
> "For example, the rare case where you're online and for some reason, because of a bad note or your clips not transcribing, or basically you finish an actual transcription, you're on level. It's not transcribing. We need to know exactly when it's going to go towards pending clip because in 'our clips never fail'. So even if you finish your recording and for some reason is not transcribing your online, it tries to do the transcripts kick off the transcriptions 3 times and then they're retry. We have a file that covers like the whole retry interval thing that then kicks in after like the 3 field attempts because you have a pending clip there and it's then using the intervals. That's when you can have on the outside for home screen like we show in clip list a situation where you are between attempts and the spinner of the Transcribing state thing is not spinning."

### Status States

From `000_COMPLETE_APPLICATION_FLOW.md` and component files:

**For ClipListItem (Home Screen):**
```typescript
status: 'pending' | 'transcribing' | 'failed' | null
isActiveRequest: boolean  // Controls spinner (spinning vs static)
```

**For ClipOffline (Pending Clips in Record Screen):**
```typescript
status: 'waiting' | 'transcribing' | 'failed'
isActiveRequest: boolean  // Controls spinner (spinning vs static)
```

### Derived Status Logic

**Parent clips on home screen should show:**

```typescript
function deriveParentStatus(parent: Clip, allClips: Clip[]): {
  status: 'pending' | 'transcribing' | null;
  isActiveRequest: boolean;
} {
  // Find all children of this parent
  const children = allClips.filter(c => c.parentId === parent.id);
  
  if (children.length === 0) {
    // No children: Show parent's own status
    return {
      status: parent.status as any,
      isActiveRequest: false
    };
  }
  
  // Has children: Derive status from children
  const hasTranscribing = children.some(c => c.status === 'transcribing');
  const hasPending = children.some(c => 
    c.status === 'pending-child' || c.status === 'pending-retry'
  );
  
  if (hasTranscribing) {
    return {
      status: 'transcribing',
      isActiveRequest: true  // Spinner spinning
    };
  }
  
  if (hasPending) {
    return {
      status: 'pending',
      isActiveRequest: false  // Static icon (waiting between retries)
    };
  }
  
  // All children processed
  return {
    status: null,  // Complete
    isActiveRequest: false
  };
}
```

**Children in record screen should show:**

```typescript
function deriveChildStatus(child: Clip): {
  status: 'waiting' | 'transcribing';
  isActiveRequest: boolean;
} {
  if (child.status === 'transcribing') {
    return {
      status: 'transcribing',
      isActiveRequest: true  // Spinner spinning
    };
  }
  
  // Default: waiting
  return {
    status: 'waiting',
    isActiveRequest: false  // Static icon
  };
}
```

---

## Retry Mechanism (3 Attempts + Interval)

### Current Behavior

Currently, auto-retry runs ONCE when coming online. If it fails, the clip stays in `failed` state with no further attempts.

### Required Behavior

From user's message:
> "it tries to do the transcripts kick off the transcriptions 3 times and then they're retry"

### Proposed Architecture

**Phase 1: Immediate Retry (3 attempts)**

```typescript
async function transcribeWithRetry(
  audioBlob: Blob,
  maxAttempts: number = 3
): Promise<{ text: string; error?: string } | null> {
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[Auto-retry] Transcription attempt ${attempt}/${maxAttempts}`);
    
    const result = await transcribeRecording(audioBlob);
    
    if (result.text && result.text.length > 0) {
      // Success
      return result;
    }
    
    if (attempt < maxAttempts) {
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All 3 attempts failed
  return null;
}
```

**Phase 2: Interval Retry (After 3 failed attempts)**

```typescript
// Set up interval retry for clips that failed immediate retry
useEffect(() => {
  const retryInterval = setInterval(() => {
    const allClips = useClipStore.getState().clips;
    const failedClips = allClips.filter(c =>
      c.audioId && c.status === 'pending-retry'
    );
    
    if (failedClips.length > 0 && navigator.onLine) {
      console.log('[Interval Retry] Attempting to process', failedClips.length, 'failed clips');
      handleOnline();  // Trigger auto-retry again
    }
  }, 30000);  // Every 30 seconds
  
  return () => clearInterval(retryInterval);
}, []);
```

**Status Transitions:**

```
Clip created offline:
  status: 'pending-child', isActiveRequest: false
  → UI: Static icon, "Waiting"

Come online (auto-retry triggered):
  status: 'transcribing', isActiveRequest: true
  → UI: Spinning icon, "Transcribing..."

Transcription attempt 1 fails:
  (stay in 'transcribing')
  → UI: Still spinning

Transcription attempt 2 fails:
  (stay in 'transcribing')
  → UI: Still spinning

Transcription attempt 3 fails:
  status: 'pending-retry', isActiveRequest: false
  → UI: Static icon, "Waiting to transcribe"
  → Interval retry kicks in (every 30s)

Interval retry succeeds:
  status: 'transcribing' → processing → null (complete)
  → UI: Spinner stops, text appears
```

---

## Error Handling & Edge Cases

### 1. Clipboard API Error

**Problem**: Clipboard API fails when document not focused.

**Solution**: Wrap in try-catch, log but don't throw.

```typescript
try {
  navigator.clipboard.writeText(textToCopy);
  setShowCopyToast(true);
} catch (error) {
  console.warn('[Auto-retry] Clipboard write failed (document not focused):', error);
  // Don't show toast, don't throw error
}
```

### 2. Orphaned Children

**Problem**: Parent deleted while children pending.

**Solution**: Detect and handle in grouping phase.

```typescript
for (const [parentId, children] of grouped.entries()) {
  const parent = allClips.find(c => c.id === parentId);
  if (!parent) {
    console.warn('[Auto-retry] Orphaned children detected, cleaning up:', parentId);
    // Delete orphaned children
    for (const child of children) {
      deleteClip(child.id);
      if (child.audioId) {
        await deleteAudio(child.audioId);
      }
    }
    continue;
  }
  // ...
}
```

### 3. Network Drops During Processing

**Problem**: Network drops while processing a child.

**Solution**: Let transcription fail, retry on next online event.

```typescript
try {
  const result = await transcribeRecording(audioBlob);
  // ...
} catch (error) {
  console.error('[Auto-retry] Network error during transcription:', error);
  updateClip(child.id, { status: 'pending-retry' });
  // Will be picked up on next online event
}
```

### 4. User Deletes Parent During Processing

**Problem**: User deletes parent while auto-retry processing its children.

**Solution**: Check parent exists before updating.

```typescript
const currentParent = getClipById(parent.id);
if (!currentParent) {
  console.warn('[Auto-retry] Parent deleted during processing, aborting');
  // Children already deleted, just stop
  return;
}
updateClip(parent.id, {...});
```

---

## Implementation Checklist

**Phase 1: Core Auto-Retry Logic**
- [ ] Implement `groupPendingClipsByParent()`
- [ ] Implement `processFirstChild()`
- [ ] Implement `processRemainingChildren()`
- [ ] Implement `updateParentTitle()`
- [ ] Update main `handleOnline()` loop

**Phase 2: Status Indicators**
- [ ] Implement `deriveParentStatus()` in `ClipHomeScreen`
- [ ] Implement `deriveChildStatus()` in `ClipRecordScreen`
- [ ] Add `isActiveRequest` prop to `ClipListItem`
- [ ] Add `isActiveRequest` prop to `ClipOffline`

**Phase 3: Retry Mechanism**
- [ ] Implement `transcribeWithRetry()` (3 attempts)
- [ ] Implement interval retry (30s)
- [ ] Add status transitions

**Phase 4: Error Handling**
- [ ] Wrap clipboard API in try-catch
- [ ] Handle orphaned children
- [ ] Handle network drops
- [ ] Handle parent deletion during processing

**Phase 5: Testing**
- [ ] Test single parent, single child
- [ ] Test single parent, 4 children (show first, batch rest)
- [ ] Test multiple parents with children
- [ ] Test retry mechanism (3 attempts + interval)
- [ ] Test status indicators (home + record screens)
- [ ] Test edge cases (orphans, network drops, deletions)

---

## Next Steps

1. Review this architecture document
2. Identify any gaps or concerns
3. Only after approval, create implementation plan
4. Implement in phases with testing after each

**DO NOT WRITE CODE** until architecture is approved.

---

**End of Document**

