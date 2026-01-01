/**
 * useParentTitleGenerator.ts
 * 
 * PHASE 6 (v2.6.0): Auto-generate titles for parent recordings
 * 
 * PURPOSE:
 * - Automatically generates AI titles for parent clips when all children complete
 * - Listens to Zustand store changes (no manual calls needed)
 * - Works for both offline and online recordings
 * 
 * ARCHITECTURE:
 * - Subscribes to clips changes via Zustand
 * - Finds parents with placeholder titles ("Recording XX")
 * - Checks if all children are complete
 * - Triggers title generation using first child's content
 * 
 * FIX v2.6.1: Added deduplication to prevent infinite loop
 * - Uses useRef to track which parents already had titles generated
 * - Removes generateTitleInBackground from dependency array
 */

import { useEffect, useRef } from 'react';
import { useClipStore } from '../store/clipStore';

interface UseParentTitleGeneratorProps {
  generateTitleInBackground: (clipId: string, rawText: string) => Promise<void>;
}

export const useParentTitleGenerator = ({
  generateTitleInBackground
}: UseParentTitleGeneratorProps) => {
  const clips = useClipStore((state) => state.clips);
  const generatedTitles = useRef(new Set<string>());

  useEffect(() => {
    // v2.7.0: Trigger on parent content (children are deleted after merge)
    const parents = clips.filter(c => !c.parentId);

    for (const parent of parents) {
      // Skip if already has AI title
      if (!parent.title.startsWith('Recording ')) continue;

      // Prevent duplicate calls
      if (generatedTitles.current.has(parent.id)) continue;

      // Only generate if parent has content (from merged children)
      if (parent.content && parent.content.length > 0) {
        generatedTitles.current.add(parent.id);

        // Use parent's rawText for title generation
        generateTitleInBackground(parent.id, parent.rawText || parent.content).catch(err => {
          console.error('Failed to generate parent title:', err);
          generatedTitles.current.delete(parent.id);  // Allow retry on error
        });
      }
    }
  }, [clips, generateTitleInBackground]);
};
