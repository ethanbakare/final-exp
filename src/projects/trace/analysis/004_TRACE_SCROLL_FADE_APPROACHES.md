# Trace Scroll-Linked Fade Animation - Approach Analysis & Recommendations

**Document**: 004 Trace Scroll Fade Approaches
**Created**: 2026-01-27
**Updated**: 2026-01-27 (Revised with corrections from 004V1 and 004V2 critiques)
**Status**: Implementation Guide
**Predecessor**: 003_TRACE_SCROLL_FADE_ISSUE_ANALYSIS.md

---

## Document Purpose

This document provides:
1. **Corrected analysis** of the actual issues encountered in previous attempts
2. **Comprehensive evaluation** of all viable approaches for implementing scroll-linked fade
3. **Detailed recommendations** with validated implementation guidance
4. **Explicit code changes required** with current vs. target state comparisons
5. **Accessibility considerations** and edge case handling
6. **Testing strategy** for verification

**Important Note**: Code examples in this document show the **TARGET state** (what code should look like after implementation), not the current state of the codebase. See the "Required Code Changes" section for explicit before/after comparisons.

---

## Correction to Previous Analysis (Document 003)

### Attempt 1 Mischaracterization

**Document 003 stated**:
> "Applied fade to entire DayBlock instead of just DayTotal"

**Actual Issue**:
The fade was correctly targeting DayTotal elements, but it faded the DayTotals of **every single DayBlock simultaneously** rather than only the specific DayTotal being scrolled out of view.

**Root Cause**: The scroll tracking was not properly scoped to individual DayBlock instances. All DayTotal elements responded to the same scroll progress value instead of each having independent scroll tracking relative to their own container position.

**User Feedback (Actual Context)**:
> "It seems to be you seem to be focused on the wrong element again. It was meant to be the data totals that are sticky"

This feedback was about the **scope** of the animation (all vs. one), not about which element type was being animated.

---

## The Core Problem Restated

### What We Want
When a **specific** sticky DayTotal header reaches the bottom of **its own** DayBlock:
1. That DayTotal (and only that DayTotal) begins to fade
2. Opacity decreases proportionally from 1.0 → 0.0 over 8 pixels of scroll
3. The fade is smooth, real-time, and "intertwined" with scroll position
4. Other DayTotal headers remain at full opacity until they reach their own exit point

### Why It's Hard
1. **Per-instance scroll tracking**: Each DayBlock needs independent scroll progress calculation
2. **Sticky element constraints**: Cannot wrap DayTotal without breaking `position: sticky`
3. **Styled-JSX constraints**: Cannot use `motion.div` without breaking template literals
4. **MotionValue constraints**: Cannot pass `MotionValue` to regular HTML elements

---

## Approach Evaluation Matrix

| Approach | Preserves Sticky | Works with Styled-JSX | Per-Instance Tracking | Smooth Animation | Complexity | Recommendation |
|----------|------------------|----------------------|----------------------|------------------|------------|----------------|
| A. CSS Variables + Scroll Events | ✅ | ✅ | ✅ | ✅ Good | Medium | **Primary** |
| B. Intersection Observer | ✅ | ✅ | ✅ | ❌ Coarse | Low | Not recommended |
| C. CSS Scroll-Driven Animations | ✅ | ✅ | ✅ | ✅ Excellent | Low | Experimental |
| D. Hybrid Framer + CSS Variables | ✅ | ✅ | ⚠️ Complex | ⚠️ Percentage-based | Medium | Not recommended |
| E. Inline Styles Refactor | ✅ | ❌ N/A | ✅ | ✅ Excellent | High | Future consideration |
| F. CSS Modules Migration | ✅ | ❌ N/A | ✅ | ✅ Excellent | Very High | Not recommended |

---

## Approach A: CSS Variables + Scroll Event Listeners (RECOMMENDED)

### Overview
Use vanilla JavaScript scroll event listeners to calculate opacity based on each DayTotal's position relative to its DayBlock, then apply via CSS custom properties.

### Critical Geometry Understanding

**How Sticky Positioning Works**:
1. DayTotal sticks to container top while DayExpenses scroll under it
2. When all DayExpenses have passed, DayTotal reaches the **bottom edge of its DayBlock**
3. At this point, DayTotal **unsticks** and begins scrolling up
4. During the NEXT 8 pixels of upward scroll, it should fade

**The Correct Trigger**: When `dayBlockRect.bottom < dayTotalRect.bottom` (DayTotal has separated from its DayBlock)

**The Correct Measurement**: Distance between `dayTotalRect.bottom` and `dayBlockRect.bottom` after separation

### Target Implementation

The following code shows what the components should look like **after** implementing the changes. See "Required Code Changes" section below for explicit before/after comparisons.

```tsx
// AnimatedDayBlock.tsx - TARGET STATE
import React, { useRef, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { DayBlock } from './tracefinance';
import type { DayBlockProps } from './tracefinance';

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

  // Entry/exit animations (existing behavior - KEEP THIS)
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

  // Scroll-linked fade effect (NEW - only if motion not reduced)
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

### Pros
- Works with existing styled-jsx architecture
- Maintains sticky positioning (no wrapper needed)
- Per-instance tracking (each DayTotal has its own ref and scroll handler)
- No Framer Motion dependency for this specific animation
- Pixel-perfect 8px fade distance
- Respects `prefers-reduced-motion`
- **Preserves existing entry/exit animations**

### Cons
- Multiple scroll handlers if many DayBlocks (see Performance section)
- Manual geometry calculations

### Verdict
**Recommended as primary approach**. Lowest risk, works within existing architecture, correctly handles the geometry.

---

## Required Code Changes

**Total Impact**: 5 changes across 2 files

| File | Changes Required | Complexity |
|------|------------------|------------|
| tracefinance.tsx | 3 modifications | Medium |
| tracefinance-animated.tsx | 2 modifications | High |

---

### File 1: tracefinance.tsx (3 changes)

#### Change 1.1: Convert DayTotal to forwardRef

**CURRENT STATE**:
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

**TARGET STATE**:
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

            /* NEW: Scroll-linked opacity */
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

**CURRENT STATE**:
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

**TARGET STATE**:
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
  dayTotalRef?: React.RefObject<HTMLDivElement>; // NEW: For scroll-linked fade
}
```

**Changes**:
1. Add `dayTotalRef?: React.RefObject<HTMLDivElement>` to interface

---

#### Change 1.3: Convert DayBlock to forwardRef

**CURRENT STATE**:
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

**TARGET STATE**:
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
3. Add `dayTotalRef` to destructured props
4. Apply `ref={ref}` to root div
5. Pass `ref={dayTotalRef}` to DayTotal component
6. Add `DayBlock.displayName = 'DayBlock'`

---

### File 2: tracefinance-animated.tsx (2 changes)

#### Change 2.1: Replace AnimatedDayBlock Implementation

**CURRENT STATE**:
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

**TARGET STATE**:
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

  // Entry/exit animations (existing behavior - UNCHANGED)
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

      const dayBlockBottom = dayBlockRect.bottom;
      const dayTotalBottom = dayTotalRect.bottom;

      const hasUnstuck = dayBlockBottom < dayTotalBottom;

      if (hasUnstuck) {
        const pixelsPastUnstick = Math.min(8, dayTotalBottom - dayBlockBottom);
        const opacity = Math.max(0, 1 - (pixelsPastUnstick / 8));
        dayTotal.style.setProperty('--day-total-opacity', String(opacity));
      } else {
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

    updateOpacity();
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
5. Add new `useEffect` for scroll-linked fade
6. Pass `ref={dayBlockRef}` and `dayTotalRef={dayTotalRef}` to DayBlock

**Key Point**: This change **adds** scroll-linked fade **while preserving** existing entry/exit animations.

---

#### Change 2.2: Pass containerRef in AnimatedFinanceBox

**CURRENT STATE**:
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

**TARGET STATE**:
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
          containerRef={containerRef} // NEW: Pass container ref for scroll tracking
        />
      ))}
    </AnimatePresence>
  </div>
);
```

**Changes**:
1. Add `containerRef={containerRef}` prop to AnimatedDayBlock

**Note**: The `containerRef` already exists in AnimatedFinanceBox. We're just passing it down.

---

## Approach B: Intersection Observer API

### Overview
Use Intersection Observer to detect when DayTotal elements cross visibility thresholds.

### Why It's Not Recommended
- **Coarse-grained**: Only fires at threshold crossings, not continuously
- Even with 21 thresholds (every 5%), not as smooth as scroll-linked
- Threshold values map to intersection ratio, not pixel distance
- Cannot achieve "8 pixels = full fade" requirement precisely

### Verdict
**Not recommended** for this use case. The requirement for pixel-perfect, smooth, scroll-intertwined animation cannot be met with threshold-based detection.

---

## Approach C: CSS Scroll-Driven Animations (EXPERIMENTAL)

### Overview
Use the new CSS `animation-timeline: scroll()` feature for native scroll-linked animations.

### Why This is Experimental (Not Primary)

**Issue 1: `view()` Timeline with Sticky Elements is Untested**

The `view()` timeline tracks when elements enter/exit the viewport. **Sticky elements don't exit the viewport normally - they stick!** The animation might:
- Never trigger (element is "always visible" while stuck)
- Trigger at the wrong time (when initially scrolling into view, not when unsticking)
- Not track the unstick → scroll-out transition properly

**Issue 2: Mixed Units May Be Invalid**

```css
animation-range: exit 0% exit 8px;
```

Mixing percentages (`0%`) and pixel values (`8px`) in range syntax may be invalid CSS. The spec typically uses:
- Percentages: `exit 0% exit 100%`
- Named ranges: `exit`, `entry`, `contain`

### Implementation (For Testing Only)

```css
/* Test if this works with sticky elements */
.day-total {
  animation: fade-out linear;
  animation-timeline: view();
  animation-range: exit 0px exit 8px; /* Test pure pixel values */
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

### Browser Support
- Chrome 115+, Edge 115+, Safari 18+
- No Firefox support as of Jan 2026

### Verdict
**Experimental only**. Test separately after Approach A is working. Do not build primary implementation on untested CSS.

---

## Approach D: Hybrid Framer Motion + CSS Variables (NOT RECOMMENDED)

### Why This Approach Fails

**Problem 1: Wrong Offset Configuration**

```tsx
// WRONG
offset: ["end end", "end start"]
```

This tracks when the **DayBlock's END** reaches the container's END/START. But we need to track when **DayTotal** reaches a specific point relative to the **DayBlock's bottom**.

**Problem 2: Percentage-Based Fade Distance**

```tsx
// WRONG
const opacity = useTransform(scrollYProgress, [0.9, 1], [1, 0]);
```

This maps the **last 10% of scroll progress** to opacity fade.

The requirement is **8 pixels**, not a percentage:
- Short DayBlock (100px tall): 10% = 10px fade distance ❌
- Long DayBlock (400px tall): 10% = 40px fade distance ❌
- Required: 8px fade distance regardless of DayBlock height ✅

**Framer Motion's `useScroll` returns normalized values (0-1)**. To get pixel-perfect 8px fade, you'd need to:
1. Calculate DayBlock height manually
2. Convert 8px to percentage of that height
3. Pass dynamic transform ranges per instance

At this point, you're doing manual geometry calculations anyway, **defeating the purpose of using Framer Motion**.

### Verdict
**Not recommended**. Approach A (vanilla scroll events) is simpler and more direct. Approach D adds complexity without solving the percentage-vs-pixels problem.

---

## Approach E: Inline Styles Refactor

### Overview
Refactor DayTotal to use inline styles instead of styled-jsx.

### Verdict
**Consider for future refactor, but not recommended for immediate implementation**. The architectural inconsistency and breaking change risk outweigh the benefits when Approach A works within existing architecture.

---

## Approach F: CSS Modules Migration

### Overview
Migrate entire Trace component suite from styled-jsx to CSS Modules.

### Verdict
**Not recommended for this feature**. This is a valid long-term architectural decision but should not be driven by a single animation feature.

---

## Accessibility Considerations

### `prefers-reduced-motion` Support

**Critical**: The scroll-linked fade must be disabled entirely for users who prefer reduced motion.

```tsx
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

useEffect(() => {
  if (shouldReduceMotion) return; // Don't apply scroll-linked fade
  // ... scroll handler setup
}, [shouldReduceMotion]);
```

### Why This Matters
- Scroll-linked animations can cause motion sickness
- Users explicitly request reduced motion via OS settings
- This is an accessibility requirement, not optional

---

## Edge Cases

### 1. Single DayBlock
If there's only one DayBlock, it may never unstick (always at bottom of scroll container). The fade may never trigger. **Acceptable behavior** - nothing to fade into.

### 2. Short DayBlock
If DayBlock is shorter than DayTotal's height, DayTotal may never stick. The geometry check `dayBlockBottom < dayTotalBottom` handles this correctly - it simply never becomes true.

### 3. Last DayBlock
The final DayBlock has no content below to push it out. Similar to single DayBlock case. **Acceptable behavior**.

### 4. Rapid Scrolling
If user scrolls past the 8px fade zone instantly, the RAF-throttled handler will catch the final position and set opacity to 0. The `transition: opacity 0.05s linear` provides minimal smoothing.

### 5. Scroll Direction Reversal
When scrolling back up (reverse direction), the geometry check correctly detects when `hasUnstuck` becomes false again and resets opacity to 1.

---

## Performance Considerations

### Multiple Scroll Handlers

With 10 DayBlocks, 10 scroll handlers run simultaneously. Each handler:
1. Gets bounding rects (cheap)
2. Does simple math (very cheap)
3. Sets CSS variable (cheap)

**Impact**: Minimal. `getBoundingClientRect()` is optimized in modern browsers. RAF throttling ensures max 60 updates/second total.

### Optimization: IntersectionObserver Gating

For very long lists (20+ DayBlocks), consider using IntersectionObserver to enable/disable scroll handlers only for DayBlocks near the viewport:

```tsx
// Only enable scroll tracking for visible DayBlocks
const [isNearViewport, setIsNearViewport] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsNearViewport(entry.isIntersecting),
    { rootMargin: '100px' } // Enable 100px before entering viewport
  );
  observer.observe(dayBlockRef.current);
  return () => observer.disconnect();
}, []);

useEffect(() => {
  if (!isNearViewport || shouldReduceMotion) return;
  // ... scroll handler setup
}, [isNearViewport, shouldReduceMotion]);
```

---

## Geometry Visualization

```
BEFORE UNSTICK (All DayExpenses still scrolling under DayTotal):
┌─────────────────────────────────┐
│ FinanceBox Container            │
│ ┌─────────────────────────────┐ │
│ │ DayBlock                    │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ DayTotal (STICKY)       │ │ │ ← Stuck to container top
│ │ └─────────────────────────┘ │ │
│ │                             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ DayExpenses scrolling   │ │ │
│ │ │ under DayTotal...       │ │ │
│ │ └─────────────────────────┘ │ │
│ │                             │ │
│ └─────────────────────────────┘ │ ← DayBlock bottom
└─────────────────────────────────┘

dayBlockRect.bottom >= dayTotalRect.bottom
hasUnstuck = false
opacity = 1.0


AT UNSTICK POINT (All DayExpenses have scrolled past):
┌─────────────────────────────────┐
│ FinanceBox Container            │
│ ┌─────────────────────────────┐ │
│ │ DayBlock                    │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ DayTotal (AT BOTTOM)    │ │ │ ← At DayBlock's bottom edge
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │ ← DayBlock bottom = DayTotal bottom
│                                 │
└─────────────────────────────────┘

dayBlockRect.bottom === dayTotalRect.bottom
hasUnstuck = false (just about to)
opacity = 1.0


AFTER UNSTICK (DayTotal scrolling up, 4px past unstick):
┌─────────────────────────────────┐
│ FinanceBox Container            │
│ ┌─────────────────────────────┐ │ ← DayBlock bottom (scrolled up)
│ │ DayBlock                    │ │
│ │                             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ DayTotal (FADING)       │ │ │ ← Scrolling up, fading
│ │ └─────────────────────────┘ │ │
│ │         ↑ 4px separation    │ │
└─────────────────────────────────┘

dayTotalRect.bottom - dayBlockRect.bottom = 4px
pixelsPastUnstick = 4
opacity = 1 - (4/8) = 0.5


FULLY FADED (8px past unstick):
┌─────────────────────────────────┐
│ FinanceBox Container            │
│ ┌─────────────────────────────┐ │ ← DayBlock bottom
│ │ DayBlock                    │ │
│ │                             │ │
│ │                             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ DayTotal (INVISIBLE)    │ │ │ ← Fully transparent
│ │ └─────────────────────────┘ │ │
│ │         ↑ 8px separation    │ │
└─────────────────────────────────┘

dayTotalRect.bottom - dayBlockRect.bottom = 8px
pixelsPastUnstick = 8
opacity = 1 - (8/8) = 0.0
```

---

## Recommended Implementation Path

### Phase 1: Implement Approach A (CSS Variables + Scroll Events)

**Rationale**: Works within existing architecture, proven technique, correctly handles geometry.

**Steps**:
1. Make changes to tracefinance.tsx (Changes 1.1, 1.2, 1.3)
2. Make changes to tracefinance-animated.tsx (Changes 2.1, 2.2)
3. Test with multiple DayBlocks
4. Verify 8-pixel precision with measurement logging

### Phase 2: Test Approach C as Experiment (Optional)

**Rationale**: If CSS Scroll-Driven Animations work with sticky elements, they're superior. But test AFTER Phase 1 is working.

**Steps**:
1. Create isolated test page with single sticky DayTotal
2. Test `view()` timeline behavior with sticky positioning
3. Test `animation-range` syntax variations
4. Compare smoothness with Phase 1 implementation
5. If successful, consider as progressive enhancement

---

## Testing Strategy

### Test Cases

| Test Case | Expected Result |
|-----------|-----------------|
| Multiple DayBlocks, scroll first out | Only first DayTotal fades |
| Multiple DayBlocks, scroll second out | Only second DayTotal fades (first already gone) |
| 8-pixel precision | `console.log(opacity)` shows smooth 1.0 → 0.0 over 8px |
| Scroll up (reverse) | Opacity returns to 1.0 as DayTotal re-sticks |
| `prefers-reduced-motion: reduce` | No fade effect, opacity always 1.0 |
| Rapid scroll past 8px zone | Opacity jumps to 0.0 (acceptable) |
| Single DayBlock | May never fade (acceptable) |

### Verification Commands

```tsx
// Add to updateOpacity() for debugging
console.log({
  dayBlockBottom,
  dayTotalBottom,
  hasUnstuck,
  pixelsPastUnstick: hasUnstuck ? dayTotalBottom - dayBlockBottom : 0,
  opacity: hasUnstuck ? Math.max(0, 1 - ((dayTotalBottom - dayBlockBottom) / 8)) : 1
});
```

---

## Implementation Checklist

### Pre-Implementation

- [ ] Commit current stable state with message: "Before scroll-linked fade implementation"
- [ ] Record commit hash for easy rollback: `git rev-parse HEAD`
- [ ] Verify all tests pass in current state
- [ ] Identify all DayTotal/DayBlock usages (main app + showcase)
- [ ] Set maximum attempt limit: **2 attempts**
- [ ] Have rollback commit hash ready

### File 1: tracefinance.tsx

- [ ] **Change 1.1**: Convert DayTotal to forwardRef
  - [ ] Add forwardRef wrapper
  - [ ] Add ref parameter
  - [ ] Apply ref to root div
  - [ ] Add `opacity: var(--day-total-opacity, 1)`
  - [ ] Add `transition: opacity 0.05s linear`
  - [ ] Add `DayTotal.displayName = 'DayTotal'`
  - [ ] Test: DayTotal still renders in showcase

- [ ] **Change 1.2**: Add dayTotalRef to DayBlockProps interface

- [ ] **Change 1.3**: Convert DayBlock to forwardRef
  - [ ] Add forwardRef wrapper
  - [ ] Add ref parameter
  - [ ] Add dayTotalRef to destructured props
  - [ ] Apply ref to root div
  - [ ] Pass dayTotalRef to DayTotal
  - [ ] Add `DayBlock.displayName = 'DayBlock'`
  - [ ] Test: DayBlock still renders in showcase

- [ ] Verify: No TypeScript errors in tracefinance.tsx
- [ ] Verify: Showcase components still work

### File 2: tracefinance-animated.tsx

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

- [ ] Verify: No TypeScript errors in tracefinance-animated.tsx
- [ ] Verify: Build succeeds

### Testing Phase

- [ ] Visual: Only one DayTotal fades at a time
- [ ] Visual: Smooth opacity transition (no jumps)
- [ ] Visual: No layout shifts or broken sticky positioning
- [ ] Visual: Entry/exit animations still work
- [ ] Measurement: Add console.log to verify 8px range
- [ ] Measurement: Confirm opacity 1.0 → 0.0 over exactly 8 pixels
- [ ] Edge case: Single DayBlock (fade may not trigger - acceptable)
- [ ] Edge case: Rapid scrolling (opacity jumps to final - acceptable)
- [ ] Edge case: Scroll direction reversal (opacity returns to 1.0)
- [ ] Accessibility: `prefers-reduced-motion: reduce` disables fade
- [ ] Performance: Smooth 60fps scrolling maintained

### Post-Implementation

- [ ] Remove console.log statements from updateOpacity()
- [ ] Commit changes with message: "Implement scroll-linked fade for DayTotal headers"
- [ ] Document any issues encountered

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

## Success Criteria

The implementation is successful when:

1. **Per-instance fade**: Only the DayTotal being scrolled out fades; others remain at full opacity
2. **Smooth animation**: Opacity changes smoothly with scroll, not in discrete steps
3. **Correct trigger point**: Fade begins when DayTotal reaches bottom of its DayBlock (unstick point)
4. **Correct fade distance**: Full fade (1.0 → 0.0) over exactly 8 pixels of scroll
5. **No broken layouts**: Sticky positioning, flexbox layout, and width all work correctly
6. **Entry/exit preserved**: Existing animations for new/removed blocks still work
7. **Accessibility**: Respects `prefers-reduced-motion` preference
8. **No regressions**: Showcase components and existing animations unaffected

If ANY criterion fails after 2 attempts, **STOP** and revert to stable commit.

---

**Document End**
