import React, { useState } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { Search } from './search';

// ClipHomeHeader Component
// Header section for clips home page with title, account info, and search
// Supports iOS-style morphing when search is active

/* ============================================
   INTERFACES
   ============================================ */

interface ClipHomeHeaderProps {
  title?: string;           // Default: "Transcribed Clips"
  userInitial?: string;     // Default: "B"
  onAccountClick?: () => void;
  onSearch?: (query: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchCollapseAmount?: number; // Progressive collapse: 0 = expanded, 1 = fully collapsed (tied to scroll)
  onSearchActiveChange?: (isActive: boolean) => void; // Callback when search focus changes
  showSearch?: boolean;     // Whether to show search bar (default: true, false for empty state)
  className?: string;
}

/* ============================================
   CLIP HOME HEADER COMPONENT
   ============================================ */

export const ClipHomeHeader: React.FC<ClipHomeHeaderProps> = ({
  title = 'Transcribed Clips',
  userInitial = 'B',
  onAccountClick,
  onSearch,
  searchValue,
  onSearchChange,
  searchCollapseAmount = 0,
  onSearchActiveChange,
  showSearch = true,
  className = ''
}) => {
  // Track when search is actively focused (for header morphing)
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Handlers for search focus/blur
  const handleSearchFocus = () => {
    setIsSearchActive(true);
    onSearchActiveChange?.(true);
  };
  
  const handleSearchBlur = () => {
    setIsSearchActive(false);
    onSearchActiveChange?.(false);
  };
  
  // When search is active (focused), disable scroll-based collapse
  // User can't scroll-collapse something they're actively using
  const effectiveCollapseAmount = isSearchActive ? 0 : searchCollapseAmount;
  
  // iOS-style collapse calculations:
  // - Container height shrinks: 38px → 0px (clips content)
  // - Content stays 38px, slides up via translateY
  // - Opacity fades for smoothness
  const SEARCH_HEIGHT = 38;
  const wrapperHeight = SEARCH_HEIGHT * (1 - effectiveCollapseAmount);
  const wrapperOpacity = 1 - effectiveCollapseAmount;
  const contentTranslateY = -SEARCH_HEIGHT * effectiveCollapseAmount * 0.3; // Subtle slide-up effect

  return (
    <>
      <div className={`trans-header ${isSearchActive ? 'search-active' : ''} ${className} ${styles.container}`}>
        {/* Header Main - Title + Account Info (moves below search when active) */}
        <div className="trans-header-main">
          {/* Title Text */}
          <h1 className="transcribed-clips-title">
            {title}
          </h1>
          
          {/* Account Info */}
          <button 
            className="account-info"
            onClick={onAccountClick}
            aria-label="Account"
          >
            <div className="display-pic">
              <span className="user-initial">
                {userInitial}
              </span>
            </div>
          </button>
        </div>
        
        {/* Search Component - iOS-style collapse: container clips, content slides up */}
        {/* Hidden when showSearch is false (e.g., empty state with no clips) */}
        {showSearch && (
          <div 
            className="search-wrapper"
            style={{
              height: `${wrapperHeight}px`,
              opacity: wrapperOpacity,
            }}
          >
            {/* Inner content wrapper - stays 38px, slides up as container shrinks */}
            <div 
              className="search-content"
              style={{
                transform: `translateY(${contentTranslateY}px)`,
              }}
            >
              <Search 
                value={searchValue}
                onChange={onSearchChange}
                onSearch={onSearch}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="Search"
                fullWidth={true}
              />
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        /* ============================================
           TRANS HEADER - Main container
           iOS-style morphing: expands/compresses based on search state
           ============================================ */
        
        .trans-header {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 16px 0px 16px;  /* 40px top, 16px horizontal */
          gap: 10px;
          
          /* Positioning context for gradient pseudo-element */
          position: relative;
          
          width: 100%;  /* Full width - handles its own padding */
          max-width: 393px;  /* Desktop: Cap for showcase display */
          box-sizing: border-box;  /* Padding included in width */
          /* Height is dynamic - determined by content */
          
          /* Smooth transitions for iOS feel */
          transition: 
            gap 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* No overflow:hidden needed - height is determined by content,
             and search-wrapper has its own overflow:hidden for collapse */
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* Mobile: Full width, no cap - adapts to actual phone screen */
        @media (max-width: 768px) {
          .trans-header {
            max-width: none;
          }
        }
        
        /* Gradient overlay - follows header bottom edge automatically */
        .trans-header::after {
          content: '';
          position: absolute;
          bottom: -24px;  /* Positioned just below header - moves with it */
          left: 0;
          right: 10px;  /* Don't cover scrollbar area */
          height: 24px;
          
          /* Fade from solid background to transparent */
          background: linear-gradient(
            to bottom,
            var(--ClipBg) 0%,
            transparent 100%
          );
          
          pointer-events: none;  /* Don't block clicks */
          z-index: 1;  /* Low z-index - just above content, below scrollbar */
        }
        
        /* When search is active, compress header */
        .trans-header.search-active {
          gap: 0px;  /* No gap when only one element visible */
          padding-bottom: 8px;  /* Add breathing room below search when active */
        }
        
        /* ============================================
           TRANS HEADER MAIN - Title + Account Info row
           Shrinks when search is active (stays in position, no order swap)
           ============================================ */
        
        .trans-header-main {
          /* Box model */
          box-sizing: border-box;
          
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0px;
          gap: 0px;
          
          width: 100%;
          height: 46px;
          
          /* Transform origin for shrinking toward top-left */
          transform-origin: top left;
          
          /* Smooth transitions for morphing */
          transition: 
            transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* When search active, shrink in place (no position change) */
        .trans-header.search-active .trans-header-main {
          height: 0;  /* Shrink to nothing */
          transform: scale(0);  /* Shrink size */
          opacity: 0;  /* Fade out completely */
          overflow: hidden;
          pointer-events: none;  /* Can't interact when hidden */
        }
        
        /* ============================================
           TRANSCRIBED CLIPS TITLE
           ============================================ */
        
        .transcribed-clips-title {
          /* Reset default h1 styles */
          margin: 0;
          padding: 0;
          
          height: 46px;
          
          /* Typography */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: 32px;
          line-height: 143.75%;
          text-align: left;
          letter-spacing: -0.03em;
          white-space: nowrap;
          
          color: var(--ClipWhite);
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* ============================================
           ACCOUNT INFO - Button container
           ============================================ */
        
        .account-info {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          width: 32px;
          height: 32px;
          
          border-radius: 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .account-info:hover {
          opacity: 0.8;
        }
        
        /* ============================================
           DISPLAY PIC - Circular avatar with initial
           ============================================ */
        
        .display-pic {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4px;
          gap: 14px;
          
          width: 28px;
          height: 28px;
          
          background: var(--RecWhite_40);
          border-radius: 44.8px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* ============================================
           USER INITIAL - Letter inside avatar
           ============================================ */
        
        .user-initial {
          width: 9px;
          height: 16px;
          
          /* Typography */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: 13.2042px;
          line-height: 16px;
          
          color: var(--ClipWhite);
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* ============================================
           SEARCH WRAPPER - Container that clips content
           iOS-style: container shrinks, content stays same size
           ============================================ */
        
        .search-wrapper {
          width: 100%;
          /* Height and opacity controlled via inline styles */
          
          /* CRITICAL: Clips content from bottom as container shrinks */
          overflow: hidden;
          /* Match search bar's border radius so clipped edges look natural */
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* ============================================
           SEARCH CONTENT - Inner wrapper that slides up
           Stays fixed 38px height, never squashes
           ============================================ */
        
        .search-content {
          width: 100%;
          height: 38px;  /* FIXED - never changes, content doesn't squash */
          
          /* Transform controlled via inline style for slide-up effect */
        }
        
        /* ============================================
           ACCESSIBILITY
           ============================================ */
        
        /* Respect user motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .trans-header,
          .trans-header-main,
          .transcribed-clips-title,
          .search-wrapper {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
};

// Default export
export default ClipHomeHeader;

