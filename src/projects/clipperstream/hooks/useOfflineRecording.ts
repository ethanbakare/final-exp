// useOfflineRecording.ts
// Handles offline recording parent-child creation and pending clip management
// Extracted from ClipMasterScreen.tsx Phase 2.5

import { useCallback } from 'react';
import { Clip } from '../store/clipStore';
import { getNextRecordingNumber } from '../services/clipStorage';
import { PendingClip } from '../components/ui/ClipRecordScreen';
import { logger } from '../utils/logger';

const log = logger.scope('useOfflineRecording');

export interface UseOfflineRecordingParams {
  // Callbacks to update parent component state
  setCurrentClipId: (id: string) => void;
  // v2.7.0: Removed setSelectedPendingClips, formatDuration, clipToPendingClip
  
  // Zustand store actions (v2.6.1)
  addClip: (clip: Clip) => void;
  getClips: () => Clip[];
}

export interface UseOfflineRecordingReturn {
  handleOfflineRecording: (params: {
    audioId: string;
    duration: number;
    currentClipId: string | null;
  }) => void;
}

export const useOfflineRecording = (params: UseOfflineRecordingParams): UseOfflineRecordingReturn => {
  const {
    setCurrentClipId,
    // v2.7.0: Removed setSelectedPendingClips, formatDuration, clipToPendingClip
    addClip,
    getClips
  } = params;

  // Helper: Format duration in seconds to "M:SS" format
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOfflineRecording = useCallback((recordingParams: {
    audioId: string;
    duration: number;
    currentClipId: string | null;
  }) => {
    const { audioId, duration, currentClipId } = recordingParams;

    log.info('Handling offline recording', { audioId, duration, currentClipId });

    // PHASE 2.3.1: Parent-child architecture for grouping multiple pending clips
    // Determine whether to create PARENT (new recording) or CHILD (successive clip)

    let shouldCreateParent = false;
    let parentClipForChild: Clip | undefined;

    if (!currentClipId) {
      // No context at all → create new parent
      shouldCreateParent = true;
      log.info('No currentClipId → creating parent');
    } else {
      // We have currentClipId → check clip status to determine parent vs child
      const currentClip = getClips().find(c => c.id === currentClipId);

      if (!currentClip) {
        // Clip doesn't exist (maybe deleted?) → create new parent
        shouldCreateParent = true;
        log.warn('currentClipId points to non-existent clip, creating new parent', {
          currentClipId
        });
      } else if (currentClip.status === null) {
        // Appending to completed/transcribed file (status=null) → create child
        // v2.4: Parent files have status=null (they're just containers)
        // When recording in a transcribed file OR in a parent container, create child
        shouldCreateParent = false;
        parentClipForChild = currentClip;
        log.info('Appending to transcribed/completed file', {
          parentId: currentClipId,
          parentStatus: currentClip.status
        });
      } else if (currentClip.status === 'pending-child') {
        // Parent is still pending → create child
        // If current is a child, find its parent
        const actualParent = currentClip.parentId
          ? getClips().find(c => c.id === currentClip.parentId)
          : currentClip;
        shouldCreateParent = false;
        parentClipForChild = actualParent || currentClip;
        log.info('Appending to pending file', {
          parentId: parentClipForChild.id,
          parentStatus: parentClipForChild.status
        });
      } else {
        // Unknown status → play it safe, create new parent
        shouldCreateParent = true;
        log.warn('Unknown clip status, creating new parent', {
          currentClipId,
          status: currentClip.status
        });
      }
    }

    let clipIdToUpdate: string;

    if (shouldCreateParent) {
      // v2.4: Create PARENT (container only) + FIRST CHILD (Clip 001) separately
      // Step 1: Create PARENT (container only)
      const nextNumber = getNextRecordingNumber(getClips() as any);
      
      const parentClip: Clip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: nextNumber,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: null,
        content: '',
        rawText: '',
        formattedText: '',
        currentView: 'formatted',
        createdAt: Date.now()
      };

      addClip(parentClip);

      log.info('Created PARENT container for offline recording', {
        parentId: parentClip.id,
        title: nextNumber
      });

      // Parent remains as-is (no audioId, no pendingClipTitle, status: null by default)
      // Parent is just a container for organizing children

      // Step 2: Create FIRST CHILD (Clip 001)
      const firstChildId = `clip-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Manually create child clip object (DON'T use createClip to avoid new recording number)
      const now = new Date();
      const firstChild: Clip = {
        id: firstChildId,
        title: parentClip.title,            // Inherit parent's title "Recording 01"
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'pending-child',            // Child status (filtered from home)
        content: '',                        // No content yet (pending transcription)
        rawText: '',                        // Empty until transcribed
        formattedText: '',                  // Empty until formatted
        pendingClipTitle: 'Clip 001',       // First pending clip
        audioId: audioId,                   // Link to IndexedDB audio
        duration: formatDuration(duration), // Recording duration
        parentId: parentClip.id,            // Link to parent
        currentView: 'formatted',
        createdAt: Date.now()
      };

      // Save child to Zustand
      addClip(firstChild);

      log.info('Created FIRST CHILD for offline recording', {
        childId: firstChild.id,
        parentId: parentClip.id,
        parentTitle: parentClip.title,
        childTitle: firstChild.pendingClipTitle
      });

      // Set currentClipId to PARENT (not child)
      // This allows subsequent recordings to append as children
      setCurrentClipId(parentClip.id);
      clipIdToUpdate = firstChild.id;  // For selectedPendingClips update below

      // v2.7.0: selectedPendingClips auto-updates via Zustand selector
      log.debug('First child created, Zustand selector will auto-update', { 
        firstChildId: firstChild.id 
      });

    } else {
      // v2.4: Create CHILD recording linked to parent
      const parentClip = parentClipForChild!;

      if (!parentClip) {
        log.error('Parent clip not found, cannot create child', {
          currentClipId
        });
        return;
      }

      // Get next pending clip number for this parent
      const allClips = getClips();
      const childrenOfParent = allClips.filter(c => c.parentId === parentClip.id);
      const childNumbers = childrenOfParent
        .map(c => c.pendingClipTitle?.match(/Clip (\d+)/)?.[1])
        .filter(n => n)
        .map(Number);
      const maxChildNumber = childNumbers.length > 0 ? Math.max(...childNumbers) : 0;
      const nextChildNumber = String(maxChildNumber + 1).padStart(3, '0');
      const nextPendingTitle = `Clip ${nextChildNumber}`;

      // v2.4: Manually create child clip (DON'T use createClip to avoid new recording number)
      const childId = `clip-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      clipIdToUpdate = childId;

      // Create child clip object directly with parent's title
      const now = new Date();
      const childClip: Clip = {
        id: childId,
        title: parentClip.title,            // ✅ Inherit parent's title "Recording 01"
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'pending-child',            // Child status (filtered from home)
        content: '',                        // No content yet (pending transcription)
        rawText: '',                        // Empty until transcribed
        formattedText: '',                  // Empty until formatted
        pendingClipTitle: nextPendingTitle, // "Clip 002", "Clip 003", etc.
        audioId: audioId,                   // Link to IndexedDB audio
        duration: formatDuration(duration), // Recording duration
        parentId: parentClip.id,            // Link to parent
        currentView: 'formatted',
        createdAt: Date.now()
      };

      // Save child to Zustand
      addClip(childClip);

      log.info('Created CHILD for offline recording', {
        childId: childId,
        parentId: parentClip.id,
        parentTitle: parentClip.title,      // Log parent title for debugging
        parentStatus: parentClip.status,
        childTitle: nextPendingTitle
      });

      // v2.7.0: selectedPendingClips auto-updates via Zustand selector
      log.debug('Child clip added, Zustand selector will auto-update', { 
        childId: childClip.id 
      });
    }
  }, [setCurrentClipId, addClip, getClips]);

  return {
    handleOfflineRecording
  };
};

