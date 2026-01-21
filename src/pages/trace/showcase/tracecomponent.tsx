import React, { useState } from 'react';
import styles from '@/projects/trace/styles/trace.module.css';
import {
  UploadButton,
  SpeakButton,
  CloseButton,
  SendAudioButton,
  ProcessingAudioButton,
  ProcessingImageButton
} from '@/projects/trace/components/ui/tracebuttons';

// Trace UI Component Showcase
// Displays individual UI components in isolation
// Following voicecomponent.tsx pattern with dark theme

// ButtonGrid - Only for showcase display
interface ButtonGridProps {
  children: React.ReactNode;
  label: string;
  showToggle?: boolean;
  toggleState?: boolean;
  onToggle?: () => void;
  isDouble?: boolean; // For 400×200 processing buttons
}

const ButtonGrid: React.FC<ButtonGridProps> = ({
  children,
  label,
  showToggle = false,
  toggleState = false,
  onToggle,
  isDouble = false
}) => {
  return (
    <>
      <div className={`button-grid ${isDouble ? 'box-double' : 'box-single'}`}>
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
          /* Layout */
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          /* Style - Lighter borders for dark background */
          border: 0.8px solid rgba(255, 255, 255, 0.1);
          border-radius: 0px;
          background: transparent;

          /* Inside auto layout */
          flex: none;
        }

        .box-single {
          width: 200px;
          height: 200px;
        }

        .box-double {
          width: 400px;
          height: 200px;
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

          font-family: var(--trace-font-family);
          font-size: 0.375rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: var(--trace-text-tertiary);

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
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          position: relative;
          transition: background 0.2s ease;
        }

        .toggle-switch.active {
          background: rgba(255, 255, 255, 0.4);
        }

        .toggle-slider {
          width: 12px;
          height: 12px;
          background: var(--trace-text-primary);
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

const TraceComponent: React.FC = () => {
  // SendAudio animation control
  const [isSendAudioRecording, setIsSendAudioRecording] = useState(false);

  // Processing button animation control
  const [isProcessingAudio, setIsProcessingAudio] = useState(true);
  const [isProcessingImage, setIsProcessingImage] = useState(true);

  // Navbar state control (for demonstration)
  const [navbarState, setNavbarState] = useState<'idle' | 'recording' | 'processing_audio' | 'processing_image'>('idle');

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: var(--trace-bg-showcase);
        }

        .showcase-container {
          padding: 2rem;
          min-height: 100vh;
          background-color: var(--trace-bg-showcase);
        }

        .section {
          margin-bottom: 3rem;
        }

        .section-title {
          color: var(--trace-text-primary);
          font-family: var(--trace-font-family);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .seamless-grid {
          display: inline-flex;
          flex-wrap: wrap;
          max-width: 1200px;
          margin-left: -0.8px;
          margin-top: -0.8px;
        }

        .file-label {
          color: var(--trace-text-tertiary);
          font-family: var(--trace-font-family);
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 2rem;
        }

        /* Navbar State Showcase Container */
        .navbar-showcase {
          position: relative;
          width: 400px;
          height: 200px;
          border: 0.8px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .navbar-state-controls {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 0px;
          align-items: center;
          z-index: 10;
        }

        /* State Toggle Buttons */
        .state-toggle-btn {
          padding: 2px 8px;
          font-size: 10px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          margin-left: -1px;
          position: relative;
          color: var(--trace-text-tertiary);
          transition: background 0.2s, z-index 0s, color 0.15s ease;
          background: rgba(255, 255, 255, 0.05);
        }

        .state-toggle-btn.active {
          color: var(--trace-text-primary);
          background: rgba(255, 255, 255, 0.2);
        }

        .state-toggle-btn.first {
          border-radius: 6px 0 0 6px;
          margin-left: 0;
        }

        .state-toggle-btn.last {
          border-radius: 0 6px 6px 0;
        }

        .state-toggle-btn:hover {
          z-index: 10;
          color: var(--trace-text-primary);
        }

        .navbar-label {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--trace-font-family);
          font-size: 0.375rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: var(--trace-text-tertiary);
          white-space: nowrap;
        }
      `}</style>

      <div className={`showcase-container ${styles.container}`}>
        {/* Atomic Buttons Section */}
        <div className="section">
          <h2 className="section-title">Trace UI Components</h2>
          <div className="file-label">📁 tracebuttons.tsx</div>

          {/* Seamless grid layout - borders touch */}
          <div className="seamless-grid">
            <ButtonGrid label="UPLOAD BUTTON - 97×44PX">
              <UploadButton onClick={() => console.log('Upload clicked')} />
            </ButtonGrid>

            <ButtonGrid label="SPEAK BUTTON - 106×44PX">
              <SpeakButton onClick={() => console.log('Speak clicked')} />
            </ButtonGrid>

            <ButtonGrid label="CLOSE BUTTON - 56×44PX">
              <CloseButton onClick={() => console.log('Close clicked')} />
            </ButtonGrid>

            <ButtonGrid
              label="SEND AUDIO BUTTON - 150×44PX (ANIMATED)"
              showToggle={true}
              toggleState={isSendAudioRecording}
              onToggle={() => setIsSendAudioRecording(!isSendAudioRecording)}
            >
              <SendAudioButton
                onClick={() => console.log('Send Audio clicked')}
                isRecording={isSendAudioRecording}
              />
            </ButtonGrid>

            <ButtonGrid
              label="PROCESSING AUDIO BUTTON - 301×44PX (SPINNING)"
              showToggle={true}
              toggleState={isProcessingAudio}
              onToggle={() => setIsProcessingAudio(!isProcessingAudio)}
              isDouble={true}
            >
              <ProcessingAudioButton text="Analysing Audio" />
            </ButtonGrid>

            <ButtonGrid
              label="PROCESSING IMAGE BUTTON - 301×44PX (SPINNING)"
              showToggle={true}
              toggleState={isProcessingImage}
              onToggle={() => setIsProcessingImage(!isProcessingImage)}
              isDouble={true}
            >
              <ProcessingImageButton text="Processing Image" />
            </ButtonGrid>
          </div>
        </div>

        {/* TRNavbar States Section */}
        <div className="section">
          <h2 className="section-title">TRNavbar States</h2>
          <div className="file-label">📁 tracenavbar.tsx (Preview)</div>

          <div className="seamless-grid">
            {/* Idle State */}
            <div className="navbar-showcase">
              <div className="navbar-state-controls">
                <button
                  className={`state-toggle-btn first ${navbarState === 'idle' ? 'active' : ''}`}
                  onClick={() => setNavbarState('idle')}
                >IDLE</button>
                <button
                  className={`state-toggle-btn ${navbarState === 'recording' ? 'active' : ''}`}
                  onClick={() => setNavbarState('recording')}
                >REC</button>
                <button
                  className={`state-toggle-btn ${navbarState === 'processing_audio' ? 'active' : ''}`}
                  onClick={() => setNavbarState('processing_audio')}
                >P-AUD</button>
                <button
                  className={`state-toggle-btn last ${navbarState === 'processing_image' ? 'active' : ''}`}
                  onClick={() => setNavbarState('processing_image')}
                >P-IMG</button>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {navbarState === 'idle' && (
                  <>
                    <UploadButton />
                    <SpeakButton />
                    <CloseButton />
                  </>
                )}

                {navbarState === 'recording' && (
                  <SendAudioButton isRecording={true} />
                )}

                {navbarState === 'processing_audio' && (
                  <ProcessingAudioButton text="Analysing Audio" />
                )}

                {navbarState === 'processing_image' && (
                  <ProcessingImageButton text="Processing Image" />
                )}
              </div>

              <div className="navbar-label">
                TRNAVBAR - 4 STATES (IDLE → RECORDING → PROCESSING)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TraceComponent;
