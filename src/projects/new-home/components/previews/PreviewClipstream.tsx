import React from 'react';
import { VoiceTextBoxClip } from '@/projects/voiceinterface/components/VoiceTextBoxClip';

/**
 * Homepage clipstream demo card.
 * Replaces the original static SVG mock with the live VoiceTextBoxClip
 * in simulate mode — same 393×160 footprint, but the auto-loop drives
 * the full state machine (idle -> rec -> proc -> complete -> idle) with
 * a real waveform fed by a buffer-source playback of the sample track.
 *
 * The .preview-clipstream wrapper keeps the absolute-centered placement
 * inside .card-clipstream so the outer carousel layout doesn't have to
 * change.
 */
const PreviewClipstream: React.FC = () => {
  return (
    <div className="preview-clipstream">
      <VoiceTextBoxClip simulate />

      <style jsx>{`
        .preview-clipstream {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default PreviewClipstream;
