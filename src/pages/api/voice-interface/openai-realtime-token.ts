import type { NextApiRequest, NextApiResponse } from "next";
import { guardTokenRoute } from "@/lib/tokenRouteGuard";

/**
 * Ephemeral Token Endpoint for OpenAI Realtime API
 *
 * Generates short-lived client secrets to avoid exposing API key to browser.
 * Based on OpenAI Realtime WebRTC authentication pattern.
 * The response field `key` holds the short-lived client secret, never
 * OPENAI_API_KEY.
 *
 * Guarded (GET only, production Origin/Referer allowlist, per-IP rate
 * limit, no-store) because each call mints a credential that spends
 * credit.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (
    !guardTokenRoute(req, res, {
      bucket: "voice-interface/openai-realtime-token",
      limit: 5,
    })
  ) {
    return;
  }

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
      // Status only: the upstream error body is never logged or returned
      // (provider error text can quote the credential it rejected).
      console.error('OpenAI client_secrets failed with status', response.status);
      return res.status(502).json({
        error: 'Failed to generate ephemeral token',
        status: response.status
      });
    }

    const { value: ephemeralKey } = await response.json();

    if (typeof ephemeralKey !== 'string' || !ephemeralKey || ephemeralKey === apiKey) {
      return res.status(500).json({
        error: 'Failed to generate ephemeral token',
        message: 'No token returned from OpenAI API'
      });
    }

    // no-store cache headers are set by guardTokenRoute above.
    return res.status(200).json({
      key: ephemeralKey // short-lived client secret (read by VoiceRealtimeOpenAI)
    });

  } catch (err) {
    console.error('Token endpoint error:', err instanceof Error ? err.name : 'unknown error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
