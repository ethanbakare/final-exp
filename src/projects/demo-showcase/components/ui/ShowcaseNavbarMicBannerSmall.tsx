/**
 * ShowcaseNavbarMicBannerSmall — mobile compact variant of the navbar
 * mic-permission banner.
 *
 * Sister to ShowcaseNavbarMicBanner (desktop), sized to match
 * ShowcaseNavbarCompactSmall's geometry: 0.7×-style baked-in
 * dimensions, OpenRunde 500 / 12px font, smaller buttons (~25px tall),
 * border-radius 14px, padding 6px on the pill.
 *
 * Same three states as the desktop variant; copy is shortened so
 * everything fits inside a mobile-width pill alongside the X close
 * button:
 *   unknown   → 'Mic access needed' + Enable + Not now
 *   dismissed → centred orange 'Enable Mic' (mic-off icon + label)
 *   blocked   → 'Mic access denied' + X dismiss
 */
import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ShowcaseNavbarMicBannerSmallProps {
  micState: 'unknown' | 'dismissed' | 'blocked';
  onEnable: () => void;
  onDismiss: () => void;
  onReshow: () => void;
  onDismissBlocked: () => void;
}

// Muted-mic icon (smaller than the desktop variant — 16×16 to match
// mobile button heights).
const MicMutedIconSmall = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g clipPath="url(#clip0_navbar_mic_muted_small)">
      <path d="M5.6801 10.1049C5.73015 10.4272 5.81741 10.7427 5.94011 11.0449L4.7701 12.2149C4.47185 11.6302 4.26609 11.0027 4.16012 10.3549C4.1437 10.2551 4.1471 10.153 4.17013 10.0546C4.19315 9.95607 4.23534 9.86308 4.2943 9.7809C4.35327 9.69872 4.42786 9.62897 4.51378 9.57561C4.59971 9.52225 4.69529 9.48635 4.79509 9.46993C4.8949 9.45351 4.99696 9.45691 5.09545 9.47994C5.19394 9.50297 5.28695 9.54515 5.36913 9.60412C5.45131 9.66308 5.52106 9.73767 5.57442 9.8236C5.62778 9.90952 5.66369 10.0051 5.6801 10.1049Z" fill="white" />
      <path d="M11.0199 15.4849V16.7349H11.8599C11.9677 16.7226 12.0769 16.7331 12.1804 16.766C12.2838 16.7988 12.3791 16.8531 12.4601 16.9253C12.5411 16.9975 12.6059 17.0861 12.6502 17.1851C12.6946 17.2841 12.7175 17.3914 12.7175 17.4999C12.7175 17.6084 12.6946 17.7157 12.6502 17.8148C12.6059 17.9138 12.5411 18.0023 12.4601 18.0745C12.3791 18.1468 12.2838 18.2011 12.1804 18.2339C12.0769 18.2667 11.9677 18.2773 11.8599 18.2649H8.66992C8.56212 18.2773 8.45292 18.2667 8.34949 18.2339C8.24606 18.2011 8.15074 18.1468 8.06976 18.0745C7.98879 18.0023 7.924 17.9138 7.87964 17.8148C7.83527 17.7157 7.81232 17.6084 7.81232 17.4999C7.81232 17.3914 7.83527 17.2841 7.87964 17.1851C7.924 17.0861 7.98879 16.9975 8.06976 16.9253C8.15074 16.8531 8.24606 16.7988 8.34949 16.766C8.45292 16.7331 8.56212 16.7226 8.66992 16.7349H9.47992V15.4849C8.5771 15.3701 7.71026 15.0596 6.93994 14.5749L8.06995 13.4449C8.73789 13.811 9.48828 14.0003 10.2499 13.9949C11.3506 13.9989 12.4164 13.6089 13.2546 12.8954C14.0928 12.1819 14.648 11.1921 14.8199 10.1049C14.8531 9.90335 14.965 9.72321 15.1309 9.60412C15.2969 9.48503 15.5034 9.43678 15.7049 9.46993C15.9065 9.50309 16.0866 9.61494 16.2057 9.78091C16.3248 9.94688 16.3731 10.1533 16.3399 10.3549C16.132 11.6723 15.5 12.886 14.5399 13.8118C13.5799 14.7376 12.344 15.325 11.0199 15.4849Z" fill="white" />
      <path d="M3.74994 16.265C3.6498 16.2662 3.55042 16.2474 3.45767 16.2096C3.36493 16.1718 3.28069 16.1158 3.20993 16.045C3.13827 15.9735 3.08142 15.8885 3.04263 15.795C3.00384 15.7015 2.98389 15.6012 2.98389 15.5C2.98389 15.3988 3.00384 15.2985 3.04263 15.205C3.08142 15.1115 3.13827 15.0265 3.20993 14.955L15.7099 2.45499C15.8545 2.31044 16.0505 2.22925 16.2549 2.22925C16.4594 2.22925 16.6554 2.31044 16.7999 2.45499C16.9445 2.59953 17.0257 2.79559 17.0257 3C17.0257 3.20441 16.9445 3.40044 16.7999 3.54498L4.28992 16.045C4.21915 16.1158 4.13492 16.1718 4.04218 16.2096C3.94943 16.2474 3.85008 16.2662 3.74994 16.265Z" fill="white" />
      <path d="M13.3699 3.61502L6.93992 10.045C6.79491 9.65805 6.7204 9.24825 6.71991 8.83502V5.39502C6.70463 4.60542 6.9487 3.8326 7.41471 3.195C7.88072 2.5574 8.54294 2.0902 9.2999 1.86502C10.0761 1.64636 10.9039 1.70086 11.6447 2.01941C12.3856 2.33795 12.9946 2.90124 13.3699 3.61502Z" fill="white" />
      <path d="M13.7898 7.72498V8.83496C13.7911 9.38298 13.6649 9.92378 13.421 10.4146C13.1772 10.9053 12.8224 11.3326 12.3848 11.6625C11.9472 11.9924 11.4388 12.2158 10.8998 12.3152C10.3609 12.4146 9.80626 12.3871 9.27979 12.235L13.7898 7.72498Z" fill="white" />
    </g>
    <defs>
      <clipPath id="clip0_navbar_mic_muted_small">
        <rect width="14.04" height="16.53" fill="white" transform="translate(2.97998 1.73499)" />
      </clipPath>
    </defs>
  </svg>
);

const CloseIconSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M17.99997 17.99997L6 6M18.00003 6L5.99997 18.00003" stroke="#5E5E5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ShowcaseNavbarMicBannerSmall: React.FC<ShowcaseNavbarMicBannerSmallProps> = ({
  micState,
  onEnable,
  onDismiss,
  onReshow,
  onDismissBlocked,
}) => {
  return (
    <div className="top-navbar-mic-small">
      {micState === 'unknown' && (
        <div className="pill-shell">
          <div className={`mic-title ${styles.OpenRunde500_12}`}>
            Mic access needed
          </div>
          <div className="mic-buttons">
            <button
              type="button"
              className={`mic-btn mic-btn-enable ${styles.OpenRunde500_12}`}
              onClick={onEnable}
            >
              Enable
            </button>
            <button
              type="button"
              className={`mic-btn mic-btn-dismiss ${styles.OpenRunde500_12}`}
              onClick={onDismiss}
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {micState === 'dismissed' && (
        <div className="pill-shell pill-shell-centered">
          <button
            type="button"
            className={`enable-mic-mini ${styles.OpenRunde500_12}`}
            onClick={onReshow}
          >
            <MicMutedIconSmall />
            Enable Mic
          </button>
        </div>
      )}

      {micState === 'blocked' && (
        <div className="pill-shell">
          <div className={`mic-title ${styles.OpenRunde500_12}`}>
            Mic access denied
          </div>
          <button
            type="button"
            className="mic-btn-close"
            onClick={onDismissBlocked}
            aria-label="Dismiss"
          >
            <CloseIconSmall />
          </button>
        </div>
      )}

      <style jsx>{`
        /* Mirror ShowcaseNavbarCompactSmall's outer dimensions:
           - padding 0 0 14px
           - pill: padding 6px, border-radius 14px, F7F6F2 bg, inset shadow */
        .top-navbar-mic-small {
          display: flex;
          padding: 0 0 14px;
          justify-content: center;
          align-items: center;
          align-self: stretch;
        }

        .pill-shell {
          display: flex;
          width: 100%;
          padding: 6px;
          justify-content: space-between;
          align-items: center;
          border-radius: 14px;
          background: #F7F6F2;
          box-shadow: inset 0 3px 4px rgba(0, 0, 0, 0.06);
          box-sizing: border-box;
          gap: 6px;
        }

        .pill-shell-centered {
          justify-content: center;
        }

        .mic-title {
          padding: 4px 8px 4px 10px;
          color: #5E5E5C;
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mic-buttons {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        /* Buttons match arrow-btn height (25px) from
           ShowcaseNavbarCompactSmall, with content-fit width and
           OpenRunde 500 / 12px text. */
        .mic-btn {
          display: inline-flex;
          height: 25px;
          padding: 0 12px;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 22px;
          cursor: pointer;
          transition: opacity 0.15s ease;
          white-space: nowrap;
        }

        .mic-btn:hover {
          opacity: 0.85;
        }

        .mic-btn-enable {
          background: #FFFFFF;
          color: #252525;
        }

        .mic-btn-dismiss {
          background: #373737;
          color: #FFFFFF;
        }

        /* Dismissed: small orange pill centred inside the tan shell,
           matching the proportions of the desktop variant (which mirrors
           the project counter / arrow button height). */
        .enable-mic-mini {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 25px;
          padding: 0 10px;
          background: #FB7232;
          color: #FFFFFF;
          border: none;
          border-radius: 22px;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .enable-mic-mini:hover {
          opacity: 0.92;
        }

        /* Blocked dismiss X — transparent square button, sized to the
           mobile pill height. */
        .mic-btn-close {
          display: inline-flex;
          height: 25px;
          width: 25px;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 22px;
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease;
        }

        .mic-btn-close:hover {
          background: rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
};
