import React, { useState } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

interface ContentBlock {
  id: string;
  text: string;
  animate: boolean;
}

export const BlockAnimationTest: React.FC = () => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [blockCounter, setBlockCounter] = useState(1);

  const addStaticBlock = () => {
    setBlocks(prev => [
      ...prev,
      {
        id: `block-${blockCounter}`,
        text: `Static Block ${blockCounter} - No animation`,
        animate: false
      }
    ]);
    setBlockCounter(c => c + 1);
  };

  const addAnimatedBlock = () => {
    setBlocks(prev => [
      ...prev,
      {
        id: `block-${blockCounter}`,
        text: `Animated Block ${blockCounter} - Fades in`,
        animate: true
      }
    ]);
    setBlockCounter(c => c + 1);
  };

  const disableAnimations = () => {
    // Simulates what happens when clicking "Record" again
    // Keeps blocks but disables animations (matches ClipMasterScreen fix)
    setBlocks(prev => prev.map(block => ({
      ...block,
      animate: false
    })));
  };

  const clearAll = () => {
    setBlocks([]);
    setBlockCounter(1);
  };

  return (
    <div className="test-container">
      <h2 style={{ color: '#FFFFFF', marginBottom: '1rem' }}>
        Content Block Animation Test
      </h2>
      
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Test how content blocks behave with the same rendering logic as ClipRecordScreen.
        Blocks stay in DOM with stable keys - no visual shifts. Add blocks and disable animations to test.
      </p>

      <div className="button-grid">
        <button onClick={addStaticBlock} className="test-button static">
          Add Static Block
        </button>
        <button onClick={addAnimatedBlock} className="test-button animated">
          Add Animated Block
        </button>
        <button onClick={disableAnimations} className="test-button reset">
          Disable Animations
        </button>
        <button onClick={clearAll} className="test-button clear">
          Clear All
        </button>
      </div>

      <div className="block-count">
        Total Blocks: {blocks.length}
      </div>

      {/* EXACT SAME RENDERING AS ClipRecordScreen */}
      <div className="content-area">
        {blocks.length > 0 ? (
          <>
            {blocks.map((block) => (
              <div 
                key={block.id}
                className={block.animate ? 'content-block animate-text-intro-horizontal' : 'content-block'}
              >
                <p className={styles.InterRegular16}>
                  {block.text}
                </p>
                <div className="block-meta">
                  ID: {block.id} | Animate: {block.animate.toString()}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="empty-state">No blocks yet. Add some blocks to test!</div>
        )}
      </div>

      <style jsx>{`
        .test-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          background: var(--ClipBg);
          border-radius: 12px;
        }

        .button-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 1.5rem;
        }

        .test-button {
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .test-button.static {
          background: #3B82F6;
          color: white;
        }

        .test-button.animated {
          background: #10B981;
          color: white;
        }

        .test-button.reset {
          background: #F59E0B;
          color: white;
        }

        .test-button.clear {
          background: #EF4444;
          color: white;
        }

        .test-button:hover {
          opacity: 0.8;
          transform: translateY(-2px);
        }

        .test-button:active {
          transform: translateY(0);
        }

        .block-count {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .content-area {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1.5rem;
          min-height: 200px;
        }

        .empty-state {
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          padding: 3rem 1rem;
          font-style: italic;
        }

        .block-meta {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 8px;
          font-family: 'Courier New', monospace;
        }

        /* EXACT SAME CSS AS ClipRecordScreen */
        .content-area :global(.content-block) {
          width: 100%;
          margin-bottom: 16px;
          background: rgba(255, 255, 255, 0.03);
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid rgba(59, 130, 246, 0.5);
        }
        
        .content-area :global(.content-block:last-child) {
          margin-bottom: 0;
        }
        
        .content-area :global(.content-block) p {
          color: var(--ClipWhite);
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;
        }
        
        /* Animation - same as ClipRecordScreen */
        .content-area :global(.content-block.animate-text-intro-horizontal) {
          animation: textIntroAnimationHorizontal 0.6s ease-out forwards;
          opacity: 0;
          filter: blur(3px);
          transform: translateX(-10px);
        }
        
        @keyframes textIntroAnimationHorizontal {
          0% {
            opacity: 0;
            filter: blur(3px);
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default BlockAnimationTest;

