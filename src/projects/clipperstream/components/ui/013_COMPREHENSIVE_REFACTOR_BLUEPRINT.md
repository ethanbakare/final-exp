# 013: ClipMasterScreen Comprehensive Refactor Blueprint

**Date:** December 27, 2025
**Current State:** 1589 lines, 24+ states, spaghetti architecture
**Target State:** <300 lines coordinator + 4 specialized hooks
**Estimated Time:** 8-12 hours over 4 phases
**Risk Level:** Medium (phased approach with testing)

---

## 🎯 Executive Summary

### The Problem

ClipMasterScreen has become an unmaintainable monolith. While **online recording works perfectly**, offline functionality is broken due to:

1. **State explosion**: 24+ useState variables tangled together
2. **Fragmented logic**: Offline/online paths don't coordinate
3. **No separation**: UI state mixed with business logic
4. **Bug breeding ground**: Fixing one thing breaks two others

### The Solution

**Extract specialized hooks while preserving all working functionality:**

- ✅ **Keeps**: Screen navigation, UI transitions, all animations
- ✅ **Keeps**: Delete, rename, search, scroll - all working features
- ✅ **Fixes**: All offline bugs as side effect of clean architecture
- ✅ **Result**: Maintainable, debuggable, scalable codebase

---

## 📊 What Currently Works (DO NOT BREAK)

| Feature | Status | Location |
|---------|--------|----------|
| **Online Recording** | ✅ Perfect | Keep intact |
| **UI Animations** | ✅ Perfect | Text fade-in, slide animations |
| **Screen Transitions** | ✅ Perfect | Home ↔ Record ↔ Search |
| **Clip CRUD** | ✅ Perfect | Create, delete, rename, search |
| **Scroll Behavior** | ✅ Perfect | List scrolling, search |
| **Components** | ✅ Perfect | ClipButtons, ClipList, ClipOffline, ClipRecordScreen |
| **Showcase Files** | ✅ Perfect | Demo files showing expected behavior |

**CRITICAL:** We refactor AROUND these working parts without touching them.

---

## 🐛 What's Broken (Will Fix During Refactor)

| Bug | Root Cause | Fixes in Phase |
|-----|------------|----------------|
| Second pending clip replaces first | Singular state `selectedPendingClip` | Phase 2 |
| Wrong clip numbering | Global counter instead of per-file | Phase 2 |
| Background transcription clash | Shared hook state | Phase 3 |
| UI doesn't update after offline→online | No handler for background completion | Phase 3 |
| Can't record multiple pending clips | Wrong case in `handleRecordClick` | Phase 1 |

---

## 🏗️ Target Architecture

```
ClipMasterScreen.tsx (250 lines)
├── Screen navigation (home/record/search)
├── Passes props to child components
└── Coordinates hooks (doesn't implement logic)

hooks/
├── useClipState.ts (150 lines)
│   ├── clips array management
│   ├── CRUD operations (create, update, delete)
│   └── Clip selection (selectedClip, selectedPendingClips[])
│
├── usePendingClipsQueue.ts (200 lines)
│   ├── Multiple pending clips as array
│   ├── Per-file clip numbering
│   ├── Queue for sequential background transcription
│   └── Display transformation (Clip → PendingClip)
│
├── useTranscriptionOrchestrator.ts (250 lines)
│   ├── Unified transcription completion handler (Option D)
│   ├── Handles BOTH active + background paths
│   ├── Coordinates formatting → title gen → UI update
│   └── No coupling to recordNavState
│
└── useRecordingSession.ts (100 lines)
    ├── Recording context (currentClipId, isAppendMode)
    ├── Content blocks for display
    └── Navigation state (recordNavState)
```

---

## 📋 Phase-by-Phase Implementation

---

## **Phase 1: Extract Clip State Management** (2-3 hours)

### What This Fixes
- ✅ Foundation for all other phases
- ✅ Fixes: Can't record multiple pending clips (Case 2.5 missing)

### Files to Create

**`hooks/useClipState.ts`** (~150 lines)

### What to Extract from ClipMasterScreen

| What | Current Lines | Move To |
|------|---------------|---------|
| `clips` state | 58-59 | useClipState |
| `selectedClip` state | 60 | useClipState |
| `refreshClips()` | 414-416 | useClipState |
| `handleClipClick()` | 187-232 | useClipState (business logic only) |
| Clip CRUD helpers | Various | useClipState |

### Implementation Steps

#### Step 1.1: Create `useClipState.ts`

```typescript
// hooks/useClipState.ts

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

export function useClipState() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  // Initialize clips on mount
  useEffect(() => {
    const initialClips = getClips();
    setClips(initialClips);
    log.debug('Clips initialized', { count: initialClips.length });
  }, []);

  // Refresh clips from storage
  const refreshClips = useCallback(() => {
    const updatedClips = getClips();
    setClips(updatedClips);
  }, []);

  // Create a new clip
  const createNewClip = useCallback((content: string, title: string, formattedText: string) => {
    const newClip = createClip(content, title, formattedText);
    refreshClips();
    return newClip;
  }, [refreshClips]);

  // Update a clip
  const updateClipById = useCallback((clipId: string, updates: Partial<Clip>) => {
    const updated = updateClip(clipId, updates);
    refreshClips();
    return updated;
  }, [refreshClips]);

  // Delete a clip
  const deleteClipById = useCallback((clipId: string) => {
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

#### Step 1.2: Update ClipMasterScreen to Use Hook

```typescript
// ClipMasterScreen.tsx

import { useClipState } from '../hooks/useClipState';

export const ClipMasterScreen: React.FC = () => {
  // REPLACE lines 58-60 with:
  const {
    clips,
    selectedClip,
    setSelectedClip,
    refreshClips,
    createNewClip,
    updateClipById,
    deleteClipById
  } = useClipState();

  // DELETE lines 414-416 (refreshClips implementation)
  // DELETE line 341-348 (clips initialization useEffect)

  // ... rest of component
}
```

#### Step 1.3: Fix Case 2.5 (Multiple Pending Clips)

```typescript
// ClipMasterScreen.tsx - in handleRecordClick (around line 290)

// Case 2: Recording from existing clip with content → APPEND mode
else if (activeScreen === 'record' && selectedClip?.content) {
  setIsAppendMode(true);
  setCurrentClipId(selectedClip.id);
  // ... existing logic
}

// ✅ NEW Case 2.5: Recording from pending clip (no content yet)
else if (activeScreen === 'record' && selectedPendingClip) {
  // Keep currentClipId - we're adding to existing clip file
  setIsAppendMode(true);
  setCurrentClipId(selectedPendingClip.id);
  log.debug('Recording from pending clip', { clipId: selectedPendingClip.id });
  setTimeout(() => startRecording(), 200);
}

// Case 3: Recording from record screen (no existing content AND no pending clip) → NEW clip
else if (!selectedPendingClip) {
  // ... existing logic
}
```

### Testing Criteria for Phase 1

- [ ] Home screen still displays clips
- [ ] Clicking clip still navigates to record screen
- [ ] Can record offline → creates pending clip
- [ ] **NEW:** Can press record again while viewing pending clip
- [ ] No regressions in online recording

### Rollback Plan

If anything breaks:
1. Revert `useClipState.ts` creation
2. Restore original ClipMasterScreen lines 58-60, 341-348, 414-416
3. Commit message: "Revert Phase 1: useClipState extraction"

---

## **Phase 2: Extract Pending Clips Queue** (2-3 hours)

### What This Fixes
- ✅ Multiple pending clips display (currently only shows one)
- ✅ Per-file clip numbering (currently global)
- ✅ Pending clip title calculation timing issues

### Files to Create

**`hooks/usePendingClipsQueue.ts`** (~200 lines)

### What to Extract from ClipMasterScreen

| What | Current Lines | Move To |
|------|---------------|---------|
| `selectedPendingClip` → `selectedPendingClips[]` | 70 | usePendingClipsQueue |
| `clipToPendingClip()` | 435-450 | usePendingClipsQueue |
| Pending clip creation logic | 1277-1305 | usePendingClipsQueue |
| `handleClipClick` pending logic | 188-192 | usePendingClipsQueue |

### Implementation Steps

#### Step 2.1: Create `usePendingClipsQueue.ts`

```typescript
// hooks/usePendingClipsQueue.ts

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

export function usePendingClipsQueue(options: UsePendingClipsQueueOptions) {
  const { clips, currentClipId, isActiveRequest } = options;

  // CHANGE: Array instead of singular
  const [selectedPendingClips, setSelectedPendingClips] = useState<PendingClip[]>([]);

  // Transform Clip → PendingClip for display
  const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
    // Per-file numbering: count pending clips in THIS recording only
    const recordingClips = clips.filter(c =>
      // Clips belong to same recording if they share the file title pattern
      c.title.startsWith('Recording') &&
      extractRecordingNumber(c.title) === extractRecordingNumber(clip.title)
    );

    const pendingInThisRecording = recordingClips.filter(c =>
      c.status === 'pending' || c.status === 'transcribing'
    );

    const clipIndex = pendingInThisRecording.findIndex(c => c.id === clip.id) + 1;
    const clipNumber = String(clipIndex > 0 ? clipIndex : 1).padStart(3, '0');

    return {
      id: clip.id,
      title: `Clip ${clipNumber}`,
      time: clip.duration || '0:00',
      status: clip.status === 'transcribing' ? 'transcribing' : 'waiting',
      isActiveRequest: isActiveRequest && currentClipId === clip.id
    };
  }, [clips, currentClipId, isActiveRequest]);

  // Get all pending clips for current recording
  const getPendingClipsForRecording = useCallback((recordingId: string) => {
    const recordingClip = clips.find(c => c.id === recordingId);
    if (!recordingClip) return [];

    // Find all clips in same recording file
    const recordingNumber = extractRecordingNumber(recordingClip.title);
    const clipsInRecording = clips.filter(c =>
      extractRecordingNumber(c.title) === recordingNumber &&
      (c.status === 'pending' || c.status === 'transcribing')
    );

    return clipsInRecording.map(clipToPendingClip);
  }, [clips, clipToPendingClip]);

  return {
    selectedPendingClips,
    setSelectedPendingClips,
    clipToPendingClip,
    getPendingClipsForRecording
  };
}

// Helper: Extract recording number from title
function extractRecordingNumber(title: string): number {
  const match = title.match(/Recording (\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
```

#### Step 2.2: Update ClipMasterScreen

```typescript
// ClipMasterScreen.tsx

import { usePendingClipsQueue } from '../hooks/usePendingClipsQueue';

export const ClipMasterScreen: React.FC = () => {
  const { clips, selectedClip, ... } = useClipState();

  const {
    selectedPendingClips,  // NOW AN ARRAY
    setSelectedPendingClips,
    clipToPendingClip,
    getPendingClipsForRecording
  } = usePendingClipsQueue({
    clips,
    currentClipId,
    isActiveRequest
  });

  // DELETE lines 435-450 (clipToPendingClip implementation)
  // DELETE line 70 (selectedPendingClip state)

  // UPDATE ClipRecordScreen calls to use array:
  <ClipRecordScreen
    pendingClips={selectedPendingClips}  // Now receives array
    ...
  />
}
```

#### Step 2.3: Fix Pending Clip Creation (Store Title Immediately)

```typescript
// In offline handler (around line 1277), UPDATE to store pendingClipTitle:

const pendingClipTitle = `Clip ${String(pendingClipsCount + 1).padStart(3, '0')}`;

updateClipById(clipIdToUpdate, {
  audioId: audioId,
  duration: formatDuration(duration),
  status: 'pending',
  pendingClipTitle: pendingClipTitle  // ✅ STORE IT
});
```

#### Step 2.4: Update Clip Interface (add pendingClipTitle field)

```typescript
// services/clipStorage.ts - in Clip interface (around line 18)

export interface Clip {
  // ... existing fields
  pendingClipTitle?: string;  // "Clip 001" - only set when pending
}
```

### Testing Criteria for Phase 2

- [ ] Can record TWO pending clips offline in same file
- [ ] Both pending clips display (not just one)
- [ ] Clip numbering is per-file (Clip001, Clip002 in same recording)
- [ ] Numbering is stable (doesn't change after navigation)
- [ ] No regressions from Phase 1

### Rollback Plan

If breaks:
1. Revert `usePendingClipsQueue.ts`
2. Restore `selectedPendingClip` singular state
3. Restore `clipToPendingClip` in ClipMasterScreen

---

## **Phase 3: Extract Transcription Orchestrator** (3-4 hours)

### What This Fixes
- ✅ Background transcription doesn't update UI
- ✅ Transcription completion coordination
- ✅ Option D bugs (unified handler)
- ✅ Clip matching issues (wrong clip gets transcription)

### Files to Create

**`hooks/useTranscriptionOrchestrator.ts`** (~250 lines)

### What to Extract from ClipMasterScreen

| What | Current Lines | Move To |
|------|---------------|---------|
| Main transcription useEffect | 977-1037 | useTranscriptionOrchestrator |
| Background handler (Phase 3) | 1040-1090 | useTranscriptionOrchestrator |
| `formatTranscriptionInBackground()` | 727-900 | useTranscriptionOrchestrator |
| `generateTitleInBackground()` | Varies | useTranscriptionOrchestrator |

### Implementation Steps

#### Step 3.1: Create `useTranscriptionOrchestrator.ts`

```typescript
// hooks/useTranscriptionOrchestrator.ts

import { useEffect, useCallback } from 'react';
import { Clip } from '../services/clipStorage';
import { logger } from '../utils/logger';

const log = logger.scope('useTranscriptionOrchestrator');

interface UseTranscriptionOrchestratorOptions {
  transcription: string;
  isTranscribing: boolean;
  isFormatting: boolean;
  recordNavState: 'record' | 'recording' | 'processing' | 'complete';
  clips: Clip[];
  currentClipId: string | null;
  selectedPendingClips: any[];
  updateClipById: (id: string, updates: Partial<Clip>) => Clip | undefined;
  setSelectedClip: (clip: Clip | null) => void;
  setSelectedPendingClips: (clips: any[]) => void;
  setRecordNavState: (state: any) => void;
  setContentBlocks: (blocks: any[]) => void;
  resetRecording: () => void;
}

export function useTranscriptionOrchestrator(options: UseTranscriptionOrchestratorOptions) {
  const {
    transcription,
    isTranscribing,
    isFormatting,
    recordNavState,
    clips,
    currentClipId,
    selectedPendingClips,
    updateClipById,
    setSelectedClip,
    setSelectedPendingClips,
    setRecordNavState,
    setContentBlocks,
    resetRecording
  } = options;

  // Format transcription using AI
  const formatTranscription = useCallback(async (
    text: string,
    clipId: string,
    isAppending: boolean,
    shouldAnimate: boolean
  ) => {
    log.info('Formatting transcription', { clipId, isAppending, length: text.length });

    // Call AI formatting API
    // Update clip with formatted text
    // Update content blocks
    // Handle title generation if new clip

    // ... implementation moved from ClipMasterScreen
  }, [updateClipById, setContentBlocks]);

  // UNIFIED transcription completion handler (Option D)
  useEffect(() => {
    // Trigger on ANY transcription completion
    if (!transcription || isTranscribing || isFormatting) return;

    // Determine context: Active recording or background retry?
    const isActiveRecording = recordNavState === 'processing';

    // Find target clip
    let targetClip: Clip | undefined;
    if (isActiveRecording) {
      // Active recording: use currentClipId
      targetClip = clips.find(c => c.id === currentClipId);
      log.debug('Active recording transcription completed', { clipId: currentClipId });
    } else {
      // Background retry: find transcribing pending clip
      targetClip = clips.find(c =>
        c.status === 'transcribing' &&
        c.audioId &&
        !c.content
      );
      log.debug('Background transcription completed', {
        clipId: targetClip?.id,
        foundPendingClip: !!targetClip
      });
    }

    if (!targetClip) {
      log.warn('Transcription completed but no target clip found');
      return;
    }

    // Determine formatting parameters
    const isAppending = !!targetClip.content;
    const shouldAnimate = isActiveRecording; // || isFirstPendingTranscription

    // Run async formatting
    (async () => {
      try {
        await formatTranscription(
          transcription,
          targetClip.id,
          isAppending,
          shouldAnimate
        );

        // Update UI based on context
        if (isActiveRecording) {
          // Active recording: transition nav state
          log.debug('Active recording complete');
          setRecordNavState('complete');
        } else {
          // Background retry: update pending clips display
          if (selectedPendingClips.some(pc => pc.id === targetClip.id)) {
            log.debug('Clearing pending clip, showing transcribed content');

            // Remove from pending clips array
            setSelectedPendingClips(
              selectedPendingClips.filter(pc => pc.id !== targetClip.id)
            );

            // Get updated clip and display
            const updatedClip = clips.find(c => c.id === targetClip.id);
            if (updatedClip) {
              setSelectedClip(updatedClip);
            }
          }
        }

        // Clear hook state
        resetRecording();
      } catch (error) {
        log.error('Transcription handling failed', { clipId: targetClip.id, error });
      }
    })();
  }, [
    transcription,
    isTranscribing,
    isFormatting,
    clips,
    currentClipId,
    selectedPendingClips,
    formatTranscription,
    resetRecording
  ]);
  // NOTE: recordNavState NOT in dependencies - we only READ it for context

  return {
    formatTranscription
  };
}
```

#### Step 3.2: Update ClipMasterScreen

```typescript
// ClipMasterScreen.tsx

import { useTranscriptionOrchestrator } from '../hooks/useTranscriptionOrchestrator';

export const ClipMasterScreen: React.FC = () => {
  // ... existing hooks

  const { formatTranscription } = useTranscriptionOrchestrator({
    transcription,
    isTranscribing,
    isFormatting,
    recordNavState,
    clips,
    currentClipId,
    selectedPendingClips,
    updateClipById,
    setSelectedClip,
    setSelectedPendingClips,
    setRecordNavState,
    setContentBlocks,
    resetRecording
  });

  // DELETE lines 977-1037 (main transcription useEffect)
  // DELETE lines 1040-1090 (background handler)
  // DELETE lines 727-900 (formatTranscriptionInBackground)
}
```

### Testing Criteria for Phase 3

- [ ] **Critical:** Online recording still works
- [ ] Record offline → go online → transcription shows
- [ ] Background transcription updates UI correctly
- [ ] Multiple pending clips transcribe sequentially
- [ ] Correct clip gets the transcription (no mixing)
- [ ] No regressions from Phases 1-2

### Rollback Plan

If breaks:
1. Revert `useTranscriptionOrchestrator.ts`
2. Restore transcription useEffects in ClipMasterScreen
3. Test online recording immediately

---

## **Phase 4: Extract Recording Session State** (1-2 hours)

### What This Fixes
- ✅ Further reduces ClipMasterScreen complexity
- ✅ Cleanly separates recording context from UI

### Files to Create

**`hooks/useRecordingSession.ts`** (~100 lines)

### What to Extract from ClipMasterScreen

| What | Current Lines | Move To |
|------|---------------|---------|
| `currentClipId` state | Varies | useRecordingSession |
| `isAppendMode` state | Varies | useRecordingSession |
| `contentBlocks` state | Varies | useRecordingSession |
| `recordNavState` state | Varies | useRecordingSession |
| `appendBaseContent` state | Varies | useRecordingSession |

### Implementation Steps

#### Step 4.1: Create `useRecordingSession.ts`

```typescript
// hooks/useRecordingSession.ts

import { useState, useCallback } from 'react';

type RecordNavState = 'record' | 'recording' | 'processing' | 'complete';

interface ContentBlock {
  id: string;
  text: string;
  animate: boolean;
}

export function useRecordingSession() {
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);
  const [isAppendMode, setIsAppendMode] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [recordNavState, setRecordNavState] = useState<RecordNavState>('record');
  const [appendBaseContent, setAppendBaseContent] = useState('');

  const resetSession = useCallback(() => {
    setCurrentClipId(null);
    setIsAppendMode(false);
    setContentBlocks([]);
    setRecordNavState('record');
    setAppendBaseContent('');
  }, []);

  return {
    currentClipId,
    setCurrentClipId,
    isAppendMode,
    setIsAppendMode,
    contentBlocks,
    setContentBlocks,
    recordNavState,
    setRecordNavState,
    appendBaseContent,
    setAppendBaseContent,
    resetSession
  };
}
```

#### Step 4.2: Update ClipMasterScreen

```typescript
// ClipMasterScreen.tsx

import { useRecordingSession } from '../hooks/useRecordingSession';

export const ClipMasterScreen: React.FC = () => {
  const {
    currentClipId,
    setCurrentClipId,
    isAppendMode,
    setIsAppendMode,
    contentBlocks,
    setContentBlocks,
    recordNavState,
    setRecordNavState,
    appendBaseContent,
    setAppendBaseContent,
    resetSession
  } = useRecordingSession();

  // DELETE individual state declarations for these variables
}
```

### Testing Criteria for Phase 4

- [ ] All recording flows still work
- [ ] Navigation between screens still works
- [ ] No regressions whatsoever

---

## 🎯 Final Result After All Phases

### Before
```
ClipMasterScreen.tsx
├── 1589 lines
├── 24+ useState
├── 7+ useEffect with complex dependencies
├── Impossible to debug
└── Bugs multiply when fixing issues
```

### After
```
ClipMasterScreen.tsx (250 lines)
├── Screen navigation only
├── Props passing to children
└── Hook coordination

hooks/
├── useClipState.ts (150 lines)
├── usePendingClipsQueue.ts (200 lines)
├── useTranscriptionOrchestrator.ts (250 lines)
└── useRecordingSession.ts (100 lines)

Total: 950 lines across 5 files (cleaner than 1589 in one file)
```

### Bugs Fixed

✅ Multiple pending clips display
✅ Per-file clip numbering
✅ Background transcription updates UI
✅ Can record successive pending clips
✅ Correct clip matching
✅ Clean separation of concerns

---

## 🚨 CRITICAL RULES

### DO NOT BREAK

1. **Online recording** - Test after EVERY phase
2. **UI animations** - Text fade-in, slide animations
3. **Screen transitions** - Home ↔ Record ↔ Search
4. **Clip CRUD** - Delete, rename, search
5. **All visual components** - ClipButtons, ClipList, etc.

### Testing After Each Phase

```bash
# Test online recording (CRITICAL)
1. Record while online
2. Press Done
3. Verify text appears with animation
4. Verify title changes to AI-generated

# Test navigation
1. Home → Record → Home
2. Search → Select → Record
3. All transitions smooth

# Test CRUD
1. Delete clip
2. Rename clip
3. Search clips
4. All work perfectly
```

---

## 📦 Delivery Checklist

### After Phase 1
- [ ] `useClipState.ts` created
- [ ] ClipMasterScreen uses hook
- [ ] Online recording still works
- [ ] Case 2.5 added and tested
- [ ] Commit: "Phase 1: Extract clip state management"

### After Phase 2
- [ ] `usePendingClipsQueue.ts` created
- [ ] Multiple pending clips display
- [ ] Per-file numbering works
- [ ] Online recording still works
- [ ] Commit: "Phase 2: Extract pending clips queue"

### After Phase 3
- [ ] `useTranscriptionOrchestrator.ts` created
- [ ] Background transcription updates UI
- [ ] **CRITICAL:** Online recording still works
- [ ] Commit: "Phase 3: Extract transcription orchestrator"

### After Phase 4
- [ ] `useRecordingSession.ts` created
- [ ] ClipMasterScreen < 300 lines
- [ ] Everything still works
- [ ] Commit: "Phase 4: Extract recording session state"

---

## 🎬 Implementation Order

```
Week 1, Day 1: Phase 1 (2-3 hours)
├── Morning: Create useClipState.ts
├── Afternoon: Update ClipMasterScreen, add Case 2.5
└── Evening: Test thoroughly

Week 1, Day 2: Phase 2 (2-3 hours)
├── Morning: Create usePendingClipsQueue.ts
├── Afternoon: Update ClipMasterScreen
└── Evening: Test multiple pending clips

Week 1, Day 3: Phase 3 (3-4 hours)
├── Morning: Create useTranscriptionOrchestrator.ts
├── Afternoon: Update ClipMasterScreen
└── Evening: Test EVERYTHING (most critical phase)

Week 1, Day 4: Phase 4 (1-2 hours)
├── Morning: Create useRecordingSession.ts
├── Afternoon: Final cleanup, documentation
└── Evening: Celebrate clean architecture! 🎉
```

---

## 📞 Support

If stuck at any phase:
1. Check Testing Criteria for that phase
2. Use Rollback Plan if needed
3. Don't proceed to next phase if current phase has issues
4. Each phase should be fully working before moving on

---

**End of Blueprint**
