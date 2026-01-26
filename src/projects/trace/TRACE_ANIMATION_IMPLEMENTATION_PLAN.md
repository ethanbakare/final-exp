# Trace Animation Implementation Plan

**Document Version**: 1.0
**Last Updated**: 2026-01-26
**Purpose**: Comprehensive guide for implementing entry animations, scroll behavior, and content displacement in the Trace expense tracking interface

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Animation Principles & Best Practices](#animation-principles--best-practices)
4. [Entry Animation Strategies](#entry-animation-strategies)
5. [Scroll Behavior Implementation](#scroll-behavior-implementation)
6. [Content Displacement Patterns](#content-displacement-patterns)
7. [Library Comparison & Recommendation](#library-comparison--recommendation)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Technical Specifications](#technical-specifications)
10. [Performance Considerations](#performance-considerations)
11. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## Overview

### Goals

The Trace animation system needs to handle three primary scenarios:

1. **New Entry Under Existing Date** - When a user records an expense that belongs to an already-visible date section
2. **New Date Section** - When a user records an expense for a date that doesn't exist in the current view
3. **Auto-Scroll to New Content** - Automatically bring newly added entries into view with smooth scrolling

### Design Philosophy

Following modern UX principles from Google Material Design, Apple HIG, and Stripe's interface patterns:

- **Purposeful Motion**: Animations should guide user attention, not distract
- **Performance First**: Smooth 60fps animations, no jank
- **Contextual Awareness**: Different animation styles for different insertion points
- **User Control**: Respect `prefers-reduced-motion` accessibility setting
- **Predictable Behavior**: Consistent patterns across all interactions

---

## Current State Analysis

### Existing Architecture

**Component Structure** (from `tracefinance.tsx`):
```
TextBox
└── FinanceBox
    └── ScrollContainer (custom scrollbar, overflow-y: auto)
        └── ContentRow[] (mapped from grouped data)
            ├── DayTotal (sticky positioned)
            └── DayBlock
                └── ExpenseItem[]
                    ├── TimeFrame
                    ├── MerchantInfo
                    └── PriceFrame
```

**Key Technical Details**:
- Sticky positioning for DayTotal headers with dynamic offset: `top: calc(0px - var(--trace-financebox-padding-top))`
- Custom scrollbar (2px pill-shaped) with Chrome 121+ compatibility
- CSS variables for transitions: `--trace-transition-fast` (0.15s), `--trace-transition-normal` (0.2s), `--trace-transition-slow` (0.3s)
- Data grouped by date using `dataUtils.ts` with ordinal suffixes (1st, 2nd, 3rd)

**Current Gaps**:
1. No animation when new `ContentRow` is added
2. No animation when new `ExpenseItem` is appended to existing `DayBlock`
3. No auto-scroll behavior after recording completes
4. No displacement animation for existing content when new items insert

---

## Animation Principles & Best Practices

### Industry Standards (2026)

**Google Material Design 3** - "Easing and Duration"
- **Fast**: 100-150ms for small UI changes (tooltips, checkboxes)
- **Normal**: 200-300ms for medium transitions (list items, cards)
- **Slow**: 400-500ms for large layout shifts (page transitions)
- **Easing**: Emphasized easing (0.2, 0, 0, 1) for entering elements, standard easing (0.4, 0, 0.2, 1) for exiting

**Apple HIG** - "Motion"
- Use spring animations for natural feel
- Match animation duration to perceived importance
- Provide visual continuity during state changes

**Stripe Dashboard Patterns** - "List Insertions"
- New items fade in with slight downward slide (0-8px)
- Existing items smoothly displace using transform (not top/margin for performance)
- Stagger animations by 50ms when multiple items insert simultaneously
- Auto-scroll only if insertion happens below viewport

### Accessibility Requirements

**WCAG 2.2 AA Compliance**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Entry Animation Strategies

### Scenario 1: New Entry Under Existing Date

**User Flow**:
User records expense → API returns parsed data → Data grouped by date → New `ExpenseItem` appends to existing `DayBlock`

**Animation Approach - "Slide & Fade In"**:

```
Initial State:
DayTotal: "January 26th, 2026"
├── ExpenseItem A (existing)
├── ExpenseItem B (existing)
└── [insertion point]

Animation Sequence (300ms total):
1. New ExpenseItem starts with opacity: 0, transform: translateY(-8px)
2. Existing items (A, B) transform down by height of new item (smooth displacement)
3. New item animates to opacity: 1, transform: translateY(0)
4. Timeline:
   - 0ms: Insert DOM element (height: 0, opacity: 0, translateY: -8px)
   - 0-50ms: Expand height to natural size (triggers reflow for existing items)
   - 50-300ms: Fade in (opacity 0→1) + Slide down (translateY -8px→0)
```

**Why This Works**:
- **Visual Hierarchy**: Slide direction (down) matches reading order and gravity
- **Attention Guide**: Fade draws eye to new content without being jarring
- **Smooth Displacement**: Existing items move in sync with new item appearing
- **Performance**: Using `transform` and `opacity` (GPU-accelerated) instead of `margin`/`height` changes

### Scenario 2: New Date Section

**User Flow**:
User records expense for new date → API returns → Data grouped → New `ContentRow` (DayTotal + DayBlock) inserted

**Animation Approach - "Block Fade & Expand"**:

```
Animation Sequence (400ms total):
1. New ContentRow inserts with max-height: 0, opacity: 0, overflow: hidden
2. Simultaneously:
   - max-height animates to natural height (using CSS Grid auto-rows trick)
   - opacity fades from 0 to 1
3. Existing content below displaces downward smoothly
4. Timeline:
   - 0ms: Insert DOM with collapsed state
   - 0-400ms: Expand height (0 → auto) + Fade in (opacity 0→1)
   - Stagger: DayTotal appears first (0-200ms), DayBlock follows (100-400ms)
```

**Why This Works**:
- **Grouped Perception**: DayTotal and DayBlock animate as a unit, reinforcing their relationship
- **Staggered Reveal**: DayTotal appearing first provides context before showing expense details
- **Longer Duration**: 400ms (vs 300ms for single item) signals larger content change
- **Height Animation Challenge**: Using `max-height` with large value (e.g., 500px) as workaround for `height: auto` animation limitation

### Scenario 3: Multiple Items Simultaneously

**User Flow**:
Bulk import or rapid successive recordings → Multiple ExpenseItems for same date

**Animation Approach - "Staggered Cascade"**:

```
Animation Sequence:
1. Items insert in chronological order (oldest to newest)
2. Each item staggers by 50ms delay
3. Example with 3 items:
   - Item 1: starts at 0ms, completes at 300ms
   - Item 2: starts at 50ms, completes at 350ms
   - Item 3: starts at 100ms, completes at 400ms
```

**Why This Works**:
- **Visual Flow**: Cascade guides eye from top to bottom
- **Reduced Cognitive Load**: Sequential animations easier to process than simultaneous
- **Professional Polish**: Pattern used by Linear, Notion, Stripe

---

## Scroll Behavior Implementation

### Auto-Scroll Decision Tree

**Question 1**: Is the new entry currently visible in viewport?
- **YES** → No scroll needed, just animate in place
- **NO** → Proceed to Question 2

**Question 2**: Is the new entry above or below current scroll position?
- **Above viewport** → No auto-scroll (user chose to scroll away)
- **Below viewport** → Auto-scroll to bring into view

**Question 3**: How much of the entry is outside viewport?
- **Partially visible** → Scroll just enough to show entire entry (minimal scroll)
- **Completely hidden** → Scroll to center entry in viewport (comfortable viewing)

### Scroll Animation Technique

**Recommended: `scrollIntoView()` with smooth behavior**

```typescript
// After new entry is added to DOM
const newEntryElement = document.getElementById(`expense-${newId}`);

newEntryElement?.scrollIntoView({
  behavior: 'smooth',       // Native smooth scroll (120-200ms duration)
  block: 'nearest',         // Minimal scroll distance
  inline: 'nearest'
});
```

**Alternative: Manual scroll with animation frame**

```typescript
const scrollToElement = (element: HTMLElement, duration: number = 300) => {
  const container = document.querySelector('.scroll-container');
  if (!container) return;

  const targetPosition = element.offsetTop - container.scrollTop;
  const startPosition = container.scrollTop;
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    // Ease-out quad easing
    const ease = 1 - Math.pow(1 - progress, 2);

    container.scrollTop = startPosition + distance * ease;

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};
```

**Why `scrollIntoView()` is Preferred**:
- ✅ Native browser implementation (optimized performance)
- ✅ Respects `prefers-reduced-motion` automatically
- ✅ Less code, fewer edge cases
- ✅ Works across all modern browsers (2026)

### Scroll Timing Coordination

**Critical**: Scroll must coordinate with entry animation

```
Timeline:
0ms: New entry inserted (opacity: 0, translateY: -8px)
0-50ms: Height expansion (displacement starts)
50ms: START scroll animation
50-350ms: Scroll + fade/slide happen simultaneously
350ms: Both animations complete
```

**Why 50ms Delay**:
- Allows height to establish (prevents scroll jump)
- Keeps animations synchronized
- Feels more cohesive to user

---

## Content Displacement Patterns

### The Core Problem

When new content inserts, existing content must move to make space. Two approaches:

1. **Reflow-Based** (Browser default) - Change `height`/`margin`, let browser reflow
2. **Transform-Based** (GPU-accelerated) - Use `translateY` to move elements

### Recommended: Hybrid Approach

**For New Entry Under Existing Date**:

Use **Framer Motion's `layout` prop** (FLIP technique):
```tsx
<motion.div layout transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
  {/* ExpenseItem content */}
</motion.div>
```

**How FLIP Works**:
1. **First**: Record initial position of all elements
2. **Last**: Insert new element, record final positions
3. **Invert**: Use `transform` to move elements back to initial positions
4. **Play**: Animate `transform` from inverted to final (smooth displacement)

**Benefits**:
- ✅ GPU-accelerated (no layout thrashing)
- ✅ Automatic - no manual calculation of heights
- ✅ Handles dynamic content (variable heights)
- ✅ Smooth 60fps animations

### Alternative: CSS Grid + Auto-Rows

For simpler cases without Framer Motion:

```css
.day-block {
  display: grid;
  grid-template-rows: auto; /* Each row sizes to content */
  transition: grid-template-rows var(--trace-transition-normal);
}

.expense-item {
  opacity: 0;
  transform: translateY(-8px);
  transition:
    opacity var(--trace-transition-normal),
    transform var(--trace-transition-normal);
}

.expense-item.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Limitation**: CSS Grid doesn't animate `auto` values well (browser-dependent)

---

## Library Comparison & Recommendation

### Option 1: Framer Motion (Recommended ⭐)

**Pros**:
- ✅ Industry standard (used by Stripe, Linear, Vercel)
- ✅ `AnimatePresence` component for enter/exit animations
- ✅ `layout` prop for automatic FLIP animations
- ✅ `whileInView` for scroll-triggered animations
- ✅ `useScroll` hook for scroll-linked effects
- ✅ Built-in `prefers-reduced-motion` support
- ✅ TypeScript support
- ✅ Tree-shakeable (small bundle impact)

**Cons**:
- ⚠️ Bundle size: ~35KB gzipped (acceptable for modern apps)
- ⚠️ Learning curve for advanced features

**Example Integration**:
```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="popLayout">
  {expenses.map((expense) => (
    <motion.div
      key={expense.id}
      layout  // Automatic displacement
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <ExpenseItem data={expense} />
    </motion.div>
  ))}
</AnimatePresence>
```

### Option 2: AutoAnimate

**Pros**:
- ✅ Tiny bundle: ~2KB gzipped
- ✅ Zero configuration - just wrap container
- ✅ Automatic animations for all DOM changes
- ✅ Works with any framework (React, Vue, Vanilla)

**Cons**:
- ⚠️ Less control over animation timing/easing
- ⚠️ No scroll-linked animations
- ⚠️ Limited customization for complex scenarios

**Example Integration**:
```tsx
import { useAutoAnimate } from '@formkit/auto-animate/react';

const [parent] = useAutoAnimate();

<div ref={parent}>
  {expenses.map((expense) => (
    <ExpenseItem key={expense.id} data={expense} />
  ))}
</div>
```

### Option 3: CSS-Only with React Keys

**Pros**:
- ✅ Zero dependencies
- ✅ Full control over animations
- ✅ Smallest possible bundle

**Cons**:
- ⚠️ Manual state management for enter/exit animations
- ⚠️ Complex code for displacement animations
- ⚠️ Hard to maintain as complexity grows

### Final Recommendation

**Use Framer Motion** for the Trace project because:

1. **Complexity Match**: Trace has multiple animation scenarios (entry, displacement, scroll) that Framer Motion handles elegantly
2. **Future-Proof**: Easy to extend for future features (drag-to-reorder, swipe-to-delete)
3. **Maintainability**: Declarative API is easier to understand and modify
4. **Performance**: GPU-accelerated, production-tested at scale
5. **Bundle Size**: 35KB is reasonable for a feature-rich expense tracker

**If Bundle Size is Critical**: Use AutoAnimate for basic scenarios, upgrade to Framer Motion only if needing advanced control

---

## Implementation Roadmap

### Phase 1: Infrastructure Setup (Day 1)

**Tasks**:
1. ✅ Remove debug borders (yellow on DayTotal:502, blue on PriceFrame:591)
2. ✅ Fix trace index page to show TextBox component
3. ✅ Create wrapper container for TextBox + TRNavbar with 10px gap
4. Install Framer Motion: `npm install framer-motion`
5. Create animation configuration file: `src/projects/trace/config/animations.ts`

**Animation Config File**:
```typescript
// animations.ts
export const ANIMATION_CONFIG = {
  // Durations
  duration: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.4,
  },

  // Easing curves
  easing: {
    emphasized: [0.2, 0, 0, 1],      // Material Design emphasized
    standard: [0.4, 0, 0.2, 1],      // Material Design standard
    spring: { type: 'spring', stiffness: 300, damping: 25 },
  },

  // Animation variants
  variants: {
    expenseItem: {
      initial: { opacity: 0, y: -8, height: 0 },
      animate: { opacity: 1, y: 0, height: 'auto' },
      exit: { opacity: 0, scale: 0.95, height: 0 },
    },
    dateSection: {
      initial: { opacity: 0, maxHeight: 0 },
      animate: { opacity: 1, maxHeight: 500 },
      exit: { opacity: 0, maxHeight: 0 },
    },
  },

  // Stagger timing
  stagger: {
    items: 0.05,  // 50ms between items
  },
};
```

### Phase 2: Basic Entry Animations (Day 2)

**Task 1: Wrap ExpenseItem with motion.div**

Modify `tracefinance.tsx`:
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { ANIMATION_CONFIG } from '@/projects/trace/config/animations';

// In FinanceBox component, wrap ExpenseItem mapping:
<AnimatePresence mode="popLayout">
  {groupedByDate.map((dateGroup) => (
    <ContentRow key={dateGroup.date}>
      <DayTotal /* ... */ />
      <DayBlock>
        {dateGroup.expenses.map((expense, index) => (
          <motion.div
            key={expense.id}
            layout
            initial="initial"
            animate="animate"
            exit="exit"
            variants={ANIMATION_CONFIG.variants.expenseItem}
            transition={{
              duration: ANIMATION_CONFIG.duration.normal,
              ease: ANIMATION_CONFIG.easing.standard,
              delay: index * ANIMATION_CONFIG.stagger.items,
            }}
          >
            <ExpenseItem data={expense} />
          </motion.div>
        ))}
      </DayBlock>
    </ContentRow>
  ))}
</AnimatePresence>
```

**Task 2: Test Animation**
- Manually add new expense to mock data
- Verify smooth fade + slide animation
- Check existing items displace smoothly

### Phase 3: Date Section Animations (Day 3)

**Task: Animate entire ContentRow**

```tsx
<AnimatePresence mode="popLayout">
  {groupedByDate.map((dateGroup, groupIndex) => (
    <motion.div
      key={dateGroup.date}
      layout
      initial="initial"
      animate="animate"
      exit="exit"
      variants={ANIMATION_CONFIG.variants.dateSection}
      transition={{
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.standard,
        delay: groupIndex * ANIMATION_CONFIG.stagger.items,
      }}
    >
      <ContentRow>
        <DayTotal /* ... */ />
        <DayBlock>
          {/* ExpenseItems with their own animations from Phase 2 */}
        </DayBlock>
      </ContentRow>
    </motion.div>
  ))}
</AnimatePresence>
```

**Stagger Strategy**:
- DateGroup appears first (0ms delay)
- DayTotal within group appears (50ms delay)
- ExpenseItems stagger after (100ms, 150ms, 200ms...)

### Phase 4: Auto-Scroll Implementation (Day 4)

**Task 1: Create useScrollToNewEntry Hook**

```typescript
// hooks/useScrollToNewEntry.ts
import { useEffect, useRef } from 'react';

export const useScrollToNewEntry = (
  expenses: ExpenseData[],
  containerRef: React.RefObject<HTMLDivElement>
) => {
  const previousCountRef = useRef(expenses.length);

  useEffect(() => {
    const currentCount = expenses.length;

    // Check if new entry was added
    if (currentCount > previousCountRef.current) {
      const newEntryId = expenses[currentCount - 1].id;
      const newEntryElement = document.getElementById(`expense-${newEntryId}`);

      if (newEntryElement) {
        // Wait for animation to start (50ms), then scroll
        setTimeout(() => {
          newEntryElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }, 50);
      }
    }

    previousCountRef.current = currentCount;
  }, [expenses]);
};
```

**Task 2: Integrate Hook in FinanceBox**

```tsx
const FinanceBox: React.FC<FinanceBoxProps> = ({ data }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useScrollToNewEntry(data, scrollContainerRef);

  return (
    <div className="finance-box">
      <div className="scroll-container" ref={scrollContainerRef}>
        {/* Content */}
      </div>
    </div>
  );
};
```

### Phase 5: Polish & Optimization (Day 5)

**Task 1: Add Reduced Motion Support**

```tsx
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

const animationProps = shouldReduceMotion
  ? { initial: false, animate: false, exit: false }
  : {
      initial: "initial",
      animate: "animate",
      exit: "exit",
      variants: ANIMATION_CONFIG.variants.expenseItem,
    };

<motion.div {...animationProps}>
  <ExpenseItem data={expense} />
</motion.div>
```

**Task 2: Optimize Re-renders**

```tsx
import { memo } from 'react';

const ExpenseItem = memo<ExpenseItemProps>(({ data }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if ID changes
  return prevProps.data.id === nextProps.data.id;
});
```

**Task 3: Add Loading State Animation**

When fetching new data from API:
```tsx
{isLoading && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="loading-skeleton"
  >
    {/* Skeleton UI */}
  </motion.div>
)}
```

### Phase 6: Integration with TraceApp (Day 6)

**Task: Connect to Real State Management**

Assuming TraceApp uses `useState` for expenses:

```tsx
// traceapp.tsx
const [expenses, setExpenses] = useState<ExpenseData[]>([]);

const handleRecordingComplete = async (audioBlob: Blob) => {
  // 1. Upload to API
  const response = await fetch('/api/trace/transcribe', {
    method: 'POST',
    body: audioBlob,
  });

  const newExpense = await response.json();

  // 2. Add to state (triggers animation in FinanceBox)
  setExpenses(prev => [...prev, newExpense]);
};
```

The animation system automatically handles:
- Grouping new expense by date
- Animating entry (fade + slide)
- Displacing existing content
- Scrolling to new entry

---

## Technical Specifications

### Animation Properties Reference

| Property | Initial | Animate | Exit | GPU-Accelerated? |
|----------|---------|---------|------|------------------|
| `opacity` | 0 | 1 | 0 | ✅ Yes |
| `transform: translateY()` | -8px | 0 | - | ✅ Yes |
| `transform: scale()` | 1 | 1 | 0.95 | ✅ Yes |
| `height` | 0 | auto | 0 | ❌ No (triggers reflow) |
| `max-height` | 0 | 500px | 0 | ❌ No (triggers reflow) |

**Best Practice**: Combine GPU-accelerated properties (`opacity`, `transform`) with layout properties (`height`) managed by Framer Motion's FLIP technique

### Timing Functions

```css
/* Material Design Emphasized (entering elements) */
cubic-bezier(0.2, 0, 0, 1)

/* Material Design Standard (exiting elements) */
cubic-bezier(0.4, 0, 0.2, 1)

/* Custom Spring (natural motion) */
spring(stiffness: 300, damping: 25)
```

### Z-Index Stacking

```
Layer 10: DayTotal (sticky headers)
Layer 5: Animating elements (during transition)
Layer 1: Static ExpenseItems
Layer 0: Container backgrounds
```

Ensure animating elements have `z-index: 5` to avoid clipping under sticky headers.

---

## Performance Considerations

### Rendering Optimization

**Problem**: Animating 50+ expense items simultaneously can cause jank

**Solution 1: Virtual Scrolling**
- Only render items in viewport + buffer
- Library: `react-window` or `react-virtual`
- Trade-off: More complex code, but 10x performance improvement for large lists

**Solution 2: Stagger Limits**
```typescript
const STAGGER_LIMIT = 10; // Animate max 10 items simultaneously

const getStaggerDelay = (index: number) => {
  if (index >= STAGGER_LIMIT) return 0; // No stagger after 10th item
  return index * ANIMATION_CONFIG.stagger.items;
};
```

**Solution 3: Content Visibility API**
```css
.expense-item {
  content-visibility: auto; /* Browser skips rendering off-screen items */
  contain-intrinsic-size: 0 80px; /* Estimated height for layout calculation */
}
```

### Animation Performance Metrics

Target metrics for smooth animations:

- **Frame Rate**: Solid 60fps (16.67ms per frame)
- **Jank**: <3 dropped frames per animation
- **Layout Shifts (CLS)**: <0.1
- **Memory**: No memory leaks from unmounted animations

**Monitoring**:
```typescript
// Use React DevTools Profiler
import { Profiler } from 'react';

<Profiler id="expense-list" onRender={(id, phase, actualDuration) => {
  if (actualDuration > 16) {
    console.warn(`Slow render: ${actualDuration}ms`);
  }
}}>
  <FinanceBox data={expenses} />
</Profiler>
```

### Bundle Size Impact

| Library | Size (gzipped) | Tree-shakeable? | Worth it for Trace? |
|---------|----------------|-----------------|---------------------|
| Framer Motion | ~35KB | ✅ Yes | ✅ Yes - rich features |
| AutoAnimate | ~2KB | ✅ Yes | ⚠️ Maybe - limited control |
| CSS-only | 0KB | N/A | ⚠️ Maybe - high maintenance |

**Recommendation**: 35KB is acceptable for production expense tracker (typical app is 200-500KB total)

---

## Edge Cases & Error Handling

### Edge Case 1: Rapid Successive Recordings

**Scenario**: User records 3 expenses in 5 seconds

**Problem**: Animations overlap, causing visual confusion

**Solution**: Queue animations with sequential timing
```typescript
const animationQueue = useRef<Promise<void>>(Promise.resolve());

const addExpenseWithAnimation = (expense: ExpenseData) => {
  animationQueue.current = animationQueue.current.then(async () => {
    setExpenses(prev => [...prev, expense]);
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for animation
  });
};
```

### Edge Case 2: Empty State → First Entry

**Scenario**: User adds first expense to empty list

**Problem**: No context for displacement animation

**Solution**: Special animation for empty state
```tsx
const isEmpty = expenses.length === 0;

{isEmpty ? (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, ease: ANIMATION_CONFIG.easing.spring }}
  >
    <EmptyState />
  </motion.div>
) : (
  <FinanceBox data={expenses} />
)}
```

### Edge Case 3: Scroll Container Not Yet Mounted

**Scenario**: `scrollIntoView()` called before DOM element exists

**Problem**: JavaScript error, broken animation

**Solution**: Defensive check with retry
```typescript
const scrollToEntry = (entryId: string, retries = 3) => {
  const element = document.getElementById(entryId);

  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else if (retries > 0) {
    // Element not yet mounted, retry after frame
    requestAnimationFrame(() => scrollToEntry(entryId, retries - 1));
  }
};
```

### Edge Case 4: User Scrolls During Animation

**Scenario**: Auto-scroll starts, user manually scrolls elsewhere

**Problem**: Competing scroll animations, jarring UX

**Solution**: Cancel auto-scroll on user interaction
```typescript
const [userIsScrolling, setUserIsScrolling] = useState(false);
let scrollTimeout: NodeJS.Timeout;

const handleUserScroll = () => {
  setUserIsScrolling(true);
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => setUserIsScrolling(false), 150);
};

// Only auto-scroll if user isn't scrolling
if (!userIsScrolling) {
  element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
```

### Error Boundary for Animation Failures

```tsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallback={<div>Animation failed, showing static view</div>}
  onError={(error) => console.error('Animation error:', error)}
>
  <AnimatedExpenseList expenses={expenses} />
</ErrorBoundary>
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Remove debug borders from tracefinance.tsx (lines 502, 591)
- [ ] Fix trace index page to display TextBox
- [ ] Create wrapper container (TextBox + TRNavbar, 10px gap)
- [ ] Install Framer Motion: `npm install framer-motion`
- [ ] Create `animations.ts` config file

### Phase 1: Basic Animations
- [ ] Import Framer Motion components
- [ ] Wrap ExpenseItem with `motion.div`
- [ ] Add `initial`, `animate`, `exit` variants
- [ ] Test fade + slide animation for new entries
- [ ] Verify `layout` prop for automatic displacement

### Phase 2: Date Section Animations
- [ ] Wrap ContentRow with `motion.div`
- [ ] Configure slower duration (400ms) for date sections
- [ ] Implement staggered reveal (DayTotal → ExpenseItems)
- [ ] Test new date section insertion

### Phase 3: Auto-Scroll
- [ ] Create `useScrollToNewEntry` hook
- [ ] Integrate hook in FinanceBox
- [ ] Test scroll behavior when entry below viewport
- [ ] Test no-scroll when entry already visible

### Phase 4: Polish
- [ ] Add `useReducedMotion` support
- [ ] Optimize re-renders with `React.memo`
- [ ] Add loading skeleton animation
- [ ] Test performance with 50+ expenses

### Phase 5: Integration
- [ ] Connect to TraceApp state management
- [ ] Test end-to-end: record → transcribe → animate
- [ ] Verify camera upload flow triggers animations
- [ ] Test rapid successive recordings (queue handling)

### Phase 6: Production Readiness
- [ ] Add error boundaries
- [ ] Test all edge cases (empty state, scroll during animation, etc.)
- [ ] Performance audit (frame rate, bundle size)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Accessibility audit (`prefers-reduced-motion`, keyboard navigation)

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding professional-grade animations to the Trace expense tracker. The recommended approach using Framer Motion balances:

- **Developer Experience**: Declarative API, easy to understand and maintain
- **User Experience**: Smooth, purposeful animations that guide attention
- **Performance**: GPU-accelerated transforms, optimized rendering
- **Accessibility**: Built-in support for reduced motion preferences
- **Scalability**: Easy to extend with drag-to-reorder, swipe-to-delete, etc.

By following the 6-day roadmap, the Trace interface will evolve from static list rendering to a dynamic, polished expense tracking experience that rivals commercial applications like Splitwise, Mint, and YNAB.

**Next Steps**: Proceed with Phase 1 implementation after index page fixes are complete.
