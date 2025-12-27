import { useState, useCallback, useEffect } from 'react';
import {
  Clip,
  getClips,
  createClip,
  updateClip,
  deleteClip
} from '../services/clipStorage';
import { logger } from '../utils/logger';

const log = logger.scope('useClipState');

/**
 * Manages clip state and CRUD operations
 *
 * Extracted from ClipMasterScreen.tsx to centralize clip management.
 * This hook is responsible for:
 * - Loading clips from sessionStorage
 * - Keeping React state in sync with storage
 * - Providing CRUD operations that auto-refresh
 * - Managing selectedClip state
 */
export function useClipState() {
  // MOVED FROM: ClipMasterScreen.tsx line 58-59
  const [clips, setClips] = useState<Clip[]>([]);

  // MOVED FROM: ClipMasterScreen.tsx line 60
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  // MOVED FROM: ClipMasterScreen.tsx lines 341-348 (initialization useEffect)
  useEffect(() => {
    const initialClips = getClips();
    setClips(initialClips);
    log.debug('Clips initialized from storage', { count: initialClips.length });
  }, []);

  // MOVED FROM: ClipMasterScreen.tsx lines 414-416
  const refreshClips = useCallback(() => {
    const updatedClips = getClips();
    setClips(updatedClips);
    log.debug('Clips refreshed from storage', { count: updatedClips.length });
  }, []);

  // WRAPPER for createClip that auto-refreshes
  const createNewClip = useCallback((content: string, title: string, formattedText: string) => {
    log.info('Creating new clip', { title, hasContent: !!content });
    const newClip = createClip(content, title, formattedText);
    refreshClips();
    return newClip;
  }, [refreshClips]);

  // WRAPPER for updateClip that auto-refreshes
  const updateClipById = useCallback((clipId: string, updates: Partial<Clip>) => {
    log.info('Updating clip', { clipId, updates });
    const updated = updateClip(clipId, updates);
    refreshClips();
    return updated;
  }, [refreshClips]);

  // WRAPPER for deleteClip that auto-refreshes
  const deleteClipById = useCallback((clipId: string) => {
    log.info('Deleting clip', { clipId });
    deleteClip(clipId);
    refreshClips();
  }, [refreshClips]);

  return {
    clips,
    selectedClip,
    setSelectedClip,
    refreshClips,
    createNewClip,
    updateClipById,
    deleteClipById
  };
}

