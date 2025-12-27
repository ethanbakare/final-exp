# Transcription Stuck on Processing - Root Cause Analysis

**Date:** Dec 24, 2025  
**Symptom:** Transcriptions get stuck on processing state and never complete

---

## 🔍 **Expected Flow**

```
User clicks "Done" → stopRecording()
↓
audioBlob created & saved to IndexedDB
↓
recordNavState = 'processing'
↓
Auto-transcribe useEffect (line 664) checks conditions
↓
Calls transcribeRecording() via transcribeRef
↓
API call to /api/clipperstream/transcribe
↓
Success: setTranscription(data.transcript)
↓
Processing useEffect (line 948) triggers
↓
Calls formatTranscriptionInBackground()
↓
API call to /api/clipperstream/format-text
↓
Success: setRecordNavState('complete')
```

---

## 🐛 **Potential Break Points**

### **Break Point 1: Auto-Transcribe Conditions Not Met**

**File:** `ClipMasterScreen.tsx` Lines 664-668

```typescript
useEffect(() => {
  if (audioBlob && !isTranscribing && !transcription && !transcriptionError && recordNavState === 'processing') {
    transcribeRef.current();
  }
}, [audioBlob, isTranscribing, transcription, transcriptionError, recordNavState]);
```

**Required Conditions (ALL must be true):**
1. ✅ `audioBlob` exists
2. ✅ `!isTranscribing` (not currently transcribing)
3. ✅ `!transcription` (no transcription yet)
4. ✅ `!transcriptionError` (no error)
5. ✅ `recordNavState === 'processing'`

**Possible Failure:**
- If `transcription` is NOT being cleared before starting new recording
- If `transcriptionError` was set from previous recording and not cleared
- If `isTranscribing` gets stuck at `true`

---

### **Break Point 2: transcribeRecording() Not Being Called**

**File:** `ClipMasterScreen.tsx` Lines 131-134

```typescript
const transcribeRef = useRef(transcribeRecording);
useEffect(() => {
  transcribeRef.current = transcribeRecording;
}, [transcribeRecording]);
```

**Possible Failure:**
- If `transcribeRecording` from hook is undefined/null
- If `transcribeRef.current()` throws an error silently

---

### **Break Point 3: API Call Fails Silently**

**File:** `useClipRecording.ts` Lines 258-387

The transcription API call could fail without setting proper error state if:
- Network timeout (30s) - should set error
- Server error - should set error  
- Invalid response - should set error

**BUT**: If there's an uncaught exception outside the try/catch, `isTranscribing` might stay `true` forever.

---

### **Break Point 4: State Not Cleared from Previous Recording**

**File:** `ClipMasterScreen.tsx` Line 273 (`handleRecordClick`)

```typescript
const handleRecordClick = async () => {
  // CRITICAL: Clear previous transcription FIRST to prevent flash/duplication
  resetRecording();
  // ...
}
```

**What `resetRecording()` should clear:**
- `setTranscription('')` ✅
- `setTranscriptionError(null)` ✅
- `setIsTranscribing(false)` ✅
- `setAudioBlob(null)` ✅

**Possible Failure:**
- If user made changes that bypass `resetRecording()`
- If recording is started a different way (not via `handleRecordClick`)

---

### **Break Point 5: Processing useEffect Conditions Not Met**

**File:** `ClipMasterScreen.tsx` Lines 948-950

```typescript
useEffect(() => {
  if (transcription && recordNavState === 'processing' && !isFormatting) {
    // Process transcription...
  }
}, [transcription, recordNavState, isAppendMode, currentClipId, ...]);
```

**Required Conditions (ALL must be true):**
1. ✅ `transcription` exists (set by hook)
2. ✅ `recordNavState === 'processing'`
3. ✅ `!isFormatting` (not currently formatting)

**Possible Failure:**
- If `recordNavState` changes from 'processing' before `transcription` is set
- If `isFormatting` is stuck at `true`
- If `transcription` is set but empty string (falsy)

---

## 🎯 **Most Likely Culprits**

### **#1: State Not Being Cleared (90% confidence)**

If the user made changes that affect when `resetRecording()` is called, old state could be blocking new transcriptions:

```typescript
// OLD transcription still in state from previous recording
transcription = "old text"  // ❌ Blocks auto-transcribe (condition: !transcription)

// OR

isTranscribing = true  // ❌ Stuck from previous attempt
```

### **#2: isTranscribing Stuck at True (80% confidence)**

If there's an uncaught error in `transcribeRecording()`, the `finally` block might not execute:

```typescript
finally {
  // Only set to false if we're not retrying
  if (!retryTimerRef.current) {
    setIsTranscribing(false);  // ← If this doesn't run, stuck forever
  }
}
```

### **#3: recordNavState Changed Unexpectedly (60% confidence)**

If user modified code that changes `recordNavState` during processing, it could break the auto-transcribe or processing conditions.

---

## 🔧 **Diagnostic Steps**

### **Step 1: Check Browser Console**

Ask user to open DevTools Console and:
1. Start a new recording
2. Click "Done"
3. Look for:
   - ✅ `🟢 Starting transcription` (from useClipRecording)
   - ✅ `Processing transcription` (from ClipMasterScreen)
   - ❌ Any errors or warnings
   - ❌ Missing log messages

### **Step 2: Check State Values**

Add temporary debug log to auto-transcribe useEffect:

```typescript
useEffect(() => {
  console.log('🔍 AUTO-TRANSCRIBE CHECK:', {
    audioBlob: !!audioBlob,
    isTranscribing,
    transcription: !!transcription,
    transcriptionError,
    recordNavState
  });
  
  if (audioBlob && !isTranscribing && !transcription && !transcriptionError && recordNavState === 'processing') {
    console.log('✅ Calling transcribeRecording...');
    transcribeRef.current();
  }
}, [audioBlob, isTranscribing, transcription, transcriptionError, recordNavState]);
```

**Expected Output:**
```
🔍 AUTO-TRANSCRIBE CHECK: {
  audioBlob: true,
  isTranscribing: false,
  transcription: false,
  transcriptionError: null,
  recordNavState: "processing"
}
✅ Calling transcribeRecording...
```

**If missing "✅ Calling..."**: One of the conditions is failing.

### **Step 3: Check Processing useEffect**

Add temporary debug log:

```typescript
useEffect(() => {
  console.log('🔍 PROCESSING CHECK:', {
    transcription: !!transcription,
    recordNavState,
    isFormatting
  });
  
  if (transcription && recordNavState === 'processing' && !isFormatting) {
    console.log('✅ Processing transcription...');
    // ... existing logic
  }
}, [transcription, recordNavState, ...]);
```

### **Step 4: Check API Route**

Verify `/api/clipperstream/transcribe` is working:

```bash
# In terminal, test the API directly
curl -X POST http://localhost:3000/api/clipperstream/transcribe \
  -F "audio=@test-audio.webm"
```

Expected response:
```json
{
  "success": true,
  "transcript": "Hello world"
}
```

---

## 🛠️ **Quick Fixes to Try**

### **Fix 1: Force Clear State in handleRecordClick**

```typescript
const handleRecordClick = async () => {
  // CRITICAL: Clear ALL state synchronously
  resetRecording();
  
  // Extra safety: clear local state too
  setTranscription('');  // Ensure cleared
  setTranscriptionError(null);
  setIsTranscribing(false);
  setIsFormatting(false);  // Clear formatting flag too
  
  // ... rest of logic
}
```

### **Fix 2: Add Fallback Timer**

If transcription doesn't complete after 60s, force error state:

```typescript
useEffect(() => {
  if (recordNavState === 'processing') {
    const timeout = setTimeout(() => {
      console.error('⏰ Transcription timeout - forcing error state');
      setShowErrorToast(true);
      setRecordNavState('record');
    }, 60000);  // 60 seconds
    
    return () => clearTimeout(timeout);
  }
}, [recordNavState]);
```

### **Fix 3: Check for Stuck isTranscribing**

Add safety check to auto-transcribe:

```typescript
useEffect(() => {
  // Safety: If isTranscribing stuck for >60s, force clear
  if (isTranscribing && recordNavState === 'processing') {
    const timeout = setTimeout(() => {
      console.error('⚠️ isTranscribing stuck - forcing clear');
      // This would need to be exposed from useClipRecording hook
      // For now, user needs to refresh page
    }, 60000);
    
    return () => clearTimeout(timeout);
  }
}, [isTranscribing, recordNavState]);
```

---

## 📊 **What User Changed (Need to Investigate)**

The user mentioned they made changes. Possible areas:

1. **handleRecordClick modifications**: Did they remove `resetRecording()`?
2. **useEffect dependencies**: Did they add/remove dependencies that break the flow?
3. **State initialization**: Did they add initial values that conflict?
4. **API routes**: Did they modify the transcription API?
5. **Hook modifications**: Did they change `useClipRecording`?

---

## 🎯 **Next Steps**

1. **Ask user to add debug console.log** at line 664 to check conditions
2. **Ask user to check browser console** for any errors
3. **Ask user what changes they made** since last working version
4. **Test API route directly** to rule out backend issues
5. **Check if** `resetRecording()` is being called before each recording

---

## ✅ **Resolution Checklist**

- [ ] Identify which condition is failing in auto-transcribe check
- [ ] Verify `resetRecording()` is called before each recording
- [ ] Verify API route is working (`/api/clipperstream/transcribe`)
- [ ] Check for stuck state (`isTranscribing`, `isFormatting`)
- [ ] Review user's recent changes
- [ ] Add temporary debug logs to trace flow
- [ ] Test with simple recording (clear speech, no background noise)

