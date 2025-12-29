// useTranscriptionHandler.ts
// Handles transcription success for both active recordings and background retries
// Extracted from ClipMasterScreen.tsx Phase 2.5

import { useEffect, useCallback, useState } from 'react';
import { Clip, getClips, getNextRecordingNumber } from '../services/clipStorage';
import { PendingClip } from '../components/ui/ClipRecordScreen';
import { RecordNavState } from '../components/ui/mainvarmorph';
import { logger } from '../utils/logger';

const log = logger.scope('useTranscriptionHandler');

export interface UseTranscriptionHandlerParams {
  // Transcription state from useClipRecording
  transcription: string | null;
  isTranscribing: boolean;
  audioId: string | null;

  // Recording context
  recordNavState: RecordNavState;
  currentClipId: string | null;
  isAppendMode: boolean;
  appendBaseContent: string;
  selectedClip: Clip | null;
  clips: Clip[];
  selectedPendingClips: PendingClip[];
  isFormatting: boolean;

  // Callbacks to update parent state
  setRecordNavState: (state: RecordNavState) => void;
  setCurrentClipId: (id: string | null) => void;
  setSelectedClip: (clip: Clip | null) => void;
  setSelectedPendingClips: React.Dispatch<React.SetStateAction<PendingClip[]>>;
  setIsFirstTranscription: (value: boolean) => void;

  // Helper functions from parent
  createNewClip: (content: string, title: string, formattedText: string) => Clip;
  updateClipById: (id: string, updates: Partial<Clip>) => Clip | null;
  refreshClips: () => void;
  resetRecording: () => void;
  formatTranscriptionInBackground: (
    rawText: string,
    clipIdToUpdate: string,
    isAppending: boolean,
    shouldAnimate: boolean
  ) => Promise<void>;
  generateTitleInBackground: (clipId: string, transcriptionText: string) => Promise<void>;
}

export interface UseTranscriptionHandlerReturn {
  // Exposes batching state for debugging
  pendingBatch: {
    clipId: string;
    transcriptions: Array<{
      text: string;
      audioId: string;
      clipId: string;  // v2.5.5 FIX: Add clipId to type
    }>;
  };
}

export const useTranscriptionHandler = (
  params: UseTranscriptionHandlerParams
): UseTranscriptionHandlerReturn => {
  const {
    transcription,
    isTranscribing,
    audioId,
    recordNavState,
    currentClipId,
    isAppendMode,
    appendBaseContent,
    selectedClip,
    clips,
    selectedPendingClips,
    isFormatting,
    setRecordNavState,
    setCurrentClipId,
    setSelectedClip,
    setSelectedPendingClips,
    setIsFirstTranscription,
    createNewClip,
    updateClipById,
    refreshClips,
    resetRecording,
    formatTranscriptionInBackground,
    generateTitleInBackground
  } = params;

  // Batch state for remaining pending clips (Option D)
  const [pendingBatch, setPendingBatch] = useState<{
    clipId: string;
    transcriptions: Array<{ text: string; audioId: string; clipId: string }>;  // v2.5.5 FIX: Add clipId
  }>({ clipId: '', transcriptions: [] });

  // Helper: Determine if this is the first pending transcription for a clip
  // v2.5.5 FIX: Check if this is the first pending transcription for a PARENT
  // Need to look at all children of the parent, not just this clip
  const isFirstPendingForClip = useCallback((clip: Clip): boolean => {
    const parentId = clip.parentId || clip.id;

    // Get all children of this parent (including the parent itself if it's a standalone clip)
    const allForParent = clips.filter(c =>
      c.parentId === parentId || c.id === parentId
    );

    // v2.5.6 FIX: Check if any child has COMPLETED (not just "has content")
    // A child is "completed" when status is cleared (null) AND has formattedText
    // This prevents race where Child 2 checks while Child 1 is still formatting
    // v2.5.7 FIX: Changed c.content to c.formattedText (children use formattedText field)
    const hasCompleted = allForParent.some(c => c.status === null && c.formattedText);

    log.debug('Checking isFirstPending', {
      clipId: clip.id,
      parentId,
      totalChildren: allForParent.length,
      hasCompleted,
      isFirst: !hasCompleted
    });

    return !hasCompleted;
  }, [clips]);

  // Helper: Count remaining transcribing clips for a given clip ID
  // v2.5.5 FIX: Count remaining transcribing children for a PARENT
  const countRemainingPending = useCallback((clip: Clip): number => {
    const parentId = clip.parentId || clip.id;

    // Count all children of this parent that are still transcribing
    const remaining = clips.filter(c =>
      (c.parentId === parentId || c.id === parentId) &&  // Same parent
      c.id !== clip.id &&  // Exclude current clip (it just finished HTTP)
      c.status === 'transcribing' &&
      c.audioId
    ).length;

    log.debug('Counting remaining pending', {
      clipId: clip.id,
      parentId,
      remaining
    });

    return remaining;
  }, [clips]);

  // ============================================
  // UNIFIED TRANSCRIPTION HANDLER (Option D)
  // ============================================
  // Handles BOTH active recordings AND background retries in ONE place
  useEffect(() => {
    if (transcription && !isTranscribing && !isFormatting) {

      // Context: Active recording or background retry?
      const isActiveRecording = recordNavState === 'processing';

      // Find target clip
      let targetClip: Clip | undefined;
      let clipIdForFormatting: string;

      if (isActiveRecording) {
        // ========================================
        // ACTIVE RECORDING PATH
        // ========================================
        log.debug('Active recording completed', { clipId: currentClipId });

        // COMBINE LOGIC HERE (ClipMasterScreen owns this business logic)
        if (isAppendMode && appendBaseContent && currentClipId) {
          // Append new text to existing with paragraph break
          const finalRawText = appendBaseContent + '\n\n' + transcription;
          log.debug('Appending to existing clip', {
            existingLength: appendBaseContent.length,
            newLength: transcription.length
          });

          // Build updated raw text (simple concatenation - no formatting)
          const existingRawText = selectedClip?.rawText || appendBaseContent;
          const updatedRawText = existingRawText + ' ' + transcription;

          const updatedClip = updateClipById(currentClipId, {
            content: finalRawText, // For backward compatibility
            rawText: updatedRawText,
            audioId: audioId || undefined, // Save audioId for potential retry
            status: 'transcribing', // Will be cleared after audio deletion
            date: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
          })
        });

        if (updatedClip) {
          // v2.6.0: Removed refreshClips() - Zustand handles reactivity automatically
        }

        clipIdForFormatting = currentClipId;
          targetClip = updatedClip || undefined;
        } else {
          // New clip - use transcription as-is
          const finalRawText = transcription;
          log.debug('Creating new clip with transcription');

          const nextNumber = getNextRecordingNumber(getClips());
          log.info('Creating new clip', { title: nextNumber });
          const newClip = createNewClip(finalRawText, nextNumber, finalRawText);

          // Save audioId with clip for potential retry
          if (audioId) {
            updateClipById(newClip.id, {
              audioId: audioId,
            status: 'transcribing' // Will be cleared after audio deletion
          });
        }

        // v2.6.0: Removed refreshClips() - Zustand handles reactivity automatically

        // PHASE 2.3.3 FIX: Only update currentClipId for active recordings
          // During background transcription, don't change currentClipId to prevent state leak
          if (isActiveRecording) {
            setCurrentClipId(newClip.id);
            log.debug('Set currentClipId for active recording', { clipId: newClip.id });
          } else {
            log.debug('Background transcription - not updating currentClipId', {
              clipId: newClip.id,
              reason: 'Prevents state leak into active view'
            });
          }

          // Generate AI title in background immediately (like old version)
          generateTitleInBackground(newClip.id, finalRawText);

          clipIdForFormatting = newClip.id;
          targetClip = getClips().find(c => c.id === newClip.id);

          // Mark that first transcription has been shown (for animation)
          setIsFirstTranscription(false);
        }
      } else {
        // ========================================
        // BACKGROUND RETRY PATH
        // ========================================
        targetClip = clips.find(c =>
          c.status === 'transcribing' &&
          c.audioId &&
          !c.content
        );

        if (!targetClip) {
          log.warn('No pending clip found for background transcription');
          return;
        }

        log.debug('Background transcription completed', { clipId: targetClip.id });
        clipIdForFormatting = targetClip.id;
      }

      if (!targetClip) {
        log.warn('No target clip found for transcription');
        return;
      }

      const isAppending = !!targetClip.content;
      const isFirstPending = !isActiveRecording && isFirstPendingForClip(targetClip);

      // ========================================
      // BATCHING: Hold remaining clips until all complete
      // ========================================
      if (!isActiveRecording && !isFirstPending) {
        const remaining = countRemainingPending(targetClip);

        log.info('Batching remaining clip', {
          clipId: targetClip.id,
          remaining,
          batchSize: pendingBatch.transcriptions.length + 1
        });

        // Add to batch
        // v2.5.5 FIX: Store clipId with each transcription so we can format to the correct clip later
        const updatedBatch = {
          clipId: targetClip.id,
          transcriptions: [
            ...pendingBatch.transcriptions,
            {
              text: transcription,
              audioId: targetClip.audioId!,
              clipId: targetClip.id  // v2.5.5 FIX: Store clip ID!
            }
          ]
        };
        setPendingBatch(updatedBatch);

        // If last one, display all batched
        if (remaining === 0) {  // v2.5.6 FIX: Last clip has 0 remaining (countRemainingPending excludes current)
          log.info('All remaining complete - displaying batch', {
            totalBatched: updatedBatch.transcriptions.length
          });

          (async () => {
            // v2.5.5 FIX: Format each transcription to its OWN clip ID
            for (const batch of updatedBatch.transcriptions) {
              log.debug('Formatting batched transcription', {
                clipId: batch.clipId,
                textLength: batch.text.length
              });

              await formatTranscriptionInBackground(
                batch.text,
                batch.clipId,  // v2.5.5 FIX: Use the clip ID stored in the batch!
                false,
                false  // No animation
              );

              log.debug('Batched transcription formatted', {
                clipId: batch.clipId
              });
            }

            // Clear batch
            setPendingBatch({ clipId: '', transcriptions: [] });

            // Update UI if viewing
            if (selectedPendingClips.some(p => p.id === targetClip!.id)) {
              setSelectedPendingClips(prev => prev.filter(p => p.id !== targetClip!.id));
              const updated = getClips().find(c => c.id === targetClip!.id);
              if (updated) setSelectedClip(updated);
            }

            // Generate title (use combined content)
            const clip = getClips().find(c => c.id === targetClip!.id);
            if (clip?.rawText) {
              generateTitleInBackground(clip.id, clip.rawText);
            }

            resetRecording();
          })();
        } else {
          // Not last - just clear hook for next
          resetRecording();
        }

        return;
      }

      // ========================================
      // IMMEDIATE DISPLAY: Active or first pending
      // ========================================
      const shouldAnimate = isActiveRecording || isFirstPending;

      (async () => {
        try {
          await formatTranscriptionInBackground(
            transcription,
            clipIdForFormatting,
            isAppending,
            shouldAnimate
          );

          if (isActiveRecording) {
            setRecordNavState('complete');
          } else {
            // First pending completed
            if (selectedPendingClips.some(p => p.id === targetClip!.id)) {
              setSelectedPendingClips(prev => prev.filter(p => p.id !== targetClip!.id));
              const updated = getClips().find(c => c.id === targetClip!.id);
              if (updated) setSelectedClip(updated);
            }

            // Generate title
            const clip = getClips().find(c => c.id === targetClip!.id);
            if (clip?.rawText) {
              generateTitleInBackground(clip.id, clip.rawText);
            }
          }

          resetRecording();
        } catch (error) {
          log.error('Transcription handling failed', error);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    transcription,      // ✅ Trigger: New transcription arrived
    isTranscribing,     // ✅ Guard: Don't run during transcription
    isFormatting,       // ✅ Guard: Don't run during formatting
    recordNavState,     // ✅ Context: Active recording vs background
    isAppendMode,       // ✅ User setting: New clip vs append mode
    // REMOVED self-triggering deps (Fix 7):
    // - currentClipId    (WE set it inside effect at line 219)
    // - selectedClip     (WE set it inside effect at lines 324, 364)
    // - audioId          (Changes during effect execution)
    // - appendBaseContent (Derived from selectedClip, cascading trigger)
    // - clips            (Already removed in Fix 6)
  ]);

  return {
    pendingBatch
  };
};

