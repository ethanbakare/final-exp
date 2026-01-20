import React, { useState, useRef, useEffect } from 'react';
import {
  createClient,
  LiveClient,
  LiveConnectionState,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";
import { VoiceTextStreaming, VoiceTextStreamingState } from './ui/VoiceTextStreaming';
import { MorphingRecordWideStopDock } from './ui/voicenavbar';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Variation 3: TextWrapper Live Streaming
 *
 * Architecture (from A03_IMPLEMENTATION_NOTES.md):
 * - TextWrapper: 254px × 407px container with gap: 23px (NO border/shadow)
 * - TextBox: 254px × 340px box with border/shadow (text container)
 * - RecordWide button: 76px × 44px standalone button OUTSIDE the box
 *
 * Phase 1 Implementation:
 * - Mobile-optimized 254px TextWrapper container
 * - Live text streaming during recording
 * - 3-state flow (NO processing state)
 * - MorphingRecordWideStopDock component
 *
 * State Flow:
 * IDLE → RECORDING → COMPLETE
 */

type AppState = 'idle' | 'recording' | 'complete';

export const VoiceTextWrapperLive: React.FC = () => {
  // State management
  const [appState, setAppState] = useState<AppState>('idle');
  const [transcription, setTranscription] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [connectionState, setConnectionState] = useState<LiveConnectionState>(
    LiveConnectionState.CLOSED
  );
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Refs for text streaming
  const prevTextLengthRef = useRef(0);

  // Refs for MediaRecorder and Deepgram connection
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const connectionRef = useRef<LiveClient | null>(null);

  // Ref for scrollable container (auto-scroll to show new text)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Map app state to text state
  const getTextState = (): VoiceTextStreamingState => {
    // For streaming, keep states as-is (no mapping to 'results')
    // Text is already visible during recording, no animation needed
    return appState as VoiceTextStreamingState;
  };

  /**
   * Start Recording & Streaming
   */
  const handleStartRecording = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:63',message:'handleStartRecording called',data:{currentAppState:appState},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
    setAppState('recording');
      
      // If appending to existing text, store its length
      if (appState === 'complete' && transcription) {
        prevTextLengthRef.current = transcription.length;
      } else {
    setTranscription('');
    setInterimText('');
    prevTextLengthRef.current = 0;
      }

      // 1. Get temporary token from our API
      const response = await fetch('/api/voice-interface/deepgram-token');
      const data = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:79',message:'Token response received',data:{hasKey:!!(data.key),hasAccessToken:!!(data.access_token),keyPrefix:data.key?data.key.substring(0,10)+'...':'none',responseKeys:Object.keys(data)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F,H'})}).catch(()=>{});
      // #endregion
      const accessToken = data.key || data.access_token;

      if (!accessToken) {
        throw new Error('Failed to get Deepgram token');
      }

      // 2. Create Deepgram client with token
      const deepgram = createClient(accessToken);

      // 3. Open live connection (let SDK auto-detect encoding like reference implementation)
      const dgConfig = {
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        utterance_end_ms: 3000,
        // NO encoding/sample_rate - let Deepgram SDK auto-detect from audio stream
      };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:97',message:'Creating Deepgram connection',data:{config:dgConfig},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      const connection = deepgram.listen.live(dgConfig);

      connectionRef.current = connection;


      // 4. Listen for transcripts
      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const { is_final: isFinal, speech_final: speechFinal } = data;
        const transcript = data.channel.alternatives[0].transcript;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:108',message:'Transcript event received',data:{transcript,isFinal,speechFinal,hasText:!!(transcript && transcript.trim())},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        if (transcript && transcript.trim()) {
          if (isFinal) {
            // Final result - append permanently (don't wait for speechFinal)
            // Deepgram sends multiple finals per utterance with different speechFinal values
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:115',message:'Setting FINAL transcription',data:{transcript,branch:'isFinal',speechFinal},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            setTranscription(prev => {
              const separator = prev ? ' ' : '';
              return prev + separator + transcript;
            });
            // Clear interim text after final result
            setInterimText('');
          } else {
            // Interim result - show live (will be replaced by next interim or final)
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:122',message:'Setting INTERIM text',data:{transcript,branch:'!isFinal'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            setInterimText(transcript);
          }
        }
      });

      // 5. Listen for errors
      connection.on(LiveTranscriptionEvents.Error, (error) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:136',message:'Deepgram ERROR event',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('Deepgram error:', error);
      });

      // 6. Listen for close
      connection.on(LiveTranscriptionEvents.Close, () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:152',message:'Deepgram connection CLOSED',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.log('Deepgram connection closed');
        setConnectionState(LiveConnectionState.CLOSED);
      });

      // 7. Listen for metadata (to see if Deepgram sends any other info)
      connection.on(LiveTranscriptionEvents.Metadata, (data) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:162',message:'Deepgram METADATA event',data:{metadata:data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
      });

      // 8. Setup microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      // 9. Setup MediaRecorder (let browser choose format like reference implementation)
      const mediaRecorder = new MediaRecorder(stream);
      // NO mimeType - browser will choose best format, Deepgram SDK auto-detects
      mediaRecorderRef.current = mediaRecorder;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:175',message:'MediaRecorder created with browser default',data:{actualMimeType:mediaRecorder.mimeType},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G'})}).catch(()=>{});
      // #endregion

      // Buffer to hold audio chunks until connection opens
      const audioBuffer: Blob[] = [];
      let isConnectionOpen = false;

      // 10. Handle audio chunks - buffer until connection is open, then send immediately
      mediaRecorder.ondataavailable = (event) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:188',message:'Audio chunk available',data:{size:event.data.size,hasConnection:!!connection,isConnectionOpen,bufferedChunks:audioBuffer.length,willBuffer:!isConnectionOpen},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (event.data.size > 0) {
          if (isConnectionOpen && connection) {
            // Connection is open - send immediately
            connection.send(event.data);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:192',message:'Audio chunk SENT to Deepgram immediately',data:{size:event.data.size},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
          } else {
            // Connection not open yet - buffer the chunk
            audioBuffer.push(event.data);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:198',message:'Audio chunk BUFFERED (connection not open yet)',data:{size:event.data.size,totalBuffered:audioBuffer.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'K'})}).catch(()=>{});
            // #endregion
          }
        }
      };

      // 11. START RECORDING IMMEDIATELY (don't wait for connection)
      mediaRecorder.start(250);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:208',message:'MediaRecorder started IMMEDIATELY',data:{interval:250,state:mediaRecorder.state},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'K'})}).catch(()=>{});
      // #endregion

      // 12. When connection opens, send all buffered chunks
      connection.on(LiveTranscriptionEvents.Open, () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:215',message:'Connection opened - sending buffered chunks',data:{bufferedCount:audioBuffer.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
        console.log('Deepgram connection opened');
        setConnectionState(LiveConnectionState.OPEN);
        isConnectionOpen = true;
        // Send all buffered chunks
        audioBuffer.forEach((chunk, index) => {
          connection.send(chunk);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:223',message:'Buffered chunk SENT',data:{index:index+1,of:audioBuffer.length,size:chunk.size},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'K'})}).catch(()=>{});
          // #endregion
        });
        audioBuffer.length = 0; // Clear buffer
      });

    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Failed to start recording. Please check your microphone and try again.');
      setAppState('idle');
    }
  };

  /**
   * Stop Recording
   */
  const handleStopRecording = () => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Close Deepgram connection
    if (connectionRef.current) {
      connectionRef.current.finish(); // SDK method to close gracefully
      connectionRef.current = null;
    }

    // Clear interim text (final results are already in transcription)
    setInterimText('');

    // Release microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setAppState('complete');
  };

  /**
   * Copy Transcription (ClipStream pattern)
   */
  const handleCopy = async () => {
    if (!transcription) return;
    
    try {
      await navigator.clipboard.writeText(transcription);
      console.log('[V3] Copied to clipboard:', transcription.substring(0, 50) + '...');
    } catch (error) {
      console.warn('[V3] Clipboard copy failed:', error);
      // Silently fail - button will still show check mark for visual feedback
    }
  };

  /**
   * Clear (Start New Recording with fade animation)
   */
  const handleClear = () => {
    // Start fade-out animation
    setIsClearing(true);
    
    // Wait for animation to complete (200ms), then clear state
    setTimeout(() => {
    setAppState('idle');
    setTranscription('');
    setInterimText('');
    prevTextLengthRef.current = 0;
      setIsClearing(false);
    }, 200); // Match CSS transition duration
  };

  // KeepAlive logic - keeps connection alive when microphone paused
  useEffect(() => {
    if (!connectionRef.current) return;

    const connection = connectionRef.current;
    let keepAliveInterval: NodeJS.Timeout;

    if (connectionState === LiveConnectionState.OPEN && appState !== 'recording') {
      connection.keepAlive();
      keepAliveInterval = setInterval(() => {
        connection.keepAlive();
      }, 10000); // Every 10 seconds
    }

    return () => {
      clearInterval(keepAliveInterval);
    };
  }, [connectionState, appState]);

  // Auto-scroll to bottom when new text is added (ClipStream pattern)
  useEffect(() => {
    if (!transcription || transcription.length === 0) {
      return;
    }

    // Only auto-scroll when recording (text is being added live)
    if (appState === 'recording') {
      // Small delay to ensure DOM has updated with new text
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
  }, [transcription, appState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.finish();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // #region agent log
  // Log render with current state values
  React.useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/b0a44acd-8318-4899-a04e-eff7ce4ac214',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceTextWrapperLive.tsx:305',message:'Component rendering',data:{appState,transcription,interimText,transcriptionLength:transcription.length,interimLength:interimText.length,combined:interimText?(transcription+(transcription?' ':'')+interimText):transcription},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
  });
  // #endregion

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
                  transcriptText={
                    interimText 
                      ? transcription + (transcription ? ' ' : '') + interimText
                      : transcription
                  }
                  oldTextLength={prevTextLengthRef.current}
                  showCursor={appState === 'recording'}
                />
              </div>

              {/* Fade overlay at bottom (only visible when text overflows) */}
              {(appState === 'recording' || appState === 'complete') && transcription && (
                <div className="fade-overlay"></div>
              )}
            </div>
          </div>
        </div>

        {/* RecordWide Button - Standalone button OUTSIDE the box */}
        <div className="record-wide-wrapper">
          <MorphingRecordWideStopDock
            state={appState}
            onRecordClick={handleStartRecording}
            onStopClick={handleStopRecording}
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

        /* TxtTranscriptBox - Text display area with padding */
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
          overflow: hidden;  /* Clip fade overlay */
        }

        /* Scrollable wrapper for text content */
        .transcript-scroll-wrapper {
          width: 100%;
          max-height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;  /* Space for scrollbar */
          
          /* Smooth transition for fade animation */
          transition: opacity 200ms ease-out;
        }
        
        /* Clearing animation - Simple fade out (Google Docs style) */
        .transcript-scroll-wrapper.clearing {
          opacity: 0;
          pointer-events: none;  /* Prevent interaction during fade */
        }

        /* Custom scrollbar styling */
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

        /* RecordWide Wrapper - Button container OUTSIDE the box */
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
