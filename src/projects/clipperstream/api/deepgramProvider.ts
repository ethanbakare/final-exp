import { createClient } from '@deepgram/sdk';

// Deepgram Provider for Clipstream
// Wraps Deepgram SDK for audio transcription using Nova 3 model
// Following AI Confidence Tracker pattern but without word-level confidence

/* ============================================
   INTERFACES
   ============================================ */

export interface TranscriptionResult {
  transcript: string;
  duration: number;
  error?: string;
}

/* ============================================
   DEEPGRAM TRANSCRIPTION
   ============================================ */

/**
 * Transcribe audio using Deepgram Nova 3
 * @param audioBuffer - Audio file buffer
 * @param mimeType - MIME type of audio (e.g., 'audio/webm')
 * @param apiKey - Deepgram API key
 * @returns Transcription result with full text and duration
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string
): Promise<TranscriptionResult> {
  // Validate inputs
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('No audio recorded. Recording is too short or empty.');
  }
  
  if (!apiKey) {
    throw new Error('Deepgram API key is not configured');
  }
  
  try {
    // Initialize Deepgram client
    const deepgram = createClient(apiKey);
    
    // Transcribe using Nova 3 model
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: 'nova-3',           // Latest Nova 3 model
        language: 'en-US',         // English (US)
        smart_format: true,        // Automatic formatting (paragraphs, punctuation)
        punctuate: true,           // Add punctuation
        diarize: false,            // Single speaker (no speaker separation needed)
        utterances: false,         // Don't split into utterances
      }
    );
    
    // Handle Deepgram API errors
    if (error) {
      throw new Error(`Deepgram API error: ${error.message || 'Unknown error'}`);
    }
    
    // Extract transcript from response
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const duration = result?.metadata?.duration || 0;
    
    // Check if transcript is empty (no speech detected)
    if (!transcript || transcript.trim() === '') {
      throw new Error('No speech detected in recording. Please try again and speak clearly.');
    }
    
    return {
      transcript: transcript.trim(),
      duration,
    };
    
  } catch (err) {
    // Handle various error types
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    // Provide user-friendly error messages
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      throw new Error('Invalid API key. Please check your Deepgram API key configuration.');
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      throw new Error('Connection timeout. Please check your internet connection and try again.');
    }
    
    if (errorMessage.includes('No speech detected') || errorMessage.includes('No audio recorded')) {
      // Re-throw user-friendly errors as-is
      throw err;
    }
    
    // Generic fallback
    throw new Error(`Transcription failed: ${errorMessage}`);
  }
}

/**
 * Validate audio blob size before sending
 * Prevents wasting API calls on empty/invalid audio
 */
export function validateAudioBlob(blob: Blob): { valid: boolean; error?: string } {
  // Check if blob exists
  if (!blob) {
    return {
      valid: false,
      error: 'No audio recorded'
    };
  }
  
  // Check minimum size (100 bytes is very conservative)
  if (blob.size < 100) {
    return {
      valid: false,
      error: 'Recording is too short. Please record at least 1 second of audio.'
    };
  }
  
  // Check maximum size (10MB)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (blob.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'Recording is too large. Please keep recordings under 10MB.'
    };
  }
  
  return { valid: true };
}

