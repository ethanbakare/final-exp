import React from 'react';

/**
 * Trace UI Components
 * Basic button components for the Trace feature
 */

// Example: Basic Trace Button
export const TraceButton: React.FC = () => {
  return (
    <button
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        border: '1.5px solid rgba(38, 36, 36, 0.9)',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="6" stroke="rgba(38, 36, 36, 0.9)" strokeWidth="1.5" />
      </svg>
    </button>
  );
};

// Example: Trace Action Button
export const TraceActionButton: React.FC = () => {
  return (
    <button
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '8px',
        border: '1px solid rgba(38, 36, 36, 0.2)',
        background: '#FFFFFF',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 5V15M5 10H15" stroke="rgba(38, 36, 36, 0.9)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
};

// Example: Trace Toggle Button
export const TraceToggleButton: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  return (
    <button
      style={{
        width: '64px',
        height: '32px',
        borderRadius: '16px',
        border: '1px solid rgba(38, 36, 36, 0.2)',
        background: isActive ? 'rgba(38, 36, 36, 0.9)' : '#FFFFFF',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.3s ease',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: '#FFFFFF',
          position: 'absolute',
          top: '3px',
          left: isActive ? '36px' : '4px',
          transition: 'left 0.3s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        }}
      />
    </button>
  );
};
