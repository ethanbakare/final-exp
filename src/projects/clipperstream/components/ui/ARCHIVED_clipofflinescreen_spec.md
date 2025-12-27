# ClipOfflineScreen.tsx - Visual Specification

## Overview

This is a **showcase component** for visualizing offline recording states, similar to how:
- `ClipMasterScreen.tsx` has D1/D3/D4 toggles
- `ClipHomeScreen.tsx` has empty/default toggles

**File Location:** `/src/pages/clipperstream/showcase/ClipOfflineScreen.tsx`
**Display Location:** `clipscreencomponents.tsx` (showcase page)

---

## Toggle States

### Main Toggles (Affects All Views)

| Toggle | State | Description |
|--------|-------|-------------|
| **Waiting** | `waiting` | Clip saved, waiting for network |
| **Transcribing** | `transcribing` | Currently attempting transcription |
| **Done** | `done` | Transcription complete |

### Secondary Toggle (Independent)

| Toggle | State | Description |
|--------|-------|-------------|
| **Retry Mode** | `retry` | Toggles between transcribing and failed/retry |

When Retry Mode is ON:
- "Transcribing" shows spinner
- Toggle shows "Failed - Tap to Retry"

---

## View 1: Home Screen with Pending Clips

### Layout
Standard ClipHomeScreen layout with clip list, but 1-2 clips have pending status.

### Toggle Behavior

**Waiting State:**
- Clip list shows normal clips + 1-2 with pending indicator
- Pending clip title: "Recording 01" (cannot use AI title - offline)
- Subtext: "Waiting to transcribe"
- Icon: Static transcribe icon

**Transcribing State:**
- Same layout
- Pending clip subtext: "Transcribing..."
- Icon: Spinning transcribe icon
- **Animation:** Use morph animation from `clipmorphingbuttons.tsx` (Close→Copy swap)

**Done State:**
- Pending clip disappears from pending state
- Title changes: "Recording 01" → "AI Generated Title"
- Subtext: Normal date format
- **Animation:** Fade transition on title

### Reference Components
- `cliplist.tsx` - ClipListItem with pending state support
- `clipmorphingbuttons.tsx` - Morph animation between states

---

## View 2: Record Screen - New Clip Only

### Layout
Empty record screen with ONE pending clip (no existing text).

### Toggle Behavior

**Waiting State:**
- ClipOffline component visible
- Title: "Clip 001" (sequential naming)
- Time: Duration from recording (e.g., "0:45")
- Status indicator: "Waiting"
- Icon: Static

**Transcribing State:**
- Same ClipOffline component
- Status indicator: "Transcribing"
- Icon: **Spinning** (swap static icon for spinning version)

**Done State:**
- ClipOffline disappears
- Text slides in with fade animation
- **Animation:** First transcription animation (fade + slide up)
- Use existing animation from ClipRecordScreen for first text appearance

### Reference
- Current first-transcription animation in `ClipRecordScreen.tsx`

---

## View 3: Record Screen - Append to Existing

### Layout
Record screen with **existing text content** + ONE pending clip below.

### Toggle Behavior

**Waiting State:**
- Existing text visible at top
- ClipOffline component below with gap (10px per existing spec)
- Title: "Clip 001"
- Time: Duration
- Status: "Waiting"

**Transcribing State:**
- Same layout
- ClipOffline spinner active

**Done State:**
- ClipOffline disappears
- NEW text appends below existing text
- **Animation:** Append animation (NOT slide-in, instant appearance)
- Per existing append behavior - no fade, just appears

### Reference
- Current append animation logic in `ClipMasterScreen.tsx`

---

## View 4: Retry Flow (Toggle)

### Purpose
Show failure and retry states. Independent toggle.

### Layout
Record screen with ClipOffline in failed state.

### Toggle Behavior (2-state toggle)

**Transcribing State:**
- Normal transcribing with spinner

**Failed/Retry State:**
- Spinner stops
- Status: "Failed - Tap to Retry"
- Retry icon visible
- Tapping triggers retry → back to transcribing spinner

---

## Animation Specifications

### 1. Icon Morph (Waiting → Transcribing)
- **Reference:** `clipmorphingbuttons.tsx` Close→Copy animation
- **Duration:** 200ms
- **Type:** Crossfade with slight scale

### 2. Text Slide-In (First Transcription)
- **Reference:** Current ClipRecordScreen first content animation
- **Duration:** 300ms
- **Type:** Fade + translateY from 10px

### 3. Text Append (Existing Content)
- **Reference:** Current append behavior
- **Duration:** Instant (0ms)
- **Type:** No animation, just appears

### 4. Title Fade (Recording 01 → AI Title)
- **Duration:** 200ms
- **Type:** Opacity fade

---

## Component Structure

```
ClipOfflineScreen.tsx
├── Toggle Buttons (top)
│   ├── [Waiting] [Transcribing] [Done]
│   └── [Retry Mode Toggle]
│
├── View Container
│   ├── View 1: HomeScreen variant
│   │   └── ClipHomeScreen with modified clips
│   │
│   ├── View 2: RecordScreen (New Clip)
│   │   └── ClipRecordScreen with pendingClip
│   │
│   └── View 3: RecordScreen (Append)
│       └── ClipRecordScreen with content + pendingClip
│
└── (View 4 controlled by Retry toggle within Views 2/3)
```

## Naming Convention - Detailed Logic

There are **TWO separate naming systems** that must be tracked independently:

### 1. Clip File Names (Container Level)
These are the actual clip file names shown in the home screen list.

| Naming | Format | Example |
|--------|--------|---------|
| **Offline placeholder** | "Recording XX" | "Recording 01", "Recording 02" |
| **After transcription** | AI-generated title | "Meeting Notes Summary" |

**Rules:**
- Only assign "Recording XX" to **NEW** clip files created while offline
- If clip already has transcribed text AND a generated title, **NEVER** change the name
- Appending offline audio to existing clip does NOT change the clip file name

### 2. ClipOffline Component Names (Inside a Clip File)
These are individual pending audio recordings within a clip file.

| Naming | Format | Example |
|--------|--------|---------|
| **While pending** | "Clip XXX" | "Clip 001", "Clip 002" |
| **After transcription** | Disappears (becomes text) | N/A |

**Rules:**
- Each ClipOffline component gets sequential name
- Counter is based on currently pending ClipOffline components across entire app
- After transcription, the component disappears and becomes text

---

## Tracking Counters

### Counter 1: Pending Clip Files
Tracks offline clip files that haven't been transcribed yet.

```typescript
// Count of pending clip FILES (shown in home screen)
const pendingClipFileCount = clips.filter(c => 
  c.audioId && 
  c.status === 'pending' && 
  !c.content  // No transcribed content
).length;

// Next recording name
const nextRecordingName = `Recording ${(pendingClipFileCount + 1).toString().padStart(2, '0')}`;
// Result: "Recording 01", "Recording 02", etc.
```

### Counter 2: Pending ClipOffline Components
Tracks pending audio recordings inside clip files.

```typescript
// Count of all pending ClipOffline components
const pendingComponentCount = clips.reduce((count, clip) => {
  if (clip.audioId && clip.status) {
    return count + 1;  // Each pending clip = 1 component
  }
  return count;
}, 0);

// Next clip name
const nextClipName = `Clip ${(pendingComponentCount + 1).toString().padStart(3, '0')}`;
// Result: "Clip 001", "Clip 002", etc.
```

---

## Naming Decision Tree

```
Recording Done (offline or failed) →
│
├── Is this a NEW clip file (no existing content)?
│   ├── YES → Assign "Recording XX" as file name
│   │         AND create ClipOffline with "Clip XXX"
│   │
│   └── NO → Is the clip file title already AI-generated?
│       ├── YES → DO NOT change file name
│       │         Only create ClipOffline with "Clip XXX"
│       │
│       └── NO → Keep existing placeholder name
│                Only create ClipOffline with "Clip XXX"
│
After Transcription →
├── Clip File: Replace "Recording XX" with AI title
└── ClipOffline: Component disappears, text appears
```

---

## Critical Rule: NEVER Override Existing Titles

| Scenario | Current State | Action |
|----------|--------------|--------|
| New clip offline | No title | Assign "Recording 01" |
| Append to empty pending clip | "Recording 01" | Keep "Recording 01" |
| Append to transcribed clip | "Meeting Notes" (AI) | **KEEP "Meeting Notes"** |
| Any transcription completes | "Recording 01" | Replace with AI title |

**The ONLY time a clip file gets "Recording XX" is when it's created NEW while offline.**

---

## Storage Requirements

Add to Clip interface:
```typescript
interface Clip {
  // ... existing fields
  pendingName?: string;  // "Recording 01" - only for offline-created clips
  // title field already exists for AI-generated titles
}
```

When to set `pendingName`:
- Only when creating NEW clip while offline
- Clear after transcription + AI title generation

## Data Flow

### Props to ClipOffline
```typescript
interface ClipOfflineShowcaseProps {
  title: string;           // "Clip 001" or "Recording 01"
  time: string;            // "0:45"
  status: 'waiting' | 'transcribing' | 'failed';
  onRetryClick?: () => void;
}
```

### State Management in Showcase
```typescript
const [currentState, setCurrentState] = useState<'waiting' | 'transcribing' | 'done'>('waiting');
const [isRetryMode, setIsRetryMode] = useState(false);
```

---

## Implementation Steps

1. Create `ClipOfflineScreen.tsx` in `/src/pages/clipperstream/showcase/`
2. Add toggle buttons for state switching
3. Create 3 view variants (home, new clip, append)
4. Implement animations referencing existing components
5. Add to `clipscreencomponents.tsx` showcase page
6. Test all state transitions
