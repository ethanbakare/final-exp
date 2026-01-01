// Audio Storage Service
// Browser-local IndexedDB wrapper for audio blob storage
// No server, no shared storage - each user's browser has its own IndexedDB

import { logger } from '../utils/logger';

const log = logger.scope('AudioStorage');

const DB_NAME = 'clipstream_audio';
const STORE_NAME = 'audio_blobs';
const DB_VERSION = 2;  // Incremented from 1 to 2 for ArrayBuffer migration

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
      const oldVersion = event.oldVersion;
      
      // Version 0 → 1: Create store
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          log.info('Created IndexedDB object store', { storeName: STORE_NAME });
        }
      }
      
      // Version 1 → 2: Clear old audio blobs (they use blob format, not ArrayBuffer)
      if (oldVersion === 1) {
        log.info('Migrating IndexedDB from v1 to v2: clearing old audio blobs');
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const store = transaction.objectStore(STORE_NAME);
        store.clear();  // Delete all old audio blobs stored in legacy format
        log.info('Migration complete: old audio blobs cleared, new recordings will use ArrayBuffer format');
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
  
  // CRITICAL FIX: Convert Blob to ArrayBuffer before storing
  // This prevents browser bugs where Blob internal structure gets corrupted in IndexedDB
  const arrayBuffer = await blob.arrayBuffer();
  const mimeType = blob.type || 'audio/webm';

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({
      id: audioId,
      data: arrayBuffer,  // Store raw binary data, not Blob
      mimeType: mimeType,
      size: arrayBuffer.byteLength,  // Store size for validation
      timestamp: Date.now()
    });

    request.onsuccess = () => {
      log.info('Audio stored in IndexedDB', {
        audioId,
        size: arrayBuffer.byteLength,
        mimeType: mimeType,
        format: 'ArrayBuffer'
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
      
      // Defensive validation
      if (!result) {
        log.warn('Audio not found in IndexedDB', { audioId });
        resolve(null);
        return;
      }
      
      // Handle both new format (data as ArrayBuffer) and old format (blob)
      let arrayBuffer: ArrayBuffer;
      let mimeType: string;
      
      if (result.data) {
        // New format: data stored as ArrayBuffer
        if (!(result.data instanceof ArrayBuffer)) {
          log.error('Invalid data format in IndexedDB', {
            audioId,
            dataType: typeof result.data,
            hasBlob: !!result.blob
          });
          resolve(null);
          return;
        }
        
        if (result.data.byteLength === 0) {
          log.error('Empty ArrayBuffer in IndexedDB', { audioId });
          resolve(null);
          return;
        }
        
        arrayBuffer = result.data;
        mimeType = result.mimeType || 'audio/webm';
        
      } else if (result.blob) {
        // Old format: blob stored directly (legacy, might be corrupted)
        log.warn('Found legacy blob format, attempting to use', { audioId });
        
        const legacyBlob = result.blob;
        if (legacyBlob.size === 0) {
          log.error('Empty legacy blob in IndexedDB', { audioId });
          resolve(null);
          return;
        }
        
        // Recreate with stored MIME type to fix browser bug
        mimeType = result.mimeType || legacyBlob.type || 'audio/webm';
        const correctedBlob = new Blob([legacyBlob], { type: mimeType });
        
        log.debug('Audio retrieved from IndexedDB (legacy format)', {
          audioId,
          size: correctedBlob.size,
          finalType: correctedBlob.type,
          isLegacy: true
        });
        
        resolve(correctedBlob);
        return;
        
      } else {
        log.error('No data or blob found in IndexedDB result', { audioId });
        resolve(null);
        return;
      }
      
      // Create fresh Blob from ArrayBuffer
      const blob = new Blob([arrayBuffer], { type: mimeType });
      
      log.debug('Audio retrieved from IndexedDB', {
        audioId,
        size: blob.size,
        type: blob.type,
        arrayBufferSize: arrayBuffer.byteLength,
        mimeType: mimeType,
        format: 'ArrayBuffer'
      });
      
      resolve(blob);
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
