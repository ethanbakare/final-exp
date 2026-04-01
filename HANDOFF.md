# Final-EXP — Session Handoff Document
**Date**: 2 April 2026
**Branch merged**: `sculptor/pygmy-raptor-of-refinement` → `main`
**PR**: https://github.com/ethanbakare/final-exp/pull/2
**Production deployment**: Vercel auto-deploys from main

---

## What Was Built

### New Home Page (`/`)
Replaced the old home page with a new design based on the "2025" Figma file. The old page is preserved at `/old-home`.

**Structure:**
1. **Hero Banner** — headline ("Software can now think..."), subtitle, credential line, two CTA buttons (ghost outline + solid orange)
2. **AI Demos Carousel** — bento grid of 5 interactive demo cards
3. **Brand Work Carousel** — 3×2 grid of 6 portfolio cards with images

**Key files:**
- Page: `src/pages/new-home/index.tsx` (also mounted at `src/pages/index.tsx`)
- Components: `src/projects/new-home/components/`
- CSS module: `src/projects/new-home/styles/new-home.module.css`
- Showcase: `src/pages/new-home/showcase/components.tsx`

### AI Demo Preview Cards (inside CarouselDemos)
Each card is a `DemoCard` component with a project-specific preview inside:

| Card | Preview Component | What It Shows |
|------|------------------|---------------|
| AI Confidence Tracker | `PreviewAIConfidence.tsx` | Watercolor bg (wt1.webp) + actual `HighlightedText` component with confidence underlines |
| Ollama | `PreviewOllama.tsx` | Auto-cycling llama expressions (sunglasses, smirk, party) every 4s with crossfade |
| Trace AI | `PreviewTrace.tsx` | Live Trace UI components (MasterBlockHolder, FinanceBox, TRNavbarV2) with dummy data |
| Voice UI Library | Static image | Blob orb (voice-ui-blob.webp) on light background |
| Clipstream | `PreviewClipstream.tsx` | SVG waveform recording bar on CSS dot grid background |

### Brand Carousel Cards
6 cards with images exported from Figma and converted to WebP. Each links to its portfolio page:

| Card | Link |
|------|------|
| Eldugo - Branding | `/portfolio2025/eldugo` |
| Logofolio | `/portfolio2025/logo` |
| ActiveLedger - Branding | `/portfolio2025/activeledger` |
| Magma - Pitch Deck | `/portfolio2025/magmadeck` |
| ACT - Pitch Deck | `/portfolio2025/actdeck` |
| Made for Humans - Illustration | `/madeforhumans` |

### Made for Humans Portfolio Page (`/madeforhumans`)
New project page for the illustration series. Light background matching original madeforhumans.ai.

**Content:** 11 illustrations (A–K) with titles, 3-column grid, click-to-modal for full view.
**Images:** 58 WebP images in `public/images/madeforhumans/` (mains + panels for future carousel)
**Data:** `src/projects/madeforhumans/data/illustrations.ts` maps each illustration to its title and image paths.
**Layout:** `src/projects/madeforhumans/components/MadeForHumansLayout.tsx`

### Ollama Page Restructure
Moved from naked files to proper folder structure:
- `src/pages/ollama.tsx` → `src/pages/ollama/index.tsx`
- `src/pages/ollama-components.tsx` → `src/pages/ollama/showcase/index.tsx`

### Figma Layer Renaming
Renamed layers in the "2025" Figma file for both carousels:
- AI demos carousel: `carousel-demos` with `card-1` through `card-5`, `demo-link-{project}`, `label`, `preview-image`
- Brand carousel: `carousel-brand` with `card-1` through `card-6`, `demo-link-{project}`
- Clipstream recording card internals: `clip-recording-card`, `record-bar`, `btn-close`, `waveform-bars`, `timer`, `btn-stop`, etc.

---

## Responsive Behaviour
- **Desktop (>1200px)**: 4-column bento grid, fixed 282px columns
- **Tablet (621–1200px)**: 2-column grid, fixed 282px columns, cards rearrange
- **Mobile (≤620px)**: single column, full width, fixed heights (321px standard, 652px tall)
- Brand carousel: 3-col → 2-col (≤1200px) → 1-col (≤800px), fixed 381px columns

---

## Build Fixes for Vercel Deployment
- `.npmrc` with `legacy-peer-deps=true` — resolves react-three peer dependency conflicts
- `@ts-nocheck` on 3 showcase/unused files with pre-existing type mismatches:
  - `src/pages/clipperstream/showcase/ClipOfflineScreen.tsx`
  - `src/pages/trace/showcase/tracemorphing.tsx`
  - `src/projects/home/components/Goal_Body.tsx`
- `DeepgramApi.ts` — `Buffer` → `Uint8Array` for fetch body compatibility
- `deepgram-token.ts` — replaced removed `getKey` SDK method with fallback
- `transcribe.ts` — type assertion for `File.type` property
- Voice interface images converted: `wt1.jpg` (1.8MB) → `wt1.webp` (448KB), `wt6.png` → `wt6.webp`, `wt7.jpeg` → `wt7.webp`

---

## What's Next (Planned but not started)

### Consolidated Demo Page
A single page (like `/demos`) showing all AI demos in a swipeable/navigable interface. The Figma "Dictation app" file has a design for this — a full-screen view with:
- Top nav: project name dropdown + counter (e.g., "3/9") + up/down arrows
- Description text per demo
- Self-playing simulation area
- "Try Demo" + "View Case Study" CTAs
- Each demo would use simulation mode (like the AI Confidence Tracker simulation at `/ai-confidence-tracker/simulation`)

### Simulations for Other Projects
Currently only AI Confidence Tracker has a simulation page. Need similar for:
- Trace AI — auto-play recording + processing + results with dummy data
- Clipstream — auto-play recording flow
- Voice UI — show blob/radial/linear variations
- Ollama — case study walkthrough

### Showcase Page Improvements
The `new-home/showcase/components` page needs:
- Further typography display refinements (discussed but not fully implemented)
- Potential preview component showcase section

### Navigation Bar
The old home page had a `MainNavBar` component. The new home page doesn't have one yet. Need to either adapt the old one or build a new one from the Figma design.

### Old Image Cleanup
The original JPG/PNG voice-interface images (`wt1.jpg`, `wt6.png`, `wt7.jpeg`) are still in the repo but no longer referenced. Can be removed.

### Old Home Page
`/old-home` preserves the original page. Can be removed once we're confident the new page is stable.

---

## Key Architecture Patterns

### Project Structure
Every project follows the same pattern:
```
src/projects/{name}/        — components, styles, hooks, data
src/pages/{name}/           — page routes
  index.tsx                 — main page (Layer 3)
  showcase/                 — component showcase (Layer 2)
```

### DemoCard Component
Reusable card wrapper (`src/projects/new-home/components/DemoCard.tsx`):
- Props: `label`, `href`, `labelBg`, `labelTextColor`, `labelPosition`, `innerBg`, `children`
- Label positions: `bottom-center`, `top-left`, `top-right`, `bottom-left`, `bottom-right`
- External links (`http*`) automatically get `target="_blank"`

### CSS Variables
All colours in `new-home.module.css` under `.pageContainer`:
- Card colours: `--card-bg`, `--card-border`, `--card-inner-bg`, `--card-inner-border`
- Preview backgrounds: `--preview-ollama-bg`, `--preview-trace-bg`, `--preview-voice-bg`, `--preview-clipstream-bg`
- White opacities: `--white-90` through `--white-03`
- Accent: `--accent-orange`

### Fonts
- **Frank Ruhl Libre** — hero headline (Google Fonts)
- **Inter** — body/UI text (Google Fonts)
- **Open Runde** — card labels (local, `/fonts/OpenRunde/`)
- **Hedvig Letters Sans** — CTA buttons (Google Fonts)
- **JetBrains Mono** — Clipstream timer (local, `/fonts/JetBrainsMono/`)

---

## Important Notes
- The branch had 616 commits across 788 files — it includes ALL work from the past 2-3 months, not just the home page
- Clipstream has ~50 MD documentation files tracking every architectural decision — be very careful modifying Clipstream code
- The Safari GPU compositing fix (`will-change: transform` on Trace preview) prevents text flickering during Ollama crossfade animations
- Grid columns use fixed pixel values (282px) not `fr` units — prevents unwanted shrinking
