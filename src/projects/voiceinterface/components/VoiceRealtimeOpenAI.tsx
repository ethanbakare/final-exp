import React, { useState, useRef, useEffect } from 'react';
import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import { VelvetOrb, VoiceState } from './orb/VelvetOrb';
import { VoiceStateLabel, VoiceStateLabelState } from './ui/VoiceStateLabel';
import { audioService, AudioData } from '../services/audioService';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Variation 4: OpenAI Realtime Voice Chat with Velvet Orb
 *
 * Architecture:
 * - Landscape card: Responsive (max-width: 1000px)
 * - Velvet orb: Audio-reactive 3D torus (400×400px, 300×300px on mobile)
 * - State label: Text below orb showing conversation state
 * - Mic button: Inside card at bottom (38×38px circle)
 *
 * Implementation:
 * - Automatic turn-taking: Click once → continuous listening → VAD detects turns
 * - OpenAI Agents SDK (@openai/agents-realtime) with WebRTC
 * - Ephemeral token authentication
 * - Audio visualization via Web Audio API frequency analysis
 *
 * State Flow:
 * IDLE → LISTENING (mic active) → AI_THINKING (VAD detects silence) → AI_SPEAKING → LISTENING (cycle)
 *
 * Visual States:
 * - IDLE: Orb breathing gently
 * - LISTENING: Orb responds to mic input
 * - AI_THINKING: Orb thickens (goal: 1)
 * - AI_SPEAKING: Orb thins and responds to AI audio
 */

type AppState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking' | 'complete';

export const VoiceRealtimeOpenAI: React.FC = () => {
  // State management
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string>('');
  const [isConversationActive, setIsConversationActive] = useState<boolean>(false);

  // Audio visualization state
  const [audioData, setAudioData] = useState<AudioData>({ bass: 0, mid: 0, treble: 0, rms: 0 });
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for OpenAI Realtime session
  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);

  /**
   * Initialize OpenAI Realtime Session
   */
  const initializeSession = async () => {
    try {
      console.log('[OpenAI Realtime] Initializing session...');

      // 1. Get ephemeral token from our API
      const response = await fetch('/api/voice-interface/openai-realtime-token');
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`);
      }

      const data = await response.json();
      const ephemeralKey = data.key;

      if (!ephemeralKey) {
        throw new Error('Failed to get OpenAI ephemeral token');
      }

      console.log('[OpenAI Realtime] Got ephemeral token:', ephemeralKey.substring(0, 20) + '...');

      // 2. Create agent with instructions
      const agent = new RealtimeAgent({
        name: "VoiceAssistant",
        instructions: "You are a friendly, conversational assistant. Keep responses concise and natural, as this is a voice conversation.",
      });
      agentRef.current = agent;
      console.log('[OpenAI Realtime] Agent created');

      // 3. Create session
      const session = new RealtimeSession(agent);
      sessionRef.current = session;
      console.log('[OpenAI Realtime] Session created');

      // 4. Set up event listeners BEFORE connecting
      setupSessionEventListeners(session);

      // 5. Connect to OpenAI with ephemeral token
      await session.connect({ apiKey: ephemeralKey });
      console.log('[OpenAI Realtime] Session connected');

      return session;

    } catch (err) {
      console.error('[OpenAI Realtime] Error initializing session:', err);
      setError('Failed to connect to OpenAI. Please try again.');
      setAppState('idle');
      throw err;
    }
  };

  /**
   * Setup Event Listeners for Session (Automatic Turn-Taking)
   */
  const setupSessionEventListeners = (session: RealtimeSession) => {
    console.log('[OpenAI Realtime] Setting up event listeners...');

    // User stops speaking - VAD detects silence
    session.on('input_audio_buffer.speech_stopped', () => {
      console.log('[OpenAI Realtime] User stopped speaking (VAD detected silence)');
      setAppState('ai_thinking');
    });

    // User transcript completed (for logging/debugging)
    session.on('input_audio_transcription.completed', (event: any) => {
      const transcript = event.transcript || '';
      console.log('[OpenAI Realtime] User transcript:', transcript);
    });

    // AI starts responding
    session.on('response.audio.started', () => {
      console.log('[OpenAI Realtime] AI started speaking');
      setAppState('ai_speaking');
    });

    // AI transcript events (for logging/debugging)
    session.on('response.audio_transcript.delta', (event: any) => {
      const delta = event.delta || '';
      console.log('[OpenAI Realtime] AI transcript delta:', delta);
    });

    session.on('response.audio_transcript.done', (event: any) => {
      const transcript = event.transcript || '';
      console.log('[OpenAI Realtime] AI transcript done:', transcript);
    });

    // AI finishes responding - back to listening
    session.on('response.audio.done', () => {
      console.log('[OpenAI Realtime] AI finished speaking, back to listening');
      setAppState('listening');
    });

    // Response lifecycle complete
    session.on('response.done', () => {
      console.log('[OpenAI Realtime] Response cycle complete');
      // State already set to 'listening' by response.audio.done
    });

    // Error handling
    session.on('error', (error: any) => {
      console.error('[OpenAI Realtime] Session error:', error);
      setError('Connection error. Please try again.');
      setAppState('idle');
      setIsConversationActive(false);
    });

    // Connection state
    session.on('connected', () => {
      console.log('[OpenAI Realtime] Connected');
    });

    session.on('disconnected', () => {
      console.log('[OpenAI Realtime] Disconnected');
    });
  };

  /**
   * Start Conversation (Click Once)
   */
  const handleStartConversation = async () => {
    console.log('[OpenAI Realtime] Starting conversation...');
    try {
      setIsConversationActive(true);
      setAppState('listening');
      setError('');

      // Start audio service for microphone capture
      await audioService.startMic();
      console.log('[OpenAI Realtime] Microphone started');

      // Poll audio data at 60fps (continuous)
      audioIntervalRef.current = setInterval(() => {
        setAudioData(audioService.getAudioData());
      }, 16);

      // Initialize OpenAI session
      if (!sessionRef.current) {
        await initializeSession();
      }

      console.log('[OpenAI Realtime] Conversation active, listening...');
      // OpenAI SDK handles turn-taking automatically with VAD
      // Microphone stays active throughout conversation

    } catch (err) {
      console.error('[OpenAI Realtime] Error starting conversation:', err);
      setError('Failed to start conversation. Please check your microphone.');
      setAppState('idle');
      setIsConversationActive(false);

      // Cleanup on error
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      audioService.stop();
    }
  };

  /**
   * Stop/Clear Conversation (Click Again)
   */
  const handleStopConversation = async () => {
    console.log('[OpenAI Realtime] Stopping conversation...');
    setIsConversationActive(false);
    setAppState('idle');

    // Stop audio polling
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    audioService.stop();
    console.log('[OpenAI Realtime] Microphone stopped');

    // Disconnect OpenAI session
    if (sessionRef.current) {
      await sessionRef.current.disconnect();
      sessionRef.current = null;
      agentRef.current = null;
      console.log('[OpenAI Realtime] Session disconnected');
    }

    setError('');
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
      audioService.stop();
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
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
                  <rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor" />
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
          max-width: 1000px;
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

        .mic-button.active {
          background: var(--VoiceRed, #ef4444);
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
