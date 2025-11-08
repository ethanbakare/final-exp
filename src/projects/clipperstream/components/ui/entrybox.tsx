import React, { useState, useRef } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

// EntryBox Component
// Text input field for ClipperStream with smooth focus states

/* ============================================
   ENTRY BOX - Input field with focus ring
   ============================================ */

interface EntryBoxProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
}

export const EntryBox: React.FC<EntryBoxProps> = ({ 
  value: controlledValue,
  onChange,
  placeholder = 'Clip Title',
  onFocus,
  onBlur,
  className = '',
  disabled = false
}) => {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use controlled value if provided, otherwise use internal state
  const inputValue = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    if (onChange) {
      onChange(newValue);
    }
  };
  
  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <>
      <div className={`rename-outline ${isFocused ? 'focused' : ''} ${className} ${styles.container}`}>
        <div className="entry-bar">
          <input
            ref={inputRef}
            type="text"
            className="title-text"
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      </div>
      
      <style jsx>{`
        /* ============================================
           🎨 CURSOR CUSTOMIZATION VARIABLES
           ============================================
           Easy customization - change these values at the top:
           --cursor-color: Change the cursor color (default: blue)
           --cursor-thickness: Adjust via font-size (limited control)
           ============================================ */
        
        /* ============================================
           RENAME OUTLINE - Outer container with focus ring
           ============================================ */
        .rename-outline {
          /* Cursor customization variables */
          --cursor-color: var(--ClipCursorColor);        /* Cursor color (Tailwind blue-500) */
          --cursor-thickness: 2px;         /* Note: Limited browser support */
          
          /* Box model - border-box ensures padding is inside dimensions */
          box-sizing: border-box;
          
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          padding: 2px;
          gap: 10px;
          
          width: 231px;
          height: 42px;
          
          border-radius: 9px;
          
          /* Use box-shadow for focus ring - doesn't affect layout */
          box-shadow: 0 0 0 0px var(--RecWhite_05);
          
          /* Smooth transition for focus ring */
          transition: box-shadow 0.2s ease;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* Active state - focus ring appears as outer glow */
        .rename-outline.focused {
          box-shadow: 0 0 0 3px var(--RecWhite_05);
        }
        
        /* ============================================
           ENTRY BAR - Input container
           ============================================ */
        .entry-bar {
          /* Box model */
          box-sizing: border-box;
          
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px 8px;
          
          width: 100%;
          height: 100%;
          min-height: 38px;
          
          background: var(--RecWhite_05);
          border: 1px solid transparent;
          border-radius: 8px;
          
          /* Smooth transition for border */
          transition: border-color 0.2s ease;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Border appears when focused */
        .rename-outline.focused .entry-bar {
          border: 1px solid var(--RecWhite_30);
        }
        
        /* ============================================
           TITLE TEXT - Input field with custom cursor
           ============================================ */
        .title-text {
          /* Remove default input styling */
          background: transparent;
          border: none;
          outline: none;
          
          /* Typography */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-style: normal;
          font-weight: 400;
          font-size: 16px;
          line-height: 19px;
          
          color: var(--RecWhite);
          
          /* Layout */
          width: 100%;
          height: 19px;
          
          /* ============================================
             CUSTOM CURSOR STYLING
             ============================================
             Using caret-color for custom cursor appearance.
             Color: Fully customizable via --cursor-color variable
             Thickness: Limited browser support, depends on font-size
             Rounded edges: Experimental, @supports check below
             ============================================ */
          caret-color: var(--cursor-color);
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Placeholder styling */
        .title-text::placeholder {
          color: var(--RecWhite_20);
        }
        
        /* Ensure cursor color persists on focus */
        .title-text:focus {
          caret-color: var(--cursor-color);
        }
        
        /* ============================================
           EXPERIMENTAL: Rounded cursor edges
           ============================================
           Note: Limited browser support (mainly Firefox)
           Uses CSS property 'caret-shape' with bar value
           For fuller control, would need custom cursor implementation
           ============================================ */
        @supports (caret-shape: bar) {
          .title-text {
            caret-shape: bar;
          }
        }
        
        /* Disabled state */
        .rename-outline.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .rename-outline.disabled .title-text {
          cursor: not-allowed;
        }
        
        /* Cursor automatically blinks when focused (browser default) */
      `}</style>
    </>
  );
};

/* ============================================
   DEFAULT EXPORT
   ============================================ */

export default EntryBox;

