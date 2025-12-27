# Fix Text Formatting Display Issues

## Problem Summary
The formatted text is generated successfully (as seen in terminal logs) but never displayed because:
- `contentBlocks` stores raw text immediately, before formatting completes
- Processing state transitions to "complete" too early (on transcription, not on formatting)
- User never sees the formatted version

---

# Implementation Plan: Offline Recording Flow Fix
Based on findings in [code_analysis.md](file:///Users/ethan/.gemini/antigravity/brain/9bcd06f4-e9b5-4818-bbcb-eb094a154004/code_analysis.md) plus user feedback.

## Proposed Changes

### Component: Text Display Flow
**IMPORTANT**: The key fix: Keep showing "processing" until both transcription AND formatting are complete.

### Problems Identified (from code_analysis.md)
- **Missing transcription call** - Removed `transcribeRecording()` entirely, so online recordings never transcribe
- **Offline toast shows always** - No distinction between online/offline scenarios
- **ClipOffline never displays** - [getDisplayPendingClips()](file:///Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/components/ui/ClipMasterScreen.tsx#576-585) doesn't convert `selectedClip.audioId` to displayable format
- **Binary network thinking** - Code assumed static online/offline, but network state is dynamic

### [MODIFY] [ClipMasterScreen.tsx](file:///Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/components/ui/ClipMasterScreen.tsx)

#### Change 1: Track formatting completion
Add a state to track when formatting is complete:
```typescript
// Add new state
const [isFormatting, setIsFormatting] = useState(false);
```

#### Change 2: Delay transition to "complete" state
Currently, the code transitions to 'complete' state as soon as transcription arrives (line ~586):
```typescript
- // Current: Transition immediately on transcription
- setRecordNavState('complete');
+ // New: Only transition after formatting is done
+ // (moved to formatTranscriptionInBackground callback)
```

#### Change 3: Update `formatTranscriptionInBackground` to signal completion
```typescript
const formatTranscriptionInBackground = useCallback(async (rawText: string) => {
+   setIsFormatting(true);
    // ... existing API call ...
    
    if (updatedClip) {
      setSelectedClip(updatedClip);
+     // NOW show the content and transition to complete
+     setContentBlocks([{
+       id: 'formatted-view',
+       text: updatedFormattedText,
+       animate: isFirstTranscription
+     }]);
+     setRecordNavState('complete');
    }
+   setIsFormatting(false);
  }, [...]);
```

#### Change 4: Add format indicator (raw/formatted) in the record bar area
Per your request, add this indicator in ClipMasterScreen, not ClipRecordScreen:
```typescript
// Add near the RecordNavBarVarMorphing component
{recordNavState === 'complete' && selectedClip && (
  <span className="format-indicator">
    {selectedClip.currentView === 'formatted' ? 'Formatted' : 'Raw'}
  </span>
)}
```

## Design Decisions

### 1. Optimistic Transcription (Dynamic Network)
Don't pre-check network state. Instead:
```
Recording completes → audioBlob ready
       ↓
Save audio to IndexedDB (always, safety net)
       ↓
Create/update clip with audioId
       ↓
Attempt transcription (always try)
       ↓
   ┌───────┴───────┐
Success           Failure
   ↓                 ↓
Delete audio     Check error type
Update clip         ↓
Show text      ┌────┴────┐
            Network    Real API
            Error      Error
               ↓          ↓
            Silent    Show toast
            (audio    Reset UI
            saved)
```

### 2. Naming Convention (Two Systems)
| Entity | Format | When Applied |
|--------|--------|--------------|
| **Clip File** (new, no content) | "Recording 001" | Only new clips, never existing |
| **Clip File** (existing) | Keep original name | NEVER change |
| **ClipOffline Component** | "Clip 001" | Always, based on pending count |

**Counters:**
- Recording counter: `clips.filter(c => c.audioId && !c.content).length + 1`
- Clip counter (ClipOffline): `clips.filter(c => c.audioId).length + 1`

### [MODIFY] [textFormatter.ts](file:///Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/api/textFormatter.ts)
Update the formatting prompt to align with your guide from [otherdropdownmenu.md](file:///Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/components/ui/otherdropdownmenu.md) (lines 313-351).

**New prompt (based on your guide):**
```typescript
const FORMATTING_SYSTEM_PROMPT = `You are a text formatter for transcribed speech. Add formatting to make text readable WITHOUT changing any words.
CORE RULE: Use EXACTLY the words provided. Never add, remove, or change words. Only add formatting.
WHAT YOU CAN ADD:
- Punctuation (periods, commas, question marks, dashes etc.)
- Capitalization
- Line breaks and paragraph breaks
- List formatting (numbered or bulleted)
- Quotation marks (only for direct quotes)
SMART FORMATTING GUIDELINES:
Lists:
- Create a list when the speaker is clearly enumerating multiple items
- This includes phrases like "firstly/secondly", "the first thing/the second thing", "there are three things", "one is... another is...", or any pattern where items are being counted/listed
- Use your judgment—if it reads better as a list, make it a list
Dialogue/Quotes:
- Only use quotation marks when the speaker is directly quoting actual words someone said
- Example with quotes: "She said, 'I'll be there at 5'"
- Example WITHOUT quotes: "She told me to be there at 5" (indirect speech, no quotes needed)
- If unsure, don't add quotes
Paragraphs:
- Create new paragraph when speaker shifts conversational mode or direction
- Look for transitional phrases: "So...", "Based on...", "I'm thinking...", "Secondly...", "Another thing..."
- Create break after questions if speaker continues with new point
- Create break when speaker shifts between: describing ↔ proposing, explaining ↔ analyzing, problem ↔ solution
- If a single continuous thought runs very long (5+ sentences), consider adding break for readability
- Don't over-paragraph—only break when there's a clear shift
CONTEXT HANDLING (when existing formatted text is provided):
- Existing text is for context only—DO NOT reformat it
- Format ONLY the new raw text
- Ensure new text flows naturally with existing structure
- If existing text started a list, continue the numbering
PARAGRAPH PLACEMENT for new text:
- If continuing same thought → append directly after last sentence
- If shifting topic/mode → start with TWO newlines (new paragraph)
Return ONLY the formatted text with no explanation.`;
```

## Proposed Changes

### [MODIFY] [ClipMasterScreen.tsx](file:///Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/components/ui/ClipMasterScreen.tsx)

#### Change 1: Rename and fix audioBlob handler (lines 339-384)
**Current:** `saveAudioForLater` - only saves, never transcribes
**New:** `handleRecordingComplete` - saves audio, attempts transcription, handles result

```typescript
const handleRecordingComplete = useCallback(async (blob: Blob) => {
  try {
    // STEP 1: Save audio (always - safety net)
    const audioId = await storeAudio(blob, '0:00', 'recording');
    log.info('Audio saved', { audioId });
    // STEP 2: Create/update clip with audioId
    let targetClip: Clip;
    if (isAppendMode && currentClipId) {
      // EXISTING clip - keep current name!
      updateClip(currentClipId, { audioId });
      targetClip = getClips().find(c => c.id === currentClipId)!;
    } else {
      // NEW clip - use "Recording XXX" format
      const pendingNewClips = getClips().filter(c => c.audioId && !c.content);
      const recordingNumber = pendingNewClips.length + 1;
      const title = `Recording ${recordingNumber.toString().padStart(3, '0')}`;
      
      const newClip = createClip('', recordingNumber);
      updateClip(newClip.id, { audioId, title });
      targetClip = getClips().find(c => c.id === newClip.id)!;
    }
    refreshClips();
    setSelectedClip(targetClip);
    // STEP 3: Attempt transcription (always try)
    try {
      await transcribeRecording();
      // Success handled by transcription success useEffect
    } catch (error) {
      // Transcription failed - check if network or real error
      const isNetworkError = !navigator.onLine || 
        (error instanceof Error && error.message.includes('fetch'));
      
      if (isNetworkError) {
        // Expected when offline - show offline toast, audio already saved
        setShowOfflineToast(true);
        log.info('Transcription failed (offline), audio saved');
      } else {
        // Real API error - show error toast
        setShowErrorToast(true);
        log.error('Transcription API error', error);
      }
    }
  } catch (error) {
    log.error('Failed to save audio', error);
    setShowErrorToast(true);
  }
}, [isAppendMode, currentClipId, refreshClips, transcribeRecording]);
```

#### Change 2: Fix [getDisplayPendingClips](file:///Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/components/ui/ClipMasterScreen.tsx#576-585) (lines 576-584)
**Current:** Only returns `selectedPendingClip` or `pendingClips` prop
**New:** Also converts `selectedClip` with `audioId` to displayable PendingClip

```typescript
const getDisplayPendingClips = (): PendingClip[] => {
  // If selectedClip has audioId (pending transcription)
  if (selectedClip?.audioId) {
    // Count ALL pending clips for "Clip XXX" naming
    const allPendingCount = getClips().filter(c => c.audioId).length;
    const clipNumber = allPendingCount.toString().padStart(3, '0');
    
    return [{
      id: selectedClip.id,
      title: `Clip ${clipNumber}`,
      time: '0:00',
      status: 'waiting'
    }];
  }
  
  if (selectedPendingClip) return [selectedPendingClip];
  return pendingClips;
};
```

#### Change 3: Remove duplicate error handling (lines 533-540)
**Current:** Shows error toast for ALL transcription errors
**New:** Remove this effect - error handling now in `handleRecordingComplete`

```typescript
// REMOVE this entire useEffect
// useEffect(() => {
//   if (transcriptionError) {
//     log.error('Transcription error', transcriptionError);
//     setShowErrorToast(true);
//     setRecordNavState('record');
//   }
// }, [transcriptionError]);
```

## Data Flow After Fix
1. Recording Complete
2. Raw transcription received
3. Stay in 'processing' state
4. Call format-text API
5. Formatted text received
6. Store formattedText in clip
7. Update contentBlocks with formatted text
8. Transition to 'complete' state
9. User sees FORMATTED text

## Verification Plan

### Automated Tests
- Recording flow test: Record audio with "firstly, secondly, thirdly" → verify list formatting appears
- Structure toggle test: Click Structure button → verify switch between formatted/raw views

### Manual Verification
- Record a clip saying "Firstly I want to do X. Secondly I want to do Y. Thirdly I want to do Z."
- Verify the text appears as a numbered list after processing
- Click Structure button → verify it switches to raw unformatted view
- Click Structure again → verify it switches back to formatted view

## Summary of Files to Modify
| File | Change |
|------|--------|
| [ClipMasterScreen.tsx](file:///Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/components/ui/ClipMasterScreen.tsx) | Add isFormatting state, delay complete transition, add format indicator, rename/fix handler, fix display clips, remove error effect |
| [textFormatter.ts](file:///Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/api/textFormatter.ts) | Update prompt to match otherdropdownmenu.md guide |

## Test Scenarios
- **Online recording** - Should transcribe immediately, no offline toast
- **Offline recording** - Should save audio, show ClipOffline, show offline toast
- **Start online → go offline → Done** - Should handle gracefully (transcription fails, audio saved)
- **Append to existing clip (offline)** - Should keep original clip name, add ClipOffline
- **New clip (offline)** - Should use "Recording 001" format
- **Network reconnect** - Should trigger batch transcription of pending clips

### Expected UI States
| Scenario | Clip File Name | ClipOffline Shows | Toast |
|----------|----------------|-------------------|-------|
| Online success | AI-generated | No | Copy toast |
| Offline new | "Recording 001" | Yes "Clip 001" | Offline toast |
| Offline append | Original name | Yes "Clip 001" | Offline toast |
| API error | Depends | No | Error toast |
