# Copy Timing Fix - Wait for Formatted Text

## Issue

Auto-copy and copy toast trigger when **raw text** is ready, but should wait for **formatted text**.

User sees "Copy to clipboard" toast while still in processing state, before formatted text appears.

---

## Current Flow (Wrong)

```
Raw text ready
    ↓
Auto-copy raw text (line 908)
Show toast (line 912)
    ↓
Formatting starts (async)
    ↓
Formatted text ready → 'complete' state
```

---

## Correct Flow

```
Raw text ready
    ↓
Formatting starts (async)
    ↓
Formatted text ready
    ↓
Auto-copy FORMATTED text
Show toast
'complete' state
```

---

## What to Move

**From:** Lines 907-914 in transcription success useEffect
```typescript
// REMOVE from current location:
navigator.clipboard.writeText(finalRawText).catch(() => { });
if (!hasShownTranscriptionToast.current) {
  setShowCopyToast(true);
  hasShownTranscriptionToast.current = true;
}
```

**To:** Inside `formatTranscriptionInBackground()`, after `setContentBlocks()`:
```typescript
// After setting content blocks with formatted text:
setContentBlocks([{
  id: `formatted-full-${Date.now()}`,
  text: updatedFormattedText,
  animate: false
}]);

// ADD auto-copy and toast HERE (after formatted text is ready):
navigator.clipboard.writeText(updatedFormattedText).catch(() => { });
if (!hasShownTranscriptionToast.current) {
  setShowCopyToast(true);
  hasShownTranscriptionToast.current = true;
}

// Then transition to complete:
setRecordNavState('complete');
```

---

## Changes Summary

| Item | Before | After |
|------|--------|-------|
| Copy trigger | Raw text ready | Formatted text ready |
| What's copied | `finalRawText` | `updatedFormattedText` |
| Toast trigger | Before formatting | After formatting |

---

## Files to Modify

| File | Change |
|------|--------|
| `ClipMasterScreen.tsx` | Move auto-copy and toast into `formatTranscriptionInBackground` |

---

## Note

`hasShownTranscriptionToast` ref must be accessible in `formatTranscriptionInBackground`. If it's not in scope, either:
- Pass it as a parameter
- Move it to a ref that's accessible
- Use a different mechanism to track "shown once per session"

---

## Fallback Toast (When Formatting Fails)

When formatting API fails but transcription succeeded, show a different toast message.

**Fallback paths (lines 659-701 and 802-851):**

In these fallback sections, the code already copies raw text and shows toast. Change the toast message to inform user:

```typescript
// In fallback paths, instead of normal copy toast:
// Show a different toast message to inform user formatting didn't work

// Option 1: Use a different toast type/message
setShowFormattingFailedToast(true);  // "Copied without formatting."

// Option 2: If using same toast, set a flag to change message
setToastMessage("Copied without formatting.");
setShowCopyToast(true);
```

**Toast message option:**
- "Copied without formatting."

This way user knows:
1. Their recording was saved
2. Something went wrong with formatting
3. They still have their text
