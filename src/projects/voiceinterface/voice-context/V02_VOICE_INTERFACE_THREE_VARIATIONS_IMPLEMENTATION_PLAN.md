# Voice Interface Three Variations - Implementation Plan

**Version**: V02
**Date**: 2026-01-14
**Status**: Implementation Plan - Ready for Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Foundational Patterns from Existing Projects](#foundational-patterns-from-existing-projects)
4. [Interface Variation Specifications](#interface-variation-specifications)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [Animation System](#animation-system)
8. [Implementation Sequence](#implementation-sequence)
9. [File Structure](#file-structure)
10. [Testing Strategy](#testing-strategy)

---

## 1. Executive Summary

### Project Goal

Implement three voice interface variations for the Voice Interface project, each demonstrating different interaction patterns for voice transcription:

1. **Variation 1 (TextBox - Standard)**: Press-to-record → transcribe → display result
2. **Variation 2 (TextBox - Check & Close)**: Outlined mic button → check/close controls → transcribe → display
3. **Variation 3 (TextWrapper - Live Streaming)**: Mobile-optimized → live streaming transcription → immediate feedback

### Key Technical Requirements

- **Separation of Concerns**: UI decoupled from transcription logic (ClipStream pattern)
- **Button Morphing & State Animations**: ClipStream's superior approach for smooth state transitions and clip morphing buttons
- **Clean State Management**: Single source of truth with computed properties (ClipStream pattern)
- **Text Box UI**: Scrollable containers with fade overlays (AI Confidence Tracker pattern)
- **Word-by-Word Text Animation**: Horizontal fade-in for transcribed text (Deep Library/AI Confidence Tracker pattern)
- **Mobile Adaptability**: Responsive design with mobile-first considerations (Variation 3 specific)
- **No Race Conditions**: Fresh state fetching pattern (ClipStream pattern)

---

## 2. Architecture Overview

### 2.1 Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  (UI Components - Pure, no business logic)                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Variation 1  │  │  Variation 2  │  │  Variation 3  │     │
│  │   TextBox    │  │   TextBox    │  │ TextWrapper  │     │
│  │   Standard   │  │ Check/Close  │  │    Live      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     STATE MANAGEMENT LAYER                    │
│  (Context Provider + Zustand Store)                          │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  VoiceInterfaceContext                                │  │
│  │  - Application State (enum)                           │  │
│  │  - Current Variation                                  │  │
│  │  - Transcription Results                              │  │
│  │  - Computed UI States (derived from app state)       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                      │
│  (Custom Hooks - Encapsulated Logic)                        │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ useVoiceRecording│  │ useTranscription │                 │
│  │ - Start/Stop     │  │ - Standard Mode  │                 │
│  │ - Audio Capture  │  │ - Live Streaming │                 │
│  │ - Volume Analysis│  │ - Retry Logic    │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                               │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     API / SERVICE LAYER                       │
│  (External API Calls)                                        │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Transcription API Endpoint                           │  │
│  │  - POST /api/voice-interface/transcribe               │  │
│  │  - POST /api/voice-interface/transcribe-stream        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**Standard Recording Flow (Variations 1 & 2):**
```
User Tap/Click
    ↓
startRecording() [UI Component calls callback]
    ↓
useVoiceRecording hook [captures audio]
    ↓
stopRecording() [User action]
    ↓
audioBlob → useTranscription hook
    ↓
API Call: POST /api/voice-interface/transcribe
    ↓
Response → Update State
    ↓
UI Re-renders with Results [text animation triggers]
```

**Live Streaming Flow (Variation 3):**
```
User Tap Record Wide
    ↓
startRecording() + startStreaming()
    ↓
Audio chunks → continuous processing
    ↓
WebSocket/Stream API
    ↓
Incremental results → State updates
    ↓
UI updates in real-time [word-by-word animation]
    ↓
stopRecording() → final processing if needed
    ↓
Complete state
```

---

## 3. Foundational Patterns from Existing Projects

### Overview

This implementation leverages proven patterns from two existing projects:

**ClipStream** (Primary Reference for Animations & State):
- Button morphing and state transitions
- Separation of concerns architecture
- State management with computed properties
- Fresh state pattern to avoid race conditions

**AI Confidence Tracker** (Reference for UI Structure):
- Text box containers with scrolling
- Typography and color systems
- Word-by-word text animation

---

### 3.1 From ClipStream (Primary: Animations & State Management)

ClipStream's implementation is the gold standard for button morphing and state animations. All button state transitions should follow ClipStream's patterns.

#### A. Button Morphing Pattern

**Reference**: `/src/projects/clipperstream/components/ui/mainvarmorph.tsx`

**Key Principles from ClipStream**:
1. **Fixed outer container** - prevents layout shifts during morphing
2. **Layered buttons** - all button states exist simultaneously, controlled by opacity
3. **Smooth transitions** - opacity crossfades with proper timing hierarchy
4. **Transform origin** - controls expansion direction (left, right, center)

**Example from mainvarmorph.tsx**:

```typescript
// Fixed container accommodates largest button state
<div className="morph-container" style={{ width: '366px', height: '50px' }}>
  {/* Inner morphing content */}
  <div className="morphing-buttons">
    {/* All buttons positioned absolutely, controlled by opacity */}
    <button style={{ opacity: state === 'idle' ? 1 : 0 }}>...</button>
    <button style={{ opacity: state === 'recording' ? 1 : 0 }}>...</button>
    <button style={{ opacity: state === 'processing' ? 1 : 0 }}>...</button>
  </div>
</div>
```

---

#### B. Separation of Concerns Pattern

**Reference**:
- `/src/projects/clipperstream/hooks/useClipRecording.ts`
- `/src/projects/clipperstream/components/ui/mainvarmorph.tsx`

**Key Principle from ClipStream**: UI components are pure presentation - all logic lives in custom hooks.

This is covered in detail in section 3.1.A below (hook implementations).

---

#### C. State Management with Computed Properties

**Reference**: `/src/projects/clipperstream/components/ui/mainvarmorph.tsx`

**Key Principle**: Single source of truth (app state enum) with all UI properties computed from it.

This is covered in detail in section 3.1.B below.

---

#### D. Fresh State Pattern (Avoiding Race Conditions)

**Reference**: `/src/projects/clipperstream/components/ui/043_v6.22_IMPLEMENTATION_COMPLETE.md`

**Key Principle**: Never capture state in async closures - always fetch fresh state.

This is covered in detail in section 3.1.C below.

---

### 3.2 From AI Confidence Tracker (UI Structure & Text Animation)

#### A. Text Box UI Structure

**Pattern**: Scrollable container with fade overlay

**Reference Files**:
- `/src/projects/ai-confidence-tracker/components/ui/IntegratedDeepCard.tsx` (lines 464-488)
- `/src/projects/ai-confidence-tracker/components/ui/transcript-text-states.tsx` (lines 174-255)

**Implementation for Voice Interface**:

```typescript
// VoiceTextBox.tsx
<div className="txt-transcript-box">
  <div className="transcript-scroll-wrapper">
    <div className="transcript-content">
      {/* Text content here */}
    </div>
  </div>

  {/* Fade overlay positioned absolutely */}
  <div className="fade-overlay"></div>
</div>

<style jsx>{`
  .txt-transcript-box {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    gap: 10px;
    width: 100%;
    border-radius: 6px;
    overflow: hidden;
  }

  .transcript-scroll-wrapper {
    width: 100%;
    max-height: 125px;  /* Variation 1 */
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Custom scrollbar */
  .transcript-scroll-wrapper::-webkit-scrollbar {
    width: 8px;
  }

  .transcript-scroll-wrapper::-webkit-scrollbar-thumb {
    background: var(--VoiceDarkGrey_80);
    border-radius: 4px;
  }

  /* Fade overlay at bottom */
  .fade-overlay {
    position: absolute;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: 24px;
    background: linear-gradient(to bottom,
      rgba(247, 246, 244, 0) 0%,
      rgba(247, 246, 244, 1) 100%
    );
    pointer-events: none;
    z-index: 10;
  }
`}</style>
```

**Key Features**:
- Fixed-height scrollable container
- Custom scrollbar styling
- Bottom fade overlay for visual polish
- Absolute positioning for overlay (no layout shift)

---

#### B. State-Based Text Display

**Pattern**: Conditional rendering based on application state

**Reference**: `transcript-text-states.tsx`

**Implementation**:

```typescript
// VoiceTextStates.tsx
export type VoiceTextState = 'idle' | 'listening' | 'processing' | 'results' | 'error';

interface VoiceTextStatesProps {
  textState: VoiceTextState;
  transcriptText?: string;
  placeholderText?: string;
  variation: 1 | 2 | 3;
}

export const VoiceTextStates: React.FC<VoiceTextStatesProps> = ({
  textState,
  transcriptText = '',
  placeholderText,
  variation
}) => {
  const [dotCount, setDotCount] = useState(1);

  // Animated dots for processing states
  useEffect(() => {
    if (textState === 'listening' || textState === 'processing') {
      const interval = setInterval(() => {
        setDotCount(prev => prev >= 3 ? 1 : prev + 1);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [textState]);

  const renderDots = () => '.'.repeat(dotCount);

  // Default placeholder text based on variation
  const getPlaceholder = () => {
    if (placeholderText) return placeholderText;
    switch (variation) {
      case 1:
      case 2:
        return "Tap to speak";
      case 3:
        return "Ready when you are";
      default:
        return "Tap to speak";
    }
  };

  return (
    <div className="transcript-container">
      <div className="transcript-scroll-wrapper">
        <div className="transcript-content">
          {/* IDLE STATE */}
          {textState === 'idle' && (
            <div className={`placeholder-text ${styles.OpenRundeMedium16}`}>
              {getPlaceholder()}
            </div>
          )}

          {/* LISTENING STATE */}
          {textState === 'listening' && (
            <div className={`status-text ${styles.OpenRundeMedium16}`}>
              Listening{renderDots()}
            </div>
          )}

          {/* PROCESSING STATE */}
          {textState === 'processing' && (
            <div className={`status-text ${styles.OpenRundeMedium16}`}>
              Processing{renderDots()}
            </div>
          )}

          {/* RESULTS STATE */}
          {textState === 'results' && transcriptText && (
            <VoiceTextAnimation text={transcriptText} />
          )}

          {/* ERROR STATE */}
          {textState === 'error' && (
            <div className={`error-text ${styles.OpenRundeMedium16}`}>
              Something went wrong. Please try again.
            </div>
          )}
        </div>
      </div>

      {/* Fade overlay */}
      {textState === 'results' && (
        <div className="fade-overlay"></div>
      )}

      <style jsx>{`
        .placeholder-text {
          color: var(--VoiceDarkGrey_30);
        }

        .status-text {
          color: var(--VoiceDarkGrey_80);
        }

        .error-text {
          color: var(--VoiceRed);
        }
      `}</style>
    </div>
  );
};
```

---

#### C. Styling System

**Pattern**: CSS variables + pre-defined typography classes

**Reference**: `ai-tracker.module.css`

**Voice Interface Adaptation**:

Colors already defined in `voice.module.css` (lines 265-284):
```css
.container {
  /* Base Colors */
  --VoiceDarkGrey: #262424;
  --VoiceWhite: #FFFFFF;
  --VoiceRed: #EF4444;

  /* Dark Grey Variations */
  --VoiceDarkGrey_95: rgba(38, 36, 36, 0.95);
  --VoiceDarkGrey_90: rgba(38, 36, 36, 0.9);
  --VoiceDarkGrey_80: rgba(38, 36, 36, 0.8);
  --VoiceDarkGrey_30: rgba(38, 36, 36, 0.3);
  --VoiceDarkGrey_20: rgba(38, 36, 36, 0.2);
  --VoiceDarkGrey_15: rgba(38, 36, 36, 0.15);
  --VoiceDarkGrey_5: rgba(38, 36, 36, 0.05);

  /* Text Grey */
  --VoiceTextGrey_50: rgba(94, 94, 94, 0.5);
}
```

**Additional Colors Needed** (add to voice.module.css):
```css
.container {
  /* Background Colors */
  --VoiceBoxBg: #F7F6F4;
  --VoiceBoxOutline: #F2F2F2;
  --VoiceNavBg: #EEEDEB;

  /* Shadow */
  --VoiceShadow: rgba(0, 0, 0, 0.06);
}
```

Typography classes already exist in `voice.module.css` (lines 126-252) - use these throughout.

---

#### E. Detailed Hook Implementations (ClipStream Pattern)

**Pattern**: Complete separation of business logic from UI

**Reference**:
- `/src/projects/clipperstream/hooks/useClipRecording.ts`
- `/src/projects/clipperstream/components/ui/mainvarmorph.tsx`

**Hook Implementation: useVoiceRecording.ts**

```typescript
// src/projects/voiceinterface/hooks/useVoiceRecording.ts
import { useState, useRef, useCallback } from 'react';

export interface UseVoiceRecordingReturn {
  // State
  isRecording: boolean;
  audioBlob: Blob | null;
  audioId: string | null;
  recordingError: string | null;
  currentVolume: number;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetRecording: () => void;

  // Audio Analyzer Node (for wave visualizations)
  analyserNode: AnalyserNode | null;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  // RECORDING STATE
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(0);

  // REFS (prevent stale closures)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start audio recording
   * - Request microphone permission
   * - Initialize MediaRecorder
   * - Setup audio analyzer for visualizations
   */
  const startRecording = useCallback(async () => {
    try {
      setRecordingError(null);
      setAudioBlob(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup audio context for volume analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserNodeRef.current = analyser;

      source.connect(analyser);

      // Monitor volume
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      volumeIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = Math.min(average / 128, 1);
        setCurrentVolume(normalized);
      }, 100);

      // Data handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const id = `audio-${Date.now()}`;
        setAudioBlob(blob);
        setAudioId(id);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

    } catch (err) {
      setRecordingError('Microphone permission denied');
      console.error('Error starting recording:', err);
    }
  }, []);

  /**
   * Stop audio recording
   * - Stop MediaRecorder
   * - Release microphone
   * - Cleanup audio context
   */
  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Stop volume monitoring
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }

      setCurrentVolume(0);
    }
  }, [isRecording]);

  /**
   * Reset recording state
   */
  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioId(null);
    setRecordingError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    isRecording,
    audioBlob,
    audioId,
    recordingError,
    currentVolume,

    // Actions
    startRecording,
    stopRecording,
    resetRecording,

    // Audio Analyzer
    analyserNode: analyserNodeRef.current
  };
}
```

**Hook: useVoiceTranscription.ts**

```typescript
// src/projects/voiceinterface/hooks/useVoiceTranscription.ts
import { useState, useCallback, useRef } from 'react';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  timestamp: number;
}

export interface UseVoiceTranscriptionReturn {
  // State
  isTranscribing: boolean;
  transcription: string;
  transcriptionError: string | null;
  isStreaming: boolean;

  // Actions
  transcribeAudio: (audioBlob: Blob) => Promise<void>;
  startStreamingTranscription: () => void;
  stopStreamingTranscription: () => void;
  resetTranscription: () => void;
}

export function useVoiceTranscription(): UseVoiceTranscriptionReturn {
  // TRANSCRIPTION STATE
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // REFS
  const streamRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  /**
   * Transcribe recorded audio (Variations 1 & 2)
   */
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Send to API
      const response = await fetch('/api/voice-interface/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();
      setTranscription(data.text || '');
      retryCountRef.current = 0; // Reset retry count on success

    } catch (err) {
      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        console.log(`Retry attempt ${retryCountRef.current}/${maxRetries}`);

        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * Math.pow(2, retryCountRef.current))
        );

        return transcribeAudio(audioBlob);
      }

      // Max retries reached
      setTranscriptionError(
        err instanceof Error ? err.message : 'Transcription failed'
      );
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  /**
   * Start streaming transcription (Variation 3)
   * Uses WebSocket for real-time results
   */
  const startStreamingTranscription = useCallback(() => {
    setIsStreaming(true);
    setTranscriptionError(null);
    setTranscription('');

    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/voice-interface/transcribe-stream`);
      streamRef.current = ws;

      ws.onopen = () => {
        console.log('Streaming transcription started');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Append new transcription (fresh state pattern!)
        setTranscription(prev => {
          const separator = prev && data.text ? ' ' : '';
          return prev + separator + data.text;
        });
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setTranscriptionError('Streaming transcription error');
      };

      ws.onclose = () => {
        console.log('Streaming transcription closed');
        setIsStreaming(false);
      };

    } catch (err) {
      setTranscriptionError('Failed to start streaming');
      setIsStreaming(false);
      console.error('Streaming error:', err);
    }
  }, []);

  /**
   * Stop streaming transcription
   */
  const stopStreamingTranscription = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  /**
   * Reset transcription state
   */
  const resetTranscription = useCallback(() => {
    setTranscription('');
    setTranscriptionError(null);
    retryCountRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  return {
    // State
    isTranscribing,
    transcription,
    transcriptionError,
    isStreaming,

    // Actions
    transcribeAudio,
    startStreamingTranscription,
    stopStreamingTranscription,
    resetTranscription
  };
}
```

**Key Principles Applied**:
1. **Complete Logic Encapsulation**: All recording/transcription logic in hooks
2. **No Business Logic in UI**: Components only receive callbacks
3. **Cleanup Everywhere**: useEffect cleanup prevents memory leaks
4. **Refs Prevent Stale Closures**: Never capture state in async operations
5. **Retry Logic Built-In**: Exponential backoff for API failures

---

#### B. State Management Architecture

**Pattern**: Single source of truth + computed properties

**Reference**: `/src/projects/clipperstream/components/ui/mainvarmorph.tsx`

**Implementation for Voice Interface**:

**Types: VoiceInterfaceTypes.ts**

```typescript
// src/projects/voiceinterface/types/VoiceInterfaceTypes.ts

/**
 * Application State - Single Source of Truth
 * All UI states are derived from this enum
 */
export enum VoiceAppState {
  IDLE = 'idle',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  RESULTS = 'results',
  ERROR = 'error'
}

/**
 * Interface Variation
 */
export enum VoiceVariation {
  STANDARD = 1,          // TextBox Standard (mic button)
  CHECK_CLOSE = 2,       // TextBox Check & Close (outlined mic)
  LIVE_STREAMING = 3     // TextWrapper (live streaming)
}

/**
 * UI State Types (derived from VoiceAppState)
 */
export type VoiceTextState = 'idle' | 'listening' | 'processing' | 'results' | 'error';
export type VoiceNavState = 'idle' | 'listening' | 'processing' | 'results' | 'error';

/**
 * Button States (for morphing animations)
 */
export type MicButtonState = 'idle' | 'listening';
export type ActionButtonState = 'close' | 'check' | 'processing';
export type NavButtonState = 'record' | 'recordWave' | 'stopRecord' | 'processing';

/**
 * State Configuration
 * Defines all UI properties for each application state
 */
export interface VoiceStateConfig {
  // Text display
  textState: VoiceTextState;

  // Navigation
  navState: VoiceNavState;

  // Buttons
  showMicButton: boolean;
  showCloseButton: boolean;
  showCheckButton: boolean;
  showRecordWaveButton: boolean;
  showStopRecordButton: boolean;
  showProcessingButton: boolean;
  showVoiceDocker: boolean;

  // Interactions
  canStartRecording: boolean;
  canStopRecording: boolean;
  canClear: boolean;
  canCopy: boolean;

  // Animations
  shouldAnimateTextEntry: boolean;
}

/**
 * Get UI configuration for a given app state and variation
 * This is a PURE FUNCTION - no side effects, deterministic
 */
export function getVoiceStateConfig(
  appState: VoiceAppState,
  variation: VoiceVariation
): VoiceStateConfig {

  // BASE CONFIGURATION (shared across variations)
  const baseConfig: Record<VoiceAppState, Partial<VoiceStateConfig>> = {
    [VoiceAppState.IDLE]: {
      textState: 'idle',
      navState: 'idle',
      canStartRecording: true,
      canStopRecording: false,
      canClear: false,
      canCopy: false,
      shouldAnimateTextEntry: false
    },
    [VoiceAppState.LISTENING]: {
      textState: 'listening',
      navState: 'listening',
      canStartRecording: false,
      canStopRecording: true,
      canClear: false,
      canCopy: false,
      shouldAnimateTextEntry: false
    },
    [VoiceAppState.PROCESSING]: {
      textState: 'processing',
      navState: 'processing',
      canStartRecording: false,
      canStopRecording: false,
      canClear: false,
      canCopy: false,
      shouldAnimateTextEntry: false
    },
    [VoiceAppState.RESULTS]: {
      textState: 'results',
      navState: 'results',
      canStartRecording: false,
      canStopRecording: false,
      canClear: true,
      canCopy: true,
      shouldAnimateTextEntry: true
    },
    [VoiceAppState.ERROR]: {
      textState: 'error',
      navState: 'error',
      canStartRecording: true,
      canStopRecording: false,
      canClear: true,
      canCopy: false,
      shouldAnimateTextEntry: false
    }
  };

  // VARIATION-SPECIFIC OVERRIDES
  const variationConfig: Record<VoiceVariation, Partial<VoiceStateConfig>> = {
    [VoiceVariation.STANDARD]: {
      // Variation 1: TextBox Standard
      showMicButton: appState === VoiceAppState.IDLE,
      showRecordWaveButton: appState === VoiceAppState.LISTENING,
      showProcessingButton: appState === VoiceAppState.PROCESSING,
      showCloseButton: appState === VoiceAppState.LISTENING,
      showCheckButton: false,
      showStopRecordButton: false,
      showVoiceDocker: appState === VoiceAppState.RESULTS
    },
    [VoiceVariation.CHECK_CLOSE]: {
      // Variation 2: TextBox Check & Close
      showMicButton: appState === VoiceAppState.IDLE,
      showRecordWaveButton: appState === VoiceAppState.LISTENING,
      showProcessingButton: appState === VoiceAppState.PROCESSING,
      showCloseButton: appState === VoiceAppState.LISTENING,
      showCheckButton: appState === VoiceAppState.LISTENING,
      showStopRecordButton: false,
      showVoiceDocker: appState === VoiceAppState.RESULTS
    },
    [VoiceVariation.LIVE_STREAMING]: {
      // Variation 3: TextWrapper Live Streaming
      showMicButton: false,
      showRecordWaveButton: appState === VoiceAppState.IDLE || appState === VoiceAppState.ERROR,
      showStopRecordButton: appState === VoiceAppState.LISTENING,
      showProcessingButton: appState === VoiceAppState.PROCESSING,
      showCloseButton: false,
      showCheckButton: false,
      showVoiceDocker: appState === VoiceAppState.RESULTS
    }
  };

  // MERGE: Base + Variation-specific
  return {
    ...baseConfig[appState],
    ...variationConfig[variation]
  } as VoiceStateConfig;
}
```

**Context Provider: VoiceInterfaceContext.tsx**

```typescript
// src/projects/voiceinterface/context/VoiceInterfaceContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useVoiceTranscription } from '../hooks/useVoiceTranscription';
import {
  VoiceAppState,
  VoiceVariation,
  VoiceStateConfig,
  getVoiceStateConfig
} from '../types/VoiceInterfaceTypes';

interface VoiceInterfaceContextValue {
  // Core State
  appState: VoiceAppState;
  variation: VoiceVariation;
  stateConfig: VoiceStateConfig;

  // Recording State
  isRecording: boolean;
  currentVolume: number;
  recordingError: string | null;

  // Transcription State
  transcription: string;
  isTranscribing: boolean;
  transcriptionError: string | null;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearTranscription: () => void;
  copyTranscription: () => void;
  setVariation: (variation: VoiceVariation) => void;

  // Audio Analyzer (for visualizations)
  analyserNode: AnalyserNode | null;
}

const VoiceInterfaceContext = createContext<VoiceInterfaceContextValue | undefined>(undefined);

export const VoiceInterfaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // VARIATION STATE
  const [variation, setVariation] = useState<VoiceVariation>(VoiceVariation.STANDARD);

  // APPLICATION STATE (single source of truth)
  const [appState, setAppState] = useState<VoiceAppState>(VoiceAppState.IDLE);

  // HOOKS
  const {
    isRecording,
    audioBlob,
    recordingError,
    currentVolume,
    startRecording: startRec,
    stopRecording: stopRec,
    resetRecording,
    analyserNode
  } = useVoiceRecording();

  const {
    isTranscribing,
    transcription,
    transcriptionError,
    isStreaming,
    transcribeAudio,
    startStreamingTranscription,
    stopStreamingTranscription,
    resetTranscription
  } = useVoiceTranscription();

  // COMPUTED STATE CONFIG
  const stateConfig = getVoiceStateConfig(appState, variation);

  /**
   * Start Recording
   * Handles both standard and streaming variations
   */
  const startRecording = useCallback(async () => {
    try {
      await startRec();

      // For live streaming variation, also start streaming transcription
      if (variation === VoiceVariation.LIVE_STREAMING) {
        startStreamingTranscription();
      }

      setAppState(VoiceAppState.LISTENING);
    } catch (err) {
      setAppState(VoiceAppState.ERROR);
      console.error('Failed to start recording:', err);
    }
  }, [startRec, variation, startStreamingTranscription]);

  /**
   * Stop Recording
   * Handles both standard and streaming variations
   */
  const stopRecording = useCallback(async () => {
    try {
      await stopRec();

      // For live streaming variation
      if (variation === VoiceVariation.LIVE_STREAMING) {
        stopStreamingTranscription();

        // If we have transcription already, go to results
        // If not, might need to wait for final processing
        if (transcription) {
          setAppState(VoiceAppState.RESULTS);
        } else {
          setAppState(VoiceAppState.PROCESSING);
          // Wait for final chunk, then go to results
          setTimeout(() => {
            setAppState(VoiceAppState.RESULTS);
          }, 1000);
        }
      } else {
        // For standard variations, process the audio blob
        setAppState(VoiceAppState.PROCESSING);
      }
    } catch (err) {
      setAppState(VoiceAppState.ERROR);
      console.error('Failed to stop recording:', err);
    }
  }, [stopRec, variation, stopStreamingTranscription, transcription]);

  /**
   * Process audio blob (for standard variations)
   * Automatically called when audioBlob is available
   */
  useEffect(() => {
    if (
      audioBlob &&
      !isRecording &&
      appState === VoiceAppState.PROCESSING &&
      variation !== VoiceVariation.LIVE_STREAMING
    ) {
      transcribeAudio(audioBlob)
        .then(() => {
          setAppState(VoiceAppState.RESULTS);
        })
        .catch(() => {
          setAppState(VoiceAppState.ERROR);
        });
    }
  }, [audioBlob, isRecording, appState, variation, transcribeAudio]);

  /**
   * Clear transcription and reset to idle
   */
  const clearTranscription = useCallback(() => {
    resetTranscription();
    resetRecording();
    setAppState(VoiceAppState.IDLE);
  }, [resetTranscription, resetRecording]);

  /**
   * Copy transcription to clipboard
   */
  const copyTranscription = useCallback(async () => {
    if (transcription) {
      try {
        await navigator.clipboard.writeText(transcription);
        // Optional: Show toast notification
        console.log('Copied to clipboard');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, [transcription]);

  const value: VoiceInterfaceContextValue = {
    // Core State
    appState,
    variation,
    stateConfig,

    // Recording State
    isRecording,
    currentVolume,
    recordingError,

    // Transcription State
    transcription,
    isTranscribing,
    transcriptionError,

    // Actions
    startRecording,
    stopRecording,
    clearTranscription,
    copyTranscription,
    setVariation,

    // Audio Analyzer
    analyserNode
  };

  return (
    <VoiceInterfaceContext.Provider value={value}>
      {children}
    </VoiceInterfaceContext.Provider>
  );
};

/**
 * Custom hook to use Voice Interface context
 */
export const useVoiceInterface = () => {
  const context = useContext(VoiceInterfaceContext);
  if (!context) {
    throw new Error('useVoiceInterface must be used within VoiceInterfaceProvider');
  }
  return context;
};
```

**Key Principles Applied**:
1. **Single Source of Truth**: `appState` enum drives everything
2. **Pure Functions**: `getVoiceStateConfig` is deterministic
3. **No Duplicate State**: All UI props computed from `appState`
4. **Impossible Inconsistency**: Can't have conflicting button states
5. **Variation-Specific Logic**: Handled via configuration, not scattered conditionals

---

#### C. Fresh State Pattern (Avoiding Race Conditions)

**Pattern**: Never capture state in async closures, always fetch fresh

**Reference**: ClipStream implementation complete docs (Bug Fix #3)

**Example Implementation**:

```typescript
// ❌ BAD: Stale closure
const processAudio = async () => {
  const currentTranscript = transcription;  // Captured at function start

  const result = await transcribeAudio(audioBlob);

  // Bug: Using stale currentTranscript
  setTranscription(currentTranscript + ' ' + result.text);
};

// ✅ GOOD: Fresh state
const processAudio = async () => {
  const result = await transcribeAudio(audioBlob);

  // Fetch fresh state via setter callback
  setTranscription(prev => prev + ' ' + result.text);
};
```

**Applied in Context**:

```typescript
// In VoiceInterfaceContext.tsx
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // ✅ FRESH STATE: Uses callback to get latest value
  setTranscription(prev => {
    const separator = prev && data.text ? ' ' : '';
    return prev + separator + data.text;
  });
};
```

---

#### D. Button Morphing Animation Patterns (ClipStream Approach)

**Why ClipStream**: ClipStream's button morphing implementation is superior for handling complex state transitions with smooth animations. The clip morphing buttons demonstrate best practices for:
- Fixed container preventing layout shifts
- Smooth opacity crossfades between states
- Proper z-index layering
- Transform origin management for directional morphing

**Pattern: Fixed Container with Dynamic Inner Content**

**Primary Reference**: `/src/projects/clipperstream/components/ui/mainvarmorph.tsx`

**Implementation for Voice Interface**:

**Component: VoiceMorphingNavButton.tsx**

```typescript
// src/projects/voiceinterface/components/ui/VoiceMorphingNavButton.tsx
import React from 'react';
import { RecordingWaveButton, StopRecordButton, ProcessingButton } from './voicebuttons';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

export type NavButtonState = 'recordWave' | 'stopRecord' | 'processing';

interface VoiceMorphingNavButtonProps {
  state: NavButtonState;
  onRecordWaveClick?: () => void;
  onStopRecordClick?: () => void;
  isTimerRunning?: boolean;
  className?: string;
}

/**
 * Morphing Navigation Button
 * Morphs between: RecordWave → StopRecord → Processing
 *
 * Pattern:
 * - Fixed outer container (accommodates largest size)
 * - Inner button morphs via opacity crossfade
 * - Transform origin: center (equal expansion)
 */
export const VoiceMorphingNavButton: React.FC<VoiceMorphingNavButtonProps> = ({
  state,
  onRecordWaveClick,
  onStopRecordClick,
  isTimerRunning = true,
  className = ''
}) => {

  // Get button dimensions for each state
  const getButtonDimensions = () => {
    switch (state) {
      case 'recordWave':
        return { width: 64, height: 34 };
      case 'stopRecord':
        return { width: 58, height: 26 };
      case 'processing':
        return { width: 115, height: 34 };
      default:
        return { width: 64, height: 34 };
    }
  };

  const dimensions = getButtonDimensions();

  return (
    <>
      <div className={`morph-nav-button-container ${className}`}>
        <div
          className="morph-nav-button"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }}
        >
          {/* LAYER 1: RecordWave Button */}
          <div
            className="button-layer"
            style={{ opacity: state === 'recordWave' ? 1 : 0 }}
          >
            <RecordingWaveButton onClick={onRecordWaveClick} />
          </div>

          {/* LAYER 2: StopRecord Button */}
          <div
            className="button-layer"
            style={{ opacity: state === 'stopRecord' ? 1 : 0 }}
          >
            <StopRecordButton onClick={onStopRecordClick} isTimerRunning={isTimerRunning} />
          </div>

          {/* LAYER 3: Processing Button */}
          <div
            className="button-layer"
            style={{ opacity: state === 'processing' ? 1 : 0 }}
          >
            <ProcessingButton />
          </div>
        </div>
      </div>

      <style jsx>{`
        .morph-nav-button-container {
          /* Fixed container - largest size (processing button) */
          width: 115px;
          height: 34px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .morph-nav-button {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;

          /* Smooth size transitions */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .button-layer {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);

          /* Smooth opacity transitions */
          transition: opacity 0.15s ease-in-out;

          /* Prevent clicks when hidden */
          pointer-events: none;
        }

        .button-layer[style*="opacity: 1"] {
          pointer-events: auto;
        }
      `}</style>
    </>
  );
};
```

**Animation Timing**:
- **Size change**: 0.2s (Material Design easing)
- **Opacity crossfade**: 0.15s (faster for immediate feedback)
- **Transform origin**: center center (equal expansion/contraction)

---

**Pattern 2: Left-Right Morphing (for Check & Close)**

```typescript
// VoiceMorphingCheckClose.tsx
import React from 'react';
import { CheckAndCloseButton } from './voicebuttons';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

export type CheckCloseState = 'check' | 'close';

interface VoiceMorphingCheckCloseProps {
  state: CheckCloseState;
  onCheckClick?: () => void;
  onCloseClick?: () => void;
  className?: string;
}

/**
 * Morphing Check/Close Button
 * Simple icon swap with opacity crossfade
 *
 * Pattern:
 * - Fixed size (both icons same dimensions)
 * - Pure opacity swap
 * - No size changes
 */
export const VoiceMorphingCheckClose: React.FC<VoiceMorphingCheckCloseProps> = ({
  state,
  onCheckClick,
  onCloseClick,
  className = ''
}) => {

  const handleClick = () => {
    if (state === 'check' && onCheckClick) {
      onCheckClick();
    } else if (state === 'close' && onCloseClick) {
      onCloseClick();
    }
  };

  return (
    <>
      <div className={`morph-check-close-container ${className}`} onClick={handleClick}>
        <CheckAndCloseButton variant={state} />
      </div>

      <style jsx>{`
        .morph-check-close-container {
          width: 72px;
          height: 34px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: opacity 0.2s ease-in-out;
        }

        .morph-check-close-container:hover {
          opacity: 0.8;
        }

        .morph-check-close-container:active {
          opacity: 0.6;
        }
      `}</style>
    </>
  );
};
```

---

### 3.3 From Deep Library (Text Animation)

#### Word-by-Word Horizontal Fade-In Animation

**Pattern**: Multi-line text with horizontal fade-in, no vertical movement

**Reference**: `/src/projects/ai-confidence-tracker/components/ui/deepTextAnimation.tsx` (lines 99-201)

**Implementation for Voice Interface**:

**Component: VoiceTextAnimation.tsx**

```typescript
// src/projects/voiceinterface/components/ui/VoiceTextAnimation.tsx
import React, { useState, useCallback } from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

interface VoiceTextAnimationProps {
  text: string;
  className?: string;
  animationDelay?: number;  // Delay between words (default: 0.07s)
  animationDuration?: number;  // Duration per word (default: 0.5s)
}

/**
 * Voice Text Animation Component
 *
 * Features:
 * - Word-by-word fade-in animation
 * - Horizontal blur effect (no vertical movement)
 * - Natural multi-line text wrapping
 * - Staggered timing for smooth appearance
 *
 * Pattern from: AI Confidence Tracker / Deep Library
 */
export const VoiceTextAnimation: React.FC<VoiceTextAnimationProps> = ({
  text,
  className = '',
  animationDelay = 0.07,
  animationDuration = 0.5
}) => {
  const [key, setKey] = useState(0);

  /**
   * Reset animation
   * Useful if text changes and needs to re-animate
   */
  const resetAnimation = useCallback(() => {
    setKey(prevKey => prevKey + 1);
  }, []);

  // Split text into words
  const words = text.split(/\s+/).filter(word => word.length > 0);

  return (
    <>
      <div key={key} className={`voice-animated-text ${className}`}>
        {words.map((word, index) => (
          <span
            key={`word-${index}`}
            className="animated-word"
            style={{
              animationDelay: `${index * animationDelay}s`,
              animationDuration: `${animationDuration}s`
            }}
          >
            {word}
          </span>
        ))}
      </div>

      <style jsx>{`
        .voice-animated-text {
          width: 100%;
          display: inline-block;
          word-wrap: break-word;
          font-family: 'Open Runde', 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: -0.01em;
          line-height: 143.75%;
          color: var(--VoiceDarkGrey_90);
        }

        .animated-word {
          display: inline-block;
          opacity: 0;
          margin-right: 0.25em;
          animation: fadeInWordHorizontal forwards;
        }

        /* Horizontal fade-in animation */
        @keyframes fadeInWordHorizontal {
          from {
            opacity: 0;
            filter: blur(3px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .voice-animated-text {
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
};
```

**Animation Parameters**:
- **Delay between words**: 0.07s (70ms) - configurable
- **Duration per word**: 0.5s (500ms) - configurable
- **Effect**: Blur (3px → 0px) + Opacity (0 → 1)
- **Direction**: Horizontal only (NO vertical movement)

**Usage Example**:

```typescript
<VoiceTextAnimation
  text="This is a test transcription that will animate word by word"
  animationDelay={0.05}  // Faster
  animationDuration={0.4}  // Shorter per-word duration
/>
```

---

## 4. Interface Variation Specifications

### 4.1 Variation 1: TextBox Standard

**Outermost Container**: `TextBox`

**Component Hierarchy**:
```
TextBox
└── TxtBox
    ├── TxtTranscriptBox
    │   └── VoiceTextStates (text display)
    └── TxtNavBar
        ├── [Empty Left Space]
        └── MicButton → RecordWave + Timer + Close → Processing → Results
```

**Dimensions** (from A03_IMPLEMENTATION_NOTES.md):
- TextBox: 398px × 213px
- TxtBox: 368px × 173px
- TxtTranscriptBox: 368px × 125px (flex-grow: 1)
- TxtNavBar: 368px × 38px

**State Flow**:
```
IDLE (Mic Button)
  ↓ [User taps mic]
LISTENING (RecordWave + Timer + Close button)
  ↓ [User taps RecordWave to stop]
PROCESSING (Processing button)
  ↓ [Transcription complete]
RESULTS (Text appears with animation)
```

**Button Positions**:
- **IDLE**: Mic button (center-right of navbar)
- **LISTENING**: Close button (left) + RecordWave + Timer (right, combo pill)
- **PROCESSING**: Processing button (center)
- **RESULTS**: (navbar hidden or shows copy/clear options - TBD)

**Colors**:
- Background: `--VoiceBoxBg` (#F7F6F4)
- Border: `--VoiceBoxOutline` (#F2F2F2)
- Shadow: `0px 4px 12px var(--VoiceShadow)`
- Text (placeholder): `var(--VoiceDarkGrey_30)`

---

### 4.2 Variation 2: TextBox Check & Close

**Outermost Container**: `TextBox`

**Component Hierarchy**:
```
TextBox
└── TxtBox
    ├── TxtTranscriptBox
    │   └── VoiceTextStates (text display)
    └── TxtNavBar
        ├── [Empty Left Space]
        └── MicButtonOutline → RecordWave + Timer + CheckAndClose → ProcessingOutline → Results
```

**Dimensions**: Same as Variation 1
- TextBox: 398px × 213px
- TxtBox: 368px × 173px
- TxtTranscriptBox: 368px × 125px
- TxtNavBar: 368px × 38px

**State Flow**:
```
IDLE (Mic Button with Outline)
  ↓ [User taps mic]
LISTENING (RecordWave + Timer + Check/Close button)
  ↓ [User taps Check mark]
PROCESSING (Processing button with Outline)
  ↓ [Transcription complete]
RESULTS (Text appears with animation)
```

**Difference from Variation 1**:
- Mic button has **outline** (not filled)
- **CheckAndCloseButton** combo instead of just Close button
- Processing button has **outline** (not filled)

**Button Positions**:
- **IDLE**: Mic button with outline (center-right)
- **LISTENING**: CheckAndClose combo (left) + RecordWave + Timer (right, combo pill)
- **PROCESSING**: Processing button with outline (center)
- **RESULTS**: (navbar hidden or shows copy/clear options - TBD)

---

### 4.3 Variation 3: TextWrapper Live Streaming

**Outermost Container**: `TextWrapper`

**Component Hierarchy**:
```
TextWrapper
├── TextBox
│   └── TxtBox
│       └── TxtTranscriptBox
│           └── VoiceTextStates (live streaming text)
└── NavButton (OUTSIDE TextBox)
    └── RecordWide → StopRecord + Timer → ProcessingDark → VoiceDocker
```

**Dimensions** (from A03_IMPLEMENTATION_NOTES.md):
- TextWrapper: 254px × 407px
- TextBox: 254px × 340px
- TxtBox: 224px × 300px
- TxtTranscriptBox: 224px × 300px (flex-grow: 1)
- NavButton (RecordWide): 76px × 44px

**State Flow**:
```
IDLE (RecordWide button below TextBox)
  ↓ [User taps RecordWide]
LISTENING (StopRecord + Timer - live transcription appears in real-time)
  ↓ [User taps Stop]
PROCESSING (if final chunks need processing - ProcessingDark button)
  ↓ [Complete]
RESULTS (VoiceDocker with Copy/Delete buttons)
```

**Key Differences**:
- **Button OUTSIDE canvas** (not in navbar inside TextBox)
- **Live streaming transcription** - text appears word-by-word as spoken
- **Mobile-optimized dimensions** (narrower: 254px vs 398px)
- **Taller text area** (300px vs 125px)
- **VoiceDocker** for final actions (copy/delete)

**Button States**:
- **IDLE**: RecordWide button (dark, mic icon)
- **LISTENING**: StopRecord button + Timer (above button, separate element)
- **PROCESSING**: ProcessingDark button (if needed)
- **RESULTS**: VoiceDocker (copy + delete)

**VoiceDocker Actions**:
- **Copy**: Copies transcription to clipboard (auto-confirmation)
- **Delete**: Clears transcription and returns to IDLE state with RecordWide button

---

## 5. Component Architecture

### 5.1 Component Hierarchy

**Shared Components** (all variations):
```
VoiceInterfaceProvider (Context wrapper)
└── VoiceVariationContainer (variation selector)
    ├── VoiceTextBoxStandard (Variation 1)
    ├── VoiceTextBoxCheckClose (Variation 2)
    └── VoiceTextWrapperLive (Variation 3)
```

**Variation 1: VoiceTextBoxStandard**:
```
VoiceTextBoxStandard
└── TextBox (container)
    └── TxtBox
        ├── TxtTranscriptBox
        │   └── VoiceTextStates
        │       ├── Placeholder Text (idle)
        │       ├── Status Text (listening/processing)
        │       └── VoiceTextAnimation (results)
        └── TxtNavBar
            ├── [Empty Space]
            ├── VoiceMorphingCloseButton (appears during listening)
            └── VoiceMorphingMainButton
                ├── MicButton (idle)
                ├── VoicePillWave (listening)
                ├── ProcessingButton (processing)
                └── [Hidden] (results)
```

**Variation 2: VoiceTextBoxCheckClose**:
```
VoiceTextBoxCheckClose
└── TextBox (container)
    └── TxtBox
        ├── TxtTranscriptBox
        │   └── VoiceTextStates
        │       ├── Placeholder Text (idle)
        │       ├── Status Text (listening/processing)
        │       └── VoiceTextAnimation (results)
        └── TxtNavBar
            ├── [Empty Space]
            ├── VoiceMorphingCheckClose (appears during listening)
            └── VoiceMorphingMainButton
                ├── MicButtonOutline (idle)
                ├── VoicePillWave (listening)
                ├── ProcessingButtonOutline (processing)
                └── [Hidden] (results)
```

**Variation 3: VoiceTextWrapperLive**:
```
VoiceTextWrapperLive
└── TextWrapper (container)
    ├── TextBox
    │   └── TxtBox
    │       └── TxtTranscriptBox
    │           └── VoiceTextStates
    │               ├── Placeholder Text (idle)
    │               ├── VoiceTextAnimation (live streaming - continuous)
    │               └── Error Text (error)
    └── NavButton (outside TextBox)
        └── VoiceMorphingNavButton
            ├── RecordWideButton (idle)
            ├── StopRecordButton + Timer (listening)
            ├── ProcessingDarkButton (processing)
            └── VoiceDocker (results)
```

---

### 5.2 Component Specifications

#### A. VoiceTextBoxStandard.tsx

```typescript
// src/projects/voiceinterface/components/VoiceTextBoxStandard.tsx
import React from 'react';
import { useVoiceInterface } from '../context/VoiceInterfaceContext';
import { VoiceTextStates } from './ui/VoiceTextStates';
import { VoiceMorphingMainButton } from './ui/VoiceMorphingMainButton';
import { VoiceMorphingCloseButton } from './ui/VoiceMorphingCloseButton';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Variation 1: TextBox Standard
 *
 * Layout:
 * - TextBox (outermost container)
 *   - TxtBox
 *     - TxtTranscriptBox (text display area)
 *     - TxtNavBar (button controls)
 *
 * State Flow:
 * IDLE → LISTENING → PROCESSING → RESULTS
 */
export const VoiceTextBoxStandard: React.FC = () => {
  const {
    appState,
    stateConfig,
    transcription,
    isRecording,
    startRecording,
    stopRecording,
    clearTranscription
  } = useVoiceInterface();

  return (
    <>
      <div className={`text-box ${styles.container}`}>
        <div className="txt-box">
          {/* Transcript Display Area */}
          <div className="txt-transcript-box">
            <VoiceTextStates
              textState={stateConfig.textState}
              transcriptText={transcription}
              variation={1}
            />
          </div>

          {/* Navigation Bar */}
          <div className="txt-nav-bar">
            {/* Left: Close button (only visible during listening) */}
            {stateConfig.showCloseButton && (
              <div className="nav-left">
                <VoiceMorphingCloseButton onClick={clearTranscription} />
              </div>
            )}

            {/* Right: Main button (mic → recordWave → processing) */}
            <div className="nav-right">
              <VoiceMorphingMainButton
                appState={appState}
                variation={1}
                onMicClick={startRecording}
                onRecordWaveClick={stopRecording}
                isTimerRunning={isRecording}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* TextBox - Outermost Container */
        .text-box {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 15px;
          gap: 10px;

          position: relative;
          width: 398px;
          max-width: 600px;
          height: 213px;

          background: var(--VoiceBoxBg);
          border: 1px solid var(--VoiceBoxOutline);
          box-shadow: 0px 4px 12px var(--VoiceShadow);
          border-radius: 16px;
        }

        /* TxtBox - Inner Container */
        .txt-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;

          width: 368px;
          height: 173px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }

        /* TxtTranscriptBox - Text Display Area */
        .txt-transcript-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px;
          gap: 10px;

          width: 368px;
          height: 125px;

          border-radius: 6px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }

        /* TxtNavBar - Navigation Controls */
        .txt-nav-bar {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0px 12px;
          gap: 10px;

          width: 368px;
          height: 38px;

          border-radius: 6px;

          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }

        .nav-left {
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        .nav-right {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-left: auto;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .text-box {
            width: 100%;
            max-width: 398px;
          }
        }
      `}</style>
    </>
  );
};
```

---

#### B. VoiceTextBoxCheckClose.tsx

```typescript
// src/projects/voiceinterface/components/VoiceTextBoxCheckClose.tsx
import React from 'react';
import { useVoiceInterface } from '../context/VoiceInterfaceContext';
import { VoiceTextStates } from './ui/VoiceTextStates';
import { VoiceMorphingMainButton } from './ui/VoiceMorphingMainButton';
import { VoiceMorphingCheckClose } from './ui/VoiceMorphingCheckClose';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Variation 2: TextBox Check & Close
 *
 * Difference from Variation 1:
 * - Mic button has outline (not filled)
 * - CheckAndClose combo button (not just close)
 * - Processing button has outline
 */
export const VoiceTextBoxCheckClose: React.FC = () => {
  const {
    appState,
    stateConfig,
    transcription,
    isRecording,
    startRecording,
    stopRecording,
    clearTranscription
  } = useVoiceInterface();

  return (
    <>
      <div className={`text-box ${styles.container}`}>
        <div className="txt-box">
          {/* Transcript Display Area */}
          <div className="txt-transcript-box">
            <VoiceTextStates
              textState={stateConfig.textState}
              transcriptText={transcription}
              variation={2}
            />
          </div>

          {/* Navigation Bar */}
          <div className="txt-nav-bar">
            {/* Left: CheckAndClose button (only visible during listening) */}
            {stateConfig.showCheckButton && (
              <div className="nav-left">
                <VoiceMorphingCheckClose
                  state="check"
                  onCheckClick={stopRecording}
                  onCloseClick={clearTranscription}
                />
              </div>
            )}

            {/* Right: Main button (micOutline → recordWave → processingOutline) */}
            <div className="nav-right">
              <VoiceMorphingMainButton
                appState={appState}
                variation={2}
                onMicClick={startRecording}
                onRecordWaveClick={stopRecording}
                isTimerRunning={isRecording}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Same styles as VoiceTextBoxStandard */
        .text-box {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 15px;
          gap: 10px;

          position: relative;
          width: 398px;
          max-width: 600px;
          height: 213px;

          background: var(--VoiceBoxBg);
          border: 1px solid var(--VoiceBoxOutline);
          box-shadow: 0px 4px 12px var(--VoiceShadow);
          border-radius: 16px;
        }

        .txt-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;

          width: 368px;
          height: 173px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }

        .txt-transcript-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px;
          gap: 10px;

          width: 368px;
          height: 125px;

          border-radius: 6px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }

        .txt-nav-bar {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0px 12px;
          gap: 10px;

          width: 368px;
          height: 38px;

          border-radius: 6px;

          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }

        .nav-left {
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        .nav-right {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-left: auto;
        }

        @media (max-width: 768px) {
          .text-box {
            width: 100%;
            max-width: 398px;
          }
        }
      `}</style>
    </>
  );
};
```

---

#### C. VoiceTextWrapperLive.tsx

```typescript
// src/projects/voiceinterface/components/VoiceTextWrapperLive.tsx
import React from 'react';
import { useVoiceInterface } from '../context/VoiceInterfaceContext';
import { VoiceTextStates } from './ui/VoiceTextStates';
import { VoiceMorphingNavButton } from './ui/VoiceMorphingNavButton';
import { VoiceDocker } from './ui/VoiceDocker';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Variation 3: TextWrapper Live Streaming
 *
 * Key Differences:
 * - Button OUTSIDE TextBox (not in navbar)
 * - Live streaming transcription
 * - Mobile-optimized dimensions (254px width)
 * - Taller text area (300px vs 125px)
 * - VoiceDocker for final actions
 */
export const VoiceTextWrapperLive: React.FC = () => {
  const {
    appState,
    stateConfig,
    transcription,
    isRecording,
    startRecording,
    stopRecording,
    clearTranscription,
    copyTranscription
  } = useVoiceInterface();

  // Determine nav button state
  const getNavButtonState = (): 'recordWave' | 'stopRecord' | 'processing' => {
    if (appState === 'idle' || appState === 'error') return 'recordWave';
    if (appState === 'listening') return 'stopRecord';
    return 'processing';
  };

  const navButtonState = getNavButtonState();

  return (
    <>
      <div className={`text-wrapper ${styles.container}`}>
        {/* TextBox - Text Display Canvas */}
        <div className="text-box">
          <div className="txt-box">
            <div className="txt-transcript-box">
              <VoiceTextStates
                textState={stateConfig.textState}
                transcriptText={transcription}
                variation={3}
                placeholderText="Ready when you are"
              />
            </div>
          </div>
        </div>

        {/* NavButton - OUTSIDE TextBox */}
        <div className="nav-button-container">
          {!stateConfig.showVoiceDocker && (
            <VoiceMorphingNavButton
              state={navButtonState}
              onRecordWaveClick={startRecording}
              onStopRecordClick={stopRecording}
              isTimerRunning={isRecording}
            />
          )}

          {stateConfig.showVoiceDocker && (
            <VoiceDocker
              onCopyClick={copyTranscription}
              onDeleteClick={clearTranscription}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        /* TextWrapper - Outermost Container */
        .text-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px;
          gap: 23px;

          position: relative;
          width: 254px;
          height: 407px;
        }

        /* TextBox - Canvas for Text */
        .text-box {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 15px;
          gap: 10px;

          width: 254px;
          max-width: 600px;
          height: 340px;

          background: var(--VoiceBoxBg);
          border: 1px solid var(--VoiceBoxOutline);
          box-shadow: 0px 4px 12px var(--VoiceShadow);
          border-radius: 16px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }

        /* TxtBox */
        .txt-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;

          width: 224px;
          height: 300px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }

        /* TxtTranscriptBox - Taller for live streaming */
        .txt-transcript-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px;
          gap: 10px;

          width: 224px;
          height: 300px;

          border-radius: 6px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }

        /* NavButton Container - OUTSIDE TextBox */
        .nav-button-container {
          display: flex;
          justify-content: center;
          align-items: center;

          width: 100%;
          height: 44px;

          flex: none;
          order: 1;
          flex-grow: 0;
        }

        @media (max-width: 768px) {
          .text-wrapper {
            width: 100%;
            max-width: 254px;
          }
        }
      `}</style>
    </>
  );
};
```

---

## 6. State Management

### 6.1 State Flow Diagrams

**Variation 1 & 2 (Standard Recording)**:
```
┌─────────┐
│  IDLE   │ Placeholder: "Tap to speak"
│         │ Button: Mic (V1) / MicOutline (V2)
└────┬────┘
     │ startRecording()
     ↓
┌─────────┐
│LISTENING│ Status: "Listening..."
│         │ Buttons: Close (V1) / CheckClose (V2) + RecordWave + Timer
└────┬────┘
     │ stopRecording()
     ↓
┌─────────┐
│PROCESSING Status: "Processing..."
│         │ Button: Processing (V1) / ProcessingOutline (V2)
└────┬────┘
     │ transcribeAudio() → complete
     ↓
┌─────────┐
│ RESULTS │ Text: [Transcription with animation]
│         │ Actions: Copy, Clear (via context menu or buttons)
└─────────┘
```

**Variation 3 (Live Streaming)**:
```
┌─────────┐
│  IDLE   │ Placeholder: "Ready when you are"
│         │ Button: RecordWide (below TextBox)
└────┬────┘
     │ startRecording() + startStreamingTranscription()
     ↓
┌─────────┐
│LISTENING│ Text: [Live streaming - words appear as spoken]
│         │ Button: StopRecord + Timer (above button)
└────┬────┘
     │ stopRecording() + stopStreamingTranscription()
     ↓
     ├─── If transcription exists ────┐
     │                                 │
     ↓                                 ↓
┌─────────┐                     ┌─────────┐
│PROCESSING (brief, if needed) │ RESULTS │ (if complete)
│         │ Button: ProcessingDark      │         │
└────┬────┘                     └─────────┘
     │
     ↓
┌─────────┐
│ RESULTS │ Text: [Full transcription]
│         │ Button: VoiceDocker (Copy + Delete)
└─────────┘
```

---

### 6.2 State Synchronization

**Pattern**: Context updates trigger component re-renders with computed state

**Flow**:
```
User Action (e.g., click mic button)
    ↓
Callback in VoiceInterfaceContext
    ↓
Update appState: setAppState(VoiceAppState.LISTENING)
    ↓
Context triggers re-render with new stateConfig
    ↓
stateConfig = getVoiceStateConfig(appState, variation)
    ↓
Components receive new props via useVoiceInterface()
    ↓
UI updates (buttons morph, text changes, animations trigger)
```

**Key Benefits**:
1. **Single Update**: Change `appState`, everything else follows
2. **No Coordination**: Don't need to manually sync button states
3. **Impossible Inconsistency**: Can't have conflicting UI states
4. **Easy Testing**: Mock `appState`, verify UI matches

---

## 7. Animation System

### 7.1 Animation Timing Hierarchy

Based on ClipStream patterns:

```typescript
// src/projects/voiceinterface/utils/animationConstants.ts
export const VoiceAnimationConstants = {
  // Material Design Easing
  materialEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Container Morphing (slowest - for large elements)
  containerMorph: {
    duration: 0.3,  // 300ms
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Button Morphing (medium - for button size/shape changes)
  buttonMorph: {
    duration: 0.2,  // 200ms
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Opacity Crossfade (fast - for icon swaps)
  opacityFade: {
    duration: 0.15,  // 150ms
    easing: 'ease-in-out'
  },

  // Text Animation (word-by-word)
  textAnimation: {
    durationPerWord: 0.5,  // 500ms
    delayBetweenWords: 0.07,  // 70ms
    easing: 'ease-out'
  },

  // Quick Feedback (instant response)
  quickFade: {
    duration: 0.1,  // 100ms
    easing: 'ease-out'
  }
};
```

**Usage in Components**:

```typescript
<style jsx>{`
  .morph-button {
    transition: width ${VoiceAnimationConstants.buttonMorph.duration}s ${VoiceAnimationConstants.buttonMorph.easing},
                height ${VoiceAnimationConstants.buttonMorph.duration}s ${VoiceAnimationConstants.buttonMorph.easing};
  }

  .button-layer {
    transition: opacity ${VoiceAnimationConstants.opacityFade.duration}s ${VoiceAnimationConstants.opacityFade.easing};
  }
`}</style>
```

---

### 7.2 Animation Sequences

**Button Morph + Text Entry** (Variation 1 & 2):

```
User taps RecordWave to stop
    ↓
[0ms] RecordWave button starts morphing → Processing button
    ↓
[150ms] RecordWave opacity: 1 → 0 (opacityFade)
        Processing opacity: 0 → 1 (opacityFade)
    ↓
[200ms] Button size change complete (buttonMorph)
    ↓
[~2000ms] Transcription API responds
    ↓
[2000ms] Processing button fades out (150ms)
    ↓
[2150ms] Text animation starts (word-by-word)
    ↓
[2150ms + 70ms per word] Words appear sequentially
    ↓
[Complete] All text visible
```

**Live Streaming Text Entry** (Variation 3):

```
User taps RecordWide
    ↓
[0ms] RecordWide morphs → StopRecord + Timer
    ↓
[200ms] Morph complete, live transcription starts
    ↓
[Ongoing] Words appear as WebSocket sends them
          Each word: 500ms fade-in animation
          Staggered: 70ms delay between words
    ↓
User taps StopRecord
    ↓
[0ms] StopRecord morphs → ProcessingDark (if needed)
      OR directly to VoiceDocker (if complete)
    ↓
[200ms] Morph complete
    ↓
[Final state] VoiceDocker visible (Copy + Delete)
```

---

### 7.3 Animation States Mapping

```typescript
// src/projects/voiceinterface/types/AnimationStates.ts
export interface AnimationState {
  button: {
    width: number;
    height: number;
    opacity: number;
    borderRadius: number;
  };
  text: {
    visible: boolean;
    animating: boolean;
  };
  navbar: {
    height: number;
    opacity: number;
  };
}

export function getAnimationState(
  appState: VoiceAppState,
  variation: VoiceVariation
): AnimationState {
  // Return animation properties for current state
  // Used for CSS transitions
}
```

---

## 8. Implementation Sequence

### 8.1 Phase 1: Foundation (Week 1)

**Goal**: Set up architecture without UI

**Tasks**:
1. ✅ Create type definitions
   - `VoiceInterfaceTypes.ts`
   - `AnimationStates.ts`

2. ✅ Create custom hooks
   - `useVoiceRecording.ts` (basic implementation)
   - `useVoiceTranscription.ts` (mock responses)

3. ✅ Create context provider
   - `VoiceInterfaceContext.tsx`
   - Wire up hooks
   - Implement state machine logic

4. ✅ Create API endpoints
   - `/api/voice-interface/transcribe` (POST - mock for now)
   - `/api/voice-interface/transcribe-stream` (WebSocket - mock)

**Validation**:
- Run `npm run dev`
- Context provider renders without errors
- State transitions work (log to console)
- Hooks return expected values

---

### 8.2 Phase 2: UI Components (Week 2)

**Goal**: Build UI components without animations

**Tasks**:
1. ✅ Create text display components
   - `VoiceTextStates.tsx` (all state variants)
   - Basic styling (no animations yet)

2. ✅ Create button components (static)
   - Use existing buttons from `voicebuttons.tsx`
   - Verify all buttons render correctly

3. ✅ Build variation containers (no morphing yet)
   - `VoiceTextBoxStandard.tsx`
   - `VoiceTextBoxCheckClose.tsx`
   - `VoiceTextWrapperLive.tsx`

4. ✅ Wire up context
   - Components consume context via `useVoiceInterface()`
   - Buttons call callbacks
   - State changes trigger re-renders

**Validation**:
- All three variations render
- Buttons clickable (state changes in console)
- Text displays correctly for each state
- No layout shifts or visual bugs

---

### 8.3 Phase 3: Button Morphing (Week 3)

**Goal**: Implement smooth button transitions

**Tasks**:
1. ✅ Create morphing components
   - `VoiceMorphingMainButton.tsx` (mic → recordWave → processing)
   - `VoiceMorphingCloseButton.tsx` (close button fade-in/out)
   - `VoiceMorphingCheckClose.tsx` (check/close icon swap)
   - `VoiceMorphingNavButton.tsx` (recordWave → stopRecord → processing)

2. ✅ Implement animation constants
   - `animationConstants.ts`
   - Apply timing hierarchy

3. ✅ Add transitions
   - Width/height morphing
   - Opacity crossfades
   - Test all state transitions

4. ✅ Polish interactions
   - Hover states
   - Active states
   - Disabled states

**Validation**:
- Button morphs are smooth (no jank)
- Timing feels natural
- No layout shifts during morphs
- Animations respect `prefers-reduced-motion`

---

### 8.4 Phase 4: Text Animation (Week 4)

**Goal**: Implement word-by-word text reveal

**Tasks**:
1. ✅ Create text animation component
   - `VoiceTextAnimation.tsx`
   - Word-by-word horizontal fade-in

2. ✅ Integrate with VoiceTextStates
   - Trigger animation on RESULTS state
   - Handle re-animations (key prop)

3. ✅ Add scrollable container
   - Custom scrollbar
   - Fade overlay at bottom
   - Auto-scroll to bottom as text appears

4. ✅ Test with long text
   - Multi-line wrapping
   - Scroll behavior
   - Animation performance

**Validation**:
- Text animates word-by-word
- Multi-line text wraps naturally
- Scrollbar appears when needed
- Fade overlay visible at bottom

---

### 8.5 Phase 5: Live Streaming (Week 5)

**Goal**: Implement Variation 3 live transcription

**Tasks**:
1. ✅ Implement WebSocket endpoint
   - `/api/voice-interface/transcribe-stream`
   - Stream audio chunks
   - Return incremental results

2. ✅ Update useVoiceTranscription hook
   - Implement `startStreamingTranscription()`
   - Handle WebSocket messages
   - Append text incrementally (fresh state pattern!)

3. ✅ Test live text updates
   - Words appear in real-time
   - Animation triggers for each new word
   - No duplicate text

4. ✅ Implement VoiceDocker
   - Copy button
   - Delete button
   - State transitions

**Validation**:
- Text streams in real-time as user speaks
- Animation smooth and continuous
- No text duplication
- Copy/delete buttons work

---

### 8.6 Phase 6: Polish & Mobile (Week 6)

**Goal**: Responsive design and final polish

**Tasks**:
1. ✅ Mobile responsiveness
   - Test all variations on mobile
   - Adjust dimensions for small screens
   - Touch interactions (not just mouse)

2. ✅ Error handling
   - Microphone permission denied
   - API failures
   - Network errors
   - Retry logic

3. ✅ Accessibility
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - `prefers-reduced-motion`

4. ✅ Performance optimization
   - Lazy load animations
   - Debounce volume updates
   - Optimize re-renders

**Validation**:
- Works on mobile Safari, Chrome, Firefox
- Error states display helpful messages
- Keyboard navigation works
- No console errors or warnings

---

## 9. File Structure

```
voiceinterface/
├── components/
│   ├── VoiceTextBoxStandard.tsx          # Variation 1 container
│   ├── VoiceTextBoxCheckClose.tsx        # Variation 2 container
│   ├── VoiceTextWrapperLive.tsx          # Variation 3 container
│   └── ui/
│       ├── VoiceTextStates.tsx           # Text display with state variants
│       ├── VoiceTextAnimation.tsx        # Word-by-word text animation
│       ├── VoiceMorphingMainButton.tsx   # Mic → RecordWave → Processing
│       ├── VoiceMorphingCloseButton.tsx  # Close button fade-in/out
│       ├── VoiceMorphingCheckClose.tsx   # Check/Close icon swap
│       ├── VoiceMorphingNavButton.tsx    # RecordWave → StopRecord → Processing
│       ├── VoiceDocker.tsx               # Copy + Delete buttons
│       └── voicebuttons.tsx              # (Existing) All button components
├── context/
│   └── VoiceInterfaceContext.tsx         # Global state provider
├── hooks/
│   ├── useVoiceRecording.ts              # Audio recording logic
│   └── useVoiceTranscription.ts          # Transcription logic
├── types/
│   ├── VoiceInterfaceTypes.ts            # Core type definitions
│   └── AnimationStates.ts                # Animation state types
├── utils/
│   └── animationConstants.ts             # Animation timing constants
├── styles/
│   └── voice.module.css                  # (Existing) Shared styles
└── voice-context/
    ├── V01_VOICE_INTERFACE_IMPLEMENTATION_COMPLETE.md  # (Existing) Button implementation
    └── V02_VOICE_INTERFACE_THREE_VARIATIONS_IMPLEMENTATION_PLAN.md  # (This document)
```

**API Routes**:
```
pages/
└── api/
    └── voice-interface/
        ├── transcribe.ts                 # POST endpoint (standard recording)
        └── transcribe-stream.ts          # WebSocket endpoint (live streaming)
```

**Pages**:
```
pages/
└── voice-interface/
    └── index.tsx                         # Main page (variation selector)
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Hooks**:
- `useVoiceRecording`: Test start/stop/reset logic
- `useVoiceTranscription`: Test API calls, retries, streaming

**Pure Functions**:
- `getVoiceStateConfig()`: Test all state/variation combinations
- Animation constants: Verify timing values

**Example**:
```typescript
// __tests__/VoiceInterfaceTypes.test.ts
import { getVoiceStateConfig, VoiceAppState, VoiceVariation } from '../types/VoiceInterfaceTypes';

describe('getVoiceStateConfig', () => {
  test('IDLE state - Variation 1 shows mic button', () => {
    const config = getVoiceStateConfig(VoiceAppState.IDLE, VoiceVariation.STANDARD);

    expect(config.showMicButton).toBe(true);
    expect(config.showRecordWaveButton).toBe(false);
    expect(config.canStartRecording).toBe(true);
  });

  test('LISTENING state - Variation 3 shows stopRecord button', () => {
    const config = getVoiceStateConfig(VoiceAppState.LISTENING, VoiceVariation.LIVE_STREAMING);

    expect(config.showStopRecordButton).toBe(true);
    expect(config.showRecordWaveButton).toBe(false);
    expect(config.canStopRecording).toBe(true);
  });
});
```

---

### 10.2 Integration Tests

**State Transitions**:
- User clicks mic → state changes to LISTENING
- User stops recording → state changes to PROCESSING
- Transcription complete → state changes to RESULTS

**Context Integration**:
- Provider wraps components correctly
- State updates propagate to all consumers
- Callbacks trigger expected actions

**Example**:
```typescript
// __tests__/VoiceInterfaceContext.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceInterfaceProvider, useVoiceInterface } from '../context/VoiceInterfaceContext';

const TestComponent = () => {
  const { appState, startRecording, stopRecording } = useVoiceInterface();

  return (
    <div>
      <div data-testid="app-state">{appState}</div>
      <button onClick={startRecording}>Start</button>
      <button onClick={stopRecording}>Stop</button>
    </div>
  );
};

test('state transitions from IDLE → LISTENING → PROCESSING', async () => {
  render(
    <VoiceInterfaceProvider>
      <TestComponent />
    </VoiceInterfaceProvider>
  );

  expect(screen.getByTestId('app-state')).toHaveTextContent('idle');

  fireEvent.click(screen.getByText('Start'));
  await waitFor(() => {
    expect(screen.getByTestId('app-state')).toHaveTextContent('listening');
  });

  fireEvent.click(screen.getByText('Stop'));
  await waitFor(() => {
    expect(screen.getByTestId('app-state')).toHaveTextContent('processing');
  });
});
```

---

### 10.3 Visual Regression Tests

**Animations**:
- Button morphs smoothly (no jank)
- Text animates word-by-word
- No layout shifts during transitions

**Responsive Design**:
- All variations render correctly on mobile
- Touch targets are large enough
- Text wraps properly

**Tools**:
- Storybook for component isolation
- Chromatic for visual regression
- Manual testing on devices

---

### 10.4 Manual Testing Checklist

**Variation 1: TextBox Standard**
- [ ] Mic button visible in IDLE state
- [ ] Clicking mic starts recording (state → LISTENING)
- [ ] RecordWave + Timer + Close button visible during recording
- [ ] Clicking RecordWave stops recording (state → PROCESSING)
- [ ] Processing button shows animated dots
- [ ] Text appears with word-by-word animation (state → RESULTS)
- [ ] Clicking Close button clears transcription (state → IDLE)

**Variation 2: TextBox Check & Close**
- [ ] Mic button (outlined) visible in IDLE state
- [ ] Clicking mic starts recording (state → LISTENING)
- [ ] RecordWave + Timer + CheckAndClose button visible during recording
- [ ] Clicking Check mark stops recording (state → PROCESSING)
- [ ] Processing button (outlined) shows animated dots
- [ ] Text appears with word-by-word animation (state → RESULTS)
- [ ] CheckAndClose button allows cancel during recording

**Variation 3: TextWrapper Live Streaming**
- [ ] RecordWide button visible below TextBox in IDLE state
- [ ] Clicking RecordWide starts recording + streaming (state → LISTENING)
- [ ] StopRecord button + Timer visible during recording
- [ ] Text appears word-by-word in real-time as user speaks
- [ ] Clicking StopRecord stops recording (state → PROCESSING or RESULTS)
- [ ] VoiceDocker appears with Copy + Delete buttons (state → RESULTS)
- [ ] Copy button copies transcription to clipboard
- [ ] Delete button clears transcription (state → IDLE)

**Cross-Variation Tests**
- [ ] All buttons morph smoothly (no jank)
- [ ] Text animation smooth and natural
- [ ] Scrollbar appears when text overflows
- [ ] Fade overlay visible at bottom of text area
- [ ] No layout shifts during state transitions
- [ ] Microphone permission prompt appears on first use
- [ ] Error messages display when API fails
- [ ] Works on mobile Safari, Chrome, Firefox
- [ ] Touch interactions work (not just mouse)
- [ ] Keyboard navigation works (Tab, Enter, Esc)

---

## 11. Next Steps

### Immediate Actions

1. **Review this plan** with team/stakeholders
2. **Set up development environment**
   - Install dependencies
   - Configure TypeScript
   - Set up testing framework

3. **Begin Phase 1** (Foundation)
   - Create type definitions
   - Implement hooks
   - Build context provider

### Questions to Resolve

1. **Transcription API**: Which service? (DeepGram, Whisper, Google Speech-to-Text?)
2. **WebSocket Infrastructure**: Do we have existing WebSocket support or need to add it?
3. **Mobile Testing**: Which devices/browsers are priority targets?
4. **Accessibility Requirements**: WCAG 2.1 Level AA compliance needed?
5. **Analytics**: Track usage metrics (recordings, transcriptions, errors)?

### Future Enhancements (Post-MVP)

- **Multi-language support**: Detect language, transcribe accordingly
- **Voice commands**: "Copy", "Clear", "Retry" via voice
- **Audio playback**: Replay recorded audio
- **Transcription editing**: Allow manual corrections
- **Export options**: Download as TXT, PDF, etc.
- **Themes**: Light/dark mode toggle

---

## Appendix A: Key Patterns Summary

| Pattern | Source | Application |
|---------|--------|-------------|
| **Scrollable Text Box with Fade** | AI Confidence Tracker | All text display areas |
| **State-Based Rendering** | AI Confidence Tracker | `VoiceTextStates.tsx` |
| **Custom Scrollbar** | AI Confidence Tracker | Overflow handling |
| **Separation of Concerns** | ClipStream | Hooks vs UI components |
| **Single Source of Truth** | ClipStream | `VoiceAppState` enum |
| **Computed Properties** | ClipStream | `getVoiceStateConfig()` |
| **Fresh State Pattern** | ClipStream | WebSocket message handlers |
| **Fixed Container Morphing** | ClipStream | All morphing buttons |
| **Animation Timing Hierarchy** | ClipStream | `animationConstants.ts` |
| **Word-by-Word Animation** | Deep Library | `VoiceTextAnimation.tsx` |
| **Horizontal Fade-In** | Deep Library | Text reveal animation |

---

## Appendix B: Color Variables Reference

**From voice.module.css** (already defined):
```css
--VoiceDarkGrey: #262424;
--VoiceWhite: #FFFFFF;
--VoiceRed: #EF4444;
--VoiceDarkGrey_95: rgba(38, 36, 36, 0.95);
--VoiceDarkGrey_90: rgba(38, 36, 36, 0.9);
--VoiceDarkGrey_80: rgba(38, 36, 36, 0.8);
--VoiceDarkGrey_30: rgba(38, 36, 36, 0.3);
--VoiceDarkGrey_20: rgba(38, 36, 36, 0.2);
--VoiceDarkGrey_15: rgba(38, 36, 36, 0.15);
--VoiceDarkGrey_5: rgba(38, 36, 36, 0.05);
--VoiceTextGrey_50: rgba(94, 94, 94, 0.5);
```

**To be added to voice.module.css**:
```css
--VoiceBoxBg: #F7F6F4;
--VoiceBoxOutline: #F2F2F2;
--VoiceNavBg: #EEEDEB;
--VoiceShadow: rgba(0, 0, 0, 0.06);
```

---

## Appendix C: Typography Classes Reference

**From voice.module.css** (use these throughout):
- `.OpenRundeMedium20` - Main headings
- `.OpenRundeMedium18` - Large buttons
- `.OpenRundeMedium16` - Body text, placeholders
- `.OpenRundeMedium14` - Helper text
- `.OpenRundeMedium12` - Small labels

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| V02 | 2026-01-14 | Claude | Initial implementation plan created |

---

**End of Implementation Plan**
