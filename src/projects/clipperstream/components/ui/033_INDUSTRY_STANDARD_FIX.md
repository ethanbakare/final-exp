# 033 - Industry Standard Zustand Architecture
## Complete Refactor: Single Source of Truth Pattern

**Date**: December 30, 2025
**Status**: 🏗️ **ARCHITECTURAL REFACTOR** - Completes Phase 4 → Phase 5 transition
**Supersedes**: 030_v5_PHASE5_SPINNER_PATCH.md
**Fixes**: Append mode sync, animations, pending → transcribed transitions, dual state anti-pattern

---

## Executive Summary

**Problem**: Dual state management anti-pattern causing bugs
- Data lives in TWO places (Zustand + local `selectedClip` state)
- Manual sync required after every Zustand update → bugs when sync is missed
- Pending clip → transcribed clip transition doesn't update UI
- Append mode doesn't show new text
- Animations don't trigger correctly

**Solution**: Industry standard single source of truth pattern
- Remove `selectedClip` local state
- Use Zustand selectors (auto-reactive)
- Remove `contentBlocks` zombie prop
- All components subscribe directly to Zustand

**Result**:
- ✅ Zustand updates automatically trigger re-renders
- ✅ Append mode shows new text immediately
- ✅ Animations trigger at correct time
- ✅ Pending → transcribed transition works
- ✅ No manual sync needed
- ✅ Ready for React Native/Expo

---

## Part 1: Understanding the Anti-Pattern

### Current Architecture (WRONG)

**ClipMasterScreen.tsx:**
```typescript
// ❌ ANTI-PATTERN: Data in two places
const [selectedClip, setSelectedClip] = useState<Clip | null>(null); // Local copy
const { clips, updateClip } = useClipStore(); // Source of truth

// Every Zustand update requires manual sync:
updateClip(id, { content: newContent });
const updatedClip = getClipById(id);  // Fetch updated data
setSelectedClip(updatedClip);  // Manually sync
```

**Why this fails:**
```
Time 0ms:  updateClip() called → Zustand updated
Time 1ms:  setSelectedClip() called → Local state updated
Time 500ms: formatTranscriptionInBackground() updates Zustand AGAIN
Time 500ms: ❌ selectedClip is NEVER updated → UI shows stale data
```

### Industry Standard (CORRECT)

**All major state libraries use this:**

```typescript
// ✅ CORRECT: Single source of truth
const [currentClipId, setCurrentClipId] = useState<string | null>(null); // View state
const selectedClip = useClipStore(state =>
  currentClipId ? state.clips.find(c => c.id === currentClipId) : null
); // Subscribes to Zustand

// Any Zustand update automatically triggers re-render
updateClip(id, { content: newContent }); // Done! UI updates automatically
```

---

## Part 2: ClipMasterScreen Refactor

### Step 2.1: Remove selectedClip State

**File**: [ClipMasterScreen.tsx](ClipMasterScreen.tsx)

**Location**: Around line 147

**REMOVE this line:**
```typescript
const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
```

**ADD this instead:**
```typescript
// Industry standard: Store ID only, subscribe to Zustand for data
const selectedClip = useClipStore(state =>
  currentClipId ? state.clips.find(c => c.id === currentClipId) : null
);
```

**Why this works:**
- `currentClipId` already exists (view state - which clip is selected)
- Zustand selector automatically re-runs when `clips` array changes
- Any update to Zustand → selector re-runs → component re-renders
- No manual sync needed

---

### Step 2.2: Remove All setSelectedClip() Calls

**Search the file for:** `setSelectedClip`

**You will find ~15 occurrences. Replace them ALL as follows:**

#### Example 1: handleClipClick

**BEFORE (line ~238):**
```typescript
setSelectedClip(clip);
```

**AFTER:**
```typescript
// Already have setCurrentClipId(clip.id) - that's all we need!
// The selector will automatically fetch the clip
```

**Full function after changes:**
```typescript
const handleClipClick = useCallback((clipId: string) => {
  const clip = clips.find(c => c.id === clipId);
  if (!clip) {
    console.warn('Clip not found:', clipId);
    return;
  }

  // Check if this is a pending clip being retried
  if (clip.audioId && isActiveRequest) {
    const existingPending = selectedPendingClips.find(p => p.id === clipId);
    if (existingPending && currentClipId === clipId) {
      return;
    }
  }

  setCurrentClipId(clip.id);
  setSelectedPendingClips([]);

  if (clip.content) {
    // Transcribed clip - show in complete state
    // ❌ REMOVE: setSelectedClip(clip);
    setIsAppendMode(false);
    setAppendBaseContent('');
    resetRecording();
    setAnimationVariant('fade');
    setRecordNavState('complete');
    setActiveScreen('record');
  } else {
    // Pending clip - show in waiting state
    // ❌ REMOVE: setSelectedClip(null);
    setAnimationVariant('fade');
    setRecordNavState('record');
    setActiveScreen('record');
  }
}, [clips, isActiveRequest, currentClipId, resetRecording, selectedPendingClips]);
```

#### Example 2: handleBackClick

**BEFORE (line ~296):**
```typescript
setSelectedClip(null);
```

**AFTER:**
```typescript
// Already clearing currentClipId - that's all we need!
// ❌ REMOVE: setSelectedClip(null);
```

#### Example 3: handleNewClipClick

**BEFORE (line ~322):**
```typescript
setSelectedClip(null);
```

**AFTER:**
```typescript
// Already clearing currentClipId
// ❌ REMOVE: setSelectedClip(null);
```

#### Example 4: handleRecordClick

**BEFORE (line ~368-370):**
```typescript
if (selectedClip.currentView === 'raw') {
  const updatedClip = updateClipById(selectedClip.id, { currentView: 'formatted' });
  if (updatedClip) {
    setSelectedClip(updatedClip);
  }
}
```

**AFTER:**
```typescript
if (selectedClip.currentView === 'raw') {
  updateClipById(selectedClip.id, { currentView: 'formatted' });
  // ✅ Selector will automatically pick up the change
}
```

#### Example 5: handleCloseClick (5 occurrences)

**BEFORE:**
```typescript
setSelectedClip(null);
```

**AFTER:**
```typescript
// Already clearing currentClipId in these cases
// ❌ REMOVE: setSelectedClip(null);
```

#### Example 6: handleDoneClick - NEW CLIP

**BEFORE (line ~560):**
```typescript
addClip(newClip);
setSelectedClip(newClip);
setCurrentClipId(newClip.id);
```

**AFTER:**
```typescript
addClip(newClip);
setCurrentClipId(newClip.id);
// ✅ Selector will automatically fetch the clip from Zustand
```

#### Example 7: handleDoneClick - APPEND MODE (CRITICAL)

**BEFORE (line ~538-546):**
```typescript
if (isAppendMode && currentClipId) {
  const existingClip = getClipById(currentClipId);
  if (existingClip) {
    updateClip(currentClipId, {
      rawText: existingClip.rawText + '\n\n' + rawText,
      status: 'formatting'
    });
    formatTranscriptionInBackground(currentClipId, rawText, true);
  }
}
```

**AFTER (ADD content update):**
```typescript
if (isAppendMode && currentClipId) {
  const existingClip = getClipById(currentClipId);
  if (existingClip) {
    updateClip(currentClipId, {
      rawText: existingClip.rawText + '\n\n' + rawText,
      content: existingClip.content + '\n\n' + rawText, // ← ADD THIS LINE
      status: 'formatting'
    });
    // ✅ Selector will automatically pick up the change and re-render
    formatTranscriptionInBackground(currentClipId, rawText, true);
  }
}
```

**Why add `content` update:**
- New clip path sets `content: rawText` immediately (line 555)
- Append mode must do the same for consistency
- This makes UI show new text BEFORE formatting completes
- Matches the new clip behavior

#### Example 8: handleStructureClick

**BEFORE (line ~506-510):**
```typescript
const updatedClip = updateClipById(selectedClip.id, {
  currentView: newView
});
if (updatedClip) {
  setSelectedClip(updatedClip);
}
```

**AFTER:**
```typescript
updateClipById(selectedClip.id, {
  currentView: newView
});
// ✅ Selector will automatically pick up the change
```

---

### Step 2.3: Update formatTranscriptionInBackground

**Location**: [ClipMasterScreen.tsx:926-994](ClipMasterScreen.tsx#L926-L994)

**BEFORE (line ~974-982):**
```typescript
// Auto-copy if this is the selected clip
if (selectedClip?.id === clipId) {
  const updatedClip = getClipById(clipId);
  if (updatedClip) {
    const textToCopy = updatedClip.currentView === 'raw'
      ? updatedClip.rawText
      : updatedClip.formattedText;
    navigator.clipboard.writeText(textToCopy);
    setShowCopyToast(true);
  }
}
```

**AFTER (no changes to logic, but add comment):**
```typescript
// Auto-copy if this is the selected clip
// ✅ selectedClip automatically has latest data from Zustand selector
if (selectedClip?.id === clipId) {
  const textToCopy = selectedClip.currentView === 'raw'
    ? selectedClip.rawText
    : selectedClip.formattedText;
  navigator.clipboard.writeText(textToCopy);
  setShowCopyToast(true);
}
```

**Why this now works:**
- Before: `selectedClip` was stale local state
- After: `selectedClip` comes from selector, always has latest Zustand data
- When formatting completes → Zustand updates → selector re-runs → `selectedClip` has new data

---

### Step 2.4: Update Auto-Retry Logic

**Location**: [ClipMasterScreen.tsx:997-1065](ClipMasterScreen.tsx#L997-L1065)

**No changes needed!** Auto-retry already works because:
```typescript
const allClips = useClipStore.getState().clips; // ✅ Already reads from Zustand
```

The issue was that after retry succeeds, `selectedClip` didn't update. Now it will because it's a selector.

---

## Part 3: ClipRecordScreen Refactor

### Step 3.1: Remove contentBlocks Prop

**File**: [ClipRecordScreen.tsx](ClipRecordScreen.tsx)

**Location**: Line 40-51

**BEFORE:**
```typescript
interface ClipRecordScreenProps {
  state?: RecordScreenState;
  contentBlocks?: ContentBlock[];  // ❌ Zombie prop - never passed
  selectedClip?: Clip;
  pendingClips?: PendingClip[];
  onBackClick?: () => void;
  onNewClipClick?: () => void;
  onNetworkChange?: (status: 'online' | 'offline') => void;
  onTranscribeClick?: (id: string) => void;
  onDeletePendingClick?: (id: string) => void;
  className?: string;
}
```

**AFTER:**
```typescript
interface ClipRecordScreenProps {
  state?: RecordScreenState;
  // ❌ REMOVED: contentBlocks - never passed, always empty
  selectedClip?: Clip;
  pendingClips?: PendingClip[];
  onBackClick?: () => void;
  onNewClipClick?: () => void;
  onNetworkChange?: (status: 'online' | 'offline') => void;
  onTranscribeClick?: (id: string) => void;
  onDeletePendingClick?: (id: string) => void;
  className?: string;
}
```

---

### Step 3.2: Remove contentBlocks from Destructuring

**Location**: Line 57-68

**BEFORE:**
```typescript
export const ClipRecordScreen: React.FC<ClipRecordScreenProps> = ({
  state = 'recording',
  contentBlocks = [],  // ❌ Remove
  selectedClip,
  pendingClips = [],
  onBackClick,
  onNewClipClick,
  onNetworkChange,
  onTranscribeClick,
  className = ''
}) => {
```

**AFTER:**
```typescript
export const ClipRecordScreen: React.FC<ClipRecordScreenProps> = ({
  state = 'recording',
  // ❌ REMOVED: contentBlocks
  selectedClip,
  pendingClips = [],
  onBackClick,
  onNewClipClick,
  onNetworkChange,
  onTranscribeClick,
  className = ''
}) => {
```

---

### Step 3.3: Fix displayText Memo

**Location**: Line 90-122

**CURRENT (BROKEN):**
```typescript
const displayText = useMemo(() => {
  if (!selectedClip) {
    return contentBlocks;  // ❌ Always empty
  }

  const isFirstView = !displayedClipsRef.current.has(selectedClip.id);

  if (isFirstView && selectedClip.content) {
    displayedClipsRef.current.add(selectedClip.id);
  }

  if (selectedClip.currentView === 'raw') {
    return [{
      id: 'raw-view',
      text: selectedClip.rawText || selectedClip.content || '',
      animate: isFirstView
    }];
  } else {
    return [{
      id: 'formatted-view',
      text: selectedClip.formattedText || selectedClip.content || '',
      animate: isFirstView
    }];
  }
}, [selectedClip, contentBlocks]);
```

**FIXED (PROPER ANIMATION DETECTION):**
```typescript
// Track previous content to detect changes (for animation)
const prevContentRef = React.useRef<string>('');

const displayText = useMemo(() => {
  if (!selectedClip) {
    return []; // ✅ Empty array instead of contentBlocks
  }

  // Determine which text to show
  const currentText = selectedClip.currentView === 'raw'
    ? selectedClip.rawText || selectedClip.content || ''
    : selectedClip.formattedText || selectedClip.content || '';

  // Detect if content changed (for animation)
  const prevContent = prevContentRef.current;
  const contentChanged = currentText !== prevContent && currentText.length > 0;

  // Update ref for next comparison
  prevContentRef.current = currentText;

  // Animate when:
  // 1. First time showing content (prev was empty, now has content)
  // 2. Content changed (formatting completed, or append added text)
  const shouldAnimate = contentChanged && prevContent.length === 0;

  if (selectedClip.currentView === 'raw') {
    return [{
      id: 'raw-view',
      text: currentText,
      animate: shouldAnimate
    }];
  } else {
    return [{
      id: 'formatted-view',
      text: currentText,
      animate: shouldAnimate
    }];
  }
}, [selectedClip]);
```

**Why this works:**
1. **First transcription**: `prevContent = ''`, `currentText = rawText` → animate
2. **Formatting completes**: `prevContent = rawText`, `currentText = formattedText` → NO animate (content already visible)
3. **Append mode**: `prevContent = 'Hello'`, `currentText = 'Hello\n\nWorld'` → NO animate (use shouldAnimate logic)
4. **Pending → transcribed**: `prevContent = ''`, `currentText = transcribedText` → animate

**For append mode to animate properly**, update logic:
```typescript
// Animate when:
// 1. First time showing content (prev was empty, now has content)
// 2. Append mode: text got longer (new content added)
const textGotLonger = currentText.length > prevContent.length && prevContent.length > 0;
const shouldAnimate = (contentChanged && prevContent.length === 0) || textGotLonger;
```

---

### Step 3.4: Remove displayedClipsRef (No longer needed)

**Location**: Line 74

**REMOVE:**
```typescript
const displayedClipsRef = React.useRef<Set<string>>(new Set());
```

**Why:** We're now using `prevContentRef` to track content changes, which is more accurate.

---

## Part 4: Testing the Complete Loop

### Test 1: Pending Clip → Transcribed Clip (Auto-Retry)

**Steps:**
1. Go offline (disconnect WiFi)
2. Record audio (3+ seconds)
3. Click Done
4. **EXPECTED**: Pending clip created, shows "Waiting to transcribe" spinner
5. Go online (reconnect WiFi)
6. **EXPECTED**:
   - Spinner changes to transcribing
   - Text appears with slide + blur animation
   - Status changes to null (complete)

**Why this now works:**
```typescript
// Auto-retry updates Zustand:
updateClip(clip.id, {
  rawText: rawText,
  content: rawText,
  status: 'formatting'
});

// ClipMasterScreen selector automatically picks up change:
const selectedClip = useClipStore(state =>
  currentClipId ? state.clips.find(c => c.id === currentClipId) : null
);
// ✅ Component re-renders with new data

// ClipRecordScreen sees new selectedClip:
const currentText = selectedClip.formattedText || selectedClip.content || '';
// prevContentRef.current was '', now has text
// shouldAnimate = true → animation plays
```

---

### Test 2: Append Mode Shows New Text

**Steps:**
1. Record first clip (say "Hello")
2. Click Done → See "Hello" text
3. Click Record again (append mode)
4. Record second clip (say "World")
5. Click Done

**EXPECTED:**
- Text shows "Hello\n\nWorld" immediately (rawText)
- After formatting, shows formatted version
- NO pending clip created

**Why this now works:**
```typescript
// handleDoneClick append mode now updates content:
updateClip(currentClipId, {
  rawText: existingClip.rawText + '\n\n' + rawText,
  content: existingClip.content + '\n\n' + rawText, // ← NEW
  status: 'formatting'
});

// Selector picks up change:
const selectedClip = useClipStore(state => ...);
// ✅ Component re-renders with new content

// ClipRecordScreen sees updated text:
const currentText = 'Hello\n\nWorld';
// prevContentRef.current was 'Hello'
// Text got longer → shouldAnimate = true (if using append animation)
```

---

### Test 3: Second Append Recording Visible

**Steps:**
1. Record first clip
2. Append second recording
3. **VERIFY**: Both recordings visible as one combined text

**Current behavior:** Working now because `content` is updated immediately

---

### Test 4: State Changes Show Properly

**States to test:**

**ClipHomeScreen:**
- Pending clip: Shows spinner icon
- Transcribing: Spinner animates
- Failed: Shows error icon
- Completed: No icon

**ClipRecordScreen:**
- Recording: Empty content area
- Processing: Shows "processing" state
- Complete: Shows transcribed text
- Offline: Shows pending clips

**Why this now works:**
```typescript
// Selector always has latest status:
const selectedClip = useClipStore(state =>
  currentClipId ? state.clips.find(c => c.id === currentClipId) : null
);

// Any status change in Zustand → selector re-runs → component re-renders
```

---

## Part 5: Migration Checklist

### Phase 1: ClipMasterScreen.tsx
- [ ] Line ~147: Remove `const [selectedClip, setSelectedClip] = useState(...)`
- [ ] Line ~147: Add `const selectedClip = useClipStore(state => ...)`
- [ ] Search `setSelectedClip` → Remove ALL ~15 occurrences
- [ ] Line ~541: Add `content` update in append mode
- [ ] Line ~974: Update comment in formatTranscriptionInBackground
- [ ] Save file

### Phase 2: ClipRecordScreen.tsx
- [ ] Line 42: Remove `contentBlocks?: ContentBlock[]` from interface
- [ ] Line 59: Remove `contentBlocks = []` from destructuring
- [ ] Line 74: Remove `displayedClipsRef` ref
- [ ] Line 90: Add `prevContentRef` ref
- [ ] Line 91-122: Replace `displayText` memo with new implementation
- [ ] Save file

### Phase 3: Testing
- [ ] Test: First recording shows with animation
- [ ] Test: Append mode shows combined text immediately
- [ ] Test: Offline → Online transition animates properly
- [ ] Test: Second append recording visible
- [ ] Test: State changes (pending → transcribing → complete) work
- [ ] Test: Toggle raw/formatted view (no animation)
- [ ] Test: Navigate between clips (no animation on re-view)
- [ ] Test: Error cases still show error toast

---

## Part 6: Why This is Industry Standard

### React Query Example
```typescript
const { data: user } = useQuery('user', fetchUser);
// ✅ Data lives in cache, component subscribes
```

### Redux Toolkit Example
```typescript
const todos = useSelector(state => state.todos);
// ✅ Data lives in store, component subscribes
```

### Our Zustand Implementation (After Refactor)
```typescript
const selectedClip = useClipStore(state =>
  currentClipId ? state.clips.find(c => c.id === currentClipId) : null
);
// ✅ Data lives in Zustand, component subscribes
```

**All follow the same pattern: Subscribe to source of truth, never duplicate data in local state.**

---

## Part 7: React Native / Expo Compatibility

**No changes needed for Expo!** Zustand works identically in React Native.

**Only change needed (already in clipStore.ts):**
```typescript
// Web (current):
import { persist, createJSONStorage } from 'zustand/middleware';

export const useClipStore = create<ClipStore>()(
  persist(
    (set, get) => ({ /* ... */ }),
    {
      name: 'clipperstream-storage',
      storage: createJSONStorage(() => sessionStorage) // ← Web
    }
  )
);

// React Native (future):
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useClipStore = create<ClipStore>()(
  persist(
    (set, get) => ({ /* ... */ }),
    {
      name: 'clipperstream-storage',
      storage: createJSONStorage(() => AsyncStorage) // ← RN
    }
  )
);
```

**This refactor makes Expo migration EASIER, not harder.**

---

## Part 8: What Gets Fixed

| Bug | Root Cause | How Selector Fixes It |
|-----|-----------|----------------------|
| Append mode doesn't show text | `selectedClip` not updated after Zustand change | Selector auto-updates when Zustand changes |
| Animation doesn't play | Detects first view of clip, not content appearing | `prevContentRef` detects content changes |
| Pending → transcribed doesn't animate | `selectedClip` stale after auto-retry | Selector picks up auto-retry changes |
| Second append not visible | Same as first append bug | Same fix as first append |
| State changes don't show | `selectedClip.status` stale | Selector always has latest status |

---

## Part 9: Performance Impact

**Question**: Does the selector re-run on every Zustand update?

**Answer**: Only when `clips` array changes.

**How Zustand optimizes:**
```typescript
const selectedClip = useClipStore(state =>
  currentClipId ? state.clips.find(c => c.id === currentClipId) : null
);

// Zustand compares shallow equality:
// If clips array unchanged → selector doesn't re-run
// If clips array changed → selector re-runs, finds clip
// Component only re-renders if selectedClip reference changed
```

**Result**: More efficient than manual sync, because:
- No wasted re-renders when unrelated clips change
- No risk of forgetting to sync
- Zustand handles optimization automatically

---

## Part 10: Summary

**What we're doing:**
1. Removing dual state (selectedClip local state)
2. Using Zustand selectors (industry standard)
3. Removing zombie props (contentBlocks)
4. Fixing animation detection (content-based, not clip-based)
5. Adding content update in append mode (consistency)

**What we're NOT changing:**
- Zustand store structure
- SessionStorage persistence
- Component hierarchy
- Event handlers
- Styling/CSS

**Effort**: 2-3 hours
**Risk**: Low (incremental changes, easy to test)
**Benefit**: All bugs fixed, industry standard architecture, ready for Expo

---

**Prepared By**: Claude Sonnet 4.5
**Date**: December 30, 2025
**Status**: ✅ READY FOR IMPLEMENTATION
**Priority**: HIGH - Completes Phase 4 → Phase 5 transition
