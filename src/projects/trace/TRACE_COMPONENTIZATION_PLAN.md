# Trace UI Componentization Plan

## Overview
This document outlines the complete strategy for componentizing the Trace UI elements, following the atomic design methodology used in the Voice Interface project. We will extract all components from the Pencil designs and build a reusable component library.

---

## 📐 Design Specifications Extracted from Pencil

### Color Palette (trace.module.css)

```css
/* Primary Backgrounds */
--trace-bg-dark: #1c1917;          /* stone-950 - TextBox background */
--trace-bg-merchant: #29252466;    /* stone-900 @ 40% - MerchantBlock */

/* Button Colors */
--trace-btn-light: #f5f5f4;        /* stone-50 - Upload/Speak/Close */
--trace-btn-orange: #f97316;       /* orange-500 - SendAudio */
--trace-btn-processing: #a8a29e;   /* stone-400 - Processing buttons */

/* Text Colors */
--trace-text-primary: #ffffff;     /* White - primary text */
--trace-text-secondary: #e7e5e4;   /* stone-200 - item names, prices */
--trace-text-tertiary: #78716c;    /* stone-500 - merchant names */
--trace-text-qty: #ffffff4d;       /* white @ 30% - quantity badges */

/* Border Colors */
--trace-border-primary: #44403c;   /* stone-700 - TextBox border, button text */

/* Accent Colors */
--trace-accent-red: #ef4444;       /* red-500 - date bar (unused currently) */
--trace-discount-orange: #fb923c80; /* orange-400 @ 50% - discount text */
```

### Typography (Open Runde)

```css
/* Font Family */
--trace-font-family: 'Open Runde', sans-serif;

/* Font Sizes */
--trace-fs-discount-currency: 8px;   /* Line height: 3.0 */
--trace-fs-currency: 9px;            /* Line height: 2.67 */
--trace-fs-small: 10px;              /* Line height: 2.4 */
--trace-fs-body: 12px;               /* Line height: 2.0 */
--trace-fs-medium: 14px;             /* Line height: 1.71 */
--trace-fs-button: 16px;             /* Line height: 1.44 */
--trace-fs-processing: 18px;         /* Line height: 1.44 */

/* Font Weights */
--trace-fw-normal: 400;
--trace-fw-medium: 500;
```

### Component Dimensions

**TRnavbar States:**
- Full width: `301px`
- Button heights: `44px`
- Border radius: `23.16px` (~23px)
- Stroke thickness: `2.32px` (~2px)
- Gap between buttons: `12px`

**Individual Buttons:**
- Upload: `97 × 44px`
- Speak: `106 × 44px`
- Close: `56 × 44px`
- SendAudio: `150 × 44px`
- Processing (full): `301 × 44px`

**TextBox/FinanceBox:**
- Container: `301 × 421px`
- Border radius: `16px`
- Border: `1px solid #44403c`
- Shadow: `0px 4px 10.5px rgba(0,0,0,0.06)`
- FinanceBox padding: `32px 12px`

---

## 🏗️ Component Architecture

### Atomic Hierarchy

```
📦 Trace Components
├── 🔹 Atoms (Base Elements)
│   ├── UploadButton
│   ├── SpeakButton
│   ├── CloseButton
│   ├── SendAudioButton
│   ├── ProcessingAudioButton
│   ├── ProcessingImageButton
│   ├── DateLabel
│   ├── CurrencyLabel
│   ├── QuantityBadge
│   ├── ItemNameText
│   └── VoiceLiveWaveform (reused from voice interface)
│
├── 🔸 Molecules (Simple Compositions)
│   ├── TotalFrame (CurrencyLabel + Amount)
│   ├── NetPriceFrame (CurrencyLabel + Price)
│   ├── DiscountFrame (CurrencyLabel + Discount)
│   ├── QtyItemName (QuantityBadge + ItemNameText)
│   ├── PriceFrame (NetPriceFrame + DiscountFrame?)
│   ├── DayTotal (DateLabel + TotalFrame)
│   ├── RowIdentifier (Merchant name + Total)
│   └── ContentRow (QtyItemName + PriceFrame)
│
├── 🔶 Organisms (Complex Components)
│   ├── TRNavbar (State-driven button groups)
│   ├── MerchantBlock (RowIdentifier + ContentRows[])
│   ├── DayBlock (DayTotal + MerchantBlock)
│   └── FinanceBox (Container for DayBlocks[])
│
└── 📄 Pages
    ├── TraceApp.tsx (Main application container)
    └── showcase/tracecomponents.tsx (Component documentation)
```

---

## 📋 Implementation Phases

### **Phase 1: Setup & Foundation**

#### 1.1 CSS Variables Setup
**File:** `/src/projects/trace/styles/trace.module.css`

**Tasks:**
- [ ] Add all color variables from design specs
- [ ] Add typography variables (font sizes, weights, line heights)
- [ ] Add spacing/dimension variables
- [ ] Add border radius variables
- [ ] Add shadow variables
- [ ] Verify Open Runde font is properly imported

#### 1.2 File Structure
**Create directory structure:**
```
/src/projects/trace/
├── components/
│   ├── ui/
│   │   ├── tracebuttons.tsx          # All atomic button components
│   │   ├── tracefinance.tsx          # Finance display atoms & molecules
│   │   └── tracenavbar.tsx           # TRNavbar compositions
│   ├── FinanceBox.tsx                # Results display organism
│   └── TraceApp.tsx                  # Main container
├── showcase/
│   └── tracecomponents.tsx           # Component documentation page
├── styles/
│   └── trace.module.css              # All design tokens
└── types/
    └── trace.types.ts                # TypeScript interfaces
```

---

### **Phase 2: Atomic Components (Buttons)**

#### 2.1 Navigation Buttons
**File:** `/src/projects/trace/components/ui/tracebuttons.tsx`

**Components to build:**

```tsx
// Upload Button - 97×44px
export const UploadButton: React.FC<ButtonProps>

// Speak Button - 106×44px
export const SpeakButton: React.FC<ButtonProps>

// Close Button - 56×44px
export const CloseButton: React.FC<ButtonProps>

// Send Audio Button - 150×44px (with waveform)
export const SendAudioButton: React.FC<SendAudioProps>

// Processing Audio Button - 301×44px
export const ProcessingAudioButton: React.FC<ProcessingProps>

// Processing Image Button - 301×44px
export const ProcessingImageButton: React.FC<ProcessingProps>
```

**Key Patterns:**
- Use styled-jsx for scoped styling
- Import CSS variables from trace.module.css
- Reuse `VoiceLiveWaveform` component from voice interface
- Support disabled states
- Include proper TypeScript props interfaces

**Design Specs:**
```css
.trace-button {
  height: 44px;
  border-radius: 23px;
  border: 2px solid transparent;
  font-family: var(--trace-font-family);
  font-weight: var(--trace-fw-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trace-button.light {
  background: var(--trace-btn-light);
  color: var(--trace-border-primary);
  border-color: transparent;
}

.trace-button.orange {
  background: var(--trace-btn-orange);
  color: var(--trace-text-primary);
}

.trace-button.processing {
  background: var(--trace-btn-processing);
  color: var(--trace-text-primary);
  pointer-events: none;
}
```

---

## ⚡ Currency Symbol Alignment Strategy

### The Problem
In the Pencil designs, currency symbols (£, $, €) are placed in separate divs with manual padding adjustments. This was necessary because:
- Currency symbols are smaller (8-9px) than price text (12-14px)
- When different font sizes are on the same line, the smaller text vertically centers by default
- This makes the symbol appear "floating" in the middle rather than aligned to the text baseline
- Traditional solutions (bottom-align, line-height adjustments) didn't work consistently

**Pencil Design Approach (separate divs):**
```tsx
// Currency in its own div with top padding
<div className="currency-wrapper" style={{ paddingTop: '2px' }}>
  <span>£</span>
</div>
<div className="price-value">
  <span>104.99</span>
</div>
```

### Modern CSS Solution

**We will NOT replicate the separate div structure.** Instead, we'll use modern CSS alignment:

#### **Option 1: Flexbox with Baseline Alignment (Recommended)**
```tsx
const PriceWithCurrency: React.FC<{currency: string, amount: number}> = ({currency, amount}) => (
  <div className="price-container">
    <span className="currency">{currency}</span>
    <span className="amount">{amount.toFixed(2)}</span>

    <style jsx>{`
      .price-container {
        display: flex;
        align-items: baseline; /* Aligns text baselines, not centers */
        gap: 2px;
      }

      .currency {
        font-size: var(--trace-fs-currency); /* 9px */
        font-weight: var(--trace-fw-medium);
      }

      .amount {
        font-size: var(--trace-fs-body); /* 12px or 14px */
        font-weight: var(--trace-fw-medium);
      }
    `}</style>
  </div>
);
```

#### **Option 2: Fine-Tuned with Transform (If baseline isn't perfect)**
```css
.currency {
  font-size: var(--trace-fs-currency);
  transform: translateY(1px); /* More precise than padding */
}
```

#### **Option 3: CSS Grid (Alternative)**
```css
.price-container {
  display: grid;
  grid-auto-flow: column;
  align-items: end; /* Align to bottom of text */
  gap: 2px;
}
```

### Implementation Decision

**We will use Option 1 (Flexbox + Baseline) as the default**, with Option 2 (transform) as a fallback if we need pixel-perfect adjustments during testing.

**Benefits:**
- Semantic HTML (no unnecessary wrapper divs)
- Maintainable (no magic padding numbers)
- Responsive (works across different font sizes)
- Accessible (screen readers read as single unit)

### Testing Strategy

1. **Build components with Option 1 first**
2. **Test in showcase with all price variations**:
   - Small currency (8px) + body text (12px)
   - Small currency (9px) + medium text (14px)
   - Discount currency (-£) with orange color
3. **Visually compare to Pencil designs**
4. **If misaligned, add transform adjustment (max 2px)**
5. **Document final approach in CSS comments**

### Components Affected

This pattern will be used in:
- `TotalFrame` (£5246.99)
- `NetPriceFrame` (£104.99)
- `DiscountFrame` (-£3.99)
- `RowIdentifier` merchant total (£619.97)

**Each component will be a single div with flexbox, not nested divs.**

---

### **Phase 3: Finance Display Atoms**

#### 3.1 Text & Badge Components
**File:** `/src/projects/trace/components/ui/tracefinance.tsx`

**Components to build:**

```tsx
// Date Label - "14th Jul"
export const DateLabel: React.FC<DateLabelProps>

// Currency Label - "£" symbol
export const CurrencyLabel: React.FC<CurrencyProps>

// Quantity Badge - "2x", "1x"
export const QuantityBadge: React.FC<QtyProps>

// Item Name - "Headphones are"
export const ItemNameText: React.FC<ItemNameProps>
```

**Design Specs:**
- DateLabel: 12px medium, white, line-height 2.0
- CurrencyLabel: 9px medium, stone-200, line-height 2.67
- QuantityBadge: 12px normal, white @ 30%, line-height 2.0
- ItemName: 14px medium, stone-200, line-height 1.71

---

### **Phase 4: Finance Display Molecules**

#### 4.1 Compound Components
**File:** `/src/projects/trace/components/ui/tracefinance.tsx`

**Components to build:**

```tsx
// Total Frame - Currency + Amount
// Uses modern flexbox baseline alignment (no separate divs!)
export const TotalFrame: React.FC<TotalFrameProps> = ({ currency, amount }) => (
  <div className="total-frame">
    <span className="currency">{currency}</span>
    <span className="amount">{amount.toFixed(2)}</span>

    <style jsx>{`
      .total-frame {
        display: flex;
        align-items: baseline; /* Modern alignment solution */
        gap: 2px;
        justify-content: flex-end;
      }

      .currency {
        font-size: var(--trace-fs-currency); /* 9px */
        font-weight: var(--trace-fw-medium);
        color: var(--trace-text-primary);
      }

      .amount {
        font-size: var(--trace-fs-body); /* 12px */
        font-weight: var(--trace-fw-normal);
        color: var(--trace-text-primary);
      }
    `}</style>
  </div>
);

// Net Price Frame - Currency + Price
// Single div, flexbox baseline (no padding hacks!)
export const NetPriceFrame: React.FC<NetPriceFrameProps> = ({ currency, price }) => (
  <div className="net-price-frame">
    <span className="currency">{currency}</span>
    <span className="price">{price.toFixed(2)}</span>

    <style jsx>{`
      .net-price-frame {
        display: flex;
        align-items: baseline;
        gap: 2px;
        height: 20px;
      }

      .currency {
        font-size: var(--trace-fs-currency); /* 9px */
        font-weight: var(--trace-fw-medium);
        color: var(--trace-text-secondary);
      }

      .price {
        font-size: var(--trace-fs-medium); /* 14px */
        font-weight: var(--trace-fw-medium);
        color: var(--trace-text-secondary);
      }
    `}</style>
  </div>
);

// Discount Frame - Currency + Discount
// Includes negative sign, uses transform if needed for perfect alignment
export const DiscountFrame: React.FC<DiscountFrameProps> = ({ currency, discount }) => (
  <div className="discount-frame">
    <span className="currency">-{currency}</span>
    <span className="discount">{discount.toFixed(2)}</span>

    <style jsx>{`
      .discount-frame {
        display: flex;
        align-items: baseline;
        gap: 2px;
        height: 12px;
      }

      .currency {
        font-size: var(--trace-fs-discount-currency); /* 8px */
        font-weight: var(--trace-fw-normal);
        color: var(--trace-discount-orange);
        /* Add transform only if baseline isn't perfect after testing */
        /* transform: translateY(1px); */
      }

      .discount {
        font-size: var(--trace-fs-small); /* 10px */
        font-weight: var(--trace-fw-normal);
        color: var(--trace-discount-orange);
      }
    `}</style>
  </div>
);

// Qty + ItemName - Combined display
export const QtyItemName: React.FC<QtyItemNameProps> {
  // Gap: 10px, Qty width: 12px
}

// Price Frame - Net Price + Optional Discount
export const PriceFrame: React.FC<PriceFrameProps> {
  // Vertical stack, align right
  // Shows NetPriceFrame always
  // Shows DiscountFrame conditionally
}

// Day Total - Date + Total
export const DayTotal: React.FC<DayTotalProps> {
  // Horizontal layout, space-between
  // Padding: 0 10px
  // Border-top: 0.5px
}

// Row Identifier - Merchant + Total
export const RowIdentifier: React.FC<RowIdentifierProps> {
  // Merchant: 10px medium, stone-500
  // Total: 10px medium, stone-500
  // Padding: 6px 10px
  // Border-radius: 8px 8px 0 0
}

// Content Row - Full item row
export const ContentRow: React.FC<ContentRowProps> {
  // Contains: QtyItemName + PriceFrame
  // Gap: 100px (space-between)
  // Padding: 4px 10px 8px 10px (first item)
  // Padding: 0 10px 8px 10px (subsequent items)
}
```

**Key Patterns:**
- Molecules compose atoms
- Use flexbox for alignment
- Support optional props (discount, first item, etc.)
- Maintain exact spacing from design

---

### **Phase 5: Finance Display Organisms**

#### 5.1 Block Components
**File:** `/src/projects/trace/components/FinanceBox.tsx`

**Components to build:**

```tsx
// Merchant Block - Complete transaction group
export const MerchantBlock: React.FC<MerchantBlockProps> {
  // Contains:
  // - RowIdentifier (merchant name + total)
  // - ContentRow[] (array of items)
  //
  // Styles:
  // - Background: #29252466
  // - Border-radius: 8px
  // - Padding: 0 0 4px 0
}

// Day Block - Daily transaction summary
export const DayBlock: React.FC<DayBlockProps> {
  // Contains:
  // - DayTotal (date + day total)
  // - MerchantBlock (transaction details)
  //
  // Styles:
  // - Vertical layout
  // - Gap: 4px
  // - Full width
}

// Finance Box - Main container
export const FinanceBox: React.FC<FinanceBoxProps> {
  // Contains:
  // - DayBlock[] (array of days)
  //
  // Styles:
  // - Vertical layout
  // - Gap: 10px (between days)
  // - Padding: 32px 12px
  // - Border-radius: 6px
}
```

**Props Interfaces:**
```tsx
interface MerchantBlockProps {
  merchant: string;
  merchantTotal: number;
  currency: string;
  items: ContentRowData[];
}

interface DayBlockProps {
  date: string;
  dayTotal: number;
  currency: string;
  merchants: MerchantBlockProps[];
}

interface FinanceBoxProps {
  days: DayBlockProps[];
  onDelete?: (dayId: string) => void;
}
```

---

### **Phase 6: TRNavbar State Management**

#### 6.1 State-Driven Navigation Bar
**File:** `/src/projects/trace/components/ui/tracenavbar.tsx`

**Component Structure:**

```tsx
export type TRNavbarState =
  | 'idle'
  | 'recording'
  | 'processing_audio'
  | 'processing_image';

interface TRNavbarProps {
  state: TRNavbarState;
  onUploadClick?: () => void;
  onSpeakClick?: () => void;
  onCloseClick?: () => void;
  onSendAudioClick?: () => void;
}

export const TRNavbar: React.FC<TRNavbarProps> = ({
  state,
  onUploadClick,
  onSpeakClick,
  onCloseClick,
  onSendAudioClick,
}) => {
  return (
    <div className={`trnavbar-container state-${state}`}>
      {/* IDLE STATE: Upload + Speak */}
      {state === 'idle' && (
        <>
          <UploadButton onClick={onUploadClick} />
          <SpeakButton onClick={onSpeakClick} />
        </>
      )}

      {/* RECORDING STATE: Close + SendAudio */}
      {state === 'recording' && (
        <>
          <CloseButton onClick={onCloseClick} />
          <SendAudioButton onClick={onSendAudioClick} />
        </>
      )}

      {/* PROCESSING AUDIO STATE: Full-width button */}
      {state === 'processing_audio' && (
        <ProcessingAudioButton />
      )}

      {/* PROCESSING IMAGE STATE: Full-width button */}
      {state === 'processing_image' && (
        <ProcessingImageButton />
      )}

      <style jsx>{`
        .trnavbar-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 301px;
        }
      `}</style>
    </div>
  );
};
```

**State Transition Logic:**
```
idle → recording → processing_audio → idle (success)
                                   → error (failure)

idle → [image selected] → processing_image → idle (success)
                                           → error (failure)
```

---

### **Phase 7: Showcase Page**

#### 7.1 Component Documentation
**File:** `/src/projects/trace/showcase/tracecomponents.tsx`

**Structure (similar to voicecomponent.tsx):**

```tsx
export default function TraceComponents() {
  // State management for interactive demos
  const [navbarState, setNavbarState] = useState<TRNavbarState>('idle');

  return (
    <div className="trace-showcase">
      {/* Dark background since components are light */}
      <div className="showcase-container">

        {/* Section 1: Atomic Buttons */}
        <div className="section">
          <h2 className="section-title">Navigation Buttons</h2>
          <div className="file-label">📁 tracebuttons.tsx</div>

          <div className="seamless-grid">
            <ButtonGrid label="UPLOAD BUTTON - 97×44PX">
              <UploadButton />
            </ButtonGrid>

            <ButtonGrid label="SPEAK BUTTON - 106×44PX">
              <SpeakButton />
            </ButtonGrid>

            <ButtonGrid label="CLOSE BUTTON - 56×44PX">
              <CloseButton />
            </ButtonGrid>

            <ButtonGrid label="SEND AUDIO BUTTON - 150×44PX">
              <SendAudioButton />
            </ButtonGrid>

            <ButtonGrid label="PROCESSING AUDIO - 301×44PX">
              <ProcessingAudioButton />
            </ButtonGrid>

            <ButtonGrid label="PROCESSING IMAGE - 301×44PX">
              <ProcessingImageButton />
            </ButtonGrid>
          </div>
        </div>

        {/* Section 2: TRNavbar States */}
        <div className="section">
          <h2 className="section-title">TRNavbar States</h2>
          <div className="file-label">📁 tracenavbar.tsx</div>

          {/* State Toggle */}
          <div className="state-toggle">
            <button
              className={navbarState === 'idle' ? 'active' : ''}
              onClick={() => setNavbarState('idle')}
            >
              IDLE
            </button>
            <button
              className={navbarState === 'recording' ? 'active' : ''}
              onClick={() => setNavbarState('recording')}
            >
              RECORDING
            </button>
            <button
              className={navbarState === 'processing_audio' ? 'active' : ''}
              onClick={() => setNavbarState('processing_audio')}
            >
              PROC AUDIO
            </button>
            <button
              className={navbarState === 'processing_image' ? 'active' : ''}
              onClick={() => setNavbarState('processing_image')}
            >
              PROC IMAGE
            </button>
          </div>

          <div className="navbar-demo">
            <TRNavbar state={navbarState} />
          </div>
        </div>

        {/* Section 3: Finance Components */}
        <div className="section">
          <h2 className="section-title">Finance Display Components</h2>
          <div className="file-label">📁 tracefinance.tsx</div>

          <div className="seamless-grid">
            <ComponentGrid label="DATE LABEL">
              <DateLabel date="14th Jul" />
            </ComponentGrid>

            <ComponentGrid label="TOTAL FRAME">
              <TotalFrame currency="£" amount={5246.99} />
            </ComponentGrid>

            <ComponentGrid label="QTY + ITEM NAME">
              <QtyItemName quantity={2} itemName="Headphones are" />
            </ComponentGrid>

            <ComponentGrid label="NET PRICE FRAME">
              <NetPriceFrame currency="£" price={104.99} />
            </ComponentGrid>

            <ComponentGrid label="DISCOUNT FRAME">
              <DiscountFrame currency="£" discount={3.99} />
            </ComponentGrid>

            <ComponentGrid label="PRICE FRAME (WITH DISCOUNT)">
              <PriceFrame
                currency="£"
                netPrice={104.99}
                discount={3.99}
              />
            </ComponentGrid>

            <ComponentGrid label="PRICE FRAME (NO DISCOUNT)">
              <PriceFrame
                currency="£"
                netPrice={499.99}
              />
            </ComponentGrid>
          </div>
        </div>

        {/* Section 4: Molecule Components */}
        <div className="section">
          <h2 className="section-title">Molecule Components</h2>

          <div className="molecule-grid">
            <ComponentGrid label="DAY TOTAL">
              <DayTotal
                date="14th Jul"
                currency="£"
                total={5246.99}
              />
            </ComponentGrid>

            <ComponentGrid label="ROW IDENTIFIER">
              <RowIdentifier
                merchant="Tescos"
                currency="£"
                total={619.97}
              />
            </ComponentGrid>

            <ComponentGrid label="CONTENT ROW (WITH DISCOUNT)">
              <ContentRow
                quantity={2}
                itemName="Headphones are"
                currency="£"
                netPrice={104.99}
                discount={3.99}
                isFirstItem={true}
              />
            </ComponentGrid>

            <ComponentGrid label="CONTENT ROW (NO DISCOUNT)">
              <ContentRow
                quantity={1}
                itemName="Playstation 5"
                currency="£"
                netPrice={499.99}
                isFirstItem={false}
              />
            </ComponentGrid>
          </div>
        </div>

        {/* Section 5: Organism Components */}
        <div className="section full-width">
          <h2 className="section-title">Complete Finance Display</h2>
          <div className="file-label">📁 FinanceBox.tsx</div>

          <div className="finance-demo">
            {/* Demo with sample data */}
            <FinanceBox
              days={[
                {
                  date: '14th Jul',
                  dayTotal: 5246.99,
                  currency: '£',
                  merchants: [
                    {
                      merchant: 'Tescos',
                      merchantTotal: 619.97,
                      currency: '£',
                      items: [
                        {
                          quantity: 2,
                          name: 'Headphones are',
                          netPrice: 104.99,
                          discount: 3.99,
                        },
                        {
                          quantity: 1,
                          name: 'Playstation 5',
                          netPrice: 499.99,
                        },
                        {
                          quantity: 1,
                          name: 'Chino Trousers',
                          netPrice: 14.99,
                        },
                      ],
                    },
                  ],
                },
              ]}
            />
          </div>
        </div>

        {/* Section 6: Font Size & Alignment Testing */}
        <div className="section full-width">
          <h2 className="section-title">Font Size & Currency Alignment Testing</h2>
          <p className="section-description">
            Interactive testing area to validate font sizes and currency symbol alignment.
            Adjust if components appear too small/large on actual screens.
          </p>

          <div className="testing-grid">
            {/* Currency Alignment Tests */}
            <div className="test-card">
              <h3>Currency Alignment Tests</h3>
              <div className="test-examples">
                <div className="example-row">
                  <span className="label">Total Frame (9px + 12px):</span>
                  <TotalFrame currency="£" amount={5246.99} />
                </div>
                <div className="example-row">
                  <span className="label">Net Price (9px + 14px):</span>
                  <NetPriceFrame currency="£" price={104.99} />
                </div>
                <div className="example-row">
                  <span className="label">Discount (8px + 10px):</span>
                  <DiscountFrame currency="£" discount={3.99} />
                </div>
              </div>
              <p className="test-note">
                ✅ Symbols should align to text baseline, not float in middle.
                <br />
                ✅ If misaligned, adjust with transform: translateY() in CSS.
              </p>
            </div>

            {/* Full ContentRow Test */}
            <div className="test-card">
              <h3>Complete ContentRow</h3>
              <div className="contentrow-test">
                <ContentRow
                  quantity={2}
                  itemName="Headphones are"
                  currency="£"
                  netPrice={104.99}
                  discount={3.99}
                  isFirstItem={true}
                />
              </div>
              <p className="test-note">
                Check: Quantity (12px), Item name (14px), Currency (9px), Price (14px), Discount (8px/10px)
              </p>
            </div>

            {/* Font Size Scale Test */}
            <div className="test-card full-width">
              <h3>Font Size Readability Test</h3>
              <p>If text appears too small, increase CSS variables by 10-20%:</p>
              <div className="font-samples">
                <div className="sample">
                  <span style={{ fontSize: '8px' }}>8px - Discount Currency</span>
                </div>
                <div className="sample">
                  <span style={{ fontSize: '9px' }}>9px - Currency Symbol</span>
                </div>
                <div className="sample">
                  <span style={{ fontSize: '10px' }}>10px - Small Text (Merchant)</span>
                </div>
                <div className="sample">
                  <span style={{ fontSize: '12px' }}>12px - Body Text (Dates, Totals)</span>
                </div>
                <div className="sample">
                  <span style={{ fontSize: '14px' }}>14px - Medium (Item Names, Prices)</span>
                </div>
                <div className="sample">
                  <span style={{ fontSize: '16px' }}>16px - Button Text</span>
                </div>
                <div className="sample">
                  <span style={{ fontSize: '18px' }}>18px - Processing Text</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .trace-showcase {
          min-height: 100vh;
          background: #0a0a0a; /* Super dark background */
          padding: 60px 20px;
        }

        .showcase-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section {
          margin-bottom: 80px;
        }

        .section-title {
          font-family: var(--trace-font-family);
          font-size: 24px;
          font-weight: 500;
          color: var(--trace-text-primary);
          margin-bottom: 12px;
        }

        .file-label {
          font-family: var(--trace-font-family);
          font-size: 12px;
          color: var(--trace-text-tertiary);
          margin-bottom: 32px;
        }

        .seamless-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .state-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
        }

        .state-toggle button {
          padding: 8px 16px;
          background: #27272a;
          color: #a1a1aa;
          border: 1px solid #3f3f46;
          border-radius: 6px;
          font-family: var(--trace-font-family);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .state-toggle button.active {
          background: var(--trace-btn-orange);
          color: white;
          border-color: var(--trace-btn-orange);
        }

        .navbar-demo {
          display: flex;
          justify-content: center;
          padding: 40px;
          background: #18181b;
          border-radius: 12px;
        }

        .finance-demo {
          display: flex;
          justify-content: center;
          padding: 40px;
          background: #18181b;
          border-radius: 12px;
        }

        .section-description {
          font-family: var(--trace-font-family);
          font-size: 14px;
          color: var(--trace-text-tertiary);
          margin-bottom: 32px;
        }

        .testing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }

        .test-card {
          background: #18181b;
          border-radius: 12px;
          padding: 24px;
        }

        .test-card.full-width {
          grid-column: 1 / -1;
        }

        .test-card h3 {
          font-family: var(--trace-font-family);
          font-size: 16px;
          font-weight: 500;
          color: var(--trace-text-primary);
          margin-bottom: 16px;
        }

        .test-examples {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .example-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #27272a;
        }

        .example-row .label {
          font-size: 12px;
          color: var(--trace-text-tertiary);
        }

        .test-note {
          margin-top: 16px;
          font-size: 11px;
          color: var(--trace-text-tertiary);
          line-height: 1.6;
        }

        .contentrow-test {
          background: var(--trace-bg-dark);
          border: 1px solid var(--trace-border-primary);
          border-radius: 8px;
          padding: 12px;
        }

        .font-samples {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }

        .font-samples .sample {
          padding: 8px 12px;
          background: var(--trace-bg-dark);
          border: 1px solid var(--trace-border-primary);
          border-radius: 6px;
        }

        .font-samples .sample span {
          font-family: var(--trace-font-family);
          color: var(--trace-text-primary);
        }
      `}</style>
    </div>
  );
}
```

**Key Features:**
- Dark background (#0a0a0a) to showcase light components
- Interactive state toggles for TRNavbar
- Grid layout for atomic components (200×200px cells similar to voice)
- Full-width demos for organism components
- File path labels for developer reference
- Responsive layout

---

### **Phase 8: Main Application Integration**

#### 8.1 TraceApp Container
**File:** `/src/projects/trace/components/TraceApp.tsx`

**Port from trace-protocol-v1.0/App.tsx with modifications:**

**State Management:**
```tsx
type TraceAppState =
  | 'idle'
  | 'recording'
  | 'processing_audio'
  | 'processing_image'
  | 'error';

interface TraceAppProps {
  // Optional initial data
}

export const TraceApp: React.FC<TraceAppProps> = () => {
  const [appState, setAppState] = useState<TraceAppState>('idle');
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('trace-entries');
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('trace-entries', JSON.stringify(entries));
  }, [entries]);

  // Voice recording handlers
  const handleStartRecording = () => {
    setAppState('recording');
  };

  const handleStopRecording = async (audioBlob: Blob) => {
    setAppState('processing_audio');
    try {
      // Convert to base64
      const base64 = await blobToBase64(audioBlob);
      // Send to API (no transcription, direct parsing)
      const entry = await parseVoiceAudio(base64, audioBlob.type);
      setEntries(prev => [entry, ...prev]);
      setAppState('idle');
    } catch (err) {
      setError('Failed to process audio');
      setAppState('error');
    }
  };

  const handleCancelRecording = () => {
    setAppState('idle');
  };

  // Image upload handlers
  const handleUploadImage = async (file: File) => {
    setAppState('processing_image');
    try {
      const base64 = await fileToBase64(file);
      const entry = await parseReceiptImage(base64, file.type);
      setEntries(prev => [entry, ...prev]);
      setAppState('idle');
    } catch (err) {
      setError('Failed to process image');
      setAppState('error');
    }
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="trace-app">
      {/* Header */}
      <header className="trace-header">
        <h1>Trace</h1>
        <p>Voice & Image Expense Tracker</p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Main Content */}
      <main className="trace-main">
        {entries.length === 0 ? (
          <div className="empty-state">
            <p>No expenses logged yet</p>
            <p>Use the buttons below to get started</p>
          </div>
        ) : (
          <FinanceBox
            days={groupEntriesByDay(entries)}
            onDelete={handleDeleteEntry}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="trace-nav">
        <TRNavbar
          state={appState}
          onUploadClick={() => {
            // Trigger file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleUploadImage(file);
            };
            input.click();
          }}
          onSpeakClick={handleStartRecording}
          onCloseClick={handleCancelRecording}
          onSendAudioClick={(blob) => handleStopRecording(blob)}
        />
      </nav>

      <style jsx>{`
        .trace-app {
          min-height: 100vh;
          background: var(--trace-bg-dark);
          color: var(--trace-text-primary);
          padding-bottom: 100px; /* Space for fixed nav */
        }

        .trace-header {
          text-align: center;
          padding: 40px 20px;
        }

        .trace-header h1 {
          font-family: var(--trace-font-family);
          font-size: 32px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .trace-header p {
          font-family: var(--trace-font-family);
          font-size: 14px;
          color: var(--trace-text-tertiary);
        }

        .trace-main {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .trace-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(to top,
            var(--trace-bg-dark) 0%,
            transparent 100%
          );
        }

        .error-banner {
          background: var(--trace-accent-red);
          color: white;
          padding: 12px 20px;
          text-align: center;
          position: relative;
        }

        .error-banner button {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--trace-text-tertiary);
        }

        .empty-state p {
          font-family: var(--trace-font-family);
          font-size: 14px;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};
```

**Key Changes from trace-protocol-v1.0:**
1. **No Transcription State**: Recording goes directly to `processing_audio` (no review/edit step)
2. **Simplified Audio Flow**: `idle → recording → processing_audio → idle`
3. **Image Flow**: `idle → [file selected] → processing_image → idle`
4. **State Types**: Added separate `processing_audio` and `processing_image` states
5. **UI Components**: Using new TRNavbar and FinanceBox instead of old components

---

## 🔄 Migration from trace-protocol-v1.0

### Components to Port (with modifications)

| Old Component | New Component | Changes Required |
|---------------|---------------|------------------|
| `App.tsx` | `TraceApp.tsx` | • Remove transcription state<br>• Add separate processing states<br>• Use new TRNavbar<br>• Use new FinanceBox |
| `VoiceInput.tsx` | Simplified in `TraceApp.tsx` | • Remove review/edit UI<br>• Remove transcription step<br>• Direct audio → processing flow |
| `CameraInput.tsx` | Minimal changes | • Keep as-is, just styling updates |
| `ResultsDisplay.tsx` | `FinanceBox.tsx` | • Complete redesign with new atoms<br>• DayBlock/MerchantBlock structure |

### API Integration

**Keep:**
- `/api/parse-receipt` - Image parsing endpoint
- `/api/parse-voice` - Voice parsing endpoint (but pass audio directly, not transcription)

**Remove:**
- `/api/transcribe` - Not needed for V1

**Update geminiService.ts:**
```tsx
// OLD: parseVoice accepted text/plain (transcription) OR audio
// NEW: parseVoice ONLY accepts audio (mimeType check)

export async function parseVoice(audioData: string, mimeType: string): Promise<ExpenseEntry> {
  // Remove text/plain handling
  // Only process audio/* mimetypes
  if (!mimeType.startsWith('audio/')) {
    throw new Error('Invalid audio format');
  }

  // Send audio directly to Gemini
  // ... rest of implementation
}
```

---

## ✅ Implementation Checklist

### Phase 1: Setup & Foundation
- [ ] Create CSS variables in `trace.module.css`
- [ ] Set up file structure (`components/ui/`, `showcase/`, etc.)
- [ ] Create TypeScript types in `trace.types.ts`
- [ ] Verify Open Runde font is loaded

### Phase 2: Atomic Components (Buttons)
- [ ] Build `UploadButton`
- [ ] Build `SpeakButton`
- [ ] Build `CloseButton`
- [ ] Build `SendAudioButton` (with waveform)
- [ ] Build `ProcessingAudioButton`
- [ ] Build `ProcessingImageButton`
- [ ] Port `VoiceLiveWaveform` from voice interface
- [ ] Test all buttons with hover/disabled states

### Phase 3: Finance Display Atoms
- [ ] Build `DateLabel`
- [ ] Build `CurrencyLabel`
- [ ] Build `QuantityBadge`
- [ ] Build `ItemNameText`
- [ ] Test typography and colors

### Phase 4: Finance Display Molecules
- [ ] Build `TotalFrame`
- [ ] Build `NetPriceFrame`
- [ ] Build `DiscountFrame`
- [ ] Build `QtyItemName`
- [ ] Build `PriceFrame` (with conditional discount)
- [ ] Build `DayTotal`
- [ ] Build `RowIdentifier`
- [ ] Build `ContentRow` (with first-item padding variation)
- [ ] Test all molecule compositions

### Phase 5: Finance Display Organisms
- [ ] Build `MerchantBlock`
- [ ] Build `DayBlock`
- [ ] Build `FinanceBox`
- [ ] Test with sample data
- [ ] Test empty states
- [ ] Test delete functionality

### Phase 6: TRNavbar
- [ ] Build `TRNavbar` container
- [ ] Implement 4-state switching logic
- [ ] Test state transitions
- [ ] Test button callbacks
- [ ] Verify animations (if any)

### Phase 7: Showcase Page
- [ ] Create showcase page structure
- [ ] Add dark background styling
- [ ] Add Section 1: Atomic buttons grid
- [ ] Add Section 2: TRNavbar with state toggles
- [ ] Add Section 3: Finance atoms grid
- [ ] Add Section 4: Finance molecules
- [ ] Add Section 5: Full FinanceBox demo
- [ ] Test interactive state toggles
- [ ] Add responsive layout

### Phase 8: Main Application
- [ ] Port App.tsx to TraceApp.tsx
- [ ] Implement state management
- [ ] Add localStorage persistence
- [ ] Integrate TRNavbar
- [ ] Integrate FinanceBox
- [ ] Add error handling
- [ ] Add empty state
- [ ] Test voice recording flow
- [ ] Test image upload flow
- [ ] Test entry deletion

### Phase 9: API Integration
- [ ] Update `geminiService.ts` to remove transcription
- [ ] Test `/api/parse-voice` with direct audio
- [ ] Test `/api/parse-receipt` with images
- [ ] Handle API errors gracefully
- [ ] Add loading states

### Phase 10: Testing & Polish
- [ ] Test all component variations in showcase
- [ ] Test full user flow (voice → display → delete)
- [ ] Test full user flow (image → display → delete)
- [ ] Verify responsive design
- [ ] Check accessibility (keyboard nav, screen readers)
- [ ] Verify color contrast ratios
- [ ] Test on different screen sizes
- [ ] Cross-browser testing

---

## 📊 Success Criteria

### Component Library
- ✅ All atomic components match Pencil design specs exactly
- ✅ All molecules properly compose atoms
- ✅ All organisms properly compose molecules
- ✅ Showcase page displays all components with state toggles
- ✅ Dark background (#0a0a0a) showcases light components clearly

### Application Flow
- ✅ Voice recording works without transcription step
- ✅ Image upload processes correctly
- ✅ Entries display in FinanceBox with correct formatting
- ✅ State transitions are smooth and clear
- ✅ Error states are handled gracefully
- ✅ Data persists in localStorage

### Code Quality
- ✅ TypeScript interfaces for all components
- ✅ Consistent styled-jsx pattern throughout
- ✅ CSS variables used (no hardcoded colors)
- ✅ Proper component composition (no prop drilling)
- ✅ Reusable components (no duplication)

---

## 🎨 Design Token Reference

### Quick Copy-Paste for trace.module.css

```css
/* ============================================
   TRACE UI DESIGN TOKENS
   Extracted from Pencil designs
   ============================================ */

/* COLORS */
:root {
  /* Backgrounds */
  --trace-bg-dark: #1c1917;
  --trace-bg-merchant: #29252466;

  /* Buttons */
  --trace-btn-light: #f5f5f4;
  --trace-btn-orange: #f97316;
  --trace-btn-processing: #a8a29e;

  /* Text */
  --trace-text-primary: #ffffff;
  --trace-text-secondary: #e7e5e4;
  --trace-text-tertiary: #78716c;
  --trace-text-qty: #ffffff4d;

  /* Borders */
  --trace-border-primary: #44403c;

  /* Accents */
  --trace-accent-red: #ef4444;
  --trace-discount-orange: #fb923c80;
}

/* TYPOGRAPHY */
:root {
  --trace-font-family: 'Open Runde', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Font Sizes */
  --trace-fs-discount-currency: 8px;
  --trace-fs-currency: 9px;
  --trace-fs-small: 10px;
  --trace-fs-body: 12px;
  --trace-fs-medium: 14px;
  --trace-fs-button: 16px;
  --trace-fs-processing: 18px;

  /* Font Weights */
  --trace-fw-normal: 400;
  --trace-fw-medium: 500;

  /* Line Heights */
  --trace-lh-discount-currency: 3.0;
  --trace-lh-currency: 2.67;
  --trace-lh-small: 2.4;
  --trace-lh-body: 2.0;
  --trace-lh-medium: 1.71;
  --trace-lh-button: 1.44;
}

/* DIMENSIONS */
:root {
  /* TRNavbar */
  --trace-navbar-width: 301px;
  --trace-button-height: 44px;
  --trace-button-radius: 23px;
  --trace-button-stroke: 2px;
  --trace-button-gap: 12px;

  /* TextBox */
  --trace-textbox-width: 301px;
  --trace-textbox-height: 421px;
  --trace-textbox-radius: 16px;
  --trace-textbox-border: 1px;

  /* Spacing */
  --trace-spacing-xs: 4px;
  --trace-spacing-sm: 6px;
  --trace-spacing-md: 10px;
  --trace-spacing-lg: 12px;
  --trace-spacing-xl: 16px;
  --trace-spacing-2xl: 32px;
}

/* SHADOWS */
:root {
  --trace-shadow-textbox: 0px 4px 10.5px rgba(0, 0, 0, 0.06);
}
```

---

## 📝 Notes

### Design Decisions
1. **No Transcription in V1**: Simplified flow keeps V1 lean, transcription can be added in V2
2. **Separate Processing States**: Clear feedback on whether audio or image is being processed
3. **Dark Showcase Background**: Necessary to see light-colored components clearly
4. **Full State Replacement**: Unlike voice interface morphing, Trace navbar swaps entire button sets (simpler pattern)
5. **ContentRow Padding Variation**: First item has top padding (4px), subsequent items don't (0px)

### Potential Issues
- **Font Loading**: Verify Open Runde is properly imported in global styles
- **Waveform Component**: May need adjustments when porting from voice interface
- **localStorage Limits**: Consider IndexedDB for large datasets in future versions
- **API Key**: Gemini API key currently in final-exp, needs to be configured for trace

### Future Enhancements (V2+)
- Add transcription step (optional toggle)
- Add edit functionality for entries
- Add export functionality (CSV, JSON)
- Add date range filtering
- Add category tagging
- Add recurring expense detection
- Add budget tracking
- Add multi-currency conversion

---

## 🚀 Getting Started

1. Read this entire document
2. Examine the Pencil designs to familiarize yourself with the visual style
3. Start with **Phase 1** (CSS variables and file structure)
4. Build components in order (atoms → molecules → organisms)
5. Test each component in the showcase page before moving to the next
6. Finally, integrate everything in TraceApp.tsx

**Estimated Timeline:**
- Phase 1: 30 minutes
- Phase 2: 2 hours
- Phase 3: 1 hour
- Phase 4: 3 hours
- Phase 5: 2 hours
- Phase 6: 1 hour
- Phase 7: 2 hours
- Phase 8: 3 hours
- Phase 9: 1 hour
- Phase 10: 2 hours

**Total: ~17.5 hours** (spread over 2-3 days)

---

This plan provides a complete roadmap for componentizing the Trace UI following the same atomic design methodology successfully used in the Voice Interface project. Let me know when you're ready to begin implementation!
