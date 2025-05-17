# AI Confidence Tracker Consolidation Guide

## Overview

This document outlines the step-by-step process for consolidating the AI Confidence Tracker application from its current 16+ file structure to a more manageable 7-file architecture. The consolidation maintains all functionality while improving maintainability and reducing complexity.

## File Structure

### Current Structure (16+ files)
```
ai-confidence-tracker/
├── hooks/
│   ├── useReferenceSentences.ts
│   ├── audio/
│   │   └── useAudioRecording.ts
│   ├── useDeepgramProcessing.ts
│   ├── useSpeechConfidenceState.ts
│   └── speechConfidenceContext.tsx
├── components/
│   ├── types.ts
│   ├── reference/
│   │   └── ReferenceSentence.tsx
│   ├── recording/
│   │   └── RecordingControls.tsx
│   ├── visualization/
│   │   └── ConfidenceVisualizer.tsx
│   ├── ErrorDisplay.tsx
│   └── SpeechConfidenceVisualizer.tsx
├── types/
│   ├── states.ts
│   ├── css.d.ts
│   └── deepgram.ts
├── utils/
│   └── deepgram/
│       └── api.ts
├── styles/
│   └── confidence.module.css
└── pages/
    └── api/
        └── transcribe.ts
```

### Consolidated Structure (7 files)
```
ai-confidence-tracker/
├── index.tsx                 # Main entry point
├── types.ts                  # All type definitions
├── hooks.ts                  # All hooks
├── components.tsx            # All UI components
├── api.ts                    # API and processing logic
├── confidence.module.css     # Styling
└── pages/
    └── api/
        └── transcribe.ts     # API route (separate)
```

## Implementation Steps

### 1. Create New File Structure

```bash
# Navigate to project directory
cd /Users/ethan/Documents/projects/final-exp/src/projects/ai-confidence-tracker

# Create new consolidated files (empty)
touch types.ts hooks.ts components.tsx api.ts
```

### 2. Consolidate Type Definitions

**Goal**: Migrate all types to a single `types.ts` file

1. Open the new `types.ts` file
2. Add clear section headers for organization
3. Copy types from the following files:
   - `types/states.ts` 
   - `types/deepgram.ts`
   - `components/types.ts`
   - `types/css.d.ts`
4. Maintain all exports at the bottom of the file
5. Test imports from other files

```typescript
// ========================
// APPLICATION STATE TYPES
// ========================

export enum AppState {
  INITIAL = 'initial',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  RESULTS = 'results',
  ERROR = 'error'
}

// ... more types

// ========================
// DEEPGRAM API TYPES
// ========================

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// ... more types

// ========================
// COMPONENT PROP TYPES
// ========================

export interface ReferenceSentenceProps {
  sentence: ReferenceSentence;
  totalSentences: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
}

// ... more types

// ========================
// CSS MODULE DECLARATION
// ========================

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
```

### 3. Consolidate Hooks

**Goal**: Combine all hooks into a single `hooks.ts` file

1. Open the new `hooks.ts` file
2. Add imports for React and types from `types.ts`
3. Copy hooks in logical order:
   - `useReferenceSentences.ts`
   - `useAudioRecording.ts`
   - `useDeepgramProcessing.ts`
   - `useSpeechConfidenceState.ts`
   - `speechConfidenceContext.tsx`
4. Update internal imports 
5. Test imports from other files

```typescript
import React, { useState, useRef, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  AppState, ErrorState, ReferenceSentence, TranscriptionResult
  // Import other types as needed
} from './types';

// ========================
// REFERENCE SENTENCES HOOK
// ========================

const DEFAULT_SENTENCES: ReferenceSentence[] = [
  { id: 1, text: "The quick brown fox jumps over the lazy dog" },
  // ... more sentences
];

export function useReferenceSentences(initialSentences?: ReferenceSentence[]) {
  // ... hook implementation
}

// ========================
// AUDIO RECORDING HOOK
// ========================

export function useAudioRecording() {
  // ... hook implementation
}

// ... more hooks

// ========================
// CONTEXT PROVIDER
// ========================

// Create context with combined state types
type SpeechConfidenceContextType = ReturnType<typeof useSpeechConfidenceState> & 
  ReturnType<typeof useReferenceSentences>;

const SpeechConfidenceContext = createContext<SpeechConfidenceContextType | undefined>(undefined);

// Provider component
export const SpeechConfidenceProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // ... provider implementation
};

export const useSpeechConfidence = (): SpeechConfidenceContextType => {
  // ... hook implementation
};
```

### 4. Consolidate API Logic

**Goal**: Combine all API and processing logic into `api.ts`

1. Open the new `api.ts` file
2. Import required dependencies and types
3. Copy functions from `utils/deepgram/api.ts`
4. Add clear section comments
5. Export all necessary functions

```typescript
import { Deepgram } from '@deepgram/sdk';
import { DeepgramResponse, TranscriptionResult } from './types';

// ========================
// CONFIGURATION
// ========================

// Confidence thresholds for categorization
const CONFIDENCE_THRESHOLDS = {
  high: 0.9,   // 90%
  medium: 0.7  // 70%
};

// ========================
// DEEPGRAM API PROCESSING
// ========================

/**
 * Process audio buffer through DeepGram API
 */
export async function processAudioWithDeepgram(
  audioBuffer: Buffer, 
  mimeType: string,
  apiKey: string
): Promise<TranscriptionResult> {
  // ... function implementation
}

// ... more API functions

/**
 * Process DeepGram response into application format
 */
function processDeepgramResponse(response: DeepgramResponse): TranscriptionResult {
  // ... function implementation
}

/**
 * Categorize confidence score
 */
function categorizeConfidence(score: number): 'high' | 'medium' | 'low' {
  // ... function implementation
}
```

### 5. Consolidate Components

**Goal**: Combine all UI components into `components.tsx`

1. Open the new `components.tsx` file
2. Import React, types, and hooks
3. Copy components in logical order:
   - `ReferenceSentence.tsx`
   - `RecordingControls.tsx`
   - `ConfidenceVisualizer.tsx`
   - `ErrorDisplay.tsx`
   - `SpeechConfidenceVisualizer.tsx` (main component)
4. Update internal imports
5. Export all components

```typescript
import React from 'react';
import styles from './confidence.module.css';
import {
  ReferenceSentenceProps, RecordingControlsProps,
  ConfidenceVisualizerProps, ErrorDisplayProps,
  AppState
  // Import other types as needed
} from './types';
import { useSpeechConfidence } from './hooks';

// ========================
// REFERENCE SENTENCE COMPONENT
// ========================

const ReferenceSentence: React.FC<ReferenceSentenceProps> = ({
  sentence,
  totalSentences,
  currentIndex,
  onNext,
  onPrevious
}) => {
  // ... component implementation
};

// ========================
// RECORDING CONTROLS COMPONENT
// ========================

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onCancel
}) => {
  // ... component implementation
};

// ... more components

// ========================
// MAIN VISUALIZER COMPONENT
// ========================

const SpeechConfidenceVisualizer: React.FC = () => {
  const {
    // App state
    appState,
    errorState,
    transcriptionResult,
    
    // Recording state
    isRecording,
    
    // Reference sentences
    currentSentence,
    currentIndex,
    sentenceCount,
    nextSentence,
    previousSentence,
    
    // Actions
    startRecording,
    stopRecording,
    resetState
  } = useSpeechConfidence();

  // ... component implementation
};

// Export all components
export {
  ReferenceSentence,
  RecordingControls,
  ConfidenceVisualizer,
  ErrorDisplay,
  SpeechConfidenceVisualizer
};

// Default export for main component
export default SpeechConfidenceVisualizer;
```

### 6. Update Main Entry Point

**Goal**: Update the main index.tsx file to use the consolidated imports

1. Open `pages/ai-confidence-tracker/index.tsx`
2. Update imports to use the new consolidated files
3. Test the application

```typescript
import React from 'react';
import { Inter } from 'next/font/google';
import SpeechConfidenceVisualizer from '../../projects/ai-confidence-tracker/components';
import { SpeechConfidenceProvider } from '../../projects/ai-confidence-tracker/hooks';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function SpeechConfidencePage() {
  return (
    <div className={`${inter.variable} full-page`}>
      <SpeechConfidenceProvider>
        <SpeechConfidenceVisualizer />
      </SpeechConfidenceProvider>
    </div>
  );
}
```

### 7. Update API Route

**Goal**: Update the API route to use consolidated imports

1. Open `pages/api/ai-confidence-tracker/transcribe.ts`
2. Update imports to use the new consolidated files
3. Test the API endpoint

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Fields, Files, File } from 'formidable';
import fs from 'fs';
import { processAudioWithDeepgram } from '@ai-confidence-tracker/api';

// ... rest of the file
```

## Testing

After each consolidation step:

1. Run the application
2. Test all functionality:
   - Navigation between reference sentences
   - Recording audio
   - Processing audio
   - Viewing results
   - Error handling
3. Fix any issues before proceeding to the next step

## Future Multi-Provider Support

*Note: This section is for future implementation. Currently focusing only on DeepGram.*

When adding support for multiple providers (AssemblyAI, Google, etc.):

1. Create a provider interface in `types.ts`:

```typescript
export interface SpeechRecognitionProvider {
  name: string;
  processAudio: (audio: Blob) => Promise<TranscriptionResult>;
  // Other common methods
}
```

2. Create provider implementations in separate files:
   - `deepgramProvider.ts`
   - `assemblyProvider.ts`
   - `googleProvider.ts`

3. Create a provider selection mechanism in the UI
4. Inject the selected provider into the processing hook

This approach allows adding new providers without substantially increasing file count.

## Conclusion

This consolidation approach reduces the codebase from 16+ files to 7 files while maintaining all functionality and code organization. The use of clear section comments helps maintain readability despite the increased file sizes. The consolidated structure is also better prepared for future extensions like multi-provider support.

## Final Verification Checklist

- Run TypeScript compiler to check for type errors
- Verify all components render correctly
- Test all interactive features (recording, error states, etc.)
- Check network requests to ensure API integration works
- Verify all CSS styling is applied correctly
- Run any existing tests and update as needed 