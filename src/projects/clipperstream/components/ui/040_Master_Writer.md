# 040_Master_Writer.md
## Zustand-Only Architecture & Cutover Plan (with File-by-File Checklist)

**Purpose:** Make Zustand the single source of truth, remove dual storage, shrink the orchestrator, and harden background workers.

---

## Background & Context: Why This Rewrite?

### The Problem We're Solving

**Current State (December 29, 2025):** The Zustand v2.6.0 migration has failed multiple times. Despite implementing 11 fixes in previous phases, core functionality remains broken:

1. ❌ **Transcription spilling** - Text from one clip appears in others
2. ❌ **Parent title generation fails** - Stuck on "Recording 01" placeholder
3. ❌ **Clips disappearing/flickering** - UI shows wrong content during background processing
4. ❌ **Status indicators broken** - Users can't see "transcribing" → "formatting" → "done"
5. ❌ **Navbar state changing** - Full mode showing inappropriately during background tasks

### Phase 1 Implementation Failed (See: 029_PHASE1_FAILURE_ANALYSIS.md)

**What we tried:**
- Fix 1A: Store `rawText` immediately after transcription
- Fix 1B: Store `formattedText` and clear `status: null`
- Fix 4: Parent title generation (depends on Fix 1A)

**What failed:**
- **Fix 1A (100% broken)** - React state timing issue:
  ```typescript
  await transcribeRecording(audioBlob);  // Updates state async
  updateClipById(clip.id, {
    rawText: transcription  // ❌ Empty - state not updated yet!
  });
  ```
- **Fix 4 (100% broken)** - Parent title generation doesn't work because `rawText` is empty
- **User-reported issues (All still present)** - Clips disappearing, flickering, navbar issues

**Evidence from session storage:**
```json
{
  "id": "clip-001",
  "rawText": "",           // ❌ Should have transcription text
  "formattedText": "...",  // ✅ Works (Fix 1B succeeded)
  "status": null           // ✅ Works (Fix 1B succeeded)
}
```

### Why Patching Has Failed

**Pattern:** Each fix creates new issues ("death by a thousand cuts")
- Fix 1-11: 5.5+ hours, still broken
- Dual storage (Zustand + global state + contentBlocks) creates race conditions
- Global state (`transcription`, `activeHttpClipId`, etc.) conflicts with Zustand
- No single source of truth → data inconsistency

### The Decision: Complete Rewrite

**Why rewrite instead of continuing patches:**
1. **Predictable timeline** - Clean architecture = 10 hours vs. unknown patch time
2. **No hidden issues** - Fresh start eliminates accumulated technical debt
3. **Proven pattern** - Background workers pattern is standard in React/React Native
4. **User feedback** - "Very very simple flow" expectations not met by current complexity

**What this document provides:**
- Complete implementation plan (Phase 0 → Phase 6)
- Worker-based architecture (decoupled from UI)
- Single source of truth (Zustand only)
- Comprehensive test coverage
- Migration strategy (safe rollback)

**Reference documents:**
- [029_PHASE1_FAILURE_ANALYSIS.md](029_PHASE1_FAILURE_ANALYSIS.md) - Why Phase 1 failed
- [030_REWRITE_ARCHITECTURE.md](030_REWRITE_ARCHITECTURE.md) - Alternative rewrite approach (8 scenarios)
- [028v4_CRITICAL_REVIEW_AND_CORRECTIONS.md](028v4_CRITICAL_REVIEW_AND_CORRECTIONS.md) - Original fixes 1-11

---

## Phase 0 — Decisions
- Storage target: `localStorage` (web) via a pluggable adapter (later: AsyncStorage for Expo).
- Audio blobs: stay in IndexedDB.
- IDs: `clip-${timestamp}-${random}`; parents/children sorted by `createdAt`.
- Status model: `null | 'pending-child' | 'pending-retry' | 'transcribing' | 'formatting' | 'failed'`.

---

## Phase 0.5 — Migration Strategy

**Goal:** Transition from current broken state to new architecture incrementally.

---

### Step 0: Git Branch Checkpoint ⚠️ **CRITICAL FIRST STEP**

**Before making ANY code changes, create a checkpoint branch:**

```bash
# Navigate to project root
cd /path/to/clipperstream

# Check current status
git status

# Commit any uncommitted changes first
git add .
git commit -m "Checkpoint before 040 Master Writer rewrite implementation"

# Create new branch from current state
git checkout -b rewrite/040-master-writer-zustand-only

# Push to remote as backup
git push -u origin rewrite/040-master-writer-zustand-only

# Verify you're on the new branch
git branch --show-current
# Should output: rewrite/040-master-writer-zustand-only
```

**Why this is critical:**
- ✅ Safe rollback point if rewrite fails
- ✅ Can compare new vs old implementation side-by-side
- ✅ Preserves broken Phase 1 state for debugging/learning
- ✅ Allows parallel work (main branch stays stable)

**Branch naming convention:**
- `rewrite/040-master-writer-zustand-only` - This rewrite branch
- `main` or `develop` - Original broken state (Phase 1 failed)
- `backup/pre-rewrite-2025-12-29` - Optional additional backup

**⚠️ DO NOT PROCEED WITHOUT CREATING THIS BRANCH ⚠️**

---

### Step 1: Choose Migration Strategy

**Option A: Big Bang (Risky)**
- Create new branch from stable commit ✅ Already done in Step 0
- Implement all phases at once
- Swap in one PR
- Risk: High (all or nothing)

**Option B: Incremental (Safer)** ✅ **RECOMMENDED**
1. Keep current code working (don't break existing functionality)
2. Add new clipStore with helpers (Phase 1)
3. Add workers but don't activate yet (Phase 2)
4. Modify useClipRecording to return values (Phase 3)
5. Switch ClipMasterScreen to use new flow for NEW recordings only
6. Add feature flag: `USE_NEW_ARCHITECTURE = true/false`
7. Test new flow thoroughly on new recordings
8. Switch flag to true globally, deprecate old code
9. Delete old code after 1 week of stability

---

### Step 2: Feature Flag Implementation

**After creating git branch (Step 0), implement feature flag for safe testing:**

```ts
// In .env or config
USE_NEW_ARCHITECTURE=false  // Start with false, test, then switch to true

// In ClipMasterScreen.tsx
const USE_NEW_ARCH = process.env.NEXT_PUBLIC_USE_NEW_ARCH === 'true';

const handleDoneClick = async () => {
  if (USE_NEW_ARCH) {
    // New flow: workers, queue, store-first
    await handleDoneNewFlow();
  } else {
    // Old flow: current implementation (Phase 1 broken state)
    await handleDoneOldFlow();
  }
};
```

**Benefits:**
- ✅ Test new architecture on new recordings without breaking existing data
- ✅ Easy rollback (just set flag to `false`)
- ✅ Side-by-side comparison (toggle flag to compare behaviors)
- ✅ Gradual rollout (test with 10% users first, then 100%)

---

### Step 3: Data Migration (sessionStorage → localStorage)

**One-time migration when user first runs new architecture:**
```ts
// In clipStore.ts or _app.tsx (run once on mount)
useEffect(() => {
  const oldData = sessionStorage.getItem('clipstream-storage');
  const newData = localStorage.getItem('clipstream-storage');

  if (oldData && !newData) {
    // First time using new storage - migrate
    try {
      const parsed = JSON.parse(oldData);
      localStorage.setItem('clipstream-storage', oldData);
      console.log('[Migration] Migrated clips from sessionStorage to localStorage', {
        clipCount: parsed.state?.clips?.length || 0
      });

      // Optional: Clear old storage after successful migration
      // sessionStorage.removeItem('clipstream-storage');
    } catch (error) {
      console.error('[Migration] Failed to migrate storage:', error);
    }
  }
}, []);
```

---

### Step 4: Rollback Plan (If Things Go Wrong)

**Option 1: Flag Rollback (Instant, Recommended First)**
```bash
# In .env or config file
USE_NEW_ARCHITECTURE=false  # Switch back to old flow immediately
```

**Option 2: Git Branch Rollback (Full Revert)**
```bash
# Return to previous branch
git checkout main  # or develop

# Or reset to pre-rewrite commit (on rewrite branch)
git log --oneline  # Find "Checkpoint before 040" commit hash
git reset --hard <checkpoint-commit-hash>

# Or delete rewrite branch entirely and start over
git checkout main
git branch -D rewrite/040-master-writer-zustand-only
git checkout -b rewrite/040-master-writer-zustand-only-v2
```

**Option 3: Code-Level Revert (Selective)**
```bash
# Revert specific commits while keeping branch
git revert <commit-hash>

# Revert range of commits
git revert <start-hash>..<end-hash>
```

**Data Safety:**
- ✅ User data is safe in both sessionStorage (old) and localStorage (new)
- ✅ IndexedDB audio blobs are untouched
- ✅ Switching flag doesn't delete any data
- ✅ Users can switch back and forth without data loss

**When to rollback:**
- New flow causes worse bugs than Phase 1 broken state
- Performance degrades significantly (>2s latency on operations)
- Data corruption detected (transcription spilling worse than before)
- Critical bug in production that can't be hotfixed

---

---

## Phase 1 — Store Becomes the Authority
**Goal:** Zustand owns all data and invariants; UI never calls `services/clipStorage.ts`.

**Clip shape (single source):**
```ts
type ClipStatus = null | 'pending-child' | 'pending-retry' | 'transcribing' | 'formatting' | 'failed';

interface Clip {
  id: string;
  createdAt: number;
  parentId?: string;
  title: string;               // "Recording 01" or AI title
  date: string;                // display string
  rawText: string;
  formattedText: string;
  content?: string;            // legacy
  status: ClipStatus;
  pendingClipTitle?: string;   // "Clip 001"
  audioId?: string;
  duration?: string;
  transcriptionError?: string;
  currentView: 'raw' | 'formatted';

  // Optional flags for UX
  hasAnimatedFormattedOnce?: boolean;  // Prevent typing animation replay
  hasAutoCopied?: boolean;              // Prevent duplicate clipboard writes
}
```

**Store actions (add helpers, remove globals):**
```ts
interface ClipStore {
  clips: Clip[];
  selectedClip: Clip | null;
  setSelectedClip(clip: Clip | null): void;

  // CRUD with invariants
  createParentWithChildPending(audioId: string, duration: string): { parentId: string; childId: string };
  appendPendingChild(parentId: string, audioId: string, duration: string): { childId: string };
  upsertClip(clip: Clip): void;
  updateClip(id: string, patch: Partial<Clip>): void;
  deleteClipCascade(id: string): void; // removes parent+children, or child only

  // Derived queries
  getClipById(id: string): Clip | undefined;
  getChildrenOf(parentId: string): Clip[];
  getPendingClips(): Clip[]; // pending-child | pending-retry
  nextRecordingTitle(): string; // "Recording 01"
  nextPendingTitle(parentId?: string): string; // "Clip 001"
}
```

**Persistence:**
```ts
persist(
  ...,
  {
    name: 'clipstream-storage',
    storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : noopStorage)),
    partialize: (s) => ({ clips: s.clips, selectedClip: s.selectedClip }),
  }
);
```

---

## Phase 1.1 — Detailed Flows (Store-Level)

**Flow: Create parent + first pending child (offline or retry-fail)**
1) Input: `audioId`, `duration`.
2) Compute `parentTitle = nextRecordingTitle()`.
3) Create parent clip (container): `{ id, createdAt, title: parentTitle, date: today(), rawText: '', formattedText: '', status: null, currentView: 'formatted' }`.
4) Create child clip: `{ id, createdAt, parentId: parent.id, title: parentTitle, pendingClipTitle: 'Clip 001', status: 'pending-child', audioId, duration, rawText: '', formattedText: '', currentView: 'formatted' }`.
5) Persist both in one set().

**Flow: Append pending child (same parent)**
1) Input: `parentId`, `audioId`, `duration`.
2) Derive `pendingClipTitle = nextPendingTitle(parentId)` (Clip 002, 003…).
3) Create child with `status: 'pending-child'`, `parentId`, inherit parent title.
4) Persist child.

**Flow: Create online clip (immediate transcription succeeded)**
1) Input: `rawText`, `audioId?`, `duration?`.
2) Compute `title = nextRecordingTitle()`.
3) Create clip: `status: 'formatting'`, `rawText`, `formattedText: ''`, `content: rawText`, `currentView: 'formatted'`.
4) Persist clip; selectedClip set to this clip.
5) Enqueue formatting + title jobs.

**Flow: Complete formatting**
1) Input: `clipId`, `formattedText`.
2) Update: `formattedText`, `status: null`, `audioId: undefined`.
3) If selected, update `selectedClip`.

**Flow: Mark failed transcription**
1) Input: `clipId`, `error`.
2) Update: `status: 'failed'`, `transcriptionError: error`.

---

## Phase 1.5 — Queue Architecture (Critical Foundation)

**Goal:** Implement job queue system for formatting and title generation.

**Why Queue?**
- Prevents race conditions (sequential processing)
- Decouples job submission from execution
- Enables retry logic
- Workers process jobs independently of UI

**Option A: Simple In-Memory Queue (Phase 1)**
```ts
// utils/jobQueue.ts
interface FormatJob {
  clipId: string;
  rawText: string;
  isAppending: boolean;
}

interface TitleJob {
  clipId: string;
  rawText: string;
}

class JobQueue<T> {
  private queue: T[] = [];
  private processing = false;

  async enqueue(job: T, processor: (job: T) => Promise<void>) {
    this.queue.push(job);
    if (!this.processing) {
      this.processQueue(processor);
    }
  }

  private async processQueue(processor: (job: T) => Promise<void>) {
    this.processing = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        try {
          await processor(job);
        } catch (error) {
          console.error('[Queue] Job failed:', error);
        }
      }
    }
    this.processing = false;
  }
}

// Export singleton instances
export const formatQueue = new JobQueue<FormatJob>();
export const titleQueue = new JobQueue<TitleJob>();

// Usage:
export function enqueueFormatting(job: FormatJob) {
  formatQueue.enqueue(job, processFormatJob);
}

export function enqueueTitle(job: TitleJob) {
  titleQueue.enqueue(job, processTitleJob);
}
```

**Option B: p-queue Library (Production - Recommended)**
```ts
// Install: npm install p-queue
import PQueue from 'p-queue';

// Create queues (concurrency: 1 = sequential)
export const formatQueue = new PQueue({ concurrency: 1 });
export const titleQueue = new PQueue({ concurrency: 1 });

// Usage:
export function enqueueFormatting(job: FormatJob) {
  formatQueue.add(() => processFormatJob(job));
}

export function enqueueTitle(job: TitleJob) {
  titleQueue.add(() => processTitleJob(job));
}

// Benefits:
// - Built-in pause/resume
// - Priority support
// - Better error handling
// - Timeout support
```

**Integration Points:**
- `ClipMasterScreen.tsx`: Call `enqueueFormatting()` after transcription succeeds
- `useRetryDaemon.ts`: Call `enqueueFormatting()` after auto-retry transcription
- `useFormattingWorker.ts`: Consumes jobs from queue
- `useTitleWorker.ts`: Consumes jobs from queue

---

## Phase 2 — Background Workers (decouple from UI)
Create hooks/services that subscribe to the store; no UI state inside.

1) **useRetryDaemon**
   - Listens to `window.online`.
   - Fetches `pending` clips (`pending-child | pending-retry`) from store.
   - Sequentially: fetch audio via `getAudio(audioId)` → transcribe → update `rawText` & `status: 'formatting'` → enqueue formatting → on failure mark `failed`.
   - Never touches `setSelectedClip` or nav state.

2) **useFormattingWorker**
   - Consumes jobs: `{ clipId, rawText, isAppending }`.
   - Calls `/api/clipperstream/format-text` with `existingFormattedContext` when appending.
   - Updates `formattedText`, clears `status` to `null`, deletes audio via `deleteAudio`.
   - On error: set `formattedText = rawText`, `status = null`, clear audio.

3) **useTitleWorker**
   - Wrap existing `useParentTitleGenerator`, but feed it via store selectors.
   - When all children of a parent are `status === null` and have `rawText`, call `/api/clipperstream/generate-title`, update parent title.

**Worker Initialization (Critical - Where to Hook Them):**
```ts
// In _app.tsx (Next.js Pages Router) or pages/_app.tsx
import { useRetryDaemon } from '@/hooks/useRetryDaemon';
import { useFormattingWorker } from '@/hooks/useFormattingWorker';
import { useTitleWorker } from '@/hooks/useTitleWorker';

export default function App({ Component, pageProps }: AppProps) {
  // Initialize all workers at app level
  // These hooks subscribe to store and run independently
  useRetryDaemon();        // Handles online event + auto-retry
  useFormattingWorker();   // Processes formatting queue
  useTitleWorker();        // Generates parent titles

  return <Component {...pageProps} />;
}

// Workers run once per app lifecycle
// They subscribe to Zustand store changes
// They don't need props or context
// They're completely decoupled from UI
```

**Why at app level?**
- Workers should run independently of which page/component is mounted
- App-level ensures they're always active
- No need for React Context (workers access Zustand directly)
- Clean separation: UI components don't manage background jobs

---

## Phase 2.1 — Detailed Flows (Workers)

**Retry daemon (online event)**
1) On `online`: fetch `pending = getPendingClips()`.
2) For each `clip` (sequential):
   - If no `audioId`, mark `failed` and continue.
   - Load blob: `blob = await getAudio(audioId)`. If missing → `failed`.
   - `updateClip(clip.id, { status: 'transcribing', transcriptionError: undefined })`.
   - `{ rawText, success } = await transcribeRecording(blob)`.
   - If !success or !rawText → `updateClip(..., { status: 'failed', transcriptionError: 'Transcription failed' })`; continue.
   - `updateClip(..., { rawText, status: 'formatting' })`.
   - `enqueueFormatting({ clipId: clip.id, rawText, isAppending: false })`.

**Formatting worker**
1) Dequeue job `{ clipId, rawText, isAppending }`.
2) Read latest clip; compute `context = isAppending ? clip.formattedText : undefined`.
3) Fetch `/api/clipperstream/format-text` with `{ rawText, existingFormattedContext: context }`, with timeout/abort.
4) On success:
   - `formattedText = isAppending ? (clip.formattedText || '') + formattedTextResp : formattedTextResp`.
   - `updateClip(..., { formattedText, status: null, audioId: undefined })`.
   - If `clip.audioId` exists: `deleteAudio(audioId)` and clear it.
   - If selected clip: optional auto-copy (guarded) and animation flag update.
5) On error:
   - `updateClip(..., { formattedText: rawText, status: null, audioId: undefined, transcriptionError: 'Formatting failed' })`.
   - Attempt `deleteAudio(audioId)` best-effort.

**Title worker**
1) Subscribe to clips; for each parent with `title` starting `Recording `:
   - Get children = `getChildrenOf(parent.id)`.
   - If none, skip.
   - If all children `status === null` and `rawText` present:
     - Use first child `rawText` → POST `/api/clipperstream/generate-title`.
     - On success: `updateClip(parent.id, { title })`.
     - Dedup generation per parent (in-memory set).

---

## Phase 2.2 — Bad Network Retry Logic (3 Attempts + Interval)

**Goal:** Handle scenario where user is "online" but network is too slow/unstable to transcribe.

**Flow:**
1. User clicks Done → `transcribeRecording()` attempts transcription
2. Attempt 1 fails (timeout or network error)
3. Auto-retry: Attempt 2 fails
4. Auto-retry: Attempt 3 fails
5. After 3 failures:
   - Save audio to IndexedDB
   - Create pending clip (status: `'pending-retry'`)
   - Start interval: every 5 seconds, check if online and retry
6. Interval retry succeeds:
   - Proceed to formatting normally
   - Stop interval

**Implementation in useClipRecording.ts:**
```ts
async function transcribeRecording(audioBlob: Blob): Promise<{ rawText: string; success: boolean }> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      log.debug(`Transcription attempt ${attempt}/3`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch('/api/clipperstream/transcribe', {
        method: 'POST',
        body: audioBlob,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const { text } = await response.json();
      log.info(`Transcription successful on attempt ${attempt}`);

      return { rawText: text, success: true };

    } catch (error) {
      log.warn(`Transcription attempt ${attempt} failed:`, error);

      if (attempt < 3) {
        // Wait before retry (exponential backoff)
        const delay = 1000 * attempt; // 1s, 2s
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // All 3 attempts failed
  log.error('Transcription failed after 3 attempts');
  return { rawText: '', success: false };
}
```

**Interval Retry Logic (in useRetryDaemon or separate hook):**
```ts
// In useRetryDaemon.ts
useEffect(() => {
  // Interval for pending-retry clips (bad network scenario)
  const interval = setInterval(async () => {
    if (!navigator.onLine) return;

    const retryClips = useClipStore.getState().clips.filter(
      c => c.status === 'pending-retry'
    );

    for (const clip of retryClips) {
      if (!clip.audioId) continue;

      try {
        const audioBlob = await getAudio(clip.audioId);
        if (!audioBlob) continue;

        useClipStore.getState().updateClip(clip.id, { status: 'transcribing' });

        const { rawText, success } = await transcribeRecording(audioBlob);

        if (success && rawText) {
          // Success! Proceed to formatting
          useClipStore.getState().updateClip(clip.id, {
            rawText,
            status: 'formatting',
          });
          enqueueFormatting({ clipId: clip.id, rawText, isAppending: false });
        } else {
          // Still failing - keep in pending-retry
          useClipStore.getState().updateClip(clip.id, {
            status: 'pending-retry',
            transcriptionError: 'Network unstable, retrying...',
          });
        }
      } catch (error) {
        // Keep retrying
        log.debug('Interval retry failed, will try again:', error);
      }
    }
  }, 5000); // Every 5 seconds

  return () => clearInterval(interval);
}, [transcribeRecording]);
```

**UI Display for pending-retry:**
- Show static spinner (not animated)
- Show text: "Between attempts... (5s)" or "Retrying..."
- Don't block user from doing other things

---

## Phase 2.3 — Error Handling & Recovery

**Goal:** Handle permanent failures gracefully without blocking user.

**Transcription fails permanently:**
- After multiple interval retries, user can manually trigger retry
- Add "Retry" button in clip UI for failed clips
- On click: Reset status to `'pending-retry'`, restart process

**Implementation:**
```ts
// In ClipRecordScreen or ClipListItem
const handleRetryTranscription = async (clipId: string) => {
  const clip = useClipStore.getState().getClipById(clipId);
  if (!clip?.audioId) return;

  const audioBlob = await getAudio(clip.audioId);
  if (!audioBlob) {
    alert('Audio not found. Cannot retry.');
    return;
  }

  useClipStore.getState().updateClip(clipId, {
    status: 'transcribing',
    transcriptionError: undefined,
  });

  const { rawText, success } = await transcribeRecording(audioBlob);

  if (success) {
    useClipStore.getState().updateClip(clipId, {
      rawText,
      status: 'formatting',
    });
    enqueueFormatting({ clipId, rawText, isAppending: false });
  } else {
    useClipStore.getState().updateClip(clipId, {
      status: 'failed',
      transcriptionError: 'Transcription failed. Check network.',
    });
  }
};
```

**Formatting fails:**
- Fallback: Use `rawText` as `formattedText`
- Set `status: null` (clip is "done" even though formatting failed)
- Show warning toast: "Formatting unavailable, showing raw text"
- Don't block clip completion

**Implementation (already in Phase 2.1, but emphasized):**
```ts
// In formatting worker catch block
catch (error) {
  log.warn('Formatting failed, using raw text fallback:', error);

  useClipStore.getState().updateClip(clipId, {
    formattedText: rawText, // ✅ Fallback to raw
    status: null,            // ✅ Mark as complete
    audioId: undefined,
    transcriptionError: 'Formatting failed', // Info for user
  });

  if (clip.audioId) {
    await deleteAudio(clip.audioId).catch(() => {}); // Best effort
  }

  // Optional: Show toast
  setShowErrorToast(true);
}
```

**Title generation fails:**
- Parent keeps "Recording 01" placeholder
- User can manually rename via edit button
- Don't block clip completion
- Log warning but don't show error to user

**Audio deletion fails:**
- Log warning but continue
- `audioId` stays in clip metadata
- On next access: handle missing audio gracefully with try/catch

**Error Recovery Checklist:**
- ✅ No operation should block user permanently
- ✅ All errors have manual retry path
- ✅ Failed clips show error state clearly
- ✅ User can delete failed clips to start over

---

## Phase 2.4 — Clipboard Auto-Copy (Detailed)

**Goal:** Auto-copy formatted text to clipboard after formatting completes.

**When to copy:**
- After formatting completes successfully
- Only if the clip is the currently selected clip
- Only once per clip (use `hasAutoCopied` flag)
- Only in user gesture context (browser security requirement)

**Implementation in formatting worker:**
```ts
// In useFormattingWorker.ts, after updating formattedText
async function processFormatJob({ clipId, rawText, isAppending }) {
  const clip = useClipStore.getState().getClipById(clipId);
  if (!clip) return;

  const context = isAppending ? clip.formattedText : undefined;

  try {
    const res = await fetch('/api/clipperstream/format-text', {
      method: 'POST',
      body: JSON.stringify({ rawText, existingFormattedContext: context }),
    });

    if (!res.ok) throw new Error('Format API failed');

    const { formattedText } = await res.json();
    const updated = isAppending
      ? (clip.formattedText || '') + formattedText
      : formattedText;

    // Update store
    useClipStore.getState().updateClip(clipId, {
      formattedText: updated,
      status: null,
      audioId: undefined,
    });

    // Auto-copy if this is the selected clip and hasn't been copied yet
    const selectedClip = useClipStore.getState().selectedClip;

    if (selectedClip?.id === clipId && !clip.hasAutoCopied) {
      try {
        await navigator.clipboard.writeText(updated);

        useClipStore.getState().updateClip(clipId, {
          hasAutoCopied: true, // Prevent duplicate copies
        });

        log.info('Auto-copied formatted text to clipboard');

        // Show success toast (optional)
        // setShowCopyToast(true);
      } catch (error) {
        // Clipboard API might fail (no user gesture context, permissions)
        log.warn('Auto-copy failed:', error);
        // Fail silently - don't block user
      }
    }

    // Delete audio blob (no longer needed)
    if (clip.audioId) {
      await deleteAudio(clip.audioId);
    }

  } catch (error) {
    // Fallback: use raw text
    useClipStore.getState().updateClip(clipId, {
      formattedText: rawText,
      status: null,
      audioId: undefined,
    });

    if (clip.audioId) {
      await deleteAudio(clip.audioId).catch(() => {});
    }
  }
}
```

**Manual copy (user clicks copy button):**
```ts
// In ClipRecordScreen or copy button handler
const handleCopyClick = async () => {
  if (!selectedClip) return;

  const textToCopy = selectedClip.currentView === 'raw'
    ? selectedClip.rawText
    : selectedClip.formattedText;

  try {
    await navigator.clipboard.writeText(textToCopy);
    setShowCopyToast(true);
  } catch (error) {
    console.error('Copy failed:', error);
    // Fallback: Show text in modal for manual copy
  }
};
```

**Store field addition (already added in Phase 1):**
```ts
interface Clip {
  // ... existing fields
  hasAutoCopied?: boolean; // ✅ Already added in Clip interface
}
```

---

## Phase 3 — Recording Pipeline (UI → store)
Refactor `useClipRecording.transcribeRecording` to return `{ rawText, success }` (or throw) and not mutate component state.

**On “Done” (online):**
1. `stopRecording()` → `{ audioBlob, audioId, duration }`.
2. Transcribe: `{ rawText, success } = await transcribeRecording(audioBlob)`.
3. If fail: `createParentWithChildPending(audioId, duration)` and exit.
4. If success: create clip in store:
```ts
const clipId = randomId();
addClip({
  id: clipId,
  createdAt: Date.now(),
  title: nextRecordingTitle(),
  date: new Date().toLocaleDateString(),
  rawText,
  formattedText: '',
  content: rawText,
  status: 'formatting',
  currentView: 'formatted',
});
```
5. Enqueue formatting job `{ clipId, rawText, isAppending: false }`.
6. Enqueue title job `{ clipId, rawText }`.
7. Set `selectedClip = clip`.

**Offline path (or 3x retry fail):**
- Call `createParentWithChildPending(audioId, duration)`; status `pending-child`; parent `status: null`.

**Appending (online):**
- Use `appendPendingChild` semantics for offline, or if online with existing clip, create a child (preferred) and enqueue formatting with `existingFormattedContext`.

---

## Phase 3.1 — Detailed Flows (User actions)

**Record click (from home)**
1) Set view to record screen; navState = `recording`.
2) `resetRecording()`; `startRecording()`.

**Done click (online)**
1) `stopRecording()` → `{ audioBlob, audioId, duration }`.
2) `recordNavState = 'processing'`.
3) `{ rawText, success } = await transcribeRecording(audioBlob)`.
4) If !success → `createParentWithChildPending(audioId, duration)`; `recordNavState = 'record'`; exit.
5) Create clip (online flow) in store (status `formatting`); set selectedClip.
6) Enqueue formatting `{ clipId, rawText, isAppending: false }`.
7) Enqueue title `{ clipId, rawText }`.
8) `recordNavState = 'complete'`.

**Done click (offline or retry-failed)**
1) `stopRecording()` → `{ audioBlob, audioId, duration }`.
2) Detect offline or `success === false`.
3) `createParentWithChildPending(audioId, duration)`.
4) Show pending list; `recordNavState = 'record'` or `complete` if append context.

**Append to existing (online)**
1) Selected clip exists and completed → set append mode.
2) `stopRecording()` → `{ audioBlob, audioId, duration }`.
3) Transcribe → if success:
   - Decide: create child (preferred) or update parent rawText.
   - If child: `appendPendingChild` only for offline; for online append, update parent rawText immediately and set `status: 'formatting'`.
   - Enqueue formatting `{ rawText: newText, isAppending: true }` with context.
4) On failure/offline: `appendPendingChild(parentId, audioId, duration)`.

---

## Phase 4 — UI Cutover
- `ClipRecordScreen`: render from `selectedClip` and children; drop `contentBlocks` as data source. Use store selectors. Animation can be driven by “formattedText changed” and a per-clip `hasAnimatedFormatted` flag in store if needed.
- `ClipHomeScreen`: use store-derived parents; status from children via selector; use store actions for delete/rename/copy (no `clipStorage` calls).
- `ClipMasterScreen`: keep only view state (which screen, nav state, search active), and wiring to hooks; remove `useTranscriptionHandler`, `contentBlocks`, `active*` flags; subscribe to store for data.

---

## Phase 4.1 — Typing Animation Restoration (detailed)
**Goal:** Animate formatted text once per clip when it transitions to `status: null` after formatting.

**Add to store (optional):**
```ts
hasAnimatedFormattedOnce?: boolean;
```

**In ClipRecordScreen (or a small hook):**
```ts
const [displayedText, setDisplayedText] = useState('');
const [isAnimating, setIsAnimating] = useState(false);
useEffect(() => {
  if (!selectedClip?.formattedText) return;
  const shouldAnimate =
    selectedClip.status === null &&
    !selectedClip.hasAnimatedFormattedOnce; // store flag

  if (shouldAnimate) {
    setIsAnimating(true);
    const text = selectedClip.formattedText;
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i += 1;
      if (i > text.length) {
        clearInterval(timer);
        setIsAnimating(false);
        useClipStore.getState().updateClip(selectedClip.id, { hasAnimatedFormattedOnce: true });
      }
    }, 10);
    return () => clearInterval(timer);
  } else {
    setDisplayedText(selectedClip.formattedText);
  }
}, [selectedClip?.formattedText, selectedClip?.status]);
```

**Render:**
```jsx
<p>{displayedText}</p>
```

---

## Phase 4.2 — Parent/Child Display Logic (Detailed)

**Goal:** ClipRecordScreen shows correct content for parents vs children.

**Problem:** When viewing a parent clip with children, showing `parent.formattedText` displays empty content (parent has no content - children do).

**Solution:** Detect parent/child and render appropriately.

**Implementation in ClipRecordScreen.tsx:**
```tsx
import { useMemo } from 'react';
import { useClipStore } from '@/store/clipStore';

const ClipRecordScreen = () => {
  const selectedClip = useClipStore(state => state.selectedClip);
  const clips = useClipStore(state => state.clips);

  // Derive display content and pending children
  const { displayContent, pendingChildren, showPendingList } = useMemo(() => {
    if (!selectedClip) {
      return {
        displayContent: '',
        pendingChildren: [],
        showPendingList: false,
      };
    }

    // Check if this is a parent clip (no parentId = it's a parent)
    const isParent = !selectedClip.parentId;

    if (isParent) {
      // Get children of this parent
      const children = clips.filter(c => c.parentId === selectedClip.id);

      if (children.length > 0) {
        // Parent with children - show children list, not parent content
        return {
          displayContent: null,
          pendingChildren: children,
          showPendingList: true,
        };
      }

      // Parent with no children - show parent's content (rare case)
      const text = selectedClip.currentView === 'raw'
        ? selectedClip.rawText
        : selectedClip.formattedText;

      return {
        displayContent: text,
        pendingChildren: [],
        showPendingList: false,
      };
    }

    // Child clip or standalone clip - show its content
    const text = selectedClip.currentView === 'raw'
      ? selectedClip.rawText
      : selectedClip.formattedText;

    return {
      displayContent: text,
      pendingChildren: [],
      showPendingList: false,
    };
  }, [selectedClip, clips]);

  // Render
  if (showPendingList) {
    // Show pending clips list for parent
    return (
      <div className={styles.pendingContainer}>
        <h3>Clips in "{selectedClip.title}"</h3>
        <PendingClipsList clips={pendingChildren} />
      </div>
    );
  }

  return (
    <div className={styles.content}>
      {displayContent || <EmptyState text="No content yet" />}
    </div>
  );
};
```

**PendingClipsList component:**
```tsx
interface PendingClipsListProps {
  clips: Clip[];
}

const PendingClipsList = ({ clips }: PendingClipsListProps) => {
  return (
    <div className={styles.pendingList}>
      {clips.map(clip => (
        <PendingClipItem key={clip.id} clip={clip} />
      ))}
    </div>
  );
};

const PendingClipItem = ({ clip }: { clip: Clip }) => {
  // Derive status icon from clip.status
  const statusIcon = useMemo(() => {
    switch (clip.status) {
      case 'transcribing':
        return <Spinner animated className="orange" />;
      case 'formatting':
        return <Spinner animated className="orange" />;
      case 'pending-child':
      case 'pending-retry':
        return <Spinner static className="orange" />;
      case 'failed':
        return <ErrorIcon />;
      case null:
        return <CheckIcon />;
      default:
        return null;
    }
  }, [clip.status]);

  return (
    <div className={styles.pendingClipItem}>
      <span className={styles.pendingTitle}>{clip.pendingClipTitle}</span>
      <span className={styles.duration}>{clip.duration}</span>
      {statusIcon}
    </div>
  );
};
```

**Key Points:**
- ✅ Parents with children show children list
- ✅ Children show their own content
- ✅ Standalone clips show their content
- ✅ Each pending clip shows its own status indicator

---

## Phase 4.3 — Status Indicators Implementation (Detailed)

**Goal:** Show accurate status indicators based on clip/children state.

**Problem:** Currently using global flags (`activeHttpClipId`) which don't work for concurrent processing.

**Solution:** Derive status from each clip's `status` field directly.

**Implementation in ClipHomeScreen.tsx:**
```tsx
import { useMemo } from 'react';
import { useClipStore } from '@/store/clipStore';

const ClipHomeScreen = () => {
  const clips = useClipStore(state => state.clips);

  // Filter to only parents (no parentId) for home list
  const parentClips = useMemo(() => {
    return clips.filter(c => !c.parentId);
  }, [clips]);

  return (
    <div className={styles.homeContainer}>
      {parentClips.map(clip => (
        <ClipListItem key={clip.id} clip={clip} />
      ))}
    </div>
  );
};

const ClipListItem = ({ clip }: { clip: Clip }) => {
  const clips = useClipStore(state => state.clips);

  // Derive status from children if parent, or own status if child
  const { status, statusText } = useMemo(() => {
    const isParent = !clip.parentId;

    if (!isParent) {
      // Child clip - use its own status
      return {
        status: clip.status,
        statusText: getStatusText(clip.status),
      };
    }

    // Parent clip - derive from children
    const children = clips.filter(c => c.parentId === clip.id);

    if (children.length === 0) {
      // Parent with no children - use own status
      return {
        status: clip.status,
        statusText: getStatusText(clip.status),
      };
    }

    // Check children statuses (priority order)
    if (children.some(c => c.status === 'transcribing')) {
      return { status: 'transcribing', statusText: 'Transcribing...' };
    }

    if (children.some(c => c.status === 'formatting')) {
      return { status: 'formatting', statusText: 'Formatting...' };
    }

    if (children.some(c => c.status === 'pending-child' || c.status === 'pending-retry')) {
      return { status: 'pending-child', statusText: 'Waiting to transcribe' };
    }

    if (children.some(c => c.status === 'failed')) {
      return { status: 'failed', statusText: 'Failed' };
    }

    // All children complete
    return { status: null, statusText: '' };
  }, [clip, clips]);

  // Render status indicator
  const statusIcon = useMemo(() => {
    switch (status) {
      case 'transcribing':
      case 'formatting':
        return <Spinner animated className="orange" />;

      case 'pending-child':
      case 'pending-retry':
        return <Spinner static className="orange" />;

      case 'failed':
        return <ErrorIcon />;

      case null:
        return <CheckIcon />;

      default:
        return null;
    }
  }, [status]);

  return (
    <div className={styles.clipItem} onClick={() => handleClipClick(clip.id)}>
      <div className={styles.clipInfo}>
        <span className={styles.title}>{clip.title}</span>
        <span className={styles.date}>{clip.date}</span>
      </div>

      <div className={styles.clipStatus}>
        {statusText && <span className={styles.statusText}>{statusText}</span>}
        {statusIcon}
      </div>
    </div>
  );
};

// Helper function
function getStatusText(status: ClipStatus): string {
  switch (status) {
    case 'transcribing':
      return 'Transcribing...';
    case 'formatting':
      return 'Formatting...';
    case 'pending-child':
      return 'Waiting to transcribe';
    case 'pending-retry':
      return 'Retrying...';
    case 'failed':
      return 'Failed';
    case null:
      return '';
    default:
      return '';
  }
}
```

**Key Points:**
- ✅ No global flags needed
- ✅ Status derived from store data
- ✅ Accurate for concurrent processing
- ✅ Each clip shows its own status
- ✅ Parents aggregate children statuses

---

## Phase 5 — Migration & Cleanup
- Remove/ignore `services/clipStorage.ts` in UI; if needed keep only for legacy helpers (numbering) but prefer store helpers.
- Switch persist from `sessionStorage` to `localStorage`; consider one-time migration: read old session key and hydrate store once.
- Add audio finalizer in formatting worker to ensure `audioId` is cleared/deleted even on errors.
- Centralize ID generator and date formatter utilities.

---

## Phase 6 — Tests (Comprehensive Examples)

**Goal:** Ensure all critical flows work correctly with automated tests.

### 6.1 — Store Unit Tests

**Test File:** `store/__tests__/clipStore.test.ts`

```ts
import { renderHook, act } from '@testing-library/react';
import { useClipStore } from '../clipStore';

describe('clipStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useClipStore.getState().clips = [];
  });

  describe('createParentWithChildPending', () => {
    it('should create parent with first pending child', () => {
      const { result } = renderHook(() => useClipStore());

      act(() => {
        const { parentId, childId } = result.current.createParentWithChildPending(
          'audio-123',
          '5:23'
        );

        const clips = result.current.clips;

        // Should have 2 clips total
        expect(clips).toHaveLength(2);

        // Parent should exist
        const parent = clips.find(c => c.id === parentId);
        expect(parent).toBeDefined();
        expect(parent?.title).toBe('Recording 01');
        expect(parent?.status).toBeNull();
        expect(parent?.parentId).toBeUndefined();
        expect(parent?.rawText).toBe('');
        expect(parent?.formattedText).toBe('');

        // Child should exist
        const child = clips.find(c => c.id === childId);
        expect(child).toBeDefined();
        expect(child?.parentId).toBe(parentId);
        expect(child?.status).toBe('pending-child');
        expect(child?.pendingClipTitle).toBe('Clip 001');
        expect(child?.audioId).toBe('audio-123');
        expect(child?.duration).toBe('5:23');
      });
    });

    it('should increment recording numbers correctly', () => {
      const { result } = renderHook(() => useClipStore());

      act(() => {
        result.current.createParentWithChildPending('audio-1', '1:00');
        result.current.createParentWithChildPending('audio-2', '2:00');
        result.current.createParentWithChildPending('audio-3', '3:00');
      });

      const parents = result.current.clips.filter(c => !c.parentId);
      expect(parents).toHaveLength(3);
      expect(parents[0].title).toBe('Recording 01');
      expect(parents[1].title).toBe('Recording 02');
      expect(parents[2].title).toBe('Recording 03');
    });
  });

  describe('appendPendingChild', () => {
    it('should append child with correct numbering', () => {
      const { result } = renderHook(() => useClipStore());

      act(() => {
        const { parentId } = result.current.createParentWithChildPending('audio-1', '1:00');

        // Append 3 more children
        result.current.appendPendingChild(parentId, 'audio-2', '2:00');
        result.current.appendPendingChild(parentId, 'audio-3', '3:00');
        result.current.appendPendingChild(parentId, 'audio-4', '4:00');

        const children = result.current.getChildrenOf(parentId);
        expect(children).toHaveLength(4);
        expect(children[0].pendingClipTitle).toBe('Clip 001');
        expect(children[1].pendingClipTitle).toBe('Clip 002');
        expect(children[2].pendingClipTitle).toBe('Clip 003');
        expect(children[3].pendingClipTitle).toBe('Clip 004');
      });
    });

    it('should inherit parent title', () => {
      const { result } = renderHook(() => useClipStore());

      act(() => {
        const { parentId } = result.current.createParentWithChildPending('audio-1', '1:00');

        // Parent should be "Recording 01"
        const parent = result.current.getClipById(parentId);
        expect(parent?.title).toBe('Recording 01');

        const { childId } = result.current.appendPendingChild(parentId, 'audio-2', '2:00');
        const child = result.current.getClipById(childId);

        // Child should inherit parent title
        expect(child?.title).toBe('Recording 01');
      });
    });
  });

  describe('Status Transitions', () => {
    it('should transition from pending-child → transcribing → formatting → null', () => {
      const { result } = renderHook(() => useClipStore());

      act(() => {
        const { childId } = result.current.createParentWithChildPending('audio-1', '1:00');

        // Initial: pending-child
        let child = result.current.getClipById(childId);
        expect(child?.status).toBe('pending-child');

        // Transition to transcribing
        result.current.updateClip(childId, { status: 'transcribing' });
        child = result.current.getClipById(childId);
        expect(child?.status).toBe('transcribing');

        // Transition to formatting (with rawText)
        result.current.updateClip(childId, {
          status: 'formatting',
          rawText: 'This is the transcription',
        });
        child = result.current.getClipById(childId);
        expect(child?.status).toBe('formatting');
        expect(child?.rawText).toBe('This is the transcription');

        // Complete (status: null, formattedText populated, audioId cleared)
        result.current.updateClip(childId, {
          status: null,
          formattedText: 'This is the formatted text.',
          audioId: undefined,
        });
        child = result.current.getClipById(childId);
        expect(child?.status).toBeNull();
        expect(child?.formattedText).toBe('This is the formatted text.');
        expect(child?.audioId).toBeUndefined();
      });
    });

    it('should handle failed status', () => {
      const { result } = renderHook(() => useClipStore());

      act(() => {
        const { childId } = result.current.createParentWithChildPending('audio-1', '1:00');

        result.current.updateClip(childId, {
          status: 'failed',
          transcriptionError: 'Network timeout',
        });

        const child = result.current.getClipById(childId);
        expect(child?.status).toBe('failed');
        expect(child?.transcriptionError).toBe('Network timeout');
      });
    });
  });

  describe('deleteClipCascade', () => {
    it('should delete parent and all children', () => {
      const { result } = renderHook(() => useClipStore());

      act(() => {
        const { parentId } = result.current.createParentWithChildPending('audio-1', '1:00');
        result.current.appendPendingChild(parentId, 'audio-2', '2:00');
        result.current.appendPendingChild(parentId, 'audio-3', '3:00');

        // Should have 4 clips (1 parent + 3 children)
        expect(result.current.clips).toHaveLength(4);

        // Delete parent (cascade)
        result.current.deleteClipCascade(parentId);

        // All should be deleted
        expect(result.current.clips).toHaveLength(0);
      });
    });

    it('should delete only child if child ID provided', () => {
      const { result } = renderHook(() => useClipStore());

      act(() => {
        const { parentId, childId } = result.current.createParentWithChildPending('audio-1', '1:00');
        const { childId: child2Id } = result.current.appendPendingChild(parentId, 'audio-2', '2:00');

        // Should have 3 clips (1 parent + 2 children)
        expect(result.current.clips).toHaveLength(3);

        // Delete first child only
        result.current.deleteClipCascade(childId);

        // Should have 2 clips left (1 parent + 1 child)
        expect(result.current.clips).toHaveLength(2);

        const children = result.current.getChildrenOf(parentId);
        expect(children).toHaveLength(1);
        expect(children[0].id).toBe(child2Id);
      });
    });
  });

  describe('getPendingClips', () => {
    it('should return all pending-child and pending-retry clips', () => {
      const { result } = renderHook(() => useClipStore());

      act(() => {
        const { childId: child1 } = result.current.createParentWithChildPending('audio-1', '1:00');
        const { childId: child2 } = result.current.createParentWithChildPending('audio-2', '2:00');
        const { childId: child3 } = result.current.createParentWithChildPending('audio-3', '3:00');

        // Mark child2 as pending-retry
        result.current.updateClip(child2, { status: 'pending-retry' });

        // Mark child3 as transcribing (not pending)
        result.current.updateClip(child3, { status: 'transcribing' });

        const pending = result.current.getPendingClips();

        // Should return child1 (pending-child) and child2 (pending-retry)
        expect(pending).toHaveLength(2);
        expect(pending.map(c => c.id).sort()).toEqual([child1, child2].sort());
      });
    });
  });
});
```

---

### 6.2 — Worker Tests (Mocked)

**Test File:** `hooks/__tests__/useFormattingWorker.test.ts`

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { useFormattingWorker } from '../useFormattingWorker';
import { useClipStore } from '@/store/clipStore';
import { enqueueFormatting } from '@/utils/jobQueue';
import { deleteAudio } from '@/services/audioStorage';

// Mock dependencies
jest.mock('@/services/audioStorage');
jest.mock('@/store/clipStore');

const mockDeleteAudio = deleteAudio as jest.MockedFunction<typeof deleteAudio>;

describe('useFormattingWorker', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  it('should format text successfully and update store', async () => {
    const mockUpdateClip = jest.fn();
    const mockGetClipById = jest.fn().mockReturnValue({
      id: 'clip-1',
      rawText: 'test raw text',
      formattedText: '',
      audioId: 'audio-123',
      status: 'formatting',
    });

    (useClipStore as any).getState = jest.fn(() => ({
      updateClip: mockUpdateClip,
      getClipById: mockGetClipById,
      selectedClip: null,
    }));

    // Mock successful format API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ formattedText: 'Formatted text here.' }),
    });

    mockDeleteAudio.mockResolvedValueOnce(undefined);

    // Trigger formatting job
    renderHook(() => useFormattingWorker());

    await enqueueFormatting({
      clipId: 'clip-1',
      rawText: 'test raw text',
      isAppending: false,
    });

    // Wait for async processing
    await waitFor(() => {
      expect(mockUpdateClip).toHaveBeenCalledWith('clip-1', {
        formattedText: 'Formatted text here.',
        status: null,
        audioId: undefined,
      });
    });

    expect(mockDeleteAudio).toHaveBeenCalledWith('audio-123');
  });

  it('should fallback to rawText if formatting fails', async () => {
    const mockUpdateClip = jest.fn();
    const mockGetClipById = jest.fn().mockReturnValue({
      id: 'clip-1',
      rawText: 'test raw text',
      formattedText: '',
      audioId: 'audio-123',
      status: 'formatting',
    });

    (useClipStore as any).getState = jest.fn(() => ({
      updateClip: mockUpdateClip,
      getClipById: mockGetClipById,
      selectedClip: null,
    }));

    // Mock failed format API response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    mockDeleteAudio.mockResolvedValueOnce(undefined);

    renderHook(() => useFormattingWorker());

    await enqueueFormatting({
      clipId: 'clip-1',
      rawText: 'test raw text',
      isAppending: false,
    });

    await waitFor(() => {
      expect(mockUpdateClip).toHaveBeenCalledWith('clip-1', {
        formattedText: 'test raw text', // ✅ Fallback to rawText
        status: null,
        audioId: undefined,
      });
    });

    expect(mockDeleteAudio).toHaveBeenCalledWith('audio-123');
  });

  it('should append formatted text when isAppending = true', async () => {
    const mockUpdateClip = jest.fn();
    const mockGetClipById = jest.fn().mockReturnValue({
      id: 'clip-1',
      rawText: 'new raw text',
      formattedText: 'Existing formatted text. ',
      audioId: 'audio-456',
      status: 'formatting',
    });

    (useClipStore as any).getState = jest.fn(() => ({
      updateClip: mockUpdateClip,
      getClipById: mockGetClipById,
      selectedClip: null,
    }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ formattedText: 'New formatted text.' }),
    });

    mockDeleteAudio.mockResolvedValueOnce(undefined);

    renderHook(() => useFormattingWorker());

    await enqueueFormatting({
      clipId: 'clip-1',
      rawText: 'new raw text',
      isAppending: true,
    });

    await waitFor(() => {
      expect(mockUpdateClip).toHaveBeenCalledWith('clip-1', {
        formattedText: 'Existing formatted text. New formatted text.', // ✅ Appended
        status: null,
        audioId: undefined,
      });
    });
  });

  it('should auto-copy if clip is selected and not copied yet', async () => {
    const mockUpdateClip = jest.fn();
    const mockGetClipById = jest.fn().mockReturnValue({
      id: 'clip-1',
      rawText: 'test',
      formattedText: '',
      audioId: 'audio-123',
      status: 'formatting',
      hasAutoCopied: false,
    });

    (useClipStore as any).getState = jest.fn(() => ({
      updateClip: mockUpdateClip,
      getClipById: mockGetClipById,
      selectedClip: { id: 'clip-1' }, // ✅ This clip is selected
    }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ formattedText: 'Formatted text.' }),
    });

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValueOnce(undefined),
      },
    });

    renderHook(() => useFormattingWorker());

    await enqueueFormatting({
      clipId: 'clip-1',
      rawText: 'test',
      isAppending: false,
    });

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Formatted text.');
      expect(mockUpdateClip).toHaveBeenCalledWith('clip-1', {
        hasAutoCopied: true,
      });
    });
  });
});
```

---

### 6.3 — Retry Daemon Tests

**Test File:** `hooks/__tests__/useRetryDaemon.test.ts`

```ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRetryDaemon } from '../useRetryDaemon';
import { useClipStore } from '@/store/clipStore';
import { getAudio } from '@/services/audioStorage';
import { transcribeRecording } from '@/hooks/useClipRecording';
import { enqueueFormatting } from '@/utils/jobQueue';

jest.mock('@/services/audioStorage');
jest.mock('@/hooks/useClipRecording');
jest.mock('@/utils/jobQueue');
jest.mock('@/store/clipStore');

const mockGetAudio = getAudio as jest.MockedFunction<typeof getAudio>;
const mockTranscribeRecording = transcribeRecording as jest.MockedFunction<typeof transcribeRecording>;
const mockEnqueueFormatting = enqueueFormatting as jest.MockedFunction<typeof enqueueFormatting>;

describe('useRetryDaemon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process pending clips on online event', async () => {
    const mockUpdateClip = jest.fn();
    const mockGetPendingClips = jest.fn().mockReturnValue([
      {
        id: 'clip-1',
        status: 'pending-child',
        audioId: 'audio-123',
      },
    ]);

    (useClipStore as any).getState = jest.fn(() => ({
      updateClip: mockUpdateClip,
      getPendingClips: mockGetPendingClips,
    }));

    const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
    mockGetAudio.mockResolvedValueOnce(mockAudioBlob);
    mockTranscribeRecording.mockResolvedValueOnce({
      rawText: 'Transcribed text',
      success: true,
    });

    renderHook(() => useRetryDaemon());

    // Simulate online event
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      // Should update to transcribing
      expect(mockUpdateClip).toHaveBeenCalledWith('clip-1', {
        status: 'transcribing',
        transcriptionError: undefined,
      });

      // Should update to formatting after success
      expect(mockUpdateClip).toHaveBeenCalledWith('clip-1', {
        rawText: 'Transcribed text',
        status: 'formatting',
      });

      // Should enqueue formatting
      expect(mockEnqueueFormatting).toHaveBeenCalledWith({
        clipId: 'clip-1',
        rawText: 'Transcribed text',
        isAppending: false,
      });
    });
  });

  it('should mark clip as failed if transcription fails', async () => {
    const mockUpdateClip = jest.fn();
    const mockGetPendingClips = jest.fn().mockReturnValue([
      {
        id: 'clip-1',
        status: 'pending-child',
        audioId: 'audio-123',
      },
    ]);

    (useClipStore as any).getState = jest.fn(() => ({
      updateClip: mockUpdateClip,
      getPendingClips: mockGetPendingClips,
    }));

    const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
    mockGetAudio.mockResolvedValueOnce(mockAudioBlob);
    mockTranscribeRecording.mockResolvedValueOnce({
      rawText: '',
      success: false, // ❌ Failed
    });

    renderHook(() => useRetryDaemon());

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(mockUpdateClip).toHaveBeenCalledWith('clip-1', {
        status: 'failed',
        transcriptionError: 'Transcription failed',
      });
    });

    // Should NOT enqueue formatting
    expect(mockEnqueueFormatting).not.toHaveBeenCalled();
  });

  it('should skip clips without audioId', async () => {
    const mockUpdateClip = jest.fn();
    const mockGetPendingClips = jest.fn().mockReturnValue([
      {
        id: 'clip-1',
        status: 'pending-child',
        audioId: undefined, // ❌ No audio
      },
    ]);

    (useClipStore as any).getState = jest.fn(() => ({
      updateClip: mockUpdateClip,
      getPendingClips: mockGetPendingClips,
    }));

    renderHook(() => useRetryDaemon());

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(mockUpdateClip).toHaveBeenCalledWith('clip-1', {
        status: 'failed',
      });
    });

    expect(mockGetAudio).not.toHaveBeenCalled();
  });
});
```

---

### 6.4 — Integration Test Example

**Test File:** `__tests__/integration/offline-to-online.test.ts`

```ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClipStore } from '@/store/clipStore';
import { useRetryDaemon } from '@/hooks/useRetryDaemon';
import { useFormattingWorker } from '@/hooks/useFormattingWorker';
import { getAudio, saveAudio } from '@/services/audioStorage';

// Mock audio storage
jest.mock('@/services/audioStorage');

describe('Offline → Online Flow (Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useClipStore.getState().clips = [];

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  it('should complete full flow: offline recording → online → transcribe → format → done', async () => {
    // Step 1: User records offline
    const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
    (saveAudio as jest.Mock).mockResolvedValueOnce('audio-123');
    (getAudio as jest.Mock).mockResolvedValueOnce(mockAudioBlob);

    act(() => {
      const { parentId, childId } = useClipStore.getState().createParentWithChildPending(
        'audio-123',
        '5:23'
      );

      // Verify initial state
      const parent = useClipStore.getState().getClipById(parentId);
      const child = useClipStore.getState().getClipById(childId);

      expect(parent?.title).toBe('Recording 01');
      expect(parent?.status).toBeNull();
      expect(child?.status).toBe('pending-child');
      expect(child?.audioId).toBe('audio-123');
    });

    // Step 2: Initialize workers
    renderHook(() => useRetryDaemon());
    renderHook(() => useFormattingWorker());

    // Step 3: Mock transcription API
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/clipperstream/transcribe')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ text: 'This is the transcribed text.' }),
        });
      }
      if (url.includes('/api/clipperstream/format-text')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ formattedText: 'This is the formatted text.' }),
        });
      }
      return Promise.reject(new Error('Unknown API'));
    });

    // Step 4: Simulate going online
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    // Step 5: Wait for completion
    await waitFor(
      () => {
        const clips = useClipStore.getState().clips;
        const child = clips.find(c => c.pendingClipTitle === 'Clip 001');

        expect(child?.status).toBeNull(); // ✅ Complete
        expect(child?.rawText).toBe('This is the transcribed text.');
        expect(child?.formattedText).toBe('This is the formatted text.');
        expect(child?.audioId).toBeUndefined(); // ✅ Cleaned up
      },
      { timeout: 5000 }
    );
  });
});
```

---

### 6.5 — Error Case Tests

**Test File:** `__tests__/error-cases.test.ts`

```ts
describe('Error Recovery Tests', () => {
  it('should handle missing audio blob gracefully', async () => {
    const mockUpdateClip = jest.fn();
    const mockGetPendingClips = jest.fn().mockReturnValue([
      { id: 'clip-1', status: 'pending-child', audioId: 'audio-missing' },
    ]);

    (useClipStore as any).getState = jest.fn(() => ({
      updateClip: mockUpdateClip,
      getPendingClips: mockGetPendingClips,
    }));

    (getAudio as jest.Mock).mockResolvedValueOnce(null); // ❌ Audio not found

    renderHook(() => useRetryDaemon());

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(mockUpdateClip).toHaveBeenCalledWith('clip-1', {
        status: 'failed',
      });
    });
  });

  it('should handle API timeout during transcription', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );

    const result = await transcribeRecording(new Blob(['audio']));

    expect(result.success).toBe(false);
    expect(result.rawText).toBe('');
  });

  it('should use rawText as fallback if formatting API fails', async () => {
    const mockUpdateClip = jest.fn();
    const mockGetClipById = jest.fn().mockReturnValue({
      id: 'clip-1',
      rawText: 'Raw text fallback',
      formattedText: '',
      audioId: 'audio-123',
    });

    (useClipStore as any).getState = jest.fn(() => ({
      updateClip: mockUpdateClip,
      getClipById: mockGetClipById,
    }));

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

    await enqueueFormatting({
      clipId: 'clip-1',
      rawText: 'Raw text fallback',
      isAppending: false,
    });

    await waitFor(() => {
      expect(mockUpdateClip).toHaveBeenCalledWith('clip-1', {
        formattedText: 'Raw text fallback', // ✅ Fallback
        status: null,
        audioId: undefined,
      });
    });
  });
});
```

---

### 6.6 — Manual Testing Checklist

**Test Scenarios (Run Manually):**

1. **Offline Recording → Online Recovery**
   - [ ] Turn off network (DevTools → Offline)
   - [ ] Record 3 clips
   - [ ] Verify "Clip 001, 002, 003" appear with static spinner
   - [ ] Turn on network
   - [ ] Verify clips process one-by-one (animated spinner)
   - [ ] Verify all clips complete (status: null)
   - [ ] Verify parent gets AI-generated title

2. **Bad Network (3 Attempts + Interval Retry)**
   - [ ] Throttle network to "Slow 3G"
   - [ ] Record clip → Click Done
   - [ ] Verify 3 transcription attempts (watch console logs)
   - [ ] After 3 failures, verify clip saved as pending-retry
   - [ ] Improve network
   - [ ] Verify interval retry succeeds after ~5 seconds

3. **Concurrent Processing**
   - [ ] Record 5 clips offline
   - [ ] Go online
   - [ ] Verify clips process sequentially (not all at once)
   - [ ] Click into "Recording 01" while processing
   - [ ] Verify pending clips list shows accurate statuses
   - [ ] Verify navbar doesn't change to full mode during processing

4. **Parent/Child Display**
   - [ ] Create parent with 3 children
   - [ ] Click parent in home list
   - [ ] Verify shows children list (NOT empty content)
   - [ ] Click child in list
   - [ ] Verify shows child's formatted text

5. **Status Indicators**
   - [ ] Create parent with 2 children
   - [ ] Go online
   - [ ] While processing, verify parent shows:
     - "Transcribing..." when any child is transcribing
     - "Formatting..." when any child is formatting
     - No status when all children complete

6. **Error Recovery**
   - [ ] Create clip that fails transcription
   - [ ] Verify "Failed" status shown
   - [ ] Click "Retry" button
   - [ ] Verify clip processes successfully

7. **Clipboard Auto-Copy**
   - [ ] Record clip online
   - [ ] After formatting completes, verify text auto-copied
   - [ ] Check clipboard: Cmd+V should paste formatted text

---

### Test Coverage Goals

- ✅ Store transitions: 100% (all status paths tested)
- ✅ Worker logic: 90%+ (including error paths)
- ✅ Integration flows: 80%+ (happy path + critical errors)
- ✅ Manual UI tests: All 7 scenarios passing

---

## Execution Order (practical)
1) Update `clipStore` API + persistence; add helper actions/selectors.
2) Remove UI calls to `clipStorage`; wire Home/Record/Master to store actions/selectors only.
3) Extract workers (`useRetryDaemon`, `useFormattingWorker`, `useTitleWorker`) and hook them at app/root level.
4) Simplify recording flow to use returned transcription text and store updates; delete `useTranscriptionHandler`.
5) UI cleanups: ClipRecordScreen/ClipHomeScreen render only from store; remove `contentBlocks` as truth.
6) Add tests and final cleanup (audio finalizer, ID/date utils).

---

## File-by-File Edit Checklist

### Store Layer
- `store/clipStore.ts`
  - Update `Clip` type and `ClipStatus`.
  - Add helper actions: `createParentWithChildPending`, `appendPendingChild`, `nextRecordingTitle`, `nextPendingTitle`, `getChildrenOf`, `getPendingClips`, `deleteClipCascade`.
  - Switch `persist` to `localStorage` (adapter), keep SSR guard.
  - Remove `activeHttpClipId/activeFormattingClipId/activeTranscriptionParentId` unless still needed by UI (prefer derived selectors).
  - Export selectors (pure functions) for parents, children, pending.

- `services/clipStorage.ts`
  - Mark deprecated for UI; optionally keep numbering utilities but prefer moving them into store.

- `services/audioStorage.ts`
  - Ensure `deleteAudio` is callable from formatting worker; add optional “finalize all” helper if desired.

### Hooks / Workers
- `hooks/useClipRecording.ts`
  - Change `transcribeRecording` to return `{ rawText, success: boolean }` or throw; stop setting global/component state for text.
  - Expose `{ audioBlob, audioId, duration }` on stop.
  - Keep retry logic, but decouple from UI state assumptions.

- Add new hooks:
  - `hooks/useRetryDaemon.ts` (online handler + sequential pending processing; uses store + `getAudio` + transcribe + enqueue format).
  - `hooks/useFormattingWorker.ts` (queue processor; updates store, clears audio).
  - `hooks/useTitleWorker.ts` (wraps `useParentTitleGenerator` logic or replaces it).

- `hooks/useTranscriptionHandler.ts`
  - Remove; logic replaced by store + workers + simple UI handlers.

- `hooks/useOfflineRecording.ts`
  - Refactor to call store helpers (`createParentWithChildPending`, `appendPendingChild`); stop returning pending clip arrays to parent—parent reads from store.

### Screens / Components
- `components/ui/ClipMasterScreen.tsx`
  - Strip `contentBlocks`, `useTranscriptionHandler`, `active*` flags as data sources.
  - On “Record/Done/Append” flows, call store helpers directly and enqueue jobs.
  - Keep only view/navigation state and hook wiring (record bar, screen toggle).
  - Subscribe to store for `clips/selectedClip`; no `clipStorage` imports.

- `components/ui/ClipRecordScreen.tsx`
  - Render content from `selectedClip.rawText/formattedText` (via props from parent using store selectors).
  - Show pending children from store selector; drop `contentBlocks` as truth.
  - Optional: animation driven by `formattedText` change + store flag `hasAnimatedFormatted`.

- `components/ui/ClipHomeScreen.tsx`
  - Use store data for list, status derivation via selectors; remove `clipStorage` delete/rename/copy calls—use store actions.
  - Status indicators driven by parent/child statuses, not `active*` globals.

- Other UI files (buttons/headers/toasts)
- Ensure no imports of `clipStorage`; props should come from parent using store.

### Utilities
- Add `utils/id.ts` (randomId), `utils/date.ts` (display date), optional `utils/storageAdapter.ts` (localStorage/AsyncStorage switch).
- Clipboard writes: wrap in try/catch, only on user gesture and selected clip context.

### Tests (if added)
- Store reducer tests for transitions, numbering, cascade delete.
- Worker tests with mocked fetch/audio: retry sequencing, formatting fallback, title trigger.

---

## Skeletons

**Store helpers (sketch):**
```ts
createParentWithChildPending(audioId, duration) {
  const title = get().nextRecordingTitle();
  const parentId = randomId();
  const childId = randomId();
  const parent = { id: parentId, createdAt: Date.now(), title, date: today(), rawText: '', formattedText: '', status: null, currentView: 'formatted' };
  const child = { id: childId, createdAt: Date.now(), parentId, title, date: today(), rawText: '', formattedText: '', status: 'pending-child', pendingClipTitle: 'Clip 001', audioId, duration, currentView: 'formatted' };
  set((s) => ({ clips: [...s.clips, parent, child] }));
  return { parentId, childId };
}

appendPendingChild(parentId, audioId, duration) {
  const title = get().nextPendingTitle(parentId);
  const childId = randomId();
  const parent = get().getClipById(parentId);
  const child = { id: childId, createdAt: Date.now(), parentId, title: parent?.title || title, date: today(), rawText: '', formattedText: '', status: 'pending-child', pendingClipTitle: title, audioId, duration, currentView: 'formatted' };
  set((s) => ({ clips: [...s.clips, child] }));
  return { childId };
}
```

**Retry daemon (sketch):**
```ts
useEffect(() => {
  const onOnline = async () => {
    const pending = useClipStore.getState().getPendingClips();
    for (const clip of pending) {
      const audio = clip.audioId ? await getAudio(clip.audioId) : null;
      if (!audio) continue;
      useClipStore.getState().updateClip(clip.id, { status: 'transcribing', transcriptionError: undefined });
      const { rawText, success } = await transcribeRecording(audio);
      if (!success || !rawText) {
        useClipStore.getState().updateClip(clip.id, { status: 'failed', transcriptionError: 'Transcription failed' });
        continue;
      }
      useClipStore.getState().updateClip(clip.id, { rawText, status: 'formatting' });
      enqueueFormatting({ clipId: clip.id, rawText, isAppending: false });
    }
  };
  window.addEventListener('online', onOnline);
  return () => window.removeEventListener('online', onOnline);
}, [transcribeRecording, enqueueFormatting]);
```

**Formatting worker (sketch):**
```ts
async function processFormat({ clipId, rawText, isAppending }) {
  const clip = useClipStore.getState().getClipById(clipId);
  if (!clip) return;
  const context = isAppending ? clip.formattedText : undefined;
  try {
    const res = await fetch('/api/clipperstream/format-text', { method: 'POST', body: JSON.stringify({ rawText, existingFormattedContext: context }) });
    if (!res.ok) throw new Error('format failed');
    const { formattedText } = await res.json();
    const updated = isAppending ? (clip.formattedText || '') + formattedText : formattedText;
    useClipStore.getState().updateClip(clipId, { formattedText: updated, status: null, audioId: undefined });
    if (clip.audioId) await deleteAudio(clip.audioId);
  } catch {
    useClipStore.getState().updateClip(clipId, { formattedText: rawText, status: null, audioId: undefined });
    if (clip.audioId) await deleteAudio(clip.audioId).catch(() => {});
  }
}
```

---

## Notes
- Clipboard side effects: wrap in try/catch and only when the clip is selected and in a user gesture context.
- Animation: add a per-clip flag `hasAnimatedFormattedOnce` in store if you need to prevent replays.
- Keep UI nav state local; all data and statuses from store.
