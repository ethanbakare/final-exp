import { useState, useRef, useCallback, useEffect } from 'react';
import { storeAudio } from '../services/audioStorage';
import { logger } from '../utils/logger';

const log = logger.scope('useClipRecording');

// useClipRecording Hook
// Manages audio recording, transcription, and state
// Following AI Confidence Tracker pattern (useAudioRecording + useDeepgramProcessing combined)

/* ============================================
   INTERFACES
   ============================================ */

export interface UseClipRecordingReturn {
  // Recording state
  isRecording: boolean;
  audioBlob: Blob | null;
  audioId: string | null;
  duration: number;
  error: string | null;
  audioAnalyser: AnalyserNode | null;

  // Transcription state
  isTranscribing: boolean;
  transcription: string;
  transcriptionError: string | null;
  isActiveRequest: boolean;  // Controls icon spinning during retry attempts

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  transcribeRecording: (blobOverride?: Blob) => Promise<void>;
  forceRetry: () => void;  // Allows tap-to-skip wait periods
  reset: () => void;
}

/* ============================================
   HOOK
   ============================================ */

export function useClipRecording(): UseClipRecordingReturn {
  // ============================================
  // RECORDING STATE
  // ============================================

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // TRANSCRIPTION STATE
  // ============================================

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isActiveRequest, setIsActiveRequest] = useState(false);

  // Retry configuration
  const MAX_RAPID_ATTEMPTS = 3;  // Attempts 1-3: no waits
  const RETRY_INTERVALS = [60000, 120000, 240000, 300000]; // 1, 2, 4, 5 min

  // ============================================
  // REFS
  // ============================================

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // START RECORDING
  // ============================================

  const startRecording = useCallback(async () => {
    // Browser environment check
    if (typeof window === 'undefined') {
      setError('Recording is only available in the browser');
      return;
    }

    // Check browser support
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Your browser does not support audio recording');
      return;
    }

    // Check secure context
    if (!window.isSecureContext) {
      setError('Microphone access requires a secure connection (HTTPS)');
      return;
    }

    try {
      // Reset previous state
      setError(null);
      setAudioBlob(null);
      setTranscription('');
      setTranscriptionError(null);
      chunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      mediaStreamRef.current = stream;

      // Create audio context for waveform visualization
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      await context.resume();
      audioContextRef.current = context;

      // Create analyser node
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        // CRITICAL: Save audio to IndexedDB BEFORE any network call
        // This ensures audio is never lost, even if transcription fails
        try {
          const savedAudioId = await storeAudio(blob);
          setAudioId(savedAudioId);
          log.info('Audio saved to IndexedDB', {
            audioId: savedAudioId,
            size: blob.size,
            type: blob.type
          });
        } catch (error) {
          log.error('Failed to save audio to IndexedDB', error);
          // Still set audioBlob for immediate transcription attempt
        }
        
        setAudioBlob(blob);
        
        // Stop duration timer
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        stopRecording();
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);

      // Provide helpful error messages
      if ((err as Error).name === 'NotAllowedError') {
        setError('Microphone access was denied. Please grant permission in your browser settings.');
      } else if ((err as Error).name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if ((err as Error).name === 'NotReadableError') {
        setError('Microphone is already in use by another application.');
      } else {
        setError('Could not access microphone. Please try again.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only capture function on mount (intentionally omit stopRecording)

  // ============================================
  // STOP RECORDING
  // ============================================

  const stopRecording = useCallback(() => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Stop microphone stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear analyser
    audioAnalyserRef.current = null;

    // Stop duration timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    setIsRecording(false);
  }, []);

  // ============================================
  // TRANSCRIBE RECORDING
  // ============================================

  const transcribeRecording = useCallback(async (blobOverride?: Blob) => {
    // Cancel any pending retry timer (prevents clash with external calls)
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    
    // Use provided blob OR fall back to state
    const blobToUse = blobOverride || audioBlob;

    if (!blobToUse) {
      log.warn('No audio blob to transcribe');
      setTranscriptionError('No audio to transcribe');
      return;
    }

    // Validate audio blob size
    if (blobToUse.size < 100) {
      log.warn('Audio blob too small', { size: blobToUse.size });
      setTranscriptionError('Recording is too short. Please record at least 1 second of audio.');
      return;
    }

    // Check if online before attempting
    if (!navigator.onLine) {
      log.info('Offline - transcription will retry when online');
      setTranscriptionError('offline');
      setIsTranscribing(false);
      return;
    }

    setIsTranscribing(true);
    setTranscriptionError(null);
    setIsActiveRequest(true);  // Icon should spin during active attempt

    try {
      // Prepare form data
      const formData = new FormData();
      const fileName = `recording-${Date.now()}.webm`;
      formData.append('audio', blobToUse, fileName);

      log.debug('Sending audio for transcription', {
        size: blobToUse.size,
        attempt: retryCount + 1,
        source: blobOverride ? 'retry-from-indexeddb' : 'fresh-recording'
      });
      // console.time('⏱️ TRANSCRIPTION (Deepgram)');

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      // Send to API with timeout
      const response = await fetch('/api/clipperstream/transcribe', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Server error - definitive failure
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Server error ${response.status}: ${errorData.error || errorData.details || 'Unknown'}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.success || !data.transcript) {
        throw new Error('Invalid transcription response');
      }

      // Success - reset retry count and set transcription
      // console.timeEnd('⏱️ TRANSCRIPTION (Deepgram)');
      setTranscription(data.transcript);
      setRetryCount(0);
      log.info('Transcription successful', {
        textLength: data.transcript.length,
        preview: data.transcript.substring(0, 50) + '...'
      });

    } catch (error) {
      // console.timeEnd('⏱️ TRANSCRIPTION (Deepgram)');
      log.error('Transcription failed', {
        error,
        attempt: retryCount + 1
      });

      // Determine if we should retry
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const isNetworkError = error instanceof TypeError;
      const shouldRetry = isTimeout || isNetworkError;

      if (shouldRetry) {
        const nextRetryCount = retryCount + 1;  // Calculate next value first
        setRetryCount(nextRetryCount);          // Update state

        if (nextRetryCount < MAX_RAPID_ATTEMPTS) {  // Attempts 1-3: rapid phase
          // Rapid phase: immediate retry
          log.info('Rapid retry (immediate)', {
            attempt: nextRetryCount + 1,
            reason: isTimeout ? 'timeout' : 'network error'
          });
          retryTimerRef.current = setTimeout(() => transcribeRecording(), 0);
          return; // Don't set isTranscribing to false yet
        } else {
          // Interval phase: wait before retry (attempts 4+)
          // Formula: nextRetryCount=3 schedules attempt 4 with index 0 (1min)
          const intervalIndex = (nextRetryCount - MAX_RAPID_ATTEMPTS) % RETRY_INTERVALS.length;
          const waitTime = RETRY_INTERVALS[intervalIndex];
          
          // Signal interval retry mode (creates pending clip like offline does)
          setTranscriptionError('network-retry');
          setIsActiveRequest(false);  // Stop spinning during wait
          
          log.info('Interval retry (scheduled)', {
            attempt: nextRetryCount + 1,
            waitMinutes: waitTime / 60000,
            reason: isTimeout ? 'timeout' : 'network error'
          });
          
          retryTimerRef.current = setTimeout(() => {
            setIsActiveRequest(true);
            setTranscriptionError(null);  // Clear error before retry
            transcribeRecording();
          }, waitTime);
          return; // Don't set isTranscribing to false yet
        }
      } else {
        // Definitive failure - non-retryable error
        const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
        setTranscriptionError(errorMessage);
        setRetryCount(0);
        setIsActiveRequest(false);
        log.error('Definitive transcription failure', { errorMessage, retriesAttempted: retryCount + 1 });
      }
    } finally {
      // Only set to false if we're not retrying
      if (!retryTimerRef.current) {
        setIsTranscribing(false);
      }
    }
  }, [audioBlob, retryCount]); // Removed transcribeRecording to prevent circular dependency

  // ============================================
  // FORCE RETRY - Tap-to-skip wait periods
  // ============================================

  const forceRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setIsActiveRequest(true);
    transcribeRecording();
  }, [transcribeRecording]);

  // ============================================
  // RESET
  // ============================================

  const reset = useCallback(() => {
    // Stop any active recording
    stopRecording();

    // Reset all state
    setAudioBlob(null);
    setAudioId(null);
    setDuration(0);
    setError(null);
    setTranscription('');
    setTranscriptionError(null);
    setIsTranscribing(false);
    setRetryCount(0);
    setIsActiveRequest(false);  // Clear icon state

    // Cancel any pending retry
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    // Clear chunks
    chunksRef.current = [];
  }, [stopRecording]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (retryTimerRef.current) {  // Clear retry timer
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Recording state
    isRecording,
    audioBlob,
    audioId,
    duration,
    error,
    audioAnalyser: audioAnalyserRef.current,

    // Transcription state
    isTranscribing,
    transcription,
    transcriptionError,
    isActiveRequest,  // Controls icon spinning

    // Actions
    startRecording,
    stopRecording,
    transcribeRecording,
    forceRetry,       // Allows tap-to-skip wait
    reset,
  };
}

