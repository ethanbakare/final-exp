# Realtime first-time-to-token regression — handoff

**Status:** open. Diagnostic instrumentation in place; awaiting timing data from a fresh-reload conversation to confirm the bottleneck before applying a fix.

**Branch / HEAD:** `main` at `5ff985e` (`diag(realtime): timing checkpoints to debug first-time-to-token regression`).

---

## What the user is reporting

On `/voiceinterface/realtime`:

1. **First utterance is lost.** Fresh reload → click Record → say "oh hello" → no AI response. UI stays in `listening`.
2. **Second utterance gets a response BUT the UI lags.** After the second utterance, the AI eventually responds, but the UI sits in `ai_thinking` for ~2 seconds AFTER audio is audibly playing before flipping to `ai_speaking`. The orb is frozen during that gap.
3. **Subsequent utterances and responses work in sync.** The whole problem is specifically *first-time-to-token*.
4. **User believes this didn't exist before the radial-states migration** (commits 6d77fda onward, May 11). Working state: somewhere on or before commit `19dc15a` (May 7).

Reproduces across all three currently-pinned profiles (Tube, Coral, one radial).

---

## What we know about the code path

`src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — `handleStartConversation`:

```
[click Record]
  setIsConversationActive(true)
  setAppState('listening')           ← UI claims "listening" immediately
  new AudioContext / ctx.resume
  await getUserMedia (mic permission, fast after first grant)
  createMediaStreamSource → micAnalyser
  audioEl = document.createElement('audio'); autoplay = true
  audioEl.addEventListener('playing', …)  ← sets up AI analyser + promotes to ai_speaking
  setInterval(audioPoll, 16ms)
  new OpenAIRealtimeWebRTC({ audioElement, mediaStream })
  new RealtimeAgent + RealtimeSession (semantic_vad, createResponse: false)
  setupSessionEventListeners(session)
  await fetch('/api/voice-interface/openai-realtime-token')
  await session.connect({ apiKey })  ← WebRTC handshake, real "OpenAI is now listening"
```

VAD config is `semantic_vad` with `createResponse: false`. We manually send `response.create` from inside `transport_event` after `input_audio_buffer.speech_stopped`, gated by `THINKING_GATE_MS = 0`.

State transitions:
- `idle → listening`: synchronous on click, before any await
- `listening → ai_thinking`: on `input_audio_buffer.speech_stopped`
- `ai_thinking → ai_speaking`: on `<audio>` element's `playing` event (primary, via my fix `a2e8ac8`) OR on `output_audio_buffer.started` (fallback, idempotent)
- `ai_speaking → listening`: on `output_audio_buffer.stopped`

Audio polling at 60 fps reads from the AI analyser when state is `ai_speaking`, mic analyser when state is `listening`, otherwise silent. So if state is stuck in `ai_thinking` while audio is playing, the orb sees zero audio data and appears frozen.

---

## Two hypotheses for the lag

1. **First-cycle data-channel cold start.** WebRTC delivers media (the actual sound) over an RTP media track and JSON events over a separate SCTP data channel. On the first response of a session, the SCTP stream + OpenAI's server-side first-response init both pay cold-start cost. The audio bytes can be flowing on the media track (and the `<audio>` element starts decoding/playing them) while the explicit `output_audio_buffer.started` data-channel event arrives 1–2s later. Subsequent responses don't show this because both pipelines are warm.
2. **First-cycle session-connect window.** `session.connect()` resolves only after the WebRTC negotiation completes. On a fresh page that's 600 ms–2 s. The UI shows `listening` synchronously on click, so anything spoken during that window is captured locally for the orb visualiser but not yet flowing to OpenAI — first utterance lost.

These are two distinct first-cycle latencies but both produce the symptoms the user reports.

---

## What we've tried (and where we landed)

| Commit | What it did | Status |
|---|---|---|
| `a2e8ac8` | Promote to `ai_speaking` on `<audio>.playing` instead of (only) `output_audio_buffer.started`. Closes the hypothesised media-vs-data-channel gap for bug 2. | **In, kept.** |
| `014f7af` | Hold orb at `idle` until `session.connect()` resolves, only then flip to `listening`. Closes the hypothesised session-not-ready gap for bug 1. | **Reverted in `4473353`.** User didn't like the 1–2 s of "Ready, when you are" while connection negotiates. Wants the original synchronous-flip-to-listening UX back. |
| `5ff985e` | Added `[TIMING +N ms]` console logs at every measurable phase of the first round trip (click, mic, token, connect, speech_started, speech_stopped, output_audio_buffer.started, `<audio>` playing). Pure instrumentation, no behaviour change. | **In, kept.** Use to diagnose. |

So the current state:
- `<audio>.playing` is the primary signal for `ai_thinking → ai_speaking` (a2e8ac8). On the suspect that data-channel events lag on first response, the media-pipeline signal should land sooner.
- The Record click still synchronously flips UI to `listening` (Bug 1 fix reverted). First utterance during the connect window is still lost if `session.connect()` is the bottleneck.
- Console logs every phase in ms-since-click so we can see the real bottleneck instead of guessing.

---

## Git archaeology already done

Only one non-trivial commit touched `VoiceRealtimeOpenAI.tsx` between "pre-radial-states (May 7)" and "today":

- **`6c8fb60`** (May 11) `feat(realtime): surface radial profiles on realtime voice page` — added:
  1. `radial` variant to the `LoadedOrb` discriminated union (compile-time only)
  2. Third `Promise.allSettled` fetch for `radial-states` profiles on page mount (parallel with the existing two)
  3. `frequencyData: dataArray` field on `getAudioDataFromAnalyser`'s return (shared buffer reference)

None of those touch the WebRTC connect, VAD config, or response-trigger path. The token endpoint (`/api/voice-interface/openai-realtime-token`) hasn't been touched since `4a38a44` (May 2026). The `semantic_vad` + `createResponse: false` config hasn't changed since `53b1e29`.

So **if** this is a real regression introduced during the radial-states period, it isn't from a code change to the realtime page. Two outstanding possibilities:
- The OpenAI Agents SDK was updated at some point (an `npm install` somewhere) and now has different first-response timing. **Worth checking** — run `npm ls @openai/agents-realtime` and diff against an earlier `package-lock.json`.
- The issue pre-existed and only got noticed recently. The user's mental model has it tied to radial-states, but that might be coincidence with intensified testing.

---

## Pre-radial-states experiment (just run)

User asked to temporarily check out `19dc15a` (May 7, last commit before radial-states migration) to see if the first-time-to-token issue reproduces on that snapshot. They tested, then asked to return to `main` (now back at `5ff985e`). **The result of that test isn't recorded yet** — the user said "we tried it, and that's okay" without specifying whether the bug was present or absent on the old snapshot. **Get that result before continuing.** It's the single biggest signal:

- If the bug **did** reproduce on `19dc15a`: this is a pre-existing issue, not introduced by radial-states work. The fix is purely about handling first-cycle latencies the right way. Move forward with diagnostic logs + Bug 1 fix re-applied if reasonable.
- If the bug **did not** reproduce on `19dc15a`: something between then and now introduced it. The radial-states work didn't touch the connect path, so suspect changes to SDK / package-lock. Compare `package-lock.json` between `19dc15a` and `main`.

---

## Next steps

1. **Confirm pre-radial test outcome** from the user. Single fact, biggest unknown.
2. **Have the user run one fresh-reload conversation with the diagnostic logs on.** Paste the `[TIMING +N ms]` block back. Phase durations will reveal the bottleneck directly:
   - If `session.connect()` resolves > 800 ms after click and first `speech_started` arrives before it: bug 1 root-caused (connect bottleneck).
   - If `<audio> playing` arrives ~immediately after `speech_stopped` but `output_audio_buffer.started` arrives 2 s later: bug 2 root-caused (data-channel cold start) — and the `a2e8ac8` fix is already correct.
   - If both events arrive together but ~2 s after `speech_stopped`: that's just OpenAI's first-response generation latency, no fix possible client-side beyond pre-warming the session.
3. **If pre-radial reproduction differed** from current: diff `package-lock.json` for SDK-version drift. `git diff 19dc15a..main -- package-lock.json | grep -A 2 -B 2 'agents-realtime\|openai'`.
4. **Once data is in**, decide whether to re-apply Bug 1 fix with a different UX (e.g. show a brief connecting affordance on the Record button without changing the orb's idle visual). The user's stated preference was: don't show "Ready when you are" for an extra 1–2 s. Any fix that delays the `setAppState('listening')` MUST be paired with a visual cue that something is happening.

---

## Files touched in the open investigation

- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — primary file. Has the `<audio>.playing` ai_speaking transition (a2e8ac8) and timing logs (5ff985e). All other changes (014f7af, the Bug 1 hold) were reverted.

Nothing else in the realtime/blob-orb/coral path was modified for this investigation.

---

## Reverting cleanly if needed

The investigation has produced two commits that are still in:
- `a2e8ac8` — `<audio>.playing` fix. Behavioural change. **Revert with `git revert a2e8ac8`** if you want to roll back to the original `output_audio_buffer.started`-only path.
- `5ff985e` — diagnostic logs. Pure instrumentation, no behaviour. Safe to keep until investigation closes; revert with `git revert 5ff985e` for clean removal afterwards.

Reverted earlier (do not need to touch):
- `014f7af` — was the Bug 1 fix, already reverted in `4473353`.
