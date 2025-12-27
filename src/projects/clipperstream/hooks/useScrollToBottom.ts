import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for scroll-to-bottom functionality
 * Designed for cross-platform compatibility (Web now, React Native later)
 * 
 * @returns {object} Scroll state and controls
 * - scrollRef: Ref to attach to scrollable container
 * - isAtBottom: Boolean indicating if user is at bottom (within threshold)
 * - scrollToBottom: Function to smooth scroll to absolute bottom
 * - scrollToPosition: Function to scroll to specific position with options
 */

interface ScrollToPositionOptions {
  behavior?: 'auto' | 'smooth' | 'instant';
  duration?: number;
}

export function useScrollToBottom() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  
  // Threshold for "at bottom" detection (50px per PRD)
  const BOTTOM_THRESHOLD = 50;
  
  /**
   * Check if scrolled to bottom
   * isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold
   */
  const checkIfAtBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = element;
    const atBottom = scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD;
    
    setIsAtBottom(atBottom);
    return atBottom;
  }, []);
  
  /**
   * Scroll to absolute bottom with smooth animation
   */
  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    
    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth'
    });
  }, []);
  
  /**
   * Scroll to specific position with options
   * @param position - Target scroll position in pixels
   * @param options - Scroll behavior options
   */
  const scrollToPosition = useCallback((position: number, options: ScrollToPositionOptions = {}) => {
    const element = scrollRef.current;
    if (!element) return;
    
    const { behavior = 'smooth' } = options;
    
    element.scrollTo({
      top: position,
      behavior: behavior
    });
  }, []);
  
  /**
   * Reset scroll tracking state
   * Called when switching between clips to hide button initially
   */
  const resetScrollTracking = useCallback(() => {
    setHasUserScrolled(false);
  }, []);
  
  /**
   * Attach scroll event listener
   * Updates isAtBottom state and tracks user scroll activity
   */
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    
    // Check on mount
    checkIfAtBottom();
    
    // Listen to scroll events
    const handleScroll = () => {
      // Mark that user has scrolled (on any scroll action - up or down)
      setHasUserScrolled(true);
      
      // Check if at bottom
      checkIfAtBottom();
    };
    
    element.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [checkIfAtBottom]);
  
  /**
   * Re-check on resize (viewport height changes)
   */
  useEffect(() => {
    const handleResize = () => {
      checkIfAtBottom();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [checkIfAtBottom]);
  
  return {
    scrollRef,
    isAtBottom,
    hasUserScrolled,
    scrollToBottom,
    scrollToPosition,
    checkIfAtBottom,
    resetScrollTracking
  };
}

