import React from 'react';

/**
 * Clip-style voice buttons — 34×34px variants sourced from the
 * Dictation-app "RecordBar" frames in Figma (record-bar-* nodes).
 *
 * Kept separate from voicebuttons.tsx because these are one-off
 * instances for the home demo / clip context — pulling them into the
 * shared button library would pollute the existing 38px API.
 */

type BtnProps = {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

type ProcessingProps = BtnProps & { isProcessing?: boolean };

const SIZE = 34;
const ICON = 21;
const RED = '#EF4444';
const RED_TINT = 'rgba(244, 39, 39, 0.10)';
const DARK = '#2C2929';
const WHITE_10 = 'rgba(255, 255, 255, 0.10)';
const WHITE_90 = 'rgba(255, 255, 255, 0.90)';

/* ============================================
   CLIP CLEAR BUTTON (trash icon, transparent, 34px)
   Figma: record-bar-final-transcript > btn-clear
   ============================================ */
export const ClipClearBtn: React.FC<BtnProps> = ({ onClick, disabled, className = '' }) => (
  <>
    <button className={`clip-clear ${className}`} onClick={onClick} disabled={disabled} aria-label="Clear">
      <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
        <path
          d="M14 10V17M10 10L10 17M4 6H20M18 6V17.8C18 18.9201 18.0002 19.4802 17.7822 19.908C17.5905 20.2844 17.2841 20.5902 16.9078 20.782C16.48 21 15.9203 21 14.8002 21H9.20019C8.08009 21 7.51962 21 7.0918 20.782C6.71547 20.5902 6.40973 20.2844 6.21799 19.908C6 19.4802 6 18.9201 6 17.8V6H18ZM16 6H8C8 5.06812 8 4.60216 8.15224 4.23462C8.35523 3.74456 8.74432 3.35523 9.23437 3.15224C9.60192 3 10.0681 3 11 3H13C13.9319 3 14.3978 3 14.7654 3.15224C15.2554 3.35523 15.6447 3.74456 15.8477 4.23462C15.9999 4.60216 16 5.06812 16 6Z"
          stroke={WHITE_90}
          strokeWidth="1.789"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
    <style jsx>{`
      .clip-clear {
        display: flex;
        justify-content: center;
        align-items: center;
        width: ${SIZE}px;
        height: ${SIZE}px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 50%;
        cursor: pointer;
      }
      .clip-clear:disabled { opacity: 0.5; cursor: not-allowed; }
    `}</style>
  </>
);

/* ============================================
   CLIP CLOSE BUTTON (X icon, transparent, 34px)
   Figma: record-bar-recording > btn-close
   ============================================ */
export const ClipCloseBtn: React.FC<BtnProps> = ({ onClick, disabled, className = '' }) => (
  <>
    <button className={`clip-close ${className}`} onClick={onClick} disabled={disabled} aria-label="Close">
      <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
        <path d="M18 18L6 6M18 6L6 18" stroke="#FFFFFF" strokeWidth="1.789" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
    <style jsx>{`
      .clip-close {
        display: flex;
        justify-content: center;
        align-items: center;
        width: ${SIZE}px;
        height: ${SIZE}px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 50%;
        cursor: pointer;
      }
      .clip-close:disabled { opacity: 0.5; cursor: not-allowed; }
    `}</style>
  </>
);

/* ============================================
   CLIP RECORD RED BUTTON (red mic, red-tint pill, 34px)
   Figma: record-bar-idle-placeholder > btn-record-red
   Used in idle + final-transcript states.
   ============================================ */
export const ClipRecordRedBtn: React.FC<BtnProps> = ({ onClick, disabled, className = '' }) => (
  <>
    <button className={`clip-record-red ${className}`} onClick={onClick} disabled={disabled} aria-label="Record">
      <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
        <path
          d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z"
          stroke={RED}
          strokeWidth="1.789"
          strokeLinecap="round"
        />
      </svg>
    </button>
    <style jsx>{`
      .clip-record-red {
        display: flex;
        justify-content: center;
        align-items: center;
        width: ${SIZE}px;
        height: ${SIZE}px;
        padding: 0;
        background: ${RED_TINT};
        border: none;
        border-radius: 50%;
        cursor: pointer;
      }
      .clip-record-red:disabled { opacity: 0.5; cursor: not-allowed; }
    `}</style>
  </>
);

/* ============================================
   CLIP RECORD ACTIVE BUTTON (white bg + red dot, 34px)
   Figma: record-bar-recording > btn-record-active
   Shows "currently recording, click to finish".
   ============================================ */
export const ClipRecordActiveBtn: React.FC<BtnProps> = ({ onClick, disabled, className = '' }) => (
  <>
    <button className={`clip-record-active ${className}`} onClick={onClick} disabled={disabled} aria-label="Stop recording">
      <span className="dot" />
    </button>
    <style jsx>{`
      .clip-record-active {
        display: flex;
        justify-content: center;
        align-items: center;
        width: ${SIZE}px;
        height: ${SIZE}px;
        padding: 0;
        background: #FFFFFF;
        border: none;
        border-radius: 50%;
        cursor: pointer;
      }
      .clip-record-active:disabled { opacity: 0.5; cursor: not-allowed; }
      .dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: ${RED};
      }
    `}</style>
  </>
);

/* ============================================
   CLIP PROCESSING SPINNER — shared SVG
   ============================================ */
const SpinnerSvg: React.FC<{ stroke: string }> = ({ stroke }) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M10 15.5V18.5" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M4.5 10L1.5 10" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M10 1.5V4.5" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M18.5 10L15.5 10" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M6.11 13.89L3.99 16.01" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M6.11 6.11L3.99 3.99" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M16.01 3.99L13.89 6.11" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M16.01 16.01L13.89 13.89" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

type SpinnerBtnInternalProps = BtnProps & {
  isProcessing?: boolean;
  variant: 'dim' | 'white' | 'dark';
};

const SpinnerBtn: React.FC<SpinnerBtnInternalProps> = ({
  onClick,
  disabled,
  className = '',
  isProcessing = true,
  variant,
}) => {
  const bg = variant === 'dim' ? WHITE_10 : variant === 'white' ? '#FFFFFF' : DARK;
  const stroke = variant === 'dim' ? '#FFFFFF' : variant === 'white' ? DARK : RED;
  return (
    <>
      <button
        className={`clip-spinner clip-spinner--${variant} ${className}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Processing"
      >
        <span className={`spin ${isProcessing ? 'active' : ''}`}>
          <SpinnerSvg stroke={stroke} />
        </span>
      </button>
      <style jsx>{`
        .clip-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          width: ${SIZE}px;
          height: ${SIZE}px;
          padding: 0;
          background: ${bg};
          border: none;
          border-radius: 50%;
          cursor: pointer;
        }
        .clip-spinner:disabled { opacity: 0.5; cursor: not-allowed; }
        .spin {
          display: flex;
          width: 18px;
          height: 18px;
          transform-origin: center center;
        }
        .spin.active {
          animation: clip-spin 1.5s linear infinite;
        }
        @keyframes clip-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .spin.active { animation: none; }
        }
      `}</style>
    </>
  );
};

/* dim: rgba(255,255,255,0.10) bg + white spinner
   Figma: record-bar-recording-processing > btn-processing-dim */
export const ClipProcessingDimBtn: React.FC<ProcessingProps> = (p) => <SpinnerBtn {...p} variant="dim" />;

/* white: #FFF bg + #2C2929 spinner
   Figma: record-bar-processing-white > btn-processing-white */
export const ClipProcessingWhiteBtn: React.FC<ProcessingProps> = (p) => <SpinnerBtn {...p} variant="white" />;

/* dark: #2C2929 bg + red spinner
   Figma: record-bar-processing-dark > btn-processing-dark */
export const ClipProcessingDarkBtn: React.FC<ProcessingProps> = (p) => <SpinnerBtn {...p} variant="dark" />;

/* ============================================
   CLIP TIMER (0:26, JetBrains Mono, 16px)
   Figma: * > btn-timer > text-timer
   ============================================ */
export const ClipTimer: React.FC<{ value?: string; className?: string }> = ({ value = '0:00', className = '' }) => (
  <>
    <span className={`clip-timer ${className}`}>{value}</span>
    <style jsx>{`
      .clip-timer {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        color: #FFFFFF;
        font-family: 'JetBrains Mono', monospace;
        font-size: 16px;
        font-weight: 500;
        line-height: 23px;
        text-align: center;
        /* Belt-and-suspenders: JetBrains Mono is already monospaced so
           every digit is fixed-width, but tabular-nums explicitly opts
           into tabular figures in case the font stack ever falls back. */
        font-variant-numeric: tabular-nums;
      }
    `}</style>
  </>
);
