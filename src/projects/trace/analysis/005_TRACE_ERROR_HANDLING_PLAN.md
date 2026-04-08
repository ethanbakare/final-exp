# Trace — Error Handling Implementation Plan

**Status:** Planning / Not Started
**Created:** 2026-04-05
**Owner:** Ethan

---

## 1. Context & Problem Statement

Trace currently has minimal error handling. Users can submit invalid inputs (non-receipt images, silent audio, empty recordings) and the Gemini API will either hallucinate garbage data or the app will silently fail. When errors do surface, they appear as native browser `alert()` modals — visually jarring, blocking, and disconnected from the design system.

This document captures the full plan to move Trace to production-grade error handling, informed by patterns already proven in the ClipStream project.

---

## 2. Current State Audit

### 2.1 What IS handled today

| Error case | Where | Mechanism |
|---|---|---|
| Microphone permission denied | `src/pages/trace/index.tsx:70-72` | `try/catch` → `alert()` |
| localStorage JSON parse failure | `src/pages/trace/index.tsx:42-44` | `try/catch` → `console.error` |
| Wrong HTTP method on API route | `parse-receipt.ts:30-32`, `parse-voice.ts:30-32` | 405 status |
| Missing required fields | `parse-receipt.ts:43-45`, `parse-voice.ts:43-45` | 400 status |
| Invalid MIME type | `parse-receipt.ts:48-50`, `parse-voice.ts:48-50` | 400 status |
| Missing `GEMINI_API_KEY` | `geminiService.ts:15-18` | throws Error |
| Generic API failure | `geminiService.ts` (try/catch at route level) | 500 status → `alert("Failed to process...")` |
| User cancels mid-recording | `index.tsx:111-118` | State reset, chunks cleared |

### 2.2 What is NOT handled (ordered by severity)

#### 🔴 CRITICAL — Creates ghost entries / wastes API calls

| # | Error case | Current behaviour | Impact |
|---|---|---|---|
| 1 | Non-receipt image (dog, blank page, random screenshot) | Gemini returns schema-valid JSON with `{total: 0, items: [], merchant: null}` → stored as real entry dated today | Corrupts user's expense list with phantom entries |
| 2 | Silent audio recorded (mic on but user says nothing) | No size/duration check. Blob sent to Gemini → hallucinates an entry | Creates phantom entries, wastes quota |
| 3 | Empty recording sent (user pressed send without speaking) | No `audioChunksRef.current.length` check. Still hits API | Wastes API call, creates garbage entry |
| 4 | User-facing error messages use native `alert()` | Ugly, blocking, no context, breaks UX flow | Professional credibility, UX quality |

#### 🟡 MEDIUM — Degrades reliability

| # | Error case | Current behaviour | Impact |
|---|---|---|---|
| 5 | Gemini returns malformed JSON | `JSON.parse()` throws → caught as generic 500 | Generic "Failed" alert, no retry |
| 6 | Gemini API timeout (no limit set) | Hangs indefinitely | Spinner never resolves |
| 7 | Gemini returns 429 (rate limit) | Caught as generic 500 | User can't distinguish from server error |
| 8 | Gemini returns 500/502/504 | Caught as generic 500 | No retry option, no distinction |
| 9 | Network failure mid-upload | Caught, generic "Failed" alert | No network-specific copy, no retry |
| 10 | User offline when pressing send | No `navigator.onLine` check | Hits API and fails |

#### 🟢 LOW — Polish

| # | Error case | Current behaviour | Impact |
|---|---|---|---|
| 11 | Cancel recording gives no feedback | State resets silently | User doesn't know it worked |
| 12 | No visual "error" state in navbar state machine | Only idle/recording/processing | Can't show error-specific UI state |

### 2.3 Root cause summary

- **Zero Gemini response validation** — we blindly cast `response.text` as `ExpenseEntry` (TypeScript cast, not runtime validation)
- **Zero pre-send validation** — we send any blob regardless of size/content
- **Zero timeout handling** — no `AbortController` on Gemini calls
- **Zero error classification** — all errors funnel into generic 500 → generic alert
- **No toast system** — relies on `alert()` for all user-facing feedback

---

## 3. Lessons from ClipStream

ClipStream has solved most of these exact problems. Key patterns we should borrow:

### 3.1 Error classification at source

**File:** `src/projects/clipperstream/utils/transcriptionRetry.ts:165-227`

```typescript
export interface TranscriptionResult {
  text: string;
  error: 'network' | 'dns-block' | 'api-down' | 'validation' | null;
}
```

A single discriminated error type flows through the whole system. Each error kind maps to a specific UI response.

### 3.2 Pre-send audio validation

**File:** `src/projects/clipperstream/hooks/useClipRecording.ts:315-319`

```typescript
if (blobToUse.size < 100) {
  setTranscriptionError('Recording is too short. Please record at least 1 second of audio.');
  return { text: '', error: 'validation' };
}
```

Rejects blobs < 100 bytes before hitting the API. Protects quota, gives instant feedback.

### 3.3 Toast component system

**File:** `src/projects/clipperstream/components/ui/ClipToast.tsx`

Five toast variants: `CopyToast`, `AudioToast`, `ErrorToast`, `VpnToast`, `UnformattedCopyToast`. Each with its own icon, default text, and behaviour. All use a shared `ToastNotification` wrapper with:
- 3-second auto-dismiss (configurable)
- Slide-in animation from top (translateY + opacity)
- `z-index: 9999`
- Manual X dismiss button
- Queue/stacking support

### 3.4 Permanent vs temporary error states

**File:** `src/projects/clipperstream/store/clipStore.ts:10-17`

```typescript
export type ClipStatus =
  | null                 // Done
  | 'transcribing'       // In progress
  | 'pending-retry'      // Will auto-retry (temporary)
  | 'audio-corrupted'    // Permanent, don't retry
  | 'no-audio-detected'; // Permanent, don't retry
```

Distinguishes retryable errors (network/timeout) from dead-end errors (corrupted audio). Prevents infinite retry loops.

### 3.5 Server-side timeout with AbortController

**File:** `src/projects/clipperstream/utils/transcriptionRetry.ts:171`

30-second timeout with `AbortController`. On abort → classified as 'network' error → triggers retry flow.

### 3.6 Action-oriented error copy

Examples from ClipStream:
- "Recording is too short. Please record at least 1 second of audio."
- "Switch off VPN for transcription"
- "No audio detected"
- "Microphone access was denied. Please grant permission in your browser settings."

Copy tells the user **what to do next**, not just what went wrong.

---

## 4. Proposed Architecture

### 4.1 Unified error type

Create `src/projects/trace/types/errors.ts`:

```typescript
export type TraceError =
  | { kind: 'not_a_receipt' }                    // Image didn't contain a receipt
  | { kind: 'no_speech' }                         // Audio was silent / no speech detected
  | { kind: 'audio_too_short' }                   // Blob < 1000 bytes / duration < 1s
  | { kind: 'parse_failed' }                      // Gemini returned malformed JSON
  | { kind: 'empty_result' }                      // Gemini returned but items empty AND total = 0
  | { kind: 'timeout' }                           // Request exceeded 15s
  | { kind: 'network' }                           // Network unavailable / fetch failed
  | { kind: 'offline' }                           // navigator.onLine === false
  | { kind: 'api_error'; status: number }         // Gemini returned 4xx/5xx
  | { kind: 'mic_denied' }                        // getUserMedia rejected
  | { kind: 'mic_not_found' }                     // No mic hardware
  | { kind: 'mic_in_use' };                       // Another app has the mic

export interface TraceErrorDisplay {
  message: string;          // Headline shown in toast
  canRetry: boolean;        // Whether to show retry button
  retryHint?: string;       // Optional sub-text for retry action
}

export const ERROR_DISPLAY_MAP: Record<TraceError['kind'], TraceErrorDisplay> = {
  not_a_receipt:     { message: "Couldn't find a receipt in that image", canRetry: false },
  no_speech:         { message: "Didn't catch anything — try again",      canRetry: false },
  audio_too_short:   { message: "Recording too short — hold to record",   canRetry: false },
  parse_failed:      { message: "Couldn't parse that — try again",        canRetry: true  },
  empty_result:      { message: "Couldn't understand that as an expense", canRetry: false },
  timeout:           { message: "Taking too long — tap to retry",         canRetry: true  },
  network:           { message: "No connection — tap to retry",           canRetry: true  },
  offline:           { message: "You're offline — try again when connected", canRetry: false },
  api_error:         { message: "Trace is having a moment — try again",   canRetry: true  },
  mic_denied:        { message: "Enable mic access to record",            canRetry: false },
  mic_not_found:     { message: "No microphone found",                    canRetry: false },
  mic_in_use:        { message: "Microphone in use by another app",       canRetry: false },
};
```

### 4.2 Validation pipeline

**Client-side pre-send validation** (in `index.tsx` handlers):
1. Check `navigator.onLine` — if false → `{ kind: 'offline' }`
2. For audio: check `audioBlob.size >= 1000` — if false → `{ kind: 'audio_too_short' }`
3. For audio: check `audioChunksRef.current.length > 0` — if false → `{ kind: 'audio_too_short' }`

**Server-side request validation** (already done in API routes):
4. HTTP method, required fields, MIME type (keep as-is)

**Server-side Gemini call** (new, in `geminiService.ts`):
5. Wrap `generateContent` in `AbortController` with 15s timeout → on timeout → `{ kind: 'timeout' }`
6. `try/catch` on API call — classify HTTP status if known

**Server-side response validation** (new, in `geminiService.ts`):
7. `try/catch` on `JSON.parse()` — on fail → `{ kind: 'parse_failed' }`
8. Check parsed object shape:
   - If `items.length === 0 && total === 0` → `{ kind: 'empty_result' }`
   - If image-specific: check for explicit `error: 'not_a_receipt'` discriminator in response

**Gemini prompt update** (for image):
9. Add to prompt: *"If this is NOT a receipt, invoice, or bill, return `{"error": "not_a_receipt"}` instead of the expense schema."*
10. Update response schema to allow a discriminated union: either `ExpenseEntry` OR `{error: "not_a_receipt"}`

### 4.3 TraceToast component

**Location:** `src/projects/trace/components/ui/TraceToast.tsx`

Reuse the visual language we already built for `EnableModal` / `EnableBlockedToast`:
- 596px wide pill (desktop), stacks on mobile ≤640px
- `#252525` background, `rgba(255,255,255,0.7)` text at 18px Inter 400
- `border-radius: 36px` desktop / `28px` mobile
- Drop shadow matches existing toasts
- X close button on left (24×24, matches blocked toast pattern)

**Variants (via `variant` prop):**
- `error` — warning triangle icon, default red-tinted border accent
- `info` — info circle icon, default neutral
- `success` — checkmark icon (for future use)

**Props:**
```typescript
interface TraceToastProps {
  variant: 'error' | 'info' | 'success';
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  onRetry?: () => void;       // Shows retry button if provided
  autoDismissMs?: number;      // Default 4000, null = no auto-dismiss
}
```

**Behaviour:**
- Auto-dismisses after 4s (configurable)
- Clicking X closes immediately
- If `onRetry` provided, shows inline retry button (orange `#FB7232`)
- Slide-in animation from top (200ms ease-out)
- Stackable: if multiple toasts fire, they stack vertically with 8px gap

### 4.4 Trace page state additions

Add `error` state to the state machine:

```typescript
const [navbarState, setNavbarState] = useState<
  'idle' | 'recording' | 'processing_audio' | 'processing_image'
>('idle');

// NEW:
const [lastError, setLastError] = useState<TraceError | null>(null);
const [lastFailedInput, setLastFailedInput] = useState<
  | { kind: 'audio'; base64: string; mimeType: string }
  | { kind: 'image'; base64: string; mimeType: string }
  | null
>(null);
```

`lastFailedInput` enables retry without re-recording/re-selecting the file.

### 4.5 Retry handler

```typescript
const handleRetry = async () => {
  if (!lastFailedInput) return;

  setLastError(null);

  if (lastFailedInput.kind === 'audio') {
    await sendAudioToApi(lastFailedInput.base64, lastFailedInput.mimeType);
  } else {
    await sendImageToApi(lastFailedInput.base64, lastFailedInput.mimeType);
  }
};
```

---

## 5. Phased Implementation Plan

### Phase 1 — Critical fixes (high value, low effort) — **~4 hours**

**Goal:** Stop ghost entries, replace `alert()`, guard against obvious bad inputs.

- [ ] **1.1** Create `src/projects/trace/types/errors.ts` with `TraceError` type + display map
- [ ] **1.2** Build `TraceToast` component (error variant only for now)
- [ ] **1.3** Add toast to Trace page, wired to `lastError` state
- [ ] **1.4** Pre-send audio validation: reject `audioBlob.size < 1000` with `audio_too_short`
- [ ] **1.5** Pre-send audio validation: reject empty `audioChunksRef` with `audio_too_short`
- [ ] **1.6** Gemini response validation: reject `items.length === 0 && total === 0` with `empty_result`
- [ ] **1.7** Replace all 3 `alert()` calls with `setLastError(...)` → toast
- [ ] **1.8** Add `TraceToast` to Trace component showcase page

**Success criteria after Phase 1:**
- Zero native `alert()` dialogs remain
- Can't create an entry from silent audio or tiny blob
- Can't create an entry from "empty" Gemini responses

---

### Phase 2 — Resilience (medium effort) — **~6 hours**

**Goal:** Handle API/network failures gracefully with retry.

- [ ] **2.1** Wrap Gemini calls in `AbortController` with 15s timeout → return `timeout` error
- [ ] **2.2** Classify API errors by HTTP status in `geminiService.ts`:
  - 429 → `api_error` with status
  - 500/502/504 → `api_error` with status
  - Other 4xx → `api_error` with status
- [ ] **2.3** Update API routes to return structured errors (not just 500s):
  ```typescript
  res.status(200).json({ ok: false, error: { kind: 'timeout' } })
  ```
- [ ] **2.4** Client-side: parse structured error from API response
- [ ] **2.5** Store `lastFailedInput` on every failure
- [ ] **2.6** Add retry button to toast when `canRetry === true`
- [ ] **2.7** Add `navigator.onLine` check before sending
- [ ] **2.8** Add network failure detection (`fetch` throws `TypeError`) → `network` error

**Success criteria after Phase 2:**
- No infinite spinners (15s timeout enforced)
- Retryable errors show inline retry button
- User can retry same input without re-recording/re-selecting
- Offline state detected client-side

---

### Phase 3 — Image validation via Gemini prompt — **~3 hours**

**Goal:** Detect non-receipt images before creating phantom entries.

- [ ] **3.1** Update receipt parsing prompt in `geminiService.ts` to include discriminator:
  > *"If this image is NOT a receipt, invoice, or bill (e.g., it's a photo of a person, animal, screenshot, or unrelated document), return `{"error": "not_a_receipt"}` instead of the expense schema."*
- [ ] **3.2** Update Gemini response schema to union type (receipt OR error)
- [ ] **3.3** Check for `error === 'not_a_receipt'` in response handler → return `not_a_receipt` error
- [ ] **3.4** Apply equivalent pattern to voice (`no_speech` when Gemini can't parse expense content)
- [ ] **3.5** Test with 5-10 non-receipt images to validate Gemini's classification accuracy

**Success criteria after Phase 3:**
- Uploading dog photo → "Couldn't find a receipt in that image" toast, no entry
- Uploading screenshot → same
- Uploading real receipt → entry created as before

---

### Phase 4 — Polish & edge cases — **~3 hours**

**Goal:** Finish the UX, handle edge cases, add observability.

- [ ] **4.1** Add `'error'` state to navbar state machine (currently only idle/recording/processing)
- [ ] **4.2** Show cancel-recording feedback toast: *"Recording cancelled"* (info variant)
- [ ] **4.3** Classify `getUserMedia` errors: `NotAllowedError` → `mic_denied`, `NotFoundError` → `mic_not_found`, `NotReadableError` → `mic_in_use`
- [ ] **4.4** Add error logging (console.error with structured data) for debugging
- [ ] **4.5** Toast queueing: if multiple errors fire in quick succession, stack with 8px gap
- [ ] **4.6** Accessibility: add `role="alert"` and `aria-live="polite"` to toasts

**Success criteria after Phase 4:**
- Every failure state has a specific, actionable message
- Toasts are screen-reader accessible
- Edge cases documented in this file

---

## 6. Copy Reference (final)

| Error kind | Toast message | Retry? |
|---|---|---|
| `not_a_receipt` | Couldn't find a receipt in that image | No |
| `no_speech` | Didn't catch anything — try again | No |
| `audio_too_short` | Recording too short — hold to record | No |
| `parse_failed` | Couldn't parse that — try again | Yes |
| `empty_result` | Couldn't understand that as an expense | No |
| `timeout` | Taking too long — tap to retry | Yes |
| `network` | No connection — tap to retry | Yes |
| `offline` | You're offline — try again when connected | No |
| `api_error` | Trace is having a moment — try again | Yes |
| `mic_denied` | Enable mic access to record | No |
| `mic_not_found` | No microphone found | No |
| `mic_in_use` | Microphone in use by another app | No |

---

## 7. Files to Create / Modify

### New files
- `src/projects/trace/types/errors.ts` — `TraceError` type, display map
- `src/projects/trace/components/ui/TraceToast.tsx` — toast component
- `src/projects/trace/utils/validation.ts` — client-side validators (blob size, online check)

### Modified files
- `src/pages/trace/index.tsx` — wire up toasts, retry handler, `lastError` state, pre-send validation
- `src/projects/trace/services/geminiService.ts` — add `AbortController`, response validation, structured errors
- `src/pages/api/trace/parse-receipt.ts` — return structured errors, 200 with `ok: false` shape
- `src/pages/api/trace/parse-voice.ts` — same as above
- `src/pages/trace/showcase/tracecomponent.tsx` — add `TraceToast` to showcase

---

## 8. Success Criteria (overall)

By the end of Phase 4:

1. **Zero ghost entries** — no `£0.00` / no-items entries appearing from bad input
2. **Zero native alerts** — all feedback via styled toasts
3. **No wasted Gemini calls** — client-side rejects obvious invalid input (tiny blobs, offline, empty recordings)
4. **Clear recovery path** — every error tells the user what to do next
5. **Timeout protection** — spinners resolve within 15s max
6. **Retry without re-recording** — retry button re-sends the same input
7. **Accessible** — toasts use `role="alert"`, keyboard-dismissible
8. **Showcase coverage** — all 12 error variants visible in component showcase

---

## 9. Open Questions

- [ ] Should we add a "report this as a bug" link on `api_error` toasts for data collection?
- [ ] Should failed uploads be stored locally (IndexedDB) for retry across sessions, like ClipStream does?
- [ ] Should we add an error log / history page where users can see past failures?
- [ ] Rate limiting: do we want client-side throttling (max 3 submissions/minute) to prevent user from burning quota on repeated failures?

---

## 10. References

**ClipStream files to learn from:**
- `src/projects/clipperstream/utils/transcriptionRetry.ts` — retry logic, error classification
- `src/projects/clipperstream/hooks/useClipRecording.ts:315-319` — pre-send validation
- `src/projects/clipperstream/components/ui/ClipToast.tsx` — toast component pattern
- `src/projects/clipperstream/store/clipStore.ts:10-17` — error state types
- `src/pages/api/clipperstream/transcribe.ts:222-235` — server-side error classification

**Relevant existing Trace files:**
- `src/pages/trace/index.tsx` — page with all current error alerts
- `src/projects/trace/services/geminiService.ts` — where validation must be added
- `src/pages/api/trace/parse-receipt.ts` + `parse-voice.ts` — API routes
- `src/projects/new-home/components/EnableModal.tsx` — visual language to reuse for `TraceToast`
