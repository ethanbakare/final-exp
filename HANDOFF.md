# Ollama Case Study — Session Handoff

## Branch
`sculptor/pygmy-raptor-of-refinement`

## Summary
This session focused on refining the Expression Showcase component, applying image protection across the case study, implementing a dark mode Expression Selector variant, and updating copy.

---

## What Was Done

### Expression Showcase — Stage & Lighting Fixes
- **Fixed stage height behaviour**: Replaced fixed `height: 487px` with `aspect-ratio: 2216/1254` + `min-height: 487px`. Desktop now scales proportionally (~559px tall at 1280px viewport), mobile stays at 487px.
- **Spotlight width cap**: Added `max-width: 300px` to prevent the spotlight cone from stretching too wide on desktop. On mobile (235px), the cap doesn't kick in.
- **Spotlight SVG aspect ratio**: Added `preserveAspectRatio="none"` on desktop so the width cap doesn't shrink the height. On mobile, uses `xMidYMid meet` (natural proportions) via a `matchMedia` hook in `ExpressionShowcase.tsx`.
- **Spotlight nudge**: `top: -10px` so the beam originates beyond the stage edge.
- **Soft-light opacity**: Reduced from 0.1 to 0.04.
- **Cycle timer**: Moved from `.showcase-stage` to `.showcase-stage-clip` to prevent mobile clipping. Scaled proportionally (radius 10, stroke 3) using the Figma-to-render ratio (~0.388).

### Expression Selector Colours
- Selector background: `--ollama-bg-warm` (`#F7F6F5`)
- Active EXPR block: `--ollama-bg-expr-block` (`#E5E2DF`)

### Expression Selector — Dark Mode Variant
- Added `dark` prop to `ExpressionSelector` component
- Dark mode styles in `ollama.module.css`:
  - Selector background: `rgba(247, 246, 245, 0.05)`
  - Active block: `rgba(255, 255, 255, 0.20)`
  - Inactive blocks: `filter: saturate(0.18)` (desaturated)
  - Hover on inactive: `filter: saturate(0.4)` with 0.2s transition
- Dark mode variant added to `/ollama-components` preview page with dark background (`#201F1E`)

### Image Protection
Applied `user-select: none`, `-webkit-user-drag: none`, and `-webkit-touch-callout: none` to all case study images:
- `.ollama-mascot` (hero)
- `.ollama-audit-container img` (visual audit)
- `.ollama-moodboard-collage img` (all 7 moodboard images)
- `.ollama-expression-img` (Character Bible expressions)
- `.showcase-character` (showcase stage mascot)
- `.expr-selector-img` (EXPR selector emoji images)

### Expression Showcase on Main Page
- Copied Expression Showcase into main Ollama page (`OllamaLayout.tsx`) after Character Bible section
- Uses `.ollama-showcase-section` with padding `0 20px 20px` (desktop) / `0 10px 10px` (mobile)
- Removed extra wrapper padding that was doubling up

### Copy Updates
- **Hero**: "Ollama lets you run open-source LLMs locally. This project? It's a personal exploration of how its mascot and visual identity system narrates the product — and the community values built around it."
- **Character Bible**: "The character bible is the source of truth — setting the standard for how expressive, emotive, and charged future illustrations should feel. Each expression lands without explanation, instantly understood and emotionally resonant in the way only the best memes are."

---

## Key Files Modified
- `src/projects/ollama/components/ExpressionShowcase.tsx` — stage, spotlight, cycle timer, isMobile hook
- `src/projects/ollama/components/ExpressionSelector.tsx` — dark prop, desaturated class logic
- `src/projects/ollama/components/OllamaLayout.tsx` — showcase section, copy updates
- `src/projects/ollama/styles/ollama.module.css` — all CSS changes (dark mode, image protection, stage/spotlight sizing)
- `src/pages/ollama-components.tsx` — dark mode preview section

---

## Pending / Next Steps
- **"The Plan" section**: New section to be built before the Visual Audit section (Figma frame `4157:2195` — "🖼 The Plan"). Layers need renaming first, then implementation.
- **Sections 05–08**: Product Posters, Model Announcements, Community & Values, and Closing are still TODO placeholders in `OllamaLayout.tsx`.
