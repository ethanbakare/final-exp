import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Guard for routes that mint short-lived provider tokens (or proxy a
 * provider call) with a server-side secret.
 *
 * - Method check (405 otherwise).
 * - In production, the request's Origin (or, when the browser omits
 *   Origin on a same-origin GET, the Referer's origin) must be on the
 *   allowlist. The allowlist is TOKEN_ROUTE_ALLOWED_ORIGINS (comma
 *   separated, e.g. "https://example.com,https://www.example.com"),
 *   plus the Vercel-provided VERCEL_PROJECT_PRODUCTION_URL and
 *   VERCEL_URL hosts when present. No allowlist entry → every request
 *   is rejected (fail closed).
 * - Simple in-memory fixed-window rate limit per client IP and bucket.
 *   It is per server instance (a serverless platform may run several),
 *   so it caps abuse rather than enforcing an exact global quota.
 * - Cache-Control: no-store on every response, including errors.
 *
 * Returns true when the handler may continue; when it returns false it
 * has already sent the error response.
 */

export interface TokenRouteGuardOptions {
  /** Rate-limit bucket name, usually the route name. */
  bucket: string;
  /** Allowed HTTP method. Default GET. */
  method?: "GET" | "POST";
  /** Requests allowed per window per IP. Default 10. */
  limit?: number;
  /** Window length in ms. Default 60 000. */
  windowMs?: number;
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

/** Test hook: clear the in-memory rate-limit state. */
export function resetTokenRouteRateLimits(): void {
  rateBuckets.clear();
}

export function setNoStore(res: NextApiResponse): void {
  res.setHeader("Surrogate-Control", "no-store");
  res.setHeader(
    "Cache-Control",
    "s-maxage=0, no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Expires", "0");
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function clientIp(req: NextApiRequest): string {
  const forwarded = firstHeader(req.headers["x-forwarded-for"]);
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = firstHeader(req.headers["x-real-ip"]);
  if (realIp) return realIp.trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function allowedOrigins(): Set<string> {
  const out = new Set<string>();
  const raw = process.env.TOKEN_ROUTE_ALLOWED_ORIGINS ?? "";
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim().replace(/\/+$/, "");
    if (trimmed) out.add(trimmed);
  }
  for (const host of [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]) {
    if (host) out.add(`https://${host.replace(/\/+$/, "")}`);
  }
  return out;
}

function requestOrigin(req: NextApiRequest): string | null {
  const origin = firstHeader(req.headers.origin);
  if (origin && origin !== "null") return origin.replace(/\/+$/, "");
  const referer = firstHeader(req.headers.referer);
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }
  return null;
}

export function guardTokenRoute(
  req: NextApiRequest,
  res: NextApiResponse,
  options: TokenRouteGuardOptions,
): boolean {
  setNoStore(res);

  const method = options.method ?? "GET";
  if (req.method !== method) {
    res.setHeader("Allow", method);
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }

  if (process.env.NODE_ENV === "production") {
    const origin = requestOrigin(req);
    if (!origin || !allowedOrigins().has(origin)) {
      res.status(403).json({ error: "Origin not allowed" });
      return false;
    }
  }

  const limit = options.limit ?? 10;
  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();
  const key = `${options.bucket}:${clientIp(req)}`;
  const entry = rateBuckets.get(key);
  if (!entry || entry.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    entry.count += 1;
    if (entry.count > limit) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ error: "Too many requests" });
      return false;
    }
  }
  // Drop expired entries now and then so the map cannot grow forever.
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) {
      if (v.resetAt <= now) rateBuckets.delete(k);
    }
  }
  return true;
}

/**
 * Mint a short-lived Deepgram JWT via POST /v1/auth/grant.
 * Returns only { access_token, expires_in }; never the API key.
 * Throws on any upstream failure; callers return an error response.
 */
export async function mintDeepgramToken(
  apiKey: string,
  ttlSeconds = 30,
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ttl_seconds: ttlSeconds }),
  });
  if (!response.ok) {
    throw new Error(
      `Deepgram auth/grant returned ${response.status}` +
        (response.status === 403
          ? " (the API key needs Member permission or higher to mint tokens)"
          : ""),
    );
  }
  const data = (await response.json()) as {
    access_token?: unknown;
    expires_in?: unknown;
  };
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("Deepgram auth/grant returned no access_token");
  }
  if (data.access_token === apiKey) {
    throw new Error("Deepgram auth/grant echoed the API key");
  }
  return {
    access_token: data.access_token,
    expires_in: typeof data.expires_in === "number" ? data.expires_in : ttlSeconds,
  };
}
