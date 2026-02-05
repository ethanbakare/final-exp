import React, { useState, useRef, useEffect } from 'react';
import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import { VoiceTextStreaming, VoiceTextStreamingState } from './ui/VoiceTextStreaming';
import { MorphingRecordWideStopDock, RecordWideStopDockState } from './ui/voicemorphingbuttons';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Variation 4: OpenAI Realtime Voice Chat (Walkie-Talkie Style)
 *
 * Architecture:
 * - TextWrapper: 254px × 407px container (matching VoiceTextWrapperLive)
 * - TextBox: 254px × 340px box with border/shadow
 * - RecordWide button: MorphingRecordWideStopDock (164px × 46px)
 *
 * Implementation:
 * - Push-to-talk: Press button → user speaks → release → AI responds
 * - OpenAI Agents SDK (@openai/agents-realtime) with WebRTC
 * - Ephemeral token authentication
 * - Live transcript display during conversation
 *
 * State Flow:
 * IDLE → USER_SPEAKING → AI_RESPONDING → COMPLETE
 */

type AppState = 'idle' | 'user_speaking' | 'ai_responding' | 'complete';

export const VoiceRealtimeOpenAI: React.FC = () => {
  // State management
  const [appState, setAppState] = useState<AppState>('idle');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [aiTranscript, setAiTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Refs for OpenAI Realtime session
  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);

  // Ref for scrollable container (auto-scroll to show new text)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track conversation turn number
  const turnNumberRef = useRef(0);

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
   * Setup Event Listeners for Session
   */
  const setupSessionEventListeners = (session: RealtimeSession) => {
    console.log('[OpenAI Realtime] Setting up event listeners...');

    // User speech transcript events
    session.on('input_audio_transcription.completed', (event: any) => {
      const transcript = event.transcript || '';
      console.log('[OpenAI Realtime] User transcript completed:', transcript);
      if (transcript.trim()) {
        setUserTranscript(prev => {
          const separator = prev ? ' ' : '';
          return prev + separator + transcript;
        });
      }
    });

    // Interim user transcript (if available)
    session.on('input_audio_transcription.partial', (event: any) => {
      const transcript = event.transcript || '';
      console.log('[OpenAI Realtime] User transcript partial:', transcript);
      setInterimText(transcript);
    });

    // AI response transcript events
    session.on('response.audio_transcript.delta', (event: any) => {
      const delta = event.delta || '';
      console.log('[OpenAI Realtime] AI transcript delta:', delta);
      setAiTranscript(prev => prev + delta);
    });

    session.on('response.audio_transcript.done', (event: any) => {
      const transcript = event.transcript || '';
      console.log('[OpenAI Realtime] AI transcript done:', transcript);
      setAiTranscript(prev => {
        // If we already have content from deltas, use that
        // Otherwise use the final transcript
        return prev || transcript;
      });
      setInterimText('');
    });

    // Response lifecycle events
    session.on('response.done', () => {
      console.log('[OpenAI Realtime] Response done');
      setAppState('complete');
    });

    // Error handling
    session.on('error', (error: any) => {
      console.error('[OpenAI Realtime] Session error:', error);
      setError('Connection error. Please try again.');
      setAppState('idle');
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
   * Start User Speaking (Push-to-Talk)
   */
  const handleStartSpeaking = async () => {
    console.log('[OpenAI Realtime] handleStartSpeaking called');
    try {
      setAppState('user_speaking');
      setError('');
      setInterimText('');

      // Initialize session if not already connected
      if (!sessionRef.current) {
        await initializeSession();
      }

      console.log('[OpenAI Realtime] User can now speak');
      // The SDK handles microphone access automatically
      // No manual MediaRecorder needed - SDK manages WebRTC

    } catch (err) {
      console.error('[OpenAI Realtime] Error starting recording:', err);
      setError('Failed to start recording. Please check your microphone.');
      setAppState('idle');
    }
  };

  /**
   * Stop User Speaking (Release Button)
   */
  const handleStopSpeaking = async () => {
    console.log('[OpenAI Realtime] handleStopSpeaking called');
    if (!sessionRef.current) return;

    try {
      // Stop user input and trigger AI response
      // The SDK automatically sends the audio and triggers the AI response
      setAppState('ai_responding');
      setInterimText('');

      console.log('[OpenAI Realtime] Waiting for AI response...');
      // The session will automatically transition to response mode
      // and fire response events

    } catch (err) {
      console.error('[OpenAI Realtime] Error stopping recording:', err);
      setError('Failed to process recording.');
      setAppState('complete');
    }
  };

  /**
   * Copy Full Transcript
   */
  const handleCopy = async () => {
    const fullTranscript = [userTranscript, aiTranscript].filter(Boolean).join('\n\n');
    if (!fullTranscript) return;

    try {
      await navigator.clipboard.writeText(fullTranscript);
      console.log('[OpenAI Realtime] Copied to clipboard');
    } catch (error) {
      console.warn('[OpenAI Realtime] Clipboard copy failed:', error);
    }
  };

  /**
   * Clear and Reset
   */
  const handleClear = async () => {
    console.log('[OpenAI Realtime] handleClear called');
    // Start fade-out animation
    setIsClearing(true);

    // Disconnect session
    if (sessionRef.current) {
      await sessionRef.current.disconnect();
      sessionRef.current = null;
      agentRef.current = null;
    }

    // Wait for animation, then clear state
    setTimeout(() => {
      setAppState('idle');
      setUserTranscript('');
      setAiTranscript('');
      setInterimText('');
      setError('');
      turnNumberRef.current = 0;
      setIsClearing(false);
    }, 200);
  };

  /**
   * Map app state to text display state
   */
  const getTextState = (): VoiceTextStreamingState => {
    if (appState === 'user_speaking' || appState === 'ai_responding') {
      return 'recording'; // Show live text
    }
    if (appState === 'complete') return 'complete';
    return 'idle';
  };

  /**
   * Map app state to button state
   */
  const getButtonState = (): RecordWideStopDockState => {
    if (appState === 'user_speaking') return 'recording';
    if (appState === 'complete') return 'complete';
    return 'idle';
  };

  /**
   * Compute display text
   */
  const getDisplayText = (): string => {
    const parts: string[] = [];

    if (userTranscript) {
      parts.push(`You: ${userTranscript}`);
    }

    if (interimText && appState === 'user_speaking') {
      parts.push(interimText);
    }

    if (aiTranscript) {
      parts.push(`AI: ${aiTranscript}`);
    }

    return parts.join('\n\n');
  };

  // Auto-scroll to bottom when new text is added
  useEffect(() => {
    const displayText = getDisplayText();
    if (!displayText) return;

    if (appState === 'user_speaking' || appState === 'ai_responding') {
      const scrollTimer = setTimeout(() => {
        const element = scrollContainerRef.current;
        if (element) {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);

      return () => clearTimeout(scrollTimer);
    }
  }, [userTranscript, aiTranscript, interimText, appState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
  }, []);

  return (
    <>
      <div className={`text-wrapper ${styles.container}`}>
        {/* TextBox - The bordered box containing text */}
        <div className="text-box">
          <div className="txt-box">
            {/* Transcript Display Area */}
            <div className="txt-transcript-box">
              <div
                className={`transcript-scroll-wrapper ${isClearing ? 'clearing' : ''}`}
                ref={scrollContainerRef}
              >
                <VoiceTextStreaming
                  textState={getTextState()}
                  transcriptText={getDisplayText()}
                  oldTextLength={0}
                  showCursor={appState === 'user_speaking' || appState === 'ai_responding'}
                  placeholderText="Press to speak"
                />

                {/* Error display */}
                {error && (
                  <div className="error-message">{error}</div>
                )}
              </div>

              {/* Fade overlay at bottom */}
              {(appState !== 'idle') && (userTranscript || aiTranscript) && (
                <div className="fade-overlay"></div>
              )}
            </div>
          </div>
        </div>

        {/* RecordWide Button - Standalone button OUTSIDE the box */}
        <div className="record-wide-wrapper">
          <MorphingRecordWideStopDock
            state={getButtonState()}
            onRecordClick={handleStartSpeaking}
            onStopClick={handleStopSpeaking}
            onCopyClick={handleCopy}
            onClearClick={handleClear}
          />
        </div>
      </div>

      <style jsx>{`
        /* TextWrapper - Outer container (NO border/shadow) */
        .text-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px;
          gap: 23px;

          position: relative;
          width: 254px;
          height: 407px;
        }

        /* TextBox - The bordered box with shadow */
        .text-box {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 15px;
          gap: 10px;

          width: 254px;
          max-width: 600px;
          height: 340px;

          background: var(--VoiceBoxBg);
          border: 1px solid var(--VoiceBoxOutline);
          box-shadow: 0px 4px 12px var(--VoiceBoxShadow);
          border-radius: 16px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }

        /* TxtBox - Inner container */
        .txt-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;

          width: 224px;
          height: 300px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }

        /* TxtTranscriptBox - Text display area */
        .txt-transcript-box {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px;
          gap: 10px;

          width: 224px;
          height: 300px;

          border-radius: 6px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
          overflow: hidden;
        }

        /* Scrollable wrapper */
        .transcript-scroll-wrapper {
          width: 100%;
          max-height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;
          transition: opacity 200ms ease-out;
        }

        .transcript-scroll-wrapper.clearing {
          opacity: 0;
          pointer-events: none;
        }

        /* Custom scrollbar */
        .transcript-scroll-wrapper::-webkit-scrollbar {
          width: 6px;
        }

        .transcript-scroll-wrapper::-webkit-scrollbar-track {
          background: transparent;
        }

        .transcript-scroll-wrapper::-webkit-scrollbar-thumb {
          background: var(--VoiceDarkGrey_30);
          border-radius: 3px;
        }

        .transcript-scroll-wrapper::-webkit-scrollbar-thumb:hover {
          background: var(--VoiceDarkGrey_80);
        }

        /* Fade overlay at bottom */
        .fade-overlay {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          height: 20px;
          background: linear-gradient(to bottom,
            rgba(247, 246, 244, 0) 0%,
            rgba(247, 246, 244, 1) 100%
          );
          pointer-events: none;
          z-index: 10;
        }

        /* Error message */
        .error-message {
          margin-top: 8px;
          padding: 8px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 4px;
          color: var(--VoiceRed);
          font-size: 14px;
        }

        /* RecordWide Wrapper */
        .record-wide-wrapper {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 0px;

          width: 100%;
          height: 44px;

          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};
