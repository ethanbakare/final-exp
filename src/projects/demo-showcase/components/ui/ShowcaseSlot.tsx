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
        align-items: center;
        width: 620px;
        min-height: 333px;
      }
      @media (max-width: 768px) {
        .demo-content-group {
          width: 100%;
          min-height: 280px;
        }
      }
    `}</style>
  </div>
);
