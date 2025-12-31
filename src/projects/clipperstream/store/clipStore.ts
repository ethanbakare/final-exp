import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateClipId } from '../utils/id';
import { today } from '../utils/date';

// ============================================================================
// TYPES
// ============================================================================

export type ClipStatus =
  | null  // Done (completed)
  | 'transcribing'  // HTTP call in progress
  | 'formatting'  // Formatting API in progress
  | 'pending-child'  // Offline recording waiting to transcribe
  | 'pending-retry'  // Online but retrying after failures
  | 'failed';  // Permanent failure (after retries exhausted)

export interface Clip {
  // Identity
  id: string;  // 'clip-1767021108321-6348ncvko0d'
  createdAt: number;  // Timestamp for sorting

  // Parent-child relationship
  parentId?: string;  // If child, points to parent

  // Display
  title: string;  // "Recording 01" or "Mary's Tale" (AI-generated)
  date: string;  // "Dec 29, 2025"

  // Content (per-clip data - NOT global)
  rawText: string;  // Raw transcription from DeepGram
  formattedText: string;  // Formatted text from AI
  content: string;  // Legacy field (keep for backwards compat)

  // Status (per-clip state machine)
  status: ClipStatus;

  // Pending clip fields (for offline recordings)
  pendingClipTitle?: string;  // "Clip 001", "Clip 002", etc.
  audioId?: string;  // Link to IndexedDB audio blob
  duration?: string;  // "0:08"

  // Errors
  transcriptionError?: string;

  // Retry tracking (for UI)
  nextRetryTime?: number;  // Unix timestamp for countdown timer
  retryCount?: number;     // Current attempt number for retry interval calculation

  // View preferences (per-clip)
  currentView: 'raw' | 'formatted';

  // Animation tracking
  hasAnimatedFormattedOnce?: boolean;  // Track if formatted text has animated
}

export interface ClipStore {
  // DATA (persisted to sessionStorage)
  clips: Clip[];

  // VIEW STATE (not persisted - ephemeral)
  // ✅ REMOVED: selectedClip - Now derived via selector in components

  // TRACKING STATE (for concurrency management - ephemeral)
  activeHttpClipId: string | null;
  activeTranscriptionParentId: string | null;
  activeFormattingClipId: string | null;

  // ACTIONS (methods to mutate state)
  addClip: (clip: Clip) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  deleteClip: (id: string) => void;
  // ✅ REMOVED: setSelectedClip - No longer needed with selector pattern
  setActiveHttpClipId: (id: string | null) => void;
  setActiveTranscriptionParentId: (id: string | null) => void;
  setActiveFormattingClipId: (id: string | null) => void;

  // QUERIES (derived state)
  getClipById: (id: string) => Clip | undefined;
  getPendingClips: () => Clip[];
  getChildrenOf: (parentId: string) => Clip[];

  // HELPER METHODS
  nextRecordingTitle: () => string;
  nextPendingTitle: (parentId?: string) => string;
  createParentWithChildPending: (audioId: string, duration: string) => {
    parentId: string;
    childId: string;
  };
  appendPendingChild: (parentId: string, audioId: string, duration: string) => {
    childId: string;
  };
}

// ============================================================================
// SSR-SAFE STORAGE ADAPTER
// ============================================================================

const getStorage = () => {
  if (typeof window === 'undefined') {
    // Server-side: no-op storage
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  // Client-side: use sessionStorage
  return sessionStorage;
};

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useClipStore = create<ClipStore>()(
  persist(
    (set, get) => ({
      // Initial state
      clips: [],
      // ✅ REMOVED: selectedClip - Now derived via selector in components
      activeHttpClipId: null,
      activeTranscriptionParentId: null,
      activeFormattingClipId: null,

      // ======================================================================
      // ACTIONS
      // ======================================================================

      addClip: (clip) => set((state) => ({
        clips: [...state.clips, clip]
      })),

      updateClip: (id, updates) => set((state) => ({
        clips: state.clips.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      })),

      deleteClip: (id) => set((state) => ({
        clips: state.clips.filter(c => c.id !== id)
      })),

      // ✅ REMOVED: setSelectedClip - No longer needed with selector pattern

      setActiveHttpClipId: (id) => set({ activeHttpClipId: id }),

      setActiveTranscriptionParentId: (id) => set({ activeTranscriptionParentId: id }),

      setActiveFormattingClipId: (id) => set({ activeFormattingClipId: id }),

      // ======================================================================
      // QUERIES
      // ======================================================================

      getClipById: (id) => get().clips.find(c => c.id === id),

      getPendingClips: () => get().clips.filter(c =>
        c.status === 'pending-child' || c.status === 'pending-retry'
      ),

      getChildrenOf: (parentId) => get().clips.filter(c =>
        c.parentId === parentId
      ),

      // ======================================================================
      // HELPER METHODS
      // ======================================================================

      // Generate next recording number (Recording 01, 02, 03...)
      nextRecordingTitle: () => {
        const parents = get().clips.filter(c => !c.parentId);
        const max = parents.reduce((acc, c) => {
          const match = c.title.match(/Recording (\d+)/);
          return match ? Math.max(acc, parseInt(match[1])) : acc;
        }, 0);
        return `Recording ${String(max + 1).padStart(2, '0')}`;
      },

      // Generate next pending clip title (Clip 001, 002, 003...)
      nextPendingTitle: (parentId?: string) => {
        const siblings = parentId
          ? get().clips.filter(c => c.parentId === parentId)
          : [];

        const max = siblings.reduce((acc, c) => {
          const match = c.pendingClipTitle?.match(/Clip (\d+)/);
          return match ? Math.max(acc, parseInt(match[1])) : acc;
        }, 0);

        return `Clip ${String(max + 1).padStart(3, '0')}`;
      },

      // Create parent + first pending child atomically
      createParentWithChildPending: (audioId: string, duration: string) => {
        const parentId = generateClipId();
        const childId = generateClipId();
        const recordingTitle = get().nextRecordingTitle();
        const pendingTitle = get().nextPendingTitle(parentId);

        const parent: Clip = {
          id: parentId,
          createdAt: Date.now(),
          title: recordingTitle,
          date: today(),
          rawText: '',
          formattedText: '',
          content: '',
          status: null,
          currentView: 'formatted'
        };

        const child: Clip = {
          id: childId,
          createdAt: Date.now(),
          title: recordingTitle, // Inherits parent title
          date: today(),
          rawText: '',
          formattedText: '',
          content: '',
          status: 'pending-child',
          parentId: parentId,
          pendingClipTitle: pendingTitle,
          audioId: audioId,
          duration: duration,
          currentView: 'formatted'
        };

        set(state => ({
          clips: [...state.clips, parent, child]
        }));

        return { parentId, childId };
      },

      // Append another pending child to existing parent
      appendPendingChild: (parentId: string, audioId: string, duration: string) => {
        const parent = get().getClipById(parentId);
        if (!parent) throw new Error(`Parent ${parentId} not found`);

        const childId = generateClipId();
        const pendingTitle = get().nextPendingTitle(parentId);

        const child: Clip = {
          id: childId,
          createdAt: Date.now(),
          title: parent.title, // Inherit parent title
          date: today(),
          rawText: '',
          formattedText: '',
          content: '',
          status: 'pending-child',
          parentId: parentId,
          pendingClipTitle: pendingTitle,
          audioId: audioId,
          duration: duration,
          currentView: 'formatted'
        };

        set(state => ({
          clips: [...state.clips, child]
        }));

        return { childId };
      },
    }),
    {
      name: 'clipstream-storage',
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({ clips: state.clips })  // Only persist clips (selectedClip is now derived)
    }
  )
);

// ============================================================================
// MIGRATION HELPER
// ============================================================================

/**
 * Migrates old clip data from previous storage format
 * Run once on app mount in _app.tsx or ClipMasterScreen
 */
export const migrateOldClipsIfNeeded = () => {
  if (typeof window === 'undefined') return;

  try {
    // Check for old format clips (pre-030)
    const oldClipsKey = 'clipstream_clips'; // Legacy key
    const oldData = sessionStorage.getItem(oldClipsKey);

    if (oldData) {
      const oldClips = JSON.parse(oldData);

      // Transform to new format
      const migratedClips = oldClips.map((oldClip: any) => ({
        // Identity
        id: oldClip.id || `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: oldClip.createdAt || Date.now(),

        // Parent-child
        parentId: oldClip.parentId,

        // Display
        title: oldClip.title || 'Untitled',
        date: oldClip.date || new Date().toLocaleDateString(),

        // Content (migrate from single 'content' field)
        rawText: oldClip.rawText || oldClip.content || '',
        formattedText: oldClip.formattedText || oldClip.content || '',
        content: oldClip.content || '',

        // Status (default to complete)
        status: oldClip.status !== undefined ? oldClip.status : null,

        // Pending fields
        pendingClipTitle: oldClip.pendingClipTitle,
        audioId: oldClip.audioId,
        duration: oldClip.duration,

        // Errors
        transcriptionError: oldClip.transcriptionError,

        // Retry tracking
        nextRetryTime: oldClip.nextRetryTime,
        retryCount: oldClip.retryCount,

        // View
        currentView: oldClip.currentView || 'formatted',

        // Animation
        hasAnimatedFormattedOnce: oldClip.hasAnimatedFormattedOnce,
      }));

      // Save to new format
      const newStore = {
        state: { clips: migratedClips },
        version: 0
      };

      sessionStorage.setItem('clipstream-storage', JSON.stringify(newStore));

      // Remove old key
      sessionStorage.removeItem(oldClipsKey);

      console.log('[Migration] Successfully migrated', migratedClips.length, 'clips');
    }
  } catch (error) {
    console.error('[Migration] Failed to migrate old clips:', error);
    // Don't throw - gracefully continue with empty state
  }
};
