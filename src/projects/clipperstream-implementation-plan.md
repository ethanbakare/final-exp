# 📱 ClipperStream - UI-First Implementation Plan
## Offline-First Voice Transcription App

---

## 📋 Executive Summary

A **lean, UI-first implementation plan** for ClipperStream, delivering an offline-first voice transcription experience. Following the AI Confidence Tracker patterns, we'll build the complete UI first, then add functionality layer by layer.

**Core Philosophy: "Like taking a screenshot" - instant, frictionless, trustworthy**

---

## 🎯 Project Overview

### What We're Building:
An **offline-aware voice transcription app** that records voice snippets and auto-transcribes when online. Built with React Native/Expo for iOS-first deployment, integrated into the Final-Exp monorepo.

### Key Product Features (from PRD + Mockups):
- **One-tap recording** - Single button to start/stop
- **Offline queue** - Saves locally, transcribes when online  
- **Auto-retry logic** - Handles failures gracefully
- **Minimal UI** - No waveforms, no clutter
- **Trust-centered** - Never loses data
- **Text actions** - Copy, cleanup/stylize functionality
- **Clip management** - Rename, delete, manual retry options
- **Search capability** - Filter through transcribed clips

### Technical Approach:
- **React Native with Expo** - Rapid iOS development
- **TypeScript** - Type safety across the app
- **UI-First Development** - Build all screens before functionality
- **Component patterns from AI Confidence Tracker** - Morphing buttons, consolidated files
- **Monorepo Integration** - Lives in src/projects/clipperstream

---

## 🏗️ File Structure

```
src/projects/clipperstream/
├── components/
│   └── ui/
│       ├── ClipperButtons.tsx    # All buttons (Record/Done/Copy/Cleanup/etc)
│       ├── RecordingBar.tsx      # Bottom recording interface with timer
│       ├── ClipRow.tsx           # Individual clip with actions menu
│       ├── OfflineBanner.tsx     # Top offline indicator
│       ├── SearchInterface.tsx   # Search bar and results
│       └── ActionsMenu.tsx       # Triple-dot menu (Rename/Copy/Delete)
├── hooks/
│   ├── useRecording.ts           # Recording logic
│   ├── useOfflineQueue.ts       # Offline queue management
│   └── useTranscription.ts      # Transcription handling
├── services/
│   ├── storage.ts                # Local storage/AsyncStorage
│   └── transcription.ts         # API integration
├── styles/
│   └── clipper.module.css        # All styles (following AI Confidence pattern)
├── types/
│   └── index.ts                  # TypeScript definitions
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # Project documentation
```

---

## 🚨 Critical Architecture Decision

### React Native in Next.js Monorepo Challenge:
Since Final-Exp is a Next.js monorepo and ClipperStream is a React Native app, we have two options:

**Option A: Separate Expo Project** (Recommended)
- Create ClipperStream as a standalone Expo project outside the monorepo
- Link via git submodule or separate repository
- Cleaner separation of web vs mobile concerns

**Option B: Web-First PWA Approach** 
- Build ClipperStream as a Next.js PWA with mobile-first design
- Use Web Audio API for recording
- Deploy as installable PWA for iOS
- Maintains monorepo structure

**Proceeding with Option B** for seamless monorepo integration.

---

## 📊 Development Phases

### Phase Overview:
1. **Foundation** (C-01 to C-04): Project setup as Next.js pages
2. **UI Components** (C-05 to C-14): Build all UI without functionality  
3. **Recording Core** (C-15 to C-18): Web Audio API recording
4. **Offline System** (C-19 to C-22): IndexedDB and service workers
5. **Transcription** (C-23 to C-25): API integration
6. **Polish** (C-26 to C-28): PWA optimization and deployment

---

## 🚀 Implementation Tasks

### 📋 Phase 1: Foundation Setup
| ID | Task | Description | Priority |
|----|------|-------------|----------|
| C-01 | Create project structure | Set up in src/projects/clipperstream with workspace | High |
| C-02 | Configure Next.js pages | Create /clipperstream routes | High |
| C-03 | Install dependencies | Web Audio API polyfills, IndexedDB wrapper | High |
| C-04 | Setup styles | Create clipper.module.css with AI Confidence patterns | Medium |

### 🎨 Phase 2: UI Components (Static)
| ID | Task | Description | Priority |
|----|------|-------------|----------|
| C-05 | **RecordingBar component** | Bottom bar with morphing button + timer (like TranscriptBar) | High |
| C-06 | **ClipperButtons system** | Record → Done → Transcribing states + Copy/Cleanup buttons | High |
| C-07 | **Clips list layout** | Main screen with transcribed clips | High |
| C-08 | **ClipRow component** | Clip with title, text preview, yellow dot for pending | High |
| C-09 | **ActionsMenu component** | Triple-dot menu with Rename/Copy/Delete | High |
| C-10 | **Transcription display** | Full text view with Copy/Cleanup actions (D2 mockup) | High |
| C-11 | **Offline banner** | "Offline" indicator at top + bottom message | Medium |
| C-12 | **Search interface** | Search modal with results (B1-B2 mockups) | Medium |
| C-13 | **New clip button** | Top-right clip icon to start new recording | Medium |
| C-14 | **Empty states** | "No clips yet" message | Low |

### 🎙️ Phase 3: Recording Core
| ID | Task | Description | Priority |
|----|------|-------------|----------|
| C-15 | **useRecording hook** | Web Audio API recording with MediaRecorder | High |
| C-16 | **Timer functionality** | Real-time duration counter (0:26 format) | High |
| C-17 | **Blob storage** | Save audio blobs to IndexedDB | High |
| C-18 | **Recording metadata** | Track timestamps, duration, pending status | Medium |

### 🔄 Phase 4: Offline System
| ID | Task | Description | Priority |
|----|------|-------------|----------|
| C-19 | **useOfflineQueue hook** | IndexedDB queue management (like useDeepgramProcessing) | High |
| C-20 | **Service worker** | Enable offline functionality and background sync | High |
| C-21 | **Auto-sync logic** | Process queue when back online | High |
| C-22 | **Retry mechanism** | Manual retry via triple-dot menu | Medium |

### 📝 Phase 5: Transcription Integration
| ID | Task | Description | Priority |
|----|------|-------------|----------|
| C-23 | **Transcription API** | Next.js API route for Whisper/OpenAI | High |
| C-24 | **useTranscription hook** | Handle API calls with loading states | High |
| C-25 | **Text cleanup** | Implement stylize/cleanup functionality | Medium |

### ✨ Phase 6: Polish & Deploy
| ID | Task | Description | Priority |
|----|------|-------------|----------|
| C-26 | **PWA manifest** | Make installable on iOS home screen | High |
| C-27 | **Animations** | Smooth transitions like AI Confidence Tracker | Medium |
| C-28 | **Performance** | Virtual scrolling for large clip lists | Low |

---

## 🎯 UI-First Implementation Strategy

### Week 1: Foundation + Static UI
**Goal: Complete visual interface matching mockups exactly**

1. **Day 1-2**: Project setup (C-01 to C-04)
   - Create workspace in src/projects/clipperstream
   - Setup Next.js pages and routing
   - Port AI Confidence Tracker CSS patterns

2. **Day 3-4**: Core UI components (C-05 to C-06)
   - RecordingBar with morphing button states
   - Timer display (0:26 format)
   - Copy/Cleanup button designs

3. **Day 5-7**: Clips interface (C-07 to C-14)
   - Clips list with yellow pending dots
   - Triple-dot ActionsMenu
   - Search modal interface
   - Offline banner states

### Week 2: Core Functionality
**Goal: Working recording and storage**

1. **Day 8-9**: Recording implementation (C-15 to C-16)
   - Web Audio API integration
   - Real timer functionality

2. **Day 10-11**: Storage layer (C-17 to C-18)
   - IndexedDB for audio blobs
   - Metadata management

### Week 3: Offline Intelligence
**Goal: Complete offline-first system**

1. **Day 12-14**: Queue system (C-19 to C-21)
   - IndexedDB queue like useDeepgramProcessing
   - Service worker setup
   - Auto-sync mechanism

2. **Day 15**: Retry logic (C-22)
   - Manual retry via triple-dot menu
   - Failure state handling

### Week 4: Integration & Polish
**Goal: Production-ready PWA**

1. **Day 16-17**: Transcription (C-23 to C-25)
   - Next.js API route setup
   - Text cleanup functionality

2. **Day 18-20**: Polish (C-26 to C-28)
   - PWA manifest for iOS
   - Smooth animations
   - Performance optimization

---

## 🔧 Component Patterns (from AI Confidence Tracker)

### Morphing Button Pattern
```typescript
// ClipperButtons.tsx - All buttons consolidated
export const RecordButton = ({ state, onClick }) => {
  // state: 'record' | 'recording' | 'done' | 'transcribing'
  // Smooth morphing animations like deepMorphingButtons
  return (
    <button className={`morphing-button state-${state}`} onClick={onClick}>
      {/* Icon/content changes based on state */}
    </button>
  );
};

export const CopyButton = ({ onClick, disabled }) => { /* ... */ };
export const CleanupButton = ({ onClick, disabled }) => { /* ... */ };
```

### Recording Bar Pattern (like TranscriptBar)
```typescript
// RecordingBar.tsx - Bottom recording interface
export const RecordingBar = () => {
  // Houses morphing button + timer + transcribed text display
  // Fixed bottom position with smooth show/hide
  return (
    <div className={styles.recordingBar}>
      <RecordButton state={recordState} onClick={handleRecord} />
      <Timer duration={duration} />
      {transcribedText && <TranscriptDisplay text={transcribedText} />}
    </div>
  );
};
```

### Single CSS Module Pattern
```css
/* clipper.module.css - All styles like ai-tracker.module.css */
.recordingBar { 
  position: fixed;
  bottom: 0;
  background: #1a1a1a;
  padding: 20px;
}

.morphingButton { 
  /* Base button styles */
  transition: all 0.3s ease;
}

.morphingButton.recording { 
  background: #EF4444; /* Red when recording */
}

.clipRow.pending::before {
  /* Yellow dot indicator */
  content: '';
  width: 8px;
  height: 8px;
  background: #FCD34D;
  border-radius: 50%;
}
```

---

## 🎨 UI State Mapping (Based on Mockups)

### Recording States (D1 → D3):
1. **D1: Ready to Record**
   - Clean interface with "Clips" header
   - New clip button (top right)
   - Record button at bottom

2. **D1.1 → D2: Recording → Transcribing → Complete**
   - Timer shows duration (0:26)
   - "Done" button during recording
   - "Transcribing" loading state
   - Transcribed text with Copy/Cleanup buttons

3. **D3: Offline Mode**
   - "Offline" banner at top
   - "Dictations are auto transcribed when back online" message
   - Pending recordings shown as "Recording 1" blocks

### Clips List States (A1 → A3):
1. **A1: List View**
   - Transcribed clips with text preview
   - Yellow dot for pending transcriptions
   - "RECORD" button at bottom

2. **A2: Hover/Selection**
   - Highlighted clip on interaction
   - Full text visible

3. **A3: Actions Menu**
   - Triple-dot reveals Rename/Copy File/Delete
   
### Search States (B1 → B2):
- Search modal with query input
- Filtered results display

---

## ⚡ Critical Success Factors

### Must-Have Features (MVP - From Mockups):
- ✅ One-tap recording with morphing button
- ✅ Offline queue with yellow dot indicators
- ✅ Manual retry via triple-dot menu
- ✅ Copy transcribed text functionality
- ✅ Text cleanup/stylize feature
- ✅ Search through clips
- ✅ PWA installation on iOS

### Component Complexity (Based on AI Confidence Tracker):
- **High Complexity**: RecordingBar (like TranscriptBar)
- **Medium Complexity**: ClipperButtons (like deepMorphingButtons)
- **Low Complexity**: ClipRow, OfflineBanner, SearchInterface

### Performance Targets:
- Recording starts in < 100ms
- UI updates at 60fps
- Transcription queues instantly
- No data loss even on crash

---

## 🚨 Risk Mitigation

### Technical Risks:
1. **Audio permissions** - Handle denied permissions gracefully
2. **Storage limits** - Implement cleanup strategies
3. **API failures** - Robust retry with exponential backoff
4. **Background processing** - iOS background task limitations

### Mitigation Strategies:
- Early permission request flow
- Storage usage indicators
- Offline-first architecture
- Clear user communication

---

## 📱 Platform Considerations

### iOS Specific:
- Audio session configuration
- Background audio capability
- TestFlight distribution
- App Store guidelines compliance

### React Native Gotchas:
- No hover states
- Touch target minimums (44pt)
- Gesture handler setup
- Safe area handling

---

## 🏁 Next Steps

1. **Immediate Actions**:
   ```bash
   # Create project in monorepo
   mkdir -p src/projects/clipperstream/{components/ui,hooks,styles,types}
   mkdir -p src/pages/clipperstream
   
   # Initialize as workspace
   npm init -w ./src/projects/clipperstream
   
   # Update package.json
   # Set name to "@master-exp/clipperstream"
   ```

2. **First Components (Following Mockups)**:
   - RecordingBar with timer (D1-D3 states)
   - ClipperButtons morphing system
   - ClipRow with pending indicator

3. **CSS-First Approach**:
   ```css
   /* Start with CSS like AI Confidence Tracker */
   .recordingBar {
     position: fixed;
     bottom: 0;
     background: #1a1a1a;
     padding: 20px;
   }
   ```

---

## 📊 Success Metrics

- **Development velocity**: 1 phase per week
- **UI completion**: All screens built before functionality
- **Code reuse**: 60%+ patterns from AI Confidence Tracker
- **User trust**: 0% data loss rate

---

## 📊 Updated Architecture Notes

### Key Differences from Original Plan:
1. **PWA instead of React Native** - Better monorepo integration
2. **More UI components** - Based on detailed mockups (14 vs 11 originally)
3. **Web technologies** - IndexedDB instead of AsyncStorage, Service Workers instead of Expo APIs
4. **CSS Modules** - Following AI Confidence Tracker patterns

### UI Elements from Mockups:
- **Recording Bar**: Bottom interface with morphing button + timer
- **Action Buttons**: Copy, Cleanup/Stylize 
- **Triple-Dot Menu**: Rename, Copy File, Delete options
- **Status Indicators**: Yellow dots for pending, "Offline" banner
- **Search Modal**: Full search interface (B1-B2)
- **New Clip Button**: Top-right icon to start recording

This plan aligns with your successful AI Confidence Tracker approach while adapting to the unique requirements of ClipperStream's voice transcription functionality.
