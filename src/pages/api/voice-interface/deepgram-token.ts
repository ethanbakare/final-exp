import type { NextApiRequest, NextApiResponse } from "next";
import { guardTokenRoute, mintDeepgramToken } from "@/lib/tokenRouteGuard";

/**
 * Short-lived Deepgram token for browser live streaming.
 *
 * The server calls POST https://api.deepgram.com/v1/auth/grant with the
 * DEEPGRAM_API_KEY and returns only { access_token, expires_in } (a JWT
 * valid for 30 s; Deepgram only checks it when the WebSocket opens).
 * The API key itself is never returned, in any environment. If minting
 * fails the route returns an error, never the key.
 *
 * Client: createClient({ accessToken }) — @deepgram/sdk v4 sends it as
 * the WebSocket subprotocol ["bearer", <jwt>].
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!guardTokenRoute(req, res, { bucket: "voice-interface/deepgram-token" })) {
    return;
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Deepgram API key not configured" });
  }

  try {
    const token = await mintDeepgramToken(apiKey, 30);
    return res.status(200).json(token);
  } catch (err) {
    console.error(
      "Deepgram token mint failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return res.status(502).json({ error: "Failed to create Deepgram token" });
  }
}
