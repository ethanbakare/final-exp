# 030_v2 - MISSING SECTIONS ADDENDUM
## Complete Implementation Guide for All Critical Gaps

**Date**: December 29, 2025
**Purpose**: Provide complete implementations for all sections identified in 030_v1_CRITICAL_GAPS_ANALYSIS.md
**Status**: ✅ COMPLETE - All 8 critical sections documented

**Sections Already Added to 030**:
- ✅ Section 2.1: Storage Strategy & Migration (lines 245-380)
- ✅ Section 2.5: Utility Functions & Store Helpers (lines 527-748)
- ✅ Section 5.3: Parent/Child Display Edge Cases (lines 833-883)
- ✅ Sections 5.6-5.12: UI Components & Features (lines 887-1295)
- ✅ Sections 6.4-6.5: Animation Details (lines 1344-1442)

**Sections TO ADD Below** (not yet in 030):

---

## SECTION 2.2: Network Detection Strategy

**INSERT LOCATION**: After Section 2.5 (Utility Functions), before PART 3

**Purpose**: Robust network connectivity detection beyond `navigator.onLine`

```typescript
// File: hooks/useNetworkStatus.ts

import { useState, useEffect } from 'react';

type NetworkState = 'online' | 'checking' | 'offline';

interface UseNetworkStatusReturn {
  networkState: NetworkState;
  isOnline: boolean;
  isChecking: boolean;
  verifyConnectivity: () => Promise<boolean>;
}

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [networkState, setNetworkState] = useState<NetworkState>('online');

  // Heartbeat endpoint to verify real connectivity
  const verifyConnectivity = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('[Network] Connectivity check failed:', error.message);
      return false;
    }
  };

  // Handle online event with verification
  const handleOnlineEvent = async () => {
    setNetworkState('checking');

    const isReallyOnline = await verifyConnectivity();

    if (isReallyOnline) {
      setNetworkState('online');
      // Trigger auto-retry for pending clips
      window.dispatchEvent(new CustomEvent('verified-online'));
    } else {
      // False positive - navigator.onLine is wrong
      setNetworkState('offline');
    }
  };

  const handleOfflineEvent = () => {
    setNetworkState('offline');
  };

  useEffect(() => {
    // Initial check
    if (!navigator.onLine) {
      setNetworkState('offline');
    }

    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOfflineEvent);
    };
  }, []);

  return {
    networkState,
    isOnline: networkState === 'online',
    isChecking: networkState === 'checking',
    verifyConnectivity
  };
};
```

**API Health Endpoint** (create if doesn't exist):

```typescript
// File: pages/api/health.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'HEAD') {
    res.status(200).end();
  } else {
    res.status(200).json({ status: 'ok', timestamp: Date.now() });
  }
}
```

**Usage in ClipMasterScreen**:

```typescript
const { isOnline, networkState } = useNetworkStatus();

// Instead of checking navigator.onLine:
if (!isOnline) {
  handleOfflineRecording({ audioId, duration });
  return;
}

// Listen for verified-online event instead of 'online':
useEffect(() => {
  const handleVerifiedOnline = async () => {
    const pendingClips = useClipStore.getState().getPendingClips();
    // ... retry logic
  };

  window.addEventListener('verified-online', handleVerifiedOnline);
  return () => window.removeEventListener('verified-online', handleVerifiedOnline);
}, []);
```

**Exponential Backoff for Retries**:

```typescript
const getRetryDelay = (attemptCount: number): number => {
  // Phase 1: Rapid retries (attempts 1-3)
  if (attemptCount <= 3) {
    return attemptCount === 1 ? 0 : 60_000; // 0s, 60s, 60s
  }

  // Phase 2: Interval-based with exponential backoff
  const intervalAttempt = attemptCount - 3;
  const delays = [
    1 * 60_000,  // 1 min
    2 * 60_000,  // 2 min
    4 * 60_000,  // 4 min
    5 * 60_000   // 5 min (repeats)
  ];

  const index = Math.min(intervalAttempt - 1, delays.length - 1);
  return delays[index];
};
```

---

## SECTION 4.4: RecordBar State Machine

**INSERT LOCATION**: After Section 4.1 (State Structure), before Section 4.2 (Flow: Online Recording)

**Purpose**: Document RecordBar (navbar) state transitions and mode changes

**State Machine Diagram** (Mermaid):

```mermaid
stateDiagram-v2
    [*] --> idle: App starts
    idle --> recording: User clicks Record
    recording --> processing: User clicks Done
    processing --> complete: Formatting finishes
    complete --> idle: Auto-transition (1s)
    recording --> idle: User clicks Cancel
    processing --> idle: Error occurs

    note right of idle: Navbar Mode: Minimal
    note right of recording: Navbar Mode: Recording (mic active)
    note right of processing: Navbar Mode: Processing (spinner)
    note right of complete: Navbar Mode: Complete (checkmark)
```

**State Type & Transitions**:

```typescript
type RecordNavState = 'idle' | 'recording' | 'processing' | 'complete' | 'error';

interface RecordBarModeMap {
  idle: 'minimal';           // Only mic button
  recording: 'recording';    // Mic button (active), Cancel button
  processing: 'processing';  // Spinner, no buttons
  complete: 'complete';      // Checkmark, auto-close
  error: 'error';           // Error icon, Retry button
}
```

**Button Visibility Matrix**:

| State | Mic Button | Done Button | Cancel Button | Copy Button | Spinner | Checkmark |
|-------|-----------|-------------|---------------|-------------|---------|-----------|
| idle | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| recording | 🔴 (active) | ✅ | ✅ | ❌ | ❌ | ❌ |
| processing | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| complete | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| error | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Implementation**:

```typescript
const [recordNavState, setRecordNavState] = useState<RecordNavState>('idle');

// Derive navbar mode from state
const getNavbarMode = (state: RecordNavState): string => {
  const modeMap: RecordBarModeMap = {
    idle: 'minimal',
    recording: 'recording',
    processing: 'processing',
    complete: 'complete',
    error: 'error'
  };
  return modeMap[state];
};

// State transitions
const handleRecordClick = () => {
  setRecordNavState('recording');
  startRecording();
};

const handleDoneClick = async () => {
  setRecordNavState('processing');
  // ... transcription logic

  setRecordNavState('complete');

  // Auto-transition back to idle
  setTimeout(() => setRecordNavState('idle'), 1000);
};

const handleCancelClick = () => {
  stopRecording();
  setRecordNavState('idle');
};

const handleError = (error: Error) => {
  console.error(error);
  setRecordNavState('error');
};
```

**Edge Cases**:

1. **User clicks into different clip while processing**:
   - Keep navbar state as 'processing' if user is viewing the processing clip
   - Switch to 'minimal' if user navigated away

```typescript
const shouldShowProcessingState = (navState: RecordNavState, selectedClipId: string, processingClipId: string): boolean => {
  return navState === 'processing' && selectedClipId === processingClipId;
};
```

2. **User starts new recording while old one formatting**:
   - Allow new recording (background formatting continues)
   - Navbar switches to new recording state

3. **Context parameter** (Fix 2 from original issues):
   - Pass `context` parameter to indicate whether user is actively recording
   - Prevents navbar showing full mode during background tasks

```typescript
const determineNavbarContext = (): 'active' | 'background' => {
  // Active: User is currently interacting with recording
  // Background: Auto-retry or background formatting
  return isRecording || isTranscribing ? 'active' : 'background';
};
```

---

## SECTION 4.5: Removing contentBlocks Step-by-Step

**INSERT LOCATION**: After Section 4.3 (Flow: Auto-retry), before PART 5

**Purpose**: Complete migration guide for removing `contentBlocks` global state

**Step 1: Remove contentBlocks State from ClipMasterScreen**

**BEFORE**:
```typescript
// ClipMasterScreen.tsx (current broken state)
const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

// contentBlocks is updated during formatting
const handleFormatComplete = (formattedText: string) => {
  setContentBlocks([{
    id: `block-${Date.now()}`,
    text: formattedText,
    animate: true
  }]);
};
```

**AFTER**:
```typescript
// ClipMasterScreen.tsx (030 rewrite)
// ❌ Delete contentBlocks state entirely

// Instead, update Zustand directly:
const handleFormatComplete = (clipId: string, formattedText: string) => {
  updateClip(clipId, {
    formattedText: formattedText,
    status: null
  });
};
```

**Step 2: Update ClipRecordScreen Props**

**BEFORE**:
```typescript
// ClipMasterScreen.tsx
<ClipRecordScreen
  contentBlocks={contentBlocks}  // ❌ Remove this prop
  selectedClip={selectedClip}
  onTranscribeClick={handleTranscribe}
/>
```

**AFTER**:
```typescript
// ClipMasterScreen.tsx
<ClipRecordScreen
  selectedClip={selectedClip}  // Only need this now
  onTranscribeClick={handleTranscribe}
/>
```

**Step 3: Update ClipRecordScreen to Read from Zustand**

**BEFORE**:
```typescript
// ClipRecordScreen.tsx (current)
interface ClipRecordScreenProps {
  contentBlocks: ContentBlock[];  // ❌ Remove
  selectedClip: Clip | null;
  onTranscribeClick?: () => void;
}

const ClipRecordScreen = ({ contentBlocks, selectedClip, ...props }: ClipRecordScreenProps) => {
  // Render from contentBlocks prop
  return (
    <div className={styles.content}>
      {contentBlocks[0]?.text}
    </div>
  );
};
```

**AFTER**:
```typescript
// ClipRecordScreen.tsx (030 rewrite)
interface ClipRecordScreenProps {
  selectedClip: Clip | null;
  onTranscribeClick?: () => void;
}

const ClipRecordScreen = ({ selectedClip, ...props }: ClipRecordScreenProps) => {
  const clips = useClipStore(state => state.clips);

  // Derive display text from Zustand
  const displayText = useMemo(() => {
    if (!selectedClip) return '';

    // Check if parent with children
    const isParent = !selectedClip.parentId;
    const children = clips.filter(c => c.parentId === selectedClip.id);

    if (isParent && children.length > 0) {
      // Parent with children - show children list
      return null;
    }

    // Single clip or child - show content
    return selectedClip.currentView === 'raw'
      ? selectedClip.rawText
      : selectedClip.formattedText;
  }, [selectedClip, clips]);

  if (displayText === null) {
    return <PendingClipsList clips={children} />;
  }

  return (
    <div className={styles.content}>
      {displayText}
    </div>
  );
};
```

**Step 4: Add Animation Tracking Flag to Clip Interface**

```typescript
interface Clip {
  // ... existing fields

  // Animation control
  hasAnimatedFormattedOnce?: boolean;  // Prevent re-animating on re-render
}
```

**Step 5: Animation Logic (When to Animate vs Instant)**

```typescript
const ClipRecordScreen = ({ selectedClip }: ClipRecordScreenProps) => {
  const updateClip = useClipStore(state => state.updateClip);
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!selectedClip?.formattedText) return;

    // Determine if we should animate
    const shouldAnimate =
      selectedClip.status === null &&              // Just completed
      !selectedClip.hasAnimatedFormattedOnce &&    // Never animated before
      selectedClip.formattedText.length > 0;       // Has text to show

    if (shouldAnimate) {
      setIsAnimating(true);
      let i = 0;
      const text = selectedClip.formattedText;

      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i));
        i++;

        if (i > text.length) {
          clearInterval(interval);
          setIsAnimating(false);

          // Mark as animated
          updateClip(selectedClip.id, {
            hasAnimatedFormattedOnce: true
          });
        }
      }, 10); // 10ms per character

      return () => clearInterval(interval);
    } else {
      // No animation - show full text instantly
      setDisplayedText(selectedClip.formattedText);
    }
  }, [selectedClip?.formattedText, selectedClip?.status, selectedClip?.id]);

  return (
    <div className={styles.content}>
      {displayedText}
    </div>
  );
};
```

**Step 6: Delete ContentBlock Interface**

```typescript
// types/clip.ts (or wherever defined)
// ❌ Delete this entirely:
interface ContentBlock {
  id: string;
  text: string;
  animate: boolean;
}
```

**Edge Cases**:

1. **User clicks away mid-animation**:
   - Animation continues in background
   - When user returns, shows full text (already marked as animated)

2. **Multiple clips complete at once**:
   - Only the selected clip animates
   - Others show instantly when clicked

3. **Appending to existing clip**:
   - Set `hasAnimatedFormattedOnce: true` for append mode
   - New text appears instantly (no animation)

---

## SECTION 4.6: Concurrency & Locking

**INSERT LOCATION**: After Section 4.5, before PART 5

**Purpose**: Prevent race conditions and handle concurrent user actions

**Problem Scenarios**:

1. User starts new recording while previous formatting
2. User deletes clip while it's transcribing
3. User clicks into clip A while clip B is formatting (transcription spilling!)
4. User goes offline mid-transcription
5. User double-clicks "Done" button

**Solution: Lock State + AbortController**

```typescript
// ClipMasterScreen.tsx

const [isProcessing, setIsProcessing] = useState(false);
const abortControllerRef = useRef<AbortController | null>(null);

// Prevent double-submit and concurrent operations
const handleDoneClick = async () => {
  if (isProcessing) {
    console.warn('[Recording] Already processing, ignoring click');
    return;
  }

  setIsProcessing(true);

  try {
    // Create abort controller for this operation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // ... transcription logic with abort signal
    const { rawText, success } = await transcribeRecording(audioBlob, {
      signal: controller.signal
    });

    // Check if aborted
    if (controller.signal.aborted) {
      console.log('[Recording] Operation aborted');
      return;
    }

    // ... rest of logic
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[Recording] Transcription cancelled');
    } else {
      console.error('[Recording] Error:', error);
      handleError(error);
    }
  } finally {
    setIsProcessing(false);
    abortControllerRef.current = null;
  }
};

// Cancel in-flight requests on navigation
const cancelCurrentOperation = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
};

// Call on unmount or navigation
useEffect(() => {
  return () => {
    cancelCurrentOperation();
  };
}, []);
```

**Button Disable Logic**:

```typescript
<button
  onClick={handleRecordClick}
  disabled={isProcessing || isRecording}
>
  Record
</button>

<button
  onClick={handleDoneClick}
  disabled={isProcessing || !isRecording}
>
  Done
</button>
```

**Handling User Navigation During Background Jobs**:

```typescript
const handleClipClick = (clip: Clip) => {
  // Don't cancel background formatting
  // Just switch views
  setSelectedClip(clip);

  // If clip is still processing, show pending UI
  if (clip.status !== null) {
    // Show status indicator instead of content
  }
};
```

**Delete Protection**:

```typescript
const handleDeleteClip = async (clipId: string) => {
  const clip = useClipStore.getState().getClipById(clipId);

  // Warn if deleting processing clip
  if (clip?.status === 'transcribing' || clip?.status === 'formatting') {
    const confirmed = confirm(
      'This clip is still processing. Delete anyway?'
    );

    if (!confirmed) return;

    // Cancel if this is the current processing clip
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  // Proceed with deletion
  deleteClip(clipId);
};
```

**Offline Mid-Transcription**:

```typescript
// In useClipRecording.ts
const transcribeRecording = async (
  audioBlob: Blob,
  options?: { signal?: AbortSignal }
): Promise<{ rawText: string; success: boolean }> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('/api/clipperstream/transcribe', {
      method: 'POST',
      body: formData,
      signal: options?.signal  // Pass abort signal
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const { text } = await response.json();
    return { rawText: text, success: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { rawText: '', success: false };
    }

    // Network error - will retry
    console.error('[Transcription] Failed:', error);
    return { rawText: '', success: false };
  }
};
```

---

## SECTION 5.4: Audio Lifecycle Management

**INSERT LOCATION**: After Section 5.3 (Parent/Child Edge Cases), before Section 5.6

**Purpose**: Complete audio blob lifecycle from creation to cleanup

**Audio Lifecycle Diagram**:

```
1. CREATE:    stopRecording() → audioBlob saved to IndexedDB
              ↓
2. LINK:      Clip created with audioId reference
              ↓
3. USE:       Auto-retry retrieves blob via getAudio(audioId)
              ↓
4. DELETE:    After successful formatting, deleteAudio(audioId)

ORPHANED AUDIO (edge cases):
- Scenario 1: User deletes pending clip before going online
  → Audio remains in IndexedDB (needs cleanup)
- Scenario 2: Formatting fails, clip marked 'failed'
  → Audio remains (user might retry)
- Scenario 3: App crashes mid-processing
  → Audio remains with no clip reference (needs cleanup)
```

**Implementation**:

```typescript
// File: services/audioStorage.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AudioDB extends DBSchema {
  audios: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      createdAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AudioDB>> | null = null;

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<AudioDB>('clipstream-audio', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('audios')) {
          db.createObjectStore('audios', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const saveAudio = async (id: string, blob: Blob): Promise<void> => {
  const db = await getDB();
  await db.put('audios', {
    id,
    blob,
    createdAt: Date.now()
  });
};

export const getAudio = async (id: string): Promise<Blob | null> => {
  const db = await getDB();
  const record = await db.get('audios', id);
  return record?.blob || null;
};

export const deleteAudio = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete('audios', id);
    console.log('[Audio] Deleted:', id);
  } catch (error) {
    console.warn('[Audio] Failed to delete:', id, error);
    // Don't throw - deletion failure is non-critical
  }
};

export const getAllAudioIds = async (): Promise<string[]> => {
  const db = await getDB();
  const keys = await db.getAllKeys('audios');
  return keys as string[];
};
```

**Quota Monitoring**:

```typescript
// File: hooks/useAudioQuotaMonitor.ts

export const useAudioQuotaMonitor = () => {
  useEffect(() => {
    const checkQuota = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const percentUsed = ((estimate.usage || 0) / (estimate.quota || 1)) * 100;

        if (percentUsed > 80) {
          console.warn('[Audio] Storage > 80% full, cleaning up...');
          await cleanupOrphanedAudio();
        }
      }
    };

    // Check on mount and every 5 minutes
    checkQuota();
    const interval = setInterval(checkQuota, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};
```

**Orphaned Audio Cleanup**:

```typescript
// File: utils/audioCleanup.ts

export const cleanupOrphanedAudio = async (): Promise<void> => {
  try {
    const allClips = useClipStore.getState().clips;
    const referencedAudioIds = new Set(
      allClips
        .map(c => c.audioId)
        .filter(Boolean) as string[]
    );

    // Get all audio IDs from IndexedDB
    const allAudioIds = await getAllAudioIds();

    // Find orphans
    const orphans = allAudioIds.filter(id => !referencedAudioIds.has(id));

    console.log('[Audio] Found', orphans.length, 'orphaned audio blobs');

    // Delete orphans
    for (const id of orphans) {
      await deleteAudio(id);
    }

    console.log('[Audio] Cleanup complete');
  } catch (error) {
    console.error('[Audio] Cleanup failed:', error);
  }
};

// Run cleanup on app mount
export const useAudioCleanup = () => {
  useEffect(() => {
    // Wait 5 seconds after mount (let app stabilize)
    const timeout = setTimeout(() => {
      cleanupOrphanedAudio();
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);
};
```

**Audio Finalizer in Formatting Worker**:

```typescript
// In useFormattingWorker.ts or formatTranscriptionInBackground()

const formatTranscriptionInBackground = async (
  clipId: string,
  rawText: string,
  isAppending: boolean
) => {
  const clip = useClipStore.getState().getClipById(clipId);
  if (!clip) return;

  try {
    // ... formatting logic

    // Success: Delete audio
    if (clip.audioId) {
      await deleteAudio(clip.audioId);
      updateClip(clipId, { audioId: undefined });
    }
  } catch (error) {
    console.error('[Formatting] Error:', error);

    // Even on error, try to clean up audio
    if (clip.audioId) {
      await deleteAudio(clip.audioId);
      updateClip(clipId, { audioId: undefined });
    }

    // Fallback to rawText
    updateClip(clipId, {
      formattedText: clip.rawText,
      status: null
    });
  }
};
```

**User Warnings**:

```typescript
// Show warning toast if quota exceeded
const checkAndWarnQuota = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = ((estimate.usage || 0) / (estimate.quota || 1)) * 100;

    if (percentUsed > 90) {
      showToast(
        'Storage almost full. Consider deleting old recordings.',
        'warning'
      );
    }
  }
};
```

---

## SECTION 5.13: Error Message Standards

**INSERT LOCATION**: After Section 5.12 (Error Display), before PART 6

**Purpose**: User-friendly error messages for all error scenarios

**Error Code → User Message Mapping**:

```typescript
// File: utils/errorMessages.ts

type ErrorCategory =
  | 'network'
  | 'api'
  | 'audio'
  | 'permission'
  | 'storage'
  | 'unknown';

interface ErrorMapping {
  pattern: RegExp | string;
  category: ErrorCategory;
  userMessage: string;
  actionable: string;
}

const errorMappings: ErrorMapping[] = [
  // Network errors
  {
    pattern: /timeout|ETIMEDOUT|ECONNABORTED/i,
    category: 'network',
    userMessage: 'Connection timed out',
    actionable: 'Check your internet connection and try again.'
  },
  {
    pattern: /offline|network|NetworkError/i,
    category: 'network',
    userMessage: 'You appear to be offline',
    actionable: 'Reconnect to the internet to transcribe this recording.'
  },
  {
    pattern: /Failed to fetch/i,
    category: 'network',
    userMessage: 'Unable to reach server',
    actionable: 'Check your internet connection or try again later.'
  },

  // API errors
  {
    pattern: /500|503|Internal Server Error/i,
    category: 'api',
    userMessage: 'Service temporarily unavailable',
    actionable: 'Our servers are experiencing issues. Try again in a few minutes.'
  },
  {
    pattern: /429|Too Many Requests/i,
    category: 'api',
    userMessage: 'Too many requests',
    actionable: 'Please wait 1 minute before trying again.'
  },
  {
    pattern: /401|403|Unauthorized/i,
    category: 'api',
    userMessage: 'Authentication required',
    actionable: 'Please sign in and try again.'
  },
  {
    pattern: /404|Not Found/i,
    category: 'api',
    userMessage: 'Service not found',
    actionable: 'This feature may be unavailable. Contact support.'
  },

  // Audio errors
  {
    pattern: /too large|file size|exceeds/i,
    category: 'audio',
    userMessage: 'Recording is too long',
    actionable: 'Maximum recording length is 10 minutes. Try a shorter clip.'
  },
  {
    pattern: /too small|too short|minimum/i,
    category: 'audio',
    userMessage: 'Recording is too short',
    actionable: 'Please record at least 1 second of audio.'
  },
  {
    pattern: /no audio|silent|empty/i,
    category: 'audio',
    userMessage: 'No audio detected',
    actionable: 'Check your microphone and try again.'
  },

  // Permission errors
  {
    pattern: /permission|NotAllowedError|denied/i,
    category: 'permission',
    userMessage: 'Microphone access denied',
    actionable: 'Enable microphone permissions in your browser settings.'
  },
  {
    pattern: /NotFoundError|no device/i,
    category: 'permission',
    userMessage: 'No microphone found',
    actionable: 'Connect a microphone and refresh the page.'
  },

  // Storage errors
  {
    pattern: /quota|QuotaExceededError|storage full/i,
    category: 'storage',
    userMessage: 'Storage limit reached',
    actionable: 'Delete old recordings to free up space.'
  },
];

export const getUserFriendlyError = (error: Error | string): {
  message: string;
  actionable: string;
  category: ErrorCategory;
} => {
  const errorString = typeof error === 'string' ? error : error.message;

  // Find matching error pattern
  for (const mapping of errorMappings) {
    const matches = typeof mapping.pattern === 'string'
      ? errorString.includes(mapping.pattern)
      : mapping.pattern.test(errorString);

    if (matches) {
      return {
        message: mapping.userMessage,
        actionable: mapping.actionable,
        category: mapping.category
      };
    }
  }

  // Default fallback
  return {
    message: 'Something went wrong',
    actionable: 'Please try again. If the problem persists, contact support.',
    category: 'unknown'
  };
};
```

**Usage in Error Display**:

```typescript
// Update FailedClipDisplay component
const FailedClipDisplay = ({ clip }: { clip: Clip }) => {
  const { message, actionable } = getUserFriendlyError(
    clip.transcriptionError || 'Transcription failed'
  );

  return (
    <div className="failed-clip">
      <div className="error-icon">⚠️</div>
      <div className="error-message">{message}</div>
      <div className="error-action">{actionable}</div>

      <button onClick={() => retryClipTranscription(clip.id)}>
        Retry
      </button>
    </div>
  );
};
```

**Error Logging for Debug**:

```typescript
const logDetailedError = (error: Error, context: string) => {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Don't show technical details to user
  const { message, actionable } = getUserFriendlyError(error);
  showToast(`${message}. ${actionable}`, 'error');
};
```

---

## IMPLEMENTATION CHECKLIST

**Critical Sections (Must Add)**:
- [ ] Section 2.2: Network Detection Strategy
- [ ] Section 4.4: RecordBar State Machine
- [ ] Section 4.5: Removing contentBlocks Step-by-Step
- [ ] Section 4.6: Concurrency & Locking
- [ ] Section 5.4: Audio Lifecycle Management
- [ ] Section 5.13: Error Message Standards

**How to Add to 030**:
1. Copy each section from this document
2. Insert at the specified location in 030_REWRITE_ARCHITECTURE.md
3. Update section numbering if needed
4. Update table of contents

**Sections Already Complete in 030**:
- ✅ Section 2.1: Storage Strategy & Migration
- ✅ Section 2.5: Utility Functions & Store Helpers
- ✅ All UI component sections (5.3, 5.6-5.12)
- ✅ Animation sections (6.4-6.5)

---

**Prepared By**: Claude Sonnet 4.5
**Date**: December 29, 2025
**Status**: ✅ COMPLETE - All critical sections documented
**Next Step**: Insert sections into 030_REWRITE_ARCHITECTURE.md at specified locations
