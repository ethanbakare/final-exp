# 036 - Auto-Retry Root Cause Analysis

**Date**: December 31, 2025  
**Status**: CRITICAL ARCHITECTURAL FLAW - Auto-retry treats child clips as independent  
**Type**: Root Cause Analysis - No code changes yet

---

## User's Test Scenario

From `013_ZUSTANDv21_debug.md`:

1. **First clip**: Created "New Year's Reflections on Mary's Lamb" (transcribed successfully)
2. **Went offline**: Created new parent "Recording 01"
3. **Created 4 pending child clips** inside "Recording 01" (offline)
4. **Went to original clip**: "New Year's Reflections on Mary's Lamb"
5. **Created 1 more pending child clip** inside original clip (offline)
6. **Went back to "Recording 01"** (viewing this parent with 4 pending children)
7. **Turned internet back on** → Auto-retry triggered
8. **ERROR**: `NotAllowedError: Failed to execute 'writeText' on 'Clipboard': Document is not focused`
9. **SYMPTOM 1**: Text was transcribed but **not showing on screen**
10. **SYMPTOM 2**: "Recording 01" file name **changed** to inherit first child's title
11. **SYMPTOM 3**: Toast showed "Copied to clipboard: Recording 01 File Clip 003"

---

## The Clipboard Error (Not the Root Cause)

```
ClipMasterScreen.tsx:889 Uncaught (in promise) NotAllowedError: 
Failed to execute 'writeText' on 'Clipboard': Document is not focused.
```

**This is a symptom, not the root problem.**

### Why It Happens

Line 889 in `formatTranscriptionInBackground`:
```typescript
navigator.clipboard.writeText(textToCopy);
```

The Clipboard API requires the document to be **actively focused**. When auto-retry runs in the background (user might be on another tab or looking at a different screen), the document isn't focused, causing this error.

### Why This Matters

This error is **masking the real bugs**. The auto-retry is actually completing (transcribing and formatting all 5 clips), but:
1. Text isn't appearing on screen
2. File names are changing incorrectly
3. User sees cryptic clipboard errors instead of understanding what went wrong

---

## Critical Flaw #1: Treating Child Clips as Independent

### Current Code (Lines 928-972)

```typescript
// Process sequentially (one at a time)
for (const clip of pendingClips) {
  try {
    // Get audio from IndexedDB
    const audioBlob = await getAudio(clip.audioId!);
    
    // Update status: transcribing
    updateClip(clip.id, { status: 'transcribing' });
    
    // Transcribe
    const transcriptionResult = await transcribeRecording(audioBlob);
    const { text: rawText } = transcriptionResult;
    
    // Store raw text, set status: formatting
    updateClip(clip.id, {
      rawText: rawText,
      content: rawText,        // ❌ WRONG: Updates CHILD clip
      status: 'formatting'
    });
    
    // Format
    await formatTranscriptionInBackground(clip.id, rawText, false);
    
    // Now clip has: status: null, rawText, formattedText
    // ❌ WRONG: CHILD clip now looks like a completed transcription
    
  } catch (error) {
    // Error handling
  }
}
```

### What's Wrong

**Child clips are NOT independent clips.** They are:
- Temporary containers for audio blobs
- Should be transcribed and **appended to their PARENT**
- Should be **deleted** after appending

**Current code treats them like standalone clips:**
- Stores `rawText` and `content` in the child
- Keeps the child in the clips array
- User is viewing the **parent**, but text is stored in the **child**
- Result: **Text transcribed but not visible**

---

## Critical Flaw #2: No Parent-Child Logic

### What's Missing

The auto-retry loop has **ZERO code** to:

1. **Find the parent clip:**
   ```typescript
   const parentId = clip.parentId;
   const parent = allClips.find(c => c.id === parentId);
   ```

2. **Append to parent's content:**
   ```typescript
   updateClip(parentId, {
     rawText: parent.rawText + '\n\n' + rawText,
     formattedText: parent.formattedText + '\n\n' + formattedText,
     content: parent.content + '\n\n' + formattedText,
     status: null  // Parent is now complete
   });
   ```

3. **Delete the child clip:**
   ```typescript
   deleteClip(clip.id);  // Remove child from store
   ```

4. **Delete the audio:**
   ```typescript
   await deleteAudio(clip.audioId);  // Clean up IndexedDB
   ```

5. **Update parent status:**
   - If parent had no content before (first child): Set parent status to `null` (complete)
   - If parent already had content: Keep status `null`

### Result of Missing Logic

From the debug log:
```
2: {id: "clip-1767201798784-j55vp21hwjp", title: "Recording 01", ...}
   content: "This is clip file record zero one,  \nand this is clip zero zero one inside that file."
   parentId: "clip-1767201798784-xmecavlcw"
   status: null
```

**The child clip has the transcribed text**, but:
- User is viewing the **parent** (`clip-1767201798784-xmecavlcw`)
- Parent has **no content** (empty or old content)
- Child is **still in the clips array** instead of being deleted
- Text is transcribed but **invisible to user**

---

## Critical Flaw #3: No Context for Formatting

### Current Code (Line 961)

```typescript
await formatTranscriptionInBackground(clip.id, rawText, false);
//                                                      ^^^^^ WRONG: Always false
```

**This breaks AI paragraph continuation.**

### What Should Happen

The `isAppending` parameter should be determined by:
1. **If parent has no content yet** (first child): `isAppending = false`, no context
2. **If parent has content** (subsequent children): `isAppending = true`, pass `parent.formattedText` as context

### Current Behavior

**ALL clips formatted without context:**
- First child: ✅ Correct (should have no context)
- Second child: ❌ Wrong (should have context from first)
- Third child: ❌ Wrong (should have context from first + second)
- Fourth child: ❌ Wrong (should have context from first + second + third)

**Result**: AI formatter cannot make smart paragraph decisions. Each clip is formatted independently, losing continuity.

---

## Critical Flaw #4: No Batching/Queue Management

### User's Requirements (From Original Message)

> "The second step in my mind would be like when you have 3-4 clips pending clips inside a clip file where you have to get all of them translated. What happens in that sort of stage right? We've sort of talked about how for the very first clip, that one transcript transcribes and then we haven't decided where we're going to do each of the clips inside a clip file one by one back-to-back and have the text be coming in instantly for each of them. That's going to be a bit jarring. I think we talked about basically doing the first clips so you have at least one clip showing like pending clip translated and then we do the whole thing at once for the rest of them. What that means is, in a sense, we're actually doing each clip one by one after the first clip (after clip 001) but for the other 3 which was holding them and then we showed the whole thing together instantly rather than showing several so many times."

### Translation of Requirements

**Strategy: "Show First, Batch Rest"**

For a parent with 4 pending children:
1. **Clip 001**:
   - Transcribe immediately
   - Format immediately
   - Append to parent → User sees text appear (good UX feedback)
   - Update UI immediately

2. **Clips 002, 003, 004**:
   - Transcribe all 3 sequentially
   - Format all 3 sequentially (with cumulative context)
   - **Hold in memory** (don't update UI after each)
   - **Batch append ALL 3 at once** → User sees all remaining text appear together
   - Update UI once (not 3 separate flashes)

### What's Missing in Current Code

**No grouping by parent:**
```typescript
// Current: Flat list of all pending clips
const pendingClips = allClips.filter(c => c.audioId && (...));

// Should be: Grouped by parent
const pendingByParent = groupPendingClipsByParent(allClips);
// {
//   "parent-1": [child1, child2, child3, child4],
//   "parent-2": [child5],
//   "parent-3": [child6, child7]
// }
```

**No batching logic:**
- No "show first, hold rest" logic
- No cumulative text accumulation
- No single batch update after processing multiple clips

**Result:**
- If code worked correctly, user would see 4 separate animations (jarring)
- But it doesn't work at all, so user sees nothing

---

## Critical Flaw #5: Title Generation Race Condition

### What Happened in User's Test

From debug log:
```
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip
  clipId: "clip-1767201821259-0vzmx4f8sr7p"
  title: "Final Test Execution Discussion"
```

**This is a CHILD clip getting a title** from `useParentTitleGenerator`.

### The Problem

`useParentTitleGenerator` (line 996-998) watches for clips with `status: null` and content. When auto-retry completes:
1. Child clip has `status: null` and `content` (because of Flaw #1)
2. `useParentTitleGenerator` thinks it's a new completed recording
3. Generates title for the **child** instead of the **parent**
4. Parent's title gets overwritten (if child and parent share same ID by accident)

### What Should Happen

- **Only parent clips** should get AI-generated titles
- Child clips should never trigger title generation
- Filter should be: `status: null && content && !parentId`

---

## Why Text Didn't Show on Screen

### User's View vs Data State

**User is viewing:**
- Parent clip: `"clip-1767201798784-xmecavlcw"` (Recording 01)
- Parent has: `title: "File Record Overview: Clip Zero One"` (from first child)
- Parent has: `content: ""` or old content (NOT the new transcriptions)

**Data state in Zustand:**
```
Child clip 1: "clip-1767201798784-j55vp21hwjp"
  content: "This is clip file record zero one, and this is clip zero zero one..."
  status: null
  parentId: "clip-1767201798784-xmecavlcw"

Child clip 2: "clip-1767201808836-kxbxp7zu4iq"
  content: "File recording zero one clip zero zero two."
  status: null
  parentId: "clip-1767201798784-xmecavlcw"

(etc for clips 3, 4)
```

**Problem:**
- Text is in the **children**
- User is viewing the **parent**
- Parent has no content
- UI correctly shows parent's content (empty)
- **User sees nothing**, even though transcription succeeded

---

## Why File Name Changed

### Expected Behavior

- Parent clip: `"Recording 01"` (should keep this title)
- Children: No individual titles (they inherit parent's title)

### What Happened

From debug log:
```
1: {id: "clip-1767201798784-xmecavlcw", title: "File Record Overview: Clip Zero One", ...}
```

**The parent's title changed from "Recording 01" to "File Record Overview: Clip Zero One".**

### Root Cause

One of the child clips got transcribed first, and either:
1. `useParentTitleGenerator` generated a title for the child
2. The child's title overwrote the parent's title somehow
3. There's a bug in how titles are inherited/updated during offline recording

This is a secondary bug caused by the parent-child logic being broken.

---

## The "Copied to Clipboard" Toast

### What User Saw

Toast message: `"Recording 01 File Clip 003"`

### What This Means

`formatTranscriptionInBackground` successfully:
1. Transcribed clip 003
2. Formatted clip 003
3. Attempted to copy clip 003's text to clipboard
4. **Failed** because document not focused
5. But the transcription DID complete

The clipboard error is just a side effect of the auto-retry running in the background while user is viewing a different clip.

---

## Summary of Root Causes

| Flaw | What's Broken | Impact |
|------|---------------|--------|
| **#1: Independent Treatment** | Auto-retry treats child clips as standalone | Text stored in children, not visible in parent |
| **#2: No Parent Logic** | No code to append to parent, delete children | Children stay in array, parent stays empty |
| **#3: No Context** | Always `isAppending=false`, no parent text passed | AI can't make smart paragraph decisions |
| **#4: No Batching** | No grouping, no "show first, batch rest" | Would be jarring UI (if it worked at all) |
| **#5: Title Race** | Title generator triggers on child completion | Parent title gets overwritten incorrectly |

---

## What Works (Surprisingly)

Looking at the debug log, the auto-retry **did successfully**:
1. ✅ Retrieve all 5 audio blobs from IndexedDB
2. ✅ Transcribe all 5 clips (got raw text)
3. ✅ Format all 5 clips (got formatted text)
4. ✅ Delete audio from IndexedDB after processing

**The transcription/formatting pipeline works.** The parent-child architecture is what's broken.

---

## Industry Best Practices Violated

### 1. **Separation of Concerns**
- Child clips are a **data storage pattern** (temporary containers)
- They should **never** be treated as user-facing entities
- Current code mixes storage layer (children) with presentation layer (what user sees)

### 2. **Transaction Atomicity**
- Appending to parent + deleting child + deleting audio should be **atomic**
- Current code does none of these, leaving data in inconsistent state

### 3. **Queue Management**
- Should group related work (all children of same parent)
- Should process in meaningful chunks (first vs rest)
- Current code processes flat list with no grouping

### 4. **State Visibility**
- User should see state changes (pending → transcribing → complete)
- Current code updates child status, but user is viewing parent
- Status indicators should be derived from parent's children, not individual clips

### 5. **Error Handling**
- Clipboard API should be wrapped in try-catch
- Should fall back gracefully if document not focused
- Current code throws unhandled errors that mask real bugs

---

## Next Steps

**DO NOT WRITE CODE YET.**

Create `036_v1_AUTO_RETRY_PROPER_ARCHITECTURE.md` to design:
1. Correct parent-child append logic
2. Batching strategy ("show first, batch rest")
3. Queue management for multiple parents
4. Status indicator coordination
5. Context-aware formatting with cumulative content

Only after architecture review should we implement.

---

**End of Document**

