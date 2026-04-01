# Complete Application Flow - Clipperstream
## Comprehensive System Understanding

**Date**: December 31, 2025
**Purpose**: Document complete understanding of application architecture, data flow, and all states

---

## Core Architecture

### Data Model - The Clip Object

```typescript
interface Clip {
  id: string;
  title: string;                // "Recording 01", "Recording 02", etc.
  date: string;                 // "Dec 31, 2025"
  createdAt: number;            // Timestamp

  // Content fields (the heart of the system)
  rawText: string;              // Unformatted transcription from API
  formattedText: string;        // AI-formatted text (paragraphs, punctuation)
  content: string;              // What shows on screen (could be raw or formatted)

  // State tracking
  status: 'formatting' | 'transcribing' | 'pending' | 'pending-child' | 'failed' | null;
  currentView: 'raw' | 'formatted';  // User preference for display

  // Offline/pending fields
  audioId?: string;             // Link to IndexedDB audio
  duration?: string;            // "0:03"
  pendingClipTitle?: string;    // "Clip 001", "Clip 002"
  parentId?: string;            // For child clips
}
```

### The Three Critical Fields

**1. `rawText`** - Transcription API output
- Direct output from speech-to-text API
- No formatting, no paragraphs
- Used for: raw view toggle, clipboard fallback

**2. `formattedText`** - Formatted version
- Processed by AI formatting API
- **CRITICAL**: API receives context when appending
- Decides whether to continue paragraph or start new one
- Used for: formatted view (default), clipboard

**3. `content`** - Display field
- **THIS IS WHAT SHOWS ON SCREEN**
- Can be empty, raw text, or formatted text
- Controls when animation triggers (empty → text = animate)

---

## Complete Flow Diagrams

### Flow 1: First Recording (Online, New Clip)

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Click Record → Speak → Click Done                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. RECORDING CAPTURE                                             │
│    - Audio recorded via MediaRecorder                           │
│    - Blob saved in memory                                       │
│    - Duration tracked                                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. TRANSCRIPTION (Online)                                        │
│    - Audio blob sent to /api/clipperstream/transcribe          │
│    - API returns: { text: "Mary had a little lamp" }           │
│    - rawText = "Mary had a little lamp"                         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CLIP CREATION                                                 │
│    const newClip = {                                            │
│      id: "clip-123",                                            │
│      rawText: "Mary had a little lamp",                         │
│      formattedText: '',                                         │
│      content: ??? (QUESTION: Empty or rawText?)                 │
│      status: 'formatting'                                       │
│    }                                                            │
│    addClip(newClip)                                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. BACKGROUND FORMATTING (500ms delay)                          │
│    - Send to /api/clipperstream/format-text                    │
│    - Request: { rawText: "Mary...", existingFormattedContext: undefined } │
│    - AI formats: adds capitalization, punctuation, paragraphs  │
│    - Response: { formattedText: "Mary had a little lamp." }    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CLIP UPDATE                                                   │
│    updateClip(clipId, {                                         │
│      formattedText: "Mary had a little lamp.",                  │
│      content: "Mary had a little lamp.",  // NOW shows          │
│      status: null  // Formatting complete                       │
│    })                                                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. UI RENDER                                                     │
│    - ClipRecordScreen detects content appeared (empty → text)   │
│    - Animation triggers (slide + blur effect)                   │
│    - Text fades in smoothly                                     │
│    - Copy button enabled                                        │
└─────────────────────────────────────────────────────────────────┘
```

**CRITICAL QUESTION**: At step 3, should `content` be empty or `rawText`?
- **Empty**: Text doesn't show until formatting completes → Animation plays on first appearance
- **rawText**: Text shows immediately → Animation plays on already-visible text (double-trigger bug)

---

### Flow 2: Append Mode (Online, Existing Clip)

```
┌─────────────────────────────────────────────────────────────────┐
│ CONTEXT: Existing clip with content: "Mary had a little lamp."  │
│ USER ACTION: Click Record (in same clip) → Speak → Click Done  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. RECORDING CAPTURE (Same as Flow 1)                           │
│    - Audio: "Her fleece was white as snow"                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. TRANSCRIPTION                                                 │
│    - API returns: { text: "her fleece was white as snow" }     │
│    - rawText2 = "her fleece was white as snow"                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CLIP UPDATE (Append Mode)                                    │
│    updateClip(clipId, {                                         │
│      rawText: "Mary had a little lamp\n\nher fleece...",        │
│      content: ??? (QUESTION: Update now or later?)              │
│      status: 'formatting'                                       │
│    })                                                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CONTEXT-AWARE FORMATTING (CRITICAL!)                         │
│    - Send to /api/clipperstream/format-text                    │
│    - Request: {                                                 │
│        rawText: "her fleece was white as snow",                 │
│        existingFormattedContext: "Mary had a little lamp."      │
│      }                                                          │
│    - AI examines context:                                       │
│      * Previous sentence ended with period                      │
│      * New sentence seems related                               │
│      * Decision: Continue in same paragraph                     │
│    - Response: { formattedText: "Her fleece was white as snow." } │
│                                                                 │
│    OR if unrelated:                                             │
│    - Decision: Start new paragraph                              │
│    - Response includes proper spacing                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CLIP UPDATE (Formatting Complete)                            │
│    updateClip(clipId, {                                         │
│      formattedText: "Mary had a little lamp. Her fleece...",    │
│      content: "Mary had a little lamp. Her fleece...",          │
│      status: null                                               │
│    })                                                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. UI RENDER                                                     │
│    - Old text already visible: "Mary had a little lamp."       │
│    - New text appears below: "Her fleece was white as snow."   │
│    - NO ANIMATION (content wasn't empty before)                │
│    - Smooth append                                              │
└─────────────────────────────────────────────────────────────────┘
```

**CRITICAL QUESTION**: At step 3, should `content` be updated immediately?
- **Yes**: Old text stays visible, but shows raw append text → Later replaced with formatted
- **No**: Old text stays visible, new text appears only when formatted

---

### Flow 3: Offline Recording (Creates Pending Clip)

```
┌─────────────────────────────────────────────────────────────────┐
│ CONTEXT: User goes offline                                       │
│ USER ACTION: Click Record → Speak → Click Done                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. RECORDING CAPTURE                                             │
│    - Audio recorded via MediaRecorder                           │
│    - Blob saved to IndexedDB                                    │
│    - audioId = "audio-123"                                      │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. TRANSCRIPTION SKIPPED (Offline)                              │
│    - Network check fails                                        │
│    - handleOfflineRecording() called                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. PARENT-CHILD ARCHITECTURE                                     │
│                                                                 │
│  IF no currentClipId (New recording):                           │
│    - Create PARENT clip:                                        │
│      {                                                          │
│        id: "clip-parent-1",                                     │
│        title: "Recording 01",                                   │
│        status: null,  // Parent is just container               │
│        content: ''                                              │
│      }                                                          │
│    - Create FIRST CHILD clip:                                   │
│      {                                                          │
│        id: "clip-child-1",                                      │
│        title: "Recording 01",  // Inherits parent title         │
│        pendingClipTitle: "Clip 001",                            │
│        status: 'pending-child',                                 │
│        audioId: "audio-123",                                    │
│        parentId: "clip-parent-1",                               │
│        content: ''                                              │
│      }                                                          │
│                                                                 │
│  IF currentClipId exists (Appending to existing):               │
│    - Create CHILD clip:                                         │
│      {                                                          │
│        id: "clip-child-2",                                      │
│        pendingClipTitle: "Clip 002",                            │
│        status: 'pending-child',                                 │
│        audioId: "audio-124",                                    │
│        parentId: currentClipId,                                 │
│        content: ''                                              │
│      }                                                          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. UI UPDATE                                                     │
│    - Record screen state: 'offline'                             │
│    - Pending clips list shows:                                  │
│      ┌────────────────────────────────────┐                    │
│      │ 🔄 Clip 001  •  0:03  [Waiting]   │                    │
│      └────────────────────────────────────┘                    │
│    - Nav bar shows: Record + Copy + Instructor buttons         │
│      (QUESTION: Should it show all buttons or just Record?)    │
└─────────────────────────────────────────────────────────────────┘
```

**CRITICAL QUESTION**: After creating pending clip, what should `recordNavState` be?
- **'record'**: Only Record button shows (current bug)
- **'complete'**: All buttons show (if viewing parent with content)

---

### Flow 4: Offline → Online (Auto-Retry)

```
┌─────────────────────────────────────────────────────────────────┐
│ CONTEXT: Have pending clips from offline recording              │
│ EVENT: Network comes back online                                │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. AUTO-RETRY DETECTION                                          │
│    - useEffect watches navigator.onLine                         │
│    - Triggers when offline → online                             │
│    - Finds all clips with status: 'pending-child'               │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. FOR EACH PENDING CLIP:                                        │
│                                                                 │
│  Step 2a: Retrieve Audio                                        │
│    - Get audioId from clip                                      │
│    - Retrieve blob from IndexedDB                               │
│                                                                 │
│  Step 2b: Transcribe                                            │
│    - Send blob to /api/clipperstream/transcribe                │
│    - Get rawText                                                │
│                                                                 │
│  Step 2c: Determine Parent                                      │
│    - If clip has parentId, find parent                          │
│    - Check if parent has existing content                       │
│    - This determines if we're appending or creating new         │
│                                                                 │
│  Step 2d: Format (Context-Aware)                                │
│    - If appending: Pass parent's formattedText as context       │
│    - If new: No context                                         │
│    - Get formattedText                                          │
│                                                                 │
│  Step 2e: Update Parent                                         │
│    - If parent empty: Set rawText, formattedText, content       │
│    - If parent has content: Append to rawText, formattedText, content │
│    - Set status: null                                           │
│                                                                 │
│  Step 2f: Delete Child                                          │
│    - Remove child clip (pending-child)                          │
│    - Delete audio from IndexedDB                                │
│    - Remove from pending list                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. UI UPDATE                                                     │
│    - Parent clip shows in main list (not pending)               │
│    - Text appears with animation (if viewing this clip)         │
│    - Pending list empty (or shows remaining pending clips)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Screen States

### Home Screen States

```
┌─────────────────────────────────────────────────────────────────┐
│ STATE 1: EMPTY                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │              No recordings yet                              │ │
│ │                                                             │ │
│ │         [Click record to get started]                       │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ Triggers: No clips in store                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STATE 2: HAS CLIPS                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📝 Recording 02        Dec 31, 2025                         │ │
│ │    "Mary had a little lamp. Her fleece..."                  │ │
│ │ ─────────────────────────────────────────────────────────── │ │
│ │ 📝 Recording 01        Dec 30, 2025                         │ │
│ │    "The quick brown fox jumps over..."                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ Triggers: clips.filter(c => c.status !== 'pending-child')      │
│ Sorted by: createdAt (newest first)                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STATE 3: HAS PENDING (Offline)                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ⚠️  You're offline. Recordings will sync when connected.    │ │
│ │                                                             │ │
│ │ 📝 Recording 02        Dec 31, 2025                         │ │
│ │    "Mary had a little lamp..."                              │ │
│ │                                                             │ │
│ │    Pending:                                                 │ │
│ │    🔄 Clip 001  •  0:03  [Waiting]                         │ │
│ │    🔄 Clip 002  •  0:05  [Waiting]                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ Triggers: Has clips with status: 'pending-child'                │
└─────────────────────────────────────────────────────────────────┘
```

### Record Screen States

```
┌─────────────────────────────────────────────────────────────────┐
│ STATE D1: RECORDING                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [←]  Recording 01                                   [+]     │ │
│ │ ───────────────────────────────────────────────────────────  │ │
│ │                                                             │ │
│ │                                                             │ │
│ │                    (Empty - recording)                      │ │
│ │                                                             │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │                      🔴 Stop                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ Triggers: recordNavState = 'recording'                          │
│ Nav Bar: Stop button only                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STATE D2: PROCESSING                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [←]  Recording 01                                   [+]     │ │
│ │ ───────────────────────────────────────────────────────────  │ │
│ │                                                             │ │
│ │                    ⏳ Processing...                         │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │                      [Processing]                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ Triggers: recordNavState = 'processing'                         │
│ Nav Bar: Disabled                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STATE D3: TRANSCRIBED (Complete)                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [←]  Recording 01                        [Raw/Fmt]  [+]     │ │
│ │ ───────────────────────────────────────────────────────────  │ │
│ │                                                             │ │
│ │  Mary had a little lamp.                                    │ │
│ │                                                             │ │
│ │  Her fleece was white as snow.                              │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │  📋 Copy    🎙️ Record    💡 Instructor                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ Triggers: recordNavState = 'complete' && clip has content      │
│ Nav Bar: Copy + Record + Instructor buttons                    │
│ Text: Shows clip.content (formatted or raw based on toggle)    │
│ Animation: Plays ONLY on first appearance (empty → text)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STATE D4: OFFLINE (Pending Clips)                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [←]  Recording 01                        [Raw/Fmt]  [+]     │ │
│ │ ───────────────────────────────────────────────────────────  │ │
│ │                                                             │ │
│ │  Mary had a little lamp.                                    │ │
│ │                                                             │ │
│ │  🔄 Clip 001  •  0:03  [Waiting]                           │ │
│ │  🔄 Clip 002  •  0:05  [Waiting]                           │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │  📋 Copy    🎙️ Record    💡 Instructor                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ Triggers: Has pending clips + viewing parent                   │
│ Shows: Parent's existing content + Pending clips list          │
│ Nav Bar: QUESTION - Should show all buttons or just Record?    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critical Questions & Current Issues

### Question 1: Initial Content Field
**When creating a new clip after transcription, should `content` be:**
- A) Empty (shows nothing until formatting completes)
- B) Raw text (shows immediately, updates when formatted)

**Impact**:
- Option A: Clean animation (empty → formatted text)
- Option B: Double-trigger bug (text shows, then animates)

**Current 033_v2 behavior**: Option B (causes double-trigger)
**Proposed 033_v5 fix**: Option A (clean animation)

### Question 2: Append Mode Content
**When appending after transcription, should `content` be:**
- A) Updated immediately with raw text
- B) Not updated until formatting completes

**Impact**:
- Option A: Old text visible, raw append shows immediately
- Option B: Old text visible, formatted append appears smoothly

**Current 033_v2 behavior**: Option A
**Proposed 033_v5 fix**: Option B

### Question 3: Nav Bar After Offline Recording
**After creating pending clip while viewing parent with content:**
- A) recordNavState = 'record' (shows only Record button)
- B) recordNavState = 'complete' (shows all buttons)

**Impact**:
- Option A: User loses access to Copy/Instructor (current bug)
- Option B: Buttons stay available

**Current behavior**: Option A (bug)
**Proposed 033_v5 fix**: Option B (check if parent has content)

### Question 4: Context-Aware Formatting
**Is the formatting API receiving context correctly?**

**Current code** (formatTranscriptionInBackground, line 817):
```typescript
const context = isAppending ? clip.formattedText : undefined;

const response = await fetch('/api/clipperstream/format-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rawText,
    existingFormattedContext: context
  })
});
```

**Status**: ✅ This is still working correctly
**Impact**: API can make smart decisions about paragraph breaks
**Note**: 033_v5 fix doesn't break this

---

## Current Progress Assessment

### What's Working
✅ Transcription API integration
✅ Formatting API integration with context
✅ Context-aware paragraph decisions
✅ Offline storage to IndexedDB
✅ Parent-child pending clip architecture
✅ Auto-retry on network reconnect
✅ Zustand state management
✅ Selector pattern (no manual sync)
✅ Raw/formatted toggle (when API returns different text)

### What's Broken (From Testing)
❌ Animation triggers twice (double-trigger)
❌ Append mode animates entire text block
❌ Nav bar regression after offline recording
❌ Raw/formatted toggle shows no difference (API returns same text)
❌ State changes not visible (formatting spinner, pending → transcribed)

### What's Not Implemented Yet (Phase 5)
⏳ Formatting spinner during background formatting
⏳ Status indicators on home screen clips
⏳ Pending → transcribed visual transition
⏳ Title generation visual feedback
⏳ Other Phase 5 items from 030_v5_PHASE5_SPINNER_PATCH.md

---

## Percentage Complete Estimate

**Core Functionality**: 85%
- Recording: ✅ 100%
- Transcription: ✅ 100%
- Formatting: ✅ 100%
- Context-aware append: ✅ 100%
- Offline/online: ✅ 95% (auto-retry works, nav bar bug)
- State management: ✅ 90% (selector works, but bugs in content timing)

**UI/UX Polish**: 40%
- Animations: ❌ 30% (broken)
- State visibility: ❌ 20% (Phase 5 not done)
- Navigation flows: ✅ 70% (works but has bugs)
- Error handling: ✅ 80% (works, API issue with raw/formatted)

**Overall**: ~62% complete

**Your assessment of "not even close to 70%"** is accurate if we're counting UX polish and Phase 5 work.

---

## What 033_v5 Fixes

1. **Content timing**: Don't set content until formatted (fixes double-trigger)
2. **Append content**: Don't set content on transcription (fixes append animation)
3. **Nav bar state**: Check parent content state (fixes button regression)
4. **Animation logic**: Content-length based (simple, reliable)

**What 033_v5 DOESN'T change**:
- Context-aware formatting (still works)
- Transcription flow (still works)
- Offline/online flow (still works)
- Parent-child architecture (still works)

---

## Remaining Work

### Short Term (033_v5)
1. Fix content timing (when to set content field)
2. Fix nav bar state (check parent content)
3. Fix animation logic (content-length based)

### Medium Term (Phase 5)
1. Formatting spinner/status
2. State change visibility
3. Home screen status indicators
4. Visual polish

### Long Term
1. API improvement (make raw/formatted actually different)
2. Performance optimization
3. Additional features

---

**This document represents my current understanding. Please correct any misunderstandings about:**
1. Flow sequences
2. State transitions
3. Content field usage
4. Context-aware formatting
5. Any other critical aspects I've missed

I need to understand the system correctly before making any more changes.
