import React from 'react';
import styles from '@/projects/trace/styles/trace.module.css';

// Trace Icons & Empty State Components
// Icon-based UI elements used across the Trace app

/* ============================================
   PROCESSING STATE — single source of truth for the
   empty-state processing copy/icon swap. Single union
   (rather than boolean + source) prevents the two
   values from going out of sync.
   ============================================ */
export type ProcessingState = 'idle' | 'audio' | 'image';

/* ============================================
   EMPTY TRACE ICON — 48x48 receipt icon on dark tile
   ============================================ */

export const EmptyTraceIcon: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`empty-icon ${className} ${styles.container}`}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="8" fill="#292524"/>
        <path d="M31.1328 21.8846L31.1315 16.8992C31.1312 15.7948 30.2358 14.8997 29.1315 14.8997L19.1333 14.8997C18.0286 14.8997 17.1331 15.7954 17.1333 16.9002L17.1347 21.8846" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17.1328 29.5859L17.1346 32.7569C17.1347 32.9102 17.3001 33.0064 17.4334 32.9307L20.5509 31.1598C20.6123 31.125 20.6876 31.1251 20.7489 31.1601L24.0473 33.0436C24.1089 33.0788 24.1844 33.0787 24.2459 33.0435L27.532 31.1604C27.5935 31.1252 27.669 31.1251 27.7305 31.1602L30.8334 32.9297C30.9668 33.0057 31.1326 32.9094 31.1325 32.7558L31.1307 29.5859" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round"/>
        <path d="M14.8242 25.8804L33.1768 25.8804" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round"/>
      </svg>

      <style jsx>{`
        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
        }
      `}</style>
    </div>
  );
};

/* ============================================
   EMPTY TRACE ICON (ANIMATED) — Receipt icon with
   divider line moving up and down, cycling through:
   middle → top → middle → bottom → middle
   ============================================ */

// TOP SHAPE — the "lid" of the receipt (bottom edge moves)
const TOP_MIDDLE = 'M31.1328 21.8846L31.1315 16.8992C31.1312 15.7948 30.2358 14.8997 29.1315 14.8997L19.1333 14.8997C18.0286 14.8997 17.1331 15.7954 17.1333 16.9002L17.1347 21.8846';
const TOP_UP     = 'M31.1328 17.8847L31.1315 16.8992C31.1312 15.7948 30.2358 14.8997 29.1315 14.8997L19.1341 14.8997C18.0290 14.8997 17.1334 15.7959 17.1341 16.9010L17.1347 17.8847';
const TOP_DOWN   = 'M31.1328 23.8846L31.1314 16.8993C31.1311 15.7949 30.2358 14.8997 29.1314 14.8997L19.1332 14.8997C18.0285 14.8997 17.1330 15.7954 17.1332 16.9001L17.1347 23.8846';

// BOTTOM SHAPE — the "zigzag" base of the receipt (top edge moves)
const BTM_MIDDLE = 'M17.1328 29.5859L17.1346 32.7569C17.1347 32.9102 17.3001 33.0064 17.4334 32.9307L20.5509 31.1598C20.6123 31.125 20.6876 31.1251 20.7489 31.1601L24.0473 33.0436C24.1089 33.0788 24.1844 33.0787 24.2459 33.0435L27.532 31.1604C27.5935 31.1252 27.669 31.1251 27.7305 31.1602L30.8334 32.9297C30.9668 33.0057 31.1326 32.9094 31.1325 32.7558L31.1307 29.5859';
const BTM_UP     = 'M17.1328 25.5859L17.1347 32.7568C17.1347 32.9101 17.3002 33.0064 17.4335 32.9307L20.5509 31.1598C20.6123 31.125 20.6876 31.1251 20.7489 31.1601L24.0473 33.0436C24.1089 33.0788 24.1844 33.0787 24.2459 33.0435L27.532 31.1604C27.5935 31.1252 27.669 31.1251 27.7305 31.1602L30.8335 32.9297C30.9669 33.0058 31.1326 32.9095 31.1326 32.7559L31.1307 25.5859';
const BTM_DOWN   = 'M17.1328 31.5859L17.1343 32.7572C17.1345 32.9104 17.2999 33.0065 17.4331 32.9308L20.5509 31.1598C20.6123 31.1249 20.6876 31.125 20.7489 31.16L24.0473 33.0435C24.1089 33.0787 24.1844 33.0786 24.2459 33.0434L27.532 31.1604C27.5935 31.1251 27.669 31.1251 27.7305 31.1602L30.8331 32.9295C30.9666 33.0056 31.1324 32.9091 31.1322 32.7555L31.1307 31.5859';

// DIVIDER — horizontal line
const DIV_MIDDLE = 'M14.8242 25.8804L33.1768 25.8804';
const DIV_UP     = 'M14.8242 21.8804L33.1768 21.8804';
const DIV_DOWN   = 'M14.8242 27.8804L33.1768 27.8804';

const WARMUP_DURATION = '0.6s';  // MIDDLE → TOP, shorter distance
const LOOP_DURATION   = '2.4s';  // TOP → BOTTOM → TOP, full distance cycle
const LOOP_KEY_TIMES   = '0;0.5;1';
const LOOP_KEY_SPLINES = '0.4 0 0.6 1;0.4 0 0.6 1';
const EASE_SPLINE      = '0.4 0 0.6 1';

export const EmptyTraceIconAnimated: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`empty-icon ${className} ${styles.container}`}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="8" fill="#292524"/>

        {/* Top shape — bottom edge moves with divider */}
        <path stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" d={TOP_MIDDLE}>
          {/* Warm-up: MIDDLE → TOP (runs once) */}
          <animate
            id="warmup-top"
            attributeName="d"
            values={`${TOP_MIDDLE};${TOP_UP}`}
            dur={WARMUP_DURATION}
            begin="0s"
            calcMode="spline"
            keyTimes="0;1"
            keySplines={EASE_SPLINE}
          />
          {/* Loop: TOP → BOTTOM → TOP (forever) */}
          <animate
            attributeName="d"
            values={`${TOP_UP};${TOP_DOWN};${TOP_UP}`}
            dur={LOOP_DURATION}
            begin="0.6s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes={LOOP_KEY_TIMES}
            keySplines={LOOP_KEY_SPLINES}
          />
        </path>

        {/* Bottom shape — top edge moves with divider */}
        <path stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" d={BTM_MIDDLE}>
          {/* Warm-up: MIDDLE → TOP (runs once) */}
          <animate
            id="warmup-btm"
            attributeName="d"
            values={`${BTM_MIDDLE};${BTM_UP}`}
            dur={WARMUP_DURATION}
            begin="0s"
            calcMode="spline"
            keyTimes="0;1"
            keySplines={EASE_SPLINE}
          />
          {/* Loop: TOP → BOTTOM → TOP (forever) */}
          <animate
            attributeName="d"
            values={`${BTM_UP};${BTM_DOWN};${BTM_UP}`}
            dur={LOOP_DURATION}
            begin="0.6s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes={LOOP_KEY_TIMES}
            keySplines={LOOP_KEY_SPLINES}
          />
        </path>

        {/* Divider — moves up and down */}
        <path stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" d={DIV_MIDDLE}>
          {/* Warm-up: MIDDLE → TOP (runs once) */}
          <animate
            id="warmup-div"
            attributeName="d"
            values={`${DIV_MIDDLE};${DIV_UP}`}
            dur={WARMUP_DURATION}
            begin="0s"
            calcMode="spline"
            keyTimes="0;1"
            keySplines={EASE_SPLINE}
          />
          {/* Loop: TOP → BOTTOM → TOP (forever) */}
          <animate
            attributeName="d"
            values={`${DIV_UP};${DIV_DOWN};${DIV_UP}`}
            dur={LOOP_DURATION}
            begin="0.6s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes={LOOP_KEY_TIMES}
            keySplines={LOOP_KEY_SPLINES}
          />
        </path>
      </svg>

      <style jsx>{`
        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
        }
      `}</style>
    </div>
  );
};

/* ============================================
   EMPTY TRACE TEXT — Heading + subtext
   ============================================ */

export const EmptyTraceText: React.FC<{
  className?: string;
  processingState?: ProcessingState;
}> = ({ className = '', processingState = 'idle' }) => {
  const heading = processingState !== 'idle' ? 'Just a moment' : 'No expenses logged yet';
  const subtext =
    processingState === 'image'
      ? 'Reading your receipt'
      : processingState === 'audio'
        ? 'Processing your voice note'
        : 'Use the buttons below to get started';

  return (
    <div className={`empty-text ${className} ${styles.container}`}>
      <p className="empty-heading">{heading}</p>
      <p className="empty-subtext">{subtext}</p>

      <style jsx>{`
        .empty-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 10px;
          gap: 4px;
          max-width: 100%;
          border-radius: 8px;
        }

        .empty-heading {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-button);
          font-weight: var(--trace-fw-medium);
          line-height: 24px;
          color: var(--trace-text-secondary);
          margin: 0;
          text-align: center;
        }

        .empty-subtext {
          font-family: var(--trace-font-family);
          font-size: 13px;
          font-weight: var(--trace-fw-normal);
          line-height: 16px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

/* ============================================
   EMPTY FINANCE STATE — Combined icon + text
   ============================================ */

export const EmptyFinanceState: React.FC<{
  className?: string;
  processingState?: ProcessingState;
}> = ({ className = '', processingState = 'idle' }) => {
  const isProcessing = processingState !== 'idle';

  return (
    <div className={`empty-state ${className} ${styles.container}`}>
      {isProcessing ? <EmptyTraceIconAnimated /> : <EmptyTraceIcon />}
      <EmptyTraceText processingState={processingState} />

      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 10px;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};
