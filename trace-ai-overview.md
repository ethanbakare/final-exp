# Trace.ai — Project Overview

## What Is Trace?

**A voice & image-powered expense tracker** built on the philosophy of "conscious spending through point-of-purchase logging." Instead of tedious manual entry, users either **speak** an expense or **photograph** a receipt, and AI handles the rest.

### Core User Flow
1. **Speak** — tap, say "I bought a coffee for £5", and it's logged
2. **Upload** — snap a receipt photo, AI extracts merchant, items, prices, discounts
3. **View** — expenses auto-grouped by date and merchant with running totals

### Tech Stack
- **AI**: Google Gemini 3.0 Flash — handles both audio transcription/parsing and receipt OCR
- **Frontend**: React + TypeScript, Framer Motion animations, CSS Modules
- **Real-time**: Canvas-based live waveform visualization during recording
- **Persistence**: localStorage (client-side)
- **API**: Next.js API routes (`/api/trace/parse-voice`, `/api/trace/parse-receipt`)

### What Makes It Impressive
- **Dual-mode input** (voice + camera) — most expense apps only do one
- **Sophisticated navbar state machine** — buttons morph between idle, recording, processing states with smooth animations
- **Live audio waveform** during recording (canvas-based, 60fps)
- **Scroll-linked fade effects** on sticky date headers
- **Full atomic design system** — atoms (Date, TotalFrame, Quantity) → molecules (ContentRow) → organisms (MerchantBlock, DayBlock)
- **Comprehensive animation framework** with standardized durations, easings, and spring configs
- **Smart data grouping** — entries grouped by date, then by merchant, with calculated totals at each level

### Design System
- Custom **Open Runde** font family (4 weights)
- Dark UI palette (stone tones) with orange accent for actions
- Complete design tokens in TypeScript
- Accessibility-first (respects `prefers-reduced-motion`)

### File Structure
All under `src/projects/trace/` — components, services (Gemini integration), utils (data grouping/formatting), types, config, constants, styles, and detailed analysis/planning docs.

---

## Portfolio Page Considerations

This is quite different from the Ollama case study — Ollama is a brand/identity exploration while Trace is a **working interactive demo**. The portfolio page would need to showcase the app in action (recording flow, processing states, the organized expense list) rather than static design deliverables.

Key differences from existing Portfolio 2025 projects (Eldugo, ActiveLedger, MagmaDeck, ActDeck):
- Those are **static image-based case studies** — hero → approach → design progression → mockups
- Trace is a **live interactive product** — the portfolio piece needs to show the app functioning, the state transitions, the AI parsing, the component system
- The showcase pages (`/trace/showcase/tracecomponent` and `/trace/showcase/tracemorphing`) already exist and could serve as visual reference material for the portfolio page
