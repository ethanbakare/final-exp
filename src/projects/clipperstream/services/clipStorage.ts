// Clip Storage Service
// Centralized clip CRUD operations with sessionStorage persistence
// Includes incognito mode fallback (memory-only storage)

/* ============================================
   INTERFACES
   ============================================ */

export interface Clip {
  id: string;
  title: string;
  date: string; // Format: "Dec 10, 2024" (US style)
  status: 'pending' | 'transcribing' | 'failed' | null;
  content?: string; // DEPRECATED - keep for backward compatibility
  rawText?: string; // NEW: Combined raw transcriptions
  formattedText?: string; // NEW: Combined formatted text
  currentView?: 'formatted' | 'raw'; // NEW: User's current view preference
  audioId?: string; // NEW: Reference to IndexedDB audio blob
  transcriptionError?: string; // NEW: Error message for failed transcriptions
  duration?: string; // NEW: Recording duration in format "0:26", "1:43", etc.
  pendingClipTitle?: string; // NEW: "Clip 001" etc - set once when becomes pending
  createdAt: number; // timestamp for sorting
}

/* ============================================
   STORAGE KEY
   ============================================ */

const STORAGE_KEY = 'clipstream_clips';

/* ============================================
   IN-MEMORY FALLBACK (for incognito mode)
   ============================================ */

let inMemoryClips: Clip[] | null = null;

/* ============================================
   SAFE STORAGE WRAPPERS
   Graceful fallback for incognito/private mode
   ============================================ */

function safeStorageSet(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    console.warn('sessionStorage unavailable (incognito mode). Clips persist in memory only.');
    return false;
  }
}

function safeStorageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/* ============================================
   DEMO CLIPS
   Seeded on first load
   ============================================ */

const createDemoClips = (): Clip[] => [
  {
    id: 'demo-1',
    title: 'Morning thoughts on productivity',
    date: 'Dec 9, 2024',
    status: null,
    content: 'Today I want to focus on deep work. The key is to eliminate distractions and create blocks of uninterrupted time. I\'ve been reading about the Pomodoro technique and think it could help me stay focused. Maybe I should try 25-minute work sessions with 5-minute breaks.',
    rawText: 'today i want to focus on deep work the key is to eliminate distractions and create blocks of uninterrupted time ive been reading about the pomodoro technique and think it could help me stay focused maybe i should try twenty five minute work sessions with five minute breaks',
    formattedText: 'Today I want to focus on deep work. The key is to eliminate distractions and create blocks of uninterrupted time. I\'ve been reading about the Pomodoro technique and think it could help me stay focused. Maybe I should try 25-minute work sessions with 5-minute breaks.',
    currentView: 'formatted',
    createdAt: Date.now() - 86400000 // 1 day ago
  },
  {
    id: 'demo-2',
    title: 'Ideas for the new project launch',
    date: 'Dec 8, 2024',
    status: null,
    content: 'Key features we need to build: user authentication, dashboard, real-time notifications, and data export. We should prioritize the MVP features first and iterate based on user feedback.',
    rawText: 'key features we need to build user authentication dashboard real time notifications and data export we should prioritize the mvp features first and iterate based on user feedback',
    formattedText: 'Key features we need to build: user authentication, dashboard, real-time notifications, and data export. We should prioritize the MVP features first and iterate based on user feedback.',
    currentView: 'formatted',
    createdAt: Date.now() - 172800000 // 2 days ago
  },
  {
    id: 'demo-3',
    title: 'Quick reminder about groceries',
    date: 'Dec 7, 2024',
    status: null,
    content: 'Milk, eggs, bread, cheese, vegetables, and fruit. Also need to pick up some cleaning supplies.',
    rawText: 'milk eggs bread cheese vegetables and fruit also need to pick up some cleaning supplies',
    formattedText: 'Milk, eggs, bread, cheese, vegetables, and fruit. Also need to pick up some cleaning supplies.',
    currentView: 'formatted',
    createdAt: Date.now() - 259200000 // 3 days ago
  }
];

/* ============================================
   INITIALIZE CLIPS
   Create demo clips on first load
   ============================================ */

export function initializeClips(): Clip[] {
  const demoClips = createDemoClips();
  saveClips(demoClips);
  return demoClips;
}

/* ============================================
   GET ALL CLIPS
   Retrieve clips from sessionStorage or memory
   ============================================ */

export function getClips(): Clip[] {
  // Try sessionStorage first
  const stored = safeStorageGet(STORAGE_KEY);

  if (stored) {
    try {
      const clips = JSON.parse(stored) as Clip[];
      // Update in-memory cache
      inMemoryClips = clips;
      return clips;
    } catch (error) {
      console.error('Failed to parse clips from storage:', error);
      return [];
    }
  }

  // Fallback to in-memory clips (incognito mode)
  if (inMemoryClips) {
    return inMemoryClips;
  }

  // No clips found
  return [];
}

/* ============================================
   SAVE CLIPS
   Persist clips to sessionStorage and memory
   ============================================ */

export function saveClips(clips: Clip[]): void {
  // Always save to memory
  inMemoryClips = clips;

  // Try to save to sessionStorage
  try {
    const json = JSON.stringify(clips);
    safeStorageSet(STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save clips to storage:', error);
    // Fallback to memory-only is already set above
  }
}

/* ============================================
   CREATE NEW CLIP
   Add clip with generated ID and current date
   ============================================ */

export function createClip(content: string, title: string, rawText?: string): Clip {
  const clips = getClips();

  const newClip: Clip = {
    id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: title,
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    status: null,
    content: content, // Keep for backward compatibility
    rawText: rawText || content, // Initialize with content if not provided
    formattedText: undefined, // Will be set after formatting
    currentView: 'formatted', // Default to formatted view
    createdAt: Date.now()
  };

  // Add to beginning of array (newest first)
  const updatedClips = [newClip, ...clips];
  saveClips(updatedClips);

  return newClip;
}

/* ============================================
   UPDATE EXISTING CLIP
   Modify clip properties
   ============================================ */

export function updateClip(id: string, updates: Partial<Clip>): Clip | null {
  const clips = getClips();
  const index = clips.findIndex(c => c.id === id);

  if (index === -1) {
    console.warn(`Clip not found: ${id}`);
    return null;
  }

  // Merge updates
  const updatedClip = {
    ...clips[index],
    ...updates
  };

  // Replace in array
  const updatedClips = [...clips];
  updatedClips[index] = updatedClip;

  saveClips(updatedClips);

  return updatedClip;
}

/* ============================================
   DELETE CLIP
   Remove clip by ID
   ============================================ */

export function deleteClip(id: string): boolean {
  const clips = getClips();
  const filtered = clips.filter(c => c.id !== id);

  if (filtered.length === clips.length) {
    // No clip was removed
    console.warn(`Clip not found: ${id}`);
    return false;
  }

  saveClips(filtered);
  return true;
}

/* ============================================
   GENERATE NEXT CLIP NUMBER
   Sequential numbering: "Clip 001", "Clip 002", etc.
   For ClipOffline items INSIDE a clip file
   Never reuses deleted numbers
   ============================================ */

export function getNextClipNumber(clips: Clip[]): string {
  // Extract all numeric clip titles
  const clipNumbers = clips
    .map(c => {
      const match = c.title.match(/^Clip (\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);

  // Find highest number
  const maxNumber = clipNumbers.length > 0 ? Math.max(...clipNumbers) : 0;

  // Increment for next clip
  const nextNumber = maxNumber + 1;

  // Format with leading zeros (001, 002, etc.)
  return `Clip ${String(nextNumber).padStart(3, '0')}`;
}

/* ============================================
   GENERATE NEXT RECORDING NUMBER
   Sequential numbering: "Recording 01", "Recording 02", etc.
   For clip FILE titles (container level on home screen)
   Never reuses deleted numbers
   ============================================ */

export function getNextRecordingNumber(clips: Clip[]): string {
  // Extract all numeric recording titles
  const recordingNumbers = clips
    .map(c => {
      const match = c.title.match(/^Recording (\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);

  // Find highest number
  const maxNumber = recordingNumbers.length > 0 ? Math.max(...recordingNumbers) : 0;

  // Increment for next recording
  const nextNumber = maxNumber + 1;

  // Format with leading zeros (01, 02, etc.)
  return `Recording ${String(nextNumber).padStart(2, '0')}`;
}

