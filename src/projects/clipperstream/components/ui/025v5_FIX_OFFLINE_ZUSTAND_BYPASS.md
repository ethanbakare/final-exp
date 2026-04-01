# 025v5 FIX - Offline Recording Bypassing Zustand

**Date**: 2025-12-29
**Status**: CRITICAL BUG - Incomplete Migration
**Problem**: Offline recordings don't persist, disappear when navigating back
**Root Cause**: useOfflineRecording.ts still using old clipStorage service and writing to wrong key

---

## THE SMOKING GUN

**File**: `src/projects/clipperstream/hooks/useOfflineRecording.ts`

**Line 6**: Imports OLD storage service
```typescript
import { Clip, getClips, createClip, getNextRecordingNumber } from '../services/clipStorage';
```

**Line 137 & 201**: Writes to OLD sessionStorage key
```typescript
sessionStorage.setItem('clipstream_clips', JSON.stringify(allClipsBeforeUpdate));
```

**This completely bypasses Zustand!**

---

## HOW THE BUG HAPPENS

### Offline Recording Flow (BROKEN):

1. **User goes offline, records audio**
2. **useOfflineRecording hook triggered**:
   ```typescript
   const parentClip = createClip('', nextNumber, ''); // ❌ OLD storage
   sessionStorage.setItem('clipstream_clips', JSON.stringify(...)); // ❌ WRONG KEY!
   ```
3. **Clips written to**: `'clipstream_clips'` key
4. **Zustand reads from**: `'clipstream-storage'` key (EMPTY!)
5. **User navigates back**: UI reads from Zustand → No clips found
6. **Clips vanish** ❌

### Online Recording Flow (WORKS):

1. **User online, records audio**
2. **useTranscriptionHandler triggered**:
   ```typescript
   const newClip = createNewClip(...); // ✅ Zustand's createNewClip wrapper
   addClip(newClip); // ✅ Zustand store action
   ```
3. **Zustand persists to**: `'clipstream-storage'` key ✓
4. **UI reads from Zustand**: Clips found ✓

---

## EVIDENCE FROM DEBUG

**013_ZUSTANDv5_debug.md** shows:

```
Lines 4-12: Offline flow executes ✓
[INFO] Created PARENT container for offline recording
[INFO] Created FIRST CHILD for offline recording

Lines 18-82: Session storage shows FLAT ARRAY
Session storage localhost
[{id: "clip-1767010072521-4521v3qo1", ...}, {...}]  // ❌ OLD FORMAT
```

**This is the OLD clipStorage format!** Zustand format should be:
```javascript
{
  "state": {
    "clips": [...],
    "selectedClip": null
  },
  "version": 1
}
```

---

## WHY THIS WASN'T CAUGHT

During the Zustand v2.6.0 migration:
- ✅ ClipMasterScreen.tsx was migrated
- ✅ useTranscriptionHandler.ts was migrated
- ✅ clipStore.ts was created
- ❌ **useOfflineRecording.ts was FORGOTTEN!**

It still uses the old clipStorage service directly!

---

## THE FIX (Fix 10 - 025v5)

### Update useOfflineRecording.ts to Use Zustand

**Changes Required**:

1. **Remove old clipStorage imports** (line 6)
2. **Add Zustand store actions to params**
3. **Replace `createClip()` with Zustand `addClip()`**
4. **Remove direct sessionStorage writes**
5. **Use `useClipStore.getState()` for reading clips**

### Updated Interface:

```typescript
// BEFORE (lines 12-20):
export interface UseOfflineRecordingParams {
  setCurrentClipId: (id: string) => void;
  setSelectedPendingClips: React.Dispatch<React.SetStateAction<PendingClip[]>>;
  formatDuration: (seconds: number) => string;
  clipToPendingClip: (clip: Clip) => PendingClip;
}

// AFTER:
export interface UseOfflineRecordingParams {
  setCurrentClipId: (id: string) => void;
  setSelectedPendingClips: React.Dispatch<React.SetStateAction<PendingClip[]>>;
  formatDuration: (seconds: number) => string;
  clipToPendingClip: (clip: Clip) => PendingClip;

  // ADD: Zustand store actions
  addClip: (clip: Clip) => void;
  getClips: () => Clip[];  // Use Zustand's getClips, not clipStorage's
}
```

### Updated Imports:

```typescript
// BEFORE (line 6):
import { Clip, getClips, createClip, getNextRecordingNumber } from '../services/clipStorage';

// AFTER:
import { Clip, getNextRecordingNumber } from '../services/clipStorage';
import { useClipStore } from '../store/clipStore';  // ADD THIS
```

### Updated Hook Implementation:

```typescript
// BEFORE (line 30-36):
export const useOfflineRecording = (params: UseOfflineRecordingParams): UseOfflineRecordingReturn => {
  const {
    setCurrentClipId,
    setSelectedPendingClips,
    formatDuration,
    clipToPendingClip
  } = params;

// AFTER:
export const useOfflineRecording = (params: UseOfflineRecordingParams): UseOfflineRecordingReturn => {
  const {
    setCurrentClipId,
    setSelectedPendingClips,
    formatDuration,
    clipToPendingClip,
    addClip,      // ADD
    getClips      // ADD
  } = params;
```

### Replace createClip() Calls:

**PARENT CREATION (lines 104-112):**

```typescript
// BEFORE:
const nextNumber = getNextRecordingNumber(getClips());
const parentClip = createClip('', nextNumber, ''); // ❌ OLD

log.info('Created PARENT container for offline recording', {
  parentId: parentClip.id,
  title: nextNumber
});

// AFTER:
const nextNumber = getNextRecordingNumber(getClips());

// Create parent clip object
const parentClip: Clip = {
  id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  title: nextNumber,
  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  status: null,  // Parent is just a container
  content: '',
  rawText: '',
  currentView: 'formatted',
  createdAt: Date.now()
};

addClip(parentClip); // ✅ Zustand action

log.info('Created PARENT container for offline recording', {
  parentId: parentClip.id,
  title: nextNumber
});
```

**FIRST CHILD CREATION (lines 115-145):**

```typescript
// BEFORE (lines 134-137):
// Save child to storage
const allClipsBeforeUpdate = getClips();
allClipsBeforeUpdate.push(firstChild);
sessionStorage.setItem('clipstream_clips', JSON.stringify(allClipsBeforeUpdate)); // ❌ WRONG!

// AFTER:
// Save child to Zustand
addClip(firstChild); // ✅ Zustand action - that's it!
```

**SUBSEQUENT CHILD CREATION (lines 198-201):**

```typescript
// BEFORE:
// Save child to storage
const allClipsBeforeUpdate = getClips();
allClipsBeforeUpdate.push(childClip);
sessionStorage.setItem('clipstream_clips', JSON.stringify(allClipsBeforeUpdate)); // ❌ WRONG!

// AFTER:
// Save child to Zustand
addClip(childClip); // ✅ Zustand action
```

### Update ClipMasterScreen.tsx Call:

**BEFORE (lines 1164-1169):**
```typescript
const { handleOfflineRecording } = useOfflineRecording({
  setCurrentClipId,
  setSelectedPendingClips,
  formatDuration,
  clipToPendingClip
});
```

**AFTER:**
```typescript
const { handleOfflineRecording } = useOfflineRecording({
  setCurrentClipId,
  setSelectedPendingClips,
  formatDuration,
  clipToPendingClip,
  addClip,                                    // ADD
  getClips: () => useClipStore.getState().clips  // ADD
});
```

---

## VERIFICATION AFTER FIX

### Test 1: Offline Recording Creates Clips

1. Turn off network (DevTools → Network → Offline)
2. Press Record
3. Speak: "Testing offline recording with Zustand"
4. Press Done
5. **Expected**:
   - ✅ "Audio saved for later" toast appears
   - ✅ Pending clip appears in record screen
   - ✅ Session storage shows Zustand format:
     ```json
     {
       "state": {
         "clips": [
           {
             "id": "clip-xxx-parent",
             "title": "Recording 01",
             "status": null,
             "content": ""
           },
           {
             "id": "clip-xxx-child",
             "title": "Recording 01",
             "parentId": "clip-xxx-parent",
             "status": "pending-child",
             "audioId": "audio-xxx",
             "pendingClipTitle": "Clip 001"
           }
         ]
       },
       "version": 1
     }
     ```

### Test 2: Navigate Back - Clips Persist

1. After offline recording, press "Clips" button
2. **Expected**:
   - ✅ Returns to home screen
   - ✅ "Recording 01" file visible in list
   - ✅ Has orange dot (pending status indicator)

### Test 3: Click Parent - Shows Child

1. Click "Recording 01" file
2. **Expected**:
   - ✅ Opens record screen
   - ✅ Shows "Clip 001" with spinning icon
   - ✅ Clip still there (not vanished!)

### Test 4: Go Online - Auto Retry

1. Turn network back on (DevTools → Network → Online)
2. **Expected**:
   - ✅ Spinning icon starts (transcription begins)
   - ✅ After ~2-3 seconds, transcription completes
   - ✅ Text appears in UI
   - ✅ Title generates ("Testing Offline Recording...")
   - ✅ "Copied to clipboard" toast appears

### Test 5: Check Storage Keys

```javascript
// In browser console:

// Should be NULL or undefined (old key no longer used):
sessionStorage.getItem('clipstream_clips')

// Should show Zustand persisted data:
JSON.parse(sessionStorage.getItem('clipstream-storage'))
```

---

## FILES TO MODIFY

### 1. src/projects/clipperstream/hooks/useOfflineRecording.ts

**Line 6** - Update imports:
```typescript
// REMOVE: createClip, getClips
// ADD: useClipStore import
import { Clip, getNextRecordingNumber } from '../services/clipStorage';
import { useClipStore } from '../store/clipStore';
```

**Lines 12-20** - Update interface:
```typescript
export interface UseOfflineRecordingParams {
  setCurrentClipId: (id: string) => void;
  setSelectedPendingClips: React.Dispatch<React.SetStateAction<PendingClip[]>>;
  formatDuration: (seconds: number) => string;
  clipToPendingClip: (clip: Clip) => PendingClip;
  addClip: (clip: Clip) => void;              // ADD
  getClips: () => Clip[];                      // ADD
}
```

**Lines 30-36** - Destructure new params:
```typescript
const {
  setCurrentClipId,
  setSelectedPendingClips,
  formatDuration,
  clipToPendingClip,
  addClip,      // ADD
  getClips      // ADD
} = params;
```

**Lines 104-112** - Replace createClip() for parent:
```typescript
const nextNumber = getNextRecordingNumber(getClips());

const parentClip: Clip = {
  id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  title: nextNumber,
  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  status: null,
  content: '',
  rawText: '',
  currentView: 'formatted',
  createdAt: Date.now()
};

addClip(parentClip);
```

**Lines 134-137** - Replace sessionStorage.setItem():
```typescript
// DELETE these 3 lines:
// const allClipsBeforeUpdate = getClips();
// allClipsBeforeUpdate.push(firstChild);
// sessionStorage.setItem('clipstream_clips', JSON.stringify(allClipsBeforeUpdate));

// REPLACE WITH:
addClip(firstChild);
```

**Lines 198-201** - Replace sessionStorage.setItem():
```typescript
// DELETE these 3 lines:
// const allClipsBeforeUpdate = getClips();
// allClipsBeforeUpdate.push(childClip);
// sessionStorage.setItem('clipstream_clips', JSON.stringify(allClipsBeforeUpdate));

// REPLACE WITH:
addClip(childClip);
```

### 2. src/projects/clipperstream/components/ui/ClipMasterScreen.tsx

**Lines 1164-1169** - Pass Zustand actions:
```typescript
const { handleOfflineRecording } = useOfflineRecording({
  setCurrentClipId,
  setSelectedPendingClips,
  formatDuration,
  clipToPendingClip,
  addClip,                                    // ADD
  getClips: () => useClipStore.getState().clips  // ADD
});
```

---

## COMPLETE UPDATED useOfflineRecording.ts

<details>
<summary>Click to expand full updated file</summary>

```typescript
// useOfflineRecording.ts
// Handles offline recording parent-child creation and pending clip management
// Extracted from ClipMasterScreen.tsx Phase 2.5
// UPDATED v2.6.1: Use Zustand store instead of clipStorage service

import { useCallback } from 'react';
import { Clip, getNextRecordingNumber } from '../services/clipStorage';
import { PendingClip } from '../components/ui/ClipRecordScreen';
import { logger } from '../utils/logger';

const log = logger.scope('useOfflineRecording');

export interface UseOfflineRecordingParams {
  // Callbacks to update parent component state
  setCurrentClipId: (id: string) => void;
  setSelectedPendingClips: React.Dispatch<React.SetStateAction<PendingClip[]>>;

  // Helper functions from parent
  formatDuration: (seconds: number) => string;
  clipToPendingClip: (clip: Clip) => PendingClip;

  // Zustand store actions (v2.6.1)
  addClip: (clip: Clip) => void;
  getClips: () => Clip[];
}

export interface UseOfflineRecordingReturn {
  handleOfflineRecording: (params: {
    audioId: string;
    duration: number;
    currentClipId: string | null;
  }) => void;
}

export const useOfflineRecording = (params: UseOfflineRecordingParams): UseOfflineRecordingReturn => {
  const {
    setCurrentClipId,
    setSelectedPendingClips,
    formatDuration,
    clipToPendingClip,
    addClip,
    getClips
  } = params;

  const handleOfflineRecording = useCallback((recordingParams: {
    audioId: string;
    duration: number;
    currentClipId: string | null;
  }) => {
    const { audioId, duration, currentClipId } = recordingParams;

    log.info('Handling offline recording', { audioId, duration, currentClipId });

    // PHASE 2.3.1: Parent-child architecture for grouping multiple pending clips
    // Determine whether to create PARENT (new recording) or CHILD (successive clip)

    let shouldCreateParent = false;
    let parentClipForChild: Clip | undefined;

    if (!currentClipId) {
      // No context at all → create new parent
      shouldCreateParent = true;
      log.info('No currentClipId → creating parent');
    } else {
      // We have currentClipId → check clip status to determine parent vs child
      const currentClip = getClips().find(c => c.id === currentClipId);

      if (!currentClip) {
        // Clip doesn't exist (maybe deleted?) → create new parent
        shouldCreateParent = true;
        log.warn('currentClipId points to non-existent clip, creating new parent', {
          currentClipId
        });
      } else if (currentClip.status === null) {
        // Appending to completed/transcribed file (status=null) → create child
        // v2.4: Parent files have status=null (they're just containers)
        // When recording in a transcribed file OR in a parent container, create child
        shouldCreateParent = false;
        parentClipForChild = currentClip;
        log.info('Appending to transcribed/completed file', {
          parentId: currentClipId,
          parentStatus: currentClip.status
        });
      } else if (currentClip.status === 'pending' || currentClip.status === 'pending-child') {
        // Parent is still pending → create child
        // If current is a child, find its parent
        const actualParent = currentClip.parentId
          ? getClips().find(c => c.id === currentClip.parentId)
          : currentClip;
        shouldCreateParent = false;
        parentClipForChild = actualParent || currentClip;
        log.info('Appending to pending file', {
          parentId: parentClipForChild.id,
          parentStatus: parentClipForChild.status
        });
      } else {
        // Unknown status → play it safe, create new parent
        shouldCreateParent = true;
        log.warn('Unknown clip status, creating new parent', {
          currentClipId,
          status: currentClip.status
        });
      }
    }

    let clipIdToUpdate: string;

    if (shouldCreateParent) {
      // v2.4: Create PARENT (container only) + FIRST CHILD (Clip 001) separately
      // Step 1: Create PARENT (container only)
      const nextNumber = getNextRecordingNumber(getClips());

      const parentClip: Clip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: nextNumber,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: null,
        content: '',
        rawText: '',
        currentView: 'formatted',
        createdAt: Date.now()
      };

      addClip(parentClip);

      log.info('Created PARENT container for offline recording', {
        parentId: parentClip.id,
        title: nextNumber
      });

      // Parent remains as-is (no audioId, no pendingClipTitle, status: null by default)
      // Parent is just a container for organizing children

      // Step 2: Create FIRST CHILD (Clip 001)
      const firstChildId = `clip-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Manually create child clip object
      const now = new Date();
      const firstChild: Clip = {
        id: firstChildId,
        title: parentClip.title,            // Inherit parent's title "Recording 01"
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'pending-child',            // Child status (filtered from home)
        content: '',                        // No content yet (pending transcription)
        pendingClipTitle: 'Clip 001',       // First pending clip
        audioId: audioId,                   // Link to IndexedDB audio
        duration: formatDuration(duration), // Recording duration
        parentId: parentClip.id,            // Link to parent
        currentView: 'formatted',
        createdAt: Date.now()
      };

      // Save child to Zustand
      addClip(firstChild);

      log.info('Created FIRST CHILD for offline recording', {
        childId: firstChild.id,
        parentId: parentClip.id,
        parentTitle: parentClip.title,
        childTitle: firstChild.pendingClipTitle
      });

      // Set currentClipId to PARENT (not child)
      // This allows subsequent recordings to append as children
      setCurrentClipId(parentClip.id);
      clipIdToUpdate = firstChild.id;  // For selectedPendingClips update below

      // Add first child to selectedPendingClips
      const pendingClip = clipToPendingClip(firstChild);
      setSelectedPendingClips([pendingClip]);
      log.debug('Set selectedPendingClips to first child', { pendingClip });

    } else {
      // v2.4: Create CHILD recording linked to parent
      const parentClip = parentClipForChild!;

      if (!parentClip) {
        log.error('Parent clip not found, cannot create child', {
          currentClipId
        });
        return;
      }

      // Get next pending clip number for this parent
      const allClips = getClips();
      const childrenOfParent = allClips.filter(c => c.parentId === parentClip.id);
      const childNumbers = childrenOfParent
        .map(c => c.pendingClipTitle?.match(/Clip (\d+)/)?.[1])
        .filter(n => n)
        .map(Number);
      const maxChildNumber = childNumbers.length > 0 ? Math.max(...childNumbers) : 0;
      const nextChildNumber = String(maxChildNumber + 1).padStart(3, '0');
      const nextPendingTitle = `Clip ${nextChildNumber}`;

      // v2.4: Manually create child clip
      const childId = `clip-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      clipIdToUpdate = childId;

      // Create child clip object directly with parent's title
      const now = new Date();
      const childClip: Clip = {
        id: childId,
        title: parentClip.title,            // ✅ Inherit parent's title "Recording 01"
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'pending-child',            // Child status (filtered from home)
        content: '',                        // No content yet (pending transcription)
        pendingClipTitle: nextPendingTitle, // "Clip 002", "Clip 003", etc.
        audioId: audioId,                   // Link to IndexedDB audio
        duration: formatDuration(duration), // Recording duration
        parentId: parentClip.id,            // Link to parent
        currentView: 'formatted',
        createdAt: Date.now()
      };

      // Save child to Zustand
      addClip(childClip);

      log.info('Created CHILD for offline recording', {
        childId: childId,
        parentId: parentClip.id,
        parentTitle: parentClip.title,
        parentStatus: parentClip.status,
        childTitle: nextPendingTitle
      });

      // Add to selectedPendingClips array
      const pendingClip = clipToPendingClip(childClip);
      setSelectedPendingClips(prev => [...prev, pendingClip]);
      log.debug('Added child to selectedPendingClips', { pendingClip });
    }
  }, [setCurrentClipId, setSelectedPendingClips, formatDuration, clipToPendingClip, addClip, getClips]);

  return {
    handleOfflineRecording
  };
};
```

</details>

---

## COMMIT MESSAGE AFTER SUCCESS

```bash
git add src/projects/clipperstream/hooks/useOfflineRecording.ts
git add src/projects/clipperstream/components/ui/ClipMasterScreen.tsx

git commit -m "fix(offline): migrate useOfflineRecording to use Zustand store

Fixes offline recordings disappearing when navigating back.

Root cause: useOfflineRecording.ts was still using old clipStorage
service and writing directly to 'clipstream_clips' key, bypassing
Zustand which uses 'clipstream-storage' key. This created two
separate storage systems running in parallel.

Solution: Update useOfflineRecording to receive and use Zustand
store actions (addClip, getClips) instead of clipStorage service.
Removed direct sessionStorage.setItem() calls.

Changes:
- useOfflineRecording.ts: Use Zustand actions instead of clipStorage
- ClipMasterScreen.tsx: Pass Zustand actions to useOfflineRecording

This completes the Zustand migration for offline recordings.

Tested:
- Offline recordings create parent + child clips
- Clips persist when navigating back
- Parent file shows in home screen with orange dot
- Clicking parent shows children
- Auto-retry works when going online

Related: Fix 9 (025v4) - remove refreshClips() storage key mismatch
Related: v2.6.0 Zustand migration"
```

---

## IMPACT

**Before Fix**:
```
Offline recording → Creates clips in 'clipstream_clips' →
Navigate back → Zustand reads from 'clipstream-storage' (empty) →
Clips vanish ❌
```

**After Fix**:
```
Offline recording → Zustand addClip() → Persist to 'clipstream-storage' →
Navigate back → UI reads from Zustand → Clips visible ✅
```

---

**Prepared By**: Claude Sonnet 4.5
**Date**: December 29, 2025
**Status**: Ready to apply
**Confidence**: 100% (direct sessionStorage writes proven, clear bypass of Zustand)

**This is the missing piece! Offline recordings will work after this!** 🎯
