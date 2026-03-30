# New Home Page — Implementation Plan

## Overview
Replace the current home page with a new design from the "2025" Figma file. The page has two main sections stacked vertically:
1. **Hero** — headline, subtitle, credential line, two CTA buttons
2. **AI Demos Carousel** — bento grid of 5 project demo cards (interactive previews)
3. **Brand Work Carousel** — 3×2 grid of 6 brand design cards (static images)

Route: `/new-home` during development → swap to `/` when ready.

---

## Project Structure

```
src/
├── pages/
│   ├── new-home/
│   │   ├── index.tsx              ← Main page (assembles sections)
│   │   └── showcase/
│   │       ├── index.tsx          ← Hub linking to component pages
│   │       └── components.tsx     ← All components in isolation
│   │
├── projects/
│   └── new-home/
│       ├── components/
│       │   ├── HeroBanner.tsx             ← Hero section (text + CTAs)
│       │   ├── CarouselDemos.tsx          ← AI demos bento grid
│       │   ├── CarouselBrand.tsx          ← Brand work 3×2 grid
│       │   ├── DemoCard.tsx               ← Reusable card wrapper (border, shadow, padding)
│       │   └── previews/
│       │       ├── PreviewAIConfidence.tsx ← Cropped AI confidence tracker UI
│       │       ├── PreviewTrace.tsx        ← Cropped Trace AI interface
│       │       ├── PreviewOllama.tsx       ← Ollama llama image
│       │       ├── PreviewClipstream.tsx   ← Rebuilt Clipstream mini-UI
│       │       └── PreviewVoiceUI.tsx      ← Blob voice interface orb
│       ├── styles/
│       │   └── new-home.module.css        ← CSS module (variables, typography, shared)
│       └── data/
│           └── cards.ts                   ← Card data (labels, routes, grid positions)
```

---

## Phase 1: Foundation (styles + empty shells)

### Step 1.1 — CSS Module
Create `new-home.module.css` with:
- **Color variables** from Figma: `--card-bg: #201F1D`, `--card-border: #2E2C29`, `--card-inner-bg: #33312E`, `--card-inner-border: #403D3A`, `--page-bg` (gradient `#0A0A09` → `#0F0F0E`), white opacities, accent orange `#FB7232`
- **Typography classes** from Figma: Inter (14/16px), Frank Ruhl Libre (30px), Open Runde (14px uppercase labels), Hedvig Letters Sans (16px buttons)
- **Card shadow** from Figma: the multi-layer inset + drop shadow

### Step 1.2 — Fonts
Load fonts via `next/font/google` in the page:
- Inter (already loaded globally)
- Frank Ruhl Libre (already loaded)
- Open Runde — **check if available via Google Fonts, may need local import**
- Hedvig Letters Sans — available on Google Fonts

### Step 1.3 — Page shell
Create `/new-home/index.tsx` that renders:
```
<div> (dark gradient background)
  <HeroBanner />
  <CarouselDemos />
  <CarouselBrand />
</div>
```

---

## Phase 2: Brand Work Carousel (simplest — just images)

### Step 2.1 — DemoCard component
Reusable card wrapper matching Figma:
- Outer: `border-radius: 20px`, `border: 1px solid #2E2C29`, `background: #201F1D`, multi-layer box-shadow, `padding: 12px`
- Inner: `border-radius: 10px`, `border: 1px solid #403D3A`, `background: #33312E`, overflow hidden
- Label pill: absolute positioned at bottom, `border-radius: 12px 12px 0 0`, frosted glass bg, Open Runde 14px uppercase text

### Step 2.2 — CarouselBrand component
- Section header: "BRAND DESIGN WORK" (Inter 16px, 500 weight, 1.92px letter-spacing, uppercase, 25% white opacity) + subtitle
- 3×2 CSS grid (`grid-template-columns: repeat(3, 1fr)`, `gap: 15px`)
- 6 DemoCard instances with static images
- Each card links to an external URL (Behance, Dribbble, etc.) or stays non-interactive for now

### Step 2.3 — Mobile
- Grid collapses: `repeat(3, 1fr)` → `repeat(2, 1fr)` at tablet → `1fr` at mobile
- Cards keep aspect ratio, stretch to full width
- Gap reduces on smaller screens

---

## Phase 3: Hero Banner

### Step 3.1 — HeroBanner component
From Figma:
- Headline: Frank Ruhl Libre 30px, 93.75% line-height, -0.6px letter-spacing, 90% white
- Subtitle: Inter 16px, 60% white
- Credential line: Inter 14px, 20% white ("M.Sc in AI (2020) · 4 prototypes and counting")
- Two buttons: ghost outline ("View all Projects") + solid orange #FB7232 ("View Demos"), Hedvig Letters Sans 16px, border-radius 18px
- Container: max-width 1160px, centered, generous vertical padding

### Step 3.2 — Mobile
- Buttons stack vertically on narrow screens
- Text sizes remain but max-widths adapt
- Padding reduces

---

## Phase 4: AI Demos Carousel (complex — interactive previews)

### Step 4.1 — CarouselDemos component
- Section header: "AI DEMOS" (same pattern as brand)
- Bento grid layout from Figma:
  ```
  grid-template-columns: repeat(4, 1fr)
  grid-template-rows: 321px 321px
  gap: 10px

  card-4 (AI Confidence): col 1-2, row 1      (wide)
  card-1 (Ollama):        col 3, row 1         (standard)
  card-3 (Trace AI):      col 4, row 1-2       (tall, full height)
  card-2 (Voice UI):      col 1, row 2         (standard)
  card-5 (Clipstream):    col 2-3, row 2       (wide)
  ```

### Step 4.2 — Preview components (tackled individually)
Each preview is a separate component rendered inside its DemoCard:

1. **PreviewOllama** — Easiest. Ollama llama image (already in `public/images/ollama/`). Dark background, centered llama with sunglasses. Static.

2. **PreviewTrace** — Use existing Trace UI. Import/render a static snapshot of the Trace interface, positioned to be cropped by the card overflow. The card has a brown/leather background (`#965935`), interface positioned offset to the left.

3. **PreviewAIConfidence** — Use existing AI Confidence Tracker components. Render a static version of the transcript box with highlighted words, positioned to be cropped at the right edge. Pink/rose background image behind.

4. **PreviewVoiceUI** — Use existing blob orb visualization. Render the blob/orb component in its idle state inside the card. Light/white background.

5. **PreviewClipstream** — Needs to be built. Reference the Clipstream showcase components to build a mini version of the Clipstream UI (recording bar, dark background). This matches what's visible in the Figma card.

### Step 4.3 — Card interactivity
- Each card's `demo-link` area is clickable → navigates to the project's page (e.g., `/ai-confidence-tracker`, `/trace`, `/clipperstream`, `/voiceinterface`, `/blob-orb/gallery`)
- Hover effect: subtle scale or brightness change

### Step 4.4 — Mobile
- Grid collapses to single column
- Each card becomes full width, maintains its aspect ratio
- Tall card (Trace AI) and wide cards adjust proportionally
- Vertical scroll through all 5 cards

---

## Phase 5: Showcase Page

### Step 5.1 — `/new-home/showcase/index.tsx`
Hub page with links to component testing pages.

### Step 5.2 — `/new-home/showcase/components.tsx`
Display all components in isolation:
- DemoCard (empty, with label)
- Each preview component standalone
- CarouselBrand section
- CarouselDemos section
- HeroBanner section
- Button variants
- Typography samples

---

## Build Order (priority)

1. **Foundation**: CSS module, fonts, page shell, DemoCard component
2. **CarouselBrand**: Simplest — just images in cards. Proves the card component works.
3. **HeroBanner**: Text + buttons, straightforward
4. **CarouselDemos grid**: The bento layout without preview content (placeholder boxes)
5. **PreviewOllama**: Easiest preview — just an image
6. **PreviewTrace**: Import existing Trace UI components
7. **PreviewAIConfidence**: Import existing AI Confidence components
8. **PreviewVoiceUI**: Import existing blob orb
9. **PreviewClipstream**: Build mini Clipstream UI from scratch
10. **Showcase page**: Wire up component testing
11. **Mobile responsive**: Breakpoints for all sections
12. **Polish**: Hover states, transitions, final spacing

---

## Key Decisions
- Each preview is its own component → can be tackled independently
- DemoCard is reusable across both carousels
- Brand carousel cards use simple `<img>` tags
- AI demos cards use live React components cropped via `overflow: hidden`
- Mobile: single column, aspect ratios preserved, full-width cards
- Route: `/new-home` for now, swap to `/` when complete
