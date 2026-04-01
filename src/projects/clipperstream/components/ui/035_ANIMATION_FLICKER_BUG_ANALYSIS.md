# 035 - Animation Flicker Bug When Going Back to Home Screen

**Date**: December 31, 2025  
**Status**: BUG IDENTIFIED - Animation flicker on first back navigation  
**Type**: UI Bug - Missing animation variant reset

---

## The Bug

### User Report

When finishing the **first recording** and pressing the **Back button** to return to home screen:
- ❌ Animation flickers (copy/structure buttons don't disappear smoothly)
- ❌ Seems to use "old animation style"

When going back to home screen **after viewing the clip again**:
- ✅ Animation works properly (buttons disappear smoothly)

When pressing **New Clip button** (instead of Back):
- ✅ Animation works properly (buttons disappear smoothly)

### Only Affects Back Button → Home Screen

- ✅ New Clip button works fine
- ❌ Back button flickers

---

## Root Cause Analysis

### Animation Variant System

There are two animation variants for the RecordNavBar:

1. **`'morph'`**: Normal recording flow
   - Used when: record → recording → processing → complete
   - Smooth morphing transitions between states

2. **`'fade'`**: Direct transitions
   - Used when: Viewing existing clip, resetting to record, navigating away
   - Simple fade in/out of buttons

### The Problem

**File**: [`ClipMasterScreen.tsx`](ClipMasterScreen.tsx)

#### `handleBackClick` (Lines 282-297) - MISSING `setAnimationVariant`

```typescript
const handleBackClick = useCallback(() => {
  // Navigate back from record to home screen (via "Clips" button only)
  // Reset all recording state and return to home
  setIsAppendMode(false);
  setCurrentClipId(null);
  setAppendBaseContent('');
  setSelectedPendingClips([]);
  resetRecording();
  setRecordNavState('record');
  setActiveScreen('home');
  
  // ❌ MISSING: setAnimationVariant('fade');
  
  log.info('Navigated to home screen (cleared pending context)', {
    clearedContext: true
  });
}, [resetRecording]);
```

#### `handleNewClipClick` (Lines 301-315) - HAS `setAnimationVariant` ✅

```typescript
const handleNewClipClick = useCallback(() => {
  setIsAppendMode(false);
  setCurrentClipId(null);
  setAppendBaseContent('');
  setSelectedPendingClips([]);
  resetRecording();
  setAnimationVariant('fade');  // ✅ CORRECT: Sets fade variant
  setRecordNavState('record');
  
  log.info('Starting new recording (cleared pending context)', {
    clearedContext: true
  });
}, [resetRecording]);
```

---

## Why This Causes the Flicker

### Step-by-Step Flow

1. **User completes first recording**:
   - `animationVariant` is `'morph'` (from the recording flow)
   - `recordNavState` is `'complete'` (showing Copy/Structure buttons)

2. **User presses Back button**:
   - `handleBackClick` is called
   - `setRecordNavState('record')` is called
   - `setActiveScreen('home')` is called
   - **BUT `animationVariant` is NOT updated** ❌

3. **RecordNavBar tries to animate**:
   - Nav bar receives `variant='morph'` (old value)
   - Nav bar receives `navState='record'` (new value)
   - **Morph animation is designed for recording flow, not for "going back"**
   - **This causes the flicker/wrong animation**

4. **Next time user goes back**:
   - If they clicked a clip to view it, `setAnimationVariant('fade')` was called (line 268 or 274)
   - Now when they press Back, even though Back doesn't set the variant, it's already `'fade'`
   - Animation works correctly ✅

---

## Why New Clip Button Works

`handleNewClipClick` explicitly sets `setAnimationVariant('fade')` at line 308, so the animation is always correct.

---

## The Fix

### Add `setAnimationVariant('fade')` to `handleBackClick`

**File**: [`ClipMasterScreen.tsx`](ClipMasterScreen.tsx)  
**Line**: 291 (after `setRecordNavState('record')`)

**Before**:
```typescript
const handleBackClick = useCallback(() => {
  setIsAppendMode(false);
  setCurrentClipId(null);
  setAppendBaseContent('');
  setSelectedPendingClips([]);
  resetRecording();
  setRecordNavState('record');
  setActiveScreen('home');
  
  log.info('Navigated to home screen (cleared pending context)', {
    clearedContext: true
  });
}, [resetRecording]);
```

**After**:
```typescript
const handleBackClick = useCallback(() => {
  setIsAppendMode(false);
  setCurrentClipId(null);
  setAppendBaseContent('');
  setSelectedPendingClips([]);
  resetRecording();
  setAnimationVariant('fade');  // ✅ FIX: Use fade for smooth transition
  setRecordNavState('record');
  setActiveScreen('home');
  
  log.info('Navigated to home screen (cleared pending context)', {
    clearedContext: true
  });
}, [resetRecording]);
```

---

## Why `'fade'` is Correct

- `'fade'` is used for **direct transitions** (non-recording flows)
- Going back to home screen is a direct navigation, not part of the recording flow
- This matches the behavior in:
  - `handleNewClipClick` (line 308) - same type of navigation
  - `handleClipClick` (lines 268, 274) - viewing existing clips

---

## Testing Checklist

### Test 1: First Recording Back Navigation ✅
1. Start on Home Screen
2. Press Record button (new recording)
3. Record audio, press Done
4. Wait for "Processing..." → text appears → Copy/Structure buttons show
5. Press **Back button** (top left "Clips" button)
6. **Expected**: Smooth fade animation, buttons disappear cleanly
7. **Expected**: No flicker, no "old animation style"

### Test 2: Subsequent Back Navigation ✅
1. Click the clip you just created
2. View it on Record Screen (Copy/Structure buttons showing)
3. Press **Back button**
4. **Expected**: Same smooth fade animation

### Test 3: New Clip Button Still Works ✅
1. View existing clip on Record Screen
2. Press **New Clip button** (pencil icon)
3. **Expected**: Smooth transition, buttons disappear
4. **Expected**: No regression, works same as before

### Test 4: Multiple Recordings ✅
1. Create multiple recordings back-to-back
2. After each one, press Back button
3. **Expected**: Consistent smooth animation every time

---

## Files to Change

- `final-exp/src/projects/clipperstream/components/ui/ClipMasterScreen.tsx`:
  - Line 291: Add `setAnimationVariant('fade');` after `resetRecording();`

---

## Related Code

### Where Animation Variants are Set

1. **Line 160**: State initialization → `'morph'`
2. **Line 268**: Viewing transcribed clip → `'fade'`
3. **Line 274**: Viewing pending clip → `'fade'`
4. **Line 308**: New clip button → `'fade'` ✅
5. **Line 331**: Recording from home → `'morph'`
6. **Line 345**: Recording from existing clip → `'morph'`
7. **Line 376**: Recording from record screen → `'morph'`
8. **Line 291**: **MISSING** - Back button → should be `'fade'` ❌

---

**End of Document**

