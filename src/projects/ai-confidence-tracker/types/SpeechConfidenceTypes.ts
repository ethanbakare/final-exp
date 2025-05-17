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

// ========================
// DEEPGRAM API TYPES
// ========================

// DeepGram API response types
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