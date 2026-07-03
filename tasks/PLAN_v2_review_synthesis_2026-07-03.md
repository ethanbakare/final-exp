---
kind: review-synthesis
title: Cross-family review synthesis — PLAN_2026-07-02_realtime-connect-window-fix.md v2
created: 2026-07-03T11:52+01:00
reviewers:
  - Claude plan-reviewer (Partition B) — agent af9e501f10779d01a
  - Codex direct-companion (Partition A) — bash bcmcicjih, thread 019f279a-49a2-7741-981f-f318f6c39107
rule: B2.d (cross-family two-SAFE gate) — CONVERGENT on 3 load-bearing findings
plan_under_review: tasks/PLAN_2026-07-02_realtime-connect-window-fix.md
plan_head: 4cd7c45
verified_via: per-claim source verification against VoiceRealtimeOpenAI.tsx, VoiceStateLabel.tsx, realtimeSession.d.ts, openaiRealtimeWebRtc.js
---

## Convergent findings (BOTH models flagged — highest confidence)

### C-1 — F-8 guard race: useEffect-mirror ref lags the click handler
- **Claude Crit-1** + **Codex Major-2** agree.
- Root cause: `useEffect(() => { ref.current = state; }, [state])` runs on next React commit, not synchronously inside the click handler. In the window between Stop's `setIsConversationActive(false)` and effect commit, an awaited `session.connect()` can resolve — the post-await block reads `isConversationActiveRef.current === true` and fires the phantom "Listening…" transition + chime.
- **Load-bearing fix (v3):** imperative ref writes at every state boundary in Start/Stop paths. Better shape: **per-start `runIdRef`** — increment on every Start; capture as local `myRunId`; every post-await checkpoint compares `runIdRef.current === myRunId` before mutating state.

### C-2 — 6s timeout leaks an orphan session; Promise.race is UI-timeout not connect-abort
- **Claude Crit-2 + Major-3** + **Codex Major-1** agree.
- Root cause: `RealtimeSessionConnectOptions` (verified at `node_modules/@openai/agents-realtime/dist/realtimeSession.d.ts:79-97`) has NO AbortSignal, no cancellation token. Promise.race on timeout returns to catch; the underlying SDK connect is still in-flight and eventually resolves — the SDK's data channel opens against a torn-down UI, media tracks orphan.
- **Load-bearing fix (v3):** on timeout OR error, capture the local `session` binding and call `try { session.close(); } catch {}` inside the catch block. Also null `sessionRef.current` at start (so late resolve's own cleanup is a no-op). The `runIdRef` pattern from C-1 also guards late resolve — post-await checkpoint sees the invalidated run-id and returns.

### M-1 (load-bearing to UVO) — `session.connect()` resolution ≠ VAD-ready
- **Codex Major-3** flagged; **Claude Finding 8** independently surfaced the wrongness-check gap.
- Root cause: SDK's `openaiRealtimeWebRtc.js:124` resolves connect() on data channel `open`; `updateSessionConfig(...)` at line 131 is NOT awaited before `resolve()`. Server may not have session config live when the chime fires.
- **UVO risk:** plan promises "first thing user says AFTER the chime reaches OpenAI's VAD reliably" — if VAD isn't actually ready at chime, UVO fails silently. §7.2 defers this but the finding says defer is wrong given UVO.
- **v3 decision needed:** either (a) accept and add an empirical AC-9 that surfaces this if it happens (session.connect() → chime → user says X → no response = fail; escalate to `connectionstatechange` or first `input_audio_buffer.speech_started` event as ready-signal); OR (b) promote §7.2 to in-scope now.

## Claude-only findings

### M-2 — Chime clicks instead of chirps on backgrounded-tab return
- Fire-and-forget `ctx.resume().catch(...)` while immediately scheduling on frozen `ctx.currentTime`: envelope math applied to a paused clock; when resume completes, entire envelope replays instantaneously as a click.
- **Fix:** `await ctx.resume()` if suspended (then schedule). Or accept the click and document.

### M-3 — Option 1 button gate targets the wrong handler
- Verified at `voicemorphingbuttons.tsx:2387-2394`: during warming `isConversationActive === true`, so `state='recording'` and the button calls `onStopClick`, NOT `onRecordClick`. Option 1's `onRecordClick={isConnecting ? undefined : ...}` gate is a no-op. Clicks during warming fire Stop → F-8 path.
- **v3 decision:** either drop option 1 entirely (Stop-during-warming is fine, handled by run-id guard) OR use option 2 (`disabled={isConnecting}` on `MorphingRecordWideSimple` — verified accepts it).

### M-4 — AC-6a lists an impossible failure mode
- "orb-jumping-to-listening-before-chime" — can't happen: §6 shows `setAppState('listening')` and `playConnectChime(ctx)` are synchronous, adjacent lines. Remove from AC.

### Minor
- Dots animation muted on first cycle due to keyed re-mount + fadeIn overlap (Finding 4).
- Line-number drift in §6 note: "716-720" vs "720-726" — actual is 716-727.
- Estimate `["2h","4h"]` vs body `2-4h impl + 30-60min verify` (2.5-5h).
- §2 claim "5 orb components" needs re-grep — Rule D3.

## Codex-only

### Minor — timeout not reflected in §3 state table or AC
- §7.4 committed 6s timeout in-scope but §3 transitions and §9 AC don't include a `connect-timeout` row.

## v3 shape (proposed)

1. **New §2.1 (run-id pattern)**: `runIdRef` incremented on every Start; captured locally; checked at every post-await checkpoint. Replaces the isConversationActiveRef mirror as the correctness gate.
2. **§6 rewritten**: imperative `runIdRef.current = ++runIdRef.current` at try-entry, capture `myRunId`, all post-await blocks (post-getUserMedia, post-token, post-connect) check `runIdRef.current === myRunId` before mutating state.
3. **§6 catch/timeout paths**: explicitly `try { session.close(); } catch {}` on local session binding.
4. **§5 chime**: `await ctx.resume()` before scheduling.
5. **§6 button-gate**: drop option 1; use option 2 (`disabled={isConnecting}`) OR accept Stop-during-warming as valid + rely on run-id guard.
6. **§7.2**: decision — defer with AC-9 escalation trigger, OR promote to in-scope.
7. **§9 AC**: rewrite AC-6a; add AC-9 (session.connect resolve → chime → immediate speech → AI response = pass; no response after 3 trials = §7.2 promote).
8. **§3 state table**: add `connect-timeout` row.
9. **Minors**: fix consumer-count claim via re-grep, reconcile estimate, drop AC-6a impossible mode.

## Verified evidence citations (Rule D2 audit)

- `node_modules/@openai/agents-realtime/dist/realtimeSession.d.ts:79-97` — `RealtimeSessionConnectOptions = { apiKey, model?, url?, callId? }`. No AbortSignal. ✓
- `node_modules/@openai/agents-realtime/dist/openaiRealtimeWebRtc.js:124` — resolve on data channel `open`. ✓
- `node_modules/@openai/agents-realtime/dist/openaiRealtimeWebRtc.js:131` — `updateSessionConfig(...)` not awaited. ✓
- `VoiceRealtimeOpenAI.tsx:385-386` — existing `appStateRef` mirror pattern. ✓
- `VoiceRealtimeOpenAI.tsx:761` — `setIsConversationActive(false)` fires late in Stop cleanup. ✓
- `voicemorphingbuttons.tsx:2387-2394` — button state logic; during `isConversationActive` true, `state='recording'`, click routes to `onStopClick`. ✓
- `voicemorphingbuttons.tsx:2377` — `disabled?: boolean` prop accepted. ✓
