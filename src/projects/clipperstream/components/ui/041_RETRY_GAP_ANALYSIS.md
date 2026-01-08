# 041 - Retry Mechanism Gap Analysis
## Why Pending Clips Don't Retry After VPN Disabled

**Date**: January 6, 2026
**Issue**: Offline recording → Come online with VPN → Turn off VPN → Clips don't retry
**Root Cause**: No continuous polling mechanism for pending clips
**Status**: 🔴 CRITICAL GAP IDENTIFIED

---

## Executive Summary

### The Problem

When you:
1. **Record offline** → Pending clip created ✅
2. **Come online with VPN on** → Auto-retry triggers → Fails (VPN blocking) ✅
3. **Turn VPN off** → **Nothing happens** ❌

The clips stay in pending state forever until you manually go offline and back online again.

### Root Cause

**Auto-retry ONLY triggers on the `window.addEventListener('online')` event.**

There is NO continuous polling/interval mechanism to retry pending clips that are already online but failed due to temporary issues (like VPN).

---

## What 030_REWRITE_ARCHITECTURE Accomplished

### Goal (From 030_REWRITE_ARCHITECTURE.md)

Make this flow work perfectly:
1. Record offline → pending clip created ✅ **DONE**
2. Go online → auto-transcribes → text replaces pending clip ✅ **DONE (but only once)**
3. Parent gets AI-generated title ✅ **DONE**
4. Status indicators work ✅ **PARTIALLY DONE (missing continuous updates)**
5. No flickering, no disappearing clips ✅ **DONE**

### What Was Implemented

**✅ Zustand State Management** (clipStore.ts):
- Parent-child clip architecture
- Pending clip status ('pending-child', 'pending-retry')
- Sequential processing

**✅ Auto-Retry on 'online' Event** (ClipMasterScreen.tsx lines 1195-1247):
```typescript
useEffect(() => {
  const handleOnline = async () => {
    const pendingChildren = allClips.filter(c =>
      c.audioId && c.status === 'pending-child'
    );

    // Group by parent and process sequentially
    for (const [parentId, children] of childrenByParent.entries()) {
      await processParentChildren(parentId, sortedChildren);
    }
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, [processParentChildren]);
```

**✅ Sequential Processing** (processParentChildren):
- Shows first child immediately ("show first, batch rest")
- Processes children sequentially (one at a time)
- Context-aware formatting with cumulative content

**✅ Retry Logic in useClipRecording** (lines 410-444):
- Attempts 1-3: Immediate retry
- Attempts 4+: Interval retry (1min, 2min, 4min, 5min)
- Works DURING a live transcription attempt

---

## What's Missing: Continuous Retry Mechanism

### The Gap

**Current Behavior**:
```
Record offline → Pending clip created
  ↓
Come online (VPN on) → handleOnline() fires ONCE
  ↓
Transcription fails (VPN blocking)
  ↓
Clip stays in 'pending-child' status
  ↓
Turn VPN off → NO TRIGGER → Clip stays pending forever ❌
```

**Expected Behavior**:
```
Record offline → Pending clip created
  ↓
Come online (VPN on) → handleOnline() fires ONCE
  ↓
Transcription fails (VPN blocking)
  ↓
Clip stays in 'pending-child' status
  ↓
Start interval polling (every 30s) → Check for pending clips
  ↓
Turn VPN off → Next polling cycle detects pending clip
  ↓
Auto-retry triggers → Transcription succeeds ✅
```

### Why Retry in useClipRecording Doesn't Help

The retry mechanism in `useClipRecording.ts` (lines 410-444) works like this:

```typescript
// DURING a transcription attempt
try {
  const result = await transcribeRecording(audioBlob);
} catch (error) {
  // Retry 3 times immediately
  if (retryCount < 3) {
    setTimeout(() => transcribeRecording(), 0);
  } else {
    // Then retry every 1min, 2min, 4min, 5min
    setTimeout(() => transcribeRecording(), waitTime);
  }
}
```

**This ONLY works when**:
- `transcribeRecording()` is actively being called
- The function is in a retry loop

**This DOESN'T work when**:
- The clip is saved as pending
- The function has exited
- Waiting for an external trigger

---

## What Was Planned But Not Implemented

### From 039_v1_AUTO_RETRY_PROPER_ARCHITECTURE.md

**Phase 2: Interval Retry (After 3 failed attempts)**

```typescript
// Set up interval retry for clips that failed immediate retry
useEffect(() => {
  const retryInterval = setInterval(() => {
    const allClips = useClipStore.getState().clips;
    const failedClips = allClips.filter(c =>
      c.audioId && c.status === 'pending-retry'
    );

    if (failedClips.length > 0 && navigator.onLine) {
      console.log('[Interval Retry] Attempting to process', failedClips.length, 'failed clips');
      handleOnline();  // Trigger auto-retry again
    }
  }, 30000);  // Every 30 seconds

  return () => clearInterval(retryInterval);
}, []);
```

**Status**: ❌ **NOT IMPLEMENTED**

This is the missing piece. There's no interval-based polling mechanism running in the background.

---

## Current Architecture vs. Required Architecture

### Current (INCOMPLETE)

```
┌─────────────────────────────────────────────────────────────┐
│ TRIGGER: window 'online' event                              │
│ FREQUENCY: Only when network state changes offline → online│
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Find pending clips → Process → Done                        │
│ If transcription fails → Clip stays pending                │
│ NO FURTHER RETRIES until next 'online' event              │
└─────────────────────────────────────────────────────────────┘
```

**Problem**: If already online and transcription fails (VPN, bad network, etc.), no further retries happen.

---

### Required (COMPLETE)

```
┌─────────────────────────────────────────────────────────────┐
│ TRIGGER 1: window 'online' event                           │
│ FREQUENCY: When network state changes offline → online    │
└─────────────────────────────────────────────────────────────┘
                           ↓
                 Find pending clips
                           ↓
                     Process clips
                           ↓
                 ┌──────────────────┐
                 │ Success?         │
                 └──────────────────┘
                  YES ↓        ↓ NO
                      ↓        ↓
                   Done    Mark as 'pending-retry'
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ TRIGGER 2: Interval polling (every 30s)                    │
│ FREQUENCY: Continuous while app is open                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Check for clips with status 'pending-retry'                │
│ If found and online → Retry transcription                  │
│ Keeps trying until success or app closed                  │
└─────────────────────────────────────────────────────────────┘
```

**Benefit**: Clips automatically retry even if:
- VPN was on, then disabled
- Network was bad, then improved
- API was down, then recovered

---

## Other Architectures Discussed

### From 018_ACTION_PLAN_SEQUENTIAL_FIX.md

**Option 2A: Polling Approach**

```typescript
const waitForClipToComplete = (clipId: string): Promise<void> => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const clip = getClips().find(c => c.id === clipId);

      if (clip && clip.status === null && clip.formattedText) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100); // Check every 100ms
  });
};
```

**Purpose**: Wait for clip formatting to complete before starting next clip
**Status**: ❌ NOT NEEDED - Sequential processing already works (from 030)
**Why not needed**: 030 rewrite fixed the sequential processing issue

---

### From 004_extract_offline_retry_hook.md

**Plan**: Extract retry logic to `useOfflineRetry` hook
**Status**: ❌ NOT IMPLEMENTED
**Why not needed**: Current structure works, extraction not required for fixing retry gap

---

## What Needs to Be Done

### Solution: Add Interval-Based Retry Polling

**File**: `ClipMasterScreen.tsx`

**Add after line 1247** (after the existing auto-retry useEffect):

```typescript
// Continuous interval retry for pending clips
useEffect(() => {
  const retryInterval = setInterval(() => {
    // Only retry if online
    if (!navigator.onLine) {
      return;
    }

    const allClips = useClipStore.getState().clips;

    // Find pending children that need retry
    const pendingChildren = allClips.filter(c =>
      c.audioId &&
      c.status === 'pending-child' &&
      c.parentId
    );

    if (pendingChildren.length === 0) {
      return; // No pending clips, nothing to do
    }

    console.log('[Interval Retry] Found', pendingChildren.length, 'pending clips, triggering retry');

    // Group by parent ID
    const childrenByParent = new Map<string, Clip[]>();
    for (const child of pendingChildren) {
      if (!child.parentId) continue;
      const existing = childrenByParent.get(child.parentId) || [];
      childrenByParent.set(child.parentId, [...existing, child]);
    }

    // Process each parent sequentially
    (async () => {
      for (const [parentId, children] of childrenByParent.entries()) {
        const parent = allClips.find(c => c.id === parentId);
        if (!parent) {
          console.warn('[Interval Retry] Parent not found:', parentId);
          continue;
        }

        const sortedChildren = children.sort((a, b) => {
          const timestampA = parseInt(a.id.split('-')[1], 10) || 0;
          const timestampB = parseInt(b.id.split('-')[1], 10) || 0;
          return timestampA - timestampB;
        });

        console.log('[Interval Retry] Processing parent:', parent.title, '| Children:', sortedChildren.length);
        await processParentChildren(parentId, sortedChildren);
      }
    })();
  }, 30000); // Every 30 seconds

  return () => clearInterval(retryInterval);
}, [processParentChildren]);
```

**What this does**:
1. ✅ Runs every 30 seconds
2. ✅ Checks if online
3. ✅ Finds all pending clips
4. ✅ Groups by parent
5. ✅ Processes sequentially (reuses existing `processParentChildren` function)
6. ✅ Continues until success

---

## Alternative Solutions Considered

### Option A: Use Retry Logic from useClipRecording

**Idea**: Make the retry logic in `useClipRecording.ts` continue even after creating pending clip

**Problems**:
- ❌ Retry logic is tied to a specific recording session
- ❌ Would need to track retry state per pending clip
- ❌ Complex to coordinate across multiple pending clips
- ❌ Retry timers would conflict (multiple clips retrying at different intervals)

**Decision**: ❌ Rejected - Too complex

---

### Option B: Event-Driven Architecture

**Idea**: Use EventEmitter to trigger retries from various events (VPN disabled, network improved, etc.)

**Problems**:
- ❌ Requires major refactor
- ❌ Hard to detect VPN state changes (no native API)
- ❌ More complex than needed

**Decision**: ❌ Rejected - Over-engineered

---

### Option C: Interval Polling (SELECTED)

**Idea**: Simple setInterval that checks for pending clips every 30s

**Benefits**:
- ✅ Simple to implement (30 lines of code)
- ✅ Reuses existing `processParentChildren` function
- ✅ Works for all failure scenarios (VPN, bad network, API down, etc.)
- ✅ No major refactor needed
- ✅ Industry standard pattern

**Drawbacks**:
- ⚠️ Polling is less elegant than event-driven
- ⚠️ Uses minimal CPU every 30s (negligible impact)

**Decision**: ✅ Selected - Best balance of simplicity and effectiveness

---

## Testing Plan

### Test Scenario 1: VPN On → VPN Off

```
1. Turn VPN on
2. Record audio offline
3. Come online (VPN still on)
   → handleOnline() fires
   → Transcription fails (VPN blocking)
   → Clip shows 'pending-child' status
4. Turn VPN off
5. Wait up to 30 seconds
   → Interval retry fires
   → Transcription succeeds ✅
   → Clip shows transcribed text ✅
```

### Test Scenario 2: Bad Network → Good Network

```
1. Simulate bad network (slow connection)
2. Record audio
3. Transcription times out after 30s
   → Clip saved as pending
4. Network improves
5. Wait up to 30 seconds
   → Interval retry fires
   → Transcription succeeds ✅
```

### Test Scenario 3: API Down → API Recovered

```
1. Deepgram API returns 502 error
2. Record audio
3. All retries fail
   → Clip saved as pending
4. API recovers
5. Wait up to 30 seconds
   → Interval retry fires
   → Transcription succeeds ✅
```

---

## Implementation Checklist

- [ ] **Step 1**: Add interval retry useEffect to ClipMasterScreen.tsx (after line 1247)
- [ ] **Step 2**: Test Scenario 1 (VPN on → off)
- [ ] **Step 3**: Test Scenario 2 (bad → good network)
- [ ] **Step 4**: Test Scenario 3 (API down → recovered)
- [ ] **Step 5**: Verify no performance impact (CPU usage, battery drain)
- [ ] **Step 6**: Add console logging for debugging
- [ ] **Step 7**: Update 037_v1.50 to include interval retry (if not already there)

---

## Where This Fits in Overall Architecture

### 030_REWRITE_ARCHITECTURE Status

| Feature | Status |
|---------|--------|
| Parent-child clips | ✅ Implemented |
| Sequential processing | ✅ Implemented |
| Auto-retry on 'online' event | ✅ Implemented |
| Show first, batch rest | ✅ Implemented |
| Context-aware formatting | ✅ Implemented |
| AI title generation | ✅ Implemented |
| **Continuous retry polling** | ❌ **MISSING (this gap)** |

### 037_v1.50_REVISED_PLAN Status

| Feature | Status |
|---------|--------|
| Circuit breaker | ❌ Not implemented yet |
| VPN detection | ❌ Not implemented yet |
| Whisper fallback | ❌ Not implemented yet |
| DNS error classification | ❌ Not implemented yet |
| **Continuous retry** | ❌ **PREREQUISITE (this gap)** |

**Note**: The circuit breaker (v1.50) depends on having working continuous retry. Otherwise, clips that fail due to API downtime will never retry even when API recovers.

---

## Summary

### Current State

✅ **What works**:
- Recording offline → pending clip created
- Coming online → auto-retry fires ONCE
- Sequential processing of multiple pending clips
- Context-aware formatting
- AI title generation

❌ **What doesn't work**:
- **Continuous retry after initial failure**
- VPN on → Come online → Transcription fails → Turn VPN off → No retry
- API down → Come online → Transcription fails → API recovers → No retry

### Root Cause

**Auto-retry only triggers on `window.addEventListener('online')` event.**
**No interval-based polling mechanism for pending clips.**

### Solution

**Add 30-line useEffect to ClipMasterScreen.tsx:**
- setInterval every 30 seconds
- Check for pending clips
- Retry using existing `processParentChildren` function

### Implementation Time

- **Code**: 30 minutes (copy/paste + test)
- **Testing**: 30 minutes (3 scenarios)
- **Total**: 1 hour

---

## Next Steps

1. ✅ **Read this analysis** - Understand the gap
2. ⏳ **Implement interval retry** - Add the useEffect
3. ⏳ **Test thoroughly** - All 3 scenarios
4. ⏳ **Then proceed with v1.50** - Circuit breaker depends on this working

**Priority**: 🔴 **CRITICAL** - Without this, v1.50 circuit breaker won't work properly.

---

**END OF ANALYSIS**
