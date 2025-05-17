import React from 'react';
import styles from '../styles/confidence.module.css';
import {
  ReferenceSentenceProps, RecordingControlsProps,
  ConfidenceVisualizerProps, ErrorDisplayProps,
  AppState
} from '../types/SpeechConfidenceTypes';
import { useSpeechConfidence } from '../hooks/SpeechConfidenceHooks';

// ========================
// REFERENCE SENTENCE COMPONENT
// ========================

/**
 * Component to display and navigate through reference sentences
 */
export const ReferenceSentence: React.FC<ReferenceSentenceProps> = ({
  sentence,
  totalSentences,
  currentIndex,
  onNext,
  onPrevious
}) => {
  return (
    <div className={styles["reference-sentence-container"]}>
      <div className={styles["sentence-navigation"]}>
        <button 
          onClick={onPrevious}
          aria-label="Previous sentence"
          className={styles["nav-button"]}
        >
          ← Prev
        </button>
        
        <div className={styles["sentence-indicator"]}>
          Sentence {currentIndex + 1} of {totalSentences}
        </div>
        
        <button 
          onClick={onNext}
          aria-label="Next sentence"
          className={styles["nav-button"]}
        >
          Next →
        </button>
      </div>
      
      <div className={styles["sentence-display"]}>
        <h3>Reference Sentence:</h3>
        <p className={styles["reference-text"]}>{sentence.text}</p>
      </div>
    </div>
  );
};

// ========================
// RECORDING CONTROLS COMPONENT
// ========================

/**
 * Component for controlling audio recording
 * Provides UI to start, stop, and cancel recording
 */
export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onCancel
}) => {
  return (
    <div className={styles["recording-controls"]}>
      {!isRecording ? (
        <button 
          onClick={onStartRecording}
          className={`${styles["record-button"]} ${styles["start"]}`}
          aria-label="Start recording"
        >
          Start Recording
        </button>
      ) : (
        <div className={styles["recording-in-progress"]}>
          <div className={styles["recording-indicator"]}>
            <span className={styles["recording-dot"]}></span> Recording...
          </div>
          
          <div className={styles["recording-actions"]}>
            <button 
              onClick={onStopRecording}
              className={`${styles["record-button"]} ${styles["stop"]}`}
              aria-label="Stop recording"
            >
              Stop Recording
            </button>
            
            {onCancel && (
              <button 
                onClick={onCancel}
                className={styles["cancel-button"]}
                aria-label="Cancel recording"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ========================
// CONFIDENCE VISUALIZER COMPONENT
// ========================

/**
 * Component to visualize word confidence levels
 * Displays words color-coded by confidence level
 */
export const ConfidenceVisualizer: React.FC<ConfidenceVisualizerProps> = ({ result }) => {
  // Color-coding for different confidence levels
  const getColorClass = (category: 'high' | 'medium' | 'low'): string => {
    switch (category) {
      case 'high':
        return 'confidence-high';
      case 'medium':
        return 'confidence-medium';
      case 'low':
        return 'confidence-low';
      default:
        return '';
    }
  };

  // Format confidence as percentage
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className={styles["confidence-visualizer"]}>
      <div className={styles["transcription-display"]}>
        <h3>Transcription Result:</h3>
        
        <div className={styles["transcription-text"]}>
          {result.words.map((word, index) => (
            <span 
              key={`${word.word}-${index}`}
              className={`${styles["word"]} ${styles[getColorClass(word.category)]}`}
              title={`Confidence: ${formatConfidence(word.confidence)}`}
            >
              {word.word}{' '}
            </span>
          ))}
        </div>
      </div>
      
      {result.lowConfidenceWords.length > 0 && (
        <div className={styles["low-confidence-section"]}>
          <h4>Words with Low Confidence:</h4>
          <ul className={styles["low-confidence-words"]}>
            {result.lowConfidenceWords.map((word, index) => (
              <li key={`low-${index}`}>
                <span className={styles["word"]}>{word.word}</span>
                <span className={styles["confidence"]}>
                  {formatConfidence(word.confidence)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className={styles["confidence-legend"]}>
        <div className={styles["legend-item"]}>
          <span className={`${styles["legend-color"]} ${styles["confidence-high"]}`}></span>
          <span>High Confidence (90%+)</span>
        </div>
        <div className={styles["legend-item"]}>
          <span className={`${styles["legend-color"]} ${styles["confidence-medium"]}`}></span>
          <span>Medium Confidence (70-89%)</span>
        </div>
        <div className={styles["legend-item"]}>
          <span className={`${styles["legend-color"]} ${styles["confidence-low"]}`}></span>
          <span>Low Confidence (below 70%)</span>
        </div>
      </div>
    </div>
  );
};

// ========================
// ERROR DISPLAY COMPONENT
// ========================

/**
 * Component to display error messages
 * Provides retry option if applicable
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  retry = false,
  onRetry
}) => {
  // Extract specific error type for custom messages
  const getErrorTitle = (message: string): string => {
    if (message.includes('API key')) return 'API Key Error';
    if (message.includes('microphone') || message.includes('permission denied')) return 'Microphone Error';
    if (message.includes('empty')) return 'Empty Recording';
    if (message.includes('timeout') || message.includes('network')) return 'Network Error';
    return 'Something went wrong';
  };

  // Get help text based on error message
  const getHelpText = (message: string): string => {
    if (message.includes('API key')) {
      return 'The DeepGram API key is missing or invalid. Please check your configuration.';
    }
    if (message.includes('microphone') || message.includes('permission denied')) {
      return 'Please make sure your microphone is connected and you have granted permission to use it.';
    }
    if (message.includes('empty')) {
      return 'No audio was recorded. Please check that your microphone is working properly.';
    }
    if (message.includes('timeout') || message.includes('network')) {
      return 'Please check your internet connection and try again.';
    }
    return 'Please try again or contact support if the problem persists.';
  };

  const errorTitle = getErrorTitle(message);
  const helpText = getHelpText(message);

  return (
    <div className={styles["error-display"]}>
      <div className={styles["error-icon"]}>
        ⚠️
      </div>
      
      <div className={styles["error-message"]}>
        <h3>{errorTitle}</h3>
        <p>{message}</p>
        <p className={styles["help-text"]}>{helpText}</p>
      </div>
      
      {retry && onRetry && (
        <button 
          onClick={onRetry}
          className={styles["retry-button"]}
          aria-label="Retry"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

// ========================
// MAIN VISUALIZER COMPONENT
// ========================

/**
 * Main component for the Speech Confidence Visualizer
 * Manages the application flow and state transitions
 */
const SpeechConfidenceVisualizer: React.FC = () => {
  const {
    // App state
    appState,
    errorState,
    transcriptionResult,
    
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

  return (
    <div className={styles["speech-confidence-container"]}>
      <header className={styles["app-header"]}>
        <h1>Speech Confidence Visualizer</h1>
        <p className={styles["app-description"]}>
          Record yourself reading the reference sentence to see word-level confidence scores
        </p>
      </header>

      <ReferenceSentence
        sentence={currentSentence}
        totalSentences={sentenceCount}
        currentIndex={currentIndex}
        onNext={nextSentence}
        onPrevious={previousSentence}
      />
      
      <div className={styles["visualizer-content"]}>
        {appState === AppState.INITIAL && (
          <div className={styles["initial-state"]}>
            <p>Click the button below to start recording yourself reading the sentence above.</p>
            <RecordingControls
              isRecording={false}
              onStartRecording={startRecording}
              onStopRecording={() => {}} // Not used in initial state
            />
          </div>
        )}
        
        {appState === AppState.RECORDING && (
          <div className={styles["recording-state"]}>
            <p>Speak clearly into your microphone...</p>
            <RecordingControls
              isRecording={true}
              onStartRecording={() => {}} // Not used in recording state
              onStopRecording={stopRecording}
              onCancel={resetState}
            />
          </div>
        )}
        
        {appState === AppState.PROCESSING && (
          <div className={styles["processing-state"]}>
            <div className={styles["processing-indicator"]}>
              <div className={styles["spinner"]}></div>
              <p>Processing audio...</p>
            </div>
          </div>
        )}
        
        {appState === AppState.RESULTS && transcriptionResult && (
          <div className={styles["results-state"]}>
            <ConfidenceVisualizer result={transcriptionResult} />
            
            <div className={styles["action-buttons"]}>
              <button 
                onClick={resetState}
                className={`${styles["action-button"]} ${styles["try-again"]}`}
              >
                Try Again
              </button>
              
              <button 
                onClick={() => {
                  nextSentence();
                  resetState();
                }}
                className={`${styles["action-button"]} ${styles["next-sentence"]}`}
              >
                Next Sentence
              </button>
            </div>
          </div>
        )}
        
        {appState === AppState.ERROR && errorState && (
          <div className={styles["error-state"]}>
            <ErrorDisplay
              message={errorState.message}
              retry={errorState.retry}
              onRetry={resetState}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechConfidenceVisualizer; 