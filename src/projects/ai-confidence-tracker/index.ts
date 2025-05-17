// Export types
export * from './types/SpeechConfidenceTypes';

// Export hooks
export {
  useReferenceSentences,
  useAudioRecording,
  useDeepgramProcessing,
  useSpeechConfidenceState,
  SpeechConfidenceProvider,
  useSpeechConfidence
} from './hooks/SpeechConfidenceHooks';

// Export components - using named exports to avoid namespace collisions
export { default as SpeechConfidenceVisualizer } from './components/SpeechConfidenceComponents';
export {
  ReferenceSentence,
  RecordingControls,
  ConfidenceVisualizer,
  ErrorDisplay
} from './components/SpeechConfidenceComponents';

// Export API
export {
  processAudioWithDeepgram,
  processDeepgramResponse,
  categorizeConfidence
} from './api/DeepgramApi'; 