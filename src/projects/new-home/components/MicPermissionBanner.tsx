import React from 'react';
import { EnableModal, EnableMicButton, EnableBlockedToast } from './EnableModal';
import { useMicPermission } from '../hooks/useMicPermission';

/**
 * MicPermissionBanner
 * Drop-in component for any page that uses audio/microphone features.
 * Handles the full flow:
 *   toast → dismiss → fallback button → re-show toast
 *   toast → enable → denied → fallback button
 *   toast → enable → permanently blocked → blocked message
 *
 * Usage:
 *   <MicPermissionBanner />
 *
 * Place it anywhere in your page — it renders fixed-position UI.
 */

export const MicPermissionBanner: React.FC = () => {
  const { micState, handleEnable, handleDismiss, handleReshow, handleDismissBlocked } = useMicPermission();

  // Don't render anything while loading (prevents flash)
  if (micState === 'loading' || micState === 'granted') return null;

  return (
    <>
      {/* Toast */}
      <div className="mic-banner-container">
        <EnableModal
          isVisible={micState === 'unknown'}
          onEnable={handleEnable}
          onDismiss={handleDismiss}
        />
      </div>

      {/* Blocked message */}
      <div className="mic-banner-container">
        <EnableBlockedToast
          isVisible={micState === 'blocked'}
          onDismiss={handleDismissBlocked}
        />
      </div>

      {/* Fallback button */}
      <div className="mic-banner-container">
        <EnableMicButton
          isVisible={micState === 'dismissed'}
          onClick={handleReshow}
        />
      </div>

      <style jsx>{`
        .mic-banner-container {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
        }
      `}</style>
    </>
  );
};

export default MicPermissionBanner;
