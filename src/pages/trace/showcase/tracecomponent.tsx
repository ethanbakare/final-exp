import React, { useState } from 'react';
import {
  TraceButton,
  TraceActionButton,
  TraceToggleButton,
} from '@/projects/trace/components/ui/tracebuttons';

// Trace Component Showcase
// Displays individual UI components in isolation
// Following Voice Interface pattern

// ButtonGrid - Only for showcase display
interface ButtonGridProps {
  children: React.ReactNode;
  label: string;
  showToggle?: boolean;
  toggleState?: boolean;
  onToggle?: () => void;
}

const ButtonGrid: React.FC<ButtonGridProps> = ({
  children,
  label,
  showToggle = false,
  toggleState = false,
  onToggle
}) => {
  return (
    <>
      <div className="button-grid">
        {/* Toggle switch at top-right corner */}
        {showToggle && (
          <div className="toggle-container" onClick={onToggle}>
            <div className={`toggle-switch ${toggleState ? 'active' : ''}`}>
              <div className="toggle-slider"></div>
            </div>
          </div>
        )}

        {/* Main centered button area */}
        <div className="button-center">
          {children}
        </div>

        {/* Label at bottom inside grid */}
        <div className="button-label">
          {label}
        </div>
      </div>

      <style jsx>{`
        .button-grid {
          /* Size */
          width: 200px;
          height: 200px;

          /* Layout */
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          /* Style */
          border: 0.8px solid rgba(38, 36, 36, 0.05);
          border-radius: 0px;
          background: transparent;

          /* Inside auto layout */
          flex: none;
        }

        .button-center {
          /* Centered content */
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
        }

        .button-label {
          /* Bottom label text */
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);

          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 0.375rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: rgba(94, 94, 94, 0.5);

          white-space: nowrap;
        }

        .toggle-container {
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0.3;
          cursor: pointer;
          transition: opacity 0.2s ease;
          z-index: 10;
        }

        .toggle-container:hover {
          opacity: 0.6;
        }

        .toggle-switch {
          width: 28px;
          height: 16px;
          background: rgba(38, 36, 36, 0.2);
          border-radius: 8px;
          position: relative;
          transition: background 0.2s ease;
        }

        .toggle-switch.active {
          background: rgba(38, 36, 36, 0.5);
        }

        .toggle-slider {
          width: 12px;
          height: 12px;
          background: #FFFFFF;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: left 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.active .toggle-slider {
          left: 14px;
        }
      `}</style>
    </>
  );
};

const TraceComponents: React.FC = () => {
  // Component state management
  const [isToggleActive, setIsToggleActive] = useState(false);

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #FFFFFF;
        }

        .showcase-container {
          padding: 2rem;
          min-height: 100vh;
          background-color: #FFFFFF;
        }

        .section {
          margin-bottom: 3rem;
        }

        .section-title {
          color: #1C1C1C;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .seamless-grid {
          display: inline-flex;
          flex-wrap: wrap;
          max-width: 1000px;
          margin-left: -0.8px;
          margin-top: -0.8px;
        }

        .file-label {
          color: rgba(0, 0, 0, 0.5);
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 2rem;
        }
      `}</style>

      <div className="showcase-container">
        <div className="section">
          <h2 className="section-title">Trace Components</h2>
          <div className="file-label">📁 tracebuttons.tsx</div>

          {/* Seamless grid layout - borders touch */}
          <div className="seamless-grid">
            <ButtonGrid label="TRACE BUTTON - 38PX">
              <TraceButton />
            </ButtonGrid>

            <ButtonGrid label="TRACE ACTION BUTTON - 44PX">
              <TraceActionButton />
            </ButtonGrid>

            <ButtonGrid
              label="TRACE TOGGLE BUTTON - 64PX"
              showToggle={true}
              toggleState={isToggleActive}
              onToggle={() => setIsToggleActive(!isToggleActive)}
            >
              <TraceToggleButton isActive={isToggleActive} />
            </ButtonGrid>
          </div>
        </div>
      </div>
    </>
  );
};

export default TraceComponents;
