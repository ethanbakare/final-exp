import React from 'react';
import { MorphingLeftButton, MorphingRightButton } from './deepMorphingButtons';
import { DisabledRecordButton } from './deepButtons';

// Navigation states matching the image
export type NavState = 'initial' | 'recording' | 'processing' | 'results' | 'error';

interface TranscriptBoxNavProps {
  navState: NavState;
  onDropdownClick?: () => void;
  onClearClick?: () => void;
  onRecordClick?: () => void;
  onRecordingClick?: () => void;
  onCancelClick?: () => void;
  onRetryClick?: () => void;
  errorType?: 'microphone_permission' | 'network_error' | 'file_too_large' | 'empty_recording' | 'browser_compatibility' | 'recording_hardware_failure';
}

export const TranscriptBoxNav: React.FC<TranscriptBoxNavProps> = ({
  navState,
  onDropdownClick,
  onClearClick,
  onRecordClick,
  onRecordingClick,
  onCancelClick,
  onRetryClick,
  errorType
}) => {
  // Map nav states to button states
  const getLeftButtonState = (): 'hidden' | 'cancel' | 'dropdown' => {
    switch (navState) {
      case 'initial':
        return 'hidden';
      case 'recording':
      case 'processing':
        return 'cancel';
      case 'results':
        return 'dropdown';
      case 'error':
        return 'hidden';
      default:
        return 'hidden';
    }
  };

  const getRightButtonState = (): 'record' | 'recording' | 'processing' | 'clear' | 'retry' => {
    switch (navState) {
      case 'initial':
        return 'record';
      case 'recording':
        return 'recording';
      case 'processing':
        return 'processing';
      case 'results':
        return 'clear';
      case 'error':
        return 'retry';
      default:
        return 'record';
    }
  };

  return (
    <>
      <div className="transcript-box-nav">
        <div className="nav-buttons-left">
          <MorphingLeftButton
            state={getLeftButtonState()}
            onCancelClick={onCancelClick}
            onDropdownClick={onDropdownClick}
          />
        </div>
        
        <div className="nav-buttons-right">
          {navState === 'error' && errorType === 'browser_compatibility' ? (
            <DisabledRecordButton />
          ) : (
            <MorphingRightButton
              state={getRightButtonState()}
              onRecordClick={onRecordClick}
              onRecordingClick={onRecordingClick}
              onProcessingClick={onRecordingClick} // Processing acts like recording (can be clicked to stop)
              onClearClick={onClearClick}
              onRetryClick={onRetryClick}
            />
          )}
        </div>
      </div>
      
      <style jsx>{`
        .transcript-box-nav {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0px 27px;
          gap: 10px;
          width: 100%;
          // border: 1px solid red;
          max-width: 600px;
          height: 32px;
          border-radius: 6px;
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .nav-buttons-left {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
        }
        
        .nav-buttons-right {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
          margin-left: auto;
        }
        
        @media (max-width: 480px) {
          .transcript-box-nav {
            padding: 0px 23px;
          }
        }
      `}</style>
    </>
  );
};

export default TranscriptBoxNav; 