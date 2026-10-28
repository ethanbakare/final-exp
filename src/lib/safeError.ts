/**
 * Server-side helpers so provider (upstream) error text never reaches a
 * browser response or a log line. Provider error bodies and SDK error
 * messages can quote request data or the credential they rejected, so
 * routes log and return only an error name and an HTTP status.
 */

/** Thrown for a non-OK provider response. The message holds the status only. */
export class UpstreamHttpError extends Error {
  readonly status: number;

  constructor(service: string, status: number) {
    super(`${service} API error (HTTP ${status})`);
    this.name = "UpstreamHttpError";
    this.status = status;
  }
}

/** HTTP status carried by an error, if any (our errors, SDK errors, axios errors). */
export function upstreamStatusOf(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
  };
  for (const v of [e.status, e.statusCode, e.response?.status]) {
    if (typeof v === "number" && v >= 100 && v <= 599) return v;
  }
  return undefined;
}

/** Log-safe description of an error: its name and status, never its message. */
export function errorSummary(err: unknown): { name: string; status?: number } {
  const name =
    err instanceof Error ? err.name : err === null ? "null" : typeof err;
  const status = upstreamStatusOf(err);
  return status === undefined ? { name } : { name, status };
}
