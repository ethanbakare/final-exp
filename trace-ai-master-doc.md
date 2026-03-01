# Trace.ai — Complete Architectural Reference

> **Purpose:** This document captures the full architecture, component system, visual design, AI integration, and interaction patterns of Trace.ai — a voice & image-powered expense tracker. It is intended to give another AI or developer a complete understanding of how the project works so they can plan a portfolio case study page for it.

---

## 1. What Is Trace?

Trace is a **multimodal AI expense tracker** built on the philosophy of **"conscious spending through point-of-purchase logging."** Instead of tedious manual data entry, users either:

1. **Speak** an expense ("I bought a coffee for £5 at Starbucks")
2. **Photograph** a receipt (AI extracts merchant, items, prices, discounts)

The AI (Google Gemini 3.0 Flash) handles transcription, OCR, and structured data extraction. Expenses appear in a scrollable, date-grouped, merchant-grouped list with running totals — no forms, no typing.

### Key Differentiators
- **Dual-mode input** — most expense apps only support camera/OCR. Trace does both voice AND camera.
- **Zero-friction logging** — 2 taps from launch to logged expense
- **Polished interaction design** — morphing navbar, live waveform, scroll-linked fades
- **Full atomic design system** — every component built from atoms up

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (Pages Router) |
| Language | TypeScript |
| UI | React 18 + styled-jsx (CSS-in-JS) |
| Styling | CSS Modules (`trace.module.css`) for design tokens + styled-jsx for component styles |
| Animation | Framer Motion v12 + Canvas API (waveform) |
| AI Model | Google Gemini 3.0 Flash (Preview) via `@google/genai` SDK |
| Font | Open Runde (4 weights: 400, 500, 600, 700) |
| Persistence | localStorage (client-side) |
| Deployment | Vercel-ready (Next.js API routes) |

---

## 3. File Structure

```
src/projects/trace/
├── components/
│   ├── TraceApp.tsx                    # Main app container (alternative entry)
│   └── ui/
│       ├── tracefinance.tsx            # Atomic finance display components (1250 lines)
│       ├── tracefinance-animated.tsx   # Framer Motion wrappers for finance components
│       ├── tracenavbar.tsx            # State-driven morphing navbar
│       ├── tracebuttons.tsx           # Atomic button components
│       ├── TraceLiveWaveform.tsx       # Canvas-based real-time audio visualization
│       ├── TraceModal.tsx             # Clear confirmation modal
│       └── TraceModalOverlay.tsx      # Backdrop overlay with scale animation
├── services/
│   └── geminiService.ts               # Google Gemini AI integration
├── utils/
│   ├── dataUtils.ts                   # Grouping + date formatting
│   └── fileUtils.ts                   # Blob/file → base64 conversion
├── types/
│   └── trace.types.ts                 # All TypeScript interfaces
├── config/
│   └── animations.ts                  # Centralized animation configuration
├── constants/
│   └── designTokens.ts               # Color + typography constants (JS)
├── styles/
│   └── trace.module.css               # CSS custom properties + font faces
└── analysis/                          # Planning & architecture docs

src/pages/
├── trace/
│   ├── index.tsx                      # Main app page (/trace)
│   └── showcase/
│       ├── tracecomponent.tsx          # Component showcase (/trace/showcase/tracecomponent)
│       └── tracemorphing.tsx          # Animation showcase (/trace/showcase/tracemorphing)

src/pages/api/trace/
├── parse-voice.ts                     # POST /api/trace/parse-voice
└── parse-receipt.ts                   # POST /api/trace/parse-receipt

public/fonts/OpenRunde/               # 8 font files (woff + woff2, 4 weights)
```

---

## 4. Data Model

### ExpenseEntry (core data type)
```typescript
interface ExpenseEntry {
  id: string;           // UUID (crypto.randomUUID())
  date: string;         // "2026-01-27" (YYYY-MM-DD)
  merchant: string | null;  // "TESCOS", "AMAZON", or null
  currency: string;     // "GBP" (ISO 4217)
  total: number;        // 628.21
  items: Item[];
  source: 'voice' | 'camera';
  createdAt?: string;   // ISO timestamp
}

interface Item {
  quantity: number;     // 2
  name: string;        // "Headphones" (always capitalized)
  unit_price: number;  // 52.495
  total_price: number; // 104.99
  discount: number;    // 3.99 (0 if none)
}
```

### Data Grouping (for display)
Entries are grouped into a nested structure:
```
DayBlock (e.g., "27th Jan" — £928.20)
  └── MerchantBlock (e.g., "TESCOS" — £628.21)
       └── ContentRow (e.g., "2x Headphones £104.99 -£3.99")
       └── ContentRow (e.g., "1x Playstation 5 £500.99")
  └── MerchantBlock (e.g., "AMAZON" — £300.00)
       └── ...
```

The `groupEntriesByDay()` utility in `dataUtils.ts` handles this transformation. It:
- Groups entries by date (ISO string)
- Within each date, groups by merchant name
- Calculates running totals at each level
- Formats dates as "27th Jan" with ordinal suffixes
- Sorts by date descending (most recent first)

---

## 5. Component Architecture (Atomic Design)

### 5.1 Atoms (Basic building blocks)

All atoms are in `tracefinance.tsx`. Each is a self-contained component with styled-jsx.

| Component | Visual Description | Size |
|-----------|-------------------|------|
| `Date` | White text showing formatted date (e.g., "14th Jul") | 12px medium |
| `TotalFrame` | Right-aligned "£928.20" — small £ symbol (9px) + amount (12px), baseline-aligned | 12.95px height |
| `MerchantFrame` | Left-aligned uppercase merchant name in stone-500 (e.g., "TESCOS"), ellipsis overflow | 12px medium |
| `MerchantTotalFrame` | Right-aligned "£628.21" in stone-500, adaptive width based on digit count | Dynamic width (35-70px) |
| `NetPriceFrame` | Right-aligned "£104.99" — £ (10px) + amount (16px), stone-100 color | 20px height |
| `Quantity` | Faded white badge "2x" at 30% opacity | 12px, 12px wide |
| `ItemName` | Item text in stone-200 (e.g., "Headphones"), ellipsis overflow | 14px regular, 24px height |
| `DiscountFrame` | Right-aligned "-£3.99" in orange-400 @ 50% opacity | 12px height |
| `TotalAmtSpent` | Red 3px pill indicator + "Total Amount Spent" label in stone-400 | 10px medium |
| `MasterTotalPrice` | Large right-aligned "£1,556.41" — £ (18px) + amount (28px) | Display-sized |
| `EmptyTraceIcon` | 48x48 dark rounded-rect with white receipt SVG icon | 48px |
| `EmptyTraceText` | "No expenses logged yet" (16px) + "Use the buttons below..." (13px, 40% opacity) | Centered stack |

### 5.2 Molecules (Combinations of atoms)

| Component | Composition | Visual Description |
|-----------|------------|-------------------|
| `DayTotal` | `Date` + `TotalFrame` | Sticky header row: "14th Jul" on left, "£928.20" on right. Has `position: sticky` so it pins to top of scroll container. Background matches TextBox so it covers content underneath. Supports scroll-linked opacity fade via CSS variable `--day-total-opacity`. |
| `RowIdentifier` | `MerchantFrame` + `MerchantTotalFrame` | Merchant header: "TESCOS" left-aligned, "£628.21" right-aligned, both in stone-500. Hidden when there's a single unnamed merchant. 6px vertical padding. |
| `QuantityItemName` | `Quantity` + `ItemName` | Inline pair: "2x  Headphones" with 10px gap. Flex-grows to fill available space. |
| `PriceFrame` | `NetPriceFrame` + optional `DiscountFrame` | Stacked right-aligned: "£104.99" on top, "-£3.99" below (pulled up 4px with negative margin). Fixed width (85px default, adaptive down to 50px). |
| `ContentRow` | `QuantityItemName` + `PriceFrame` | Full item line: "2x Headphones" on left, "£104.99 / -£3.99" on right. 16px gap between. Optional bottom border (0.5px, currently transparent). Variable padding depending on position and discount presence. |
| `MasterBlockHolder` | `TotalAmtSpent` + `MasterTotalPrice` | Grand total summary block at top of TextBox. Subtle gradient background (stone tones), 1px bottom border at 10% opacity. Shows "Total Amount Spent" label left, "£1,556.41" right. |
| `EmptyFinanceState` | `EmptyTraceIcon` + `EmptyTraceText` | Centered vertical stack shown when no expenses exist. Receipt icon above, text below, 10px gap. |

### 5.3 Organisms (Complex sections)

| Component | Composition | Visual Description |
|-----------|------------|-------------------|
| `MerchantBlock` | `RowIdentifier` + N × `ContentRow` | Dark semi-transparent card (stone-900 @ 50%, 8px radius) containing a merchant header and all line items. When there's only one unnamed merchant, the RowIdentifier is hidden and 6px top padding is added instead. |
| `DayExpenses` | N × `MerchantBlock` | Vertical stack of MerchantBlocks with 6px gap between them. |
| `DayBlock` | `DayTotal` + `DayExpenses` | Complete day section: sticky date header + all merchant blocks. Calculates optimal PriceFrame width based on the longest price in the day (50-85px). ForwardRef for scroll tracking. |
| `FinanceBox` | N × `DayBlock` OR `EmptyFinanceState` | Scrollable container for all day blocks. Custom pill scrollbar (2px, white @ 20%). Has scroll spacer at bottom so last DayBlock can scroll to top. Shows empty state when no data. |
| `TextBox` | `MasterBlockHolder` + `FinanceBox` | The main dark container (360×500px). Stone-950 background, 1px stone-700 border, 16px radius. Has a bottom gradient pseudo-element that fades content as it scrolls up. This is the central visual element of the app. |

### 5.4 Animated Variants (in `tracefinance-animated.tsx`)

Framer Motion wrappers around the base components:

| Component | Wraps | Animation |
|-----------|-------|-----------|
| `AnimatedMerchantBlock` | `MerchantBlock` | Fade in from y:-8, 300ms, staggered by 50ms per index |
| `AnimatedDayBlock` | `DayBlock` | Same entry animation + scroll-linked fade effect on DayTotal. Uses IntersectionObserver-style geometry: as user scrolls, DayTotal text opacity fades from 1→0 over 8px distance when DayBlock bottom approaches DayTotal bottom. |
| `AnimatedFinanceBox` | `FinanceBox` | AnimatePresence wrapper. Tracks entry count changes and triggers auto-scroll callback. |
| `AnimatedTextBox` | `TextBox` | Uses `AnimatedFinanceBox` internally instead of `FinanceBox`. |

---

## 6. Navigation Bar (TRNavbar)

The navbar is the most complex interactive element. It's a **state machine** with 4 states and smooth morphing transitions between them.

### States & Visual Layout

**IDLE** (default):
```
[  📄 Upload  ] 12px gap [  🎤 Speak  ]
   117×44px                  118×44px
   stone-50 bg               stone-50 bg
   dark text                  dark text
```

**RECORDING** (after tapping Speak):
```
[  ✕  ] 12px gap [  ≋ Send Audio  ]
 56×44px             150×44px
 stone-50 bg         orange-500 bg
 dark icon           white text + live waveform
```

**PROCESSING_AUDIO** (after tapping Send Audio):
```
[          ⟳ Analysing Audio          ]
              247×44px (full width)
              stone-400 bg
              white text + spinning icon
              Close button shrinks to 0 and fades out
```

**PROCESSING_IMAGE** (after tapping Upload):
```
[          ⟳ Processing Image          ]
              247×44px (full width)
              stone-400 bg
              white text + spinning icon
              Speak button shrinks to 0 and fades out
```

### Morphing Animation Details

The navbar uses **two independent button trackers** (left and right) that morph simultaneously:

**Left Button Tracker** (Upload → Close → Processing Image):
- Width transitions: 117px → 56px → 247px → 0px
- Content crossfades between Upload icon+text, Close X icon, and Processing spinner+text
- Uses CSS transitions: `width 0.3s cubic-bezier(0.4, 0, 0.2, 1)`

**Right Button Tracker** (Speak → SendAudio → Analysing Audio):
- Width transitions: 118px → 150px → 0px → 247px
- Background transitions: stone-50 → orange-500 → stone-400
- Content crossfades between Speak icon+text, waveform+Send Audio text, and spinner+Analysing Audio text

The gap between buttons (12px) collapses to 0 during processing states.

All morphing content layers are absolutely positioned within the button and use `opacity` transitions for crossfade effects. Each content layer (upload-content, close-content, processing-image-content) has its own fixed color so text color doesn't flash during transition.

---

## 7. Live Waveform (TraceLiveWaveform)

A canvas-based real-time audio visualization component (726 lines). Used inside the SendAudio button during recording.

### How It Works
1. Captures microphone input via `navigator.mediaDevices.getUserMedia()`
2. Creates an `AnalyserNode` with FFT analysis
3. Reads frequency data at configurable `updateRate` (default 40ms)
4. Draws bars on a canvas using `requestAnimationFrame` at 60fps

### Two Modes
- **Static mode** (used in Trace): Bars are symmetric around center, mirrored left/right. Has an **ambient wave** effect — a traveling sine wave modulates bar heights for organic feel even during silence.
- **Scrolling mode**: New bars appear on right, scroll left over time. Ghost bars (low-opacity) fill unfilled positions.

### Key Visual Parameters (as configured in TRNavbar)
```typescript
barWidth: 2.8      // Each bar is 2.8px wide
barGap: 4          // 4px gap between bars
barRadius: 2       // 2px rounded corners
barColor: '#ffffff' // White bars
barHeight: 5       // Minimum bar height 5px
mode: 'static'     // Symmetric mirrored mode
ambientWave: true   // Gentle traveling wave
waveSpeed: 6       // Wave cycles per second
waveAmplitude: 0.55 // Wave intensity
waveHeight: 1.4    // Peak multiplier
height: 24         // 24px tall canvas
width: 24px        // 24px wide container
```

### Lifecycle
- **Idle**: Bars sit at baseline (0.05 height), gentle ambient wave
- **Active**: Bars respond to microphone frequency data in real-time
- **Processing**: Smooth multi-wave processing animation (3 sine waves combined)
- **Fade to idle**: When recording stops, bars smoothly fade from last active values back to baseline

---

## 8. AI Integration (Gemini Service)

### Architecture
```
User Action → Page Handler → API Route → Gemini Service → Gemini API → Structured JSON → ExpenseEntry
```

### Voice Flow
1. User taps "Speak" → MediaRecorder starts capturing audio/webm
2. User taps "Send Audio" → recorder stops, chunks assembled into Blob
3. Blob → base64 via `blobToBase64()`
4. POST `/api/trace/parse-voice` with `{ base64Audio, mimeType: 'audio/webm' }`
5. API route calls `parseVoiceAudio()` in geminiService.ts
6. Gemini receives the audio + prompt and returns structured JSON
7. Response augmented with UUID, source='voice', timestamp
8. Entry prepended to state array → UI updates → localStorage saves

### Camera Flow
1. User taps "Upload" → native file picker opens (accept='image/*')
2. File selected → `fileToBase64()`
3. POST `/api/trace/parse-receipt` with `{ base64Image, mimeType }`
4. API route calls `parseReceiptImage()` in geminiService.ts
5. Same flow as voice from here

### Gemini Configuration
```typescript
model: 'gemini-3-flash-preview'
responseMimeType: 'application/json'
responseSchema: EXPENSE_SCHEMA  // Enforces structured output
thinkingBudget: 0  // No chain-of-thought, fastest response
```

### AI Prompt (Voice)
```
Parse this spoken expense log into structured JSON.
Rules:
- DATE: Defaults to {today}.
- CURRENCY: Defaults to GBP unless specified.
- ITEMS: Extract specific items and their prices.
- FORMATTING: Item names MUST start with a capital letter.
- MERCHANT: If all items from same merchant, extract to merchant field.
  If multiple merchants, incorporate naturally into item names
  (e.g., "Starbucks coffee", "Nando's chicken").
  If merchant doesn't fit naturally, use brackets (e.g., "Charger (Argos)").
- If user says "it was five pounds for a coffee and three for a cake",
  total is 8.00.
```

### AI Prompt (Receipt)
```
Extract structured data from this receipt.
Rules:
- FALLBACK DATE: Use today's date if not found.
- MERCHANT: Try to identify the business name accurately.
- CURRENCY: Detect from symbols (£, $, €, etc). Defaults to GBP.
- FORMATTING: Item names MUST start with a capital letter.
- ACCURACY: Ensure quantity * unit_price - discount = total_price.
```

### JSON Schema (enforced by Gemini)
```typescript
{
  date: string,        // YYYY-MM-DD
  merchant: string?,   // nullable
  currency: string,    // ISO 4217
  total: number,
  items: [{
    quantity: number,
    name: string,
    unit_price: number,
    total_price: number,
    discount: number
  }]
}
```

---

## 9. Button Components

All in `tracebuttons.tsx`. Each button is self-contained with styled-jsx.

| Button | Size | Background | Icon | Text | Use |
|--------|------|-----------|------|------|-----|
| `UploadButton` | 117×44 | stone-50 | Receipt scan SVG (20px) | "Upload" | Triggers file picker |
| `SpeakButton` | 118×44 | stone-50 | Microphone SVG (26px, filled+stroked) | "Speak" | Starts recording |
| `CloseButton` | 56×44 | stone-50 | X SVG (24px) | — | Cancels recording |
| `ClearButton` | 56×44 | stone-950 (dark) | Trash SVG (24px, white) | — | Opens clear modal |
| `SendAudioButton` | 150×44 | orange-500 | Live waveform (24px) | "Send Audio" | Stops recording + processes |
| `ProcessingAudioButton` | 247×44 | stone-400 | Spinning arc SVG (24px) | "Analysing Audio" | Non-interactive processing state |
| `ProcessingImageButton` | 247×44 | stone-400 | Spinning arc SVG (24px) | "Processing Image" | Non-interactive processing state |

All buttons use:
- `border-radius: 23px` (pill shape)
- `border: 2px solid transparent`
- `font-family: Open Runde, 16px, weight 500`
- `user-select: none`

---

## 10. Modal System

### TraceClearExpensesModal
- **Size**: 247×141px
- **Background**: stone-900 @ 70% (`#292524B3`)
- **Border**: 1px stone-700, 16px radius
- **Header**: "Clear Expenses" (18px medium) + "This permanently removes all your expenses" (14px regular)
- **Buttons**: Two pill buttons side-by-side — "Cancel" (outline: transparent bg, stone-50 border @ 35%) and "Delete" (filled: stone-50 bg, dark text)
- **Separator**: 1px top border at 5% white opacity above buttons

### TraceModalOverlay
- **Positioning**: Fixed fullscreen (`position: fixed; inset: 0`)
- **Background**: stone-950 @ 85% (`rgba(28, 25, 23, 0.85)`)
- **Blur**: `backdrop-filter: blur(3px)` with webkit prefix
- **Firefox fallback**: Darker background (95%) when blur unsupported
- **Entry animation**: Scale from 0.85 → 1.0, opacity 0 → 1, 150ms ease-out
- **Dismissal**: Click backdrop or press Escape
- **Scroll lock**: `document.body.style.overflow = 'hidden'` while open
- **Accessibility**: `prefers-reduced-motion` disables animation

---

## 11. Animation Framework

### Configuration (`config/animations.ts`)
```typescript
ANIMATION_CONFIG = {
  duration: {
    fast: 0.15,    // 150ms - small UI changes
    normal: 0.3,   // 300ms - standard transitions
    slow: 0.4,     // 400ms - large layout shifts
  },
  easing: {
    emphasized: [0.2, 0, 0, 1],    // Material Design entering
    standard: [0.4, 0, 0.2, 1],    // Material Design exiting
    spring: { stiffness: 300, damping: 25 },
  },
  stagger: { items: 0.05 },  // 50ms between items
  variants: {
    emptyState: { initial: { opacity: 1 }, exit: { opacity: 0 } },
    firstEntry: { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 } },
    merchantBlock: { initial: { opacity: 0, maxHeight: 0, y: -12 }, ... },
    dayBlock: { initial: { opacity: 0, maxHeight: 0, y: -16 }, ... },
    expenseItem: { initial: { opacity: 0, y: -8 }, ... },
  },
}

SCROLL_CONFIG = {
  behavior: 'smooth',
  delay: 50,           // ms before auto-scroll starts
  fadeDistance: 8,      // px — distance over which DayTotal fades
}
```

### Animation Scenarios

1. **Empty → First Entry**: AnimatePresence mode="wait". Empty state fades out, first TextBox fades in with 4px upward slide (300ms).

2. **New Merchant on Same Day**: New MerchantBlock animates in with opacity 0→1, y:-12→0, maxHeight 0→500. Existing content shifts down. 350ms.

3. **New Day Block**: Inserts at top. opacity 0→1, y:-16→0, maxHeight 0→1000. Staggered per index. 400ms.

4. **Auto-Scroll**: When new entry is added below viewport, smooth scroll to bottom after 50ms delay.

### Scroll-Linked Fade
The DayTotal sticky header fades out as the user scrolls past its DayBlock:
- Measured via `getBoundingClientRect()` comparing DayBlock bottom vs DayTotal bottom
- Over 8px distance, `--day-total-opacity` CSS variable goes from 1 → 0
- Only affects text children (not background), so sticky background continues covering content
- Uses `requestAnimationFrame` with ticking guard for performance
- Respects `prefers-reduced-motion`

---

## 12. Design System (Visual Reference)

### Color Palette
```
Backgrounds:
  #1c1917  — App background, TextBox background (stone-950)
  #292524  @ 50% — MerchantBlock background (stone-900)
  #0a0a0a  — Showcase page background

Buttons:
  #f5f5f4  — Upload/Speak buttons (stone-50, light)
  #f97316  — Send Audio button (orange-500, CTA)
  #a8a29e  — Processing state buttons (stone-400, disabled feel)

Text:
  #ffffff  — Primary text (dates, totals, headings)
  #e7e5e4  — Secondary text (item names) (stone-200)
  #f5f5f4  — Item prices (stone-100)
  #78716c  — Tertiary text (merchant names, labels) (stone-500)
  #a8a29e  — Muted text (master total label) (stone-400)
  #ffffff4d — Quantity badges (white @ 30%)

Accents:
  #ef4444  — Error states, total indicator pill (red-500)
  #fb923c  @ 50% — Discount text (orange-400)

Borders:
  #44403c  — TextBox border, button text color on light bg (stone-700)
```

### Typography Scale
```
Font: Open Runde (with -apple-system, BlinkMacSystemFont fallbacks)

 8px regular  — Discount currency symbol
 9px medium   — Currency symbols (£) in TotalFrame, MerchantTotalFrame, DiscountFrame
10px medium   — "Total Amount Spent" label, currency in NetPriceFrame
12px medium   — Dates, totals, merchant names, discounts (body text)
14px regular  — Item names
16px medium   — Button text, processing text
18px medium   — Master total currency (£)
28px medium   — Master total amount value
32px medium   — App heading ("Trace")
```

### Key Dimensions
```
TextBox:        360 × 500px, 16px radius, 1px border
Navbar:         247 × 44px (total), 23px pill radius
Buttons:        44px height, 2px stroke, 23px radius
FinanceBox:     0px top, 12px sides, 12px bottom padding
MerchantBlock:  8px radius, 0 12px 8px 12px padding
Scrollbar:      2px wide, pill-shaped, white @ 20%
```

---

## 13. Page Structure

### Main App Page (`/trace`)
```
┌─────────────────────────────────────────┐
│                trace-page               │
│     (min-height: 100vh, centered)       │
│                                         │
│         ┌─────────────────┐             │
│         │   AnimatedTextBox │            │
│         │  ┌─────────────┐ │            │
│         │  │MasterBlock  │ │            │
│         │  │Total: £X.XX │ │            │
│         │  ├─────────────┤ │            │
│         │  │FinanceBox   │ │            │
│         │  │ (scrollable)│ │            │
│         │  │  DayBlock   │ │            │
│         │  │  DayBlock   │ │            │
│         │  │  ...        │ │            │
│         │  └─────────────┘ │            │
│         └─────────────────┘             │
│              10px gap                   │
│         ┌─────────────────┐             │
│         │    TRNavbar     │             │
│         │ [Upload] [Speak]│             │
│         └─────────────────┘             │
│                                         │
│                       [🗑] ClearButton  │
│                    (bottom-right, abs)   │
│                                         │
│  ┌─ Modal Overlay (when clearing) ──┐   │
│  │   TraceClearExpensesModal         │   │
│  │   [Cancel] [Delete]              │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Component Showcase (`/trace/showcase/tracecomponent`)
An interactive gallery showing every component in isolation, organized in a seamless grid layout. Each component sits inside a `ButtonGrid` with labeled dimensions. Sections:
1. **Trace UI Components** — all 7 button variants + modal
2. **TRNavbar States** — interactive state toggle (IDLE / REC / P-AUD / P-IMG)
3. **Finance Display Components** — atoms → molecules → organisms → TextBox (empty + populated)

### Animation Showcase (`/trace/showcase/tracemorphing`)
Interactive testing environment for 4 animation scenarios:
- Scenario 0: Empty State → First Entry
- Scenario 1: New MerchantBlock on existing day
- Scenario 2: New DayBlock for different date
- Scenario 3: Auto-scroll to new entry
Each has "trigger" and "reset" buttons. Uses AnimatePresence, Framer Motion variants, and smooth scroll.

---

## 14. User Journey (Complete Flow)

### Flow 1: Voice Expense
1. User sees TextBox (empty state or existing entries) + navbar in IDLE state
2. Taps **"Speak"** → navbar morphs: Upload→Close, Speak→SendAudio (orange, waveform appears)
3. Speaks expense aloud ("I bought headphones for a hundred and five pounds at Tesco")
4. Taps **"Send Audio"** → recording stops, navbar morphs: SendAudio expands to full width, Close shrinks to 0. Label shows "Analysing Audio" with spinner.
5. Gemini processes audio → returns structured ExpenseEntry
6. Entry prepends to list → AnimatedDayBlock fades in → auto-scroll if needed
7. Navbar returns to IDLE

### Flow 2: Receipt Photo
1. User taps **"Upload"** → native file picker opens
2. Selects receipt photo
3. Navbar morphs: Upload expands to full width showing "Processing Image" with spinner, Speak shrinks to 0
4. Gemini OCRs receipt → returns structured ExpenseEntry
5. Same display flow as voice

### Flow 3: Clear All
1. User taps trash icon (bottom-right)
2. Modal overlay appears (scale 0.85→1.0, backdrop blur)
3. "Clear Expenses" modal: "This permanently removes all your expenses"
4. Cancel = dismiss. Delete = clear localStorage + state, modal closes.

---

## 15. Persistence

- **Storage key**: `'trace-expense-entries'`
- **Format**: `JSON.stringify(ExpenseEntry[])`
- **Load**: On mount, reads from localStorage and parses
- **Save**: On every `entries` state change (via useEffect)
- **Clear**: Removes key from localStorage + resets state to `[]`
- **Survives**: Page refresh, tab close/reopen

---

## 16. API Routes

### POST `/api/trace/parse-voice`
- **Body limit**: 10MB
- **Input**: `{ base64Audio: string, mimeType: string }`
- **Validation**: mimeType must start with `audio/`
- **Output**: `ExpenseEntry` (200) or `{ error: string }` (400/500)

### POST `/api/trace/parse-receipt`
- **Body limit**: 10MB
- **Input**: `{ base64Image: string, mimeType: string }`
- **Validation**: mimeType must start with `image/`
- **Output**: `ExpenseEntry` (200) or `{ error: string }` (400/500)

Both routes include detailed `[TRACE API]` console logging at each step.

---

## 17. Accessibility

- **Reduced motion**: All components check `prefers-reduced-motion` and disable animations
- **ARIA labels**: Navbar buttons have dynamic aria-labels based on state
- **Modal**: Uses `role="dialog"` and `aria-modal="true"`
- **Waveform**: Uses `role="img"` with descriptive aria-label ("Live audio waveform" / "Processing audio" / "Audio waveform idle")
- **Keyboard**: ESC closes modal
- **Scroll lock**: Body overflow hidden when modal is open

---

## 18. What Makes This Project Portfolio-Worthy

1. **Full-stack AI integration** — Frontend + API routes + Google Gemini, handling both audio and image modalities
2. **Production-grade component system** — Complete atomic design hierarchy with 20+ components
3. **Sophisticated interaction design** — Morphing navbar state machine with 4 states, crossfading content, and smooth width transitions
4. **Real-time canvas visualization** — Custom waveform engine with ambient wave, scrolling mode, ghost bars, and fade-to-idle transitions
5. **Animation framework** — Standardized Framer Motion config, scroll-linked effects, staggered reveals
6. **Design system depth** — 60+ CSS custom properties, complete typography scale, consistent color palette
7. **Multiple showcase pages** — Component gallery and animation testing environment built alongside the app
8. **Thoughtful UX details** — Sticky date headers, adaptive price column widths, empty states, error banners, scroll spacers, bottom content gradients, pill scrollbars

---

## 19. Existing Showcase / Demo Pages

These pages are already built and can be used as reference for the portfolio case study:

| Route | Purpose |
|-------|---------|
| `/trace` | Live working app |
| `/trace/showcase/tracecomponent` | Complete component gallery (atoms → organisms) |
| `/trace/showcase/tracemorphing` | Interactive animation scenario tester |
