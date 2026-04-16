/**
 * Animated Voice UI preview for the home page card.
 * Reuses LoopingBlob from blob-studio — auto-loops through voice states:
 * idle → listening → thinking → speaking → idle.
 *
 * Card dimensions: 282×321px (standard home page grid cell).
 * Background: var(--preview-voice-bg) = #F7F6F4, matches Whimsy bgColor.
 */
import React from 'react';
import { LoopingBlob } from '@/projects/voiceinterface/components/blob-studio/LoopingBlob';
import {
  WHIMSY_BASE,
  DEFAULT_STATE_SETTINGS,
} from '@/projects/voiceinterface/components/blob-studio/blobStudioTypes';

// Use a larger scale for the home page preview (card is smaller than
// the studio's 400×400). 0.7 gives a comparable blob visual size at
// 282×282 to what 0.55 gives at 400×400.
const PREVIEW_BASE = {
  ...WHIMSY_BASE,
  scale: 0.7,
};

const studioSettings = {
  base: PREVIEW_BASE,
  states: DEFAULT_STATE_SETTINGS,
};

const PreviewVoiceAnimated: React.FC = () => {
  return (
    <div className="preview-voice">
      <LoopingBlob
        studioSettings={studioSettings}
        width={282}
        height={282}
        showLabel
        labelFontSize={13}
        labelOffset={60}
      />
      <style jsx>{`
        .preview-voice {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        /* The DemoCard label sits at the bottom-center of the card
           (takes roughly 32px height). Shift the blob up by half
           that amount so the blob-plus-state-label group is visually
           centered in the remaining space above the card label. */
        .preview-voice :global(.looping-blob) {
          transform: translateY(-16px);
        }
      `}</style>
    </div>
  );
};

export default PreviewVoiceAnimated;
