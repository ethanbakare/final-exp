# Currency Dropdown - Dynamic Positioning Guide

## 📍 Purpose
This guide documents the **smart dropdown positioning system** used in the ReceiptScanner's currency selector. The dropdown automatically detects viewport boundaries and positions itself above or below the trigger element to prevent cutoff.

---

## 🗂️ Primary File Location

**Main Implementation:**
```
/Users/ethan/Documents/projects/final-exp/src/projects/receipt-scanner/components/ui/ListItem.tsx
```

**Lines 173-218** contain the core positioning logic.

---

## 🎯 The Core Positioning Logic

### Location: Lines 173-218 in `ListItem.tsx`

This `useEffect` hook calculates optimal dropdown position based on available viewport space:

```typescript
useEffect(() => {
  if (isCurrencyDropdownOpen && currencySelectRef.current && currencyDropdownRef.current) {
    // Get container and dropdown dimensions
    const containerRect = currencySelectRef.current.getBoundingClientRect();
    const dropdownRect = currencyDropdownRef.current.getBoundingClientRect();
    
    // Get viewport dimensions
    const viewportHeight = window.innerHeight;
    
    // Calculate available space in each direction
    const spaceBelow = viewportHeight - containerRect.bottom;
    const spaceAbove = containerRect.top;
    const spaceLeft = containerRect.left;
    
    // Default position (below and right-aligned)
    let newPosition = {
      top: 'calc(100% + 4px)',
      left: 'auto',
      right: '0',
      bottom: 'auto'
    };
    
    // Check if dropdown fits below
    if (spaceBelow < dropdownRect.height && spaceAbove > dropdownRect.height) {
      // Position above if there's more space
      newPosition = {
        top: 'auto',
        bottom: 'calc(100% + 4px)',
        left: 'auto',
        right: '0'
      };
    }
    
    // Check horizontal overflow (left side)
    if (containerRect.right - dropdownRect.width < 0 && spaceLeft + containerRect.width > dropdownRect.width) {
      // Align to left edge of container if it would overflow left viewport edge
      newPosition.left = '0';
      newPosition.right = 'auto';
    }
    
    // Update position state
    setCurrencyDropdownPosition(newPosition);
  }
}, [isCurrencyDropdownOpen, currencySelectRef]);
```

---

## 🔑 Key Technical Components

### 1. Required State (Lines 124-130)
```typescript
const [currencyDropdownPosition, setCurrencyDropdownPosition] = useState({
  top: 'calc(100% + 4px)',
  left: 'auto',
  right: '0',
  bottom: 'auto'
});
```

### 2. Required Refs (Lines 135-136)
```typescript
const currencySelectRef = useRef<HTMLDivElement>(null);
const currencyDropdownRef = useRef<HTMLDivElement>(null);
```

### 3. JSX Application (Lines 445-454)
```typescript
<div 
  ref={currencyDropdownRef}
  className="currency-dropdown"
  style={{
    top: currencyDropdownPosition.top,
    bottom: currencyDropdownPosition.bottom,
    left: currencyDropdownPosition.left,
    right: currencyDropdownPosition.right
  }}
>
```

### 4. Trigger Element (Lines 420-427)
```typescript
<div 
  ref={currencySelectRef}
  className="currency-select-combobox"
  onClick={() => {
    setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen);
  }}
>
```

---

## 📐 How The Algorithm Works

### Step 1: Measure Everything
```typescript
const containerRect = currencySelectRef.current.getBoundingClientRect();
const dropdownRect = currencyDropdownRef.current.getBoundingClientRect();
const viewportHeight = window.innerHeight;
```

**What `getBoundingClientRect()` returns:**
- `top` - Distance from viewport top
- `bottom` - Distance from viewport top to element's bottom edge
- `left` - Distance from viewport left
- `right` - Distance from viewport left to element's right edge
- `width` - Element width
- `height` - Element height

### Step 2: Calculate Available Space
```typescript
const spaceBelow = viewportHeight - containerRect.bottom;
const spaceAbove = containerRect.top;
```

**Visual:**
```
┌─────────────────┐ ← viewport top (0)
│                 │
│  spaceAbove     │ ← containerRect.top
├─────────────────┤
│ [USD ▼] Button  │ ← containerRect.bottom
├─────────────────┤
│  spaceBelow     │ ← viewportHeight - containerRect.bottom
│                 │
└─────────────────┘ ← viewport bottom
```

### Step 3: Decision Logic
```typescript
if (spaceBelow < dropdownRect.height && spaceAbove > dropdownRect.height) {
  // Open UPWARD - set bottom: 'calc(100% + 4px)'
} else {
  // Open DOWNWARD - set top: 'calc(100% + 4px)' (default)
}
```

**Conditions:**
- **Condition 1:** `spaceBelow < dropdownRect.height` 
  - Translation: "Dropdown won't fit below"
- **Condition 2:** `spaceAbove > dropdownRect.height`
  - Translation: "But it WILL fit above"
- **Result:** Open upward

### Step 4: Horizontal Overflow Check
```typescript
if (containerRect.right - dropdownRect.width < 0 && spaceLeft + containerRect.width > dropdownRect.width) {
  newPosition.left = '0';
  newPosition.right = 'auto';
}
```

**Conditions:**
- **Condition 1:** `containerRect.right - dropdownRect.width < 0`
  - Translation: "Dropdown would overflow past left edge of viewport"
- **Condition 2:** `spaceLeft + containerRect.width > dropdownRect.width`
  - Translation: "There's enough space to left-align it instead"
- **Result:** Switch from right-aligned to left-aligned

**Visual Example - Default (Right-Aligned):**
```
┌─────────────────────────────────┐
│                      [USD ▼]    │ ← Button
│                      ┌────────┐ │
│                      │Dropdown│ │ ← Right-aligned
│                      └────────┘ │
└─────────────────────────────────┘
```

**Visual Example - Left-Aligned (Near Left Edge):**
```
┌─────────────────────────────────┐
│  [USD ▼]                        │ ← Button near left
│  ┌────────┐                     │
│  │Dropdown│                     │ ← Switches to left-aligned
│  └────────┘                     │
└─────────────────────────────────┘
```

### Step 5: Update State
```typescript
setCurrencyDropdownPosition(newPosition);
```
This triggers a re-render with the calculated position.

---

## 🧭 Complete 2D Positioning Coverage

The system checks **all 4 directions** for overflow prevention:

### Vertical Positioning (Primary):
- ✅ **Down** (default): `top: 'calc(100% + 4px)', bottom: 'auto'`
- ✅ **Up** (when no space below): `top: 'auto', bottom: 'calc(100% + 4px)'`

### Horizontal Positioning (Secondary):
- ✅ **Right-aligned** (default): `right: '0', left: 'auto'`
- ✅ **Left-aligned** (when would overflow left): `left: '0', right: 'auto'`

### Four Possible Combinations:
1. **Bottom-Right** (default) - Opens down, aligned to right edge
2. **Top-Right** (scrolled to bottom) - Opens up, aligned to right edge
3. **Bottom-Left** (near left viewport edge) - Opens down, aligned to left edge
4. **Top-Left** (scrolled to bottom + near left edge) - Opens up, aligned to left edge

**Position Object Structure:**
```typescript
{
  top: 'calc(100% + 4px)' | 'auto',
  bottom: 'auto' | 'calc(100% + 4px)',
  left: 'auto' | '0',
  right: '0' | 'auto'
}
```

---

## 🎨 Required CSS

### Dropdown Container (Lines 734-744)
```css
.currency-dropdown {
  position: absolute;  /* REQUIRED for positioning */
  z-index: 10;
  width: 240px;
  /* Position managed via inline styles */
}
```

### Parent Container (Lines 692-704)
```css
.currency-select-combobox {
  position: relative;  /* REQUIRED - creates positioning context */
  cursor: pointer;
}
```

---

## ⚡ Execution Flow

```
1. User clicks currency button
   ↓
2. setIsCurrencyDropdownOpen(true)
   ↓
3. Dropdown renders in DOM with default position
   ↓
4. useEffect fires (dependency: isCurrencyDropdownOpen changed)
   ↓
5. getBoundingClientRect() measures actual positions
   ↓
6. Algorithm calculates: spaceBelow vs spaceAbove
   ↓
7. Decision: Flip upward or keep default?
   ↓
8. setCurrencyDropdownPosition(newPosition)
   ↓
9. React re-renders with optimized position
   ↓
10. Dropdown appears in correct location ✅
```

---

## 🔍 Related Files

### Data Source
**File:** `/Users/ethan/Documents/projects/final-exp/src/projects/receipt-scanner/constants/currency-data.ts`
- Contains 200+ currencies with country mapping
- Lines 1-285

### Type Definitions
**File:** `/Users/ethan/Documents/projects/final-exp/src/projects/receipt-scanner/types/receipt.ts`
- Currency interface (Lines 10-13)
- Receipt interface (Lines 25-37)

### Context Provider
**File:** `/Users/ethan/Documents/projects/final-exp/src/projects/receipt-scanner/context/ReceiptContext.tsx`
- Manages global receipt state
- Used by ListItem to get initial currency

---

## 🎓 Key API Methods

### `Element.getBoundingClientRect()`
**Purpose:** Gets element's position and size relative to viewport

**Returns:** DOMRect object with:
- `x`, `y` - Position
- `width`, `height` - Dimensions  
- `top`, `right`, `bottom`, `left` - Edges relative to viewport
- `toJSON()` - For debugging

**MDN:** https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect

### `window.innerHeight`
**Purpose:** Gets viewport height in pixels

**Use case:** Calculate available space for dropdown positioning

---

## 💡 Implementation Tips for AI

**When replicating this pattern:**

1. **Always render dropdown first** (even if off-screen) to measure its actual height
2. **Use `useEffect`** with dropdown open state as dependency
3. **Require refs** for both trigger element and dropdown element
4. **Calculate space in all 4 directions** for complete overflow prevention
5. **Use inline styles** to override CSS defaults dynamically
6. **Parent needs `position: relative`**, dropdown needs `position: absolute`
7. **Account for padding/margins** in calculations (hence `calc(100% + 4px)`)

---

## 🐛 Common Pitfalls

❌ **Don't measure before dropdown is in DOM** - `getBoundingClientRect()` needs rendered elements
❌ **Don't forget z-index** - Dropdown must appear above other content
❌ **Don't use static positioning** - Won't work with dynamic top/bottom/left/right
❌ **Don't measure only on mount** - Need to recalculate on scroll/resize for perfect UX

✅ **Do measure after dropdown renders** - Use effect after state change
✅ **Do use refs for direct DOM access** - Not state-based measurements
✅ **Do consider horizontal overflow** - Check left/right boundaries too
✅ **Do provide sensible defaults** - Fallback if calculation fails

---

## 📊 Performance Notes

- **Calculation runs once per dropdown open** (not on every render)
- **No performance impact when closed** (effect doesn't run)
- **getBoundingClientRect() is synchronous** - No layout thrashing
- **Single state update** - Only one re-render after calculation

---

## 🎯 Quick Reference: Point AI Here

**"Where is the dropdown positioning logic?"**
→ Lines 173-218 in `ListItem.tsx`

**"What makes the dropdown flip upward?"**
→ Lines 198-206 in `ListItem.tsx` (vertical positioning if condition)

**"What handles left/right overflow?"**
→ Lines 208-213 in `ListItem.tsx` (horizontal positioning if condition)

**"Does it check all 4 directions (up/down/left/right)?"**
→ YES - See "Complete 2D Positioning Coverage" section in this guide

**"How is position applied to the dropdown?"**
→ Lines 445-454 in `ListItem.tsx` (inline styles)

**"What CSS is required?"**
→ Lines 692-744 in `ListItem.tsx` (position: relative & absolute)

**"What refs are needed?"**
→ Lines 135-136 in `ListItem.tsx`

**"What state controls position?"**
→ Lines 124-130 in `ListItem.tsx`

---

## 📝 Summary

This is a **2D viewport-aware dropdown positioning system** that:
1. Measures available space around trigger element in all 4 directions
2. Compares dropdown size vs available space
3. **Vertical:** Positions dropdown above if it won't fit below
4. **Horizontal:** Switches to left-aligned if right-aligned would overflow
5. Supports 4 positioning combinations: Bottom-Right, Top-Right, Bottom-Left, Top-Left
6. Updates position dynamically via state
7. Applies position via inline styles

**Core Technology:** React refs + `getBoundingClientRect()` + 2D conditional positioning logic

**Use Case:** Any dropdown/popover that needs intelligent positioning to avoid viewport cutoff in any direction

---

*Last Updated: November 16, 2025*
*Based on: ReceiptScanner Currency Dropdown Implementation*

