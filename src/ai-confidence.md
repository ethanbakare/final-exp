Speech Confidence Visualizer Implementation Plan (Technical Structure)
Table of Contents


project file should be called confidence-tracker



Project Overview
Environment Setup
Project Structure Creation
Type Definitions
Backend Implementation
Frontend State Management
Component Architecture
Integration Patterns
Testing Strategy

1. Project Overview
The Speech Confidence Visualizer is a web application that demonstrates AI speech recognition confidence at the word level, using DeepGram's API.
Data Flow Architecture
mermaidflowchart LR
    A[User Speech] --> B[Audio Recording]
    B --> C[Audio Processing]
    C --> D[DeepGram API]
    D --> E[Confidence Analysis]
    E --> F[Visualization]
    
    subgraph Frontend
    A
    B
    F
    end
    
    subgraph Backend
    C
    D
    E
    end
State Transitions
mermaidstateDiagram-v2
    [*] --> Initial
    Initial --> Recording: Start Recording
    Recording --> Processing: Stop Recording
    Processing --> Results: Transcription Complete
    Processing --> Error: API Error
    Recording --> Error: Recording Error
    Initial --> Error: Permission Error
    Results --> Initial: Try Again
    Error --> Initial: Try Again
    Initial --> Initial: Change Reference Text
2. Environment Setup
2.1 Prerequisites

Node.js v16+ installed
Access to the monorepo with proper permissions
DeepGram API key

2.2 Environment Variables
Add to root .env.local file:
DEEPGRAM_API_KEY=your_api_key_here
2.3 Dependencies Installation
bash# Navigate to monorepo root
cd final-exp

# Install project-specific dependencies
npm install @deepgram/sdk formidable --save -w @master-exp/speech-confidence

# Install dev dependencies
npm install --save-dev @types/formidable @types/web-audio-api -w @master-exp/speech-confidence
3. Project Structure Creation
3.1 Directory Structure Setup
bash# Create main project directories
mkdir -p src/projects/speech-confidence/{components,hooks,types,utils,styles}

# Create specialized subdirectories
mkdir -p src/projects/speech-confidence/components/{recording,visualization,reference}
mkdir -p src/projects/speech-confidence/hooks/audio
mkdir -p src/projects/speech-confidence/utils/deepgram

# Create Next.js pages and API routes
mkdir -p src/pages/speech-confidence
mkdir -p src/pages/api/speech-confidence
3.2 Workspace Initialization
bash# Initialize as a workspace
npm init -w ./src/projects/speech-confidence
3.3 Package.json Configuration
Create src/projects/speech-confidence/package.json:
json{
  "name": "@master-exp/speech-confidence",
  "version": "1.0.0",
  "private": true,
  "description": "Speech recognition confidence visualization tool",
  "main": "index.js",
  "dependencies": {
    "@deepgram/sdk": "^2.4.0",
    "formidable": "^3.5.1"
  },
  "devDependencies": {
    "@types/formidable": "^3.4.5",
    "@types/web-audio-api": "^0.2.12"
  }
}
3.4 TypeScript Configuration
Create src/projects/speech-confidence/tsconfig.json:
json{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "*": ["types/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "types/**/*.d.ts"
  ]
}
3.5 Update Root TypeScript Config
Add to paths in root tsconfig.json:
json"paths": {
  "@/*": ["./src/*"],
  "@speech-confidence/*": ["./src/projects/speech-confidence/*"]
}
4. Type Definitions
4.1 DeepGram Types
Create src/projects/speech-confidence/types/deepgram.ts:
typescript// DeepGram API response types
export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        confidence?: number;
        words?: DeepgramWord[];
      }>;
    }>;
  };
}

// Application-specific types
export interface ConfidenceCategory {
  level: 'high' | 'medium' | 'low';
  threshold: number;
  color: string;
  description: string;
}

export interface TranscriptionResult {
  transcript: string;
  words: Array<{
    word: string;
    confidence: number;
    category: 'high' | 'medium' | 'low';
  }>;
  lowConfidenceWords: Array<{
    word: string;
    confidence: number;
  }>;
}
4.2 Application State Types
Create src/projects/speech-confidence/types/states.ts:
typescriptexport enum AppState {
  INITIAL = 'initial',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  RESULTS = 'results',
  ERROR = 'error'
}

export interface ErrorState {
  message: string;
  code?: string;
  retry?: boolean;
}

export interface ReferenceSentence {
  id: number;
  text: string;
}

// Configuration type for confidence thresholds
export interface ConfidenceConfig {
  highThreshold: number;  // e.g., 0.9 (90%)
  mediumThreshold: number;  // e.g., 0.7 (70%)
}
5. Backend Implementation
5.1 DeepGram API Integration Utility
Create src/projects/speech-confidence/utils/deepgram/api.ts:
typescriptimport { Deepgram } from '@deepgram/sdk';
import { 
  DeepgramResponse, 
  TranscriptionResult 
} from '../../types/deepgram';

// Confidence thresholds for categorization
const CONFIDENCE_THRESHOLDS = {
  high: 0.9,   // 90%
  medium: 0.7  // 70%
};

/**
 * Process audio buffer through DeepGram API
 */
export async function processAudioWithDeepgram(
  audioBuffer: Buffer, 
  mimeType: string,
  apiKey: string
): Promise<TranscriptionResult> {
  // Initialize DeepGram client
  const deepgram = new Deepgram(apiKey);
  
  // API request options
  const options = {
    model: 'nova-2',
    language: 'en-US',
    punctuate: true,
    diarize: false,
    word_confidence: true,
    utterances: false,
    alternatives: 1
  };
  
  // Call DeepGram API
  const response = await deepgram.transcription.preRecorded(
    { buffer: audioBuffer, mimetype: mimeType },
    options
  );
  
  // Extract and process results
  return processDeepgramResponse(response);
}

/**
 * Process DeepGram response into application format
 */
function processDeepgramResponse(response: DeepgramResponse): TranscriptionResult {
  // Extract transcript and words
  const words = response.results?.channels?.[0]?.alternatives?.[0]?.words || [];
  const transcript = response.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  
  // Process and categorize words
  const processedWords = words.map(word => ({
    word: word.word,
    confidence: word.confidence || 0,
    category: categorizeConfidence(word.confidence || 0)
  }));
  
  // Identify low confidence words
  const lowConfidenceWords = processedWords
    .filter(word => word.category === 'low')
    .map(word => ({
      word: word.word,
      confidence: word.confidence
    }));
  
  return {
    transcript,
    words: processedWords,
    lowConfidenceWords
  };
}

/**
 * Categorize confidence score
 */
function categorizeConfidence(score: number): 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_THRESHOLDS.high) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
  return 'low';
}
5.2 API Route for Transcription
Create src/pages/api/speech-confidence/transcribe.ts:
typescriptimport { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { processAudioWithDeepgram } from '@speech-confidence/utils/deepgram/api';

// Disable default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse form data with files
const parseForm = async (req: NextApiRequest): Promise<{
  fields: formidable.Fields;
  files: formidable.Files;
}> => {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data
    const { files } = await parseForm(req);
    const audioFile = files.audio as formidable.File;
    
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Read the file
    const audioData = fs.readFileSync(audioFile.filepath);
    
    // Process with DeepGram
    const result = await processAudioWithDeepgram(
      audioData,
      audioFile.mimetype || 'audio/wav',
      process.env.DEEPGRAM_API_KEY || ''
    );

    // Clean up temporary file
    fs.unlinkSync(audioFile.filepath);
    
    // Return the processed result
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error processing audio:', error);
    return res.status(500).json({ 
      error: 'Failed to process audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
6. Frontend State Management
6.1 Reference Sentences Hook
Create src/projects/speech-confidence/hooks/useReferenceSentences.ts:
typescriptimport { useState, useCallback } from 'react';
import { ReferenceSentence } from '../types/states';

const DEFAULT_SENTENCES: ReferenceSentence[] = [
  { id: 1, text: "The quick brown fox jumps over the lazy dog" },
  { id: 2, text: "She sells seashells by the seashore" },
  { id: 3, text: "How much wood would a woodchuck chuck" },
  { id: 4, text: "The rain in Spain stays mainly in the plain" },
  { id: 5, text: "Peter Piper picked a peck of pickled peppers" }
];

export function useReferenceSentences(initialSentences?: ReferenceSentence[]) {
  const [sentences] = useState<ReferenceSentence[]>(initialSentences || DEFAULT_SENTENCES);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentSentence = sentences[currentIndex];
  
  const nextSentence = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sentences.length);
  }, [sentences.length]);
  
  const previousSentence = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? sentences.length - 1 : prevIndex - 1
    );
  }, [sentences.length]);
  
  return {
    sentences,
    currentSentence,
    currentIndex,
    sentenceCount: sentences.length,
    nextSentence,
    previousSentence,
    setCurrentIndex
  };
}
6.2 Audio Recording Hook
Create src/projects/speech-confidence/hooks/audio/useAudioRecording.ts:
typescriptimport { useState, useRef, useCallback } from 'react';

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  /**
   * Start audio recording using browser's MediaRecorder API
   */
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      setAudioData(null);
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up data handlers
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioData(audioBlob);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone permission denied');
      console.error('Error accessing microphone:', err);
    }
  }, []);

  /**
   * Stop audio recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks on the stream to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [isRecording]);

  return {
    isRecording,
    audioData,
    error,
    startRecording,
    stopRecording
  };
}
6.3 DeepGram Processing Hook
Create src/projects/speech-confidence/hooks/useDeepgramProcessing.ts:
typescriptimport { useState, useCallback } from 'react';
import { TranscriptionResult } from '../types/deepgram';

export function useDeepgramProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process audio through the DeepGram API
   */
  const processAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Prepare form data with audio
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      // Send to backend endpoint
      const response = await fetch('/api/speech-confidence/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process audio');
      }
      
      // Process successful response
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing audio');
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Reset processing state
   */
  const resetProcessing = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    result,
    error,
    processAudio,
    resetProcessing
  };
}
6.4 Application State Management Hook
Create src/projects/speech-confidence/hooks/useSpeechConfidenceState.ts:
typescriptimport { useState, useEffect } from 'react';
import { useAudioRecording } from './audio/useAudioRecording';
import { useDeepgramProcessing } from './useDeepgramProcessing';
import { AppState, ErrorState } from '../types/states';

export function useSpeechConfidenceState() {
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  
  // Audio recording hook
  const { 
    isRecording, 
    audioData, 
    error: recordingError, 
    startRecording, 
    stopRecording 
  } = useAudioRecording();
  
  // DeepGram processing hook
  const { 
    isProcessing, 
    result, 
    error: processingError, 
    processAudio, 
    resetProcessing 
  } = useDeepgramProcessing();
  
  // Handle state transitions based on hooks' states
  useEffect(() => {
    if (recordingError) {
      setAppState(AppState.ERROR);
      setErrorState({
        message: recordingError,
        code: 'RECORDING_ERROR',
        retry: true
      });
    } else if (processingError) {
      setAppState(AppState.ERROR);
      setErrorState({
        message: processingError,
        code: 'PROCESSING_ERROR',
        retry: true
      });
    } else if (isRecording) {
      setAppState(AppState.RECORDING);
    } else if (isProcessing) {
      setAppState(AppState.PROCESSING);
    } else if (result) {
      setAppState(AppState.RESULTS);
    }
  }, [isRecording, isProcessing, result, recordingError, processingError]);
  
  // Handle audio data when available for processing
  useEffect(() => {
    if (audioData && !isRecording && appState !== AppState.ERROR) {
      processAudio(audioData);
    }
  }, [audioData, isRecording, processAudio, appState]);
  
  // Reset to initial state
  const resetState = () => {
    resetProcessing();
    setAppState(AppState.INITIAL);
    setErrorState(null);
  };
  
  return {
    appState,
    errorState,
    transcriptionResult: result,
    isRecording,
    isProcessing,
    
    // Actions
    startRecording,
    stopRecording,
    resetState
  };
}
7. Component Architecture
7.1 Main Page Component
Create src/pages/speech-confidence/index.tsx:
tsximport React from 'react';
import { Inter } from 'next/font/google';
import SpeechConfidenceVisualizer from '@speech-confidence/components/SpeechConfidenceVisualizer';
import styles from '@/projects/home/styles/HomePage.module.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function SpeechConfidencePage() {
  return (
    <div className={`${inter.variable} full-page ${styles.darkBackground}`}>
      <SpeechConfidenceVisualizer />
    </div>
  );
}
7.2 Component Structure Overview
SpeechConfidenceVisualizer (Main Container)
├── ReferenceSentence
│   ├── SentenceDisplay
│   └── SentenceNavigation
├── VisualizerContent
│   ├── Initial
│   ├── Recording
│   │   └── RecordingControls
│   ├── Processing
│   ├── Results
│   │   ├── TranscriptDisplay
│   │   └── ConfidenceVisualizer
│   └── Error
└── ControlButtons
7.3 Component Props Interfaces
typescript// src/projects/speech-confidence/components/types.ts
import { ReferenceSentence } from '../types/states';
import { TranscriptionResult } from '../types/deepgram';

export interface ReferenceSentenceProps {
  sentence: ReferenceSentence;
  totalSentences: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
}

export interface RecordingControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancel?: () => void;
}

export interface ConfidenceVisualizerProps {
  result: TranscriptionResult;
}

export interface ErrorDisplayProps {
  message: string;
  retry?: boolean;
  onRetry?: () => void;
}
7.4 Main Component Pseudocode
typescript// SpeechConfidenceVisualizer.tsx
function SpeechConfidenceVisualizer() {
  // Register with loading context for monorepo integration
  const { isLoaded } = useSectionLoading('SpeechConfidenceVisualizer', []);
  
  // State management hooks
  const { appState, errorState, transcriptionResult, /* ...other state */ } = useSpeechConfidenceState();
  const { currentSentence, currentIndex, sentenceCount, nextSentence } = useReferenceSentences();
  
  // Rendering logic
  return (
    <Container>
      <Header />
      
      <ReferenceSentence
        sentence={currentSentence}
        totalSentences={sentenceCount}
        currentIndex={currentIndex}
        onNext={nextSentence}
        onPrevious={previousSentence}
      />
      
      {/* State-based rendering */}
      {appState === AppState.INITIAL && (
        <InitialState onStartRecording={startRecording} />
      )}
      
      {appState === AppState.RECORDING && (
        <RecordingState
          onStopRecording={stopRecording}
          onCancel={resetState}
        />
      )}
      
      {appState === AppState.PROCESSING && (
        <ProcessingState onCancel={resetState} />
      )}
      
      {appState === AppState.RESULTS && transcriptionResult && (
        <ResultsState
          result={transcriptionResult}
          onReset={resetState}
          onNextSentence={nextSentence}
        />
      )}
      
      {appState === AppState.ERROR && errorState && (
        <ErrorState
          error={errorState}
          onRetry={resetState}
        />
      )}
    </Container>
  );
}
8. Integration Patterns
8.1 Integrating with LoadingContext
Ensure proper integration with the monorepo's loading context:
typescript// In SpeechConfidenceVisualizer.tsx
import { useSectionLoading } from '@/hooks/useSectionLoading';

const SpeechConfidenceVisualizer: React.FC = () => {
  // Register with loading context to show loading screen
  const { isLoaded } = useSectionLoading('SpeechConfidenceVisualizer', [true]);
  
  // ... rest of component
}
8.2 Internal State Management Pattern
Use React's component hierarchy and context API for state management:
typescript// speech-confidence-context.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useSpeechConfidenceState } from '../hooks/useSpeechConfidenceState';
import { useReferenceSentences } from '../hooks/useReferenceSentences';

// Create context with full state
const SpeechConfidenceContext = createContext<ReturnType<typeof useSpeechConfidenceState> & 
  ReturnType<typeof useReferenceSentences> | undefined>(undefined);

// Provider component
export const SpeechConfidenceProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const speechState = useSpeechConfidenceState();
  const referenceSentences = useReferenceSentences();
  
  return (
    <SpeechConfidenceContext.Provider value={{
      ...speechState,
      ...referenceSentences
    }}>
      {children}
    </SpeechConfidenceContext.Provider>
  );
};

// Custom hook to use the context
export const useSpeechConfidence = () => {
  const context = useContext(SpeechConfidenceContext);
  if (context === undefined) {
    throw new Error('useSpeechConfidence must be used within a SpeechConfidenceProvider');
  }
  return context;
};
8.3 Event Handling Patterns
Consistent pattern for event handling across components:
typescript// Component event handlers should follow this pattern:
// 1. Handle UI events internally when possible
// 2. Delegate state changes to parent components via callbacks
// 3. Use the context for global state changes

// Example for a Button component:
interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  disabled = false,
  children
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onClick();
  };
  
  return (
    <button 
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
9. Testing Strategy
9.1 Unit Testing Core Logic
Focus on testing core logic like confidence categorization:
typescript// src/projects/speech-confidence/utils/deepgram/__tests__/api.test.ts
import { categorizeConfidence } from '../api';

describe('categorizeConfidence', () => {
  test('should categorize high confidence correctly', () => {
    expect(categorizeConfidence(0.95)).toBe('high');
    expect(categorizeConfidence(0.9)).toBe('high');
  });
  
  test('should categorize medium confidence correctly', () => {
    expect(categorizeConfidence(0.8)).toBe('medium');
    expect(categorizeConfidence(0.7)).toBe('medium');
  });
  
  test('should categorize low confidence correctly', () => {
    expect(categorizeConfidence(0.6)).toBe('low');
    expect(categorizeConfidence(0.4)).toBe('low');
    expect(categorizeConfidence(0.0)).toBe('low');
  });
});
9.2 Mock Structure for DeepGram API
Create mock responses for testing:
typescript// src/projects/speech-confidence/utils/deepgram/__mocks__/mockResponses.ts
import { DeepgramResponse } from '../../../types/deepgram';

export const mockHighConfidenceResponse: DeepgramResponse = {
  results: {
    channels: [{
      alternatives: [{
        transcript: "the quick brown fox jumps over the lazy dog",
        confidence: 0.95,
        words: [
          { word: "the", start: 0.01, end: 0.15, confidence: 0.99 },
          { word: "quick", start: 0.16, end: 0.35, confidence: 0.97 },
          { word: "brown", start: 0.36, end: 0.58, confidence: 0.98 },
          { word: "fox", start: 0.59, end: 0.78, confidence: 0.96 },
          { word: "jumps", start: 0.79, end: 0.95, confidence: 0.95 },
          { word: "over", start: 0.96, end: 1.15, confidence: 0.97 },
          { word: "the", start: 1.16, end: 1.25, confidence: 0.99 },
          { word: "lazy", start: 1.26, end: 1.45, confidence: 0.98 },
          { word: "dog", start: 1.46, end: 1.65, confidence: 0.99 }
        ]
      }]
    }]
  }
};

export const mockMixedConfidenceResponse: DeepgramResponse = {
  results: {
    channels: [{
      alternatives: [{
        transcript: "the quick brown fox jumps over the lazy dog",
        confidence: 0.85,
        words: [
          { word: "the", start: 0.01, end: 0.15, confidence: 0.99 },
          { word: "quick", start: 0.16, end: 0.35, confidence: 0.97 },
          { word: "brown", start: 0.36, end: 0.58, confidence: 0.65 },
          { word: "fox", start: 0.59, end: 0.78, confidence: 0.96 },
          { word: "jumps", start: 0.79, end: 0.95, confidence: 0.72 },
          { word: "over", start: 0.96, end: 1.15, confidence: 0.97 },
          { word: "the", start: 1.16, end: 1.25, confidence: 0.55 },
          { word: "lazy", start: 1.26, end: 1.45, confidence: 0.88 },
          { word: "dog", start: 1.46, end: 1.65, confidence: 0.99 }
        ]
      }]
    }]
  }
};
9.3 Testing Plan Outline

Unit Tests:

DeepGram response processing
Confidence classification
State management hooks


Integration Tests:

Audio recording -> processing flow
API endpoint integration
Component state transitions


Manual Testing Checklist:

Browser microphone permissions
Recording visualization
Confidence display accuracy
Error state handling
Mobile responsiveness




This implementation plan focuses on the technical structure and architecture needed for the Speech Confidence Visualizer, providing you with the core functionality implementation while leaving the styling and visual design aspects for you to handle.