import { useEffect, useState, DependencyList } from 'react';
import { useLoading, SectionName } from '@/contexts/LoadingContext';

/**
 * Hook to report section loading status to the LoadingContext
 * 
 * @param sectionName The name of the section that's loading
 * @param dependencies Array of values that indicate when the section is fully loaded
 * @returns Object with isLoaded state that can be used by the component
 */
export function useSectionLoading(sectionName: SectionName, dependencies: DependencyList = []) {
  const { setSectionLoaded } = useLoading();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Effect to report loading status to context when dependencies change
  useEffect(() => {
    // Don't mark as loaded immediately to allow for minimum display time
    const timer = setTimeout(() => {
      setIsLoaded(true);
      setSectionLoaded(sectionName, true);
    }, 300); // Small delay for visual feedback
    
    // Cleanup function to handle component unmount
    return () => {
      clearTimeout(timer);
      setSectionLoaded(sectionName, false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionName, setSectionLoaded, ...dependencies]);
  
  return { isLoaded };
}

/**
 * Simplified version for components that manage their own loading state
 */
export function useManualSectionLoading(sectionName: SectionName, isLoaded: boolean) {
  const { setSectionLoaded } = useLoading();
  
  useEffect(() => {
    if (isLoaded) {
      setSectionLoaded(sectionName, true);
    }
    
    return () => {
      setSectionLoaded(sectionName, false);
    };
  }, [sectionName, isLoaded, setSectionLoaded]);
  
  return { isLoaded };
} 