import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC } from '@openai/agents-realtime';
// VelvetOrb is shelved — kept in tree at ./orb/VelvetOrb for revert.
// Active orb is RealtimeBlob — a shader-aware dispatcher between
// CoralRealtimeBlob (Coral D shader) and NebularrBlob (Tube/Kyoto shader).
import {
  RealtimeBlob,
  RealtimeVoiceState as VoiceState,
  type RealtimeOrb,
} from './RealtimeBlob';
import { NEBULARR_FALLBACK_PROFILE } from './NebularrBlob';
import { CORAL_FALLBACK_PROFILE, type CoralRealtimeSettings } from './CoralRealtimeBlob';
import type { LinkedProfile } from './useLinkedProfileAnimator';

/**
 * Discriminated union for orbs loaded from the studio-profiles API.
 * Carries enough metadata for both the live thumbnail strip (id, name,
 * shader for dispatch) and any future editor surface (sourceVariant
 * for save routing, lastModified for sort).
 */
type LoadedOrb =
  | {
      shader: 'coral';
      sourceVariant: 'realtime-coral';
      id: string;
      name: string;
      pinned: boolean;
      settings: CoralRealtimeSettings;
      lastModified: number;
    }
  | {
      shader: 'kyoto';
      sourceVariant: 'realtime-state';
      id: string;
      name: string;
      pinned: boolean;
      settings: LinkedProfile;
      lastModified: number;
    };

/** `${sourceVariant}:${id}` — used as React key, dropdown selection,
 *  and localStorage value. Composite because ids are scoped per file
 *  and could collide across files. */
const orbKey = (o: LoadedOrb) => `${o.sourceVariant}:${o.id}`;

/** Slugify a profile name for thumbnail path lookup. "Coral Realtime"
 *  → "coral-realtime". Matches the on-disk convention. */
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const PLACEHOLDER_THUMB = '/thumbnails/realtime-states/_placeholder.png';
const thumbSrcFor = (orb: LoadedOrb) =>
  `/thumbnails/realtime-states/${slug(orb.name)}.png`;

const CORAL_FALLBACK_ORB: LoadedOrb = {
  shader: 'coral',
  sourceVariant: 'realtime-coral',
  id: 'rt-coral-fallback',
  name: 'Coral Realtime',
  pinned: true, // fallbacks are always shown when their file fails
  settings: CORAL_FALLBACK_PROFILE,
  lastModified: 0,
};

const NEBULARR_FALLBACK_ORB: LoadedOrb = {
  shader: 'kyoto',
  sourceVariant: 'realtime-state',
  id: 'rt-nebularr-fallback',
  name: 'Nebularr',
  pinned: true,
  settings: NEBULARR_FALLBACK_PROFILE,
  lastModified: 0,
};
import { VoiceStateLabel, VoiceStateLabelState } from './ui/VoiceStateLabel';
import { MorphingRecordWideSimple } from './ui/voicemorphingbuttons';
import { AudioData } from '../types';
import { AUDIO_BANDS } from '../constants';

/**
 * Variation 4: OpenAI Realtime Voice Chat with Velvet Orb
 *
 * Architecture:
 * - Landscape card: Responsive (max-width: 1000px)
 * - Coral orb: Audio-reactive CoralStoneMorph via RealtimeBlob adapter (252×252px)
 * - State label: Text below orb showing conversation state
 * - Record button: MorphingRecordWideSimple (76×44px pill, white mic/stop icons)
 *
 * Implementation:
 * - Automatic turn-taking: Click once → continuous listening → VAD detects turns
 * - OpenAI Agents SDK (@openai/agents-realtime) with custom WebRTC transport
 * - Shared mic stream (single getUserMedia) for both SDK and visualization
 * - Dual Web Audio API AnalyserNodes: mic input + AI audio output
 * - Ephemeral token authentication
 *
 * Event System (WebRTC mode):
 * - transport_event passthrough gives access to raw API events via data channel
 * - output_audio_buffer.started/stopped: AI speaking state (WebRTC-specific, reliable)
 * - input_audio_buffer.speech_stopped: VAD detects user finished speaking
 * - NOTE: session-level audio_start/audio_stopped do NOT fire in WebRTC mode
 * - See REALTIME_EVENT_SYSTEM_FIX.md for full documentation
 *
 * State Flow:
 * IDLE → LISTENING (mic active) → AI_THINKING (VAD detects silence) → AI_SPEAKING → LISTENING (cycle)
 */

type AppState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

/** Artificial delay (ms) between user finishing their turn and the AI being
 *  asked to respond. VAD is configured with createResponse: false, so we
 *  manually send response.create after this gate elapses.
 *
 *  Default: 0 — trust the API's real latency. The shader's morphSpeed-based
 *  interpolation in CoralStoneMorph absorbs any timing variance smoothly
 *  (~540ms torus→sphere morph when ai_speaking begins).
 *
 *  Set >0 only if you need a forced minimum thinking phase (e.g. for visual
 *  testing or to mask a slow downstream model). */
const THINKING_GATE_MS = 0;

/**
 * Extract frequency band data from a Web Audio API AnalyserNode.
 */
function getAudioDataFromAnalyser(analyser: AnalyserNode, dataArray: Uint8Array<ArrayBuffer>, sampleRate: number): AudioData {
  analyser.getByteFrequencyData(dataArray);
  const binCount = analyser.frequencyBinCount;

  const getAverage = (minFreq: number, maxFreq: number) => {
    const minBin = Math.floor((minFreq * binCount) / (sampleRate / 2));
    const maxBin = Math.floor((maxFreq * binCount) / (sampleRate / 2));
    let sum = 0, count = 0;
    for (let i = minBin; i <= maxBin; i++) { sum += dataArray[i]; count++; }
    return count > 0 ? sum / count / 255 : 0;
  };

  const bass = getAverage(AUDIO_BANDS.BASS.min, AUDIO_BANDS.BASS.max);
  const mid = getAverage(AUDIO_BANDS.MID.min, AUDIO_BANDS.MID.max);
  const treble = getAverage(AUDIO_BANDS.TREBLE.min, AUDIO_BANDS.TREBLE.max);

  let rms = 0;
  for (let i = 0; i < dataArray.length; i++) { rms += (dataArray[i] / 255) ** 2; }
  rms = Math.sqrt(rms / dataArray.length);

  return { bass, mid, treble, rms };
}

export const VoiceRealtimeOpenAI: React.FC = () => {
  // State management
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string>('');
  const [isConversationActive, setIsConversationActive] = useState<boolean>(false);
  const [orbs, setOrbs] = useState<LoadedOrb[]>([]);
  const [activeOrbKey, setActiveOrbKey] = useState<string | null>(null);

  // Parallel fetch of both shader profile files via Promise.allSettled
  // so a single failure on one variant doesn't erase the other shader's
  // entries. Each shader gets an independent fallback if its list is
  // empty or the request rejects.
  useEffect(() => {
    let cancelled = false;

    const fetchVariant = async (
      variant: 'realtime-coral' | 'realtime-state',
      shader: 'coral' | 'kyoto',
    ): Promise<LoadedOrb[]> => {
      try {
        const r = await fetch(`/api/studio-profiles?variant=${variant}`);
        const arr = await r.json();
        if (!Array.isArray(arr)) return [];
        if (shader === 'coral') {
          return arr.map((p) => ({
            shader: 'coral' as const,
            sourceVariant: 'realtime-coral' as const,
            id: p.id,
            name: p.name,
            pinned: p.pinned === true,
            settings: p.settings as CoralRealtimeSettings,
            lastModified: p.lastModified ?? 0,
          }));
        }
        return arr.map((p) => ({
          shader: 'kyoto' as const,
          sourceVariant: 'realtime-state' as const,
          id: p.id,
          name: p.name,
          pinned: p.pinned === true,
          settings: p.settings as LinkedProfile,
          lastModified: p.lastModified ?? 0,
        }));
      } catch {
        return [];
      }
    };

    Promise.allSettled([
      fetchVariant('realtime-coral', 'coral'),
      fetchVariant('realtime-state', 'kyoto'),
    ]).then(([coralRes, kyotoRes]) => {
      if (cancelled) return;
      const coralOrbs =
        coralRes.status === 'fulfilled' && coralRes.value.length > 0
          ? coralRes.value
          : [CORAL_FALLBACK_ORB];
      const kyotoOrbs =
        kyotoRes.status === 'fulfilled' && kyotoRes.value.length > 0
          ? kyotoRes.value
          : [NEBULARR_FALLBACK_ORB];
      const merged = [...coralOrbs, ...kyotoOrbs];
      setOrbs(merged);

      // Live page only shows pinned orbs (explicit opt-in). The default
      // selection considers only pinned candidates.
      const visible = merged.filter((o) => o.pinned);
      const persisted =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('realtime-active-orb-key')
          : null;
      const persistedExists = persisted && visible.find((o) => orbKey(o) === persisted);
      const coralDefault = visible.find((o) => o.name === 'Coral Realtime');
      const fallbackKey = coralDefault
        ? orbKey(coralDefault)
        : visible[0]
        ? orbKey(visible[0])
        : null;
      setActiveOrbKey(persistedExists ? persisted! : fallbackKey);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist active orb composite key on change.
  useEffect(() => {
    if (typeof window === 'undefined' || !activeOrbKey) return;
    window.localStorage.setItem('realtime-active-orb-key', activeOrbKey);
  }, [activeOrbKey]);

  // Derive the active orb + the props passed to RealtimeBlob. The
  // RealtimeOrb shape (used by the dispatcher) is a one-line projection
  // of LoadedOrb; this useMemo is the single conversion point between
  // the two unions.
  const activeOrb = useMemo(
    () => orbs.find((o) => orbKey(o) === activeOrbKey) ?? null,
    [orbs, activeOrbKey],
  );
  const realtimeOrb: RealtimeOrb | null = useMemo(() => {
    // Pre-fetch boot: don't render an orb yet. Previously this returned
    // a Coral fallback "so the orb area doesn't blank out for one
    // render," but that caused CoralRealtimeBlob to mount with the
    // fallback profile (which has no talking.scale), so the eased
    // hooks' useState initialized at base values. When the real
    // profile arrived later, useState had already committed; the
    // intro animation never played.
    //
    // Returning null means RealtimeBlob doesn't render until the real
    // activeOrb resolves. The momentary blank (~80–150ms in dev)
    // is a smaller cost than a permanently broken intro.
    if (!activeOrb) return null;
    if (activeOrb.shader === 'coral') {
      return { shader: 'coral', profile: activeOrb.settings };
    }
    return { shader: 'kyoto', profile: activeOrb.settings };
  }, [activeOrb]);

  // Audio visualization state
  const [audioData, setAudioData] = useState<AudioData>({ bass: 0, mid: 0, treble: 0, rms: 0 });
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ref to track appState inside intervals (closures capture stale state)
  const appStateRef = useRef<AppState>('idle');
  useEffect(() => { appStateRef.current = appState; }, [appState]);

  // Refs for OpenAI Realtime session
  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);

  // Refs for Web Audio API (dual analysers)
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const aiAnalyserRef = useRef<AnalyserNode | null>(null);
  const micDataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const aiDataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Ref for delayed response.create timer
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Setup Event Listeners for Session (Automatic Turn-Taking)
   *
   * Uses correct event names for the @openai/agents-realtime SDK:
   * - transport_event: passthrough of ALL raw Realtime API events (for VAD, transcripts)
   * - audio_start: AI starts generating audio (session-level event)
   * - audio_stopped: AI stops generating audio (session-level event)
   * - agent_start / agent_end: response lifecycle (session-level events)
   * - error: connection/session errors
   */
  const setupSessionEventListeners = (session: RealtimeSession) => {
    console.log('[OpenAI Realtime] Setting up event listeners...');

    // --- Raw API events via transport_event passthrough ---
    session.on('transport_event', (event: any) => {
      switch (event.type) {
        case 'input_audio_buffer.speech_started':
          console.log('[OpenAI Realtime] User started speaking');
          // Cancel pending response.create if user interrupts during thinking
          if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
            thinkingTimerRef.current = null;
            console.log('[OpenAI Realtime] Thinking cancelled — user interrupted');
          }
          setAppState('listening');
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('[OpenAI Realtime] User stopped speaking (VAD)');
          setAppState('ai_thinking');

          // Clear any existing timer (safety)
          if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);

          // Schedule response.create after minimum thinking duration.
          // VAD is configured with createResponse: false, so the AI won't
          // respond until we explicitly send this event.
          thinkingTimerRef.current = setTimeout(() => {
            thinkingTimerRef.current = null;
            console.log('[OpenAI Realtime] Thinking complete, triggering response...');
            if (sessionRef.current) {
              sessionRef.current.transport.sendEvent({ type: 'response.create' });
            }
          }, THINKING_GATE_MS);
          break;

        case 'output_audio_buffer.started':
          // Primary state trigger for AI speaking in WebRTC mode.
          // The session-level audio_start event does NOT fire in WebRTC
          // because audio flows through the media track, not data channel chunks.
          console.log('[OpenAI Realtime] AI audio playback started');
          setAppState('ai_speaking');
          break;

        case 'output_audio_buffer.stopped':
          // Primary state trigger for end of AI speaking in WebRTC mode.
          console.log('[OpenAI Realtime] AI audio playback stopped');
          setAppState('listening');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          console.log('[OpenAI Realtime] User transcript:', event.transcript);
          break;

        case 'response.output_audio_transcript.done':
          console.log('[OpenAI Realtime] AI transcript:', event.transcript);
          break;

        case 'session.created':
          console.log('[OpenAI Realtime] Session created on server');
          break;

        case 'error':
          console.error('[OpenAI Realtime] Raw API error:', event);
          break;
      }
    });

    // --- High-level session events ---

    // NOTE: audio_start / audio_stopped do NOT fire in WebRTC mode.
    // Audio flows through the media track, not data channel chunks.
    // State transitions are handled by output_audio_buffer.started/stopped above.
    // Keeping these as fallback logging in case of future SDK changes.
    session.on('audio_start', () => {
      console.log('[OpenAI Realtime] audio_start (session event, WebSocket-only fallback)');
    });

    session.on('audio_stopped', () => {
      console.log('[OpenAI Realtime] audio_stopped (session event, WebSocket-only fallback)');
    });

    session.on('agent_start', () => {
      console.log('[OpenAI Realtime] Agent started processing');
    });

    session.on('agent_end', () => {
      console.log('[OpenAI Realtime] Agent finished processing');
    });

    session.on('error', (error: any) => {
      console.error('[OpenAI Realtime] Session error:', error);
      setError('Connection error. Please try again.');
      setAppState('idle');
      setIsConversationActive(false);
    });
  };

  /**
   * Clean up all audio resources (mic stream, analysers, AudioContext, audio element)
   */
  const cleanupAudio = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[Audio] Mic track stopped:', track.label);
      });
      micStreamRef.current = null;
    }

    if (micAnalyserRef.current) {
      try { micAnalyserRef.current.disconnect(); } catch (_) {}
      micAnalyserRef.current = null;
    }
    if (aiAnalyserRef.current) {
      try { aiAnalyserRef.current.disconnect(); } catch (_) {}
      aiAnalyserRef.current = null;
    }

    micDataArrayRef.current = null;
    aiDataArrayRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }
  };

  /**
   * Start Conversation (Click Once)
   *
   * Sets up: mic capture → dual analysers → custom WebRTC transport → session → connect
   */
  const handleStartConversation = async () => {
    console.log('[OpenAI Realtime] Starting conversation...');
    try {
      setIsConversationActive(true);
      setAppState('listening');
      setError('');

      // 1. Create AudioContext
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      // 2. Capture mic ONCE — shared with SDK and our mic analyser
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      micStreamRef.current = micStream;
      console.log('[Audio] Microphone captured');

      // 3. Create mic analyser
      const micSource = ctx.createMediaStreamSource(micStream);
      const micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 2048;
      micAnalyser.smoothingTimeConstant = 0.8;
      micSource.connect(micAnalyser);
      micAnalyserRef.current = micAnalyser;
      micDataArrayRef.current = new Uint8Array(micAnalyser.frequencyBinCount);

      // 4. Create audio element for AI output (SDK's ontrack will set srcObject)
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;

      // 5. Set up AI analyser when remote stream arrives
      audioEl.addEventListener('playing', () => {
        if (!aiAnalyserRef.current && audioEl.srcObject && audioContextRef.current) {
          try {
            const aiSource = audioContextRef.current.createMediaStreamSource(audioEl.srcObject as MediaStream);
            const aiAnalyser = audioContextRef.current.createAnalyser();
            aiAnalyser.fftSize = 2048;
            aiAnalyser.smoothingTimeConstant = 0.8;
            aiSource.connect(aiAnalyser);
            // Do NOT connect to destination — the <audio> element already plays
            // the AI audio via autoplay. Connecting here too causes echo/double playback.
            aiAnalyserRef.current = aiAnalyser;
            aiDataArrayRef.current = new Uint8Array(aiAnalyser.frequencyBinCount);
            console.log('[Audio] AI analyser connected');
          } catch (err) {
            console.error('[Audio] Error setting up AI analyser:', err);
          }
        }
      });

      // 6. Start polling audio data at 60fps
      audioIntervalRef.current = setInterval(() => {
        const currentCtx = audioContextRef.current;
        if (!currentCtx) return;

        let data: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };

        if (appStateRef.current === 'ai_speaking' && aiAnalyserRef.current && aiDataArrayRef.current) {
          data = getAudioDataFromAnalyser(aiAnalyserRef.current, aiDataArrayRef.current, currentCtx.sampleRate);
        } else if (appStateRef.current === 'listening' && micAnalyserRef.current && micDataArrayRef.current) {
          data = getAudioDataFromAnalyser(micAnalyserRef.current, micDataArrayRef.current, currentCtx.sampleRate);
        }

        setAudioData(data);
      }, 16);

      // 7. Create custom transport with our audioElement and micStream
      const transport = new OpenAIRealtimeWebRTC({
        audioElement: audioEl,
        mediaStream: micStream,
      });

      // 8. Create agent and session with custom transport
      const agent = new RealtimeAgent({
        name: "VoiceAssistant",
        instructions: "You are a friendly, conversational assistant. Keep responses concise and natural, as this is a voice conversation.",
      });
      agentRef.current = agent;

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
      sessionRef.current = session;

      // 9. Set up event listeners BEFORE connecting
      setupSessionEventListeners(session);

      // 10. Get ephemeral token and connect
      console.log('[OpenAI Realtime] Fetching ephemeral token...');
      const response = await fetch('/api/voice-interface/openai-realtime-token');
      if (!response.ok) throw new Error(`Failed to get token: ${response.statusText}`);
      const tokenData = await response.json();
      const ephemeralKey = tokenData.key;
      if (!ephemeralKey) throw new Error('No ephemeral token received');
      console.log('[OpenAI Realtime] Got ephemeral token:', ephemeralKey.substring(0, 20) + '...');

      await session.connect({ apiKey: ephemeralKey });
      console.log('[OpenAI Realtime] Connected (VAD: createResponse=false), listening...');

    } catch (err) {
      console.error('[OpenAI Realtime] Error starting conversation:', err);
      setError('Failed to start conversation. Please check your microphone.');
      setAppState('idle');
      setIsConversationActive(false);

      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      cleanupAudio();
    }
  };

  /**
   * Stop/Clear Conversation (Click Again)
   */
  const handleStopConversation = () => {
    console.log('[OpenAI Realtime] Stopping conversation...');

    // 1. Stop audio polling and pending thinking timer
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }

    // 2. Close OpenAI session (synchronous — calls transport.close() internally)
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

    // 3. Clean up all audio resources
    cleanupAudio();

    // 4. Update UI state LAST
    setIsConversationActive(false);
    setAppState('idle');
    setAudioData({ bass: 0, mid: 0, treble: 0, rms: 0 });
    setError('');
    console.log('[OpenAI Realtime] Cleanup complete, ready for new conversation');
  };

  /**
   * Map app state to VoiceState for Velvet orb
   */
  const getVoiceState = (): VoiceState => {
    if (appState === 'listening') return 'listening';
    if (appState === 'ai_thinking') return 'ai_thinking';
    if (appState === 'ai_speaking') return 'ai_speaking';
    return 'idle';
  };

  /**
   * Map app state to VoiceStateLabelState for text label
   */
  const getLabelState = (): VoiceStateLabelState => {
    return appState;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      if (sessionRef.current) {
        try { sessionRef.current.close(); } catch (_) {}
      }
      cleanupAudio();
    };
  }, []);

  // Card bg stays at its original --VoiceBoxBg (#F7F6F4) for all
  // profiles — only the page bg behind the card swaps to white.

  return (
    <>
      <div className="voice-realtime-container">
        <div className="voice-realtime-card">
          {/* Orb + Label Group */}
          <div className="orb-label-group">
            {/* Velvet Orb - Audio-reactive visualization */}
            <div className="orb-container">
              {realtimeOrb && (
                <RealtimeBlob
                  audioData={audioData}
                  voiceState={getVoiceState()}
                  orb={realtimeOrb}
                />
              )}
            </div>

            {/* State Label - Text below orb */}
            <div className="state-label-container">
              <VoiceStateLabel state={getLabelState()} />
            </div>
          </div>

          {/* Button Container - Record/Stop button at bottom inside card */}
          <div className="button-container">
            <MorphingRecordWideSimple
              state={isConversationActive ? 'recording' : 'idle'}
              onRecordClick={handleStartConversation}
              onStopClick={handleStopConversation}
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>

        {/* Profile strip — data-driven from `orbs`, filtered to only
            pinned entries (explicit opt-in via the editor's bookmark
            toggle). Click a thumb to swap the orb. */}
        <div className="profile-strip" aria-label="Orb profiles">
          {orbs.filter((o) => o.pinned).map((thumb) => {
            const key = orbKey(thumb);
            const isActive = activeOrbKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveOrbKey(key)}
                className={`profile-thumb ${isActive ? 'is-active' : ''}`}
                aria-label={`Switch to ${thumb.name} orb`}
                aria-pressed={isActive}
              >
                <img
                  src={thumbSrcFor(thumb)}
                  alt=""
                  draggable={false}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src.endsWith(PLACEHOLDER_THUMB)) return;
                    img.src = PLACEHOLDER_THUMB;
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        /* Container - Centers card on page, stacks card + profile strip */
        .voice-realtime-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 16px;
          width: 100%;
          padding: 20px;
        }

        /* Profile strip — sits below the card. Mirrors the trace
           demo's showcase-sample-strip styling so the two demos
           feel consistent. */
        .profile-strip {
          display: flex;
          flex-direction: row;
          gap: 10px;
          align-items: center;
        }

        .profile-thumb {
          width: 44px;
          height: 44px;
          padding: 0;
          border: 2px solid transparent;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          background: transparent;
          /* No drop shadow — flat by request. */
          opacity: 0.5;
          transition:
            border-color 200ms cubic-bezier(0.23, 1, 0.32, 1),
            box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1),
            opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
            transform 100ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* Active thumb: a 2px white inner ring (border) + a soft dark
           outer ring (box-shadow as a stroke). The two rings sit
           outside the image so the thumbnail itself isn't touched. */
        .profile-thumb.is-active {
          opacity: 1;
          border-color: #ffffff;
          box-shadow: 0 0 0 2px var(--VoiceDarkGrey_30, rgba(38, 36, 36, 0.3));
        }

        @media (hover: hover) and (pointer: fine) {
          .profile-thumb:not(.is-active):hover {
            opacity: 0.8;
            box-shadow: 0 0 0 2px var(--VoiceDarkGrey_10, rgba(38, 36, 36, 0.1));
          }
        }

        .profile-thumb:active {
          transform: scale(0.97);
        }

        .profile-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          user-select: none;
          -webkit-user-drag: none;
        }

        @media (max-width: 768px) {
          .profile-thumb {
            width: 38px;
            height: 38px;
          }
        }

        /* Card - Landscape layout with orb, label, button */
        .voice-realtime-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 20px;

          width: 100%;
          max-width: 901px;
          min-height: 566px;
          padding: 60px 20px 30px;

          background: var(--VoiceBoxBg, #F7F6F4);
          border: 1px solid var(--VoiceBoxOutline, #F2F2F2);
          box-shadow: 0px 4px 12px var(--VoiceBoxShadow, rgba(0, 0, 0, 0.06));
          border-radius: 16px;
        }

        /* Orb + Label Group */
        .orb-label-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          /* border: 0.5px solid orange; */ /* DEBUG */
        }

        /* Orb Container — sized 30% larger than the visible blob so
           the Speaking-state morph (larger sphere) doesn't clip at the
           canvas edges. RealtimeBlob compensates via base.scale to keep
           the visible blob the same diameter as the Figma 252px spec. */
        .orb-container {
          flex-shrink: 0;
          width: 328px;
          height: 328px;
          /* border: 0.5px solid red; */ /* DEBUG */
        }

        /* State Label Container */
        .state-label-container {
          flex-shrink: 0;
          width: 100%;
          text-align: center;
          padding: 0 20px;
          /* border: 0.5px solid blue; */ /* DEBUG */
        }

        /* Button Container */
        .button-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 44px;
          padding: 0 12px;
          margin-top: 10px;
          /* border: 0.5px solid green; */ /* DEBUG */
        }

        /* Error Message */
        .error-message {
          margin-top: 8px;
          padding: 12px 20px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 8px;
          color: var(--VoiceRed, #ef4444);
          font-size: 14px;
          text-align: center;
          width: 100%;
        }

        /* Responsive - Mobile */
        @media (max-width: 768px) {
          .voice-realtime-card {
            padding: 30px 15px 15px;
          }

          .orb-container {
            width: 328px;
            height: 328px;
          }

          .state-label-container {
            padding: 0 15px;
          }
        }
      `}</style>
    </>
  );
};
