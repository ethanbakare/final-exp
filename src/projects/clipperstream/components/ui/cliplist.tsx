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
  status?: 'pending' | 'transcribing' | 'retry-pending' | 'vpn-blocked' | 'audio-corrupted' | null; // Default: null (completed, no status shown)
  isActiveRequest?: boolean;                // Controls icon spinning (default: false) - Only applies when status='transcribing'
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

const DotMenuIcon: React.FC<DotMenuIconProps> = ({ /* isHovered, isClicked */ }) => {
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
  isActiveRequest = false,  // NEW: Default to false (icon static)
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

    const position: { top?: number; bottom?: number; left?: number; right?: number } = {};

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

            {status === 'retry-pending' && (
              <div className="status-frame retry-pending">
                <div className="status-icon-wrapper">
                  {/* Static icon - waiting between automatic retry attempts */}
                  <svg
                    className="pending-icon"
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
                  Retrying soon...
                </span>
              </div>
            )}

            {status === 'transcribing' && (
              <div className="status-frame transcribing">
                <div className={`status-icon-wrapper ${status === 'transcribing' ? 'spinning-wrapper' : ''}`}>
                  {/* Inline SVG - NOT a separate component, so styled-jsx can reach it */}
                  <svg
                    className={`pending-icon ${status === 'transcribing' ? 'spinning-icon' : ''}`}
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

            {status === 'vpn-blocked' && (
              <div className="status-frame vpn-blocked">
                <div className="status-icon-wrapper">
                  {/* Static pending icon with orange color */}
                  <svg
                    className="vpn-blocked-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.05613 7.88726H2.69677V10.2466M6.94361 4.11229H9.30297V1.75293M2.5 4.58565C2.76457 3.93081 3.20754 3.36333 3.77856 2.9477C4.34957 2.53207 5.02593 2.28497 5.73039 2.23448C6.43485 2.18398 7.13924 2.33211 7.7637 2.66204C8.38816 2.99198 8.90723 3.49049 9.2625 4.1009M9.5 7.41389C9.23543 8.06873 8.79246 8.63621 8.22144 9.05184C7.65043 9.46747 6.97436 9.71458 6.2699 9.76508C5.56545 9.81558 4.8608 9.66743 4.23634 9.33749C3.61188 9.00756 3.09258 8.50907 2.73732 7.89867"
                      stroke="var(--ClipOfflineOrange_60)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className={`status-text-vpn ${styles.InterRegular13}`}>
                  Blocked by VPN
                </span>
              </div>
            )}

            {status === 'audio-corrupted' && (
              <div className="status-frame audio-corrupted">
                <div className="status-icon-wrapper">
                  {/* Red caution/warning icon - uses currentColor for 60% opacity red */}
                  <svg
                    className="audio-corrupted-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M6 4.5V6.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M2.18913 7.60006L2.52688 7.79506L2.18913 7.60006ZM4.61399 3.40005L4.27624 3.20505L4.27624 3.20505L4.61399 3.40005ZM7.38539 3.40005L7.72314 3.20505L7.72314 3.20505L7.38539 3.40005ZM9.81025 7.60006L10.148 7.40506L10.148 7.40506L9.81025 7.60006ZM5.59284 2.08645L5.75147 2.44274L5.75147 2.44274L5.59284 2.08645ZM6.40641 2.08645L6.24779 2.44274L6.24779 2.44274L6.40641 2.08645ZM1.94792 9.80907L1.71868 10.1245L1.71868 10.1245L1.94792 9.80907ZM1.54108 9.10454L1.92895 9.06371L1.54108 9.10454ZM10.0515 9.80907L10.2807 10.1245L10.2807 10.1245L10.0515 9.80907ZM10.4583 9.10454L10.8462 9.14537L10.8462 9.14537L10.4583 9.10454ZM6.02458 8H6.41458C6.41458 7.78133 6.2433 7.61 6.02458 7.61V8ZM6.02458 8.05L6.02448 8.44C6.12793 8.44007 6.22716 8.39898 6.29698 8.32584C6.3668 8.2527 6.40458 8.15345 6.41458 8.05H6.02458ZM5.97477 8.05H5.58477C5.58477 8.26873 5.75599 8.43993 5.97467 8.44L5.97477 8.05ZM5.97477 8V7.61C5.75605 7.61 5.58477 7.78131 5.58477 8H5.97477ZM6.38968 4.5C6.38968 4.28131 6.239 4.10336 6.039 4.10336C5.839 4.10336 5.68968 4.28131 5.68968 4.5H6.039H6.38968ZM5.68968 6.5C5.68968 6.71873 5.839 6.89668 6.039 6.89668C6.239 6.89668 6.38968 6.71873 6.38968 6.5H6.039H5.68968ZM8.42459 10V9.61H3.57488V10V10.39H8.42459V10ZM2.18913 7.60006L2.52688 7.79506L4.95174 3.60505L4.61399 3.40005L4.27624 3.20505L1.85137 7.39506L2.18913 7.60006ZM7.38539 3.40005L7.04764 3.60505L9.47251 7.79506L9.81025 7.60006L10.148 7.40506L7.72314 3.20505L7.38539 3.40005ZM4.61399 3.40005L4.95174 3.60505C5.18296 3.19458 5.34317 2.91784 5.48117 2.72248C5.62034 2.52546 5.70123 2.46511 5.75147 2.44274L5.59284 2.08645L5.43421 1.73017C5.18762 1.83996 5.00644 2.04261 4.84409 2.27245C4.68055 2.50396 4.49975 2.81793 4.27624 3.20505L4.61399 3.40005ZM7.38539 3.40005L7.72314 3.20505C7.49963 2.81793 7.31881 2.50393 7.15526 2.27241C6.99291 2.04256 6.81173 1.83994 6.56504 1.73017L6.40641 2.08645L6.24779 2.44274C6.29806 2.46512 6.37899 2.52551 6.51819 2.72252C6.65621 2.9178 6.81648 3.19461 7.04764 3.60505L7.38539 3.40005ZM5.59284 2.08645L5.75147 2.44274C5.90939 2.37242 6.08986 2.37242 6.24779 2.44274L6.40641 2.08645L6.56504 1.73017C6.20516 1.56994 5.79409 1.56994 5.43421 1.73017L5.59284 2.08645ZM3.57488 10V9.61C3.1125 9.61 2.79271 9.60968 2.5545 9.58778C2.31439 9.56573 2.22167 9.52587 2.17716 9.49353L1.94792 9.80907L1.71868 10.1245C1.93703 10.2832 2.20307 10.3388 2.48331 10.3645C2.76555 10.3904 3.12785 10.39 3.57488 10.39V10ZM2.18913 7.60006L1.85137 7.39506C1.62786 7.79221 1.44639 8.10576 1.32769 8.36313C1.21051 8.61867 1.12501 8.87687 1.15322 9.14526L1.54108 9.10454L1.92895 9.06371C1.92319 9.00903 1.93502 8.90881 2.03601 8.69011C2.13615 8.47325 2.29568 8.19552 2.52688 7.79506L2.18913 7.60006ZM1.94792 9.80907L2.17716 9.49353C2.03724 9.39186 1.94701 9.23559 1.92895 9.06371L1.54108 9.10454L1.15322 9.14526C1.19439 9.53712 1.40004 9.89306 1.71868 10.1245L1.94792 9.80907ZM8.42459 10V10.39C8.87163 10.39 9.23392 10.3904 9.51614 10.3645C9.79638 10.3388 10.0624 10.2832 10.2807 10.1245L10.0515 9.80907L9.82227 9.49353C9.77776 9.52587 9.68504 9.56573 9.44493 9.58778C9.20673 9.60968 8.88693 9.61 8.42459 9.61V10ZM9.81025 7.60006L9.47251 7.79506C9.70371 8.19552 9.86324 8.47325 9.96338 8.69011C10.0644 8.90881 10.0762 9.00903 10.0704 9.06371L10.4583 9.10454L10.8462 9.14537C10.8744 8.87687 10.7889 8.61867 10.6717 8.36313C10.553 8.10576 10.3715 7.79221 10.148 7.39506L9.81025 7.60006ZM10.0515 9.80907L10.2807 10.1245C10.5994 9.89306 10.805 9.53712 10.8462 9.14537L10.4583 9.10454L10.0704 9.06371C10.0524 9.23559 9.96214 9.39186 9.82227 9.49353L10.0515 9.80907ZM6.02458 8H5.63458V8.05H6.02458H6.41458V8H6.02458ZM6.02458 8.05L6.02467 7.66L5.97487 7.66L5.97477 8.05L5.97467 8.44L6.02448 8.44L6.02458 8.05ZM5.97477 8.05H6.36477V8H5.97477H5.58477V8.05H5.97477ZM5.97477 8V8.39H6.02458V8V7.61H5.97477V8ZM6.039 4.5H5.68968V6.5H6.039H6.38968V4.5H6.039Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <span className={`status-text-audio-corrupted ${styles.InterRegular13}`}>
                  Audio corrupted
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
          
          /* Smooth title fade transition (for AI-generated titles) */
          transition: opacity 0.3s ease-in-out;
          
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
        
        /* VPN Blocked status text - orange 60% opacity */
        .status-text-vpn {
          /* Typography - InterRegular13 from styles */
          color: var(--ClipOfflineOrange_60); /* rgba(251, 114, 50, 0.6) */
          
          /* Layout */
          display: flex;
          align-items: center;
          height: 16px;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* VPN Blocked icon styling */
        .vpn-blocked-icon {
          width: 12px;
          height: 12px;
        }
        
        /* Status text for audio-corrupted state - red color */
        .status-text-audio-corrupted {
          /* Typography - InterRegular13 from styles */
          color: var(--RecRed_60); /* Red color at 60% opacity for corrupted audio warning */
          
          /* Layout */
          display: flex;
          justify-content: center;
          align-items: center;
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* Audio corrupted icon sizing and color */
        .audio-corrupted-icon {
          width: 12px;
          height: 12px;
          color: var(--RecRed_60); /* SVG uses currentColor for 60% opacity red */
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

