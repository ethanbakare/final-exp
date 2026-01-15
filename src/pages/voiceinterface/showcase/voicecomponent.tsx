import React, { useState } from 'react';
import {
  CheckAndCloseButton,
  RecordButton,
  RecordButtonFilled,
  CloseButton,
  RecordWideButton,
  StopRecordButton,
  CopyButton,
  ClearButton,
  TimeCountButton,
  RecordingWaveButton,
  ProcessingButtonDark,
  ProcessingButtonOutlined,
  ProcessingButtonBigDark,
  VoicePillWave,
  VoicePillConfirm,
  VoiceDockCenter
} from '@/projects/voiceinterface/components/ui/voicebuttons';
import { MorphingRecordToPillWave } from '@/projects/voiceinterface/components/ui/voicemorphingbuttons';

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
        <div className="section">
          <h2 className="section-title">Morphing Buttons</h2>
          <div className="file-label">📁 voicemorphingbuttons.tsx</div>

          {/* Seamless grid layout */}
          <div className="seamless-grid">
            <ButtonGrid
              label="MORPHING RECORD TO PILL WAVE - 38PX ↔ 114PX"
              showToggle={true}
              toggleState={morphingRecordState === 'recording'}
              onToggle={() => setMorphingRecordState(morphingRecordState === 'idle' ? 'recording' : 'idle')}
            >
              <MorphingRecordToPillWave
                state={morphingRecordState}
                onRecordClick={() => setMorphingRecordState('recording')}
                onStopRecordingClick={() => setMorphingRecordState('idle')}
              />
            </ButtonGrid>
          </div>
        </div>
      </div>
    </>
  );
};

export default VoiceComponents;
