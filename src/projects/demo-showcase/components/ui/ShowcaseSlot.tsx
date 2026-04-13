import React from 'react';

interface ShowcaseSlotProps {
  children: React.ReactNode;
  /** When true (demo mode), the slot grows to fit content instead of using a fixed height */
  autoHeight?: boolean;
}

export const ShowcaseSlot: React.FC<ShowcaseSlotProps> = ({ children, autoHeight = false }) => (
  <div className={`demo-content-group ${autoHeight ? 'auto-height' : ''}`}>
    {children}

    <style jsx>{`
      .demo-content-group {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        width: 620px;
        /* Fixed height in simulation mode reserves space for expanding
           drawers so nothing below shifts when they open */
        height: 400px;
      }
      .demo-content-group.auto-height {
        height: auto;
      }
      @media (max-width: 768px) {
        .demo-content-group {
          width: 100%;
          height: 360px;
        }
        .demo-content-group.auto-height {
          height: auto;
        }
      }
    `}</style>
  </div>
);
