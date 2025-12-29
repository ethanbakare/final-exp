# 030_v5 - PHASE 5 SPINNER PATCH
## ClipRecordScreen Big Spinner Implementation Reference

**Date**: December 29, 2025
**Purpose**: Quick reference for adding the big spinner to ClipRecordScreen during Phase 5 implementation
**Context**: This patch complements [030_REWRITE_ARCHITECTURE.md](030_REWRITE_ARCHITECTURE.md) Phase 5 work

---

## What This Patch Covers

During Phase 5 (ClipRecordScreen rewrite), you'll need to show a **big spinner** when a clip is processing (`status === 'transcribing'` or `status === 'formatting'`).

The spinner implementation **already exists** in [ClipOffline.tsx:105](ClipOffline.tsx#L105). This patch shows exactly how to use it in ClipRecordScreen.

---

## Key Reference: ClipOffline.tsx Implementation

**Location**: [ClipOffline.tsx:102-113](ClipOffline.tsx#L102-L113)

```typescript
<div className="icon-crossfade-wrapper">
  {/* TranscribeBig Layer - Visible in waiting/transcribing */}
  <div className={`icon-layer transcribe-layer ${status !== 'failed' ? 'active' : ''} ${status === 'waiting' || (status === 'transcribing' && isActiveRequest === false) ? 'waiting-opacity' : ''}`}>
    <TranscribeBig spinning={status === 'transcribing' && isActiveRequest !== false} />
  </div>

  {/* CautionIcon Layer - IGNORE THIS - No longer used */}
  <div className={`icon-layer caution-layer ${status === 'failed' ? 'active' : ''}`}>
    <CautionIcon />
  </div>
</div>
```

**⚠️ IMPORTANT NOTE**: The `'failed'` state and `<CautionIcon>` in ClipOffline.tsx are **no longer used** for anything. Ignore that part.

---

## Spinner Component: TranscribeBig

**Import from**: [clipbuttons.tsx](clipbuttons.tsx)

```typescript
import { TranscribeBig } from './clipbuttons';
```

**Props**:
```typescript
interface TranscribeBigProps {
  spinning?: boolean;  // true = animated rotation, false = static
}
```

**Behavior**:
- `spinning={true}` → Icon rotates continuously (CSS animation)
- `spinning={false}` → Icon is static (no rotation)

---

## Implementation for ClipRecordScreen

### Step 1: Import TranscribeBig

```typescript
// ClipRecordScreen.tsx
import { TranscribeBig } from './clipbuttons';
```

### Step 2: Add Processing State Check

**Show spinner when**:
- `selectedClip.status === 'transcribing'` (API call in progress), OR
- `selectedClip.status === 'formatting'` (formatting API call in progress)

### Step 3: JSX Implementation

```typescript
const ClipRecordScreen = ({ selectedClip }: ClipRecordScreenProps) => {
  const clips = useClipStore(state => state.clips);

  // NEW: Show big spinner during processing
  if (selectedClip && (selectedClip.status === 'transcribing' || selectedClip.status === 'formatting')) {
    return (
      <div className={styles.content}>
        <div className={styles.processingContainer}>
          {/* Big Spinner - Same component used in ClipOffline */}
          <div className={styles.spinnerLarge}>
            <TranscribeBig spinning={true} />
          </div>

          {/* Status Text */}
          <div className={styles.statusText}>
            {selectedClip.status === 'transcribing' ? 'Transcribing...' : 'Formatting...'}
          </div>
        </div>
      </div>
    );
  }

  // ... rest of existing logic for showing text
};
```

### Step 4: CSS Styling (Optional Enhancement)

```css
/* clipper.module.css */

.processingContainer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.spinnerLarge {
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.statusText {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: var(--ClipWhite);
  opacity: 0.6;
}
```

---

## Spinner States Summary

Based on ClipOffline.tsx pattern (adapted for ClipRecordScreen):

| Clip Status | Spinner Visible? | Spinning? | Use Case |
|-------------|------------------|-----------|----------|
| `'transcribing'` | ✅ Yes | ✅ Spinning | Active HTTP request to transcription API |
| `'formatting'` | ✅ Yes | ✅ Spinning | Active HTTP request to formatting API |
| `'pending-child'` | ❌ No | N/A | Clip waiting offline (shown in ClipOffline, not ClipRecordScreen) |
| `'pending-retry'` | ❌ No | N/A | Clip in retry queue (shown in ClipOffline, not ClipRecordScreen) |
| `null` (complete) | ❌ No | N/A | Show formatted text with animation |

---

## Key Differences: ClipOffline vs ClipRecordScreen

### ClipOffline.tsx (Pending clips list):
- **Multiple states**: 'waiting', 'transcribing', 'failed'
- **Static spinner**: Used for 'waiting' state (40% opacity)
- **Animated spinner**: Used for 'transcribing' state with `isActiveRequest={true}`
- **Small icon**: 24×24px size

### ClipRecordScreen.tsx (Main view):
- **Only processing states**: 'transcribing', 'formatting'
- **No static spinner**: Always animated when visible
- **Large icon**: 48×48px size (2x larger for prominence)
- **Centered**: Middle of screen, not in a list row

---

## Complete Example: ClipRecordScreen with Spinner

```typescript
// ClipRecordScreen.tsx (Phase 5 implementation)

import React, { useEffect, useMemo, useState } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { ClipRecordHeader } from './cliprecordheader';
import { ClipOffline } from './ClipOffline';
import { TranscribeBig } from './clipbuttons';  // ← NEW IMPORT
import { PortalContainerProvider } from './PortalContainerContext';
import { useScrollToBottom } from '../../hooks/useScrollToBottom';
import { ScrollButton } from './clipbuttons';
import { Clip } from '../../store/clipStore';
import { useClipStore } from '../../store/clipStore';

interface ClipRecordScreenProps {
  selectedClip: Clip | null;
  onTranscribeClick?: () => void;
}

export const ClipRecordScreen: React.FC<ClipRecordScreenProps> = ({
  selectedClip,
  onTranscribeClick
}) => {
  const clips = useClipStore(state => state.clips);
  const updateClip = useClipStore(state => state.updateClip);

  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // NEW: Show big spinner during processing
  if (selectedClip && (selectedClip.status === 'transcribing' || selectedClip.status === 'formatting')) {
    return (
      <div className={styles.content}>
        <div className={styles.processingContainer}>
          {/* Big Spinner - Same component used in ClipOffline */}
          <div className={styles.spinnerLarge}>
            <TranscribeBig spinning={true} />
          </div>

          {/* Status Text */}
          <div className={styles.statusText}>
            {selectedClip.status === 'transcribing' ? 'Transcribing...' : 'Formatting...'}
          </div>
        </div>
      </div>
    );
  }

  // Check if parent with children
  const isParent = selectedClip && !selectedClip.parentId;
  const children = useMemo(() => {
    if (!isParent) return [];
    return clips.filter(c => c.parentId === selectedClip.id);
  }, [clips, selectedClip?.id, isParent]);

  // If parent with children, show pending clips list
  if (isParent && children.length > 0) {
    return (
      <div className={styles.content}>
        <div className={styles.pendingClipsList}>
          {children.map((child) => (
            <ClipOffline
              key={child.id}
              title={child.pendingClipTitle || `Clip ${child.id.slice(-3)}`}
              time={child.duration || '0:00'}
              status={
                child.status === 'pending-child' ? 'waiting' :
                child.status === 'transcribing' ? 'transcribing' :
                'waiting'
              }
              isActiveRequest={child.status === 'transcribing'}
              onTap={() => onTranscribeClick?.(child.id)}
              fullWidth
            />
          ))}
        </div>
      </div>
    );
  }

  // Animation logic (from 030_REWRITE_ARCHITECTURE.md Section 4.5)
  useEffect(() => {
    if (!selectedClip?.formattedText) return;

    const shouldAnimate =
      selectedClip.status === null &&
      !selectedClip.hasAnimatedFormattedOnce &&
      selectedClip.formattedText.length > 0;

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
          updateClip(selectedClip.id, { hasAnimatedFormattedOnce: true });
        }
      }, 10); // 10ms per character

      return () => clearInterval(interval);
    } else {
      setDisplayedText(selectedClip.formattedText);
    }
  }, [selectedClip?.formattedText, selectedClip?.status, selectedClip?.id]);

  // Show formatted/raw text
  return (
    <div className={styles.content}>
      <div className={styles.textContent}>
        {displayedText}
      </div>
    </div>
  );
};
```

---

## Helper Function: getStatusDisplayText()

**From**: [030_REWRITE_ARCHITECTURE.md:2235-2265](030_REWRITE_ARCHITECTURE.md#L2235-L2265)

```typescript
// utils/statusHelpers.ts

type ClipStatus = null | 'pending-child' | 'pending-retry' | 'transcribing' | 'formatting' | 'failed';

export const getStatusDisplayText = (status: ClipStatus, retryCountdown?: number): string => {
  switch (status) {
    case 'pending-child':
      return 'Waiting to transcribe';

    case 'transcribing':
      return 'Transcribing...';

    case 'formatting':
      return 'Formatting...';

    case 'pending-retry':
      if (retryCountdown) {
        return `Between attempts... (${retryCountdown}s)`;
      }
      return 'Retrying soon...';

    case 'failed':
      return 'Transcription failed';

    case null:
      return '';
  }
};

// Use in ClipRecordScreen:
<div className={styles.statusText}>
  {getStatusDisplayText(selectedClip.status)}
</div>
```

---

## Testing Checklist

When implementing this in Phase 5:

- [ ] **Import TranscribeBig** from clipbuttons.tsx
- [ ] **Check processing states**: Show spinner for 'transcribing' OR 'formatting'
- [ ] **Spinner is animated**: `spinning={true}` (not static)
- [ ] **Center the spinner**: Use flexbox centering in container
- [ ] **Show status text**: "Transcribing..." or "Formatting..."
- [ ] **Hide during other states**: Only show during processing, not for null/pending/failed
- [ ] **Test offline → online flow**: Spinner appears when clips start processing
- [ ] **Test animation transition**: Spinner → Text slide-in when formatting completes

---

## Quick Reference: Status Flow

```
User clicks "Done" button
         ↓
selectedClip.status = 'transcribing'  ← Show spinning TranscribeBig
         ↓
Transcription API completes
         ↓
selectedClip.status = 'formatting'    ← Keep showing spinning TranscribeBig
         ↓
Formatting API completes
         ↓
selectedClip.status = null            ← Hide spinner, show text with animation
```

---

## What NOT to Copy from ClipOffline.tsx

**Don't copy these parts** (not needed for ClipRecordScreen):

1. ❌ **CautionIcon** - Only used in ClipOffline, no longer used anywhere
2. ❌ **'failed' state handling** - Not used in current architecture
3. ❌ **'waiting' state opacity** - ClipRecordScreen doesn't show pending clips (that's ClipOffline's job)
4. ❌ **RetryButton wrapper** - Not applicable to main record screen
5. ❌ **Icon crossfade wrapper** - ClipRecordScreen shows one icon at a time, no need for stacking

**Only copy**:
- ✅ `<TranscribeBig spinning={true} />` component usage
- ✅ Status text display pattern
- ✅ Centered layout for processing state

---

## Summary

**This patch provides**:
1. ✅ Reference to existing TranscribeBig component in ClipOffline.tsx
2. ✅ Complete JSX implementation for ClipRecordScreen
3. ✅ Status flow diagram showing when to display spinner
4. ✅ Testing checklist for Phase 5 implementation

**What to remember**:
- TranscribeBig already exists in clipbuttons.tsx
- Always use `spinning={true}` for ClipRecordScreen (no static spinner)
- Show spinner during 'transcribing' OR 'formatting' status
- Ignore the 'failed' state in ClipOffline.tsx (no longer used)

---

**Prepared By**: Claude Sonnet 4.5
**Date**: December 29, 2025
**Status**: ✅ READY FOR PHASE 5 REFERENCE
**Use with**: [030_REWRITE_ARCHITECTURE.md](030_REWRITE_ARCHITECTURE.md) Phase 5 implementation
