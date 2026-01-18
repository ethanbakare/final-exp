# Voice Interface Morphing Buttons Implementation Plan

**Version:** V03
**Date:** 2026-01-15
**Status:** Planning Phase

---

## Overview

This document defines the exact implementation steps for creating morphing button components in the Voice Interface system. All implementations MUST follow the established pattern from `MorphingRecordToPillWave`, which serves as the reference implementation.

---

## Reference Pattern: MorphingRecordToPillWave

### Architecture Principles (MUST FOLLOW)

1. **Single Morphing Button**: ONE `<button>` element that morphs all CSS properties
2. **Content Crossfade**: Absolute positioned content with opacity transitions
3. **Controlled Component Pattern**: Props control state, callbacks report changes
4. **Three-Layer Structure**:
   - **Container**: Outer flex container that holds timer + button tracker
   - **Button Tracker**: Wrapper that reports button dimensions to flexbox (clips overflow)
   - **Morphing Button**: Actual button that morphs physical dimensions and background
5. **State-Based Classes**: Use `state-${state}` pattern for CSS state selectors
6. **Transitions**: `cubic-bezier(0.4, 0, 0.2, 1)` with 0.2s duration
7. **Debug Borders**: Color-coded during development (red, blue, green, orange, purple)

### File Structure Pattern

```typescript
// File: /src/projects/voiceinterface/components/ui/voicemorphingbuttons.tsx

/* ============================================
   [COMPONENT NAME]

   Pattern: Controlled component with dynamic timer
   - [Initial State Description]
   - [Target State Description]
   - [Container width behavior]

   Architecture: [Child components used and their roles]
   Based on: MorphingTimerProcessingToStructure from clipmorphingbuttons.tsx
   ============================================ */

export type [StateName] = 'idle' | 'active';

interface [ComponentName]Props {
  state: [StateName];
  on[Action]Click?: () => void;
  on[OtherAction]Click?: () => void;
  className?: string;
  disabled?: boolean;
}

export const [ComponentName]: React.FC<[ComponentName]Props> = ({
  state,
  on[Action]Click,
  on[OtherAction]Click,
  className = '',
  disabled = false
}) => {
  // State management
  const [timerWidth, setTimerWidth] = useState(40); // If timer is used

  // Width calculations
  const containerWidth = state === 'active'
    ? timerWidth + gap + buttonWidth
    : idleWidth;

  // Event handlers
  const handleClick = () => {
    if (disabled) return;
    if (state === 'idle') {
      on[Action]Click?.();
    } else {
      on[OtherAction]Click?.();
    }
  };

  return (
    <>
      <div className={`container-name state-${state} ${className} ${styles.container}`}>
        {/* Timer wrapper if applicable */}

        {/* Button tracker */}
        <div className="button-tracker">
          <button className={`morphing-button state-${state}`}>
            <div className="content-container">
              {/* Idle content */}
              <div className="idle-icon">{/* SVG or component */}</div>

              {/* Active content */}
              <div className="active-icon">{/* SVG or component */}</div>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .container-name,
          .container-name * {
            transition: none !important;
          }
        }

        /* Container */
        .container-name {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          /* ... dimensions, transitions ... */
        }

        /* Button tracker */
        .button-tracker {
          overflow: hidden; /* CRITICAL: Clips content */
          /* ... dimensions matching button ... */
        }

        /* Morphing button */
        .morphing-button {
          position: relative;
          /* IDLE STATE properties */
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .morphing-button.state-active {
          /* ACTIVE STATE properties */
        }

        /* Content crossfade */
        .idle-icon {
          position: absolute;
          opacity: 1;
          transition: opacity 0.2s ease;
        }

        .morphing-button.state-active .idle-icon {
          opacity: 0;
          pointer-events: none;
        }

        .active-icon {
          position: absolute;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .morphing-button.state-active .active-icon {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>
    </>
  );
};
```

---

## Task 1: Morphing Stop Icon to Processing Spinner

**Component Name:** `MorphingStopToProcessing`
**File:** `/src/projects/voiceinterface/components/ui/voicemorphingbuttons.tsx`
**Target:** Morph StopRecordButton → ProcessingButtonBigDark (same size, content swap)

### Component Specifications

**States:**
- `idle`: Shows stop icon (red square)
- `processing`: Shows spinning processing spinner

**Dimensions:**
- Both states: 112×46px button
- Button tracker: 112×46px (no resize needed - static)
- Container: No timer needed, static width

**Key Difference from Reference:**
- NO timer component (buttons are same size)
- NO container width animation (static)
- ONLY content crossfade (stop icon ↔ spinner)
- Button dimensions remain constant

### Detailed Implementation Steps

#### Step 1: Define Component Interface

```typescript
/* ============================================
   MORPHING STOP TO PROCESSING

   Pattern: Static size morph with content crossfade only
   - StopRecordButton (112×46px) with stop icon and timer
   - ProcessingButtonBigDark (112×46px) with spinner and static time
   - No dimension changes - ONLY content crossfade

   Architecture: No dynamic child components, static dimensions
   Based on: MorphingTimerProcessingToStructure content crossfade pattern
   ============================================ */

export type StopProcessingState = 'idle' | 'processing';

interface MorphingStopToProcessingProps {
  state: StopProcessingState;
  onStopClick?: () => void;
  className?: string;
  disabled?: boolean;
  timeDisplay?: string; // Static time shown in processing state (e.g., "00:26")
  isTimerRunning?: boolean; // Controls live timer in idle state
}
```

**Critical Notes:**
- `timeDisplay` is for the STATIC time shown in processing state
- `isTimerRunning` controls the LIVE timer shown in idle state
- Two separate time displays that crossfade

#### Step 2: Implement Component Structure

```typescript
export const MorphingStopToProcessing: React.FC<MorphingStopToProcessingProps> = ({
  state,
  onStopClick,
  className = '',
  disabled = false,
  timeDisplay = '00:26',
  isTimerRunning = true
}) => {
  const handleClick = () => {
    if (disabled) return;
    onStopClick?.();
  };

  return (
    <>
      <div className={`stop-processing-container state-${state} ${className} ${styles.container}`}>
        {/* Single button tracker - static size */}
        <div className="stop-processing-tracker">
          <button
            className={`morphing-stop-processing state-${state}`}
            onClick={handleClick}
            disabled={disabled}
            aria-label={state === 'idle' ? 'Stop Recording' : 'Processing'}
          >
            {/* Inner content container matching time-count-stop / time-count-processing */}
            <div className="time-count-container">
              {/* IDLE STATE CONTENT - Stop icon + Live Timer */}
              <div className="stop-content">
                {/* Stop Square Icon Container */}
                <div className="stop-square">
                  <div className="stop-square-icon"></div>
                </div>

                {/* Live Timer */}
                <VoiceLiveTimer isRunning={isTimerRunning} />
              </div>

              {/* PROCESSING STATE CONTENT - Spinner + Static Time */}
              <div className="processing-content">
                {/* Processing Spinner Container */}
                <div className={`spinner-big-container ${state === 'processing' ? 'spinning' : ''}`}>
                  <svg
                    className="processing-spinner-big"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* All 8 spokes from ProcessingButtonBigDark */}
                    <path d="M9 13.95V16.65" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
                    <path d="M4.05 9L1.35 9" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
                    <path d="M9 1.35V4.05" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
                    <path d="M16.65 9L13.95 9" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
                    <path d="M5.499 12.501L3.591 14.409" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
                    <path d="M5.499 5.499L3.591 3.591" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
                    <path d="M14.409 3.591L12.501 5.499" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
                    <path d="M14.409 14.409L12.501 12.501" stroke="var(--VoiceWhite)" strokeWidth="1.575" strokeLinecap="round"/>
                  </svg>
                </div>

                {/* Static Timer Display */}
                <div className="static-timer">
                  <span className={`timer-text ${styles.OpenRundeMedium18}`}>
                    {timeDisplay}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        /* CSS implementation follows... */
      `}</style>
    </>
  );
};
```

#### Step 3: Implement CSS Styles

**Container Styles:**
```css
.stop-processing-container {
  /* Static size - no width transitions */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Fixed dimensions */
  width: 112px;
  height: 46px;

  /* Debug */
  border: 0.5px solid red;
}
```

**Button Tracker Styles:**
```css
.stop-processing-tracker {
  /* Static wrapper - exact button size */
  width: 112px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;

  /* No overflow clip needed - same size */

  /* Debug */
  border: 0.5px solid green;
}
```

**Morphing Button Styles:**
```css
.morphing-stop-processing {
  /* Layout */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 16px;
  gap: 11.25px;

  /* Static dimensions - NO transitions on width/height */
  width: 112px;
  height: 46px;

  /* Style - same for both states */
  background: var(--VoiceDarkGrey_95);
  border: none;
  border-radius: 24px;
  cursor: pointer;

  /* NO dimension transitions - only background if needed */
  transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* Debug */
  border: 0.5px solid orange;
}

.morphing-stop-processing:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Content Container Styles:**
```css
.time-count-container {
  /* Match time-count-stop / time-count-processing layout */
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 9px;
  width: auto;
  height: 26px;
}
```

**Stop Content (Idle State) Styles:**
```css
.stop-content {
  /* Absolute positioned for crossfade */
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 9px;

  /* IDLE STATE: Visible */
  opacity: 1;
  pointer-events: auto;

  /* Crossfade transition */
  transition: opacity 0.2s ease;
}

/* Hide stop content in processing state */
.morphing-stop-processing.state-processing .stop-content {
  opacity: 0;
  pointer-events: none;
}

.stop-square {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 18px;
  height: 18px;
}

.stop-square-icon {
  width: 8.73px;
  height: 8.73px;
  background: var(--VoiceRed);
  border-radius: 2px;
}
```

**Processing Content (Active State) Styles:**
```css
.processing-content {
  /* Absolute positioned for crossfade */
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 9px;

  /* IDLE STATE: Hidden */
  opacity: 0;
  pointer-events: none;

  /* Crossfade transition */
  transition: opacity 0.2s ease;
}

/* Show processing content in processing state */
.morphing-stop-processing.state-processing .processing-content {
  opacity: 1;
  pointer-events: auto;
}

.spinner-big-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 18px;
  height: 18px;
}

.processing-spinner-big {
  width: 18px;
  height: 18px;
  transform-origin: center center;
}

/* Spinning animation - only when state is processing */
.spinner-big-container.spinning .processing-spinner-big {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.static-timer {
  display: flex;
  align-items: center;
}

.timer-text {
  color: var(--VoiceWhite);
}
```

#### Step 4: Add to Showcase

**File:** `/src/pages/voiceinterface/showcase/voicecomponent.tsx`

```typescript
// 1. Import component
import { MorphingRecordToPillWave, MorphingStopToProcessing } from '@/projects/voiceinterface/components/ui/voicemorphingbuttons';

// 2. Add state
const [stopProcessingState, setStopProcessingState] = useState<'idle' | 'processing'>('idle');

// 3. Add showcase container
<div className="morphing-button-showcase" style={{ marginTop: '20px' }}>
  {/* Toggle switch */}
  <div className="morphing-toggle-container" onClick={() => setStopProcessingState(stopProcessingState === 'idle' ? 'processing' : 'idle')}>
    <div className={`toggle-switch ${stopProcessingState === 'processing' ? 'active' : ''}`}>
      <div className="toggle-slider"></div>
    </div>
  </div>

  {/* Morphing button */}
  <div className="morphing-button-wrapper">
    <MorphingStopToProcessing
      state={stopProcessingState}
      onStopClick={() => console.log('Stop clicked')}
      timeDisplay="00:26"
      isTimerRunning={stopProcessingState === 'idle'}
    />
  </div>

  {/* Label */}
  <div className="morphing-button-label">
    MORPHING STOP TO PROCESSING - 112PX (STATIC, CONTENT CROSSFADE ONLY)
  </div>
</div>
```

#### Step 5: Testing Checklist

- [ ] Component imports correctly
- [ ] State toggle works (idle ↔ processing)
- [ ] Stop icon visible in idle state
- [ ] Spinner visible and spinning in processing state
- [ ] Live timer shows and counts in idle state
- [ ] Static time shows in processing state
- [ ] Content crossfade is smooth (0.2s)
- [ ] Click handler fires in idle state
- [ ] Disabled state works
- [ ] No console errors
- [ ] Button dimensions remain 112×46px throughout
- [ ] Debug borders show correct structure

---

## Task 2: Morphing Record Wide to Stop Record

**Component Name:** `MorphingRecordWideToStop`
**File:** `/src/projects/voiceinterface/components/ui/voicemorphingbuttons.tsx`
**Target:** Morph RecordWideButton → StopRecordButton with center expansion

### Component Specifications

**States:**
- `idle`: RecordWideButton (76×44px) with large mic icon
- `recording`: StopRecordButton (112×46px) with stop icon and timer

**Dimensions:**
- Idle: 76px width × 44px height
- Recording: 112px width × 46px height
- **CRITICAL**: Width expands from CENTER (not from edges)

**Center Expansion Technique:**
- Use `justify-content: center` on button tracker
- Button grows equally on both sides
- Content crossfade: mic icon → (stop icon + timer)

### Detailed Implementation Steps

#### Step 1: Define Component Interface

```typescript
/* ============================================
   MORPHING RECORD WIDE TO STOP

   Pattern: Center expansion with content crossfade
   - RecordWideButton (76×44px) morphs to StopRecordButton (112×46px)
   - Width expands from CENTER (36px increase = 18px each side)
   - Height increases 2px (1px each side)
   - Content crossfades: large mic icon → (stop icon + live timer)

   Architecture: Uses VoiceLiveTimer for recording state
   Based on: MorphingRecordToPillWave morph pattern
   ============================================ */

export type RecordWideStopState = 'idle' | 'recording';

interface MorphingRecordWideToStopProps {
  state: RecordWideStopState;
  onRecordClick?: () => void;
  onStopClick?: () => void;
  className?: string;
  disabled?: boolean;
}
```

#### Step 2: Implement Component Structure

```typescript
export const MorphingRecordWideToStop: React.FC<MorphingRecordWideToStopProps> = ({
  state,
  onRecordClick,
  onStopClick,
  className = '',
  disabled = false
}) => {
  const handleClick = () => {
    if (disabled) return;
    if (state === 'idle') {
      onRecordClick?.();
    } else {
      onStopClick?.();
    }
  };

  return (
    <>
      <div className={`record-wide-stop-container state-${state} ${className} ${styles.container}`}>
        {/* Button tracker - centers the morphing button */}
        <div className="record-wide-stop-tracker">
          <button
            className={`morphing-record-wide-stop state-${state}`}
            onClick={handleClick}
            disabled={disabled}
            aria-label={state === 'idle' ? 'Record' : 'Stop Recording'}
          >
            {/* Content container for crossfade */}
            <div className="record-wide-content-container">
              {/* IDLE STATE - Large Mic Icon */}
              <div className="wide-mic-icon">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.40583 6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452Z"
                    fill="white"
                  />
                  <path
                    d="M19.9282 13.3002C19.3867 16.6398 16.4897 19.1896 12.9971 19.1896C9.50541 19.1896 6.60896 16.6411 6.06641 13.3027M12.9965 22.75V19.3733M15.0926 22.75H10.9399M13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* RECORDING STATE - Stop Icon + Timer */}
              <div className="stop-timer-content">
                {/* Stop Square Icon */}
                <div className="stop-square-container">
                  <div className="stop-square-inner">
                    <div className="stop-square-icon"></div>
                  </div>
                </div>

                {/* Live Timer */}
                <div className="live-timer-container">
                  <VoiceLiveTimer isRunning={state === 'recording'} />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        /* CSS implementation follows... */
      `}</style>
    </>
  );
};
```

#### Step 3: Implement CSS Styles

**Container Styles:**
```css
.record-wide-stop-container {
  /* Container matches button size */
  display: flex;
  align-items: center;
  justify-content: center;

  /* IDLE STATE dimensions */
  width: 76px;
  height: 44px;

  /* Smooth transition */
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* Debug */
  border: 0.5px solid red;
}

/* RECORDING STATE dimensions */
.record-wide-stop-container.state-recording {
  width: 112px;
  height: 46px;
}
```

**Button Tracker Styles (CRITICAL FOR CENTER EXPANSION):**
```css
.record-wide-stop-tracker {
  /* Layout - CENTER alignment is key */
  display: flex;
  align-items: center;
  justify-content: center;  /* CRITICAL: Centers button, enables equal expansion */

  /* IDLE STATE dimensions */
  width: 76px;
  height: 44px;

  /* Overflow hidden to clip content during morph */
  overflow: hidden;

  /* Smooth transition */
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* Debug */
  border: 0.5px solid green;
}

/* RECORDING STATE dimensions */
.record-wide-stop-container.state-recording .record-wide-stop-tracker {
  width: 112px;
  height: 46px;
}
```

**Morphing Button Styles:**
```css
.morphing-record-wide-stop {
  /* Layout */
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 11.58px;  /* Idle gap for mic icon spacing */

  /* IDLE STATE - RecordWideButton style */
  width: 76px;
  height: 44px;
  padding: 0px 25px;
  background: var(--VoiceDarkGrey_95);
  border: none;
  border-radius: 23.1579px;
  cursor: pointer;

  /* Morphing transitions */
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              padding 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              gap 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              border-radius 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* Debug */
  border: 0.5px solid orange;
}

/* RECORDING STATE - StopRecordButton style */
.morphing-record-wide-stop.state-recording {
  width: 112px;
  height: 46px;
  padding: 10px 16px;
  gap: 11.25px;
  border-radius: 24px;
}

.morphing-record-wide-stop:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Content Container Styles:**
```css
.record-wide-content-container {
  /* Container for crossfading content */
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Size accommodates larger content */
  width: 80px;   /* Enough for stop icon + timer */
  height: 26px;
}
```

**Wide Mic Icon (Idle State) Styles:**
```css
.wide-mic-icon {
  /* Absolute positioned for crossfade */
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;

  width: 26px;
  height: 26px;

  /* IDLE STATE: Visible */
  opacity: 1;
  pointer-events: auto;

  /* Crossfade transition */
  transition: opacity 0.2s ease;
}

/* Hide mic icon in recording state */
.morphing-record-wide-stop.state-recording .wide-mic-icon {
  opacity: 0;
  pointer-events: none;
}
```

**Stop + Timer Content (Recording State) Styles:**
```css
.stop-timer-content {
  /* Absolute positioned for crossfade */
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 9px;

  /* IDLE STATE: Hidden */
  opacity: 0;
  pointer-events: none;

  /* Crossfade transition */
  transition: opacity 0.2s ease;
}

/* Show stop + timer in recording state */
.morphing-record-wide-stop.state-recording .stop-timer-content {
  opacity: 1;
  pointer-events: auto;
}

.stop-square-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 18px;
  height: 18px;
}

.stop-square-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 18px;
  height: 18px;
}

.stop-square-icon {
  width: 8.73px;
  height: 8.73px;
  background: var(--VoiceRed);
  border-radius: 2px;
}

.live-timer-container {
  display: flex;
  align-items: center;
}
```

#### Step 4: Add to Showcase

**File:** `/src/pages/voiceinterface/showcase/voicecomponent.tsx`

```typescript
// 1. Import component
import {
  MorphingRecordToPillWave,
  MorphingStopToProcessing,
  MorphingRecordWideToStop
} from '@/projects/voiceinterface/components/ui/voicemorphingbuttons';

// 2. Add state
const [recordWideStopState, setRecordWideStopState] = useState<'idle' | 'recording'>('idle');

// 3. Add showcase container
<div className="morphing-button-showcase" style={{ marginTop: '20px' }}>
  {/* Toggle switch */}
  <div className="morphing-toggle-container" onClick={() => setRecordWideStopState(recordWideStopState === 'idle' ? 'recording' : 'idle')}>
    <div className={`toggle-switch ${recordWideStopState === 'recording' ? 'active' : ''}`}>
      <div className="toggle-slider"></div>
    </div>
  </div>

  {/* Morphing button */}
  <div className="morphing-button-wrapper">
    <MorphingRecordWideToStop
      state={recordWideStopState}
      onRecordClick={() => setRecordWideStopState('recording')}
      onStopClick={() => setRecordWideStopState('idle')}
    />
  </div>

  {/* Label */}
  <div className="morphing-button-label">
    MORPHING RECORD WIDE TO STOP - 76×44PX ↔ 112×46PX (CENTER EXPANSION)
  </div>
</div>
```

#### Step 5: Testing Checklist

- [ ] Component imports correctly
- [ ] State toggle works (idle ↔ recording)
- [ ] Mic icon visible in idle state (76×44px)
- [ ] Stop icon + timer visible in recording state (112×46px)
- [ ] Width expands FROM CENTER (equal on both sides)
- [ ] Height increases from center (2px total = 1px each side)
- [ ] Live timer starts counting when recording
- [ ] Live timer resets when returning to idle
- [ ] Content crossfade is smooth (0.2s)
- [ ] Click handlers fire correctly
- [ ] Disabled state works
- [ ] No console errors
- [ ] Debug borders show correct structure
- [ ] Button stays centered throughout morph

---

## Implementation Order

**MUST BE DONE IN THIS SEQUENCE:**

1. **Task 1: MorphingStopToProcessing**
   - Simpler implementation (no dimension changes)
   - Practice content crossfade pattern
   - Test timer component integration

2. **Task 2: MorphingRecordWideToStop**
   - More complex (dimension changes + center expansion)
   - Practice dimension morphing from center
   - Test combined icon + timer crossfade

---

## Critical Rules (MUST FOLLOW)

1. **DO NOT** create conditional rendering with `if/else` - use ONE morphing button with state classes
2. **DO NOT** duplicate component HTML - if components exist (e.g., CheckAndCloseButton), import and use them
3. **DO** follow the exact three-layer structure (container → tracker → morphing button)
4. **DO** use `state-${state}` pattern for CSS selectors
5. **DO** use absolute positioning for content crossfade
6. **DO** add debug borders during development (remove after testing)
7. **DO** use `cubic-bezier(0.4, 0, 0.2, 1)` with 0.2s for all transitions
8. **DO** test on showcase page before considering complete
9. **DO** handle disabled state properly
10. **DO** add accessibility labels and reduced-motion support

---

## Validation Criteria

Each component is ONLY considered complete when:

- ✅ Component renders without errors
- ✅ State transitions work bidirectionally (idle ↔ active)
- ✅ Visual morphing is smooth with correct timing
- ✅ Content crossfade works cleanly (no overlap artifacts)
- ✅ Click handlers function correctly in both states
- ✅ Disabled state prevents interaction and shows visual feedback
- ✅ Showcase page displays component with working toggle
- ✅ Debug borders are removed from final CSS
- ✅ No console warnings or TypeScript errors
- ✅ Follows MorphingRecordToPillWave pattern exactly

---

## File Locations Reference

```
/src/projects/voiceinterface/
├── components/
│   └── ui/
│       ├── voicebuttons.tsx              (Source button components)
│       ├── voicemorphingbuttons.tsx      (Add new morphing components here)
│       ├── VoiceLiveTimer.tsx            (Timer component)
│       └── VoiceLiveTimerSeconds.tsx     (Seconds timer component)
├── pages/
│   └── voiceinterface/
│       └── showcase/
│           └── voicecomponent.tsx        (Showcase page - add demos here)
├── styles/
│   └── voice.module.css                  (Shared styles and colors)
└── voice-context/
    └── V03_MORPHING_BUTTONS_IMPLEMENTATION_PLAN.md  (This file)
```

---

**END OF IMPLEMENTATION PLAN**
