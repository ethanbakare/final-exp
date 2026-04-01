import { NextApiRequest, NextApiResponse } from "next";

/**
 * Ephemeral Token Endpoint for OpenAI Realtime API
 *
 * Generates short-lived client secrets to avoid exposing API key to browser.
 * Based on OpenAI Realtime WebRTC authentication pattern.
 *
 * Pattern: Mirrors deepgram-token.ts structure for consistency
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'Please set OPENAI_API_KEY in environment variables'
      });
    }

    // Create ephemeral token via OpenAI Client Secrets API
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 600 }, // 10 minutes
        session: {
          type: "realtime",
          model: "gpt-realtime",
          instructions: "You are a friendly, conversational assistant. Keep responses concise and natural.",
          audio: {
            output: {
              voice: "marin" // Options: alloy, echo, fable, onyx, nova, shimmer, marin
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI token generation error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to generate ephemeral token',
        details: errorData
      });
    }

    const { value: ephemeralKey } = await response.json();

    if (!ephemeralKey) {
      return res.status(500).json({
        error: 'Failed to generate ephemeral token',
        message: 'No token returned from OpenAI API'
      });
    }

    // Set cache headers to prevent token caching (same as deepgram-token)
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Cache-Control', 's-maxage=0, no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Expires', '0');

    return res.status(200).json({
      key: ephemeralKey // Consistent with deepgram-token response format
    });

  } catch (err) {
    console.error('Token endpoint error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
