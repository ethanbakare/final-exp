import React, { useState, useRef } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

// Search Component
// iPhone-style search bar with 3-state morphing: idle → focused → has-text
// Following patterns from clipmorphingbuttons.tsx (width-tracker) and entrybox.tsx (input handling)

/* ============================================
   SEARCH COMPONENT - 3-State Morphing Search Bar
   
   STATE 1 (idle): SearchBar 361px full width, no Cancel button
   STATE 2 (focused): SearchBar shrinks to 292px, Cancel (59px) slides in from right
   STATE 3 (has-text): Same as State 2 + SearchClose (38px circle) appears inside bar
   
   ANIMATION PATTERN:
   - SearchBar shrinks from RIGHT to LEFT (like Processing→Structure button)
   - CancelSearch slides in as space opens (like timer gliding)
   - SearchClose appears instantly when typing (like RecordButton in mainmorph.tsx)
   
   ============================================ */

interface SearchProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;  // Enables responsive mode - fills parent up to 361px max
}

export const Search: React.FC<SearchProps> = ({ 
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Search',
  onFocus,
  onBlur,
  className = '',
  disabled = false,
  fullWidth = false  // Default: fixed 361px width (for showcase)
}) => {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use controlled value if provided, otherwise use internal state
  const inputValue = controlledValue !== undefined ? controlledValue : internalValue;
  
  // Determine current state based on focus and content
  // State 1: idle (not focused, no content)
  // State 2: focused (focused, no content)
  // State 3: has-text (focused, has content)
  const hasText = inputValue.length > 0;
  const searchState = !isFocused && !hasText ? 'idle' : hasText ? 'has-text' : 'focused';
  
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
  
  const handleCancel = () => {
    // Clear input and blur
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    if (onChange) {
      onChange('');
    }
    inputRef.current?.blur();
    setIsFocused(false);
  };
  
  const handleClearText = () => {
    // Clear input but keep focus
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    if (onChange) {
      onChange('');
    }
    inputRef.current?.focus();
  };

  return (
    <>
      <div className={`search-container ${fullWidth ? 'full-width' : ''} state-${searchState} ${className} ${styles.container}`}>
        {/* SearchBar - Shrinks from 361px → 292px when focused */}
        <div className="search-bar-tracker">
          <div className="search-bar">
            {/* SearchIcon - Following clipbuttons.tsx pattern */}
            <div className="search-icon-wrapper">
              <svg 
                className="search-icon"
                width="36" 
                height="38" 
                viewBox="0 0 36 38" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M17.3994 22.885C18.9258 22.885 20.2226 22.3511 21.2896 21.2832C22.3567 20.2155 22.8902 18.919 22.8902 17.3937C22.8902 15.8683 22.3564 14.5721 21.2887 13.505C20.221 12.4379 18.9245 11.9044 17.3992 11.9044C15.8738 11.9044 14.5767 12.4382 13.5078 13.5059C12.4389 14.5738 11.9044 15.8704 11.9044 17.3957C11.9044 18.9209 12.4386 20.2171 13.5071 21.2841C14.5755 22.3514 15.873 22.885 17.3994 22.885ZM17.4079 24.7894C15.3398 24.7894 13.5881 24.0705 12.1529 22.6328C10.7176 21.1951 10 19.449 10 17.3946C10 15.3403 10.7194 13.5943 12.1582 12.1566C13.5969 10.7189 15.3442 10 17.4001 10C19.4545 10 21.2006 10.7171 22.6383 12.1513C24.0759 13.5856 24.7946 15.336 24.7946 17.4024C24.7946 18.2504 24.6617 19.0583 24.3959 19.826C24.13 20.5937 23.7524 21.2908 23.2629 21.9172L27.3267 25.9763C27.6987 26.3479 27.6995 26.9505 27.3285 27.323C26.9564 27.6966 26.3517 27.6971 25.9791 27.324L21.9172 23.2576C21.2906 23.7434 20.5941 24.1202 19.8276 24.3878C19.0611 24.6555 18.2545 24.7894 17.4079 24.7894Z" 
                  fill="white" 
                  fillOpacity="0.6"
                />
              </svg>
            </div>
            
            {/* SearchTextBox - Flexible width, shrinks when SearchClose appears */}
            <div className="search-text-box">
              <input
                ref={inputRef}
                type="text"
                className={`search-input ${styles.InterRegular16}`}
                value={inputValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
              />
            </div>
            
            {/* SearchClose - Following clipbuttons.tsx pattern */}
            <button 
              className="search-close"
              onClick={handleClearText}
              type="button"
              aria-label="Clear search"
            >
              <svg 
                width="38" 
                height="38" 
                viewBox="0 0 38 38" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect 
                  x="10" 
                  y="10" 
                  width="18" 
                  height="18" 
                  rx="9" 
                  fill="white" 
                  fillOpacity="0.3"
                />
                <path 
                  d="M22.4891 22.4888L15.5112 15.511M22.4891 15.511L15.5112 22.4889" 
                  stroke="#252525" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Cancel Wrapper - Reveals cancel button with slide-in effect */}
        <div className="cancel-wrapper">
          <button 
            className="cancel-search"
            onClick={handleCancel}
            type="button"
          >
            <span className={styles.InterRegular16}>Cancel</span>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        /* ============================================
           ACCESSIBILITY
           ============================================ */
        
        @media (prefers-reduced-motion: reduce) {
          .search-container,
          .search-container * {
            transition: none !important;
          }
        }
        
        /* ============================================
           SEARCH CONTAINER - Fixed 361px outer container
           Prevents layout shift, contains all elements
           ============================================ */
        
        .search-container {
          /* Layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;  /* CRITICAL: Left-align so SearchBar LEFT edge is FIXED */
          padding: 0px;
          gap: 0px;  /* No gap - spacing handled by cancel button's margin */
          
          /* Default: Fixed dimensions from other.md (for showcase) */
          width: 361px;
          height: 38px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* Full-width mode: Responsive, fills parent container */
        .search-container.full-width {
          width: 100%;
          box-sizing: border-box;
        }
        
        /* ============================================
           SEARCH BAR TRACKER - Width-tracking wrapper
           Reports SearchBar width changes to parent (like button-width-tracker)
           ============================================ */
        
        .search-bar-tracker {
          /* Tracks SearchBar's morphing width */
          position: relative;
          width: 361px;        /* STATE 1: Full width (default for showcase) */
          height: 38px;
          flex-shrink: 0;
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);  /* Smooth shrink animation */
          overflow: visible;   /* Don't clip contents */
          display: flex;
          align-items: center;
          justify-content: flex-start;  /* Left-align SearchBar - LEFT edge FIXED, RIGHT edge shrinks */
        }
        
        /* STATE 2 & 3: SearchBar shrinks to 292px */
        .search-container.state-focused .search-bar-tracker,
        .search-container.state-has-text .search-bar-tracker {
          width: 292px;        /* Shrunk width from other.md */
        }
        
        /* Full-width mode: SearchBar tracker fills available space */
        .search-container.full-width .search-bar-tracker {
          width: 100%;         /* Fill container in idle state */
          flex-shrink: 1;      /* Allow shrinking when cancel appears */
        }
        
        /* Full-width + focused: Shrink to make room for cancel (59px + 10px gap) */
        .search-container.full-width.state-focused .search-bar-tracker,
        .search-container.full-width.state-has-text .search-bar-tracker {
          width: calc(100% - 69px);  /* 100% minus cancel width (59px) and gap (10px) */
        }
        
        /* ============================================
           SEARCH BAR - Main input container
           ============================================ */
        
        .search-bar {
          /* Box model */
          box-sizing: border-box;
          
          /* Layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          
          /* Full width of tracker */
          width: 100%;
          height: 38px;
          min-height: 38px;
          
          /* Styling from other.md */
          background: var(--RecWhite_05);
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 1;
        }
        
        /* ============================================
           SEARCH ICON WRAPPER - Following clipbuttons.tsx pattern
           ============================================ */
        
        .search-icon-wrapper {
          /* Box model - padding is inside dimensions */
          box-sizing: border-box;
          
          /* Auto layout from other.md */
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding: 10px 8px 10px 10px;  /* Top Right Bottom Left */
          gap: 10px;
          
          width: 36px;
          height: 38px;
          
  
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .search-icon {
          width: 36px;     /* Matches viewBox - like CopyButton pattern */
          height: 38px;
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* ============================================
           SEARCH TEXT BOX - Flexible input container
           Shrinks when SearchClose appears (state 3)
           ============================================ */
        
        .search-text-box {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 8px 0px;
          gap: 8px;
          
          /* Flexible width - fills available space */
          flex: 1;
          height: 38px;
          min-width: 0;  /* Allows flex item to shrink below content size */
          
          /* Inside auto layout */
          order: 1;
          flex-grow: 1;
        }
        
        /* ============================================
           SEARCH INPUT - Text input field
           Following entrybox.tsx cursor pattern
           ============================================ */
        
        .search-input {
          /* Remove default input styling */
          background: transparent;
          border: none;
          outline: none;
          
          /* Typography from other.md */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-style: normal;
          font-weight: 400;
          font-size: 18px;
          line-height: 22px;
          
          /* STATE 1: Placeholder color (not focused, no text) */
          color: var(--RecWhite_60);
          
          /* Layout */
          width: 100%;
          height: 22px;
          
          /* Custom cursor from entrybox.tsx */
          caret-color: var(--ClipCursorColor);
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* STATE 2 & 3: Input text becomes white when focused */
        .search-container.state-focused .search-input,
        .search-container.state-has-text .search-input {
          color: var(--RecWhite);
        }
        
        /* Placeholder styling from other.md */
        .search-input::placeholder {
          color: var(--RecWhite_60);
        }
        
        /* Ensure cursor color persists on focus */
        .search-input:focus {
          caret-color: var(--ClipCursorColor);
        }
        
        /* Experimental: Rounded cursor edges (from entrybox.tsx) */
        @supports (caret-shape: bar) {
          .search-input {
            caret-shape: bar;
          }
        }
        
        /* ============================================
           SEARCH CLOSE - Following cliplist.tsx dot menu pattern
           Uses display toggle for true "not there" behavior
           ============================================ */
        
        .search-close {
          /* Auto layout from other.md */
          display: none;  /* STATE 1 & 2: Completely removed from layout */
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding: 10px;   /* 10px all around */
          gap: 10px;
          
          width: 38px;
          height: 38px;
          
          /* Styling */
          background: transparent;
          cursor: pointer;
          border: none;
          
          /* Inside auto layout */
          flex: none;
          order: 2;
          flex-grow: 0;
        }
        
        /* SearchClose SVG - Matches viewBox like CopyButton pattern */
        .search-close svg {
          width: 38px;
          height: 38px;
          flex: none;
        }
        
        /* STATE 3: SearchClose appears instantly when has text (like RecordButton) */
        .search-container.state-has-text .search-close {
          display: flex;  /* Now exists in layout */
        }
        
        /* Hover effect for SearchClose */
        .search-close:hover {
          opacity: 0.8;
        }
        
        /* ============================================
           CANCEL WRAPPER - Creates space for cancel button
           Expands to make room; clips button during slide
           ============================================ */
        
        .cancel-wrapper {
          /* Layout - button positioned at left edge */
          display: flex;
          flex-direction: row;
          justify-content: flex-start;  /* Button natural position at left */
          align-items: center;
          
          /* SIZE: Collapsed by default */
          width: 0px;              /* STATE 1: No space taken */
          height: 38px;
          
          /* CRITICAL: Clips button when it's translated off-screen */
          overflow: hidden;
          
          /* Smooth width transition - creates space for button */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* STATE 2 & 3: Wrapper expands to create space */
        .search-container.state-focused .cancel-wrapper,
        .search-container.state-has-text .cancel-wrapper {
          width: 69px;  /* 10px gap + 59px button */
        }
        
        /* ============================================
           CANCEL SEARCH - TRUE SLIDE-IN using translateX
           Button ACTUALLY MOVES from right to left
           ============================================ */
        
        .cancel-search {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          /* Styling */
          background: transparent;
          border: none;
          cursor: pointer;
          
          /* SIZE: Always full width */
          width: 59px;
          min-width: 59px;
          height: 38px;
          min-height: 38px;
          
          /* 10px left margin creates the gap */
          margin-left: 10px;
          
          /* STATE 1: Button pushed off-screen to the RIGHT */
          transform: translateX(69px);  /* Pushed 69px = matches wrapper expansion distance */
          opacity: 0;
          
          /* TRUE SLIDE: translateX animates the button's position */
          transition: 
            transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Inside auto layout */
          flex: none;
          flex-grow: 0;
          pointer-events: none;   /* STATE 1: Not clickable */
        }
        
        /* STATE 2 & 3: Button SLIDES IN from right to left */
        .search-container.state-focused .cancel-search,
        .search-container.state-has-text .cancel-search {
          transform: translateX(0);  /* Slides to natural position */
          opacity: 1;
          pointer-events: auto;
        }
        
        /* Cancel text styling from other.md */
        .cancel-search span {
          width: 59px;
          height: 22px;
          text-align: center;
          color: var(--RecWhite);
          white-space: nowrap;  /* Prevent text wrapping during animation */
          
          /* Typography */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-style: normal;
          font-weight: 400;
          font-size: 18px;
          line-height: 22px;
          
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Hover effect for Cancel */
        .cancel-search:hover span {
          opacity: 0.8;
        }
        
        /* Disabled state */
        .search-container.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .search-container.disabled .search-input {
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
};

/* ============================================
   DEFAULT EXPORT
   ============================================ */

export default Search;

