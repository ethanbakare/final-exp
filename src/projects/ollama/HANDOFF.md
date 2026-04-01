# Ollama Case Study — Session Handoff

## Branch
`sculptor/pygmy-raptor-of-refinement`

## Summary
Building the Ollama brand case study page section by section. Previous sessions covered Hero, Visual Audit, Mood Board, Character Bible, Expression Showcase, and extensive polish. Recent sessions focused on asset management, Expression Selector V2, and building Sections 05 (Product Posters). Section 06 (Model Announcements) is next.

---

## What Was Done (Cumulative)

### Earlier Sessions (see git log for full history)
- Hero section with OllamaTerminal component, stats, and description
- Approach section with numbered list
- Visual Audit image section
- Mood Board with 7-image collage
- Character Bible with 12 expression cards
- Expression Showcase with spotlight, cycle timer, stage animations
- Expression Selector with dark mode variant
- Image protection (drag/select prevention) across all images
- Copy updates throughout

### Recent Sessions

#### Expression Selector V2 (`807029a`, `ba0e7f2`)
- Added `desaturateInactive` prop to `ExpressionShowcase` — inactive emojis render desaturated
- Built V1/V2 toggle on `/ollama-components` preview page
- Made showcase section 100vh on desktop

#### V2 on Main Portfolio Page (`597d96f`)
- Applied `<ExpressionShowcase desaturateInactive />` on the main Ollama page in `OllamaLayout.tsx`

#### Asset Transfer & Organization (`54f4851`, `7d4167b`, `913abd5`)
- Transferred ALL images from `/Users/ethan/Documents/PELUMIK/ollama` source folder
- Converted 11 PNGs to WebP using `cwebp -q 80`
- Copied 4 MP4 videos and 7 GIFs
- Organized with prefix naming convention:
  - `cs-` — case study deliverable images (e.g., `cs-terminal.webp`, `cs-dolphin.webp`)
  - `gif-` — GIF animations (e.g., `gif-intro.gif`, `gif-laptop.gif`)
  - `expr-` — expression selector thumbnails
  - `moodboard-` — moodboard reference images
  - Bare names — full-size expression characters (e.g., `sunglasses.webp`)
- Removed unused `character-bible.webp`
- Updated all code references in `ollama.tsx` and `OllamaLayout.tsx`

#### New Case Study Images (`a9bc885`, `3029e4a`, `0371a0d`)
- `cs-let-him-cook.webp` (39K, 2800x2800 source)
- `cs-strawberry.webp` (42K, 2800x2800 source)
- `cs-models-at-your-fingertips.webp` (61K, 2100x2100 source)

#### Section 05 — Product Posters (`8a9cd3d`)
- Three posters stacked vertically: terminal, models-at-your-fingertips, magic-words
- 600x600px poster images, warm light background (`--ollama-bg-warm-light`)
- Light shadow on the magic-words poster (light-colored image)
- Title: "Product posters"
- Description: "The mascot isn't decorating the product — it's living in it."
- Mobile responsive (smaller padding/gaps, full-width images)

---

## Key Files

### Components
- `src/projects/ollama/components/OllamaLayout.tsx` — Main case study layout (Sections 01-05 built, 06-08 TODO)
- `src/projects/ollama/components/ExpressionShowcase.tsx` — Showcase with spotlight, timer, V2 desaturation
- `src/projects/ollama/components/ExpressionSelector.tsx` — Emoji selector with dark mode
- `src/projects/ollama/components/OllamaTerminal.tsx` — Terminal animation component

### Styles
- `src/projects/ollama/styles/ollama.module.css` — All Ollama CSS (desktop + mobile)

### Page
- `src/pages/ollama.tsx` — Page component with image data passed to layout
- `src/pages/ollama-components.tsx` — Component preview/testing page

### Assets (in `public/images/ollama/`)
- 14 `cs-*` WebP case study images
- 7 `gif-*` GIF animations
- 12 full-size expression WebPs (bare names)
- 12 `expr-*` selector thumbnails
- 7 `moodboard-*` reference images
- 4 MP4 videos: dark-mode, light-mode, laptop, laptop-2
- 1 mascot: ollama-mascot.webp

---

## CSS Variables (defined in ollama.module.css)
```
--ollama-bg-warm-light: #FBFAF9
--ollama-bg-warm: #F7F6F5
--ollama-bg-expr-block: #E5E2DF
--ollama-text-heading: rgba(32, 31, 30, 0.30)
--ollama-text-body: rgba(32, 31, 30, 0.40)
--ollama-radius-card: 12px
```

---

## Image Interface (in OllamaLayout.tsx)
```tsx
interface OllamaLayoutProps {
  images: {
    visualAudit: OllamaImage;
    terminalPoster: OllamaImage;
    modelsAtYourFingertips: OllamaImage;
    magicWords: OllamaImage;
    dolphin: OllamaImage;
    gemma: OllamaImage;
    weLoveOpenSource: OllamaImage;
    openSourceCelebration: OllamaImage;
    ollamaRocks: OllamaImage;
    ollamaEnlightenment: OllamaImage;
    gpuRich: OllamaImage;
  };
}
```

Note: `ollama.tsx` also defines `itsTimeToBuild` in its images object but it's NOT in the interface — may need adding when that image is used, or cleanup if not needed.

---

## Figma File
- File name: "2025"
- Figma Bridge channel: `7l44ic6p`
- **Official Figma MCP**: User is on Starter plan (6 calls/month) — use sparingly. File key `DRPx1aTkGBkHL40JcoFacN` returned access error; may need user to share the correct URL or check permissions.
- **Figma Bridge MCP**: Connected and working. Use `get_node_info`, `get_css_tree`, `export_node` for design inspection.

### Known Figma Node IDs
- Product Posters section: `4326:1702` (built)
- Model Announcements section: `4326:1624` (next to build)

---

## Pending / Next Steps

### Immediate: Section 06 — Model Announcements
- Figma node: `4326:1624` (1440x1080, vertical layout)
- Design shows: title "Model Announcements", two side-by-side cards (Gemma + Dolphin), description text
- Images already available: `cs-gemma.webp`, `cs-dolphin.webp`
- Follow same CSS pattern as Product Posters section (section → content → title/grid/description)
- Need to get CSS tree from Figma Bridge before building

### Then: Section 07 — Community & Values
- Images available: `cs-we-love-open-source.webp`, `cs-open-source-celebration.webp`, `cs-ollama-rocks.webp`, `cs-ollama-enlightenment.webp`, `cs-gpu-rich.webp`

### Then: Section 08 — Closing
- TBD from Figma

### Deferred
- Max-width cap for large screens (1920px+) — mentioned in earlier session but not yet implemented
- `itsTimeToBuild` image cleanup — defined in page data but not in interface

---

## Standing Instructions
- Always commit after every change
- NEVER include "Co-Authored-By" lines or @anthropic.com emails in commits
- Source images at `/Users/ethan/Documents/PELUMIK/ollama`
- Convert PNGs to WebP with `cwebp -q 80`
- Use `cs-` prefix for case study images
- Dev server runs on port 3000 via `.claude/launch.json`
- Mobile breakpoint: `@media (max-width: 768px)`

---

## Dev Server
- Config in `.claude/launch.json`
- Port: 3000
- Start with `preview_start` tool (name from launch.json config)
