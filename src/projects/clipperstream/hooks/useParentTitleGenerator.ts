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
 */

import { useEffect } from 'react';
import { useClipStore } from '../store/clipStore';

interface UseParentTitleGeneratorProps {
  generateTitleInBackground: (clipId: string, rawText: string) => Promise<void>;
}

export const useParentTitleGenerator = ({
  generateTitleInBackground
}: UseParentTitleGeneratorProps) => {
  const clips = useClipStore((state) => state.clips);

  useEffect(() => {
    // Find parents with all children completed
    const parents = clips.filter(c => !c.parentId);

    for (const parent of parents) {
      // Skip if already has AI title (not "Recording XX")
      if (!parent.title.startsWith('Recording ')) continue;

      // Get children
      const children = clips.filter(c => c.parentId === parent.id);
      if (children.length === 0) continue;

      // Check if all children complete (formatted and no longer pending)
      const allComplete = children.every(c => c.status === null && c.formattedText);

      if (allComplete && children.length > 0) {
        // Generate title from first child's content
        const firstChild = children[0];
        if (firstChild.rawText) {
          // Fire and forget - don't await
          generateTitleInBackground(parent.id, firstChild.rawText).catch(err => {
            console.error('Failed to generate parent title:', err);
          });
        }
      }
    }
  }, [clips, generateTitleInBackground]); // Re-run when clips change
};

