


# ClipStream: Text Display & Formatting Changes

---

## Overview

This document outlines the changes needed to implement smart text formatting and improve the text display behavior in ClipStream. The focus is on context-aware formatting that preserves existing text while intelligently formatting new transcriptions.

---

## 1. Animation Behavior Changes

### Current State
- Slide-in animation (opacity fade) occurs for EVERY new transcription

### New Behavior

**First transcription in clip:**
- Stick to the current animation style we have, the fading animation style we're currently using for elements inside the transcript content div
- Smooth, polished introduction

**Subsequent transcriptions (appending):**
- New text appears INSTANTLY
- No fade animation
- No slide-in effect
- Appears like live typing
- Simply appends to existing text

**Rationale:** First transcription deserves polish. Subsequent appends should feel immediate and natural, not repetitive.

---

## 2. Smart Formatting System

### Formatting Strategy: Context-Aware (Option A)

**How it works:**

**First transcription:**
```
Raw transcription → Send to AI for formatting → Display formatted text → Auto-copy
```

**Subsequent transcriptions:**
```
New raw transcription + Existing formatted text (context) 
  ↓
Send to AI with context
  ↓
AI formats ONLY the new text (using context to understand structure)
  ↓
Append formatted new text to existing text
  ↓
Auto-copy updated full text
```

**Key principle:** Existing formatted text remains unchanged. Only new text gets formatted, but AI uses full context to format it correctly.

**Example:**
```
Existing (formatted): "There are three things I need to do:"
New (raw): "one finish report two email team"

AI receives both for context
AI formats only new text: "1. Finish report\n2. Email team"

Result displayed:
"There are three things I need to do:
1. Finish report
2. Email team"
```

---

## 3. Formatting Prompt Requirements

### Prompt Must Handle

**Paragraph decisions:**
- Determine if new text should start a new paragraph OR continue from last sentence
- Use conversational shift patterns (transitional phrases, question → new point, mode shifts)
- Consider context from existing formatted text

**List detection:**
- Recognize enumeration patterns across different phrasings
- Not just "firstly/secondly" but also "there are three things", "one is... another is...", etc.
- Use existing text context (if previous text set up a list, continue it)

**Punctuation & formatting:**
- Add proper punctuation, capitalization
- Preserve ALL original words (never change, add, or remove words)
- Use quotation marks only for direct quotes

**Context awareness:**
- Understand relationship between existing formatted text and new raw text
- Format new text to flow naturally with what came before
- Maintain consistent structure (if list was started, continue it)

### Prompt Location
- Create formatting prompt as separate document
- Reference the paragraph guidelines discussed (conversational shifts, transitional phrases)
- Include examples showing context-aware formatting

---

## 4. Structure Button Behavior

### Button Design
- Direct toggle (no menu)
- Single tap switches between formatted ↔ unformatted
- Visual feedback: Button state change or toast message

### Toggle Behavior

**When text is formatted (default):**
```
User taps Structure
  ↓
Display switches to unformatted version (raw transcription)
  ↓
Button state updates to show "unformatted" mode
  ↓
NO auto-copy (user chose to view unformatted, doesn't mean they want to copy it)
```

**When text is unformatted:**
```
User taps Structure
  ↓
Display switches to formatted version
  ↓
Button state updates to show "formatted" mode
  ↓
NO auto-copy (just viewing, not recording new content)
```

### Toggle Animation
**Reference:** Use existing animation from clipmainscreen.tsx (close ↔ copy button transition)

**Behavior:** Instant switch between versions (no fade needed for MVP)

---

## 5. Auto-Copy Behavior

### When Auto-Copy DOES Trigger

**After new transcription completes:**
- First transcription of day → Auto-copy + toast
- Subsequent transcriptions → Auto-copy + button tick only

**When user manually presses Copy button:**
- Copies current version (formatted or unformatted)
- Shows toast + button tick

### When Auto-Copy Does NOT Trigger

**When toggling format/unformat:**
- User is just viewing different version
- Not recording new content
- They can manually copy if they want that version

**Rationale:** Format toggle is for viewing/comparison. Recording new content is for copying. Keep these separate.

---

## 6. Storage Requirements

### What to Store (Per Clip)

```javascript
{
  clipId: "unique-id",
  recordings: [
    {
      audioFile: "path/to/audio",  // Format: browser-compatible for web, native format for mobile
      rawTranscription: "raw text from speech-to-text",
      formattedText: "AI-formatted version"
    }
  ],
  combinedRaw: "all raw transcriptions concatenated",
  combinedFormatted: "all formatted text combined",
  currentView: "formatted" // or "unformatted"
}
```

### Storage Medium
- **Current (demo):** Session storage
- **Raw transcription:** Store in session storage
- **Formatted text:** Store in session storage
- **Audio files:** Store appropriately for offline-to-online transcription recovery

### Audio Format
- **Web:** Browser-compatible format (webm, mp4, etc.)
- **Mobile (Expo/React Native):** Platform-appropriate format
- **Note:** Don't hardcode format. Use what the platform provides.

---

## 7. Text Appending Logic

### How Append Position is Determined

**The formatting prompt decides:**
- If new text should start a new paragraph → Add line break before new text
- If new text should continue from last sentence → Append directly after last period/punctuation

**Example scenarios:**

**Scenario 1: Continuation**
```
Existing: "I need to finish the report."
New formatted: " Then I'll email the team."

Result: "I need to finish the report. Then I'll email the team."
```

**Scenario 2: New paragraph**
```
Existing: "I need to finish the report."
New formatted: "\n\nSecondly, I should review the budget."

Result: 
"I need to finish the report.

Secondly, I should review the budget."
```

**The AI prompt determines paragraph breaks based on conversational shifts, not arbitrary rules.**

---

## 8. Context Example (Rare but Important)

### Why Context Matters

**Example: List continuation**

```
First transcription (formatted):
"There are three things I need to do:"

Second transcription (raw):
"one finish report"

Without context: AI might format as:
"One finish report." (doesn't know it's a list)

With context: AI formats as:
"1. Finish report" (understands list structure from context)
```

**This is why we pass existing formatted text to AI as context—it needs to understand the structure to format new text appropriately.**

---

## 9. Summary of Changes

### Remove
- [x] Slide-in animation for subsequent transcriptions
- [x] Auto-copy on format toggle

### Add
- [ ] Smart formatting with AI prompt
- [ ] Context-aware formatting (pass existing text as context)
- [ ] Storage for both raw and formatted versions
- [ ] Structure button as direct toggle
- [ ] Instant append for subsequent transcriptions

### Modify
- [ ] Animation behavior (fade-in only for first)
- [ ] Auto-copy behavior (only on new recordings, not on toggle)
- [ ] Storage structure (add formatted text storage)

---

## 10. Implementation Notes

### For clipmainscreen.tsx
- Reference existing close ↔ copy button animation for format toggle
- First transcription: Use fade-in animation
- Subsequent: Instant append (no animation)

### For AI Integration
- Create formatting prompt (separate document)
- Pass existing formatted text as context when formatting new text
- AI formats only new text, not entire document
- Store both raw and formatted results

### For Storage
- Use session storage for demo
- Store raw + formatted for each recording
- Store combined versions for quick access
- Track current view state (formatted/unformatted)

---

**End of Document**











Prompt, I've made as a guide for the formatting feature. Not too sure we're going to use this exactly, but I'd like to also get your thoughts on what's the best way to do prompting for OpenAI prompts.

You are a text formatter for transcribed speech. Add formatting to make text readable WITHOUT changing any words.

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

Return ONLY the formatted text with no explanation.

Text to format:

[INSERT TRANSCRIBED TEXT HERE]



