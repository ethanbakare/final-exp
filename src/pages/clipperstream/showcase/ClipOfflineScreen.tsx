import React, { useState, useRef, useEffect } from 'react';
import { ClipHomeScreen, Clip } from '@/projects/clipperstream/components/ui/ClipHomeScreen';
import { ClipRecordScreen, PendingClip } from '@/projects/clipperstream/components/ui/ClipRecordScreen';

// ClipOfflineScreen Showcase
// Interactive demo of offline recording retry states
// Visualizes 4 states: Waiting, Attempt Active, Between Attempts, Done
// Shows two views side-by-side: Home Screen (ClipHomeScreen) and Detail View (ClipRecordScreen)
// Follows clipscreencomponents.tsx pattern with screen-wrapper (393x692)

type OfflineState = 'waiting' | 'attemptActive' | 'betweenAttempts' | 'done';

// Existing text from a previous recording (for Append mode demonstration)
const existingText = `This is my first recording from earlier today. I captured some initial thoughts about the project direction and what we need to focus on next week.`;

// Sample new transcription text for Done state
const sampleTranscription = `Today I want to share my thoughts on building better products. The key insight I've had recently is that simplicity wins every time. Users don't want a hundred features - they want the one feature that solves their problem perfectly.

The best products feel inevitable - like they couldn't have been designed any other way. That's the bar we should be aiming for.`;

export const ClipOfflineScreen: React.FC = () => {
  const [currentState, setCurrentState] = useState<OfflineState>('waiting');
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [countdown, setCountdown] = useState(0);  // Seconds remaining
  const [phase, setPhase] = useState<'rapid' | 'interval'>('rapid');
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [attemptTimer, setAttemptTimer] = useState(0);    // Seconds current attempt has been running
  const [isAutoMode, setIsAutoMode] = useState(false);    // Auto-progression toggle
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const attemptTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: Get clip status from offline state
  const getClipStatus = (state: OfflineState): 'pending' | 'transcribing' | null => {
    switch (state) {
      case 'waiting':
        return 'pending';
      case 'attemptActive':
      case 'betweenAttempts':
        return 'transcribing';
      case 'done':
        return null;
    }
  };

  // Helper: Get isActiveRequest flag (only true during active HTTP attempt)
  const getIsActiveRequest = (state: OfflineState): boolean => {
    return state === 'attemptActive';
  };

  // Clips for Home Screen (ClipHomeScreen)
  const getOfflineClipsForHome = (): Clip[] => {
        return [{
      id: 'offline-1',
      title: currentState === 'done' ? 'Morning thoughts on productivity' : 'Recording 01',
      date: 'Dec 19, 2025',
      status: getClipStatus(currentState),
      isActiveRequest: getIsActiveRequest(currentState),  // Controls icon spinning
      content: currentState === 'done' ? sampleTranscription : undefined,
            createdAt: Date.now()
        }];
    };

  // Pending clips for Detail View (ClipRecordScreen)
  const offlinePendingClips: PendingClip[] = [{
    id: 'p-offline-1',
    title: 'Clip 001',
    time: '0:45',
    status: currentState === 'waiting' ? 'waiting' : 'transcribing',
    isActiveRequest: getIsActiveRequest(currentState)  // Controls icon spinning
  }];
  
  // Get content blocks for Append scenario
  // Production uses ONE combined content block (see ClipMasterScreen.tsx lines 742-749)
  const getAppendContentBlocks = () => {
    if (currentState === 'done') {
      // Combine existing + new text into ONE block (matches production behavior)
      // Separate blocks would force line breaks due to <div> wrappers
      const combinedText = existingText + "\n\n" + sampleTranscription;
        return [{
        id: 'combined-full',
        text: combinedText,  // Single block preserves natural text flow
        animate: false  // Appears instantly (append behavior)
      }];
    } else {
      // During pending states, show existing text only
      // The pending clip appears below via pendingClips prop
        return [{
        id: 'existing-text',
        text: existingText,
        animate: false
      }];
    }
  };

  // Helper: Add event to log with timestamp
  const addEvent = (message: string) => {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    setEventLog(prev => [...prev, `${time} - ${message}`]);
  };

  // Helper: Get interval label for display
  const getIntervalLabel = (attempt: number): string => {
    if (attempt <= 3) return 'rapid';
    const intervals = ['1min', '2min', '4min', '5min'];
    return intervals[(attempt - 4) % 4];
  };

  // Helper: Get interval seconds (shortened for demo)
  const getIntervalSeconds = (attempt: number): number => {
    // Shortened for demo (normally 60, 120, 240, 300 seconds)
    const intervals = [5, 8, 12, 15];  // 5s, 8s, 12s, 15s for demo
    return intervals[(attempt - 4) % 4];
  };

  // Demo configuration
  const RAPID_ATTEMPT_DURATION = 5;     // Attempts 1-3: 5 seconds each
  const INTERVAL_ATTEMPT_DURATION = 7;  // Attempts 4+: 7 seconds each

  // useEffect: Countdown Timer
  useEffect(() => {
    if (currentState === 'betweenAttempts' && countdown > 0 && isAutoMode) {
      countdownRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [currentState, countdown, isAutoMode]);

  // useEffect: Auto-Transition After Countdown
  useEffect(() => {
    if (currentState === 'betweenAttempts' && countdown === 0 && phase === 'interval' && isAutoMode) {
      // Auto-start next attempt when countdown finishes
      const next = attemptNumber + 1;
      setAttemptNumber(next);
      setCurrentState('attemptActive');
      setAttemptTimer(0);  // Reset attempt timer for next attempt
      addEvent(`Wait complete → Attempt ${next} started`);
    }
  }, [countdown, currentState, phase, attemptNumber, isAutoMode]);

  // useEffect: Initial Event on Mount
  useEffect(() => {
    addEvent("Demo initialized - Click 'Next State' to begin");
  }, []);

  // useEffect: Attempt Timer (counts UP during active attempts)
  useEffect(() => {
    if (currentState === 'attemptActive' && isAutoMode) {
      attemptTimerRef.current = setTimeout(() => {
        setAttemptTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (attemptTimerRef.current) clearTimeout(attemptTimerRef.current);
    };
  }, [currentState, attemptTimer, isAutoMode]);

  // useEffect: Auto-Transition After Attempt Duration (attempt "fails")
  useEffect(() => {
    const currentDuration = phase === 'rapid' ? RAPID_ATTEMPT_DURATION : INTERVAL_ATTEMPT_DURATION;
    
    if (currentState === 'attemptActive' && isAutoMode && attemptTimer >= currentDuration) {
      // Attempt "failed" - move to next state
      setAttemptTimer(0);
      
      if (phase === 'rapid' && attemptNumber < 3) {
        // Rapid phase: immediate next attempt
        const next = attemptNumber + 1;
        setAttemptNumber(next);
        addEvent(`Attempt ${attemptNumber} failed (${RAPID_ATTEMPT_DURATION}s timeout) → Attempt ${next} started`);
        // Stay in attemptActive - timer resets and continues
      } else if (phase === 'rapid' && attemptNumber === 3) {
        // Rapid phase exhausted: transition to interval phase
        setPhase('interval');
        setCurrentState('betweenAttempts');
        setCountdown(getIntervalSeconds(4));
        addEvent(`Attempt 3 failed → Entering interval phase (${getIntervalSeconds(4)}s wait)`);
      } else {
        // Interval phase: go to wait period
        const nextAttempt = attemptNumber + 1;
        setCurrentState('betweenAttempts');
        setCountdown(getIntervalSeconds(nextAttempt));
        addEvent(`Attempt ${attemptNumber} failed (${INTERVAL_ATTEMPT_DURATION}s timeout) → Waiting ${getIntervalSeconds(nextAttempt)}s`);
      }
    }
  }, [attemptTimer, currentState, isAutoMode, phase, attemptNumber]);

  // Control: Step to next state in sequence
  const stepNext = () => {
    if (currentState === 'waiting') {
      setCurrentState('attemptActive');
      setAttemptNumber(1);
      setPhase('rapid');
      addEvent('Attempt 1 started');
    } else if (currentState === 'attemptActive') {
      if (attemptNumber < 3) {
        // Rapid phase: immediate next attempt
        const next = attemptNumber + 1;
        setAttemptNumber(next);
        addEvent(`Attempt ${attemptNumber} failed → Attempt ${next} started`);
      } else if (attemptNumber === 3) {
        // Transition to interval phase
        setPhase('interval');
        setCurrentState('betweenAttempts');
        setCountdown(getIntervalSeconds(4));
        addEvent(`Attempt 3 failed → Entering interval phase (${getIntervalLabel(4)} wait)`);
      } else {
        // Interval phase: go to between attempts
        setCurrentState('betweenAttempts');
        const nextAttempt = attemptNumber + 1;
        setCountdown(getIntervalSeconds(nextAttempt));
        addEvent(`Attempt ${attemptNumber} failed → Waiting ${getIntervalLabel(nextAttempt)}`);
      }
    } else if (currentState === 'betweenAttempts') {
      // Skip wait, start next attempt
      const next = attemptNumber + 1;
      setAttemptNumber(next);
      setCurrentState('attemptActive');
      setCountdown(0);
      addEvent(`Wait skipped → Attempt ${next} started`);
    }
  };

  // Control: Force skip to interval phase
  const forceToIntervalPhase = () => {
    setAttemptNumber(4);
    setPhase('interval');
    setCurrentState('betweenAttempts');
    setCountdown(getIntervalSeconds(4));
    addEvent('⏩ Forced skip to interval phase → Waiting 1min');
  };

  // Control: Force success
  const forceSuccess = () => {
    setCurrentState('done');
    setCountdown(0);
    addEvent('✅ Transcription succeeded');
  };

  // Control: Reset demo
  const resetDemo = () => {
    setIsAutoMode(false);
    setCurrentState('waiting');
    setAttemptNumber(1);
    setPhase('rapid');
    setCountdown(0);
    setAttemptTimer(0);
    setEventLog([]);
    if (countdownRef.current) clearTimeout(countdownRef.current);
    if (attemptTimerRef.current) clearTimeout(attemptTimerRef.current);
    addEvent('Demo reset');
    };

    return (
        <>
      <div className="showcase-content">
        <div className="file-divider">
          <div className="file-label">📁 ClipOfflineScreen.tsx</div>

          <div className="section">
            <h2 className="section-title">Offline Recording Retry States</h2>

            {/* Toggle Buttons */}
            <div className="toggle-controls">
              <button
                className={`toggle-btn ${currentState === 'waiting' ? 'active' : ''}`}
                onClick={() => setCurrentState('waiting')}
              >
                Waiting
              </button>
              <button
                className={`toggle-btn ${currentState === 'attemptActive' ? 'active' : ''}`}
                onClick={() => setCurrentState('attemptActive')}
              >
                Attempt Active
              </button>
              <button
                className={`toggle-btn ${currentState === 'betweenAttempts' ? 'active' : ''}`}
                onClick={() => setCurrentState('betweenAttempts')}
              >
                Between Attempts
              </button>
              <button
                className={`toggle-btn ${currentState === 'done' ? 'active' : ''}`}
                onClick={() => setCurrentState('done')}
              >
                Done
              </button>
            </div>

            <div className="state-description">
              {currentState === 'waiting' && (
                <>
                  <strong>Waiting:</strong> No transcription attempts started yet. Offline or queued. Icon is gray and static.
                </>
              )}
              {currentState === 'attemptActive' && (
                <>
                  <strong>Attempt Active:</strong> HTTP request in progress. Icon spinning (attempts 1-3 continuous, or any active retry).
                </>
              )}
              {currentState === 'betweenAttempts' && (
                <>
                  <strong>Between Attempts:</strong> Waiting between retry attempts (1-5 min intervals). Icon is gray and static.
                  <br /><br />
                  💡 <strong>Tip:</strong> Tap the pending clip in Detail View to skip wait and force immediate retry.
                </>
              )}
              {currentState === 'done' && (
                <>
                  <strong>Done:</strong> Transcription completed successfully. Title changes to AI-generated. Status cleared.
                </>
              )}
            </div>

            <p style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <strong>Retry Pattern:</strong> 3 rapid attempts (~3 min spinning), then interval-based: 1min → 2min → 4min → 5min (cycle repeats).
              Icon only spins during active HTTP requests, stays static during wait periods.
            </p>

            <p style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <strong>Animation Behavior:</strong><br/>
              • <strong>New Recording:</strong> Text slides in with fade-in animation on first transcription (animate: true)<br/>
              • <strong>Append to Existing:</strong> New text appears instantly below existing content (animate: false)
            </p>

            {/* Demo Mode Notice */}
            <p style={{ 
              color: '#22C55E', 
              marginBottom: '1rem', 
              fontSize: '0.875rem',
              background: 'rgba(34, 197, 94, 0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '8px'
            }}>
              ⚡ <strong>Demo Mode:</strong> Intervals shortened to 5s/8s/12s/15s (production: 1min/2min/4min/5min)
            </p>

            {/* Demo Controls */}
            <div className="demo-controls">
              {/* Auto mode toggle */}
              <button 
                className={`control-btn ${isAutoMode ? 'active' : ''}`}
                onClick={() => {
                  const newAutoMode = !isAutoMode;
                  setIsAutoMode(newAutoMode);
                  
                  if (newAutoMode && currentState === 'waiting') {
                    // Start auto demo from beginning
                    setCurrentState('attemptActive');
                    setAttemptNumber(1);
                    setPhase('rapid');
                    setAttemptTimer(0);
                    addEvent('🚀 Auto-demo started: Attempt 1 began');
                  } else if (!newAutoMode) {
                    // Stop auto demo
                    addEvent('⏸️ Auto-demo paused');
                  }
                }}
                title={isAutoMode ? "Stop automatic progression" : "Start automatic progression"}
              >
                {isAutoMode ? '⏸️ Stop Auto' : '▶️ Start Auto'}
              </button>
              
              {/* Manual step (disabled when in auto mode) */}
              <button 
                className="control-btn" 
                onClick={stepNext}
                disabled={isAutoMode}
                title="Step to next state (disabled in auto mode)"
              >
                ⏭️ Next State
              </button>
              
              {/* Skip to interval phase */}
              <button 
                className="control-btn" 
                onClick={forceToIntervalPhase}
                disabled={phase === 'interval' || currentState === 'done'}
                title="Skip rapid phase, jump to interval phase"
              >
                ⏩ Skip to Intervals
              </button>
              
              {/* Force success */}
              <button 
                className="control-btn success" 
                onClick={forceSuccess}
                disabled={currentState === 'done'}
                title="Force successful transcription"
              >
                ✅ Force Success
              </button>
              
              {/* Reset */}
              <button className="control-btn reset" onClick={resetDemo} title="Reset demo">
                🔄 Reset
              </button>
            </div>

            {/* Retry Status Panel - Shows attempt info and countdown */}
            {currentState !== 'waiting' && currentState !== 'done' && (
              <div className="retry-status-panel">
                <div className="attempt-info">
                  <span className="attempt-badge">
                    Attempt {attemptNumber}{phase === 'rapid' ? ` of 3` : ''}
                  </span>
                  <span className="phase-badge">
                    {phase === 'rapid' ? '⚡ Rapid Phase' : '⏰ Interval Phase'}
                  </span>
                </div>
                
                {/* During active attempt: show attempt timer (counting UP) */}
                {currentState === 'attemptActive' && (
                  <div className="active-indicator">
                    🔄 HTTP request in progress... <span className="timer">{attemptTimer}s</span>
                  </div>
                )}
                
                {/* During interval wait: show countdown (counting DOWN) */}
                {currentState === 'betweenAttempts' && phase === 'interval' && (
                  <div className="countdown-display">
                    <span>Next retry in:</span>
                    <span className="countdown-value">{countdown}s</span>
                  </div>
                )}
                
                {/* During rapid "wait" (shouldn't normally happen, but for manual mode) */}
                {currentState === 'betweenAttempts' && phase === 'rapid' && (
                  <div className="rapid-note">
                    Rapid phase - no wait between attempts
                  </div>
                )}
              </div>
            )}

            {/* Event Log Panel */}
            <div className="event-log-panel">
              <div className="event-log-header">
                <span>📋 Event Log</span>
                <button onClick={() => setEventLog([])}>Clear</button>
              </div>
              <div className="event-log-content">
                {eventLog.length === 0 ? (
                  <span className="event-placeholder">Events will appear here...</span>
                ) : (
                  eventLog.map((event, i) => (
                    <div key={i} className="event-item">{event}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="component-grid">
        {/* Home Screen View */}
        <div>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#1C1C1C' }}>Home Screen View</p>
          <div className="screen-wrapper">
            <ClipHomeScreen
              clips={getOfflineClipsForHome()}
              onClipClick={(id) => console.log('Clip clicked:', id)}
              onClipsChange={() => { }}
            />
          </div>
        </div>

        {/* Detail View: New Recording */}
        <div>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#1C1C1C' }}>Detail View: New Recording</p>
          <div className="screen-wrapper">
            <ClipRecordScreen
              state={currentState === 'done' ? 'transcribed' : 'offline'}
              contentBlocks={currentState === 'done' ? [{
                id: 'new-text',
                text: sampleTranscription,
                animate: true  // Slides in with fade animation
              }] : []}
              pendingClips={currentState === 'done' ? [] : offlinePendingClips}
              onBackClick={() => console.log('Back clicked')}
              onNewClipClick={() => console.log('New clip clicked')}
              onTranscribeClick={() => {
                if (currentState === 'betweenAttempts') {
                  setCurrentState('attemptActive');  // Simulate tap-to-skip
                }
              }}
            />
          </div>
        </div>

        {/* Detail View: Append to Existing */}
        <div>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#1C1C1C' }}>Detail View: Append to Existing</p>
          <div className="screen-wrapper">
            <ClipRecordScreen
              state={currentState === 'done' ? 'transcribed' : 'offline'}
              contentBlocks={getAppendContentBlocks()}
              pendingClips={currentState === 'done' ? [] : offlinePendingClips}
              onBackClick={() => console.log('Back clicked')}
              onNewClipClick={() => console.log('New clip clicked')}
              onTranscribeClick={() => {
                if (currentState === 'betweenAttempts') {
                  setCurrentState('attemptActive');  // Simulate tap-to-skip
                }
              }}
            />
          </div>
        </div>
      </div>


      <style jsx>{`
        .showcase-content {
          padding: 2rem;
        }
        
        .file-divider {
          border-top: 2px solid #E5E5E5;
          padding-top: 2rem;
        }
        
        .file-label {
          display: inline-block;
          background: #1C1C1C;
          color: #FFFFFF;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .section {
          margin-bottom: 1.5rem;
        }
        
        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1C1C1C;
          margin-bottom: 1rem;
        }
        
        .toggle-controls {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        
        .toggle-btn {
          padding: 0.5rem 1rem;
          border: 2px solid #1C1C1C;
          border-radius: 8px;
          background: transparent;
          color: #1C1C1C;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .toggle-btn:hover {
          background: rgba(28, 28, 28, 0.1);
        }
        
        .toggle-btn.active {
          background: #1C1C1C;
          color: #FFFFFF;
        }
        
        .state-description {
          color: rgba(0, 0, 0, 0.6);
          font-size: 0.875rem;
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          line-height: 1.6;
        }
        
        .component-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          margin-bottom: 1.5rem;
          align-items: flex-start;
        }
        
        .screen-wrapper {
          width: 393px;
          height: 692px;
          border-radius: 8px;
          overflow: hidden;
          background: #1C1C1C;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        /* Demo Controls */
        .demo-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .control-btn {
          padding: 0.5rem 1rem;
          border: 2px solid #1C1C1C;
          border-radius: 8px;
          background: transparent;
          color: #1C1C1C;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-btn:hover:not(:disabled) {
          background: rgba(28, 28, 28, 0.1);
        }

        .control-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .control-btn.success {
          border-color: #22C55E;
          color: #22C55E;
        }

        .control-btn.reset {
          border-color: #EF4444;
          color: #EF4444;
        }

        /* Retry Status Panel */
        .retry-status-panel {
          background: #F5F5F5;
          border: 2px solid #E5E5E5;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .attempt-info {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .attempt-badge {
          background: #1C1C1C;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .phase-badge {
          background: rgba(28, 28, 28, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.875rem;
        }

        .countdown-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .countdown-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1C1C1C;
          font-family: 'JetBrains Mono', monospace;
        }

        .interval-info {
          color: rgba(0, 0, 0, 0.5);
        }

        .active-indicator {
          color: #1C1C1C;
          font-weight: 500;
        }

        /* Event Log Panel */
        .event-log-panel {
          background: #1C1C1C;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          overflow: hidden;
          max-height: 200px;
        }

        .event-log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 0.875rem;
        }

        .event-log-header button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .event-log-content {
          padding: 0.75rem 1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #A0A0A0;
          max-height: 140px;
          overflow-y: auto;
        }

        .event-item {
          padding: 0.25rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .event-item:last-child {
          border-bottom: none;
        }

        .event-placeholder {
          color: rgba(255, 255, 255, 0.3);
          font-style: italic;
        }

        /* Timer display */
        .timer {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          margin-left: 0.25rem;
        }

        /* Active button state */
        .control-btn.active {
          background: #1C1C1C;
          color: #FFFFFF;
        }

        /* Rapid phase note */
        .rapid-note {
          color: rgba(0, 0, 0, 0.5);
          font-style: italic;
          font-size: 0.875rem;
        }
        
        @media (max-width: 768px) {
          .showcase-content {
            padding: 1rem;
          }
          
          .component-grid {
            padding: 0;
            gap: 1rem;
          }
          
          .screen-wrapper {
            width: 100%;
            height: calc(100vh - 160px);
            border-radius: 0;
          }
        }
      `}</style>
        </>
    );
};

export default ClipOfflineScreen;
