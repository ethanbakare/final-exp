import React, { useState } from 'react';
import {
  CheckAndCloseButton,
  RecordButton,
  RecordButtonFilled,
  RecordButtonDark,
  CloseButton,
  RecordWideButton,
  StopRecordButton,
  CopyButton,
  ClearButton,
  ClearButtonFaded,
  TimeCountButton,
  RecordingWaveButton,
  ProcessingButtonDark,
  ProcessingButtonOutlined,
  ProcessingButtonBigDark,
  VoicePillWave,
  VoicePillConfirm,
  VoiceDockCenter,
  RecordDeleteCombo
} from '@/projects/voiceinterface/components/ui/voicebuttons';
import { MorphingRecordToPillWave, MorphingRecordToPillConfirm, MorphingRecordWideToStop, MorphingRecordToPillConfirmProcessing, MorphingRecordDarkToPillWave, MorphingRecordDarkToPillWaveProcessing } from '@/projects/voiceinterface/components/ui/voicemorphingbuttons';
import { MorphingRecordDarkToPillWaveProcessing as VoiceNavBarImplementation, MorphingRecordWideStopDock, MorphingProcessingToCombo } from '@/projects/voiceinterface/components/ui/voicenavbar';

// Voice Interface Component Showcase
// Displays individual UI components in isolation
// Following clipcomponent.tsx pattern

// ButtonGrid - Only for showcase display
interface ButtonGridProps {
  children: React.ReactNode;
  label: string;
  showToggle?: boolean;
  toggleState?: boolean;
  onToggle?: () => void;
}

const ButtonGrid: React.FC<ButtonGridProps> = ({
  children,
  label,
  showToggle = false,
  toggleState = false,
  onToggle
}) => {
  return (
    <>
      <div className="button-grid">
        {/* Toggle switch at top-right corner */}
        {showToggle && (
          <div className="toggle-container" onClick={onToggle}>
            <div className={`toggle-switch ${toggleState ? 'active' : ''}`}>
              <div className="toggle-slider"></div>
            </div>
          </div>
        )}

        {/* Main centered button area */}
        <div className="button-center">
          {children}
        </div>

        {/* Label at bottom inside grid */}
        <div className="button-label">
          {label}
        </div>
      </div>

      <style jsx>{`
        .button-grid {
          /* Size */
          width: 200px;
          height: 200px;

          /* Layout */
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          /* Style */
          border: 0.8px solid rgba(38, 36, 36, 0.05);
          border-radius: 0px;
          background: transparent;

          /* Inside auto layout */
          flex: none;
        }

        .button-center {
          /* Centered content */
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
        }

        .button-label {
          /* Bottom label text */
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);

          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 0.375rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: rgba(94, 94, 94, 0.5);

          white-space: nowrap;
        }

        .toggle-container {
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0.3;
          cursor: pointer;
          transition: opacity 0.2s ease;
          z-index: 10;
        }

        .toggle-container:hover {
          opacity: 0.6;
        }

        .toggle-switch {
          width: 28px;
          height: 16px;
          background: rgba(38, 36, 36, 0.2);
          border-radius: 8px;
          position: relative;
          transition: background 0.2s ease;
        }

        .toggle-switch.active {
          background: rgba(38, 36, 36, 0.5);
        }

        .toggle-slider {
          width: 12px;
          height: 12px;
          background: #FFFFFF;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: left 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.active .toggle-slider {
          left: 14px;
        }
      `}</style>
    </>
  );
};

const VoiceComponents: React.FC = () => {
  // Timer control state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSecondsTimerActive, setIsSecondsTimerActive] = useState(false);
  const [isRecordingWave, setIsRecordingWave] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isProcessingOutlined, setIsProcessingOutlined] = useState(true);
  const [isProcessingBig, setIsProcessingBig] = useState(true);
  const [isPillWaveActive, setIsPillWaveActive] = useState(false);
  const [isPillConfirmActive, setIsPillConfirmActive] = useState(false);
  const [morphingRecordState, setMorphingRecordState] = useState<'idle' | 'recording'>('idle');
  const [morphingConfirmState, setMorphingConfirmState] = useState<'idle' | 'recording'>('idle');
  const [morphingWideStopState, setMorphingWideStopState] = useState<'idle' | 'recording'>('idle');
  const [morphingDockState, setMorphingDockState] = useState<'idle' | 'recording' | 'complete'>('idle');
  const [morphingConfirmProcessingState, setMorphingConfirmProcessingState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [morphingProcessingComboState, setMorphingProcessingComboState] = useState<'idle' | 'recording' | 'processing' | 'combo'>('idle');
  const [morphingDarkWaveState, setMorphingDarkWaveState] = useState<'idle' | 'recording'>('idle');
  const [morphingDarkWaveProcessingState, setMorphingDarkWaveProcessingState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [voiceNavBarState, setVoiceNavBarState] = useState<'idle' | 'recording' | 'processing' | 'complete'>('idle');

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #FFFFFF;
        }

        .showcase-container {
          padding: 2rem;
          min-height: 100vh;
          background-color: #FFFFFF;
        }

        .section {
          margin-bottom: 3rem;
        }

        .section-title {
          color: #1C1C1C;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .seamless-grid {
          display: inline-flex;
          flex-wrap: wrap;
          max-width: 1000px;
          margin-left: -0.8px;
          margin-top: -0.8px;
        }

        .file-label {
          color: rgba(0, 0, 0, 0.5);
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 2rem;
        }

        /* Morphing button showcase container */
        .morphing-button-showcase {
          position: relative;
          /* Base styles */
          border: 0.8px solid rgba(38, 36, 36, 0.05);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 40px;
        }

        /* Standardized Box Sizes */
        .box-single {
          width: 200px;
          height: 200px;
        }

        .box-wide {
          width: 300px;
          height: 200px;
        }

        .box-double {
          width: 400px;
          height: 200px;
        }

        .morphing-toggle-container {
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0.3;
          cursor: pointer;
          transition: opacity 0.2s ease;
          z-index: 10;
        }

        .morphing-toggle-container:hover {
          opacity: 0.6;
        }

        .morphing-toggle-container .toggle-switch {
          width: 28px;
          height: 16px;
          background: rgba(38, 36, 36, 0.2);
          border-radius: 8px;
          position: relative;
          transition: background 0.2s ease;
        }

        .morphing-toggle-container .toggle-switch.active {
          background: rgba(38, 36, 36, 0.5);
        }

        .morphing-toggle-container .toggle-slider {
          width: 12px;
          height: 12px;
          background: #FFFFFF;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: left 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .morphing-toggle-container .toggle-switch.active .toggle-slider {
          left: 14px;
        }

        .morphing-button-wrapper {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .morphing-button-label {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 0.375rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: rgba(94, 94, 94, 0.5);
          white-space: nowrap;
        }

        /* Unified Pill Toggle Buttons */
        .pill-toggle-btn {
          padding: 2px 8px;
          font-size: 10px;
          border: 1px solid rgba(38, 36, 36, 0.3);
          cursor: pointer;
          margin-left: -1px; /* Overlap borders */
          position: relative; /* For z-index */
          color: rgba(0,0,0,0.6);
          transition: background 0.2s, z-index 0s, color 0.15s ease;
        }
        
        .pill-toggle-btn.active {
          color: #000000;
        }

        .pill-toggle-btn.first {
          border-radius: 6px 0 0 6px;
          margin-left: 0;
        }

        .pill-toggle-btn.last {
          border-radius: 0 6px 6px 0;
        }

        .pill-toggle-btn:hover {
          z-index: 10;
          color: #000000;
        }
      `}</style>

      <div className="showcase-container">
        <div className="section">
          <h2 className="section-title">Voice Interface Components</h2>
          <div className="file-label">📁 voicebuttons.tsx</div>

          {/* Seamless grid layout - borders touch */}
          <div className="seamless-grid">
            <ButtonGrid label="CHECK AND CLOSE BUTTON - 72PX">
              <CheckAndCloseButton />
            </ButtonGrid>

            <ButtonGrid label="RECORD BUTTON - 38PX">
              <RecordButton />
            </ButtonGrid>

            <ButtonGrid label="RECORD BUTTON FILLED - 38PX">
              <RecordButtonFilled />
            </ButtonGrid>

            <ButtonGrid label="RECORD BUTTON DARK - 38PX">
              <RecordButtonDark />
            </ButtonGrid>

            <ButtonGrid label="CLOSE BUTTON - 38PX">
              <CloseButton />
            </ButtonGrid>

            <ButtonGrid label="RECORD WIDE BUTTON - 76PX">
              <RecordWideButton />
            </ButtonGrid>

            <ButtonGrid
              label="STOP RECORD BUTTON - 112PX"
              showToggle={true}
              toggleState={isTimerRunning}
              onToggle={() => setIsTimerRunning(!isTimerRunning)}
            >
              <StopRecordButton isTimerRunning={isTimerRunning} />
            </ButtonGrid>

            <ButtonGrid label="COPY BUTTON - 38PX">
              <CopyButton />
            </ButtonGrid>

            <ButtonGrid label="CLEAR BUTTON - 38PX">
              <ClearButton />
            </ButtonGrid>

            <ButtonGrid label="CLEAR BUTTON FADED - 38PX">
              <ClearButtonFaded />
            </ButtonGrid>

            <ButtonGrid label="RECORD DELETE COMBO">
              <RecordDeleteCombo />
            </ButtonGrid>

            <ButtonGrid
              label="TIME COUNT BUTTON - 58PX"
              showToggle={true}
              toggleState={isSecondsTimerActive}
              onToggle={() => setIsSecondsTimerActive(!isSecondsTimerActive)}
            >
              <TimeCountButton isTimerRunning={isSecondsTimerActive} />
            </ButtonGrid>

            <ButtonGrid
              label="RECORDING WAVE BUTTON - 64PX"
              showToggle={true}
              toggleState={isRecordingWave}
              onToggle={() => setIsRecordingWave(!isRecordingWave)}
            >
              <RecordingWaveButton isRecording={isRecordingWave} />
            </ButtonGrid>

            <ButtonGrid
              label="PROCESSING BUTTON DARK - 64PX"
              showToggle={true}
              toggleState={isProcessing}
              onToggle={() => setIsProcessing(!isProcessing)}
            >
              <ProcessingButtonDark isProcessing={isProcessing} />
            </ButtonGrid>

            <ButtonGrid
              label="PROCESSING BUTTON OUTLINED - 72PX"
              showToggle={true}
              toggleState={isProcessingOutlined}
              onToggle={() => setIsProcessingOutlined(!isProcessingOutlined)}
            >
              <ProcessingButtonOutlined isProcessing={isProcessingOutlined} />
            </ButtonGrid>

            <ButtonGrid
              label="PROCESSING BUTTON BIG DARK - 112PX"
              showToggle={true}
              toggleState={isProcessingBig}
              onToggle={() => setIsProcessingBig(!isProcessingBig)}
            >
              <ProcessingButtonBigDark isProcessing={isProcessingBig} />
            </ButtonGrid>

            <ButtonGrid
              label="VOICE PILL WAVE - 114PX"
              showToggle={true}
              toggleState={isPillWaveActive}
              onToggle={() => setIsPillWaveActive(!isPillWaveActive)}
            >
              <VoicePillWave isActive={isPillWaveActive} />
            </ButtonGrid>

            <ButtonGrid
              label="VOICE PILL CONFIRM - 140PX"
              showToggle={true}
              toggleState={isPillConfirmActive}
              onToggle={() => setIsPillConfirmActive(!isPillConfirmActive)}
            >
              <VoicePillConfirm isTimerRunning={isPillConfirmActive} />
            </ButtonGrid>

            <ButtonGrid label="VOICE DOCK CENTER">
              <VoiceDockCenter />
            </ButtonGrid>
          </div>
        </div>

        {/* Morphing Buttons Section */}
        <div className="section morphing-section">
          <h2 className="section-title">Morphing Buttons</h2>
          <div className="file-label">📁 voicemorphingbuttons.tsx</div>

          <div className="seamless-grid">
            {/* Standalone morphing button container */}
            <div className="morphing-button-showcase box-single">
              {/* Toggle switch */}
              <div className="morphing-toggle-container" onClick={() => setMorphingRecordState(morphingRecordState === 'idle' ? 'recording' : 'idle')}>
                <div className={`toggle-switch ${morphingRecordState === 'recording' ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>

              {/* Morphing button */}
              <div className="morphing-button-wrapper">
                <MorphingRecordToPillWave
                  state={morphingRecordState}
                  onRecordClick={() => setMorphingRecordState('recording')}
                  onStopRecordingClick={() => setMorphingRecordState('idle')}
                />
              </div>

              {/* Label */}
              <div className="morphing-button-label">
                MORPHING RECORD TO PILL WAVE - 38PX ↔ 114-126PX
              </div>
            </div>

            {/* MorphingRecordWideToStop - Square container, centered */}
            <div className="morphing-button-showcase box-single" style={{ justifyContent: 'center', paddingRight: '0' }}>
              <div className="morphing-toggle-container" onClick={() => setMorphingWideStopState(morphingWideStopState === 'idle' ? 'recording' : 'idle')}>
                <div className={`toggle-switch ${morphingWideStopState === 'recording' ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
              <div className="morphing-button-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
                <MorphingRecordWideToStop
                  state={morphingWideStopState}
                  onRecordClick={() => setMorphingWideStopState('recording')}
                  onStopClick={() => setMorphingWideStopState('idle')}
                />
              </div>
              <div className="morphing-button-label">
                RECORD WIDE → STOP - 76×44 ↔ 112×46
              </div>
            </div>


            {/* MorphingRecordToPillConfirm */}
            <div className="morphing-button-showcase box-single">
              <div className="morphing-toggle-container" onClick={() => setMorphingConfirmState(morphingConfirmState === 'idle' ? 'recording' : 'idle')}>
                <div className={`toggle-switch ${morphingConfirmState === 'recording' ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
              <div className="morphing-button-wrapper">
                <MorphingRecordToPillConfirm
                  state={morphingConfirmState}
                  onRecordClick={() => setMorphingConfirmState('recording')}
                  onConfirmClick={() => setMorphingConfirmState('idle')}
                  onCancelClick={() => setMorphingConfirmState('idle')}
                />
              </div>
              <div className="morphing-button-label">
                MORPHING RECORD TO PILL CONFIRM - 38PX → 72×34PX
              </div>
            </div>

            {/* MorphingRecordToPillConfirmProcessing - with Processing State */}
            <div className="morphing-button-showcase box-single">
              <div className="morphing-toggle-container" style={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
                <button
                  className={`pill-toggle-btn first ${morphingConfirmProcessingState === 'idle' ? 'active' : ''}`}
                  onClick={() => setMorphingConfirmProcessingState('idle')}
                  style={{
                    background: morphingConfirmProcessingState === 'idle' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                    opacity: 1,
                  }}
                >IDLE</button>
                <button
                  className={`pill-toggle-btn ${morphingConfirmProcessingState === 'recording' ? 'active' : ''}`}
                  onClick={() => setMorphingConfirmProcessingState('recording')}
                  style={{
                    background: morphingConfirmProcessingState === 'recording' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                    opacity: 1,
                  }}
                >REC</button>
                <button
                  className={`pill-toggle-btn last ${morphingConfirmProcessingState === 'processing' ? 'active' : ''}`}
                  onClick={() => setMorphingConfirmProcessingState('processing')}
                  style={{
                    background: morphingConfirmProcessingState === 'processing' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                    opacity: 1,
                  }}
                >PROC</button>
                <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 15.5V18.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M4.5 10L1.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M10 1.5V4.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M18.5 10L15.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className="morphing-button-wrapper">
                <MorphingRecordToPillConfirmProcessing
                  state={morphingConfirmProcessingState}
                  onRecordClick={() => setMorphingConfirmProcessingState('recording')}
                  onConfirmClick={() => setMorphingConfirmProcessingState('processing')}
                  onCancelClick={() => setMorphingConfirmProcessingState('idle')}
                  onProcessingComplete={() => setMorphingConfirmProcessingState('idle')}
                />
              </div>
              <div className="morphing-button-label">
                CONFIRM + PROCESSING (AUTO-REVERT 3s)
              </div>
            </div>

            {/* MorphingRecordDarkToPillWave - 2-state */}
            <div className="morphing-button-showcase box-single">
              <div className="morphing-toggle-container" onClick={() => setMorphingDarkWaveState(morphingDarkWaveState === 'idle' ? 'recording' : 'idle')}>
                <div className={`toggle-switch ${morphingDarkWaveState === 'recording' ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
              <div className="morphing-button-wrapper">
                <MorphingRecordDarkToPillWave
                  state={morphingDarkWaveState}
                  onRecordClick={() => setMorphingDarkWaveState('recording')}
                  onStopRecordingClick={() => setMorphingDarkWaveState('idle')}
                />
              </div>
              <div className="morphing-button-label">
                DARK RECORD → PILL WAVE
              </div>
            </div>

            {/* MorphingRecordDarkToPillWaveProcessing - 3-state */}
            <div className="morphing-button-showcase box-single">
              <div className="morphing-toggle-container" style={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
                <button
                  className={`pill-toggle-btn first ${morphingDarkWaveProcessingState === 'idle' ? 'active' : ''}`}
                  onClick={() => setMorphingDarkWaveProcessingState('idle')}
                  style={{
                    background: morphingDarkWaveProcessingState === 'idle' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                    opacity: 1,
                  }}
                >IDLE</button>
                <button
                  className={`pill-toggle-btn ${morphingDarkWaveProcessingState === 'recording' ? 'active' : ''}`}
                  onClick={() => setMorphingDarkWaveProcessingState('recording')}
                  style={{
                    background: morphingDarkWaveProcessingState === 'recording' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                    opacity: 1,
                  }}
                >REC</button>
                <button
                  className={`pill-toggle-btn last ${morphingDarkWaveProcessingState === 'processing' ? 'active' : ''}`}
                  onClick={() => setMorphingDarkWaveProcessingState('processing')}
                  style={{
                    background: morphingDarkWaveProcessingState === 'processing' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                    opacity: 1,
                  }}
                >PROC</button>
                <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 15.5V18.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M4.5 10L1.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M10 1.5V4.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M18.5 10L15.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className="morphing-button-wrapper">
                <MorphingRecordDarkToPillWaveProcessing
                  state={morphingDarkWaveProcessingState}
                  onRecordClick={() => setMorphingDarkWaveProcessingState('recording')}
                  onStopRecordingClick={() => setMorphingDarkWaveProcessingState('processing')}
                  onProcessingComplete={() => setMorphingDarkWaveProcessingState('idle')}
                />
              </div>
              <div className="morphing-button-label">
                DARK RECORD → PILL WAVE → PROC
              </div>
            </div>

          </div>
        </div>

        {/* Voice Navigation Bar Section */}
        <div className="section">
          <h2 className="section-title">Voice Navigation Bar</h2>
          <div className="file-label">📁 voicenavbar.tsx</div>

          <div className="seamless-grid">
            <div className="morphing-button-showcase box-double" style={{ justifyContent: 'center', paddingRight: '0' }}>
              <div className="morphing-toggle-container" style={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
                <button
                  className={`pill-toggle-btn first ${voiceNavBarState === 'idle' ? 'active' : ''}`}
                  onClick={() => setVoiceNavBarState('idle')}
                  style={{
                    background: voiceNavBarState === 'idle' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                    opacity: 1,
                  }}
                >IDLE</button>
                <button
                  className={`pill-toggle-btn ${voiceNavBarState === 'recording' ? 'active' : ''}`}
                  onClick={() => setVoiceNavBarState('recording')}
                  style={{
                    background: voiceNavBarState === 'recording' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                    opacity: 1,
                  }}
                >REC</button>
                <button
                  className={`pill-toggle-btn ${voiceNavBarState === 'processing' ? 'active' : ''}`}
                  onClick={() => setVoiceNavBarState('processing')}
                  style={{
                    background: voiceNavBarState === 'processing' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                    opacity: 1,
                  }}
                >PROC</button>
                <button
                  className={`pill-toggle-btn last ${voiceNavBarState === 'complete' ? 'active' : ''}`}
                  onClick={() => setVoiceNavBarState('complete')}
                  style={{
                    background: voiceNavBarState === 'complete' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                    opacity: 1,
                  }}
                >COMP</button>
                <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 15.5V18.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M4.5 10L1.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M10 1.5V4.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M18.5 10L15.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className="morphing-button-wrapper" style={{ justifyContent: 'center' }}>
                <VoiceNavBarImplementation
                  state={voiceNavBarState}
                  onRecordClick={() => setVoiceNavBarState('recording')}
                  onStopRecordingClick={() => setVoiceNavBarState('processing')}
                  onProcessingComplete={() => setVoiceNavBarState('complete')}
                  onCloseClick={() => setVoiceNavBarState('idle')}
                  onClearClick={() => setVoiceNavBarState('idle')}
                />
              </div>
              <div className="morphing-button-label">
                DARK RECORD → PILL WAVE → PROC → COMPLETE
              </div>
            </div>
          </div>

          {/* MorphingProcessingToCombo - 4-state (moved from voicemorphingbuttons) */}
          <div className="morphing-button-showcase box-double">
            <div className="morphing-toggle-container" style={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
              <button
                className={`pill-toggle-btn first ${morphingProcessingComboState === 'idle' ? 'active' : ''}`}
                onClick={() => setMorphingProcessingComboState('idle')}
                style={{
                  background: morphingProcessingComboState === 'idle' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                  opacity: 1,
                }}
              >IDLE</button>
              <button
                className={`pill-toggle-btn ${morphingProcessingComboState === 'recording' ? 'active' : ''}`}
                onClick={() => setMorphingProcessingComboState('recording')}
                style={{
                  background: morphingProcessingComboState === 'recording' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                  opacity: 1,
                }}
              >REC</button>
              <button
                className={`pill-toggle-btn ${morphingProcessingComboState === 'processing' ? 'active' : ''}`}
                onClick={() => setMorphingProcessingComboState('processing')}
                style={{
                  background: morphingProcessingComboState === 'processing' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                  opacity: 1,
                }}
              >PROC</button>
              <button
                className={`pill-toggle-btn last ${morphingProcessingComboState === 'combo' ? 'active' : ''}`}
                onClick={() => setMorphingProcessingComboState('combo')}
                style={{
                  background: morphingProcessingComboState === 'combo' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                  opacity: 1,
                }}
              >COMBO</button>
              <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 15.5V18.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M4.5 10L1.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M10 1.5V4.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M18.5 10L15.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="morphing-button-wrapper">
              <MorphingProcessingToCombo
                state={morphingProcessingComboState}
                onRecordClick={() => setMorphingProcessingComboState('recording')}
                onConfirmClick={() => setMorphingProcessingComboState('processing')}
                onCancelClick={() => setMorphingProcessingComboState('idle')}
                onProcessingComplete={() => setMorphingProcessingComboState('combo')}
              />
            </div>
            <div className="morphing-button-label">
              PROC → COMBO (Split Morph)
            </div>
          </div>

          {/* MorphingRecordWideStopDock - 3-state (moved from voicemorphingbuttons) */}
          <div className="morphing-button-showcase box-wide" style={{ justifyContent: 'center', paddingRight: '0' }}>
            <div className="morphing-toggle-container" style={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
              {/* 3-state toggle */}
              <button
                className={`pill-toggle-btn first ${morphingDockState === 'idle' ? 'active' : ''}`}
                onClick={() => setMorphingDockState('idle')}
                style={{
                  background: morphingDockState === 'idle' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                  opacity: 1,
                }}
              >IDLE</button>
              <button
                className={`pill-toggle-btn ${morphingDockState === 'recording' ? 'active' : ''}`}
                onClick={() => setMorphingDockState('recording')}
                style={{
                  background: morphingDockState === 'recording' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                  opacity: 1,
                }}
              >REC</button>
              <button
                className={`pill-toggle-btn last ${morphingDockState === 'complete' ? 'active' : ''}`}
                onClick={() => setMorphingDockState('complete')}
                style={{
                  background: morphingDockState === 'complete' ? 'rgba(38, 36, 36, 0.2)' : 'rgba(38, 36, 36, 0.05)',
                  opacity: 1,
                }}
              >DONE</button>
              <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 15.5V18.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M4.5 10L1.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M10 1.5V4.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M18.5 10L15.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="morphing-button-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
              <MorphingRecordWideStopDock
                state={morphingDockState}
                onRecordClick={() => setMorphingDockState('recording')}
                onStopClick={() => setMorphingDockState('complete')}
                onCopyClick={() => console.log('Copy clicked')}
                onClearClick={() => setMorphingDockState('idle')}
              />
            </div>
            <div className="morphing-button-label">
              RECORD WIDE → STOP → DOCK (3 STATES)
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VoiceComponents;
