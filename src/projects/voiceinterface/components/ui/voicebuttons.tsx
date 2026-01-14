import React from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';
import { VoiceLiveTimer } from './VoiceLiveTimer';
import { VoiceLiveTimerSeconds } from './VoiceLiveTimerSeconds';
import { VoiceLiveWaveform } from './VoiceLiveWaveform';

// Voice Interface Button Components
// Following clipbuttons.tsx pattern with styled-jsx

/* ============================================
   INTERFACES
   ============================================ */

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

/* ============================================
   CHECK AND CLOSE BUTTON (Complex - Two Icons)
   72×34px button with checkmark and close icons separated by divider
   ============================================ */

export const CheckAndCloseButton: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <>
      <button
        className={`check-close-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Check and Close"
      >
        {/* Check Division */}
        <div className="check-div">
          <svg
            className="min-check-icon"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 8.99997L6.71231 12.7123L14.6676 4.75732"
              stroke="#262424"
              strokeOpacity="0.9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Divider */}
        <div className="divide">
          <svg
            width="1"
            height="18"
            viewBox="0 0 1 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="0.5"
              y1="0"
              x2="0.5"
              y2="18"
              stroke="#262424"
              strokeOpacity="0.2"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Close Division */}
        <div className="close-div">
          <svg
            className="min-close-icon"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 13.5L4.5 4.5M13.5 4.5L4.5 13.5"
              stroke="#262424"
              strokeOpacity="0.9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      <style jsx>{`
        .check-close-button {
          /* Box model */
          box-sizing: content-box;

          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px;

          /* Size */
          position: relative;
          width: 64px;
          height: 26px;

          /* Style */
          border: 1.13px solid var(--VoiceDarkGrey_20);
          border-radius: 24px;
          background: transparent;
          cursor: pointer;
          transition: border-color 0.2s ease;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .check-close-button:hover {
          border-color: var(--VoiceDarkGrey_15);
        }

        .check-close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Check Division */
        .check-div {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 6px 0px 8px;
          gap: 10px;

          width: 32px;
          height: 26px;

          background: transparent;
          border-radius: 40px 0px 0px 40px;
          transition: background-color 0.2s ease, border-radius 0.2s ease;

          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }

        .check-div:hover {
          background: var(--VoiceDarkGrey_5);
          border-radius: 40px 2px 2px 40px;
        }

        /* Checkmark Icon */
        .min-check-icon {
          width: 18px;
          height: 18px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }

        /* Divider */
        .divide {
          width: 1px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .check-div:hover ~ .divide,
        .close-div:hover ~ .divide,
        .divide:has(~ .check-div:hover),
        .divide:has(~ .close-div:hover) {
          opacity: 0;
        }

        .check-close-button:hover .divide {
          opacity: 0;
        }

        /* Close Division */
        .close-div {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px 8px 0px 6px;
          gap: 10px;

          width: 32px;
          height: 26px;

          background: transparent;
          border-radius: 0px 40px 40px 0px;
          transition: background-color 0.2s ease, border-radius 0.2s ease;

          /* Inside auto layout */
          flex: none;
          order: 2;
          align-self: stretch;
          flex-grow: 0;
        }

        .close-div:hover {
          background: var(--VoiceDarkGrey_5);
          border-radius: 2px 40px 40px 2px;
        }

        /* Close Icon */
        .min-close-icon {
          width: 18px;
          height: 18px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   RECORD BUTTON (Simple - Single Icon)
   38×38px circular button with microphone icon
   ============================================ */

export const RecordButton: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <>
      <button
        className={`record-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Record"
      >
        <svg
          className="record-mic-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z"
            stroke="#262424"
            strokeOpacity="0.9"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <style jsx>{`
        .record-button {
          /* Box model */
          box-sizing: content-box;

          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;

          /* Size */
          margin: 0 auto;
          width: 38px;
          height: 38px;

          /* Style */
          border: 1.13px solid var(--VoiceDarkGrey_20);
          border-radius: 20px;
          background: transparent;
          cursor: pointer;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .record-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Record Microphone Icon */
        .record-mic-icon {
          width: 24px;
          height: 24px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   RECORD BUTTON FILLED (Background Variant)
   38×38px circular button with microphone icon and filled background
   ============================================ */

export const RecordButtonFilled: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <>
      <button
        className={`record-button-filled ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Record"
      >
        <svg
          className="record-mic-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z"
            stroke="#262424"
            strokeOpacity="0.9"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <style jsx>{`
        .record-button-filled {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;

          /* Size */
          margin: 0 auto;
          width: 38px;
          height: 38px;

          /* Style */
          background: var(--VoiceDarkGrey_5);
          border: none;
          border-radius: 20px;
          cursor: pointer;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .record-button-filled:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Record Microphone Icon */
        .record-mic-icon {
          width: 24px;
          height: 24px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   CLOSE BUTTON (Filled Background)
   38×38px circular button with close icon and filled background
   ============================================ */

export const CloseButton: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <>
      <button
        className={`close-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Close"
      >
        <svg
          className="close-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 18L6 6M18 6L6 18"
            stroke="#262424"
            strokeOpacity="0.9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <style jsx>{`
        .close-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;

          /* Size */
          margin: 0 auto;
          width: 38px;
          height: 38px;

          /* Style */
          background: var(--VoiceDarkGrey_5);
          border: none;
          border-radius: 32px;
          cursor: pointer;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Close Icon */
        .close-icon {
          width: 24px;
          height: 24px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};


/* ============================================
   RECORD WIDE BUTTON
   76×44px button with microphone icon and dark background
   ============================================ */

export const RecordWideButton: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <>
      <button
        className={`record-wide-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Record Wide"
      >
        <svg
          className="record-mic-large-icon"
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.40583 6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452Z"
            fill="white"
          />
          <path
            d="M19.9282 13.3002C19.3867 16.6398 16.4897 19.1896 12.9971 19.1896C9.50541 19.1896 6.60896 16.6411 6.06641 13.3027M12.9965 22.75V19.3733M15.0926 22.75H10.9399M13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <style jsx>{`
        .record-wide-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 25px;
          gap: 11.58px;

          /* Size */
          position: relative;
          width: 76px;
          height: 44px;

          /* Style */
          background: var(--VoiceDarkGrey_95);
          border: none;
          border-radius: 23.1579px;
          cursor: pointer;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }

        .record-wide-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Record Microphone Large Icon */
        .record-mic-large-icon {
          width: 26px;
          height: 26px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   STOP RECORD BUTTON
   112×46px button with stop icon and live timer
   ============================================ */

interface StopRecordButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isTimerRunning?: boolean;
}

export const StopRecordButton: React.FC<StopRecordButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
  isTimerRunning = true
}) => {
  return (
    <>
      <button
        className={`stop-record-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Stop Record"
      >
        <div className="time-count-stop">
          {/* Stop Square Icon */}
          <div className="stop-square">
            <div className="stop-square-icon"></div>
          </div>

          {/* Live Timer */}
          <VoiceLiveTimer isRunning={isTimerRunning} />
        </div>
      </button>

      <style jsx>{`
        .stop-record-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 10px 16px;
          gap: 11.25px;

          /* Size */
          position: relative;
          width: 112px;
          height: 46px;

          /* Style */
          background: var(--VoiceDarkGrey_95);
          border: none;
          border-radius: 24px;
          cursor: pointer;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;

        }

        .stop-record-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .time-count-stop {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 9px;

          /* Hug content - auto width */
          width: auto;
          height: 26px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;

        }

        .stop-square {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;

          width: 18px;
          height: 18px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;


        }

        .stop-square-icon {
          width: 8.73px;
          height: 8.73px;

          background: var(--VoiceRed);
          border-radius: 2px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   COPY BUTTON
   38×38px circular button with copy icon
   ============================================ */

export const CopyButton: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <>
      <button
        className={`copy-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Copy"
      >
        <svg
          className="copy-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.9961 15H17.7961C18.9162 15 19.4761 14.9999 19.9039 14.782C20.2802 14.5902 20.5866 14.2843 20.7783 13.908C20.9963 13.4802 20.9963 12.9201 20.9963 11.8V6.19999C20.9963 5.07989 20.9963 4.51983 20.7783 4.09201C20.5866 3.71569 20.2802 3.4097 19.9039 3.21796C19.4761 2.99997 18.9164 2.99997 17.7963 2.99997H12.1963C11.0762 2.99997 10.5157 2.99997 10.0879 3.21796C9.71157 3.4097 9.40583 3.71569 9.21408 4.09201C8.99609 4.51983 8.99609 5.07994 8.99609 6.20004V9.00004M2.99609 17.8V12.2C2.99609 11.0799 2.99609 10.5198 3.21408 10.092C3.40583 9.71569 3.71157 9.4097 4.08789 9.21796C4.51571 8.99997 5.07618 8.99997 6.19629 8.99997H11.7963C12.9164 8.99997 13.4761 8.99997 13.9039 9.21796C14.2802 9.4097 14.5866 9.71569 14.7783 10.092C14.9963 10.5198 14.9963 11.0799 14.9963 12.2V17.8C14.9963 18.9201 14.9963 19.4802 14.7783 19.908C14.5866 20.2843 14.2802 20.5902 13.9039 20.782C13.4761 20.9999 12.9164 21 11.7963 21H6.19629C5.07618 21 4.51571 20.9999 4.08789 20.782C3.71157 20.5902 3.40583 20.2843 3.21408 19.908C2.99609 19.4802 2.99609 18.9201 2.99609 17.8Z"
            stroke="#262424"
            strokeOpacity="0.9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <style jsx>{`
        .copy-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;

          /* Size */
          width: 38px;
          height: 38px;

          /* Style */
          background: var(--VoiceDarkGrey_5);
          border: none;
          border-radius: 32px;
          cursor: pointer;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }

        .copy-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Copy Icon */
        .copy-icon {
          width: 24px;
          height: 24px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   CLEAR BUTTON
   38×38px circular button with clear/delete icon
   ============================================ */

export const ClearButton: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <>
      <button
        className={`clear-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Clear"
      >
        <svg
          className="clear-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 10V17M10 10L10 17M4 6H20M18 6V17.8C18 18.9201 18.0002 19.4802 17.7822 19.908C17.5905 20.2844 17.2841 20.5902 16.9078 20.782C16.48 21 15.9203 21 14.8002 21H9.20019C8.08009 21 7.51962 21 7.0918 20.782C6.71547 20.5902 6.40973 20.2844 6.21799 19.908C6 19.4802 6 18.9201 6 17.8V6H18ZM16 6H8C8 5.06812 8 4.60216 8.15224 4.23462C8.35523 3.74456 8.74432 3.35523 9.23437 3.15224C9.60192 3 10.0681 3 11 3H13C13.9319 3 14.3978 3 14.7654 3.15224C15.2554 3.35523 15.6447 3.74456 15.8477 4.23462C15.9999 4.60216 16 5.06812 16 6Z"
            stroke="#262424"
            strokeOpacity="0.9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <style jsx>{`
        .clear-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;

          /* Size */
          width: 38px;
          height: 38px;

          /* Style */
          background: var(--VoiceDarkGrey_5);
          border: none;
          border-radius: 32px;
          cursor: pointer;

          /* Inside auto layout */
          flex: none;
          order: 2;
          flex-grow: 0;
        }

        .clear-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Clear Icon */
        .clear-icon {
          width: 24px;
          height: 24px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   TIME COUNT BUTTON (Seconds Timer with Red Dot)
   58×26px component with red circle indicator and seconds timer
   ============================================ */

interface TimeCountButtonProps {
  isTimerRunning?: boolean;
}

export const TimeCountButton: React.FC<TimeCountButtonProps> = ({
  isTimerRunning = true
}) => {
  return (
    <>
      <div className={`time-count-button ${styles.container}`}>
        {/* Stop Circle */}
        <div className="stop-circle">
          <div className="stop-circle-icon"></div>
        </div>

        {/* Seconds Timer */}
        <VoiceLiveTimerSeconds isRunning={isTimerRunning} />
      </div>

      <style jsx>{`
        .time-count-button {
          /* Auto layout - natural flex like StopRecordButton */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;

          /* Size - auto width with minimum */
          width: auto;
          min-width: 58px;
          height: 26px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }

        .stop-circle {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 1px 0px 0px;
          gap: 10px;

          width: 18px;
          height: 18px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }

        .stop-circle-icon {
          width: 6px;
          height: 6px;

          background: var(--VoiceRed);
          border-radius: 95.2854px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   RECORDING WAVE BUTTON
   64×34px button with live waveform visualization
   ============================================ */

interface RecordingWaveButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isRecording?: boolean;  // Controls waveform active state
}

export const RecordingWaveButton: React.FC<RecordingWaveButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
  isRecording = false
}) => {
  return (
    <>
      <button
        className={`recording-wave-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Recording Wave"
      >
        {/* VoiceLiveWaveform replaces dummy bars */}
        <VoiceLiveWaveform active={isRecording} />
      </button>

      <style jsx>{`
        .recording-wave-button {
          /* Layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 10px 16px;
          gap: 11.25px;

          /* Size - matches A02 spec */
          width: 64px;
          height: 34px;

          /* Style */
          background: var(--VoiceDarkGrey_90);
          border: none;
          border-radius: 24px;
          cursor: pointer;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .recording-wave-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
};

/* ============================================
   PROCESSING BUTTON DARK
   64×34px button with rotating processing spinner
   ============================================ */

interface ProcessingButtonDarkProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isProcessing?: boolean;  // Controls spinner animation state
}

export const ProcessingButtonDark: React.FC<ProcessingButtonDarkProps> = ({
  onClick,
  disabled = false,
  className = '',
  isProcessing = true  // Default to spinning for processing state
}) => {
  return (
    <>
      <button
        className={`processing-button-dark ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Processing"
      >
        <div className={`spinner-container ${isProcessing ? 'spinning' : ''}`}>
          <svg
            className="processing-spinner"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Vertical bottom spoke */}
            <path d="M10 15.5V18.5" stroke="var(--VoiceWhite)" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Horizontal left spoke */}
            <path d="M4.5 10L1.5 10" stroke="var(--VoiceWhite)" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Vertical top spoke */}
            <path d="M10 1.5V4.5" stroke="var(--VoiceWhite)" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Horizontal right spoke */}
            <path d="M18.5 10L15.5 10" stroke="var(--VoiceWhite)" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal bottom-left spoke */}
            <path d="M6.11 13.89L3.99 16.01" stroke="var(--VoiceWhite)" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal top-left spoke */}
            <path d="M6.11 6.11L3.99 3.99" stroke="var(--VoiceWhite)" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal top-right spoke */}
            <path d="M16.01 3.99L13.89 6.11" stroke="var(--VoiceWhite)" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal bottom-right spoke */}
            <path d="M16.01 16.01L13.89 13.89" stroke="var(--VoiceWhite)" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      <style jsx>{`
        .processing-button-dark {
          /* Layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 10px 16px;
          gap: 11.25px;

          /* Size - matches RecordingWaveButton */
          width: 64px;
          height: 34px;

          /* Style */
          background: var(--VoiceDarkGrey_90);
          border: none;
          border-radius: 24px;
          cursor: pointer;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .processing-button-dark:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 20px;
          height: 20px;
        }

        .processing-spinner {
          width: 20px;
          height: 20px;
          transform-origin: center center;
        }

        /* Spinning state - apply rotation animation */
        .spinner-container.spinning .processing-spinner {
          animation: rotate-processing-spinner-dark 1.5s linear infinite;
        }

        /* Rotation animation keyframes */
        @keyframes rotate-processing-spinner-dark {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Pause animation when button is disabled */
        .processing-button-dark:disabled .processing-spinner {
          animation-play-state: paused;
        }

        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .processing-spinner {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
};

/* ============================================
   PROCESSING BUTTON OUTLINED
   72×34px button with rotating processing spinner in outlined style
   ============================================ */

interface ProcessingButtonOutlinedProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isProcessing?: boolean;  // Controls spinner animation state
}

export const ProcessingButtonOutlined: React.FC<ProcessingButtonOutlinedProps> = ({
  onClick,
  disabled = false,
  className = '',
  isProcessing = true  // Default to spinning for processing state
}) => {
  return (
    <>
      <button
        className={`processing-button-outlined ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Processing"
      >
        <div className={`spinner-container-outlined ${isProcessing ? 'spinning' : ''}`}>
          <svg
            className="processing-spinner-outlined"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Vertical bottom spoke */}
            <path d="M10 15.5V18.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Horizontal left spoke */}
            <path d="M4.5 10L1.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Vertical top spoke */}
            <path d="M10 1.5V4.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Horizontal right spoke */}
            <path d="M18.5 10L15.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal bottom-left spoke */}
            <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal top-left spoke */}
            <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal top-right spoke */}
            <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal bottom-right spoke */}
            <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      <style jsx>{`
        .processing-button-outlined {
          /* Box model */
          box-sizing: content-box;

          /* Layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px;

          /* Size - matches CheckAndCloseButton */
          width: 64px;
          height: 26px;

          /* Style */
          border: 1.13px solid var(--VoiceDarkGrey_20);
          border-radius: 24px;
          background: transparent;
          cursor: pointer;
          transition: border-color 0.2s ease;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .processing-button-outlined:hover {
          border-color: var(--VoiceDarkGrey_15);
        }

        .processing-button-outlined:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner-container-outlined {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 20px;
          height: 20px;
        }

        .processing-spinner-outlined {
          width: 20px;
          height: 20px;
          transform-origin: center center;
        }

        /* Spinning state - apply rotation animation */
        .spinner-container-outlined.spinning .processing-spinner-outlined {
          animation: rotate-processing-spinner-outlined 1.5s linear infinite;
        }

        /* Rotation animation keyframes */
        @keyframes rotate-processing-spinner-outlined {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Pause animation when button is disabled */
        .processing-button-outlined:disabled .processing-spinner-outlined {
          animation-play-state: paused;
        }

        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .processing-spinner-outlined {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
};

/* ============================================
   PROCESSING BUTTON BIG DARK
   112×46px button with processing spinner and static timer
   ============================================ */

interface ProcessingButtonBigDarkProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isProcessing?: boolean;  // Controls spinner animation state
  timeDisplay?: string;    // Static time display (default: "00:26")
}

export const ProcessingButtonBigDark: React.FC<ProcessingButtonBigDarkProps> = ({
  onClick,
  disabled = false,
  className = '',
  isProcessing = true,  // Default to spinning
  timeDisplay = '00:26'  // Default static time
}) => {
  return (
    <>
      <button
        className={`processing-button-big-dark ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Processing"
      >
        <div className="time-count-processing">
          {/* Processing Spinner */}
          <div className={`spinner-big-container ${isProcessing ? 'spinning' : ''}`}>
            <svg
              className="processing-spinner-big"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Vertical bottom spoke */}
              <path d="M9 13.95V16.65" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
              {/* Horizontal left spoke */}
              <path d="M4.05 9L1.35 9" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
              {/* Vertical top spoke */}
              <path d="M9 1.35V4.05" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
              {/* Horizontal right spoke */}
              <path d="M16.65 9L13.95 9" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
              {/* Diagonal bottom-left spoke */}
              <path d="M5.499 12.501L3.591 14.409" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
              {/* Diagonal top-left spoke */}
              <path d="M5.499 5.499L3.591 3.591" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
              {/* Diagonal top-right spoke */}
              <path d="M14.409 3.591L12.501 5.499" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
              {/* Diagonal bottom-right spoke */}
              <path d="M14.409 14.409L12.501 12.501" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Static Timer Display */}
          <div className="static-timer">
            <span className={`timer-text ${styles.OpenRundeMedium18}`}>
              {timeDisplay}
            </span>
          </div>
        </div>
      </button>

      <style jsx>{`
        .processing-button-big-dark {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 10px 16px;
          gap: 11.25px;

          /* Size - matches StopRecordButton */
          position: relative;
          width: 112px;
          height: 46px;

          /* Style */
          background: var(--VoiceDarkGrey_95);
          border: none;
          border-radius: 24px;
          cursor: pointer;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }

        .processing-button-big-dark:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .time-count-processing {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 9px;

          /* Hug content - auto width */
          width: auto;
          height: 26px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }

        .spinner-big-container {
          /* Auto layout - EXACT MATCH to stop-square */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;

          width: 18px;
          height: 18px;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }

        .processing-spinner-big {
          width: 18px;
          height: 18px;
          transform-origin: center center;
        }

        /* Spinning state - apply rotation animation */
        .spinner-big-container.spinning .processing-spinner-big {
          animation: rotate-processing-spinner-big 2s linear infinite;
        }

        /* Rotation animation keyframes */
        @keyframes rotate-processing-spinner-big {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Pause animation when button is disabled */
        .processing-button-big-dark:disabled .processing-spinner-big {
          animation-play-state: paused;
        }

        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .processing-spinner-big {
            animation: none !important;
          }
        }

        .static-timer {
          /* Auto layout - EXACT MATCH to VoiceLiveTimer */
          display: flex;
          align-items: center;
          padding: 0px;

          /* Auto width with min-width to prevent collapse */
          min-width: 51px;
          width: auto;
          height: 26px;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .timer-text {
          /* EXACT MATCH to VoiceLiveTimer */
          min-width: 51px;
          width: auto;
          height: 26px;

          /* LEFT-ALIGNED like VoiceLiveTimer (for consistency with live timer) */
          text-align: left;
          color: var(--VoiceWhite);
          white-space: nowrap;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};


/* ============================================
   VOICE PILL WAVE (Combo Component)
   114×34px component - Timer text + RecordingWaveButton
   ============================================ */

interface VoicePillWaveProps {
  isActive?: boolean;  // Controls both timer counting and waveform animation
}

export const VoicePillWave: React.FC<VoicePillWaveProps> = ({
  isActive = false
}) => {
  return (
    <>
      <div className={`voice-pill-wave ${styles.container}`}>
        {/* Timer Text - Reusing existing VoiceLiveTimerSeconds component */}
        <VoiceLiveTimerSeconds isRunning={isActive} />

        {/* Recording Wave Button */}
        <RecordingWaveButton isRecording={isActive} />
      </div>

      <style jsx>{`
        .voice-pill-wave {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;

          /* Size - auto width to fit children */
          margin: 0 auto;
          width: auto;
          height: 34px;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   VOICE PILL CONFIRM (Combo Component)
   140×34px component - TimeCountButton + CheckAndCloseButton
   ============================================ */

interface VoicePillConfirmProps {
  isTimerRunning?: boolean;  // Controls timer counting only
}

export const VoicePillConfirm: React.FC<VoicePillConfirmProps> = ({
  isTimerRunning = false
}) => {
  return (
    <>
      <div className={`voice-pill-confirm ${styles.container}`}>
        {/* Time Count Button (with red dot + timer) */}
        <TimeCountButton isTimerRunning={isTimerRunning} />

        {/* Check and Close Button */}
        <CheckAndCloseButton />
      </div>

      <style jsx>{`
        .voice-pill-confirm {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;

          /* Size - auto width to fit children */
          margin: 0 auto;
          width: auto;
          height: 34px;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   VOICE DOCK CENTER (Combo Component)
   Auto width × 44px component - CopyButton + RecordWideButton + ClearButton
   ============================================ */

export const VoiceDockCenter: React.FC = () => {
  return (
    <>
      <div className={`voice-dock-center ${styles.container}`}>
        {/* Copy Button */}
        <CopyButton />

        {/* Record Wide Button */}
        <RecordWideButton />

        {/* Clear Button */}
        <ClearButton />
      </div>

      <style jsx>{`
        .voice-dock-center {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 6px;

          /* Size */
          position: relative;
          width: auto;
          height: 44px;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};
