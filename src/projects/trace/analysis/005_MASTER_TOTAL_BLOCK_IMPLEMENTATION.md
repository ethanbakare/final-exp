# Trace Master Total Block - Implementation Plan

**Document**: 005 Master Total Block
**Created**: 2026-01-28
**Status**: Implementation Guide
**Purpose**: Design and implement the grand total summary block above FinanceBox

---

## Feature Summary

A permanent "Master Total" block that displays the sum of all expense entries across all days. Sits inside TextBox, above FinanceBox (outside the scroll container). Shows `£0.00` when empty, updates live as entries are added/removed.

---

## Architecture Decision

**Option A (chosen): Compute at page level, pass down as prop.**

- `TracePage` computes `grandTotal` from raw `entries[]` array
- Passes it through `AnimatedTextBox → TextBox` as a `grandTotal` prop
- TextBox renders `MasterBlock` above FinanceBox
- Clean separation: total lives outside scroll container, derived from flat array not grouped structure

**Why not Option B (derive inside groupEntriesByDay):**
- `groupEntriesByDay` returns per-day structure — a scalar grand total doesn't belong there
- Would require changing the return type and all consumers
- Scalar sum is trivially computed from the flat `entries[]` array at the source

---

## Component Structure (from design spec)

```
TextBox (301×500px — height increased from 421px)
  ├── MasterBlockHolder        ← wrapper with padding/positioning
  │     └── MasterBlock        ← gradient bg, border-bottom, rounded top
  │           └── MasterRow    ← flex row: label left, amount right
  │                 ├── TotalAmtSpent   ← red indicator pill + "Total Amount Spent" label
  │                 └── MasterTotalFrame ← currency symbol + amount
  └── FinanceBox               ← existing scrollable content (now shorter)
```

---

## Layout Dimensions

| Element | Width | Height | Notes |
|---------|-------|--------|-------|
| TextBox | 301px | 500px | Increased from 421px |
| MasterBlockHolder | 301px (stretch) | ~79px | padding: 12px 12px 0px |
| MasterBlock | 277px (stretch) | ~67px | gradient bg, border-bottom |
| MasterRow | 277px (stretch) | ~21px | padding: 0 10px, gap: 14px |
| Red Indicator | 3px | 12px | #EF4444 pill |
| Currency Symbol (£) | ~12px | ~21px | 17.89px font, Open Runde 500 |
| Amount | ~74px | ~21px | 27.82px font, Open Runde 500 |

---

## CSS Spec (from design)

### MasterBlockHolder
```css
display: flex;
flex-direction: column;
align-items: flex-start;
padding: 12px 12px 0px;
gap: 10px;
width: 301px;
height: 78.95px;
flex: none;
order: 0;
align-self: stretch;
flex-grow: 0;
```

### MasterBlock
```css
box-sizing: border-box;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
padding: 26px 0px 20px;
width: 277px;
height: 66.95px;
background: linear-gradient(180deg, rgba(189, 180, 169, 0.06) 0%, rgba(87, 83, 78, 0.03) 100%);
border-bottom: 1px solid rgba(206, 206, 206, 0.1);
border-radius: 8px 8px 0px 0px;
flex: none;
order: 0;
align-self: stretch;
flex-grow: 0;
```

### MasterRow
```css
display: flex;
flex-direction: row;
justify-content: space-between;
align-items: flex-end;
padding: 0px 10px;
gap: 14px;
width: 277px;
height: 20.95px;
```

### TotalAmtSpent (label container)
```css
display: flex;
flex-direction: row;
justify-content: center;
align-items: center;
gap: 5px;
width: 103px;
height: 12px;
border-radius: 20px;
```

### Indicator (red pill)
```css
width: 3px;
height: 12px;
background: #EF4444;
border-radius: 16px;
```

### "Total Amount Spent" text
```css
font-family: 'Open Runde';
font-weight: 500;
font-size: 10px;
line-height: 24px;
color: #A8A29E;
```

### MasterTotalFrame + MasterTotalPrice
```css
/* Frame */
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
width: 85.92px;
height: 20.95px;

/* Price row */
display: flex;
flex-direction: row;
justify-content: flex-end;
align-items: center;
```

### Currency Symbol (£)
```css
font-family: 'Open Runde';
font-weight: 500;
font-size: 17.8871px;
line-height: 48px;
text-align: right;
color: #FFFFFF;
/* Top padding to baseline-align with amount */
padding-top: 7.95px;
```

### Amount Value
```css
font-family: 'Open Runde';
font-weight: 500;
font-size: 27.8243px;
line-height: 48px;
text-align: right;
color: #FFFFFF;
```

---

## Data Flow

```
entries: ExpenseEntry[]  (page state)
    │
    ├── grandTotal = entries.reduce((sum, e) => sum + e.total, 0)
    │       └── Formatted: grandTotal.toFixed(2)
    │
    └── groupedDays = groupEntriesByDay(entries)  (existing)

TracePage
  └── <AnimatedTextBox days={groupedDays} grandTotal={grandTotal} />
        └── <TextBox days={days} grandTotal={grandTotal} />
              ├── <MasterBlock total={grandTotal} />
              └── <FinanceBox days={days} />   (existing)
```

---

## Implementation Steps

### Step 1: Update TextBox height
- Change `--trace-textbox-height` from `421px` to `500px` in `trace.module.css`

### Step 2: Create MasterBlock component
- New file: `src/projects/trace/components/ui/tracemasterblock.tsx`
- Props: `{ total: number }`
- Renders the full MasterBlockHolder → MasterBlock → MasterRow structure
- Formats total as `total.toFixed(2)`
- Currency symbol hardcoded as `£` for now (future: derive from entries or user preference)

### Step 3: Wire up data flow
- `TracePage`: compute `grandTotal` from `entries[]`, pass to `AnimatedTextBox`
- `AnimatedTextBox`: accept and forward `grandTotal` prop to `TextBox`
- `TextBox`: accept `grandTotal`, render `<MasterBlock total={grandTotal} />` above FinanceBox

### Step 4: Empty state handling
- When `grandTotal === 0`, still show MasterBlock with `£0.00`
- The block is always visible — it's permanent

### Step 5: Test and commit

---

## Currency Handling (Future)

Current approach: sum all `entry.total` values as raw numbers, display with `£` symbol. This is acceptable for a demo/MVP because:
- Most entries will be GBP in practice
- Mixed-currency summing is mathematically incorrect but visually acceptable for now
- Future enhancement: currency conversion API or per-currency breakdown

---

## Notes

- MasterBlock has `border-radius: 8px 8px 0px 0px` (rounded top only) — visually connects downward to FinanceBox
- The `border-bottom: 1px solid rgba(206, 206, 206, 0.1)` acts as a subtle separator between total and scrollable content
- The gradient background (`rgba(189, 180, 169, 0.06)` → `rgba(87, 83, 78, 0.03)`) is a warm-to-neutral fade, very subtle
- Red indicator pill is a small visual accent drawing the eye to the total
