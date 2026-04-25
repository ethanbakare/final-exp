/**
 * ShowcaseNavbarMicBanner — navbar-slot variant of the mic permission UI.
 *
 * Renders inside the showcase's top nav slot, replacing the project pill
 * (ShowcaseNavbarCompact) when a demo that requires mic access is active
 * AND the user hasn't yet granted permission. Reuses the existing
 * EnableModal / EnableMicButton / EnableBlockedToast components from
 * new-home — same visual UX as the standalone /trace page's floating
 * banner, just dropped into the navbar's flex layout instead of using
 * `position: fixed`.
 *
 * Stage 2: desktop sizing only. Mobile compact variant is built in
 * Stage 3 (ShowcaseNavbarMicBannerSmall).
 *
 * The parent (showcase index) computes whether to render this vs the
 * project pill, and owns the `useMicPermission` hook so state and
 * handlers are passed in as props (avoids duplicate hook instances).
 */
import React from 'react';
import { EnableModal, EnableMicButton, EnableBlockedToast } from '@/projects/new-home/components/EnableModal';

interface ShowcaseNavbarMicBannerProps {
  /** Mic permission state. The parent only renders this component for
   *  the three "needs UI" states; `granted` and `loading` short-circuit
   *  upstream and the project pill renders instead. */
  micState: 'unknown' | 'dismissed' | 'blocked';
  /** Triggers the browser permission prompt. */
  onEnable: () => void;
  /** User chose "Not now". */
  onDismiss: () => void;
  /** User clicked the "Enable Mic" fallback button. */
  onReshow: () => void;
  /** User dismissed the "Microphone access denied" toast. */
  onDismissBlocked: () => void;
}

export const ShowcaseNavbarMicBanner: React.FC<ShowcaseNavbarMicBannerProps> = ({
  micState,
  onEnable,
  onDismiss,
  onReshow,
  onDismissBlocked,
}) => (
  <div className="navbar-mic-slot">
    <EnableModal
      isVisible={micState === 'unknown'}
      onEnable={onEnable}
      onDismiss={onDismiss}
    />
    <EnableMicButton
      isVisible={micState === 'dismissed'}
      onClick={onReshow}
    />
    <EnableBlockedToast
      isVisible={micState === 'blocked'}
      onDismiss={onDismissBlocked}
    />

    <style jsx>{`
      /* Match the wrapper padding of ShowcaseNavbarCompact so this slot
         occupies the same vertical space. The inner cards
         (EnableModal etc.) are inline-flex with their own dimensions
         (height 55px, border-radius 36px on desktop) so they fit
         naturally inside this centred flex container. */
      .navbar-mic-slot {
        display: flex;
        padding: 20px 16px;
        justify-content: center;
        align-items: center;
        align-self: stretch;
      }
    `}</style>
  </div>
);
