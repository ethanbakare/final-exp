# Debug Analysis Report: Server Error 500 & Text Duplication

**Date:** December 23, 2025
**Status:** Root Cause Identified
**Priority:** Critical

This document outlines the findings for two critical issues affecting the recording and transcription workflow.

---

## Issue 1: Server Error 500 "No speech detected" (Critical)

**Symptom:**
Recording abruptly stops shortly after starting (often within <1s). The user receives a "Server error 500: No speech detected" toast message.

**Root Cause Analysis:**
The error is caused by a race condition in `ClipMasterScreen.tsx` that triggers a premature cleanup of the recording session.

1.  **The Trigger:** When a recording is started in "Append Mode" (adding to an existing clip), the `useEffect` hook handling clip selection updates is triggered.
2.  **The Conflict:** This effect (lines 146-189 in original analysis) has a dependency on the `clips` array. If the `clips` array updates for *any* reason (e.g., background sync, status change of another clip, or even the initial update of the current clip), the effect re-runs.
3.  **The Flaw:** Inside this effect, there is logic that assumes if a clip has content, the user is just "viewing" it. It calls `resetRecording()` to ensure a clean state.
4.  **The Crash:** `resetRecording()` immediately terminates the active `MediaRecorder`. Because the recording was only active for milliseconds, the resulting audio blob is empty or too short.
5.  **The Error:** This empty blob is sent to Daygram, which correctly reports "No speech detected". UseClipRecording wrapper catches this and throws the 500 error.

**Proposed Solution:**
Modify the `useEffect` in `ClipMasterScreen.tsx` to respect the active recording state.

```typescript
// ClipMasterScreen.tsx

// Navigate from home to record screen (when clicking a clip)
const handleClipClick = useCallback((clipId: string) => {
  // FIX: Guard clause to prevent interrupting an active recording
  if (isRecording) return; 

  const clip = clips.find(c => c.id === clipId);
  // ... existing logic ...
```

*Note: The actual fix location is likely in the `useEffect` that calls logic similar to `handleClipClick`, or ensuring `resetRecording` isn't called if `isRecording` is true.*

---

## Issue 2: Text Duplication & Formatting Anomalies

**Symptom:**
When appending a new recording to an existing one:
1.  The text is sometimes duplicated (e.g., `[Old Text] [New Text] [Old Text]`).
2.  Large gaps appear between paragraphs.

**Root Cause Analysis:**
The issue stems from how the "Smart Formatting" feature combines text in Append Mode.

1.  **The Mechanism:** calling `formatTranscriptionInBackground` sends the active transcription (NEW text) along with the `existingFormattedContext` (OLD text) to the AI.
2.  **The AI Behavior:** The AI is instructed to format the *new* text using the *old* text as context. However, if the prompt is ambiguous or the AI "helpfully" tries to return the complete document, it may return `[Old Context] + [Formatted New Text]`.
3.  **The Client Logic:** The client (lines 754-756) blindly appends the AI's response to the existing text:
    `updatedFormattedText = clip.formattedText + formattedText`
4.  **The Result:** If the AI returned the full combined text, the client appends it *again* to the existing text, creating a duplication: `Old + (Old + New)`.

**Proposed Solution:**
Update the formatting logic in `ClipMasterScreen.tsx` to handle potential overlaps and ensure clean appending.

1.  **Smarter Append Logic:**
    Check if the returned `formattedText` starts with the `existingFormattedContext`. If it does, use it as the *replacement* rather than appending.

    ```typescript
    // In formatTranscriptionInBackground completion handler:
    
    let finalFormattedText = formattedText;
    
    if (isAppending && clip.formattedText) {
      if (formattedText.startsWith(clip.formattedText.substring(0, 20))) {
         // AI returned the full text including context - use as is
         finalFormattedText = formattedText;
      } else {
         // AI returned only new text - append with double newline
         finalFormattedText = clip.formattedText + '\n\n' + formattedText;
      }
    }
    ```

2.  **Prompt Refinement (Server-Side):**
    Ensure `textFormatter.ts` explicitly instructs the AI: "Return ONLY the formatted version of the NEW text. Do NOT include the context text in the output." (This is already largely in place but can be reinforced).

---

## Next Steps

1.  **Apply Fix 1:** Add the `isRecording` check to `ClipMasterScreen.tsx` to stop the 500 errors.
2.  **Apply Fix 2:** Update the text update logic in `ClipMasterScreen.tsx` to prevent duplication.
3.  **Verify:** Test an Append Mode recording to confirm it doesn't stop and doesn't duplicate text.
