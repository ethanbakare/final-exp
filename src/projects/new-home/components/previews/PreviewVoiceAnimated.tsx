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

const studioSettings = {
  base: WHIMSY_BASE,
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
        labelOffset={80}
      />
      <style jsx>{`
        .preview-voice {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default PreviewVoiceAnimated;
