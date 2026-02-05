# OpenAI Realtime API - Event System & Audio Visualization Fix Plan

**Created:** 2026-02-05
**Status:** READY TO IMPLEMENT
**Priority:** CRITICAL — States don't transition, orb doesn't respond to AI audio

---

## Problem Statement

The VoiceRealtimeOpenAI component has three critical issues:

1. **ALL event names are wrong** — The code uses raw OpenAI Realtime API event names directly on `session.on()`, but the `@openai/agents-realtime` SDK's `RealtimeSession` does NOT emit those events. It emits its own high-level events. Result: state label stays on "Listening" forever, orb never transitions to thinking/speaking.

2. **Orb doesn't respond to AI audio** — The `audioService` only captures microphone input. There's no mechanism to capture/analyze the AI's audio output for visualization.

3. **Duplicate mic capture** — The SDK captures the mic internally via WebRTC (`getUserMedia`), and our `audioService.startMic()` creates a second, separate mic capture. This is wasteful and can cause issues on some devices.

---

## Part 1: SDK Architecture (How It Actually Works)

### Transport Layer

The `@openai/agents-realtime` SDK defaults to **WebRTC** in the browser.

**Source:** `node_modules/@openai/agents-realtime/dist/realtimeSession.mjs` lines 82-91:
```javascript
if ((typeof options.transport === 'undefined' && hasWebRTCSupport()) ||
    options.transport === 'webrtc') {
    this.#transport = new OpenAIRealtimeWebRTC();
}
```

The WebRTC transport (`OpenAIRealtimeWebRTC`):
- Creates an `RTCPeerConnection`
- Captures the mic via `navigator.mediaDevices.getUserMedia({ audio: true })`
- Creates an internal `<audio>` element and connects AI audio to it via `ontrack`
- Creates a data channel (`oai-events`) for sending/receiving JSON events
- All raw Realtime API events flow through this data channel

**Source:** `node_modules/@openai/agents-realtime/dist/openaiRealtimeWebRtc.mjs` lines 160-171:
```javascript
// Audio playback setup
const audioElement = this.options.audioElement ?? document.createElement('audio');
audioElement.autoplay = true;
peerConnection.ontrack = (event) => {
    audioElement.srcObject = event.streams[0];
};
// Mic capture
const stream = this.options.mediaStream ??
    (await navigator.mediaDevices.getUserMedia({ audio: true }));
peerConnection.addTrack(stream.getAudioTracks()[0]);
```

### Event System Architecture

The SDK has THREE layers of events:

#### Layer 1: Raw Realtime API Events (data channel)
These are the standard OpenAI Realtime API events (same for WebSocket and WebRTC):
- `input_audio_buffer.speech_started`
- `input_audio_buffer.speech_stopped`
- `output_audio_buffer.started`
- `output_audio_buffer.stopped`
- `response.created`
- `response.done`
- `response.output_audio.delta`
- `response.output_audio.done`
- `response.output_audio_transcript.delta`
- `response.output_audio_transcript.done`
- `conversation.item.input_audio_transcription.completed`
- `error`
- etc.

#### Layer 2: Transport Layer Events (session.transport)
The transport layer parses raw events and emits its own typed events:
- `turn_started` → maps from `response.created`
- `turn_done` → maps from `response.done`
- `audio` → raw PCM ArrayBuffer (WebSocket only, NOT fired in WebRTC)
- `audio_done` → maps from `response.output_audio.done`
- `audio_transcript_delta` → transcript chunks
- `audio_interrupted` → user interrupted AI
- `connection_change` → connecting/connected/disconnected
- `item_update` → conversation items added/updated
- `*` → wildcard, ALL raw events pass through

#### Layer 3: RealtimeSession Events (what we listen to)
The `RealtimeSession` class listens to transport events and emits high-level events:

| Session Event | Fired When | Source |
|---|---|---|
| `audio_start` | First audio chunk from AI | transport `audio` event |
| `audio_stopped` | AI audio generation done | transport `audio_done` event |
| `audio` | Raw audio data (ArrayBuffer) | transport `audio` event (WebSocket ONLY) |
| `agent_start` | AI starts processing response | transport `turn_started` event |
| `agent_end` | AI finishes response | transport `turn_done` event |
| `history_added` | New conversation item | transport `item_update` event |
| `history_updated` | Full history changed | transport `item_update` event |
| `transport_event` | **ANY raw API event** | transport `*` wildcard |
| `error` | Error occurred | transport `error` event |
| `guardrail_tripped` | Output guardrail triggered | internal |

**Source:** `node_modules/@openai/agents-realtime/dist/realtimeSession.mjs` lines 438-536

**CRITICAL:** The `transport_event` is a passthrough of ALL raw API events. This is how we access events like `input_audio_buffer.speech_stopped` that don't have dedicated session-level events.

**Source:** `realtimeSession.mjs` line 439-440:
```javascript
this.#transport.on('*', (event) => {
    this.emit('transport_event', event);
});
```

---

## Part 2: What's Currently Wrong

### File: `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx`

#### Wrong Event Names (lines 104-164)

Every single event name in `setupSessionEventListeners` is wrong:

| Current (WRONG) | What It Should Be | Why It's Wrong |
|---|---|---|
| `session.on('input_audio_buffer.speech_stopped', ...)` | `session.on('transport_event', ...)` + check `event.type` | Raw API event, not a session event |
| `session.on('input_audio_transcription.completed', ...)` | `session.on('transport_event', ...)` + check `event.type` | Raw API event, not a session event |
| `session.on('response.audio.started', ...)` | `session.on('audio_start', ...)` | Wrong name; correct session event exists |
| `session.on('response.audio_transcript.delta', ...)` | `session.on('transport_event', ...)` + check `event.type` | Raw API event, not a session event |
| `session.on('response.audio_transcript.done', ...)` | `session.on('transport_event', ...)` + check `event.type` | Raw API event, not a session event |
| `session.on('response.audio.done', ...)` | `session.on('audio_stopped', ...)` | Wrong name; correct session event exists |
| `session.on('response.done', ...)` | `session.on('agent_end', ...)` | Wrong name; correct session event exists |
| `session.on('connected', ...)` | Not available on session | Transport-layer only |
| `session.on('disconnected', ...)` | Not available on session | Transport-layer only |

#### Duplicate Mic Capture (line 177)

```typescript
await audioService.startMic(); // Creates SECOND mic capture
```

The SDK already captures the mic at `openaiRealtimeWebRtc.mjs:167-170`. This creates two separate `getUserMedia` calls.

#### No AI Audio Analysis

There's no mechanism to get audio data from the AI's speech for orb visualization. The `audioService.getAudioData()` only returns mic frequency data.

---

## Part 3: Implementation Plan

### Step 1: Create Custom WebRTC Transport with Our Own Audio Element and MediaStream

Instead of letting the SDK create its own internal audio element and mic capture, we provide our own so we can analyze both streams.

**What to do:**

```typescript
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC } from '@openai/agents-realtime';

// We create these ourselves so we can tap into them
const audioElement = document.createElement('audio');
audioElement.autoplay = true;

// Capture mic once, share with SDK and our analyser
const micStream = await navigator.mediaDevices.getUserMedia({
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
});

// Create transport with our audio element and mic stream
const transport = new OpenAIRealtimeWebRTC({
  audioElement: audioElement,
  mediaStream: micStream,
});

// Create session with custom transport
const agent = new RealtimeAgent({ name: "VoiceAssistant", instructions: "..." });
const session = new RealtimeSession(agent, { transport });
await session.connect({ apiKey: ephemeralKey });
```

**Why this works:**
- `audioElement` option: SDK uses our element instead of creating its own (line 161 of WebRTC transport)
- `mediaStream` option: SDK uses our stream instead of calling getUserMedia again (line 167-170)
- We can now connect both streams to Web Audio API AnalyserNodes

**Imports available (confirmed exported):**
```typescript
// node_modules/@openai/agents-realtime/dist/index.mjs line 4:
export { OpenAIRealtimeWebRTC } from "./openaiRealtimeWebRtc.mjs";
```

### Step 2: Set Up Web Audio API Analysers for Both Streams

**Mic audio analyser (for listening state visualization):**

```typescript
const audioContext = new AudioContext();

// Mic analyser - for user voice visualization
const micSource = audioContext.createMediaStreamSource(micStream);
const micAnalyser = audioContext.createAnalyser();
micAnalyser.fftSize = 2048;
micAnalyser.smoothingTimeConstant = 0.8;
micSource.connect(micAnalyser);
// Don't connect to destination - SDK handles playback via WebRTC
```

**AI audio analyser (for AI speaking state visualization):**

```typescript
// AI analyser - tap into the remote stream after connection
// The audioElement.srcObject is set by the SDK's ontrack handler
const setupAiAnalyser = () => {
  const remoteStream = audioElement.srcObject as MediaStream;
  if (!remoteStream) return null;

  const aiSource = audioContext.createMediaStreamSource(remoteStream);
  const aiAnalyser = audioContext.createAnalyser();
  aiAnalyser.fftSize = 2048;
  aiAnalyser.smoothingTimeConstant = 0.8;
  aiSource.connect(aiAnalyser);
  aiAnalyser.connect(audioContext.destination); // Play the AI audio
  return aiAnalyser;
};
```

**IMPORTANT:** The `audioElement.srcObject` is set asynchronously by the SDK when the WebRTC `ontrack` fires. We need to wait for the audio element to have a source before creating the AI analyser. We can listen for the `playing` event on the audio element, or set it up when we first enter the `ai_speaking` state.

**Extracting frequency data (same pattern as existing audioService):**

```typescript
function getAudioDataFromAnalyser(analyser: AnalyserNode, sampleRate: number): AudioData {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  const binCount = analyser.frequencyBinCount;

  const getAverage = (minFreq: number, maxFreq: number) => {
    const minBin = Math.floor((minFreq * binCount) / (sampleRate / 2));
    const maxBin = Math.floor((maxFreq * binCount) / (sampleRate / 2));
    let sum = 0, count = 0;
    for (let i = minBin; i <= maxBin; i++) { sum += dataArray[i]; count++; }
    return count > 0 ? sum / count / 255 : 0;
  };

  const bass = getAverage(20, 150);
  const mid = getAverage(150, 2000);
  const treble = getAverage(2000, 8000);

  let rms = 0;
  for (let i = 0; i < dataArray.length; i++) { rms += (dataArray[i] / 255) ** 2; }
  rms = Math.sqrt(rms / dataArray.length);

  return { bass, mid, treble, rms };
}
```

### Step 3: Fix Event Listeners

Replace the entire `setupSessionEventListeners` function:

```typescript
const setupSessionEventListeners = (session: RealtimeSession) => {
  console.log('[OpenAI Realtime] Setting up event listeners...');

  // --- State Detection via transport_event (raw API events) ---

  session.on('transport_event', (event: any) => {
    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        console.log('[OpenAI Realtime] User started speaking');
        setAppState('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('[OpenAI Realtime] User stopped speaking (VAD)');
        setAppState('ai_thinking');
        break;

      case 'output_audio_buffer.started':
        console.log('[OpenAI Realtime] AI audio playback started');
        // More precise than audio_start for actual playback
        break;

      case 'output_audio_buffer.stopped':
        console.log('[OpenAI Realtime] AI audio playback stopped');
        // More precise than audio_stopped for actual playback end
        break;

      case 'conversation.item.input_audio_transcription.completed':
        console.log('[OpenAI Realtime] User transcript:', event.transcript);
        break;

      case 'response.output_audio_transcript.delta':
        // AI transcript streaming - useful for logging
        break;

      case 'response.output_audio_transcript.done':
        console.log('[OpenAI Realtime] AI transcript:', event.transcript);
        break;

      case 'session.created':
        console.log('[OpenAI Realtime] Session created');
        break;
    }
  });

  // --- High-level session events ---

  session.on('audio_start', () => {
    console.log('[OpenAI Realtime] AI started generating audio');
    setAppState('ai_speaking');
    // Switch to AI analyser for orb visualization
  });

  session.on('audio_stopped', () => {
    console.log('[OpenAI Realtime] AI stopped generating audio');
    setAppState('listening');
    // Switch back to mic analyser for orb visualization
  });

  session.on('agent_start', () => {
    console.log('[OpenAI Realtime] Agent started processing');
    // Could also use this for thinking state, but speech_stopped is earlier
  });

  session.on('agent_end', (_ctx: any, _agent: any, output: string) => {
    console.log('[OpenAI Realtime] Agent finished, output:', output);
  });

  session.on('error', (error: any) => {
    console.error('[OpenAI Realtime] Session error:', error);
    setError('Connection error. Please try again.');
    setAppState('idle');
    setIsConversationActive(false);
  });
};
```

### Step 4: Update Audio Polling to Switch Between Analysers

```typescript
// Refs
const micAnalyserRef = useRef<AnalyserNode | null>(null);
const aiAnalyserRef = useRef<AnalyserNode | null>(null);
const audioContextRef = useRef<AudioContext | null>(null);
const audioElementRef = useRef<HTMLAudioElement | null>(null);
const micStreamRef = useRef<MediaStream | null>(null);

// In the polling interval, pick the right analyser based on state
audioIntervalRef.current = setInterval(() => {
  const ctx = audioContextRef.current;
  if (!ctx) return;

  let data: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };

  if (appStateRef.current === 'ai_speaking' && aiAnalyserRef.current) {
    data = getAudioDataFromAnalyser(aiAnalyserRef.current, ctx.sampleRate);
  } else if (appStateRef.current === 'listening' && micAnalyserRef.current) {
    data = getAudioDataFromAnalyser(micAnalyserRef.current, ctx.sampleRate);
  }
  // For idle and ai_thinking, data stays zeroed (orb breathes/pulses without audio input)

  setAudioData(data);
}, 16); // 60fps
```

**NOTE:** We need a ref for appState to use inside the interval (closures capture stale state):
```typescript
const appStateRef = useRef<AppState>('idle');
// Update ref whenever state changes:
useEffect(() => { appStateRef.current = appState; }, [appState]);
```

### Step 5: Update handleStartConversation

```typescript
const handleStartConversation = async () => {
  console.log('[OpenAI Realtime] Starting conversation...');
  try {
    setIsConversationActive(true);
    setAppState('listening');
    setError('');

    // 1. Create AudioContext
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // 2. Capture mic ONCE (shared with SDK)
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    micStreamRef.current = micStream;

    // 3. Create mic analyser
    const micSource = ctx.createMediaStreamSource(micStream);
    const micAnalyser = ctx.createAnalyser();
    micAnalyser.fftSize = 2048;
    micAnalyser.smoothingTimeConstant = 0.8;
    micSource.connect(micAnalyser);
    micAnalyserRef.current = micAnalyser;

    // 4. Create audio element for AI output
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioElementRef.current = audioEl;

    // 5. Set up AI analyser when remote stream arrives
    audioEl.addEventListener('playing', () => {
      if (!aiAnalyserRef.current && audioEl.srcObject) {
        const aiSource = ctx.createMediaStreamSource(audioEl.srcObject as MediaStream);
        const aiAnalyser = ctx.createAnalyser();
        aiAnalyser.fftSize = 2048;
        aiAnalyser.smoothingTimeConstant = 0.8;
        aiSource.connect(aiAnalyser);
        aiAnalyser.connect(ctx.destination); // Play AI audio through speakers
        aiAnalyserRef.current = aiAnalyser;
        console.log('[Audio] AI analyser connected');
      }
    });

    // 6. Start polling audio data at 60fps
    audioIntervalRef.current = setInterval(() => {
      const currentCtx = audioContextRef.current;
      if (!currentCtx) return;
      let data: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };
      if (appStateRef.current === 'ai_speaking' && aiAnalyserRef.current) {
        data = getAudioDataFromAnalyser(aiAnalyserRef.current, currentCtx.sampleRate);
      } else if (appStateRef.current === 'listening' && micAnalyserRef.current) {
        data = getAudioDataFromAnalyser(micAnalyserRef.current, currentCtx.sampleRate);
      }
      setAudioData(data);
    }, 16);

    // 7. Create custom transport with our audioElement and micStream
    const transport = new OpenAIRealtimeWebRTC({
      audioElement: audioEl,
      mediaStream: micStream,
    });

    // 8. Create agent and session
    const agent = new RealtimeAgent({
      name: "VoiceAssistant",
      instructions: "You are a friendly, conversational assistant. Keep responses concise and natural.",
    });
    agentRef.current = agent;

    const session = new RealtimeSession(agent, { transport });
    sessionRef.current = session;

    // 9. Set up event listeners BEFORE connecting
    setupSessionEventListeners(session);

    // 10. Get ephemeral token and connect
    const response = await fetch('/api/voice-interface/openai-realtime-token');
    if (!response.ok) throw new Error(`Failed to get token: ${response.statusText}`);
    const data_token = await response.json();
    const ephemeralKey = data_token.key;
    if (!ephemeralKey) throw new Error('No ephemeral token received');

    await session.connect({ apiKey: ephemeralKey });
    console.log('[OpenAI Realtime] Connected, listening...');

  } catch (err) {
    console.error('[OpenAI Realtime] Error:', err);
    setError('Failed to start conversation. Please check your microphone.');
    setAppState('idle');
    setIsConversationActive(false);
    cleanupAudio();
  }
};
```

### Step 6: Update handleStopConversation

```typescript
const handleStopConversation = () => {
  console.log('[OpenAI Realtime] Stopping conversation...');

  // 1. Stop audio polling
  if (audioIntervalRef.current) {
    clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = null;
  }

  // 2. Close OpenAI session (synchronous - calls transport.close() internally)
  if (sessionRef.current) {
    try {
      sessionRef.current.close();
      console.log('[OpenAI Realtime] Session closed');
    } catch (err) {
      console.error('[OpenAI Realtime] Error closing session:', err);
    }
    sessionRef.current = null;
    agentRef.current = null;
  }

  // 3. Clean up audio resources
  cleanupAudio();

  // 4. Update UI state
  setIsConversationActive(false);
  setAppState('idle');
  setAudioData({ bass: 0, mid: 0, treble: 0, rms: 0 });
  setError('');
  console.log('[OpenAI Realtime] Cleanup complete');
};

const cleanupAudio = () => {
  // Stop mic stream tracks
  if (micStreamRef.current) {
    micStreamRef.current.getTracks().forEach(track => {
      track.stop();
      console.log('[Audio] Mic track stopped:', track.label);
    });
    micStreamRef.current = null;
  }

  // Disconnect analysers
  if (micAnalyserRef.current) {
    micAnalyserRef.current.disconnect();
    micAnalyserRef.current = null;
  }
  if (aiAnalyserRef.current) {
    aiAnalyserRef.current.disconnect();
    aiAnalyserRef.current = null;
  }

  // Close audio context
  if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
    audioContextRef.current.close();
    audioContextRef.current = null;
  }

  // Clean up audio element
  if (audioElementRef.current) {
    audioElementRef.current.pause();
    audioElementRef.current.srcObject = null;
    audioElementRef.current = null;
  }
};
```

### Step 7: Remove audioService Dependency

The existing `audioService` (from blob-orb) is no longer needed. We handle all audio capture and analysis directly in the component. Remove:

```typescript
// REMOVE this import:
import { audioService, AudioData } from '../services/audioService';

// KEEP the AudioData type (import from types instead):
import { AudioData } from '../types';
```

The `AudioData` type is: `{ bass: number; mid: number; treble: number; rms: number; }`

---

## Part 4: Complete State Flow (After Fix)

```
User clicks button
  → handleStartConversation()
  → Mic captured, AudioContext created, analysers connected
  → Custom transport created with our audioElement + micStream
  → Session created and connected
  → State: LISTENING
  → Orb: responds to mic audio via micAnalyser

User speaks
  → transport_event: input_audio_buffer.speech_started
  → State: LISTENING (stays same)
  → Orb: actively responding to voice

User stops speaking
  → transport_event: input_audio_buffer.speech_stopped
  → State: AI_THINKING
  → Orb: continuous thin↔thick pulsing loop (goal 0↔1)

AI starts responding
  → session event: audio_start
  → transport_event: output_audio_buffer.started
  → State: AI_SPEAKING
  → audioElement starts playing, AI analyser activates
  → Orb: responds to AI audio via aiAnalyser

AI finishes responding
  → session event: audio_stopped
  → transport_event: output_audio_buffer.stopped
  → State: LISTENING
  → Orb: switches back to mic analyser, responds to user voice

User clicks stop button
  → handleStopConversation()
  → Session closed, mic released, analysers disconnected
  → State: IDLE
  → Orb: gentle breathing
```

---

## Part 5: Files to Modify

### Primary File: `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx`

**Changes:**
1. Replace `audioService` import with direct Web Audio API usage
2. Add `OpenAIRealtimeWebRTC` import
3. Add refs: `audioContextRef`, `micAnalyserRef`, `aiAnalyserRef`, `audioElementRef`, `micStreamRef`, `appStateRef`
4. Add `getAudioDataFromAnalyser()` utility function
5. Rewrite `setupSessionEventListeners()` with correct event names
6. Rewrite `handleStartConversation()` with custom transport, shared mic, dual analysers
7. Rewrite `handleStopConversation()` with proper cleanup
8. Add `cleanupAudio()` helper
9. Update cleanup `useEffect` to use `cleanupAudio()`
10. Add `appStateRef` sync effect

### No Changes Needed:
- `VelvetOrb.tsx` — Already correctly maps voiceState to orb props
- `VoiceStateLabel.tsx` — Already correctly maps state to labels
- `audioService.ts` — Will no longer be used by this component (keep for other variations)
- `realtime.tsx` — Page wrapper, no changes needed

---

## Part 6: Complete Event Reference

### Events We Listen To (on RealtimeSession)

| Event | Handler | Purpose |
|---|---|---|
| `transport_event` | Check `event.type` | Access raw API events for VAD |
| `audio_start` | `setAppState('ai_speaking')` | AI starts generating audio |
| `audio_stopped` | `setAppState('listening')` | AI stops generating audio |
| `agent_start` | Logging only | Agent begins processing |
| `agent_end` | Logging + get output text | Agent finishes |
| `error` | Error handling | Connection errors |

### Raw Events via transport_event

| event.type | What It Means | Our Action |
|---|---|---|
| `input_audio_buffer.speech_started` | User started speaking | Set state to `listening` |
| `input_audio_buffer.speech_stopped` | User stopped speaking (VAD) | Set state to `ai_thinking` |
| `output_audio_buffer.started` | AI audio playing in browser | Logging (audio_start handles state) |
| `output_audio_buffer.stopped` | AI audio stopped in browser | Logging (audio_stopped handles state) |
| `conversation.item.input_audio_transcription.completed` | User speech transcribed | Log transcript |
| `response.output_audio_transcript.delta` | AI transcript chunk | Log delta |
| `response.output_audio_transcript.done` | Full AI transcript | Log transcript |
| `session.created` | Session established | Log confirmation |
| `error` | Error occurred | Handle error |

### Events NOT Available on RealtimeSession (Don't Use)

These are raw API events, NOT session events. Use `transport_event` instead:
- ❌ `input_audio_buffer.speech_stopped`
- ❌ `input_audio_transcription.completed`
- ❌ `response.audio.started`
- ❌ `response.audio_transcript.delta`
- ❌ `response.audio_transcript.done`
- ❌ `response.audio.done`
- ❌ `response.done`
- ❌ `connected`
- ❌ `disconnected`

---

## Part 7: OpenAIRealtimeWebRTC Options

**Type definition** (from `openaiRealtimeWebRtc.d.ts`):

```typescript
type OpenAIRealtimeWebRTCOptions = {
  baseUrl?: string;
  audioElement?: HTMLAudioElement;    // We provide this
  mediaStream?: MediaStream;          // We provide this
  useInsecureApiKey?: boolean;
  changePeerConnection?: (pc: RTCPeerConnection) => RTCPeerConnection | Promise<RTCPeerConnection>;
};
```

- `audioElement`: If provided, SDK uses it instead of creating `document.createElement('audio')`. The SDK's `ontrack` handler will set `audioElement.srcObject = event.streams[0]`, giving us access to the remote MediaStream.

- `mediaStream`: If provided, SDK uses it instead of calling `navigator.mediaDevices.getUserMedia()`. We capture the mic ourselves and share the same stream for both SDK audio input and our mic analyser.

**Import path:** `import { OpenAIRealtimeWebRTC } from '@openai/agents-realtime';`

---

## Part 8: AI Audio Analyser Setup Timing

The remote audio stream (`audioElement.srcObject`) is set asynchronously when WebRTC's `ontrack` fires. This happens AFTER `session.connect()` returns. We need to wait for the stream before creating the AI analyser.

**Strategy:** Listen for the `playing` event on our custom audio element:

```typescript
audioEl.addEventListener('playing', () => {
  if (!aiAnalyserRef.current && audioEl.srcObject) {
    // Now safe to create MediaStreamSource from the remote stream
    const aiSource = ctx.createMediaStreamSource(audioEl.srcObject as MediaStream);
    // ... connect to analyser
  }
});
```

**Alternative:** Set up in the `audio_start` event handler (first time AI speaks).

**IMPORTANT:** `createMediaStreamSource()` can only be called ONCE per stream. If called again with the same stream, it may fail. Guard with a ref.

---

## Part 9: VAD Configuration

The SDK configures VAD via session config. The default is `semantic_vad` with `eagerness: "auto"` (medium). This means the AI uses semantic understanding to detect when the user has finished a thought, not just silence detection.

If VAD isn't responsive enough, we can configure it via session config:

```typescript
const session = new RealtimeSession(agent, {
  transport,
  config: {
    turnDetection: {
      type: 'semantic_vad',
      eagerness: 'medium',     // 'low' | 'medium' | 'high' | 'auto'
      createResponse: true,     // Auto-create response when speech stops
      interruptResponse: true,  // Auto-interrupt AI when user speaks
    }
  }
});
```

Or for simpler silence-based detection:
```typescript
turnDetection: {
  type: 'server_vad',
  threshold: 0.5,
  silenceDurationMs: 200,
  prefixPaddingMs: 300,
  createResponse: true,
  interruptResponse: true,
}
```

---

## Part 10: Session close() Method

The `session.close()` method is **synchronous** (returns void). It calls `transport.close()` internally which:
1. Closes the RTCPeerConnection
2. Closes the data channel
3. Disconnects all tracks

**Source:** `realtimeSession.mjs` lines 707-710:
```javascript
close() {
    this.#interruptedByGuardrail = {};
    this.#transport.close();
}
```

We still need to manually:
- Stop mic stream tracks (`track.stop()`)
- Disconnect analyser nodes
- Close AudioContext

---

## Part 11: Key Imports Summary

```typescript
// SDK imports
import {
  RealtimeAgent,
  RealtimeSession,
  OpenAIRealtimeWebRTC
} from '@openai/agents-realtime';

// Types (from our project)
import { AudioData } from '../types';

// Orb components (no changes)
import { VelvetOrb, VoiceState } from './orb/VelvetOrb';
import { VoiceStateLabel, VoiceStateLabelState } from './ui/VoiceStateLabel';
```

---

## Part 12: Testing Checklist

After implementing all changes:

### State Transitions
- [ ] Click button → state label shows "Listening..."
- [ ] Speak → state stays "Listening..." (orb responds to voice)
- [ ] Stop speaking → state changes to "AI is thinking..." (orb pulses thin↔thick)
- [ ] AI responds → state changes to "AI is speaking..." (orb responds to AI voice)
- [ ] AI finishes → state returns to "Listening..."
- [ ] Multiple turns work without clicking button again

### Audio Visualization
- [ ] During LISTENING: orb displacement responds to mic input
- [ ] During AI_THINKING: orb pulses, no audio-reactive displacement
- [ ] During AI_SPEAKING: orb displacement responds to AI voice
- [ ] Smooth transitions between states

### Stop/Cleanup
- [ ] Click stop → mic indicator disappears from browser
- [ ] No more events in console after stop
- [ ] Can start new conversation without page reload
- [ ] No memory leaks (AudioContext closed, streams stopped)

### Console Logs
- [ ] `[OpenAI Realtime] Connected, listening...`
- [ ] `[OpenAI Realtime] User stopped speaking (VAD)`
- [ ] `[OpenAI Realtime] AI started generating audio`
- [ ] `[OpenAI Realtime] AI stopped generating audio`
- [ ] `[Audio] AI analyser connected`

---

## Sources

- [OpenAI Realtime API Guide](https://platform.openai.com/docs/guides/realtime)
- [OpenAI Realtime WebRTC Guide](https://platform.openai.com/docs/guides/realtime-webrtc)
- [OpenAI Realtime Server Events](https://platform.openai.com/docs/api-reference/realtime-server-events)
- [OpenAI Realtime Client Events](https://platform.openai.com/docs/api-reference/realtime-client-events)
- [OpenAI VAD Guide](https://platform.openai.com/docs/guides/realtime-vad)
- [webrtcHacks Unofficial Guide](https://webrtchacks.com/the-unofficial-guide-to-openai-realtime-webrtc-api/)
- [Mamezou WebRTC Implementation](https://developer.mamezou-tech.com/en/blogs/2024/12/21/openai-realtime-api-webrtc/)
- [openai/openai-agents-js GitHub](https://github.com/openai/openai-agents-js)
- [openai/openai-realtime-console GitHub](https://github.com/openai/openai-realtime-console)

### SDK Source Files Examined
- `node_modules/@openai/agents-realtime/dist/realtimeSession.mjs` — Session event wiring (lines 438-536)
- `node_modules/@openai/agents-realtime/dist/openaiRealtimeWebRtc.mjs` — WebRTC transport (lines 160-171)
- `node_modules/@openai/agents-realtime/dist/openaiRealtimeBase.mjs` — Base transport event parsing
- `node_modules/@openai/agents-realtime/dist/openaiRealtimeWebsocket.mjs` — WebSocket transport (audio event, for reference)
- `node_modules/@openai/agents-realtime/dist/openaiRealtimeWebRtc.d.ts` — TypeScript types for options
- `node_modules/@openai/agents-realtime/dist/realtimeSession.d.ts` — Session TypeScript types
