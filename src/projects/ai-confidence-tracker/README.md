# AI Confidence Tracker

A Speech Confidence Visualizer that demonstrates AI speech recognition confidence at the word level using DeepGram's API. This project is part of a monorepo structure.

## Overview

The AI Confidence Tracker provides a web interface where users can:

1. Select from a series of reference sentences to read aloud
2. Record their voice using the browser's native audio recording capabilities
3. Process the recording through DeepGram's speech recognition API
4. Visualize the confidence levels for each transcribed word with color-coded highlighting
5. Identify words with low confidence scores to improve speech recognition accuracy

## Project Structure

This project follows a domain-focused folder structure within a monorepo. The complete path to the project root is:
```
/Users/ethan/Documents/projects/final-exp/src/projects/ai-confidence-tracker/
```

Current structure:
```
ai-confidence-tracker/
├── api/
│   └── DeepgramApi.ts       # DeepGram API integration and processing logic
├── components/
│   └── SpeechConfidenceComponents.tsx  # All UI components
├── hooks/
│   └── SpeechConfidenceHooks.ts        # Custom React hooks and context
├── styles/
│   └── confidence.module.css           # CSS styling with modules
├── types/
│   ├── SpeechConfidenceTypes.ts        # TypeScript type definitions
│   └── css.d.ts                        # CSS module type declarations
├── index.ts                            # Main exports
└── README.md                           # Documentation (this file)
```

The application entry point is located at:
```
/Users/ethan/Documents/projects/final-exp/src/pages/ai-confidence-tracker/index.tsx
```

API handler for DeepGram integration:
```
/Users/ethan/Documents/projects/final-exp/src/pages/api/ai-confidence-tracker/transcribe.ts
```

## Technical Details

### File Responsibilities

#### 1. API Integration (`/api/DeepgramApi.ts`)
- Provides the `processAudioWithDeepgram` function for sending audio to DeepGram's API
- Handles API request configuration, authentication, and error handling
- Processes and transforms DeepGram's raw response into a standardized format with confidence categories
- Contains the confidence score categorization logic (high, medium, low thresholds)

#### 2. Components (`/components/SpeechConfidenceComponents.tsx`)
- `ReferenceSentence`: Displays the reference text and provides navigation between sentences
- `RecordingControls`: Manages the recording UI, start/stop functionality, and recording state
- `ConfidenceVisualizer`: Renders the color-coded transcription with confidence highlighting
- `ErrorDisplay`: Handles various error states with appropriate guidance for users
- `SpeechConfidenceVisualizer`: Main component that orchestrates the application flow and state transitions

#### 3. Hooks (`/hooks/SpeechConfidenceHooks.ts`)
- `useReferenceSentences`: Manages the predefined sentences and navigation between them
- `useAudioRecording`: Handles browser's MediaRecorder API for audio capture
- `useDeepgramProcessing`: Controls the lifecycle of audio processing and API communication
- `useSpeechConfidenceState`: Combines recording and processing state for a unified app state
- `SpeechConfidenceProvider`: Context provider that shares state across components
- `useSpeechConfidence`: Custom hook for consuming the context values

#### 4. Types (`/types/SpeechConfidenceTypes.ts`)
- Defines the application state enum and interfaces
- Contains DeepGram API response types
- Defines component prop types for all UI components
- Provides shared interfaces for transcription results

#### 5. Entry Point (`/pages/ai-confidence-tracker/index.tsx`)
- Sets up the context provider
- Renders the main component
- Configures the page layout and font settings

#### 6. API Route (`/pages/api/ai-confidence-tracker/transcribe.ts`)
- Securely handles file uploads through formidable
- Validates and processes the uploaded audio file
- Communicates with DeepGram API while protecting API keys
- Returns structured transcription data to the client
- Handles errors and provides descriptive error messages

### Application Flow

1. **Initialization**:
   - The application loads with the `SpeechConfidenceProvider` initializing the context
   - Initial state shows the first reference sentence and recording controls

2. **Recording Process**:
   - User clicks "Start Recording" triggering `startRecording()` from `useAudioRecording`
   - Browser's MediaRecorder API captures audio through the microphone
   - UI shows recording in progress with animation and stop button
   - User stops recording, triggering `stopRecording()` which finalizes the audio blob

3. **Processing Stage**:
   - Audio blob is automatically sent to the Next.js API route (`/api/ai-confidence-tracker/transcribe`)
   - UI shows processing indicator
   - API route reads the file, validates it, and forwards to DeepGram API
   - DeepGram processes the audio and returns transcription with confidence scores

4. **Results Display**:
   - Transcription is received and processed through `processDeepgramResponse`
   - Words are categorized based on confidence thresholds
   - `ConfidenceVisualizer` renders the results with color-coded confidence levels
   - Low confidence words are highlighted separately for attention

5. **User Interaction**:
   - User can try recording again or navigate to the next reference sentence
   - The state is reset, and the cycle can repeat

### State Management Architecture

The application uses React's Context API for state management:

- `SpeechConfidenceContext` holds the complete application state
- `SpeechConfidenceProvider` combines multiple hook states into a unified context
- Child components consume the context using `useSpeechConfidence` hook
- State transitions are managed through the `AppState` enum: INITIAL → RECORDING → PROCESSING → RESULTS (or ERROR)
- Error handling is centralized in the `ErrorState` interface with message, code, and retry flag

### CSS Module System

- CSS styles are encapsulated using CSS modules
- The styles are defined in `confidence.module.css`
- Type declarations in `css.d.ts` provide TypeScript support
- Component-specific styles are provided through carefully structured class naming

## Setup & Configuration

1. **Environment Setup**
   - Node.js 16+ and npm/yarn are required
   - This is part of a Next.js monorepo, so the Next.js environment must be properly configured

2. **DeepGram API Key**
   - A DeepGram API key is required for speech recognition
   - Add your key to the monorepo's `.env.local` file:
     ```
     DEEPGRAM_API_KEY=your_api_key_here
     ```

3. **Running the Project**
   - Navigate to the monorepo root: `/Users/ethan/Documents/projects/final-exp/`
   - Install dependencies: `npm install`
   - Start the development server: `npm run dev`
   - Access the application at: `http://localhost:3000/ai-confidence-tracker`

## Extensibility & Future Development

The current implementation is designed for easy extensibility:

1. **Multi-Provider Support**
   - The architecture is prepared for adding additional speech recognition providers beyond DeepGram
   - New providers would require similar API modules in the `/api` directory
   - The common `TranscriptionResult` interface standardizes results across providers

2. **Performance Considerations**
   - Audio is processed as a Buffer without storing to disk
   - Temporary files during upload are cleaned up automatically
   - Confidence calculations are optimized for efficient rendering

3. **Error Handling Strategy**
   - Comprehensive error handling for microphone access
   - User-friendly error messages with guidance on how to resolve issues
   - Fallback mechanisms for browser compatibility issues
   - Network and API error detection and recovery

## Technical Dependencies

- **React**: UI component library
- **Next.js**: Framework for server-side rendering and API routes
- **TypeScript**: Type safety throughout the application
- **MediaRecorder API**: Browser API for audio recording
- **DeepGram API**: Speech-to-text service with confidence scores
- **Formidable**: Parsing multipart form data (file uploads)

## Browser Compatibility

- Modern browsers with MediaRecorder API support (Chrome, Firefox, Edge, Safari 14.1+)
- Fallbacks implemented for various MIME type and browser compatibility issues
- Error handling for browsers lacking necessary audio API support 