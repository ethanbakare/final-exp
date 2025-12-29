# 031 - Gap Analysis: 030 Rewrite Missing Features

**Date**: December 29, 2025
**Purpose**: Identify all UI/UX nuances missing from 030_REWRITE_ARCHITECTURE.md
**Reference Files**: ClipOfflineScreen.tsx, ClipMasterScreen.tsx
**Status**: 🟡 REVIEW REQUIRED - Gaps found before implementation

---

## EXECUTIVE SUMMARY

030_REWRITE_ARCHITECTURE.md provides excellent core architecture but **misses critical UI/UX features** that users interact with daily. This document catalogs all missing nuances to ensure a seamless rewrite.

### Missing Feature Categories:
1. ❌ **Toast Notifications** (2 types)
2. ❌ **Context Menu Actions** (3 features: rename, copy, delete)
3. ❌ **Status Text Display Mapping** (user-facing labels)
4. ❌ **Retry UI Components** (countdown timer, manual retry)
5. ❌ **Animation Behavior Specs** (when to animate vs. instant)
6. ❌ **Delete Animations** (clip removal transitions)
7. ❌ **Scroll Behavior** (VN list auto-scroll)
8. ⚠️ **Copy Text Functionality** (needs verification)

---

## GAP 1: Toast Notifications

### What's Missing
030 doesn't mention toast/notification system for user feedback.

### Current Implementation Pattern
From ClipMasterScreen.tsx (assumed - needs verification):

**Toast 1: Offline Recording Saved**
```typescript
// Triggered when: User finishes recording in offline mode
// Message: "Audio saved for later translation"
// Location: After audio stored in IndexedDB

const handleOfflineRecording = async ({ audioId, duration }) => {
  await storeAudioInIndexedDB(audioId, audioBlob);

  // Create pending child clip
  const pendingClip = { /* ... */ };
  addClip(pendingClip);

  // 🔔 SHOW TOAST
  showToast("Audio saved for later translation", "info");
};
```

**Toast 2: Text Copied**
```typescript
// Triggered when: User clicks copy button OR formatting completes
// Message: "Text copied to clipboard"
// Location: After successful clipboard write

const handleCopyClick = async () => {
  await navigator.clipboard.writeText(clip.formattedText);

  // 🔔 SHOW TOAST
  showToast("Text copied to clipboard", "success");
};
```

### Required Addition to 030

**Section to Add**: Part 5 (UI Components) - add new subsection "5.6 Toast Notification System"

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
3. `formatTranscriptionInBackground()` completion - "Text copied to clipboard" (auto-copy behavior)

---

## GAP 2: Context Menu Actions (Triple Dots)

### What's Missing
030 doesn't document the context menu (triple dots) with rename/copy/delete actions.

### Current Implementation Pattern
From ClipOfflineScreen.tsx (lines 600-650, assumed structure):

**Context Menu Structure**
```typescript
// Triggered by: Clicking triple dots icon on clip
// Actions:
// 1. Rename clip
// 2. Copy text to clipboard
// 3. Delete clip (with animation)

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

### Required Addition to 030

**Section to Add**: Part 5 (UI Components) - add "5.7 Context Menu Component"

**Features to Implement**:

1. **Rename Functionality**:
   - Opens modal/prompt for new title
   - Updates `clip.title` in Zustand
   - Closes menu after action

2. **Copy Text**:
   - Copies `formattedText` (preferred) or `rawText` fallback
   - Shows "Text copied to clipboard" toast
   - Closes menu

3. **Delete Clip**:
   - Parent clips: Delete parent + all children
   - Child clips: Delete only that child
   - Triggers delete animation (see Gap 6)
   - Removes from Zustand store
   - Closes menu

**UI Location**: Every clip in list should have triple dots icon in top-right corner

---

## GAP 3: Status Text Display Mapping

### What's Missing
030 defines `ClipStatus` enum but doesn't map status values to user-facing display text.

### Current Implementation Pattern
From ClipOfflineScreen.tsx (lines 33-43, 200-215):

```typescript
// Status enum (in 030):
type ClipStatus = null | 'pending-child' | 'transcribing' | 'formatting' | 'pending-retry' | 'failed';

// Display text mapping (MISSING from 030):
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
```

### Additional: Active Request Indicator

```typescript
// Controls spinner animation (only during HTTP request)
const getIsActiveRequest = (status: ClipStatus): boolean => {
  return status === 'transcribing' || status === 'formatting';
};
```

**Usage**: Spinner icon only animates when `isActiveRequest === true`, stays static during `'pending-retry'` wait periods.

### Required Addition to 030

**Section to Add**: Part 5 (UI Components) - add "5.8 Status Display Helpers"

**Implementation**:
1. Create `getStatusDisplayText()` helper function
2. Create `getIsActiveRequest()` for spinner animation control
3. Document where to display status text (below clip title, or in place of content during processing)

---

## GAP 4: Retry UI Components

### What's Missing
030 mentions retry logic but not the UI components for retry feedback.

### Current Implementation Pattern
From ClipOfflineScreen.tsx (lines 324, 492-495):

**Retry Countdown Timer**
```typescript
// Display: "Next retry in: 5s" during pending-retry status
// Updates every second

const RetryCountdown = ({ clipId }: { clipId: string }) => {
  const clip = useClipStore(state => state.getClipById(clipId));
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (clip.status !== 'pending-retry') return;

    // Calculate seconds until next retry
    const nextRetryTime = clip.nextRetryTime; // Need to add this field to Clip interface

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

**Manual Retry Trigger**
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

### Required Addition to 030

**Section to Add**: Part 5 (UI Components) - add "5.9 Retry UI Components"

**New Fields for Clip Interface**:
```typescript
interface Clip {
  // ... existing fields

  // Retry tracking
  nextRetryTime?: number;  // Unix timestamp for next retry
  retryCount?: number;     // Current attempt count (for interval calculation)
}
```

**Implementation Notes**:
1. Countdown updates every second during `'pending-retry'` status
2. Tapping a pending-retry clip skips wait and retries immediately
3. Countdown only shows during interval-based retries (not during 3 rapid attempts)

---

## GAP 5: Animation Behavior Specifications

### What's Missing
030 mentions "typing animation" but doesn't specify when to animate vs. when to show instantly.

### Current Implementation Pattern
From ClipOfflineScreen.tsx (lines 74-93, 329-332):

**Animation Rules**:

```typescript
interface ContentBlock {
  id: string;
  text: string;
  animate: boolean;  // ← Key field
}

// RULE 1: New Recordings → Animate
const getNewRecordingContentBlocks = (formattedText: string): ContentBlock[] => {
  return [{
    id: `block-${Date.now()}`,
    text: formattedText,
    animate: true  // ✅ Typing animation for new recordings
  }];
};

// RULE 2: Appending to Existing → No Animation
const getAppendContentBlocks = (existingText: string, newText: string): ContentBlock[] => {
  const combinedText = existingText + "\n\n" + newText;

  return [{
    id: 'combined-full',
    text: combinedText,
    animate: false  // ✅ Instant display for appends
  }];
};
```

**Documentation from ClipOfflineScreen.tsx (lines 329-332)**:
```
Animation Behavior:
• New Recording: Text slides in with fade-in animation on first transcription (animate: true)
• Append to Existing: New text appears instantly below existing content (animate: false)
```

### Required Addition to 030

**Section to Update**: Part 6 (Animation Restoration) - add animation rules subsection

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

---

## GAP 6: Delete Animations

### What's Missing
030 doesn't mention delete animations when removing clips.

### Current Implementation Pattern
From ClipMasterScreen.tsx (assumed implementation):

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

**CSS Animation** (assumed):
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

### Required Addition to 030

**Section to Add**: Part 6 (Animation Restoration) - add "6.4 Delete Animation"

**Implementation Steps**:
1. Add local state to track deleting clip ID
2. Apply 'deleting' CSS class before removal
3. Wait for animation completion (300ms)
4. Remove from Zustand store
5. Handle parent deletion (delete all children with staggered animation)

---

## GAP 7: Scroll Behavior

### What's Missing
030 doesn't specify scroll behavior for the clip list.

### Expected Behavior
From ClipOfflineScreen.tsx and general UX patterns:

**Auto-Scroll Rules**:

1. **New Recording Created**:
   - Scroll to top of list (newest recordings at top)
   - Smooth scroll animation

2. **User Clicks Into Clip**:
   - No auto-scroll (maintain current position)
   - User navigated intentionally

3. **Background Processing Completes**:
   - No auto-scroll (don't interrupt user)
   - User may be viewing/reading a clip

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

### Required Addition to 030

**Section to Add**: Part 5 (UI Components) - add "5.10 Scroll Behavior"

**Rules to Document**:
1. New recording: Scroll to top
2. User navigation: No scroll
3. Background updates: No scroll

---

## GAP 8: Copy Text Functionality Details

### What's Missing
030 mentions copy button but not the full copy text behavior.

### Current Implementation Pattern
Multiple ways to copy text:

**Method 1: Copy Button in Navbar**
```typescript
// When: User viewing a completed clip
// Action: Copy formatted text to clipboard
// Feedback: "Text copied to clipboard" toast

const handleCopyButtonClick = async () => {
  const clip = useClipStore.getState().getActiveClip();
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

### Text Priority Order
When copying, use this fallback order:
1. `formattedText` (preferred - formatted version)
2. `rawText` (fallback - transcription only)
3. `content` (legacy field)

### Required Addition to 030

**Section to Add**: Part 5 (UI Components) - add "5.11 Copy Text Behavior"

**Implementation Requirements**:
1. Document all three copy methods
2. Specify text priority order (formatted > raw > content)
3. Ensure toast shows for all copy methods
4. Handle edge case: No text available (show error toast)

---

## GAP 9: Retry Pattern Documentation (Needs Clarification)

### What's in 030
030 mentions retry logic but doesn't document the exact retry intervals.

### From ClipOfflineScreen.tsx (line 324)
```
Retry Pattern: 3 rapid attempts (~3 min spinning), then interval-based: 1min → 2min → 4min → 5min (cycle repeats).
Icon only spins during active HTTP requests, stays static during wait periods.
```

### Breakdown

**Phase 1: Rapid Retries (0-3 minutes)**
- Attempt 1: Immediate (0s wait)
- Attempt 2: After 60s wait
- Attempt 3: After 60s wait
- Total: 3 attempts over ~3 minutes
- UI: Spinner animating during attempts, static during waits

**Phase 2: Interval-Based Retries (After Phase 1)**
- Attempt 4: After 1 min wait → status: 'pending-retry'
- Attempt 5: After 2 min wait → status: 'pending-retry'
- Attempt 6: After 4 min wait → status: 'pending-retry'
- Attempt 7+: After 5 min wait (repeats) → status: 'pending-retry'
- UI: Spinner static, countdown showing "Next retry in: Xs"

### Required Addition to 030

**Section to Update**: Part 3.6 (useAutoRetry Hook) - add detailed retry interval table

**Implementation**:
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

## GAP 10: Parent/Child Display Logic Edge Cases

### What's Missing
030 describes parent/child structure but doesn't fully specify display edge cases.

### Edge Cases to Handle

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

const getParentDisplayContent = (parent: Clip): ContentBlock[] => {
  const children = useClipStore.getState().getChildClips(parent.id);

  return children.map(child => {
    if (child.status !== null) {
      // Still processing - show pending title + status
      return {
        id: child.id,
        text: `${child.pendingClipTitle} - ${getStatusDisplayText(child.status)}`,
        animate: false
      };
    }

    // Completed - show formatted text
    return {
      id: child.id,
      text: child.formattedText || child.rawText,
      animate: false
    };
  });
};
```

**Edge Case 3: Multiple Children with Mixed Statuses**
```typescript
// Scenario: Parent has 4 children, 2 completed, 2 still processing
// Expected: Show completed content + pending placeholders

const getParentContent = (parentId: string): ContentBlock[] => {
  const children = useClipStore.getState().getChildClips(parentId)
    .sort((a, b) => a.createdAt - b.createdAt); // Chronological order

  return children.map(child => {
    const displayText = child.status === null
      ? (child.formattedText || child.rawText)
      : `${child.pendingClipTitle} - ${getStatusDisplayText(child.status)}`;

    return {
      id: child.id,
      text: displayText,
      animate: false
    };
  });
};
```

### Required Addition to 030

**Section to Add**: Part 5.3 (ClipRecordScreen Display Logic) - add "Edge Cases" subsection

**Edge Cases to Document**:
1. Parent with no children → Don't display
2. Parent clicked while child processing → Show pending title + status
3. Multiple children with mixed statuses → Show completed + pending placeholders in chronological order

---

## GAP 11: Error Handling UI

### What's Missing
030 mentions `'failed'` status but not the UI for failed clips.

### Current Implementation Pattern (Assumed)

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

### Required Addition to 030

**Section to Add**: Part 5 (UI Components) - add "5.12 Error Display"

**Implementation Requirements**:
1. Failed clip display with error message
2. Manual retry button for failed clips
3. Error toast for unexpected errors
4. Clear visual distinction for failed clips (red border, warning icon)

---

## SUMMARY OF ALL GAPS

### Critical (Must Implement Before Launch)
1. ✅ **Toast Notifications** - User feedback essential
2. ✅ **Context Menu** - Core feature (rename, copy, delete)
3. ✅ **Status Text Mapping** - User needs to see what's happening
4. ✅ **Animation Behavior** - UX quality (animate vs. instant)
5. ✅ **Copy Text Functionality** - Primary user action

### Important (Should Implement in 030)
6. ✅ **Retry UI Components** - Countdown timer, manual retry
7. ✅ **Delete Animations** - UX polish
8. ✅ **Scroll Behavior** - UX quality
9. ✅ **Error Handling UI** - Users need to see failures
10. ✅ **Parent/Child Edge Cases** - Prevent UI bugs

### Nice to Have (Can Defer to 040)
11. ⚠️ **Retry Pattern Clarification** - Already in 030, just needs better docs

---

## RECOMMENDED ADDITIONS TO 030

### New Sections to Add:

**Part 5: UI Components** (expand with):
- 5.6 Toast Notification System
- 5.7 Context Menu Component
- 5.8 Status Display Helpers
- 5.9 Retry UI Components
- 5.10 Scroll Behavior
- 5.11 Copy Text Behavior
- 5.12 Error Display

**Part 6: Animation Restoration** (expand with):
- 6.4 Delete Animation
- 6.5 Animation Rules (when to animate vs. instant)

**Part 5.3: ClipRecordScreen Display Logic** (expand with):
- Edge Cases subsection

### New Fields for Clip Interface:

```typescript
interface Clip {
  // ... existing fields from 030

  // Retry tracking (for UI)
  nextRetryTime?: number;      // Unix timestamp for countdown
  retryCount?: number;         // Current attempt number

  // Error handling
  transcriptionError?: string; // Error message for failed status
}
```

---

## NEXT STEPS

### Before Implementing 030:

1. **Review this gap analysis document** with user
2. **Confirm which gaps are critical** vs. nice-to-have
3. **Update 030_REWRITE_ARCHITECTURE.md** with missing sections
4. **Create implementation checklist** including all gaps
5. **Begin implementation** only after 030 is complete with all gaps filled

### Implementation Priority:

**Phase 1 (Core Data Flow)** - As per 030
- Zustand store
- Hooks (no global state)
- ClipMasterScreen orchestration
- Basic UI (read from Zustand)

**Phase 2 (UI Nuances)** - Add missing features
- Toast system
- Context menu
- Status text mapping
- Animation behavior
- Copy text functionality

**Phase 3 (Polish)** - UX improvements
- Retry UI components
- Delete animations
- Scroll behavior
- Error handling UI
- Edge cases

---

**Prepared By**: Claude Sonnet 4.5
**Date**: December 29, 2025
**Status**: 🟡 REVIEW REQUIRED - User approval needed before updating 030
