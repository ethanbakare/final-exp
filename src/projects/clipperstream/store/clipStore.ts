/**
 * Zustand Store for Clip State Management
 * 
 * Centralizes all clip state and operations, replacing manual sessionStorage sync.
 * Auto-persists to sessionStorage and triggers component re-renders automatically.
 * 
 * @version 2.6.0
 * @phase Zustand Refactor - Phase 2
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Clip } from '../services/clipStorage';
import { 
  getClips as getClipsFromStorage,
  createClip as createClipInStorage,
  updateClip as updateClipInStorage,
  deleteClip as deleteClipInStorage
} from '../services/clipStorage';

/* ============================================
   TYPE DEFINITIONS
   ============================================ */

interface ClipStore {
  // State
  clips: Clip[];
  selectedClip: Clip | null;
  activeHttpClipId: string | null;
  activeFormattingClipId: string | null;
  activeTranscriptionParentId: string | null;
  
  // Clip CRUD Operations
  addClip: (clip: Clip) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  deleteClip: (id: string) => void;
  getClipById: (id: string) => Clip | undefined;
  setSelectedClip: (clip: Clip | null) => void;
  
  // Bulk Operations
  setClips: (clips: Clip[]) => void;
  refreshClips: () => void; // Backwards compat: reload from sessionStorage
  
  // HTTP/Formatting/Transcription Tracking
  setActiveHttpClipId: (id: string | null) => void;
  setActiveFormattingClipId: (id: string | null) => void;
  setActiveTranscriptionParentId: (id: string | null) => void;
}

/* ============================================
   ZUSTAND STORE CREATION
   ============================================ */

export const useClipStore = create<ClipStore>()(
  persist(
    (set, get) => ({
      // ========================================
      // Initial State
      // ========================================
      clips: [],
      selectedClip: null,
      activeHttpClipId: null,
      activeFormattingClipId: null,
      activeTranscriptionParentId: null,

      // ========================================
      // Clip CRUD Operations
      // ========================================

      addClip: (clip: Clip) => {
        // Add to Zustand state
        set((state) => ({
          clips: [...state.clips, clip]
        }));
        
        // Also persist to sessionStorage for backwards compat
        createClipInStorage(clip);
      },

      updateClip: (id: string, updates: Partial<Clip>) => {
        // Update in Zustand state
        set((state) => ({
          clips: state.clips.map(c =>
            c.id === id ? { ...c, ...updates } : c
          )
        }));
        
        // Also persist to sessionStorage for backwards compat
        updateClipInStorage(id, updates);
        
        // If updating selected clip, refresh it
        const currentSelectedClip = get().selectedClip;
        if (currentSelectedClip && currentSelectedClip.id === id) {
          set({
            selectedClip: { ...currentSelectedClip, ...updates }
          });
        }
      },

      deleteClip: (id: string) => {
        // Remove from Zustand state
        set((state) => ({
          clips: state.clips.filter(c => c.id !== id)
        }));
        
        // Also remove from sessionStorage for backwards compat
        deleteClipInStorage(id);
        
        // Clear selected clip if it was deleted
        if (get().selectedClip?.id === id) {
          set({ selectedClip: null });
        }
      },

      getClipById: (id: string) => {
        return get().clips.find(c => c.id === id);
      },

      setSelectedClip: (clip: Clip | null) => {
        set({ selectedClip: clip });
      },

      // ========================================
      // Bulk Operations
      // ========================================

      setClips: (clips: Clip[]) => {
        set({ clips });
      },

      refreshClips: () => {
        // Reload from sessionStorage (backwards compat during migration)
        const clipsFromStorage = getClipsFromStorage();
        set({ clips: clipsFromStorage });
      },

      // ========================================
      // HTTP/Formatting/Transcription Tracking
      // ========================================

      setActiveHttpClipId: (id: string | null) => {
        set({ activeHttpClipId: id });
      },

      setActiveFormattingClipId: (id: string | null) => {
        set({ activeFormattingClipId: id });
      },

      setActiveTranscriptionParentId: (id: string | null) => {
        set({ activeTranscriptionParentId: id });
      },
    }),
    {
      name: 'clipstream-storage', // sessionStorage key
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      
      // Only persist clips and selectedClip, not tracking flags
      partialPersist: (state) => ({
        clips: state.clips,
        selectedClip: state.selectedClip,
      }),
    }
  )
);

/* ============================================
   EXPORTS
   ============================================ */

// Export store hook
export default useClipStore;

// Export for backwards compatibility with old code
export const getClips = () => useClipStore.getState().clips;
export const getClipById = (id: string) => useClipStore.getState().getClipById(id);

