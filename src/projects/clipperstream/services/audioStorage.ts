// Audio Storage Service
// Browser-local IndexedDB wrapper for audio blob storage
// No server, no shared storage - each user's browser has its own IndexedDB

import { logger } from '../utils/logger';

const log = logger.scope('AudioStorage');

const DB_NAME = 'clipstream_audio';
const STORE_NAME = 'audio_blobs';
const DB_VERSION = 2;  // v2: ArrayBuffer storage format

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
      const newVersion = event.newVersion || DB_VERSION;

      log.info('IndexedDB upgrade triggered', {
        oldVersion,
        newVersion,
        storeName: STORE_NAME
      });

      // v0 → v1 or v2: Create object store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        log.info('Created IndexedDB object store', { storeName: STORE_NAME });
      }

      // v1 → v2: Data is ALREADY in v2 format (ArrayBuffer)
      // Just need to update code to read it correctly
      if (oldVersion === 1 && newVersion === 2) {
        log.info('Upgrading DB version from v1 to v2');
        log.info('Data is already in v2 format (ArrayBuffer) - no migration needed');
        // DO NOT CLEAR - existing data is already correct!
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

  // Convert Blob to ArrayBuffer for reliable storage
  const arrayBuffer = await blob.arrayBuffer();
  const mimeType = blob.type || 'audio/webm;codecs=opus';

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Store as ArrayBuffer with separate MIME type (v2 format)
    const request = store.add({
      id: audioId,
      data: arrayBuffer,           // ← ArrayBuffer, not Blob
      mimeType: mimeType,           // ← Full MIME type with codec
      size: arrayBuffer.byteLength, // ← Store size for verification
      timestamp: Date.now()
    });

    request.onsuccess = () => {
      log.info('Audio stored in IndexedDB', {
        audioId,
        size: arrayBuffer.byteLength,
        mimeType,
        format: 'v2-ArrayBuffer'
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

      if (!result) {
        log.warn('Audio not found in IndexedDB', { audioId });
        resolve(null);
        return;
      }

      // Validate we have the required data
      if (!result.data || !(result.data instanceof ArrayBuffer)) {
        log.error('Invalid storage format - missing or invalid ArrayBuffer', {
          audioId,
          hasData: !!result.data,
          dataType: result.data?.constructor?.name || 'undefined'
        });
        resolve(null);
        return;
      }

      // Get MIME type (with fallback to codec-included default)
      const mimeType = result.mimeType || 'audio/webm;codecs=opus';

      // Convert ArrayBuffer back to Blob
      const blob = new Blob([result.data], { type: mimeType });

      // Verify blob was created successfully
      if (blob.size === 0 || blob.size !== result.data.byteLength) {
        log.error('Blob conversion failed', {
          audioId,
          arrayBufferSize: result.data.byteLength,
          blobSize: blob.size,
          mismatch: blob.size !== result.data.byteLength
        });
        resolve(null);
        return;
      }

      // ========================================
      // DIAGNOSTIC LOGGING: Verify WebM content
      // ========================================
      const verifyBuffer = await blob.arrayBuffer();
      const verifyBytes = new Uint8Array(verifyBuffer);
      const isValidWebM = verifyBytes.length >= 4 &&
                         verifyBytes[0] === 0x1A &&
                         verifyBytes[1] === 0x45 &&
                         verifyBytes[2] === 0xDF &&
                         verifyBytes[3] === 0xA3;

      const first16Bytes = verifyBytes.length >= 16
        ? Array.from(verifyBytes.slice(0, 16))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ')
        : 'insufficient data';

      log.debug('🔬 BLOB CONTENT VERIFICATION', {
        audioId,
        isValidWebM,
        first16Bytes,
        expectedHeader: '1a 45 df a3 ...',
        totalBytes: verifyBytes.length,
        blobSize: blob.size
      });

      if (!isValidWebM) {
        log.error('❌ INVALID WEBM DATA - blob does not contain valid WebM audio', {
          audioId,
          first16Bytes,
          expectedBytes: '1a 45 df a3',
          actualBytes: verifyBytes.length >= 4
            ? Array.from(verifyBytes.slice(0, 4))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(' ')
            : 'insufficient data'
        });
      } else {
        log.info('✅ VALID WEBM DATA - blob contains valid WebM magic bytes', {
          audioId,
          first4Bytes: first16Bytes.split(' ').slice(0, 4).join(' ')
        });
      }
      // ========================================

      log.debug('Audio retrieved from IndexedDB', {
        audioId,
        size: blob.size,
        mimeType: blob.type,
        format: 'v2-ArrayBuffer',
        storedSize: result.size,
        sizeMatch: blob.size === result.size,
        arrayBufferSize: result.data.byteLength
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
