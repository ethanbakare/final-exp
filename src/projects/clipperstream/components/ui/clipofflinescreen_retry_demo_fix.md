# ClipOfflineScreen Showcase Demo Fix v2

## Issues Identified

### Issue 1: No Auto-Progression Through States
**Problem:** Demo is fully manual. User must click "Next State" for each transition.
- No way to see the "3 rapid attempts" happen automatically
- Rapid phase shows "0s" countdown which is confusing

**Solution:** Add auto-progression mode with configurable attempt durations.

### Issue 2: No Attempt Duration Timer
**Problem:** During "Attempt Active", user can't see how long the HTTP request has been in progress.

**Solution:** Add an "attempt timer" that counts UP during active attempts.

### Issue 3: Countdown Shows Wrong Info During Rapid Phase
**Problem:** In rapid phase, countdown shows "0s (rapid interval)" which is confusing.

**Solution:** Hide countdown during rapid phase. Show "Attempt X of 3 (rapid)" instead.

### Issue 4: Detail View Spinner Not Stopping During Wait Periods (BUG)

**Problem:** In `ClipRecordScreen.tsx`, when rendering `ClipOffline`, the `isActiveRequest` prop is NOT passed. This means `ClipOffline` receives `undefined`, and since `undefined !== false` is `true`, the spinner always runs.

**File:** `/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/components/ui/ClipRecordScreen.tsx`

**Current (lines 218-227):**
```tsx
<ClipOffline
  key={clip.id}
  title={clip.title}
  time={clip.time}
  status={clip.status}
  fullWidth={true}
  onRetryClick={() => onTranscribeClick?.(clip.id)}
  onTap={() => onTranscribeClick?.(clip.id)}
  isTappable={clip.status === 'transcribing' && !clip.isActiveRequest}
/>
```

**Fixed:**
```tsx
<ClipOffline
  key={clip.id}
  title={clip.title}
  time={clip.time}
  status={clip.status}
  isActiveRequest={clip.isActiveRequest}  // ← ADD THIS LINE
  fullWidth={true}
  onRetryClick={() => onTranscribeClick?.(clip.id)}
  onTap={() => onTranscribeClick?.(clip.id)}
  isTappable={clip.status === 'transcribing' && !clip.isActiveRequest}
/>
```

**Why HomeScreen Works But Detail View Doesn't:**
- `ClipHomeScreen` → `ClipListItem` → passes `isActiveRequest` ✅
- `ClipRecordScreen` → `ClipOffline` → does NOT pass `isActiveRequest` ❌

**Expected Behavior After Fix:**
- When `isActiveRequest === true` → icon spins (active HTTP attempt)
- When `isActiveRequest === false` → icon is static with reduced opacity (waiting between attempts)

> ⚠️ **This one-line fix must be applied to ClipRecordScreen.tsx line 222.**

---

## Solution: Enhanced Demo State

### New State Variables

```typescript
const [attemptNumber, setAttemptNumber] = useState(1);
const [countdown, setCountdown] = useState(0);          // Seconds until next attempt (interval phase)
const [attemptTimer, setAttemptTimer] = useState(0);    // Seconds current attempt has been running
const [phase, setPhase] = useState<'rapid' | 'interval'>('rapid');
const [eventLog, setEventLog] = useState<string[]>([]);
const [isAutoMode, setIsAutoMode] = useState(false);    // Auto-progression toggle
const countdownRef = useRef<NodeJS.Timeout | null>(null);
const attemptTimerRef = useRef<NodeJS.Timeout | null>(null);
```

### Constants

```typescript
// Attempt duration (how long HTTP request takes before "failing")
const ATTEMPT_DURATION_SECONDS = 3;  // 3 seconds per attempt (shortened for demo)

// Wait intervals (shortened for demo)
const DEMO_INTERVALS = [5, 8, 12, 15];  // seconds (production: 60, 120, 240, 300)
```

---

## New useEffects

### 1. Attempt Timer (counts UP during active attempts)

```typescript
useEffect(() => {
  if (currentState === 'attemptActive' && isAutoMode) {
    attemptTimerRef.current = setTimeout(() => {
      setAttemptTimer(prev => prev + 1);
    }, 1000);
  }
  return () => {
    if (attemptTimerRef.current) clearTimeout(attemptTimerRef.current);
  };
}, [currentState, attemptTimer, isAutoMode]);
```

### 2. Auto-Transition After Attempt Duration (attempt "fails")

```typescript
useEffect(() => {
  if (currentState === 'attemptActive' && isAutoMode && attemptTimer >= ATTEMPT_DURATION_SECONDS) {
    // Attempt "failed" - move to next state
    setAttemptTimer(0);
    
    if (phase === 'rapid' && attemptNumber < 3) {
      // Rapid phase: immediate next attempt
      const next = attemptNumber + 1;
      setAttemptNumber(next);
      addEvent(`Attempt ${attemptNumber} failed (${ATTEMPT_DURATION_SECONDS}s timeout) → Attempt ${next} started`);
      // Stay in attemptActive
    } else if (phase === 'rapid' && attemptNumber === 3) {
      // Rapid phase exhausted: transition to interval phase
      setPhase('interval');
      setCurrentState('betweenAttempts');
      setCountdown(DEMO_INTERVALS[0]);
      addEvent(`Attempt 3 failed → Entering interval phase (${DEMO_INTERVALS[0]}s wait)`);
    } else {
      // Interval phase: go to wait period
      const intervalIndex = (attemptNumber - 3) % DEMO_INTERVALS.length;
      setCurrentState('betweenAttempts');
      setCountdown(DEMO_INTERVALS[intervalIndex]);
      addEvent(`Attempt ${attemptNumber} failed → Waiting ${DEMO_INTERVALS[intervalIndex]}s`);
    }
  }
}, [attemptTimer, currentState, isAutoMode, phase, attemptNumber]);
```

### 3. Countdown Timer (counts DOWN during wait periods)

```typescript
useEffect(() => {
  if (currentState === 'betweenAttempts' && countdown > 0 && isAutoMode) {
    countdownRef.current = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
  }
  return () => {
    if (countdownRef.current) clearTimeout(countdownRef.current);
  };
}, [currentState, countdown, isAutoMode]);
```

### 4. Auto-Transition After Countdown Reaches 0

```typescript
useEffect(() => {
  if (currentState === 'betweenAttempts' && countdown === 0 && phase === 'interval' && isAutoMode) {
    // Start next attempt
    const next = attemptNumber + 1;
    setAttemptNumber(next);
    setCurrentState('attemptActive');
    setAttemptTimer(0);
    addEvent(`Wait complete → Attempt ${next} started`);
  }
}, [countdown, currentState, phase, attemptNumber, isAutoMode]);
```

---

## Updated Retry Status Panel

```tsx
{/* Retry Status Panel */}
{currentState !== 'waiting' && currentState !== 'done' && (
  <div className="retry-status-panel">
    <div className="attempt-info">
      <span className="attempt-badge">
        Attempt {attemptNumber}{phase === 'rapid' ? ` of 3` : ''}
      </span>
      <span className="phase-badge">
        {phase === 'rapid' ? '⚡ Rapid Phase' : '⏰ Interval Phase'}
      </span>
    </div>
    
    {/* During active attempt: show attempt timer (counting UP) */}
    {currentState === 'attemptActive' && (
      <div className="active-indicator">
        🔄 HTTP request in progress... <span className="timer">{attemptTimer}s</span>
      </div>
    )}
    
    {/* During interval wait: show countdown (counting DOWN) */}
    {currentState === 'betweenAttempts' && phase === 'interval' && (
      <div className="countdown-display">
        <span>Next retry in:</span>
        <span className="countdown-value">{countdown}s</span>
      </div>
    )}
    
    {/* During rapid "wait" (shouldn't happen, but just in case) */}
    {currentState === 'betweenAttempts' && phase === 'rapid' && (
      <div className="rapid-note">
        Rapid phase - no wait between attempts
      </div>
    )}
  </div>
)}
```

---

## Updated Demo Controls

```tsx
<div className="demo-controls">
  {/* Auto mode toggle */}
  <button 
    className={`control-btn ${isAutoMode ? 'active' : ''}`}
    onClick={() => {
      setIsAutoMode(!isAutoMode);
      if (!isAutoMode && currentState === 'waiting') {
        // Start auto demo
        setCurrentState('attemptActive');
        setAttemptNumber(1);
        setPhase('rapid');
        setAttemptTimer(0);
        addEvent('🚀 Auto-demo started: Attempt 1 began');
      }
    }}
  >
    {isAutoMode ? '⏸️ Stop Auto' : '▶️ Start Auto'}
  </button>
  
  {/* Manual step (only when not in auto mode) */}
  <button 
    className="control-btn" 
    onClick={stepNext}
    disabled={isAutoMode}
    title="Step to next state"
  >
    ⏭️ Next State
  </button>
  
  {/* Skip to interval phase */}
  <button 
    className="control-btn" 
    onClick={forceToIntervalPhase}
    disabled={phase === 'interval' || currentState === 'done'}
    title="Skip rapid phase"
  >
    ⏩ Skip to Intervals
  </button>
  
  {/* Force success */}
  <button 
    className="control-btn success" 
    onClick={forceSuccess}
    disabled={currentState === 'done'}
  >
    ✅ Force Success
  </button>
  
  {/* Reset */}
  <button className="control-btn reset" onClick={resetDemo}>
    🔄 Reset
  </button>
</div>
```

---

## Updated Reset Function

```typescript
const resetDemo = () => {
  setIsAutoMode(false);
  setCurrentState('waiting');
  setAttemptNumber(1);
  setPhase('rapid');
  setCountdown(0);
  setAttemptTimer(0);
  setEventLog([]);
  if (countdownRef.current) clearTimeout(countdownRef.current);
  if (attemptTimerRef.current) clearTimeout(attemptTimerRef.current);
  addEvent('Demo reset');
};
```

---

## Additional CSS

```css
.timer {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}

.control-btn.active {
  background: #1C1C1C;
  color: #FFFFFF;
}

.rapid-note {
  color: rgba(0, 0, 0, 0.5);
  font-style: italic;
  font-size: 0.875rem;
}
```

---

## Summary of Changes

| Change | Purpose |
|--------|---------|
| Add `attemptTimer` state | Count UP during active attempts |
| Add `isAutoMode` state | Toggle auto-progression |
| Add attempt duration useEffect | Auto-fail after 3 seconds |
| Update status panel | Show timer during active, countdown during wait |
| Hide "0s" during rapid phase | Less confusing |
| Add "Start Auto" button | Enable auto-progression mode |
| Updated reset function | Clear all timers |

---

## Demo Flow (Auto Mode)

```
Click "Start Auto"
↓
Attempt 1 Active: 1s... 2s... 3s... FAILED
↓
Attempt 2 Active: 1s... 2s... 3s... FAILED
↓
Attempt 3 Active: 1s... 2s... 3s... FAILED
↓
Interval Wait: 5s... 4s... 3s... 2s... 1s... 0s
↓
Attempt 4 Active: 1s... 2s... 3s... FAILED
↓
Interval Wait: 8s... 7s... 6s... (and so on)
```

User can click "Stop Auto" at any time to pause, or "Force Success" to end.

---
