# ClipOfflineScreen Showcase - V2 Fix Spec

## What's Wrong With Current Implementation

| Issue | Current | Expected |
|-------|---------|----------|
| **Layout** | Custom layout with sections | Match `clipscreencomponents.tsx` pattern (393x692 screen-wrapper) |
| **State info box** | Shows "Current State" explanation | Remove entirely - not requested |
| **Home Screen View** | Just shows one ClipListItem in a box | Should use actual `ClipHomeScreen` or proper list layout |
| **Detail View** | Shows ClipOffline in a box | Should show actual `ClipRecordScreen` with proper states |
| **Done state** | Shows "Transcription successful" text | Title should change from "Recording 01" to AI-generated title |
| **Animation** | None | Should reference existing text animation patterns |
| **Integration** | Standalone component | Should be a SECTION in `clipscreencomponents.tsx` like others |

---

## Reference Files

| File | Purpose |
|------|---------|
| `/src/pages/clipperstream/showcase/clipscreencomponents.tsx` | **THE PATTERN TO FOLLOW** - lines 266-328 show proper toggle + screen-wrapper |
| `/src/projects/clipperstream/components/ui/ClipRecordScreen.tsx` | Component to render for Detail View |
| `/src/projects/clipperstream/components/ui/ClipHomeScreen.tsx` | Component to render for Home Screen View |
| `/src/projects/clipperstream/components/ui/ClipOffline.tsx` | Pending clip component |
| `/src/projects/clipperstream/components/ui/cliplist.tsx` | ClipListItem with isActiveRequest |

---

## Correct Implementation

### Pattern: Follow Lines 266-328 of clipscreencomponents.tsx

```typescript
{/* Toggle Controls */}
<div className="toggle-controls">
  <button className={`toggle-btn ${state === 'waiting' ? 'active' : ''}`}>
    Waiting
  </button>
  <button className={`toggle-btn ${state === 'attemptActive' ? 'active' : ''}`}>
    Attempt Active
  </button>
  <button className={`toggle-btn ${state === 'betweenAttempts' ? 'active' : ''}`}>
    Between Attempts
  </button>
  <button className={`toggle-btn ${state === 'done' ? 'active' : ''}`}>
    Done
  </button>
</div>

{/* Screen wrapper - 393x692 like other showcases */}
<div className="screen-wrapper">
  {/* Render actual ClipRecordScreen or ClipHomeScreen based on view */}
</div>
```

---

## Changes Required

### 1. Remove ClipOfflineScreen.tsx as Standalone

Delete `/src/pages/clipperstream/showcase/ClipOfflineScreen.tsx`

### 2. Add Offline Section to clipscreencomponents.tsx

Add a new SECTION (like Section 2 for ClipRecordScreen) with:
- Toggle buttons: Waiting, Attempt Active, Between Attempts, Done
- Two screen-wrappers side by side:
  - **Home Screen View**: `ClipHomeScreen` with clips that have pending status
  - **Detail View**: `ClipRecordScreen` with `state='offline'` and pendingClips

### 3. State Mapping

```typescript
// State type
type OfflineState = 'waiting' | 'attemptActive' | 'betweenAttempts' | 'done';

const getClipStatus = (state: OfflineState) => {
  switch (state) {
    case 'waiting': return 'pending';
    case 'attemptActive': return 'transcribing';
    case 'betweenAttempts': return 'transcribing';
    case 'done': return null;
  }
};

const getIsActiveRequest = (state: OfflineState) => {
  return state === 'attemptActive'; // Only spins during active attempt
};

// For ClipHomeScreen clips
const offlineSampleClips: Clip[] = [{
  id: 'offline-1',
  title: state === 'done' ? 'AI Generated Title Here' : 'Recording 01',
  date: 'Dec 19, 2025',
  status: getClipStatus(state),
  isActiveRequest: getIsActiveRequest(state),
}];

// For ClipRecordScreen pendingClips
const offlinePendingClips: PendingClip[] = [{
  id: 'p-offline-1',
  title: 'Clip 001',
  time: '0:45',
  status: state === 'waiting' ? 'waiting' : 'transcribing',
}];
```

### 4. Done State Behavior

When "Done" is clicked:
- Title changes from "Recording 01" to an AI-generated title (e.g., "Morning Thoughts on Productivity")
- Status becomes `null`
- In Detail View, ClipOffline disappears and text appears (like `ClipRecordScreen` with `state='transcribed'`)

---

## Code to Add to clipscreencomponents.tsx

Add after Section 2 (ClipRecordScreen), before Section 3 (ClipMasterScreen):

```typescript
{/* ============================================
   SECTION 2.5: ClipOffline States
   ============================================ */}
<div className="showcase-content">
  <div className="file-divider">
    <div className="file-label">📁 Offline Recording States</div>

    <div className="section">
      <h2 className="section-title">Offline Recording Retry States</h2>

      <div className="toggle-controls">
        <button
          className={`toggle-btn ${offlineState === 'waiting' ? 'active' : ''}`}
          onClick={() => setOfflineState('waiting')}
        >
          Waiting
        </button>
        <button
          className={`toggle-btn ${offlineState === 'attemptActive' ? 'active' : ''}`}
          onClick={() => setOfflineState('attemptActive')}
        >
          Attempt Active
        </button>
        <button
          className={`toggle-btn ${offlineState === 'betweenAttempts' ? 'active' : ''}`}
          onClick={() => setOfflineState('betweenAttempts')}
        >
          Between Attempts
        </button>
        <button
          className={`toggle-btn ${offlineState === 'done' ? 'active' : ''}`}
          onClick={() => setOfflineState('done')}
        >
          Done
        </button>
      </div>

      <p style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
        <strong>Icon behavior:</strong> Spins only during "Attempt Active" (HTTP in progress). 
        Static during "Waiting" and "Between Attempts".
      </p>
    </div>
  </div>
</div>

<div className="component-grid">
  {/* Home Screen View */}
  <div>
    <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Home Screen View</p>
    <div className="screen-wrapper">
      <ClipHomeScreen clips={getOfflineClipsForHome()} />
    </div>
  </div>
  
  {/* Detail View */}
  <div>
    <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Detail View (Record Screen)</p>
    <div className="screen-wrapper">
      <ClipRecordScreen
        state={offlineState === 'done' ? 'transcribed' : 'offline'}
        contentBlocks={offlineState === 'done' ? [{ id: 'done-text', text: sampleTranscription, animate: false }] : []}
        pendingClips={offlineState === 'done' ? [] : offlinePendingClips}
        onBackClick={() => console.log('Back clicked')}
        onNewClipClick={() => console.log('New clip clicked')}
      />
    </div>
  </div>
</div>
```

---

## Checklist

- [ ] Delete `/src/pages/clipperstream/showcase/ClipOfflineScreen.tsx`
- [ ] Remove import of ClipOfflineScreen from clipscreencomponents.tsx
- [ ] Add new state at top: `const [offlineState, setOfflineState] = useState<OfflineState>('waiting');`
- [ ] Add helper functions for mapping state to clip props
- [ ] Add new SECTION with proper toggle buttons
- [ ] Add two screen-wrappers side by side (Home + Detail)
- [ ] Ensure ClipListItem receives `isActiveRequest` prop
- [ ] Test all 4 toggle states

---

## State Transition Visual

```
Waiting:
  Home: "Recording 01" + "Waiting to transcribe" (gray static icon)
  Detail: ClipOffline with "Clip 001" (gray static icon)

Attempt Active:
  Home: "Recording 01" + "Transcribing..." (gray SPINNING icon)
  Detail: ClipOffline with "Clip 001" (gray SPINNING icon)

Between Attempts:
  Home: "Recording 01" + "Transcribing..." (gray static icon)
  Detail: ClipOffline with "Clip 001" (gray static icon)

Done:
  Home: "AI Generated Title" + no status (no icon)
  Detail: Transcribed text visible (ClipOffline hidden)
```
