# AI Confidence Tracker - DeepGram API Integration & Recording Flow

## Executive Summary

The AI Confidence Tracker implements a complete audio recording-to-transcription pipeline using DeepGram's speech-to-text API. The system captures audio from the user's microphone, processes it through a Next.js API route, sends it to DeepGram for transcription with word-level confidence scores, and returns structured data for visualization.

---

## Architecture Overview

### High-Level Flow

```
[User Browser] → [MediaRecorder API] → [Audio Blob] → 
[FormData Upload] → [Next.js API Route] → [DeepGram API] → 
[Transcription Result] → [UI Visualization]
```

### Key Components

1. **Frontend Recording Module** (`hooks/SpeechConfidenceHooks.ts`)
2. **API Route Handler** (`pages/api/ai-confidence-tracker/transcribe.ts`)
3. **DeepGram Integration** (`api/DeepgramApi.ts`)
4. **Type Definitions** (`types/SpeechConfidenceTypes.ts`)

---

## Part 1: Audio Recording (Frontend)

### Location
`/Users/ethan/Documents/projects/final-exp/src/projects/ai-confidence-tracker/hooks/SpeechConfidenceHooks.ts`

### Function: `useAudioRecording()`

This custom React hook manages the entire browser-side audio capture process.

#### Key Features:
- Requests microphone permissions
- Handles browser compatibility (multiple MIME types)
- Captures audio in chunks
- Combines chunks into a single Blob
- Provides error handling for common issues

#### Detailed Flow:

**Step 1: Initialize Recording**
```typescript
const startRecording = useCallback(async () => {
  // Request microphone access
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });
  
  // Create MediaRecorder with optimal settings
  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
```

**Step 2: Collect Audio Chunks**
```typescript
  // Store chunks as they're captured
  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  };
  
  // Start recording with 1-second chunks
  mediaRecorder.start(1000);
```

**Step 3: Finalize Audio Blob**
```typescript
  mediaRecorder.onstop = () => {
    // Combine all chunks into single Blob
    const audioBlob = new Blob(
      audioChunksRef.current, 
      { type: mediaRecorder.mimeType || 'audio/webm' }
    );
    
    // Store for processing
    setAudioData(audioBlob);
  };
```

#### Return Values:
- `isRecording`: Boolean state
- `audioData`: Blob containing recorded audio
- `error`: String error message (if any)
- `startRecording()`: Function to begin capture
- `stopRecording()`: Function to finalize recording
- `resetRecording()`: Function to clear state

---

## Part 2: Audio Processing Hook (Frontend)

### Function: `useDeepgramProcessing()`

This hook manages the communication between the frontend and the backend API.

#### Detailed Flow:

**Step 1: Prepare Audio for Upload**
```typescript
const processAudio = useCallback(async (audioBlob: Blob) => {
  // Validate audio data
  if (!audioBlob || audioBlob.size === 0) {
    setError('The recorded audio is empty');
    return;
  }
  
  // Create FormData for multipart upload
  const formData = new FormData();
  const fileName = `recording-${Date.now()}.${audioBlob.type.split('/')[1] || 'webm'}`;
  
  // Convert Blob to File object
  const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });
  formData.append('audio', audioFile, fileName);
```

**Step 2: Send to API Route**
```typescript
  // POST to Next.js API route
  const response = await fetch('/api/ai-confidence-tracker/transcribe', {
    method: 'POST',
    body: formData  // No Content-Type header - browser sets it automatically
  });
  
  const data = await response.json();
```

**Step 3: Validate Response**
```typescript
  // Check response structure
  if (!data.hasOwnProperty('transcript') || !Array.isArray(data.words)) {
    throw new Error('Invalid response format');
  }
  
  // Check for empty transcription
  if (data.transcript === '' && data.words.length === 0) {
    throw new Error('No speech detected in recording');
  }
  
  // Store successful result
  setResult(data);
```

#### Return Values:
- `isProcessing`: Boolean processing state
- `result`: TranscriptionResult object with transcript and confidence data
- `error`: String error message (if any)
- `processAudio(blob)`: Function to send audio for transcription
- `resetProcessing()`: Function to clear state

---

## Part 3: Next.js API Route (Backend)

### Location
`/Users/ethan/Documents/projects/final-exp/src/pages/api/ai-confidence-tracker/transcribe.ts`

### Purpose
This serverless function acts as a secure proxy between the frontend and DeepGram API, protecting the API key and handling file processing.

#### Configuration

**Disable Default Body Parser**
```typescript
export const config = {
  api: {
    bodyParser: false,  // Required for multipart form data
  },
};
```

#### Detailed Flow:

**Step 1: Parse Uploaded File**
```typescript
const parseForm = async (req: NextApiRequest): Promise<{
  fields: Fields;
  files: Files;
}> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};
```

**Step 2: Extract and Validate File**
```typescript
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Get API key from environment
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  // Parse incoming form data
  const { files } = await parseForm(req);
  
  // Handle formidable v3+ array format
  const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
  
  // Get file path and MIME type
  const filePath = audioFile.filepath || audioFile.path;
  const mimeType = audioFile.mimetype || audioFile.type || 'audio/wav';
```

**Step 3: Read File to Buffer**
```typescript
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'File not found' });
  }
  
  // Read file into memory
  const audioData = fs.readFileSync(filePath);
  
  // Validate audio data
  if (!audioData || audioData.length === 0) {
    fs.unlinkSync(filePath);  // Clean up
    return res.status(400).json({ error: 'Empty audio file' });
  }
```

**Step 4: Send to DeepGram API**
```typescript
  // Call DeepGram integration function
  const result = await processAudioWithDeepgram(
    audioData,   // Buffer
    mimeType,    // Content-Type for DeepGram
    apiKey       // Authorization token
  );
  
  // Clean up temporary file
  fs.unlinkSync(filePath);
  
  // Return processed result
  return res.status(200).json(result);
```

#### Error Handling
The API route provides detailed error messages for:
- Missing/invalid API key
- No audio file in upload
- File system errors
- Empty audio data
- DeepGram API errors
- Network timeouts

---

## Part 4: DeepGram API Integration

### Location
`/Users/ethan/Documents/projects/final-exp/src/projects/ai-confidence-tracker/api/DeepgramApi.ts`

### Function: `processAudioWithDeepgram()`

This is the core integration point with DeepGram's API.

#### Current Implementation

```typescript
export async function processAudioWithDeepgram(
  audioBuffer: Buffer, 
  mimeType: string,
  apiKey: string
): Promise<TranscriptionResult> {
  
  // API endpoint
  const url = 'https://api.deepgram.com/v1/listen';
  
  // Configure request
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': mimeType
    },
    body: audioBuffer
  };
  
  // Send request
  const response = await fetch(url, options);
  
  // Parse response
  const data = await response.json();
  
  // Process and return
  return processDeepgramResponse(data as DeepgramResponse);
}
```

#### ⚠️ Critical Issue: Missing Parameters

**The current implementation does NOT include required query parameters.**

According to the documentation and DeepGram best practices, the URL should be:

```typescript
const url = 'https://api.deepgram.com/v1/listen?model=nova-3&word_confidence=true&language=en-US&punctuate=true&version=latest';
```

**Without `word_confidence=true`, the API will not return per-word confidence scores**, which is the entire purpose of the AI Confidence Tracker.

#### Recommended Implementation

```typescript
export async function processAudioWithDeepgram(
  audioBuffer: Buffer, 
  mimeType: string,
  apiKey: string
): Promise<TranscriptionResult> {
  
  // Build URL with parameters
  const params = new URLSearchParams({
    model: 'nova-3',              // Latest model (Feb 2025)
    word_confidence: 'true',      // Enable per-word confidence
    language: 'en-US',            // Language model
    punctuate: 'true',            // Add punctuation
    version: 'latest',            // Always use latest version
    alternatives: '1',            // Only need top result
  });
  
  const url = `https://api.deepgram.com/v1/listen?${params.toString()}`;
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': mimeType
    },
    body: audioBuffer
  };
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepgram API error (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  return processDeepgramResponse(data as DeepgramResponse);
}
```

---

## Part 5: Response Processing

### Function: `processDeepgramResponse()`

Transforms DeepGram's raw response into the application's data structure.

#### DeepGram Response Structure

```json
{
  "results": {
    "channels": [{
      "alternatives": [{
        "transcript": "the quick brown fox jumped over the lazy dog",
        "confidence": 0.92,
        "words": [
          {
            "word": "the",
            "start": 0.01,
            "end": 0.15,
            "confidence": 0.99
          },
          {
            "word": "quick",
            "start": 0.16,
            "end": 0.45,
            "confidence": 0.87
          }
          // ... more words
        ]
      }]
    }]
  }
}
```

#### Processing Logic

```typescript
export function processDeepgramResponse(response: DeepgramResponse): TranscriptionResult {
  // Extract primary alternative
  const alternative = response.results.channels[0].alternatives[0];
  const transcript = alternative.transcript || '';
  const words = alternative.words || [];

  // Categorize each word's confidence
  const processedWords = words.map(word => {
    const category = categorizeConfidence(word.confidence);
    return {
      word: word.word,
      confidence: word.confidence,
      category  // 'high', 'medium', or 'low'
    };
  });

  // Extract low confidence words (< 70%)
  const lowConfidenceWords = words
    .filter(word => word.confidence < 0.7)
    .map(word => ({
      word: word.word,
      confidence: word.confidence
    }))
    .sort((a, b) => a.confidence - b.confidence);

  return {
    transcript,
    words: processedWords,
    lowConfidenceWords
  };
}
```

#### Confidence Categorization

```typescript
const CONFIDENCE_THRESHOLDS = {
  high: 0.9,    // 90%
  medium: 0.7   // 70%
};

export function categorizeConfidence(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.9) return 'high';      // Green
  else if (score >= 0.7) return 'medium';  // Orange
  else return 'low';                    // Red
}
```

---

## Part 6: State Management Flow

### Orchestration: `useSpeechConfidenceState()`

This hook combines recording and processing into a unified application state machine.

#### State Enum

```typescript
enum AppState {
  INITIAL,      // Ready to record
  RECORDING,    // Currently recording
  PROCESSING,   // Sending to API
  RESULTS,      // Showing transcription
  ERROR         // Error occurred
}
```

#### State Transition Logic

```typescript
export function useSpeechConfidenceState() {
  const [appState, setAppState] = useState(AppState.INITIAL);
  
  // Get recording hooks
  const { isRecording, audioData, error: recordingError, ... } = useAudioRecording();
  
  // Get processing hooks
  const { isProcessing, result, error: processingError, processAudio } = useDeepgramProcessing();
  
  // Update app state based on sub-states
  useEffect(() => {
    if (recordingError || processingError) {
      setAppState(AppState.ERROR);
    } else if (isRecording) {
      setAppState(AppState.RECORDING);
    } else if (isProcessing) {
      setAppState(AppState.PROCESSING);
    } else if (result) {
      setAppState(AppState.RESULTS);
    }
  }, [isRecording, isProcessing, result, recordingError, processingError]);
  
  // Auto-process when recording completes
  useEffect(() => {
    if (audioData && !isRecording && appState !== AppState.ERROR) {
      processAudio(audioData);
    }
  }, [audioData, isRecording]);
  
  return {
    appState,
    transcriptionResult: result,
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    resetState
  };
}
```

---

## Part 7: Type Definitions

### Location
`/Users/ethan/Documents/projects/final-exp/src/projects/ai-confidence-tracker/types/SpeechConfidenceTypes.ts`

#### Core Types

```typescript
// Application state
export enum AppState {
  INITIAL = 'initial',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  RESULTS = 'results',
  ERROR = 'error'
}

// Error state
export interface ErrorState {
  message: string;
  code: string;
  retry: boolean;
}

// DeepGram word with confidence
export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// DeepGram API response structure
export interface DeepgramResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: DeepgramWord[];
      }>;
    }>;
  };
}

// Processed transcription result
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
```

---

## Part 8: Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ USER INTERFACE                                                  │
│                                                                 │
│  [Start Recording Button] ──────────────────────────┐           │
│                                                      ↓           │
│                                              startRecording()   │
└─────────────────────────────────────────────────────┬───────────┘
                                                       ↓
┌─────────────────────────────────────────────────────┴───────────┐
│ BROWSER AUDIO CAPTURE                                           │
│                                                                 │
│  navigator.mediaDevices.getUserMedia()                         │
│           ↓                                                     │
│  MediaRecorder (audio/webm)                                    │
│           ↓                                                     │
│  Collect chunks (1-second intervals)                           │
│           ↓                                                     │
│  Combine into Blob on stop                                     │
│           ↓                                                     │
│  setAudioData(blob)                                            │
└─────────────────────────────────────────────────────┬───────────┘
                                                       ↓
┌─────────────────────────────────────────────────────┴───────────┐
│ FRONTEND PROCESSING HOOK                                        │
│                                                                 │
│  useEffect: audioData changed                                  │
│           ↓                                                     │
│  processAudio(audioBlob)                                       │
│           ↓                                                     │
│  Create FormData                                               │
│  formData.append('audio', audioFile)                           │
│           ↓                                                     │
│  fetch('/api/ai-confidence-tracker/transcribe', {              │
│    method: 'POST',                                             │
│    body: formData                                              │
│  })                                                            │
└─────────────────────────────────────────────────────┬───────────┘
                                                       ↓
                                              [Network Request]
                                                       ↓
┌─────────────────────────────────────────────────────┴───────────┐
│ NEXT.JS API ROUTE (Server-Side)                                │
│                                                                 │
│  /api/ai-confidence-tracker/transcribe                         │
│           ↓                                                     │
│  formidable.parse(req)                                         │
│           ↓                                                     │
│  Extract audio file from files.audio                           │
│           ↓                                                     │
│  fs.readFileSync(filePath) → Buffer                            │
│           ↓                                                     │
│  processAudioWithDeepgram(buffer, mimeType, apiKey)            │
└─────────────────────────────────────────────────────┬───────────┘
                                                       ↓
┌─────────────────────────────────────────────────────┴───────────┐
│ DEEPGRAM API INTEGRATION                                        │
│                                                                 │
│  Build URL with parameters:                                    │
│  https://api.deepgram.com/v1/listen                            │
│    ?model=nova-3                                               │
│    &word_confidence=true                                       │
│    &language=en-US                                             │
│    &punctuate=true                                             │
│           ↓                                                     │
│  fetch(url, {                                                  │
│    method: 'POST',                                             │
│    headers: {                                                  │
│      'Authorization': `Token ${apiKey}`,                       │
│      'Content-Type': mimeType                                  │
│    },                                                          │
│    body: audioBuffer                                           │
│  })                                                            │
└─────────────────────────────────────────────────────┬───────────┘
                                                       ↓
                                         [External API Call]
                                                       ↓
┌─────────────────────────────────────────────────────┴───────────┐
│ DEEPGRAM API (External Service)                                │
│                                                                 │
│  Receive audio buffer                                          │
│           ↓                                                     │
│  Process with Nova-3 model                                     │
│           ↓                                                     │
│  Generate transcript with word-level confidence                │
│           ↓                                                     │
│  Return JSON response:                                         │
│  {                                                             │
│    results: {                                                  │
│      channels: [{                                              │
│        alternatives: [{                                        │
│          transcript: "...",                                    │
│          words: [                                              │
│            { word: "the", confidence: 0.99, ... },             │
│            { word: "quick", confidence: 0.87, ... }            │
│          ]                                                     │
│        }]                                                      │
│      }]                                                        │
│    }                                                           │
│  }                                                             │
└─────────────────────────────────────────────────────┬───────────┘
                                                       ↓
                                         [JSON Response]
                                                       ↓
┌─────────────────────────────────────────────────────┴───────────┐
│ RESPONSE PROCESSING                                             │
│                                                                 │
│  processDeepgramResponse(data)                                 │
│           ↓                                                     │
│  Extract transcript and words                                  │
│           ↓                                                     │
│  Categorize each word (high/medium/low)                        │
│           ↓                                                     │
│  Filter lowConfidenceWords (< 70%)                             │
│           ↓                                                     │
│  Return TranscriptionResult:                                   │
│  {                                                             │
│    transcript: "the quick brown fox...",                       │
│    words: [                                                    │
│      { word: "the", confidence: 0.99, category: "high" },      │
│      { word: "quick", confidence: 0.87, category: "medium" }   │
│    ],                                                          │
│    lowConfidenceWords: [...]                                   │
│  }                                                             │
└─────────────────────────────────────────────────────┬───────────┘
                                                       ↓
                                         [Response travels back]
                                                       ↓
┌─────────────────────────────────────────────────────┴───────────┐
│ NEXT.JS API ROUTE                                               │
│                                                                 │
│  Clean up temporary file                                       │
│           ↓                                                     │
│  res.status(200).json(result)                                  │
└─────────────────────────────────────────────────────┬───────────┘
                                                       ↓
                                              [HTTP Response]
                                                       ↓
┌─────────────────────────────────────────────────────┴───────────┐
│ FRONTEND PROCESSING HOOK                                        │
│                                                                 │
│  const data = await response.json()                            │
│           ↓                                                     │
│  Validate response structure                                   │
│           ↓                                                     │
│  setResult(data)                                               │
└─────────────────────────────────────────────────────┬───────────┘
                                                       ↓
┌─────────────────────────────────────────────────────┴───────────┐
│ STATE MANAGEMENT                                                │
│                                                                 │
│  useEffect: result changed                                     │
│           ↓                                                     │
│  setAppState(AppState.RESULTS)                                 │
└─────────────────────────────────────────────────────┬───────────┘
                                                       ↓
┌─────────────────────────────────────────────────────┴───────────┐
│ UI RENDERING                                                    │
│                                                                 │
│  ConfidenceVisualizer component                                │
│           ↓                                                     │
│  Render transcript with color-coded confidence:                │
│  - High (≥90%): Green / No highlight                           │
│  - Medium (70-89%): Orange highlight                           │
│  - Low (<70%): Red highlight                                   │
│           ↓                                                     │
│  Display low confidence word chips                             │
│  [word₁ 45%] [word₂ 62%] [word₃ 68%]                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 9: Key Integration Points for Reuse

If you want to integrate this recording + transcription capability into another module, here are the essential pieces:

### 1. **Recording Hook** (Copy As-Is)
```typescript
// From: hooks/SpeechConfidenceHooks.ts
useAudioRecording()
```
Returns: `{ isRecording, audioData, startRecording, stopRecording, resetRecording }`

### 2. **API Route** (Adapt for Your Module)
```typescript
// Create: /pages/api/[your-module]/transcribe.ts
// Same logic as ai-confidence-tracker/transcribe.ts
```
Receives audio upload → Sends to DeepGram → Returns transcript

### 3. **DeepGram Integration** (Copy and Fix)
```typescript
// From: api/DeepgramApi.ts
// BUT ADD THE MISSING PARAMETERS!
const url = 'https://api.deepgram.com/v1/listen?model=nova-3&word_confidence=true&language=en-US&punctuate=true';
```

### 4. **Environment Variable**
```bash
# .env.local
DEEPGRAM_API_KEY=your_actual_api_key_here
```

### 5. **Minimal Integration Example**
```typescript
// In your component
import { useAudioRecording } from '@/hooks/SpeechConfidenceHooks';

function YourComponent() {
  const { isRecording, audioData, startRecording, stopRecording } = useAudioRecording();
  const [transcript, setTranscript] = useState('');
  
  useEffect(() => {
    if (audioData) {
      // Upload to your API route
      const formData = new FormData();
      formData.append('audio', audioData);
      
      fetch('/api/your-module/transcribe', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => setTranscript(data.transcript));
    }
  }, [audioData]);
  
  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <p>Transcript: {transcript}</p>
    </div>
  );
}
```

---

## Part 10: Dependencies Required

### Package.json
```json
{
  "dependencies": {
    "@deepgram/sdk": "^2.4.0",  // Optional (not used in current impl)
    "formidable": "^3.5.4"       // Required for file uploads
  },
  "devDependencies": {
    "@types/formidable": "^3.4.5"
  }
}
```

### Browser APIs
- `navigator.mediaDevices.getUserMedia()` - Audio recording
- `MediaRecorder` - Audio capture
- `Blob` / `File` - Audio data handling
- `FormData` - File uploads
- `fetch()` - HTTP requests

---

## Part 11: Error Handling Checklist

### Frontend Errors
- ✅ Microphone permission denied
- ✅ No microphone detected
- ✅ Browser doesn't support MediaRecorder
- ✅ Recording failed / no audio captured
- ✅ Empty audio blob
- ✅ Network error during upload

### Backend Errors
- ✅ Missing API key
- ✅ No audio file in upload
- ✅ File size exceeds limit (10MB)
- ✅ Empty audio file
- ✅ File path not found
- ✅ DeepGram API error
- ✅ Network timeout

### API Response Errors
- ✅ Invalid response structure
- ✅ Missing transcript/words
- ✅ No speech detected
- ✅ Malformed JSON

---

## Part 12: Performance Considerations

### Audio File Sizes
- **Audio Format**: WebM (browser default)
- **Typical Size**: ~100-200 KB per 10 seconds
- **Max Upload**: 10 MB (configurable in formidable)
- **Processing Time**: ~1-3 seconds for 10-second audio

### Optimization Tips
1. **Chunked Recording**: Use 1-second chunks to prevent memory issues
2. **File Cleanup**: Always delete temporary files after processing
3. **Stream Processing**: Consider streaming for long recordings (not implemented)
4. **Compression**: WebM is already compressed; don't re-encode

---

## Part 13: Security Considerations

### API Key Protection
- ✅ API key stored in `.env.local` (server-side only)
- ✅ Never exposed to client-side code
- ✅ API route acts as secure proxy

### File Upload Security
- ✅ File size limits enforced (10MB)
- ✅ MIME type validation
- ✅ Temporary files cleaned up immediately
- ✅ No persistent storage of audio

### CORS & Headers
- ✅ API routes automatically handle CORS in Next.js
- ✅ No credentials sent to DeepGram (only API key)

---

## Part 14: Current Issues & Fixes Needed

### ⚠️ CRITICAL: Missing DeepGram Parameters

**Problem**: The current implementation does NOT send model or feature parameters to DeepGram.

**Current Code**:
```typescript
const url = 'https://api.deepgram.com/v1/listen';
```

**Should Be**:
```typescript
const url = 'https://api.deepgram.com/v1/listen?model=nova-3&word_confidence=true&language=en-US&punctuate=true&version=latest';
```

**Impact**: 
- Using default/older model (possibly not Nova)
- **May not receive word-level confidence scores** (defeats entire purpose)
- Missing punctuation in transcripts
- Not using latest model improvements

**Fix Location**: `/api/DeepgramApi.ts`, line 27

---

## Part 15: Testing the Flow

### Manual Test Steps

1. **Open Application**
   - Navigate to `/ai-confidence-tracker`
   - Check console for any initialization errors

2. **Test Microphone Permission**
   - Click "Start Recording"
   - Browser should request permission
   - Grant permission
   - State should change to RECORDING

3. **Record Audio**
   - Speak into microphone
   - Visual indicator should show recording
   - Click "Stop Recording"
   - State should change to PROCESSING

4. **Verify API Call**
   - Open Network tab in DevTools
   - Look for POST to `/api/ai-confidence-tracker/transcribe`
   - Check request payload (should contain audio file)
   - Check response (should contain transcript and words array)

5. **Verify DeepGram Call**
   - Check server console logs
   - Should see: "Processing audio file: [path], size: [bytes], type: [mime]"
   - Should NOT see any DeepGram API errors

6. **Verify Results**
   - Transcript should appear with confidence highlighting
   - Low confidence words should be listed separately
   - Colors: Green (high), Orange (medium), Red (low)

### Debug Checklist

- [ ] Check `.env.local` has valid `DEEPGRAM_API_KEY`
- [ ] Check browser supports MediaRecorder
- [ ] Check microphone is connected and working
- [ ] Check Network tab for failed requests
- [ ] Check server logs for API errors
- [ ] Check DeepGram dashboard for API usage
- [ ] Verify response structure matches TypeScript types

---

## Conclusion

The AI Confidence Tracker implements a robust, production-ready audio recording and transcription pipeline. The architecture is modular and can be easily adapted for other projects requiring speech-to-text functionality.

**Key Strengths**:
- Clean separation of concerns (hooks, API, integration)
- Comprehensive error handling
- Type-safe TypeScript implementation
- Secure API key management
- Browser compatibility handling

**Key Weakness**:
- ⚠️ **Missing DeepGram API parameters** (must fix to enable word confidence)

**Recommended Action**:
Update `DeepgramApi.ts` to include proper model and feature parameters in the API URL.

