# ACTION PLAN: Sequential Processing Fix

**Purpose**: Step-by-step plan to fix transcription queue issues
**Approach**: Start simple, escalate if needed
**Target**: 2 hours to first test

---

## STRATEGY

**Philosophy**: Fix one thing at a time, test, then proceed

1. **Step 1**: Quick win (home screen buttons) - Build confidence
2. **Step 2**: Core fix (sequential processing) - Address root cause
3. **Step 3**: Test and decide - Verify or escalate

**If Step 2 fails**: We know we need bigger refactor (task queue library or event-driven)

---

## STEP 1: FIX HOME SCREEN BUTTONS (Quick Win)

### Problem
Copy and structure buttons appear on home screen (should only be on record screen)

### Investigation Needed
1. Find where these buttons are rendered
2. Check conditional logic - what determines visibility?
3. Identify if it's related to state leak from transcription flow

### Proposed Fix
**TODO**: Need to investigate code before proposing fix
- Likely: Button visibility tied to wrong screen state
- May need: Proper screen context check

### Expected Result
- ✅ Home screen shows NO copy/structure buttons
- ✅ Record screen shows copy/structure buttons correctly

### Time Estimate
30 minutes (investigate + fix + test)

---

## STEP 2: IMPLEMENT SEQUENTIAL PROCESSING

### Goal
Make auto-retry process ONE clip completely before starting next

### Current Problem
```typescript
// ClipMasterScreen.tsx auto-retry loop (line 510)
for (const clip of pendingClips) {
  await transcribeRecording(audioBlob);  // Waits for HTTP ✅
  // But formatting happens async, doesn't wait ❌
  // Next clip starts immediately
}
```

**Result**:
- Clip 2 HTTP starts while Clip 1 still formatting
- Global `transcription` gets overwritten
- Global `isFormatting` blocks processing

### The Fix: Two Options

#### **Option 2A: Polling Approach** (From 016 Option C)

**Pros**: Guaranteed to work, minimal changes
**Cons**: Polling is code smell, not elegant

**Implementation**:

```typescript
// ClipMasterScreen.tsx - Add helper function
const waitForClipToComplete = (clipId: string): Promise<void> => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const clip = getClips().find(c => c.id === clipId);

      // Clip is complete when status cleared AND has content
      if (clip && clip.status === null && clip.formattedText) {
        clearInterval(checkInterval);
        log.debug('Clip completed', { clipId });
        resolve();
      }
    }, 100); // Check every 100ms
  });
};

// Update auto-retry loop (around line 510)
for (const clip of pendingClips) {
  log.info('Processing clip', { clipId: clip.id });

  const audioBlob = await getAudio(clip.audioId);
  if (!audioBlob) continue;

  setActiveHttpClipId(clip.id);

  try {
    // Wait for HTTP
    await transcribeRecording(audioBlob);

    // NEW: Wait for complete processing (format + title + cleanup)
    log.debug('Waiting for clip to complete', { clipId: clip.id });
    await waitForClipToComplete(clip.id);
    log.info('Clip fully processed', { clipId: clip.id });

  } finally {
    setActiveHttpClipId(null);
  }
}
```

**Why This Works**:
- Forces sequential processing: Clip 2 CANNOT start until Clip 1 done
- `transcription` won't get overwritten (only one clip at a time)
- `isFormatting` won't block (each clip waits for previous to finish)
- Batching SHOULD work (clips process in order with correct timing)

---

#### **Option 2B: Promise Chain Approach** (Cleaner)

**Pros**: No polling, proper async/await
**Cons**: Requires adding completion callbacks

**Implementation**:

```typescript
// ClipMasterScreen.tsx - Store completion resolvers
const clipCompletionResolvers = useRef<Map<string, () => void>>(new Map());

// formatTranscriptionInBackground - At the very end, after audio deletion
if (clipCompletionResolvers.current.has(clipId)) {
  const resolve = clipCompletionResolvers.current.get(clipId);
  resolve();
  clipCompletionResolvers.current.delete(clipId);
}

// Auto-retry loop
for (const clip of pendingClips) {
  setActiveHttpClipId(clip.id);

  try {
    // Create Promise that resolves when this clip completes
    const completionPromise = new Promise<void>((resolve) => {
      clipCompletionResolvers.current.set(clip.id, resolve);
    });

    await transcribeRecording(audioBlob);

    // Wait for formatting to call our resolver
    await completionPromise;

  } finally {
    setActiveHttpClipId(null);
  }
}
```

**Why This Works**:
- Clean async/await pattern
- No polling overhead
- Explicit completion signal

**Why It's More Complex**:
- Requires modifying formatTranscriptionInBackground
- Need to manage resolver cleanup
- More places to make mistakes

---

### Recommendation: Start with Option 2A (Polling)

**Reasoning**:
1. Easier to implement (self-contained)
2. Guaranteed to work (proven pattern)
3. Can refactor to 2B later if needed
4. Validates our theory about the root cause

**If polling bothers you**: Implement 2A, test it works, THEN refactor to 2B

---

## STEP 3: TEST WITH 4-CLIP SCENARIO

### Test Setup
1. Clear all data (fresh start)
2. Go offline
3. Create parent with 4 audio recordings
4. Return online
5. Observe auto-retry

### Success Criteria

#### Visual (User-Facing)
- [ ] Parent spinner ROTATES continuously during queue
- [ ] Clips transition: pending-child → transcribing → complete
- [ ] All 4 clips show correct content
- [ ] No "stuck" clips with status='transcribing'
- [ ] Home screen buttons don't appear

#### Storage (Data Integrity)
- [ ] Clip 1: formattedText = "Clip 001..." ✅
- [ ] Clip 2: formattedText = "Clip 002..." ✅
- [ ] Clip 3: formattedText = "Clip 003..." ✅
- [ ] Clip 4: formattedText = "Clip 004..." ✅
- [ ] All clips: status = null ✅
- [ ] All clips: audioId = undefined (deleted) ✅

#### Console Logs (Process Verification)
```
Expected pattern:

[ClipMasterScreen] Processing clip 1
[useClipRecording] Transcription successful (Clip 001...)
[useTranscriptionHandler] First pending → format immediately
[ClipMasterScreen] Waiting for clip to complete (clip 1)
[ClipMasterScreen] Clip fully processed (clip 1)

[ClipMasterScreen] Processing clip 2
[useClipRecording] Transcription successful (Clip 002...)
[useTranscriptionHandler] Not first → batching (remaining: 2)
[ClipMasterScreen] Waiting for clip to complete (clip 2)
[ClipMasterScreen] Clip fully processed (clip 2)

[ClipMasterScreen] Processing clip 3
[useClipRecording] Transcription successful (Clip 003...)
[useTranscriptionHandler] Batching (remaining: 1)
[ClipMasterScreen] Waiting for clip to complete (clip 3)
[ClipMasterScreen] Clip fully processed (clip 3)

[ClipMasterScreen] Processing clip 4
[useClipRecording] Transcription successful (Clip 004...)
[useTranscriptionHandler] Batching (remaining: 0) → FLUSH
[useTranscriptionHandler] Formatting batched transcription (clip 2)
[useTranscriptionHandler] Formatting batched transcription (clip 3)
[useTranscriptionHandler] Formatting batched transcription (clip 4)
[ClipMasterScreen] Waiting for clip to complete (clip 4)
[ClipMasterScreen] Clip fully processed (clip 4)
```

---

## STEP 4: DECISION TREE

### IF Step 2A (Polling) Works ✅

**Short Term**:
- Ship it
- Document the polling pattern
- Add TODO comment to refactor later

**Long Term** (Future Sprint):
- Refactor to Option 2B (Promise chain)
- OR implement proper task queue library
- OR consider event-driven architecture

### IF Step 2A Fails ❌

**Possible Reasons**:
1. Batching logic still broken (even with correct timing)
2. `isFormatting` still causes issues somehow
3. Other race condition we haven't identified

**Next Steps**:
- **Escalate to Task Queue** (017 Option A)
  - Use p-queue library
  - Explicit queue management
  - Proven, battle-tested solution

- **OR Escalate to Event-Driven** (017 Option B)
  - Decouple components completely
  - No global state dependencies
  - Bigger refactor but cleaner

### IF Home Screen Buttons Not Related ⚠️

**Then**:
- Fix it separately
- Don't block transcription fix
- Two independent issues

---

## IMPLEMENTATION CHECKLIST

### Prerequisites
- [ ] Read and understand 017_COMPLETE_PROBLEM_CATALOG.md
- [ ] Read and understand 016_COMPLETE_TRANSCRIPTION_FLOW_ANALYSIS.md
- [ ] Fresh coffee ☕

### Step 1: Home Screen Buttons
- [ ] Find where copy/structure buttons rendered
- [ ] Identify visibility conditional
- [ ] Implement fix
- [ ] Test: Home screen vs Record screen
- [ ] Commit: "fix: home screen buttons visibility"

### Step 2A: Sequential Processing (Polling)
- [ ] Add `waitForClipToComplete` helper to ClipMasterScreen
- [ ] Update auto-retry loop to await completion
- [ ] Add debug logging for each step
- [ ] Verify TypeScript compiles
- [ ] Commit: "feat: sequential clip processing with polling"

### Step 3: Test
- [ ] Clear sessionStorage + IndexedDB
- [ ] Create 4-clip offline scenario
- [ ] Return online, trigger auto-retry
- [ ] Capture console logs to new debug file
- [ ] Verify all success criteria
- [ ] Compare logs to expected pattern

### Step 4: Document Results
- [ ] Create new debug file: `013_console_v2.5.7_test.md`
- [ ] Update 017 catalog with results
- [ ] Decide next steps based on outcome

---

## CODE LOCATIONS

### Files to Modify

**ClipMasterScreen.tsx**:
- Add `waitForClipToComplete` helper (after line 800)
- Modify auto-retry loop (around line 510)

**Estimated Changes**: 30-40 lines added

### Files to Check (Step 1)

**ClipRecordHeader.tsx**?
**ClipRecordScreen.tsx**?
**Navigation components**?

Need to grep for copy/structure buttons first.

---

## RISK ASSESSMENT

### Low Risk (High Confidence)
- ✅ Adding polling helper (self-contained)
- ✅ Updating auto-retry loop (explicit await)
- ✅ Testing with 4-clip scenario (reversible)

### Medium Risk (Needs Verification)
- ⚠️ Polling might have performance impact (probably fine for small queues)
- ⚠️ Batching logic might still be broken (will find out in testing)

### High Risk (Would Require Escalation)
- 🚨 If polling doesn't work, need bigger refactor
- 🚨 If event-driven is required, significant time investment

---

## FALLBACK PLAN

**If Everything Fails**:

1. **Nuclear Option**: Disable batching entirely
   - Format each clip immediately (no batching)
   - Slower but guaranteed to work
   - Quick fix to unblock user

2. **Parallel Option**: Process clips in parallel
   - Store transcription per clip (Map structure)
   - Remove global state dependencies
   - More complex but proper solution

3. **Library Option**: Use battle-tested queue
   - p-queue for queue management
   - EventEmitter for communication
   - Proven patterns, less custom code

---

## QUESTIONS BEFORE STARTING

**For User**:

1. **Should we try 016 Option C (this polling approach)?**
   - YES → Proceed with Step 2A
   - NO → Jump to task queue library (Option A)

2. **How important is batching?**
   - CRITICAL → Keep it, fix it properly
   - NICE TO HAVE → Can disable if it blocks progress
   - DON'T CARE → Remove batching, format immediately

3. **Time budget?**
   - 2 hours → Try polling, stop if fails
   - 1 day → Try polling, then task queue if needed
   - No limit → Do it right, event-driven refactor

---

## SUCCESS METRICS

**After Step 2 + Step 3**:

- ✅ 4/4 clips have correct content
- ✅ 0 orphaned audio blobs in IndexedDB
- ✅ 0 clips stuck in "transcribing" state
- ✅ Spinner rotates continuously during queue
- ✅ Batching works (clips 2-4 format together)
- ✅ Parent title updates after first clip

**If we hit 4/6 or more ✅**: Approach works, ship it
**If we hit 2/6 or fewer ✅**: Approach failed, escalate

---

## ESTIMATED TIMELINE

| Step | Optimistic | Realistic | Pessimistic |
|------|-----------|-----------|-------------|
| Step 1 (Buttons) | 15 min | 30 min | 1 hour |
| Step 2A (Polling) | 30 min | 1 hour | 2 hours |
| Step 3 (Test) | 15 min | 30 min | 1 hour |
| **TOTAL** | **1 hour** | **2 hours** | **4 hours** |

**If escalation needed**: +4-8 hours for task queue or event-driven

---

## FINAL RECOMMENDATION

**START WITH**: Option 2A (Polling) + 4-clip test

**REASONING**:
1. Highest confidence it will work (proven pattern)
2. Minimal code changes (low risk)
3. Fast to implement (2 hours max)
4. Validates our theory about root cause
5. Can refactor later if polling bothers us

**NEXT STEP**: Get user approval, then implement
