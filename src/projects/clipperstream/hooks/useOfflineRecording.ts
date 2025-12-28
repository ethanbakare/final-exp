// useOfflineRecording.ts
// Handles offline recording parent-child creation and pending clip management
// Extracted from ClipMasterScreen.tsx Phase 2.5

import { useCallback } from 'react';
import { Clip, getClips, createClip, getNextRecordingNumber } from '../services/clipStorage';
import { PendingClip } from '../components/ui/ClipRecordScreen';
import { logger } from '../utils/logger';

const log = logger.scope('useOfflineRecording');

export interface UseOfflineRecordingParams {
  // Callbacks to update parent component state
  setCurrentClipId: (id: string) => void;
  setSelectedPendingClips: React.Dispatch<React.SetStateAction<PendingClip[]>>;
  refreshClips: () => void;

  // Helper functions from parent
  formatDuration: (seconds: number) => string;
  clipToPendingClip: (clip: Clip) => PendingClip;
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
    setSelectedPendingClips,
    refreshClips,
    formatDuration,
    clipToPendingClip
  } = params;

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
      } else if (currentClip.status === 'pending' || currentClip.status === 'pending-child') {
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
      const nextNumber = getNextRecordingNumber(getClips());
      const parentClip = createClip('', nextNumber, '');

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
        pendingClipTitle: 'Clip 001',       // First pending clip
        audioId: audioId,                   // Link to IndexedDB audio
        duration: formatDuration(duration), // Recording duration
        parentId: parentClip.id,            // Link to parent
        currentView: 'formatted',
        createdAt: Date.now()
      };

      // Save child to storage
      const allClipsBeforeUpdate = getClips();
      allClipsBeforeUpdate.push(firstChild);
      sessionStorage.setItem('clipstream_clips', JSON.stringify(allClipsBeforeUpdate));

      log.info('Created FIRST CHILD for offline recording', {
        childId: firstChild.id,
        parentId: parentClip.id,
        parentTitle: parentClip.title,
        childTitle: firstChild.pendingClipTitle
      });

      refreshClips();

      // Set currentClipId to PARENT (not child)
      // This allows subsequent recordings to append as children
      setCurrentClipId(parentClip.id);
      clipIdToUpdate = firstChild.id;  // For selectedPendingClips update below

      // Add first child to selectedPendingClips
      const pendingClip = clipToPendingClip(firstChild);
      setSelectedPendingClips([pendingClip]);
      log.debug('Set selectedPendingClips to first child', { pendingClip });

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
        pendingClipTitle: nextPendingTitle, // "Clip 002", "Clip 003", etc.
        audioId: audioId,                   // Link to IndexedDB audio
        duration: formatDuration(duration), // Recording duration
        parentId: parentClip.id,            // Link to parent
        currentView: 'formatted',
        createdAt: Date.now()
      };

      // Save child to storage
      const allClipsBeforeUpdate = getClips();
      allClipsBeforeUpdate.push(childClip);
      sessionStorage.setItem('clipstream_clips', JSON.stringify(allClipsBeforeUpdate));

      log.info('Created CHILD for offline recording', {
        childId: childId,
        parentId: parentClip.id,
        parentTitle: parentClip.title,      // Log parent title for debugging
        parentStatus: parentClip.status,
        childTitle: nextPendingTitle
      });

      refreshClips();

      // Add to selectedPendingClips array
      const pendingClip = clipToPendingClip(childClip);
      setSelectedPendingClips(prev => [...prev, pendingClip]);
      log.debug('Added child to selectedPendingClips', { pendingClip });
    }
  }, [setCurrentClipId, setSelectedPendingClips, refreshClips, formatDuration, clipToPendingClip]);

  return {
    handleOfflineRecording
  };
};

