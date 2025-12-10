import React, { useState, useRef, useEffect } from 'react';
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
  autoSelect?: boolean;  // Auto-select text when component mounts (for rename modal)
  autoFocus?: boolean;   // Auto-focus input when component mounts
}

export const EntryBox: React.FC<EntryBoxProps> = ({ 
  value: controlledValue,
  onChange,
  placeholder = 'Clip Title',
  onFocus,
  onBlur,
  className = '',
  disabled = false,
  autoSelect = false,
  autoFocus = false
}) => {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use controlled value if provided, otherwise use internal state
  const inputValue = controlledValue !== undefined ? controlledValue : internalValue;
  
  // Auto-focus and auto-select on mount
  // Industry standard for rename modals: focus + select all text for easy replacement
  useEffect(() => {
    if (inputRef.current) {
      if (autoFocus) {
        inputRef.current.focus();
      }
      if (autoSelect && inputValue) {
        // Small delay to ensure value is set before selecting
        const timer = requestAnimationFrame(() => {
          if (inputRef.current) {
            // Select all text
            inputRef.current.select();
            // Scroll to start of text so user sees the beginning
            // This handles long titles that overflow the input
            inputRef.current.scrollLeft = 0;
            // Also set selection to start from position 0
            inputRef.current.setSelectionRange(0, inputRef.current.value.length);
          }
        });
        return () => cancelAnimationFrame(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, autoSelect]);  // Only run on mount (intentionally omit inputValue)
  
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
            className={`title-text ${styles.InterRegular16}`}
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
           🎨 CUSTOMIZATION VARIABLES
           ============================================
           Easy customization - change these values at the top:
           --entry-bar-radius: Inner container border-radius
           --outline-padding: Space between inner and outer containers
           --outline-radius: Automatically calculated (inner + padding)
           --cursor-color: Custom cursor color
           ============================================ */
        
        /* ============================================
           RENAME OUTLINE - Outer container with focus ring
           ============================================ */
        .rename-outline {
          /* Dynamic border-radius calculation */
          --entry-bar-radius: 8px;
          --outline-padding: 2px;
          --outline-radius: calc(var(--entry-bar-radius) + var(--outline-padding));
          
          /* Cursor customization */
          --cursor-color: var(--ClipCursorColor);
          
          /* Box model - border-box ensures padding is inside dimensions */
          box-sizing: border-box;
          
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          padding: var(--outline-padding);
          gap: 10px;
          
          width: 231px;
          height: 42px;
          
          border-radius: var(--outline-radius);
          
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
          border-radius: var(--entry-bar-radius);
          
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

