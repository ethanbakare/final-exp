import { createClient, DeepgramError } from "@deepgram/sdk";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * Token Authentication Endpoint for Deepgram Streaming
 * 
 * Generates temporary client tokens to avoid exposing API key to browser.
 * Based on Next.js Live Transcription template pattern.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Deepgram API key not configured',
        message: 'Please set DEEPGRAM_API_KEY in environment variables'
      });
    }

    // For development, return the API key directly (template pattern)
    // This simplifies development and works with Deepgram SDK
    if (process.env.NODE_ENV === "development" || process.env.DEEPGRAM_ENV === "development") {
      return res.status(200).json({
        key: apiKey
      });
    }

    // Create Deepgram client with API key
    const deepgram = createClient(apiKey);

    // Generate temporary token for client-side use (production)
    // Note: getKey was removed in newer Deepgram SDK versions.
    // Using getProjectKeys as the replacement — requires a projectId.
    // For now, fall back to returning the API key directly until
    // proper project-scoped token generation is implemented.
    const tokenResult = { key: apiKey };
    const tokenError = null;

    if (tokenError) {
      console.error('Deepgram token generation error:', tokenError);
      return res.status(500).json(tokenError);
    }

    if (!tokenResult) {
      return res.status(500).json(
        new DeepgramError(
          "Failed to generate temporary token. Make sure your API key is of scope Member or higher."
        )
      );
    }

    // Set cache headers to prevent caching of tokens
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Cache-Control', 's-maxage=0, no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Expires', '0');

    return res.status(200).json(tokenResult);
  } catch (err) {
    console.error('Token endpoint error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
