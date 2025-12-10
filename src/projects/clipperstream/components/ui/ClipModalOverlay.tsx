import React, { useEffect, useState } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

// ClipModalOverlay Component
// Reusable modal overlay with dark background, backdrop blur, and scale animation
// Industry standard: overlay appears instantly, modal content scales in (0.8 → 1)

/* ============================================
   INTERFACES
   ============================================ */

interface ClipModalOverlayProps {
  isVisible: boolean;
  onClose?: () => void;
  closeOnBackdropClick?: boolean;  // Default: true - click outside to dismiss
  children: React.ReactNode;
  className?: string;
}

/* ============================================
   CLIP MODAL OVERLAY COMPONENT
   ============================================ */

export const ClipModalOverlay: React.FC<ClipModalOverlayProps> = ({
  isVisible,
  onClose,
  closeOnBackdropClick = true,
  children,
  className = ''
}) => {
  // Animation state: controls the scale animation of modal content
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  
  // Handle animation on visibility change
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure overlay is rendered before animation starts
      const timer = requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setIsAnimatingIn(false);
    }
  }, [isVisible]);
  
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on backdrop, not on modal content
    if (e.target === e.currentTarget && closeOnBackdropClick && onClose) {
      onClose();
    }
  };
  
  // Handle ESC key to close
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible && onClose) {
        onClose();
      }
    };
    
    if (isVisible) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isVisible, onClose]);
  
  // Scroll lock: prevent background scrolling when modal is open
  useEffect(() => {
    if (isVisible) {
      // Save current overflow state
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isVisible]);
  
  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <>
      <div 
        className={`modal-overlay ${className} ${styles.container}`}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Content Container - handles the scale animation */}
        <div className={`modal-content-wrapper ${isAnimatingIn ? 'animate-in' : ''}`}>
          {children}
        </div>
      </div>
      
      <style jsx>{`
        /* ============================================
           MODAL OVERLAY - Dark backdrop with blur
           ============================================ */
        
        .modal-overlay {
          /* Positioning - covers entire parent container */
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          
          /* Centering */
          display: flex;
          justify-content: center;
          align-items: center;
          
          /* Dark semi-transparent background */
          background: var(--ClipBgBlackOverlay);
          
          /* Backdrop blur - Safari requires -webkit prefix */
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          
          /* Stacking */
          z-index: 1000;
          
          /* Prevent text selection on backdrop */
          user-select: none;
        }
        
        /* Firefox fallback: darker background if blur not supported */
        @supports not (backdrop-filter: blur(3px)) {
          .modal-overlay {
            background: rgba(0, 0, 0, 0.7);
          }
        }
        
        /* ============================================
           MODAL CONTENT WRAPPER - Scale animation
           ============================================ */
        
        .modal-content-wrapper {
          /* Initial state: slightly smaller */
          transform: scale(0.85);
          opacity: 0;
          
          /* Animation timing - smooth ease-out */
          transition: 
            transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 100ms ease-out;
        }
        
        /* Animated in state: full size */
        .modal-content-wrapper.animate-in {
          transform: scale(1);
          opacity: 1;
        }
        
        /* ============================================
           ACCESSIBILITY
           ============================================ */
        
        @media (prefers-reduced-motion: reduce) {
          .modal-content-wrapper {
            transition: none;
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

/* ============================================
   DEFAULT EXPORT
   ============================================ */

export default ClipModalOverlay;

