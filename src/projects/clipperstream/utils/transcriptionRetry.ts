// ✅ FIXED: Added missing import
import { logger } from './logger';

const log = logger.scope('TranscriptionRetry');

// ✅ FIXED: Export types for use in other files
export interface TranscriptionResult {
  text: string;
  error: 'network' | 'dns-block' | 'api-down' | 'validation' | null;
}

export interface RetryOptions {
  maxRapidAttempts: number;   // Always 3
  useIntervals: boolean;      // false for live, true for pending
  onProgress?: (attempt: number, total: number) => void;
}

/**
 * Attempt transcription with retry logic
 *
 * Used by:
 * - Live recordings: 3 rapid attempts only
 * - Pending clips: 3 rapid + interval attempts
 *
 * Status behavior (set by caller, not this function):
 * - Caller sets status='transcribing' before calling this
 * - Status stays 'transcribing' throughout all rapid attempts (1-3)
 * - Status stays 'transcribing' throughout interval waits and attempts (4-6)
 * - After this returns with error, caller sets status='pending-retry'
 *
 * Future enhancement: Add callbacks for status updates during interval waits
 * to show 'retry-pending' between attempts, 'transcribing' during attempts
 *
 * NOTE: Circuit breaker will be added in v1.50
 * For now, this is basic retry logic only
 *
 * Returns: { text, error }
 */
export async function attemptTranscription(
  audioBlob: Blob,
  options: RetryOptions
): Promise<TranscriptionResult> {

  const { maxRapidAttempts, useIntervals, onProgress } = options;

  // ============================================
  // PHASE 1: RAPID ATTEMPTS (3 times, immediate)
  // Status stays 'transcribing' throughout all 3 attempts
  // ============================================

  for (let attempt = 1; attempt <= maxRapidAttempts; attempt++) {
    log.info('Rapid attempt', { attempt, max: maxRapidAttempts });

    if (onProgress) {
      onProgress(attempt, maxRapidAttempts);
    }

    const result = await transcribeSingle(audioBlob);

    // SUCCESS
    if (result.text && result.text.length > 0) {
      log.info('Transcription succeeded', { attempt });
      return result;
    }

    // DNS/VPN ERROR - Bail out immediately (all retries will fail)
    if (result.error === 'dns-block') {
      log.warn('DNS error detected (VPN), stopping retries');
      return result;
    }

    // API DOWN - Log and continue
    // NOTE: Circuit breaker (v1.50) will add Whisper fallback here
    if (result.error === 'api-down') {
      log.warn('API down detected', { attempt });
      // Continue to next attempt
    }

    // OFFLINE - Fast-path optimization
    // NOTE: navigator.onLine can have false positives (router with no internet)
    // but NO false negatives (if it says offline, we ARE offline)
    // Use as optimization to avoid wasted fetch when definitely offline
    // ✅ SSR-safe: check typeof navigator first
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      log.info('navigator.onLine is false, likely offline');
      return { text: '', error: 'network' };
    }
  }

  // All rapid attempts failed
  log.warn('All rapid attempts failed');

  // ============================================
  // PHASE 2: INTERVAL ATTEMPTS (if enabled)
  // Status stays 'transcribing' during waits AND attempts
  // Future: Add callback to switch to 'retry-pending' during waits
  // ============================================

  if (!useIntervals) {
    log.info('Intervals disabled (live recording), stopping');
    return { text: '', error: 'network' };
  }

  // Intervals: 30s, 1min, 2min
  // NOTE: Fixed intervals chosen over exponential backoff for predictable UX
  const intervals = [30000, 60000, 120000];

  for (let i = 0; i < intervals.length; i++) {
    const waitTime = intervals[i];
    const attempt = maxRapidAttempts + i + 1;

    log.info('Waiting before interval attempt', {
      attempt,
      waitSeconds: waitTime / 1000
    });

    // NOTE: Status stays 'transcribing' during this wait
    // Future enhancement: caller could set 'retry-pending' here via callback
    await sleep(waitTime);

    // Check if still online before attempting (optimization)
    // ✅ SSR-safe: check typeof navigator first
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      log.info('Offline during wait, stopping');
      return { text: '', error: 'network' };
    }

    if (onProgress) {
      onProgress(attempt, maxRapidAttempts + intervals.length);
    }

    const result = await transcribeSingle(audioBlob);

    // SUCCESS
    if (result.text && result.text.length > 0) {
      log.info('Interval attempt succeeded', { attempt });
      return result;
    }

    // DNS/VPN ERROR
    if (result.error === 'dns-block') {
      log.warn('DNS error detected during intervals');
      return result;
    }

    // API DOWN - Log and continue
    // NOTE: Circuit breaker (v1.50) will add Whisper fallback here
    if (result.error === 'api-down') {
      log.warn('API down during interval attempt', { attempt });
      // Continue to next attempt
    }
  }

  // All attempts exhausted
  log.error('All retry attempts exhausted');
  return { text: '', error: 'network' };
}

/**
 * Single transcription attempt (no retry logic)
 * Classifies errors and returns result
 *
 * ✅ FIXED: DNS errors now detected server-side, not client-side
 */
async function transcribeSingle(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch('/api/clipperstream/transcribe', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'unknown' }));
      const status = response.status;

      // ✅ FIXED: DNS error detection now happens SERVER-SIDE
      // Server returns 503 with error: 'dns-block' when it can't reach Deepgram
      if (errorData.error === 'dns-block' || status === 503) {
        return { text: '', error: 'dns-block' };
      }

      // API key issues - treat as API down
      if (status === 401 || status === 402) {
        return { text: '', error: 'api-down' };
      }

      // API down (server errors)
      if (status === 500 || status === 502 || status === 504) {
        return { text: '', error: 'api-down' };
      }

      // Validation or unknown errors
      return { text: '', error: 'validation' };
    }

    const data = await response.json();

    if (!data.success || !data.transcript) {
      return { text: '', error: 'validation' };
    }

    return { text: data.transcript, error: null };

  } catch (error) {
    // Timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return { text: '', error: 'network' };
    }

    // Network error (can't reach API route)
    if (error instanceof TypeError) {
      return { text: '', error: 'network' };
    }

    // Unknown error
    log.error('Unknown transcription error', error);
    return { text: '', error: 'validation' };
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

