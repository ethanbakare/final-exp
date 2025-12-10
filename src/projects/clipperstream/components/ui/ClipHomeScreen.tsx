import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { ClipHomeHeader } from './cliphomeheader';
import { ClipListItem } from './cliplist';
// RecordButton removed - RecordBar is now in ClipMasterScreen
import { PortalContainerProvider } from './PortalContainerContext';
import { NoClipsFrameIcon, EmptyClipFrameIcon } from './midClipButtons';
import { ClipModalOverlay } from './ClipModalOverlay';
import { ClipDeleteModalFull, ClipRenameModalFull } from './clipModal';
import { ToastNotification } from './ClipToast';

// ClipHomeScreen Component
// Home screen with iOS-style collapsing search header on scroll
// Contains: TransHeader (with collapse), VN_List (scrollable)
// RecordBar is in ClipMasterScreen (parent orchestrator)
// Supports: Empty state (A1), Search results (B1), No results (B2)
// Modals: Delete confirmation, Rename input

/* ============================================
   INTERFACES
   ============================================ */

export interface Clip {
  id: string;
  title: string;
  date: string;
  status: 'pending' | 'transcribing' | null;  // null = completed (no status shown)
  content?: string;  // Transcribed text (null if pending)
}

interface ClipHomeScreenProps {
  clips: Clip[];
  onClipClick?: (id: string) => void;          // Navigate to clip's record screen
  onRecordClick?: () => void;                   // Start new recording
  onSearchActiveChange?: (isActive: boolean) => void;  // Notify parent of search state (for RecordBar)
  className?: string;
}

/* ============================================
   CLIP HOME SCREEN COMPONENT
   ============================================ */

export const ClipHomeScreen: React.FC<ClipHomeScreenProps> = ({
  clips: initialClips,
  onClipClick,
  // onRecordClick, // Removed - not used yet
  onSearchActiveChange: externalSearchActiveChange,
  className = ''
}) => {
  // Local clips state for managing deletions (demo purposes)
  const [localClips, setLocalClips] = useState<Clip[]>(initialClips);
  
  // Search query for filtering clips
  const [searchQuery, setSearchQuery] = useState('');
  
  // Progressive collapse amount (0 = fully expanded, 1 = fully collapsed)
  // Directly tied to scroll position for smooth iOS-style behavior
  const [searchCollapseAmount, setSearchCollapseAmount] = useState(0);
  
  // Track when search is actively focused (for header morphing)
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Wrapper to update search state and notify parent
  const handleSearchActiveChange = useCallback((isActive: boolean) => {
    setIsSearchActive(isActive);
    externalSearchActiveChange?.(isActive);
  }, [externalSearchActiveChange]);
  
  // Modal state: which modal is currently shown
  const [activeModal, setActiveModal] = useState<'delete' | 'rename' | null>(null);
  
  // Currently selected clip (for modal context)
  const [selectedClip, setSelectedClip] = useState<{ id: string; title: string } | null>(null);
  
  // Clip being deleted (for fade-out animation)
  const [deletingClipId, setDeletingClipId] = useState<string | null>(null);
  
  // Rename input value
  const [renameValue, setRenameValue] = useState('');
  
  // Toast notification state
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  // Portal container for dropdowns to render into (contained within this screen)
  const portalContainerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  // Ref to scrollable list for programmatic scroll-to-top
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Sync local clips with props when they change
  useEffect(() => {
    setLocalClips(initialClips);
  }, [initialClips]);
  
  // Set portal container after mount (ref is null during first render)
  useEffect(() => {
    if (portalContainerRef.current) {
      setPortalContainer(portalContainerRef.current);
    }
  }, []);
  
  // Track previous search active state for detecting cancel
  const prevSearchActiveRef = useRef(isSearchActive);
  
  // Scroll to top when exiting search mode (Cancel pressed)
  // Industry standard: search is a temporary mode, exiting returns to "home" state
  useEffect(() => {
    const wasSearchActive = prevSearchActiveRef.current;
    
    // Detect transition from search active → inactive (Cancel pressed)
    if (wasSearchActive && !isSearchActive) {
      // Scroll list back to top
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      // Reset collapse state
      setSearchCollapseAmount(0);
      
      // Clear search query
      setSearchQuery('');
    }
    
    // Update ref for next render
    prevSearchActiveRef.current = isSearchActive;
  }, [isSearchActive]);
  
  // Header height constant for collapse calculation
  const SEARCH_HEIGHT = 38;  // Search bar height - collapse happens over this distance

  // Filter clips based on search query
  const filteredClips = localClips.filter(clip => 
    clip.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine which state we're in
  const hasClips = localClips.length > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;
  const hasResults = filteredClips.length > 0;
  
  // A1: No clips at all (empty state)
  const showEmptyState = !hasClips && !hasSearchQuery;
  
  // B2: Search active but no results found
  const showNoResultsState = hasSearchQuery && !hasResults;
  
  // Default/B1: Show clip list (either all clips or filtered results)
  const showClipList = hasResults;

  // Scroll handler - Progressive collapse tied directly to scroll position
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = event.currentTarget.scrollTop;
    
    // Calculate collapse progress for header: 0 at top, 1 when scrolled past search height
    // Clamped 0-1 for header's search-wrapper collapse
    const progress = Math.min(1, Math.max(0, currentScrollTop / SEARCH_HEIGHT));
    
    setSearchCollapseAmount(progress);
  }, [SEARCH_HEIGHT]);

  // Handle search changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle search submit
  const handleSearch = useCallback((query: string) => {
    console.log('Search submitted:', query);
  }, []);

  // ============================================
  // CLIP ACTION HANDLERS
  // ============================================

  // Open delete confirmation modal
  const handleDeleteClick = useCallback((clipId: string) => {
    const clip = localClips.find(c => c.id === clipId);
    if (clip) {
      setSelectedClip({ id: clip.id, title: clip.title });
      setActiveModal('delete');
    }
  }, [localClips]);

  // Confirm delete: animate out, then remove from list
  const handleConfirmDelete = useCallback(() => {
    if (!selectedClip) return;
    
    // Close modal first
    setActiveModal(null);
    
    // Start fade-out animation
    setDeletingClipId(selectedClip.id);
    
    // After animation completes (200ms), remove from list
    setTimeout(() => {
      setLocalClips(prev => prev.filter(c => c.id !== selectedClip.id));
      setDeletingClipId(null);
      setSelectedClip(null);
    }, 1000);  // Slightly longer than CSS animation (200ms) for smooth transition
  }, [selectedClip]);

  // Open rename modal with current title pre-filled
  const handleRenameClick = useCallback((clipId: string, currentTitle: string) => {
    setSelectedClip({ id: clipId, title: currentTitle });
    setRenameValue(currentTitle);  // Pre-fill with current title
    setActiveModal('rename');
  }, []);

  // Confirm rename: update clip title
  const handleConfirmRename = useCallback(() => {
    if (!selectedClip || !renameValue.trim()) return;
    
    // Update clip title in local state
    setLocalClips(prev => prev.map(clip => 
      clip.id === selectedClip.id 
        ? { ...clip, title: renameValue.trim() }
        : clip
    ));
    
    // Close modal and reset
    setActiveModal(null);
    setSelectedClip(null);
    setRenameValue('');
  }, [selectedClip, renameValue]);

  // Handle copy - copies transcribed text and shows toast
  const handleCopyClick = useCallback((clipId: string) => {
    const clip = localClips.find(c => c.id === clipId);
    if (clip?.content) {
      navigator.clipboard.writeText(clip.content);
      console.log('Copied to clipboard:', clip.content);
      // Show copy toast
      setShowCopyToast(true);
    }
  }, [localClips]);
  
  // Dismiss toast
  const handleDismissToast = useCallback(() => {
    setShowCopyToast(false);
  }, []);

  // Close modal without action
  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setSelectedClip(null);
    setRenameValue('');
  }, []);

  return (
    <>
      <div className={`main ${className} ${styles.container}`}>
        {/* Portal Container - Dropdowns render here, contained within this screen */}
        <div ref={portalContainerRef} className="portal-container" />
        
        <PortalContainerProvider value={portalContainer}>
          {/* Main Trans Body - Header + Scrollable List */}
          <div className="main-trans-body">
            {/* Fixed Header - gradient is built into ClipHomeHeader as ::after */}
            <div className="trans-header-fixed">
              <ClipHomeHeader 
                searchCollapseAmount={searchCollapseAmount}
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearch={handleSearch}
                onSearchActiveChange={handleSearchActiveChange}
                onAccountClick={() => console.log('Account clicked')}
                showSearch={hasClips}
              />
            </div>
            
            {/* List Container - scrollable with static padding for header */}
            <div 
              ref={scrollRef}
              className={`vn-list ${isSearchActive ? 'search-active' : ''}`}
              onScroll={handleScroll}
            >
              {/* A1: Empty State - No clips yet (no search bar, fixed header) */}
              {showEmptyState && (
                <div className="empty-state empty-state-no-search">
                  <NoClipsFrameIcon />
                  <div className="empty-state-text">
                    <span className={`empty-state-title ${styles.InterMedium18}`}>
                      No clips yet
                    </span>
                    <span className={`empty-state-subtitle ${styles.InterRegular13}`}>
                      Tap the record button to get started.
                    </span>
                  </div>
                </div>
              )}
              
              {/* B2: No Results State - Search with no matches (has search bar) */}
              {showNoResultsState && (
                <div className="empty-state">
                  <EmptyClipFrameIcon />
                  <div className="empty-state-text">
                    <span className={`empty-state-title ${styles.InterMedium18}`}>
                      No results found
                    </span>
                    <span className={`empty-state-subtitle ${styles.InterRegular13}`}>
                      Try searching with a different keyword
                    </span>
                  </div>
                </div>
              )}
              
              {/* Default/B1: Clip list items */}
              {showClipList && filteredClips.map((clip) => (
                <ClipListItem
                  key={clip.id}
                  id={clip.id}
                  title={clip.title}
                  date={clip.date}
                  status={clip.status}
                  fullWidth={true}  /* Responsive: fills VN_List container */
                  onClick={onClipClick}
                  onRename={handleRenameClick}
                  onCopy={handleCopyClick}
                  onDelete={handleDeleteClick}
                  isDeleting={deletingClipId === clip.id}
                />
              ))}
            </div>
          </div>
          
          {/* ============================================
             TOAST NOTIFICATION - Copy confirmation
             Slides down from top with fade animation
             ============================================ */}
          <ToastNotification
            isVisible={showCopyToast}
            onDismiss={handleDismissToast}
            type="copy"
          />
          
          {/* ============================================
             MODAL OVERLAYS - Delete and Rename
             Rendered inside portal container for containment
             ============================================ */}
          
          {/* Delete Confirmation Modal - Full width with vertical buttons */}
          <ClipModalOverlay
            isVisible={activeModal === 'delete'}
            onClose={handleCloseModal}
            closeOnBackdropClick={true}
          >
            <ClipDeleteModalFull
              onCancel={handleCloseModal}
              onDelete={handleConfirmDelete}
            />
          </ClipModalOverlay>
          
          {/* Rename Modal - Full width with vertical buttons */}
          <ClipModalOverlay
            isVisible={activeModal === 'rename'}
            onClose={handleCloseModal}
            closeOnBackdropClick={true}
          >
            <ClipRenameModalFull
              value={renameValue}
              onChange={setRenameValue}
              onCancel={handleCloseModal}
              onSave={handleConfirmRename}
            />
          </ClipModalOverlay>
        </PortalContainerProvider>
      </div>
      
      <style jsx>{`
        /* ============================================
           MAIN - Full screen container
           Desktop: Fixed 393px (simulating phone)
           Mobile: Full width (actual mobile usage)
           ============================================ */
        
        .main {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 0px;
          gap: 0px;
          
          position: relative;
          width: 393px;
          
          /* Flexible height - fills parent container */
          /* When standalone: parent sets 692px (852 - 160 RecordBar) */
          /* When in ClipMasterScreen: fills space above RecordBar */
          height: 100%;
          flex: 1;
          min-height: 0;  /* Allow shrinking */
          
          background: var(--ClipBg);  /* #1C1C1C */
          border-radius: 8px 8px 0 0;  /* Top corners only (RecordBar handles bottom) */
          
          /* Prevent expansion */
          overflow: hidden;
        }
        
        /* Mobile: Full width, no border radius */
        @media (max-width: 768px) {
          .main {
            width: 100%;
            border-radius: 0;
          }
        }
        
        /* ============================================
           PORTAL CONTAINER - Target for dropdown portals
           Dropdowns render here instead of document.body
           ============================================ */
        
        .portal-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;  /* Allow clicks through to content */
          z-index: 1000;  /* Above all content */
        }
        
        /* Enable pointer events on portaled content (dropdown menus)
           Must use :global() because portaled content is outside styled-jsx scope */
        .portal-container :global(*) {
          pointer-events: auto;
        }
        
        /* ============================================
           MAIN TRANS BODY - Header + List area
           ============================================ */
        
        .main-trans-body {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          
          position: relative;
          width: 393px;
          
          /* Fill available space (main - record bar) */
          flex: 1;
          min-height: 0;  /* Allow shrinking below content size */
          
          /* Inside auto layout */
          order: 0;
          align-self: stretch;
          
          /* Clip overflow from list */
          overflow: hidden;
        }
        
        /* Mobile: Full width */
        @media (max-width: 768px) {
          .main-trans-body {
            width: 100%;
          }
        }
        
        /* ============================================
           TRANS HEADER FIXED - Positioned at top
           ============================================ */
        
        .trans-header-fixed {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          
          background: var(--ClipBg);  /* Match background for solid appearance */
        }
        
        /* ============================================
           VN LIST - Scrollable list container
           Static padding-top for header space (simpler, no double-scroll)
           ============================================ */
        
        .vn-list {
          /* Layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          
          /* Full size */
          width: 100%;
          flex: 1;
          min-height: 0;
          
          /* SCROLLABLE */
          overflow-y: auto;
          overflow-x: hidden;
          
          /* Static padding - header space at top, content padding on sides/bottom */
          /* 144px = 40px top + 46px main + 10px gap + 38px search + 10px buffer */
          padding: 144px 16px 20px 16px;
          
          /* Box sizing */
          box-sizing: border-box;
          
          /* Smooth scroll on iOS */
          -webkit-overflow-scrolling: touch;
          
          /* Stacking */
          position: relative;
          z-index: 10;
        }
        
        /* When search is active, reduce top padding (header shrinks) */
        .vn-list.search-active {
          /* 86px = 40px top + 0px main + 0px gap + 38px search + 8px bottom */
          padding-top: 86px;
        }
        
        /* Custom scrollbar styling */
        .vn-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .vn-list::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .vn-list::-webkit-scrollbar-thumb {
          background: var(--RecWhite_20, rgba(255, 255, 255, 0.2));
          border-radius: 9999px;
        }
        
        .vn-list::-webkit-scrollbar-thumb:hover {
          background: var(--RecWhite_40, rgba(255, 255, 255, 0.4));
        }
        
        /* Firefox scrollbar */
        .vn-list {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        
        /* ============================================
           EMPTY STATE - Centered message with icon (A1, B2)
           ============================================ */
        
        .empty-state {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 12px;
          
          /* Fill available space */
          flex: 1;
          width: 100%;
          box-sizing: border-box;
          
          /* Inside auto layout */
          align-self: stretch;
        }
        
        /* A1: Empty state with NO search bar */
        .empty-state.empty-state-no-search {
          /* Offset for smaller header (no search bar) */
          margin-top: -58px;  /* 144 - 86 = 58px difference */
        }
        
        .empty-state-text {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 10px;
          gap: 4px;
          
          width: 100%;
          
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .empty-state-title {
          color: var(--ClipWhite);
          text-align: center;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .empty-state-subtitle {
          color: var(--RecWhite_40);
          text-align: center;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* ============================================
           NOTE: RecordBar has been moved to ClipMasterScreen
           This allows it to persist across screen transitions
           ============================================ */
      `}</style>
    </>
  );
};

// Default export
export default ClipHomeScreen;
