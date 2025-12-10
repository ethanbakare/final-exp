import React, { createContext, useContext } from 'react';

// PortalContainerContext
// Provides a container element for portals (dropdowns, modals, etc.)
// This allows dropdowns to be contained within screen components like ClipMainScreen
// rather than escaping to document.body

/* ============================================
   CONTEXT
   ============================================ */

// Context for portal container - defaults to null (will use document.body as fallback)
const PortalContainerContext = createContext<HTMLElement | null>(null);

/* ============================================
   HOOK
   ============================================ */

// Hook for consuming components (ClipListItem, ClipOffline, etc.)
export const usePortalContainer = (): HTMLElement | null => {
  const container = useContext(PortalContainerContext);
  
  // Fallback to document.body if no provider exists (standalone usage in showcases)
  if (container) {
    return container;
  }
  
  // SSR safety check
  if (typeof document !== 'undefined') {
    return document.body;
  }
  
  return null;
};

/* ============================================
   PROVIDER
   ============================================ */

// Provider component - used by screen components (ClipMainScreen, etc.)
export const PortalContainerProvider = PortalContainerContext.Provider;

// Export context for advanced usage
export default PortalContainerContext;

