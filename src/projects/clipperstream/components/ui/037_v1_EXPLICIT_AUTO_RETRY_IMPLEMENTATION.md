# 037_v1 - Auto-Retry EXPLICIT Implementation Plan
## Complete, Line-by-Line Implementation (No Examples)

**Date**: December 31, 2025
**Status**: 📋 **EXPLICIT IMPLEMENTATION PLAN** - Every line specified
**Approach**: Phased with testing checkpoints

---

## Critical Requirements (From User Feedback)

1. ✅ **Better Merging Strategy** (User's approach):
   - 1 clip: Process → Merge to parent → Show
   - 2 clips: Process 1 → Show, Process 2 → Merge to parent with 1
   - 4 clips: Process 1 → Show, then accumulate 2+3+4 in memory, merge batch to parent

2. ✅ **Explicit Code** (No examples):
   - Show EXACT line numbers
   - Show COMPLETE code blocks
   - Specify what to DELETE

3. ✅ **Phased Implementation**:
   - Phase 1: Test Zustand selector ALONE
   - Phase 2: Test single child processing
   - Phase 3: Test batch processing
   - Testing checkpoint after each phase

4. ✅ **Comprehensive Migration**:
   - Identify ALL 7 places selectedPendingClips is READ
   - Verify Zustand selector works for each

---

## 🌿 Git Branch Strategy - CRITICAL FIRST STEP

**⚠️ CREATE BRANCH BEFORE ANY CODE CHANGES**

### Step 0: Create Feature Branch

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create new feature branch for this implementation
git checkout -b feature/offline-auto-retry-v2.7.0
```

### Why This Is Critical

1. **Safety Net**: Can easily revert if issues arise during implementation
2. **Clean History**: Each phase gets its own commit for easy rollback
3. **Testing Isolation**: Test thoroughly on branch before merging to main
4. **Production Protection**: Main branch stays stable during development

### Commit Strategy Per Phase

**Phase 1 Commit** (After testing selector migration):
```bash
git add .
git commit -m "Phase 1: Migrate selectedPendingClips to Zustand selector

- Replace useState with Zustand selector in ClipMasterScreen.tsx
- Remove all setSelectedPendingClips calls
- Remove selectedPendingClips from useOfflineRecording.ts
- Tested all 7 read locations
- Verified auto-update on Zustand changes

🧪 Tested with: Clicking clips, navigation, pending clip display"
```

**Phase 2 Commit** (After testing batch processing):
```bash
git add .
git commit -m "Phase 2: Implement batch processing with user's merging strategy

- Add formatChildTranscription (no clipboard, no nav state)
- Add processChild (transcribe + format single child)
- Add processParentChildren (accumulate batch, merge once)
- Rewrite auto-retry handler to use batch processing
- Children deleted after merge to parent

🧪 Tested with: 1 clip, 2 clips, 4 clips (batch accumulation)"
```

**Phase 3 Commit** (After testing title generation):
```bash
git add .
git commit -m "Phase 3: Update title generator for merged content

- Modify useParentTitleGenerator to trigger on parent content
- Remove dependency on children (deleted after merge)
- Trigger when parent has content but still has 'Recording XX' title

🧪 Tested with: Title generation after children merged"
```

### Testing Before Merge

**Before merging to main**:
1. Test complete flow: 4 pending clips → go online → verify batch display
2. Test edge cases: 1 clip, 2 clips, mixed online/offline
3. Test title generation after all children merged
4. Verify no clipboard errors
5. Verify UI shows content immediately after first clip

**Merge to main only after all tests pass**:
```bash
git checkout main
git merge feature/offline-auto-retry-v2.7.0
git push origin main
```

**If issues arise, revert easily**:
```bash
# Revert entire feature
git checkout main
git branch -D feature/offline-auto-retry-v2.7.0

# Or revert specific phase
git checkout feature/offline-auto-retry-v2.7.0
git revert <commit-hash>
```

---

## Part 1: selectedPendingClips Usage Analysis

### ALL Places It's Used in ClipMasterScreen.tsx:

**READS** (Must verify selector works):
1. Line 359: `selectedPendingClips.length > 0` → Record button handler
2. Line 363: `selectedPendingClips[0].id` → Get first clip ID
3. Line 366: `selectedPendingClips[0].title` → Get first clip title
4. Line 373: `selectedPendingClips.length === 0` → Record button check
5. Line 1092: `selectedPendingClips.length > 0` → getRecordScreenState
6. Line 1106: `selectedPendingClips.length > 0` → getDisplayPendingClips
7. Line 1108: `return selectedPendingClips` → getDisplayPendingClips

**WRITES** (Will be deleted):
1. Line 152: `const [selectedPendingClips, setSelectedPendingClips] = useState<PendingClip[]>([]);`
2. Line 251: `setSelectedPendingClips(pendingClips)` in handleClipClick
3. Line 289: `setSelectedPendingClips([])` in handleBackClick
4. Line 307: `setSelectedPendingClips([])` in handleNewClipClick

**EXTERNAL WRITES** (Will be deleted):
1. useOfflineRecording.ts Line 16: `setSelectedPendingClips` parameter
2. useOfflineRecording.ts Line 38: `setSelectedPendingClips` destructuring
3. useOfflineRecording.ts Line 170: `setSelectedPendingClips([pendingClip])`
4. useOfflineRecording.ts Line 228: `setSelectedPendingClips(prev => [...prev, pendingClip])`

**Passed to Components**:
1. Line 988: Passed to useOfflineRecording hook
2. Line 1158: Passed to ClipRecordScreen as `pendingClips` prop

---

## PHASE 1: Replace useState with Zustand Selector

### Step 1.1: Add Zustand Selector (ClipMasterScreen.tsx)

**Location**: Line 152
**Action**: REPLACE line 152

**DELETE THIS**:
```typescript
const [selectedPendingClips, setSelectedPendingClips] = useState<PendingClip[]>([]);
```

**ADD THIS INSTEAD**:
```typescript
// v2.7.0: Zustand selector for selectedPendingClips (replaces useState)
// Auto-updates when children change, no manual sync needed
const selectedPendingClips = useClipStore((state) => {
  // If no parent selected, return empty array
  if (!currentClipId) return [];

  // Find all children of current parent
  const children = state.clips
    .filter(c => c.parentId === currentClipId)
    .sort((a, b) => {
      // Sort by creation time (oldest first = recording order)
      const timestampA = parseInt(a.id.split('-')[1], 10) || 0;
      const timestampB = parseInt(b.id.split('-')[1], 10) || 0;
      return timestampA - timestampB;
    });

  // Convert Clip → PendingClip format (matches PendingClip interface)
  return children.map(child => ({
    id: child.id,
    title: child.pendingClipTitle || 'Pending',
    time: child.duration || '0:00',
    status: (child.status === 'transcribing' ? 'transcribing' : 'waiting') as 'waiting' | 'transcribing',
    isActiveRequest: state.activeHttpClipId === child.id
  }));
});
```

**Why This Works**:
- ✅ Returns array of PendingClip objects (same structure as useState)
- ✅ Has `.length` property (works for all 7 READ locations)
- ✅ Has `[0].id` and `[0].title` (works for lines 363, 366)
- ✅ Auto-updates when Zustand clips change
- ✅ No manual sync needed

---

### Step 1.2: Remove setSelectedPendingClips from handleClipClick

**Location**: Line 222-279 (handleClipClick function)
**Action**: DELETE lines 243-257

**FIND THIS BLOCK**:
```typescript
    if (children.length > 0) {
      // v2.3.2 FIX: Sort children by creation time (timestamp in ID)
      // IDs are like "clip-1766868716300-random" where middle part is timestamp
      const sortedChildren = children.sort((a, b) => {
        const timestampA = parseInt(a.id.split('-')[1], 10) || 0;
        const timestampB = parseInt(b.id.split('-')[1], 10) || 0;
        return timestampA - timestampB;  // Ascending (oldest first)
      });

      // Convert to pending clip format
      const pendingClips = sortedChildren.map(child => ({
        id: child.id,
        title: child.pendingClipTitle || 'Pending',
        time: child.duration || '0:00',
        status: child.status === 'transcribing' ? 'transcribing' as const : 'waiting' as const,
        isActiveRequest: isActiveRequest && currentClipId === child.id
      }));

      setSelectedPendingClips(pendingClips);  // ← DELETE THIS ENTIRE BLOCK

      log.info('Loaded parent with children', {
        parentId: clipId,
        childCount: children.length,
        childOrder: pendingClips.map(p => p.title)
      });
    } else {
      setSelectedPendingClips([]);  // ← DELETE THIS TOO
    }
```

**REPLACE WITH**:
```typescript
    if (children.length > 0) {
      // v2.7.0: selectedPendingClips now uses Zustand selector, no manual set needed
      log.info('Loaded parent with children', {
        parentId: clipId,
        childCount: children.length
      });
    }
```

---

### Step 1.3: Remove setSelectedPendingClips from handleBackClick

**Location**: Line 282-298 (handleBackClick function)
**Action**: DELETE line 289

**FIND THIS**:
```typescript
  const handleBackClick = useCallback(() => {
    setIsAppendMode(false);
    setCurrentClipId(null);  // v2.3.1: Clear parent-child context
    setAppendBaseContent('');
    setSelectedPendingClips([]);  // ← DELETE THIS LINE
    resetRecording();
```

**REPLACE WITH**:
```typescript
  const handleBackClick = useCallback(() => {
    setIsAppendMode(false);
    setCurrentClipId(null);  // v2.3.1: Clear parent-child context (selector auto-clears)
    setAppendBaseContent('');
    // v2.7.0: selectedPendingClips cleared automatically when currentClipId = null
    resetRecording();
```

---

### Step 1.4: Remove setSelectedPendingClips from handleNewClipClick

**Location**: Line 300-316 (handleNewClipClick function)
**Action**: DELETE line 307

**FIND THIS**:
```typescript
  const handleNewClipClick = useCallback(() => {
    setIsAppendMode(false);
    setCurrentClipId(null);  // v2.3.1: Clear any existing parent-child context
    setAppendBaseContent('');
    setSelectedPendingClips([]);  // ← DELETE THIS LINE
    resetRecording();
```

**REPLACE WITH**:
```typescript
  const handleNewClipClick = useCallback(() => {
    setIsAppendMode(false);
    setCurrentClipId(null);  // v2.3.1: Clear context (selector auto-clears)
    setAppendBaseContent('');
    // v2.7.0: selectedPendingClips cleared automatically when currentClipId = null
    resetRecording();
```

---

### Step 1.5: Remove setSelectedPendingClips from useOfflineRecording.ts

**File**: useOfflineRecording.ts

**Action 1**: DELETE line 16
**FIND**: `setSelectedPendingClips: React.Dispatch<React.SetStateAction<PendingClip[]>>;`
**DELETE**: Entire line

**Action 2**: DELETE line 38
**FIND**: `setSelectedPendingClips,`
**DELETE**: Entire line

**Action 3**: DELETE line 170
**FIND**: `setSelectedPendingClips([pendingClip]);`
**DELETE**: Entire line

**Action 4**: DELETE line 228
**FIND**: `setSelectedPendingClips(prev => [...prev, pendingClip]);`
**DELETE**: Entire line

---

### Step 1.6: Remove setSelectedPendingClips from ClipMasterScreen useOfflineRecording call

**Location**: Line 988 (useOfflineRecording hook call)

**FIND THIS**:
```typescript
  const { handleOfflineRecording } = useOfflineRecording({
    setCurrentClipId,
    setSelectedPendingClips,  // ← DELETE THIS LINE
    formatDuration,
    clipToPendingClip,
    addClip,
    getClips
  });
```

**REPLACE WITH**:
```typescript
  const { handleOfflineRecording } = useOfflineRecording({
    setCurrentClipId,
    // v2.7.0: setSelectedPendingClips removed (Zustand selector handles it)
    formatDuration,
    clipToPendingClip,
    addClip,
    getClips
  });
```

---

### Step 1.7: Remove formatDuration and clipToPendingClip (No Longer Needed)

**useOfflineRecording no longer needs these helpers since it's not building PendingClip objects**

**Action 1**: Remove formatDuration parameter (Line 19 in useOfflineRecording.ts)
**DELETE**: `formatDuration: (seconds: number) => string;`

**Action 2**: Remove clipToPendingClip parameter (Line 20)
**DELETE**: `clipToPendingClip: (clip: Clip) => PendingClip;`

**Action 3**: Remove from destructuring (Line 39-40)
**DELETE**: `formatDuration,` and `clipToPendingClip,`

**Action 4**: Remove from ClipMasterScreen call (Line 990-991)
**DELETE**: `formatDuration,` and `clipToPendingClip,`

---

## PHASE 1 TESTING CHECKPOINT ✅

**Before proceeding to Phase 2, verify**:

### Test 1.1: Selector Works on Load
```
1. Open app
2. Go offline
3. Record Clip 001
4. Navigate to home, click parent
5. Verify: selectedPendingClips.length === 1
6. Verify: selectedPendingClips[0].title === 'Clip 001'
7. Verify: ClipOffline component renders
```

### Test 1.2: Selector Updates During Transcription
```
1. With pending clip loaded (from Test 1.1)
2. Go online
3. Watch auto-retry process clip
4. Verify: selectedPendingClips updates in real-time
5. Verify: When child deleted, selectedPendingClips becomes []
6. Verify: Screen state changes from 'offline' to 'transcribed'
```

### Test 1.3: All 7 Read Locations Work
```
1. Line 359: Record button handler - verify length check works
2. Line 363: Get clip ID - verify [0].id works
3. Line 366: Get clip title - verify [0].title works
4. Line 373: Empty check - verify length === 0 works
5. Line 1092: getRecordScreenState - verify length check works
6. Line 1106: getDisplayPendingClips - verify length check works
7. Line 1108: Return array - verify returns array correctly
```

**If ALL tests pass**: Proceed to Phase 2
**If ANY test fails**: Fix Phase 1 before continuing

---

## PHASE 2: Batch Accumulation (User's Strategy)

### User's Better Merging Approach:

```
If 1 child:
  Process child 1 → Merge to parent → Show

If 2 children:
  Process child 1 → Merge to parent → Show
  Process child 2 → Merge to parent → Show

If 3+ children:
  Process child 1 → Merge to parent → Show immediately

  Accumulate batch in memory:
    Process child 2 → Hold in memory (accumulate2 = child2)
    Process child 3 → Merge to accumulate2 (accumulate3 = child2 + child3)
    Process child 4 → Merge to accumulate3 (accumulate4 = child2 + child3 + child4)

  Merge accumulated batch to parent → Show batch
```

**Why This is Better**:
- Only 2 parent updates (first + batch) instead of 4
- Less Zustand churn
- Batch accumulates independently

---

### Step 2.1: Create formatChildTranscription Function

**Location**: After line 908 (after formatTranscriptionInBackground)
**Action**: ADD new useCallback

```typescript
/**
 * Format child clip transcription (for auto-retry)
 * NO clipboard copy, NO nav state changes
 * WITH context support for smart paragraph breaks
 */
const formatChildTranscription = useCallback(async (
  clipId: string,
  rawText: string,
  context?: string  // ← Accumulated formatted text for AI context (API slices last 500 chars)
): Promise<string> => {
  const clip = getClipById(clipId);
  if (!clip) {
    console.warn('[FormatChild] Clip not found:', clipId);
    return rawText;  // Fallback
  }

  console.log('[FormatChild] Starting for:', clip.pendingClipTitle, '| Has context:', !!context);

  try {
    // Call formatting API
    // Context auto-sliced to last 500 chars by API (see textFormatter.ts line 93)
    // AI uses this for smart paragraph breaks and pronoun resolution
    const response = await fetch('/api/clipperstream/format-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText,
        existingFormattedContext: context  // ← Pass full context (API slices last 500)
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const formattedText = data.formattedText || data.formatted || rawText;

    console.log('[FormatChild] Success:', clip.pendingClipTitle);

    // Update child with formatted text
    updateClip(clipId, {
      formattedText: formattedText,
      content: formattedText,
      status: null  // Complete
    });

    // ⚠️ NO clipboard copy (per user requirement - document not focused during auto-retry)
    // ⚠️ NO setRecordNavState (not relevant for auto-retry)

    return formattedText;

  } catch (error) {
    console.error('[FormatChild] Failed:', clip.pendingClipTitle, error);

    // Fallback: use raw text
    updateClip(clipId, {
      formattedText: rawText,
      content: rawText,
      status: null
    });

    return rawText;
  }
}, [getClipById, updateClip]);
```

---

### Step 2.2: Create processChild Function

**Location**: After formatChildTranscription
**Action**: ADD new useCallback

```typescript
/**
 * Process single child clip (transcribe + format)
 * Returns formatted text for accumulation
 */
const processChild = useCallback(async (
  child: Clip,
  context?: string  // ← Accumulated formatted text for AI context
): Promise<{
  success: boolean;
  rawText: string;
  formattedText: string;
}> => {
  console.log('[ProcessChild] Starting:', child.pendingClipTitle);

  try {
    // Step 1: Get audio from IndexedDB
    const audioBlob = await getAudio(child.audioId!);
    if (!audioBlob) {
      console.warn('[ProcessChild] Audio not found for:', child.id);
      updateClip(child.id, {
        status: 'failed',
        transcriptionError: 'Audio not found in storage'
      });
      return { success: false, rawText: '', formattedText: '' };
    }

    // Step 2: Update status to transcribing
    updateClip(child.id, { status: 'transcribing' });

    // Step 3: Transcribe (uses existing retry mechanism)
    // Retry implementation in useClipRecording.ts lines 410-444:
    //   - Attempts 1-3: Rapid fire (no waits between attempts)
    //   - Attempts 4+: Interval waits (1min, 2min, 4min, 5min cycle repeats)
    // TODO Phase 4: Extract retry logic to shared function for auto-retry
    //   - Track clip.retryCount and clip.nextRetryTime for UI
    //   - Coordinate spinner state (stops during interval waits)
    const transcriptionResult = await transcribeRecording(audioBlob);
    const { text: rawText, error: transcriptionError } = transcriptionResult;

    if (!rawText || rawText.length === 0) {
      console.warn('[ProcessChild] Transcription failed:', child.pendingClipTitle);
      updateClip(child.id, {
        status: 'failed',
        transcriptionError: transcriptionError === 'validation'
          ? `No audio detected in ${child.pendingClipTitle}`
          : 'Transcription failed'
      });
      return { success: false, rawText: '', formattedText: '' };
    }

    // Step 4: Store raw text
    updateClip(child.id, {
      rawText: rawText,
      content: rawText,  // Temporary (will be replaced with formatted)
      status: 'formatting'
    });

    // Step 5: Format with context (returns formatted text)
    const formattedText = await formatChildTranscription(child.id, rawText, context);

    // Step 6: Delete audio from IndexedDB
    if (child.audioId) {
      await deleteAudio(child.audioId);
      updateClip(child.id, { audioId: undefined });
    }

    console.log('[ProcessChild] Success:', child.pendingClipTitle);

    return {
      success: true,
      rawText: rawText,
      formattedText: formattedText
    };

  } catch (error) {
    console.error('[ProcessChild] Error:', child.pendingClipTitle, error);
    updateClip(child.id, {
      status: 'failed',
      transcriptionError: error instanceof Error ? error.message : 'Unknown error'
    });
    return { success: false, rawText: '', formattedText: '' };
  }
}, [getAudio, updateClip, transcribeRecording, deleteAudio, formatChildTranscription]);
```

---

### Step 2.3: Create processParentChildren Function (User's Strategy)

**Location**: After processChild
**Action**: ADD new useCallback

```typescript
/**
 * Process all children for a parent (implements user's batch strategy)
 * Strategy:
 *   - 1 child: Show immediately
 *   - 2 children: Show first, show second
 *   - 3+ children: Show first, accumulate rest, show batch
 */
const processParentChildren = useCallback(async (
  parentId: string,
  children: Clip[]
) => {
  // Check if parent exists (orphaned children cleanup)
  const parent = getClipById(parentId);
  if (!parent) {
    console.warn('[ProcessChildren] Parent deleted during processing, cleaning up orphaned children');

    // Clean up orphaned children (parent was deleted while they were pending)
    for (const child of children) {
      console.log('[ProcessChildren] Deleting orphaned child:', child.id);
      deleteClip(child.id);

      // Delete associated audio blob
      if (child.audioId) {
        await deleteAudio(child.audioId);
      }
    }

    return;
  }

  console.log('[ProcessChildren] Starting for parent:', parentId, '| Children:', children.length);

  // Base content (in case parent already has content from previous sessions)
  let accumulatedRawText = parent.rawText || '';
  let accumulatedFormattedText = parent.formattedText || '';
  let accumulatedContent = parent.content || '';

  // Separate first child from rest
  const [firstChild, ...restChildren] = children;

  // STEP 1: Process first child (show immediately)
  if (firstChild) {
    console.log('[ProcessChildren] Processing FIRST child:', firstChild.pendingClipTitle);

    // No context for first child (it's the beginning)
    const result = await processChild(firstChild, undefined);

    if (result.success) {
      // Merge first child into parent
      accumulatedRawText += (accumulatedRawText ? ' ' : '') + result.rawText;
      accumulatedFormattedText += (accumulatedFormattedText ? ' ' : '') + result.formattedText;
      accumulatedContent += (accumulatedContent ? ' ' : '') + result.formattedText;

      // Update parent with first child content (shows immediately)
      updateClip(parentId, {
        rawText: accumulatedRawText,
        formattedText: accumulatedFormattedText,
        content: accumulatedContent,
        createdAt: Date.now()  // Move to top
      });

      console.log('[ProcessChildren] First child merged into parent:', firstChild.pendingClipTitle);

      // Delete first child
      deleteClip(firstChild.id);

      // Generate title after first clip (fire-and-forget, appears in background)
      // This matches online behavior: title from first clip's content
      // Robust for edge case: user goes offline after first clip completes
      const currentParent = getClipById(parentId);  // Refetch to avoid stale data
      if (currentParent && currentParent.title.startsWith('Recording ')) {
        console.log('[ProcessChildren] Generating title from first clip (background)');
        generateTitleInBackground(parentId, result.formattedText).catch(err => {
          console.error('[ProcessChildren] Title generation failed:', err);
        });
        // Don't await - title appears separately while rest of clips process
        // User sees: Title + Clip 001 text (remaining clips append later)
      }
    }
  }

  // STEP 2: Process remaining children (accumulate in memory, show batch)
  if (restChildren.length > 0) {
    console.log('[ProcessChildren] Processing BATCH of', restChildren.length, 'children');

    // Accumulate batch in memory (user's strategy)
    let batchRawText = '';
    let batchFormattedText = '';

    for (const child of restChildren) {
      console.log('[ProcessChildren] Processing batch child:', child.pendingClipTitle);

      // Pass accumulated formatted text as context (API slices last 500 chars)
      // Context = first child + previously processed batch children
      const contextForThisChild = accumulatedFormattedText + (batchFormattedText ? ' ' + batchFormattedText : '');
      const result = await processChild(child, contextForThisChild);

      if (result.success) {
        // Accumulate in memory (don't update parent yet)
        batchRawText += (batchRawText ? ' ' : '') + result.rawText;
        batchFormattedText += (batchFormattedText ? ' ' : '') + result.formattedText;

        console.log('[ProcessChildren] Accumulated:', child.pendingClipTitle);

        // Delete child after processing
        deleteClip(child.id);
      }
    }

    // Merge entire accumulated batch to parent at once
    accumulatedRawText += (accumulatedRawText ? ' ' : '') + batchRawText;
    accumulatedFormattedText += (accumulatedFormattedText ? ' ' : '') + batchFormattedText;
    accumulatedContent += (accumulatedContent ? ' ' : '') + batchFormattedText;

    updateClip(parentId, {
      rawText: accumulatedRawText,
      formattedText: accumulatedFormattedText,
      content: accumulatedContent,
      status: null,  // Complete
      createdAt: Date.now()
    });

    console.log('[ProcessChildren] Batch merged into parent');
  }

  console.log('[ProcessChildren] Completed parent:', parentId);
}, [getClipById, updateClip, deleteClip, deleteAudio, generateTitleInBackground, processChild]);
```

---

### Step 2.4: Rewrite Auto-Retry Handler

**Location**: Lines 910-979 (existing auto-retry useEffect)
**Action**: REPLACE entire useEffect

**DELETE THIS**:
```typescript
  // Auto-retry pending clips when network comes online
  useEffect(() => {
    const handleOnline = async () => {
      // ... existing broken code ...
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [transcribeRecording, updateClip, formatTranscriptionInBackground]);
```

**REPLACE WITH THIS**:
```typescript
  // v2.7.0: Auto-retry pending clips when network comes online
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[Auto-retry] Going online, checking for pending clips');

      const allClips = useClipStore.getState().clips;

      // Find all pending children
      const pendingChildren = allClips.filter(c =>
        c.audioId && c.status === 'pending-child'
      );

      if (pendingChildren.length === 0) {
        console.log('[Auto-retry] No pending clips to process');
        return;
      }

      // Group by parent ID
      const childrenByParent = new Map<string, Clip[]>();
      for (const child of pendingChildren) {
        if (!child.parentId) continue;
        const existing = childrenByParent.get(child.parentId) || [];
        childrenByParent.set(child.parentId, [...existing, child]);
      }

      console.log('[Auto-retry] Processing', childrenByParent.size, 'parents with pending clips');

      // Process each parent sequentially
      for (const [parentId, children] of childrenByParent.entries()) {
        const parent = allClips.find(c => c.id === parentId);
        if (!parent) {
          console.warn('[Auto-retry] Parent not found:', parentId);
          continue;
        }

        // Sort children by creation time (oldest first)
        const sortedChildren = children.sort((a, b) => {
          const timestampA = parseInt(a.id.split('-')[1], 10) || 0;
          const timestampB = parseInt(b.id.split('-')[1], 10) || 0;
          return timestampA - timestampB;
        });

        console.log('[Auto-retry] Processing parent:', parent.title, '| Children:', sortedChildren.length);

        // Process children for this parent
        await processParentChildren(parentId, sortedChildren);
      }

      console.log('[Auto-retry] Completed all parents');
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processParentChildren]);
```

---

## PHASE 2 TESTING CHECKPOINT ✅

### Test 2.1: Single Child
```
1. Go offline
2. Record Clip 001
3. Go online
4. Verify: Clip 001 transcribes
5. Verify: Text appears on screen
6. Verify: Clip 001 deleted
7. Verify: Parent has content
8. Verify: Title changes to AI-generated
```

### Test 2.2: Two Children
```
1. Go offline
2. Record Clip 001, Clip 002
3. Go online
4. Verify: Clip 001 shows immediately
5. Verify: Clip 002 shows after
6. Verify: Both deleted
7. Verify: Parent has full content (001 + 002)
```

### Test 2.3: Four Children (Batch)
```
1. Go offline
2. Record Clips 001, 002, 003, 004
3. Go online
4. Verify: Clip 001 shows immediately
5. Verify: Clips 002, 003, 004 show together (batch)
6. Verify: All deleted
7. Verify: Parent has full content (001 + 002+003+004)
8. Verify: Only 2 parent updates happened
```

**If ALL tests pass**: Proceed to Phase 3
**If ANY test fails**: Fix Phase 2 before continuing

---

## PHASE 3: Update useParentTitleGenerator

### Step 3.1: Modify Trigger Logic

**File**: useParentTitleGenerator.ts
**Location**: Lines 36-65 (entire useEffect)

**DELETE THIS**:
```typescript
  useEffect(() => {
    const parents = clips.filter(c => !c.parentId);

    for (const parent of parents) {
      if (!parent.title.startsWith('Recording ')) continue;
      if (generatedTitles.current.has(parent.id)) continue;

      const children = clips.filter(c => c.parentId === parent.id);
      if (children.length === 0) continue;

      // Check if all children complete
      const allComplete = children.every(c => c.status === null && c.formattedText);

      if (allComplete && children.length > 0) {
        const firstChild = children[0];
        if (firstChild.rawText) {
          generatedTitles.current.add(parent.id);
          generateTitleInBackground(parent.id, firstChild.rawText).catch(err => {
            console.error('Failed to generate parent title:', err);
            generatedTitles.current.delete(parent.id);
          });
        }
      }
    }
  }, [clips]);
```

**REPLACE WITH THIS**:
```typescript
  useEffect(() => {
    // v2.7.0: Trigger on parent content (children are deleted after merge)
    const parents = clips.filter(c => !c.parentId);

    for (const parent of parents) {
      // Skip if already has AI title
      if (!parent.title.startsWith('Recording ')) continue;

      // Prevent duplicate calls
      if (generatedTitles.current.has(parent.id)) continue;

      // Only generate if parent has content (from merged children)
      if (parent.content && parent.content.length > 0) {
        generatedTitles.current.add(parent.id);

        // Use parent's rawText for title generation
        generateTitleInBackground(parent.id, parent.rawText || parent.content).catch(err => {
          console.error('Failed to generate parent title:', err);
          generatedTitles.current.delete(parent.id);  // Allow retry on error
        });
      }
    }
  }, [clips, generateTitleInBackground]);
```

---

## PHASE 3 TESTING CHECKPOINT ✅

### Test 3.1: Title Generation After Merge
```
1. Go offline
2. Record Clips 001, 002, 003
3. Go online
4. Wait for auto-retry to complete
5. Verify: Parent has content
6. Verify: Title changes from "Recording 01" to AI-generated
7. Verify: Title generation happens AFTER children deleted
```

---

## Final Integration Test

### Test: Complete Flow
```
SETUP: Fresh start, no clips

1. Go offline
2. Record Clip 001 (speak: "First recording")
3. Record Clip 002 (speak: "Second recording")
4. Record Clip 003 (speak: "Third recording")
5. Record Clip 004 (speak: "Fourth recording")
6. Navigate to record screen
7. Verify: See 4 ClipOffline components
8. Go online
9. Watch carefully

EXPECTED:
✅ Clip 001 spinner starts
✅ After ~3s: Clip 001 text appears (formatted)
✅ Clip 001 ClipOffline disappears
✅ Clips 002, 003, 004 spinners start
✅ After all format: Text appears INSTANTLY (batch)
✅ All ClipOffline components disappear
✅ Title changes to AI-generated
✅ Parent has full content
✅ NO clipboard errors
✅ NO pending clips remain in Zustand

FAILURE INDICATORS:
❌ Only Clip 001 shows, rest missing
❌ Each clip shows one by one (should be batched)
❌ Pending clips remain after completion
❌ Parent stays empty
❌ Clipboard error in console
```

---

## Success Criteria

- ✅ selectedPendingClips uses Zustand selector (no useState)
- ✅ Auto-updates when children change
- ✅ First clip shows immediately
- ✅ Batch clips show together
- ✅ Only 2 parent updates (first + batch)
- ✅ Children deleted after merge
- ✅ AI title generates after completion
- ✅ No clipboard errors
- ✅ All 7 READ locations work correctly

---

## 📝 CHANGELOG - Corrections from User Feedback

**Based on**: Documents 037_01, 037_02, 037_03 (User feedback and clarifications)

### Change #1: Context Parameter for AI Formatting ✅

**What Changed**: Added `context` parameter to `formatChildTranscription` → `processChild` → `processParentChildren`

**Why**: Enables AI to understand pronoun references ("it", "they") and make smarter paragraph breaks across clips

**Implementation**:
- `formatChildTranscription(clipId, rawText, context?)` - Passes full accumulated formatted text
- API automatically slices last 500 characters (see textFormatter.ts line 93)
- First child: No context (undefined)
- Subsequent children: Pass accumulated formatted text from previous clips

**Benefits**:
- AI understands topic continuity
- Smarter paragraph break decisions
- Better pronoun resolution

---

### Change #2: Generate Title After FIRST Clip ✅

**What Changed**: Moved title generation from end of `processParentChildren` to after first child completes

**Why**: Matches online behavior, handles edge cases robustly

**User's Insight**:
> "I think that the title that we have for the clip is already there... after the first clip transcribes, we're already going to have the title"

**Edge Case Handled**: User goes offline after first clip completes
- Before: No title (waiting for all clips)
- After: Title visible from first clip, remaining clips append when online

**Implementation**:
- Generate title after first child merged to parent (line 693-704)
- Fire-and-forget (don't await - appears in background)
- Uses first clip's formatted text
- Robust for offline interruptions

---

### Change #3: Orphaned Children Cleanup ✅

**What Changed**: Added cleanup logic when parent deleted during processing

**Why**: Data integrity - prevent orphaned children in database

**User's Agreement**:
> "If you delete a parent file, all the children should be deleted as well."

**Implementation**:
- Check if parent exists at start of `processParentChildren` (line 638-655)
- If not found: Delete all children + their audio blobs
- Prevents data leaks and inconsistent state

---

### Change #4: Retry Mechanism Documentation ✅

**What Changed**: Added detailed comment referencing existing retry implementation

**Why**: Clarify that retry logic exists (in useClipRecording.ts lines 410-444)

**User's Clarification**:
> "The way you talk about it, it's like it's not been implemented anywhere code-wise"

**Implementation**:
- Added comment in `processChild` (lines 563-569)
- References existing implementation:
  - Attempts 1-3: Rapid fire (no waits)
  - Attempts 4+: Interval waits (1min, 2min, 4min, 5min cycle)
- Noted as TODO for Phase 4: Extract to shared function for auto-retry

---

### Change #5: Sequential Processing Clarification ✅

**User's Critical Point**:
> "We finish with one whole parent clip file before we move to another parent clip file. We do not simultaneously let 3-4 different parent clip files work at the same time"

**Implication**: "Blocking next parent" is NOT an issue
- We process ONE parent file at a time (sequential)
- No rush to start next parent
- Title generation timing is about robustness, not performance

**No Code Change**: This clarifies existing behavior is correct

---

### Change #6: Spacing Remains Unchanged ✅

**User's Feedback**:
> "Single space vs double new line spacing for raw text is absolute nonsense. Ignore that spacing inconsistency."

**Current Approach** (CORRECT):
- Single space `' '` for BOTH raw and formatted text
- AI formatter decides paragraph breaks
- If it keeps things on same line, space already there

**No Code Change**: Builder was wrong, current approach is correct

---

## Summary of All Fixes

**4 Code Changes**:
1. ✅ Context parameter for AI formatting (smarter paragraph breaks)
2. ✅ Title generation after first clip (robust edge case handling)
3. ✅ Orphaned children cleanup (data integrity)
4. ✅ Retry mechanism comment (documentation clarity)

**2 Clarifications**:
5. ✅ Sequential processing (one parent at a time)
6. ✅ Spacing unchanged (current approach correct)

**Benefits**:
- Better AI formatting quality
- Matches online behavior (title from first clip)
- Handles offline interruptions gracefully
- Prevents orphaned data
- Clear documentation of retry mechanism

---

**Status**: 📋 **READY FOR PHASE 1 IMPLEMENTATION**
**Next**: Implement Phase 1, test, then proceed to Phase 2
**Time Estimate**:
- Phase 1: 1 hour (selector + testing)
- Phase 2: 2 hours (batch logic + testing)
- Phase 3: 30 minutes (title generator + testing)
- **Total**: 3.5 hours
