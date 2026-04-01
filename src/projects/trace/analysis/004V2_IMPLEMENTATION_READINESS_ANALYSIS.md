# Trace Scroll-Linked Fade - Implementation Readiness Analysis

**Document**: 004V2 Implementation Readiness Analysis
**Created**: 2026-01-27
**Status**: Implementation Guide
**Purpose**: Validate Document 004 correctness and provide explicit code change guidance

---

## Executive Summary

**Document 004 Assessment**: ⭐⭐⭐⭐½ (4.5/5)

**Overall Verdict**: Document 004 is **substantially improved** and technically correct. The geometry logic, approach prioritization, and implementation strategy are all sound. However, it has one critical presentation issue: **the code examples show the TARGET state (after changes), not the CURRENT state**, which could cause confusion during implementation.

**Ready to Implement**: ✅ **YES** - Approach A (CSS Variables + Scroll Events) is ready for implementation **IF** the implementer understands they need to modify 4 key areas across 2 files.

---

## What Document 004 Got Right ✅

### 1. Geometry Logic is Perfect (Lines 120-146)

```tsx
const dayBlockBottom = dayBlockRect.bottom;
const dayTotalBottom = dayTotalRect.bottom;

// ✅ CORRECT: Detects when DayTotal has separated from DayBlock
const hasUnstuck = dayBlockBottom < dayTotalBottom;

if (hasUnstuck) {
  // ✅ CORRECT: Measures separation distance
  const pixelsPastUnstick = Math.min(8, dayTotalBottom - dayBlockBottom);

  // ✅ CORRECT: Maps 0-8px to opacity 1.0-0.0
  const opacity = Math.max(0, 1 - (pixelsPastUnstick / 8));
}
```

**Verdict**: This is the corrected geometry logic that fixes all previous attempts. Measures separation between bottoms after unsticking, not distance from sticky line.

---

### 2. Approach Prioritization is Correct (Lines 57-65)

| Approach | Recommendation | Status |
|----------|----------------|--------|
| A. CSS Variables + Scroll Events | **Primary** | ✅ Correct |
| B. Intersection Observer | Not recommended | ✅ Correct |
| C. CSS Scroll-Driven Animations | Experimental | ✅ Correct (demoted from Phase 1) |
| D. Hybrid Framer + CSS Variables | Not recommended | ✅ Correct |
| E. Inline Styles Refactor | Future consideration | ✅ Correct |
| F. CSS Modules Migration | Not recommended | ✅ Correct |

**Verdict**: Approach C correctly demoted from primary to experimental. Approach D correctly marked as not recommended due to percentage-vs-pixels problem.

---

### 3. Accessibility Added (Lines 416-437)

```tsx
const shouldReduceMotion = useReducedMotion();

useEffect(() => {
  if (shouldReduceMotion) return; // ✅ Disables scroll-linked fade
  // ... scroll handler setup
}, [shouldReduceMotion]);
```

**Verdict**: Critical accessibility requirement properly addressed. This was a blind spot in original Document 004.

---

### 4. Edge Cases Documented (Lines 440-456)

Covers:
- Single DayBlock (may never fade - acceptable)
- Short DayBlock (geometry check handles correctly)
- Last DayBlock (similar to single DayBlock)
- Rapid scrolling (RAF catches final position)
- Scroll direction reversal (opacity returns to 1.0)

**Verdict**: Comprehensive edge case analysis with expected behaviors defined.

---

### 5. Performance Considerations (Lines 459-492)

- Documents multiple scroll handlers (minimal impact)
- Provides IntersectionObserver optimization for 20+ DayBlocks
- Explains RAF throttling ensures 60fps

**Verdict**: Thorough performance analysis with optimization strategies for scale.

---

### 6. Testing Strategy is Actionable (Lines 603-628)

- Clear test cases with expected results
- Verification commands with `console.log` for debugging
- Coverage includes per-instance behavior, 8-pixel precision, reduced motion

**Verdict**: Practical testing approach that can be executed immediately.

---

### 7. Visualizations are Accurate (Lines 495-570)

ASCII diagrams showing:
- Before unstick (stuck state)
- At unstick point (separation begins)
- After unstick (4px separation, 50% opacity)
- Fully faded (8px separation, 0% opacity)

**Verdict**: Clear visual representation of geometry relationships.

---

## Critical Issue: Code State Mismatch ⚠️

### The Problem

Document 004 presents implementation code (lines 87-273) as if it's **example code** for how things should work, but **does not clearly state** that this code represents the **TARGET state** after modifications, not the **CURRENT state** of the codebase.

### Current Codebase vs. Document 004

#### **Discrepancy 1: DayTotal Component**

**Document 004 shows** (lines 191-225):
```tsx
export const DayTotal = React.forwardRef<HTMLDivElement, DayTotalProps>(
  ({ date, total, width = '277px', className = '' }, ref) => {
    return (
      <div ref={ref} className={`day-total ${className}`}>
        {/* ... */}
        <style jsx>{`
          .day-total {
            /* ... existing styles ... */
            opacity: var(--day-total-opacity, 1);
            transition: opacity 0.05s linear;
          }
        `}</style>
      </div>
    );
  }
);

DayTotal.displayName = 'DayTotal';
```

**Actual current code** (tracefinance.tsx:510-541):
```tsx
export const DayTotal: React.FC<DayTotalProps> = ({
  date,
  total,
  width = '277px',
  className = '',
}) => {
  return (
    <div className={`day-total ${className} ${styles.container}`}>
      {/* ... NO REF, NO forwardRef, NO opacity variable */}
    </div>
  );
};
```

**Status**: ❌ **MISSING** - Current DayTotal:
- Does NOT use `forwardRef`
- Does NOT accept `ref` prop
- Does NOT have `opacity: var(--day-total-opacity, 1)`
- Does NOT have `transition: opacity 0.05s linear`

---

#### **Discrepancy 2: DayBlock Component**

**Document 004 shows** (lines 230-273):
```tsx
export interface DayBlockProps {
  // ...
  dayTotalRef?: React.RefObject<HTMLDivElement>; // NEW: For scroll-linked fade
}

export const DayBlock = React.forwardRef<HTMLDivElement, DayBlockProps>(
  ({ date, dateOriginal, total, merchants, width = '277px', className = '', dayTotalRef }, ref) => {
    return (
      <div ref={ref} className={`day-block ${className}`}>
        <DayTotal ref={dayTotalRef} date={date} total={total} width={width} />
        {/* ... */}
      </div>
    );
  }
);

DayBlock.displayName = 'DayBlock';
```

**Actual current code** (tracefinance.tsx:455-471, 779-840):
```tsx
export interface DayBlockProps {
  date: string;
  dateOriginal?: string;
  total: string;
  merchants: Array<{/*...*/}>;
  width?: string;
  className?: string;
  // ❌ NO dayTotalRef prop
}

export const DayBlock: React.FC<DayBlockProps> = ({
  date,
  total,
  merchants,
  width = '277px',
  className = '',
  // ❌ NO dayTotalRef parameter
}) => {
  return (
    <div className={`day-block ${className} ${styles.container}`}>
      <DayTotal date={date} total={total} width="100%" />
      {/* ❌ NO ref passed to DayTotal */}
    </div>
  );
};
```

**Status**: ❌ **MISSING** - Current DayBlock:
- Does NOT use `forwardRef`
- Does NOT accept `ref` prop
- Does NOT have `dayTotalRef` in interface
- Does NOT pass `dayTotalRef` to DayTotal

---

#### **Discrepancy 3: AnimatedDayBlock Component**

**Document 004 shows** (lines 94-177):
```tsx
interface AnimatedDayBlockWithFadeProps extends DayBlockProps {
  index?: number;
  containerRef?: React.RefObject<HTMLElement>; // FinanceBox scroll container
}

export const AnimatedDayBlock: React.FC<AnimatedDayBlockWithFadeProps> = ({
  index = 0,
  containerRef, // ✅ Receives containerRef
  ...props
}) => {
  const dayBlockRef = useRef<HTMLDivElement>(null);
  const dayTotalRef = useRef<HTMLDivElement>(null);

  // Scroll-linked fade logic
  useEffect(() => {
    // ... geometry calculations and scroll handler
  }, [containerRef, shouldReduceMotion]);

  return (
    <DayBlock
      {...props}
      ref={dayBlockRef}
      dayTotalRef={dayTotalRef}
    />
  );
};
```

**Actual current code** (tracefinance-animated.tsx:52-76):
```tsx
export const AnimatedDayBlock: React.FC<DayBlockProps & { index?: number }> = ({
  index = 0,
  ...props
  // ❌ NO containerRef prop
}) => {
  const shouldReduceMotion = useReducedMotion();

  // ❌ Only entry/exit animations, NO scroll-linked fade
  const animationProps = shouldReduceMotion
    ? { initial: false, animate: false, exit: false }
    : {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: {
          duration: ANIMATION_CONFIG.duration.normal,
          ease: ANIMATION_CONFIG.easing.standard,
          delay: index * ANIMATION_CONFIG.stagger.items,
        },
      };

  return (
    <motion.div {...animationProps} style={{ width: '100%' }}>
      <DayBlock {...props} />
    </motion.div>
  );
};
```

**Status**: ❌ **MISSING** - Current AnimatedDayBlock:
- Does NOT accept `containerRef` prop
- Does NOT create `dayBlockRef` or `dayTotalRef`
- Does NOT implement scroll handler
- Does NOT have scroll-linked fade logic
- ONLY has entry/exit animations

---

#### **Discrepancy 4: AnimatedFinanceBox Prop Passing**

**What needs to happen** (implied by Document 004):
```tsx
<AnimatedDayBlock
  key={day.dateOriginal || day.date}
  date={day.date}
  dateOriginal={day.dateOriginal}
  total={day.total}
  merchants={day.merchants}
  width="100%"
  index={index}
  containerRef={containerRef} // ⚠️ NEEDS TO BE ADDED
/>
```

**Actual current code** (tracefinance-animated.tsx:135-146):
```tsx
<AnimatedDayBlock
  key={day.dateOriginal || day.date}
  date={day.date}
  dateOriginal={day.dateOriginal}
  total={day.total}
  merchants={day.merchants}
  width="100%"
  index={index}
  // ❌ NOT passing containerRef
/>
```

**Status**: ❌ **MISSING** - AnimatedFinanceBox has `containerRef` available (line 91) but doesn't pass it down.

---

## Required Code Changes

### Change Summary

| File | Changes Required | Complexity |
|------|------------------|------------|
| tracefinance.tsx | 3 modifications | Medium |
| tracefinance-animated.tsx | 2 modifications | High |

**Total Impact**: 5 changes across 2 files

---

### File 1: tracefinance.tsx (3 changes)

#### Change 1.1: Convert DayTotal to forwardRef

**Location**: Lines 510-541

**Current**:
```tsx
export const DayTotal: React.FC<DayTotalProps> = ({
  date,
  total,
  width = '277px',
  className = '',
}) => {
  return (
    <div className={`day-total ${className} ${styles.container}`}>
      <Date date={date} />
      <TotalFrame total={total} />

      <style jsx>{`
        .day-total {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 4px;
          padding: var(--trace-daytotal-padding);
          border-radius: 0px;
          width: ${width};
          background: var(--trace-bg-dark);

          position: sticky;
          top: calc(0px - var(--trace-financebox-padding-top));
          z-index: 10;
        }
      `}</style>
    </div>
  );
};
```

**Required**:
```tsx
export const DayTotal = React.forwardRef<HTMLDivElement, DayTotalProps>(
  ({ date, total, width = '277px', className = '' }, ref) => {
    return (
      <div ref={ref} className={`day-total ${className} ${styles.container}`}>
        <Date date={date} />
        <TotalFrame total={total} />

        <style jsx>{`
          .day-total {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 4px;
            padding: var(--trace-daytotal-padding);
            border-radius: 0px;
            width: ${width};
            background: var(--trace-bg-dark);

            position: sticky;
            top: calc(0px - var(--trace-financebox-padding-top));
            z-index: 10;

            /* ADD THESE TWO LINES: */
            opacity: var(--day-total-opacity, 1);
            transition: opacity 0.05s linear;
          }
        `}</style>
      </div>
    );
  }
);

DayTotal.displayName = 'DayTotal';
```

**Changes**:
1. Convert from `React.FC` to `React.forwardRef`
2. Add `ref` parameter (second parameter after props)
3. Apply `ref={ref}` to root div
4. Add `opacity: var(--day-total-opacity, 1)` to styles
5. Add `transition: opacity 0.05s linear` to styles
6. Add `DayTotal.displayName = 'DayTotal'`

---

#### Change 1.2: Add dayTotalRef to DayBlockProps

**Location**: Lines 455-471

**Current**:
```tsx
export interface DayBlockProps {
  date: string;
  dateOriginal?: string;
  total: string;
  merchants: Array<{
    merchantName?: string;
    merchantTotal: string;
    items: Array<{
      quantity: string;
      itemName: string;
      netPrice: string;
      discount?: string;
    }>;
  }>;
  width?: string;
  className?: string;
}
```

**Required**:
```tsx
export interface DayBlockProps {
  date: string;
  dateOriginal?: string;
  total: string;
  merchants: Array<{
    merchantName?: string;
    merchantTotal: string;
    items: Array<{
      quantity: string;
      itemName: string;
      netPrice: string;
      discount?: string;
    }>;
  }>;
  width?: string;
  className?: string;
  dayTotalRef?: React.RefObject<HTMLDivElement>; // ADD THIS LINE
}
```

**Changes**:
1. Add `dayTotalRef?: React.RefObject<HTMLDivElement>` to interface

---

#### Change 1.3: Convert DayBlock to forwardRef

**Location**: Lines 779-840

**Current**:
```tsx
export const DayBlock: React.FC<DayBlockProps> = ({
  date,
  total,
  merchants,
  width = '277px',
  className = '',
}) => {
  // ... existing logic ...

  return (
    <div className={`day-block ${className} ${styles.container}`}>
      <DayTotal date={date} total={total} width="100%" />
      <DayExpenses merchants={merchants} width="100%" priceFrameWidth={priceFrameWidth} />

      <style jsx>{`
        .day-block {
          display: flex;
          flex-direction: column;
          gap: 0;
          width: ${width};
        }
      `}</style>
    </div>
  );
};
```

**Required**:
```tsx
export const DayBlock = React.forwardRef<HTMLDivElement, DayBlockProps>(
  ({ date, dateOriginal, total, merchants, width = '277px', className = '', dayTotalRef }, ref) => {
    // ... existing logic (calculateOptimalPriceWidth remains unchanged) ...

    return (
      <div ref={ref} className={`day-block ${className} ${styles.container}`}>
        <DayTotal ref={dayTotalRef} date={date} total={total} width="100%" />
        <DayExpenses merchants={merchants} width="100%" priceFrameWidth={priceFrameWidth} />

        <style jsx>{`
          .day-block {
            display: flex;
            flex-direction: column;
            gap: 0;
            width: ${width};
          }
        `}</style>
      </div>
    );
  }
);

DayBlock.displayName = 'DayBlock';
```

**Changes**:
1. Convert from `React.FC` to `React.forwardRef`
2. Add `ref` parameter (second parameter after props destructuring)
3. Add `dateOriginal` to destructured props (it's in interface but not used in current code)
4. Add `dayTotalRef` to destructured props
5. Apply `ref={ref}` to root div
6. Pass `ref={dayTotalRef}` to DayTotal component
7. Add `DayBlock.displayName = 'DayBlock'`

---

### File 2: tracefinance-animated.tsx (2 changes)

#### Change 2.1: Replace AnimatedDayBlock Implementation

**Location**: Lines 52-76

**Current** (entire implementation):
```tsx
export const AnimatedDayBlock: React.FC<DayBlockProps & { index?: number }> = ({
  index = 0,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const animationProps = shouldReduceMotion
    ? { initial: false, animate: false, exit: false }
    : {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: {
          duration: ANIMATION_CONFIG.duration.normal,
          ease: ANIMATION_CONFIG.easing.standard,
          delay: index * ANIMATION_CONFIG.stagger.items,
        },
      };

  return (
    <motion.div {...animationProps} style={{ width: '100%' }}>
      <DayBlock {...props} />
    </motion.div>
  );
};
```

**Required** (use Document 004 lines 87-177):
```tsx
interface AnimatedDayBlockWithFadeProps extends DayBlockProps {
  index?: number;
  containerRef?: React.RefObject<HTMLElement>; // FinanceBox scroll container
}

export const AnimatedDayBlock: React.FC<AnimatedDayBlockWithFadeProps> = ({
  index = 0,
  containerRef,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const dayBlockRef = useRef<HTMLDivElement>(null);
  const dayTotalRef = useRef<HTMLDivElement>(null);

  // Entry/exit animations (existing behavior)
  const animationProps = shouldReduceMotion
    ? { initial: false, animate: false, exit: false }
    : {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: {
          duration: ANIMATION_CONFIG.duration.normal,
          ease: ANIMATION_CONFIG.easing.standard,
          delay: index * ANIMATION_CONFIG.stagger.items,
        },
      };

  // Scroll-linked fade effect (NEW)
  useEffect(() => {
    if (shouldReduceMotion) return; // Respect accessibility preference

    const container = containerRef?.current;
    const dayBlock = dayBlockRef.current;
    const dayTotal = dayTotalRef.current;

    if (!container || !dayBlock || !dayTotal) return;

    let ticking = false;

    const updateOpacity = () => {
      const dayBlockRect = dayBlock.getBoundingClientRect();
      const dayTotalRect = dayTotal.getBoundingClientRect();

      // Key insight: DayTotal unsticks when its bottom edge reaches DayBlock's bottom edge
      // After unsticking, DayBlock bottom moves ABOVE DayTotal bottom as DayTotal scrolls up
      const dayBlockBottom = dayBlockRect.bottom;
      const dayTotalBottom = dayTotalRect.bottom;

      // Check if DayTotal has unstuck (separated from DayBlock)
      const hasUnstuck = dayBlockBottom < dayTotalBottom;

      if (hasUnstuck) {
        // Calculate how far past the unstick point (0-8px)
        // pixelsPastUnstick = how many pixels DayTotal's bottom is below DayBlock's bottom
        const pixelsPastUnstick = Math.min(8, dayTotalBottom - dayBlockBottom);

        // Fade from 1.0 → 0.0 over 8 pixels
        // At 0px past unstick: opacity = 1.0
        // At 8px past unstick: opacity = 0.0
        const opacity = Math.max(0, 1 - (pixelsPastUnstick / 8));

        dayTotal.style.setProperty('--day-total-opacity', String(opacity));
      } else {
        // Still stuck or hasn't reached unstick point yet
        dayTotal.style.setProperty('--day-total-opacity', '1');
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateOpacity();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    updateOpacity();

    // Listen to scroll events with passive flag for performance
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, shouldReduceMotion]);

  return (
    <motion.div {...animationProps} style={{ width: '100%' }}>
      <DayBlock
        {...props}
        ref={dayBlockRef}
        dayTotalRef={dayTotalRef}
      />
    </motion.div>
  );
};
```

**Changes**:
1. Create new interface `AnimatedDayBlockWithFadeProps` extending `DayBlockProps`
2. Add `containerRef` to props
3. Create `dayBlockRef` and `dayTotalRef` refs
4. Keep existing entry/exit animation logic (unchanged)
5. Add new `useEffect` for scroll-linked fade with:
   - `shouldReduceMotion` check
   - Geometry-based opacity calculation
   - RAF-throttled scroll handler
   - Cleanup on unmount
6. Pass `ref={dayBlockRef}` and `dayTotalRef={dayTotalRef}` to DayBlock

**Key Point**: This change **adds** scroll-linked fade **while preserving** existing entry/exit animations. Both animation systems coexist.

---

#### Change 2.2: Pass containerRef in AnimatedFinanceBox

**Location**: Lines 135-146

**Current**:
```tsx
return (
  <div className={`finance-box ${className} ${styles.container}`} ref={containerRef}>
    <AnimatePresence>
      {days.map((day, index) => (
        <AnimatedDayBlock
          key={day.dateOriginal || day.date}
          date={day.date}
          dateOriginal={day.dateOriginal}
          total={day.total}
          merchants={day.merchants}
          width="100%"
          index={index}
        />
      ))}
    </AnimatePresence>
  </div>
);
```

**Required**:
```tsx
return (
  <div className={`finance-box ${className} ${styles.container}`} ref={containerRef}>
    <AnimatePresence>
      {days.map((day, index) => (
        <AnimatedDayBlock
          key={day.dateOriginal || day.date}
          date={day.date}
          dateOriginal={day.dateOriginal}
          total={day.total}
          merchants={day.merchants}
          width="100%"
          index={index}
          containerRef={containerRef} // ADD THIS LINE
        />
      ))}
    </AnimatePresence>
  </div>
);
```

**Changes**:
1. Add `containerRef={containerRef}` prop to AnimatedDayBlock

**Note**: The `containerRef` is already defined at line 91 of AnimatedFinanceBox. We're just passing it down.

---

## Implementation Checklist

### Pre-Implementation (Before Writing Code)

- [ ] **Commit current stable state** with message: "Before scroll-linked fade implementation"
- [ ] **Record commit hash** for easy rollback: `git rev-parse HEAD`
- [ ] **Verify all tests pass** in current state
- [ ] **Identify all DayTotal/DayBlock usages**:
  - Main app usage locations
  - Showcase/demo components (tracecomponent.tsx, tracemorphing.tsx)
- [ ] **Set attempt limit**: Maximum 2 implementation attempts before stopping
- [ ] **Review Document 004 lines 87-288** (Approach A implementation)

### File 1: tracefinance.tsx Changes

- [ ] **Change 1.1**: Convert DayTotal to forwardRef
  - [ ] Add forwardRef wrapper
  - [ ] Add ref parameter
  - [ ] Apply ref to root div
  - [ ] Add `opacity: var(--day-total-opacity, 1)`
  - [ ] Add `transition: opacity 0.05s linear`
  - [ ] Add `DayTotal.displayName = 'DayTotal'`
  - [ ] Test: DayTotal still renders in showcase

- [ ] **Change 1.2**: Add dayTotalRef to DayBlockProps interface
  - [ ] Add `dayTotalRef?: React.RefObject<HTMLDivElement>` to interface

- [ ] **Change 1.3**: Convert DayBlock to forwardRef
  - [ ] Add forwardRef wrapper
  - [ ] Add ref parameter
  - [ ] Add dayTotalRef to destructured props
  - [ ] Apply ref to root div
  - [ ] Pass dayTotalRef to DayTotal
  - [ ] Add `DayBlock.displayName = 'DayBlock'`
  - [ ] Test: DayBlock still renders in showcase

- [ ] **Verify**: No TypeScript errors in tracefinance.tsx
- [ ] **Verify**: Showcase components still work

### File 2: tracefinance-animated.tsx Changes

- [ ] **Change 2.1**: Replace AnimatedDayBlock implementation
  - [ ] Create `AnimatedDayBlockWithFadeProps` interface
  - [ ] Add containerRef to props
  - [ ] Create dayBlockRef and dayTotalRef
  - [ ] Keep existing animationProps (entry/exit)
  - [ ] Add scroll-linked fade useEffect
  - [ ] Pass refs to DayBlock component
  - [ ] Test: Entry/exit animations still work

- [ ] **Change 2.2**: Pass containerRef in AnimatedFinanceBox
  - [ ] Add `containerRef={containerRef}` to AnimatedDayBlock
  - [ ] Test: Component renders without errors

- [ ] **Verify**: No TypeScript errors in tracefinance-animated.tsx
- [ ] **Verify**: Build succeeds

### Testing Phase

#### Visual Testing
- [ ] Multiple DayBlocks: Only one DayTotal fades at a time
- [ ] Smooth opacity transition (no jumps)
- [ ] No layout shifts or broken sticky positioning
- [ ] Entry/exit animations still work for new/removed blocks

#### Measurement Testing
- [ ] Add `console.log` in updateOpacity() to verify values
- [ ] Confirm opacity goes from 1.0 → 0.0 over exactly 8 pixels
- [ ] Confirm hasUnstuck triggers at correct point
- [ ] Confirm pixelsPastUnstick calculates correctly

#### Edge Case Testing
- [ ] Single DayBlock (fade may not trigger - acceptable)
- [ ] Rapid scrolling (opacity jumps to final value - acceptable)
- [ ] Scroll direction reversal (opacity returns to 1.0)
- [ ] Reduced motion: `prefers-reduced-motion: reduce` disables fade

#### Performance Testing
- [ ] Smooth 60fps scrolling with multiple DayBlocks
- [ ] No jank or stuttering
- [ ] RAF throttling working correctly

#### Regression Testing
- [ ] Showcase pages (tracecomponent.tsx, tracemorphing.tsx) unaffected
- [ ] All existing animations still work
- [ ] No broken layouts

### Post-Implementation

- [ ] **Remove console.log statements** from updateOpacity()
- [ ] **Commit changes** with message: "Implement scroll-linked fade for DayTotal headers"
- [ ] **Document any issues** encountered
- [ ] **Update this checklist** if implementation differs from plan

---

## Success Criteria

Implementation is successful when ALL of the following are true:

1. ✅ **Per-instance fade**: Only the specific DayTotal being scrolled fades
2. ✅ **Smooth animation**: Opacity changes smoothly with scroll position
3. ✅ **Correct trigger**: Fade begins when DayTotal reaches bottom of DayBlock
4. ✅ **Correct distance**: Full fade (1.0 → 0.0) over exactly 8 pixels
5. ✅ **No layout breaks**: Sticky positioning and flexbox still work
6. ✅ **Entry/exit preserved**: Existing animations for new/removed blocks still work
7. ✅ **Accessibility**: Respects `prefers-reduced-motion`
8. ✅ **No regressions**: Showcase and existing features unaffected

If ANY criterion fails after 2 attempts, **STOP** and revert to stable commit.

---

## Rollback Procedure

If implementation fails or causes issues:

```bash
# Step 1: Record current commit (if needed for debugging)
git rev-parse HEAD > failed_attempt_hash.txt

# Step 2: Revert to stable commit (recorded in pre-implementation)
git reset --hard <STABLE_COMMIT_HASH>

# Step 3: Verify rollback successful
npm run build

# Step 4: Document failure in analysis document
```

---

## Key Insights from Document 004

### What Makes Approach A Work

1. **Direct DOM manipulation via CSS variables**: Avoids React re-render overhead
2. **RAF throttling**: Ensures smooth 60fps performance
3. **Geometry-based detection**: Pixel-perfect trigger and measurement
4. **Per-instance refs**: Each DayBlock tracks its own DayTotal independently
5. **Passive scroll listeners**: Non-blocking for browser optimizations

### Why Previous Attempts Failed

1. **Attempt 1**: All DayTotals animated simultaneously (no per-instance tracking)
2. **Attempt 2**: Wrapper broke sticky positioning
3. **Attempt 3**: Props passed through component chain (too complex)
4. **Attempt 4**: motion.div broke styled-jsx template literals
5. **Attempt 5**: State updates caused re-renders and performance issues

### Why This Attempt Will Succeed

1. ✅ **Corrected geometry logic**: Measures separation after unsticking
2. ✅ **No wrappers around sticky element**: forwardRef passes ref directly
3. ✅ **CSS variables bridge**: Works with styled-jsx without breaking templates
4. ✅ **Direct DOM manipulation**: No state updates, no re-renders
5. ✅ **Works within existing architecture**: Minimal disruption to current code

---

## Final Recommendations

### Before Implementation

1. **Read Document 004 lines 87-288 completely**
2. **Understand this document's change list** (all 5 changes)
3. **Review previous failed attempts** (Document 003) to avoid repeating mistakes
4. **Set up debugging tools**: Browser DevTools, React DevTools, performance monitor

### During Implementation

1. **Make one change at a time** (follow checklist order)
2. **Test after each change** (don't batch changes)
3. **Use console.log liberally** during development (remove before commit)
4. **Watch for TypeScript errors** (they indicate interface mismatches)

### If Problems Occur

1. **Don't panic** - this is a complex feature
2. **Revert immediately** if sticky positioning breaks
3. **Check component hierarchy** if refs aren't connecting
4. **Verify containerRef is passed** all the way down
5. **Ask for help** after 2 failed attempts (don't exceed attempt limit)

---

## Document 004 Overall Grade

**Technical Correctness**: ⭐⭐⭐⭐⭐ (5/5)
- Geometry logic is perfect
- Approach prioritization is correct
- Implementation strategy is sound

**Presentation Clarity**: ⭐⭐⭐⭐ (4/5)
- Could be clearer that code examples show TARGET state
- Missing explicit "Changes Required" section
- Otherwise excellent documentation

**Implementation Readiness**: ⭐⭐⭐⭐ (4/5)
- Ready to implement with this document (004V2) as supplement
- All changes clearly documented
- Success criteria well-defined

**Overall**: ⭐⭐⭐⭐½ (4.5/5)

**Verdict**: Document 004 is **excellent and ready for implementation** with the clarifications provided in this document (004V2). Implementer should use Document 004 for the approach and code patterns, and this document (004V2) for the explicit change list and migration path.

---

**Document End**
