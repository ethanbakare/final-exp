import { DeepgramResponse, TranscriptionResult } from '../types/SpeechConfidenceTypes';

// ========================
// CONFIGURATION
// ========================

// Confidence thresholds for categorization
const CONFIDENCE_THRESHOLDS = {
  high: 0.9,   // 90%
  medium: 0.7  // 70%
};

// ========================
// DEEPGRAM API PROCESSING
// ========================

/**
 * Process audio buffer through DeepGram API
 */
export async function processAudioWithDeepgram(
  audioBuffer: Buffer, 
  mimeType: string,
  apiKey: string
): Promise<TranscriptionResult> {
  try {
    // Prepare request for Deepgram API
    const url = 'https://api.deepgram.com/v1/listen';
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': mimeType
      },
      body: audioBuffer
    };
    
    // Send request to Deepgram
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deepgram API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    // Process the Deepgram response
    return processDeepgramResponse(data as DeepgramResponse);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    throw new Error(`Failed to process audio with Deepgram: ${errorMessage}`);
  }
}

/**
 * Process DeepGram response into application format
 */
export function processDeepgramResponse(response: DeepgramResponse): TranscriptionResult {
  if (!response.results?.channels?.[0]?.alternatives?.[0]) {
    return {
      transcript: '',
      words: [],
      lowConfidenceWords: []
    };
  }

  const alternative = response.results.channels[0].alternatives[0];
  const transcript = alternative.transcript || '';
  const words = alternative.words || [];

  const processedWords = words.map(word => {
    const category = categorizeConfidence(word.confidence);
    return {
      word: word.word,
      confidence: word.confidence,
      category
    };
  });

  // Extract words with low confidence
  const lowConfidenceWords = words
    .filter(word => word.confidence < CONFIDENCE_THRESHOLDS.medium)
    .map(word => ({
      word: word.word,
      confidence: word.confidence
    }))
    .sort((a, b) => a.confidence - b.confidence);

  return {
    transcript,
    words: processedWords,
    lowConfidenceWords
  };
}

/**
 * Categorize confidence score
 */
export function categorizeConfidence(score: number): 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_THRESHOLDS.high) {
    return 'high';
  } else if (score >= CONFIDENCE_THRESHOLDS.medium) {
    return 'medium';
  } else {
    return 'low';
  }
} 