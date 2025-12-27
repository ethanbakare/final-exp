# 013_v2: ClipMasterScreen Comprehensive Refactor Blueprint

**Date:** December 27, 2025
**Version:** 2.0 (Revised with complete implementation details)
**Current State:** 1589 lines, 24+ states, spaghetti architecture
**Target State:** <300 lines coordinator + 4 specialized hooks
**Estimated Time:** 8-12 hours over 4 phases
**Risk Level:** Medium (phased approach with testing after each step)

---

## 📊 Executive Summary

### Current State Analysis

**ClipMasterScreen.tsx: 1589 lines**

| Category | Count | Impact |
|----------|-------|--------|
| `useState` declarations | 24+ | State explosion, hard to track |
| `useEffect` hooks | 7 | Complex dependency arrays, re-render storms |
| `useCallback` functions | 15+ | Stale closures, recreation issues |
| Lines handling offline logic | ~400 | Scattered across multiple locations |
| Lines handling transcription | ~300 | Duplicated code paths (online vs background) |

### What Works Perfectly (DO NOT BREAK)

| Feature | Lines | Status | Notes |
|---------|-------|--------|-------|
| **Online Recording** | 618-622, 977-1037 | ✅ Perfect | Main success path |
| **Text Animations** | 742-749 | ✅ Perfect | Fade-in, slide effects |
| **Screen Navigation** | 234-289 | ✅ Perfect | Home ↔ Record ↔ Search |
| **Clip CRUD** | Various | ✅ Perfect | Delete, rename, search |
| **UI Components** | N/A | ✅ Perfect | ClipButtons, ClipList, ClipOffline, ClipRecordScreen |
| **Showcase Demos** | N/A | ✅ Perfect | ClipOfflineScreen.tsx shows expected behavior |

### What's Broken (Will Fix During Refactor)

| Bug | Root Cause | Current Code | Fixes in Phase |
|-----|------------|--------------|----------------|
| Second pending clip replaces first | Singular `selectedPendingClip` state | Line 70 | Phase 2 |
| Wrong clip numbering (global instead of per-file) | Counts all pending clips globally | Lines 1277-1288 | Phase 2 |
| Background transcription doesn't update UI | No handler for non-`processing` transcriptions | Lines 1040-1090 half-implemented | Phase 3 |
| Can't record successive pending clips | Missing Case 2.5 in `handleRecordClick` | Lines 290-308 | Phase 1 |
| Transcription applied to wrong clip | Finds first `transcribing` clip arbitrarily | Lines 1057-1066 | Phase 3 |

---

## 🏗️ Target Architecture

### File Structure After Refactor

```
ClipMasterScreen.tsx (250 lines)
├── Screen state (activeScreen: 'home' | 'record' | 'search')
├── Props passing to child components
├── Screen-level event handlers (navigation)
└── Hook coordination (composes specialized hooks)

hooks/
├── useClipState.ts (150 lines)
│   ├── Manages clips array from sessionStorage
│   ├── CRUD operations (create, update, delete)
│   ├── selectedClip state
│   └── refreshClips synchronization
│
├── usePendingClipsQueue.ts (220 lines)
│   ├── selectedPendingClips: PendingClip[] (ARRAY, not singular)
│   ├── Per-file clip numbering (Clip001, Clip002 within same Recording)
│   ├── Transformation: Clip → PendingClip for display
│   └── Pending clip creation with stored title
│
├── useTranscriptionOrchestrator.ts (280 lines)
│   ├── Unified transcription completion handler (Option D architecture)
│   ├── Handles BOTH active recordings AND background retries
│   ├── formatTranscription: AI formatting + clip updates
│   ├── generateTitle: AI title generation
│   └── No coupling to recordNavState (reads as context, not gate)
│
└── useRecordingSession.ts (120 lines)
    ├── currentClipId (which clip we're recording into)
    ├── isAppendMode (new recording vs append to existing)
    ├── recordNavState ('record' | 'recording' | 'processing' | 'complete')
    ├── contentBlocks (display state for transcribed text)
    └── appendBaseContent (existing text when appending)
```

### Dependency Flow

```
ClipMasterScreen (coordinator)
├── useClipState()
│   └── Returns: clips, selectedClip, CRUD functions
│
├── useRecordingSession()
│   └── Returns: currentClipId, recordNavState, contentBlocks, etc.
│
├── usePendingClipsQueue({ clips, currentClipId, isActiveRequest })
│   └── Returns: selectedPendingClips[], clipToPendingClip()
│
├── useTranscriptionOrchestrator({
│   │   clips, currentClipId, selectedPendingClips,
│   │   transcription, recordNavState, ...
│   └── })
│       └── Returns: formatTranscription()
│
└── useClipRecording() (EXISTING - no changes)
    └── Returns: transcription, isTranscribing, isActiveRequest, ...
```

---

## 🔧 Phase 1: Extract Clip State Management (2-3 hours)

### Goals

- ✅ Move clips array management out of ClipMasterScreen
- ✅ Centralize CRUD operations
- ✅ **Fix:** Add Case 2.5 for recording from pending clip
- ✅ Reduce ClipMasterScreen by ~150 lines

### What Gets Fixed

| Bug | How Phase 1 Fixes It |
|-----|---------------------|
| Can't record successive pending clips in same file | Adds Case 2.5 to `handleRecordClick` |

---

### Step 1.1: Create `hooks/useClipState.ts`

**New file:** `/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/hooks/useClipState.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import {
  Clip,
  getClips,
  createClip,
  updateClip,
  deleteClip
} from '../services/clipStorage';
import { logger } from '../utils/logger';

const log = logger.scope('useClipState');

/**
 * Manages clip state and CRUD operations
 *
 * Extracted from ClipMasterScreen.tsx to centralize clip management.
 * This hook is responsible for:
 * - Loading clips from sessionStorage
 * - Keeping React state in sync with storage
 * - Providing CRUD operations that auto-refresh
 * - Managing selectedClip state
 */
export function useClipState() {
  // MOVED FROM: ClipMasterScreen.tsx line 58-59
  const [clips, setClips] = useState<Clip[]>([]);

  // MOVED FROM: ClipMasterScreen.tsx line 60
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  // MOVED FROM: ClipMasterScreen.tsx lines 341-348 (initialization useEffect)
  useEffect(() => {
    const initialClips = getClips();
    setClips(initialClips);
    log.debug('Clips initialized from storage', { count: initialClips.length });
  }, []);

  // MOVED FROM: ClipMasterScreen.tsx lines 414-416
  const refreshClips = useCallback(() => {
    const updatedClips = getClips();
    setClips(updatedClips);
    log.debug('Clips refreshed from storage', { count: updatedClips.length });
  }, []);

  // WRAPPER for createClip that auto-refreshes
  const createNewClip = useCallback((content: string, title: string, formattedText: string) => {
    log.info('Creating new clip', { title, hasContent: !!content });
    const newClip = createClip(content, title, formattedText);
    refreshClips();
    return newClip;
  }, [refreshClips]);

  // WRAPPER for updateClip that auto-refreshes
  const updateClipById = useCallback((clipId: string, updates: Partial<Clip>) => {
    log.info('Updating clip', { clipId, updates });
    const updated = updateClip(clipId, updates);
    refreshClips();
    return updated;
  }, [refreshClips]);

  // WRAPPER for deleteClip that auto-refreshes
  const deleteClipById = useCallback((clipId: string) => {
    log.info('Deleting clip', { clipId });
    deleteClip(clipId);
    refreshClips();
  }, [refreshClips]);

  return {
    clips,
    selectedClip,
    setSelectedClip,
    refreshClips,
    createNewClip,
    updateClipById,
    deleteClipById
  };
}
```

**Rationale:**
- Centralizes all clip state management in one place
- Auto-refresh pattern prevents stale state bugs
- Logger integration for debugging
- Clean interface for ClipMasterScreen

---

### Step 1.2: Update ClipMasterScreen to Use Hook

**File:** `ClipMasterScreen.tsx`

**BEFORE (lines 58-60):**
```typescript
const [clips, setClips] = useState<Clip[]>([]);
const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
```

**AFTER:**
```typescript
// PHASE 1: Extracted to useClipState hook
const {
  clips,
  selectedClip,
  setSelectedClip,
  refreshClips,
  createNewClip,
  updateClipById,
  deleteClipById
} = useClipState();
```

**BEFORE (lines 341-348 - initialization useEffect):**
```typescript
useEffect(() => {
  const initialClips = getClips();
  setClips(initialClips);
  log.debug('Clips loaded from sessionStorage', { count: initialClips.length });
}, []);
```

**AFTER:**
```typescript
// DELETED - now handled inside useClipState hook
```

**BEFORE (lines 414-416 - refreshClips function):**
```typescript
const refreshClips = useCallback(() => {
  const updatedClips = getClips();
  setClips(updatedClips);
}, []);
```

**AFTER:**
```typescript
// DELETED - now returned from useClipState hook
```

**ADD IMPORT (top of file):**
```typescript
import { useClipState } from '../hooks/useClipState';
```

---

### Step 1.3: Fix Case 2.5 - Recording from Pending Clip

**File:** `ClipMasterScreen.tsx`

**Location:** Inside `handleRecordClick` function (around line 290)

**BEFORE (lines 290-308):**
```typescript
// Case 2: Recording from existing clip with content → APPEND mode
else if (activeScreen === 'record' && selectedClip?.content) {
  setIsAppendMode(true);
  setCurrentClipId(selectedClip.id);
  setAppendBaseContent(selectedClip.formattedText || selectedClip.content);
  setContentBlocks([{
    id: 'existing-content',
    text: selectedClip.formattedText || selectedClip.content,
    animate: false
  }]);
  log.debug('Recording in append mode', { clipId: selectedClip.id });
  setTimeout(() => startRecording(), 200);
}

// Case 3: Recording from record screen (no existing content) → NEW clip
else {
  setIsAppendMode(false);
  setCurrentClipId(null);
  setAppendBaseContent('');
  setContentBlocks([]);
  log.debug('Recording new clip (no append)');
  setTimeout(() => startRecording(), 200);
}
```

**AFTER (with Case 2.5 added):**
```typescript
// Case 2: Recording from existing clip with content → APPEND mode
else if (activeScreen === 'record' && selectedClip?.content) {
  setIsAppendMode(true);
  setCurrentClipId(selectedClip.id);
  setAppendBaseContent(selectedClip.formattedText || selectedClip.content);
  setContentBlocks([{
    id: 'existing-content',
    text: selectedClip.formattedText || selectedClip.content,
    animate: false
  }]);
  log.debug('Recording in append mode', { clipId: selectedClip.id });
  setTimeout(() => startRecording(), 200);
}

// ✅ NEW Case 2.5: Recording from pending clip (no content yet, but has audioId)
else if (activeScreen === 'record' && selectedPendingClip) {
  // Keep currentClipId - we're adding to the SAME clip file
  // This allows multiple pending recordings in one file
  setIsAppendMode(true);  // Treat as append to existing clip
  setCurrentClipId(selectedPendingClip.id);
  setAppendBaseContent('');
  setContentBlocks([]);
  log.debug('Recording from pending clip (adding successive recording)', {
    clipId: selectedPendingClip.id,
    pendingTitle: selectedPendingClip.title
  });
  setTimeout(() => startRecording(), 200);
}

// Case 3: Recording from record screen (no existing content AND no pending clip) → NEW clip
else if (!selectedPendingClip) {  // ← ADDED CONDITION: only create new if no pending clip
  setIsAppendMode(false);
  setCurrentClipId(null);
  setAppendBaseContent('');
  setContentBlocks([]);
  log.debug('Recording new clip (no append)');
  setTimeout(() => startRecording(), 200);
}
```

**Why This Works:**

| Scenario | Before | After |
|----------|--------|-------|
| Record in clip with existing text | Case 2 → Append mode ✅ | Same ✅ |
| Record in NEW clip (no pending) | Case 3 → New clip ✅ | Same ✅ |
| Record in pending clip (no content yet) | Case 3 → NEW clip ❌ | Case 2.5 → Append ✅ |
| Press record again in same pending clip | Case 3 → NEW clip ❌ | Case 2.5 → Append ✅ |

**Critical Fix:** Without Case 2.5, pressing record while viewing a pending clip would trigger Case 3, which sets `currentClipId = null`. This causes the offline handler (line 1074) to create a NEW clip file instead of adding to the existing one.

---

### Step 1.4: Update All References to Clip Operations

**Find and Replace in ClipMasterScreen.tsx:**

| Old Code | New Code | Lines Affected |
|----------|----------|----------------|
| `createClip(...)` | `createNewClip(...)` | 1056, 1276 |
| `updateClip(clipId, ...)` | `updateClipById(clipId, ...)` | Multiple (search all) |
| `deleteClip(clipId)` | `deleteClipById(clipId)` | In delete handler |

**Example (line 1056):**

**BEFORE:**
```typescript
const newClip = createClip('', nextNumber, '');
```

**AFTER:**
```typescript
const newClip = createNewClip('', nextNumber, '');
```

---

### Testing Criteria for Phase 1

| Test | Expected Behavior | Pass/Fail |
|------|------------------|-----------|
| **Home screen displays clips** | Shows all clips from storage | [ ] |
| **Click clip navigates to record screen** | Transitions smoothly | [ ] |
| **Online recording still works** | ⚠️ CRITICAL - Record → Done → Text appears | [ ] |
| **Record offline → creates pending clip** | Shows "Clip 001" in record screen | [ ] |
| **Press record AGAIN in pending clip** | Keeps same clip, doesn't create new file | [ ] |
| **Delete clip** | Removes from list, refreshes | [ ] |
| **Search clips** | Filtering still works | [ ] |

**CRITICAL:** If "Online recording" test fails, STOP and rollback before proceeding.

---

### Rollback Plan for Phase 1

If any test fails:

```bash
# 1. Delete the new hook file
rm hooks/useClipState.ts

# 2. Restore ClipMasterScreen.tsx from git
git checkout ClipMasterScreen.tsx

# 3. Commit rollback
git add .
git commit -m "Rollback Phase 1: useClipState extraction failed - <reason>"
```

---

### Files Modified in Phase 1

| File | Action | Lines Changed |
|------|--------|---------------|
| `hooks/useClipState.ts` | **Created** | +150 |
| `ClipMasterScreen.tsx` | **Modified** | Lines deleted: ~150, Lines added: ~10 |

**Net Result:** ClipMasterScreen reduced from 1589 → ~1450 lines

---

### Commit Message for Phase 1

```
Phase 1: Extract clip state management to useClipState hook

- Created hooks/useClipState.ts (150 lines)
- Centralized clips array and CRUD operations
- Added Case 2.5: recording from pending clip
- Fixes: Can't record successive pending clips in same file

Testing:
- ✅ Online recording still works
- ✅ Offline recording creates pending clip
- ✅ Can record multiple times in same pending clip
- ✅ Delete, search, navigation all working

ClipMasterScreen: 1589 → 1450 lines (-139)
```

---

## 🔧 Phase 2: Extract Pending Clips Queue (2-3 hours)

### Goals

- ✅ Change `selectedPendingClip` (singular) → `selectedPendingClips` (array)
- ✅ Implement per-file clip numbering (not global)
- ✅ Store pending clip title immediately (not calculated on-the-fly)
- ✅ Reduce ClipMasterScreen by ~200 lines

### What Gets Fixed

| Bug | How Phase 2 Fixes It |
|-----|---------------------|
| Second pending clip replaces first | Changes to array state `selectedPendingClips[]` |
| Wrong clip numbering (Clip004 from different file) | Per-file counting, not global |
| Pending clip title shows wrong number initially | Stores title in clip.pendingClipTitle immediately |

---

### Step 2.1: Update Clip Interface (Add pendingClipTitle)

**File:** `services/clipStorage.ts`

**Location:** Inside `Clip` interface (around line 18)

**BEFORE:**
```typescript
export interface Clip {
  id: string;
  title: string;
  content: string;
  rawText: string;
  formattedText: string;
  date: string;
  createdAt: number;
  status?: 'pending' | 'transcribing' | 'failed' | null;
  audioId?: string;
  duration?: string;
  transcriptionError?: string;
}
```

**AFTER:**
```typescript
export interface Clip {
  id: string;
  title: string;
  content: string;
  rawText: string;
  formattedText: string;
  date: string;
  createdAt: number;
  status?: 'pending' | 'transcribing' | 'failed' | null;
  audioId?: string;
  duration?: string;
  transcriptionError?: string;
  pendingClipTitle?: string;  // ✅ NEW: "Clip 001" - stored when clip becomes pending
}
```

**Rationale:**
Instead of calculating pending clip title on-the-fly (which has timing issues with React state updates), we store it immediately when the clip becomes pending. This is the solution from `011_pending_clip_count_based.md`.

---

### Step 2.2: Create `hooks/usePendingClipsQueue.ts`

**New file:** `/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/hooks/usePendingClipsQueue.ts`

```typescript
import { useState, useCallback } from 'react';
import { Clip } from '../services/clipStorage';
import { PendingClip } from '../components/ui/ClipRecordScreen';
import { logger } from '../utils/logger';

const log = logger.scope('usePendingClipsQueue');

interface UsePendingClipsQueueOptions {
  clips: Clip[];
  currentClipId: string | null;
  isActiveRequest: boolean;
}

/**
 * Manages pending clips queue and display
 *
 * Extracted from ClipMasterScreen.tsx to handle:
 * - Multiple pending clips (array instead of singular)
 * - Per-file clip numbering (Clip001, Clip002 in same Recording)
 * - Transformation from Clip to PendingClip for display
 *
 * Key Changes from Original:
 * - selectedPendingClips is now an ARRAY (was singular)
 * - Uses clip.pendingClipTitle if available (stored at creation time)
 * - Falls back to calculation if pendingClipTitle missing (legacy clips)
 */
export function usePendingClipsQueue(options: UsePendingClipsQueueOptions) {
  const { clips, currentClipId, isActiveRequest } = options;

  // CHANGED FROM: selectedPendingClip (singular) in ClipMasterScreen.tsx line 70
  // TO: selectedPendingClips (array)
  const [selectedPendingClips, setSelectedPendingClips] = useState<PendingClip[]>([]);

  /**
   * Transform Clip → PendingClip for display
   *
   * MOVED FROM: ClipMasterScreen.tsx lines 435-450 (clipToPendingClip)
   *
   * Changes:
   * - Uses clip.pendingClipTitle if available (stored value)
   * - Falls back to calculation for legacy clips without stored title
   * - Per-file numbering instead of global counting
   */
  const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
    // If we stored the title when clip became pending, use it
    if (clip.pendingClipTitle) {
      return {
        id: clip.id,
        title: clip.pendingClipTitle,
        time: clip.duration || '0:00',
        status: clip.status === 'transcribing' ? 'transcribing' : 'waiting',
        isActiveRequest: isActiveRequest && currentClipId === clip.id
      };
    }

    // Fallback for legacy clips: calculate per-file numbering
    // Extract recording number from clip title (e.g., "Recording 01" → 1)
    const recordingNumber = extractRecordingNumber(clip.title);

    // Find all pending clips in THIS recording file
    const clipsInSameRecording = clips.filter(c =>
      extractRecordingNumber(c.title) === recordingNumber &&
      (c.status === 'pending' || c.status === 'transcribing')
    );

    // Sort by creation time (oldest first)
    const sortedPendingClips = clipsInSameRecording.sort((a, b) => a.createdAt - b.createdAt);

    // Find position of this clip
    const clipIndex = sortedPendingClips.findIndex(c => c.id === clip.id) + 1;
    const clipNumber = String(clipIndex > 0 ? clipIndex : 1).padStart(3, '0');

    return {
      id: clip.id,
      title: `Clip ${clipNumber}`,
      time: clip.duration || '0:00',
      status: clip.status === 'transcribing' ? 'transcribing' : 'waiting',
      isActiveRequest: isActiveRequest && currentClipId === clip.id
    };
  }, [clips, currentClipId, isActiveRequest]);

  /**
   * Get all pending clips for a specific recording file
   *
   * NEW FUNCTION (not in original ClipMasterScreen)
   *
   * Used when displaying pending clips in ClipRecordScreen.
   * Returns array of PendingClip objects for the given recording.
   */
  const getPendingClipsForRecording = useCallback((recordingId: string): PendingClip[] => {
    const recordingClip = clips.find(c => c.id === recordingId);
    if (!recordingClip) {
      log.warn('Recording clip not found', { recordingId });
      return [];
    }

    // Find all clips in same recording file
    const recordingNumber = extractRecordingNumber(recordingClip.title);
    const clipsInRecording = clips.filter(c =>
      extractRecordingNumber(c.title) === recordingNumber &&
      (c.status === 'pending' || c.status === 'transcribing')
    );

    // Sort by creation time (oldest first = lower Clip number)
    const sorted = clipsInRecording.sort((a, b) => a.createdAt - b.createdAt);

    // Transform to PendingClip array
    return sorted.map(clipToPendingClip);
  }, [clips, clipToPendingClip]);

  return {
    selectedPendingClips,
    setSelectedPendingClips,
    clipToPendingClip,
    getPendingClipsForRecording
  };
}

/**
 * Helper: Extract recording number from title
 *
 * Examples:
 * - "Recording 01" → 1
 * - "Recording 02" → 2
 * - "Some other title" → 0
 */
function extractRecordingNumber(title: string): number {
  const match = title.match(/Recording (\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
```

**Key Architectural Changes:**

1. **Array instead of singular:**
   - Old: `selectedPendingClip: PendingClip | null`
   - New: `selectedPendingClips: PendingClip[]`
   - Allows displaying multiple pending clips in same recording

2. **Stored title:**
   - Old: Calculate on-the-fly using React state (timing issues)
   - New: Use `clip.pendingClipTitle` if available (stored at creation)
   - Fallback: Calculate if missing (backwards compatibility)

3. **Per-file numbering:**
   - Old: Counts ALL pending clips globally
   - New: Counts pending clips only in SAME recording file
   - Uses `extractRecordingNumber()` to group clips by recording

---

### Step 2.3: Update ClipMasterScreen to Use Hook

**File:** `ClipMasterScreen.tsx`

**BEFORE (line 70):**
```typescript
const [selectedPendingClip, setSelectedPendingClip] = useState<PendingClip | null>(null);
```

**AFTER:**
```typescript
// PHASE 2: Extracted to usePendingClipsQueue hook (now array instead of singular)
const {
  selectedPendingClips,  // ARRAY, not singular
  setSelectedPendingClips,
  clipToPendingClip,
  getPendingClipsForRecording
} = usePendingClipsQueue({
  clips,
  currentClipId,
  isActiveRequest
});
```

**BEFORE (lines 435-450 - clipToPendingClip function):**
```typescript
const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
  const allClips = getClips();
  const clipIndex = allClips.filter(c => !c.content).findIndex(c => c.id === clip.id) + 1;
  const clipNumber = String(clipIndex > 0 ? clipIndex : pendingClips.length + 1).padStart(3, '0');

  return {
    id: clip.id,
    title: `Clip ${clipNumber}`,
    time: clip.duration || '0:00',
    status: clip.status === 'transcribing' ? 'transcribing' : 'waiting',
    isActiveRequest: isActiveRequest
  };
}, [isActiveRequest]);
```

**AFTER:**
```typescript
// DELETED - now returned from usePendingClipsQueue hook
```

**ADD IMPORT (top of file):**
```typescript
import { usePendingClipsQueue } from '../hooks/usePendingClipsQueue';
```

---

### Step 2.4: Update All References from Singular to Array

**Critical Change:** Every place that uses `selectedPendingClip` (singular) must now handle `selectedPendingClips` (array).

#### Change 1: Case 2.5 in handleRecordClick

**BEFORE (from Phase 1, line ~305):**
```typescript
else if (activeScreen === 'record' && selectedPendingClip) {
  setCurrentClipId(selectedPendingClip.id);
  // ...
}
```

**AFTER:**
```typescript
// Use first pending clip if array has items
else if (activeScreen === 'record' && selectedPendingClips.length > 0) {
  // When recording from pending clip screen, use the FIRST pending clip as context
  // (In practice, currentClipId should already be set when navigating to pending clip)
  const firstPending = selectedPendingClips[0];
  setCurrentClipId(firstPending.id);
  log.debug('Recording from pending clip (adding successive recording)', {
    clipId: firstPending.id,
    pendingTitle: firstPending.title
  });
  setTimeout(() => startRecording(), 200);
}
```

#### Change 2: Case 3 condition

**BEFORE:**
```typescript
else if (!selectedPendingClip) {
  // ...
}
```

**AFTER:**
```typescript
else if (selectedPendingClips.length === 0) {
  // Only create new clip if NO pending clips
  // ...
}
```

#### Change 3: handleBackClick (clearing pending clips)

**BEFORE (line ~213):**
```typescript
const handleBackClick = () => {
  if (activeScreen === 'record') {
    setActiveScreen('home');
    setSelectedClip(null);
    setSelectedPendingClip(null);  // ← SINGULAR
    setContentBlocks([]);
  }
};
```

**AFTER:**
```typescript
const handleBackClick = () => {
  if (activeScreen === 'record') {
    setActiveScreen('home');
    setSelectedClip(null);
    setSelectedPendingClips([]);  // ← ARRAY
    setContentBlocks([]);
  }
};
```

#### Change 4: handleClipClick (setting pending clips when clicking from home)

**File:** `ClipMasterScreen.tsx`

**BEFORE (lines 187-232 - inside handleClipClick):**
```typescript
const handleClipClick = useCallback((clipId: string) => {
  const clip = clips.find(c => c.id === clipId);

  if (!clip) return;

  if (clip.content) {
    // Clip has content - show it
    setSelectedClip(clip);
    setSelectedPendingClip(null);  // ← SINGULAR
    // ...
  } else {
    // Clip is pending (no content yet)
    const pendingClip = clipToPendingClip(clip);
    setSelectedPendingClip(pendingClip);  // ← SINGULAR
    setSelectedClip(null);
    // ...
  }
}, [clips]);
```

**AFTER:**
```typescript
const handleClipClick = useCallback((clipId: string) => {
  const clip = clips.find(c => c.id === clipId);

  if (!clip) return;

  if (clip.content) {
    // Clip has content - show it
    setSelectedClip(clip);
    setSelectedPendingClips([]);  // ← ARRAY (clear pending clips)
    // ...existing content display logic
  } else {
    // Clip is pending (no content yet)
    // Get ALL pending clips for this recording file
    const allPendingForRecording = getPendingClipsForRecording(clipId);

    setSelectedPendingClips(allPendingForRecording);  // ← ARRAY
    setSelectedClip(null);
    setCurrentClipId(clipId);

    log.debug('Viewing pending clips', {
      clipId,
      pendingCount: allPendingForRecording.length,
      titles: allPendingForRecording.map(pc => pc.title)
    });

    // ...existing navigation logic
  }
}, [clips, clipToPendingClip, getPendingClipsForRecording]);
```

**Key Change:**
Instead of showing ONE pending clip, we now show ALL pending clips in that recording file. This fixes the "second pending clip replaces first" bug.

---

### Step 2.5: Store Pending Clip Title When Creating Pending Clip

**File:** `ClipMasterScreen.tsx`

**Location:** Inside the offline handler useEffect (around line 1277-1305)

**BEFORE (lines 1277-1305):**
```typescript
} else if (transcriptionError === 'offline') {
  log.info('Offline - saving clip as pending');

  const clipIdToUpdate = currentClipId || '';

  if (!clipIdToUpdate) {
    // No current clip - need to create new one
    const allClipsForDebug = getClips();
    const existingPendingCount = allClipsForDebug.filter(c =>
      c.status === 'pending' || c.status === 'transcribing'
    ).length;
    const newClipName = `Clip ${String(existingPendingCount + 1).padStart(3, '0')}`;  // ← WRONG: Global count

    const newClip = createClip('', newClipName, '');
    // ...
  }

  updateClip(clipIdToUpdate, {
    audioId: audioId,
    duration: formatDuration(duration),
    status: 'pending'
    // ← MISSING: pendingClipTitle
  });
}
```

**AFTER (with per-file counting and stored title):**
```typescript
} else if (transcriptionError === 'offline') {
  log.info('Offline - saving clip as pending');

  const clipIdToUpdate = currentClipId || '';

  if (!clipIdToUpdate) {
    // No current clip - need to create new clip file
    const nextRecordingNumber = getNextRecordingNumber(getClips());
    const newClip = createNewClip('', nextRecordingNumber, '');

    // Store pending clip title immediately
    updateClipById(newClip.id, {
      audioId: audioId,
      duration: formatDuration(duration),
      status: 'pending',
      pendingClipTitle: 'Clip 001'  // ✅ First clip in new recording
    });

    // Update UI
    const pendingClip = clipToPendingClip(newClip);
    setSelectedPendingClips([pendingClip]);  // ← ARRAY
    setCurrentClipId(newClip.id);
  } else {
    // Updating existing clip - calculate per-file clip number
    const currentClip = clips.find(c => c.id === clipIdToUpdate);
    if (!currentClip) {
      log.error('Current clip not found', { clipIdToUpdate });
      return;
    }

    // Count pending clips in THIS recording file only
    const recordingNumber = extractRecordingNumber(currentClip.title);
    const pendingInThisRecording = clips.filter(c =>
      extractRecordingNumber(c.title) === recordingNumber &&
      (c.status === 'pending' || c.status === 'transcribing')
    ).length;

    const nextClipNumber = pendingInThisRecording + 1;
    const pendingClipTitle = `Clip ${String(nextClipNumber).padStart(3, '0')}`;

    // Update clip with audioId AND stored title
    updateClipById(clipIdToUpdate, {
      audioId: audioId,
      duration: formatDuration(duration),
      status: 'pending',
      pendingClipTitle: pendingClipTitle  // ✅ STORE IT
    });

    log.info('Pending clip created with stored title', {
      clipId: clipIdToUpdate,
      title: pendingClipTitle,
      recordingNumber,
      pendingCount: pendingInThisRecording
    });

    // Update UI to show all pending clips in this recording
    refreshClips();
    const allPendingForRecording = getPendingClipsForRecording(clipIdToUpdate);
    setSelectedPendingClips(allPendingForRecording);  // ← ARRAY
  }

  setShowAudioToast(true);
  setRecordNavState('record');
}

// Helper function (add near other helpers)
function extractRecordingNumber(title: string): number {
  const match = title.match(/Recording (\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
```

**What Changed:**

1. **Per-file counting:**
   - Old: Counts ALL pending clips globally
   - New: Counts only pending clips in SAME recording

2. **Stored title:**
   - Old: No title stored, calculated on-the-fly
   - New: `pendingClipTitle` stored in clip immediately

3. **Array update:**
   - Old: `setSelectedPendingClip(single)`
   - New: `setSelectedPendingClips(array)`

---

### Step 2.6: Update ClipRecordScreen Props

**File:** `ClipMasterScreen.tsx`

**Location:** Where ClipRecordScreen is rendered (around line 1367-1374)

**BEFORE:**
```typescript
<ClipRecordScreen
  state={recordNavState === 'complete' ? 'transcribed' : hasContentOrPending ? 'offline' : 'transcribed'}
  contentBlocks={contentBlocks}
  pendingClips={selectedPendingClip ? [selectedPendingClip] : []}  // ← Wraps singular in array
  onBackClick={handleBackClick}
  onNewClipClick={() => {}}
  onTranscribeClick={handleSmartRetry}
/>
```

**AFTER:**
```typescript
<ClipRecordScreen
  state={recordNavState === 'complete' ? 'transcribed' : hasContentOrPending ? 'offline' : 'transcribed'}
  contentBlocks={contentBlocks}
  pendingClips={selectedPendingClips}  // ← Already an array, no wrapping needed
  onBackClick={handleBackClick}
  onNewClipClick={() => {}}
  onTranscribeClick={handleSmartRetry}
/>
```

---

### Testing Criteria for Phase 2

| Test | Expected Behavior | Pass/Fail |
|------|------------------|-----------|
| **Record offline (first clip)** | Shows "Clip 001" | [ ] |
| **Record AGAIN offline (second clip)** | Shows "Clip 001" AND "Clip 002" (both visible) | [ ] |
| **Navigate away and back** | Still shows both clips with same numbers | [ ] |
| **Clip numbering is per-file** | Recording01 has Clip001-002, Recording02 has separate Clip001 | [ ] |
| **Online recording still works** | ⚠️ CRITICAL | [ ] |
| **Phase 1 tests still pass** | No regressions | [ ] |

**CRITICAL:** If second pending clip doesn't show (still replaces first), check:
1. Is `selectedPendingClips` an array?
2. Is `getPendingClipsForRecording()` returning multiple items?
3. Are both clips in the `clips` state array?

---

### Rollback Plan for Phase 2

```bash
# 1. Delete the new hook file
rm hooks/usePendingClipsQueue.ts

# 2. Revert Clip interface change
git checkout services/clipStorage.ts

# 3. Revert ClipMasterScreen changes
git checkout ClipMasterScreen.tsx

# 4. Restore Phase 1 state
git reset --hard <Phase1-commit-hash>

# 5. Commit rollback
git commit -m "Rollback Phase 2: usePendingClipsQueue extraction failed - <reason>"
```

---

### Files Modified in Phase 2

| File | Action | Lines Changed |
|------|--------|---------------|
| `hooks/usePendingClipsQueue.ts` | **Created** | +220 |
| `services/clipStorage.ts` | **Modified** | +1 (pendingClipTitle field) |
| `ClipMasterScreen.tsx` | **Modified** | Lines deleted: ~200, Lines added: ~20 |

**Net Result:** ClipMasterScreen reduced from ~1450 → ~1270 lines

---

### Commit Message for Phase 2

```
Phase 2: Extract pending clips queue to usePendingClipsQueue hook

- Created hooks/usePendingClipsQueue.ts (220 lines)
- Changed selectedPendingClip (singular) → selectedPendingClips (array)
- Implemented per-file clip numbering (not global)
- Added clip.pendingClipTitle field (stored at creation time)

Fixes:
- ✅ Second pending clip no longer replaces first (now array)
- ✅ Clip numbering is per-file (Clip001 in each recording)
- ✅ Numbering is stable (doesn't change after navigation)

Testing:
- ✅ Can record TWO pending clips offline, both visible
- ✅ Numbering correct per recording file
- ✅ Online recording still works
- ✅ No regressions from Phase 1

ClipMasterScreen: 1450 → 1270 lines (-180)
```

---

## 🔧 Phase 3: Extract Transcription Orchestrator (3-4 hours)

### Goals

- ✅ Unified handler for ALL transcription completions (Option D architecture)
- ✅ Handles both active recordings AND background retries
- ✅ No coupling to `recordNavState` (reads as context, not gate)
- ✅ **Fix:** Background transcription updates UI
- ✅ **Fix:** Correct clip matching (no mixing)
- ✅ Reduce ClipMasterScreen by ~250 lines

### What Gets Fixed

| Bug | How Phase 3 Fixes It |
|-----|---------------------|
| Background transcription doesn't update UI | Unified handler catches background completions |
| Transcription applied to wrong clip | Uses audioId matching instead of findFirst |
| Option D bugs (incomplete implementation) | Proper unified handler with context detection |

---

### Architectural Principle: Option D

**From `006_phase1_test_results_and_architecture_analysis.md`:**

> **"Transcription completion is a DATA EVENT, not a UI STATE."**

**Key Insight:**
- Bad: Using `recordNavState === 'processing'` as a **gate** (controls whether to handle)
- Good: Using `recordNavState === 'processing'` as **context** (informs how to handle)

**Result:**
- Background transcriptions work independently of UI state
- No coupling between business logic and navigation state
- Single code path for ALL transcriptions

---

### Step 3.1: Create `hooks/useTranscriptionOrchestrator.ts`

**New file:** `/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/hooks/useTranscriptionOrchestrator.ts`

```typescript
import { useEffect, useCallback, useRef } from 'react';
import { Clip } from '../services/clipStorage';
import { PendingClip } from '../components/ui/ClipRecordScreen';
import { logger } from '../utils/logger';

const log = logger.scope('useTranscriptionOrchestrator');

type RecordNavState = 'record' | 'recording' | 'processing' | 'complete';

interface ContentBlock {
  id: string;
  text: string;
  animate: boolean;
}

interface UseTranscriptionOrchestratorOptions {
  // Transcription state from useClipRecording hook
  transcription: string;
  isTranscribing: boolean;
  isFormatting: boolean;

  // Recording session context
  recordNavState: RecordNavState;
  currentClipId: string | null;
  isAppendMode: boolean;
  appendBaseContent: string;

  // Clip management
  clips: Clip[];
  selectedClip: Clip | null;
  selectedPendingClips: PendingClip[];

  // State setters
  setSelectedClip: (clip: Clip | null) => void;
  setSelectedPendingClips: (clips: PendingClip[]) => void;
  setRecordNavState: (state: RecordNavState) => void;
  setContentBlocks: (blocks: ContentBlock[]) => void;

  // Clip operations
  updateClipById: (id: string, updates: Partial<Clip>) => Clip | undefined;
  refreshClips: () => void;

  // Recording hook control
  resetRecording: () => void;  // From useClipRecording (clears audio/transcription)

  // Other dependencies
  setShowCopyToast: (show: boolean) => void;
  setIsFormatting: (formatting: boolean) => void;
}

/**
 * Orchestrates transcription completion for ALL paths
 *
 * Implements Option D architecture:
 * - Unified handler for active recordings AND background retries
 * - No coupling to recordNavState (reads as context, not gate)
 * - Single code path ensures consistency
 *
 * MOVED FROM: ClipMasterScreen.tsx lines 977-1037 (main useEffect)
 *             ClipMasterScreen.tsx lines 1040-1090 (background handler)
 *             ClipMasterScreen.tsx lines 727-900 (formatTranscriptionInBackground)
 */
export function useTranscriptionOrchestrator(options: UseTranscriptionOrchestratorOptions) {
  const {
    transcription,
    isTranscribing,
    isFormatting,
    recordNavState,
    currentClipId,
    isAppendMode,
    appendBaseContent,
    clips,
    selectedClip,
    selectedPendingClips,
    setSelectedClip,
    setSelectedPendingClips,
    setRecordNavState,
    setContentBlocks,
    updateClipById,
    refreshClips,
    resetRecording,
    setShowCopyToast,
    setIsFormatting
  } = options;

  // Stable ref for async operations
  const isFormattingRef = useRef(false);

  /**
   * Format transcription using AI
   *
   * MOVED FROM: ClipMasterScreen.tsx lines 727-900 (formatTranscriptionInBackground)
   *
   * Calls OpenAI to format transcription, updates clip, and handles UI updates.
   */
  const formatTranscription = useCallback(async (
    rawText: string,
    clipId: string,
    shouldAppend: boolean,
    shouldAnimate: boolean
  ): Promise<void> => {
    if (isFormattingRef.current) {
      log.warn('Formatting already in progress, skipping');
      return;
    }

    isFormattingRef.current = true;
    setIsFormatting(true);

    try {
      log.info('Starting transcription formatting', {
        clipId,
        textLength: rawText.length,
        shouldAppend,
        shouldAnimate
      });

      const clip = clips.find(c => c.id === clipId);
      if (!clip) {
        log.error('Clip not found for formatting', { clipId });
        return;
      }

      // Prepare context for AI formatting
      const existingFormattedContext = shouldAppend ? (clip.formattedText || clip.content) : '';

      // Call AI formatting API
      const response = await fetch('/api/clipperstream/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          context: existingFormattedContext,
          isAppending: shouldAppend
        })
      });

      if (!response.ok) {
        throw new Error(`Formatting API error: ${response.status}`);
      }

      const { formattedText } = await response.json();
      log.debug('AI formatting successful', { length: formattedText.length });

      // Combine content based on append mode
      let finalRawText: string;
      let finalFormattedText: string;

      if (shouldAppend && clip.content) {
        // Append mode: combine old + new
        finalRawText = clip.rawText + '\n\n' + rawText;
        finalFormattedText = clip.formattedText + '\n\n' + formattedText;
      } else {
        // New recording mode
        finalRawText = rawText;
        finalFormattedText = formattedText;
      }

      // Update clip in storage
      updateClipById(clipId, {
        content: finalFormattedText,
        rawText: finalRawText,
        formattedText: finalFormattedText,
        status: null,  // Clear pending/transcribing status
        audioId: undefined,  // Clear audioId after successful transcription
        transcriptionError: undefined  // Clear any previous errors
      });

      // Update content blocks for display
      setContentBlocks([{
        id: `transcription-${clipId}-${Date.now()}`,
        text: finalFormattedText,
        animate: shouldAnimate
      }]);

      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(finalFormattedText);
        setShowCopyToast(true);
        log.debug('Text copied to clipboard');
      } catch (error) {
        log.warn('Failed to copy to clipboard', { error });
      }

      // Generate AI title if new clip (not appending)
      if (!shouldAppend) {
        generateTitleInBackground(finalFormattedText, clipId);
      }

      refreshClips();

    } catch (error) {
      log.error('Formatting failed', { clipId, error });
      // TODO: Handle formatting errors
    } finally {
      isFormattingRef.current = false;
      setIsFormatting(false);
    }
  }, [clips, updateClipById, setContentBlocks, setShowCopyToast, setIsFormatting, refreshClips]);

  /**
   * Generate AI title for clip
   *
   * MOVED FROM: ClipMasterScreen.tsx (scattered across multiple locations)
   */
  const generateTitleInBackground = useCallback(async (content: string, clipId: string) => {
    try {
      log.debug('Generating AI title', { clipId, contentLength: content.length });

      const response = await fetch('/api/clipperstream/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error(`Title generation API error: ${response.status}`);
      }

      const { title } = await response.json();
      log.info('AI title generated', { clipId, title });

      updateClipById(clipId, { title });
      refreshClips();
    } catch (error) {
      log.error('Title generation failed', { clipId, error });
      // Fail silently - keep "Recording XX" title
    }
  }, [updateClipById, refreshClips]);

  /**
   * UNIFIED transcription completion handler (Option D)
   *
   * Handles BOTH:
   * - Active recordings (user just pressed Done)
   * - Background retries (coming back online)
   *
   * Key Principle: recordNavState is READ as context, NOT used as gate
   *
   * REPLACES:
   * - ClipMasterScreen.tsx lines 977-1037 (main transcription useEffect)
   * - ClipMasterScreen.tsx lines 1040-1090 (background handler useEffect)
   */
  useEffect(() => {
    // Only trigger when we have transcription and nothing is in progress
    if (!transcription || isTranscribing || isFormatting) return;

    // Determine context: Is this an active recording or background retry?
    const isActiveRecording = recordNavState === 'processing';

    log.debug('Transcription completion detected', {
      isActiveRecording,
      transcriptionLength: transcription.length
    });

    // Find target clip based on context
    let targetClip: Clip | undefined;

    if (isActiveRecording) {
      // Active recording: use currentClipId (set when user pressed Done)
      targetClip = clips.find(c => c.id === currentClipId);

      if (!targetClip) {
        log.warn('Active recording transcription completed but clip not found', {
          currentClipId,
          availableClips: clips.length
        });
        return;
      }

      log.info('Active recording transcription completed', {
        clipId: targetClip.id,
        title: targetClip.title
      });
    } else {
      // Background retry: find transcribing pending clip
      // Use audioId to match (more reliable than just status)
      targetClip = clips.find(c =>
        c.status === 'transcribing' &&
        c.audioId &&
        !c.content  // Must be pending (no content yet)
      );

      if (!targetClip) {
        log.warn('Background transcription completed but no matching pending clip found', {
          transcribingClips: clips.filter(c => c.status === 'transcribing').length,
          clipsWithAudio: clips.filter(c => c.audioId).length
        });
        return;
      }

      log.info('Background transcription completed', {
        clipId: targetClip.id,
        title: targetClip.title,
        audioId: targetClip.audioId
      });
    }

    // Determine formatting parameters
    const shouldAppend = isActiveRecording ? isAppendMode : !!targetClip.content;
    const shouldAnimate = isActiveRecording;  // Only animate for active recordings

    log.debug('Formatting parameters determined', {
      clipId: targetClip.id,
      shouldAppend,
      shouldAnimate,
      isActiveRecording
    });

    // Run async formatting
    (async () => {
      try {
        // Format transcription (calls AI, updates clip, updates UI)
        await formatTranscription(
          transcription,
          targetClip!.id,
          shouldAppend,
          shouldAnimate
        );

        // Update UI based on context
        if (isActiveRecording) {
          // Active recording: transition nav state to complete
          log.debug('Active recording complete - transitioning to complete state');
          setRecordNavState('complete');
        } else {
          // Background retry: update pending clips display if viewing
          const wasPendingVisible = selectedPendingClips.some(pc => pc.id === targetClip!.id);

          if (wasPendingVisible) {
            log.debug('Background retry complete - updating UI', {
              clipId: targetClip!.id,
              wasPendingVisible
            });

            // Remove from pending clips array
            setSelectedPendingClips(
              selectedPendingClips.filter(pc => pc.id !== targetClip!.id)
            );

            // Get updated clip and display transcribed content
            const updatedClip = clips.find(c => c.id === targetClip!.id);
            if (updatedClip && updatedClip.content) {
              setSelectedClip(updatedClip);
              log.debug('Showing transcribed content', {
                clipId: updatedClip.id,
                contentLength: updatedClip.content.length
              });
            }
          } else {
            log.debug('Background retry complete but clip not currently visible');
          }
        }

        // Clear recording hook state
        resetRecording();

      } catch (error) {
        log.error('Transcription handling failed', {
          clipId: targetClip!.id,
          error
        });
      }
    })();
  }, [
    transcription,
    isTranscribing,
    isFormatting,
    clips,
    currentClipId,
    isAppendMode,
    selectedPendingClips,
    formatTranscription,
    setRecordNavState,
    setSelectedPendingClips,
    setSelectedClip,
    resetRecording
  ]);
  // NOTE: recordNavState NOT in dependency array - we only READ it for context

  return {
    formatTranscription,
    generateTitleInBackground
  };
}
```

**Architectural Highlights:**

1. **Unified Handler:**
   - Single useEffect handles ALL transcriptions
   - No separate paths for online vs background

2. **Context Detection:**
   - Reads `recordNavState === 'processing'` to determine path
   - NOT used as a gate (doesn't block background retries)

3. **Clip Matching:**
   - Active: Uses `currentClipId` (explicit)
   - Background: Finds by `status === 'transcribing' && audioId && !content`
   - No arbitrary "first match"

4. **UI Updates:**
   - Active: Transitions `recordNavState`
   - Background: Updates `selectedPendingClips` array

---

### Step 3.2: Update ClipMasterScreen to Use Hook

**File:** `ClipMasterScreen.tsx`

**ADD IMPORT:**
```typescript
import { useTranscriptionOrchestrator } from '../hooks/useTranscriptionOrchestrator';
```

**ADD HOOK CALL (after other hooks):**
```typescript
// PHASE 3: Extracted transcription orchestration
const { formatTranscription, generateTitleInBackground } = useTranscriptionOrchestrator({
  // Transcription state
  transcription,
  isTranscribing,
  isFormatting,

  // Recording session
  recordNavState,
  currentClipId,
  isAppendMode,
  appendBaseContent,

  // Clip management
  clips,
  selectedClip,
  selectedPendingClips,

  // State setters
  setSelectedClip,
  setSelectedPendingClips,
  setRecordNavState,
  setContentBlocks,

  // Clip operations
  updateClipById,
  refreshClips,

  // Recording control
  resetRecording,

  // Other
  setShowCopyToast,
  setIsFormatting
});
```

**DELETE (lines 977-1037 - main transcription useEffect):**
```typescript
// Main transcription useEffect - ENTIRE BLOCK DELETED
useEffect(() => {
  if (transcription && recordNavState === 'processing' && !isFormatting) {
    // ...entire implementation
  }
}, [transcription, recordNavState, ...]);
```

**DELETE (lines 1040-1090 - background handler useEffect):**
```typescript
// Background transcription handler - ENTIRE BLOCK DELETED
useEffect(() => {
  if (transcription && !isTranscribing && !isFormatting && recordNavState !== 'processing') {
    // ...entire implementation
  }
}, [transcription, isTranscribing, ...]);
```

**DELETE (lines 727-900 - formatTranscriptionInBackground function):**
```typescript
// formatTranscriptionInBackground - ENTIRE FUNCTION DELETED
const formatTranscriptionInBackground = useCallback(async (...) => {
  // ...entire implementation
}, [...]);
```

---

### Step 3.3: Update `handleOnline` to Stay Simple

**File:** `ClipMasterScreen.tsx`

**Location:** `handleOnline` function (around lines 440-529)

**Current Code (KEEP AS-IS):**
```typescript
const handleOnline = useCallback(async () => {
  if (isRecording) return;

  const allClips = getClips();
  const pendingClips = allClips.filter(c =>
    c.audioId && (c.status === 'pending' || c.status === 'failed')
  );

  log.info('Found pending clips for auto-retry', { count: pendingClips.length });

  for (const clip of pendingClips) {
    // Update status to transcribing
    updateClipById(clip.id, {
      status: 'transcribing',
      transcriptionError: undefined
    });
    refreshClips();

    // Retrieve audio from IndexedDB
    const audioBlob = await getAudio(clip.audioId!);
    if (!audioBlob) {
      log.error('Failed to retrieve audio for retry', { clipId: clip.id });
      continue;
    }

    log.debug('Auto-retrying transcription', {
      clipId: clip.id,
      audioSize: audioBlob.size
    });

    // Call transcription (unified handler will catch completion)
    await transcribeRecording(audioBlob);
  }
}, [isRecording, updateClipById, refreshClips, transcribeRecording]);
```

**NO CHANGES NEEDED**

**Why:** `handleOnline` just triggers transcription. The unified handler in `useTranscriptionOrchestrator` automatically catches the completion and updates UI.

---

### Testing Criteria for Phase 3

| Test | Expected Behavior | Pass/Fail |
|------|------------------|-----------|
| **⚠️ CRITICAL: Online recording still works** | Record → Done → Text appears with animation → Title changes | [ ] |
| **Record offline → go online** | Text appears automatically when online | [ ] |
| **Background transcription updates UI** | If viewing pending clip, see text appear | [ ] |
| **Multiple pending clips transcribe** | Both clips get correct transcription (no mixing) | [ ] |
| **Can navigate during background retry** | No UI freeze or weird behavior | [ ] |
| **Phases 1-2 tests still pass** | No regressions | [ ] |

**CRITICAL BLOCKER:** If online recording breaks, STOP IMMEDIATELY and rollback.

---

### Debugging Guide for Phase 3

If background transcription doesn't show:

```typescript
// Add debug logs to useTranscriptionOrchestrator:

useEffect(() => {
  console.log('🔍 Transcription effect triggered', {
    hasTranscription: !!transcription,
    isTranscribing,
    isFormatting,
    recordNavState
  });

  if (!transcription || isTranscribing || isFormatting) {
    console.log('⏸️ Skipping - conditions not met');
    return;
  }

  const isActiveRecording = recordNavState === 'processing';
  console.log('🎯 Context detected', { isActiveRecording });

  // ... rest of handler
}, [transcription, isTranscribing, isFormatting]);
```

Expected console output for background retry:
```
🔍 Transcription effect triggered { hasTranscription: true, isTranscribing: false, isFormatting: false, recordNavState: 'record' }
🎯 Context detected { isActiveRecording: false }
Background transcription completed { clipId: '...', title: 'Recording 01', audioId: '...' }
Formatting parameters determined { clipId: '...', shouldAppend: false, shouldAnimate: false, isActiveRecording: false }
AI formatting successful { length: 145 }
Background retry complete - updating UI { clipId: '...', wasPendingVisible: true }
```

---

### Rollback Plan for Phase 3

```bash
# 1. Delete the new hook file
rm hooks/useTranscriptionOrchestrator.ts

# 2. Restore ClipMasterScreen from Phase 2 state
git checkout <Phase2-commit-hash> -- ClipMasterScreen.tsx

# 3. Verify online recording works
# (Test immediately before committing rollback)

# 4. Commit rollback
git commit -m "Rollback Phase 3: useTranscriptionOrchestrator extraction failed - <reason>"
```

---

### Files Modified in Phase 3

| File | Action | Lines Changed |
|------|--------|---------------|
| `hooks/useTranscriptionOrchestrator.ts` | **Created** | +280 |
| `ClipMasterScreen.tsx` | **Modified** | Lines deleted: ~250, Lines added: ~30 |

**Net Result:** ClipMasterScreen reduced from ~1270 → ~1050 lines

---

### Commit Message for Phase 3

```
Phase 3: Extract transcription orchestrator (Option D architecture)

- Created hooks/useTranscriptionOrchestrator.ts (280 lines)
- Unified handler for ALL transcription completions
- No coupling to recordNavState (reads as context, not gate)
- Moved formatTranscription and generateTitle logic

Fixes:
- ✅ Background transcription now updates UI correctly
- ✅ Correct clip matching (no arbitrary first match)
- ✅ Option D architecture properly implemented
- ✅ Active and background paths unified

Testing:
- ✅ Online recording still works (CRITICAL)
- ✅ Record offline → go online → text appears
- ✅ Multiple pending clips get correct transcriptions
- ✅ No regressions from Phases 1-2

ClipMasterScreen: 1270 → 1050 lines (-220)
```

---

## 🔧 Phase 4: Extract Recording Session State (1-2 hours)

### Goals

- ✅ Final cleanup: extract remaining session state
- ✅ Reduce ClipMasterScreen to <300 lines (coordinator only)
- ✅ Clear separation: recording context vs UI navigation

### Step 4.1: Create `hooks/useRecordingSession.ts`

**New file:** `/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/hooks/useRecordingSession.ts`

```typescript
import { useState, useCallback } from 'react';

export type RecordNavState = 'record' | 'recording' | 'processing' | 'complete';

export interface ContentBlock {
  id: string;
  text: string;
  animate: boolean;
}

/**
 * Manages recording session state
 *
 * Extracted from ClipMasterScreen.tsx to separate recording context
 * from screen navigation and clip management.
 *
 * This hook tracks:
 * - Which clip we're recording into (currentClipId)
 * - Recording mode (new vs append)
 * - Navigation state (record/recording/processing/complete)
 * - Content display (contentBlocks)
 */
export function useRecordingSession() {
  // Which clip are we recording into?
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);

  // Are we appending to existing content?
  const [isAppendMode, setIsAppendMode] = useState(false);

  // Navigation state (controls RecordBar buttons)
  const [recordNavState, setRecordNavState] = useState<RecordNavState>('record');

  // Content blocks for display (transcribed text)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Base content when appending (existing text)
  const [appendBaseContent, setAppendBaseContent] = useState('');

  /**
   * Reset all session state
   *
   * Called when:
   * - Starting a completely new recording
   * - Navigating away from record screen
   * - After transcription completes
   */
  const resetSession = useCallback(() => {
    setCurrentClipId(null);
    setIsAppendMode(false);
    setRecordNavState('record');
    setContentBlocks([]);
    setAppendBaseContent('');
  }, []);

  return {
    currentClipId,
    setCurrentClipId,
    isAppendMode,
    setIsAppendMode,
    recordNavState,
    setRecordNavState,
    contentBlocks,
    setContentBlocks,
    appendBaseContent,
    setAppendBaseContent,
    resetSession
  };
}
```

---

### Step 4.2: Update ClipMasterScreen to Use Hook

**File:** `ClipMasterScreen.tsx`

**BEFORE (scattered state declarations):**
```typescript
const [currentClipId, setCurrentClipId] = useState<string | null>(null);
const [isAppendMode, setIsAppendMode] = useState(false);
const [recordNavState, setRecordNavState] = useState<RecordNavState>('record');
const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
const [appendBaseContent, setAppendBaseContent] = useState('');
```

**AFTER:**
```typescript
// PHASE 4: Extracted to useRecordingSession hook
const {
  currentClipId,
  setCurrentClipId,
  isAppendMode,
  setIsAppendMode,
  recordNavState,
  setRecordNavState,
  contentBlocks,
  setContentBlocks,
  appendBaseContent,
  setAppendBaseContent,
  resetSession
} = useRecordingSession();
```

**ADD IMPORT:**
```typescript
import { useRecordingSession } from '../hooks/useRecordingSession';
```

---

### Step 4.3: Final ClipMasterScreen Structure

After Phase 4, ClipMasterScreen should look like this:

```typescript
export const ClipMasterScreen: React.FC = () => {
  // ============================================
  // HOOKS (Phase 1-4)
  // ============================================

  // Phase 1: Clip state management
  const {
    clips,
    selectedClip,
    setSelectedClip,
    refreshClips,
    createNewClip,
    updateClipById,
    deleteClipById
  } = useClipState();

  // Phase 4: Recording session state
  const {
    currentClipId,
    setCurrentClipId,
    isAppendMode,
    setIsAppendMode,
    recordNavState,
    setRecordNavState,
    contentBlocks,
    setContentBlocks,
    appendBaseContent,
    setAppendBaseContent,
    resetSession
  } = useRecordingSession();

  // Existing: Recording hook (no changes)
  const {
    isRecording,
    audioBlob,
    audioId,
    duration,
    error,
    audioAnalyser,
    isTranscribing,
    transcription,
    transcriptionError,
    isActiveRequest,
    startRecording,
    stopRecording,
    transcribeRecording,
    forceRetry,
    reset: resetRecording
  } = useClipRecording();

  // Phase 2: Pending clips queue
  const {
    selectedPendingClips,
    setSelectedPendingClips,
    clipToPendingClip,
    getPendingClipsForRecording
  } = usePendingClipsQueue({
    clips,
    currentClipId,
    isActiveRequest
  });

  // Phase 3: Transcription orchestrator
  const { formatTranscription, generateTitleInBackground } = useTranscriptionOrchestrator({
    transcription,
    isTranscribing,
    isFormatting,
    recordNavState,
    currentClipId,
    isAppendMode,
    appendBaseContent,
    clips,
    selectedClip,
    selectedPendingClips,
    setSelectedClip,
    setSelectedPendingClips,
    setRecordNavState,
    setContentBlocks,
    updateClipById,
    refreshClips,
    resetRecording,
    setShowCopyToast,
    setIsFormatting
  });

  // ============================================
  // SCREEN STATE (UI only - not extracted)
  // ============================================

  const [activeScreen, setActiveScreen] = useState<'home' | 'record' | 'search'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showAudioToast, setShowAudioToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  // ============================================
  // EVENT HANDLERS (screen navigation)
  // ============================================

  const handleRecordClick = async () => { ... };
  const handleDoneClick = async () => { ... };
  const handleBackClick = () => { ... };
  const handleClipClick = useCallback((clipId: string) => { ... }, [clips]);
  const handleOnline = useCallback(async () => { ... }, [isRecording]);
  const handleSmartRetry = useCallback((clipId: string) => { ... }, [clips]);
  // ... other handlers

  // ============================================
  // EFFECTS (network listeners, nav state sync)
  // ============================================

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { ... };
  }, [handleOnline]);

  // ... other effects

  // ============================================
  // RENDER (screen selection and props passing)
  // ============================================

  return (
    <div className="clip-master-screen">
      {activeScreen === 'home' && <ClipHomeScreen ... />}
      {activeScreen === 'record' && <ClipRecordScreen ... />}
      {activeScreen === 'search' && <ClipSearchScreen ... />}

      {/* Toasts */}
      {showCopyToast && <CopyToast ... />}
      {showAudioToast && <AudioToast ... />}
      {showErrorToast && <ErrorToast ... />}
    </div>
  );
};
```

**Final Line Count:** ~250-300 lines

---

### Testing Criteria for Phase 4

| Test | Expected Behavior | Pass/Fail |
|------|------------------|-----------|
| **All Phase 1-3 tests still pass** | No regressions | [ ] |
| **Online recording** | Still works perfectly | [ ] |
| **Screen navigation** | Home ↔ Record ↔ Search smooth | [ ] |
| **ClipMasterScreen < 300 lines** | Verify with `wc -l` | [ ] |

---

### Rollback Plan for Phase 4

```bash
# 1. Delete the new hook file
rm hooks/useRecordingSession.ts

# 2. Restore ClipMasterScreen from Phase 3
git checkout <Phase3-commit-hash> -- ClipMasterScreen.tsx

# 3. Commit rollback
git commit -m "Rollback Phase 4: useRecordingSession extraction failed"
```

---

### Files Modified in Phase 4

| File | Action | Lines Changed |
|------|--------|---------------|
| `hooks/useRecordingSession.ts` | **Created** | +120 |
| `ClipMasterScreen.tsx` | **Modified** | Lines deleted: ~100, Lines added: ~20 |

**Net Result:** ClipMasterScreen reduced from ~1050 → ~270 lines

---

### Commit Message for Phase 4

```
Phase 4: Extract recording session state to useRecordingSession hook

- Created hooks/useRecordingSession.ts (120 lines)
- Centralized currentClipId, isAppendMode, recordNavState, contentBlocks
- Final cleanup of ClipMasterScreen

Result:
- ✅ ClipMasterScreen now <300 lines (coordinator only)
- ✅ Clear separation of concerns
- ✅ All tests passing
- ✅ No regressions

ClipMasterScreen: 1050 → 270 lines (-780)
Total reduction: 1589 → 270 lines (-1319, 83% reduction)
```

---

## 📊 Final Summary

### Before Refactor
```
ClipMasterScreen.tsx
├── 1589 lines (unmaintainable monolith)
├── 24+ useState variables
├── 7 useEffect hooks with complex dependencies
├── Offline bugs everywhere
└── Impossible to debug
```

### After Refactor
```
ClipMasterScreen.tsx (270 lines)
├── Screen navigation only
├── Props passing to components
└── Hook coordination

+ hooks/useClipState.ts (150 lines)
+ hooks/usePendingClipsQueue.ts (220 lines)
+ hooks/useTranscriptionOrchestrator.ts (280 lines)
+ hooks/useRecordingSession.ts (120 lines)

Total: 1040 lines across 5 focused files
```

### Bugs Fixed

✅ Multiple pending clips display (Phase 2)
✅ Per-file clip numbering (Phase 2)
✅ Background transcription updates UI (Phase 3)
✅ Can record successive pending clips (Phase 1)
✅ Correct clip matching (Phase 3)
✅ Clean architecture (All phases)

### Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| ClipMasterScreen lines | 1589 | 270 | -83% |
| Total lines | 1589 | 1040 (5 files) | Better organization |
| useState per file | 24+ | 4-6 average | Manageable |
| useEffect per file | 7 complex | 1-2 focused | Debuggable |
| Bugs fixed | 5 major | 0 | ✅ |

---

## 🎯 Implementation Checklist

### Phase 1 (2-3 hours)
- [ ] Create `hooks/useClipState.ts`
- [ ] Update ClipMasterScreen to use hook
- [ ] Add Case 2.5 for pending clips
- [ ] Run all Phase 1 tests
- [ ] Commit: "Phase 1: Extract clip state"

### Phase 2 (2-3 hours)
- [ ] Add `pendingClipTitle` to Clip interface
- [ ] Create `hooks/usePendingClipsQueue.ts`
- [ ] Update ClipMasterScreen (singular → array)
- [ ] Fix all references to selectedPendingClip
- [ ] Update offline handler to store title
- [ ] Run all Phase 2 tests
- [ ] Commit: "Phase 2: Extract pending clips queue"

### Phase 3 (3-4 hours)
- [ ] Create `hooks/useTranscriptionOrchestrator.ts`
- [ ] Update ClipMasterScreen to use hook
- [ ] Delete old transcription useEffects
- [ ] **CRITICAL:** Test online recording first
- [ ] Test background transcription
- [ ] Run all Phase 3 tests
- [ ] Commit: "Phase 3: Extract transcription orchestrator"

### Phase 4 (1-2 hours)
- [ ] Create `hooks/useRecordingSession.ts`
- [ ] Update ClipMasterScreen to use hook
- [ ] Verify ClipMasterScreen < 300 lines
- [ ] Run all Phase 4 tests
- [ ] Commit: "Phase 4: Extract recording session state"

### Final Verification
- [ ] All online recording tests pass
- [ ] All offline recording tests pass
- [ ] Screen navigation works
- [ ] Delete, rename, search work
- [ ] No console errors
- [ ] `wc -l ClipMasterScreen.tsx` shows <300

---

**END OF BLUEPRINT v2**
