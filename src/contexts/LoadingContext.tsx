import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

// Define the sections we want to track
export type SectionName = 'MainNavBar' | 'HeroBanner' | 'ProjectBody' | 'CompletedBuildBody' | 'HowItWorks_Body' | 'Goal_Body';

// Record of which sections are loaded
export type SectionsLoadedState = Partial<Record<SectionName, boolean>>;

// Context interface
interface LoadingContextType {
  // State
  isLoading: boolean;
  progress: number;
  sectionsLoaded: SectionsLoadedState;
  
  // Actions
  setIsLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;
  setSectionLoaded: (section: SectionName, loaded: boolean) => void;
}

// Default context values
const defaultContext: LoadingContextType = {
  isLoading: true,
  progress: 0,
  sectionsLoaded: {},
  setIsLoading: () => {},
  setProgress: () => {},
  setSectionLoaded: () => {}
};

// Create the context
const LoadingContext = createContext<LoadingContextType>(defaultContext);

// Custom hook for using the loading context
export const useLoading = () => {
  const context = useContext(LoadingContext);
  
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
  minLoadTimeMs?: number; // Minimum loading time in milliseconds
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ 
  children,
  minLoadTimeMs = 2000 // Increased minimum loading time to 2 seconds
}) => {
  // Core state
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [sectionsLoaded, setSectionsLoaded] = useState<SectionsLoadedState>({});
  const [loadStartTime] = useState<number>(Date.now());
  
  // Track all sections we need to load
  const allSections: SectionName[] = useMemo(() => [
    'MainNavBar',
    'HeroBanner', 
    'ProjectBody',
    'CompletedBuildBody', 
    'HowItWorks_Body'
    // 'Goal_Body' - temporarily removed
  ], []);
  
  // Memoized function to handle section loading updates
  const setSectionLoaded = useCallback((section: SectionName, loaded: boolean) => {
    setSectionsLoaded(prev => ({
      ...prev,
      [section]: loaded
    }));
  }, []);
  
  // Calculate progress and determine when loading is complete
  useEffect(() => {
    // Count loaded sections
    const loadedSections = allSections.filter(section => sectionsLoaded[section]).length;
    
    // Calculate new progress as a percentage
    const newProgress = Math.min(
      Math.round((loadedSections / allSections.length) * 100), 
      100
    );
    
    // Add some artificial progress if nothing is loaded yet
    const artificialMinProgress = isLoading ? 5 : 0;
    
    // Slower initial progress to give time for the viewport to stabilize
    let displayProgress = Math.max(newProgress, artificialMinProgress);
    
    // Slow down progress to give user time to perceive it
    if (displayProgress > 0 && displayProgress < 30) {
      // Slow down early progress
      displayProgress = Math.min(displayProgress, 25);
    } else if (displayProgress >= 30 && displayProgress < 70) {
      // Regular progress in the middle range
      displayProgress = Math.min(displayProgress, newProgress);
    } else if (displayProgress >= 70 && displayProgress < 100) {
      // Slow down completion progress
      const slowProgress = 70 + ((displayProgress - 70) * 0.7);
      displayProgress = Math.min(slowProgress, 95);
    }
    
    // Update progress
    setProgress(displayProgress);
    
    // Check if all sections are loaded
    const allLoaded = allSections.every(section => sectionsLoaded[section]);
    
    if (allLoaded && isLoading) {
      // Ensure we've met the minimum loading time
      const currentTime = Date.now();
      const timeElapsed = currentTime - loadStartTime;
      
      if (timeElapsed >= minLoadTimeMs) {
        // Complete immediately if minimum time is met
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
        }, 600); // Longer delay for visual transition
      } else {
        // Set a timeout to complete after minimum time
        const remainingTime = minLoadTimeMs - timeElapsed;
        
        // Only go to 95% until we're ready to complete
        setProgress(95);
        
        const timer = setTimeout(() => {
          setProgress(100);
          setTimeout(() => {
            setIsLoading(false);
          }, 600); // Longer delay for visual transition
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [sectionsLoaded, allSections, isLoading, loadStartTime, minLoadTimeMs]);
  
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    isLoading,
    progress,
    sectionsLoaded,
    setIsLoading,
    setProgress,
    setSectionLoaded
  }), [isLoading, progress, sectionsLoaded, setSectionLoaded]);
  
  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}; 