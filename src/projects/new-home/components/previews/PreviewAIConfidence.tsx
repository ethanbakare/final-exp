import React from 'react';

const PreviewAIConfidence: React.FC = () => {
  return (
    <div className="preview-ai-confidence">
      {/* Background watercolor image */}
      <img
        src="/images/voice-interface/wt1.jpg"
        alt=""
        className="bg-image"
        draggable={false}
      />

      <style jsx>{`
        .preview-ai-confidence {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .bg-image {
          position: absolute;
          inset: -20px;
          width: calc(100% + 40px);
          height: calc(100% + 40px);
          object-fit: cover;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default PreviewAIConfidence;
