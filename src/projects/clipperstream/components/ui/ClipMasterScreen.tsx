import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { ClipHomeScreen } from './ClipHomeScreen';
import { ClipRecordScreen, PendingClip } from './ClipRecordScreen';
import { RecordNavBarVarMorphing, RecordNavState } from './mainvarmorph';
import { ToastNotification } from './ClipToast';
import { useClipRecording, TranscriptionResult } from '../../hooks/useClipRecording';
// PHASE 4 (v2.6.0): Replace useClipState with Zustand
import { useClipStore, Clip, ClipStatus } from '../../store/clipStore';
import { useOfflineRecording } from '../../hooks/useOfflineRecording';
// PHASE 6 (v2.6.0): Auto-generate parent titles
import { useParentTitleGenerator } from '../../hooks/useParentTitleGenerator';
import { deleteAudio, clearAllAudio, getAudio } from '../../services/audioStorage';
import { generateClipId } from '../../utils/id';
import { today } from '../../utils/date';
import { logger } from '../../utils/logger';

const log = logger.scope('ClipMasterScreen');

// ClipMasterScreen Component
// Parent orchestrator that manages screen transitions and shared RecordBar
// Handles: Screen switching (home ↔ record), RecordBar state, navigation
//
// ARCHITECTURE:
// ┌─────────────────────────────────────┐
// │ Screen Container (slide animation)  │
// │  ┌─────────────┐  ┌─────────────┐   │
// │  │ClipHome     │↔ │ClipRecord   │   │
// │  │Screen       │  │Screen       │   │
// │  └─────────────┘  └─────────────┘   │
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

  // Recording mode tracking - MUST be declared before Zustand selector that uses it
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);
  const [isAppendMode, setIsAppendMode] = useState(false);
  const [appendBaseContent, setAppendBaseContent] = useState<string>('');

  // PHASE 4 (v2.6.0): Zustand store replaces useClipState hook
  const clips = useClipStore((state) => state.clips);
  // Industry standard: Derive selectedClip from currentClipId + clips array
  const selectedClip = useClipStore(state =>
    currentClipId ? state.clips.find(c => c.id === currentClipId) : null
  );
  // REMOVED: setSelectedClip (no longer needed - selector handles updates)
  const addClip = useClipStore((state) => state.addClip);
  const updateClip = useClipStore((state) => state.updateClip);
  const deleteClip = useClipStore((state) => state.deleteClip);
  const getClipById = useClipStore((state) => state.getClipById);
  
  // Wrapper functions to match old API (backwards compat)
  const createNewClip = useCallback((content: string, title: string, formattedText: string) => {
    const newClip: Clip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      title,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: null,
      content,
      rawText: content,
      formattedText,
      currentView: 'formatted',
      createdAt: Date.now()
    };
    addClip(newClip);
    return newClip;
  }, [addClip]);
  
  const updateClipById = useCallback((clipId: string, updates: Partial<Clip>) => {
    updateClip(clipId, updates);
    return getClipById(clipId) || null;  // v2.6.0: Return null instead of undefined for type compatibility
  }, [updateClip, getClipById]);
  
  const deleteClipById = useCallback((clipId: string) => {
    deleteClip(clipId);
  }, [deleteClip]);

  // PHASE 5 (v2.6.0): Move global flags to Zustand store
  // v2.7.0: activeHttpClipId moved to line 154 (used in useMemo for selectedPendingClips)
  const setActiveHttpClipId = useClipStore((state) => state.setActiveHttpClipId);
  const activeTranscriptionParentId = useClipStore((state) => state.activeTranscriptionParentId);
  const setActiveTranscriptionParentId = useClipStore((state) => state.setActiveTranscriptionParentId);
  const activeFormattingClipId = useClipStore((state) => state.activeFormattingClipId);
  const setActiveFormattingClipId = useClipStore((state) => state.setActiveFormattingClipId);
  
  // Derived: isFormatting (for backwards compat with existing code)
  const isFormatting = activeFormattingClipId !== null;
  const setIsFormatting = useCallback((value: boolean) => {
    // When setting true, we don't know which clip, so just use a placeholder
    // When setting false, clear it
    setActiveFormattingClipId(value ? 'formatting' : null);
  }, [setActiveFormattingClipId]);

  // PHASE 2: Smart counter - reads from storage (survives page refresh)
  const getNextPendingClipNumber = useCallback(() => {
    // v2.6.0: Use Zustand getState() for fresh data without re-creating callback
    const allClips = useClipStore.getState().clips;

    // Extract existing pending clip numbers
    const existingNumbers = allClips
      .filter(c => c.pendingClipTitle)
      .map(c => {
        const match = c.pendingClipTitle?.match(/Clip (\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);

    // Find highest number, increment (wraps at 100)
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNumber = (maxNumber % 100) + 1;

    return `Clip ${String(nextNumber).padStart(3, '0')}`;
  }, []);

  // Current active screen
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(initialScreen);

  // RecordBar state (managed here since it persists across screens)
  const [recordNavState, setRecordNavState] = useState<RecordNavState>('record');

  // DELETED - now returned from useClipState hook

  // v2.7.0: Zustand selector for selectedPendingClips (replaces useState)
  // Subscribe to activeHttpClipId from Zustand (clips already declared at line 69)
  const activeHttpClipId = useClipStore((state) => state.activeHttpClipId);

  // Derive selectedPendingClips using useMemo (prevents infinite loop)
  // Only recomputes when currentClipId, clips, or activeHttpClipId change
  const selectedPendingClips = useMemo(() => {
    // If no parent selected, return empty array
    if (!currentClipId) return [];

    // Find all children of current parent
    const children = clips
      .filter(c => c.parentId === currentClipId)
      .sort((a, b) => {
        // Sort by creation time (oldest first = recording order)
        const timestampA = parseInt(a.id.split('-')[1], 10) || 0;
        const timestampB = parseInt(b.id.split('-')[1], 10) || 0;
        return timestampA - timestampB;
      });

    // Convert Clip → PendingClip format (matches PendingClip interface)
    return children.map(child => ({
      id: child.id,
      title: child.pendingClipTitle || 'Pending',
      time: child.duration || '0:00',
      status: (child.status === 'transcribing' ? 'transcribing' : 'waiting') as 'waiting' | 'transcribing',
      isActiveRequest: activeHttpClipId === child.id
    }));
  }, [currentClipId, clips, activeHttpClipId]);

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
  const [errorToastMessage, setErrorToastMessage] = useState('No audio detected');
  const [showAudioToast, setShowAudioToast] = useState(false);
  const hasShownTranscriptionToast = useRef(false);

  // Recording hook - handles audio recording and transcription
  const {
    isRecording,
    audioBlob,
    audioId,
    duration,
    audioAnalyser,
    isTranscribing,
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

  // Abort controller for cancelling HTTP requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================
  // DERIVED STATE - Content for clipboard
  // ============================================

  /**
   * Content to copy - respects raw/formatted view toggle
   * When viewing an existing clip, copies what the user is looking at
   */
  const copyableContent = useMemo(() => {
    if (!selectedClip) return '';
    return selectedClip.currentView === 'raw'
      ? selectedClip.rawText
      : selectedClip.formattedText;
  }, [selectedClip]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================

  // Navigate from home to record screen (when clicking a clip)
  const handleClipClick = useCallback((clipId: string) => {
    // v2.6.0: Use clips from Zustand (already subscribed)
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    // v2.4: ALWAYS set currentClipId so subsequent recordings append correctly
    setCurrentClipId(clipId);

    // v2.4: ALWAYS check for children (fixes Bug #3 - pending clips disappear)
    const children = clips.filter(c => c.parentId === clipId);

    if (children.length > 0) {
      // v2.7.0: selectedPendingClips now uses Zustand selector, no manual set needed
      log.info('Loaded parent with children', {
        parentId: clipId,
        childCount: children.length
      });
    }

    if (clip.content) {
      // Transcribed clip - show in complete state
      // ✅ REMOVED: setSelectedClip(clip) - selector auto-fetches via currentClipId
      setIsAppendMode(false);
      setAppendBaseContent('');
      resetRecording();
      setAnimationVariant('fade');
      setRecordNavState('complete');
      setActiveScreen('record');
    } else {
      // Pending clip - show in waiting state
      // ✅ REMOVED: setSelectedClip(null) - selector returns null when currentClipId is null
      setAnimationVariant('fade');
      setRecordNavState('record');
      setActiveScreen('record');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips, isActiveRequest, currentClipId, resetRecording]); // Only run when clips change

  // Navigate back from record to home screen (via "Clips" button only)
  const handleBackClick = useCallback(() => {
    // Navigate back from record to home screen (via "Clips" button only)
    // Reset all recording state and return to home
    setIsAppendMode(false);
    setCurrentClipId(null);  // v2.3.1: Clear parent-child context (selector auto-clears)
    setAppendBaseContent('');
    // v2.7.0: selectedPendingClips cleared automatically when currentClipId = null
    // ✅ REMOVED: setSelectedClip(null) - selector returns null when currentClipId is null
    resetRecording(); // This clears transcription from the hook
    setAnimationVariant('fade');  // Use fade for smooth transition to home
    setRecordNavState('record'); // Reset to default record state for next time
    setActiveScreen('home');
    
    log.info('Navigated to home screen (cleared pending context)', {
      clearedContext: true
    });
  }, [resetRecording]);

  // Start fresh recording (via pencil/NewClip button in ClipRecordHeader)
  // Stays on ClipRecordScreen, just resets to record state
  const handleNewClipClick = useCallback(() => {
    setIsAppendMode(false);
    setCurrentClipId(null);  // v2.3.1: Clear context (selector auto-clears)
    setAppendBaseContent('');
    // v2.7.0: selectedPendingClips cleared automatically when currentClipId = null
    // ✅ REMOVED: setSelectedClip(null) - selector returns null when currentClipId is null
    resetRecording();
    setAnimationVariant('fade');  // Use fade for direct transition back to record
    setRecordNavState('record');
    
    log.info('Starting new recording (cleared pending context)', {
      clearedContext: true
    });
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
      setAnimationVariant('morph'); // CRITICAL: Reset to morph for recording animation

      // If currently viewing raw text, switch back to formatted view
      // Recording always produces formatted output, so switch view to match
      if (selectedClip.currentView === 'raw') {
        updateClipById(selectedClip.id, { currentView: 'formatted' });
        // ✅ REMOVED: setSelectedClip(updatedClip) - selector will pick up the change automatically
      }

      setTimeout(() => startRecordingHook(), 200);
    }

    // ✅ NEW Case 2.5: Recording from pending clip (no content yet, but has audioId)
    else if (activeScreen === 'record' && selectedPendingClips.length > 0) {
      // Keep currentClipId - we're adding to the SAME clip file
      // This allows multiple pending recordings in one file
      setIsAppendMode(true);
      setCurrentClipId(selectedPendingClips[0].id);
      setAppendBaseContent('');
      log.debug('Recording from pending clip (adding successive recording)', {
        clipId: selectedPendingClips[0].id,
        pendingTitle: selectedPendingClips[0].title
      });
      setTimeout(() => startRecordingHook(), 200);
    }

    // Case 3: Recording from record screen (no existing content AND no pending clip) → NEW clip
    else if (selectedPendingClips.length === 0) {  // ← ADDED CONDITION: only create new if no pending clip
      setIsAppendMode(false);
      setCurrentClipId(null);
      setAppendBaseContent('');
      setAnimationVariant('morph'); // CRITICAL: Ensure morph variant for recording

      setTimeout(() => startRecordingHook(), 200);
    }
  };

  const handleCloseClick = useCallback(() => {
    // Context 1: User is actively recording
    if (recordNavState === 'recording') {
      stopRecordingHook();  // Stop recording immediately
      resetRecording();     // Discard audio blob
      
      // If appending to existing clip, stay on record screen viewing that clip
      if (isAppendMode && currentClipId) {
        setRecordNavState('record');
        // Keep currentClipId - user stays viewing the clip they were appending to
        // Result: Recording canceled, stays on record screen
      } else {
        // New recording - go back to home screen
        setActiveScreen('home');
        setRecordNavState('record');
        setCurrentClipId(null);
        // Result: Recording canceled, nothing saved, return to home
      }
      return;
    }

    // Context 2: Clip is processing (transcribing or formatting)
    if (recordNavState === 'processing') {
      // Cancel the processing (if AbortController exists)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();  // Cancel HTTP requests
      }

      // If clip was created (has ID), mark as failed
      if (currentClipId) {
        const clip = getClipById(currentClipId);
        if (clip && (clip.status === 'transcribing' || clip.status === 'formatting')) {
          updateClip(currentClipId, { status: 'failed' });
        }
      }

      // If appending to existing clip, stay on record screen viewing that clip
      if (isAppendMode && currentClipId) {
        setRecordNavState('record');
        resetRecording();
        // Keep currentClipId - user stays viewing the clip they were appending to
        // Result: Processing canceled, stays on record screen
      } else {
        // New recording - go back to home screen
        setActiveScreen('home');
        setRecordNavState('record');
        setCurrentClipId(null);
        resetRecording();
        // Result: Processing canceled, clip saved as failed, return to home
      }
      return;
    }

    // Context 3: Viewing completed clip (has text)
    if (recordNavState === 'complete' && selectedClip) {
      setActiveScreen('home');
      setRecordNavState('record');
      // ✅ REMOVED: setSelectedClip(null) - selector returns null when currentClipId is null
      setCurrentClipId(null);
      // Result: Just closes, clip state preserved in Zustand
      return;
    }

    // Context 4: Empty record screen (no clip selected, not recording)
    if (recordNavState === 'record' && !selectedClip) {
      setActiveScreen('home');
      // Result: Just closes, nothing to save
      return;
    }

    // Context 5: Viewing pending clip (no text yet)
    if (recordNavState === 'record' && selectedClip &&
        (selectedClip.status === 'pending-child' || selectedClip.status === 'pending-retry')) {
      setActiveScreen('home');
      setRecordNavState('record');
      // ✅ REMOVED: setSelectedClip(null) - selector returns null when currentClipId is null
      // Result: Just closes, pending clip preserved in Zustand
      return;
    }

    // Default: Just close
    setActiveScreen('home');
    setRecordNavState('record');
    // ✅ REMOVED: setSelectedClip(null) - selector returns null when currentClipId is null
    setCurrentClipId(null);
  }, [recordNavState, currentClipId, selectedClip, isAppendMode, stopRecordingHook, resetRecording, getClipById, updateClip]);

  const handleDoneClick = async () => {
    setRecordNavState('processing');

    // 1. Stop recording and wait for result
    const { audioBlob: recordedBlob, audioId: recordedAudioId, duration: recordedDuration } = await stopRecordingHook();

    // 2. Validate audio (Bug 3 fix: added duration check)
    if (!recordedBlob || recordedBlob.size < 100 || recordedDuration < 1) {
      setShowErrorToast(true);
      setRecordNavState('record');
      return;
    }

    // 3. Check network status
    const isOnline = navigator.onLine;

    if (!isOnline) {
      handleOfflineRecording({
        audioId: recordedAudioId!,
        duration: recordedDuration,
        currentClipId
      });

      // Check if viewing clip with content
      const currentClip = currentClipId ? getClipById(currentClipId) : null;
      const hasContent = currentClip && currentClip.content && currentClip.content.length > 0;
      setRecordNavState(hasContent ? 'complete' : 'record');
      return;
    }

    // 4. Transcribe and classify error (Bug 4 fix: use TranscriptionResult)
    let transcriptionResult: TranscriptionResult;
    try {
      transcriptionResult = await transcribeRecording(recordedBlob);
    } catch (error) {
      console.error('Transcription error:', error);
      // Fallback to validation error if hook throws unexpectedly
      transcriptionResult = { text: '', error: 'validation' };
    }

    const { text: rawText, error: transcriptionError } = transcriptionResult;

    // 5. Route based on error type (Bug 4 fix: classify errors)
    if (!rawText || rawText.length === 0) {
      // Network or offline errors → Create pending clip
      if (transcriptionError === 'network' || transcriptionError === 'offline') {
        handleOfflineRecording({
          audioId: recordedAudioId!,
          duration: recordedDuration,
          currentClipId
        });

        // Check if viewing clip with content
        const currentClip = currentClipId ? getClipById(currentClipId) : null;
        const hasContent = currentClip && currentClip.content && currentClip.content.length > 0;
        setRecordNavState(hasContent ? 'complete' : 'record');
        return;
      }

      // Validation or server errors → Show error toast, stay in record state
      if (transcriptionError === 'validation' || transcriptionError === 'server-error') {
        setShowErrorToast(true);
        setRecordNavState('record');
        return;
      }

      // Fallback: treat as validation error
      setShowErrorToast(true);
      setRecordNavState('record');
      return;
    }

    // 6. Create clip or append (rawText is now guaranteed non-empty)
    if (isAppendMode && currentClipId) {
      const existingClip = getClipById(currentClipId);
      if (existingClip) {
        // Update Zustand - only update rawText, content updated when formatting completes
        updateClip(currentClipId, {
          rawText: existingClip.rawText + ' ' + rawText,
          status: 'formatting',
          createdAt: Date.now()  // Update timestamp so clip moves to top on home screen
        });

        formatTranscriptionInBackground(currentClipId, rawText, true);
      }
    } else {
      const newClip: Clip = {
        id: generateClipId(),
        createdAt: Date.now(),
        title: useClipStore.getState().nextRecordingTitle(),
        date: today(),
        rawText: rawText,
        formattedText: '',
        content: '',  // Empty until formatting completes
        status: 'formatting',
        currentView: 'formatted'
      };

      addClip(newClip);
      // ✅ REMOVED: setSelectedClip(newClip) - selector will auto-find via currentClipId
      setCurrentClipId(newClip.id);

    // Background jobs
    formatTranscriptionInBackground(newClip.id, rawText, false);
    generateTitleInBackground(newClip.id, rawText);
  }

  // ✅ REMOVED: setRecordNavState('complete') - moved to formatTranscriptionInBackground
  resetRecording();
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

  // DELETED - now handled inside useClipState hook

  // DELETED - now returned from useClipState hook

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

    updateClipById(selectedClip.id, {
      currentView: newView
    });

    // ✅ REMOVED: setSelectedClip(updatedClip) - selector will pick up the change
    log.info('View toggled', {
      clipId: selectedClip.id,
      newView
    });

    // NO auto-copy on toggle (per requirements)
  }, [selectedClip]);

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
    }        );

        updateClipById(clipId, {
          status: 'transcribing',
          transcriptionError: undefined
        });

    // Set context for transcription completion
    setCurrentClipId(clip.id);
    setIsAppendMode(false);
    setRecordNavState('processing');

    // Get audio from IndexedDB and retry transcription
    try {
      // v2.5.3 FIX: Track which parent should show spinner
      const parentId = clip.parentId || clipId;
      setActiveTranscriptionParentId(parentId);

      const audioBlob = await getAudio(clip.audioId);
      if (!audioBlob) {
        throw new Error('Audio not found in IndexedDB');
      }

      log.debug('Audio retrieved, starting transcription', {
        audioId: clip.audioId,
        size: audioBlob.size
      });

      // v2.5.4 CRITICAL FIX: Track THIS clip doing HTTP
      log.debug('Setting activeHttpClipId for manual retry', {
        clipId,
        parentId
      });
      setActiveHttpClipId(clipId);

      try {
        // Transcribe using retrieved blob (HTTP happens here)
        await transcribeRecording(audioBlob);

        // Success - transcription will be handled by existing useEffect
        log.info('Manual retry transcription initiated', {
          clipId,
          audioId: clip.audioId
        });

      } finally {
        // v2.5.4 CRITICAL FIX: Clear HTTP tracking immediately after HTTP completes
        log.debug('Clearing activeHttpClipId', {
          clipId,
          reason: 'HTTP complete'
        });
        setActiveHttpClipId(null);
      }

    } catch (error) {
      log.error('Retry failed', { clipId, error });

      log.info('Status transition', {
        clipId,
        from: 'transcribing',
        to: 'failed',
        trigger: 'manual-retry-error'
      });

      updateClipById(clipId, {
        status: 'failed',
        transcriptionError: error instanceof Error ? error.message : 'Retry failed'
      });
      setRecordNavState('record');
    } finally {
      // v2.5.3 FIX: Clear parent tracking
      setActiveTranscriptionParentId(null);
    }
  }, [clips]);

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
    } else if (clip.status === 'failed' || clip.status === 'pending-retry') {
      // Failed or pending-retry clip - retry from IndexedDB
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
      updateClipById(clipId, { title });
      // ✅ REMOVED: Manual sync - if viewing this clip, selector will auto-update
    } catch (error) {
      // console.timeEnd('⏱️ TITLE GENERATION');
      log.warn('Title generation failed', error);
      // Keep the "Clip 001" fallback title - app continues working
    }
  }, [currentClipId]);

  // Background text formatting with AI
  // NOW: This function also updates contentBlocks and transitions to complete state
  const formatTranscriptionInBackground = useCallback(async (
    clipId: string,
    rawText: string,
    isAppending: boolean
  ) => {
    const clip = getClipById(clipId);
    if (!clip) {
      console.warn('[Formatting] Clip not found:', clipId);
      return;
    }

    console.info('[Formatting] Starting formatting for clip:', clipId, '| isAppending:', isAppending);

    try {
      // Get context if appending
      const context = isAppending ? clip.formattedText : undefined;

      // Call API
      const response = await fetch('/api/clipperstream/format-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawText, 
          existingFormattedContext: context 
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const formattedText = data.formattedText || data.formatted || rawText;

      console.info('[Formatting] Received formatted text for clip:', clipId);

      // Update Zustand
      updateClip(clipId, {
        formattedText: isAppending
          ? clip.formattedText + ' ' + formattedText
          : formattedText,
        content: isAppending
          ? clip.content + ' ' + formattedText
          : formattedText,
        status: null  // Done!
      });

      console.info('[Formatting] Updated clip content in Zustand for clip:', clipId);

      // Switch nav bar to complete state now that formatted text is ready
      console.info('[Formatting] Calling setRecordNavState(complete) for clip:', clipId);
      setRecordNavState('complete');

      // Delete audio from IndexedDB
      if (clip.audioId) {
        await deleteAudio(clip.audioId);
        updateClip(clipId, { audioId: undefined });
      }

      // Auto-copy formatted text to clipboard
      const updatedClip = getClipById(clipId);
      if (updatedClip) {
        const textToCopy = updatedClip.currentView === 'raw'
          ? updatedClip.rawText
          : updatedClip.formattedText;
        navigator.clipboard.writeText(textToCopy);
        setShowCopyToast(true);
      }

    } catch (error) {
      console.error('[Formatting] Error formatting clip:', clipId, '| Error:', error);
      // Fallback: use raw text as formatted
      updateClip(clipId, {
        formattedText: clip.rawText,
        content: clip.rawText,
        status: null
      });

      console.info('[Formatting] Using fallback (raw text) for clip:', clipId);

      // Switch nav bar to complete state (fallback text is displayed)
      console.info('[Formatting] Calling setRecordNavState(complete) after fallback for clip:', clipId);
      setRecordNavState('complete');
    }
  }, [getClipById, updateClip, selectedClip, setShowCopyToast, setRecordNavState, deleteAudio]);

  /**
   * Format child clip transcription (for auto-retry)
   * NO clipboard copy, NO nav state changes
   * WITH context support for smart paragraph breaks
   */
  const formatChildTranscription = useCallback(async (
    clipId: string,
    rawText: string,
    context?: string  // ← Accumulated formatted text for AI context (API slices last 500 chars)
  ): Promise<string> => {
    const clip = getClipById(clipId);
    if (!clip) {
      console.warn('[FormatChild] Clip not found:', clipId);
      return rawText;  // Fallback
    }

    console.log('[FormatChild] Starting for:', clip.pendingClipTitle, '| Has context:', !!context);

    try {
      // Call formatting API
      // Context auto-sliced to last 500 chars by API (see textFormatter.ts line 93)
      // AI uses this for smart paragraph breaks and pronoun resolution
      const response = await fetch('/api/clipperstream/format-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          existingFormattedContext: context  // ← Pass full context (API slices last 500)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const formattedText = data.formattedText || data.formatted || rawText;

      console.log('[FormatChild] Success:', clip.pendingClipTitle);

      // Update child with formatted text
      updateClip(clipId, {
        formattedText: formattedText,
        content: formattedText,
        status: null  // Complete
      });

      // ⚠️ NO clipboard copy (per user requirement - document not focused during auto-retry)
      // ⚠️ NO setRecordNavState (not relevant for auto-retry)

      return formattedText;

    } catch (error) {
      console.error('[FormatChild] Failed:', clip.pendingClipTitle, error);

      // Fallback: use raw text
      updateClip(clipId, {
        formattedText: rawText,
        content: rawText,
        status: null
      });

      return rawText;
    }
  }, [getClipById, updateClip]);

  /**
   * Process single child clip (transcribe + format)
   * Returns formatted text for accumulation
   */
  const processChild = useCallback(async (
    child: Clip,
    context?: string  // ← Accumulated formatted text for AI context
  ): Promise<{
    success: boolean;
    rawText: string;
    formattedText: string;
  }> => {
    console.log('[ProcessChild] Starting:', child.pendingClipTitle);

    try {
      // Step 1: Get audio from IndexedDB
      const audioBlob = await getAudio(child.audioId!);
      if (!audioBlob) {
        console.warn('[ProcessChild] Audio not found for:', child.id);
        updateClip(child.id, {
          status: 'failed',
          transcriptionError: 'Audio not found in storage'
        });
        return { success: false, rawText: '', formattedText: '' };
      }

      // Step 2: Update status to transcribing
      updateClip(child.id, { status: 'transcribing' });

      // Step 3: Transcribe (uses existing retry mechanism)
      // Retry implementation in useClipRecording.ts lines 410-444:
      //   - Attempts 1-3: Rapid fire (no waits between attempts)
      //   - Attempts 4+: Interval waits (1min, 2min, 4min, 5min cycle repeats)
      // TODO Phase 4: Extract retry logic to shared function for auto-retry
      //   - Track clip.retryCount and clip.nextRetryTime for UI
      //   - Coordinate spinner state (stops during interval waits)
      const transcriptionResult = await transcribeRecording(audioBlob);
      const { text: rawText, error: transcriptionError } = transcriptionResult;

      if (!rawText || rawText.length === 0) {
        console.warn('[ProcessChild] Transcription failed:', child.pendingClipTitle);
        updateClip(child.id, {
          status: 'failed',
          transcriptionError: transcriptionError === 'validation'
            ? `No audio detected in ${child.pendingClipTitle}`
            : 'Transcription failed'
        });
        return { success: false, rawText: '', formattedText: '' };
      }

      // Step 4: Store raw text
      updateClip(child.id, {
        rawText: rawText,
        content: rawText,  // Temporary (will be replaced with formatted)
        status: 'formatting'
      });

      // Step 5: Format with context (returns formatted text)
      const formattedText = await formatChildTranscription(child.id, rawText, context);

      // Step 6: Delete audio from IndexedDB
      if (child.audioId) {
        await deleteAudio(child.audioId);
        updateClip(child.id, { audioId: undefined });
      }

      console.log('[ProcessChild] Success:', child.pendingClipTitle);

      return {
        success: true,
        rawText: rawText,
        formattedText: formattedText
      };

    } catch (error) {
      console.error('[ProcessChild] Error:', child.pendingClipTitle, error);
      updateClip(child.id, {
        status: 'failed',
        transcriptionError: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, rawText: '', formattedText: '' };
    }
  }, [getAudio, updateClip, transcribeRecording, deleteAudio, formatChildTranscription]);

  /**
   * Process all children for a parent (implements user's batch strategy)
   * Strategy:
   *   - 1 child: Show immediately
   *   - 2 children: Show first, show second
   *   - 3+ children: Show first, accumulate rest, show batch
   */
  const processParentChildren = useCallback(async (
    parentId: string,
    children: Clip[]
  ) => {
    // Check if parent exists (orphaned children cleanup)
    const parent = getClipById(parentId);
    if (!parent) {
      console.warn('[ProcessChildren] Parent deleted during processing, cleaning up orphaned children');

      // Clean up orphaned children (parent was deleted while they were pending)
      for (const child of children) {
        console.log('[ProcessChildren] Deleting orphaned child:', child.id);
        deleteClip(child.id);

        // Delete associated audio blob
        if (child.audioId) {
          await deleteAudio(child.audioId);
        }
      }

      return;
    }

    console.log('[ProcessChildren] Starting for parent:', parentId, '| Children:', children.length);

    // Base content (in case parent already has content from previous sessions)
    let accumulatedRawText = parent.rawText || '';
    let accumulatedFormattedText = parent.formattedText || '';
    let accumulatedContent = parent.content || '';

    // Separate first child from rest
    const [firstChild, ...restChildren] = children;

    // STEP 1: Process first child (show immediately)
    if (firstChild) {
      console.log('[ProcessChildren] Processing FIRST child:', firstChild.pendingClipTitle);

      // No context for first child (it's the beginning)
      const result = await processChild(firstChild, undefined);

      if (result.success) {
        // Merge first child into parent
        accumulatedRawText += (accumulatedRawText ? ' ' : '') + result.rawText;
        accumulatedFormattedText += (accumulatedFormattedText ? ' ' : '') + result.formattedText;
        accumulatedContent += (accumulatedContent ? ' ' : '') + result.formattedText;

        // Update parent with first child content (shows immediately)
        updateClip(parentId, {
          rawText: accumulatedRawText,
          formattedText: accumulatedFormattedText,
          content: accumulatedContent,
          createdAt: Date.now()  // Move to top
        });

        console.log('[ProcessChildren] First child merged into parent:', firstChild.pendingClipTitle);

        // Delete first child
        deleteClip(firstChild.id);

        // Generate title after first clip (fire-and-forget, appears in background)
        // This matches online behavior: title from first clip's content
        // Robust for edge case: user goes offline after first clip completes
        const currentParent = getClipById(parentId);  // Refetch to avoid stale data
        if (currentParent && currentParent.title.startsWith('Recording ')) {
          console.log('[ProcessChildren] Generating title from first clip (background)');
          generateTitleInBackground(parentId, result.formattedText).catch(err => {
            console.error('[ProcessChildren] Title generation failed:', err);
          });
          // Don't await - title appears separately while rest of clips process
          // User sees: Title + Clip 001 text (remaining clips append later)
        }
      }
    }

    // STEP 2: Process remaining children (accumulate in memory, show batch)
    if (restChildren.length > 0) {
      console.log('[ProcessChildren] Processing BATCH of', restChildren.length, 'children');

      // Accumulate batch in memory (user's strategy)
      let batchRawText = '';
      let batchFormattedText = '';

      for (const child of restChildren) {
        console.log('[ProcessChildren] Processing batch child:', child.pendingClipTitle);

        // Pass accumulated formatted text as context (API slices last 500 chars)
        // Context = first child + previously processed batch children
        const contextForThisChild = accumulatedFormattedText + (batchFormattedText ? ' ' + batchFormattedText : '');
        const result = await processChild(child, contextForThisChild);

        if (result.success) {
          // Accumulate in memory (don't update parent yet)
          batchRawText += (batchRawText ? ' ' : '') + result.rawText;
          batchFormattedText += (batchFormattedText ? ' ' : '') + result.formattedText;

          console.log('[ProcessChildren] Accumulated:', child.pendingClipTitle);

          // Delete child after processing
          deleteClip(child.id);
        }
      }

      // Merge entire accumulated batch to parent at once
      accumulatedRawText += (accumulatedRawText ? ' ' : '') + batchRawText;
      accumulatedFormattedText += (accumulatedFormattedText ? ' ' : '') + batchFormattedText;
      accumulatedContent += (accumulatedContent ? ' ' : '') + batchFormattedText;

      updateClip(parentId, {
        rawText: accumulatedRawText,
        formattedText: accumulatedFormattedText,
        content: accumulatedContent,
        status: null,  // Complete
        createdAt: Date.now()
      });

      console.log('[ProcessChildren] Batch merged into parent');
    }

    console.log('[ProcessChildren] Completed parent:', parentId);
  }, [getClipById, updateClip, deleteClip, deleteAudio, generateTitleInBackground, processChild]);

  // v2.7.0: Auto-retry pending clips when network comes online
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[Auto-retry] Going online, checking for pending clips');

      const allClips = useClipStore.getState().clips;

      // Find all pending children
      const pendingChildren = allClips.filter(c =>
        c.audioId && c.status === 'pending-child'
      );

      if (pendingChildren.length === 0) {
        console.log('[Auto-retry] No pending clips to process');
        return;
      }

      // Group by parent ID
      const childrenByParent = new Map<string, Clip[]>();
      for (const child of pendingChildren) {
        if (!child.parentId) continue;
        const existing = childrenByParent.get(child.parentId) || [];
        childrenByParent.set(child.parentId, [...existing, child]);
      }

      console.log('[Auto-retry] Processing', childrenByParent.size, 'parents with pending clips');

      // Process each parent sequentially
      for (const [parentId, children] of childrenByParent.entries()) {
        const parent = allClips.find(c => c.id === parentId);
        if (!parent) {
          console.warn('[Auto-retry] Parent not found:', parentId);
          continue;
        }

        // Sort children by creation time (oldest first)
        const sortedChildren = children.sort((a, b) => {
          const timestampA = parseInt(a.id.split('-')[1], 10) || 0;
          const timestampB = parseInt(b.id.split('-')[1], 10) || 0;
          return timestampA - timestampB;
        });

        console.log('[Auto-retry] Processing parent:', parent.title, '| Children:', sortedChildren.length);

        // Process children for this parent
        await processParentChildren(parentId, sortedChildren);
      }

      console.log('[Auto-retry] Completed all parents');
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processParentChildren]);

  // ============================================================================
  // TRANSCRIPTION & OFFLINE HANDLERS
  // ============================================================================

  // PHASE 2.5: Offline recording handler (extracted)
  const { handleOfflineRecording } = useOfflineRecording({
    setCurrentClipId,
    // v2.7.0: setSelectedPendingClips removed (Zustand selector handles it)
    addClip,
    getClips: () => useClipStore.getState().clips
  });

  // PHASE 6 (v2.6.0): Auto-generate parent titles when all children complete
  useParentTitleGenerator({
    generateTitleInBackground
  });

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

        updateClipById(currentClipId, {
          audioId: audioId,
          duration: formatDuration(duration),
          status: 'failed',
          transcriptionError: transcriptionError
        });
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
      // PHASE 2.5: Offline/network-retry handler (extracted to useOfflineRecording hook)
      log.info(transcriptionError === 'offline'
        ? 'Offline - clip saved as pending'
        : 'Network retry - clip saved as pending');

      if (audioId) {
        handleOfflineRecording({
          audioId,
          duration,
          currentClipId
        });
      }

      // Show "Audio saved for later" toast (only for offline, not network-retry)
      if (transcriptionError === 'offline') {
        setShowAudioToast(true);
      }

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
  }, [transcriptionError, audioId, duration, isAppendMode, appendBaseContent, formatDuration, clipToPendingClip]);

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
    if (selectedPendingClips.length > 0) return 'offline';
    // Viewing a transcribed clip (from selected clip)
    if (selectedClip?.content) return 'transcribed';
    // Default: recording state (empty screen, ready to record)
    return 'recording';
  };

  // NOTE: isOnline will be useful in future for:
  // - Auto-triggering transcription when going from offline→online
  // - Updating clip status: 'waiting' → 'transcribing'
  // But it should NOT control which content is displayed

  // Get pending clips to display (either selected one or all pending)
  const getDisplayPendingClips = (): PendingClip[] => {
    if (selectedPendingClips.length > 0) {
      // Viewing selected pending clips
      return selectedPendingClips;
    }
    // Show all pending clips
    return pendingClips;
  };

  // Should RecordBar be hidden?
  const shouldHideRecordBar = isSearchActive;

  // PHASE 2.3.1: Filter child clips from home screen display
  // Only show parent clips on home screen (children are shown when clicking parent)
  const homeScreenClips = useMemo(() => {
    // v2.5.2 FIX: Filter by parentId, not status
    // Children ALWAYS have parentId, regardless of status transitions
    return clips.filter(clip => !clip.parentId);  // Only show parents (no parentId)
  }, [clips]);

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
          text={errorToastMessage}
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
              clips={homeScreenClips}
              onClipClick={handleClipClick}
              onRecordClick={handleRecordClick}
              onSearchActiveChange={setIsSearchActive}
              activeTranscriptionParentId={activeTranscriptionParentId}  // ✅ v2.5.3 FIX (renamed)
              activeHttpClipId={activeHttpClipId}  // ✅ v2.5.4 CRITICAL FIX
              isActiveRequest={isActiveRequest}
            />
          </div>

          {/* Record Screen - Slides in from right */}
          <div className={`screen-slide record-screen ${activeScreen === 'record' ? 'active' : ''}`}>
            <ClipRecordScreen
              state={getRecordScreenState()}
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

