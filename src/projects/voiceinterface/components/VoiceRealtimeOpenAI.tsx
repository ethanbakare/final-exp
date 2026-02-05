import React, { useState, useRef, useEffect } from 'react';
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC } from '@openai/agents-realtime';
import { VelvetOrb, VoiceState } from './orb/VelvetOrb';
import { VoiceStateLabel, VoiceStateLabelState } from './ui/VoiceStateLabel';
import { AudioData } from '../types';
import { AUDIO_BANDS } from '../constants';

/**
 * Variation 4: OpenAI Realtime Voice Chat with Velvet Orb
 *
 * Architecture:
 * - Landscape card: Responsive (max-width: 900px)
 * - Velvet orb: Audio-reactive 3D torus (400×400px, 300×300px on mobile)
 * - State label: Text below orb showing conversation state
 * - Mic button: Inside card at bottom (38×38px circle)
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

type AppState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking' | 'complete';

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
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('[OpenAI Realtime] User stopped speaking (VAD)');
          setAppState('ai_thinking');
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

      const session = new RealtimeSession(agent, { transport });
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
      console.log('[OpenAI Realtime] Connected, listening...');

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

    // 1. Stop audio polling
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
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
    if (appState === 'complete') return 'complete';
    return appState;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (sessionRef.current) {
        try { sessionRef.current.close(); } catch (_) {}
      }
      cleanupAudio();
    };
  }, []);

  return (
    <>
      <div className="voice-realtime-container">
        <div className="voice-realtime-card">
          {/* Velvet Orb - Audio-reactive visualization */}
          <div className="orb-container">
            <VelvetOrb
              audioData={audioData}
              voiceState={getVoiceState()}
              width={400}
              height={400}
            />
          </div>

          {/* State Label - Text below orb */}
          <div className="state-label-container">
            <VoiceStateLabel state={getLabelState()} />
          </div>

          {/* Button Container - Mic button at bottom inside card */}
          <div className="button-container">
            <button
              className={`mic-button ${isConversationActive ? 'active' : 'idle'}`}
              onClick={isConversationActive ? handleStopConversation : handleStartConversation}
              aria-label={isConversationActive ? 'Stop conversation' : 'Start conversation'}
            >
              {isConversationActive ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="10" height="10" rx="2" fill="#ef4444" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1C6.34315 1 5 2.34315 5 4V8C5 9.65685 6.34315 11 8 11C9.65685 11 11 9.65685 11 8V4C11 2.34315 9.65685 1 8 1Z" fill="currentColor" />
                  <path d="M3.5 8C3.5 7.72386 3.27614 7.5 3 7.5C2.72386 7.5 2.5 7.72386 2.5 8C2.5 10.4853 4.28061 12.5586 6.625 12.9409V14.5H5.5C5.22386 14.5 5 14.7239 5 15C5 15.2761 5.22386 15.5 5.5 15.5H10.5C10.7761 15.5 11 15.2761 11 15C11 14.7239 10.7761 14.5 10.5 14.5H9.375V12.9409C11.7194 12.5586 13.5 10.4853 13.5 8C13.5 7.72386 13.2761 7.5 13 7.5C12.7239 7.5 12.5 7.72386 12.5 8C12.5 10.2091 10.7091 12 8.5 12H7.5C5.29086 12 3.5 10.2091 3.5 8Z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Container - Centers card on page */
        .voice-realtime-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: 20px;
        }

        /* Card - Landscape layout with orb, label, button */
        .voice-realtime-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;

          width: 100%;
          max-width: 900px;
          padding: 40px 20px 20px;

          background: var(--VoiceBoxBg);
          border: 1px solid var(--VoiceBoxOutline);
          box-shadow: 0px 4px 12px var(--VoiceBoxShadow);
          border-radius: 16px;
        }

        /* Orb Container */
        .orb-container {
          flex-shrink: 0;
          width: 400px;
          height: 400px;
        }

        /* State Label Container */
        .state-label-container {
          flex-shrink: 0;
          width: 100%;
          text-align: center;
          padding: 0 20px;
        }

        /* Button Container */
        .button-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 38px;
          padding: 0 12px;
          margin-top: 10px;
        }

        /* Mic Button */
        .mic-button {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 38px;
          height: 38px;
          border-radius: 19px;
          border: none;
          background: var(--VoiceDarkGrey_90);
          color: var(--VoiceWhite);
          cursor: pointer;
          transition: all 200ms ease-out;
          outline: none;
        }

        .mic-button:hover {
          transform: scale(1.05);
          box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.15);
        }

        .mic-button:active {
          transform: scale(0.95);
        }

        /* No style change for active state - only icon changes color */

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
            width: 300px;
            height: 300px;
          }

          .state-label-container {
            padding: 0 15px;
          }
        }
      `}</style>
    </>
  );
};
