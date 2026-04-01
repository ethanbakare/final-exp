# 043_v3 - Critical Technical Audit

**Date**: January 7, 2026  
**Auditor**: AI Technical Review  
**Document Reviewed**: `043_v3_FINAL_CORRECTED.md`  
**Context Documents**: `044_FAILED_STATUS_AUDIT.md`, `043_v2_IMPLEMENTATION_FEEDBACK.md`  
**Status**: 🔍 **COMPREHENSIVE AUDIT** - Checking for blind spots, logic errors, and missing dependencies

---

## Executive Summary

**Overall Assessment**: 8.5/10 - Strong architecture with several critical fixes needed

**Critical Issues Found**: 5  
**High Priority Issues**: 8  
**Moderate Issues**: 6  
**Minor Issues**: 4

**Recommendation**: **Fix Critical + High Priority issues before implementation** (estimated 4-6 hours)

---

## 🔴 CRITICAL ISSUES (BLOCKERS)

### CRITICAL #1: 'audio-corrupted' Status Logic Contradiction

**Location**: Lines 666-673 (processAllPendingClips), Line 911 (ClipStatus type)

**Problem**: The code sets `status: 'audio-corrupted'` but ClipStatus type definition shows:
```typescript
// Line 911
type ClipStatus =
  | 'pending-child'
  | 'pending-retry'
  | 'transcribing'
  | 'formatting'
  | 'audio-corrupted'  // ✅ Listed as a status value
  | null;
```

**BUT** in the implementation (Line 667):
```typescript
updateClip(firstClip.id, {
  status: 'audio-corrupted',  // ← Sets STATUS
  transcriptionError: 'Failed to access audio storage'  // ← Also sets error message
});
```

**THEN** in the status mapping (Line 960):
```typescript
if (clip.status === 'audio-corrupted') {
  return 'audio-corrupted';  // ← Checks STATUS directly
}
```

**The Contradiction**:
Later in the document (Line 690):
```typescript
updateClip(firstClip.id, {
  status: 'audio-corrupted',  // ✅ Dedicated status (prevents infinite loop)
  transcriptionError: 'Audio file could not be retrieved from storage'
});
```

**But earlier documentation said** (from 043_v2):
> "Audio corrupted: lastError='audio-corrupted' → UI shows 'Audio corrupted, delete now'"

**Issue**: The spec is **inconsistent** about whether `'audio-corrupted'` is:
- A) A ClipStatus value (like `'transcribing'`)
- B) A value in `lastError` field (like `'dns-block'`)

**Current spec says**: It's a ClipStatus value ✅ (Line 911)

**But this creates a TYPE MISMATCH**:
```typescript
// Line 922 - lastError field definition
lastError?: 'dns-block' | 'api-down' | 'network' | 'validation' | null;
// ⚠️ Does NOT include 'audio-corrupted'
```

**Impact**:
- If `'audio-corrupted'` is a status, then `lastError` shouldn't include it (CORRECT per current spec)
- But UI code needs to check `clip.status === 'audio-corrupted'` (not `clip.lastError`)
- This is actually CORRECT in the spec, but needs verification in actual UI code

**Verification Needed**: Check if existing UI code in `cliplist.tsx` and `ClipOffline.tsx` correctly checks:
```typescript
// CORRECT (per v3 spec)
if (clip.status === 'audio-corrupted') { ... }

// WRONG (if any code does this)
if (clip.lastError === 'audio-corrupted') { ... }
```

**Action**: 
1. Verify all UI code uses `clip.status === 'audio-corrupted'`
2. Confirm `lastError` never contains `'audio-corrupted'`
3. Document this clearly to avoid confusion

**Severity**: 🔴 Critical - Will cause TypeScript errors if UI code uses wrong check

---

### CRITICAL #2: Missing `getClipById` Method in Store

**Location**: Line 626, Line 725

**Code**:
```typescript
// Line 626
const { clips: allClips, updateClip, deleteClip, getClipById } = useClipStore.getState();

// Line 725
const parentStillExists = getClipById(currentParent.id);
```

**Problem**: The spec assumes `getClipById` exists in the Zustand store, but it's not defined anywhere in this document.

**Zustand Store Definition** (Lines 991-1003):
```typescript
interface ClipStore {
  // ... existing fields
  processAllPendingClips: () => Promise<void>;
}

export const useClipStore = create<ClipStore>((set, get) => ({
  // ... existing fields
  
  // Set by ClipMasterScreen on mount
  processAllPendingClips: async () => {
    console.warn('processAllPendingClips not initialized yet');
  },
}));
```

**Missing**: No `getClipById` method defined

**Impact**:
- Code will fail at runtime with "getClipById is not a function"
- TypeScript will show error during compilation

**Solution Options**:

**Option A - Use clips array directly**:
```typescript
// Line 626 - Remove getClipById
const { clips: allClips, updateClip, deleteClip } = useClipStore.getState();

// Line 725 - Check existence directly
const parentStillExists = allClips.find(c => c.id === currentParent.id);
```

**Option B - Add getClipById to store** (RECOMMENDED):
```typescript
// In clipStore.ts
interface ClipStore {
  clips: Clip[];
  getClipById: (id: string) => Clip | undefined;
  // ...
}

export const useClipStore = create<ClipStore>((set, get) => ({
  clips: [],
  
  getClipById: (id: string) => {
    return get().clips.find(c => c.id === id);
  },
  
  // ...
}));
```

**Recommendation**: Option B - Add to store (cleaner API)

**Severity**: 🔴 Critical - Code won't compile/run without this

---

### CRITICAL #3: `formatChildTranscription` Function Not Defined

**Location**: Line 737, Line 889

**Code**:
```typescript
// Line 737
const formattedText = await formatChildTranscription(
  firstClip.id,
  result.text,
  currentParent.formattedText
);

// Line 889 - Listed in imports comment
// import { formatChildTranscription } from '../utils/formatting';
```

**Problem**: This function is called but never defined in the spec. Need to verify it exists in actual codebase.

**What it should do** (inferred from usage):
- Takes: clip ID, raw text, parent's current formatted text
- Returns: formatted version of the raw text
- Likely calls AI formatting service

**Potential Issues**:
1. Does this function exist in the current codebase?
2. What's the correct import path?
3. Does it match the expected signature?
4. What if formatting fails? (Should fall back to raw text per 044 audit)

**Action Required**:
1. Check if `../utils/formatting` exists
2. Verify function signature matches
3. Document error handling (should NOT throw - fall back to raw text)

**Severity**: 🔴 Critical - Implementation will fail if function doesn't exist or signature doesn't match

---

### CRITICAL #4: Logger Import - VERIFIED ✅

**Location**: Line 242

**Code**:
```typescript
// ✅ VERIFIED: Logger exists at utils/logger.ts
import { logger } from '../utils/logger';

const log = logger.scope('TranscriptionRetry');
```

**Verification Result**: ✅ **Logger file EXISTS** at `utils/logger.ts`

**Logger API** (Confirmed):
```typescript
// utils/logger.ts provides:
logger.debug(message, data?)  // Dev only
logger.info(message, data?)   // Always logged
logger.warn(message, data?)   // Always logged
logger.error(message, data?)  // Always logged
logger.scope(moduleName)      // Creates scoped logger
```

**Usage in Codebase** (titleGenerator.ts Line 9):
```typescript
import { logger } from '../utils/logger';
const log = logger.scope('TitleGenerator');
```

**Conclusion**: No action needed - logger exists and works correctly.

**Note**: This was incorrectly flagged as critical. Logger is production-ready and properly implemented.

**Severity**: ~~🔴 Critical~~ → ✅ RESOLVED

---

### CRITICAL #5: `transcriptionError` vs `lastError` Field Confusion

**Location**: Lines 668, 692, 777, 789, 922-923

**The Issue**: Spec uses BOTH fields inconsistently

**ClipStore Type Definition** (Lines 922-923):
```typescript
interface Clip {
  id: string;
  status: ClipStatus;
  lastError?: 'dns-block' | 'api-down' | 'network' | 'validation' | null;  // ✅ NEW
  transcriptionError?: string;  // ✅ Use existing field (non-breaking change)
  // ...
}
```

**Usage in Code**:

**Pattern 1 - Sets transcriptionError** (Line 668):
```typescript
updateClip(firstClip.id, {
  status: 'audio-corrupted',
  transcriptionError: 'Failed to access audio storage'  // ← string field
});
```

**Pattern 2 - Sets lastError** (Line 777):
```typescript
updateClip(firstClip.id, {
  status: 'pending-retry',
  lastError: 'dns-block'  // ← typed enum field
});
```

**Pattern 3 - Sets BOTH?** (Lines 788-789):
```typescript
updateClip(firstClip.id, {
  status: 'pending-retry',
  lastError: result.error   // ← Could be 'dns-block', 'network', etc.
});
```

**The Confusion**:
- `lastError`: Used for UI display mapping (enum of specific error types)
- `transcriptionError`: Used for debugging/logging (free-form string)

**But the spec is INCONSISTENT**:
- Audio corrupted: Sets `transcriptionError` only
- DNS block: Sets `lastError` only
- Other errors: Sets `lastError` only

**Question**: Should we ALWAYS set both?

**Recommended Fix**:
```typescript
// ALWAYS set both for consistency
updateClip(clipId, {
  status: 'pending-retry',
  lastError: 'dns-block',  // ← For UI mapping
  transcriptionError: 'Cannot reach transcription API (VPN blocking)'  // ← For debugging
});

// Audio corrupted
updateClip(clipId, {
  status: 'audio-corrupted',  // ← Status IS the error indicator
  lastError: null,  // ← Clear lastError (not a transcription error)
  transcriptionError: 'Audio file could not be retrieved from storage'  // ← For debugging
});
```

**Impact**: UI code that reads these fields might not find the error message it expects

**Severity**: 🔴 Critical - Inconsistent error tracking will cause UI bugs

---

### CRITICAL #6: 'failed' Status Needed for "No Audio Detected" Validation Errors

**Location**: Throughout spec - ClipStatus type, getPendingClips, processAllPendingClips

**Problem**: The 044_FAILED_STATUS_AUDIT.md incorrectly recommended removing 'failed' status entirely, but there's a critical scenario where it's needed.

**The Scenario**:
1. User records audio with broken/muted microphone (silence)
2. Deepgram returns empty transcript with "no audio detected" validation error
3. Current spec: Status set to 'pending-retry'
4. **BUG**: System retries forever, wasting API tokens
5. **Problem**: "No audio detected" is **NOT** a transient error - it's permanent

**Why This is Different**:

| Error Type | Retryable? | Status | Reason |
|------------|-----------|--------|---------|
| Network error | ✅ YES | `'pending-retry'` | Network will come back |
| API down (500) | ✅ YES | `'pending-retry'` | Server will recover |
| DNS block (VPN) | ✅ YES | `'pending-retry'` (skip to next parent) | User can disable VPN |
| Audio corrupted | ❌ NO | `'audio-corrupted'` | Can't retrieve from storage |
| **No audio detected** | ❌ NO | **`'failed'`** | **Audio has no speech** |

**Evidence from Current Code** (ClipMasterScreen.tsx Lines 1023-1029):
```typescript
if (!rawText || rawText.length === 0) {
  console.warn('[ProcessChild] Transcription failed:', child.pendingClipTitle);
  updateClip(child.id, {
    status: 'failed',  // ← USES 'FAILED' STATUS
    transcriptionError: transcriptionError === 'validation'
      ? `No audio detected in ${child.pendingClipTitle}`  // ← Specific message
      : 'Transcription failed'
  });
  return { success: false, rawText: '', formattedText: '' };
}
```

**This proves**:
1. ✅ 'failed' status IS needed
2. ✅ It's specifically for validation errors (no audio detected)
3. ✅ Current code already uses it correctly

**Solution**:

**1. Keep 'failed' in ClipStatus**:
```typescript
type ClipStatus =
  | 'pending-child'
  | 'pending-retry'
  | 'transcribing'
  | 'formatting'
  | 'audio-corrupted'
  | 'failed'  // ✅ KEEP THIS - for validation errors (no audio detected)
  | null;
```

**2. Update getPendingClips to EXCLUDE 'failed'**:
```typescript
// In clipStore.ts
getPendingClips: () => {
  return get().clips.filter(c =>
    c.audioId &&
    (c.status === 'pending-child' || c.status === 'pending-retry') &&
    c.status !== 'failed' &&  // ✅ Exclude failed clips from retry queue
    c.status !== 'audio-corrupted'
  );
}
```

**3. Add validation error detection in processAllPendingClips**:
```typescript
// After attemptTranscription returns
if (result.error === 'validation' && (!result.text || result.text.length === 0)) {
  // Permanent failure - no audio detected
  console.warn('[ProcessPending] No audio detected, marking as failed');
  updateClip(firstClip.id, {
    status: 'failed',  // ← Use 'failed' status
    transcriptionError: `No audio detected in ${firstClip.pendingClipTitle}`
  });
  
  // Skip to next parent (don't retry this clip)
  parentQueue.shift();
  continue;
}
```

**4. Update ClipOffline.tsx UI** (New State):
```typescript
// Add to ClipOfflineStatus type
type ClipOfflineStatus = 'waiting' | 'transcribing' | 'vpn-blocked' | 'audio-corrupted' | 'failed';

// UI for 'failed' status:
// - Icon: DeleteIcon (trash icon) instead of TranscribeBig
// - No time text (hidden)
// - No retry button (nothing to retry)
// - Click delete → removes clip permanently
```

**5. Display in ClipList**: Show "No audio detected" message

**Why User Is Right**:
- Retrying silent audio wastes tokens forever
- User needs visual feedback that audio is permanently unusable
- Delete button (not retry) is appropriate action

**Impact**: Without this fix, clips with silent audio will retry infinitely, wasting API costs.

**Severity**: 🔴 Critical - Causes infinite retry loops and token waste

---

## 🟠 HIGH PRIORITY ISSUES

### HIGH #1: `getFirstPendingClipInParent` Uses `useClipStore.getState()` Inside Function

**Location**: Lines 810-818

**Code**:
```typescript
// Helper: Get first pending clip in parent
function getFirstPendingClipInParent(parent: Clip): Clip | null {
  const { clips: allClips } = useClipStore.getState();  // ⚠️ Called on every invocation
  const children = allClips.filter(c =>
    c.parentId === parent.id && c.status === 'pending-child'
  );

  children.sort((a, b) => a.createdAt - b.createdAt);
  return children[0] || null;
}
```

**Problem**: This function is called inside the `while` loop (Line 649), potentially hundreds of times. Each call does:
1. `useClipStore.getState()` - reads entire store
2. `.filter()` - iterates all clips
3. `.sort()` - sorts filtered clips

**Performance Impact**:
- 100 pending clips × 3 parents = 300 calls to `getState()`
- Each call filters and sorts entire clips array
- O(n²) complexity in worst case

**Better Approach**:
```typescript
// OPTION A: Pass clips as parameter (cache at loop level)
function getFirstPendingClipInParent(parent: Clip, allClips: Clip[]): Clip | null {
  const children = allClips.filter(c =>
    c.parentId === parent.id && c.status === 'pending-child'
  );
  children.sort((a, b) => a.createdAt - b.createdAt);
  return children[0] || null;
}

// In loop (Line 626)
const { clips: allClips, updateClip, deleteClip } = useClipStore.getState();

while (parentQueue.length > 0) {
  const currentParent = parentQueue[0];
  const firstClip = getFirstPendingClipInParent(currentParent, allClips);  // ← Pass clips
  
  // ... but need to refresh after updateClip/deleteClip ...
  
  // After clip is processed, refresh clips
  allClips = useClipStore.getState().clips;
}
```

**OPTION B: Make it a selector** (BETTER):
```typescript
// In clipStore.ts
interface ClipStore {
  getFirstPendingChildInParent: (parentId: string) => Clip | null;
}

export const useClipStore = create<ClipStore>((set, get) => ({
  // ...
  
  getFirstPendingChildInParent: (parentId: string) => {
    const children = get().clips.filter(c =>
      c.parentId === parentId && c.status === 'pending-child'
    );
    children.sort((a, b) => a.createdAt - b.createdAt);
    return children[0] || null;
  },
}));

// In processAllPendingClips
const firstClip = useClipStore.getState().getFirstPendingChildInParent(currentParent.id);
```

**Recommendation**: Option B (cleaner, maintains encapsulation)

**Severity**: 🟠 High - Performance degradation with many clips

---

### HIGH #2: Missing Cleanup of `audioRetrievalAttempts` Map on User Delete

**Location**: Lines 594, 764

**Code**:
```typescript
// Line 594 - Map is defined
const audioRetrievalAttempts = new Map<string, number>();

// Line 764 - Cleanup on success
audioRetrievalAttempts.delete(firstClip.id);

// Line 670, 695, 732 - Cleanup after audio corrupted detection
audioRetrievalAttempts.delete(firstClip.id);
```

**Problem**: What if user manually deletes a clip from the UI while it's in the retry queue?

**Scenario**:
1. Clip fails audio retrieval → `audioRetrievalAttempts.set(clipId, 1)`
2. Retry loop rotates to next parent
3. User opens ClipList, deletes the clip
4. Entry in `audioRetrievalAttempts` is never cleaned up
5. **Memory leak**: Map grows indefinitely

**Solution**: Add cleanup in `deleteClip` action or on component unmount

```typescript
// In ClipMasterScreen cleanup
useEffect(() => {
  return () => {
    // Clear retry tracking on unmount
    audioRetrievalAttempts.clear();
  };
}, []);

// OR: Listen to clip deletions
useEffect(() => {
  const unsubscribe = useClipStore.subscribe((state, prevState) => {
    // Check if any clips were deleted
    const deletedClipIds = prevState.clips
      .filter(prevClip => !state.clips.find(c => c.id === prevClip.id))
      .map(c => c.id);
    
    // Clean up retry tracking for deleted clips
    deletedClipIds.forEach(id => audioRetrievalAttempts.delete(id));
  });
  
  return unsubscribe;
}, []);
```

**Severity**: 🟠 High - Memory leak over time

---

### HIGH #3: Race Condition Between `processAllPendingClips` and Zustand Updates

**Location**: Lines 626, 700-707, 756

**Problem**: The function reads clips at the start (Line 626) but the store can change while processing.

**Scenario**:
```
Time 0: processAllPendingClips starts
  ↓
  const { clips: allClips } = useClipStore.getState();  // ← Snapshot of clips
  
Time 1: User manually retries a clip from UI
  ↓
  Some other code calls updateClip()
  ↓
  Store state changes (clips array modified)
  
Time 2: processAllPendingClips tries to update same clip
  ↓
  updateClip(clipId, { status: 'transcribing' });
  ↓
  Working with stale data!
```

**Current Code** (Line 626):
```typescript
const { clips: allClips, updateClip, deleteClip, getClipById } = useClipStore.getState();
// ⚠️ allClips is a snapshot - doesn't update when store changes
```

**But later** (Line 811):
```typescript
function getFirstPendingClipInParent(parent: Clip): Clip | null {
  const { clips: allClips } = useClipStore.getState();  // ← Gets FRESH data
  // ...
}
```

**The Inconsistency**: 
- Main loop uses snapshot from Line 626
- Helper function gets fresh data on each call
- Could cause clips to be processed twice or not at all

**Solution**: Always get fresh data OR use subscribe pattern

```typescript
const processAllPendingClips = useCallback(async () => {
  if (isProcessingPending) return;
  isProcessingPending = true;

  try {
    while (true) {
      // ✅ Get FRESH data on each iteration
      const { clips, updateClip, deleteClip } = useClipStore.getState();
      
      const pendingChildren = clips.filter(c =>
        c.audioId && c.status === 'pending-child' && c.parentId
      );

      if (pendingChildren.length === 0) break;
      
      // ... process one clip ...
      
      // Loop continues, will get fresh data next iteration
    }
  } finally {
    isProcessingPending = false;
  }
}, []);
```

**Severity**: 🟠 High - Can cause duplicate processing or skipped clips

---

### HIGH #4: No Handling for `formatChildTranscription` Errors

**Location**: Lines 736-741

**Code**:
```typescript
// Format transcription
const formattedText = await formatChildTranscription(
  firstClip.id,
  result.text,
  currentParent.formattedText
);

// Update parent (no try-catch around formatting)
const updatedContent = {
  rawText: currentParent.rawText
    ? currentParent.rawText + '\n\n' + result.text
    : result.text,
  formattedText: currentParent.formattedText
    ? currentParent.formattedText + ' ' + formattedText  // ← What if formattedText is undefined?
    : formattedText,
  // ...
};
```

**Problem**: If `formatChildTranscription` throws an error, the entire `processAllPendingClips` crashes.

**From 044 Audit** (Line 206):
> "If the formatting API fails, you just basically get the thing as it is, that's fine."

**But the code doesn't implement this fallback!**

**Solution**:
```typescript
// Format transcription (with fallback)
let formattedText: string;
try {
  formattedText = await formatChildTranscription(
    firstClip.id,
    result.text,
    currentParent.formattedText
  );
} catch (error) {
  console.warn('[ProcessPending] Formatting failed, using raw text', error);
  formattedText = result.text;  // ← Fallback to raw text
}

// Update parent (safe now)
const updatedContent = {
  rawText: currentParent.rawText
    ? currentParent.rawText + '\n\n' + result.text
    : result.text,
  formattedText: currentParent.formattedText
    ? currentParent.formattedText + ' ' + formattedText
    : formattedText,
  content: currentParent.formattedText
    ? currentParent.formattedText + ' ' + formattedText
    : formattedText,
};
```

**Severity**: 🟠 High - Can crash entire retry process

---

### HIGH #5: `handleDoneClick` Integration is Incomplete

**Location**: Lines 838-886

**Code** shows how to replace transcription call, but doesn't show **complete** error handling flow.

**What's Missing**:

**1. Pending Clip Creation Logic**:
```typescript
// Line 869-870: "... existing pending clip creation logic ..."
// ⚠️ This is NOT defined in the spec!
```

**What it should be**:
```typescript
if (result.error === 'dns-block') {
  console.log('[HandleDone] VPN blocking transcription, saving as pending');

  // ✅ Create parent clip
  const parentClipId = generateClipId();
  const parentClip: Clip = {
    id: parentClipId,
    title: generateParentTitle(),  // ← Not defined - need to specify
    content: '',
    rawText: '',
    formattedText: '',
    status: null,  // ← Parent starts complete (empty)
    createdAt: Date.now(),
  };
  addClip(parentClip);

  // ✅ Create child pending clip
  const childClipId = generateClipId();
  const childClip: Clip = {
    id: childClipId,
    parentId: parentClipId,
    pendingClipTitle: `Clip 001`,  // ← How do we get the number?
    audioId: audioId,  // ← Need to save audio first!
    status: 'pending-child',
    lastError: 'dns-block',
    createdAt: Date.now(),
  };
  addClip(childClip);

  // ✅ Show VPN toast
  useClipStore.setState({ showVpnToast: true });

  // ✅ Navigate to parent clip
  router.push(`/clip/${parentClipId}`);
}
```

**But the spec just says "existing logic" - this is NOT detailed enough!**

**2. Audio Storage Missing**:
```typescript
// BEFORE creating pending clip, must save audio!
const audioId = await storeAudio(recordedBlob);

if (!audioId) {
  // Failed to save audio
  showToast({ type: 'error', message: 'Failed to save recording' });
  return;
}

// NOW create pending clip with audioId
```

**Missing from spec!**

**3. State Cleanup Missing**:
```typescript
// After creating pending clip, need to reset recording state
setRecordNavState('record');  // ← Back to initial state
// Reset recording timer, clear blob, etc.
```

**Action Required**: Spec needs to include COMPLETE `handleDoneClick` implementation, not just the transcription part.

**Severity**: 🟠 High - Incomplete spec will lead to implementation errors

---

### HIGH #6: `deleteAudio` Called Without Await in Some Paths

**Location**: Lines 730, 760

**Code**:
```typescript
// Line 730 (orphaned child cleanup)
if (firstClip.audioId) {
  await deleteAudio(firstClip.audioId);  // ✅ Correct
}

// Line 760 (successful transcription)
if (firstClip.audioId) {
  await deleteAudio(firstClip.audioId);  // ✅ Correct
}
```

**Actually the code IS correct**, but need to verify `deleteAudio` is properly async:

**Verify in audioStorage.ts**:
```typescript
// Should be:
export async function deleteAudio(audioId: string): Promise<void> {
  // ... IndexedDB delete operation
}

// NOT:
export function deleteAudio(audioId: string): void {
  // ... would be synchronous, but IndexedDB is async
}
```

**Also Missing**: Error handling for delete failures

```typescript
if (firstClip.audioId) {
  try {
    await deleteAudio(firstClip.audioId);
  } catch (error) {
    // ⚠️ What if delete fails? IndexedDB might be locked
    console.error('[ProcessPending] Failed to delete audio', error);
    // Should we continue anyway? (Audio becomes orphaned but that's OK)
  }
}
```

**Recommendation**: Add try-catch around `deleteAudio` calls (non-critical if it fails)

**Severity**: 🟠 High - Could leave orphaned audio in IndexedDB

---

### HIGH #7: Status Flow Documentation Contradicts Implementation

**Location**: Lines 1107-1195 (Status Flow section)

**Documentation Says** (Lines 1123-1125):
```
│ PHASE 1: Rapid Attempts (immediate)       │
│ - Attempt 1 → Fails                       │
│ - Attempt 2 → Fails   } Status stays      │
│ - Attempt 3 → Fails   } 'transcribing'    │
```

**But Implementation Does** (Lines 706-718):
```typescript
// Set status to 'transcribing' ONCE before calling attemptTranscription
updateClip(firstClip.id, { status: 'transcribing' });

// Call attemptTranscription (handles all 3 rapid + interval attempts internally)
const result = await attemptTranscription(audioBlob, {
  maxRapidAttempts: 3,
  useIntervals: true,
  // ...
});

// After it returns (all attempts done), check result
if (result.text && result.text.length > 0) {
  // Success
} else {
  // Now set to 'pending-retry'
  updateClip(firstClip.id, { status: 'pending-retry' });
}
```

**The Reality**: Status is set ONCE to 'transcribing', stays there through ALL attempts (1-6), then switches to 'pending-retry' after.

**The Contradiction**: Documentation implies status should change during interval waits, but implementation doesn't do this (no callbacks).

**From Line 272**:
> "Status behavior (set by caller, not this function):
> - Caller sets status='transcribing' before calling this
> - Status stays 'transcribing' throughout all rapid attempts (1-3)
> - Status stays 'transcribing' throughout interval waits and attempts (4-6)
> - After this returns with error, caller sets status='pending-retry'"

**This is CORRECT**, but then Lines 1129-1133 contradict it:
```
│ PHASE 2: Interval Attempts (if enabled)   │
│ - Wait 30s  }                             │
│ - Attempt 4 } Status stays 'transcribing' │
│ - Wait 1min }   (future: show             │
│ - Attempt 5 }    'retry-pending' during   │
│ - Wait 2min }     waits)                  │
│ - Attempt 6 }                             │
```

**"(future: show 'retry-pending' during waits)"** - This is confusing. Either implement it or remove this note.

**Current Implementation**: Status stays 'transcribing' through ENTIRE `attemptTranscription` call. No status changes during waits.

**Recommendation**: Remove "(future:...)" note or implement callback mechanism to change status during waits.

**Severity**: 🟠 High - Documentation confusion will lead to incorrect implementation

---

### HIGH #8: Missing `storeAudio` Import and Usage in Live Recording

**Location**: Lines 838-886 (handleDoneClick integration)

**Problem**: Spec shows using `result.text` but doesn't show saving audio for pending clips.

**Current Flow** (Lines 862-871):
```typescript
if (result.error === 'dns-block') {
  // VPN detected - create pending clip
  console.log('[HandleDone] VPN blocking transcription, saving as pending');

  // ... existing pending clip creation logic ...  // ⚠️ What about audio?
}
```

**Missing Steps**:
1. **Before** transcription attempt, must save audio blob
2. If transcription fails, pending clip references saved audio
3. If transcription succeeds, delete the saved audio (don't need it)

**Complete Flow Should Be**:
```typescript
// STEP 1: Save audio FIRST (before transcription)
const audioId = await storeAudio(recordedBlob);
if (!audioId) {
  showToast({ type: 'error', message: 'Failed to save recording' });
  return;
}

// STEP 2: Attempt transcription
const result = await attemptTranscription(recordedBlob, {
  maxRapidAttempts: 3,
  useIntervals: false,
});

// STEP 3A: Success - Delete audio (don't need it)
if (result.text && result.text.length > 0) {
  const formattedText = await formatTranscription(result.text);
  
  // Save clip
  addClip({ /* ... with text ... */ });
  
  // Clean up audio
  await deleteAudio(audioId);  // ← Don't need audio anymore
  
// STEP 3B: Failure - Create pending clip WITH audioId
} else {
  if (result.error === 'dns-block') {
    // Create pending clip with audioId
    createPendingClipWithAudio(audioId, result.error);
  }
}
```

**Missing Import**:
```typescript
// Line 889
import { attemptTranscription } from '../../utils/transcriptionRetry';

// ⚠️ MISSING:
import { storeAudio, deleteAudio } from '../../services/audioStorage';
```

**Severity**: 🟠 High - Incomplete implementation pattern

---

## 🟡 MODERATE ISSUES

### MODERATE #1: `audioRetrievalAttempts` Map is Module-Level (Not React-Safe)

**Location**: Line 594

**Code**:
```typescript
// ✅ NEW: Track audio retrieval failures to avoid immediate deletion
const audioRetrievalAttempts = new Map<string, number>();
```

**Problem**: This is a **module-level variable**, not React state or Zustand state.

**Issues**:
1. **Not SSR-safe**: Server and client will have separate maps
2. **Not persistent**: Map is lost on hot reload during development
3. **Not shared**: If multiple instances of ClipMasterScreen mount (shouldn't happen, but...), each has its own map reference

**Better Approach**:
```typescript
// OPTION A: Store in Zustand (persistent, shared)
interface ClipStore {
  audioRetrievalAttempts: Map<string, number>;
}

// OPTION B: Use React state (component-scoped)
const [audioRetrievalAttempts] = useState(() => new Map<string, number>());

// OPTION C: Store in clip metadata (most robust)
interface Clip {
  audioRetrievalAttempts?: number;  // ← Track per clip
}
```

**Recommendation**: Option C (most robust, self-cleaning, survives page refresh)

**Why Option C is Better**:
- ✅ **Persisted with clip** (survives page refresh via zustand persist)
- ✅ **Self-cleaning** (deleted when clip is deleted)
- ✅ **Data locality** (retry count lives with the clip it belongs to)
- ✅ **Simpler logic** (no separate Map to manage)

**Implementation**:
```typescript
// In clipStore.ts - Add to Clip interface
interface Clip {
  audioRetrievalAttempts?: number;  // ← Track per clip
}

// In processAllPendingClips - Use clip metadata
const attempts = firstClip.audioRetrievalAttempts || 0;
if (attempts < 3) {
  updateClip(firstClip.id, { 
    audioRetrievalAttempts: attempts + 1 
  });
  // ... try to get audio again
} else {
  // Corrupted - mark as audio-corrupted status
  updateClip(firstClip.id, {
    status: 'audio-corrupted',
    transcriptionError: 'Audio file could not be retrieved from storage'
  });
}

// Cleanup is automatic - when clip is deleted, metadata goes with it
```

**Severity**: 🟡 Moderate - Works but not ideal architecture

---

### MODERATE #3: No Rate Limiting on Retry Attempts

**Location**: Lines 289-328 (rapid attempts)

**Code**:
```typescript
for (let attempt = 1; attempt <= maxRapidAttempts; attempt++) {
  log.info('Rapid attempt', { attempt, max: maxRapidAttempts });
  
  const result = await transcribeSingle(audioBlob);
  // Immediately tries next attempt if this one fails
}
```

**Problem**: If Deepgram API is rate-limiting (429), we immediately try again 2 more times.

**Better**: Add small delay between rapid attempts when rate-limited

```typescript
for (let attempt = 1; attempt <= maxRapidAttempts; attempt++) {
  const result = await transcribeSingle(audioBlob);
  
  if (result.text) return result;
  
  // If rate-limited, wait a bit before next attempt
  if (result.error === 'api-down' && attempt < maxRapidAttempts) {
    await sleep(1000);  // 1 second between rapid attempts
  }
}
```

**Severity**: 🟡 Moderate - Could hit rate limits unnecessarily

---

### MODERATE #4: `currentParent` Could Be Stale After Long Processing

**Location**: Lines 648-768

**Code**:
```typescript
while (parentQueue.length > 0) {
  const currentParent = parentQueue[0];  // ← Get parent reference
  
  // ... long processing (could take 3+ minutes with intervals) ...
  
  // Line 756 - Finally use it
  updateClip(currentParent.id, updatedContent);  // ← Parent might have been updated by user
}
```

**Problem**: `currentParent` is a snapshot. While processing its child:
1. User opens parent clip in UI
2. User renames parent clip
3. User adds/removes content
4. `processAllPendingClips` overwrites with old data

**Solution**: Refresh parent data before updating
```typescript
// Before updating parent, get fresh data
const freshParent = useClipStore.getState().clips.find(c => c.id === currentParent.id);
if (!freshParent) {
  console.warn('[ProcessPending] Parent deleted during processing');
  continue;
}

const updatedContent = {
  rawText: freshParent.rawText  // ← Use fresh data
    ? freshParent.rawText + '\n\n' + result.text
    : result.text,
  formattedText: freshParent.formattedText
    ? freshParent.formattedText + ' ' + formattedText
    : formattedText,
  // ...
};
```

**Severity**: 🟡 Moderate - Rare but could overwrite user edits

---

### MODERATE #5: Missing Validation for Blob Size/Type

**Location**: Lines 405-468 (`transcribeSingle`)

**Code**:
```typescript
async function transcribeSingle(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);
    // ⚠️ No validation of blob size or type
```

**Problem**: What if `audioBlob` is:
- Empty (0 bytes)
- Tiny (< 100 bytes) - not valid audio
- Huge (> 25MB) - exceeds Deepgram limit
- Wrong MIME type - not audio

**Solution**:
```typescript
async function transcribeSingle(audioBlob: Blob): Promise<TranscriptionResult> {
  // Validate blob
  if (!audioBlob || audioBlob.size === 0) {
    log.error('Empty audio blob');
    return { text: '', error: 'validation' };
  }
  
  if (audioBlob.size < 100) {
    log.error('Audio too small', { size: audioBlob.size });
    return { text: '', error: 'validation' };
  }
  
  if (audioBlob.size > 25 * 1024 * 1024) {  // 25MB
    log.error('Audio too large', { size: audioBlob.size });
    return { text: '', error: 'validation' };
  }
  
  // ... rest of code
}
```

**Severity**: 🟡 Moderate - Could send invalid data to API

---

### MODERATE #6: UI Status Mapping is Incomplete

**Location**: Lines 956-986 (`getDisplayStatus`)

**Code**:
```typescript
const getDisplayStatus = (clip: Clip): 'pending' | 'transcribing' | 'retry-pending' | 'vpn-blocked' | 'audio-corrupted' | null => {
  // ✅ FIXED: Audio corrupted is now a dedicated STATUS (not derived from lastError)
  if (clip.status === 'audio-corrupted') {
    return 'audio-corrupted';
  }

  // ✅ VPN blocking derived from status='pending-retry' + lastError='dns-block'
  if (clip.status === 'pending-retry' && clip.lastError === 'dns-block') {
    return 'vpn-blocked';
  }

  // Actively transcribing
  if (clip.status === 'transcribing') {
    return 'transcribing';
  }

  // Waiting between interval attempts
  if (clip.status === 'pending-retry') {
    return 'retry-pending';
  }

  // Waiting to transcribe (offline or not started)
  if (clip.status === 'pending-child') {
    return 'pending';
  }

  return null;  // Completed
};
```

**Missing Case**: What about `status: 'formatting'`?

**Should be**:
```typescript
if (clip.status === 'formatting') {
  return 'transcribing';  // Show spinner while formatting
}
```

**Also Missing**: `status: 'canceled'` (from user cancellation - 044 audit)

**Severity**: 🟡 Moderate - UI won't handle all clip states

---

## 🟢 MINOR ISSUES

### MINOR #1: Comment Typo on Line 358

**Location**: Line 358

**Code**:
```typescript
// NOTE: Status stays 'transcribing' during this wait
// Future enhancement: caller could set 'retry-pending' here via callback
```

**Issue**: This comment appears in the interval wait section, but earlier the spec says status should stay 'transcribing' throughout (no callbacks implemented).

**Recommendation**: Remove "Future enhancement" notes to avoid confusion, or move to a "Future Enhancements" section at the end.

**Severity**: 🟢 Minor - Documentation clarity

---

### MINOR #2: Inconsistent Logging Prefixes

**Location**: Throughout the file

**Examples**:
- `[Auto-Retry]` (Line 136)
- `[ProcessPending]` (Line 623)
- `[Whisper]` (not in this spec, but mentioned elsewhere)
- `[API]` (Line 521)
- `[HandleDone]` (Line 856)
- `[Formatting]` (referenced from existing code)

**Issue**: No standard for logging prefixes

**Recommendation**: Document logging convention
```typescript
// Logging Prefixes:
// [Auto-Retry] - Auto-retry hook (useAutoRetry.ts)
// [Retry] - Retry logic (transcriptionRetry.ts)
// [ProcessPending] - Parent orchestration (processAllPendingClips)
// [HandleDone] - Live recording (handleDoneClick)
// [API] - Server-side API routes
```

**Severity**: 🟢 Minor - Consistency only

---

### MINOR #3: Magic Numbers Should Be Constants

**Location**: Lines 346, 411, 677, 779

**Examples**:
```typescript
// Line 346
const intervals = [30000, 60000, 120000];  // Magic numbers

// Line 411
const timeoutId = setTimeout(() => controller.abort(), 30000);  // 30s timeout

// Line 677
if (retrievalAttempts < 3) {  // Magic number

// Line 779
await new Promise(resolve => setTimeout(resolve, 30000));  // Magic number
```

**Better**:
```typescript
// At top of file
const RETRY_INTERVALS = [30000, 60000, 120000];  // 30s, 1min, 2min
const API_TIMEOUT_MS = 30000;
const MAX_AUDIO_RETRIEVAL_ATTEMPTS = 3;
const VPN_RETRY_DELAY_MS = 30000;

// Usage
const intervals = RETRY_INTERVALS;
const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
if (retrievalAttempts < MAX_AUDIO_RETRIEVAL_ATTEMPTS) {
await new Promise(resolve => setTimeout(resolve, VPN_RETRY_DELAY_MS));
```

**Severity**: 🟢 Minor - Code quality

---

### MINOR #4: Missing JSDoc Comments for Public Functions

**Location**: Lines 279, 405

**Code**:
```typescript
export async function attemptTranscription(
  audioBlob: Blob,
  options: RetryOptions
): Promise<TranscriptionResult> {
  // Has multiline comment, but not JSDoc format
}

async function transcribeSingle(audioBlob: Blob): Promise<TranscriptionResult> {
  // Has multiline comment, but not JSDoc format
}
```

**Better** (for IDE autocomplete):
```typescript
/**
 * Attempt transcription with retry logic
 * 
 * @param audioBlob - Audio to transcribe (WebM format)
 * @param options - Retry configuration
 * @returns Transcription result with text or error
 * 
 * @example
 * const result = await attemptTranscription(blob, {
 *   maxRapidAttempts: 3,
 *   useIntervals: false
 * });
 */
export async function attemptTranscription(
  audioBlob: Blob,
  options: RetryOptions
): Promise<TranscriptionResult> {
  // ...
}
```

**Severity**: 🟢 Minor - Developer experience

---

## 📋 MISSING DEPENDENCIES CHECKLIST

### External Dependencies (Need Verification)

| Dependency | Used In | Import Path | Status |
|------------|---------|-------------|--------|
| `logger` | transcriptionRetry.ts | `'../utils/logger'` | ⚠️ Verify exists |
| `useClipStore` | Multiple files | `'../store/clipStore'` | ✅ Assumed exists |
| `getAudio` | processAllPendingClips | `'../utils/audioStorage'` | ⚠️ Verify path |
| `deleteAudio` | processAllPendingClips | `'../utils/audioStorage'` | ⚠️ Verify path |
| `storeAudio` | handleDoneClick | `'../services/audioStorage'` | ⚠️ Path mismatch? |
| `formatChildTranscription` | processAllPendingClips | `'../utils/formatting'` | 🔴 Verify exists |
| `formatTranscription` | handleDoneClick | Not specified | 🔴 Missing import |

**Path Inconsistency**: `audioStorage` imported from both:
- `'../utils/audioStorage'` (Line 588)
- `'../services/audioStorage'` (implied for storeAudio)

**Action Required**: Verify actual file location

---

### Store Methods (Need Implementation)

| Method | Used In | Defined? | Priority |
|--------|---------|----------|----------|
| `getClipById` | processAllPendingClips | ❌ NO | 🔴 Critical |
| `getFirstPendingChildInParent` | Recommended (HIGH #1) | ❌ NO | 🟠 High |
| `processAllPendingClips` | Auto-retry | ✅ YES | ✅ Defined |

---

### Type Definitions (Need Verification)

| Type | Used In | Defined? | Notes |
|------|---------|----------|-------|
| `Clip` | Multiple | ✅ Assumed | Check fields match |
| `ClipStatus` | clipStore.ts | ✅ Line 907 | Check 'audio-corrupted' included |
| `TranscriptionResult` | transcriptionRetry.ts | ✅ Line 247 | Check error types match |
| `RetryOptions` | transcriptionRetry.ts | ✅ Line 252 | ✅ OK |

---

## 🎯 IMPLEMENTATION CHECKLIST (CORRECTED)

### Phase 1: Foundation (MUST DO FIRST)

- [x] **~~Verify logger exists~~** - ✅ VERIFIED at `utils/logger.ts`
- [ ] **Verify audioStorage paths** - utils/ or services/?
- [ ] **Add getClipById to Zustand store** (Critical #2)
- [ ] **Verify formatChildTranscription exists** or create it (Critical #3)
- [ ] **Define all constants** (RETRY_INTERVALS, API_TIMEOUT_MS, etc.)

### Phase 2: Store Updates

- [ ] **Keep `'failed'` in ClipStatus type** (Critical #6 - for "no audio detected")
- [ ] Add `'audio-corrupted'` to ClipStatus type
- [ ] Add `lastError` field to Clip interface
- [ ] Add `transcriptionError` field to Clip interface (if not exists)
- [ ] **Add `audioRetrievalAttempts` to Clip interface** (Moderate #1 - Option C recommended)
- [ ] Add `processAllPendingClips` to store interface
- [ ] Consider adding `getFirstPendingChildInParent` selector (High #1)

### Phase 3: API Route

- [ ] Update `/api/clipperstream/transcribe.ts` with DNS detection
- [ ] Test DNS error returns 503 with correct JSON
- [ ] Verify ENOTFOUND error detection works

### Phase 4: Retry Logic

- [ ] Create `utils/transcriptionRetry.ts`
- [ ] Implement `attemptTranscription` (NO circuit breaker)
- [ ] Implement `transcribeSingle` with client-side error checks
- [ ] Add server-side DNS detection (API route)
- [ ] Add blob validation (size, type) (Moderate #5)
- [ ] Test rapid + interval retries

### Phase 5: Auto-Retry Hook

- [ ] Create `hooks/useAutoRetry.ts`
- [ ] Verify memory leak fix (removeEventListener)
- [ ] Add race condition guard (HIGH #1 from v3)
- [ ] Test event listener cleanup

### Phase 6: ClipMasterScreen Updates

- [ ] Add `processAllPendingClips` with ALL fixes:
  - [ ] Race condition mutex (isProcessingPending)
  - [ ] Audio retrieval 3-attempt retry
  - [ ] Audio corrupted status (dedicated value)
  - [ ] Deleted parent check (High #3)
  - [ ] getAudio try-catch (High #3)
  - [ ] Stale parent data refresh (Moderate #4)
  - [ ] formatChildTranscription error handling (High #4)
  - [ ] deleteAudio error handling (High #6)
- [ ] Update `handleDoneClick`:
  - [ ] Use attemptTranscription
  - [ ] Add storeAudio before transcription (High #8)
  - [ ] Add COMPLETE pending clip creation (High #5)
  - [ ] Add audio cleanup on success
  - [ ] Add error-specific handling
- [ ] Register processAllPendingClips with store
- [ ] Add cleanup on unmount (audioRetrievalAttempts)

### Phase 7: Mount at App Root

- [ ] Choose: Pages Router (`_app.tsx`) or App Router (`layout.tsx`)
- [ ] Import useAutoRetry
- [ ] Call with processAllPendingClips
- [ ] Test survives navigation

### Phase 8: UI Integration

- [ ] Verify ClipList checks `clip.status === 'audio-corrupted'` (not lastError)
- [ ] **Add 'failed' state to ClipOffline** (Critical #6):
  - [ ] Add DeleteIcon component to clipbuttons.tsx
  - [ ] Update ClipOffline.tsx to show DeleteIcon for 'failed' status
  - [ ] Hide time text for 'failed' status
  - [ ] No retry button (permanent failure)
  - [ ] Update showcase in clipcomponent.tsx
- [ ] Verify ClipOffline handles 'audio-corrupted' state
- [ ] Verify ClipOffline handles 'vpn-blocked' state (WarningIcon)
- [ ] Implement getDisplayStatus mapping (Moderate #6 - add 'formatting' and 'failed')
- [ ] Test all status displays in UI

### Phase 9: Testing

- [ ] Offline recording → Come online → Auto-retry works
- [ ] VPN active → DNS error detected → Shows VPN UI (WarningIcon)
- [ ] VPN disabled → Retry succeeds
- [ ] **Silent audio (no speech) → Sets 'failed' status → Shows DeleteIcon** (Critical #6)
- [ ] 'failed' clips excluded from retry queue (getPendingClips filter)
- [ ] Multiple parents → Fair rotation
- [ ] Live recording → 3 attempts only (no intervals)
- [ ] Audio retrieval fails 3x → Sets 'audio-corrupted' status
- [ ] Concurrent retry calls → Mutex blocks duplicates
- [ ] Parent deleted during transcription → Orphan cleanup
- [ ] formatChildTranscription throws → Falls back to raw text
- [ ] Performance test with 100+ pending clips

---

## 🚨 SHOW-STOPPERS (MUST FIX BEFORE IMPLEMENTATION)

1. **getClipById not defined** (Critical #2) - Code won't compile
2. **formatChildTranscription not defined** (Critical #3) - Code won't run
3. ~~**logger import path not verified** (Critical #4)~~ - ✅ RESOLVED: Logger exists at `utils/logger.ts`
4. **transcriptionError vs lastError confusion** (Critical #5) - Inconsistent error tracking
5. **'failed' status for "no audio detected"** (Critical #6) - Must keep 'failed' status, add UI with DeleteIcon
6. **handleDoneClick incomplete** (High #5) - Missing critical steps (audio storage, clip creation)

---

## ✅ STRENGTHS (WHAT'S DONE WELL)

1. ✅ **Memory leak fixed** - removeEventListener correct
2. ✅ **Circuit breaker removed** - Correct dependency order
3. ✅ **Race condition guard** - Mutex prevents concurrent execution
4. ✅ **Audio retrieval retries** - 3 attempts before marking corrupted
5. ✅ **'audio-corrupted' as status value** - Semantic and prevents infinite loop
6. ✅ **'failed' status for validation errors** - Prevents infinite retry on silent audio
7. ✅ **Continuous retry** - Matches Dropbox/Google sync pattern
8. ✅ **Parent rotation** - Fair scheduling between clip files
9. ✅ **VPN-aware** - Doesn't rotate on DNS errors, shows WarningIcon
10. ✅ **Comprehensive status flow documentation** - Clear state transitions
11. ✅ **Logger utility exists** - Production-ready logging at `utils/logger.ts`

---

## 📊 FINAL VERDICT

**Architecture Quality**: 9/10 - Excellent design, well thought out

**Implementation Readiness**: 6/10 - Several critical gaps need filling

**Documentation Quality**: 8/10 - Comprehensive but has some contradictions

**Risk Level**: MODERATE - Critical issues are fixable but must be addressed

---

## 🎯 RECOMMENDED ACTION PLAN

### Immediate Actions (Before Implementation):

1. **Verify/Create Missing Dependencies** (2 hours)
   - Check logger exists or create fallback
   - Verify audioStorage path
   - Confirm formatChildTranscription exists
   - Add getClipById to store

2. **Clarify Error Field Usage** (30 min)
   - Document when to use `transcriptionError` vs `lastError`
   - Add examples for each error type
   - Update all usage sites for consistency

3. **Complete handleDoneClick Spec** (1 hour)
   - Write full pending clip creation flow
   - Include audio storage steps
   - Add state cleanup
   - Show navigation logic

4. **Fix High Priority Issues** (2 hours)
   - Add formatChildTranscription error handling
   - Optimize getFirstPendingClipInParent
   - Add missing cleanup on clip delete
   - Fix stale data issues

5. **Update Documentation** (30 min)
   - Remove contradictory "future" notes
   - Add constants section
   - Clarify status flow (no callbacks = stays 'transcribing')

**Total Time**: ~6 hours to make spec implementation-ready

---

## 📋 QUESTIONS FOR PRODUCT OWNER

1. **formatChildTranscription**: Does this function exist? What's its signature?
2. ~~**Logger**~~: ✅ RESOLVED - Logger exists at `utils/logger.ts`
3. **handleDoneClick**: Should I write complete spec for pending clip creation?
4. ~~**Lifetime retries**~~: ✅ RESOLVED - User confirmed continuous retry (Dropbox/sync pattern)
5. **'failed' status**: ✅ CONFIRMED - Keep for "no audio detected" validation errors (prevents token waste)

---

**END OF AUDIT**

**Next Step**: Address Critical + High Priority issues, then proceed to implementation.

