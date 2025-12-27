import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { ClipHomeScreen } from './ClipHomeScreen';
import { ClipRecordScreen, PendingClip } from './ClipRecordScreen';
import { RecordNavBarVarMorphing, RecordNavState } from './mainvarmorph';
import { ToastNotification } from './ClipToast';
import { useClipRecording } from '../../hooks/useClipRecording';
import { Clip, getClips, createClip, updateClip, initializeClips, getNextClipNumber, getNextRecordingNumber } from '../../services/clipStorage';
import { deleteAudio, clearAllAudio, getAudio } from '../../services/audioStorage';
import { logger } from '../../utils/logger';

const log = logger.scope('ClipMasterScreen');

// ClipMasterScreen Component
// Parent orchestrator that manages screen transitions and shared RecordBar
// Handles: Screen switching (home ↔ record), RecordBar state, navigation
//
// ARCHITECTURE:
// ┌─────────────────────────────────────┐
// │ Screen Container (slide animation)  │
// │  ┌─────────────┐  ┌─────────────┐  │
// │  │ClipHome     │↔ │ClipRecord   │  │
// │  │Screen       │  │Screen       │  │
// │  └─────────────┘  └─────────────┘  │
// ├─────────────────────────────────────┤
// │ RecordBar (RecordNavBarMorphing)    │  ← FIXED, never moves
// └─────────────────────────────────────┘

/* ============================================
   INTERFACES
   ============================================ */

type ActiveScreen = 'home' | 'record';

// SelectedClip extends Clip to ensure compatibility
type SelectedClip = Clip;

interface ClipMasterScreenProps {
  pendingClips?: PendingClip[];
  initialScreen?: ActiveScreen;
  className?: string;
}

/* ============================================
   CLIP MASTER SCREEN COMPONENT
   ============================================ */

export const ClipMasterScreen: React.FC<ClipMasterScreenProps> = ({
  pendingClips = [],
  initialScreen = 'home',
  className = ''
}) => {
  // ============================================
  // STATE
  // ============================================

  // Clips management (loaded from storage)
  const [clips, setClips] = useState<Clip[]>([]);

  // Current active screen
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(initialScreen);

  // RecordBar state (managed here since it persists across screens)
  const [recordNavState, setRecordNavState] = useState<RecordNavState>('record');

  // Selected clip (when viewing a transcribed clip)
  const [selectedClip, setSelectedClip] = useState<SelectedClip | null>(null);

  // Selected pending clip (when viewing a clip waiting to be transcribed)
  const [selectedPendingClip, setSelectedPendingClip] = useState<PendingClip | null>(null);

  // Track if search is active (to hide RecordBar)
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Track animation variant for RecordNavBar
  // 'fade': Direct transitions (viewing existing clip, or resetting to record)
  // 'morph': Normal recording flow (record → recording → processing → complete)
  const [animationVariant, setAnimationVariant] = useState<'morph' | 'fade'>('morph');

  // Network status for ClipRecordScreen
  const [, setIsOnline] = useState(true); // Using blank identifier for unused state variable

  // Toast notification state
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copyToastText, setCopyToastText] = useState<string | undefined>(undefined);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showAudioToast, setShowAudioToast] = useState(false);
  const hasShownTranscriptionToast = useRef(false);

  // Recording mode tracking
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);
  const [isAppendMode, setIsAppendMode] = useState(false);
  const [appendBaseContent, setAppendBaseContent] = useState<string>('');

  // Content blocks for rendering (industry standard list pattern)
  const [contentBlocks, setContentBlocks] = useState<Array<{
    id: string;
    text: string;
    animate: boolean;
  }>>([]);

  // Track if this is the first transcription in the clip (for animation control)
  // First transcription gets fade-in animation, subsequent transcriptions appear instantly
  const [isFirstTranscription, setIsFirstTranscription] = useState(true);

  // Track if formatting is in progress (keeps processing state visible)
  const [isFormatting, setIsFormatting] = useState(false);

  // Batch state for remaining pending clips (Option D)
  const [pendingBatch, setPendingBatch] = useState<{
    clipId: string;
    transcriptions: Array<{ text: string; audioId: string }>;
  }>({ clipId: '', transcriptions: [] });

  // Recording hook - handles audio recording and transcription
  const {
    isRecording,
    audioBlob,
    audioId,
    duration,
    audioAnalyser,
    isTranscribing,
    transcription,
    transcriptionError,
    isActiveRequest,  // Controls icon spinning
    startRecording: startRecordingHook,
    stopRecording: stopRecordingHook,
    transcribeRecording,
    forceRetry,       // Allows tap-to-skip wait
    reset: resetRecording,
  } = useClipRecording();

  // Processing timer (for UI transition delay)
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable ref to transcribeRecording to prevent useEffect re-triggers from function recreation
  const transcribeRef = useRef(transcribeRecording);
  useEffect(() => {
    transcribeRef.current = transcribeRecording;
  }, [transcribeRecording]);

  // ============================================
  // HELPER FUNCTIONS - Option D Batching
  // ============================================

  // Helper: Determine if this is the first pending transcription for a clip
  const isFirstPendingForClip = useCallback((clipId: string): boolean => {
    const allForClip = clips.filter(c => c.id === clipId);
    const hasContent = allForClip.some(c => c.content);
    return !hasContent;  // First if no content exists yet
  }, [clips]);

  // Helper: Count remaining transcribing clips for a given clip ID
  const countRemainingPending = useCallback((clipId: string): number => {
    return clips.filter(c =>
      c.id === clipId &&
      c.status === 'transcribing' &&
      c.audioId
    ).length;
  }, [clips]);

  // ============================================
  // DERIVED STATE - Content for clipboard
  // ============================================

  /**
   * Content to copy - respects raw/formatted view toggle
   * When viewing an existing clip, copies what the user is looking at
   */
  const copyableContent = useMemo(() => {
    // If viewing an existing clip, respect the raw/formatted toggle
    if (selectedClip) {
      if (selectedClip.currentView === 'raw') {
        return selectedClip.rawText || selectedClip.content || '';
      }
      return selectedClip.formattedText || selectedClip.content || '';
    }
    // During recording/processing, use contentBlocks (formatted text after completion)
    return contentBlocks.map(block => block.text).join('\n\n');
  }, [contentBlocks, selectedClip]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================

  // Navigate from home to record screen (when clicking a clip)
  const handleClipClick = useCallback((clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      if (clip.content) {
        // Transcribed clip - show in complete state
        setSelectedClip(clip); // Pass full clip object
        setSelectedPendingClip(null);
        // Reset append mode flags - viewing existing clip shows full combined text
        setIsAppendMode(false);
        setCurrentClipId(null);
        setAppendBaseContent('');
        resetRecording(); // Clear any lingering transcription from hook
        // Set content blocks - single block, no animation
        setContentBlocks([{
          id: clip.id,
          text: clip.content,
          animate: false
        }]);
        setAnimationVariant('fade');  // Use fade for direct to complete
        setRecordNavState('complete');  // Show Copy + Record + Structure
        setActiveScreen('record');
      } else {
        // Pending clip (no content yet) - show in waiting/transcribing state
        setSelectedClip(null);

        // FIX 002: Set currentClipId so subsequent recordings append to this clip
        setCurrentClipId(clip.id);

        // Determine status based on clip.status
        const pendingStatus = clip.status === 'transcribing' ? 'transcribing' : 'waiting';

        // Use stored pendingClipTitle (set when clip became pending)
        setSelectedPendingClip({
          id: clip.id,
          title: clip.pendingClipTitle || 'Clip 001',  // Use stored name
          time: clip.duration || '0:00',
          status: pendingStatus,
          isActiveRequest: isActiveRequest  // Controls spinning icon
        });
        setAnimationVariant('fade');
        setRecordNavState('record');  // Show record button (not complete)
        setActiveScreen('record');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips]); // Only run when clips change (intentionally omit resetRecording)

  // Navigate back from record to home screen (via "Clips" button only)
  const handleBackClick = useCallback(() => {
    // Navigate back from record to home screen (via "Clips" button only)
    // Reset all recording state and return to home
    setIsAppendMode(false);
    setCurrentClipId(null);
    setAppendBaseContent('');
    setSelectedClip(null);
    setSelectedPendingClip(null);
    setContentBlocks([]); // Clear content blocks
    setIsFirstTranscription(true); // Reset animation flag for next recording
    resetRecording(); // This clears transcription from the hook
    setRecordNavState('record'); // Reset to default record state for next time
    setActiveScreen('home');
  }, [resetRecording]);

  // Start fresh recording (via pencil/NewClip button in ClipRecordHeader)
  // Stays on ClipRecordScreen, just resets to record state
  const handleNewClipClick = useCallback(() => {
    setIsAppendMode(false);
    setCurrentClipId(null);
    setAppendBaseContent('');
    setSelectedClip(null);
    setSelectedPendingClip(null);
    setContentBlocks([]); // Clear content blocks for new recording
    setIsFirstTranscription(true); // Reset animation flag for next recording
    resetRecording();
    setAnimationVariant('fade');  // Use fade for direct transition back to record
    setRecordNavState('record');
    // Already on record screen, just reset state
  }, [resetRecording]);

  // ============================================
  // RECORDING HANDLERS (from mainmorph.tsx demo)
  // ============================================

  const handleRecordClick = async () => {
    // CRITICAL: Clear previous transcription FIRST to prevent flash/duplication
    resetRecording();

    // Case 1: Recording from Home screen → NEW clip
    if (activeScreen === 'home') {
      setIsAppendMode(false);
      setCurrentClipId(null);
      setAppendBaseContent('');
      setContentBlocks([]); // Clear blocks for new recording
      setActiveScreen('record');
      setAnimationVariant('morph');

      // Small delay to allow screen transition, then start recording
      setTimeout(() => startRecordingHook(), 200);
    }

    // Case 2: Recording from existing clip with content → APPEND mode
    else if (activeScreen === 'record' && selectedClip?.content) {
      // CRITICAL: Update appendBaseContent to CURRENT full content
      // If we just finished a recording, selectedClip.content has the combined text
      // If we're viewing an old clip, selectedClip.content has the old text
      setIsAppendMode(true);
      setCurrentClipId(selectedClip.id);
      setAppendBaseContent(selectedClip.content); // This is the NEW base for next append
      // ✓ DON'T collapse contentBlocks - keep existing block structure
      // This prevents visual shift when clicking Record again
      // New block will be added when transcription arrives
      setAnimationVariant('morph'); // CRITICAL: Reset to morph for recording animation

      // If currently viewing raw text, switch back to formatted view
      // Recording always produces formatted output, so switch view to match
      if (selectedClip.currentView === 'raw') {
        const updatedClip = updateClip(selectedClip.id, { currentView: 'formatted' });
        if (updatedClip) {
          setSelectedClip(updatedClip);
          refreshClips();
          // Update contentBlocks to show formatted text immediately
          setContentBlocks([{
            id: 'formatted-view',
            text: updatedClip.formattedText || updatedClip.content || '',
            animate: false
          }]);
        }
      }

      setTimeout(() => startRecordingHook(), 200);
    }

    // Case 2.5: Recording from pending clip (no content yet, only pending recordings)
    else if (activeScreen === 'record' && selectedPendingClip) {
      // Keep currentClipId - we're adding to existing clip file
      setIsAppendMode(true);
      setCurrentClipId(selectedPendingClip.id);
      log.debug('Recording from pending clip - keeping clip context', {
        clipId: selectedPendingClip.id
      });
      setTimeout(() => startRecordingHook(), 200);
    }

    // Case 3: Recording from record screen (no existing content AND no pending clip) → NEW clip
    else {
      setIsAppendMode(false);
      setCurrentClipId(null);
      setAppendBaseContent('');
      setContentBlocks([]); // Clear blocks for new recording
      setAnimationVariant('morph'); // CRITICAL: Ensure morph variant for recording

      setTimeout(() => startRecordingHook(), 200);
    }
  };

  const handleCloseClick = () => {
    // Close just cancels recording - does NOT navigate back
    // Only way back to home is via "Clips" button in ClipRecordHeader
    stopRecordingHook();

    // DECISION: Where should we return?
    // If we have existing content (viewing a transcribed clip) → return to 'complete' state
    // If no content (fresh recording cancelled) → return to 'record' state

    if (selectedClip?.content || transcription) {
      // Return to complete state with existing buttons visible
      // [Copy] [Record] [Structure] - allows user to access existing content
      setRecordNavState('complete');
      setAnimationVariant('morph'); // Animate the transition (X→Copy, Done→Structure)
    } else {
      // Return to empty record state
      // [Record] only - no content to display
      setRecordNavState('record');
    }
  };

  const handleDoneClick = () => {
    // Stop recording (hook handles cleanup)
    stopRecordingHook();

    // Show processing state immediately
    setRecordNavState('processing');

    // Note: Transcription will be triggered by useEffect when audioBlob is ready
    // The processing→complete transition will happen after transcription completes
  };

  const handleCopyClick = () => {
    // Copy displayedcontent to clipboard - uses derived copyableContent
    if (copyableContent) {
      navigator.clipboard.writeText(copyableContent);
      // Always show copy toast for manual copy
      setShowCopyToast(true);
    }
  };

  // Dismiss toast
  const handleDismissToast = useCallback(() => {
    setShowCopyToast(false);
    setCopyToastText(undefined); // Reset to default message for next time
  }, []);

  // ============================================
  // STORAGE & CALLBACKS
  // ============================================

  // Load clips from storage on mount
  // Clear orphaned audio from IndexedDB if sessionStorage is empty
  useEffect(() => {
    const storedClips = getClips();
    if (storedClips.length === 0) {
      // First visit / sessionStorage cleared - clear orphaned audio from IndexedDB
      clearAllAudio().then(() => {
        log.info('Cleared orphaned audio from IndexedDB');
      }).catch((error) => {
        log.error('Failed to clear orphaned audio', error);
      });

      // Initialize with demo clips
      const demoClips = initializeClips();
      setClips(demoClips);
    } else {
      setClips(storedClips);
    }
  }, []);

  // Refresh clips from storage
  const refreshClips = useCallback(() => {
    setClips(getClips());
  }, []);

  // Helper: Format duration in seconds to "M:SS" format
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Helper: Transform Clip → PendingClip for display
  // NOTE: Per clipofflinescreen_spec.md lines 248-252:
  // - Clip FILE (home screen) = "Recording XX" (from clip.title)
  // - ClipOffline (inside clip) = "Clip XXX" format (stored in pendingClipTitle)
  const clipToPendingClip = useCallback((clip: Clip): PendingClip => {
    return {
      id: clip.id,
      title: clip.pendingClipTitle || 'Clip 001',  // Use stored name
      time: clip.duration || '0:00',
      status: clip.status === 'transcribing' ? 'transcribing' : 'waiting',
      isActiveRequest: isActiveRequest
    };
  }, [isActiveRequest]);

  // Auto-retry pending clips when network comes online
  const handleOnline = useCallback(async () => {
    // DEBUG: Visible console log to verify event fires
    console.log('🟢 handleOnline FIRED - network is back online');

    // CRITICAL: Don't interfere with active recording session
    if (isRecording) {
      log.info('Network online but recording active - skipping auto-retry');
      console.log('🟡 handleOnline - skipped (recording active)');
      return;
    }

    log.info('Network online - attempting auto-retry of pending clips');

    const allClips = getClips();
    const pendingClips = allClips.filter(c =>
      c.audioId && (c.status === 'pending' || c.status === 'failed')
    );

    // DEBUG: Log what clips were found
    console.log('🟢 handleOnline - clips found:', {
      total: allClips.length,
      pendingCount: pendingClips.length,
      pendingClips: pendingClips.map(c => ({ id: c.id, status: c.status, audioId: c.audioId }))
    });

    if (pendingClips.length === 0) {
      log.debug('No pending clips to retry');
      return;
    }

    log.info('Found pending clips for auto-retry', { count: pendingClips.length });

    for (const clip of pendingClips) {
      try {
        // Update CLIP status only, not nav state
        log.info('Status transition', {
          clipId: clip.id,
          from: clip.status,
          to: 'transcribing',
          trigger: 'auto-retry-online'
        });

        updateClip(clip.id, {
          status: 'transcribing',
          transcriptionError: undefined
        });
        refreshClips();

        // DON'T set currentClipId, isAppendMode, or recordNavState
        // These belong to the current user session, not background retries

        // Fetch audio from IndexedDB
        const audioBlob = await getAudio(clip.audioId!);
        if (!audioBlob) {
          throw new Error('Audio not found in IndexedDB');
        }

        log.debug('Auto-retrying transcription', {
          clipId: clip.id,
          audioId: clip.audioId,
          size: audioBlob.size
        });

        // Transcribe using retrieved blob
        await transcribeRecording(audioBlob);

        // If successful, transcription will be handled by existing useEffect

      } catch (error) {
        log.error('Auto-retry failed for clip', {
          clipId: clip.id,
          error
        });

        // Mark as failed
        log.info('Status transition', {
          clipId: clip.id,
          from: 'transcribing',
          to: 'failed',
          trigger: 'auto-retry-error'
        });

        updateClip(clip.id, {
          status: 'failed',
          transcriptionError: error instanceof Error ? error.message : 'Auto-retry failed'
        });
        refreshClips();
      }
    }
  }, [isRecording, refreshClips, transcribeRecording]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOffline = () => {
      log.info('Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline]);

  // Toggle between formatted and raw text view
  const handleStructureClick = useCallback(() => {
    if (!selectedClip) {
      log.warn('No clip selected for structure toggle');
      return;
    }

    log.debug('Structure toggle clicked', {
      clipId: selectedClip.id,
      currentView: selectedClip.currentView
    });

    // Toggle between formatted ↔ raw
    const newView = selectedClip.currentView === 'formatted' ? 'raw' : 'formatted';

    const updatedClip = updateClip(selectedClip.id, {
      currentView: newView
    });

    if (updatedClip) {
      setSelectedClip(updatedClip);
      refreshClips();

      log.info('View toggled', {
        clipId: selectedClip.id,
        newView
      });
    }

    // NO auto-copy on toggle (per requirements)
  }, [selectedClip, refreshClips]);

  // Manual retry transcription for failed clips
  const handleRetryTranscription = useCallback(async (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip || !clip.audioId) {
      log.warn('Cannot retry: clip or audioId not found', { clipId });
      return;
    }

    log.info('Manual retry requested', {
      clipId,
      audioId: clip.audioId
    });

    // Update status to transcribing
    log.info('Status transition', {
      clipId,
      from: clip.status,
      to: 'transcribing',
      trigger: 'manual-retry'
    });

    updateClip(clipId, {
      status: 'transcribing',
      transcriptionError: undefined
    });
    refreshClips();

    // Set context for transcription completion
    setCurrentClipId(clip.id);
    setIsAppendMode(false);
    setRecordNavState('processing');

    // Get audio from IndexedDB and retry transcription
    try {
      const audioBlob = await getAudio(clip.audioId);
      if (!audioBlob) {
        throw new Error('Audio not found in IndexedDB');
      }

      log.debug('Audio retrieved, starting transcription', {
        audioId: clip.audioId,
        size: audioBlob.size
      });

      // Transcribe using retrieved blob
      await transcribeRecording(audioBlob);

      // Success - transcription will be handled by existing useEffect
      log.info('Manual retry transcription initiated', {
        clipId,
        audioId: clip.audioId
      });

    } catch (error) {
      log.error('Retry failed', { clipId, error });

      log.info('Status transition', {
        clipId,
        from: 'transcribing',
        to: 'failed',
        trigger: 'manual-retry-error'
      });

      updateClip(clipId, {
        status: 'failed',
        transcriptionError: error instanceof Error ? error.message : 'Retry failed'
      });
      refreshClips();
      setRecordNavState('record');
    }
  }, [clips, refreshClips]);

  // Smart retry handler - routes to forceRetry or handleRetryTranscription
  const handleSmartRetry = useCallback((clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) {
      log.warn('Cannot retry: clip not found', { clipId });
      return;
    }

    // If clip is currently transcribing and we're in a wait period, use forceRetry
    if (clip.status === 'transcribing' && !isActiveRequest && currentClipId === clipId) {
      log.info('Tap-to-skip wait period', { clipId });
      forceRetry();
    } else if (clip.status === 'failed' || clip.status === 'pending') {
      // Failed or pending clip - retry from IndexedDB
      log.info('Manual retry from IndexedDB', { clipId, status: clip.status });
      handleRetryTranscription(clipId);
    } else {
      log.warn('Cannot retry: invalid state', {
        clipId,
        status: clip.status,
        isActiveRequest,
        currentClipId
      });
    }
  }, [clips, isActiveRequest, currentClipId, forceRetry, handleRetryTranscription]);

  // ============================================
  // EFFECTS - Auto-transcription and state management
  // ============================================

  // Update recordNavState based on hook's isRecording
  useEffect(() => {
    if (isRecording) {
      setRecordNavState('recording');
    }
  }, [isRecording]);

  // Auto-trigger transcription when audioBlob is ready
  // GUARD: Don't re-trigger after definitive failure (transcriptionError set)
  // Uses stable ref to avoid function recreation triggering re-runs
  useEffect(() => {
    if (audioBlob && !isTranscribing && !transcription && !transcriptionError && recordNavState === 'processing') {
      transcribeRef.current();
    }
  }, [audioBlob, isTranscribing, transcription, transcriptionError, recordNavState]);

  // Background title generation with opacity fade
  const generateTitleInBackground = useCallback(async (clipId: string, transcriptionText: string) => {
    const startTime = performance.now();
    log.debug('Starting background title generation', {
      clipId,
      textLength: transcriptionText.length
    });
    // console.time('⏱️ TITLE GENERATION');

    try {
      const response = await fetch('/api/clipperstream/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcriptionText })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        log.warn(`Title generation failed (${response.status})`, errorData);
        // Keep the fallback "Clip 001" title - app continues working
        return;
      }

      const { title } = await response.json();
      // console.timeEnd('⏱️ TITLE GENERATION');
      log.info('AI title generated, updating clip', { clipId, title });

      // Update clip with AI-generated title
      // ClipListItem's opacity transition handles the fade automatically
      const updatedClip = updateClip(clipId, { title });
      if (updatedClip) {
        refreshClips();
        // If still viewing this clip, update selectedClip
        if (currentClipId === clipId) {
          setSelectedClip(updatedClip);
        }
      }
    } catch (error) {
      // console.timeEnd('⏱️ TITLE GENERATION');
      log.warn('Title generation failed', error);
      // Keep the "Clip 001" fallback title - app continues working
    }
  }, [currentClipId, refreshClips]);

  // Background text formatting with AI
  // NOW: This function also updates contentBlocks and transitions to complete state
  const formatTranscriptionInBackground = useCallback(async (
    rawText: string,
    clipIdToUpdate: string,
    isAppending: boolean,
    shouldAnimate: boolean
  ) => {
    const startTime = performance.now();
    log.debug('Starting background formatting', { rawLength: rawText.length });
    // console.time('⏱️ TEXT FORMATTING');
    setIsFormatting(true);

    try {
      // Determine if we need context (appending to existing formatted text)
      const existingContext = isAppending && selectedClip?.formattedText
        ? selectedClip.formattedText
        : undefined;

      const response = await fetch('/api/clipperstream/format-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          existingFormattedContext: existingContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        log.warn('Formatting failed, falling back to raw text', errorData);
        // Fallback: show raw text instead (use full combined raw text)
        const clip = getClips().find(c => c.id === clipIdToUpdate);
        const fullRawText = clip?.rawText || rawText;
        setContentBlocks([{
          id: `fallback-${Date.now()}`,
          text: fullRawText,
          animate: false
        }]);

        // Auto-copy raw text (fallback - formatting failed but transcription succeeded)
        navigator.clipboard.writeText(fullRawText).catch(() => { });

        // Show toast once per session with custom message indicating formatting failed
        if (!hasShownTranscriptionToast.current) {
          setCopyToastText('Copied without formatting');
          setShowCopyToast(true);
          hasShownTranscriptionToast.current = true;
        }

        // Transcription succeeded even though formatting failed - clean up audio and status
        if (clip?.audioId) {
          try {
            await deleteAudio(clip.audioId);
            log.info('Audio deleted after formatting fallback', { audioId: clip.audioId, clipId: clipIdToUpdate });

            log.info('Status transition', {
              clipId: clipIdToUpdate,
              from: 'transcribing',
              to: null,
              trigger: 'transcription-complete-formatting-failed'
            });

            updateClip(clipIdToUpdate, {
              audioId: undefined,
              status: null
            });
            refreshClips();
          } catch (error) {
            log.error('Failed to delete audio after formatting fallback', { error });
            // Still clear status even if audio deletion fails
            updateClip(clipIdToUpdate, {
              audioId: undefined,
              status: null
            });
            refreshClips();
          }
        }

        setRecordNavState('complete');
        setIsFormatting(false);
        return;
      }

      const { formattedText } = await response.json();
      log.info('Text formatted successfully');


      // Update clip with formatted text
      const clip = getClips().find(c => c.id === clipIdToUpdate);
      if (clip) {
        let updatedFormattedText: string;

        if (isAppending && clip.formattedText) {
          // Append formatted new text to existing formatted text
          updatedFormattedText = clip.formattedText + formattedText;
        } else {
          // First transcription
          updatedFormattedText = formattedText;
        }

        const updatedClip = updateClip(clipIdToUpdate, {
          formattedText: updatedFormattedText
        });
        refreshClips();

        // Update selectedClip if still viewing
        if (updatedClip) {
          setSelectedClip(updatedClip);
        }

        // NOW update contentBlocks with FORMATTED text and show to user
        // CRITICAL: Always use the FULL combined text to preserve AI's paragraph decisions
        // If we used separate blocks, <div> wrappers would force line breaks
        setContentBlocks([{
          id: `formatted-full-${Date.now()}`,
          text: updatedFormattedText, // Full combined text - AI's formatting preserved
          animate: false // No animation for formatting updates (happens after transcription)
        }]);

        // Auto-copy FORMATTED text to clipboard (moved here from transcription useEffect)
        // This ensures user gets formatted text in clipboard that matches what's on screen
        navigator.clipboard.writeText(updatedFormattedText).catch(() => { });

        // Show toast once per session (after formatted text is ready)
        if (!hasShownTranscriptionToast.current) {
          setCopyToastText(undefined); // Use default "Copied to clipboard" message
          setShowCopyToast(true);
          hasShownTranscriptionToast.current = true;
        }

        // Transcription succeeded - clean up audio and status immediately
        // NOTE: Previously used 10-second delay, but that caused status to remain stuck at 'transcribing'
        // when user navigated away before timeout completed. Once transcription succeeds, we have the
        // text (rawText + formattedText), so audio blob is no longer needed.
        if (clip.audioId) {
          try {
            await deleteAudio(clip.audioId);
            log.info('Audio deleted from IndexedDB after successful transcription', {
              audioId: clip.audioId,
              clipId: clipIdToUpdate
            });

            log.info('Status transition', {
              clipId: clipIdToUpdate,
              from: 'transcribing',
              to: null,
              trigger: 'transcription-complete'
            });

            // Clear audioId and status from clip
            updateClip(clipIdToUpdate, {
              audioId: undefined,
              status: null
            });
            refreshClips();
          } catch (error) {
            log.error('Failed to delete audio after transcription', {
              audioId: clip.audioId,
              clipId: clipIdToUpdate,
              error
            });
            // Still clear status even if audio deletion fails
            updateClip(clipIdToUpdate, {
              audioId: undefined,
              status: null
            });
            refreshClips();
          }
        }
      }

      // Transition to complete state - NOW formatted text is ready
      // console.timeEnd('⏱️ TEXT FORMATTING');
      setRecordNavState('complete');

    } catch (error) {
      log.error('Background formatting failed', error);
      // Fallback: show raw text (use full combined raw text)
      const clip = getClips().find(c => c.id === clipIdToUpdate);
      const fullRawText = clip?.rawText || rawText;
      setContentBlocks([{
        id: `error-${Date.now()}`,
        text: fullRawText,
        animate: false
      }]);

      // Auto-copy raw text (fallback - formatting threw error but transcription succeeded)
      navigator.clipboard.writeText(fullRawText).catch(() => { });

      // Show toast once per session with custom message indicating formatting failed
      if (!hasShownTranscriptionToast.current) {
        setCopyToastText('Copied without formatting');
        setShowCopyToast(true);
        hasShownTranscriptionToast.current = true;
      }

      // Transcription succeeded even though formatting failed - clean up audio and status
      if (clip?.audioId) {
        try {
          await deleteAudio(clip.audioId);
          log.info('Audio deleted after formatting error', { audioId: clip.audioId, clipId: clipIdToUpdate });

          log.info('Status transition', {
            clipId: clipIdToUpdate,
            from: 'transcribing',
            to: null,
            trigger: 'transcription-complete-formatting-error'
          });

          updateClip(clipIdToUpdate, {
            audioId: undefined,
            status: null
          });
          refreshClips();
        } catch (deleteError) {
          log.error('Failed to delete audio after formatting error', { error: deleteError });
          // Still clear status even if audio deletion fails
          updateClip(clipIdToUpdate, {
            audioId: undefined,
            status: null
          });
          refreshClips();
        }
      }

      setRecordNavState('complete');
    } finally {
      setIsFormatting(false);
    }
  }, [selectedClip, refreshClips]);

  // ============================================
  // UNIFIED TRANSCRIPTION HANDLER (Option D)
  // ============================================
  // Handles BOTH active recordings AND background retries in ONE place
  // Decouples transcription logic from UI state (recordNavState is only read as context)
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

          const updatedClip = updateClip(currentClipId, {
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
            refreshClips();
          }

          clipIdForFormatting = currentClipId;
          targetClip = updatedClip || undefined;
        } else {
          // New clip - use transcription as-is
          const finalRawText = transcription;
          log.debug('Creating new clip with transcription');

          const nextNumber = getNextRecordingNumber(getClips());
          log.info('Creating new clip', { title: nextNumber });
          const newClip = createClip(finalRawText, nextNumber, finalRawText);

          // Save audioId with clip for potential retry
          if (audioId) {
            updateClip(newClip.id, {
              audioId: audioId,
              status: 'transcribing' // Will be cleared after audio deletion
            });
          }

          refreshClips();
          setCurrentClipId(newClip.id);

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
      const isFirstPending = !isActiveRecording && isFirstPendingForClip(targetClip.id);

      // ========================================
      // BATCHING: Hold remaining clips until all complete
      // ========================================
      if (!isActiveRecording && !isFirstPending) {
        const remaining = countRemainingPending(targetClip.id);

        log.info('Batching remaining clip', {
          clipId: targetClip.id,
          remaining,
          batchSize: pendingBatch.transcriptions.length + 1
        });

        // Add to batch
        const updatedBatch = {
          clipId: targetClip.id,
          transcriptions: [
            ...pendingBatch.transcriptions,
            { text: transcription, audioId: targetClip.audioId! }
          ]
        };
        setPendingBatch(updatedBatch);

        // If last one, display all batched
        if (remaining === 1) {  // This is the last one
          log.info('All remaining complete - displaying batch', {
            totalBatched: updatedBatch.transcriptions.length
          });

          (async () => {
            // Format all batched transcriptions (instant, no animation)
            for (const batch of updatedBatch.transcriptions) {
              await formatTranscriptionInBackground(
                batch.text,
                targetClip!.id,
                false,
                false  // No animation
              );
            }

            // Clear batch
            setPendingBatch({ clipId: '', transcriptions: [] });

            // Update UI if viewing
            if (selectedPendingClip?.id === targetClip!.id) {
              setSelectedPendingClip(null);
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
            if (selectedPendingClip?.id === targetClip.id) {
              setSelectedPendingClip(null);
              const updated = getClips().find(c => c.id === targetClip.id);
              if (updated) setSelectedClip(updated);
            }

            // Generate title
            const clip = getClips().find(c => c.id === targetClip.id);
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
  }, [
    transcription,
    isTranscribing,
    isFormatting,
    recordNavState,
    clips,
    currentClipId,
    isAppendMode,
    appendBaseContent,
    selectedClip,
    audioId,
    isFirstTranscription,
    pendingBatch,
    selectedPendingClip,
    isFirstPendingForClip,
    countRemainingPending,
    formatTranscriptionInBackground,
    generateTitleInBackground,
    resetRecording,
    refreshClips,
    createClip,
    updateClip,
    getNextRecordingNumber,
    setIsFirstTranscription,
    setCurrentClipId
  ]);
  // NOTE: recordNavState NOT in dependencies - only read as context

  // Handle transcription errors and save audioId for retry
  useEffect(() => {
    if (transcriptionError && transcriptionError !== 'offline' && transcriptionError !== 'network-retry') {
      // Definitive failure (not offline or network-retry)
      log.error('Definitive transcription failure', { error: transcriptionError });

      // Save audioId, duration, and error with clip for manual retry
      if (audioId && currentClipId) {
        log.info('Status transition', {
          clipId: currentClipId,
          from: 'transcribing',
          to: 'failed',
          trigger: 'transcription-error',
          error: transcriptionError
        });

        updateClip(currentClipId, {
          audioId: audioId,
          duration: formatDuration(duration),
          status: 'failed',
          transcriptionError: transcriptionError
        });
        refreshClips();
      }

      setShowErrorToast(true);

      // If append mode with existing content, stay in complete (can still use buttons)
      // If new clip (no content), go back to record
      if (isAppendMode && appendBaseContent) {
        setRecordNavState('complete');
        log.debug('Append failed - staying in complete state to preserve existing content access');
      } else {
        setRecordNavState('record');
      }
    } else if (transcriptionError === 'offline' || transcriptionError === 'network-retry') {
      // Offline OR entering interval retry mode - save as pending
      log.info(transcriptionError === 'offline'
        ? 'Offline - clip saved as pending'
        : 'Network retry - clip saved as pending');

      if (audioId) {
        let clipIdToUpdate = currentClipId;

        // For NEW recordings, we need to CREATE a clip first
        // (Normally clip creation happens in success path, but offline = no success path yet)
        if (!currentClipId && !isAppendMode) {
          const nextNumber = getNextRecordingNumber(getClips());
          // Create a minimal placeholder clip - content will be added after transcription succeeds
          const newClip = createClip('', nextNumber, '');
          clipIdToUpdate = newClip.id;
          setCurrentClipId(newClip.id);
          log.info('Created new clip for offline recording', {
            clipId: newClip.id,
            title: nextNumber
          });
        }

        if (clipIdToUpdate) {
          log.info('Status transition', {
            clipId: clipIdToUpdate,
            from: null,
            to: 'pending',
            trigger: 'offline-save'
          });

          // Count existing pending clips to determine new clip number
          const allClipsForDebug = getClips();
          console.log('🔍 DEBUG: All clips when counting:', allClipsForDebug.map(c => ({
            id: c.id.slice(-8),
            status: c.status,
            title: c.title,
            pendingClipTitle: c.pendingClipTitle
          })));
          const existingPendingCount = allClipsForDebug.filter(c =>
            c.status === 'pending' || c.status === 'transcribing'
          ).length;
          console.log('🔍 DEBUG: existingPendingCount =', existingPendingCount, '→ new clip will be', existingPendingCount + 1);
          const newClipName = `Clip ${String(existingPendingCount + 1).padStart(3, '0')}`;

          updateClip(clipIdToUpdate, {
            audioId: audioId,
            duration: formatDuration(duration),
            status: 'pending',
            pendingClipTitle: newClipName  // Store name immediately
          });
          refreshClips();

          // Create and set PendingClip to display ClipOffline immediately
          // Use getClips() directly to avoid triggering effect re-runs
          const updatedClip = getClips().find(c => c.id === clipIdToUpdate);
          if (updatedClip) {
            const pendingClip = clipToPendingClip(updatedClip);
            setSelectedPendingClip(pendingClip);
            log.debug('Set selectedPendingClip for offline display', { pendingClip });
          }
        }
      }

      // Show "Audio saved for later" toast (only for offline, not network-retry)
      if (transcriptionError === 'offline') {
        setShowAudioToast(true);
      }
      // For network-retry, user already saw error toast, don't duplicate

      // Same logic for offline: preserve existing content access if appending
      if (isAppendMode && appendBaseContent) {
        setRecordNavState('complete');
        log.debug('Offline append - staying in complete state to preserve existing content access');
      } else {
        setRecordNavState('record');
      }
    }
    // NOTE: 'clips' is intentionally excluded from dependencies to prevent infinite loop.
    // The effect calls refreshClips() which updates 'clips', which would trigger re-run.
    // We use getClips() directly inside the effect instead, which reads fresh data without re-triggering.
    // NOTE: 'currentClipId' is also excluded - the effect calls setCurrentClipId() inside,
    // which would cause the effect to re-run and overwrite the pending clip name.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptionError, audioId, duration, isAppendMode, appendBaseContent, refreshClips, formatDuration, clipToPendingClip]);

  // NOTE: Audio deletion and status cleanup now happens immediately in formatTranscriptionInBackground
  // Previously used a 10-second delay here, but that caused status to remain stuck at 'transcribing'
  // when user navigated away before the timeout completed (cleanup function would cancel it).
  // Immediate deletion is simpler and avoids the race condition.

  // Cleanup on unmount
  useEffect(() => {
    // Capture ref value INSIDE effect (React best practice for cleanup)
    const timer = processingTimerRef.current;
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  // ============================================
  // DERIVED STATE
  // ============================================

  // Determine ClipRecordScreen state
  const getRecordScreenState = (): 'recording' | 'transcribed' | 'offline' => {
    // Viewing a specific pending clip (waiting/transcribing)
    if (selectedPendingClip) return 'offline';
    // Viewing a transcribed clip (from selected clip or new transcription)
    if (transcription || selectedClip?.content) return 'transcribed';
    // Default: recording state (empty screen, ready to record)
    return 'recording';
  };

  // NOTE: isOnline will be useful in future for:
  // - Auto-triggering transcription when going from offline→online
  // - Updating clip status: 'waiting' → 'transcribing'
  // But it should NOT control which content is displayed

  // Get pending clips to display (either selected one or all pending)
  const getDisplayPendingClips = (): PendingClip[] => {
    if (selectedPendingClip) {
      // Viewing a single pending clip
      return [selectedPendingClip];
    }
    // Show all pending clips
    return pendingClips;
  };

  // Should RecordBar be hidden?
  const shouldHideRecordBar = isSearchActive;

  return (
    <>
      <div className={`master-screen ${className} ${styles.container}`}>
        {/* Toast Notifications */}
        <ToastNotification
          isVisible={showCopyToast}
          onDismiss={handleDismissToast}
          type="copy"
          text={copyToastText}
        />

        <ToastNotification
          isVisible={showErrorToast}
          onDismiss={() => setShowErrorToast(false)}
          type="error"
          text={transcriptionError || 'No audio recorded'}
        />

        <ToastNotification
          isVisible={showAudioToast}
          onDismiss={() => setShowAudioToast(false)}
          type="audio"
        />

        {/* Screen Container - Slides between screens */}
        <div className="screen-container">
          {/* Home Screen - Slides out left when record is active */}
          <div className={`screen-slide home-screen ${activeScreen === 'home' ? 'active' : ''}`}>
            <ClipHomeScreen
              clips={clips}
              onClipClick={handleClipClick}
              onRecordClick={handleRecordClick}
              onSearchActiveChange={setIsSearchActive}
              onClipsChange={refreshClips}
            />
          </div>

          {/* Record Screen - Slides in from right */}
          <div className={`screen-slide record-screen ${activeScreen === 'record' ? 'active' : ''}`}>
            <ClipRecordScreen
              state={getRecordScreenState()}
              contentBlocks={contentBlocks}
              selectedClip={selectedClip || undefined}
              pendingClips={getDisplayPendingClips()}
              onBackClick={handleBackClick}
              onNewClipClick={handleNewClipClick}
              onNetworkChange={(status) => setIsOnline(status === 'online')}
              onTranscribeClick={handleSmartRetry}
            />
          </div>
        </div>

        {/* Record Bar - Fixed at bottom, persists across screen transitions */}
        <div className={`record-bar ${shouldHideRecordBar ? 'hidden' : ''}`}>
          <RecordNavBarVarMorphing
            navState={recordNavState}
            variant={animationVariant}
            onRecordClick={handleRecordClick}
            onCloseClick={handleCloseClick}
            onCopyClick={handleCopyClick}
            onDoneClick={handleDoneClick}
            onStructureClick={handleStructureClick}
            audioAnalyser={audioAnalyser}
          />
        </div>
      </div>

      <style jsx>{`
        /* ============================================
           MASTER SCREEN - Full simulated phone container
           Desktop: Fixed 393×852px
           Mobile: Full viewport
           ============================================ */
        
        .master-screen {
          /* Layout */
          display: flex;
          flex-direction: column;
          position: relative;
          
          /* Desktop: Fixed phone dimensions */
          width: 393px;
          height: 852px;
          min-height: 852px;
          max-height: 852px;
          
          background: var(--ClipBg);
          border-radius: 8px;
          
          /* Prevent content overflow */
          overflow: hidden;
        }
        
        /* Mobile: Full viewport */
        @media (max-width: 768px) {
          .master-screen {
            width: 100%;
            height: 100vh;
            min-height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }
        }
        
        /* ============================================
           SCREEN CONTAINER - Holds both screens for sliding
           ============================================ */
        
        .screen-container {
          /* Fill space above RecordBar */
          flex: 1;
          min-height: 0;
          position: relative;
          overflow: hidden;
        }
        
        /* ============================================
           SCREEN SLIDES - Individual screen wrappers
           ============================================ */
        
        .screen-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          
          /* Slide animation */
          transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        
        /* Home screen: Default position, slides left when inactive */
        .screen-slide.home-screen {
          transform: translateX(0);
        }
        
        .screen-slide.home-screen:not(.active) {
          transform: translateX(-100%);
        }
        
        /* Record screen: Starts right, slides in when active */
        .screen-slide.record-screen {
          transform: translateX(100%);
        }
        
        .screen-slide.record-screen.active {
          transform: translateX(0);
        }
        
        /* ============================================
           RECORD BAR - Fixed at bottom
           ============================================ */
        
        .record-bar {
          /* Layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          padding: 24px 12px 0px;
          gap: 10px;
          
          /* Dimensions */
          width: 100%;
          height: 160px;
          
          /* Styling */
          background: var(--ClipRecTrayBg);
          border-radius: 16px 16px 0px 0px;
          
          /* Fixed at bottom */
          flex: none;
          
          /* Clip content when collapsing */
          overflow: hidden;
          
          /* Animation - height collapse + opacity fade */
          opacity: 1;
          transition: 
            height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            padding 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Hidden state - collapses height and fades out */
        .record-bar.hidden {
          height: 0;
          padding: 0;
          opacity: 0;
          pointer-events: none;
        }
        
        /* ============================================
           ACCESSIBILITY
           ============================================ */
        
        @media (prefers-reduced-motion: reduce) {
          .screen-slide,
          .record-bar {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
};

// Default export
export default ClipMasterScreen;

