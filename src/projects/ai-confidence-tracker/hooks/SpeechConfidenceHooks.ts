import React, { useState, useRef, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { AppState, ErrorState, ReferenceSentence, TranscriptionResult } from '../types/SpeechConfidenceTypes';

// ========================
// REFERENCE SENTENCES HOOK
// ========================

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

// ========================
// AUDIO RECORDING HOOK
// ========================

export function useAudioRecording(runIdRef?: React.MutableRefObject<number>) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    // Capture runId at attach time. The onstop closure below carries this
    // value so a late onstop firing after re-activation (new run started)
    // bails out instead of committing the abandoned run's blob.
    const myRun = runIdRef?.current ?? 0;

    try {
      setAudioData(null);
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording. Please try a different browser.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      if (!stream.getAudioTracks() || stream.getAudioTracks().length === 0) {
        throw new Error('No audio track available. Please check your microphone configuration.');
      }
      
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder;
      
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        setError('Error during recording. Please try again.');
        stopRecording();
      };

      mediaRecorder.onstop = () => {
        // Late-callback guard: if a new run started after this recorder was
        // attached, drop the captured audio rather than committing it to the
        // new run's state.
        if (runIdRef && myRun !== runIdRef.current) return;

        if (audioChunksRef.current.length === 0) {
          setError('No audio data was captured. Please check your microphone and try again.');
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });

        if (audioBlob.size === 0) {
          setError('Recorded audio is empty. Please check your microphone and try again.');
          return;
        }

        setAudioData(audioBlob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      let userFriendlyMessage = 'Microphone permission denied or not available';
      
      if (errorMessage.includes('permission')) {
        userFriendlyMessage = 'Microphone permission denied. Please allow microphone access and try again.';
      } else if (errorMessage.includes('device')) {
        userFriendlyMessage = 'No microphone detected. Please connect a microphone and try again.';
      } else if (errorMessage.includes('browser')) {
        userFriendlyMessage = errorMessage;
      }
      
      setError(userFriendlyMessage);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_err) {
        setIsRecording(false);
      }
    } else if (isRecording) {
      setIsRecording(false);
      setError('Recording state was inconsistent. Please try again.');
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setAudioData(null);
    setError(null);
    setIsRecording(false);
    audioChunksRef.current = [];
  }, []);

  return {
    isRecording,
    audioData,
    error,
    startRecording,
    stopRecording,
    resetRecording
  };
}

// ========================
// DEEPGRAM PROCESSING HOOK
// ========================

export function useDeepgramProcessing(
  cancelSignal?: AbortSignal,
  runIdRef?: React.MutableRefObject<number>
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size === 0) {
      setError('The recorded audio is empty. Please check your microphone and try again.');
      return;
    }

    // Capture runId at the start of the operation. Compare on every
    // post-await boundary; if a new run has started, bail without writing.
    const myRun = runIdRef?.current ?? 0;
    const isStillCurrentRun = () => !runIdRef || myRun === runIdRef.current;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      const fileName = `recording-${Date.now()}.${audioBlob.type.split('/')[1] || 'webm'}`;

      let audioFile;
      try {
        audioFile = new File([audioBlob], fileName, { type: audioBlob.type });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        audioFile = audioBlob;
      }

      formData.append('audio', audioFile, fileName);

      const response = await fetch('/api/ai-confidence-tracker/transcribe', {
        method: 'POST',
        body: formData,
        signal: cancelSignal,
      });
      if (!isStillCurrentRun()) return;

      const data = await response.json();
      if (!isStillCurrentRun()) return;

      if (!response.ok) {
        const errorMessage = data.details || data.error || 'Unknown error occurred';
        throw new Error(errorMessage);
      }

      if (!data || typeof data !== 'object') {
        throw new Error('The server returned an invalid response format');
      }

      if (!data.hasOwnProperty('transcript') || !data.hasOwnProperty('words') || !Array.isArray(data.words)) {
        throw new Error('The server returned an invalid response format');
      }

      if (data.transcript === '' && data.words.length === 0) {
        throw new Error('No speech detected in recording. Please try again.');
      }

      setResult(data);
    } catch (err) {
      // Deliberate cancellation — not a user-facing error.
      if (err instanceof Error && err.name === 'AbortError') return;
      if (cancelSignal?.aborted) return;
      if (!isStillCurrentRun()) return;
      const errorMessage = err instanceof Error ? err.message : 'Error processing audio';
      setError(errorMessage);
    } finally {
      // Don't override state set by a newer run.
      if (isStillCurrentRun()) {
        setIsProcessing(false);
      }
    }
  }, [cancelSignal, runIdRef]);

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

// ========================
// SPEECH CONFIDENCE STATE HOOK
// ========================

export interface SpeechConfidenceStateOptions {
  cancelSignal?: AbortSignal;
  runIdRef?: React.MutableRefObject<number>;
}

export function useSpeechConfidenceState(options: SpeechConfidenceStateOptions = {}) {
  const { cancelSignal, runIdRef } = options;
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);

  const {
    isRecording,
    audioData,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording
  } = useAudioRecording(runIdRef);

  const {
    isProcessing,
    result,
    error: processingError,
    processAudio,
    resetProcessing
  } = useDeepgramProcessing(cancelSignal, runIdRef);
  
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
  
  useEffect(() => {
    if (audioData && !isRecording && appState !== AppState.ERROR) {
      processAudio(audioData);
    }
  }, [audioData, isRecording, processAudio]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const resetState = useCallback(() => {
    resetProcessing();
    setAppState(AppState.INITIAL);
    setErrorState(null);
    resetRecording();
  }, [resetProcessing, resetRecording]);

  // Kill-switch: when cancelSignal aborts, invoke the product's existing
  // teardown — stop recording (releases mic tracks) and reset state to
  // INITIAL. AbortSignal handles the in-flight fetch separately via the
  // `signal:` option in useDeepgramProcessing; runIdRef handles late
  // MediaRecorder.onstop. This effect handles the imperative "stop the mic
  // and clear UI state" piece the other primitives can't reach.
  // Refs avoid re-binding the listener whenever stopRecording / resetState
  // identities change (they depend on isRecording, etc.) — re-binding
  // creates a window where an abort fired between cleanup and re-attach is
  // missed.
  const stopRecordingRef = useRef(stopRecording);
  const resetStateRef = useRef(resetState);
  useEffect(() => { stopRecordingRef.current = stopRecording; }, [stopRecording]);
  useEffect(() => { resetStateRef.current = resetState; }, [resetState]);

  useEffect(() => {
    if (!cancelSignal) return;

    const handleAbort = () => {
      stopRecordingRef.current();
      resetStateRef.current();
    };

    if (cancelSignal.aborted) {
      handleAbort();
      return;
    }

    cancelSignal.addEventListener('abort', handleAbort, { once: true });
    return () => cancelSignal.removeEventListener('abort', handleAbort);
  }, [cancelSignal]);

  return {
    appState,
    errorState,
    transcriptionResult: result,
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    resetState
  };
}

// ========================
// CONTEXT PROVIDER
// ========================

type SpeechConfidenceContextType = ReturnType<typeof useSpeechConfidenceState> & 
  ReturnType<typeof useReferenceSentences>;

const SpeechConfidenceContext = createContext<SpeechConfidenceContextType | undefined>(undefined);

interface SpeechConfidenceProviderProps {
  children: ReactNode;
  /** Optional showcase-side cancel signal. When it aborts, the provider
   *  invokes stopRecording() + resetState() and aborts any in-flight
   *  transcribe fetch. Standalone usage (omit) preserves prior behaviour. */
  cancelSignal?: AbortSignal;
  /** Optional run-id ref from useRunId(). Used to reject late callbacks
   *  (MediaRecorder.onstop, post-await setState) that belong to an
   *  abandoned run. Omit for standalone use — guards become no-ops. */
  runIdRef?: React.MutableRefObject<number>;
}

export const SpeechConfidenceProvider = ({ children, cancelSignal, runIdRef }: SpeechConfidenceProviderProps) => {
  const speechState = useSpeechConfidenceState({ cancelSignal, runIdRef });
  const referenceSentences = useReferenceSentences();
  
  const value = {
    ...speechState,
    ...referenceSentences
  };
  
  return React.createElement(
    SpeechConfidenceContext.Provider,
    { value },
    children
  );
};

export const useSpeechConfidence = () => {
  const context = useContext(SpeechConfidenceContext);
  if (!context) {
    throw new Error('useSpeechConfidence must be used within a SpeechConfidenceProvider');
  }
  return context;
}; 