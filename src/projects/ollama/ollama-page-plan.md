# Ollama Case Study — V1 Page Plan

The V1 page is illustration-focused: 80% visuals, 20% copy. Showcase existing work with brief contextual framing. Target audience: AI recruiters, PMs in AI companies.

---

## Asset Inventory

### Static Illustrations (PNGs) — 14 files

All originals are 2100px+. Resized versions (1200px) in `/resized/`.

| File | Description |
|---|---|
| audit v.png | Visual audit collage — brand across touchpoints |
| moodboard.png | Reference board — Japanese illustration, Duolingo, Noritake |
| Group 430.png | Character bible — ~11 poses/expressions grid |
| gpu rich dark.png | Llama lounging on stacked GPUs, dark bg |
| gpu rich light.png | Same, light bg |
| it's time to build.png | Headband llama coding on laptop |
| magic words.png | Wizard llama + terminal: `ollama run phi3` |
| ollama enlightenment.png | Meditating llama, model names orbiting |
| ollama rocks.png | Rock star llama with guitar |
| terminal.png | Running llama entering terminal window |
| opensource celebration.png | Party horn llama with confetti |
| We love open source.png | Group llama — "Ollama & Friends" |
| dolphin.png | Dolphin model announcement card |
| google gemma.png | Gemma model announcement card |
| IMG_2608.PNG | "We Love Open Source" dark bg text treatment |

### Animated GIFs — 7 files

| File | Dimensions | Description |
|---|---|---|
| Area.gif | 760x720 | Sunglasses llama close-up, animated |
| Laptop.gif | 1080x1080 | Llama typing on laptop, "TAP" text, cloud swirls |
| aa.gif | 832x720 | "It's time to build" small animated version |
| aaa.gif | 1252x1080 | "It's time to build" larger version (preferred for web) |
| intro.gif | 764x1080 | Project intro slide — dark bg, sunglasses llama, intro/goal/scope text |
| sketch 1.gif | 720x720 | Character bible V.1 — 5 early pencil poses |
| sketch 2.gif | 720x720 | Character bible V.0 — 9 pencil poses |

### Video (MP4) — 4 files

| File | Dimensions | Duration | Size | Description |
|---|---|---|---|---|
| dark mode.mp4 | 3420x2564 | 8s | 1.0MB | Character bible carousel, dark theme, pose-switching with model names |
| light mode.mp4 | 3420x2564 | 8s | 1.2MB | Same, light theme |
| Laptop.mp4 | 1080x1080 | 2s | 228KB | Llama typing animation |
| Laptop 2.mp4 | 2160x2160 | 2s | 446KB | Same at 2x resolution |

### Source Files

| File | Type |
|---|---|
| love opensource.ai | Adobe Illustrator source — "We Love Open Source" vectors |

---

## Page Sections

### 1. Hero

**Image:** `terminal.png` — running llama entering terminal window
**Why this image:** Active pose, communicates the product (terminal), double meaning of "runs." Speaks directly to the target audience of developers/PMs who know what a terminal is.

**Copy direction:**
- Project title: Ollama Brand Case Study
- Subtitle: brief framing line (who Ollama is, what this project explores)
- Stats as contextual proof, not a data section: 166k GitHub stars, 190k Discord, 5M monthly visits
- These stats frame why this brand matters, not a deep dive into the data

**Variation considered but rejected:** Lounging/carrot llama from GPU RICH pose — too passive, doesn't communicate product.

---

### 2. Visual Audit

**Image:** `audit v.png`
**Copy direction:** Short intro — what was audited, where the brand currently shows up (website, GitHub, CLI, Discord, X, model library, docs). Let the collage image do the talking. 2-3 sentences max.

---

### 3. Mood Board

**Image:** `moodboard.png`
**Copy direction:** What informed the illustration direction — Japanese illustration influences, Noritake's style DNA, Duolingo's mascot strategy as a reference for character-driven brand personality. Keep it brief, the board speaks visually.

---

### 4. Character Bible

**Primary assets:**
- `Group 430.png` — the full expression/pose grid
- `dark mode.mp4` — the carousel video (8s, auto-play muted) showing pose-switching with model names
- `sketch 1.gif` + `sketch 2.gif` — process sketches (V.0 and V.1)
- `Area.gif` — sunglasses close-up as accent

**Layout:** Grid approach — 2-up on mobile, 3x3 on desktop. The grid is the minimum viable version. Optionally: dark carousel with emoji selectors (as designed in the carousel concept).

**Copy direction:** How the character was developed — from pencil sketches (V.0) through refinement (V.1) to the final expression sheet. The llama isn't a static logo; it's a full character with emotional range. Each pose maps to a brand moment. Brief — 3-4 sentences, then let the grid and video carry it.

**Video placement:** `dark mode.mp4` should sit after or alongside the grid. Auto-play muted. This is the strongest motion asset — it bridges character illustration with product functionality (model names appearing as the llama switches poses).

---

### 5. Product Posters

**Images (scrolling gallery or stacked):**
- `gpu rich dark.png` — GPU Rich flex moment
- `it's time to build.png` — builder energy
- `magic words.png` — `ollama run phi3` (best product-experience piece)
- `ollama enlightenment.png` — model awareness / zen
- `ollama rocks.png` — personality / energy

**Supporting animation:** `aaa.gif` or `Laptop.gif` for process/motion

**Copy direction:** Each poster captures a different facet of the Ollama experience. "Magic words" is the standout — it's the only piece where the character is literally inside the terminal doing what the user does. Brief contextual line per poster, or a single intro paragraph and let them scroll.

**Note on repurposing:** `opensource celebration.png` (confetti llama) — originally captioned "When an open source model drops" but the illustration itself works for "Finish downloading a new model." The confetti is the emotion, not the event. Can be recaptioned if used in a "culture of use" context.

---

### 6. Model Announcements

**Images:**
- `dolphin.png`
- `google gemma.png`

**Copy direction:** Scalable template system for new model support announcements. These are functional deliverables — they could ship at volume. Show the system, not just the individual cards. Brief — this section demonstrates production-ready thinking.

---

### 7. Community & Values

**Images:**
- `We love open source.png` — the group piece
- `opensource celebration.png` — confetti celebration
- `IMG_2608.PNG` — dark variant of group piece (optional)

**Copy direction:** Open source isn't just a license, it's the culture Ollama was built in. These pieces celebrate that community — the "Ollama & Friends" branding turns integrations into relationships. Brief, values-driven copy.

---

### 8. Closing

**Copy-driven section.** No new illustration needed — optionally repurpose one image as a bookend.

**Copy direction:** What V2 would explore — the "culture of using Ollama" (download rituals, inference experience, failure states, power user moments). Tease the depth without executing it. Frame this as "what's next" rather than "what's missing." End with author info / contact.

---

## Implementation Notes

- **Ratio:** 80% images, 20% copy. Let the work breathe.
- **Dark/light:** Dark background recommended (matches Ollama's brand, makes illustrations pop). `gpu rich light.png` available as light mode fallback.
- **Video:** `dark mode.mp4` auto-play muted is the hero motion piece. Place in Character Bible section.
- **Process story:** sketch 1.gif → sketch 2.gif → Group 430.png shows the V.0 → V.1 → final evolution.
- **Target audience:** AI recruiters and PMs. They need to see: technical understanding (you know the product and space), UX thinking (you understand user journeys), illustration/brand design skill (the visual work itself).
- **SimilarWeb data:** Do NOT include raw data sections or screenshots in V1. Use select stats (5M visits, 166k stars, 190k Discord) as contextual proof in the hero only. Full data analysis is V2 territory.
- **intro.gif:** Could serve as a loading state or opening card. Already has project framing text baked in.
