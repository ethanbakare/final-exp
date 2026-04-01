# 036_v1 - Auto-Retry Proper Architecture
## Offline-to-Online Content Merging & Display System

**Date**: December 31, 2025
**Status**: 📐 **ARCHITECTURE DESIGN** - Based on code analysis + user requirements
**Type**: Complete redesign of offline-to-online auto-retry flow

---

## Executive Summary

After thorough code analysis and user feedback, this document defines the proper architecture for offline-to-online auto-retry transcription.

**Based On**:
1. ✅ How online recording works (code analyzed)
2. ✅ Current offline architecture (parent-child system)
3. ✅ User requirements (sequential, batch display, content merging)

**Key Changes**:
1. Remove clipboard auto-copy from auto-retry
2. Merge children content into parent after transcription
3. Show first clip immediately, batch rest together
4. Delete children after merge (like deleting audio)
5. Refactor to Zustand selectors (eliminate component state)
6. Sequential processing (one at a time for simplicity)

---

## Part 1: How It Works NOW (Code Analysis)

### 1.1 ONLINE Recording Flow (Single Clip Model)

**File**: [ClipMasterScreen.tsx:543-575](ClipMasterScreen.tsx#L543-L575)

#### New Clip:
```typescript
// Line 556: Create clip with EMPTY content
const newClip: Clip = {
  id: generateClipId(),
  rawText: rawText,              // Has raw text
  formattedText: '',             // Empty until formatted
  content: '',                   // ⚠️ EMPTY - waits for formatting
  status: 'formatting',
};

addClip(newClip);

// Background formatting populates content
formatTranscriptionInBackground(newClip.id, rawText, false);
```

#### Append Mode:
```typescript
// Line 543: Append to existing clip
updateClip(currentClipId, {
  rawText: existingClip.rawText + ' ' + rawText,  // APPEND raw
  status: 'formatting',
  createdAt: Date.now()  // Moves to top
});

// Format with context
formatTranscriptionInBackground(currentClipId, rawText, true);  // isAppending=true
```

**Inside formatTranscriptionInBackground** (Line 862-867):
```typescript
updateClip(clipId, {
  formattedText: isAppending
    ? clip.formattedText + ' ' + formattedText  // APPEND formatted
    : formattedText,
  content: isAppending
    ? clip.content + ' ' + formattedText        // APPEND to content
    : formattedText,
  status: null  // Done!
});
```

**KEY INSIGHT**: Online uses **single clip** for everything. No parent-child split. Content appended directly.

---

### 1.2 OFFLINE Recording Flow (Parent-Child Split)

**File**: [useOfflineRecording.ts:108-230](useOfflineRecording.ts#L108-L230)

#### Create Parent + First Child:
```typescript
// Step 1: PARENT (container)
const parentClip: Clip = {
  id: generateClipId(),
  title: 'Recording 01',
  status: null,                    // Container (not pending)
  content: '',                     // ⚠️ EMPTY - never populated
  rawText: '',                     // ⚠️ EMPTY
  // NO audioId, NO pendingClipTitle
};

addClip(parentClip);

// Step 2: FIRST CHILD
const firstChild: Clip = {
  id: generateClipId(),
  title: 'Recording 01',           // Inherits parent title
  pendingClipTitle: 'Clip 001',    // Display name
  status: 'pending-child',
  content: '',                     // Empty until transcribed
  audioId: audioId,                // ✅ Has audio
  parentId: parentClip.id,         // ✅ Links to parent
};

addClip(firstChild);
setCurrentClipId(parentClip.id);  // Point to PARENT for future children
```

**Result**: Parent is empty container, children have audio waiting.

---

### 1.3 AUTO-RETRY Flow (Current - BROKEN)

**File**: [ClipMasterScreen.tsx:910-979](ClipMasterScreen.tsx#L910-L979)

```typescript
useEffect(() => {
  const handleOnline = async () => {
    const pendingClips = allClips.filter(c =>
      c.audioId && c.status === 'pending-child'
    );

    // Process sequentially
    for (const clip of pendingClips) {
      const { text: rawText } = await transcribeRecording(audioBlob);

      updateClip(clip.id, {
        rawText: rawText,
        content: rawText,      // ✅ Updates CHILD
        status: 'formatting'
      });

      await formatTranscriptionInBackground(clip.id, rawText, false);
      // ⚠️ PROBLEM: Child has content, parent stays empty!
    }

    console.log('[Auto-retry] Completed');  // ⚠️ Nothing happens after
  };

  window.addEventListener('online', handleOnline);
}, []);
```

**PROBLEMS**:
1. ✅ Children get content
2. ❌ Parent stays empty (no content, no rawText, no formattedText)
3. ❌ selectedPendingClips never updates (static snapshot)
4. ❌ ClipRecordScreen shows selectedClip.content → EMPTY
5. ❌ Clipboard auto-copy causes "Document not focused" error
6. ❌ No mechanism to merge children into parent
7. ❌ No cleanup of children after completion

---

### 1.4 selectedPendingClips State (Current - BROKEN)

**File**: [ClipMasterScreen.tsx:152-279](ClipMasterScreen.tsx#L152-L279)

```typescript
// Line 152: Component state (static snapshot)
const [selectedPendingClips, setSelectedPendingClips] = useState<PendingClip[]>([]);

// Line 222: handleClipClick creates snapshot
const handleClipClick = useCallback((clipId: string) => {
  const children = clips.filter(c => c.parentId === clipId);

  const pendingClips = children.map(child => ({
    id: child.id,
    title: child.pendingClipTitle || 'Pending',
    time: child.duration || '0:00',
    status: child.status === 'transcribing' ? 'transcribing' : 'waiting',
  }));

  setSelectedPendingClips(pendingClips);  // ⚠️ STATIC SNAPSHOT - Never updates!
}, [clips]);
```

**PROBLEM**: Created once, never updates when Zustand children change.

---

## Part 2: User Requirements Summary

### 2.1 Core Decisions

1. **Remove Clipboard Auto-Copy**
   - "Copy to clipboard shouldn't happen if you're not in record screen"
   - "Leave copy to clipboard out for now when going offline to online"

2. **Content Merging**
   - "After child transcribed, delete pending clips just like deleting audio"
   - **Decision**: Merge children into parent, then delete children

3. **Display Timing**
   - "Show first clip immediately, batch rest together"
   - "Show clip 1, then 2+3+4 appended to 1"

4. **Sequential Processing**
   - "Process one at a time for simplicity, avoid errors"
   - Keep current sequential for loop

5. **State Management**
   - "Full Zustand refactor if benefits are 50%+ better"
   - **Decision**: Refactor to Zustand selectors

### 2.2 Display Rules

**Home Screen**:
- Show parent with "Transcribing" + spinner while processing
- NO progress indicators (1/5 completed)

**Record Screen**:
- First clip: Show immediately when done
- Batch clips: Show all at once after complete
- Spinner behavior: Keep spinning until batch displays

### 2.3 Content Accumulation Pattern

User's specification:
```
1. Clip 1: Format → Show immediately
2. Clip 2: Format → Hold
3. Clip 3: Format → Append to 2 (2+3 formatted)
4. Clip 4: Format → Append to 2+3 (2+3+4 formatted)
5. Show 2+3+4 appended to 1 instantly
```

---

## Part 3: Proposed Architecture

### 3.1 Solution: Refactor to Zustand Selectors

**Problem**: selectedPendingClips is component state that never syncs.

**Solution**: Replace with Zustand selector.

#### BEFORE (Broken):
```typescript
// Line 152
const [selectedPendingClips, setSelectedPendingClips] = useState<PendingClip[]>([]);

// Line 251
setSelectedPendingClips(pendingClips);  // Static snapshot
```

#### AFTER (Fixed):
```typescript
// ClipMasterScreen.tsx
const selectedPendingClips = useClipStore((state) => {
  if (!currentClipId) return [];

  // Get children for current parent
  const children = state.clips
    .filter(c => c.parentId === currentClipId)
    .sort((a, b) => {
      const timestampA = parseInt(a.id.split('-')[1], 10) || 0;
      const timestampB = parseInt(b.id.split('-')[1], 10) || 0;
      return timestampA - timestampB;  // Oldest first
    });

  // Convert to PendingClip format
  return children.map(child => ({
    id: child.id,
    title: child.pendingClipTitle || 'Pending',
    time: child.duration || '0:00',
    status: child.status === 'transcribing' ? 'transcribing' as const : 'waiting' as const,
    isActiveRequest: state.activeHttpClipId === child.id
  }));
});
```

**Benefits**:
- ✅ Auto-updates when Zustand clips change
- ✅ No manual setSelectedPendingClips calls
- ✅ Always reflects current state
- ✅ No stale data

---

### 3.2 Remove All setSelectedPendingClips Calls

**Files to Update**:

1. **ClipMasterScreen.tsx**:
   - Line 251: DELETE `setSelectedPendingClips(pendingClips)` from handleClipClick
   - Line 289: DELETE `setSelectedPendingClips([])` from handleBackClick
   - Line 307: DELETE `setSelectedPendingClips([])` from handleNewClipClick

2. **useOfflineRecording.ts**:
   - Line 16: REMOVE `setSelectedPendingClips` from params
   - Line 38: REMOVE from destructuring
   - Line 170, 228: DELETE `setSelectedPendingClips` calls

3. **ClipMasterScreen call to useOfflineRecording**:
   - Remove `setSelectedPendingClips` parameter

**Result**: Zustand selector handles everything automatically.

---

### 3.3 Auto-Retry Handler (Complete Rewrite)

**File**: ClipMasterScreen.tsx (Replace lines 910-979)

```typescript
useEffect(() => {
  const handleOnline = async () => {
    console.log('[Auto-retry] Going online, checking for pending clips');

    const allClips = useClipStore.getState().clips;

    // Find all pending children
    const pendingChildren = allClips.filter(c =>
      c.audioId && c.status === 'pending-child'
    );

    if (pendingChildren.length === 0) return;

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
}, []);
```

---

### 3.4 Process Parent Children (New Function)

**Location**: ClipMasterScreen.tsx (new useCallback)

```typescript
const processParentChildren = useCallback(async (
  parentId: string,
  children: Clip[]
) => {
  const parent = getClipById(parentId);
  if (!parent) return;

  console.log('[ProcessChildren] Starting for parent:', parentId, '| Children:', children.length);

  // Track accumulated content
  let accumulatedRawText = parent.rawText || '';
  let accumulatedFormattedText = parent.formattedText || '';
  let accumulatedContent = parent.content || '';

  // Separate first child from batch
  const [firstChild, ...batchChildren] = children;

  // STEP 1: Process first child immediately
  if (firstChild) {
    const result = await processChild(firstChild);

    if (result.success) {
      // Merge first child into parent
      accumulatedRawText += (accumulatedRawText ? ' ' : '') + result.rawText;
      accumulatedFormattedText += (accumulatedFormattedText ? ' ' : '') + result.formattedText;
      accumulatedContent += (accumulatedContent ? ' ' : '') + result.content;

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
    }
  }

  // STEP 2: Process batch children (if any)
  if (batchChildren.length > 0) {
    console.log('[ProcessChildren] Processing batch of', batchChildren.length, 'children');

    // Accumulate batch content
    let batchRawText = '';
    let batchFormattedText = '';
    let batchContent = '';

    for (const child of batchChildren) {
      const result = await processChild(child);

      if (result.success) {
        batchRawText += (batchRawText ? ' ' : '') + result.rawText;
        batchFormattedText += (batchFormattedText ? ' ' : '') + result.formattedText;
        batchContent += (batchContent ? ' ' : '') + result.content;

        // Delete child after processing
        deleteClip(child.id);
      }
    }

    // Merge entire batch into parent at once
    accumulatedRawText += (accumulatedRawText ? ' ' : '') + batchRawText;
    accumulatedFormattedText += (accumulatedFormattedText ? ' ' : '') + batchFormattedText;
    accumulatedContent += (accumulatedContent ? ' ' : '') + batchContent;

    updateClip(parentId, {
      rawText: accumulatedRawText,
      formattedText: accumulatedFormattedText,
      content: accumulatedContent,
      status: null,  // Complete
      createdAt: Date.now()
    });

    console.log('[ProcessChildren] Batch merged into parent');
  }

  // STEP 3: Generate AI title for parent (if still has placeholder)
  if (parent.title.startsWith('Recording ')) {
    console.log('[ProcessChildren] Generating AI title for parent');
    await generateTitleInBackground(parentId, accumulatedRawText);
  }

  console.log('[ProcessChildren] Completed parent:', parentId);
}, [getClipById, updateClip, deleteClip, generateTitleInBackground]);
```

---

### 3.5 Process Single Child (New Function)

**Location**: ClipMasterScreen.tsx (new useCallback)

```typescript
const processChild = useCallback(async (
  child: Clip
): Promise<{
  success: boolean;
  rawText: string;
  formattedText: string;
  content: string;
}> => {
  console.log('[ProcessChild] Starting:', child.pendingClipTitle);

  try {
    // Get audio from IndexedDB
    const audioBlob = await getAudio(child.audioId!);
    if (!audioBlob) {
      console.warn('[ProcessChild] Audio not found for:', child.id);
      updateClip(child.id, {
        status: 'failed',
        transcriptionError: 'Audio not found in storage'
      });
      return { success: false, rawText: '', formattedText: '', content: '' };
    }

    // Update status: transcribing
    updateClip(child.id, { status: 'transcribing' });

    // Transcribe
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
      return { success: false, rawText: '', formattedText: '', content: '' };
    }

    // Store raw text
    updateClip(child.id, {
      rawText: rawText,
      content: rawText,
      status: 'formatting'
    });

    // Format (NO clipboard, NO nav state)
    const formattedText = await formatChildTranscription(child.id, rawText);

    // Delete audio from IndexedDB
    if (child.audioId) {
      await deleteAudio(child.audioId);
      updateClip(child.id, { audioId: undefined });
    }

    console.log('[ProcessChild] Success:', child.pendingClipTitle);

    return {
      success: true,
      rawText: rawText,
      formattedText: formattedText,
      content: formattedText
    };

  } catch (error) {
    console.error('[ProcessChild] Error:', child.pendingClipTitle, error);
    updateClip(child.id, {
      status: 'failed',
      transcriptionError: error instanceof Error ? error.message : 'Unknown error'
    });
    return { success: false, rawText: '', formattedText: '', content: '' };
  }
}, [getAudio, updateClip, transcribeRecording, deleteAudio]);
```

---

### 3.6 Format Child Transcription (New Function)

**Location**: ClipMasterScreen.tsx (new useCallback)

```typescript
const formatChildTranscription = useCallback(async (
  clipId: string,
  rawText: string
): Promise<string> => {
  const clip = getClipById(clipId);
  if (!clip) return rawText;

  console.log('[FormatChild] Starting for:', clip.pendingClipTitle);

  try {
    // Call formatting API (NO context for children)
    const response = await fetch('/api/clipperstream/format-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText,
        existingFormattedContext: undefined  // No context for children
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const formattedText = data.formattedText || data.formatted || rawText;

    // Update child with formatted text
    updateClip(clipId, {
      formattedText: formattedText,
      content: formattedText,
      status: null  // Complete
    });

    // ⚠️ NO clipboard copy during auto-retry
    // ⚠️ NO setRecordNavState

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

### 3.7 Update useParentTitleGenerator

**File**: useParentTitleGenerator.ts

**Problem**: Current logic checks if all children complete, but we DELETE children after merge.

**Solution**: Trigger on parent content, not children.

#### BEFORE:
```typescript
const allComplete = children.every(c => c.status === null && c.formattedText);
if (allComplete && children.length > 0) {
  generateTitleInBackground(parent.id, children[0].rawText);
}
```

#### AFTER:
```typescript
// Trigger on parent content (children already deleted)
if (parent.content && parent.content.length > 0) {
  // Has content but still placeholder title
  if (parent.title.startsWith('Recording ')) {
    generateTitleInBackground(parent.id, parent.rawText || parent.content);
  }
}
```

---

## Part 4: Implementation Steps

### Phase 1: Refactor State Management ✅ FOUNDATION

#### Step 1.1: Add Zustand Selector
```typescript
// ClipMasterScreen.tsx - Replace line 152
const selectedPendingClips = useClipStore((state) => {
  if (!currentClipId) return [];

  const children = state.clips
    .filter(c => c.parentId === currentClipId)
    .sort((a, b) => {
      const timestampA = parseInt(a.id.split('-')[1], 10) || 0;
      const timestampB = parseInt(b.id.split('-')[1], 10) || 0;
      return timestampA - timestampB;
    });

  return children.map(child => ({
    id: child.id,
    title: child.pendingClipTitle || 'Pending',
    time: child.duration || '0:00',
    status: child.status === 'transcribing' ? 'transcribing' as const : 'waiting' as const,
    isActiveRequest: state.activeHttpClipId === child.id
  }));
});
```

#### Step 1.2: Remove All setSelectedPendingClips
- handleClipClick (line 251)
- handleBackClick (line 289)
- handleNewClipClick (line 307)
- useOfflineRecording.ts (lines 16, 38, 170, 228)

---

### Phase 2: Create Child Processing Functions

#### Step 2.1: Create formatChildTranscription
- Add after formatTranscriptionInBackground (~line 910)

#### Step 2.2: Create processChild
- Add after formatChildTranscription

#### Step 2.3: Create processParentChildren
- Add after processChild

---

### Phase 3: Rewrite Auto-Retry Handler

#### Step 3.1: Replace handleOnline Logic
- Find auto-retry useEffect (lines 910-979)
- Replace with new implementation (Section 3.3)

---

### Phase 4: Update Title Generator

#### Step 4.1: Modify useParentTitleGenerator
- Change trigger from children complete to parent has content
- See Section 3.7

---

### Phase 5: Testing

#### Test 1: Single Pending Clip
```
1. Go offline
2. Record Clip 001
3. Go online
4. Verify: Text appears, clip deleted, title changes
```

#### Test 2: Multiple Pending Clips (Batch)
```
1. Go offline
2. Record Clips 001, 002, 003, 004
3. Go online
4. Verify: Clip 001 shows immediately
5. Verify: Clips 002+003+004 show together
6. Verify: All clips deleted, title changes
```

#### Test 3: Network Interruption
```
1. Start with 4 pending clips
2. Go online
3. After Clip 001 completes, go offline
4. Verify: Clip 001 content shown
5. Go online again
6. Verify: Resumes from Clip 002
```

---

## Part 5: Success Criteria

### Functionality
- ✅ First clip displays immediately
- ✅ Batch clips display together
- ✅ Content merges into parent
- ✅ Children deleted after merge
- ✅ AI title generates
- ✅ Parent moves to top
- ✅ No clipboard errors
- ✅ Sequential processing

### Architecture
- ✅ selectedPendingClips uses Zustand selector
- ✅ Auto-updates when children change
- ✅ No manual sync needed
- ✅ Reusable functions
- ✅ Clean separation

### User Experience
- ✅ Smooth display (first immediate, batch instant)
- ✅ Accurate spinners
- ✅ No progress counters
- ✅ Clear error messages
- ✅ Resilient to network changes

---

## Related Documents

- [033_v6.1_CORRECTED_PATCH.md](033_v6.1_CORRECTED_PATCH.md) - Dependency fix
- [013_ZUSTANDv21_debug.md](013_ZUSTANDv21_debug.md) - Debug logs
- [ClipOfflineScreen.tsx](../../pages/clipperstream/showcase/ClipOfflineScreen.tsx) - State examples

---

**Status**: 📐 **READY FOR REVIEW**
**Next**: User reviews architecture, then Phase 1 implementation
**Time Estimate**: ~5 hours (3 hrs implementation + 2 hrs testing)
