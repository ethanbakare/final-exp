# Audio-Corrupted Status - Complete Implementation Checklist

**Date**: January 7, 2026
**Purpose**: Ensure 'audio-corrupted' status is added to ALL necessary locations
**Status**: ✅ **READY FOR IMPLEMENTATION**

---

## ✅ What Was Fixed in 043_v3

**Key Change**: `'audio-corrupted'` is now a **dedicated ClipStatus value** (not derived from lastError)

**Why**:
- ✅ Prevents infinite retry loops (getPendingClips only returns 'pending-child' and 'pending-retry')
- ✅ Semantic clarity: status directly indicates the clip state
- ✅ Simpler UI logic: check `clip.status === 'audio-corrupted'` directly
- ✅ Null remains "successfully completed" as it should be

---

## 📋 Implementation Checklist

### 🔴 CRITICAL - Must Update (Type Definitions)

#### 1. `/src/projects/clipperstream/store/clipStore.ts`

**Current Code** (Line 10-16):
```typescript
export type ClipStatus =
  | null  // Done (completed)
  | 'transcribing'  // HTTP call in progress
  | 'formatting'  // Formatting API in progress
  | 'pending-child'  // Offline recording waiting to transcribe
  | 'pending-retry'  // Online but retrying after failures
  | 'failed';  // Permanent failure (after retries exhausted)
```

**✅ CHANGE TO**:
```typescript
export type ClipStatus =
  | null  // Done (completed)
  | 'transcribing'  // HTTP call in progress
  | 'formatting'  // Formatting API in progress
  | 'pending-child'  // Offline recording waiting to transcribe
  | 'pending-retry'  // Online but retrying after failures
  | 'audio-corrupted'  // ✅ NEW: Audio retrieval failed 3x (shows on home screen)
  | 'failed';  // ✅ KEPT: No speech detected (shows ONLY in ClipOffline, NOT home screen)

// ✅ CORRECTED per 043_v3_CRITICAL_AUDIT.md CRITICAL #6:
// - 044_FAILED_STATUS_AUDIT.md was WRONG - we DO need 'failed' status
// - TWO permanent errors with DIFFERENT behaviors:
//   1. 'audio-corrupted': Shows on home screen + ClipOffline (WarningIcon)
//   2. 'failed': Shows ONLY in ClipOffline (DeleteIcon) - parent inherits from other children
```

**Lines to Change**: 10-16

---

#### 2. `/src/projects/clipperstream/components/ui/ClipOffline.tsx`

**Current Code** (Line 14):
```typescript
type ClipOfflineStatus = 'waiting' | 'transcribing' | 'vpn-blocked' | 'failed';
```

**✅ CHANGE TO**:
```typescript
type ClipOfflineStatus = 'waiting' | 'transcribing' | 'vpn-blocked' | 'audio-corrupted' | 'failed';

// ✅ CORRECTED: 'failed' is NEEDED (per 043_v3_CRITICAL_AUDIT.md CRITICAL #6)
// - 'audio-corrupted': WarningIcon (IndexedDB error)
// - 'failed': DeleteIcon (no speech detected / validation error)
// - Both are permanent errors (no retry) but show DIFFERENT icons
```

**Lines to Change**: 14

**✅ UPDATE UI LOGIC** (Line 104-107):

**Current Code**:
```typescript
<div className={`icon-layer transcribe-layer ${status !== 'failed' && status !== 'vpn-blocked' ? 'active' : ''} ...`}>
  <TranscribeBig spinning={status === 'transcribing' && isActiveRequest !== false} />
</div>
```

**✅ CHANGE TO**:
```typescript
<div className={`icon-layer transcribe-layer ${status !== 'vpn-blocked' && status !== 'audio-corrupted' ? 'active' : ''} ...`}>
  <TranscribeBig spinning={status === 'transcribing' && isActiveRequest !== false} />
</div>

// ✅ NOTE: Removed 'failed' check (no longer exists in ClipOfflineStatus)
```

**✅ UPDATE WARNING ICON** (Line ~108-112):

**Current Code**:
```typescript
<div className={`icon-layer warning-layer ${status === 'vpn-blocked' ? 'active' : ''}`}>
  <WarningIcon />
</div>
```

**✅ CHANGE TO**:
```typescript
<div className={`icon-layer warning-layer ${status === 'vpn-blocked' || status === 'audio-corrupted' ? 'active' : ''}`}>
  <WarningIcon />
</div>
```

**✅ ADD CSS** (In styled-jsx):
```typescript
<style jsx>{`
  /* Hide time text in audio-corrupted state (same as vpn-blocked) */
  .pending-master-clip.status-audio-corrupted .time-text {
    opacity: 0;
    pointer-events: none;
  }
`}</style>
```

---

### 🟡 IMPORTANT - Should Update (UI Components)

#### 3. `/src/projects/clipperstream/components/ui/cliplist.tsx`

**Action**: Add UI rendering for `status === 'audio-corrupted'`

**✅ ADD NEW STATUS CHECK** (After line ~374):
```typescript
{status === 'audio-corrupted' && (
  <div className="status-frame audio-corrupted">
    <div className="status-icon-wrapper">
      {/* Same warning icon as vpn-blocked */}
      <svg
        className="audio-corrupted-icon"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.05613 7.88726H2.69677V10.2466M6.94361 4.11229H9.30297V1.75293M2.5 4.58565C2.76457 3.93081 3.20754 3.36333 3.77856 2.9477C4.34957 2.53207 5.02593 2.28497 5.73039 2.23448C6.43485 2.18398 7.13924 2.33211 7.7637 2.66204C8.38816 2.99198 8.90723 3.49049 9.2625 4.1009M9.5 7.41389C9.23543 8.06873 8.79246 8.63621 8.22144 9.05184C7.65043 9.46747 6.97436 9.71458 6.2699 9.76508C5.56545 9.81558 4.8608 9.66743 4.23634 9.33749C3.61188 9.00756 3.09258 8.50907 2.73732 7.89867"
          stroke="var(--RecRed)"
          strokeOpacity="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <span className={`status-text-corrupted ${styles.InterRegular13}`}>
      Audio corrupted, delete now
    </span>
  </div>
)}
```

**✅ ADD CSS**:
```css
/* Audio corrupted status text - red 60% opacity */
.status-text-corrupted {
  color: var(--RecRed);  /* #EF4444 */
  opacity: 0.6;           /* 60% opacity */
  display: flex;
  align-items: center;
  height: 16px;
  flex: none;
  order: 1;
  flex-grow: 0;
}

.audio-corrupted-icon {
  width: 12px;
  height: 12px;
}
```

---

#### 4. `/src/projects/clipperstream/components/ui/ClipHomeScreen.tsx`

**Action**: Update status derivation logic to handle 'audio-corrupted'

**✅ UPDATE getDisplayStatus** (Around line 156-159):

**Current Logic**:
```typescript
const hasTranscribingChildren = children.some(c => c.status === 'transcribing');
const hasPendingChildren = children.some(c => c.status === 'pending-child');
```

**✅ ADD**:
```typescript
const hasCorruptedChildren = children.some(c => c.status === 'audio-corrupted');

// Derive parent status
if (hasCorruptedChildren) {
  derivedStatus = 'audio-corrupted';  // Show error on parent
} else if (hasTranscribingChildren) {
  derivedStatus = 'transcribing';
} else if (hasPendingChildren) {
  derivedStatus = 'pending-child';
}
```

**Lines to Check**: ~156-160, ~377-379

---

#### 5. `/src/projects/clipperstream/components/ui/ClipMasterScreen.tsx`

**Action**: Verify status mappings include 'audio-corrupted'

**✅ CHECK** status type mappings (Line 176):
```typescript
status: (child.status === 'transcribing' ? 'transcribing' : 'waiting') as 'waiting' | 'transcribing',
```

**Note**: This maps to ClipOffline which now includes 'audio-corrupted', so should be:
```typescript
status: (child.status === 'transcribing'
  ? 'transcribing'
  : child.status === 'audio-corrupted'
  ? 'audio-corrupted'
  : 'waiting') as ClipOfflineStatus,
```

**Lines to Check**: 176, 626

---

### 🟢 OPTIONAL - Nice to Have (Other Components)

#### 6. `/src/projects/clipperstream/components/ui/ClipRecordScreen.tsx`

**Action**: Verify no hard-coded status checks that exclude 'audio-corrupted'

**Lines to Check**: 235 (isTappable logic)

---

#### 7. `/src/projects/clipperstream/hooks/useOfflineRecording.ts`

**Action**: Verify no status filters that would break with 'audio-corrupted'

**Status**: Should be fine (doesn't filter by specific status values)

---

## 🎯 getPendingClips Logic (No Change Needed)

**Current Code** (clipStore.ts line 159-161):
```typescript
getPendingClips: () => get().clips.filter(c =>
  c.status === 'pending-child' || c.status === 'pending-retry'
),
```

**✅ WHY NO CHANGE**:
- This is CORRECT and should NOT include 'audio-corrupted'
- Corrupted clips should NOT be retried
- They are automatically excluded from the pending queue
- This is the whole point of having a dedicated status!

---

## 📊 Summary

### Files Requiring Changes:

| File | Priority | Lines | Change Type |
|------|----------|-------|-------------|
| `clipStore.ts` | 🔴 **CRITICAL** | 10-16 | Add 'audio-corrupted' to ClipStatus |
| `ClipOffline.tsx` | 🔴 **CRITICAL** | 14, 104-112 | Add to type + UI logic |
| `cliplist.tsx` | 🟡 **IMPORTANT** | ~374+ | Add UI rendering |
| `ClipHomeScreen.tsx` | 🟡 **IMPORTANT** | ~156-160 | Update status derivation |
| `ClipMasterScreen.tsx` | 🟡 **IMPORTANT** | 176, 626 | Update status mapping |
| `ClipRecordScreen.tsx` | 🟢 **OPTIONAL** | 235 | Verify status checks |

### Total Changes: **5-6 files**

---

## ✅ Verification After Implementation

### Test Cases:

1. ✅ **Trigger audio corrupted state**:
   - Delete audio from IndexedDB manually
   - Retry should fail 3 times
   - Clip should show `status: 'audio-corrupted'`

2. ✅ **Verify no retry loop**:
   - `getPendingClips()` should NOT return audio-corrupted clips
   - Auto-retry should skip them

3. ✅ **Verify UI rendering**:
   - Parent clip shows red "Audio corrupted, delete now" (60% opacity)
   - Child pending clip shows warning icon (same as VPN)
   - Time text hidden on child clip

4. ✅ **Verify manual deletion works**:
   - User can still delete corrupted clips
   - No errors after deletion

---

**END OF CHECKLIST**
