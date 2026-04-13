import React from 'react';

interface ShowcaseSlotProps {
  children: React.ReactNode;
  /** When true (demo mode), the slot grows to fit content instead of using a fixed height */
  autoHeight?: boolean;
  /** Per-project slot height in px. Each simulation specifies how tall it needs. */
  height?: number;
}

export const ShowcaseSlot: React.FC<ShowcaseSlotProps> = ({ children, autoHeight = false, height = 400 }) => (
  <div className={`demo-content-group ${autoHeight ? 'auto-height' : ''}`}>
    {children}

    <style jsx>{`
      .demo-content-group {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 620px;
        height: ${height}px;
      }
      .demo-content-group.auto-height {
        height: auto;
      }
      @media (max-width: 768px) {
        .demo-content-group {
          width: 100%;
        }
        .demo-content-group.auto-height {
          height: auto;
        }
      }
    `}</style>
  </div>
);
