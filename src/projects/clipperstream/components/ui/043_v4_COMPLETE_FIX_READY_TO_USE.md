# 043 COMPLETE FIX - READY TO COPY-PASTE

**Date**: January 8, 2026
**Purpose**: Complete, ready-to-use code for fixing status update flow
**Status**: ✅ **COMPLETE - COPY-PASTE READY**

---

## What's Wrong

Parent clips on home screen don't show correct status because:
1. `getDisplayClip` doesn't check all child statuses (missing retry-pending, vpn-blocked, audio-corrupted)
2. Status mapping doesn't map to ClipList's full status types

---

## The Fix (2 Changes in ClipHomeScreen.tsx)

### CHANGE #1: Replace getDisplayClip Function

**File**: `src/projects/clipperstream/components/ui/ClipHomeScreen.tsx`
**Lines**: 136-182

**FIND THIS**:
```typescript
const getDisplayClip = useCallback((
  clip: Clip,
  allClips: Clip[],
  activeTranscriptionParentId: string | null,
  activeHttpClipId: string | null
): DisplayClip => {
  const children = allClips.filter(c => c.parentId === clip.id);

  if (children.length === 0) {
    return {
      ...clip,
      isActiveRequest: false
    };
  }

  // Derive status from children's states
  const hasTranscribingChildren = children.some(c => c.status === 'transcribing');
  const hasPendingChildren = children.some(c => c.status === 'pending-child');

  let derivedStatus: Clip['status'] = clip.status;

  if (hasTranscribingChildren) {
    derivedStatus = 'transcribing';
  } else if (hasPendingChildren) {
    derivedStatus = 'pending-child';
  }

  const derivedIsActiveRequest =
    activeTranscriptionParentId !== null &&
    clip.id === activeTranscriptionParentId &&
    children.some(c => c.id === activeHttpClipId);

  return {
    ...clip,
    status: derivedStatus,
    isActiveRequest: derivedIsActiveRequest
  };
}, []);
```

**REPLACE WITH THIS** (complete function, ready to copy-paste):
```typescript
const getDisplayClip = useCallback((
  clip: Clip,
  allClips: Clip[],
  activeTranscriptionParentId: string | null,
  activeHttpClipId: string | null
): DisplayClip => {
  const children = allClips.filter(c => c.parentId === clip.id);

  if (children.length === 0) {
    return {
      ...clip,
      isActiveRequest: false
    };
  }

  // ✅ ENHANCED: Check all child statuses
  const hasTranscribingChildren = children.some(c => c.status === 'transcribing');
  const hasPendingChildren = children.some(c => c.status === 'pending-child');
  const hasRetryPendingChildren = children.some(c => c.status === 'pending-retry');
  const hasAudioCorruptedChildren = children.some(c => c.status === 'audio-corrupted');
  const hasVpnBlockedChildren = children.some(c =>
    c.status === 'pending-retry' && c.lastError === 'dns-block'
  );
  const hasNoAudioDetectedChildren = children.some(c => c.status === 'no-audio-detected');

  let derivedStatus: Clip['status'] = clip.status;
  let derivedLastError: Clip['lastError'] = clip.lastError;

  // ✅ PRIORITY ORDER (highest to lowest)
  if (hasTranscribingChildren) {
    derivedStatus = 'transcribing';
  } else if (hasVpnBlockedChildren) {
    derivedStatus = 'pending-retry';
    derivedLastError = 'dns-block';  // Propagate VPN error to parent
  } else if (hasRetryPendingChildren) {
    derivedStatus = 'pending-retry';
  } else if (hasAudioCorruptedChildren) {
    derivedStatus = 'audio-corrupted';
  } else if (hasPendingChildren) {
    derivedStatus = 'pending-child';
  } else if (hasNoAudioDetectedChildren) {
    // If ALL children are no-audio-detected, parent shows as null (completed)
    derivedStatus = null;
  }

  // ✅ KEEP EXISTING: Derive spinner state from HTTP activity
  const derivedIsActiveRequest =
    activeTranscriptionParentId !== null &&
    clip.id === activeTranscriptionParentId &&
    children.some(c => c.id === activeHttpClipId);

  return {
    ...clip,
    status: derivedStatus,
    lastError: derivedLastError,  // ✅ NEW: Include derived lastError
    isActiveRequest: derivedIsActiveRequest
  };
}, []);
```

**What Changed**:
1. ✅ Added 4 new child status checks (retry-pending, audio-corrupted, vpn-blocked, no-audio-detected)
2. ✅ Added `derivedLastError` to propagate VPN blocking
3. ✅ Added priority order (transcribing > VPN > retry > corrupted > pending)
4. ✅ Return `lastError` in the result object

---

### CHANGE #2: Replace Status Mapping

**File**: `src/projects/clipperstream/components/ui/ClipHomeScreen.tsx`
**Lines**: 374-381

**FIND THIS**:
```typescript
const listItemStatus: 'pending' | 'transcribing' | 'failed' | null =
  displayClip.status === 'pending-child' || displayClip.status === 'pending-retry'
    ? 'pending'
    : displayClip.status === 'transcribing'
    ? 'transcribing'
    : displayClip.status === 'failed'
    ? 'failed'
    : null;
```

**REPLACE WITH THIS** (complete mapping, ready to copy-paste):
```typescript
// ✅ Map Zustand status to ClipListItem status
const listItemStatus: 'pending' | 'transcribing' | 'retry-pending' | 'vpn-blocked' | 'audio-corrupted' | null =
  displayClip.status === 'transcribing'
    ? 'transcribing'
  : displayClip.status === 'pending-retry' && displayClip.lastError === 'dns-block'
    ? 'vpn-blocked'  // VPN blocking (orange)
  : displayClip.status === 'pending-retry'
    ? 'retry-pending'  // Normal retry (white, "Retrying soon...")
  : displayClip.status === 'audio-corrupted'
    ? 'audio-corrupted'  // Permanent error (red)
  : displayClip.status === 'pending-child'
    ? 'pending'  // Waiting to transcribe
  : null;
```

**What Changed**:
1. ✅ Updated type to include all ClipList status types
2. ✅ Added VPN detection: `pending-retry` + `lastError='dns-block'` → `'vpn-blocked'`
3. ✅ Added normal retry mapping: `pending-retry` → `'retry-pending'`
4. ✅ Added audio-corrupted mapping: `audio-corrupted` → `'audio-corrupted'`
5. ✅ Removed `'failed'` (no longer used in new status system)

---

## Testing After Fix

After applying both changes, verify:

### Test 1: Parent Shows VPN Blocked
1. Turn on VPN
2. Create parent with pending child
3. Child status updates to `pending-retry` + `lastError='dns-block'`
4. **Expected**: Parent shows "Blocked by VPN" (orange icon)

### Test 2: Parent Shows Retrying Soon
1. Cause retry without VPN (e.g., temporary API error)
2. Child status updates to `pending-retry`
3. **Expected**: Parent shows "Retrying soon..." (white icon)

### Test 3: Parent Shows Audio Corrupted
1. Cause audio retrieval to fail 3 times
2. Child status updates to `audio-corrupted`
3. **Expected**: Parent shows "Audio corrupted" (red warning icon)

### Test 4: Parent Shows Transcribing
1. Start transcription
2. Child status updates to `transcribing`
3. **Expected**: Parent shows "Transcribing..." (spinning icon)

---

## Impact of This Fix

| Child State | Before Fix | After Fix |
|-------------|-----------|-----------|
| transcribing | ✅ "Transcribing..." | ✅ "Transcribing..." |
| pending-child | ✅ "Waiting to transcribe" | ✅ "Waiting to transcribe" |
| pending-retry | ❌ null (completed) | ✅ "Retrying soon..." |
| pending-retry + dns-block | ❌ null (completed) | ✅ "Blocked by VPN" 🟠 |
| audio-corrupted | ❌ null (completed) | ✅ "Audio corrupted" 🔴 |
| no-audio-detected | ❌ null (completed) | ✅ null (hidden/completed) |

---

## Files Modified

- `/src/projects/clipperstream/components/ui/ClipHomeScreen.tsx`
  - Change #1: Lines 136-182 (getDisplayClip function)
  - Change #2: Lines 374-381 (status mapping)

**Total Changes**: 2 replacements in 1 file

---

## Verification Checklist

After applying fix:

- [ ] **Change #1 Applied**: getDisplayClip function updated
  - [ ] All 6 child status checks added
  - [ ] derivedLastError added
  - [ ] Priority order implemented
  - [ ] lastError returned in result

- [ ] **Change #2 Applied**: Status mapping updated
  - [ ] Type signature includes all ClipList statuses
  - [ ] VPN detection added (pending-retry + dns-block)
  - [ ] retry-pending mapping added
  - [ ] audio-corrupted mapping added

- [ ] **Testing Complete**:
  - [ ] Test 1: VPN blocked shows orange
  - [ ] Test 2: Normal retry shows "Retrying soon..."
  - [ ] Test 3: Audio corrupted shows red error
  - [ ] Test 4: Transcribing shows spinner

---

**END OF COMPLETE FIX**

**Status**: ✅ This document contains COMPLETE, COPY-PASTE READY code
**No partial snippets - both changes are complete functions ready to use**
