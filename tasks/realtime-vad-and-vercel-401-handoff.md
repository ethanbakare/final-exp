# Realtime voice — Vercel 401 + local semantic-VAD hang — handoff

**Status:** two open issues, both diagnosed, neither fixed yet.
**Branch / HEAD:** `main` at `799a9f6` (2 commits ahead of
`origin/main`, both timing-system doc-only; no realtime page code
divergence between local and Vercel).

---

## 0. TL;DR — what the user reported

1. **Production (`littleexp.com/voiceinterface/realtime`) shows
   "Failed to start conversation. Please check your microphone" in
   every browser they tried.** The mic-error framing is misleading.
2. **Local (`localhost` dev server, /voiceinterface/realtime) hangs
   in `listening` state during a conversation.** User can talk, but
   the UI never advances to `ai_thinking` — sometimes recovers on
   Stop → Start, sometimes requires a full page reload.
3. Both are the SAME page — production and local run identical realtime
   code (the two `main`-ahead commits are `docs(timing-system)` only,
   nothing in `src/`).

Session intent stated at start: *audit little-exp voice projects +
plan Gemini→OpenRouter migration for Trace AI, est 1h*. This handoff
covers only the voice audit half; Trace migration was scoped but not
started (see §4).

---

## 1. Production issue — Vercel `OPENAI_API_KEY` is invalid

**Verified by direct probe:**

```
curl -sS -X POST https://www.littleexp.com/api/voice-interface/openai-realtime-token
```

returns HTTP 401 with:

```
{"error":"Failed to generate ephemeral token","details":{"error":{
  "message":"Incorrect API key provided: G1F8IGc4************…************A0oA.
             You can find your API key at https://platform.openai.com/account/api-keys.",
  "type":"invalid_request_error","param":null,"code":"invalid_api_key"}}}
```

The key currently set in Vercel env (`G1F8IGc4…A0oA`) is rejected by
OpenAI. Almost certainly rotated / superseded by whatever's in the
user's local `.env.local` (which works locally). The frontend catches
the failure and renders the generic "Please check your microphone"
banner — misleading, but the network layer is where it actually breaks.

**Fix:** rotate the Vercel env var and redeploy.

1. Vercel dashboard → project `final-exp` → Settings → Environment
   Variables.
2. Replace `OPENAI_API_KEY` (Production scope) with the working key
   from local `.env.local`.
3. Trigger a fresh production deploy (env changes don't hot-apply to
   running deployments; a redeploy is required).
4. Re-run the curl above; expect 200 with an ephemeral token.

Deploy workflow reference: [HANDOFF_PROJECTS_DEPLOY.md §1](HANDOFF_PROJECTS_DEPLOY.md).

---

## 2. Local issue — semantic VAD hangs on continuous speech

**Session config** ([VoiceRealtimeOpenAI.tsx:685-697](../src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx#L685-L697)):

```ts
const session = new RealtimeSession(agent, {
  transport,
  config: {
    audio: {
      input: {
        turnDetection: {
          type: 'semantic_vad',
          createResponse: false, // manual response.create after gate
        },
      },
    },
  },
});
```

State-machine wiring
([VoiceRealtimeOpenAI.tsx:429-471](../src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx#L429-L471)):

- `input_audio_buffer.speech_started` → `setAppState('listening')`,
  cancels pending thinking timer.
- `input_audio_buffer.speech_stopped` → `setAppState('ai_thinking')`,
  schedules `response.create` after `THINKING_GATE_MS` (currently 0).

**Hypothesis (fits the symptom exactly):** `semantic_vad` waits for
what OpenAI's turn-detection model considers a *meaningful end-of-
turn* — not just silence. Long continuous streams, flat intonation,
background noise, or non-canonical pause shapes can leave semantic
VAD indefinitely waiting. `speech_stopped` never fires → UI sits in
`listening` forever → user must stop and restart to reset the session.

Matches the user's report: "I keep talking and it never switches away
from listening mode to thinking mode. It is until I literally stop it
and then try again that it then works."

## 3. Proposed fix — two options, one-line change either way

**Option A (recommended first) — eager semantic VAD**

```ts
turnDetection: {
  type: 'semantic_vad',
  eagerness: 'high',
  createResponse: false,
},
```

Keeps semantic understanding, just decides turn-ends faster.

**Option B — switch to server-side silence VAD**

```ts
turnDetection: {
  type: 'server_vad',
  threshold: 0.5,
  prefixPaddingMs: 300,
  silenceDurationMs: 500,
  createResponse: false,
},
```

Deterministic, silence-based, no LLM guessing. Downside: cuts off if
user pauses mid-thought.

Neither change was applied in this session — user asked to compact
and hand off before making the edit. When ready, edit
`src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx`
around line 691, verify with a local recorded conversation, commit
with a scoped message (something like
`fix(realtime): semantic VAD eagerness=high to unstick listening→thinking`).

---

## 4. Trace AI Gemini → OpenRouter migration (scoped, not started)

Was the second half of the session intent. Scoped but not executed
because voice audit consumed the hour.

**Current Gemini touchpoints** — all in
[`src/projects/trace/services/geminiService.ts`](../src/projects/trace/services/geminiService.ts):

- `parseReceiptImage` — model `gemini-3-flash-preview`, structured
  output via `Type` schema (SDK-native).
- `parseVoiceAudio` — model `gemini-3.1-flash-lite-preview`, audio
  input, structured output.
- SDK: `@google/genai` (line 12 import: `GoogleGenAI, Type`).

**Consumed by:**

- `src/pages/api/trace/parse-receipt.ts`
- `src/pages/api/trace/parse-voice.ts`

**Migration considerations** — surfaced but not resolved:

1. **Audio input is the sharp edge.** OpenRouter's Gemini exposure is
   mostly text + image; audio-in support is spotty. Need to hit
   OpenRouter's model list to confirm which Gemini variant accepts
   audio before designing against the API. If none: keep
   `parseVoiceAudio` on the direct SDK OR reroute through Whisper
   transcription + text prompt.
2. **Structured output shape differs.** `@google/genai` uses a native
   `responseSchema` field with the `Type` enum. OpenRouter uses
   OpenAI-style `response_format: { type: "json_schema", ... }`. All
   schema declarations need translation.
3. **Base64 media delivery differs.** SDK takes inline parts
   (`{inlineData: {mimeType, data}}`); OpenRouter takes
   `image_url: { url: "data:<mime>;base64,<data>" }` in a chat
   completion. Two request shapes to rewrite.

Before implementing, first step must be: query OpenRouter's model list
for the two model families in use, confirm audio-in support, then
design the API surface. Design first, migrate second.

---

## 5. Key facts / verified state

- Local branch `main` is 2 commits ahead of `origin/main`. Both ahead
  commits are `docs(timing-system):` — realtime page code is identical
  between local and Vercel.
- Local `.env.local` OPENAI_API_KEY works (local conversation succeeds
  once bypassing the VAD hang; production 401 confirms Vercel's key is
  the broken one, not the code).
- Nebularr / Kyoto Realtime / Coral / Harbor profiles all render fine
  on both realtime and realtime-states pages (from prior handoffs and
  no reported regressions).
- Prior related handoff:
  [realtime-first-token-handoff.md](realtime-first-token-handoff.md)
  — different symptom (first-utterance-lost regression), same page.

---

## 6. What to do next (order matters)

1. **Rotate Vercel `OPENAI_API_KEY`** and redeploy → verify with the
   curl in §1. Unblocks all littleexp.com voice users.
2. **Apply Option A** (eager semantic VAD) locally, verify a
   free-form conversation reaches `ai_thinking` reliably. If it still
   hangs on some cases, apply Option B.
3. **Commit + fast-forward + push** per the standard deploy workflow
   (HANDOFF_PROJECTS_DEPLOY.md §1). Monitor via Vercel MCP if
   available; otherwise curl the token endpoint and click through the
   page in incognito.
4. **Only then start Trace migration** — begin by fetching
   OpenRouter's model list and confirming audio-in support before any
   code change.

---

## 7. Uncommitted / dirty state at handoff time

Working tree clean at HEAD `799a9f6`. No pending edits.
