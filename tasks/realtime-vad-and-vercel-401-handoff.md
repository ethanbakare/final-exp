---
kind: handoff
id: 3d0a5c1f-8b2e-4b7a-9c14-e6f4c9a2d001
title: Realtime voice — Vercel 401 + local semantic-VAD hang
created: 2026-07-01T22:52+01:00
status: ACTIVE
prior_handoff: tasks/realtime-first-token-handoff.md
related:
  - tasks/HANDOFF_PROJECTS_DEPLOY.md
  - src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx
  - src/projects/trace/services/geminiService.ts
handoff_type: new-chat
---

# Realtime voice — Vercel 401 + local semantic-VAD hang

## §1. One-paragraph summary

`/voiceinterface/realtime` is broken in production (Vercel token endpoint returns 401 — invalid `OPENAI_API_KEY`) and unreliable locally (`semantic_vad` never fires `speech_stopped` on continuous speech, UI hangs in `listening`). Neither has been fixed in code yet. HEAD `25e6dd2` on `main` (branch clean, 3 ahead of `origin/main`, no realtime-page code drift between local and Vercel). Next actions in §5 — rotate Vercel env first, then a one-line VAD tweak, verify, push. Trace AI Gemini→OpenRouter migration was the session's secondary intent, scoped only, sharp edge is audio-in support on OpenRouter (§6).

## §2. Where we are right now

| Fact | Value |
| --- | --- |
| Branch | `main` |
| HEAD | `25e6dd2 docs: handoff — realtime VAD hang + Vercel OPENAI_API_KEY 401` |
| Ahead of `origin/main` | 3 commits (2 timing-system docs + this handoff) |
| Working tree | clean |
| Dev server | not running at handoff time |
| Local `.env.local` `OPENAI_API_KEY` | valid (local sessions can start conversations once past the VAD hang) |
| Vercel `OPENAI_API_KEY` | **invalid** — see §4.1 |

Realtime page code path is identical between local `HEAD` and Vercel production — no code deploy needed to fix production; only an env rotation + redeploy.

## §3. What shipped this session (commits)

| Commit | What it did | Files touched |
| --- | --- | --- |
| `25e6dd2` | Prior version of this handoff (superseded by this file) | `tasks/realtime-vad-and-vercel-401-handoff.md` |

Nothing else code-touching this session. Diagnosis + writing only. The 2 `main`-ahead commits before `25e6dd2` (`799a9f6`, `c318318`) are `docs(timing-system):` — unrelated to this handoff's scope.

## §4. Validated artifacts + load-bearing bytes

### §4.1 Live token endpoint returns 401 — proof

Verified by direct probe at handoff time:

```bash
curl -sS -X POST https://www.littleexp.com/api/voice-interface/openai-realtime-token
```

Response body verbatim (DO NOT paraphrase — this exact string identifies the key that's currently set on Vercel):

```
{"error":"Failed to generate ephemeral token","details":{"error":{"message":"Incorrect API key provided: G1F8IGc4************************************************************************************************************************************************A0oA. You can find your API key at https://platform.openai.com/account/api-keys.","type":"invalid_request_error","param":null,"code":"invalid_api_key"}}}
```

Key fingerprint: begins `G1F8IGc4`, ends `A0oA`. This is the KEY-CURRENTLY-SET, not the working key. Next session must replace with the working local `.env.local` value.

Re-verify with the same curl at first action (§10 resume message).

### §4.2 Session config that causes the local hang — verbatim source

File: `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` lines 685-697. Quoted verbatim (**DO NOT EDIT the block below — edit the source file directly**):

```ts
      const session = new RealtimeSession(agent, {
        transport,
        config: {
          audio: {
            input: {
              turnDetection: {
                type: 'semantic_vad',
                createResponse: false, // We manually send response.create after thinking delay
              },
            },
          },
        },
      });
```

No `eagerness` parameter set — SDK default applied. `semantic_vad` waits for what OpenAI's turn-detection model considers a *meaningful* end-of-turn (not just silence). Long continuous speech, flat intonation, background noise, or non-canonical pauses can leave it indefinitely waiting.

### §4.3 State-machine handler wiring

File: `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` lines 429-447. Verbatim (source pointer — edit at source):

```ts
        case 'input_audio_buffer.speech_started':
          console.log(`[TIMING +${dtNow()}ms] VAD: speech_started`);
          // Cancel pending response.create if user interrupts during thinking
          if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
            thinkingTimerRef.current = null;
            console.log('[OpenAI Realtime] Thinking cancelled — user interrupted');
          }
          setAppState('listening');
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log(`[TIMING +${dtNow()}ms] VAD: speech_stopped → sending response.create`);
          setAppState('ai_thinking');
```

If `speech_stopped` never fires (§4.2 hypothesis), `setAppState('ai_thinking')` is never reached → UI hangs.

### §4.4 Trace AI Gemini touchpoints — source pointers only

Not modified this session. All three files exist at handoff time (verified `ls -la`):

- `src/projects/trace/services/geminiService.ts` — SDK: `@google/genai` (import line 12: `GoogleGenAI, Type`). Two functions:
  - `parseReceiptImage` — model `gemini-3-flash-preview`, uses SDK-native structured-output `Type` schema
  - `parseVoiceAudio` — model `gemini-3.1-flash-lite-preview`, **audio input** (this is the sharp edge for migration — see §7.2)
- `src/pages/api/trace/parse-receipt.ts` — Next.js API route consuming `parseReceiptImage`
- `src/pages/api/trace/parse-voice.ts` — Next.js API route consuming `parseVoiceAudio`

Next session should Read these before designing the migration API.

## §5. What's next (ordered)

Each step cites the artifact to read/verify **before** acting.

1. **Verify production 401 still applies.** Run the curl in §4.1. If STATUS ≠ 401, prod may have been fixed out-of-band — re-scope before acting.
2. **Rotate Vercel `OPENAI_API_KEY`.** Vercel dashboard → project `final-exp` → Settings → Environment Variables → replace `OPENAI_API_KEY` (Production scope) with the working key from local `.env.local`. Redeploy (env changes don't hot-apply). Re-run curl → expect 200 + token JSON. Deploy workflow reference: `tasks/HANDOFF_PROJECTS_DEPLOY.md §1` (in this repo — verify the file still exists at start).
3. **Apply Option A locally.** Edit `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` around line 691-694, adding `eagerness: 'high'`:
   ```ts
                 turnDetection: {
                   type: 'semantic_vad',
                   eagerness: 'high',
                   createResponse: false,
                 },
   ```
   Verify locally with a free-form conversation (talk for 5+ seconds, pause naturally, observe UI advances to `ai_thinking`). If it still hangs, apply Option B (see §6.1).
4. **Commit + fast-forward `main` + push.** Per `tasks/HANDOFF_PROJECTS_DEPLOY.md §1`. Suggested message: `fix(realtime): semantic VAD eagerness=high to unstick listening→thinking`. Monitor deploy per that same handoff.
5. **Only after production is stable, start Trace migration.** First step: fetch OpenRouter's model list (`GET https://openrouter.ai/api/v1/models`), find the Gemini variants matching `gemini-3-flash-preview` and `gemini-3.1-flash-lite-preview`, **confirm which (if any) accept audio input**. Design API surface only after that answer is known.

## §6. Unresolved threads + alternatives considered

### §6.1 VAD fix — Option A vs Option B

**Raised:** this session, user's prompt describing "keep talking and it never switches away from listening."

- **Option A (recommended first):** add `eagerness: 'high'` to `semantic_vad`. Keeps semantic understanding, decides turn-end faster. One-line change.
- **Option B (fallback):** switch to silence-based `server_vad`:
  ```ts
                 turnDetection: {
                   type: 'server_vad',
                   threshold: 0.5,
                   prefixPaddingMs: 300,
                   silenceDurationMs: 500,
                   createResponse: false,
                 },
  ```
  Deterministic. Downside: cuts off if user pauses mid-thought.

Decision deferred to §5 step 3 verification result. If A works → ship A. If A still hangs → apply B.

### §6.2 Trace migration — keep audio path on direct Gemini SDK vs full migration

**Raised:** this session, secondary intent.

If OpenRouter's Gemini variants don't accept audio input:

- **Option X:** keep `parseVoiceAudio` on the direct `@google/genai` SDK, migrate only `parseReceiptImage` to OpenRouter. Split-cost — two SDK deps in the project.
- **Option Y:** re-architect `parseVoiceAudio` to transcribe via Whisper (or similar) first, then send text to OpenRouter's Gemini. Adds latency + a second API call.
- **Option Z:** don't migrate — keep everything on `@google/genai`. Reject the migration goal.

Requires OpenRouter model-list check before deciding.

### §6.3 Footer-enforcement mitigation — apply or not

**Raised:** this session, user flagged visible-message-duplication from Stop hook. Documented mitigation exists (touch `~/.claude/.disable-footer-enforcement`) but was never actually activated. Not applied autonomously — Rule D1 gates global-scope config changes on explicit user approval.

**Decision pending user answer** in the next reply. Not in scope for the realtime work but recorded here so next session knows the thread is open.

## §7. Known unknowns

### §7.1 Whether Option A alone will unstick the VAD

Semantic VAD with `eagerness: 'high'` may still hang on the specific speech pattern the user is producing (accent, noise environment, monologue length not verified). If it does, Option B is the fallback. This is a hypothesis-driven fix, not a proven-in-user's-env fix.

### §7.2 Whether OpenRouter's Gemini variants accept audio input

**Unverified.** I did NOT hit OpenRouter's model list this session. My prior assertion "audio-in support is spotty" is a reasonable guess based on general OpenRouter behavior, not verified fact. Next session must confirm by fetching `https://openrouter.ai/api/v1/models` and inspecting the `modalities` / `input_modalities` field for the Gemini candidates.

### §7.3 Whether the Vercel 401 has only one cause

The 401 confirms the `OPENAI_API_KEY` is invalid. It does NOT rule out other Vercel env drift (e.g., a different variable name, a scope mismatch, missing OpenAI-org header). If the env rotation + redeploy in §5 step 2 doesn't produce a 200 token response, next session should read the endpoint source at `src/pages/api/voice-interface/openai-realtime-token.ts` (verified path at handoff time) for any other env-dependent logic.

### §7.4 Whether the model IDs are still supported by OpenAI

`gemini-3-flash-preview` and `gemini-3.1-flash-lite-preview` are Google model IDs; the equivalent question for OpenAI Realtime is: what model does the current session default to, and is it still available? Not audited this session — the token endpoint returning 200 doesn't guarantee the model completion succeeds. If §5 step 2 gives 200 but conversations still fail, check the model ID.

## §8. Hard constraints in force

From `~/.claude/CLAUDE.md` (global) and project memories:

- **Never include `Co-Authored-By` lines in commit messages. Never include any `@anthropic.com` email addresses.** No exceptions. See `~/.claude/CLAUDE.md` § "Commit Rules".
- **Always commit changes when finishing an action.** Do not leave uncommitted changes. Same section.
- **Verify measured values from data before asserting them.** No numbers from memory. See `~/.claude/CLAUDE.md` § "Never report measured values from memory".
- **Verify dates via live `date` call.** See `~/.claude/CLAUDE.md` § "Live-date discipline".
- **Verify-before-applying (Rule D2).** Reviewer findings, recall, and external doc claims are never ground truth — verify at source before acting. See `~/.claude/rules/verify-before-applying.md`.
- **Compact messages in copyable code fences; do not repeat CLAUDE.md rules inside compact bodies.** See `[Compact messages in copyable code fences](/Users/ethan/.claude/projects/-Users-ethan-Documents-projects-final-exp/memory/feedback_compact_messages.md)`.
- **Reply must end at last substantive sentence.** Do not compose a closing italic date/footer. The harness appends one. See the session's `reply_closing_rule` (injected on every prompt).

## §9. Cost summary

This session: ~1 hour, diagnosis-only. Two handoff edits + one memory save + one failure-history append. Zero product code changed.

Next-session estimate for §5 steps 1-4 (Vercel + VAD): 20-40 min including verification + push + Vercel deploy monitoring. Step 5 (Trace migration scoping): additional 30-60 min just for OpenRouter model-list audit + design; execution is a separate session.

## §10. Resume message (copy-paste)

```
Read tasks/realtime-vad-and-vercel-401-handoff.md end-to-end BEFORE ANY ACTION. It is the load-bearing artifact for this session's work.

FIRST ACTION — VERIFY, DON'T TRUST:

1. Verify HEAD: `git log --oneline -1` should show `25e6dd2 docs: handoff — realtime VAD hang + Vercel OPENAI_API_KEY 401` (or a later handoff commit).
2. Verify production 401 still applies: `curl -sS -o /dev/null -w "STATUS: %{http_code}\n" -X POST https://www.littleexp.com/api/voice-interface/openai-realtime-token`. Expected: STATUS: 401. If NOT 401, prod may have been fixed out-of-band — re-scope with the user before proceeding.
3. Verify local VAD config at src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx:685-697 still shows semantic_vad without eagerness. If a peer already applied Option A, skip to step 6.

THEN, IN ORDER (per handoff §5):

4. Rotate Vercel OPENAI_API_KEY (dashboard → Settings → Env Vars) with the working key from local .env.local. Trigger a fresh production deploy. Re-run the curl → expect STATUS: 200 with a token JSON. Confirm before moving on.
5. Apply handoff §5 step 3 code change (add `eagerness: 'high'` at ~line 691). Verify locally with a free-form conversation — talk 5+ seconds, pause, watch UI advance to ai_thinking. If it still hangs, apply Option B from handoff §6.1.
6. Commit + fast-forward main + push per tasks/HANDOFF_PROJECTS_DEPLOY.md §1.
7. Only after production is stable, begin Trace Gemini→OpenRouter migration scoping per handoff §5 step 5 and §7.2 (unresolved).

OPEN THREADS (do not lose): handoff §6.1 (Option A vs B), §6.2 (Trace migration audio path), §6.3 (footer-enforcement mitigation — needs user answer separately).

KNOWN UNKNOWNS: handoff §7 lists four — verify each before treating any as resolved.
```

## §11. Cross-references

- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — realtime session component, VAD config + state machine handlers
- `src/pages/api/voice-interface/openai-realtime-token.ts` — token mint endpoint (single file, verified)
- `src/projects/trace/services/geminiService.ts` — Gemini SDK integration for Trace AI
- `src/pages/api/trace/parse-receipt.ts` — Trace receipt-parsing API route
- `src/pages/api/trace/parse-voice.ts` — Trace voice-parsing API route (audio input — see §7.2)
- `tasks/HANDOFF_PROJECTS_DEPLOY.md` — deploy workflow (fast-forward main → push → Vercel monitor)
- `tasks/realtime-first-token-handoff.md` — prior handoff on realtime page, different symptom (first-utterance-lost), same file
- `~/.claude/CLAUDE.md` — global commit rules + memory discipline
- `~/.claude/failure-history.md` § 2026-06-22 "Visible duplicate stamp..." — related to §6.3
- `/Users/ethan/.claude/projects/-Users-ethan-Documents-projects-final-exp/memory/feedback_compact_messages.md` — memory saved this session
