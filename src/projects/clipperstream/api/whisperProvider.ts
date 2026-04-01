// src/projects/clipperstream/api/whisperProvider.ts
// TEMPORARY FILE FOR VPN TESTING - Will be replaced in Phase 4

import FormData from 'form-data';
import fetch from 'node-fetch';

export interface WhisperTranscriptionResult {
  transcript: string;
  duration: number | null;
  success: true;
}

/**
 * Transcribe audio using OpenAI Whisper API (SERVER-SIDE ONLY)
 *
 * ⚠️ SECURITY: This function MUST only be called server-side
 * API key is from process.env.OPENAI_API_KEY (NEVER exposed to client)
 *
 * @param audioBuffer - Audio data as Buffer
 * @param mimeType - MIME type (e.g., 'audio/webm')
 * @param apiKey - OpenAI API key (from process.env.OPENAI_API_KEY)
 * @returns Transcription result
 */
export async function transcribeWithWhisper(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string
): Promise<WhisperTranscriptionResult> {
  console.log('[Whisper] Starting transcription', {
    size: audioBuffer.length,
    mimeType
  });

  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('OpenAI API key is not configured');
  }

  // Validate audio data
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Empty audio buffer provided to Whisper');
  }

  // Determine file extension from MIME type
  const extension = mimeType.includes('webm') ? 'webm' :
                    mimeType.includes('wav') ? 'wav' :
                    mimeType.includes('mp3') ? 'mp3' : 'webm';

  // Create form data with audio file
  const formData = new FormData();
  formData.append('file', audioBuffer, {
    filename: `audio.${extension}`,
    contentType: mimeType,
  });
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');
  formData.append('response_format', 'json');

  // Call OpenAI Whisper API with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders(),
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Whisper] API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      // Check for specific OpenAI errors
      if (response.status === 401) {
        throw new Error('OpenAI API key is invalid (HTTP 401)');
      }
      if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded (HTTP 429)');
      }
      if (response.status === 402) {
        throw new Error('OpenAI insufficient credits (HTTP 402)');
      }
      if (response.status === 400) {
        throw new Error(`OpenAI bad request (HTTP 400): ${errorText}`);
      }

      throw new Error(`OpenAI Whisper API error (HTTP ${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const transcript = result.text || '';

    console.log('[Whisper] Transcription completed', {
      transcriptLength: transcript.length,
      preview: transcript.substring(0, 100)
    });

    // Whisper doesn't return duration, estimate from audio size
    // Rough estimate: 16kHz audio ≈ 32KB per second
    const estimatedDuration = Math.round(audioBuffer.length / 32000);

    return {
      transcript: transcript.trim(),
      duration: estimatedDuration,
      success: true,
    };

  } catch (error) {
    clearTimeout(timeoutId);

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Whisper] Transcription failed', {
      error: errorMessage,
      audioSize: audioBuffer.length
    });

    // Check for timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenAI Whisper API request timed out after 60 seconds');
    }

    // Check for network errors
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
      throw new Error('Cannot reach OpenAI API. Please check your internet connection.');
    }

    throw new Error(`Whisper transcription failed: ${errorMessage}`);
  }
}

