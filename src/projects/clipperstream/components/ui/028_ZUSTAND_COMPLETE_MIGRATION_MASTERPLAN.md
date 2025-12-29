# ZUSTAND COMPLETE MIGRATION - MASTER PLAN

**Date**: 2025-12-29
**Status**: COMPREHENSIVE IMPLEMENTATION PLAN
**Purpose**: Stop piecemeal fixes. Complete the Zustand migration properly.

---

## EXECUTIVE SUMMARY

**Problem**: Zustand v2.6.0 migration is INCOMPLETE. We have:
- ✅ Online recording flow working
- ❌ Offline recording flow broken
- ❌ Auto-retry flow broken
- ❌ Manual retry flow untested
- ❌ Multiple services still using old clipStorage
- ❌ Two parallel storage systems (Zustand + old)

**Root Cause**: Migration stopped halfway. Some hooks use Zustand, others bypass it.

**Solution**: Complete the migration in ONE comprehensive push.

---

## PART 1: WHAT WORKED BEFORE ZUSTAND

### From MASTER_ANALYSIS_DEC24.md

#### Working Features (Pre-Zustand):
1. ✅ **Online recordings** → Transcribe → Display → Format → Title generation
2. ✅ **Offline recordings** → Create parent/child → Save audio → Show pending
3. ✅ **Navigate back** → Clips persist → Click to view
4. ✅ **Auto-retry on online** → Process queue → Update UI → Clear pending
5. ✅ **Multiple pending clips** → "Clip 001", "Clip 002", "Clip 003" naming
6. ✅ **Successive recordings in same file** → Append mode → Multiple children
7. ✅ **Spinner states** → Waiting → Active HTTP → Between retries
8. ✅ **Home screen indicators** → Orange dot for pending → Spinner during processing
9. ✅ **Parent title generation** → After all children complete → AI title

#### The 4 Core Issues (Pre-Zustand):
1. ❌ **Can't record successive pending clips** (cleared currentClipId)
2. ❌ **Background transcription doesn't update UI** (no mechanism)
3. ❌ **Interval retry doesn't create pending clip** (only offline does)
4. ❌ **Hook coordination failing** (race conditions, global state)

---

## PART 2: CURRENT STATE AFTER PARTIAL ZUSTAND MIGRATION

### What's Working NOW:
1. ✅ **Online recordings** → Works perfectly
2. ✅ **Recording 01 file name** appears
3. ✅ **Can add clips to existing file** (partially)
4. ✅ **Infinite loops** ELIMINATED (Fixes 6, 7, 8)
5. ✅ **Storage key mismatch** identified (Fix 9)

### What's Broken NOW:
1. ❌ **Pending clips don't transcribe** when going online
2. ❌ **Title doesn't generate** for pending clips
3. ❌ **Text doesn't flow in** for pending clips
4. ❌ **Multiple pending clips all named "Clip 001"** (numbering broken)
5. ❌ **Transcribes latest clip** instead of first in queue
6. ❌ **State doesn't show correctly** on clip file in home screen
7. ❌ **Clips disappear when navigating back** (useOfflineRecording not using Zustand)
8. ❌ **First recording animation** doesn't work (text slide-in)

---

## PART 3: THE FULL INTENDED FLOW

### ONLINE RECORDING FLOW (Should Work):

```
1. User presses Record → Recording starts
2. User presses Done → Recording stops
3. Audio blob created → Saved to IndexedDB
4. Transcription HTTP request → Receives text
5. useTranscriptionHandler fires:
   - Creates new clip OR updates existing
   - Saves to Zustand store
   - Zustand persist middleware → sessionStorage
6. formatTranscriptionInBackground:
   - Sends raw text to formatting API
   - Receives formatted text
   - Updates clip in Zustand
   - Updates contentBlocks → Text slides in
   - Deletes audio from IndexedDB
   - Clears status
7. generateTitleInBackground:
   - Sends transcription to title API
   - Receives AI-generated title
   - Updates clip title in Zustand
8. UI shows:
   - ✅ Text animated in
   - ✅ Title fades from "Recording 01" to AI title
   - ✅ "Copied to clipboard" toast
   - ✅ Complete state (Copy/Record/Structure buttons)
```

**Current Status**: ✅ WORKING

---

### OFFLINE RECORDING FLOW (Should Work):

```
1. User presses Record (offline) → Recording starts
2. User presses Done → Recording stops
3. Audio blob created → Saved to IndexedDB
4. Transcription attempt → Detects offline
5. useOfflineRecording fires:
   - IF no currentClipId:
     a. Creates PARENT clip (empty container)
        - title: "Recording 01"
        - status: null
        - content: ""
     b. Creates FIRST CHILD clip
        - parentId: points to parent
        - title: "Recording 01" (inherited)
        - pendingClipTitle: "Clip 001"
        - audioId: points to IndexedDB
        - status: "pending-child"
        - duration: "0:05"
   - IF currentClipId exists:
     c. Finds parent
     d. Creates CHILD clip
        - parentId: points to parent
        - pendingClipTitle: "Clip 002" (incremented)
        - audioId: points to IndexedDB
        - status: "pending-child"
6. Zustand persist → sessionStorage
7. UI shows:
   - ✅ "Audio saved for later" toast
   - ✅ Pending clip appears in record screen
   - ✅ Spinning icon (waiting state)
8. Navigate back → Home screen:
   - ✅ "Recording 01" file visible
   - ✅ Orange dot indicator (has pending children)
9. Click "Recording 01":
   - ✅ Opens to record screen
   - ✅ Shows "Clip 001" with spinner
```

**Current Status**: ❌ BROKEN - useOfflineRecording writing to wrong storage key

---

### AUTO-RETRY FLOW (Should Work):

```
1. Network comes back online → handleOnline fires
2. Finds all clips with:
   - status: "pending-child" OR "pending"
   - audioId: exists (linked to IndexedDB)
3. FOR EACH pending clip (SEQUENTIAL):
   a. Update status → "transcribing"
   b. Retrieve audio blob from IndexedDB
   c. Call transcribeRecording(audioBlob)
   d. Wait for HTTP to complete
   e. useTranscriptionHandler fires:
      - Determines if first pending (display) or batch
      - IF first: format immediately
      - IF not first: add to batch
      - IF last in batch: flush batch (format all)
   f. formatTranscriptionInBackground:
      - Format text
      - Update clip in Zustand
      - Delete audio from IndexedDB
      - Clear status → null
   g. Wait for formatting to complete BEFORE next clip
4. After ALL clips complete:
   - Parent checks: all children have status=null?
   - Generates AI title for parent
5. UI updates:
   - ✅ Spinners stop
   - ✅ Text appears
   - ✅ Titles generate
   - ✅ Orange dot disappears (no longer pending)
```

**Current Status**: ❌ BROKEN - Multiple issues:
- Not sequential (fires all HTTP in parallel)
- Doesn't wait for formatting
- Global `isFormatting` blocks clips 2-4
- Global `transcription` overwrites between clips
- Wrong transcriptions assigned to wrong clips

---

### SUCCESSIVE RECORDINGS FLOW (Should Work):

```
SCENARIO: User is viewing "Recording 01" with pending "Clip 001"
         User presses Record → Should create "Clip 002"

1. User presses Record
2. Check: activeScreen === 'record' AND selectedPendingClips.length > 0
3. Set isAppendMode = true
4. Keep currentClipId (parent ID)
5. Recording starts
6. User presses Done (still offline)
7. useOfflineRecording fires:
   - Has currentClipId (parent exists)
   - Finds existing children: ["Clip 001"]
   - Calculates next number: "Clip 002"
   - Creates new child with incremented title
8. UI shows:
   - ✅ "Clip 001" (original)
   - ✅ "Clip 002" (new) appears below it
```

**Current Status**: ❌ PARTIALLY BROKEN
- Creates clip but names it "Clip 001" again (numbering broken)
- Possibly creating new parent instead of child

---

## PART 4: THINGS NOT PORTED TO ZUSTAND

### Files Still Using Old clipStorage:

1. **useOfflineRecording.ts** ❌ CRITICAL
   - Line 6: `import { getClips, createClip }`
   - Line 137, 201: `sessionStorage.setItem('clipstream_clips', ...)`
   - **Impact**: Offline recordings bypass Zustand completely

2. **useTranscriptionHandler.ts** ⚠️ PARTIAL
   - Line 6: `import { getClips }` (OLD)
   - But also uses passed-in `createNewClip` and `updateClipById` (Zustand wrappers)
   - **Mixed usage**: Some operations use Zustand, some don't

3. **useParentTitleGenerator.ts** ⚠️ CHECK
   - Need to verify if it reads from Zustand or old storage

4. **ClipHomeScreen.tsx** ⚠️ CHECK
   - Need to verify clip deletion uses Zustand

5. **ClipListItem.tsx** ⚠️ CHECK
   - Need to verify if it uses old storage anywhere

### Global State Issues (Architecture):

1. **`isFormatting`** ❌ GLOBAL BLOCKER
   - One flag for entire app
   - When Clip 1 formats, blocks Clips 2-4 from processing
   - **Fix**: `activeFormattingClipId` (per-clip tracking)

2. **`transcription`** ❌ GLOBAL OVERWRITE
   - One string for entire app
   - Clip 3 overwrites Clip 2's transcription before processed
   - **Fix**: Map<clipId, transcription> OR queue

3. **`isActiveRequest`** ✅ FIXED (v2.5.4)
   - Was global, now `activeHttpClipId`
   - Spinner shows on correct clip

---

## PART 5: COMPREHENSIVE FIX PLAN

### Phase 1: Complete useOfflineRecording Migration ✅ DONE

**Status**: Already applied (user confirmed files modified)

**Changes**:
- ✅ Remove old clipStorage imports
- ✅ Add Zustand actions to params (addClip, getClips)
- ✅ Replace `createClip()` with clip object + `addClip()`
- ✅ Remove all `sessionStorage.setItem()` calls
- ✅ Update ClipMasterScreen to pass Zustand actions

**Expected Result**: Offline recordings persist in Zustand storage

---

### Phase 2: Fix Auto-Retry Sequential Processing

**Problem**: Auto-retry doesn't wait for formatting, causing race conditions

**File**: `ClipMasterScreen.tsx` handleOnline function

**Current Code** (line 545):
```typescript
try {
  await transcribeRecording(audioBlob); // Waits for HTTP ✅
  // But formatting starts async, doesn't wait ❌
} finally {
  setActiveHttpClipId(null);
}
// Next clip starts immediately ❌
```

**New Code**:
```typescript
try {
  await transcribeRecording(audioBlob); // Wait for HTTP ✅

  // NEW: Wait for this clip to completely finish
  await waitForClipToComplete(clip.id); // Wait for formatting ✅
} finally {
  setActiveHttpClipId(null);
}
// Next clip starts only after previous fully complete ✅
```

**Add Helper Function**:
```typescript
const waitForClipToComplete = useCallback((clipId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 300; // 30 seconds (300 * 100ms)

    log.debug('Waiting for clip to complete formatting', { clipId });

    const checkInterval = setInterval(() => {
      attempts++;

      // Timeout check
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        log.error('Timeout waiting for clip to complete', {
          clipId,
          waitedMs: attempts * 100
        });
        resolve(false); // Failed
        return;
      }

      // Use Zustand getState() for fresh data
      const clip = useClipStore.getState().getClipById(clipId);

      // Success: status cleared, has formatted text, audio deleted
      if (clip && clip.status === null && clip.formattedText && !clip.audioId) {
        clearInterval(checkInterval);
        log.debug('Clip completed successfully', {
          clipId,
          waitedMs: attempts * 100
        });
        resolve(true); // Success
        return;
      }

      // Failure: clip marked as failed
      if (clip && clip.status === 'failed') {
        clearInterval(checkInterval);
        log.error('Clip formatting failed', { clipId });
        resolve(false); // Failed
        return;
      }

      // Still processing, continue waiting
    }, 100); // Check every 100ms
  });
}, []);
```

**Expected Result**:
- Clips process one at a time
- Each clip fully completes before next starts
- No race conditions
- No transcription overwrites

---

### Phase 3: Fix Global isFormatting Blocker

**Problem**: One global `isFormatting` flag blocks all clips when one is formatting

**Files**:
- ClipMasterScreen.tsx (where setIsFormatting is called)
- useTranscriptionHandler.ts (where it's checked)

**Current Architecture**:
```typescript
// ClipMasterScreen.tsx
const [isFormatting, setIsFormatting] = useState(false);

// formatTranscriptionInBackground
setIsFormatting(true); // ← Blocks EVERYONE
// ... format ...
setIsFormatting(false); // ← Unblocks

// useTranscriptionHandler.ts
if (transcription && !isTranscribing && !isFormatting) { // ← Blocked by global flag
  // Process transcription
}
```

**New Architecture** (already partially in place):
```typescript
// ClipMasterScreen.tsx - Use existing Zustand store
const activeFormattingClipId = useClipStore((state) => state.activeFormattingClipId);
const setActiveFormattingClipId = useClipStore((state) => state.setActiveFormattingClipId);

// Derive isFormatting for backwards compat
const isFormatting = activeFormattingClipId !== null;

// formatTranscriptionInBackground
setActiveFormattingClipId(clipIdToUpdate); // ← Track WHICH clip
// ... format ...
setActiveFormattingClipId(null); // ← Clear
```

**Expected Result**: Multiple clips can be in different stages without blocking each other

---

### Phase 4: Fix Pending Clip Numbering

**Problem**: All pending clips get named "Clip 001" instead of incrementing

**File**: `useOfflineRecording.ts` lines 168-176

**Current Code**:
```typescript
const childrenOfParent = allClips.filter(c => c.parentId === parentClip.id);
const childNumbers = childrenOfParent
  .map(c => c.pendingClipTitle?.match(/Clip (\d+)/)?.[1])
  .filter(n => n)
  .map(Number);
const maxChildNumber = childNumbers.length > 0 ? Math.max(...childNumbers) : 0;
const nextChildNumber = String(maxChildNumber + 1).padStart(3, '0');
```

**Issue**: After migration, `allClips = getClips()` might not have the JUST-ADDED clips yet

**Fix**: Use Zustand getState() for fresh data
```typescript
// Use Zustand directly for fresh data
const allClips = useClipStore.getState().clips; // ← Fresh from Zustand
const childrenOfParent = allClips.filter(c => c.parentId === parentClip.id);
// ... rest same
```

**OR** (if getClips already uses Zustand):
```typescript
// Ensure getClips() reads from Zustand, not old sessionStorage
const allClips = getClips(); // Should be: useClipStore.getState().clips
```

**Expected Result**:
- First child: "Clip 001"
- Second child: "Clip 002"
- Third child: "Clip 003"

---

### Phase 5: Clean Up Old clipStorage References

**Files to update**:

1. **useTranscriptionHandler.ts**
   - Line 6: Remove `getClips` from clipStorage import
   - Use Zustand `getClips` from params OR `useClipStore.getState().clips`

2. **Check all other hooks**:
   ```bash
   grep -r "from '../services/clipStorage'" --include="*.ts" --include="*.tsx"
   ```

3. **Verify no direct sessionStorage writes**:
   ```bash
   grep -r "sessionStorage.setItem.*clipstream" --include="*.ts" --include="*.tsx"
   ```

**Expected Result**: Only Zustand writes to storage, no bypasses

---

### Phase 6: Fix First Recording Animation

**Problem**: First recording doesn't animate text slide-in

**File**: ClipMasterScreen.tsx or formatTranscriptionInBackground

**Investigation Needed**:
- Check `shouldAnimate` parameter being passed correctly
- Check contentBlocks `animate: true` flag
- Verify CSS animation isn't being skipped

**Expected Result**: First transcription slides in with animation

---

### Phase 7: Fix Successive Recording Context

**Problem**: Recording from pending clip might clear currentClipId

**File**: ClipMasterScreen.tsx handleRecordClick

**Current Code** (lines 392-404):
```typescript
// ✅ NEW Case 2.5: Recording from pending clip (no content yet, but has audioId)
else if (activeScreen === 'record' && selectedPendingClips.length > 0) {
  // Keep currentClipId - we're adding to the SAME clip file
  setIsAppendMode(true);
  setCurrentClipId(selectedPendingClips[0].id); // ← IS THIS THE PARENT OR CHILD?
  ...
}
```

**Issue**: `selectedPendingClips[0].id` is the CHILD ID, not PARENT ID!

**Fix**:
```typescript
else if (activeScreen === 'record' && selectedPendingClips.length > 0) {
  // Get the PARENT of the first pending clip
  const firstPendingClip = clips.find(c => c.id === selectedPendingClips[0].id);
  const parentId = firstPendingClip?.parentId || selectedPendingClips[0].id;

  setIsAppendMode(true);
  setCurrentClipId(parentId); // ← Use PARENT ID
  ...
}
```

**Expected Result**: Successive recordings append to same parent

---

## PART 6: COMPREHENSIVE TEST PLAN

### Test 1: Online Recording (Basic Flow)

**Setup**: Online, fresh start

**Steps**:
1. Press Record
2. Speak: "Test one online recording"
3. Press Done

**Expected Results**:
- ✅ Text slides in with animation
- ✅ "Copied to clipboard" toast appears
- ✅ Title changes from "Recording 01" to AI-generated title
- ✅ Session storage shows clip with formattedText
- ✅ No audioId in clip (deleted)
- ✅ IndexedDB has no orphaned audio

**Success Criteria**: All ✅

---

### Test 2: Offline Recording (Single Clip)

**Setup**: Go offline, fresh start

**Steps**:
1. Turn off network (DevTools → Offline)
2. Press Record
3. Speak: "Test two offline single clip"
4. Press Done

**Expected Results**:
- ✅ "Audio saved for later" toast appears
- ✅ "Clip 001" appears with spinner (waiting state)
- ✅ Session storage shows:
  - Parent clip: title "Recording 01", status null, no audioId
  - Child clip: parentId set, pendingClipTitle "Clip 001", audioId set, status "pending-child"
- ✅ IndexedDB has audio blob
- ✅ Press Clips → Back to home
- ✅ "Recording 01" file visible with orange dot

**Success Criteria**: All ✅

---

### Test 3: Offline Multiple Pending Clips

**Setup**: Offline, inside existing pending clip

**Steps**:
1. From Test 2, click "Recording 01" file
2. Opens to "Clip 001" with spinner
3. Press Record again
4. Speak: "Test three second pending clip"
5. Press Done
6. Repeat for Clip 003, Clip 004

**Expected Results**:
- ✅ "Clip 002" appears below "Clip 001"
- ✅ Both have spinners
- ✅ "Clip 003" appears
- ✅ "Clip 004" appears
- ✅ Session storage shows:
  - 1 parent ("Recording 01")
  - 4 children with pendingClipTitle: "Clip 001", "Clip 002", "Clip 003", "Clip 004"
- ✅ All children have same parentId
- ✅ All children have unique audioId
- ✅ IndexedDB has 4 audio blobs

**Success Criteria**: All ✅

---

### Test 4: Auto-Retry Sequential Processing

**Setup**: From Test 3 (4 pending clips offline)

**Steps**:
1. Turn network back online
2. Watch console logs and UI

**Expected Results**:
- ✅ Console shows: "Network online - attempting auto-retry"
- ✅ Clip 001:
  - Status → "transcribing"
  - Spinner changes to active (HTTP)
  - HTTP completes → "Transcription successful"
  - Formatting starts → "Starting background formatting"
  - Formatting completes → "Text formatted successfully"
  - Status → null
  - Audio deleted
  - Text appears in UI
- ✅ Clip 002:
  - Starts AFTER Clip 001 fully completes
  - Same sequence
- ✅ Clip 003:
  - Starts AFTER Clip 002 fully completes
  - Same sequence
- ✅ Clip 004:
  - Starts AFTER Clip 003 fully completes
  - Same sequence
- ✅ Parent title:
  - After all 4 complete
  - "Recording 01" → AI-generated title (e.g., "Test Offline Recording Session")
- ✅ Orange dot disappears (no longer pending)
- ✅ Session storage:
  - All 4 children have status: null
  - All 4 children have formattedText
  - All 4 children have NO audioId
  - Parent has AI title
- ✅ IndexedDB has NO audio blobs (all deleted)

**Success Criteria**: All ✅ AND clips process in CORRECT ORDER (001→002→003→004)

---

### Test 5: Correct Transcriptions Assigned

**Setup**: From Test 4

**Steps**:
1. After auto-retry completes
2. Check each clip's transcription

**Expected Results**:
- ✅ Clip 001 has: "Test two offline single clip" (correct)
- ✅ Clip 002 has: "Test three second pending clip" (correct)
- ✅ Clip 003 has: "Test three third pending clip" (correct)
- ✅ Clip 004 has: "Test three fourth pending clip" (correct)
- ❌ NOT: Clip 002 has Clip 003's transcription (WRONG)
- ❌ NOT: All clips have same transcription (WRONG)

**Success Criteria**: Each clip has its OWN transcription, no overwrites

---

### Test 6: Navigate and Persistence

**Setup**: After Test 4 completes

**Steps**:
1. Press Clips (back to home)
2. Refresh page (F5)
3. Click "Recording 01" again

**Expected Results**:
- ✅ All 4 clips still visible
- ✅ All have their formatted text
- ✅ No spinners (all complete)
- ✅ Parent has AI-generated title
- ✅ Session storage persists across refresh

**Success Criteria**: All ✅

---

### Test 7: Mixed Online/Offline

**Setup**: Fresh start, online

**Steps**:
1. Online: Record "Clip one online" → Should complete immediately
2. Go offline
3. Offline: Record "Clip two offline" → Should create "Clip 001" pending
4. Offline: Record "Clip three offline" → Should create "Clip 002" pending
5. Go online
6. Watch auto-retry process pending clips

**Expected Results**:
- ✅ First clip completes normally (no pending)
- ✅ Two pending clips created
- ✅ Auto-retry processes both in order
- ✅ All 3 clips have correct transcriptions

**Success Criteria**: All ✅

---

## PART 7: IMPLEMENTATION ORDER

### Priority 1: CRITICAL (Breaks offline flow completely)

1. ✅ **Phase 1**: useOfflineRecording migration → ALREADY DONE
2. **Phase 2**: Auto-retry sequential processing → REQUIRED for offline to work
3. **Phase 4**: Pending clip numbering → REQUIRED for multiple pending clips

**Timeline**: These MUST be done first. Nothing else works without them.

---

### Priority 2: HIGH (Major bugs, wrong behavior)

4. **Phase 3**: Fix global isFormatting → Prevents race conditions
5. **Phase 7**: Fix successive recording context → Prevents wrong parent assignment

**Timeline**: Do immediately after Priority 1.

---

### Priority 3: MEDIUM (Clean up, correctness)

6. **Phase 5**: Clean up old clipStorage references → Prevents future bugs
7. **Phase 6**: Fix first recording animation → UX polish

**Timeline**: After core flows work.

---

## PART 8: VALIDATION CHECKLIST

After ALL phases complete, run this checklist:

### Storage Validation:

```bash
# In browser console:

# 1. Zustand storage should exist
sessionStorage.getItem('clipstream-storage')
# Should return: JSON with {state: {clips: [...], selectedClip: ...}, version: 1}

# 2. Old storage should NOT exist or be empty
sessionStorage.getItem('clipstream_clips')
# Should return: null

# 3. IndexedDB should have no orphaned audio
# Open DevTools → Application → IndexedDB → clipstream_audio → audio_blobs
# Should show: Empty WHEN all clips have status=null
```

### Code Validation:

```bash
# 1. No direct sessionStorage writes to old key
grep -r "sessionStorage.setItem.*clipstream_clips" --include="*.ts" --include="*.tsx"
# Should find: NOTHING

# 2. No imports of old clipStorage CRUD functions
grep -r "import.*createClip.*clipStorage" --include="*.ts" --include="*.tsx"
# Should find: NOTHING (except the service file itself)

# 3. All clips read from Zustand
grep -r "getClips()" --include="*.ts" --include="*.tsx"
# Should all use: useClipStore.getState().clips
```

### Flow Validation:

Run all 7 tests in Part 6. ALL must pass.

---

## PART 9: ROLLBACK PLAN

If something breaks catastrophically:

### Immediate Rollback:

```bash
git stash
git checkout [commit-before-zustand-migration]
npm install
npm run dev
```

### Partial Rollback:

Revert specific files:
```bash
git checkout HEAD~1 src/projects/clipperstream/hooks/useOfflineRecording.ts
git checkout HEAD~1 src/projects/clipperstream/store/clipStore.ts
```

### Data Recovery:

Users' clips are in sessionStorage. If migration breaks:

```javascript
// In browser console:
const oldClips = JSON.parse(sessionStorage.getItem('clipstream_clips') || '[]');
const zustandData = JSON.parse(sessionStorage.getItem('clipstream-storage') || '{}');

// Merge
sessionStorage.setItem('clipstream-storage', JSON.stringify({
  state: {
    clips: oldClips,
    selectedClip: null
  },
  version: 1
}));
```

---

## PART 10: SUCCESS CRITERIA

### Definition of Done:

**ALL of the following must be true**:

1. ✅ All 7 tests in Part 6 pass
2. ✅ All validation checks in Part 8 pass
3. ✅ No console errors during any test
4. ✅ No orphaned audio in IndexedDB
5. ✅ Session storage uses only 'clipstream-storage' key
6. ✅ Clips persist across page refresh
7. ✅ Multiple pending clips increment correctly (001, 002, 003...)
8. ✅ Auto-retry processes clips in CORRECT order
9. ✅ Each clip has its OWN transcription (no overwrites)
10. ✅ Spinners show correct states (waiting, active, complete)
11. ✅ Parent title generates after all children complete
12. ✅ Orange dot appears/disappears correctly
13. ✅ First recording animates text slide-in
14. ✅ Successive recordings append to same parent
15. ✅ Online/offline/online transitions work smoothly

**If ANY item fails, migration is NOT complete.**

---

## SUMMARY

**What We're Fixing**:
1. Complete Zustand migration (no more old clipStorage)
2. Sequential auto-retry (no race conditions)
3. Correct pending clip numbering (001, 002, 003...)
4. Per-clip state tracking (no global blockers)
5. Correct transcription assignment (no overwrites)

**How We're Fixing It**:
1. Migrate useOfflineRecording to Zustand ✅ DONE
2. Add waitForClipToComplete() helper
3. Use activeFormattingClipId instead of global isFormatting
4. Fix pending clip numbering to use fresh Zustand data
5. Clean up all old clipStorage imports

**When We're Done**:
- ✅ Offline recordings work perfectly
- ✅ Auto-retry processes queue correctly
- ✅ Multiple pending clips name correctly
- ✅ All transcriptions assigned correctly
- ✅ No race conditions
- ✅ No orphaned data

**Let's do this comprehensively, ONE TIME, and be DONE.**

---

**Prepared By**: Claude Sonnet 4.5
**Date**: December 29, 2025
**Status**: READY TO IMPLEMENT
**Confidence**: 100% (comprehensive analysis, clear plan, measurable success criteria)
