---
kind: research
id: 7c4f9e2a-1d3b-4c8f-a2e5-f8b1d4e0c2a5
title: WebRTC connect-window UX — industry survey
created: 2026-07-02T21:59+01:00
status: COMPLETE
related:
  - tasks/realtime-first-token-handoff.md
  - tasks/realtime-vad-and-vercel-401-handoff.md
  - src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx
source: general-purpose sub-agent (background research pass, 2026-07-02)
purpose: Anchor the connect-window fix plan in industry precedent + a technical signal (WebRTC connectionstatechange) rather than intuited UX options.
---

# WebRTC connect-window UX survey

Sub-agent research pass. Report reproduced verbatim from the agent's output. Do NOT edit — verify at [source URL / recall] tags before citing as load-bearing.

## Problem shape (input to the agent)

Browser voice interface using OpenAI's Realtime API over WebRTC. On mic click, UI synchronously flips to `Listening…`. But `session.connect()` takes ~1-2s. Anything spoken during that window is captured locally but never reaches OpenAI's VAD — first utterance is lost. Subsequent utterances work fine because connection is warm. Prior fix (`014f7af` — hold at idle for 1-2s showing "Ready when you are") was reverted because it felt dead/broken.

## 1. Per-app findings

**OpenAI Realtime Playground.** Community-documented first-word-loss bug at 98% reproduction rate. Canonical fix: gate audio-send on `connectionstatechange` → `connected`, not on button click. Playground itself gates UI on connection state — mic control shows spinner-like "Connecting…" affordance, input control enabled only once data channel is open. `[recall on exact copy; behavior verified via docs]`

**Discord voice channels.** Label `RTC Connecting` in bottom-of-sidebar voice status during ICE/DTLS handshake (<1s typical). Channel row stays selected, status text carries transitional label. **Connect earcon** (short ascending tone) plays when pipeline is live. Users learn to wait for the tone. Mic not transmitting until tone fires. Buffered-early-audio NOT used — anything spoken before tone is dropped. `[recall verified against Discord's docs on the handshake sequence]`

**Zoom / Google Meet / Teams.** "Join with audio" flow uses distinct **modal micro-state**: button label flips to "Joining…" with inline spinner, mic icon rendered as disabled/greyed until media server ACKs. Meet plays short join-chime; Zoom plays "You're the only one here" TTS once audio is live. All three keep mic **muted-by-default** on join — side-steps the connect-window problem entirely because the affordance to speak isn't offered until pipeline is warm. `[recall]`

**Whereby / browser-native WebRTC.** Pre-flight device permission + peer negotiation happens on the "Knock" screen before the user enters the room. By the time the room UI renders, media is already flowing. Effectively they **hide the connect window behind a lobby**. `[recall]`

**Push-to-talk (Zello, Motorola WAVE, cellular PTT).** Universal pattern: the transmit button emits a **"go-ahead" chirp** (short beep/tone) at the moment the floor is granted and the RF/network path is live. Users are trained not to speak until the chirp. Extended-tone variants indicate ongoing negotiation ([USPTO 8,068,865](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8068865), [8,346,220](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8346220)). Oldest and most refined solution to the exact problem.

**Siri / Google Assistant / Alexa.** All three play a distinctive **listening earcon** (Siri's double-blip, Google's ascending chime, Alexa's blue-ring + tone) at the transition from "wake detected" to "capturing for STT." The earcon IS the ready-signal. Visual pulse begins on the earcon, not on wake-word detection. Buffered-early-audio IS used on-device for the wake-word window itself, but post-wake capture is gated on the earcon.

## 2. Canonical patterns

**Pattern A — Chirp-on-ready (PTT / voice-assistant lineage).** Show an intent state immediately (button pressed, subtle animation), but emit a distinctive audio+visual "go" signal at the moment the pipeline is actually live. Users conditioned to wait for the go-signal. Precedent: Zello, Motorola PTT, Siri, Alexa, Google Assistant, Discord.

**Pattern B — Buffered-early-audio (record-locally-replay-on-connect).** Start MediaRecorder immediately on click; when peer connection reaches `connected`, replay the buffered PCM through the outbound track. Precedent: no widely-known consumer example; used in some enterprise SIP softphones and briefly discussed in the OpenAI community thread as a workaround. Correctness depends on VAD accepting a spliced audio stream.

**Pattern C — Lobby / pre-warm (hide the window entirely).** Establish the connection before offering the "speak" affordance. Precedent: Whereby's Knock screen; Zoom/Meet/Teams "Join with audio" → muted-by-default. Effectively defers the affordance until the pipeline is warm.

**Pattern D — Muted-by-default (offer affordance, block the failure mode).** Connect immediately on click but keep mic gated behind a second explicit action (unmute). Connect window elapses during the "muted, connected" gap. Precedent: Zoom/Meet/Teams post-join state.

## 3. Recommendation

**Apply Pattern A (chirp-on-ready) with a light micro-affordance during the window.** Concrete shape: on click, orb immediately enters an intermediate "warming" state — subtle pulse at half amplitude, button label "Connecting…" with inline spinner co-located on the button (not blocking the orb). At `connectionstatechange === "connected"`, play a **short earcon** (60-120ms ascending blip) AND transition the orb to full-amplitude "Listening" simultaneously. The auditory event is the load-bearing ready-signal; the visual is reinforcement.

**Why over the alternatives:**
- Pattern B (buffered replay) risks VAD misinterpreting the splice and adds correctness surface.
- Pattern C requires restructuring the page around a lobby the user rejected implicitly by clicking "Record" as one action.
- Pattern D requires two clicks.
- Pattern A matches the industry lineage users are already trained on (every voice assistant, every walkie-talkie app).

**Downsides (do NOT skip):**
1. Users still lose ~200-400ms of audio if they speak instantly on chirp — the chirp itself takes wall-clock time. Acceptable but real.
2. Audio ready-signals fail for muted-tab / accessibility users; the visual transition must be equally distinctive.
3. The "warming" state re-introduces a soft version of the "Ready when you are" problem the earlier attempt failed at — mitigation: shorter-lived (spinner+label, not full sentence) and terminates in a concrete sensory event rather than fading silently.
4. Chirp fatigue on repeated interactions; consider suppressing after the first session or making it optional.

## Sources

- [OpenAI Realtime API WebRTC — first word lost (community thread)](https://community.openai.com/t/realtime-api-webrtc-first-word-consistently-lost-when-voice-feedback-enabled-98-reproduction-rate/1370816)
- [OpenAI Realtime WebRTC guide](https://developers.openai.com/api/docs/guides/realtime-webrtc)
- [webrtcHacks unofficial guide to OpenAI Realtime WebRTC](https://webrtchacks.com/the-unofficial-guide-to-openai-realtime-webrtc-api/)
- [Discord voice-connections handshake docs](https://discord.com/developers/docs/topics/voice-connections)
- [Discord Userdoccers voice-connections reference](https://docs.discord.food/topics/voice-connections)
- [USPTO 8,068,865 — PTT tone transmission](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8068865)
- [USPTO 8,346,220 — PTT signaling](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8346220)
- [How-To Geek — Google Assistant listening chime](https://www.howtogeek.com/711058/how-to-hear-a-chime-when-google-assistant-speakers-are-listening/)
