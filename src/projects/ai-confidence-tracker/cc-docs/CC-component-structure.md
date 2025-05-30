# AI Confidence Tracker Component Structure

<a id="toc"></a>
## Table of Contents

1. [Overview](#overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Component File Structure](#component-file-structure)
4. [Components](#components)
   1. [IntegratedDeepCard Component](#integrateddeepcard)
      - [Structure](#integrateddeepcard-structure)
      - [State Management](#integrateddeepcard-state)
      - [Key Functions](#integrateddeepcard-functions)
      - [CSS Classes](#integrateddeepcard-css)
      - [Critical Implementation Details](#integrateddeepcard-critical)
      - [Edge Cases](#integrateddeepcard-edge-cases)
   2. [SpeechConfidenceHooks](#speechconfidencehooks)
      - [Structure](#speechconfidencehooks-structure)
      - [Hook Functions](#speechconfidencehooks-functions)
      - [State Management](#speechconfidencehooks-state)
      - [Critical Implementation Details](#speechconfidencehooks-critical)
   3. [DeepUIComponents](#deepuicomponents)
      - [Structure](#deepuicomponents-structure)
      - [Key Functions](#deepuicomponents-functions)
      - [Critical Implementation Details](#deepuicomponents-critical)
   4. [DeepButtons](#deepbuttons)
      - [Structure](#deepbuttons-structure)
      - [Button Components](#deepbuttons-components)
      - [Badge Components](#deepbuttons-badges)
   5. [TranscriptTextStates](#transcripttextstates)
      - [Structure](#transcripttextstates-structure)
      - [State Management](#transcripttextstates-state)
      - [Animation System](#transcripttextstates-animation)
5. [API Integration](#api-integration)
6. [Type System](#type-system)
7. [Cross-Component Interactions](#cross-component)
8. [Responsive Design](#responsive)
9. [Implementation Decisions](#decisions)
10. [Function Index](#function-index)

<a id="overview"></a>
## Overview
[↑ Back to Table of Contents](#toc)

The AI Confidence Tracker is a sophisticated speech-to-text application that analyzes and visualizes the confidence levels of transcribed words using Deepgram's AI API. The system provides real-time audio recording, transcription processing, and interactive confidence visualization with a modern, responsive UI.

The application allows users to:
- Record audio through their microphone with real-time feedback
- Process audio through Deepgram's speech-to-text API
- View transcribed text with color-coded confidence levels (high, medium, low)
- Interact with individual words to see detailed confidence scores
- Navigate through different application states (recording, processing, results, error)
- Experience responsive design across desktop, tablet, and mobile devices

### Core Functionality
1. **Audio Recording**: Browser-based microphone access with MediaRecorder API
2. **Speech Processing**: Integration with Deepgram API for high-quality transcription
3. **Confidence Analysis**: Categorization of words into confidence levels with thresholds
4. **Interactive Visualization**: Hover/tap interactions with confidence tooltips and badges
5. **State Management**: Comprehensive state handling for all application phases
6. **Error Handling**: Robust error states with user-friendly messages and retry options

<a id="component-hierarchy"></a>
## Component Hierarchy
[↑ Back to Table of Contents](#toc)

```
SpeechConfidenceProvider (Context Provider)
├── IntegratedDeepCard (Main Container Component)
│   ├── TranscriptBar (.transcript-bar)
│   │   ├── Transcript Microcopy (.transcript-microcopy)
│   │   └── Legend (.legend)
│   │       ├── Legend Key (.legend-key)
│   │       └── Legend Holder (.legend-holder)
│   │           ├── Medium Confidence Indicator (.mid)
│   │           └── Low Confidence Indicator (.low)
│   ├── Transcript Mainframe (.transcript-mainframe)
│   │   ├── Transcript Box (.transcript-box)
│   │   │   ├── TranscriptTextStates Component
│   │   │   │   ├── Initial State (.initial-text)
│   │   │   │   ├── Recording State (.status-text)
│   │   │   │   ├── Processing State (.status-text)
│   │   │   │   ├── Error State (.error-text)
│   │   │   │   └── Results State (HighlightedText)
│   │   │   │       ├── Word Spans (.word-span)
│   │   │   │       │   ├── Confidence Highlights (.confidence-highlight)
│   │   │   │       │   └── Hover Areas (.highlight-hover-area)
│   │   │   │       └── Tooltips (LowConfidenceTooltip/MediumConfidenceTooltip)
│   │   │   └── TranscriptBoxNav Component
│   │   │       ├── Navigation States
│   │   │       │   ├── RecordButton (initial state)
│   │   │       │   ├── RecordingButton (recording state)
│   │   │       │   ├── ProcessingButton (processing state)
│   │   │       │   ├── DropdownButton (results state)
│   │   │       │   ├── CancelButton (recording/processing states)
│   │   │       │   ├── ClearButton (results state)
│   │   │       │   └── RetryButton (error state)
│   │   │       └── Dropdown Icon (.dropdown-icon)
│   │   └── Transcript Data (.transcript-data)
│   │       ├── Master Badge Container (.mastercon-badge)
│   │       │   ├── HighConfidenceBadge (when all words high confidence)
│   │       │   ├── LowConfidenceBadge × N (for low confidence words)
│   │       │   └── MediumConfidenceBadge × N (for medium confidence words)
│   │       └── Model Copy (.model-copy)
│   │           ├── Default Text (when no word selected)
│   │           └── Confidence Details (when word selected)
│   └── Fade Overlay (.fade-overlay)
└── Alternative Components (for different use cases)
    ├── SpeechConfidenceVisualizer (Standalone Visualizer)
    │   ├── ReferenceSentence Component
    │   │   ├── Sentence Navigation (.sentence-navigation)
    │   │   │   ├── Previous Button (.nav-button)
    │   │   │   ├── Sentence Indicator (.sentence-indicator)
    │   │   │   └── Next Button (.nav-button)
    │   │   └── Sentence Display (.sentence-display)
    │   ├── RecordingControls Component
    │   │   ├── Start Recording Button (.record-button.start)
    │   │   └── Recording In Progress (.recording-in-progress)
    │   │       ├── Recording Indicator (.recording-indicator)
    │   │       └── Recording Actions (.recording-actions)
    │   │           ├── Stop Recording Button (.record-button.stop)
    │   │           └── Cancel Button (.cancel-button)
    │   ├── ConfidenceVisualizer Component
    │   │   ├── Transcription Display (.transcription-display)
    │   │   │   ├── Transcription Text (.transcription-text)
    │   │   │   │   └── Word Spans (.word.confidence-*)
    │   │   │   └── Low Confidence Section (.low-confidence-section)
    │   │   │       └── Low Confidence Words List (.low-confidence-words)
    │   │   └── Confidence Legend (.confidence-legend)
    │   │       ├── High Confidence Legend (.legend-item)
    │   │       ├── Medium Confidence Legend (.legend-item)
    │   │       └── Low Confidence Legend (.legend-item)
    │   └── ErrorDisplay Component
    │       ├── Error Container (.error-container)
    │       │   ├── Error Icon (.error-icon)
    │       │   ├── Error Title (.error-title)
    │       │   ├── Error Message (.error-message)
    │       │   └── Error Help Text (.error-help)
    │       └── Retry Button (.retry-button)
    └── DeepCard Component (Alternative Layout)
        ├── Deep Sentence Component
        ├── Deep Reader Component
        └── Deep Text Animation Components
```

<a id="component-file-structure"></a>
## Component File Structure
[↑ Back to Table of Contents](#toc)

The codebase follows a modular architecture with clear separation of concerns:

```
/ai-confidence-tracker/
├── index.ts                           # Main exports and public API
├── types/
│   └── SpeechConfidenceTypes.ts       # TypeScript type definitions
├── hooks/
│   └── SpeechConfidenceHooks.ts       # Custom React hooks for state management
├── api/
│   └── DeepgramApi.ts                 # Deepgram API integration and processing
├── components/
│   ├── SpeechConfidenceComponents.tsx # Basic component implementations
│   └── ui/                            # Advanced UI components
│       ├── IntegratedDeepCard.tsx     # Main integrated component
│       ├── deepUIcomponents.tsx       # Core UI elements (HighlightedText, StyledText)
│       ├── deepButtons.tsx            # Button and badge components
│       ├── deepMorphingButtons.tsx    # Animated button components
│       ├── transcript-text-states.tsx # Text state management component
│       ├── transcript-box-nav.tsx     # Navigation component
│       ├── transcript-bar.tsx         # Top bar with legend
│       ├── deepCard.tsx               # Alternative card layout
│       ├── deepReader.tsx             # Reader component
│       ├── DeepSentence.tsx           # Sentence display component
│       └── deepTextAnimation.tsx      # Text animation components
├── styles/
│   ├── ai-tracker.module.css          # Main styling for integrated components
│   └── confidence.module.css          # Styling for basic components
└── cc-docs/                           # Documentation
    ├── CC-component-structure.md      # This file
    ├── implementation-guide.md        # Implementation guide
    └── IssuesNotFixed.md              # Known issues and limitations
```

### Architecture Principles

**1. Separation of Concerns**
- **Types**: All TypeScript interfaces and enums in dedicated types file
- **Hooks**: State management logic separated from UI components
- **API**: External service integration isolated in api directory
- **Components**: UI logic separated from business logic

**2. Component Composition**
- **Basic Components**: Simple, reusable components in SpeechConfidenceComponents.tsx
- **Advanced Components**: Complex, feature-rich components in ui/ directory
- **Specialized Components**: Purpose-built components for specific use cases

**3. Styling Strategy**
- **CSS Modules**: Scoped styling to prevent conflicts
- **Styled JSX**: Component-specific styling for complex layouts
- **Responsive Design**: Mobile-first approach with progressive enhancement

<a id="components"></a>
## Components
[↑ Back to Table of Contents](#toc)

<a id="integrateddeepcard"></a>
### IntegratedDeepCard Component
[↑ Back to Table of Contents](#toc)

The IntegratedDeepCard component serves as the main container for the AI confidence tracker interface. It orchestrates the entire user experience from recording to results visualization.

<a id="integrateddeepcard-structure"></a>
#### Structure

- `.transcript-interface` - Main container with responsive layout
  - `TranscriptBar` - Top bar with AI attribution and confidence legend
  - `.transcript-mainframe` - Main content area with collapsible design
    - `.transcript-box` - Primary interaction area
      - `TranscriptTextStates` - Dynamic text display based on application state
      - `TranscriptBoxNav` - Navigation controls and state-specific buttons
    - `.transcript-data` - Expandable area for confidence details
      - `.mastercon-badge` - Container for confidence badges
      - `.model-copy` - Dynamic text showing confidence information

<a id="integrateddeepcard-state"></a>
#### State Management

```typescript
// Core application state from hooks
const {
  appState,           // Current application state (initial, recording, processing, results, error)
  errorState,         // Error information if in error state
  transcriptionResult, // Processed transcription with confidence data
  startRecording,     // Function to begin audio recording
  stopRecording,      // Function to end audio recording
  resetState          // Function to reset to initial state
} = useSpeechConfidence();

// Local UI state management
const [activeWordId, setActiveWordId] = useState<number | null>(null);
const [badgeStates, setBadgeStates] = useState<Map<number, boolean>>(new Map());
const [isCollapsed, setIsCollapsed] = useState(true);
const [isMobile, setIsMobile] = useState<boolean>(false);

// Timer management for interactions
const modelCopyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const lastInteractionWasTouchRef = useRef<boolean>(false);
const [modelCopyActiveWordId, setModelCopyActiveWordId] = useState<number | null>(null);
```

<a id="integrateddeepcard-functions"></a>
#### Key Functions

- `getUIStates()` - Converts AppState enum to UI-specific state objects for nav and text components
- `convertToHighlights(result)` - Transforms TranscriptionResult into highlight format for UI rendering
- `capitalizeSentences(text)` - Applies proper capitalization to transcribed text
- `getErrorType()` - Categorizes error messages into specific error types for appropriate UI handling
- `handleTextInteraction(wordId)` - Manages word selection and highlighting interactions
- `handleBadgeInteraction(wordId)` - Handles confidence badge hover and click interactions
- `clearInteraction()` - Resets all active interactions and hover states
- `getOrderedBadges()` - Sorts confidence badges in text order for proper display
- `getModelCopyContent()` - Generates dynamic content for the model copy area based on current selection

<a id="integrateddeepcard-css"></a>
#### CSS Classes

- `.transcript-interface` - Main container with flexbox column layout and responsive padding
- `.transcript-mainframe` - Collapsible container with smooth transitions for expand/collapse
- `.transcript-box` - Primary content area with shadow, border, and rounded corners
- `.transcript-data` - Expandable details area with opacity and height transitions
- `.mastercon-badge` - Flexbox container for confidence badges with proper wrapping
- `.model-copy` - Text area for confidence information with typography styling

<a id="integrateddeepcard-critical"></a>
#### Critical Implementation Details

##### State Synchronization Between Components
```typescript
// CRITICAL: AppState to UI state conversion ensures consistent behavior
const getUIStates = (): { navState: NavState; textState: TextState } => {
  switch (appState) {
    case AppState.INITIAL:
      return { navState: 'initial', textState: 'initial' };
    case AppState.RECORDING:
      return { navState: 'recording', textState: 'recording' };
    case AppState.PROCESSING:
      return { navState: 'processing', textState: 'processing' };
    case AppState.RESULTS:
      return { navState: 'results', textState: 'results' };
    case AppState.ERROR:
      return { navState: 'error', textState: 'error' };
    default:
      return { navState: 'initial', textState: 'initial' };
  }
};
```

##### Interactive Word Highlighting System
```typescript
// CRITICAL: Unified interaction handler prevents state conflicts
const handleTextInteraction = useCallback((wordId: number | null) => {
  if (activeWordId === wordId) {
    clearInteraction(); // Toggle off if same word clicked
  } else {
    setActiveWordId(wordId);
    
    setBadgeStates(() => {
      const newMap = new Map();
      if (wordId !== null) {
        newMap.set(wordId, true); // Only activate the selected word
      }
      return newMap;
    });
  }
}, [activeWordId, clearInteraction]);
```

##### Mobile Touch Interaction Management
```typescript
// CRITICAL: Touch event handling for mobile devices
useEffect(() => {
  const handleTouchOutside = (e: TouchEvent) => {
    const target = e.target;
    
    if (!(target instanceof Element)) return;
    
    const isTextTouch = target.closest('.highlight-hover-area');
    const isBadgeTouch = target.closest('.confidence-badge-wrapper') || target.closest('.confidence-badge');
    
    if (!isTextTouch && !isBadgeTouch) {
      lastInteractionWasTouchRef.current = true;
      clearInteraction(); // Clear interactions when touching outside
    }
  };
  
  document.addEventListener('touchstart', handleTouchOutside);
  return () => {
    document.removeEventListener('touchstart', handleTouchOutside);
  };
}, [clearInteraction]);
```

##### Dropdown Animation and Timing
```typescript
// CRITICAL: Coordinated timing for smooth UI transitions
useEffect(() => {
  if (dropdownTimerRef.current) {
    clearTimeout(dropdownTimerRef.current);
    dropdownTimerRef.current = null;
  }

  if (navState === 'results') {
    dropdownTimerRef.current = setTimeout(() => {
      setIsCollapsed(false); // Expand after 300ms delay
      dropdownTimerRef.current = null;
    }, 300);
  } else {
    setIsCollapsed(true); // Immediate collapse for other states
  }

  return () => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
      dropdownTimerRef.current = null;
    }
  };
}, [navState]);
```

<a id="integrateddeepcard-edge-cases"></a>
#### Edge Cases

##### High Confidence State Handling
```typescript
// Problem: When all words have high confidence, no badges should be shown
// Solution: Special state detection and alternative UI
const isHighConfidenceState = highlights.length === 0 && transcriptText.length > 0;

// In render:
{isHighConfidenceState ? (
  <HighConfidenceBadge />
) : (
  orderedBadges.map((badge, index) => (
    // Render individual confidence badges
  ))
)}
```

##### Empty Transcription Handling
```typescript
// Problem: Empty or failed transcriptions should not show confidence UI
// Solution: Conditional rendering based on transcription content
const transcriptText = capitalizeSentences(transcriptionResult?.transcript || "");
const highlights = convertToHighlights(transcriptionResult);

// Only show confidence elements when there's actual content
{transcriptText.length > 0 && (
  <div className="transcript-data">
    {/* Confidence visualization */}
  </div>
)}
```

<a id="speechconfidencehooks"></a>
### SpeechConfidenceHooks
[↑ Back to Table of Contents](#toc)

The SpeechConfidenceHooks file contains all the custom React hooks that manage the application's state and business logic.

<a id="speechconfidencehooks-structure"></a>
#### Structure

The hooks are organized into logical groups:

1. **useReferenceSentences** - Manages reference sentence navigation
2. **useAudioRecording** - Handles microphone access and audio recording
3. **useDeepgramProcessing** - Manages API calls and transcription processing
4. **useSpeechConfidenceState** - Orchestrates overall application state
5. **SpeechConfidenceProvider** - React Context provider for state sharing
6. **useSpeechConfidence** - Context consumer hook

<a id="speechconfidencehooks-functions"></a>
#### Hook Functions

**useReferenceSentences Hook:**
- `nextSentence()` - Advances to the next reference sentence in the collection
- `previousSentence()` - Goes back to the previous reference sentence
- `setCurrentIndex(index)` - Directly sets the current sentence index

**useAudioRecording Hook:**
- `startRecording()` - Initiates microphone access and begins audio capture
- `stopRecording()` - Ends recording and processes captured audio data
- `resetRecording()` - Clears audio data and resets recording state

**useDeepgramProcessing Hook:**
- `processAudio(audioBlob)` - Sends audio to Deepgram API and processes response
- `resetProcessing()` - Clears processing results and error states

**useSpeechConfidenceState Hook:**
- `resetState()` - Resets entire application to initial state
- Internal state coordination between recording, processing, and error states

<a id="speechconfidencehooks-state"></a>
#### State Management

```typescript
// Reference Sentences State
const [sentences] = useState<ReferenceSentence[]>(initialSentences || DEFAULT_SENTENCES);
const [currentIndex, setCurrentIndex] = useState(0);

// Audio Recording State
const [isRecording, setIsRecording] = useState(false);
const [audioData, setAudioData] = useState<Blob | null>(null);
const [error, setError] = useState<string | null>(null);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);

// Processing State
const [isProcessing, setIsProcessing] = useState(false);
const [result, setResult] = useState<TranscriptionResult | null>(null);
const [error, setError] = useState<string | null>(null);

// Application State
const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
const [errorState, setErrorState] = useState<ErrorState | null>(null);
```

<a id="speechconfidencehooks-critical"></a>
#### Critical Implementation Details

##### Audio Processing Trigger Logic
```typescript
// CRITICAL: This useEffect triggers audio processing when recording stops
// The appState dependency was removed to fix infinite loop bug
useEffect(() => {
  if (audioData && !isRecording && appState !== AppState.ERROR) {
    processAudio(audioData);
  }
}, [audioData, isRecording, processAudio]); // appState intentionally removed from deps
```

**WARNING:** Adding `appState` back to the dependency array would recreate the infinite loop bug that caused flickering during processing.

##### State Coordination Logic
```typescript
// CRITICAL: This useEffect coordinates all state changes
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
```

##### MediaRecorder Configuration
```typescript
// CRITICAL: Browser compatibility handling for MediaRecorder
const options = { mimeType: 'audio/webm' };
let mediaRecorder;

try {
  mediaRecorder = new MediaRecorder(stream, options);
} catch (_) {
  // Fallback for browsers that don't support webm
  mediaRecorder = new MediaRecorder(stream);
}
```

##### Intentionally Excluded React Hook Dependencies
```typescript
// CRITICAL: These dependencies are INTENTIONALLY EXCLUDED to prevent bugs
// DO NOT add them back without understanding the consequences

// 1. startRecording useCallback - Line 131
// ESLint Warning: "React Hook useCallback has a missing dependency: 'stopRecording'"
// REASON FOR EXCLUSION: Including stopRecording would create infinite re-creation loop
//   - startRecording depends on stopRecording
//   - stopRecording depends on isRecording
//   - startRecording changes isRecording
//   - This recreates stopRecording, which recreates startRecording
//   - Result: Infinite loop and performance issues
// SOLUTION: stopRecording() call inside startRecording is stable and doesn't need dependency
}, []); // eslint-disable-line react-hooks/exhaustive-deps

// 2. processAudio useEffect - Line 301  
// ESLint Warning: "React Hook useEffect has a missing dependency: 'appState'"
// REASON FOR EXCLUSION: Including appState would cause unwanted re-triggers
//   - Effect should only run when audioData, isRecording, or processAudio change
//   - Adding appState makes it run on every state change
//   - This causes duplicate API calls during state transitions
//   - appState !== AppState.ERROR is just a guard condition, not a trigger
// SOLUTION: appState check is intentional guard, not dependency
}, [audioData, isRecording, processAudio]); // eslint-disable-line react-hooks/exhaustive-deps

// IMPORTANT: These ESLint disable comments are intentional and necessary
// They prevent false positive warnings for architecturally correct code
// Removing these exclusions will reintroduce the following bugs:
//   1. Infinite re-render loops during recording
//   2. Duplicate API calls during processing
//   3. UI flickering and performance degradation
//   4. Inconsistent state management behavior
```

<a id="deepuicomponents"></a>
### DeepUIComponents
[↑ Back to Table of Contents](#toc)

The DeepUIComponents file contains the core UI elements for text display and interaction.

<a id="deepuicomponents-structure"></a>
#### Structure

**StyledText Component:**
- Animated text display with reset functionality
- Horizontal slide-in animation with blur effects
- Reset button for replaying animations

**HighlightedText Component:**
- Interactive text with confidence-based highlighting
- Word-level interaction handling
- Tooltip integration for confidence display
- Mobile and desktop interaction support

<a id="deepuicomponents-functions"></a>
#### Key Functions

**StyledText Functions:**
- `resetAnimation()` - Triggers animation replay by updating component key
- `handleTextAnimationEnd()` - Marks animation completion and updates state

**HighlightedText Functions:**
- `getConfidenceColor(level)` - Returns CSS color value for confidence level
- `getFocusHighlightColor(level)` - Returns background color for focused words
- `getConfidencePercentage(level, wordId)` - Gets percentage string for tooltips
- `handleWordClick(wordId)` - Processes word interaction events
- `measureWordsWithSpans()` - Calculates word positions for tooltip placement

<a id="deepuicomponents-critical"></a>
#### Critical Implementation Details

##### Word Interaction System
```typescript
// CRITICAL: Word interaction handling with proper event management
const handleWordClick = useCallback((wordId: number) => {
  if (onWordInteraction) {
    onWordInteraction(wordId);
  }
}, [onWordInteraction]);

// CRITICAL: Touch outside detection for mobile
useEffect(() => {
  const handleTouchOutside = (e: TouchEvent) => {
    const target = e.target;
    
    if (!(target instanceof Element)) return;
    
    const isTextTouch = target.closest('.highlight-hover-area');
    
    if (!isTextTouch && onWordInteraction) {
      onWordInteraction(null); // Clear selection
    }
  };
  
  document.addEventListener('touchstart', handleTouchOutside);
  return () => {
    document.removeEventListener('touchstart', handleTouchOutside);
  };
}, [onWordInteraction]);
```

##### Confidence Color Mapping
```typescript
// CRITICAL: Consistent color mapping across the application
const CONFIDENCE_COLORS = {
  low: '#EF4444',    // Low confidence - red
  medium: '#F59E0B', // Medium confidence - orange/yellow
  high: '#22C55E'    // High confidence - green
};

const FOCUS_HIGHLIGHT_COLORS = {
  low: '#FEE2E2',    // Light red for low confidence
  medium: '#FEF3C7', // Light yellow for medium confidence
  high: '#DCFCE7'    // Light green for high confidence
};
```

<a id="deepbuttons"></a>
### DeepButtons
[↑ Back to Table of Contents](#toc)

The DeepButtons file contains all button and badge components used throughout the application.

<a id="deepbuttons-structure"></a>
#### Structure

**Button Components:**
- `RecordButton` - Initial state recording button
- `RecordingButton` - Active recording state button with animation
- `ProcessingButton` - Processing state button with spinner
- `DropdownButton` - Results state dropdown toggle
- `ClearButton` - Clear/reset functionality
- `CancelButton` - Cancel current operation
- `RetryButton` - Retry after error

**Badge Components:**
- `LowConfidenceBadge` - Red badge for low confidence words
- `MediumConfidenceBadge` - Orange badge for medium confidence words
- `HighConfidenceBadge` - Green badge for high confidence state

**Tooltip Components:**
- `LowConfidenceTooltip` - Tooltip for low confidence words
- `MediumConfidenceTooltip` - Tooltip for medium confidence words

<a id="deepbuttons-components"></a>
#### Button Components

Each button component includes:
- State-specific styling and animations
- Accessibility attributes (aria-label, role)
- Hover and active state handling
- Icon integration where appropriate
- Responsive design considerations

<a id="deepbuttons-badges"></a>
#### Badge Components

Badge components feature:
- External state control for symbiotic behavior
- Internal click handling (can be disabled)
- Confidence level styling
- Text content display
- Hover state management

<a id="transcripttextstates"></a>
### TranscriptTextStates
[↑ Back to Table of Contents](#toc)

The TranscriptTextStates component manages the dynamic text display based on application state.

<a id="transcripttextstates-structure"></a>
#### Structure

- `.transcript-container` - Main container with relative positioning
  - `.transcript-text-wrapper` - Scrollable wrapper with padding
    - `.transcript-text-container` - Content container with fade animation
      - State-specific content (initial, recording, processing, error, results)
  - `.fade-overlay` - Bottom fade effect for scrollable content

<a id="transcripttextstates-state"></a>
#### State Management

```typescript
// Animation state
const [dotCount, setDotCount] = useState(1);
const [fadeOut, setFadeOut] = useState(false);
const [currentTextState, setCurrentTextState] = useState(textState);

// Device detection
const [isMobile, setIsMobile] = useState<boolean>(false);
```

<a id="transcripttextstates-animation"></a>
#### Animation System

**Dot Animation for Loading States:**
```typescript
// CRITICAL: Animated dots for recording and processing states
useEffect(() => {
  if (textState === 'recording' || textState === 'processing') {
    const interval = setInterval(() => {
      setDotCount(prev => prev >= 3 ? 1 : prev + 1);
    }, 500); // Change dots every 500ms

    return () => clearInterval(interval);
  }
}, [textState]);
```

**Fade Transition Animation:**
```typescript
// CRITICAL: Smooth transitions between states
useEffect(() => {
  if (textState !== currentTextState) {
    // Start fade out if transitioning from results to initial
    if (currentTextState === 'results' && textState === 'initial') {
      setFadeOut(true);
      setTimeout(() => {
        setCurrentTextState(textState);
        setFadeOut(false);
      }, 300); // 300ms fade duration
    } else {
      // Immediate transition for other state changes
      setCurrentTextState(textState);
    }
  }
}, [textState, currentTextState]);
```

<a id="api-integration"></a>
## API Integration
[↑ Back to Table of Contents](#toc)

The application integrates with Deepgram's speech-to-text API through a dedicated API layer.

### DeepgramApi.ts Functions

**processAudioWithDeepgram(audioBuffer, mimeType, apiKey):**
- Sends audio buffer to Deepgram API endpoint
- Handles authentication with API key
- Processes HTTP response and error handling
- Returns structured TranscriptionResult

**processDeepgramResponse(response):**
- Parses Deepgram API response format
- Extracts transcript and word-level confidence data
- Categorizes words by confidence thresholds
- Generates lowConfidenceWords array sorted by confidence

**categorizeConfidence(score):**
- Applies confidence thresholds to numerical scores
- Returns 'high' (≥90%), 'medium' (≥70%), or 'low' (<70%)
- Used for consistent confidence categorization across the application

### Confidence Thresholds

```typescript
const CONFIDENCE_THRESHOLDS = {
  high: 0.9,   // 90%
  medium: 0.7  // 70%
};
```

These thresholds determine the visual categorization of words in the UI and are used consistently across all components.

<a id="type-system"></a>
## Type System
[↑ Back to Table of Contents](#toc)

The application uses a comprehensive TypeScript type system defined in SpeechConfidenceTypes.ts.

### Core Types

**AppState Enum:**
```typescript
export enum AppState {
  INITIAL = 'initial',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  RESULTS = 'results',
  ERROR = 'error'
}
```

**TranscriptionResult Interface:**
```typescript
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

**ErrorState Interface:**
```typescript
export interface ErrorState {
  message: string;
  code?: string;
  retry?: boolean;
}
```

### Component Prop Types

All components have strongly typed props interfaces that ensure type safety and provide clear contracts for component usage.

<a id="cross-component"></a>
## Cross-Component Interactions
[↑ Back to Table of Contents](#toc)

### State Flow Chain

```
1. User clicks record button
2. IntegratedDeepCard calls startRecording()
3. useAudioRecording hook manages MediaRecorder
4. Recording state triggers UI updates across components
5. User stops recording
6. Audio data triggers processAudio() automatically
7. Processing state shows loading UI
8. Deepgram API returns results
9. Results state triggers dropdown expansion
10. User can interact with confidence highlights
```

### Event Propagation

**Word Interaction Chain:**
```
1. User hovers/clicks word in HighlightedText
2. onWordInteraction callback fired
3. IntegratedDeepCard updates activeWordId state
4. Badge states updated to highlight corresponding badge
5. Model copy text updated with confidence details
6. Tooltips positioned and displayed
```

**Mobile Touch Handling:**
```
1. Touch event detected on word
2. Touch outside detection prevents conflicts
3. lastInteractionWasTouchRef tracks touch vs mouse
4. Different timing for mobile vs desktop interactions
```

<a id="responsive"></a>
## Responsive Design
[↑ Back to Table of Contents](#toc)

### Breakpoint Strategy

```css
/* Desktop (default) */
/* Base styles apply */

/* Tablet */
@media (max-width: 768px) {
  /* Larger touch targets */
  /* Adjusted spacing */
  /* Modified layouts */
}

/* Mobile */
@media (max-width: 480px) {
  /* Simplified UI */
  /* Larger text */
  /* Touch-optimized interactions */
}

/* Touch devices */
@media (hover: none) {
  /* Touch-specific behaviors */
  /* Disabled hover states */
}
```

### Mobile Optimizations

1. **Touch Targets**: Minimum 44px touch targets for mobile
2. **Text Sizing**: Larger font sizes for readability
3. **Interaction Patterns**: Two-tap pattern for text selection
4. **Layout Adjustments**: Simplified layouts for small screens
5. **Performance**: Optimized animations for mobile devices

<a id="decisions"></a>
## Implementation Decisions
[↑ Back to Table of Contents](#toc)

### Context Provider Pattern

**Choice:** Using React Context for state management instead of prop drilling

**Reasoning:**
1. Cleaner component interfaces
2. Easier state sharing across deep component trees
3. Better separation of concerns
4. Simplified testing and debugging

### CSS Modules + Styled JSX Hybrid

**Choice:** Combination of CSS Modules for basic styling and styled JSX for complex layouts

**Reasoning:**
1. CSS Modules provide scoped styling and prevent conflicts
2. Styled JSX allows for dynamic styling based on component state
3. Better performance than CSS-in-JS libraries
4. Easier maintenance and debugging

### Custom Hooks Architecture

**Choice:** Separating business logic into custom hooks

**Reasoning:**
1. Reusable logic across components
2. Easier testing of business logic
3. Cleaner component code focused on rendering
4. Better separation of concerns

### Confidence Threshold System

**Choice:** Fixed thresholds (90% high, 70% medium) rather than dynamic thresholds

**Reasoning:**
1. Consistent user experience across all transcriptions
2. Predictable color coding
3. Easier to understand and explain to users
4. Aligns with industry standards for confidence scoring

<a id="function-index"></a>
## Function Index
[↑ Back to Table of Contents](#toc)

### SpeechConfidenceHooks.ts
- `useReferenceSentences(initialSentences?)` - Manages reference sentence navigation and state
- `nextSentence()` - Advances to next reference sentence with wraparound
- `previousSentence()` - Goes to previous reference sentence with wraparound
- `useAudioRecording()` - Handles microphone access and audio recording functionality
- `startRecording()` - Initiates microphone access and begins MediaRecorder capture
- `stopRecording()` - Ends recording session and processes captured audio chunks
- `resetRecording()` - Clears audio data and resets recording state to initial
- `useDeepgramProcessing()` - Manages API calls and transcription processing
- `processAudio(audioBlob)` - Sends audio to Deepgram API and processes response
- `resetProcessing()` - Clears processing results and error states
- `useSpeechConfidenceState()` - Orchestrates overall application state coordination
- `resetState()` - Resets entire application to initial state
- `SpeechConfidenceProvider({ children })` - React Context provider for state sharing
- `useSpeechConfidence()` - Context consumer hook for accessing shared state

### DeepgramApi.ts
- `processAudioWithDeepgram(audioBuffer, mimeType, apiKey)` - Sends audio to Deepgram API and returns structured result
- `processDeepgramResponse(response)` - Converts Deepgram response to application format
- `categorizeConfidence(score)` - Categorizes numerical confidence into high/medium/low levels

### IntegratedDeepCard.tsx
- `IntegratedDeepCard({ className? })` - Main container component for confidence tracker interface
- `getUIStates()` - Converts AppState enum to UI-specific state objects
- `convertToHighlights(result)` - Transforms TranscriptionResult into highlight format
- `capitalizeSentences(text)` - Applies proper capitalization to transcribed text
- `getErrorType()` - Categorizes error messages into specific error types
- `handleTextInteraction(wordId)` - Manages word selection and highlighting interactions
- `handleBadgeInteraction(wordId)` - Handles confidence badge hover and click interactions
- `clearInteraction()` - Resets all active interactions and hover states
- `getOrderedBadges()` - Sorts confidence badges in text order for display
- `getModelCopyContent()` - Generates dynamic content for model copy area

### deepUIcomponents.tsx
- `StyledText({ text, className? })` - Animated text display with reset functionality
- `resetAnimation()` - Triggers animation replay by updating component key
- `handleTextAnimationEnd()` - Marks animation completion and updates state
- `HighlightedText({ text, highlights?, activeWordId?, onWordInteraction? })` - Interactive text with confidence highlighting
- `getConfidenceColor(level)` - Returns CSS color value for confidence level
- `getFocusHighlightColor(level)` - Returns background color for focused words
- `getConfidencePercentage(level, wordId?)` - Gets percentage string for tooltips
- `handleWordClick(wordId)` - Processes word interaction events
- `measureWordsWithSpans()` - Calculates word positions for tooltip placement

### deepButtons.tsx
- `RecordButton({ onClick?, className? })` - Initial state recording button
- `RecordingButton({ onClick?, className? })` - Active recording state button with animation
- `ProcessingButton({ className? })` - Processing state button with spinner animation
- `DropdownButton({ onClick?, isOpen?, className? })` - Results state dropdown toggle
- `ClearButton({ onClick?, className? })` - Clear/reset functionality button
- `CancelButton({ onClick?, className? })` - Cancel current operation button
- `RetryButton({ onClick?, className? })` - Retry after error button
- `LowConfidenceBadge({ text, isExternallyActive?, disableInternalClick? })` - Red badge for low confidence words
- `MediumConfidenceBadge({ text, isExternallyActive?, disableInternalClick? })` - Orange badge for medium confidence words
- `HighConfidenceBadge()` - Green badge for high confidence state
- `LowConfidenceTooltip({ percentage?, className? })` - Tooltip for low confidence words
- `MediumConfidenceTooltip({ percentage?, className? })` - Tooltip for medium confidence words

### transcript-text-states.tsx
- `TranscriptTextStates({ textState, transcriptText?, highlights?, activeWordId?, onWordInteraction?, errorType?, errorMessage? })` - Dynamic text display based on application state
- `renderDots()` - Generates animated dots for loading states
- `getErrorMessage()` - Generates user-friendly error messages based on error type

### transcript-box-nav.tsx
- `TranscriptBoxNav({ navState, onDropdownClick?, onClearClick?, onRecordClick?, onRecordingClick?, onCancelClick?, onRetryClick?, errorType? })` - Navigation component with state-specific buttons

### transcript-bar.tsx
- `TranscriptBar({ isMobile, isHighConfidenceState, navState? })` - Top bar with AI attribution and confidence legend

### SpeechConfidenceComponents.tsx
- `ReferenceSentence({ sentence, totalSentences, currentIndex, onNext, onPrevious })` - Component for displaying and navigating reference sentences
- `RecordingControls({ isRecording, onStartRecording, onStopRecording, onCancel? })` - Component for controlling audio recording
- `ConfidenceVisualizer({ result })` - Component for visualizing word confidence levels
- `getColorClass(category)` - Returns CSS class name for confidence level
- `formatConfidence(confidence)` - Formats confidence as percentage string
- `ErrorDisplay({ message, retry?, onRetry? })` - Component for displaying error messages
- `getErrorTitle(message)` - Generates appropriate error title based on message
- `getHelpText(message)` - Provides helpful text for different error types
- `SpeechConfidenceVisualizer()` - Main standalone visualizer component

### deepCard.tsx
- `DeepCard({ className? })` - Alternative card layout component

### deepReader.tsx
- `DeepReader({ className? })` - Reader component for text display

### DeepSentence.tsx
- `DeepSentence({ sentence, className? })` - Sentence display component

### deepTextAnimation.tsx
- `DeepTextAnimation({ text?, className? })` - Vertical text animation component
- `DeepTextAnimationHorizontal({ text?, className? })` - Horizontal text animation component

### deepMorphingButtons.tsx
- `MorphingRightButton({ onClick?, className? })` - Animated right-pointing button
- `MorphingLeftButton({ onClick?, className? })` - Animated left-pointing button 