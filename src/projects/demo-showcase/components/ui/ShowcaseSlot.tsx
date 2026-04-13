import React from 'react';

interface ShowcaseSlotProps {
  children: React.ReactNode;
}

export const ShowcaseSlot: React.FC<ShowcaseSlotProps> = ({ children }) => (
  <div className="demo-content-group">
    {children}

    <style jsx>{`
      .demo-content-group {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        width: 620px;
        /* Fixed height reserves space for the full simulation including
           any expanding drawers, so nothing below shifts when they open */
        height: 400px;
      }
      @media (max-width: 768px) {
        .demo-content-group {
          width: 100%;
          height: 360px;
        }
      }
    `}</style>
  </div>
);
