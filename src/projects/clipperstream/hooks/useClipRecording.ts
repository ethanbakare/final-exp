import { useState, useRef, useCallback, useEffect } from 'react';

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
  duration: number;
  error: string | null;
  audioAnalyser: AnalyserNode | null;
  
  // Transcription state
  isTranscribing: boolean;
  transcription: string;
  transcriptionError: string | null;
  
  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  transcribeRecording: () => Promise<void>;
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
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // ============================================
  // TRANSCRIPTION STATE
  // ============================================
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  
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
      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: mimeType });
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
  }, []);
  
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
  
  const transcribeRecording = useCallback(async () => {
    if (!audioBlob) {
      setTranscriptionError('No audio to transcribe');
      return;
    }
    
    // Validate audio blob size
    if (audioBlob.size < 100) {
      setTranscriptionError('Recording is too short. Please record at least 1 second of audio.');
      return;
    }
    
    setIsTranscribing(true);
    setTranscriptionError(null);
    
    try {
      // Prepare form data
      const formData = new FormData();
      const fileName = `recording-${Date.now()}.webm`;
      formData.append('audio', audioBlob, fileName);
      
      console.log(`Sending audio for transcription: ${audioBlob.size} bytes`);
      
      // Send to API
      const response = await fetch('/api/clipperstream/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      // Handle errors
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Transcription failed');
      }
      
      // Validate response
      if (!data.transcript || typeof data.transcript !== 'string') {
        throw new Error('Invalid response from transcription service');
      }
      
      // Set transcription
      setTranscription(data.transcript);
      console.log('Transcription successful:', data.transcript.substring(0, 100) + '...');
      
    } catch (err) {
      console.error('Transcription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to transcribe audio';
      setTranscriptionError(errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  }, [audioBlob]);
  
  // ============================================
  // RESET
  // ============================================
  
  const reset = useCallback(() => {
    // Stop any active recording
    stopRecording();
    
    // Reset all state
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    setTranscription('');
    setTranscriptionError(null);
    setIsTranscribing(false);
    
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
    };
  }, []);
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // Recording state
    isRecording,
    audioBlob,
    duration,
    error,
    audioAnalyser: audioAnalyserRef.current,
    
    // Transcription state
    isTranscribing,
    transcription,
    transcriptionError,
    
    // Actions
    startRecording,
    stopRecording,
    transcribeRecording,
    reset,
  };
}

