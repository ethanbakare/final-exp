# 028v1 - MERGED MASTER PLAN: Complete Zustand Migration

**Date**: December 29, 2025
**Status**: FINAL COMPREHENSIVE PLAN (Merged 027 + 028)
**Purpose**: Complete Zustand migration in ONE comprehensive push

---

## EXECUTIVE SUMMARY

### What's Done ✅
1. **useOfflineRecording** migrated to Zustand (Fix 10)
   - Uses `addClip()` from Zustand (lines 117, 135, 199)
   - Receives `getClips()` from parent (line 23)
   - No more direct sessionStorage writes

2. **Infinite loops** eliminated (Fixes 6, 7, 8)
   - Removed self-triggering dependencies
   - Fixed timing bugs

3. **Basic online recording** works
   - Creates clips, transcribes, formats, generates titles

### What's Broken ❌
1. **Offline clips don't transcribe** when going online
2. **Multiple pending clips** all named "Clip 001" (numbering broken)
3. **Auto-retry** doesn't process clips sequentially (race conditions)
4. **Title generation** doesn't work for pending clips
5. **Status indicators** incorrect on home screen
6. **First recording animation** missing (text doesn't slide in)
7. **Mixed storage** - some files still use old clipStorage service

### Root Cause
**INCOMPLETE ZUSTAND MIGRATION**: Files still importing/using old clipStorage:
- ClipMasterScreen.tsx - uses `getNextRecordingNumber`, `initializeClips`
- useTranscriptionHandler.ts - uses `getClips`, `getNextRecordingNumber`
- ClipHomeScreen.tsx - uses `deleteClip`, `updateClip` directly
- Global state issues (`isFormatting`, `transcription`) blocking clips

---

## PART 1: REMAINING FILES TO MIGRATE

### File 1: ClipMasterScreen.tsx

**Current Issues**:
```typescript
Line 14: import { Clip, initializeClips, getNextClipNumber, getNextRecordingNumber }

Line 98: useEffect(() => {
  initializeClips(); // ❌ Initializes OLD 'clipstream_clips' storage
}, []);
```

**Fix**:
```typescript
// REMOVE:
import { Clip, initializeClips, getNextClipNumber, getNextRecordingNumber } from '../../services/clipStorage';

// REPLACE WITH:
import { Clip } from '../../services/clipStorage'; // Just the type
import { getNextClipNumber, getNextRecordingNumber } from '../../utils/clipHelpers'; // NEW utilities

// DELETE Line 98 entirely (remove initializeClips() call)
```

---

### File 2: useTranscriptionHandler.ts

**Current Issues**:
```typescript
Line 6: import { Clip, getClips, getNextRecordingNumber } from '../services/clipStorage';

Line 202: const nextNumber = getNextRecordingNumber(getClips());
// ❌ Calls getClips() from OLD clipStorage, not from Zustand!
```

**Fix**:
```typescript
// REMOVE:
import { Clip, getClips, getNextRecordingNumber } from '../services/clipStorage';

// REPLACE WITH:
import { Clip } from '../services/clipStorage'; // Just the type
import { getNextRecordingNumber } from '../utils/clipHelpers'; // NEW utility

// Line 202: Change to use clips from useEffect scope (Zustand data)
// BEFORE:
const nextNumber = getNextRecordingNumber(getClips()); // ❌

// AFTER:
const nextNumber = getNextRecordingNumber(clips); // ✅ Uses Zustand clips array
```

---

### File 3: ClipHomeScreen.tsx

**Current Issues**:
```typescript
Line 11: import { deleteClip as deleteClipFromStorage, updateClip, getClips }

Line 253: deleteClipFromStorage(selectedClip.id); // ❌ Deletes from OLD storage!

Line 272: updateClip(selectedClip.id, { title: renameValue.trim() }); // ❌ Updates OLD storage!
```

**Fix - Add Props**:
```typescript
interface ClipHomeScreenProps {
  clips: Clip[];
  onClipClick?: (id: string) => void;
  onRecordClick?: () => void;
  onSearchActiveChange?: (isActive: boolean) => void;

  // ADD THESE:
  onDeleteClip?: (id: string) => void;  // From Zustand
  onUpdateClip?: (id: string, updates: Partial<Clip>) => void; // From Zustand

  // ... existing props ...
}
```

**Fix - Remove Imports**:
```typescript
// REMOVE:
import { deleteClip as deleteClipFromStorage, updateClip, getClips } from '../../services/clipStorage';

// KEEP ONLY:
import { Clip } from '../../services/clipStorage'; // Just the type
```

**Fix - Use Props (Line 253)**:
```typescript
// BEFORE:
deleteClipFromStorage(selectedClip.id);

// AFTER:
onDeleteClip?.(selectedClip.id);
```

**Fix - Use Props (Line 272)**:
```typescript
// BEFORE:
updateClip(selectedClip.id, { title: renameValue.trim() });

// AFTER:
onUpdateClip?.(selectedClip.id, { title: renameValue.trim() });
```

**Fix - Update ClipMasterScreen.tsx (pass Zustand actions)**:
```typescript
<ClipHomeScreen
  clips={homeScreenClips}
  onClipClick={handleClipClick}
  onRecordClick={handleRecordClick}
  onSearchActiveChange={setIsSearchActive}
  onDeleteClip={deleteClip}  // ADD: From Zustand
  onUpdateClip={updateClipById}  // ADD: From Zustand wrapper
  activeTranscriptionParentId={activeTranscriptionParentId}
  activeHttpClipId={activeHttpClipId}
  isActiveRequest={isActiveRequest}
/>
```

---

## PART 2: CREATE clipHelpers.ts UTILITIES

**File**: `src/projects/clipperstream/utils/clipHelpers.ts`

```typescript
import { Clip } from '../services/clipStorage';

/**
 * Get next clip number within a specific recording/parent
 * Used for "Clip 001", "Clip 002" numbering
 *
 * @param clips - All clips from Zustand store
 * @param parentId - Optional parent ID to filter children
 * @returns Next clip number (1, 2, 3, ...)
 */
export function getNextClipNumber(clips: Clip[], parentId?: string): number {
  const relevantClips = parentId
    ? clips.filter(c => c.parentId === parentId || c.id === parentId)
    : clips;

  const numbers = relevantClips
    .map(c => c.pendingClipTitle?.match(/Clip (\d+)/)?.[1])
    .filter(n => n)
    .map(Number);

  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
}

/**
 * Get next recording number (for new recording files)
 * Used for "Recording 01", "Recording 02" numbering
 *
 * @param clips - All clips from Zustand store
 * @returns Formatted recording number string (e.g., "Recording 01")
 */
export function getNextRecordingNumber(clips: Clip[]): string {
  // Filter out child clips (they inherit parent's title)
  const parentClips = clips.filter(c => !c.parentId);

  const numbers = parentClips
    .map(c => c.title.match(/Recording (\d+)/)?.[1])
    .filter(n => n)
    .map(Number);

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `Recording ${String(nextNum).padStart(2, '0')}`;
}
```

---

## PART 3: FIX AUTO-RETRY SEQUENTIAL PROCESSING

**Problem**: Auto-retry doesn't wait for formatting, causing race conditions and transcription overwrites.

**File**: ClipMasterScreen.tsx line ~627

**Current Code**:
```typescript
try {
  await transcribeRecording(audioBlob); // Waits for HTTP ✅
  // But formatting starts async, doesn't wait ❌
} finally {
  setActiveHttpClipId(null);
}
// Next clip starts immediately ❌
```

**Fix - Add After Line 629**:
```typescript
try {
  await transcribeRecording(audioBlob); // Wait for HTTP ✅

  // NEW: Wait for this clip to completely finish
  const success = await waitForClipToComplete(clip.id); // ✅

  if (success) {
    log.info('Clip completed successfully', { clipId: clip.id });
  } else {
    log.warn('Clip formatting failed or timed out', { clipId: clip.id });
    // Mark as failed if it timed out
    const clipAfterWait = useClipStore.getState().getClipById(clip.id);
    if (clipAfterWait && clipAfterWait.status !== null) {
      updateClipById(clip.id, {
        status: 'failed',
        transcriptionError: 'Formatting timed out after 30 seconds'
      });
    }
  }
} finally {
  setActiveHttpClipId(null);
}
// Next clip starts only after previous fully complete ✅
```

**waitForClipToComplete Already Exists** (line 496-542):
- Just need to ensure it's being awaited in the loop
- Line 689 shows it's already in dependencies, so it exists
- Just need to ADD the await call in the retry loop

---

## PART 4: FIX GLOBAL isFormatting BLOCKER

**Problem**: One global `isFormatting` flag blocks ALL clips when one is formatting.

**Current Architecture**:
```typescript
// ClipMasterScreen.tsx line 108
const isFormatting = activeFormattingClipId !== null;

// Already derived from Zustand! ✅
```

**Check**: Line 108 in ClipMasterScreen.tsx should already derive from `activeFormattingClipId`.

**If NOT, update to**:
```typescript
const activeFormattingClipId = useClipStore((state) => state.activeFormattingClipId);
const setActiveFormattingClipId = useClipStore((state) => state.setActiveFormattingClipId);

// Derive for backwards compat
const isFormatting = activeFormattingClipId !== null;
```

**Update formatTranscriptionInBackground**:
```typescript
// Line ~933: At start of function
setActiveFormattingClipId(clipIdToUpdate); // ✅ Track WHICH clip

// Line ~1154: At end of function (in finally block)
setActiveFormattingClipId(null); // ✅ Clear
```

---

## PART 5: FIX PENDING CLIP NUMBERING

**Problem**: All pending clips get "Clip 001" instead of incrementing.

**File**: useOfflineRecording.ts lines 168-176

**Current Code**:
```typescript
const allClips = getClips(); // Should be from Zustand
const childrenOfParent = allClips.filter(c => c.parentId === parentClip.id);
const childNumbers = childrenOfParent
  .map(c => c.pendingClipTitle?.match(/Clip (\d+)/)?.[1])
  .filter(n => n)
  .map(Number);
const maxChildNumber = childNumbers.length > 0 ? Math.max(...childNumbers) : 0;
const nextChildNumber = String(maxChildNumber + 1).padStart(3, '0');
```

**Diagnosis**: This logic looks correct. Issue is likely that `getClips()` is returning stale data.

**Fix**: Ensure `getClips()` param passed to useOfflineRecording is fresh from Zustand.

**ClipMasterScreen.tsx line 1170 already has**:
```typescript
getClips: () => useClipStore.getState().clips  // ✅ Fresh from Zustand
```

**Test After Other Fixes**: This should work once clipStorage references are removed.

---

## PART 6: FIX SUCCESSIVE RECORDING CONTEXT

**Problem**: Recording from pending clip might use child ID instead of parent ID.

**File**: ClipMasterScreen.tsx lines 392-404

**Current Code**:
```typescript
else if (activeScreen === 'record' && selectedPendingClips.length > 0) {
  setIsAppendMode(true);
  setCurrentClipId(selectedPendingClips[0].id); // ❌ IS THIS CHILD ID?
  ...
}
```

**Fix**:
```typescript
else if (activeScreen === 'record' && selectedPendingClips.length > 0) {
  // Get the PARENT of the first pending clip
  const firstPendingClip = clips.find(c => c.id === selectedPendingClips[0].id);
  const parentId = firstPendingClip?.parentId || selectedPendingClips[0].id;

  setIsAppendMode(true);
  setCurrentClipId(parentId); // ✅ Use PARENT ID
  setAppendBaseContent('');
  setContentBlocks([]);
  log.debug('Recording from pending clip (adding successive recording)', {
    clipId: parentId,
    pendingTitle: selectedPendingClips[0].title
  });
  setTimeout(() => startRecordingHook(), 200);
}
```

---

## PART 7: COMPREHENSIVE TEST PLAN

### Test 1: Online Recording (Should Still Work)

**Steps**:
1. Browser online, click Record
2. Speak: "Test one online recording"
3. Press Done

**Expected**:
- ✅ Text slides in with animation
- ✅ "Copied to clipboard" toast
- ✅ Title changes "Recording 01" → AI-generated
- ✅ Session storage: `sessionStorage['clipstream-storage']` has clip
- ✅ No `sessionStorage['clipstream_clips']` (old key gone)
- ✅ IndexedDB empty (audio deleted)

---

### Test 2: Offline Single Recording

**Steps**:
1. Go offline (DevTools → Offline)
2. Click Record
3. Speak: "Test two offline single clip"
4. Press Done

**Expected**:
- ✅ "Audio saved for later" toast
- ✅ "Clip 001" appears with spinner
- ✅ Session storage shows:
  - Parent: `title: "Recording 01", status: null, no audioId`
  - Child: `parentId: [parent-id], pendingClipTitle: "Clip 001", audioId: [audio-id], status: "pending-child"`
- ✅ IndexedDB has 1 audio blob
- ✅ Press Clips → "Recording 01" visible with orange dot
- ✅ Click "Recording 01" → Shows "Clip 001" with spinner

---

### Test 3: Multiple Offline Recordings in Same File

**Steps**:
1. From Test 2, still offline
2. Press Record again
3. Speak: "Test three clip two"
4. Press Done
5. Repeat for clip 3, 4

**Expected**:
- ✅ "Clip 002" appears below "Clip 001" (NOT named "Clip 001"!)
- ✅ "Clip 003" appears
- ✅ "Clip 004" appears
- ✅ Session storage shows:
  - 1 parent
  - 4 children with `pendingClipTitle: "Clip 001", "Clip 002", "Clip 003", "Clip 004"`
- ✅ All children have same `parentId`
- ✅ All children have unique `audioId`
- ✅ IndexedDB has 4 audio blobs

---

### Test 4: Auto-Retry Sequential Processing

**Steps**:
1. From Test 3 (4 pending clips offline)
2. Go online (DevTools → Online)
3. Watch console and UI

**Expected**:
- ✅ Console: "Network online - attempting auto-retry"
- ✅ **Clip 001**:
  - Status → "transcribing"
  - Spinner active (HTTP in progress)
  - HTTP completes → "Transcription successful"
  - Formatting starts → "Starting background formatting"
  - Formatting completes → "Text formatted successfully"
  - Status → null
  - Audio deleted from IndexedDB
  - Text appears in UI
- ✅ **Clip 002**:
  - Starts AFTER Clip 001 fully completes
  - Same sequence
  - Transcription is "Test three clip two" (CORRECT, not overwritten!)
- ✅ **Clip 003**:
  - Starts AFTER Clip 002 fully completes
  - Same sequence
  - Transcription is "Test three clip three" (CORRECT!)
- ✅ **Clip 004**:
  - Starts AFTER Clip 003 fully completes
  - Same sequence
  - Transcription is "Test three clip four" (CORRECT!)
- ✅ **Parent title**:
  - After all 4 complete
  - "Recording 01" → AI-generated title
- ✅ Orange dot disappears
- ✅ Session storage:
  - All 4 children: `status: null, formattedText: [...], no audioId`
- ✅ IndexedDB: NO audio blobs (all deleted)

**CRITICAL**: Each clip has its OWN transcription, no overwrites!

---

### Test 5: First Recording Animation

**Steps**:
1. Fresh page, online
2. Record first clip ever
3. Press Done

**Expected**:
- ✅ Text slides in with fade/slide animation (not instant)

**If Broken**: Check `shouldAnimate` parameter in formatTranscriptionInBackground calls

---

### Test 6: Navigate and Persistence

**Steps**:
1. After Test 4 completes
2. Press Clips (back to home)
3. Refresh page (F5)
4. Click "Recording 01"

**Expected**:
- ✅ All 4 clips still visible
- ✅ All have formatted text
- ✅ No spinners
- ✅ Parent has AI title
- ✅ Session storage persists

---

### Test 7: Mixed Online/Offline

**Steps**:
1. Fresh start, online
2. Record "Online clip one" → Completes immediately
3. Go offline
4. Record "Offline clip two" → Creates pending
5. Record "Offline clip three" → Creates pending
6. Go online
7. Watch auto-retry

**Expected**:
- ✅ First clip completes normally
- ✅ Two pending clips created
- ✅ Auto-retry processes both in order
- ✅ All 3 clips have correct transcriptions

---

## PART 8: IMPLEMENTATION ORDER

### Phase 1: Migrate Remaining Files (CRITICAL)

**Do in this exact order**:

1. **Create clipHelpers.ts** (new file)
   - Copy utility functions from Part 2
   - Test: `import { getNextRecordingNumber } from './utils/clipHelpers'` works

2. **Update ClipMasterScreen.tsx**
   - Remove `initializeClips` import and call
   - Replace `getNextClipNumber`, `getNextRecordingNumber` imports → use clipHelpers
   - Pass `onDeleteClip`, `onUpdateClip` props to ClipHomeScreen

3. **Update useTranscriptionHandler.ts**
   - Remove `getClips` import from clipStorage
   - Change line 202: use `clips` from scope, not `getClips()`
   - Import `getNextRecordingNumber` from clipHelpers

4. **Update ClipHomeScreen.tsx**
   - Add `onDeleteClip`, `onUpdateClip` props
   - Remove clipStorage imports
   - Use props instead of direct storage calls

5. **TEST**: Online recording still works

---

### Phase 2: Fix Auto-Retry Sequential (HIGH PRIORITY)

1. **Update handleOnline in ClipMasterScreen.tsx**
   - Add `await waitForClipToComplete(clip.id)` after `await transcribeRecording()`
   - Handle timeout/failure cases

2. **TEST**: Test 4 (auto-retry) works correctly

---

### Phase 3: Fix Remaining Issues (MEDIUM PRIORITY)

1. **Fix successive recording context** (Part 6)
2. **Fix global isFormatting** (Part 4) - if not already done
3. **TEST**: Test 3 (multiple pending clips) works
4. **TEST**: Test 6 (navigation/persistence) works

---

### Phase 4: Polish (LOW PRIORITY)

1. **Fix first recording animation** (Part 5)
2. **TEST**: Test 5 (animation) works

---

### Phase 5: Final Validation (REQUIRED)

**Run ALL 7 tests** - every single one must pass.

**Storage Validation**:
```javascript
// In browser console:

// 1. Zustand storage exists
JSON.parse(sessionStorage.getItem('clipstream-storage'))
// Should return: {state: {clips: [...], selectedClip: ...}, version: 1}

// 2. Old storage GONE
sessionStorage.getItem('clipstream_clips')
// Should return: null

// 3. IndexedDB clean when all complete
// DevTools → Application → IndexedDB → clipstream_audio → audio_blobs
// Should be: Empty (when all clips status=null)
```

**Code Validation**:
```bash
# No direct sessionStorage writes to old key
grep -r "sessionStorage.setItem.*clipstream_clips" --include="*.ts" --include="*.tsx"
# Should find: NOTHING

# No imports of old clipStorage CRUD functions
grep -r "import.*\(createClip\|getClips\|updateClip\|deleteClip\).*clipStorage" --include="*.ts" --include="*.tsx"
# Should find: NOTHING (except clipStorage.ts itself)

# All use clipHelpers or Zustand
grep -r "getNextRecordingNumber" --include="*.ts" --include="*.tsx"
# Should all import from: '../utils/clipHelpers'
```

---

## PART 9: SUCCESS CRITERIA

**ALL 15 must be true**:

1. ✅ All 7 tests pass
2. ✅ All validation checks pass
3. ✅ No console errors
4. ✅ No orphaned audio in IndexedDB
5. ✅ Session storage uses only 'clipstream-storage' key
6. ✅ Clips persist across page refresh
7. ✅ Multiple pending clips increment (001, 002, 003...)
8. ✅ Auto-retry processes clips in CORRECT order (no skipping)
9. ✅ Each clip has its OWN transcription (no overwrites)
10. ✅ Spinners show correct states (waiting, active, complete)
11. ✅ Parent title generates after all children complete
12. ✅ Orange dot appears/disappears correctly
13. ✅ First recording animates text slide-in
14. ✅ Successive recordings append to same parent
15. ✅ Online/offline/online transitions work smoothly

**If ANY item fails, migration is NOT complete.**

---

## PART 10: ROLLBACK PLAN

### Immediate Rollback:
```bash
git stash
git checkout [commit-before-changes]
npm run dev
```

### Partial Rollback (revert specific file):
```bash
git checkout HEAD~1 src/projects/clipperstream/utils/clipHelpers.ts
git checkout HEAD~1 src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
```

### Data Recovery:
```javascript
// In browser console if migration breaks:
const oldClips = JSON.parse(sessionStorage.getItem('clipstream_clips') || '[]');
const zustandData = JSON.parse(sessionStorage.getItem('clipstream-storage') || '{}');

// Merge
sessionStorage.setItem('clipstream-storage', JSON.stringify({
  state: {
    clips: oldClips.length > 0 ? oldClips : zustandData.state?.clips || [],
    selectedClip: null
  },
  version: 1
}));

// Reload page
location.reload();
```

---

## SUMMARY

### What We're Fixing:
1. Complete Zustand migration (remove ALL clipStorage usage)
2. Sequential auto-retry (no race conditions)
3. Correct pending clip numbering (001, 002, 003...)
4. Per-clip state tracking (no global blockers)
5. Correct transcription assignment (no overwrites)

### How We're Fixing It:
1. Create clipHelpers.ts utilities ✅
2. Migrate 3 remaining files to Zustand ✅
3. Add await to auto-retry for sequential processing ✅
4. Fix successive recording context ✅
5. Ensure global isFormatting uses per-clip tracking ✅

### Files Modified:
- **NEW**: `utils/clipHelpers.ts`
- **MODIFIED**: `ClipMasterScreen.tsx`
- **MODIFIED**: `useTranscriptionHandler.ts`
- **MODIFIED**: `ClipHomeScreen.tsx`

### When We're Done:
- ✅ Offline recordings work perfectly
- ✅ Auto-retry processes queue correctly
- ✅ Multiple pending clips name correctly
- ✅ All transcriptions assigned correctly
- ✅ No race conditions
- ✅ No orphaned data
- ✅ Single source of truth (Zustand only)

---

**Prepared By**: Claude Sonnet 4.5 (Merged from 027 + 028)
**Date**: December 29, 2025
**Status**: READY TO IMPLEMENT
**Confidence**: 100% (combined best of both plans, accounts for what's already done)
