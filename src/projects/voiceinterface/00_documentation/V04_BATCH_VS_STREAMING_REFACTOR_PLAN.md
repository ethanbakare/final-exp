# V04: Batch vs Streaming Text Components Refactor

## 🎯 Objective
Refactor `VoiceTextStates.tsx` into two separate components with clear separation of concerns:
- **`VoiceTextBatch.tsx`** - For Variants 1 & 2 (request-response pattern)
- **`VoiceTextStreaming.tsx`** - For Variant 3 (real-time streaming pattern)

## 📋 Current State Analysis

### Files to Modify:
1. `src/projects/voiceinterface/components/ui/VoiceTextStates.tsx` (currently used by all variants)
2. `src/projects/voiceinterface/components/VoiceTextBoxStandard.tsx` (V1)
3. `src/projects/voiceinterface/components/VoiceTextBoxCheckClose.tsx` (V2)
4. `src/projects/voiceinterface/components/VoiceTextWrapperLive.tsx` (V3)

### Current Issues:
- Single component trying to handle both batch and streaming
- Animation logic triggers incorrectly for V3
- Opacity logic doesn't match streaming behavior
- Duplication issue in V3 (missing `is_final` check)

---

## 🏗️ Implementation Steps

### **Phase 1: Create VoiceTextBatch.tsx**

**File:** `src/projects/voiceinterface/components/ui/VoiceTextBatch.tsx`

**Purpose:** Handle batch transcription display (V1 & V2)

**Features:**
- States: `idle`, `recording`, `processing`, `results`
- Placeholder in idle state
- Full text dimmed (30%) during recording/processing
- Animation on results state (word-by-word fade-in)
- Handles text appending with animation only for new text

**Props:**
```typescript
interface VoiceTextBatchProps {
  textState: 'idle' | 'recording' | 'processing' | 'results';
  transcriptText: string;
  oldTextLength: number;
}
```

**Logic:**
- If `idle`: Show placeholder
- If `recording` or `processing`: Show full text at 30% opacity
- If `results`: 
  - If appending (`oldTextLength > 0`): Old text static 90%, space, new text animated 90%
  - If first recording: Animate entire text

**Source:** Copy from current `VoiceTextStates.tsx` (this is the batch logic that already works)

---

### **Phase 2: Create VoiceTextStreaming.tsx**

**File:** `src/projects/voiceinterface/components/ui/VoiceTextStreaming.tsx`

**Purpose:** Handle streaming transcription display (V3 only)

**Features:**
- States: `idle`, `recording`, `complete`
- Placeholder in idle state
- Text appears live at 90% during recording (no animation)
- Text stays at 90% in complete state (no animation)
- When appending: old text → 30%, new streaming text → 90%

**Props:**
```typescript
interface VoiceTextStreamingProps {
  textState: 'idle' | 'recording' | 'complete';
  transcriptText: string;
  oldTextLength: number;
}
```

**Logic:**
- If `idle`: Show placeholder
- If `recording`:
  - If appending (`oldTextLength > 0`): 
    - Old text at 30% opacity
    - New text at 90% opacity (no animation, just appears)
  - If first recording: Full text at 90% opacity
- If `complete`: Full text at 90% opacity (static, no animation)

**Key Difference from Batch:**
- NO `VoiceTextAnimation` component usage
- NO `processing` state
- NO animation on complete
- Text is visible DURING recording at 90%

---

### **Phase 3: Update V1 (VoiceTextBoxStandard.tsx)**

**Changes:**
```typescript
// OLD import
import { VoiceTextStates, VoiceTextState } from './ui/VoiceTextStates';

// NEW import
import { VoiceTextBatch } from './ui/VoiceTextBatch';

// Update state mapping (no change needed, already correct)
const getTextState = () => {
  if (appState === 'complete') return 'results';
  return appState;
};

// Update component usage
<VoiceTextBatch
  textState={getTextState()}
  transcriptText={transcription}
  oldTextLength={oldTextLengthRef.current}
/>
```

---

### **Phase 4: Update V2 (VoiceTextBoxCheckClose.tsx)**

**Changes:**
```typescript
// OLD import
import { VoiceTextStates, VoiceTextState } from './ui/VoiceTextStates';

// NEW import
import { VoiceTextBatch } from './ui/VoiceTextBatch';

// Update state mapping (combo → results)
const getTextState = () => {
  if (appState === 'combo') return 'results';
  return appState;
};

// Update component usage
<VoiceTextBatch
  textState={getTextState()}
  transcriptText={transcription}
  oldTextLength={oldTextLengthRef.current}
/>
```

---

### **Phase 5: Update V3 (VoiceTextWrapperLive.tsx)**

**Changes:**

**5a. Import new component:**
```typescript
// OLD import
import { VoiceTextStates, VoiceTextState } from './ui/VoiceTextStates';

// NEW import
import { VoiceTextStreaming } from './ui/VoiceTextStreaming';
```

**5b. Update state mapping:**
```typescript
// OLD (maps complete → results, triggers animation)
const getTextState = (): VoiceTextState => {
  if (appState === 'complete') return 'results';
  return appState as VoiceTextState;
};

// NEW (no mapping, stays as 'complete')
const getTextState = () => {
  return appState; // 'idle', 'recording', or 'complete'
};
```

**5c. Fix duplication - add is_final check:**
```typescript
// OLD (line 99-105 approx)
connection.on(LiveTranscriptionEvents.Transcript, (data) => {
  const transcript = data.channel.alternatives[0].transcript;
  if (transcript && transcript.trim()) {
    setTranscription(prev => {
      const separator = prev ? ' ' : '';
      return prev + separator + transcript;
    });
  }
});

// NEW (check is_final and speech_final)
connection.on(LiveTranscriptionEvents.Transcript, (data) => {
  const { is_final: isFinal, speech_final: speechFinal } = data;
  const transcript = data.channel.alternatives[0].transcript;
  
  // Only append final, complete utterances (prevents duplication)
  if (transcript && transcript.trim() && isFinal && speechFinal) {
    setTranscription(prev => {
      const separator = prev ? ' ' : '';
      return prev + separator + transcript;
    });
  }
});
```

**5d. Update component usage:**
```typescript
<VoiceTextStreaming
  textState={getTextState()}
  transcriptText={transcription}
  oldTextLength={prevTextLengthRef.current}
/>
```

---

### **Phase 6: Delete Old Component**

**File:** `src/projects/voiceinterface/components/ui/VoiceTextStates.tsx`

**Action:** Delete (no longer needed after all variants updated)

---

## 📊 Before/After Comparison

### Before (Current):
```
VoiceTextStates.tsx
├─ Handles V1, V2, V3 (all mixed together)
├─ variation={1|2|3} prop
├─ Complex conditional logic
└─ Animation triggers incorrectly for V3

V1 → VoiceTextStates (variation=1)
V2 → VoiceTextStates (variation=2)
V3 → VoiceTextStates (variation=3) ❌ Wrong behavior
```

### After (Proposed):
```
VoiceTextBatch.tsx
├─ Handles V1, V2 only
├─ States: idle, recording, processing, results
├─ Animation on results
└─ 30% → animate → 90%

VoiceTextStreaming.tsx
├─ Handles V3 only
├─ States: idle, recording, complete
├─ NO animation
└─ 90% live during recording

V1 → VoiceTextBatch ✅
V2 → VoiceTextBatch ✅
V3 → VoiceTextStreaming ✅ Correct behavior
```

---

## 🎨 Visual Behavior Reference

### VoiceTextBatch (V1/V2):
```
IDLE: "Press record to start" (placeholder)
  ↓ [Record]
RECORDING: "Hello world" (30% opacity, dimmed)
  ↓ [Stop]
PROCESSING: "Hello world" (30% opacity, dimmed)
  ↓ [API returns]
RESULTS: "Hello" "world" (word-by-word animation to 90%)
```

### VoiceTextStreaming (V3):
```
IDLE: "Press record to start" (placeholder)
  ↓ [Record]
RECORDING: "Hello world" (90% opacity, appears as transcribed)
  ↓ [Stop]
COMPLETE: "Hello world" (90% opacity, stays visible)
  ↓ [Record again]
RECORDING: "Hello world" (30%) "How are you" (90% as streamed)
  ↓ [Stop]
COMPLETE: "Hello world How are you" (all 90%)
```

---

## ✅ Success Criteria

After implementation:

1. ✅ V1 & V2 work exactly as before (no regression)
2. ✅ V3 has no text duplication (is_final check)
3. ✅ V3 has no animation on stop (text already visible)
4. ✅ V3 text appears at 90% during recording
5. ✅ V3 old text dims to 30% when recording again
6. ✅ Clean separation: batch logic ≠ streaming logic
7. ✅ No linter errors
8. ✅ Code is maintainable and extensible

---

## 🔧 Files Summary

### Created:
- `src/projects/voiceinterface/components/ui/VoiceTextBatch.tsx`
- `src/projects/voiceinterface/components/ui/VoiceTextStreaming.tsx`

### Modified:
- `src/projects/voiceinterface/components/VoiceTextBoxStandard.tsx`
- `src/projects/voiceinterface/components/VoiceTextBoxCheckClose.tsx`
- `src/projects/voiceinterface/components/VoiceTextWrapperLive.tsx`

### Deleted (Phase 6):
- `src/projects/voiceinterface/components/ui/VoiceTextStates.tsx`

---

## 🏗️ Architecture Rationale

### Why Separate Components?

**Industry Best Practices:**

1. **Single Responsibility Principle**
   - `VoiceTextBatch` → Handles batch text display
   - `VoiceTextStreaming` → Handles streaming text display
   - Each has ONE reason to change

2. **Open/Closed Principle**
   - Want to add V4 with different behavior? Create new component
   - Existing components don't need modification

3. **Testability**
   - Can test batch logic independently from streaming
   - Mock/stub dependencies separately
   - Easier to write unit tests

4. **Real-World Parallel:**
   ```typescript
   // Vercel AI SDK does this:
   useChat()      // For request-response chat
   useCompletion() // For streaming completions
   
   // React Query does this:
   useQuery()     // For fetching
   useMutation()  // For mutations
   
   // We do:
   <VoiceTextBatch />      // V1/V2
   <VoiceTextStreaming />  // V3
   ```

5. **Future-Proofing**
   - What if V3 needs interim results display (gray text)?
   - What if you add V4 with hybrid batch+streaming?
   - Separate components = easy to evolve independently

---

## 🚨 Risk Mitigation

**Risk:** Breaking V1/V2 during refactor
**Mitigation:** Phase 1 is exact copy of existing batch logic

**Risk:** V3 still has issues after refactor
**Mitigation:** Clear separation makes debugging easier

**Risk:** Missed edge cases
**Mitigation:** Test all 3 variants after implementation

---

## 📝 Implementation Notes

- Keep `VoiceTextStates.tsx` until Phase 6 (safety backup)
- Test each variant after its phase is complete
- Commit after each phase for clean history
- No changes to CSS/styling (reuse existing classes)

---

## ⏱️ Estimated Time

- **Phase 1:** 10 min (copy existing code)
- **Phase 2:** 15 min (new logic, simpler)
- **Phase 3-4:** 5 min each (import swaps)
- **Phase 5:** 10 min (import + duplication fix)
- **Phase 6:** 2 min (delete old file)

**Total:** ~50 minutes

---

## 🎯 Next Steps After This Refactor

1. Timer continuation (V3 should continue from where it left off)
2. Copy button functionality (clipboard + visual feedback)
3. Gentle fade-in for streaming text (CSS transitions)
4. Optional: Interim results display (gray text for non-final)

But first, let's get the architecture right! 🚀
