# 043 - Clarifications: Title Generation & Retry Mechanism

**Date**: December 31, 2025
**Type**: User Feedback Clarification
**Status**: ✅ CRITICAL CLARIFICATIONS

---

## Issue #1: Title Generation Confusion - CLARIFIED

### What I Said (CONFUSING):
> "Use await blocks processing next parent → fire-and-forget → title appears separately after content"

### User's Valid Confusion:
> "You mentioned 'blocking next parent' (different parent clip file) but then talk about 'title appears after content' (UI timing). These don't tally."

### I WAS CONFLATING TWO DIFFERENT THINGS:

**Thing 1: Blocking Next Parent** (Performance Issue)
```typescript
// Current 037_v1 (Line 712-714):
for (const parent of parents) {  // Processing multiple parents
  // ... process children ...

  await generateTitleInBackground(parentId, text);  // ❌ BLOCKS HERE

  // Can't start next parent until title generation completes
}
```

**Problem**: If you have 3 parent files waiting:
- Recording 01: Process children → wait 3 seconds for title → THEN start Recording 02
- Recording 02: Process children → wait 3 seconds for title → THEN start Recording 03
- Recording 03: Process children → wait 3 seconds for title → DONE

**Total unnecessary waiting**: 9 seconds

**Fix**: Don't await
```typescript
generateTitleInBackground(parentId, text).catch(err => console.error(err));
// Move to next parent immediately, title appears in background
```

---

**Thing 2: When Title Appears** (UI Timing)
This is SEPARATE from blocking. User's understanding is BETTER than mine.

---

### User's Better Understanding - TITLE FROM FIRST CLIP

**User's Correct Point**:
> "I think that the title that we have for the clip is already there in the sense that after the first clip transcribes, we're already going to have the title because we're not going to wait till everything transcribes to get information to make the title. Just like when you were recording when you're online, your title comes from your first clip."

**User is 100% RIGHT**. Online recording flow:
```
1. Record clip
2. Transcribe → raw text
3. Format → formatted text
4. Generate title from formatted text
5. Show: Title + Text (all at once)
```

**User's Preferred Offline-to-Online Flow**:
```
4 Pending Clips (Clip 001, 002, 003, 004):

Clip 001 transcribes:
  → Generate title from Clip 001's text
  → Show: Title + Clip 001's text
  → Status: Still has 3 pending clips (002, 003, 004 waiting)

Clip 002, 003, 004 transcribe (batch):
  → Append to existing text
  → Title already there (from Clip 001)
  → Status: All complete
```

**This is BETTER because**:
1. ✅ Matches online behavior (title from first clip)
2. ✅ More robust - handles offline/online transitions
3. ✅ User sees title immediately after first clip
4. ✅ Handles edge case: User goes offline after first clip completes

---

### User's Edge Case Example

**Scenario**:
```
1. Recording 01 has 4 pending clips
2. User goes online
3. Clip 001 transcribes successfully
4. User goes offline BEFORE Clip 002 starts
```

**My Original Approach** (BROKEN):
```
Status: Transcribing... (spinner spinning)
Title: "Recording 01" (no title generated yet)
Text: Clip 001's text visible
Pending: Clips 002, 003, 004 waiting

❌ User never sees title because we wait for ALL clips
```

**User's Better Approach** (ROBUST):
```
Status: Waiting to transcribe (spinner stopped)
Title: "Mary's Tale" (generated from Clip 001)
Text: Clip 001's text visible
Pending: Clips 002, 003, 004 waiting

✅ User sees title, can read Clip 001, knows what it's about
✅ When online again, remaining clips append to existing content
```

---

### Corrected Implementation

**Current 037_v1** (Lines 712-714 - WRONG TIMING):
```typescript
// STEP 3: Generate AI title for parent (if still has placeholder)
if (parent.title.startsWith('Recording ')) {
  await generateTitleInBackground(parentId, accumulatedRawText);
}
```

**Fixed** (Generate after FIRST clip, not after ALL):

**Location**: Step 2.3 processParentChildren

**After First Child Completes** (Around line 663):
```typescript
// STEP 1: Process first child (show immediately)
if (firstChild) {
  console.log('[ProcessChildren] Processing FIRST child:', firstChild.pendingClipTitle);

  const result = await processChild(firstChild, undefined);

  if (result.success) {
    // Accumulate formatted text
    accumulatedFormattedText += (accumulatedFormattedText ? ' ' : '') + result.formattedText;
    accumulatedRawText += (accumulatedRawText ? ' ' : '') + result.rawText;
    accumulatedContent += (accumulatedContent ? ' ' : '') + result.formattedText;

    // Update parent with first child content (shows immediately)
    updateClip(parentId, {
      rawText: accumulatedRawText,
      formattedText: accumulatedFormattedText,
      content: accumulatedContent,
      createdAt: Date.now()
    });

    console.log('[ProcessChildren] First child merged into parent');
    deleteClip(firstChild.id);

    // ✅ GENERATE TITLE AFTER FIRST CLIP (fire-and-forget)
    const currentParent = getClipById(parentId);
    if (currentParent && currentParent.title.startsWith('Recording ')) {
      console.log('[ProcessChildren] Generating title from first clip (background)');
      generateTitleInBackground(parentId, result.formattedText).catch(err => {
        console.error('[ProcessChildren] Title generation failed:', err);
      });
      // Don't await - title appears in background while other clips process
    }
  }
}

// STEP 2: Process remaining children (if any)
// Title already generated, just append content
if (restChildren.length > 0) {
  // ... batch processing (no title generation here) ...
}
```

---

### Benefits of This Approach

1. **Matches Online Behavior**: Title from first clip (consistent UX)
2. **Immediate Feedback**: User sees title + content after first clip
3. **Robust Edge Cases**: Handles offline interruptions gracefully
4. **Non-Blocking**: Title generates in background, doesn't block batch processing
5. **Decoupled**: Title generation independent from "all clips complete"

**User's Key Insight**:
> "We can literally if if it's transcribing and we already have that text for the title, we literally just put it there. It's a safer way."

✅ **CORRECT** - Show title as soon as we have content, regardless of remaining pending clips.

---

## Issue #2: Retry Mechanism - FOUND IN CODE

### User's Valid Concern:
> "The way you talk about it, it's like it's not been implemented anywhere code-wise in very stringent detail."

### I FOUND IT - IT'S FULLY IMPLEMENTED ✅

**Location**: [useClipRecording.ts:410-444](final-exp/src/projects/clipperstream/hooks/useClipRecording.ts#L410-L444)

**Full Implementation**:
```typescript
// Lines 76-77: Configuration
const MAX_RAPID_ATTEMPTS = 3;  // Attempts 1-3: no waits
const RETRY_INTERVALS = [60000, 120000, 240000, 300000]; // 1, 2, 4, 5 min

// Lines 410-444: Retry Logic
const shouldRetry = isTimeout || isNetworkError;

if (shouldRetry) {
  const nextRetryCount = retryCount + 1;
  setRetryCount(nextRetryCount);

  if (nextRetryCount < MAX_RAPID_ATTEMPTS) {
    // Rapid phase: immediate retry (attempts 1-3)
    log.info('Rapid retry (immediate)', {
      attempt: nextRetryCount + 1,
      reason: isTimeout ? 'timeout' : 'network error'
    });
    retryTimerRef.current = setTimeout(() => transcribeRecording(), 0);
    return { text: '', error: 'network' };
  } else {
    // Interval phase: wait before retry (attempts 4+)
    const intervalIndex = (nextRetryCount - MAX_RAPID_ATTEMPTS) % RETRY_INTERVALS.length;
    const waitTime = RETRY_INTERVALS[intervalIndex];

    setTranscriptionError('network-retry');
    setIsActiveRequest(false);  // Stop spinner

    log.info('Interval retry (scheduled)', {
      attempt: nextRetryCount + 1,
      waitMinutes: waitTime / 60000,
      reason: isTimeout ? 'timeout' : 'network error'
    });

    retryTimerRef.current = setTimeout(() => {
      setIsActiveRequest(true);  // Start spinner
      setTranscriptionError(null);
      transcribeRecording();
    }, waitTime);
    return { text: '', error: 'network' };
  }
}
```

### But There's a Problem for Auto-Retry

**This retry logic is in `useClipRecording` hook** (used for ONLINE recording).

**For AUTO-RETRY** (offline → online), we're calling `transcribeRecording` directly from ClipMasterScreen without using the hook.

**Question**: Does the `transcribeRecording` function we call in auto-retry have this retry logic built-in?

**Let me check what we're calling in 037_v1**:

**037_v1 Line 559** (in processChild):
```typescript
const transcriptionResult = await transcribeRecording(audioBlob);
```

**This is calling the same function, but NOT using the retry wrapper from useClipRecording.**

---

### Two Options for Auto-Retry

**Option 1: Extract Retry Logic to Shared Function**

Create a shared retry wrapper that both useClipRecording and auto-retry use:

```typescript
// New file: utils/retryTranscription.ts
export async function transcribeWithRetry(
  audioBlob: Blob,
  transcribeFn: (blob: Blob) => Promise<{ text: string; error?: string }>,
  options: {
    maxRapidAttempts?: number;
    retryIntervals?: number[];
    onRetry?: (attempt: number, waitTime: number) => void;
  } = {}
): Promise<{ text: string; error?: string }> {

  const MAX_RAPID_ATTEMPTS = options.maxRapidAttempts || 3;
  const RETRY_INTERVALS = options.retryIntervals || [60000, 120000, 240000, 300000];

  let retryCount = 0;

  while (true) {
    try {
      const result = await transcribeFn(audioBlob);

      if (result.text && result.text.length > 0) {
        return result;  // Success
      }

      // Empty result - should retry
      retryCount++;

      if (retryCount < MAX_RAPID_ATTEMPTS) {
        // Rapid retry (immediate)
        console.log(`[Retry] Rapid attempt ${retryCount + 1}`);
        continue;  // Try again immediately
      } else {
        // Interval retry (with wait)
        const intervalIndex = (retryCount - MAX_RAPID_ATTEMPTS) % RETRY_INTERVALS.length;
        const waitTime = RETRY_INTERVALS[intervalIndex];

        console.log(`[Retry] Interval attempt ${retryCount + 1}, waiting ${waitTime / 60000} minutes`);

        if (options.onRetry) {
          options.onRetry(retryCount + 1, waitTime);
        }

        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;  // Try again after wait
      }

    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const isNetworkError = error instanceof TypeError;

      if (isTimeout || isNetworkError) {
        // Should retry
        retryCount++;

        if (retryCount < MAX_RAPID_ATTEMPTS) {
          console.log(`[Retry] Rapid attempt ${retryCount + 1} after error`);
          continue;
        } else {
          const intervalIndex = (retryCount - MAX_RAPID_ATTEMPTS) % RETRY_INTERVALS.length;
          const waitTime = RETRY_INTERVALS[intervalIndex];

          console.log(`[Retry] Interval attempt ${retryCount + 1} after error, waiting ${waitTime / 60000} minutes`);

          if (options.onRetry) {
            options.onRetry(retryCount + 1, waitTime);
          }

          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      } else {
        // Definitive failure
        return { text: '', error: 'server-error' };
      }
    }
  }
}
```

**Then in processChild**:
```typescript
const transcriptionResult = await transcribeWithRetry(
  audioBlob,
  transcribeRecording,
  {
    onRetry: (attempt, waitTime) => {
      // Update clip status to show waiting
      updateClip(child.id, {
        status: 'pending-retry',
        retryCount: attempt,
        nextRetryTime: Date.now() + waitTime
      });
    }
  }
);
```

---

**Option 2: Use Existing Hook Pattern**

Since retry logic already exists in useClipRecording, just REFERENCE it and note that auto-retry should use the same pattern:

```typescript
// In processChild (037_v1):

// Step 3: Transcribe (uses same retry pattern as online recording)
// See useClipRecording.ts lines 410-444 for retry implementation:
//   - Attempts 1-3: Rapid fire (no waits)
//   - Attempts 4+: Interval waits (1min, 2min, 4min, 5min cycle)
// TODO: Extract retry logic to shared function for auto-retry
const transcriptionResult = await transcribeRecording(audioBlob);
```

---

### Recommendation

**For Now** (037_v1 Phase 1-3):
- Add comment referencing existing retry in useClipRecording
- Note as TODO for Phase 4 enhancement

**For Phase 4** (Production hardening):
- Extract retry logic to shared utility
- Use in both online recording and auto-retry
- Add UI indicators for retry state (spinner stops during waits)

---

## Summary of Corrections to 037_v1

### Change #1: Title Generation After FIRST Clip ✅

**Move title generation from end to after first child completes**:
```typescript
// After first child merged to parent:
if (currentParent && currentParent.title.startsWith('Recording ')) {
  generateTitleInBackground(parentId, result.formattedText).catch(err => {
    console.error(err);
  });
  // Fire-and-forget, don't block batch processing
}
```

**Benefits**:
- Title from first clip (matches online)
- Shows immediately (better UX)
- Handles offline interruptions (robust)
- Doesn't block batch processing (non-blocking)

---

### Change #2: Retry Mechanism - Add TODO Comment ✅

**In processChild function**:
```typescript
// Step 3: Transcribe (existing retry in useClipRecording.ts lines 410-444)
// TODO Phase 4: Extract shared retry utility for auto-retry
//   - Attempts 1-3: Rapid (no waits)
//   - Attempts 4+: Intervals (1min, 2min, 4min, 5min)
//   - Update clip.retryCount and clip.nextRetryTime for UI
const transcriptionResult = await transcribeRecording(audioBlob);
```

**For Phase 4**:
- Extract retry logic to shared function
- Add retry state tracking for auto-retry clips
- Coordinate spinner state (stops during interval waits)

---

**End of Document**
