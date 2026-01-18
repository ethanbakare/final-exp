import React, { useState, useCallback } from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Voice Text Animation Component
 *
 * Features:
 * - Word-by-word fade-in animation
 * - Horizontal blur effect (no vertical movement)
 * - Natural multi-line text wrapping
 * - Staggered timing for smooth appearance
 *
 * Pattern from: AI Confidence Tracker / Deep Library
 */

interface VoiceTextAnimationProps {
  text: string;
  className?: string;
  animationDelay?: number;     // Delay between words (default: 0.07s = 70ms)
  animationDuration?: number;   // Duration per word (default: 0.5s)
}

export const VoiceTextAnimation: React.FC<VoiceTextAnimationProps> = ({
  text,
  className = '',
  animationDelay = 0.07,
  animationDuration = 0.5
}) => {
  const [key, setKey] = useState(0);

  /**
   * Reset animation
   * Useful if text changes and needs to re-animate
   */
  const resetAnimation = useCallback(() => {
    setKey(prevKey => prevKey + 1);
  }, []);

  // Split text into words
  const words = text.split(/\s+/).filter(word => word.length > 0);

  return (
    <>
      <div key={key} className={`voice-animated-text ${className}`}>
        {words.map((word, index) => (
          <span
            key={`word-${index}`}
            className="animated-word"
            style={{
              animationDelay: `${index * animationDelay}s`,
              animationDuration: `${animationDuration}s`
            }}
          >
            {word}
          </span>
        ))}
      </div>

      <style jsx>{`
        .voice-animated-text {
          display: inline;
          word-wrap: break-word;
          font-family: 'Open Runde', 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: -0.01em;
          line-height: 143.75%;
          color: var(--VoiceDarkGrey_90);
        }

        .animated-word {
          display: inline-block;
          opacity: 0;
          margin-right: 0.25em;
          animation: fadeInWordHorizontal forwards;
        }

        /* Horizontal fade-in animation */
        @keyframes fadeInWordHorizontal {
          from {
            opacity: 0;
            filter: blur(3px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }

        /* Accessibility: Disable animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animated-word {
            animation: none !important;
            opacity: 1 !important;
            filter: none !important;
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .voice-animated-text {
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
};
