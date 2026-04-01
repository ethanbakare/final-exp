# 028v5 - COMPREHENSIVE IMPLEMENTATION PLAN
## Zustand Migration Completion - All Remaining Fixes

**Date**: December 29, 2025  
**Status**: Ready for Implementation  
**Based On**: 028v3 (Architecture Analysis) + 028v4 (Critical Review & Corrections)

---

## EXECUTIVE SUMMARY

This plan addresses **5 remaining issues** after Fix 11 (Zustand storage migration):

1. ✅ **Transcription Spilling** - Text from one clip appears in another (P0)
2. ✅ **Missing Status Indicators** - No visual feedback during transcription (P1)
3. ✅ **RecordBar Changes on Home Screen** - Background tasks affect UI (P1)
4. ✅ **Parent Titles Not Generating** - Files stay "Recording 01" (P1)
5. ✅ **Clip Sort Order Wrong** - Oldest at top instead of newest (P2)

**Root Cause**: TWO global DATA states (`transcription`, `contentBlocks`) that should be per-clip data in Zustand.

**Implementation**: 6 focused fixes organized into 3 phases (P0 → P1 → P2).

---

## ARCHITECTURAL FOUNDATION

### Current State (Post Fix 11)

**✅ What Works**:
- Clips stored in Zustand (`'clipstream-storage'` key)
- Offline recording creates parent and children correctly
- Sequential auto-retry processes clips one-by-one
- Numbering works: "Clip 001", "Clip 002", "Clip 003"
- Session storage has correct data

**❌ What's Broken**:
- `transcription` is global (should be per-clip)
- `contentBlocks` is global (should be per-clip)
- UI doesn't read from `clip.status`
- Parent/child display logic shows wrong content

### Key Distinction: View State vs Data State

**Global VIEW State** (Correct, Keep As-Is):
```typescript
// ✅ Tracks "which clip is the user currently viewing"
const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
```

**Global DATA State** (Wrong, Must Fix):
```typescript
// ❌ Raw text belongs to clip, not global
const [transcription, setTranscription] = useState<string>('');

// ❌ Formatted text belongs to clip, not global
const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
```

**After Fixes**:
```typescript
// ✅ View state stays global
const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

// ✅ Data comes from Zustand per-clip
const displayContent = selectedClip?.formattedText;  // Read from clip
const contentBlocks = useMemo(() => 
  selectedClip?.formattedText ? [{ text: selectedClip.formattedText, ... }] : []
, [selectedClip]);  // Derive from clip
```

---

## PHASE 1: CRITICAL DATA STATE FIXES (P0)

These fixes eliminate the global data state problem.

---

### Fix 1A: Store rawText Immediately After Transcription

**Priority**: P0 (Critical)  
**Scope**: Small (1 file, 1 location)  
**Blocks**: Fix 4 (parent title generation)

#### Problem

When transcription completes, the raw text is stored in global `transcription` state, which gets overwritten when multiple clips transcribe concurrently.

#### Solution

Store `rawText` in the clip immediately when transcription succeeds.

#### Implementation

**File**: `ClipMasterScreen.tsx`

**Location**: Inside `handleOnline()` function (around line 600-615)

**BEFORE**:
```typescript
// Lines ~600-615
for (const clip of pendingClips) {
  try {
    // ... get audio ...
    
    const audioBlob = await getAudio(clip.audioId);
    log.debug('Auto-retrying transcription', { clipId: clip.id });
    setActiveHttpClipId(clip.id);
    
    try {
      await transcribeRecording(audioBlob);  // Sets global transcription
      
      await waitForClipToComplete(clip.id, 30000);
      
      log.info('Clip completed successfully', { clipId: clip.id });
    } finally {
      setActiveHttpClipId(null);
      log.debug('Clearing activeHttpClipId', { clipId: clip.id });
    }
  } catch (error) {
    log.error('Auto-retry failed', { clipId: clip.id, error });
  }
}
```

**AFTER**:
```typescript
// Lines ~600-615
for (const clip of pendingClips) {
  try {
    // ... get audio ...
    
    const audioBlob = await getAudio(clip.audioId);
    log.debug('Auto-retrying transcription', { clipId: clip.id });
    setActiveHttpClipId(clip.id);
    
    try {
      // NEW: Get transcription result
      const result = await transcribeRecording(audioBlob);
      
      // NEW: Store rawText immediately in Zustand
      updateClipById(clip.id, {
        rawText: result.text || transcription,  // Use result if available, fallback to global
        status: 'formatting'
      });
      
      await waitForClipToComplete(clip.id, 30000);
      
      log.info('Clip completed successfully', { clipId: clip.id });
    } finally {
      setActiveHttpClipId(null);
      log.debug('Clearing activeHttpClipId', { clipId: clip.id });
    }
  } catch (error) {
    log.error('Auto-retry failed', { clipId: clip.id, error });
  }
}
```

**Note**: Check if `transcribeRecording()` returns the text directly or if we need to read from the global `transcription` state. Adjust accordingly.

#### Testing

**Test**: Record 2 clips offline, go online, check session storage during auto-retry.

**Expected**:
```javascript
// In browser console during auto-retry:
const store = JSON.parse(sessionStorage.getItem('clipstream-storage'));
const child1 = store.state.clips.find(c => c.pendingClipTitle === 'Clip 001');
console.log(child1.rawText);  // Should show "Making my second clip..." (correct)

const child2 = store.state.clips.find(c => c.pendingClipTitle === 'Clip 002');
console.log(child2.rawText);  // Should show "This is recording..." (correct, not overwritten)
```

---

### Fix 1B: Store formattedText and Conditionally Update contentBlocks

**Priority**: P0 (Critical)  
**Scope**: Medium (1 file, 1 function)  
**Blocks**: Transcription spilling fix

#### Problem

When formatting completes, the formatted text is stored in global `contentBlocks` state, which gets overwritten when multiple clips format concurrently. This causes transcription spilling.

#### Solution

1. Store `formattedText` in the clip in Zustand
2. Only update `contentBlocks` if this is the actively viewed clip
3. Clear clip `status` to `null` (completed)

#### Implementation

**File**: `ClipMasterScreen.tsx`

**Location**: Inside `formatTranscriptionInBackground()` function (around line 917-1050)

**BEFORE**:
```typescript
// Lines ~1020-1040
const formatTranscriptionInBackground = useCallback(
  async (rawText: string, clipIdToUpdate: string, isAppending: boolean, shouldAnimate: boolean) => {
    log.debug('Starting background formatting', { clipId: clipIdToUpdate, length: rawText.length });

    try {
      const formattedText = await formatText(rawText, isAppending ? selectedClip?.formattedText : undefined);
      
      // Update contentBlocks to show formatted text
      setContentBlocks([{
        id: clipIdToUpdate,
        text: formattedText,
        animate: shouldAnimate
      }]);

      // Update clip with formatted text
      const existingClip = clips.find(c => c.id === clipIdToUpdate);
      if (existingClip) {
        updateClipById(clipIdToUpdate, {
          formattedText: formattedText,
          currentView: 'formatted'
        });
      }
      
      // ... audio deletion, status clear, etc ...
    } catch (error) {
      log.error('Formatting failed', { clipId: clipIdToUpdate, error });
    }
  },
  [/* dependencies */]
);
```

**AFTER**:
```typescript
// Lines ~1020-1040
const formatTranscriptionInBackground = useCallback(
  async (rawText: string, clipIdToUpdate: string, isAppending: boolean, shouldAnimate: boolean) => {
    log.debug('Starting background formatting', { clipId: clipIdToUpdate, length: rawText.length });

    try {
      const formattedText = await formatText(rawText, isAppending ? selectedClip?.formattedText : undefined);
      
      // ✅ NEW: Store formattedText in Zustand FIRST
      updateClipById(clipIdToUpdate, {
        formattedText: formattedText,
        currentView: 'formatted',
        status: null  // ✅ Clear status (completed)
      });

      // ✅ NEW: Only update contentBlocks if this is the ACTIVE clip
      // This prevents concurrent formatting from overwriting the displayed content
      if (selectedClip?.id === clipIdToUpdate || currentClipId === clipIdToUpdate) {
        setContentBlocks([{
          id: clipIdToUpdate,
          text: formattedText,
          animate: shouldAnimate
        }]);
        log.debug('Updated contentBlocks for active clip', { clipId: clipIdToUpdate });
      } else {
        log.debug('Skipped contentBlocks update (not active clip)', { 
          clipId: clipIdToUpdate, 
          selectedClipId: selectedClip?.id,
          currentClipId 
        });
      }
      
      // ... audio deletion, etc ...
    } catch (error) {
      log.error('Formatting failed', { clipId: clipIdToUpdate, error });
    }
  },
  [selectedClip, currentClipId, updateClipById, setContentBlocks /* other dependencies */]
);
```

**Key Changes**:
1. Store `formattedText` in Zustand BEFORE updating `contentBlocks`
2. Set `status: null` when formatting completes (clip is done)
3. Only update `contentBlocks` if this clip is being actively viewed
4. Add logging to track when contentBlocks is/isn't updated

#### Testing

**Test 1: Transcription Spilling (Primary)**

Steps:
1. Go offline
2. Record 3 clips in "Recording 01": "Clip one", "Clip two", "Clip three"
3. Create new parent "Recording 02", record 1 clip: "Second file"
4. Go online, wait for auto-retry
5. **During auto-retry**, click "Recording 01" to view pending clips
6. Watch the content area during background formatting

**Expected**:
- ✅ Content area shows pending clips list (Clip 001, 002, 003)
- ✅ Content DOESN'T flicker or change during background formatting
- ✅ No text from "Recording 02" appears in "Recording 01" view
- ✅ Console shows "Skipped contentBlocks update (not active clip)" for background clips

**Before Fix**:
- ❌ Content area flickers, shows random text from clips being formatted
- ❌ "Second file" text briefly appears in "Recording 01" view

---

**Test 2: Session Storage Validation**

Run during auto-retry:
```javascript
// Check that formattedText is stored per-clip
const store = JSON.parse(sessionStorage.getItem('clipstream-storage'));
store.state.clips.filter(c => c.parentId).forEach(child => {
  console.log(`${child.pendingClipTitle}: formattedText="${child.formattedText?.substring(0, 30)}..." status=${child.status}`);
});
```

**Expected**:
```
Clip 001: formattedText="Making my second clip. I want..." status=null
Clip 002: formattedText="This is recording zero one..." status=null
Clip 003: formattedText="This is recording zero one..." status=null
```

---

### Fix 4: Parent Title Generation (Automatic)

**Priority**: P0 (Automatic after Fix 1A)  
**Scope**: No code changes needed  
**Status**: Will work automatically

#### Problem

`useParentTitleGenerator` checks for `firstChild.rawText` to generate parent titles. This field is currently empty, so titles don't generate.

#### Solution

Once Fix 1A stores `rawText` in clips, `useParentTitleGenerator` will automatically detect completed parents and generate titles.

#### Verification

**File**: `useParentTitleGenerator.ts` (Lines 51-64)

```typescript
// Check if all children complete (formatted and no longer pending)
const allComplete = children.every(c => c.status === null && c.formattedText);

if (allComplete && children.length > 0) {
  // Generate title from first child's content
  const firstChild = children[0];
  if (firstChild.rawText) {  // ✅ This will now be populated by Fix 1A
    generatedTitles.current.add(parent.id);
    generateTitleInBackground(parent.id, firstChild.rawText);
  }
}
```

#### Testing

**Test**: Record 3 clips offline in "Recording 01", go online, wait for completion.

**Expected**:
1. Terminal shows title generation API call:
```
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 101 }
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: 'My Generated Title' }
```

2. Session storage shows updated parent:
```javascript
const store = JSON.parse(sessionStorage.getItem('clipstream-storage'));
const parent = store.state.clips.find(c => !c.parentId && c.title !== 'First Test Clip Recording Attempt');
console.log(parent.title);  // Should NOT be "Recording 01" anymore
```

**Before Fix**:
- ❌ No title generation API call
- ❌ Parent stays "Recording 01"

---

## PHASE 2: UI & UX FIXES (P1)

These fixes improve user experience and UI feedback.

---

### Fix 6: Fix Parent/Child Display Logic

**Priority**: P1 (High)  
**Scope**: Small (1 file, 1 function)  
**Improves**: Viewing parent clips with children

#### Problem

When viewing a parent clip, `ClipRecordScreen` shows `parent.formattedText` (empty) instead of showing the children list.

#### Solution

Update `displayText` logic in `ClipRecordScreen` to detect parents and show children list instead of empty content.

#### Implementation

**File**: `ClipRecordScreen.tsx`

**Location**: `displayText` useMemo (Lines 90-113)

**BEFORE**:
```typescript
// Lines 90-113
const displayText = useMemo(() => {
  if (!selectedClip) {
    // No clip selected, show contentBlocks (raw transcription during recording)
    return contentBlocks;
  }

  // Clip selected - check currentView preference
  if (selectedClip.currentView === 'raw') {
    // Show raw text
    return [{
      id: 'raw-view',
      text: selectedClip.rawText || selectedClip.content || '',
      animate: false
    }];
  } else {
    // Show formatted text (default)
    return [{
      id: 'formatted-view',
      text: selectedClip.formattedText || selectedClip.content || '',
      animate: false
    }];
  }
}, [selectedClip, contentBlocks]);
```

**AFTER**:
```typescript
// Lines 90-113
const displayText = useMemo(() => {
  if (!selectedClip) {
    // No clip selected, show contentBlocks (raw transcription during recording)
    return contentBlocks;
  }

  // ✅ NEW: Check if this is a PARENT clip with children
  const isParent = !selectedClip.parentId;
  const hasChildren = pendingClips.length > 0;

  if (isParent && hasChildren) {
    // Parent with children - show children as pending clips list
    // Don't show parent's formattedText (it's empty)
    // The pending clips UI will render instead
    return [];
  }

  // Single clip or child clip - show its content
  if (selectedClip.currentView === 'raw') {
    // Show raw text
    return [{
      id: 'raw-view',
      text: selectedClip.rawText || selectedClip.content || '',
      animate: false
    }];
  } else {
    // Show formatted text (default)
    return [{
      id: 'formatted-view',
      text: selectedClip.formattedText || selectedClip.content || '',
      animate: false
    }];
  }
}, [selectedClip, contentBlocks, pendingClips]);
```

**Key Changes**:
1. Check if `selectedClip` is a parent (`!selectedClip.parentId`)
2. Check if it has children (`pendingClips.length > 0`)
3. If both, return empty array (pending clips list will render)
4. Otherwise, show clip's content as before

#### Testing

**Test**: Click on "Recording 01" parent with 3 children.

**Expected**:
- ✅ Shows list of 3 pending clips: "Clip 001", "Clip 002", "Clip 003"
- ✅ Each pending clip shows its status (waiting, transcribing, or completed)
- ✅ No empty content area

**Before Fix**:
- ❌ Empty content area (parent's formattedText is empty)
- ❌ Pending clips list may not render correctly

---

### Fix 2: Add Context Parameter to useTranscriptionHandler

**Priority**: P1 (High)  
**Scope**: Small (2 files)  
**Fixes**: RecordBar changing during background auto-retry

#### Problem

`useTranscriptionHandler` always calls `setRecordNavState('complete')`, even during background auto-retry. This changes the RecordBar on the home screen.

#### Solution

Add a `context` parameter to distinguish between active recording and background processing.

#### Implementation

**File 1**: `useTranscriptionHandler.ts`

**Location**: Interface and effect (Lines 13-14, 357-358)

**Change 1: Add context to interface (Line 13)**:
```typescript
export interface UseTranscriptionHandlerParams {
  // ... existing params
  context: 'active' | 'background';  // NEW
}
```

**Change 2: Update effect to check context (Line 357)**:
```typescript
// BEFORE:
if (isActiveRecording) {
  setRecordNavState('complete');
}

// AFTER:
if (context === 'active' && isActiveRecording) {
  setRecordNavState('complete');
}
// For background context, DON'T touch RecordBar state at all
```

**File 2**: `ClipMasterScreen.tsx`

**Location**: useTranscriptionHandler call (around line 1174)

**Change: Pass context based on recordNavState**:
```typescript
const { pendingBatch } = useTranscriptionHandler({
  transcription,
  isTranscribing,
  audioId,
  recordNavState,
  clips,
  selectedClip,
  currentClipId,
  isAppendMode,
  appendBaseContent,
  isFormatting,
  context: recordNavState === 'record' || recordNavState === 'processing' ? 'active' : 'background',  // NEW
  setRecordNavState,
  setCurrentClipId,
  setSelectedClip,
  setSelectedPendingClips,
  setIsFirstTranscription,
  createNewClip,
  updateClipById,
  resetRecording,
  formatTranscriptionInBackground,
  generateTitleInBackground
});
```

#### Testing

**Test**: Record 1 clip offline, go to home screen, go online.

**Expected**:
- ✅ RecordBar stays in "record" mode (doesn't change during auto-retry)
- ✅ Home screen shows transcription progress (spinner animation)
- ✅ RecordBar only changes when user actively records

**Before Fix**:
- ❌ RecordBar changes to "complete" mode during background auto-retry
- ❌ Confusing UI state

---

### Fix 3: Migrate UI to Read clip.status

**Priority**: P1 (High)  
**Scope**: Medium (2 files)  
**Fixes**: Missing status indicators

#### Problem

UI uses global flags (`activeTranscriptionParentId`, `activeHttpClipId`) to show spinners. This doesn't work for concurrent processing and doesn't show per-clip status.

#### Solution

Read from `clip.status` directly to determine what to display.

#### Implementation

**File**: `ClipHomeScreen.tsx` (or `ClipListItem.tsx` if that's where parents are rendered)

**Location**: getDisplayClip helper or ClipListItem render (around lines 100-200)

**BEFORE**:
```typescript
// Shows spinner if activeTranscriptionParentId matches
{activeTranscriptionParentId === clip.id && <Spinner />}
```

**AFTER**:
```typescript
// Read from clip's children to determine status
const children = allClips.filter(c => c.parentId === clip.id);
const hasTranscribing = children.some(c => c.status === 'transcribing');
const hasPending = children.some(c => c.status === 'pending-child');
const hasFormatting = children.some(c => c.status === 'formatting');

{(hasTranscribing || hasFormatting) && (
  <Spinner animated className="orange" />
)}
{!hasTranscribing && !hasFormatting && hasPending && (
  <Spinner static className="orange" />
)}
{!hasTranscribing && !hasFormatting && !hasPending && (
  <CheckIcon />
)}
```

**Note**: This assumes `ClipListItem` has access to all clips to find children. If not, this logic should be in the parent component that passes data to `ClipListItem`.

#### Testing

**Test**: Record 2 clips offline, go to home screen, go online, watch during auto-retry.

**Expected**:
- ✅ "Recording 01" shows **animated orange spinner** during HTTP transcription
- ✅ After HTTP completes, shows **animated orange spinner** during formatting
- ✅ After formatting completes, shows **checkmark**
- ✅ Inside "Recording 01", "Clip 001" shows **animated spinner** → **checkmark**

**Before Fix**:
- ❌ No spinner animation
- ❌ Static "Waiting to transcribe" indicator
- ❌ No visual feedback during transcription

---

## PHASE 3: POLISH (P2)

Simple improvements for better UX.

---

### Fix 5: Fix Clip Sort Order

**Priority**: P2 (Medium)  
**Scope**: Trivial (1 line)  
**Fixes**: Newest clips should be at top

#### Problem

Clips are sorted oldest-first. Users expect newest clips at the top.

#### Solution

Reverse sort direction in `ClipHomeScreen.tsx`.

#### Implementation

**File**: `ClipHomeScreen.tsx`

**Location**: Where clips are sorted before rendering (search for `.sort`)

**BEFORE**:
```typescript
const sortedClips = clips.sort((a, b) => a.createdAt - b.createdAt);  // Ascending
```

**AFTER**:
```typescript
const sortedClips = clips.sort((a, b) => b.createdAt - a.createdAt);  // Descending
```

**Note**: If `createdAt` doesn't exist, the file might be using `id` (timestamp-based). Adjust accordingly.

#### Testing

**Test**: Create 3 recordings at different times.

**Expected**:
- ✅ Newest recording at TOP
- ✅ Oldest recording at BOTTOM

---

## TESTING STRATEGY

### Comprehensive Test Flow

**Scenario**: Full offline → online workflow

1. ✅ **Setup**: Clear session storage, start fresh
2. ✅ **Offline Recording**: 
   - Record 3 clips in "Recording 01"
   - Record 1 clip in "First Test Clip..." (append to existing)
   - Record 1 clip in "Recording 02"
3. ✅ **Navigation**: Go to home screen (all recordings visible)
4. ✅ **Auto-Retry**: Go online, watch auto-retry process
5. ✅ **Validation**: Check all success criteria

### Success Criteria (All Must Pass)

**Data Integrity**:
1. ✅ Each clip has correct `rawText` in session storage
2. ✅ Each clip has correct `formattedText` in session storage
3. ✅ No transcription text is duplicated across clips
4. ✅ Parent clips get AI-generated titles (not "Recording 01")

**UI Feedback**:
5. ✅ Status indicators show during transcription (animated spinner)
6. ✅ Status indicators show during formatting (animated spinner)
7. ✅ Completed clips show checkmark
8. ✅ RecordBar doesn't change during background auto-retry

**Display Logic**:
9. ✅ Viewing parent with children shows children list
10. ✅ No content bleeding/spilling between clips
11. ✅ Clips sorted newest-first
12. ✅ `contentBlocks` only updates for actively viewed clip

**Console**:
13. ✅ No "No target clip found" warnings
14. ✅ Terminal shows title generation API calls for parents
15. ✅ Logs show "Skipped contentBlocks update (not active clip)" for background clips

---

## ROLLBACK PLAN

If issues arise during Phase 1 or 2:

### Emergency Rollback

```bash
# Rollback to current state (before 028v5 implementation)
git reset --hard HEAD

# Or rollback to Fix 11 (last known good state)
git reset --hard <commit-hash-of-fix-11>
```

### Incremental Rollback

**If Fix 1B causes issues**:
- Revert only `formatTranscriptionInBackground` changes
- Keep Fix 1A (rawText storage)
- Investigate why contentBlocks conditional update failed

**If Fix 2 causes issues**:
- Revert context parameter changes
- Fix 1A and 1B should still work independently

---

## IMPLEMENTATION ORDER

### Day 1: Phase 1 (P0 Critical Fixes)

**Morning**:
1. Implement Fix 1A (store rawText) - 15 min
2. Test Fix 1A - 10 min
3. Implement Fix 1B (store formattedText) - 30 min
4. Test Fix 1B - 15 min

**Afternoon**:
5. Verify Fix 4 (parent titles) - 10 min
6. Run comprehensive test flow - 20 min
7. Fix any issues - 30 min
8. Commit Phase 1 - 5 min

**Total**: ~2-3 hours

---

### Day 2: Phase 2 (P1 UI Fixes)

**Morning**:
1. Implement Fix 6 (parent/child display) - 15 min
2. Test Fix 6 - 10 min
3. Implement Fix 2 (context parameter) - 20 min
4. Test Fix 2 - 10 min

**Afternoon**:
5. Implement Fix 3 (read clip.status) - 30 min
6. Test Fix 3 - 15 min
7. Run comprehensive test flow - 20 min
8. Fix any issues - 30 min
9. Commit Phase 2 - 5 min

**Total**: ~2-3 hours

---

### Day 3: Phase 3 (P2 Polish)

**Morning**:
1. Implement Fix 5 (sort order) - 5 min
2. Test Fix 5 - 5 min
3. Final comprehensive test - 30 min
4. Commit Phase 3 - 5 min

**Total**: ~1 hour

---

## COMMIT MESSAGES

### Phase 1 Commit

```
fix(zustand): complete data state migration to per-clip storage

CRITICAL FIXES:
- Fix 1A: Store rawText in clip immediately after transcription
- Fix 1B: Store formattedText in clip, conditionally update contentBlocks
- Fix 4: Parent title generation (automatic after rawText populated)

ROOT CAUSE:
- transcription and contentBlocks were global state
- Concurrent processing caused race conditions and transcription spilling
- Now stored per-clip in Zustand

IMPACT:
- Eliminates transcription spilling
- Enables parent title generation
- Each clip has independent data state

Related: 028v5 Implementation Plan (Phase 1)
Branch: refactor/clip-master-phases
```

### Phase 2 Commit

```
fix(ui): migrate to clip.status and fix parent/child display

UI FIXES:
- Fix 6: Show children list for parents (not empty content)
- Fix 2: Add context parameter to prevent RecordBar pollution
- Fix 3: Read clip.status for status indicators

IMPACT:
- Status indicators show during transcription/formatting
- RecordBar doesn't change during background auto-retry
- Parents with children display correctly

Related: 028v5 Implementation Plan (Phase 2)
Branch: refactor/clip-master-phases
```

### Phase 3 Commit

```
polish(ui): sort clips newest-first

POLISH:
- Fix 5: Reverse clip sort order (newest at top)

Related: 028v5 Implementation Plan (Phase 3)
Branch: refactor/clip-master-phases
```

---

## POST-IMPLEMENTATION

### Documentation Updates

After all phases complete:

1. Update `README.md` with new architecture
2. Document the View State vs Data State distinction
3. Add migration guide for future contributors
4. Create architecture diagram showing Zustand flow

### Future Improvements

**Not in this plan, but consider later**:

1. **Remove `contentBlocks` entirely**: Derive from `selectedClip.formattedText` in real-time
2. **Migrate `ClipHomeScreen` delete/rename**: Still using old `clipStorage` functions
3. **Add optimistic updates**: Update UI before API calls complete
4. **Add error recovery**: Retry failed transcriptions automatically

---

## FINAL CHECKLIST

Before marking 028v5 as complete:

- [ ] All 6 fixes implemented
- [ ] All 15 success criteria pass
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Session storage shows correct data
- [ ] Terminal logs show correct API calls
- [ ] All 3 commits pushed to branch
- [ ] Documentation updated
- [ ] Colleague review complete

---

**Prepared By**: Claude Sonnet 4.5  
**Date**: December 29, 2025  
**Status**: READY FOR IMPLEMENTATION  
**Based On**: 028v3 + 028v4 (Corrected)

