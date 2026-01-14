import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Mock Transcription API Endpoint (Phase 0)
 *
 * Returns hardcoded transcription for testing.
 * Will be replaced with real transcription API in Phase 2.
 */

type TranscriptionResponse = {
  text: string;
  confidence?: number;
  timestamp: number;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranscriptionResponse | ErrorResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simulate processing delay (1-2 seconds)
    const delay = Math.random() * 1000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Mock transcription responses (rotate through different messages)
    const mockTranscriptions = [
      "This is a test transcription from the voice interface demo.",
      "The quick brown fox jumps over the lazy dog.",
      "Hello world! This is a mock transcription result.",
      "Testing the voice interface with multiple variations.",
      "Demonstrating the text box layout with scrollable content and fade overlays."
    ];

    // Pick a random transcription
    const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
    const text = mockTranscriptions[randomIndex];

    // Return mock response
    res.status(200).json({
      text,
      confidence: 0.95,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Mock API error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
}
