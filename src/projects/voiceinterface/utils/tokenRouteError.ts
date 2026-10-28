/**
 * A failed call to one of our short-lived-token routes
 * (/api/voice-interface/*-token). Kept separate from microphone and
 * connection errors so the user is not told to check their microphone
 * when the server refused or could not mint a token.
 */
export class TokenRouteError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`token route returned ${status}`);
    this.name = "TokenRouteError";
    this.status = status;
  }
}

/**
 * User-facing message for a token-route failure, or null when `err` is
 * not one (the caller then shows its usual message).
 *
 * @param service what is unavailable, e.g. "Transcription" or "Voice chat"
 */
export function tokenRouteErrorMessage(
  err: unknown,
  service: string,
): string | null {
  if (!(err instanceof TokenRouteError)) return null;
  if (err.status === 429) {
    return "Too many requests. Please try again in a minute.";
  }
  return `${service} is unavailable right now. Please try again later.`;
}
