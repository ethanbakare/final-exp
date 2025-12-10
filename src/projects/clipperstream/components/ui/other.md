# ClipperStream Screens Architecture

## Screen Overview

### ClipHomeScreen (6 States)

| State | Condition | Content |

|-------|-----------|---------|

| **A1** | `clips.length === 0` | NoClipsFrameIcon + "No clips yet" |

| **Default** | `clips.length > 0` | Scrollable ClipListItem list |

| **B1** | Search active + results | Filtered ClipListItem list |

| **B2** | Search active + no results | EmptyClipFrameIcon + "No results found" |

| **Delete Modal** | `activeModal === 'delete'` | ClipDeleteModal overlay |

| **Rename Modal** | `activeModal === 'rename'` | ClipRenameModal overlay |

### ClipRecordScreen (3 States)

| State | Condition | Content |

|-------|-----------|---------|

| **D1** | `recordingState === 'recording'` | Empty content, RecordNavBar recording |

| **D3** | `recordingState === 'transcribed'` | Transcription text, RecordNavBar complete |

| **D4** | `!isOnline` | ClipOffline items, RecordNavBar recording |

---

## Components Already Built

- `ClipHomeHeader` - Search with scroll collapse
- `ClipRecordHeader` - Online/Offline status
- `ClipListItem` - With dropdown (rename/copy/delete)
- `ClipOffline` - Pending clip with transcribe/delete
- `ClipDeleteModal`, `ClipRenameModal`
- `CopyToast`, `AudioToast`
- `NoClipsFrameIcon`, `EmptyClipFrameIcon`

---

## Implementation Plan

### Phase 1: Refactor ClipHomeScreen

**File:** `clipmainscreen.tsx` → rename to `ClipHomeScreen.tsx`

1. Add `clips` prop (replace hardcoded `sampleClips`)
2. Add `searchQuery` state for filtering
3. Add `activeModal` state (`null | 'delete' | 'rename'`)
4. Add `selectedClip` state (for modal context)
5. Add `activeToast` state (`null | 'copy' | 'audio'`)

**Conditional Rendering:**

```jsx
{/* A1: Empty state */}
{clips.length === 0 && !searchQuery && <EmptyState />}

{/* B2: No search results */}
{searchQuery && filteredClips.length === 0 && <NoResultsState />}

{/* Default/B1: Clip list */}
{filteredClips.length > 0 && <ClipList clips={filteredClips} />}

{/* Modal overlay */}
{activeModal && <ModalOverlay />}

{/* Toast notification */}
{activeToast && <Toast type={activeToast} />}
```

### Phase 2: Create ClipRecordScreen

**File:** New `ClipRecordScreen.tsx`

**Props:**

- `isOnline: boolean`
- `recordingState: 'idle' | 'recording' | 'transcribed'`
- `transcriptionText?: string`
- `pendingClips?: PendingClip[]`

**Structure:**

```jsx
<ClipRecordHeader isOnline={isOnline} />
{!isOnline && pendingClips && <ClipOfflineList />}
{transcriptionText && <TranscriptionText />}
{!isOnline && <OfflineNotice />}
<RecordNavBar state={recordingState} />
```

### XPhase 3: Modal Overlay System

- Semi-transparent dark overlay (`rgba(0,0,0,0.5)`)
- Backdrop blur (`backdrop-filter: blur(4px)`)
- Center modal vertically/horizontally
- Click outside to dismiss

### Phase 4: Toast System

- Auto-dismiss after 3 seconds
- Slide up animation on show
- Slide down animation on dismiss
- Position: top center, above header component

### Phase 5: Search Filtering

- Filter clips by title (case-insensitive)
- Update filteredClips on searchQuery change
- Show B2 state when no matches

---

## File Structure

```
📁 components/ui/
  ├── ClipHomeScreen.tsx      ← Refactored from clipmainscreen.tsx
  ├── ClipRecordScreen.tsx    ← New file
  ├── cliphomeheader.tsx      ← Existing
  ├── cliprecordheader.tsx    ← Existing
  └── ...existing components
```

---

## Showcase Updates

`clipscreencomponents.tsx` will display each screen with **toggle controls**:

### ClipHomeScreen Showcase

- **State Toggle Buttons**: Empty (A1) | With Clips | Search Results (B1) | No Results (B2)
- **Modal Triggers**: Built into ClipListItem dropdown (rename/delete actions)
- **Toast Triggers**: Copy action shows CopyToast

### ClipRecordScreen Showcase  

- **State Toggle Buttons**: Recording (D1) | Transcribed (D3) | Offline (D4)
- **Toast Triggers**: 
  - Copy button → CopyToast
  - Offline save → AudioToast

---

## Business Logic Notes

### Copy Functionality

- **What it copies**: The transcribed text content of the clip
- **Where it works**:
  - Home screen: ClipListItem dropdown → "Copy" action
  - Record screen: Copy button (morphs to tick after click)
- **Toast**: CopyToast shows after successful copy

### Pending Clips (status: 'pending' or 'transcribing')

- **Copy disabled**: Can't copy a clip that hasn't been transcribed yet
- **Dropdown options**: Only "Rename" and "Delete" available (no "Copy")

### Toast Triggers

| Toast | Trigger Location | When |

|-------|-----------------|------|

| CopyToast | Home screen | After copying clip from dropdown |

| CopyToast | Record screen | After pressing Copy button |

| AudioToast | Record screen | After saving recording offline |

---

## Data Model (for demo)

```typescript
interface Clip {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'pending' | 'transcribing' | null;
  content?: string;  // Transcribed text (null if pending)
}
```