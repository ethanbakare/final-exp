Fix Nav Bar Stuck in Processing State
Root Cause Analysis
What Changed Between Working (Before 033_v4) and Broken (Now)
Before 033_v6 (WORKING):

setRecordNavState('complete') was called in handleDoneClick at line 559
Called IMMEDIATELY after starting formatting (too early for timing, but always executed)
NO condition check - always called unconditionally
After 033_v6 (BROKEN):

Moved setRecordNavState('complete') INSIDE formatTranscriptionInBackground (correct timing)
BUT added condition: if (selectedClip?.id === clipId)
This condition FAILS for new clips because:
selectedClip is derived from Zustand selector: useClipStore(state => currentClipId ? state.clips.find(c => c.id === currentClipId) : null)
After calling setCurrentClipId(newClip.id), React hasn't re-rendered yet
Formatting completes VERY FAST (50-500ms) BEFORE React re-renders
selectedClip still has OLD value (null) during formatting callback
Condition fails → setRecordNavState('complete') never called
Why the Condition Was Added (Flawed Logic)
From 033_v6 document:

> "Only switch nav state if we're currently viewing this clip. If user navigated away during formatting, don't change nav state."This logic is WRONG because:

recordNavState controls the RECORDING screen's nav bar, not the home screen
If you just clicked "Done" on a recording, you ARE viewing that clip's recording screen
You can't "navigate away" during the 50-500ms formatting window - UI is blocked in "processing" state
The condition serves no purpose and creates a race condition
The Fix
Solution: Remove the Condition Check
Keep the correct timing (inside formatTranscriptionInBackground) but remove the problematic condition.

Changes Required
File: ClipMasterScreen.tsx

Change 1: Success Path (Line ~857-862)
Before (Broken):

// Switch nav bar to complete state now that formatted text is ready
if (selectedClip?.id === clipId) {  // ❌ Condition fails due to race
  console.info('[Formatting] Calling setRecordNavState(complete) for clip:', clipId);
  setRecordNavState('complete');
} else {
  console.warn('[Formatting] NOT calling setRecordNavState - selectedClip mismatch...');
}
After (Fixed):

// Switch nav bar to complete state now that formatted text is ready
console.info('[Formatting] Calling setRecordNavState(complete) for clip:', clipId);
setRecordNavState('complete');


Change 2: Auto-Copy Path (Line ~872-881)
Before (Broken):

// Auto-copy if this is the selected clip
if (selectedClip?.id === clipId) {  // ❌ Condition fails due to race
  const updatedClip = getClipById(clipId);
  if (updatedClip) {
    const textToCopy = updatedClip.currentView === 'raw'
      ? updatedClip.rawText
      : updatedClip.formattedText;
    navigator.clipboard.writeText(textToCopy);
    setShowCopyToast(true);
  }
}
After (Fixed):

// Auto-copy formatted text to clipboard
const updatedClip = getClipById(clipId);
if (updatedClip) {
  const textToCopy = updatedClip.currentView === 'raw'
    ? updatedClip.rawText
    : updatedClip.formattedText;
  navigator.clipboard.writeText(textToCopy);
  setShowCopyToast(true);
}


Change 3: Error Path (Line ~893-899)
Before (Broken):

// Switch nav bar to complete state (fallback text is displayed)
if (selectedClip?.id === clipId) {  // ❌ Condition fails due to race
  console.info('[Formatting] Calling setRecordNavState(complete) after fallback for clip:', clipId);
  setRecordNavState('complete');
} else {
  console.warn('[Formatting] NOT calling setRecordNavState after fallback - selectedClip mismatch...');
}
After (Fixed):

// Switch nav bar to complete state (fallback text is displayed)
console.info('[Formatting] Calling setRecordNavState(complete) after fallback for clip:', clipId);
setRecordNavState('complete');


Why This is the Correct Fix
Preserves 033_v6 timing fix: Still calls setRecordNavState('complete') AFTER formatting completes, not before
Removes race condition: No longer depends on selectedClip which requires React re-render
Returns to working behavior: Unconditional call like before 033_v6, but with correct timing
Simple and clean: Removes unnecessary complexity
Expected Results
After this fix:

Nav bar will transition from 'processing' to 'complete' when formatting finishes
Copy/Instructor buttons will appear when text slides in
"Copied to clipboard" toast will show
Works for both new clips and append mode
No console warnings about "selectedClip mismatch"
Testing
Create new recording
Click Done
Verify nav bar shows "Processing..."
Wait for text to appear (~500ms)
Verify nav bar switches to show Copy/Instructor buttons AT SAME TIME as text
Verify "Copied to clipboard" toast appears