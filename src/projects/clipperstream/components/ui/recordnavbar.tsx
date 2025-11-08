import React from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { CloseButton, DoneButton, TimerText, CopyButton, RecordButton, StructureButton } from './clipbuttons';
import { WaveClipper } from './waveClipper';

// RecordNavBar Component
// The recording interface navigation bar with audio waveform visualization

/* ============================================
   RECORD NAV BAR - Main recording interface bar
   ============================================ */

interface RecordNavBarProps {
  onClose?: () => void;
  onDone?: () => void;
  time?: string;
  audioAnalyser?: AnalyserNode | null;
  isRecording?: boolean;
  isFrozen?: boolean;
  className?: string;
}

export const RecordNavBar: React.FC<RecordNavBarProps> = ({ 
  onClose,
  onDone,
  time = '100:26',
  audioAnalyser,
  isRecording = false,
  isFrozen = false,
  className = '' 
}) => {
  return (
    <>
      <div className={`record-bar-nav ${className} ${styles.container}`}>
        <CloseButton onClick={onClose} />
        
        <div className="audio-container">
          <WaveClipper 
            audioAnalyser={audioAnalyser}
            isRecording={isRecording}
            isFrozen={isFrozen}
          />
        </div>
        
        <div className="timer-done-container">
          <TimerText time={time} />
          <DoneButton onClick={onDone} />
        </div>
      </div>
      
      <style jsx>{`
        .record-bar-nav {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 4px;
          gap: 0px;
          
          width: 366px;
          height: 50px;
          
          background: var(--ClipRecNavBarBg);
          border-radius: 32px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .audio-container {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 12px;
          gap: 8px;
          
          width: 190px;
          height: 32px;
          
          border-radius: 8px;
          overflow: clip;
          position: relative;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 1;
        }
        
        /* Left edge fade overlay - matches background */
        .audio-container::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 20px;
          height: 100%;
          /* Fade starts at 50% (10px in) - first half solid, second half fades */
          background: linear-gradient(to right, var(--ClipRecNavBarBg) 0%, var(--ClipRecNavBarBg) 50%, transparent 100%);
          pointer-events: none;
          z-index: 10;
        }
        
        /* Right edge fade overlay - matches background */
        .audio-container::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          width: 20px;
          height: 100%;
          /* Fade starts at 50% (10px in) - first half solid, second half fades */
          background: linear-gradient(to left, var(--ClipRecNavBarBg) 0%, var(--ClipRecNavBarBg) 50%, transparent 100%);
          pointer-events: none;
          z-index: 10;
        }
        
        .timer-done-container {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          width: 130px;
          height: 42px;
          
          /* Inside auto layout */
          flex: none;
          order: 2;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   RECORD NAV BAR ALT - Alternative layout without audio visualization
   CopyButton | RecordButton | StructureButton
   ============================================ */

interface RecordNavBarAltProps {
  onCopy?: () => void;
  onRecord?: () => void;
  onStructure?: () => void;
  className?: string;
}

export const RecordNavBarAlt: React.FC<RecordNavBarAltProps> = ({ 
  onCopy,
  onRecord,
  onStructure,
  className = '' 
}) => {
  return (
    <>
      <div className={`record-bar-nav-alt ${className} ${styles.container}`}>
        <CopyButton onClick={onCopy} />
        
        <RecordButton onClick={onRecord} />
        
        <StructureButton onClick={onStructure} />
      </div>
      
      <style jsx>{`
        .record-bar-nav-alt {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 4px;
          gap: 10px;
          
          width: 366px;
          height: 50px;
          
          background: transparent;
          border-radius: 32px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

