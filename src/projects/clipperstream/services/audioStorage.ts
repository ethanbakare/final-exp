// Audio Storage Service
// Browser-local IndexedDB wrapper for audio blob storage
// No server, no shared storage - each user's browser has its own IndexedDB

import { logger } from '../utils/logger';

const log = logger.scope('AudioStorage');

const DB_NAME = 'clipstream_audio';
const STORE_NAME = 'audio_blobs';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/* ============================================
   INDEXEDDB INITIALIZATION
   ============================================ */

/**
 * Initialize IndexedDB connection
 * Creates object store on first run
 */
async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      log.error('Failed to open IndexedDB', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      log.debug('IndexedDB initialized successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        log.info('Created IndexedDB object store', { storeName: STORE_NAME });
      }
    };
  });
}

/* ============================================
   AUDIO STORAGE OPERATIONS
   ============================================ */

/**
 * Store audio blob in IndexedDB
 * @param blob - Audio blob to store
 * @returns audioId - Unique identifier for the audio
 */
export async function storeAudio(blob: Blob): Promise<string> {
  const db = await initDB();
  const audioId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({
      id: audioId,
      blob,
      timestamp: Date.now()
    });

    request.onsuccess = () => {
      log.info('Audio stored in IndexedDB', {
        audioId,
        size: blob.size,
        type: blob.type
      });
      resolve(audioId);
    };

    request.onerror = () => {
      log.error('Failed to store audio', { audioId, error: request.error });
      reject(request.error);
    };
  });
}

/**
 * Retrieve audio blob by ID
 * @param audioId - Unique identifier for the audio
 * @returns Audio blob or null if not found
 */
export async function getAudio(audioId: string): Promise<Blob | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(audioId);

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        log.debug('Audio retrieved from IndexedDB', {
          audioId,
          size: result.blob.size
        });
        resolve(result.blob);
      } else {
        log.warn('Audio not found in IndexedDB', { audioId });
        resolve(null);
      }
    };

    request.onerror = () => {
      log.error('Failed to retrieve audio', { audioId, error: request.error });
      reject(request.error);
    };
  });
}

/**
 * Delete audio blob after successful transcription
 * @param audioId - Unique identifier for the audio
 */
export async function deleteAudio(audioId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(audioId);

    request.onsuccess = () => {
      log.info('Audio deleted from IndexedDB', { audioId });
      resolve();
    };

    request.onerror = () => {
      log.error('Failed to delete audio', { audioId, error: request.error });
      reject(request.error);
    };
  });
}

/**
 * Clear all audio from IndexedDB
 * Called when sessionStorage is cleared (fresh start)
 */
export async function clearAllAudio(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      log.info('All audio cleared from IndexedDB');
      resolve();
    };

    request.onerror = () => {
      log.error('Failed to clear audio', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all audio IDs from IndexedDB
 * Useful for debugging and cleanup operations
 */
export async function getAllAudioIds(): Promise<string[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      const audioIds = request.result as string[];
      log.debug('Retrieved all audio IDs', { count: audioIds.length });
      resolve(audioIds);
    };

    request.onerror = () => {
      log.error('Failed to get audio IDs', request.error);
      reject(request.error);
    };
  });
}
