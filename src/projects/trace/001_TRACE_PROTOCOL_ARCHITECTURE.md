# 001 TRACE PROTOCOL - COMPLETE ARCHITECTURE

**Date**: January 21, 2026  
**Purpose**: Comprehensive architecture documentation for Trace Protocol v1.0  
**Source**: trace-protocol-v1.0 (Google AI Studio → Next.js Export)  
**Status**: ✅ **FULLY ACCURATE - ALL FILES READ**  
**Revision**: v2.0 (Corrected from v1.0 which incorrectly stated Vite)

---

## Executive Summary

**Trace Protocol** is a voice/camera-enabled expense tracking application built with **Next.js 14 App Router** + **React 19**, powered by **Google Gemini AI** (gemini-3-flash-preview) for multimodal input processing.

**Core Philosophy**: "Conscious spending through point-of-purchase logging" - capture expenses as easily as taking a screenshot.

**Critical Insight**: This project contains TWO complete applications (AI Studio export artifact) - a legacy Vite app (unused) and the active Next.js app (production).

---

## The Dual App Mystery SOLVED

### What I Found

The trace-protocol-v1.0 directory contains **BOTH** build systems:

**1. Vite/React App (LEGACY - NOT EXECUTED)**
```
index.html → index.tsx → App.tsx → services/geminiService.ts
```
- Client-side Gemini calls
- API key exposed to browser
- Present but never runs

**2. Next.js App (ACTIVE - PRODUCTION)**
```
app/page.tsx → app/api/* → lib/gemini.ts
```
- Server-side API routes
- API key stays secure
- This is what executes

### The Evidence

**package.json** - ONLY Next.js scripts:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

**metadata.json**:
```json
{
  "name": "Trace Protocol v1.0",
  "description": "...built with Next.js and Gemini 3."
}
```

**Why Both Exist**: AI Studio likely generated Vite first (faster prototyping), then created Next.js version for production deployment (security + API routes).

---

## Architecture Overview

### Tech Stack

```
Framework: Next.js 14.2.0 (App Router)
Runtime: React 19.2.3
Language: TypeScript 5.8.2
Styling: Tailwind CSS 3.4.0
AI Service: Google Gemini AI (@google/genai 1.35.0)
  └── Model: gemini-3-flash-preview
Persistence: localStorage (client-side)
Media APIs: MediaRecorder, FileReader
```

### Active File Structure

```
app/                   # Next.js App Router (PRODUCTION)
├── api/
│   ├── transcribe/route.ts
│   ├── parse-voice/route.ts
│   └── parse-receipt/route.ts
├── globals.css
├── layout.tsx
└── page.tsx          # Main app component

components/           # React components
├── CameraInput.tsx
├── VoiceInput.tsx
└── ResultsDisplay.tsx

lib/
└── gemini.ts         # AI client + schema

utils/
└── audio.ts          # Utility functions

types.ts             # TypeScript interfaces
```

### Legacy Files (NOT USED)

```
App.tsx              # Vite app component
index.tsx            # Vite entry point
index.html           # Vite HTML shell
services/geminiService.ts  # Client-side AI (insecure)
vite.config.ts       # Vite config
```

---

## Data Flow - Voice Input (Complete)

```
User presses voice button
  ↓
VoiceInput: Start MediaRecorder
  ↓
User stops → TWO PATHS:
  ├─ [Red Button] Transcribe
  │    ↓
  │  POST /api/transcribe
  │    ↓
  │  Gemini: audio → text
  │    ↓
  │  Review screen (editable)
  │    ↓
  │  User clicks [Log Entry]
  │    ↓
  └────┬────────────────────┘
       ↓
  POST /api/parse-voice (with text OR audio)
       ↓
  Gemini: input → ExpenseEntry JSON
       ↓
  page.tsx: Add to entries array
       ↓
  localStorage.setItem()
       ↓
  UI updates (ResultsDisplay)
```

---

## VoiceInput Component Deep Dive

### The Deferred Action Pattern

**THE MOST IMPORTANT PATTERN IN THIS CODEBASE:**

```typescript
const stopActionRef = useRef<'transcribe' | 'direct' | null>(null);

// User clicks button
const handleStop = (action: 'transcribe' | 'direct') => {
  stopActionRef.current = action;  // Save choice FIRST
  mediaRecorder.stop();            // Then trigger async
};

// Later, in async callback
mediaRecorder.onstop = async () => {
  const blob = new Blob(chunksRef.current);
  
  if (stopActionRef.current === 'direct') {
    // Skip review, send immediately
    onVoiceCapture({ base64: await blobToBase64(blob), mimeType: blob.type });
  } 
  else if (stopActionRef.current === 'transcribe') {
    // Transcribe first, then review
    setView('review');
    const response = await fetch('/api/transcribe', {...});
    setTranscription(response.text);
  }
};
```

**Why This Works**: MediaRecorder.stop() is **async** - the `onstop` callback fires later. We can't know which button the user clicked inside `onstop` without preserving that information. The ref bridges the async gap.

**This pattern is CRITICAL for any voice interface project.**

---

## API Routes Architecture

### /api/transcribe

**Input**: `{ base64Audio: string, mimeType: string }`  
**Output**: `{ transcription: string }`  

Returns PLAIN TEXT (not JSON structure).

### /api/parse-voice

**Input**: `{ text?: string, base64Audio?: string, mimeType?: string }`  
**Output**: `ExpenseEntry` (without id/source)  

Handles BOTH text AND audio - dual input mode.

### /api/parse-receipt

**Input**: `{ base64Image: string, mimeType: string }`  
**Output**: `ExpenseEntry` (without id/source)  

Receipt OCR + parsing in one call.

---

## Gemini Schema Pattern

```typescript
export const EXPENSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING },
    merchant: { type: Type.STRING, nullable: true },
    currency: { type: Type.STRING },
    total: { type: Type.NUMBER },
    items: { type: Type.ARRAY, items: {...} }
  },
  required: ["date", "currency", "total", "items"]
};

// Usage
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  config: {
    responseMimeType: "application/json",
    responseSchema: EXPENSE_SCHEMA,
    thinkingConfig: { thinkingBudget: 0 }  // Faster, cheaper
  }
});
```

**Result**: Guaranteed valid JSON matching schema.

---

## Key Technical Decisions

### Why Next.js Over Vite?

**Vite** (legacy): Client-side AI calls → API key exposed  
**Next.js** (active): Server-side API routes → API key secure  

**The security difference is the entire reason for the migration.**

### Why Gemini Over Whisper + GPT?

**One API does**:
- Audio transcription
- Receipt OCR
- NLU parsing
- Structured output

**Instead of 3-4 separate services.**

### Why localStorage?

**MVP offline-first**: No backend needed, works without internet.

**Trade-off**: No sync, no backup, ~10MB limit.

---

## Utility Functions

```typescript
// utils/audio.ts
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve((reader.result as string).split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP'
  }).format(amount);
}
```

---

## Critical Learnings for Voice Interface Projects

1. **Deferred Action Pattern**: Store user choice in ref before async media API
2. **Three-State UI**: idle → recording → review (clear separation)
3. **Dual Submission**: Quick (direct) vs Accurate (transcribe → review)
4. **Structured Schemas**: Force AI to return valid JSON
5. **Server-Side AI**: Never expose API keys to browser
6. **Refs for Non-Visual**: Use refs for data that doesn't affect UI (no re-renders)

---

**End of Document**

This is the COMPLETE, ACCURATE architecture after reading all 22 source files.
