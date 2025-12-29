# 030 - CLEAN SLATE REWRITE ARCHITECTURE
## Zustand-First State Management for Clipperstream

**Date**: December 29, 2025
**Status**: Architecture Design - Ready for Implementation
**Approach**: Ground-up rebuild of state management layer
**Keep**: All UI components, API routes, storage utilities
**Rewrite**: State management (Zustand store + hooks)

---

## EXECUTIVE SUMMARY

We're doing a **targeted rewrite** of the state management layer only. UI stays intact.

**Why**:
- Current approach has accumulated 11+ fixes with emergent issues
- Each fix adds complexity, breaks something else
- We now know EXACTLY what we need - can build it right from the start

**Scope**: ~1000 lines of state management code
**Time**: 10 hours (2 design + 6 implementation + 2 testing)
**Risk**: Low - we keep UI, only rebuild data flow

**Goal**: Make this flow work perfectly:
1. Record offline → pending clip created
2. Go online → auto-transcribes → text replaces pending clip
3. Parent gets AI-generated title (not "Recording 01")
4. Status indicators work (waiting → transcribing → formatting → done)
5. No flickering, no disappearing clips, no global state issues

---

## PART 1: ALL SCENARIOS (Complete Map)

### Scenario 1: Online → Online (Normal Recording)

**Flow**:
```
User clicks Record → Recording starts → Audio blob captured
→ User clicks Done → Transcription API call (DeepGram)
→ Raw text received → Animate in on screen
→ Formatting API call starts (background)
→ Formatted text received → Replace raw text
→ Title generation API call (background)
→ AI title received → Replace "Recording 01"
→ Audio blob deleted from IndexedDB
→ Status: null (done)
```

**States**:
- Recording: `isRecording: true`
- After Done: `status: 'transcribing'`
- Raw text ready: `status: 'formatting'`
- Formatted ready: `status: null` (done)

**What user sees**:
- Raw text animates in (typing effect)
- Formatted text replaces it smoothly
- Title updates from "Recording 01" to AI title
- Copy button auto-triggers (copies formatted text)

---

### Scenario 2: Online → Online (Appending)

**Flow**:
```
User has existing clip "Mary's Unusual Tale"
→ User clicks Record (while viewing that clip)
→ Recording starts → Audio captured
→ User clicks Done → Transcription API
→ Raw text received → APPEND to existing raw text
→ Formatting API (with context: existing formatted text)
→ Formatted text received → APPEND to existing formatted
→ Audio blob deleted
→ Status: null
```

**Key difference**:
- Formatting API receives `existingFormattedContext` parameter
- AI knows to append, not replace

---

### Scenario 3: Online → Bad Network (3 Retries)

**Flow**:
```
User clicks Done → Transcription API call
→ Fails (network timeout)
→ Retry #1 (automatic) → Fails
→ Retry #2 (automatic) → Fails
→ Retry #3 (automatic) → Fails
→ Save audio to IndexedDB as pending
→ Start interval retry (every 5 seconds while online)
→ Status: 'pending-retry'
→ Eventually succeeds → Normal flow
```

**States**:
- `status: 'transcribing'` (during retries)
- `status: 'pending-retry'` (after 3 failures, in interval loop)
- `audioId: 'audio-123'` (saved in IndexedDB)

**What user sees**:
- "Attempt 1 of 3", "Attempt 2 of 3", "Attempt 3 of 3"
- After 3 failures: "Between attempts... (5s)"
- Keeps retrying until succeeds

---

### Scenario 4: Online → Offline (Before Done)

**Flow**:
```
User clicks Record → Recording starts
→ Network goes offline (during recording)
→ User clicks Done → Detect offline
→ Save audio to IndexedDB
→ Create pending clip
→ Status: 'pending-child'
→ (Same as Scenario 6)
```

---

### Scenario 5: Offline → Online (Before Done)

**Flow**:
```
User offline → Clicks Record → Recording starts
→ Network comes back online (during recording)
→ User clicks Done → Detect online
→ Transcription API call (normal online flow)
→ (Same as Scenario 1 - no pending clip created)
```

**Key**: Check network status at Done button press, not at start.

---

### Scenario 6: Offline → Offline (Pending Clip Creation)

**Flow**:
```
User offline → Clicks Record → Recording starts
→ User clicks Done → Still offline
→ Save audio to IndexedDB (audioId: 'audio-123')
→ Create PARENT clip ("Recording 01") if none exists
→ Create CHILD clip ("Clip 001") with audioId
→ Status: 'pending-child'
→ Show in pending clips list
```

**Parent-child structure**:
```typescript
Parent: {
  id: 'parent-123',
  title: 'Recording 01',  // Placeholder until children transcribe
  status: null,
  rawText: '',
  formattedText: '',
  parentId: undefined  // This IS the parent
}

Child: {
  id: 'child-456',
  pendingClipTitle: 'Clip 001',
  audioId: 'audio-789',
  duration: '0:08',
  status: 'pending-child',
  rawText: '',
  formattedText: '',
  parentId: 'parent-123'
}
```

**Multiple recordings offline**:
- First recording: Creates parent "Recording 01" + child "Clip 001"
- Second recording: Creates child "Clip 002" (same parent)
- Third recording: Creates child "Clip 003" (same parent)
- User creates new file: Creates parent "Recording 02" + child "Clip 001"

---

### Scenario 7: Offline → Finish → Online (Auto-retry)

**Flow**:
```
User has pending clips (from Scenario 6)
→ User goes online
→ Auto-retry triggers
→ For each pending child (sequential processing):
  1. Get audio from IndexedDB
  2. Transcription API → Get raw text
  3. Store rawText in clip
  4. Update status: 'formatting'
  5. Formatting API → Get formatted text
  6. Store formattedText in clip
  7. Update status: null
  8. Delete audio from IndexedDB
→ After ALL children complete:
  1. useParentTitleGenerator hook detects completion
  2. Uses firstChild.rawText to generate parent title
  3. Parent title updated from "Recording 01" to AI title
```

**Sequential processing** (critical):
- Process one clip at a time (not concurrent)
- Clip 001 fully completes → Then Clip 002 starts
- Prevents race conditions with global state

**What user sees**:
- Pending clips list initially shows "Clip 001", "Clip 002", "Clip 003"
- Each clip shows spinner during transcription
- Each clip shows checkmark when done
- Parent title updates after all complete

---

### Scenario 8: Offline Appending (Pending to Existing)

**Flow**:
```
User has existing clip "Mary's Tale" (with formatted text)
→ User goes offline
→ User clicks Record (while viewing that clip)
→ User clicks Done → Still offline
→ Audio saved to IndexedDB
→ Create child clip with:
  - parentId: 'mary-tale-id'
  - status: 'pending-child'
  - audioId: 'audio-123'
→ When online:
  - Transcription API (raw text)
  - Formatting API with context: Mary's existing formatted text
  - APPEND to existing clip
```

---

## PART 2: ZUSTAND STORE DESIGN (Clean Architecture)

### 2.1 Storage Strategy & Migration

**Decision**: Use **sessionStorage** (web) for consistency with current implementation.

**Why sessionStorage:**
- ✅ Data cleared when tab closes (prevents accumulation)
- ✅ Matches current behavior (less migration risk)
- ✅ User expects fresh start per session
- ❌ Data lost on refresh (acceptable for voice notes)

**Alternative (localStorage)**: Would persist forever but requires quota management strategy.

**SSR Safety Implementation**:

```typescript
// clipStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// SSR-safe storage adapter
const getStorage = () => {
  if (typeof window === 'undefined') {
    // Server-side: no-op storage
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  // Client-side: use sessionStorage
  return sessionStorage;
};

export const useClipStore = create<ClipStore>()(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'clipstream-storage',
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({ clips: state.clips })
    }
  )
);
```

**Migration Strategy (Old Data → New Format)**:

Old clips may exist in different formats. Handle migration gracefully:

```typescript
// Migration helper (run once on app mount)
const migrateOldClipsIfNeeded = () => {
  try {
    // Check for old format clips (pre-030)
    const oldClipsKey = 'clipstream_clips'; // Legacy key
    const oldData = sessionStorage.getItem(oldClipsKey);

    if (oldData) {
      const oldClips = JSON.parse(oldData);

      // Transform to new format
      const migratedClips = oldClips.map((oldClip: any) => ({
        // Identity
        id: oldClip.id || `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: oldClip.createdAt || Date.now(),

        // Parent-child
        parentId: oldClip.parentId,

        // Display
        title: oldClip.title || 'Untitled',
        date: oldClip.date || new Date().toLocaleDateString(),

        // Content (migrate from single 'content' field)
        rawText: oldClip.rawText || oldClip.content || '',
        formattedText: oldClip.formattedText || oldClip.content || '',
        content: oldClip.content || '',

        // Status (default to complete)
        status: oldClip.status !== undefined ? oldClip.status : null,

        // Pending fields
        pendingClipTitle: oldClip.pendingClipTitle,
        audioId: oldClip.audioId,
        duration: oldClip.duration,

        // Errors
        transcriptionError: oldClip.transcriptionError,

        // View
        currentView: oldClip.currentView || 'formatted',
      }));

      // Save to new format
      const newStore = {
        state: { clips: migratedClips },
        version: 0
      };

      sessionStorage.setItem('clipstream-storage', JSON.stringify(newStore));

      // Remove old key
      sessionStorage.removeItem(oldClipsKey);

      console.log('[Migration] Successfully migrated', migratedClips.length, 'clips');
    }
  } catch (error) {
    console.error('[Migration] Failed to migrate old clips:', error);
    // Don't throw - gracefully continue with empty state
  }
};

// Run migration in _app.tsx or ClipMasterScreen mount
useEffect(() => {
  migrateOldClipsIfNeeded();
}, []);
```

**Data Validation After Migration**:

```typescript
const validateClipData = (clip: Clip): boolean => {
  if (!clip.id || !clip.createdAt) return false;
  if (!clip.title || !clip.date) return false;
  return true;
};

// In store initialization
const validClips = loadedClips.filter(validateClipData);
if (validClips.length < loadedClips.length) {
  console.warn('[Store] Filtered out', loadedClips.length - validClips.length, 'invalid clips');
}
```

---

### Core Principle

**Zustand is the SINGLE SOURCE OF TRUTH**. No global React state for data.

```typescript
// ✅ CORRECT
const clips = useClipStore(state => state.clips);
const clip = clips.find(c => c.id === id);
console.log(clip.rawText);  // Read from Zustand

// ❌ WRONG (don't do this anymore)
const [transcription, setTranscription] = useState('');  // Global state - NO!
```

---

### Clip Interface

```typescript
interface Clip {
  // Identity
  id: string;  // 'clip-1767021108321-6348ncvko0d'
  createdAt: number;  // Timestamp for sorting

  // Parent-child relationship
  parentId?: string;  // If child, points to parent

  // Display
  title: string;  // "Recording 01" or "Mary's Tale" (AI-generated)
  date: string;  // "Dec 29, 2025"

  // Content (per-clip data - NOT global)
  rawText: string;  // Raw transcription from DeepGram
  formattedText: string;  // Formatted text from AI
  content: string;  // Legacy field (keep for backwards compat)

  // Status (per-clip state machine)
  status: ClipStatus;

  // Pending clip fields (for offline recordings)
  pendingClipTitle?: string;  // "Clip 001", "Clip 002", etc.
  audioId?: string;  // Link to IndexedDB audio blob
  duration?: string;  // "0:08"

  // Errors
  transcriptionError?: string;

  // Retry tracking (for UI)
  nextRetryTime?: number;  // Unix timestamp for countdown timer
  retryCount?: number;     // Current attempt number for retry interval calculation

  // View preferences (per-clip)
  currentView: 'raw' | 'formatted';
}

type ClipStatus =
  | null  // Done (completed)
  | 'transcribing'  // HTTP call in progress
  | 'formatting'  // Formatting API in progress
  | 'pending-child'  // Offline recording waiting to transcribe
  | 'pending-retry'  // Online but retrying after failures
  | 'failed';  // Permanent failure (after retries exhausted)
```

---

### Store Structure

```typescript
interface ClipStore {
  // DATA (persisted to sessionStorage)
  clips: Clip[];

  // VIEW STATE (not persisted - ephemeral)
  selectedClip: Clip | null;  // Which clip is user viewing?

  // ACTIONS (methods to mutate state)
  addClip: (clip: Clip) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  deleteClip: (id: string) => void;
  setSelectedClip: (clip: Clip | null) => void;

  // QUERIES (derived state)
  getClipById: (id: string) => Clip | undefined;
  getPendingClips: () => Clip[];
  getChildrenOf: (parentId: string) => Clip[];
}
```

---

### Store Implementation

```typescript
// clipStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useClipStore = create<ClipStore>()(
  persist(
    (set, get) => ({
      // Initial state
      clips: [],
      selectedClip: null,

      // Actions
      addClip: (clip) => set((state) => ({
        clips: [...state.clips, clip]
      })),

      updateClip: (id, updates) => set((state) => ({
        clips: state.clips.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      })),

      deleteClip: (id) => set((state) => ({
        clips: state.clips.filter(c => c.id !== id)
      })),

      setSelectedClip: (clip) => set({ selectedClip: clip }),

      // Queries
      getClipById: (id) => get().clips.find(c => c.id === id),

      getPendingClips: () => get().clips.filter(c =>
        c.status === 'pending-child' || c.status === 'pending-retry'
      ),

      getChildrenOf: (parentId) => get().clips.filter(c =>
        c.parentId === parentId
      )
    }),
    {
      name: 'clipstream-storage',
      partialize: (state) => ({ clips: state.clips })  // Only persist clips, not selectedClip
    }
  )
);
```

---

### 2.5 Utility Functions & Store Helpers

**Purpose**: Centralize ID generation, date formatting, and numbering logic.

**File: `utils/id.ts`**

```typescript
/**
 * Generates a unique random ID string
 * Format: alphanumeric, ~11-22 characters
 * Example: "k7h2j5n9p3d"
 */
export function randomId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Generates a clip ID with timestamp + random component
 * Format: "clip-{timestamp}-{random}"
 * Example: "clip-1767021108321-k7h2j5n9p3d"
 */
export function generateClipId(): string {
  return `clip-${Date.now()}-${randomId()}`;
}
```

**File: `utils/date.ts`**

```typescript
/**
 * Returns formatted date string for current day
 * Format: "Dec 29, 2025"
 */
export function today(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats a timestamp to date string
 * @param timestamp - Unix timestamp in milliseconds
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
```

**Store Helper Methods** (add to clipStore.ts):

```typescript
interface ClipStore {
  // ... existing fields

  // Helper methods
  nextRecordingTitle: () => string;
  nextPendingTitle: (parentId?: string) => string;
  createParentWithChildPending: (audioId: string, duration: string) => {
    parentId: string;
    childId: string;
  };
  appendPendingChild: (parentId: string, audioId: string, duration: string) => {
    childId: string;
  };
}

// Implementation in create() function:
export const useClipStore = create<ClipStore>()(
  persist(
    (set, get) => ({
      // ... existing state

      // Generate next recording number (Recording 01, 02, 03...)
      nextRecordingTitle: () => {
        const parents = get().clips.filter(c => !c.parentId);
        const max = parents.reduce((acc, c) => {
          const match = c.title.match(/Recording (\d+)/);
          return match ? Math.max(acc, parseInt(match[1])) : acc;
        }, 0);
        return `Recording ${String(max + 1).padStart(2, '0')}`;
      },

      // Generate next pending clip title (Clip 001, 002, 003...)
      nextPendingTitle: (parentId?: string) => {
        const siblings = parentId
          ? get().clips.filter(c => c.parentId === parentId)
          : [];

        const max = siblings.reduce((acc, c) => {
          const match = c.pendingClipTitle?.match(/Clip (\d+)/);
          return match ? Math.max(acc, parseInt(match[1])) : acc;
        }, 0);

        return `Clip ${String(max + 1).padStart(3, '0')}`;
      },

      // Create parent + first pending child atomically
      createParentWithChildPending: (audioId: string, duration: string) => {
        const parentId = generateClipId();
        const childId = generateClipId();
        const recordingTitle = get().nextRecordingTitle();
        const pendingTitle = get().nextPendingTitle(parentId);

        const parent: Clip = {
          id: parentId,
          createdAt: Date.now(),
          title: recordingTitle,
          date: today(),
          rawText: '',
          formattedText: '',
          content: '',
          status: null,
          currentView: 'formatted'
        };

        const child: Clip = {
          id: childId,
          createdAt: Date.now(),
          title: recordingTitle, // Inherits parent title
          date: today(),
          rawText: '',
          formattedText: '',
          content: '',
          status: 'pending-child',
          parentId: parentId,
          pendingClipTitle: pendingTitle,
          audioId: audioId,
          duration: duration,
          currentView: 'formatted'
        };

        set(state => ({
          clips: [...state.clips, parent, child]
        }));

        return { parentId, childId };
      },

      // Append another pending child to existing parent
      appendPendingChild: (parentId: string, audioId: string, duration: string) => {
        const parent = get().getClipById(parentId);
        if (!parent) throw new Error(`Parent ${parentId} not found`);

        const childId = generateClipId();
        const pendingTitle = get().nextPendingTitle(parentId);

        const child: Clip = {
          id: childId,
          createdAt: Date.now(),
          title: parent.title, // Inherit parent title
          date: today(),
          rawText: '',
          formattedText: '',
          content: '',
          status: 'pending-child',
          parentId: parentId,
          pendingClipTitle: pendingTitle,
          audioId: audioId,
          duration: duration,
          currentView: 'formatted'
        };

        set(state => ({
          clips: [...state.clips, child]
        }));

        return { childId };
      },

      // ... existing methods
    }),
    {
      name: 'clipstream-storage',
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({ clips: state.clips })
    }
  )
);
```

**Usage Examples**:

```typescript
// Generate IDs
import { generateClipId } from '@/utils/id';
import { today } from '@/utils/date';

const newClip: Clip = {
  id: generateClipId(),
  createdAt: Date.now(),
  title: 'Recording 01',
  date: today(),
  // ...
};

// Use store helpers
const { createParentWithChildPending } = useClipStore();
const { parentId, childId } = createParentWithChildPending('audio-123', '5:23');
```

**Edge Cases & Tests**:

```typescript
// Test: Empty clips array
expect(useClipStore.getState().nextRecordingTitle()).toBe('Recording 01');

// Test: Max number reached
// After Recording 99, should return Recording 100 (no padding limit)

// Test: Pending title with no parent
expect(useClipStore.getState().nextPendingTitle()).toBe('Clip 001');
```

---

### 2.2 Network Detection Strategy

**Purpose**: Robust network connectivity detection beyond `navigator.onLine`

**Why navigator.onLine is unreliable**:
- Returns `true` if connected to router (even if no internet)
- Returns `false` positives on some browsers
- Doesn't verify actual connectivity to server

**Solution**: Heartbeat endpoint to verify real connectivity

**Implementation**:

```typescript
// File: hooks/useNetworkStatus.ts

import { useState, useEffect } from 'react';

type NetworkState = 'online' | 'checking' | 'offline';

interface UseNetworkStatusReturn {
  networkState: NetworkState;
  isOnline: boolean;
  isChecking: boolean;
  verifyConnectivity: () => Promise<boolean>;
}

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [networkState, setNetworkState] = useState<NetworkState>('online');

  // Heartbeat endpoint to verify real connectivity
  const verifyConnectivity = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('[Network] Connectivity check failed:', error.message);
      return false;
    }
  };

  // Handle online event with verification
  const handleOnlineEvent = async () => {
    setNetworkState('checking');

    const isReallyOnline = await verifyConnectivity();

    if (isReallyOnline) {
      setNetworkState('online');
      // Trigger auto-retry for pending clips
      window.dispatchEvent(new CustomEvent('verified-online'));
    } else {
      // False positive - navigator.onLine is wrong
      setNetworkState('offline');
    }
  };

  const handleOfflineEvent = () => {
    setNetworkState('offline');
  };

  useEffect(() => {
    // Initial check
    if (!navigator.onLine) {
      setNetworkState('offline');
    }

    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOfflineEvent);
    };
  }, []);

  return {
    networkState,
    isOnline: networkState === 'online',
    isChecking: networkState === 'checking',
    verifyConnectivity
  };
};
```

**API Health Endpoint** (create if doesn't exist):

```typescript
// File: pages/api/health.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'HEAD') {
    res.status(200).end();
  } else {
    res.status(200).json({ status: 'ok', timestamp: Date.now() });
  }
}
```

**Usage in ClipMasterScreen**:

```typescript
const { isOnline, networkState } = useNetworkStatus();

// Instead of checking navigator.onLine:
if (!isOnline) {
  handleOfflineRecording({ audioId, duration });
  return;
}

// Listen for verified-online event instead of 'online':
useEffect(() => {
  const handleVerifiedOnline = async () => {
    const pendingClips = useClipStore.getState().getPendingClips();
    // ... retry logic
  };

  window.addEventListener('verified-online', handleVerifiedOnline);
  return () => window.removeEventListener('verified-online', handleVerifiedOnline);
}, []);
```

**Exponential Backoff for Retries**:

```typescript
const getRetryDelay = (attemptCount: number): number => {
  // Phase 1: Rapid retries (attempts 1-3)
  if (attemptCount <= 3) {
    return attemptCount === 1 ? 0 : 60_000; // 0s, 60s, 60s
  }

  // Phase 2: Interval-based with exponential backoff
  const intervalAttempt = attemptCount - 3;
  const delays = [
    1 * 60_000,  // 1 min
    2 * 60_000,  // 2 min
    4 * 60_000,  // 4 min
    5 * 60_000   // 5 min (repeats)
  ];

  const index = Math.min(intervalAttempt - 1, delays.length - 1);
  return delays[index];
};
```

---

## PART 3: HOOK DESIGNS (No Global State)

### useClipRecording.ts (Audio Recording + Transcription)

**Purpose**: Handle microphone, audio blob, transcription API

**What it does**:
- Captures audio from microphone
- Saves audio blob to IndexedDB
- Calls DeepGram transcription API
- **Returns the transcribed text** (doesn't manage global state)

**What it does NOT do**:
- Create clips (that's ClipMasterScreen's job)
- Update Zustand (that's ClipMasterScreen's job)
- Manage formatting (that's ClipMasterScreen's job)

**Interface**:
```typescript
interface UseClipRecordingReturn {
  // Recording state
  isRecording: boolean;
  audioAnalyser: AnalyserNode | null;
  duration: number;

  // Transcription state
  isTranscribing: boolean;
  transcriptionError: string | null;
  attemptNumber: number;  // 1, 2, or 3

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{
    audioBlob: Blob;
    audioId: string;  // Saved in IndexedDB
    duration: number;
  }>;

  transcribeRecording: (audioBlob: Blob) => Promise<{
    rawText: string;  // ✅ Returns the text directly!
    success: boolean;
  }>;

  reset: () => void;
}
```

**Key change**: `transcribeRecording()` returns `{ rawText, success }` instead of setting global state.

---

### useOfflineRecording.ts (Pending Clip Creation)

**Purpose**: Create parent/child clips for offline recordings

**Current implementation is GOOD** - keep it mostly as-is.

**Minor tweak**: Return the created clip instead of just creating it:
```typescript
const handleOfflineRecording = (params) => {
  // ... create parent/child ...

  return {
    clipId: childClip.id,
    parentId: parentClip.id
  };
};
```

---

### useTranscriptionHandler.ts (REMOVE THIS)

**Decision**: Delete this hook entirely. It's trying to orchestrate too much.

**Why remove it**:
- Mixes concerns (clip creation + formatting + status management)
- Uses global state (transcription, contentBlocks)
- Creates timing issues
- Adds complexity

**Where its logic goes**:
- Clip creation → ClipMasterScreen (directly)
- Formatting → ClipMasterScreen (directly)
- Status updates → Zustand actions (directly)

---

### useParentTitleGenerator.ts (Keep As-Is)

**Current implementation is GOOD** - no changes needed.

**Why it works**:
- Subscribes to Zustand clips changes
- Pure logic (no side effects in render)
- Uses deduplication to prevent infinite loops

**Once Fix 1A works** (rawText populated), this will work automatically.

---

## PART 4: CLIPMASTERSCREEN REWRITE (Orchestration)

### Responsibilities (Clear Boundaries)

**ClipMasterScreen is the ORCHESTRATOR**. It:
1. Handles user interactions (Record, Done, click clip)
2. Calls hooks for side effects (recording, transcription)
3. Updates Zustand with results
4. Manages screen transitions (home ↔ record)

**What it does NOT do**:
- Store data in local state (data lives in Zustand)
- Manage global variables (no `transcription`, `contentBlocks` state)
- Duplicate data (read from Zustand, write to Zustand)

---

### State Structure (Minimal)

```typescript
// ONLY VIEW STATE in ClipMasterScreen
const [activeScreen, setActiveScreen] = useState<'home' | 'record'>('home');
const [recordNavState, setRecordNavState] = useState<RecordNavState>('record');
const [isSearchActive, setIsSearchActive] = useState(false);

// READ from Zustand (not stored in component)
const clips = useClipStore(state => state.clips);
const selectedClip = useClipStore(state => state.selectedClip);
const setSelectedClip = useClipStore(state => state.setSelectedClip);
const addClip = useClipStore(state => state.addClip);
const updateClip = useClipStore(state => state.updateClip);

// Hooks (side effects)
const {
  isRecording,
  isTranscribing,
  attemptNumber,
  startRecording,
  stopRecording,
  transcribeRecording
} = useClipRecording();
```

**No more**:
- ❌ `const [transcription, setTranscription] = useState('')`
- ❌ `const [contentBlocks, setContentBlocks] = useState([])`
- ❌ `const [isFormatting, setIsFormatting] = useState(false)`

**Data lives in Zustand**:
- `clip.rawText` (not `transcription`)
- `clip.formattedText` (not `contentBlocks`)
- `clip.status` (not `isFormatting`)

---

### 4.4 RecordBar State Machine

**Purpose**: Document RecordBar (navbar) state transitions and mode changes

**State Machine Diagram** (Mermaid):

```mermaid
stateDiagram-v2
    [*] --> idle: App starts
    idle --> recording: User clicks Record
    recording --> processing: User clicks Done
    processing --> complete: Formatting finishes
    complete --> idle: Auto-transition (1s)
    recording --> idle: User clicks Cancel
    processing --> idle: Error occurs

    note right of idle: Navbar Mode: Minimal
    note right of recording: Navbar Mode: Recording (mic active)
    note right of processing: Navbar Mode: Processing (spinner)
    note right of complete: Navbar Mode: Complete (checkmark)
```

**State Type & Transitions**:

```typescript
type RecordNavState = 'idle' | 'recording' | 'processing' | 'complete' | 'error';

interface RecordBarModeMap {
  idle: 'minimal';           // Only mic button
  recording: 'recording';    // Mic button (active), Cancel button
  processing: 'processing';  // Spinner, no buttons
  complete: 'complete';      // Checkmark, auto-close
  error: 'error';           // Error icon, Retry button
}
```

**Button Visibility Matrix**:

| State | Mic Button | Done Button | Cancel Button | Copy Button | Spinner | Checkmark |
|-------|-----------|-------------|---------------|-------------|---------|-----------|
| idle | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| recording | 🔴 (active) | ✅ | ✅ | ❌ | ❌ | ❌ |
| processing | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| complete | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| error | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Implementation**:

```typescript
const [recordNavState, setRecordNavState] = useState<RecordNavState>('idle');

// Derive navbar mode from state
const getNavbarMode = (state: RecordNavState): string => {
  const modeMap: RecordBarModeMap = {
    idle: 'minimal',
    recording: 'recording',
    processing: 'processing',
    complete: 'complete',
    error: 'error'
  };
  return modeMap[state];
};

// State transitions
const handleRecordClick = () => {
  setRecordNavState('recording');
  startRecording();
};

const handleDoneClick = async () => {
  setRecordNavState('processing');
  // ... transcription logic

  setRecordNavState('complete');

  // Auto-transition back to idle
  setTimeout(() => setRecordNavState('idle'), 1000);
};

const handleCancelClick = () => {
  stopRecording();
  setRecordNavState('idle');
};

const handleError = (error: Error) => {
  console.error(error);
  setRecordNavState('error');
};
```

**Edge Cases**:

1. **User clicks into different clip while processing**:
   - Keep navbar state as 'processing' if user is viewing the processing clip
   - Switch to 'minimal' if user navigated away

```typescript
const shouldShowProcessingState = (navState: RecordNavState, selectedClipId: string, processingClipId: string): boolean => {
  return navState === 'processing' && selectedClipId === processingClipId;
};
```

2. **User starts new recording while old one formatting**:
   - Allow new recording (background formatting continues)
   - Navbar switches to new recording state

3. **Context parameter** (Fix 2 from original issues):
   - Pass `context` parameter to indicate whether user is actively recording
   - Prevents navbar showing full mode during background tasks

```typescript
const determineNavbarContext = (): 'active' | 'background' => {
  // Active: User is currently interacting with recording
  // Background: Auto-retry or background formatting
  return isRecording || isTranscribing ? 'active' : 'background';
};
```

---

### Flow: Online Recording (Normal)

```typescript
// User clicks Record button
const handleRecordClick = () => {
  setActiveScreen('record');
  setRecordNavState('recording');
  startRecording();
};

// User clicks Done button
const handleDoneClick = async () => {
  setRecordNavState('processing');

  // 1. Stop recording, get audio
  const { audioBlob, audioId, duration } = await stopRecording();

  // 2. Check network status
  const isOnline = navigator.onLine;

  if (!isOnline) {
    // Offline flow - create pending clip
    handleOfflineRecording({ audioId, duration });
    return;
  }

  // 3. Transcribe (online flow)
  const { rawText, success } = await transcribeRecording(audioBlob);

  if (!success) {
    // Failed after 3 retries - save as pending
    handleOfflineRecording({ audioId, duration });
    return;
  }

  // 4. Create clip with raw text
  const newClip: Clip = {
    id: `clip-${Date.now()}-${randomId()}`,
    createdAt: Date.now(),
    title: 'Recording 01',  // Placeholder
    date: new Date().toLocaleDateString(),
    rawText: rawText,  // ✅ Use returned value
    formattedText: '',  // Not ready yet
    content: rawText,  // Legacy
    status: 'formatting',  // Next step: formatting
    currentView: 'formatted'
  };

  addClip(newClip);
  setSelectedClip(newClip);

  // 5. Start formatting in background
  formatTranscriptionInBackground(newClip.id, rawText, false);

  // 6. Start title generation in background
  generateTitleInBackground(newClip.id, rawText);

  setRecordNavState('complete');
};
```

**Key points**:
- No global state - everything goes to Zustand
- `transcribeRecording()` returns the text
- Clip created with both `rawText` and `status: 'formatting'`
- Formatting and title generation happen in background

---

### Flow: Formatting (Background)

```typescript
const formatTranscriptionInBackground = async (
  clipId: string,
  rawText: string,
  isAppending: boolean
) => {
  const clip = useClipStore.getState().getClipById(clipId);
  if (!clip) return;

  try {
    // 1. Get existing context if appending
    const context = isAppending ? clip.formattedText : undefined;

    // 2. Call formatting API
    const response = await fetch('/api/clipperstream/format-text', {
      method: 'POST',
      body: JSON.stringify({ rawText, existingFormattedContext: context })
    });

    const { formattedText } = await response.json();

    // 3. Update clip in Zustand
    updateClip(clipId, {
      formattedText: isAppending
        ? clip.formattedText + formattedText
        : formattedText,
      status: null  // Done!
    });

    // 4. Delete audio from IndexedDB (no longer needed)
    if (clip.audioId) {
      await deleteAudio(clip.audioId);
      updateClip(clipId, { audioId: undefined });
    }

    // 5. Auto-copy to clipboard (if selected clip)
    if (selectedClip?.id === clipId) {
      const updatedClip = useClipStore.getState().getClipById(clipId);
      navigator.clipboard.writeText(updatedClip.formattedText);
      setShowCopyToast(true);
    }

  } catch (error) {
    // Fallback: Use raw text if formatting fails
    updateClip(clipId, {
      formattedText: clip.rawText,
      status: null
    });
  }
};
```

**Key points**:
- No `contentBlocks` state - UI reads directly from `clip.formattedText`
- Status cleared when complete (`status: null`)
- Auto-copy only if this is the selected clip

---

### Flow: Auto-retry (Offline → Online)

```typescript
useEffect(() => {
  const handleOnline = async () => {
    const pendingClips = useClipStore.getState().getPendingClips();

    if (pendingClips.length === 0) return;

    // Process sequentially (one at a time)
    for (const clip of pendingClips) {
      try {
        // 1. Get audio from IndexedDB
        const audioBlob = await getAudio(clip.audioId);
        if (!audioBlob) continue;

        // 2. Update status
        updateClip(clip.id, { status: 'transcribing' });

        // 3. Transcribe
        const { rawText, success } = await transcribeRecording(audioBlob);

        if (!success) {
          updateClip(clip.id, {
            status: 'failed',
            transcriptionError: 'Transcription failed after retries'
          });
          continue;
        }

        // 4. Store raw text
        updateClip(clip.id, {
          rawText: rawText,  // ✅ FIXED - use returned value
          status: 'formatting'
        });

        // 5. Format
        await formatTranscriptionInBackground(clip.id, rawText, false);

        // Now clip has: status: null, rawText: '...', formattedText: '...'

      } catch (error) {
        updateClip(clip.id, {
          status: 'failed',
          transcriptionError: error.message
        });
      }
    }

    // After all children complete, useParentTitleGenerator will trigger automatically
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, []);
```

**Key points**:
- Sequential processing (await each clip)
- Use returned `rawText` value (not global state)
- useParentTitleGenerator triggers automatically when all children have `status: null` and `rawText`

---

### 4.5 Removing contentBlocks Step-by-Step

**Purpose**: Complete migration guide for removing `contentBlocks` global state

**Step 1: Remove contentBlocks State from ClipMasterScreen**

**BEFORE**:
```typescript
// ClipMasterScreen.tsx (current broken state)
const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

// contentBlocks is updated during formatting
const handleFormatComplete = (formattedText: string) => {
  setContentBlocks([{
    id: `block-${Date.now()}`,
    text: formattedText,
    animate: true
  }]);
};
```

**AFTER**:
```typescript
// ClipMasterScreen.tsx (030 rewrite)
// ❌ Delete contentBlocks state entirely

// Instead, update Zustand directly:
const handleFormatComplete = (clipId: string, formattedText: string) => {
  updateClip(clipId, {
    formattedText: formattedText,
    status: null
  });
};
```

**Step 2: Update ClipRecordScreen Props**

**BEFORE**:
```typescript
// ClipMasterScreen.tsx
<ClipRecordScreen
  contentBlocks={contentBlocks}  // ❌ Remove this prop
  selectedClip={selectedClip}
  onTranscribeClick={handleTranscribe}
/>
```

**AFTER**:
```typescript
// ClipMasterScreen.tsx
<ClipRecordScreen
  selectedClip={selectedClip}  // Only need this now
  onTranscribeClick={handleTranscribe}
/>
```

**Step 3: Update ClipRecordScreen to Read from Zustand**

**BEFORE**:
```typescript
// ClipRecordScreen.tsx (current)
interface ClipRecordScreenProps {
  contentBlocks: ContentBlock[];  // ❌ Remove
  selectedClip: Clip | null;
  onTranscribeClick?: () => void;
}

const ClipRecordScreen = ({ contentBlocks, selectedClip, ...props }: ClipRecordScreenProps) => {
  // Render from contentBlocks prop
  return (
    <div className={styles.content}>
      {contentBlocks[0]?.text}
    </div>
  );
};
```

**AFTER**:
```typescript
// ClipRecordScreen.tsx (030 rewrite)
interface ClipRecordScreenProps {
  selectedClip: Clip | null;
  onTranscribeClick?: () => void;
}

const ClipRecordScreen = ({ selectedClip, ...props }: ClipRecordScreenProps) => {
  const clips = useClipStore(state => state.clips);

  // Derive display text from Zustand
  const displayText = useMemo(() => {
    if (!selectedClip) return '';

    // Check if parent with children
    const isParent = !selectedClip.parentId;
    const children = clips.filter(c => c.parentId === selectedClip.id);

    if (isParent && children.length > 0) {
      // Parent with children - show children list
      return null;
    }

    // Single clip or child - show content
    return selectedClip.currentView === 'raw'
      ? selectedClip.rawText
      : selectedClip.formattedText;
  }, [selectedClip, clips]);

  if (displayText === null) {
    return <PendingClipsList clips={children} />;
  }

  return (
    <div className={styles.content}>
      {displayText}
    </div>
  );
};
```

**Step 4: Add Animation Tracking Flag to Clip Interface**

```typescript
interface Clip {
  // ... existing fields

  // Animation control
  hasAnimatedFormattedOnce?: boolean;  // Prevent re-animating on re-render
}
```

**Step 5: Animation Logic (When to Animate vs Instant)**

```typescript
const ClipRecordScreen = ({ selectedClip }: ClipRecordScreenProps) => {
  const updateClip = useClipStore(state => state.updateClip);
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!selectedClip?.formattedText) return;

    // Determine if we should animate
    const shouldAnimate =
      selectedClip.status === null &&              // Just completed
      !selectedClip.hasAnimatedFormattedOnce &&    // Never animated before
      selectedClip.formattedText.length > 0;       // Has text to show

    if (shouldAnimate) {
      setIsAnimating(true);
      let i = 0;
      const text = selectedClip.formattedText;

      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i));
        i++;

        if (i > text.length) {
          clearInterval(interval);
          setIsAnimating(false);

          // Mark as animated
          updateClip(selectedClip.id, {
            hasAnimatedFormattedOnce: true
          });
        }
      }, 10); // 10ms per character

      return () => clearInterval(interval);
    } else {
      // No animation - show full text instantly
      setDisplayedText(selectedClip.formattedText);
    }
  }, [selectedClip?.formattedText, selectedClip?.status, selectedClip?.id]);

  return (
    <div className={styles.content}>
      {displayedText}
    </div>
  );
};
```

**Step 6: Delete ContentBlock Interface**

```typescript
// types/clip.ts (or wherever defined)
// ❌ Delete this entirely:
interface ContentBlock {
  id: string;
  text: string;
  animate: boolean;
}
```

**Edge Cases**:

1. **User clicks away mid-animation**:
   - Animation continues in background
   - When user returns, shows full text (already marked as animated)

2. **Multiple clips complete at once**:
   - Only the selected clip animates
   - Others show instantly when clicked

3. **Appending to existing clip**:
   - Set `hasAnimatedFormattedOnce: true` for append mode
   - New text appears instantly (no animation)

---

### 4.6 Concurrency & Locking

**Purpose**: Prevent race conditions and handle concurrent user actions

**Problem Scenarios**:

1. User starts new recording while previous formatting
2. User deletes clip while it's transcribing
3. User clicks into clip A while clip B is formatting (transcription spilling!)
4. User goes offline mid-transcription
5. User double-clicks "Done" button

**Solution: Lock State + AbortController**

```typescript
// ClipMasterScreen.tsx

const [isProcessing, setIsProcessing] = useState(false);
const abortControllerRef = useRef<AbortController | null>(null);

// Prevent double-submit and concurrent operations
const handleDoneClick = async () => {
  if (isProcessing) {
    console.warn('[Recording] Already processing, ignoring click');
    return;
  }

  setIsProcessing(true);

  try {
    // Create abort controller for this operation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // ... transcription logic with abort signal
    const { rawText, success } = await transcribeRecording(audioBlob, {
      signal: controller.signal
    });

    // Check if aborted
    if (controller.signal.aborted) {
      console.log('[Recording] Operation aborted');
      return;
    }

    // ... rest of logic
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[Recording] Transcription cancelled');
    } else {
      console.error('[Recording] Error:', error);
      handleError(error);
    }
  } finally {
    setIsProcessing(false);
    abortControllerRef.current = null;
  }
};

// Cancel in-flight requests on navigation
const cancelCurrentOperation = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
};

// Call on unmount or navigation
useEffect(() => {
  return () => {
    cancelCurrentOperation();
  };
}, []);
```

**Button Disable Logic**:

```typescript
<button
  onClick={handleRecordClick}
  disabled={isProcessing || isRecording}
>
  Record
</button>

<button
  onClick={handleDoneClick}
  disabled={isProcessing || !isRecording}
>
  Done
</button>
```

**Handling User Navigation During Background Jobs**:

```typescript
const handleClipClick = (clip: Clip) => {
  // Don't cancel background formatting
  // Just switch views
  setSelectedClip(clip);

  // If clip is still processing, show pending UI
  if (clip.status !== null) {
    // Show status indicator instead of content
  }
};
```

**Delete Protection**:

```typescript
const handleDeleteClip = async (clipId: string) => {
  const clip = useClipStore.getState().getClipById(clipId);

  // Warn if deleting processing clip
  if (clip?.status === 'transcribing' || clip?.status === 'formatting') {
    const confirmed = confirm(
      'This clip is still processing. Delete anyway?'
    );

    if (!confirmed) return;

    // Cancel if this is the current processing clip
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  // Proceed with deletion
  deleteClip(clipId);
};
```

**Offline Mid-Transcription**:

```typescript
// In useClipRecording.ts
const transcribeRecording = async (
  audioBlob: Blob,
  options?: { signal?: AbortSignal }
): Promise<{ rawText: string; success: boolean }> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('/api/clipperstream/transcribe', {
      method: 'POST',
      body: formData,
      signal: options?.signal  // Pass abort signal
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const { text } = await response.json();
    return { rawText: text, success: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { rawText: '', success: false };
    }

    // Network error - will retry
    console.error('[Transcription] Failed:', error);
    return { rawText: '', success: false };
  }
};
```

---

## PART 5: UI COMPONENTS (Read from Zustand)

### ClipRecordScreen.tsx (Display Logic)

**Current problem**: Shows `contentBlocks` (global state) instead of `clip.formattedText`

**Fix**: Read directly from Zustand

```typescript
const ClipRecordScreen = () => {
  const selectedClip = useClipStore(state => state.selectedClip);
  const clips = useClipStore(state => state.clips);

  // Derive display text from Zustand
  const displayText = useMemo(() => {
    if (!selectedClip) {
      return '';  // No clip selected
    }

    // Check if parent with children
    const isParent = !selectedClip.parentId;
    const children = clips.filter(c => c.parentId === selectedClip.id);

    if (isParent && children.length > 0) {
      // Parent with children - show children list (not parent's content)
      return null;  // Render pending clips UI instead
    }

    // Single clip or child - show its content
    if (selectedClip.currentView === 'raw') {
      return selectedClip.rawText;
    } else {
      return selectedClip.formattedText;
    }
  }, [selectedClip, clips]);

  // Render
  if (displayText === null) {
    // Show pending clips list
    return <PendingClipsList clips={children} />;
  }

  return (
    <div className={styles.content}>
      {displayText}
    </div>
  );
};
```

**No more `contentBlocks` state** - just read from Zustand.

---

### ClipHomeScreen.tsx (Status Indicators)

**Current problem**: Uses global flags (`activeHttpClipId`) to show spinners

**Fix**: Read from `clip.status`

```typescript
const ClipListItem = ({ clip }: { clip: Clip }) => {
  const clips = useClipStore(state => state.clips);

  // Get children if parent
  const children = clips.filter(c => c.parentId === clip.id);

  // Determine status indicator
  const hasTranscribing = children.some(c => c.status === 'transcribing');
  const hasFormatting = children.some(c => c.status === 'formatting');
  const hasPending = children.some(c => c.status === 'pending-child');

  return (
    <div className={styles.clipItem}>
      <span>{clip.title}</span>

      {/* Status indicator */}
      {(hasTranscribing || hasFormatting) && (
        <Spinner animated className="orange" />
      )}
      {!hasTranscribing && !hasFormatting && hasPending && (
        <Spinner static className="orange" />
      )}
      {!hasTranscribing && !hasFormatting && !hasPending && (
        <CheckIcon />
      )}
    </div>
  );
};
```

**No global flags** - just read `status` from each clip.

---

### 5.3 Parent/Child Display Edge Cases

**Edge Case 1: Parent with No Children**
```typescript
// Scenario: User deletes all child clips from a parent
// Expected: Parent should NOT display (auto-delete or hide)

const shouldDisplayParent = (parent: Clip): boolean => {
  const children = useClipStore.getState().getChildClips(parent.id);
  return children.length > 0;
};
```

**Edge Case 2: Parent Clicked While Child Processing**
```typescript
// Scenario: User clicks parent while child is 'transcribing'
// Expected: Show pending clip title + status indicator (no content yet)

const getParentDisplayContent = (parent: Clip): string[] => {
  const children = useClipStore.getState().getChildClips(parent.id);

  return children.map(child => {
    if (child.status !== null) {
      // Still processing - show pending title + status
      return `${child.pendingClipTitle} - ${getStatusDisplayText(child.status)}`;
    }

    // Completed - show formatted text
    return child.formattedText || child.rawText;
  });
};
```

**Edge Case 3: Multiple Children with Mixed Statuses**
```typescript
// Scenario: Parent has 4 children, 2 completed, 2 still processing
// Expected: Show completed content + pending placeholders in chronological order

const getParentContent = (parentId: string): string[] => {
  const children = useClipStore.getState().getChildClips(parentId)
    .sort((a, b) => a.createdAt - b.createdAt); // Chronological order

  return children.map(child => {
    const displayText = child.status === null
      ? (child.formattedText || child.rawText)
      : `${child.pendingClipTitle} - ${getStatusDisplayText(child.status)}`;

    return displayText;
  });
};
```

---

### 5.4 Audio Lifecycle Management

**Purpose**: Complete audio blob lifecycle from creation to cleanup

**Audio Lifecycle Diagram**:

```
1. CREATE:    stopRecording() → audioBlob saved to IndexedDB
              ↓
2. LINK:      Clip created with audioId reference
              ↓
3. USE:       Auto-retry retrieves blob via getAudio(audioId)
              ↓
4. DELETE:    After successful formatting, deleteAudio(audioId)

ORPHANED AUDIO (edge cases):
- Scenario 1: User deletes pending clip before going online
  → Audio remains in IndexedDB (needs cleanup)
- Scenario 2: Formatting fails, clip marked 'failed'
  → Audio remains (user might retry)
- Scenario 3: App crashes mid-processing
  → Audio remains with no clip reference (needs cleanup)
```

**Implementation**:

```typescript
// File: services/audioStorage.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AudioDB extends DBSchema {
  audios: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      createdAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AudioDB>> | null = null;

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<AudioDB>('clipstream-audio', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('audios')) {
          db.createObjectStore('audios', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const saveAudio = async (id: string, blob: Blob): Promise<void> => {
  const db = await getDB();
  await db.put('audios', {
    id,
    blob,
    createdAt: Date.now()
  });
};

export const getAudio = async (id: string): Promise<Blob | null> => {
  const db = await getDB();
  const record = await db.get('audios', id);
  return record?.blob || null;
};

export const deleteAudio = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete('audios', id);
    console.log('[Audio] Deleted:', id);
  } catch (error) {
    console.warn('[Audio] Failed to delete:', id, error);
    // Don't throw - deletion failure is non-critical
  }
};

export const getAllAudioIds = async (): Promise<string[]> => {
  const db = await getDB();
  const keys = await db.getAllKeys('audios');
  return keys as string[];
};
```

**Quota Monitoring**:

```typescript
// File: hooks/useAudioQuotaMonitor.ts

export const useAudioQuotaMonitor = () => {
  useEffect(() => {
    const checkQuota = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const percentUsed = ((estimate.usage || 0) / (estimate.quota || 1)) * 100;

        if (percentUsed > 80) {
          console.warn('[Audio] Storage > 80% full, cleaning up...');
          await cleanupOrphanedAudio();
        }
      }
    };

    // Check on mount and every 5 minutes
    checkQuota();
    const interval = setInterval(checkQuota, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};
```

**Orphaned Audio Cleanup**:

```typescript
// File: utils/audioCleanup.ts

export const cleanupOrphanedAudio = async (): Promise<void> => {
  try {
    const allClips = useClipStore.getState().clips;
    const referencedAudioIds = new Set(
      allClips
        .map(c => c.audioId)
        .filter(Boolean) as string[]
    );

    // Get all audio IDs from IndexedDB
    const allAudioIds = await getAllAudioIds();

    // Find orphans
    const orphans = allAudioIds.filter(id => !referencedAudioIds.has(id));

    console.log('[Audio] Found', orphans.length, 'orphaned audio blobs');

    // Delete orphans
    for (const id of orphans) {
      await deleteAudio(id);
    }

    console.log('[Audio] Cleanup complete');
  } catch (error) {
    console.error('[Audio] Cleanup failed:', error);
  }
};

// Run cleanup on app mount
export const useAudioCleanup = () => {
  useEffect(() => {
    // Wait 5 seconds after mount (let app stabilize)
    const timeout = setTimeout(() => {
      cleanupOrphanedAudio();
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);
};
```

**Audio Finalizer in Formatting Worker**:

```typescript
// In useFormattingWorker.ts or formatTranscriptionInBackground()

const formatTranscriptionInBackground = async (
  clipId: string,
  rawText: string,
  isAppending: boolean
) => {
  const clip = useClipStore.getState().getClipById(clipId);
  if (!clip) return;

  try {
    // ... formatting logic

    // Success: Delete audio
    if (clip.audioId) {
      await deleteAudio(clip.audioId);
      updateClip(clipId, { audioId: undefined });
    }
  } catch (error) {
    console.error('[Formatting] Error:', error);

    // Even on error, try to clean up audio
    if (clip.audioId) {
      await deleteAudio(clip.audioId);
      updateClip(clipId, { audioId: undefined });
    }

    // Fallback to rawText
    updateClip(clipId, {
      formattedText: clip.rawText,
      status: null
    });
  }
};
```

**User Warnings**:

```typescript
// Show warning toast if quota exceeded
const checkAndWarnQuota = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = ((estimate.usage || 0) / (estimate.quota || 1)) * 100;

    if (percentUsed > 90) {
      showToast(
        'Storage almost full. Consider deleting old recordings.',
        'warning'
      );
    }
  }
};
```

---

### 5.6 Toast Notification System

**Purpose**: Provide user feedback for actions

**Toast Types**:
1. "Audio saved for later translation" - After offline recording saved
2. "Text copied to clipboard" - After copy action or auto-copy

**Implementation**:

```typescript
// Component: ToastNotification.tsx

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  duration?: number; // ms, default 3000
}

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${Date.now()}`;
    const toast: Toast = { id, message, type };

    setToasts(prev => [...prev, toast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return { toasts, showToast };
};
```

**Usage Locations**:
1. `handleOfflineRecording()` - "Audio saved for later translation"
2. `handleCopyClick()` - "Text copied to clipboard"
3. `formatTranscriptionInBackground()` completion - "Text copied to clipboard" (auto-copy)

---

### 5.7 Context Menu Component (Triple Dots)

**Purpose**: Provide clip actions (rename, copy, delete)

**Implementation**:

```typescript
interface ContextMenuProps {
  clipId: string;
  onClose: () => void;
}

const ClipContextMenu = ({ clipId, onClose }: ContextMenuProps) => {
  const { updateClip, deleteClip } = useClipStore();
  const clip = useClipStore(state => state.getClipById(clipId));

  const handleRename = () => {
    // Open rename modal/prompt
    const newTitle = prompt("Enter new title:", clip.title);
    if (newTitle) {
      updateClip(clipId, { title: newTitle });
    }
    onClose();
  };

  const handleCopyText = async () => {
    const textToCopy = clip.formattedText || clip.rawText || clip.content;
    await navigator.clipboard.writeText(textToCopy);
    showToast("Text copied to clipboard", "success");
    onClose();
  };

  const handleDelete = () => {
    // Trigger delete animation, then remove from store
    deleteClip(clipId);
    onClose();
  };

  return (
    <div className="context-menu">
      <button onClick={handleRename}>✏️ Rename</button>
      <button onClick={handleCopyText}>📋 Copy Text</button>
      <button onClick={handleDelete}>🗑️ Delete</button>
    </div>
  );
};
```

**Features**:
1. **Rename**: Updates `clip.title` in Zustand
2. **Copy Text**: Priority order - `formattedText` > `rawText` > `content`
3. **Delete**: Parent clips delete all children (cascade), child clips delete individually

---

### 5.8 Status Display Helpers

**Purpose**: Map status enum to user-facing display text

**Implementation**:

```typescript
// Status text mapping
const getStatusDisplayText = (status: ClipStatus, retryCountdown?: number): string => {
  switch (status) {
    case 'pending-child':
      return 'Waiting to transcribe';

    case 'transcribing':
      return 'Transcribing...';

    case 'formatting':
      return 'Formatting...';

    case 'pending-retry':
      if (retryCountdown) {
        return `Between attempts... (${retryCountdown}s)`;
      }
      return 'Retrying soon...';

    case 'failed':
      return 'Transcription failed';

    case null:
      return '';  // No status to display

    default:
      return '';
  }
};

// Active request indicator (for spinner animation)
const getIsActiveRequest = (status: ClipStatus): boolean => {
  return status === 'transcribing' || status === 'formatting';
};
```

**Usage**:
- `getStatusDisplayText()` - Display text below clip title or in pending clips list
- `getIsActiveRequest()` - Controls spinner animation (animating vs. static)

**Spinner Behavior**:
- Animating: During `'transcribing'` or `'formatting'` (active HTTP request)
- Static: During `'pending-child'` or `'pending-retry'` (waiting, no active request)

---

### 5.9 Retry UI Components

**Purpose**: Show retry countdown and allow manual retry

**Retry Countdown Timer**:

```typescript
// Display: "Next retry in: 5s" during pending-retry status
// Updates every second

const RetryCountdown = ({ clipId }: { clipId: string }) => {
  const clip = useClipStore(state => state.getClipById(clipId));
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (clip.status !== 'pending-retry') return;

    // Calculate seconds until next retry
    const nextRetryTime = clip.nextRetryTime;
    if (!nextRetryTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((nextRetryTime - now) / 1000);
      setCountdown(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [clip.status, clip.nextRetryTime]);

  if (clip.status !== 'pending-retry') return null;

  return (
    <div className="retry-countdown">
      Next retry in: {countdown}s
    </div>
  );
};
```

**Manual Retry Trigger**:

```typescript
// User can tap pending clip to skip wait and force immediate retry

const handleClipClick = (clipId: string) => {
  const clip = useClipStore.getState().getClipById(clipId);

  if (clip.status === 'pending-retry') {
    // Skip wait period, retry immediately
    updateClip(clipId, {
      status: 'transcribing',
      nextRetryTime: undefined
    });

    // Trigger immediate retry
    retryClipTranscription(clipId);
  }
};
```

**Retry Pattern Details**:

**Phase 1: Rapid Retries (0-3 minutes)**
- Attempt 1: Immediate (0s wait)
- Attempt 2: After 60s wait
- Attempt 3: After 60s wait
- Total: 3 attempts over ~3 minutes
- UI: Spinner animating during attempts, static during waits

**Phase 2: Interval-Based Retries (After Phase 1)**
- Attempt 4: After 1 min wait → `status: 'pending-retry'`
- Attempt 5: After 2 min wait → `status: 'pending-retry'`
- Attempt 6: After 4 min wait → `status: 'pending-retry'`
- Attempt 7+: After 5 min wait (repeats) → `status: 'pending-retry'`
- UI: Spinner static, countdown showing "Next retry in: Xs"

**Implementation Helper**:

```typescript
const getRetryDelay = (attemptCount: number): number => {
  // Phase 1: Rapid retries (3 attempts)
  if (attemptCount <= 3) {
    return attemptCount === 1 ? 0 : 60_000; // 0s, 60s, 60s
  }

  // Phase 2: Interval-based retries
  const intervalAttempt = attemptCount - 3;

  switch (intervalAttempt) {
    case 1: return 1 * 60_000;  // 1 min
    case 2: return 2 * 60_000;  // 2 min
    case 3: return 4 * 60_000;  // 4 min
    default: return 5 * 60_000; // 5 min (repeats forever)
  }
};
```

---

### 5.10 Scroll Behavior

**Purpose**: Control when clip list scrolls

**Auto-Scroll Rules**:

1. **New Recording Created**: Scroll to top (newest recordings at top)
2. **User Clicks Into Clip**: No auto-scroll (maintain current position)
3. **Background Processing Completes**: No auto-scroll (don't interrupt user)

**Implementation**:

```typescript
const scrollToTop = () => {
  const listContainer = document.querySelector('.clip-list');
  if (listContainer) {
    listContainer.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
};

// Usage: After adding new clip
const handleDoneClick = async () => {
  // ... transcription, formatting logic

  addClip(newClip);
  scrollToTop();  // ✅ Scroll to show new recording
};
```

---

### 5.11 Copy Text Behavior

**Purpose**: Copy text to clipboard with correct priority

**Three Copy Methods**:

**Method 1: Copy Button in Navbar**
```typescript
// When: User viewing a completed clip
// Action: Copy formatted text to clipboard
// Feedback: "Text copied to clipboard" toast

const handleCopyButtonClick = async () => {
  const clip = useClipStore.getState().selectedClip;
  const textToCopy = clip.formattedText || clip.rawText || clip.content;

  await navigator.clipboard.writeText(textToCopy);
  showToast("Text copied to clipboard", "success");
};
```

**Method 2: Auto-Copy After Formatting**
```typescript
// When: Formatting completes (status changes to null)
// Action: Automatically copy formatted text
// Feedback: "Text copied to clipboard" toast

const formatTranscriptionInBackground = async (
  clipId: string,
  rawText: string,
  append: boolean
) => {
  // ... formatting logic

  updateClip(clipId, {
    formattedText: formatted,
    status: null
  });

  // Auto-copy after formatting completes
  await navigator.clipboard.writeText(formatted);
  showToast("Text copied to clipboard", "success");
};
```

**Method 3: Context Menu Copy**
```typescript
// When: User clicks "Copy Text" in context menu
// Action: Copy available text (formatted > raw > content)
// Feedback: "Text copied to clipboard" toast

const handleContextMenuCopy = async (clipId: string) => {
  const clip = useClipStore.getState().getClipById(clipId);
  const textToCopy = clip.formattedText || clip.rawText || clip.content;

  await navigator.clipboard.writeText(textToCopy);
  showToast("Text copied to clipboard", "success");
};
```

**Text Priority Order**:
1. `formattedText` (preferred - formatted version)
2. `rawText` (fallback - transcription only)
3. `content` (legacy field)

---

### 5.12 Error Display

**Purpose**: Show error state for failed clips

**Failed Clip Display**:

```typescript
// When: Transcription fails permanently (all retries exhausted)
// Display: Error message + retry button

const FailedClipDisplay = ({ clip }: { clip: Clip }) => {
  const { retryClipTranscription } = useAutoRetry();

  return (
    <div className="failed-clip">
      <div className="error-message">
        ⚠️ Transcription failed
        {clip.transcriptionError && (
          <div className="error-details">{clip.transcriptionError}</div>
        )}
      </div>

      <button onClick={() => retryClipTranscription(clip.id)}>
        Retry Now
      </button>
    </div>
  );
};
```

**Error Toast (for unexpected errors)**:

```typescript
// When: Unexpected error during processing
// Display: Error toast with message

const handleTranscriptionError = (clipId: string, error: Error) => {
  updateClip(clipId, {
    status: 'failed',
    transcriptionError: error.message
  });

  showToast(`Transcription error: ${error.message}`, "error");
};
```

**Visual Distinction**:
- Red border on failed clips
- Warning icon (⚠️)
- Error message displayed
- Retry button available

---

### 5.13 Error Message Standards

**Purpose**: User-friendly error messages for all error scenarios

**Error Code → User Message Mapping**:

```typescript
// File: utils/errorMessages.ts

type ErrorCategory =
  | 'network'
  | 'api'
  | 'audio'
  | 'permission'
  | 'storage'
  | 'unknown';

interface ErrorMapping {
  pattern: RegExp | string;
  category: ErrorCategory;
  userMessage: string;
  actionable: string;
}

const errorMappings: ErrorMapping[] = [
  // Network errors
  {
    pattern: /timeout|ETIMEDOUT|ECONNABORTED/i,
    category: 'network',
    userMessage: 'Connection timed out',
    actionable: 'Check your internet connection and try again.'
  },
  {
    pattern: /offline|network|NetworkError/i,
    category: 'network',
    userMessage: 'You appear to be offline',
    actionable: 'Reconnect to the internet to transcribe this recording.'
  },
  {
    pattern: /Failed to fetch/i,
    category: 'network',
    userMessage: 'Unable to reach server',
    actionable: 'Check your internet connection or try again later.'
  },

  // API errors
  {
    pattern: /500|503|Internal Server Error/i,
    category: 'api',
    userMessage: 'Service temporarily unavailable',
    actionable: 'Our servers are experiencing issues. Try again in a few minutes.'
  },
  {
    pattern: /429|Too Many Requests/i,
    category: 'api',
    userMessage: 'Too many requests',
    actionable: 'Please wait 1 minute before trying again.'
  },
  {
    pattern: /401|403|Unauthorized/i,
    category: 'api',
    userMessage: 'Authentication required',
    actionable: 'Please sign in and try again.'
  },
  {
    pattern: /404|Not Found/i,
    category: 'api',
    userMessage: 'Service not found',
    actionable: 'This feature may be unavailable. Contact support.'
  },

  // Audio errors
  {
    pattern: /too large|file size|exceeds/i,
    category: 'audio',
    userMessage: 'Recording is too long',
    actionable: 'Maximum recording length is 10 minutes. Try a shorter clip.'
  },
  {
    pattern: /too small|too short|minimum/i,
    category: 'audio',
    userMessage: 'Recording is too short',
    actionable: 'Please record at least 1 second of audio.'
  },
  {
    pattern: /no audio|silent|empty/i,
    category: 'audio',
    userMessage: 'No audio detected',
    actionable: 'Check your microphone and try again.'
  },

  // Permission errors
  {
    pattern: /permission|NotAllowedError|denied/i,
    category: 'permission',
    userMessage: 'Microphone access denied',
    actionable: 'Enable microphone permissions in your browser settings.'
  },
  {
    pattern: /NotFoundError|no device/i,
    category: 'permission',
    userMessage: 'No microphone found',
    actionable: 'Connect a microphone and refresh the page.'
  },

  // Storage errors
  {
    pattern: /quota|QuotaExceededError|storage full/i,
    category: 'storage',
    userMessage: 'Storage limit reached',
    actionable: 'Delete old recordings to free up space.'
  },
];

export const getUserFriendlyError = (error: Error | string): {
  message: string;
  actionable: string;
  category: ErrorCategory;
} => {
  const errorString = typeof error === 'string' ? error : error.message;

  // Find matching error pattern
  for (const mapping of errorMappings) {
    const matches = typeof mapping.pattern === 'string'
      ? errorString.includes(mapping.pattern)
      : mapping.pattern.test(errorString);

    if (matches) {
      return {
        message: mapping.userMessage,
        actionable: mapping.actionable,
        category: mapping.category
      };
    }
  }

  // Default fallback
  return {
    message: 'Something went wrong',
    actionable: 'Please try again. If the problem persists, contact support.',
    category: 'unknown'
  };
};
```

**Usage in Error Display**:

```typescript
// Update FailedClipDisplay component
const FailedClipDisplay = ({ clip }: { clip: Clip }) => {
  const { message, actionable } = getUserFriendlyError(
    clip.transcriptionError || 'Transcription failed'
  );

  return (
    <div className="failed-clip">
      <div className="error-icon">⚠️</div>
      <div className="error-message">{message}</div>
      <div className="error-action">{actionable}</div>

      <button onClick={() => retryClipTranscription(clip.id)}>
        Retry
      </button>
    </div>
  );
};
```

**Error Logging for Debug**:

```typescript
const logDetailedError = (error: Error, context: string) => {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Don't show technical details to user
  const { message, actionable } = getUserFriendlyError(error);
  showToast(`${message}. ${actionable}`, 'error');
};
```

---

## PART 6: ANIMATION (Restore from Pre-Zustand)

**What worked before**: Text animated in character-by-character when transcription completed.

**What broke**: Animation removed during Zustand migration.

**How to restore**:

```typescript
// In ClipRecordScreen, when displaying formatted text:
const [displayedText, setDisplayedText] = useState('');
const [isAnimating, setIsAnimating] = useState(false);

useEffect(() => {
  if (!selectedClip?.formattedText) return;

  // Check if this is a NEW clip (status just changed to null)
  const shouldAnimate = selectedClip.status === null && !isAnimating;

  if (shouldAnimate) {
    setIsAnimating(true);
    let i = 0;
    const text = selectedClip.formattedText;

    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;

      if (i > text.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 10);  // 10ms per character

    return () => clearInterval(interval);
  } else {
    // No animation - show full text
    setDisplayedText(selectedClip.formattedText);
  }
}, [selectedClip?.formattedText, selectedClip?.status]);
```

**Reference**: Check commit before Zustand migration for exact implementation.

---

### 6.4 Delete Animation

**Purpose**: Smooth transition when deleting clips

**Implementation Pattern**:

```typescript
// Delete animation pattern:
// 1. Add 'deleting' class to clip element (triggers CSS animation)
// 2. Wait for animation to complete (~300ms)
// 3. Remove from Zustand store

const handleDeleteClip = async (clipId: string) => {
  // 1. Mark for deletion (triggers CSS animation)
  setDeletingClipId(clipId);

  // 2. Wait for animation
  await new Promise(resolve => setTimeout(resolve, 300));

  // 3. Actually delete from store
  deleteClip(clipId);

  // 4. Clear deleting state
  setDeletingClipId(null);
};
```

**CSS Animation**:

```css
.clip-item.deleting {
  animation: slideOutRight 300ms ease-out forwards;
  opacity: 0;
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

**Parent Deletion**:
- When deleting parent: Delete all children with staggered animation (50ms delay between each)
- When deleting child: Delete only that child

---

### 6.5 Animation Rules (When to Animate vs. Instant Display)

**Purpose**: Define when text should animate vs. appear instantly

**Animation Decision Logic**:

```typescript
// When creating content blocks, determine animation based on context

const createContentBlocks = (
  clip: Clip,
  isAppendMode: boolean
): ContentBlock[] => {
  const textToDisplay = clip.formattedText || clip.rawText;

  // Append mode: No animation (instant display)
  if (isAppendMode) {
    return [{
      id: `block-${clip.id}`,
      text: textToDisplay,
      animate: false  // ✅ Instant
    }];
  }

  // New recording: Typing animation
  return [{
    id: `block-${clip.id}`,
    text: textToDisplay,
    animate: true  // ✅ Animate
  }];
};
```

**When is Append Mode?**
- User clicks into parent clip that already has formatted content
- Background auto-retry completes while user is viewing a different clip
- Any scenario where content already exists and we're adding more

**When is New Recording Mode?**
- User just finished recording and stays on the clip
- User clicks into a clip that just finished formatting for the first time

**Animation Behavior Documentation**:
- **New Recording**: Text slides in with fade-in/typing animation on first transcription (`animate: true`)
- **Append to Existing**: New text appears instantly below existing content (`animate: false`)

---

## PART 7: IMPLEMENTATION PLAN

### Phase 1: Git Branch Setup (5 min)

```bash
# Find last stable commit (before Zustand issues)
git log --oneline

# Create new branch from stable point
git checkout -b rewrite/zustand-clean <commit-hash>

# Or create from current HEAD if keeping some work
git checkout -b rewrite/zustand-clean
```

---

### Phase 2: Rewrite Files (6 hours)

**Order of implementation**:

1. **clipStore.ts** (1 hour)
   - Define Clip interface
   - Implement store with persist middleware
   - Add actions and queries
   - Test: Create clip, update clip, delete clip

2. **useClipRecording.ts** (1 hour)
   - Modify `transcribeRecording()` to return `Promise<{ rawText, success }>`
   - Remove global state management
   - Test: Record → transcribe → get text back

3. **Delete useTranscriptionHandler.ts** (5 min)
   - Remove file
   - Remove imports from ClipMasterScreen

4. **ClipMasterScreen.tsx** (3 hours)
   - Remove global state (`transcription`, `contentBlocks`, etc.)
   - Implement handleDoneClick with new flow
   - Implement formatTranscriptionInBackground (reads/writes Zustand)
   - Implement handleOnline (auto-retry with returned rawText)
   - Test each scenario:
     - Online → Online (normal)
     - Online → Online (appending)
     - Offline → Offline (pending clip)
     - Offline → Online (auto-retry)

5. **ClipRecordScreen.tsx** (30 min)
   - Remove contentBlocks prop
   - Read directly from selectedClip.formattedText
   - Implement parent/child display logic
   - Test: View parent with children shows list, not empty content

6. **ClipHomeScreen.tsx** (30 min)
   - Remove global flag props
   - Read clip.status for indicators
   - Test: Status indicators show correctly

7. **Animation restoration** (30 min)
   - Check pre-Zustand commit
   - Restore typing animation
   - Test: Text animates in on first transcription

---

### Phase 3: Testing (2 hours)

**Test each scenario systematically**:

1. ✅ **Online → Online**: Record, transcribe, format, title generates
2. ✅ **Appending**: Record to existing clip, text appends correctly
3. ✅ **Bad network**: 3 retries, then interval retry, eventually succeeds
4. ✅ **Offline → Offline**: Pending clip created with "Clip 001", "Clip 002"
5. ✅ **Offline → Online**: Auto-retry processes all clips, parent gets AI title
6. ✅ **Status indicators**: Spinner shows during transcription/formatting
7. ✅ **No flickering**: View one clip while another formats in background
8. ✅ **Animation**: Text types in character-by-character
9. ✅ **Sort order**: Newest clips at top
10. ✅ **Copy**: Auto-copies formatted text on completion

**Session storage verification**:
```javascript
const store = JSON.parse(sessionStorage.getItem('clipstream-storage'));
console.log(store.state.clips);

// Each clip should have:
// - rawText: '...' (not empty)
// - formattedText: '...' (not empty)
// - status: null (when complete)
// - title: 'AI Generated' (not "Recording 01")
```

---

## PART 8: MIGRATION TO EXPO (Future)

**Keep in mind**: This rewrite makes Expo migration easier.

**Why**:
- Zustand works in React Native (same API)
- No browser-specific global state
- Clean separation of concerns

**What will need to change**:
- `navigator.onLine` → Use Expo NetInfo
- `sessionStorage` → Use AsyncStorage
- `IndexedDB` → Use Expo FileSystem
- Web Audio API → Use Expo AV

**What won't need to change**:
- Zustand store (same code)
- Component logic (same hooks)
- Data flow (same architecture)

---

## PART 9: SUCCESS CRITERIA

**After rewrite, all of these MUST work**:

### User Flow 1: Normal Recording
1. ✅ User clicks Record → Recording starts
2. ✅ User clicks Done → Raw text appears with animation
3. ✅ Formatted text replaces raw text smoothly
4. ✅ Title updates from "Recording 01" to AI title
5. ✅ Copy auto-triggers
6. ✅ Status: null (done)

### User Flow 2: Offline Recording
1. ✅ User goes offline → Records 3 clips
2. ✅ Pending clips show: "Clip 001", "Clip 002", "Clip 003"
3. ✅ User goes online → Auto-retry starts
4. ✅ Each clip shows spinner → then checkmark
5. ✅ Parent title updates to AI title (not "Recording 01")
6. ✅ Click into parent → Shows 3 completed children

### Technical Checks
1. ✅ Session storage has correct rawText for each clip
2. ✅ Session storage has correct formattedText for each clip
3. ✅ No global state variables (`transcription`, `contentBlocks`)
4. ✅ No race conditions (clips don't overwrite each other)
5. ✅ No flickering when viewing one clip while another processes
6. ✅ Status indicators accurate (spinner during processing, check when done)
7. ✅ No console errors or warnings
8. ✅ Animation works (typing effect on first transcription)

---

## PART 10: ROLLBACK PLAN

**If rewrite fails**:

```bash
# Rollback to branch point
git checkout main

# Or rollback to specific commit
git reset --hard <original-commit>
```

**Mitigation**:
- Test incrementally (don't wait until end)
- Each file is tested individually
- Keep UI components untouched (low risk)

---

## SUMMARY

**What we're doing**: Rebuilding state management layer with Zustand-first architecture

**What we're keeping**: All UI components, API routes, utilities

**Time**: 10 hours total
- 2 hours: This design document (done)
- 6 hours: Implementation
- 2 hours: Testing

**Risk**: Low - we know all the edge cases, we're just implementing them cleanly

**Result**: Clean, maintainable codebase that actually works

**Completeness**: All UI/UX nuances documented (updated from 031 gap analysis):
- ✅ Toast notifications (2 types)
- ✅ Context menu (rename, copy, delete)
- ✅ Status display helpers (user-facing text)
- ✅ Retry UI components (countdown timer, manual retry)
- ✅ Scroll behavior (auto-scroll rules)
- ✅ Copy text behavior (3 methods with priority)
- ✅ Error display (failed state with retry)
- ✅ Delete animations (smooth transitions)
- ✅ Animation rules (when to animate vs. instant)
- ✅ Parent/child edge cases (mixed statuses)
- ✅ Retry pattern details (3 rapid + interval-based)

**Next step**: Builder reviews this document → approves → implements

---

**Prepared By**: Claude Sonnet 4.5
**Date**: December 29, 2025
**Status**: ✅ COMPLETE - All critical sections merged from addendum
**Updated**: December 29, 2025 - Merged all 6 critical sections from 030_v2_MISSING_SECTIONS_ADDENDUM.md
**Completeness**: 100/100 - All 15 gaps from 030_v1 analysis resolved
**Sections Added**:
- Section 2.2: Network Detection Strategy (robust connectivity verification)
- Section 4.4: RecordBar State Machine (navbar behavior documentation)
- Section 4.5: Removing contentBlocks Step-by-Step (migration guide)
- Section 4.6: Concurrency & Locking (race condition prevention)
- Section 5.4: Audio Lifecycle Management (quota monitoring + cleanup)
- Section 5.13: Error Message Standards (user-friendly error mapping)
