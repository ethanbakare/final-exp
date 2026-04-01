// Direct REST API implementation for Deepgram
// Bypasses SDK to avoid client state issues and get detailed error messages

/* ============================================
   INTERFACES
   ============================================ */

export interface TranscriptionResult {
  transcript: string;
  duration: number;
  error?: string;
}

/* ============================================
   CONFIGURATION
   ============================================ */

const DEBUG = process.env.NODE_ENV === 'development';
const API_TIMEOUT_MS = 30000; // 30 seconds
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

/* ============================================
   LOGGING HELPER
   ============================================ */

function log(...args: any[]) {
  if (DEBUG) {
    console.log(...args);
  }
}

function logError(...args: any[]) {
  // Always log errors, even in production (for server logs)
  console.error(...args);
}

/* ============================================
   DEEPGRAM TRANSCRIPTION (Direct REST API)
   ============================================ */

/**
 * Transcribe audio using Deepgram Nova 3 (Direct REST API)
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
  // ========================================
  // INPUT VALIDATION
  // ========================================
  
  // Validate buffer exists and is not empty
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('No audio recorded. Recording is too short or empty.');
  }
  
  // Validate API key
  if (!apiKey) {
    throw new Error('Deepgram API key is not configured');
  }
  
  // ========================================
  // SIZE VALIDATION (Enhancement 2)
  // ========================================
  
  // Check buffer size (same logic as validateAudioBlob)
  if (audioBuffer.length < 100) {
    throw new Error('Recording is too short. Please record at least 1 second of audio.');
  }
  
  if (audioBuffer.length > MAX_AUDIO_SIZE) {
    throw new Error('Recording is too large. Please keep recordings under 10MB.');
  }
  
  log('=== 🎯 DEEPGRAM DIRECT REST API CALL ===');
  log('Audio size:', audioBuffer.length, 'bytes');
  log('MIME type:', mimeType);
  log('Using direct fetch (bypassing SDK)');
  
  // ========================================
  // TIMEOUT SETUP (Enhancement 1)
  // ========================================
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    log('⏱️ Request timeout triggered after', API_TIMEOUT_MS, 'ms');
    controller.abort();
  }, API_TIMEOUT_MS);
  
  try {
    // ========================================
    // DIRECT REST API CALL
    // ========================================
    
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-3&language=en-US&smart_format=true&punctuate=true&diarize=false&utterances=false',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': mimeType,
        },
        body: audioBuffer as any, // Node.js fetch accepts Buffer, but TS types don't reflect this
        signal: controller.signal, // ← Timeout support
      }
    );
    
    // Clear timeout on successful response
    clearTimeout(timeoutId);
    
    log('✅ Deepgram response status:', response.status, response.statusText);
    
    // ========================================
    // HTTP ERROR HANDLING
    // ========================================
    
    if (!response.ok) {
      let errorDetails = '';
      
      try {
        // Try to parse error response as JSON
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData, null, 2);
        logError('❌ Deepgram API error response:', errorDetails);
      } catch (parseError) {
        // If JSON parsing fails, get text
        errorDetails = await response.text();
        logError('❌ Deepgram API error (text):', errorDetails);
      }
      
      // Throw error with HTTP status and details
      throw new Error(
        `Deepgram API error (HTTP ${response.status}): ${errorDetails || response.statusText}`
      );
    }
    
    // ========================================
    // RESPONSE PARSING
    // ========================================
    
    const result = await response.json();
    log('✅ Deepgram response received successfully');
    
    // Extract transcript from response structure
    const channel = result.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];
    const transcript = alternative?.transcript || '';
    const duration = result.metadata?.duration || 0;
    
    log('📊 Transcription details:', {
      transcriptLength: transcript.length,
      duration: duration,
      hasTranscript: !!transcript
    });
    
    // Check if transcript is empty (no speech detected)
    if (!transcript || transcript.trim() === '') {
      throw new Error('No speech detected in recording. Please try again and speak clearly.');
    }
    
    log('✅ Transcription successful');
    
    return {
      transcript: transcript.trim(),
      duration,
    };
    
  } catch (err) {
    // Clear timeout on error
    clearTimeout(timeoutId);
    
    // ========================================
    // TIMEOUT ERROR HANDLING (Enhancement 1)
    // ========================================
    
    if (err instanceof Error && err.name === 'AbortError') {
      logError('⏱️ Request timed out after', API_TIMEOUT_MS / 1000, 'seconds');
      throw new Error(
        'Transcription timeout. The request took too long. Please try again with a shorter recording.'
      );
    }
    
    // ========================================
    // COMPREHENSIVE ERROR LOGGING (Enhancement 3)
    // ========================================
    
    logError('=== 🔬 DEEPGRAM API ERROR DETAILS ===');
    logError('Error object:', err);
    logError('Error type:', err?.constructor?.name);
    logError('Error message:', err instanceof Error ? err.message : String(err));
    
    // Log all error properties
    if (typeof err === 'object' && err !== null) {
      logError('Error properties:', {
        name: (err as any).name,
        code: (err as any).code,
        status: (err as any).status,
        statusCode: (err as any).statusCode,
        errno: (err as any).errno,
        syscall: (err as any).syscall,
        cause: (err as any).cause,
        stack: DEBUG ? (err as any).stack?.split('\n').slice(0, 5) : '[hidden in production]',
      });
      
      // Log response if it exists
      if ((err as any).response) {
        logError('Error response object:', (err as any).response);
      }
      
      // Log data if it exists
      if ((err as any).data) {
        logError('Error data:', (err as any).data);
      }
    }
    
    // Check for fetch-specific errors
    if (err instanceof Error) {
      if (err.message.includes('fetch')) {
        logError('⚠️ This is a FETCH-related error');
      }
      if (err.message.includes('ECONNREFUSED')) {
        logError('⚠️ Connection refused - cannot reach Deepgram API');
      }
      if (err.message.includes('ETIMEDOUT')) {
        logError('⚠️ Connection timeout - network issue or slow response');
      }
      if (err.message.includes('ENOTFOUND')) {
        logError('⚠️ DNS lookup failed - cannot resolve api.deepgram.com');
      }
    }
    
    logError('=====================================');
    
    // ========================================
    // USER-FRIENDLY ERROR MESSAGES
    // ========================================
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    // HTTP 401 - Unauthorized
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      throw new Error('Invalid API key. Please check your Deepgram API key configuration.');
    }
    
    // HTTP 429 - Rate limit
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    // HTTP 400 - Bad request (invalid audio format)
    if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
      throw new Error('Invalid audio format. The audio file may be corrupted or in an unsupported format.');
    }
    
    // HTTP 415 - Unsupported Media Type
    if (errorMessage.includes('415') || errorMessage.includes('Unsupported Media Type')) {
      throw new Error('Audio format not supported by Deepgram API.');
    }
    
    // Connection/Network errors
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      throw new Error('Connection timeout. Please check your internet connection and try again.');
    }
    
    if (errorMessage.includes('ECONNREFUSED')) {
      throw new Error('Cannot connect to Deepgram API. Please check your internet connection.');
    }
    
    if (errorMessage.includes('ENOTFOUND')) {
      throw new Error('Cannot reach Deepgram API. Please check your internet connection.');
    }
    
    // User-friendly errors (pass through)
    if (errorMessage.includes('No speech detected') || errorMessage.includes('No audio recorded')) {
      throw err;
    }
    
    // Generic fallback with original error message
    throw new Error(`Transcription failed: ${errorMessage}`);
  }
}

/* ============================================
   VALIDATION HELPER
   ============================================ */

/**
 * Validate audio blob size before sending
 * Prevents wasting API calls on empty/invalid audio
 * 
 * Note: This is kept for backward compatibility and client-side validation.
 * The transcribeAudio() function also validates Buffer size server-side.
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
  if (blob.size > MAX_AUDIO_SIZE) {
    return {
      valid: false,
      error: 'Recording is too large. Please keep recordings under 10MB.'
    };
  }
  
  return { valid: true };
}
