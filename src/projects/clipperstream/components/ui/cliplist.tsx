import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { OptionsDropDown } from './clipmenudropdown';
import { usePortalContainer } from './PortalContainerContext';

// ClipperStream List Item Component
// List item for displaying clips with title, date, and status
// Supports 3 states: pending (waiting), transcribing (active), null (completed)
// Uses PortalContainerContext for contained dropdowns within screen components

/* ============================================
   INTERFACES
   ============================================ */

interface ClipListItemProps {
  id?: string;                              // Unique identifier for the clip
  title?: string;                           // Default: "Teach me to love myself"
  date?: string;                            // Default: "May 13, 2025" - Format: "Mon DD, YYYY"
  status?: 'pending' | 'transcribing' | null; // Default: null (completed, no status shown)
  onClick?: (id: string) => void;                  // Called when item is clicked (navigate to clip)
  onDotMenuClick?: () => void;
  onRename?: (id: string, title: string) => void;  // Called when rename is clicked
  onCopy?: (id: string) => void;                   // Called when copy is clicked
  onDelete?: (id: string) => void;                 // Called when delete is clicked
  isDeleting?: boolean;                            // Controls delete animation (fade out)
  className?: string;
  fullWidth?: boolean;  // Enables responsive mode - fills parent container (for use inside screens)
}

/* ============================================
   PENDING ICON SVG - Static reload icon
   ============================================ */

const PendingIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M5.05613 7.88726H2.69677V10.2466M6.94361 4.11229H9.30297V1.75293M2.5 4.58565C2.76457 3.93081 3.20754 3.36333 3.77856 2.9477C4.34957 2.53207 5.02593 2.28497 5.73039 2.23448C6.43485 2.18398 7.13924 2.33211 7.7637 2.66204C8.38816 2.99198 8.90723 3.49049 9.2625 4.1009M9.5 7.41389C9.23543 8.06873 8.79246 8.63621 8.22144 9.05184C7.65043 9.46747 6.97436 9.71458 6.2699 9.76508C5.56545 9.81558 4.8608 9.66743 4.23634 9.33749C3.61188 9.00756 3.09258 8.50907 2.73732 7.89867" 
      stroke="white" 
      strokeOpacity="0.4" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);


/* ============================================
   DOT MENU SVG
   Three-dot menu icon with responsive opacity
   ============================================ */

interface DotMenuIconProps {
  isHovered: boolean;
  isClicked: boolean;
}

const DotMenuIcon: React.FC<DotMenuIconProps> = ({ isHovered, isClicked }) => {
  // Determine fill opacity based on state
  // Desktop: 0 (invisible) → 1 (visible on hover)
  // Mobile: 0.4 (default) → 1 (on click)
  
  return (
    <svg 
      className="dot-menu-svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="6" cy="12" r="1.5" fill="white" className="dot-circle" />
      <circle cx="12" cy="12" r="1.5" fill="white" className="dot-circle" />
      <circle cx="18" cy="12" r="1.5" fill="white" className="dot-circle" />
    </svg>
  );
};

/* ============================================
   CLIP LIST ITEM
   Main list item component with hover states
   ============================================ */

export const ClipListItem: React.FC<ClipListItemProps> = ({
  id = 'default-id',
  title = 'Teach me to love myself today and I will teach you to love yourself',
  date = 'May 13, 2025',
  status = null, // Default to completed (no status)
  onClick,
  onDotMenuClick,
  onRename,
  onCopy,
  onDelete,
  isDeleting = false,  // Controls fade-out animation when item is being deleted
  className = '',
  fullWidth = false  // Default: fixed 361px width (for showcase)
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOverDot, setIsOverDot] = useState(false);
  const [isDotClicked, setIsDotClicked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuAnimating, setIsMenuAnimating] = useState(false); // For animation state
  const [menuPlacedAbove, setMenuPlacedAbove] = useState(false); // Track if menu is above or below
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({});
  const [isMounted, setIsMounted] = useState(false); // For SSR - only render portal on client
  const listItemRef = useRef<HTMLDivElement>(null);
  const listDotRef = useRef<HTMLDivElement>(null); // Reference to list-dot container (for click detection)
  const dotMenuRef = useRef<HTMLDivElement>(null); // Reference to visual dot-menu (24x24) for positioning
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get portal container from context (falls back to document.body if not in a screen component)
  const portalContainer = usePortalContainer();
  
  // Check if we're using a custom container (not document.body)
  const isContainedPortal = portalContainer && portalContainer !== document.body;

  // Calculate menu position based on available space
  // Handles both viewport-relative (document.body) and container-relative positioning
  const calculateMenuPosition = useCallback(() => {
    if (!dotMenuRef.current) return;

    // Get boundaries of the VISUAL dot-menu (24x24), not the container
    const dotRect = dotMenuRef.current.getBoundingClientRect();
    
    // Get container boundaries (for contained portals)
    const containerRect = isContainedPortal && portalContainer
      ? portalContainer.getBoundingClientRect()
      : { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth, width: window.innerWidth, height: window.innerHeight };
    
    // Estimated dimensions (will be dynamically adjusted if menu extends past viewport)
    const menuHeight = 119; // 3 rows × 35px + padding
    const menuWidth = 119;  // Minimum width (actual width may vary)
    const gap = 10;         // Gap between VISUAL dot-menu (24x24) and dropdown - consistent in both directions
    const viewportPadding = 8; // Safety margin from edges
    
    // Use container bounds for contained portals, viewport for document.body
    const boundsHeight = isContainedPortal ? containerRect.height : window.innerHeight;
    const boundsWidth = isContainedPortal ? containerRect.width : window.innerWidth;

    // Calculate positions relative to container (for contained) or viewport (for document.body)
    // For contained portals: subtract container offset to get relative positions
    const offsetTop = isContainedPortal ? containerRect.top : 0;
    const offsetLeft = isContainedPortal ? containerRect.left : 0;
    
    // Relative positions within bounds
    const dotRelativeTop = dotRect.top - offsetTop;
    const dotRelativeBottom = dotRect.bottom - offsetTop;
    const dotRelativeLeft = dotRect.left - offsetLeft;
    const dotRelativeRight = dotRect.right - offsetLeft;

    // Calculate available space in all directions (relative to bounds)
    const spaceBelow = boundsHeight - dotRelativeBottom - viewportPadding;
    const spaceAbove = dotRelativeTop - viewportPadding;

    let position: { top?: number; bottom?: number; left?: number; right?: number } = {};

    // Determine vertical placement (below or above)
    const canPlaceBelow = spaceBelow >= menuHeight + gap;
    const canPlaceAbove = spaceAbove >= menuHeight + gap;
    
    // Prefer below, fallback to above
    const placeBelow = canPlaceBelow || !canPlaceAbove;

    if (placeBelow) {
      // Place below: Use consistent gap from bottom of dot menu
      position.top = dotRelativeBottom + gap;
      setMenuPlacedAbove(false);
    } else {
      // Place above: Use consistent gap from top of dot menu
      position.bottom = boundsHeight - dotRelativeTop + gap;
      setMenuPlacedAbove(true);
    }

    // Determine horizontal placement (left-aligned or right-aligned)
    // Key: Check if menu would extend past right edge
    const menuWouldOverflowRight = dotRelativeLeft + menuWidth > boundsWidth - viewportPadding;
    
    if (menuWouldOverflowRight) {
      // Right-align: Position menu so its right edge aligns with dot menu's right edge
      position.right = boundsWidth - dotRelativeRight;
      
      // Clamp to ensure menu doesn't go past left edge
      const calculatedLeft = boundsWidth - (boundsWidth - dotRelativeRight) - menuWidth;
      if (calculatedLeft < viewportPadding) {
        position.right = boundsWidth - menuWidth - viewportPadding;
      }
    } else {
      // Left-align: Default behavior
      position.left = Math.max(dotRelativeLeft, viewportPadding);
    }

    setMenuPosition(position);
  }, [isContainedPortal, portalContainer]);

  const handleDotMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click
    
    const newMenuState = !isMenuOpen;
    
    if (newMenuState) {
      // Opening menu: Calculate position first, then trigger animation
      calculateMenuPosition();
      setIsMenuOpen(true);
      // Trigger animation after a frame to ensure initial state is applied
      requestAnimationFrame(() => {
        setIsMenuAnimating(true);
      });
    } else {
      // Closing menu: Remove animation state first, then close after transition
      setIsMenuAnimating(false);
      // Wait for exit animation to complete (150ms) before removing from DOM
      setTimeout(() => {
        setIsMenuOpen(false);
      }, 150);
    }
    
    setIsDotClicked(!isDotClicked);
    onDotMenuClick?.();
  };

  const handleDotMouseEnter = () => {
    setIsOverDot(true);
  };

  const handleDotMouseLeave = () => {
    setIsOverDot(false);
  };

  // Only show hover state when hovering over container but NOT over dot area
  const shouldShowHover = isHovered && !isOverDot;

  // SSR: Set mounted state on client side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Recalculate position after dropdown renders (for accurate dimensions)
  useEffect(() => {
    if (isMenuOpen && dropdownRef.current) {
      // Small delay to ensure dropdown has rendered and has dimensions
      const timer = setTimeout(() => {
        calculateMenuPosition();
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen, calculateMenuPosition]);

  // Scroll lock: Prevent body scroll when menu is open
  // Best practice: Prevents accidental scrolling while interacting with menu
  useEffect(() => {
    if (!isMenuOpen) return;

    // Save current scroll position
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Lock scroll
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // Prevent layout shift from scrollbar disappearing
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup: Restore scroll when menu closes
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isMenuOpen]);

  // Click-outside handler to reset dot menu and close dropdown
  // Checks both listItemRef AND dropdownRef (portal renders outside parent)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const clickedInsideList = listItemRef.current?.contains(target);
      const clickedInsideDropdown = dropdownRef.current?.contains(target);
      
      // Only close if clicked outside BOTH the list item AND dropdown
      if (!clickedInsideList && !clickedInsideDropdown) {
        if (isDotClicked) {
          setIsDotClicked(false);
        }
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    };

    // Add event listeners for both mouse and touch
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDotClicked, isMenuOpen]);

  return (
    <>
      <div 
        ref={listItemRef}
        className={`vn-list-clip ${fullWidth ? 'full-width' : ''} ${shouldShowHover ? 'hovered' : ''} ${isMenuOpen ? 'menu-open' : ''} ${isDeleting ? 'deleting' : ''} ${className} ${styles.container}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onClick?.(id)}
      >
        {/* Main Content Area */}
        <div className="list-clip">
          {/* Header with title */}
          <div className="vn-list-clip-header">
            <span className={`header-text ${styles.InterMedium18}`}>
              {title}
            </span>
          </div>
          
          {/* Subheader with date and status */}
          <div className="vn-list-clip-subheader">
            <span className={`date-text ${styles.InterRegular13}`}>
              {date}
            </span>
            
            {/* Status Frame - DRY principle: Reusable component for all status types */}
            {status === 'pending' && (
              <div className="status-frame">
                <div className="status-icon-wrapper">
                  <PendingIcon />
                </div>
                <span className={`status-text ${styles.InterRegular13}`}>
                  Waiting to transcribe
                </span>
              </div>
            )}
            
            {status === 'transcribing' && (
              <div className="status-frame transcribing">
                <div className="status-icon-wrapper spinning-wrapper">
                  {/* Inline SVG - NOT a separate component, so styled-jsx can reach it */}
                  <svg 
                    className="pending-icon spinning-icon"
                    width="12" 
                    height="12" 
                    viewBox="0 0 12 12" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M5.05613 7.88726H2.69677V10.2466M6.94361 4.11229H9.30297V1.75293M2.5 4.58565C2.76457 3.93081 3.20754 3.36333 3.77856 2.9477C4.34957 2.53207 5.02593 2.28497 5.73039 2.23448C6.43485 2.18398 7.13924 2.33211 7.7637 2.66204C8.38816 2.99198 8.90723 3.49049 9.2625 4.1009M9.5 7.41389C9.23543 8.06873 8.79246 8.63621 8.22144 9.05184C7.65043 9.46747 6.97436 9.71458 6.2699 9.76508C5.56545 9.81558 4.8608 9.66743 4.23634 9.33749C3.61188 9.00756 3.09258 8.50907 2.73732 7.89867" 
                      stroke="white" 
                      strokeOpacity="0.4" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className={`status-text ${styles.InterRegular13}`}>
                  Transcribing...
                </span>
              </div>
            )}
            
            {/* status === null: No status frame shown (transcription completed) */}
          </div>
        </div>
        
        {/* Dot Menu Area */}
        <div 
          ref={listDotRef}
          className={`list-dot ${isDotClicked ? 'clicked' : ''}`}
          onMouseEnter={handleDotMouseEnter}
          onMouseLeave={handleDotMouseLeave}
          onClick={handleDotMenuClick}
        >
          <div ref={dotMenuRef} className="dot-menu">
            <DotMenuIcon isHovered={shouldShowHover} isClicked={isDotClicked} />
          </div>
        </div>
      </div>
      
      {/* Dropdown Menu Portal - renders to context container or document.body */}
      {isMounted && isMenuOpen && portalContainer && createPortal(
        <div 
          ref={dropdownRef}
          className={`dropdown-menu-container ${isMenuAnimating ? 'animating' : ''} ${menuPlacedAbove ? 'placed-above' : 'placed-below'}`}
          style={{
            position: isContainedPortal ? 'absolute' : 'fixed',
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            left: menuPosition.left,
            right: menuPosition.right,
            zIndex: 1000
          }}
        >
          <OptionsDropDown 
            onRenameClick={() => {
              // Close menu first
              setIsMenuAnimating(false);
              setTimeout(() => setIsMenuOpen(false), 150);
              // Call external handler with id and current title
              onRename?.(id, title);
            }}
            onCopyClick={() => {
              // Close menu first
              setIsMenuAnimating(false);
              setTimeout(() => setIsMenuOpen(false), 150);
              // Call external handler
              onCopy?.(id);
            }}
            onDeleteClick={() => {
              // Close menu first
              setIsMenuAnimating(false);
              setTimeout(() => setIsMenuOpen(false), 150);
              // Call external handler
              onDelete?.(id);
            }}
            showCopyText={status === null}  // Only show copy when transcription is complete
          />
        </div>,
        portalContainer
      )}
      
      <style jsx>{`
        /* ============================================
           MAIN CONTAINER - VN_List_Clip
           ============================================ */
        
        .vn-list-clip {
          /* Layout */
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 8px 0px 8px 10px;
          
          /* Dimensions - Default: Fixed 361px (for showcase) */
          width: 361px;
          height: 56px;
          min-height: 56px;
          
          /* Styling */
          border-radius: 8px;
          cursor: pointer;  /* Clickable - navigates to clip */
          
          /* Transition for smooth hover (background only - padding changes instantly) */
          transition: background 0.15s ease;
          
          /* Inside auto layout */
          flex: none;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* Full-width mode: Responsive, fills parent container */
        .vn-list-clip.full-width {
          width: 100%;
          box-sizing: border-box;
        }
        
        /* Desktop: Add right padding when dots are hidden (default state) */
        @media (min-width: 769px) {
          .vn-list-clip {
            padding-right: 10px;  /* Matches left padding for symmetry */
          }
          
          /* Remove right padding when dots are visible (hover or menu open) */
          .vn-list-clip:hover,
          .vn-list-clip.menu-open {
            padding-right: 0px;  /* list-dot provides its own padding */
          }
        }
        
        /* Hover state - adds background color */
        .vn-list-clip.hovered {
          background: var(--ClipGrey); /* #252525 */
        }
        
        /* ============================================
           DELETE ANIMATION - Fade out when being deleted
           Smooth slide-up: height collapse starts when opacity is ~50%
           Similar to search bar → VNList slide animation
           ============================================ */
        
        .vn-list-clip.deleting {
          /* Fade out */
          opacity: 0;
          
          /* Collapse height (slide-up effect for items below) */
          height: 0;
          min-height: 0;
          padding-top: 0;
          padding-bottom: 0;
          margin-bottom: -12px;  /* Compensate for parent gap */
          overflow: hidden;
          
          /* Staggered timing:
             - Opacity: starts immediately, 400ms duration
             - Height/padding: starts at 200ms (opacity ~50%), 300ms duration
             This creates natural overlap - slide-up begins before fade completes */
          transition: 
            opacity 400ms ease-out,
            height 300ms ease-out 200ms,
            min-height 300ms ease-out 200ms,
            padding-top 300ms ease-out 200ms,
            padding-bottom 300ms ease-out 200ms,
            margin-bottom 300ms ease-out 200ms;
          
          pointer-events: none;  /* Prevent interaction during deletion */
        }
        
        /* ============================================
           CONTENT AREA - List_Clip
           ============================================ */
        
        .list-clip {
          /* Layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 2px;
          
          /* Dimensions - CHANGED: Flexible width to fill space when dots hidden */
          flex: 1;           /* Grows to fill available space */
          min-width: 0;      /* Allows flex item to shrink below content size */
          height: 40px;
          
          /* Inside auto layout */
          order: 0;
        }
        
        /* ============================================
           HEADER - VN_List_Clip_Header
           ============================================ */
        
        .vn-list-clip-header {
          /* Layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 8px;
          
          /* Dimensions - CHANGED: Flexible to fill parent */
          width: 100%;       /* Fills parent (list-clip) width */
          height: 22px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
        }
        
        .header-text {
          /* Dimensions - Fills available header width */
          width: 100%;
          height: 22px;
          
          /* Typography - InterMedium18 from styles */
          color: var(--ClipWhite); /* #FFFFFF */
          
          /* Truncate long text with ellipsis */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* ============================================
           SUBHEADER - VN_List_Clip_SubHeader
           ============================================ */
        
        .vn-list-clip-subheader {
          /* Layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 16px;
          
          /* Dimensions - CHANGED: Flexible to fill parent */
          width: 100%;       /* Fills parent (list-clip) width */
          height: 16px;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          align-self: stretch;
        }
        
        .date-text {
          /* Dimensions - auto width to fit content */
          height: 16px;
          
          /* Typography - InterRegular13 from styles */
          color: var(--RecWhite_40); /* rgba(255, 255, 255, 0.4) */
          
          /* Prevent text wrapping */
          white-space: nowrap;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* ============================================
           STATUS FRAME - DRY principle: Single component for all status types
           Supports: pending, transcribing, null (no status)
           ============================================ */
        
        .status-frame {
          /* Layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 4px;
          
          /* Dimensions - flexible to fit content */
          height: 16px;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .status-icon-wrapper {
          /* Dimensions */
          width: 12px;
          height: 12px;
          
          /* Layout */
          display: flex;
          align-items: center;
          justify-content: center;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* ============================================
           ROTATION ANIMATION - EXACT copy from SubPendingIconSpinning
           ============================================ */
        
        /* Rotation animation keyframes */
        @keyframes rotate-pending {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Spinner wrapper - contains and rotates the icon */
        .spinning-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 12px;
          height: 12px;
        }
        
        /* Apply rotation animation to the SVG icon */
        .spinning-icon {
          animation: rotate-pending 1.5s linear infinite;
          transform-origin: center center;
        }
        
        .pending-icon {
          width: 12px;
          height: 12px;
        }
        
        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .spinning-icon {
            animation: none;
          }
        }
        
        .status-text {
          /* Typography - InterRegular13 from styles */
          color: var(--RecWhite_40); /* rgba(255, 255, 255, 0.4) */
          
          /* Layout */
          display: flex;
          align-items: center;
          height: 16px;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* ============================================
           DOT MENU AREA - List_Dot
           ============================================ */
        
        .list-dot {
          /* Layout */
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px 10px 0px 0px;
          gap: 10px;
          
          /* Dimensions */
          width: 34px;
          height: 40px;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
          
          /* Desktop: Hidden by default (removed from layout, not just invisible) */
          display: none;
        }
        
        /* Desktop: Show dot menu on hover */
        .vn-list-clip:hover .list-dot,
        .vn-list-clip .list-dot:hover {
          display: flex;
        }
        
        /* Desktop: Keep dot menu visible when dropdown is open */
        .vn-list-clip.menu-open .list-dot {
          display: flex;
        }
        
        /* Mobile: Always visible */
        @media (max-width: 768px) {
          .list-dot {
            display: flex !important;  /* Override desktop hiding */
          }
        }
        
        .dot-menu {
          /* Layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 3px;
          
          /* Dimensions */
          width: 24px;
          height: 24px;
          
          /* Cursor */
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* ============================================
           DOT MENU SVG STATES
           ============================================ */
        
        /* Desktop default: Invisible (opacity: 0) */
        .vn-list-clip :global(.dot-circle) {
          fill-opacity: 0;
          transition: fill-opacity 0.15s ease;
        }
        
        /* Desktop-only hover rules to prevent sticky hover on mobile */
        @media (min-width: 769px) {
          /* Desktop hover over main content: Visible (opacity: 1) */
          .vn-list-clip.hovered :global(.dot-circle) {
            fill-opacity: 1;
          }
          
          /* Desktop hover over list-dot area: Visible (opacity: 1) */
          .vn-list-clip .list-dot:hover :global(.dot-circle) {
            fill-opacity: 1;
          }
          
          /* Desktop menu open: Keep dots visible (opacity: 1) */
          .vn-list-clip.menu-open :global(.dot-circle) {
            fill-opacity: 1;
          }
        }
        
        /* Mobile default: 20% opacity */
        @media (max-width: 768px) {
          .vn-list-clip :global(.dot-circle) {
            fill-opacity: 0.2;
          }
          
          /* Mobile click: 100% opacity - Toggles when list-dot is clicked */
          .vn-list-clip .list-dot.clicked :global(.dot-circle) {
            fill-opacity: 1;
          }
        }
        
        /* ============================================
           DROPDOWN MENU ANIMATION (Portal)
           Fade + Slide - Contextual direction
           ============================================ */
        
        /* Accessibility: Respect user motion preferences */
        @media (prefers-reduced-motion: reduce) {
          :global(.dropdown-menu-container) {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
        
        /* Initial state - PLACED BELOW (slides down into view) */
        :global(.dropdown-menu-container.placed-below) {
          opacity: 0;
          transform: translateY(-6px); /* Start above, slide down */
          
          /* Exit animation: Fast fade + slide back up */
          transition: 
            opacity 150ms cubic-bezier(0.4, 0, 1, 1),
            transform 150ms cubic-bezier(0.4, 0, 1, 1);
        }
        
        :global(.dropdown-menu-container.placed-below.animating) {
          opacity: 1;
          transform: translateY(0); /* Settle into position */
          
          /* Enter animation: Smooth fade + slide down */
          transition: 
            opacity 200ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* Initial state - PLACED ABOVE (slides up into view) */
        :global(.dropdown-menu-container.placed-above) {
          opacity: 0;
          transform: translateY(6px); /* Start below, slide up */
          
          /* Exit animation: Fast fade + slide back down */
          transition: 
            opacity 150ms cubic-bezier(0.4, 0, 1, 1),
            transform 150ms cubic-bezier(0.4, 0, 1, 1);
        }
        
        :global(.dropdown-menu-container.placed-above.animating) {
          opacity: 1;
          transform: translateY(0); /* Settle into position */
          
          /* Enter animation: Smooth fade + slide up */
          transition: 
            opacity 200ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
};

// Create a named object for default export
const clipList = {
  ClipListItem
};

export default clipList;

